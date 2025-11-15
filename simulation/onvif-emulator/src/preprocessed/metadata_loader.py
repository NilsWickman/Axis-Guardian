"""Preprocessed detection metadata loader and synchronizer."""

import gzip
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from loguru import logger


class DetectionMetadata:
    """Single frame detection metadata."""

    def __init__(self, frame_number: int, timestamp: float, detections: List[Dict[str, Any]]):
        """Initialize detection metadata.

        Args:
            frame_number: Frame number (0-indexed)
            timestamp: Video timestamp in seconds
            detections: List of detection dictionaries
        """
        self.frame_number = frame_number
        self.timestamp = timestamp
        self.detections = detections

    @property
    def has_detections(self) -> bool:
        """Check if frame has any detections."""
        return len(self.detections) > 0

    @property
    def detection_count(self) -> int:
        """Get number of detections in frame."""
        return len(self.detections)

    def get_objects_by_class(self, class_name: str) -> List[Dict[str, Any]]:
        """Get all detections of a specific class.

        Args:
            class_name: Object class (e.g., 'person', 'car')

        Returns:
            List of matching detections
        """
        return [det for det in self.detections if det.get('class') == class_name]


class MetadataLoader:
    """Loader for preprocessed detection metadata files."""

    def __init__(self, metadata_path: Path):
        """Initialize metadata loader.

        Args:
            metadata_path: Path to .detections.json or .detections.json.gz file
        """
        self.metadata_path = Path(metadata_path)
        self.metadata: List[DetectionMetadata] = []
        self.frame_index: Dict[int, DetectionMetadata] = {}
        self.timestamp_index: Dict[float, DetectionMetadata] = {}
        self._load()

    def _load(self) -> None:
        """Load metadata from file."""
        if not self.metadata_path.exists():
            logger.warning(f"Metadata file not found: {self.metadata_path}")
            return

        try:
            # Handle gzipped files
            if self.metadata_path.suffix == '.gz':
                with gzip.open(self.metadata_path, 'rt', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                with open(self.metadata_path, 'r') as f:
                    data = json.load(f)

            # Parse metadata - handle both list format and dict with 'frames' key
            frames_data = data if isinstance(data, list) else data.get('frames', [])

            for item in frames_data:
                frame_meta = DetectionMetadata(
                    frame_number=item['frame_number'],
                    timestamp=item['timestamp'],
                    detections=item.get('detections', [])
                )
                self.metadata.append(frame_meta)
                self.frame_index[frame_meta.frame_number] = frame_meta
                self.timestamp_index[frame_meta.timestamp] = frame_meta

            logger.info(
                f"Loaded {len(self.metadata)} frames of detection metadata "
                f"from {self.metadata_path.name}"
            )

        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")

    def get_by_frame(self, frame_number: int) -> Optional[DetectionMetadata]:
        """Get metadata for a specific frame number.

        Args:
            frame_number: Frame number (0-indexed)

        Returns:
            Detection metadata or None if not found
        """
        return self.frame_index.get(frame_number)

    def get_by_timestamp(self, timestamp: float, tolerance: float = 0.05) -> Optional[DetectionMetadata]:
        """Get metadata for a specific timestamp.

        Args:
            timestamp: Video timestamp in seconds
            tolerance: Time tolerance for matching (seconds)

        Returns:
            Detection metadata or None if not found
        """
        # Exact match first
        if timestamp in self.timestamp_index:
            return self.timestamp_index[timestamp]

        # Find closest within tolerance
        for ts, meta in self.timestamp_index.items():
            if abs(ts - timestamp) <= tolerance:
                return meta

        return None

    def get_range(self, start_frame: int, end_frame: int) -> List[DetectionMetadata]:
        """Get metadata for a range of frames.

        Args:
            start_frame: Start frame (inclusive)
            end_frame: End frame (exclusive)

        Returns:
            List of detection metadata
        """
        return [
            meta for meta in self.metadata
            if start_frame <= meta.frame_number < end_frame
        ]

    def get_frames_with_detections(self) -> List[DetectionMetadata]:
        """Get all frames that have detections.

        Returns:
            List of frames with at least one detection
        """
        return [meta for meta in self.metadata if meta.has_detections]

    def get_frames_with_class(self, class_name: str) -> List[DetectionMetadata]:
        """Get all frames containing a specific object class.

        Args:
            class_name: Object class to filter by

        Returns:
            List of frames containing the class
        """
        return [
            meta for meta in self.metadata
            if any(det.get('class') == class_name for det in meta.detections)
        ]

    @property
    def total_frames(self) -> int:
        """Get total number of frames."""
        return len(self.metadata)

    @property
    def duration(self) -> float:
        """Get total video duration in seconds."""
        if not self.metadata:
            return 0.0
        return self.metadata[-1].timestamp

    @property
    def total_detections(self) -> int:
        """Get total number of detections across all frames."""
        return sum(meta.detection_count for meta in self.metadata)

    def get_statistics(self) -> Dict[str, Any]:
        """Get metadata statistics.

        Returns:
            Dictionary with statistics
        """
        if not self.metadata:
            return {
                "total_frames": 0,
                "frames_with_detections": 0,
                "total_detections": 0,
                "detection_rate": 0.0,
                "duration": 0.0,
                "classes": {}
            }

        frames_with_detections = len(self.get_frames_with_detections())
        total_detections = self.total_detections

        # Count detections by class
        class_counts: Dict[str, int] = {}
        for meta in self.metadata:
            for det in meta.detections:
                cls = det.get('class', 'unknown')
                class_counts[cls] = class_counts.get(cls, 0) + 1

        return {
            "total_frames": self.total_frames,
            "frames_with_detections": frames_with_detections,
            "total_detections": total_detections,
            "detection_rate": frames_with_detections / self.total_frames if self.total_frames > 0 else 0.0,
            "avg_detections_per_frame": total_detections / self.total_frames if self.total_frames > 0 else 0.0,
            "duration": self.duration,
            "classes": class_counts
        }
