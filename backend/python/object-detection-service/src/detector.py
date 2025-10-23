"""YOLO-based object detection engine."""

import time
from typing import List, Dict, Any
from loguru import logger
from ultralytics import YOLO
import cv2
import numpy as np

from config import settings
from sync_adjuster import sync_manager


class ObjectDetector:
    """Real-time object detection using YOLOv8."""

    def __init__(self):
        """Initialize YOLO model."""
        logger.info(f"Loading YOLO model: {settings.model_size}")
        self.model = YOLO(f"{settings.model_size}.pt")

        # Get class names from COCO dataset
        self.class_names = self.model.names

        # Filter to target classes only
        self.target_class_ids = self._get_target_class_ids()
        logger.info(f"Detecting classes: {settings.target_classes}")
        logger.info(f"Confidence threshold: {settings.confidence_threshold}")

    def _get_target_class_ids(self) -> List[int]:
        """Get class IDs for target detection classes."""
        target_ids = []
        for class_name in settings.target_classes:
            for class_id, name in self.class_names.items():
                if name.lower() == class_name.lower():
                    target_ids.append(class_id)
                    break
        return target_ids

    def detect(
        self,
        frame: np.ndarray,
        frame_timestamp: float = None,
        video_pts_ms: float = 0.0,
        loop_count: int = 0,
        camera_id: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Perform object detection on a frame.

        Args:
            frame: Input frame (BGR format from OpenCV)
            frame_timestamp: Optional timestamp from video stream (seconds since epoch).
                           If None, uses current system time.
            video_pts_ms: Video presentation timestamp in milliseconds (for PTS-based timing)
            loop_count: Number of video loops detected (for PTS-based timing)
            camera_id: Camera identifier (for adaptive sync)

        Returns:
            List of detections with bounding boxes and metadata
        """
        if frame is None:
            return []

        # Use provided frame timestamp or fall back to current time
        detection_timestamp = frame_timestamp or time.time()

        # Apply offset: static or dynamic (adaptive sync)
        if settings.enable_adaptive_sync and camera_id:
            # Get dynamic offset from sync manager
            dynamic_offset_ms = sync_manager.get_offset(camera_id)
            detection_timestamp += dynamic_offset_ms / 1000.0
        else:
            # Use static configured offset
            detection_timestamp += settings.detection_delay_ms / 1000.0

        # Get frame dimensions for normalization
        frame_height, frame_width = frame.shape[:2]

        # Run YOLO detection
        results = self.model(
            frame,
            conf=settings.confidence_threshold,
            iou=settings.iou_threshold,
            classes=self.target_class_ids,
            verbose=False
        )

        detections = []

        # Parse results
        for result in results:
            boxes = result.boxes

            for box in boxes:
                # Extract box data (pixel coordinates)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = self.class_names[class_id]

                # Calculate VAPIX-compliant normalized coordinates (0-1 range)
                # Coordinate system: x-axis right, y-axis down, origin at top-left
                left = float(x1 / frame_width)
                top = float(y1 / frame_height)
                right = float(x2 / frame_width)
                bottom = float(y2 / frame_height)

                detection = {
                    "bbox": {
                        # Pixel coordinates (for backward compatibility)
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        # VAPIX normalized coordinates (0-1 range)
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                    "confidence": confidence,
                    "class_id": class_id,
                    "class_name": class_name,
                    "timestamp": detection_timestamp,
                    # PTS-based timing metadata
                    "video_pts_ms": video_pts_ms,
                    "loop_count": loop_count,
                    "pts_based": settings.use_video_pts,
                }

                detections.append(detection)

        return detections

    def draw_detections(self, frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame.

        Args:
            frame: Input frame
            detections: List of detections from detect()

        Returns:
            Annotated frame
        """
        annotated = frame.copy()

        for det in detections:
            bbox = det["bbox"]
            x1, y1 = int(bbox["x1"]), int(bbox["y1"])
            x2, y2 = int(bbox["x2"]), int(bbox["y2"])

            # Color based on class
            color = self._get_class_color(det["class_name"])

            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Draw label background
            label = f"{det['class_name']} {det['confidence']:.2f}"
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (x1, y1 - label_h - 10), (x1 + label_w, y1), color, -1)

            # Draw label text
            cv2.putText(
                annotated,
                label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )

        return annotated

    @staticmethod
    def _get_class_color(class_name: str) -> tuple:
        """Get color for class visualization."""
        colors = {
            "person": (0, 255, 0),      # Green
            "car": (255, 0, 0),          # Blue
            "truck": (0, 0, 255),        # Red
            "bus": (255, 255, 0),        # Cyan
            "motorbike": (255, 0, 255),  # Magenta
            "bicycle": (0, 255, 255),    # Yellow
        }
        return colors.get(class_name.lower(), (128, 128, 128))  # Gray default
