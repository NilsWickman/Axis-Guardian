"""YOLOv8 object detector."""

import time
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from loguru import logger

from config import settings
from tracker import ObjectTracker

# Temporarily disable weights_only for YOLOv8 model loading
# This is safe as we're loading models from trusted Ultralytics source
# TODO: Update ultralytics package when they add PyTorch 2.6+ support
import ultralytics.nn.tasks
_original_torch_load = torch.load

def _patched_torch_load(*args, **kwargs):
    """Patched torch.load that allows YOLOv8 models."""
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_torch_load


class ObjectDetector:
    """YOLOv8-based object detector."""

    # COCO class IDs for filtering (only detect these classes)
    # Set to None to detect all 80 COCO classes
    ALLOWED_CLASSES = {
        0: "person",
        2: "car",
    }

    def __init__(self, model_path: str = None, enable_tracking: bool = None):
        """
        Initialize detector.

        Args:
            model_path: Path to YOLOv8 model weights
            enable_tracking: Enable object tracking (defaults to settings.enable_tracking)
        """
        self.model_path = model_path or settings.model_path
        logger.info(f"Loading YOLOv8 model from {self.model_path}")
        self.model = YOLO(self.model_path)
        logger.info("YOLOv8 model loaded successfully")

        if self.ALLOWED_CLASSES:
            logger.info(f"Filtering detections to classes: {list(self.ALLOWED_CLASSES.values())}")
        else:
            logger.info("Detecting all 80 COCO classes")

        self.frame_number = 0
        self.last_detections = []  # Cache for frame skipping
        self.detection_cache = {}  # frame_number -> detections

        # Initialize object tracker
        self.enable_tracking = enable_tracking if enable_tracking is not None else settings.enable_tracking
        self.tracker: Optional[ObjectTracker] = None
        if self.enable_tracking:
            self.tracker = ObjectTracker(
                track_activation_threshold=settings.track_activation_threshold,
                lost_track_buffer=settings.lost_track_buffer,
                minimum_matching_threshold=settings.minimum_matching_threshold,
                frame_rate=settings.max_fps,
                confidence_boost_enabled=settings.confidence_boost_enabled,
                max_confidence_boost=settings.max_confidence_boost,
            )
            logger.info(
                f"Object tracking enabled with ByteTrack "
                f"(two-tier confidence: detection={settings.detection_confidence_threshold:.2f}, "
                f"new_track={settings.new_track_confidence_threshold:.2f})"
            )

    def detect(
        self, frame: np.ndarray, frame_timestamp: float = None
    ) -> List[Dict[str, Any]]:
        """
        Detect objects in frame.

        Args:
            frame: Input frame (BGR format)
            frame_timestamp: Frame timestamp

        Returns:
            List of detection dictionaries
        """
        if frame_timestamp is None:
            frame_timestamp = time.time()

        detection_start = time.time()

        # Get original frame dimensions
        original_height, original_width = frame.shape[:2]

        # Downscale frame for faster detection if needed
        inference_frame = frame
        scale_factor = 1.0

        if settings.auto_scale_detection and original_width > settings.detection_resolution:
            scale_factor = settings.detection_resolution / original_width
            new_width = settings.detection_resolution
            new_height = int(original_height * scale_factor)

            inference_frame = cv2.resize(
                frame,
                (new_width, new_height),
                interpolation=cv2.INTER_LINEAR  # Faster than INTER_CUBIC
            )

        # Run YOLOv8 inference with optimizations
        # Use lower threshold to capture detections that might match existing tracks
        detection_threshold = settings.detection_confidence_threshold if self.enable_tracking else settings.confidence_threshold

        results = self.model.predict(
            inference_frame,
            conf=detection_threshold,
            iou=settings.iou_threshold,
            verbose=False,
            half=True,  # Use FP16 for faster inference if GPU available
            device='cuda' if torch.cuda.is_available() else 'cpu',
        )

        detections = []
        frame_height, frame_width = original_height, original_width

        # Process results
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                # Filter by class if ALLOWED_CLASSES is set
                class_id = int(box.cls[0])
                if self.ALLOWED_CLASSES is not None and class_id not in self.ALLOWED_CLASSES:
                    continue  # Skip this detection

                # Get box coordinates (xyxy format) from inference frame
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Scale coordinates back to original frame size
                if scale_factor != 1.0:
                    x1 = x1 / scale_factor
                    y1 = y1 / scale_factor
                    x2 = x2 / scale_factor
                    y2 = y2 / scale_factor

                # Convert to VAPIX normalized coordinates (0-1) using ORIGINAL dimensions
                left = float(x1 / frame_width)
                top = float(y1 / frame_height)
                right = float(x2 / frame_width)
                bottom = float(y2 / frame_height)

                detection = {
                    "bbox": {
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                    "confidence": float(box.conf[0]),
                    "class_id": class_id,
                    "class_name": result.names[class_id],
                }
                detections.append(detection)

        processing_latency_ms = (time.time() - detection_start) * 1000

        # Apply object tracking if enabled
        if self.tracker is not None:
            detections = self.tracker.update(detections, (original_height, original_width))

            # Apply two-tier confidence filtering after tracking
            # This allows low-confidence detections to be matched to existing tracks,
            # but prevents them from creating new tracks
            if settings.two_tier_confidence_enabled:
                detections = self._apply_two_tier_filter(detections)

            # Log tracking info periodically
            if self.frame_number % 100 == 0:
                track_info = self.tracker.get_track_info()
                logger.debug(
                    f"Tracking stats: {track_info['active_tracks']} active, "
                    f"{track_info['new_tracks']} new, {track_info['lost_tracks']} lost, "
                    f"avg_confidence: {track_info['avg_track_confidence']:.2f}"
                )

        # Cache detections for this frame
        self.last_detections = detections
        self.detection_cache[self.frame_number] = detections

        # Keep cache size reasonable (last 30 frames)
        if len(self.detection_cache) > 30:
            oldest_frame = min(self.detection_cache.keys())
            del self.detection_cache[oldest_frame]

        self.frame_number += 1
        return detections

    def _apply_two_tier_filter(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Apply two-tier confidence filtering to detections.

        High-confidence detections (>= new_track_confidence_threshold) always pass.
        Low-confidence detections only pass if they match an existing active track.

        Args:
            detections: List of tracked detections

        Returns:
            Filtered list of detections
        """
        filtered = []
        new_track_threshold = settings.new_track_confidence_threshold

        for det in detections:
            confidence = det.get('confidence', 0.0)
            track_state = det.get('track_state', 'new')

            # High confidence - always include
            if confidence >= new_track_threshold:
                filtered.append(det)
            # Low confidence - only include if part of existing track
            elif track_state in ['active', 'lost']:
                filtered.append(det)
            # Low confidence new track - exclude
            else:
                # This should rarely happen due to track_activation_threshold,
                # but provides extra safety
                pass

        return filtered

    def detect_batch(
        self,
        frames: List[np.ndarray],
        frame_timestamps: Optional[List[float]] = None
    ) -> List[List[Dict[str, Any]]]:
        """
        Detect objects in a batch of frames (optimized for GPU).

        This is significantly faster than calling detect() multiple times
        as it batches inference operations on the GPU.

        Args:
            frames: List of input frames (BGR format)
            frame_timestamps: Optional list of frame timestamps

        Returns:
            List of detection lists (one per frame)
        """
        if not frames:
            return []

        if frame_timestamps is None:
            current_time = time.time()
            frame_timestamps = [current_time + (i * 0.033) for i in range(len(frames))]

        detection_start = time.time()
        batch_size = len(frames)

        # Get dimensions from first frame (assume all frames same size)
        original_height, original_width = frames[0].shape[:2]

        # Prepare batch for inference
        inference_frames = []
        scale_factor = 1.0

        if settings.auto_scale_detection and original_width > settings.detection_resolution:
            scale_factor = settings.detection_resolution / original_width
            new_width = settings.detection_resolution
            new_height = int(original_height * scale_factor)

            for frame in frames:
                inference_frame = cv2.resize(
                    frame,
                    (new_width, new_height),
                    interpolation=cv2.INTER_LINEAR
                )
                inference_frames.append(inference_frame)
        else:
            inference_frames = frames

        # Run batched YOLOv8 inference
        # Use lower threshold when tracking is enabled
        detection_threshold = settings.detection_confidence_threshold if self.enable_tracking else settings.confidence_threshold

        results = self.model.predict(
            inference_frames,
            conf=detection_threshold,
            iou=settings.iou_threshold,
            verbose=False,
            half=True,
            device='cuda' if torch.cuda.is_available() else 'cpu',
        )

        # Process results for each frame
        all_detections = []
        frame_height, frame_width = original_height, original_width

        for frame_idx, result in enumerate(results):
            detections = []
            boxes = result.boxes

            if boxes is not None:
                for box in boxes:
                    # Filter by class
                    class_id = int(box.cls[0])
                    if self.ALLOWED_CLASSES is not None and class_id not in self.ALLOWED_CLASSES:
                        continue

                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                    # Scale back to original size
                    if scale_factor != 1.0:
                        x1 /= scale_factor
                        y1 /= scale_factor
                        x2 /= scale_factor
                        y2 /= scale_factor

                    # Normalize coordinates
                    detection = {
                        "bbox": {
                            "left": float(x1 / frame_width),
                            "top": float(y1 / frame_height),
                            "right": float(x2 / frame_width),
                            "bottom": float(y2 / frame_height),
                        },
                        "confidence": float(box.conf[0]),
                        "class_id": class_id,
                        "class_name": result.names[class_id],
                    }
                    detections.append(detection)

            # Apply tracking if enabled
            if self.tracker is not None:
                detections = self.tracker.update(detections, (original_height, original_width))

                # Apply two-tier confidence filtering after tracking
                if settings.two_tier_confidence_enabled:
                    detections = self._apply_two_tier_filter(detections)

            all_detections.append(detections)

            # Cache detections
            self.detection_cache[self.frame_number] = detections
            if len(self.detection_cache) > 30:
                oldest_frame = min(self.detection_cache.keys())
                del self.detection_cache[oldest_frame]

            self.frame_number += 1

        processing_time = time.time() - detection_start
        avg_fps = batch_size / processing_time if processing_time > 0 else 0

        logger.debug(
            f"Batch detection: {batch_size} frames in {processing_time*1000:.1f}ms "
            f"({avg_fps:.1f} FPS, {processing_time*1000/batch_size:.1f}ms/frame)"
        )

        self.last_detections = all_detections[-1] if all_detections else []
        return all_detections
