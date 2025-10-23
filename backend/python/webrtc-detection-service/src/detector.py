"""YOLOv8 object detector."""

import time
from typing import List, Dict, Any
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

        self.frame_number = 0

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

        # Run YOLOv8 inference
        results = self.model.predict(
            frame,
            conf=settings.confidence_threshold,
            iou=settings.iou_threshold,
            verbose=False,
        )

        detections = []
        frame_height, frame_width = frame.shape[:2]

        # Process results
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                # Get box coordinates (xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Convert to VAPIX normalized coordinates (0-1)
                left = float(x1 / frame_width)
                top = float(y1 / frame_height)
                right = float(x2 / frame_width)
                bottom = float(y2 / frame_height)

                detection = {
                    "bbox": {
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                    "confidence": float(box.conf[0]),
                    "class_id": int(box.cls[0]),
                    "class_name": result.names[int(box.cls[0])],
                    "timestamp": frame_timestamp,
                    "frame_number": self.frame_number,
                }
                detections.append(detection)

        processing_latency_ms = (time.time() - detection_start) * 1000

        if detections:
            logger.debug(
                f"Frame {self.frame_number}: {len(detections)} detections "
                f"in {processing_latency_ms:.1f}ms"
            )

        self.frame_number += 1
        return detections
