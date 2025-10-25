"""Unit tests for YOLO object detector."""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import time

from detector import ObjectDetector


@pytest.mark.unit
class TestObjectDetector:
    """Tests for ObjectDetector class."""

    @pytest.fixture
    def mock_yolo_model(self, mocker):
        """Create a mock YOLO model."""
        mock_model = mocker.Mock()
        mock_model.names = {
            0: "person",
            1: "bicycle",
            2: "car",
            5: "bus",
            7: "truck"
        }
        return mock_model

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_initialization(self, mock_settings, mock_yolo_class, mock_yolo_model):
        """Test ObjectDetector initializes correctly."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.detect_classes = "person,car"
        mock_settings.target_classes = ["person", "car"]
        mock_settings.confidence_threshold = 0.5

        mock_yolo_class.return_value = mock_yolo_model

        detector = ObjectDetector()

        assert detector.model == mock_yolo_model
        assert detector.class_names == mock_yolo_model.names
        mock_yolo_class.assert_called_once_with("yolov8n.pt")

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_get_target_class_ids(self, mock_settings, mock_yolo_class, mock_yolo_model):
        """Test target class IDs are correctly identified."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.detect_classes = "person,car,bicycle"
        mock_settings.target_classes = ["person", "car", "bicycle"]
        mock_settings.confidence_threshold = 0.5

        mock_yolo_class.return_value = mock_yolo_model

        detector = ObjectDetector()

        assert 0 in detector.target_class_ids  # person
        assert 1 in detector.target_class_ids  # bicycle
        assert 2 in detector.target_class_ids  # car

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.sync_manager')
    def test_detect_empty_frame(self, mock_sync_manager, mock_settings, mock_yolo_class):
        """Test detect() handles None frame gracefully."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.enable_adaptive_sync = False

        mock_yolo_class.return_value = MagicMock()

        detector = ObjectDetector()
        detections = detector.detect(None)

        assert detections == []

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.sync_manager')
    @patch('detector.time')
    def test_detect_with_mocked_results(
        self,
        mock_time,
        mock_sync_manager,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detect() processes YOLO results correctly."""
        mock_time.time.return_value = 1234567890.0
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45
        mock_settings.detection_delay_ms = -15000
        mock_settings.enable_adaptive_sync = False
        mock_settings.use_video_pts = True

        mock_model = MagicMock()
        mock_model.names = {0: "person", 2: "car"}
        mock_model.return_value = mock_yolo_results(num_detections=2, confidence=0.85)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame, frame_timestamp=1234567890.0)

        # Should have 2 detections
        assert len(detections) == 2

        # Check first detection structure
        det = detections[0]
        assert "bbox" in det
        assert "confidence" in det
        assert "class_id" in det
        assert "class_name" in det
        assert "timestamp" in det

        # Check bbox fields
        bbox = det["bbox"]
        assert "x1" in bbox
        assert "y1" in bbox
        assert "x2" in bbox
        assert "y2" in bbox
        assert "width" in bbox
        assert "height" in bbox
        assert "left" in bbox
        assert "top" in bbox
        assert "right" in bbox
        assert "bottom" in bbox

        # Verify timestamp offset was applied
        expected_timestamp = 1234567890.0 + (-15000 / 1000.0)
        assert det["timestamp"] == expected_timestamp

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.sync_manager')
    def test_detect_adaptive_sync_offset(
        self,
        mock_sync_manager,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detect() uses adaptive sync offset when enabled."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45
        mock_settings.detection_delay_ms = -15000
        mock_settings.enable_adaptive_sync = True
        mock_settings.use_video_pts = True

        # Mock sync manager to return dynamic offset
        mock_sync_manager.get_offset.return_value = -12000.0

        mock_model = MagicMock()
        mock_model.names = {0: "person"}
        mock_model.return_value = mock_yolo_results(num_detections=1)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(
            mock_frame,
            frame_timestamp=1234567890.0,
            camera_id="camera1"
        )

        # Verify sync_manager was called
        mock_sync_manager.get_offset.assert_called_once_with("camera1")

        # Verify timestamp uses dynamic offset (-12000ms instead of -15000ms)
        expected_timestamp = 1234567890.0 + (-12000.0 / 1000.0)
        assert detections[0]["timestamp"] == expected_timestamp

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_detect_normalized_coordinates(
        self,
        mock_settings,
        mock_yolo_class,
        mock_yolo_results
    ):
        """Test detect() generates normalized coordinates correctly."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45
        mock_settings.detection_delay_ms = 0
        mock_settings.enable_adaptive_sync = False
        mock_settings.use_video_pts = False

        # Create frame with known dimensions (640x480)
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Mock YOLO to return detection at (100, 100) to (200, 300)
        mock_box = Mock()
        mock_box.xyxy = Mock()
        mock_box.xyxy[0] = Mock()
        mock_box.xyxy[0].cpu = Mock()
        mock_box.xyxy[0].cpu().numpy = Mock(return_value=np.array([100, 100, 200, 300]))
        mock_box.conf = [0.85]
        mock_box.cls = [0]

        mock_result = Mock()
        mock_result.boxes = [mock_box]

        mock_model = MagicMock()
        mock_model.names = {0: "person"}
        mock_model.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(frame)

        # Check normalized coordinates
        bbox = detections[0]["bbox"]

        # left = 100/640 = 0.15625
        # top = 100/480 = 0.208333...
        # right = 200/640 = 0.3125
        # bottom = 300/480 = 0.625
        assert abs(bbox["left"] - 0.15625) < 0.001
        assert abs(bbox["top"] - 0.208333) < 0.001
        assert abs(bbox["right"] - 0.3125) < 0.001
        assert abs(bbox["bottom"] - 0.625) < 0.001

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_detect_pts_metadata(
        self,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detect() includes PTS metadata in results."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45
        mock_settings.detection_delay_ms = 0
        mock_settings.enable_adaptive_sync = False
        mock_settings.use_video_pts = True

        mock_model = MagicMock()
        mock_model.names = {0: "person"}
        mock_model.return_value = mock_yolo_results(num_detections=1)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(
            mock_frame,
            frame_timestamp=1234567890.0,
            video_pts_ms=45230.5,
            loop_count=3
        )

        det = detections[0]
        assert det["video_pts_ms"] == 45230.5
        assert det["loop_count"] == 3
        assert det["pts_based"] is True

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_draw_detections(self, mock_settings, mock_yolo_class, mock_frame):
        """Test draw_detections() annotates frame correctly."""
        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5

        mock_yolo_class.return_value = MagicMock()

        detector = ObjectDetector()

        detections = [
            {
                "bbox": {
                    "x1": 100.0,
                    "y1": 100.0,
                    "x2": 200.0,
                    "y2": 300.0,
                    "width": 100.0,
                    "height": 200.0
                },
                "confidence": 0.85,
                "class_name": "person"
            }
        ]

        annotated = detector.draw_detections(mock_frame, detections)

        # Verify frame was copied and returned
        assert annotated.shape == mock_frame.shape
        assert annotated is not mock_frame  # Should be a copy

    @pytest.mark.parametrize("class_name,expected_color", [
        ("person", (0, 255, 0)),
        ("car", (255, 0, 0)),
        ("truck", (0, 0, 255)),
        ("unknown", (128, 128, 128)),
    ])
    def test_get_class_color(self, class_name, expected_color):
        """Test class color mapping."""
        color = ObjectDetector._get_class_color(class_name)
        assert color == expected_color

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.sync_manager')
    def test_detect_fallback_to_current_time(
        self,
        mock_sync_manager,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results,
        mocker
    ):
        """Test detect() falls back to current time when frame_timestamp is None."""
        mock_time = mocker.patch('detector.time')
        mock_time.time.return_value = 9999999999.0

        mock_settings.yolo_model_path = "yolov8n.pt"
        mock_settings.target_classes = ["person"]
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45
        mock_settings.detection_delay_ms = 0
        mock_settings.enable_adaptive_sync = False
        mock_settings.use_video_pts = False

        mock_model = MagicMock()
        mock_model.names = {0: "person"}
        mock_model.return_value = mock_yolo_results(num_detections=1)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame, frame_timestamp=None)

        # Should use mocked time.time()
        assert detections[0]["timestamp"] == 9999999999.0
