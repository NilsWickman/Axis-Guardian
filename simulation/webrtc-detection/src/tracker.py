"""
Object tracking module using ByteTrack for persistent object IDs across frames.

This module provides tracking capabilities to maintain object identity across video frames,
reducing flickering detections and enabling trajectory analysis.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
from loguru import logger
import supervision as sv


class ObjectTracker:
    """
    Manages object tracking using ByteTrack algorithm.

    ByteTrack uses a combination of high and low confidence detections to maintain
    tracks even during occlusions or temporary detection failures.
    """

    def __init__(
        self,
        track_activation_threshold: float = 0.25,
        lost_track_buffer: int = 30,
        minimum_matching_threshold: float = 0.7,
        frame_rate: int = 30,
        confidence_boost_enabled: bool = True,
        max_confidence_boost: float = 0.15,
    ):
        """
        Initialize the object tracker.

        Args:
            track_activation_threshold: Minimum confidence to start a new track (lower = more permissive)
            lost_track_buffer: Number of frames to keep lost tracks before deletion
            minimum_matching_threshold: Minimum IOU for matching detections to tracks (higher = stricter)
            frame_rate: Video frame rate for track lifecycle calculations
            confidence_boost_enabled: Enable confidence boosting for stable tracks
            max_confidence_boost: Maximum confidence boost for stable tracks (0.0-1.0)
        """
        self.tracker = sv.ByteTrack(
            track_activation_threshold=track_activation_threshold,
            lost_track_buffer=lost_track_buffer,
            minimum_matching_threshold=minimum_matching_threshold,
            frame_rate=frame_rate,
        )

        # Track history for temporal smoothing
        self.track_history: Dict[int, List[np.ndarray]] = {}
        self.max_history_length = 10

        # Track state management
        self.active_tracks: set = set()
        self.new_tracks: set = set()
        self.lost_tracks: set = set()

        # Track stability tracking for confidence boosting
        self.track_stability: Dict[int, Dict] = {}
        self.confidence_boost_enabled = confidence_boost_enabled
        self.max_confidence_boost = max_confidence_boost

        logger.info(
            f"Initialized ObjectTracker with ByteTrack "
            f"(activation_threshold={track_activation_threshold}, "
            f"lost_buffer={lost_track_buffer}, "
            f"matching_threshold={minimum_matching_threshold}, "
            f"confidence_boost={'enabled' if confidence_boost_enabled else 'disabled'})"
        )

    def update(
        self,
        detections: List[Dict],
        frame_shape: Tuple[int, int],
    ) -> List[Dict]:
        """
        Update tracks with new detections and assign track IDs.

        Args:
            detections: List of detection dictionaries with bbox, confidence, class_id, class_name
            frame_shape: (height, width) of the frame

        Returns:
            List of detections with added track_id field and smoothed bounding boxes
        """
        if not detections:
            # Update tracker with empty detections to handle lost tracks
            empty_detections = sv.Detections.empty()
            self.tracker.update_with_detections(empty_detections)
            return []

        # Convert detections to supervision format
        sv_detections = self._convert_to_supervision(detections, frame_shape)

        # Update tracker
        tracked_detections = self.tracker.update_with_detections(sv_detections)

        # Update track state
        self._update_track_state(tracked_detections.tracker_id)

        # Convert back to our format with track IDs and smoothing
        tracked_results = self._convert_from_supervision(
            tracked_detections,
            detections,
            frame_shape,
        )

        return tracked_results

    def _convert_to_supervision(
        self,
        detections: List[Dict],
        frame_shape: Tuple[int, int],
    ) -> sv.Detections:
        """
        Convert our detection format to supervision Detections object.

        Args:
            detections: List of our detection dictionaries
            frame_shape: (height, width) of the frame

        Returns:
            supervision.Detections object
        """
        height, width = frame_shape

        # Extract bounding boxes in xyxy format (absolute coordinates)
        xyxy = []
        confidences = []
        class_ids = []

        for det in detections:
            bbox = det["bbox"]
            # Convert normalized coordinates to absolute pixel coordinates
            x1 = bbox["left"] * width
            y1 = bbox["top"] * height
            x2 = bbox["right"] * width
            y2 = bbox["bottom"] * height

            xyxy.append([x1, y1, x2, y2])
            confidences.append(det["confidence"])
            class_ids.append(det["class_id"])

        return sv.Detections(
            xyxy=np.array(xyxy, dtype=np.float32),
            confidence=np.array(confidences, dtype=np.float32),
            class_id=np.array(class_ids, dtype=np.int32),
        )

    def _convert_from_supervision(
        self,
        sv_detections: sv.Detections,
        original_detections: List[Dict],
        frame_shape: Tuple[int, int],
    ) -> List[Dict]:
        """
        Convert supervision Detections back to our format with track IDs.

        Args:
            sv_detections: Tracked detections from supervision
            original_detections: Original detection dictionaries (for class names)
            frame_shape: (height, width) of the frame

        Returns:
            List of detections with track_id field and smoothed bboxes
        """
        height, width = frame_shape
        tracked_results = []

        for i, track_id in enumerate(sv_detections.tracker_id):
            # Get smoothed bounding box
            xyxy = sv_detections.xyxy[i]
            smoothed_bbox = self._smooth_bbox(track_id, xyxy)

            # Convert back to normalized coordinates
            x1, y1, x2, y2 = smoothed_bbox
            normalized_bbox = {
                "left": float(x1 / width),
                "top": float(y1 / height),
                "right": float(x2 / width),
                "bottom": float(y2 / height),
            }

            # Get raw confidence
            raw_confidence = float(sv_detections.confidence[i])

            # Update track stability metrics
            self._update_track_stability(track_id, raw_confidence)

            # Apply confidence boost if enabled
            boosted_confidence = self._get_boosted_confidence(track_id, raw_confidence)

            # Create tracked detection
            tracked_det = {
                "bbox": normalized_bbox,
                "confidence": boosted_confidence,
                "raw_confidence": raw_confidence,  # Keep original for debugging
                "class_id": int(sv_detections.class_id[i]),
                "class_name": original_detections[i]["class_name"],
                "track_id": int(track_id),
                "track_state": self._get_track_state(track_id),
            }

            tracked_results.append(tracked_det)

        return tracked_results

    def _smooth_bbox(
        self,
        track_id: int,
        current_bbox: np.ndarray,
    ) -> np.ndarray:
        """
        Apply temporal smoothing to bounding box using exponential moving average.

        Args:
            track_id: Unique track identifier
            current_bbox: Current bounding box in xyxy format

        Returns:
            Smoothed bounding box in xyxy format
        """
        # Initialize history for new tracks
        if track_id not in self.track_history:
            self.track_history[track_id] = []

        # Add current bbox to history
        self.track_history[track_id].append(current_bbox)

        # Maintain maximum history length
        if len(self.track_history[track_id]) > self.max_history_length:
            self.track_history[track_id].pop(0)

        # Compute weighted average (more recent frames have higher weight)
        history = np.array(self.track_history[track_id])
        weights = np.exp(np.linspace(-2, 0, len(history)))
        weights /= weights.sum()

        smoothed = np.average(history, axis=0, weights=weights)

        return smoothed

    def _update_track_state(self, current_track_ids: np.ndarray):
        """
        Update track state (new/active/lost) based on current frame.

        Args:
            current_track_ids: Array of track IDs in current frame
        """
        current_ids = set(current_track_ids)

        # Identify new tracks
        self.new_tracks = current_ids - self.active_tracks

        # Identify lost tracks
        self.lost_tracks = self.active_tracks - current_ids

        # Update active tracks
        self.active_tracks = current_ids

        # Clean up history for lost tracks (keep for a while in case they reappear)
        for track_id in list(self.track_history.keys()):
            if track_id not in current_ids and track_id not in self.lost_tracks:
                del self.track_history[track_id]

        # Clean up stability data for permanently lost tracks
        for track_id in list(self.track_stability.keys()):
            if track_id not in current_ids and track_id not in self.lost_tracks:
                del self.track_stability[track_id]

    def _update_track_stability(self, track_id: int, confidence: float):
        """
        Update stability metrics for a track.

        Args:
            track_id: Track identifier
            confidence: Current detection confidence
        """
        if track_id not in self.track_stability:
            # Initialize new track stability data
            self.track_stability[track_id] = {
                "frames_since_activation": 0,
                "confidence_history": [],
                "avg_confidence": confidence,
            }

        stability = self.track_stability[track_id]

        # Increment frame count
        stability["frames_since_activation"] += 1

        # Update confidence history (keep last 30 frames)
        stability["confidence_history"].append(confidence)
        if len(stability["confidence_history"]) > 30:
            stability["confidence_history"].pop(0)

        # Update average confidence
        stability["avg_confidence"] = np.mean(stability["confidence_history"])

    def _get_boosted_confidence(self, track_id: int, raw_confidence: float) -> float:
        """
        Apply confidence boost based on track stability.

        Stable tracks receive a confidence boost to maintain continuity even when
        detection confidence temporarily drops (occlusion, blur, lighting changes).

        Args:
            track_id: Track identifier
            raw_confidence: Raw detection confidence from YOLO

        Returns:
            Boosted confidence value (capped at 1.0)
        """
        if not self.confidence_boost_enabled:
            return raw_confidence

        if track_id not in self.track_stability:
            return raw_confidence

        stability = self.track_stability[track_id]
        track_state = self._get_track_state(track_id)

        # Only boost active tracks (not new or lost)
        if track_state != "active":
            return raw_confidence

        # Calculate stability score (0.0 to 1.0)
        frames_tracked = min(stability["frames_since_activation"], 30)
        stability_score = frames_tracked / 30  # Linear ramp over 30 frames

        # Calculate confidence boost
        confidence_boost = stability_score * self.max_confidence_boost

        # Weight current confidence with historical average
        # This prevents temporary drops from breaking the track
        historical_weight = min(stability_score * 0.6, 0.6)  # Up to 60% historical
        current_weight = 1.0 - historical_weight

        weighted_confidence = (
            raw_confidence * current_weight +
            stability["avg_confidence"] * historical_weight
        )

        # Apply boost
        boosted_confidence = min(weighted_confidence + confidence_boost, 1.0)

        return boosted_confidence

    def _get_track_state(self, track_id: int) -> str:
        """
        Get the state of a track (new/active/lost).

        Args:
            track_id: Track identifier

        Returns:
            Track state string
        """
        if track_id in self.new_tracks:
            return "new"
        elif track_id in self.lost_tracks:
            return "lost"
        else:
            return "active"

    def reset(self):
        """Reset tracker state (useful for new video sequences)."""
        self.tracker.reset()
        self.track_history.clear()
        self.track_stability.clear()
        self.active_tracks.clear()
        self.new_tracks.clear()
        self.lost_tracks.clear()
        logger.info("Tracker state reset")

    def get_track_count(self) -> int:
        """Get number of currently active tracks."""
        return len(self.active_tracks)

    def get_track_info(self) -> Dict:
        """
        Get tracking statistics.

        Returns:
            Dictionary with tracking metrics
        """
        # Calculate average stability metrics
        avg_frames_tracked = 0
        avg_confidence = 0
        if self.track_stability:
            avg_frames_tracked = np.mean([
                s["frames_since_activation"] for s in self.track_stability.values()
            ])
            avg_confidence = np.mean([
                s["avg_confidence"] for s in self.track_stability.values()
            ])

        return {
            "active_tracks": len(self.active_tracks),
            "new_tracks": len(self.new_tracks),
            "lost_tracks": len(self.lost_tracks),
            "total_history": len(self.track_history),
            "avg_frames_tracked": float(avg_frames_tracked),
            "avg_track_confidence": float(avg_confidence),
        }
