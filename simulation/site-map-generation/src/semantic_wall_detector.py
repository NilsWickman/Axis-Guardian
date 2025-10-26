"""Semantic segmentation-based wall detection using Mask2Former."""

import numpy as np
import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass
from PIL import Image
import torch

from .wall_detector import WallSegment
from .occupancy_mapper import OccupancyGrid
from .coordinate_transform import CoordinateTransformer

logger = logging.getLogger(__name__)


class SemanticWallDetector:
    """Detect walls using semantic segmentation."""

    def __init__(self, model_name: str = "facebook/mask2former-swin-tiny-ade-semantic"):
        """
        Initialize semantic wall detector.

        Args:
            model_name: HuggingFace model ID for semantic segmentation
        """
        self.model_name = model_name
        self.processor = None
        self.model = None
        self.device = self._get_device()

        logger.info(f"SemanticWallDetector initialized with model: {model_name}")

    def _get_device(self) -> str:
        """Determine best available device."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def _load_model(self):
        """Load semantic segmentation model (lazy loading)."""
        if self.model is not None:
            return  # Already loaded

        try:
            from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation

            logger.info(f"Loading semantic segmentation model: {self.model_name}")
            logger.info("This may take a few minutes on first run...")

            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = Mask2FormerForUniversalSegmentation.from_pretrained(self.model_name)

            self.model.to(self.device)
            self.model.eval()

            logger.info("Semantic segmentation model loaded successfully!")

        except ImportError:
            logger.error("transformers library not found. Install with: pip install transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def segment_image(self, image: Image.Image) -> np.ndarray:
        """
        Segment image into semantic classes.

        Args:
            image: PIL Image

        Returns:
            Segmentation map (HxW) with class IDs
        """
        self._load_model()

        # Process image
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)

        # Post-process to get segmentation map
        segmentation = self.processor.post_process_semantic_segmentation(
            outputs, target_sizes=[image.size[::-1]]
        )[0]

        return segmentation.cpu().numpy()

    def extract_wall_mask(self, segmentation: np.ndarray) -> np.ndarray:
        """
        Extract wall pixels from segmentation map.

        ADE20K class IDs:
        - 0: wall
        - 3: floor
        - 5: ceiling
        - 25: door
        - 40: window

        Args:
            segmentation: Segmentation map with class IDs

        Returns:
            Binary mask where True = wall
        """
        # Wall class ID in ADE20K
        wall_class_id = 0

        wall_mask = (segmentation == wall_class_id)

        wall_pixels = wall_mask.sum()
        total_pixels = segmentation.size

        logger.info(f"Wall pixels: {wall_pixels:,} ({100*wall_pixels/total_pixels:.1f}% of image)")

        return wall_mask

    def detect_wall_boundaries(
        self,
        wall_mask: np.ndarray,
        min_length: int = 50
    ) -> List[Tuple[np.ndarray, np.ndarray]]:
        """
        Detect wall boundaries from wall mask.

        Args:
            wall_mask: Binary wall mask
            min_length: Minimum boundary length in pixels

        Returns:
            List of (contour, simplified_contour) tuples
        """
        from skimage import measure
        from skimage.morphology import binary_closing, disk

        # Clean up mask with morphological operations
        wall_mask_clean = binary_closing(wall_mask, disk(3))

        # Find contours
        contours = measure.find_contours(wall_mask_clean, 0.5)

        boundaries = []
        for contour in contours:
            if len(contour) < min_length:
                continue

            # Simplify contour (Douglas-Peucker algorithm)
            from skimage.measure import approximate_polygon
            simplified = approximate_polygon(contour, tolerance=5.0)

            boundaries.append((contour, simplified))

        logger.info(f"Found {len(boundaries)} wall boundaries")

        return boundaries

    def fit_line_segments_to_boundaries(
        self,
        boundaries: List[Tuple[np.ndarray, np.ndarray]],
        min_segment_length: int = 30
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        """
        Fit line segments to wall boundaries.

        Args:
            boundaries: List of (contour, simplified) tuples
            min_segment_length: Minimum segment length in pixels

        Returns:
            List of ((x1, y1), (x2, y2)) line segments
        """
        from sklearn.linear_model import RANSACRegressor

        line_segments = []

        for contour, simplified in boundaries:
            # Process each edge of the simplified polygon
            for i in range(len(simplified) - 1):
                p1 = simplified[i]
                p2 = simplified[i + 1]

                # Calculate segment length
                segment_length = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

                if segment_length < min_segment_length:
                    continue

                # Convert to (x, y) format (PIL/image coordinates)
                # Note: contour is (row, col) but we need (x, y)
                x1, y1 = p1[1], p1[0]
                x2, y2 = p2[1], p2[0]

                line_segments.append(((x1, y1), (x2, y2)))

        logger.info(f"Fitted {len(line_segments)} line segments")

        return line_segments

    def project_to_world_coordinates(
        self,
        line_segments_2d: List[Tuple[Tuple[float, float], Tuple[float, float]]],
        depth_map: np.ndarray,
        transformer: CoordinateTransformer,
        image_width: int,
        image_height: int
    ) -> List[WallSegment]:
        """
        Project 2D line segments to 3D world coordinates using depth map.

        Args:
            line_segments_2d: List of ((x1, y1), (x2, y2)) in image coordinates
            depth_map: Depth map (HxW) in meters
            transformer: Coordinate transformer
            image_width: Original image width
            image_height: Original image height

        Returns:
            List of WallSegment objects in world coordinates
        """
        wall_segments = []

        for (x1, y1), (x2, y2) in line_segments_2d:
            # Sample depth along the line segment
            num_samples = max(int(np.hypot(x2 - x1, y2 - y1) / 10), 5)

            depths = []
            for i in range(num_samples):
                t = i / num_samples
                px = int(x1 + t * (x2 - x1))
                py = int(y1 + t * (y2 - y1))

                # Clamp to image bounds
                px = np.clip(px, 0, image_width - 1)
                py = np.clip(py, 0, image_height - 1)

                # Get depth at this pixel
                depth = depth_map[py, px]
                if depth > 0 and np.isfinite(depth):
                    depths.append(depth)

            if not depths:
                continue

            # Use median depth for this wall segment
            median_depth = np.median(depths)

            # Project endpoints to 3D world space (not ground plane!)
            # Walls are vertical surfaces, so we keep their 3D position
            # and use the (x, y) coordinates for the map
            try:
                # Start point - get full 3D position
                x1_3d, y1_3d, z1_3d = transformer.pixel_to_world(
                    int(x1), int(y1), median_depth
                )

                # End point - get full 3D position
                x2_3d, y2_3d, z2_3d = transformer.pixel_to_world(
                    int(x2), int(y2), median_depth
                )

                # For the 2D map, use the (x, y) coordinates
                # The z-coordinate tells us the height of the wall
                x1_world, y1_world = x1_3d, y1_3d
                x2_world, y2_world = x2_3d, y2_3d

                # Calculate length in 2D (horizontal length of wall)
                length = np.sqrt((x2_world - x1_world)**2 + (y2_world - y1_world)**2)

                # Create wall segment
                wall = WallSegment(
                    start_x=x1_world,
                    start_y=y1_world,
                    end_x=x2_world,
                    end_y=y2_world,
                    confidence=0.7,  # Semantic segmentation has decent confidence
                    length=length,
                    wall_type="detected"
                )

                wall_segments.append(wall)

            except Exception as e:
                logger.debug(f"Failed to project wall segment: {e}")
                continue

        logger.info(f"Projected {len(wall_segments)} wall segments to world coordinates")

        return wall_segments

    def detect_walls_from_image(
        self,
        image: Image.Image,
        depth_map: np.ndarray,
        transformer: CoordinateTransformer
    ) -> List[WallSegment]:
        """
        Detect walls from RGB image using semantic segmentation.

        Args:
            image: RGB image
            depth_map: Calibrated depth map
            transformer: Coordinate transformer for camera

        Returns:
            List of detected wall segments
        """
        logger.info("Detecting walls using semantic segmentation...")

        # Step 1: Segment image
        segmentation = self.segment_image(image)

        # Step 2: Extract wall mask
        wall_mask = self.extract_wall_mask(segmentation)

        # Step 3: Detect boundaries
        boundaries = self.detect_wall_boundaries(wall_mask)

        if not boundaries:
            logger.warning("No wall boundaries found")
            return []

        # Step 4: Fit line segments
        line_segments_2d = self.fit_line_segments_to_boundaries(boundaries)

        if not line_segments_2d:
            logger.warning("No line segments fitted")
            return []

        # Step 5: Project to world coordinates
        wall_segments = self.project_to_world_coordinates(
            line_segments_2d,
            depth_map,
            transformer,
            image.width,
            image.height
        )

        logger.info(f"Detected {len(wall_segments)} walls using semantic segmentation")

        return wall_segments
