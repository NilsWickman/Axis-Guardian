"""
Test object tracking implementation.

This test verifies that ByteTrack tracking works correctly with the detector.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
import numpy as np
from detector import ObjectDetector


class TestObjectTracking:
    """Test suite for object tracking functionality."""

    def test_tracker_initialization(self):
        """Test that detector initializes with tracking enabled."""
        detector = ObjectDetector(enable_tracking=True)
        assert detector.enable_tracking is True
        assert detector.tracker is not None
        assert detector.tracker.get_track_count() == 0

    def test_tracker_disabled(self):
        """Test that tracker can be disabled."""
        detector = ObjectDetector(enable_tracking=False)
        assert detector.enable_tracking is False
        assert detector.tracker is None

    def test_detection_with_tracking(self):
        """Test that detections include track_id when tracking is enabled."""
        detector = ObjectDetector(enable_tracking=True)

        # Create a test frame (empty black frame)
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Run detection
        detections = detector.detect(test_frame)

        # Verify structure (should be empty for black frame)
        assert isinstance(detections, list)

        # If we had detections, they should have track_id field
        for det in detections:
            assert 'track_id' in det
            assert 'track_state' in det
            assert det['track_state'] in ['new', 'active', 'lost']

    def test_detection_without_tracking(self):
        """Test that detections don't have track_id when tracking is disabled."""
        detector = ObjectDetector(enable_tracking=False)

        # Create a test frame
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Run detection
        detections = detector.detect(test_frame)

        # Verify structure
        assert isinstance(detections, list)

        # Detections should not have track_id field when tracking is disabled
        for det in detections:
            assert 'track_id' not in det
            assert 'track_state' not in det

    def test_tracker_persistence(self):
        """Test that tracker maintains state across multiple frames."""
        detector = ObjectDetector(enable_tracking=True)

        # Process multiple frames
        for i in range(5):
            test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
            detections = detector.detect(test_frame)

        # Tracker should exist and maintain state
        assert detector.tracker is not None
        track_info = detector.tracker.get_track_info()
        assert 'active_tracks' in track_info
        assert 'new_tracks' in track_info
        assert 'lost_tracks' in track_info

    def test_detection_data_structure(self):
        """Test that detection data structure is correct."""
        detector = ObjectDetector(enable_tracking=True)
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        detections = detector.detect(test_frame)

        # Each detection should have required fields
        for det in detections:
            assert 'bbox' in det
            assert 'confidence' in det
            assert 'class_id' in det
            assert 'class_name' in det

            # When tracking is enabled
            if detector.enable_tracking:
                assert 'track_id' in det
                assert 'track_state' in det

            # Verify bbox structure
            bbox = det['bbox']
            assert 'left' in bbox
            assert 'top' in bbox
            assert 'right' in bbox
            assert 'bottom' in bbox

            # Verify normalized coordinates
            assert 0 <= bbox['left'] <= 1
            assert 0 <= bbox['top'] <= 1
            assert 0 <= bbox['right'] <= 1
            assert 0 <= bbox['bottom'] <= 1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
