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
        logger.info(f"Loading YOLO model from: {settings.yolo_model_path}")
        self.model = YOLO(settings.yolo_model_path)

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

        # Scale frame to optimal detection resolution (YOLO native: 640x640)
        # This provides 3-5x speedup on high-resolution frames
        detection_frame = frame
        scale_factor = 1.0

        if frame_width > 640:
            scale_factor = 640.0 / frame_width
            new_width = 640
            new_height = int(frame_height * scale_factor)

            # Use INTER_LINEAR for good quality/speed tradeoff
            detection_frame = cv2.resize(
                frame,
                (new_width, new_height),
                interpolation=cv2.INTER_LINEAR
            )

        # Run YOLO detection on scaled frame
        results = self.model(
            detection_frame,
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
                # Extract box data (pixel coordinates from scaled frame)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Scale bounding boxes back to original frame dimensions
                if scale_factor != 1.0:
                    x1 = x1 / scale_factor
                    y1 = y1 / scale_factor
                    x2 = x2 / scale_factor
                    y2 = y2 / scale_factor

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
                        # VAPIX normalized coordinates (0-1 range)
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                    "confidence": confidence,
                    "class_id": class_id,
                    "class_name": class_name,
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
        frame_height, frame_width = frame.shape[:2]

        for det in detections:
            bbox = det["bbox"]
            # Convert normalized coordinates to pixels
            x1 = int(bbox["left"] * frame_width)
            y1 = int(bbox["top"] * frame_height)
            x2 = int(bbox["right"] * frame_width)
            y2 = int(bbox["bottom"] * frame_height)

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
