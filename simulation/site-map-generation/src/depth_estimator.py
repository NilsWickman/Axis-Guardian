"""Depth estimation using Depth Anything V2."""

import torch
import numpy as np
from PIL import Image
from typing import Optional, Union
from pathlib import Path
import logging

from transformers import AutoImageProcessor, AutoModelForDepthEstimation

from .config import settings

logger = logging.getLogger(__name__)


class DepthEstimator:
    """Depth estimation using Depth Anything V2 model."""

    def __init__(
        self,
        model_name: Optional[str] = None,
        cache_dir: Optional[Path] = None,
        device: Optional[str] = None
    ):
        """
        Initialize depth estimator.

        Args:
            model_name: HuggingFace model ID (default from settings)
            cache_dir: Directory to cache model (default from settings)
            device: Device for inference ('cuda', 'cpu', 'mps', or None for auto-detect)
        """
        self.model_name = model_name or settings.depth_model_name
        self.cache_dir = cache_dir or settings.depth_model_cache_dir
        self.device = self._get_device(device)

        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Lazy loading (load on first inference call)
        self.processor: Optional[AutoImageProcessor] = None
        self.model: Optional[AutoModelForDepthEstimation] = None

        logger.info(f"DepthEstimator initialized with model: {self.model_name}")
        logger.info(f"Cache directory: {self.cache_dir}")
        logger.info(f"Device: {self.device}")

    def _get_device(self, device: Optional[str]) -> str:
        """
        Determine the best available device.

        Args:
            device: Requested device or None for auto-detect

        Returns:
            Device string ('cuda', 'mps', or 'cpu')
        """
        if device:
            return device

        # Auto-detect
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def _load_model(self):
        """Load model and processor (lazy loading)."""
        if self.model is not None:
            return  # Already loaded

        logger.info(f"Loading Depth Anything V2 model: {self.model_name}")
        logger.info("This may take a few minutes on first run (downloading ~2.5GB)...")

        try:
            # Load processor
            self.processor = AutoImageProcessor.from_pretrained(
                self.model_name,
                cache_dir=str(self.cache_dir)
            )

            # Load model
            self.model = AutoModelForDepthEstimation.from_pretrained(
                self.model_name,
                cache_dir=str(self.cache_dir)
            )

            # Move to device
            self.model.to(self.device)
            self.model.eval()

            logger.info("Model loaded successfully!")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def estimate_depth(
        self,
        image: Union[Image.Image, np.ndarray, str, Path],
        camera_height_m: Optional[float] = None,
        camera_elevation_deg: Optional[float] = None
    ) -> np.ndarray:
        """
        Estimate depth from an image with optional metric calibration.

        Args:
            image: Input image (PIL Image, numpy array, or file path)
            camera_height_m: Camera height above ground in meters (for calibration)
            camera_elevation_deg: Camera elevation angle in degrees (negative = down)

        Returns:
            Depth map as numpy array (HxW), values in meters
            If camera_height_m provided: metric-calibrated depth
            Otherwise: relative depth scaled to max_view_distance
        """
        # Load model if not already loaded
        self._load_model()

        # Convert input to PIL Image
        if isinstance(image, (str, Path)):
            image = Image.open(image).convert("RGB")
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(image).convert("RGB")
        elif not isinstance(image, Image.Image):
            raise ValueError(f"Unsupported image type: {type(image)}")

        # Process image
        inputs = self.processor(images=image, return_tensors="pt")

        # Move to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            predicted_depth = outputs.predicted_depth

        # Interpolate to original size
        prediction = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=image.size[::-1],  # (height, width)
            mode="bicubic",
            align_corners=False,
        )

        # Convert to numpy
        depth_map = prediction.squeeze().cpu().numpy()

        # Calibrate depth map
        if camera_height_m is not None and camera_elevation_deg is not None:
            # Use ground plane calibration
            depth_map = self._calibrate_depth_with_ground_plane(
                depth_map, camera_height_m, camera_elevation_deg
            )
            logger.info(f"Depth calibrated using camera height: {camera_height_m:.2f}m, "
                       f"elevation: {camera_elevation_deg:.1f}°")
        else:
            # Fallback: normalize to max depth (old behavior)
            depth_map = self._normalize_depth(depth_map, max_depth=settings.max_view_distance_m)
            logger.warning("No camera height provided - using relative depth scaling")

        return depth_map

    def _calibrate_depth_with_ground_plane(
        self,
        depth_map: np.ndarray,
        camera_height_m: float,
        camera_elevation_deg: float
    ) -> np.ndarray:
        """
        Calibrate depth map using known camera height and ground plane detection.

        This solves the scale ambiguity problem in monocular depth estimation by
        using the known camera height as a reference.

        Args:
            depth_map: Raw relative depth map from model
            camera_height_m: Known camera height above ground (meters)
            camera_elevation_deg: Camera elevation angle (degrees, negative = tilted down)

        Returns:
            Calibrated depth map in metric units (meters)
        """
        height, width = depth_map.shape

        # Normalize depth to [0, 1] first
        depth_min = depth_map.min()
        depth_max = depth_map.max()

        if depth_max - depth_min < 1e-6:
            logger.warning("Depth map has no variation, returning zeros")
            return np.zeros_like(depth_map)

        depth_normalized = (depth_map - depth_min) / (depth_max - depth_min)

        # Step 1: Detect ground plane in normalized depth
        ground_depth_normalized = self._detect_ground_plane(
            depth_normalized, camera_elevation_deg
        )

        if ground_depth_normalized is None:
            logger.warning("Could not detect ground plane, using fallback calibration")
            return self._normalize_depth(depth_map, max_depth=settings.max_view_distance_m)

        # Step 2: Calculate expected ground distance from camera geometry
        elevation_rad = np.deg2rad(abs(camera_elevation_deg))

        if elevation_rad < np.deg2rad(5):  # Nearly horizontal camera
            # Assume camera can see ~30° downward effective view
            logger.info("Camera is nearly horizontal, using assumed 30° effective downward view")
            effective_angle = np.deg2rad(30)
            expected_ground_distance_m = camera_height_m / np.tan(effective_angle)
        else:
            # Use actual elevation angle
            # For camera tilted down: distance = height / tan(elevation)
            expected_ground_distance_m = camera_height_m / np.tan(elevation_rad)

        # Clamp to reasonable range (avoid division by very small numbers)
        expected_ground_distance_m = np.clip(
            expected_ground_distance_m,
            camera_height_m * 0.5,  # Minimum: half the height
            settings.max_view_distance_m  # Maximum: max view distance
        )

        # Step 3: Calculate scale factor
        # scale = real_distance / normalized_distance
        scale_factor = expected_ground_distance_m / ground_depth_normalized

        logger.info(f"Ground plane calibration:")
        logger.info(f"  Camera height: {camera_height_m:.2f}m")
        logger.info(f"  Elevation angle: {camera_elevation_deg:.1f}°")
        logger.info(f"  Expected ground distance: {expected_ground_distance_m:.2f}m")
        logger.info(f"  Detected normalized depth: {ground_depth_normalized:.4f}")
        logger.info(f"  Scale factor: {scale_factor:.2f}")

        # Step 4: Apply scale to entire depth map
        calibrated_depth = depth_normalized * scale_factor

        # Sanity check: clip to reasonable range
        calibrated_depth = np.clip(calibrated_depth, 0, settings.max_view_distance_m * 1.5)

        return calibrated_depth

    def _detect_ground_plane(
        self,
        depth_normalized: np.ndarray,
        camera_elevation_deg: float
    ) -> Optional[float]:
        """
        Detect ground plane depth value in normalized depth map.

        Strategy: Ground plane is typically in the lower portion of the frame
        and has a characteristic depth value.

        Args:
            depth_normalized: Normalized depth map [0, 1]
            camera_elevation_deg: Camera elevation angle

        Returns:
            Normalized depth value of ground plane, or None if detection fails
        """
        height, width = depth_normalized.shape

        # Determine region of interest based on camera angle
        if camera_elevation_deg < -20:  # Camera tilted significantly down
            # Ground is in bottom 40% of frame
            roi_start = int(height * 0.6)
        elif camera_elevation_deg < -5:  # Slightly tilted down
            # Ground is in bottom 30% of frame
            roi_start = int(height * 0.7)
        else:  # Nearly horizontal or tilted up
            # Ground is in bottom 20% of frame (or may not be visible)
            roi_start = int(height * 0.8)

        ground_region = depth_normalized[roi_start:, :]

        if ground_region.size == 0:
            logger.warning("Ground region is empty")
            return None

        # Method 1: Use mode (most common depth value) - robust to outliers
        # Create histogram
        hist, bin_edges = np.histogram(ground_region.flatten(), bins=100, range=(0, 1))

        # Find peak (mode)
        peak_idx = hist.argmax()
        ground_depth = (bin_edges[peak_idx] + bin_edges[peak_idx + 1]) / 2

        # Method 2: Use median in lower percentile (fallback)
        # Ground is usually farther away (higher depth values in lower part of image)
        median_depth = np.median(ground_region)

        # Choose method based on confidence
        # If histogram peak is strong, use mode; otherwise use median
        peak_strength = hist[peak_idx] / hist.sum()

        if peak_strength > 0.1:  # Strong peak
            logger.info(f"Using mode for ground plane (peak strength: {peak_strength:.2%})")
            return float(ground_depth)
        else:
            logger.info(f"Using median for ground plane (weak peak: {peak_strength:.2%})")
            return float(median_depth)

    def _normalize_depth(self, depth_map: np.ndarray, max_depth: float) -> np.ndarray:
        """
        Normalize depth map to metric scale (fallback method without calibration).

        Args:
            depth_map: Raw depth map from model
            max_depth: Maximum depth in meters

        Returns:
            Normalized depth map in meters
        """
        # Normalize to [0, 1]
        depth_min = depth_map.min()
        depth_max = depth_map.max()

        if depth_max - depth_min < 1e-6:
            return np.zeros_like(depth_map)

        depth_normalized = (depth_map - depth_min) / (depth_max - depth_min)

        # Scale to [0, max_depth]
        depth_metric = depth_normalized * max_depth

        return depth_metric

    def batch_estimate_depth(
        self,
        images: list[Union[Image.Image, np.ndarray, str, Path]]
    ) -> list[np.ndarray]:
        """
        Estimate depth for multiple images.

        Args:
            images: List of input images

        Returns:
            List of depth maps
        """
        return [self.estimate_depth(img) for img in images]

    def estimate_depth_from_url(self, url: str) -> np.ndarray:
        """
        Estimate depth from image URL.

        Args:
            url: Image URL (HTTP or RTSP snapshot)

        Returns:
            Depth map as numpy array
        """
        import requests
        from io import BytesIO

        try:
            response = requests.get(url, timeout=settings.vapix_timeout_s)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
            return self.estimate_depth(image)
        except Exception as e:
            logger.error(f"Failed to fetch image from {url}: {e}")
            raise

    def get_model_info(self) -> dict:
        """
        Get information about the loaded model.

        Returns:
            Dictionary with model information
        """
        return {
            "model_name": self.model_name,
            "cache_dir": str(self.cache_dir),
            "device": self.device,
            "loaded": self.model is not None
        }


# Global instance (lazy-loaded on first use)
_depth_estimator: Optional[DepthEstimator] = None


def get_depth_estimator() -> DepthEstimator:
    """
    Get the global depth estimator instance (singleton).

    Returns:
        DepthEstimator instance
    """
    global _depth_estimator
    if _depth_estimator is None:
        _depth_estimator = DepthEstimator()
    return _depth_estimator
