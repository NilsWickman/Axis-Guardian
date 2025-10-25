"""YOLOv8 object detector."""

import time
from typing import List, Dict, Any
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from loguru import logger

from config import settings

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

    def __init__(self, model_path: str = None):
        """
        Initialize detector.

        Args:
            model_path: Path to YOLOv8 model weights
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
        results = self.model.predict(
            inference_frame,
            conf=settings.confidence_threshold,
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

        # Cache detections for this frame
        self.last_detections = detections
        self.detection_cache[self.frame_number] = detections

        # Keep cache size reasonable (last 30 frames)
        if len(self.detection_cache) > 30:
            oldest_frame = min(self.detection_cache.keys())
            del self.detection_cache[oldest_frame]

        self.frame_number += 1
        return detections
