"""Unit tests for WebRTC YOLO object detector."""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import time
import cv2

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
        mock_settings.model_path = "yolov8n.pt"
        mock_yolo_class.return_value = mock_yolo_model

        detector = ObjectDetector()

        assert detector.model == mock_yolo_model
        assert detector.frame_number == 0
        assert detector.last_detections == []
        assert detector.detection_cache == {}
        mock_yolo_class.assert_called_once_with("yolov8n.pt")

    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_initialization_with_custom_model_path(self, mock_settings, mock_yolo_class, mock_yolo_model):
        """Test ObjectDetector accepts custom model path."""
        mock_settings.model_path = "yolov8n.pt"
        mock_yolo_class.return_value = mock_yolo_model

        detector = ObjectDetector(model_path="custom_model.pt")

        mock_yolo_class.assert_called_once_with("custom_model.pt")

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.time')
    def test_detect_uses_current_time_as_fallback(
        self,
        mock_time,
        mock_settings,
        mock_yolo_class,
        mock_frame
    ):
        """Test detect() uses current time when frame_timestamp is None."""
        mock_time.time.return_value = 1234567890.0
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        # Mock YOLO with empty results
        mock_result = Mock()
        mock_result.boxes = None

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame, frame_timestamp=None)

        # Should use time.time() for timestamp
        # Verify by checking that time.time was called
        assert mock_time.time.call_count >= 2  # Once for fallback, once for latency

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_with_results(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detect() processes results correctly."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        mock_model = MagicMock()
        mock_model.predict.return_value = mock_yolo_results(num_detections=2, confidence=0.85)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame, frame_timestamp=1234567890.0)

        # Should have 2 detections
        assert len(detections) == 2

        # Check detection structure
        det = detections[0]
        assert "bbox" in det
        assert "confidence" in det
        assert "class_id" in det
        assert "class_name" in det
        assert "timestamp" in det
        assert "frame_number" in det

        # Verify timestamp
        assert det["timestamp"] == 1234567890.0

        # Verify frame_number incremented
        assert detector.frame_number == 1

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_caches_results(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detect() caches detection results."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        mock_model = MagicMock()
        mock_model.predict.return_value = mock_yolo_results(num_detections=1)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame)

        # Verify cache
        assert detector.last_detections == detections
        assert 0 in detector.detection_cache
        assert detector.detection_cache[0] == detections

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_cache_size_limit(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame,
        mock_yolo_results
    ):
        """Test detection cache is limited to 30 frames."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        mock_model = MagicMock()
        mock_model.predict.return_value = mock_yolo_results(num_detections=1)
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()

        # Process 35 frames
        for _ in range(35):
            detector.detect(mock_frame)

        # Cache should only have 30 entries
        assert len(detector.detection_cache) <= 30
        # Oldest frame (0) should be removed
        assert 0 not in detector.detection_cache
        # Most recent frames should be present
        assert 34 in detector.detection_cache

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    @patch('detector.cv2')
    def test_detect_with_frame_scaling(
        self,
        mock_cv2,
        mock_torch,
        mock_settings,
        mock_yolo_class
    ):
        """Test detect() scales down large frames for faster inference."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = True
        mock_settings.detection_resolution = 640
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        # Create large HD frame (1920x1080)
        large_frame = np.zeros((1080, 1920, 3), dtype=np.uint8)

        # Mock cv2.resize to return smaller frame
        small_frame = np.zeros((360, 640, 3), dtype=np.uint8)
        mock_cv2.resize.return_value = small_frame

        # Mock YOLO detection on scaled frame
        mock_box = Mock()
        mock_box.xyxy = [Mock()]
        mock_box.xyxy[0].cpu = Mock()
        # Coordinates on scaled frame (640x360)
        mock_box.xyxy[0].cpu().numpy = Mock(return_value=np.array([50, 50, 150, 150]))
        mock_box.conf = [0.85]
        mock_box.cls = [0]

        mock_result = Mock()
        mock_result.boxes = [mock_box]
        mock_result.names = {0: "person"}

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(large_frame)

        # Verify cv2.resize was called to scale down
        mock_cv2.resize.assert_called_once()

        # Verify coordinates were scaled back to original frame size
        # scale_factor = 640 / 1920 = 1/3
        # Original coords on scaled: (50, 50) to (150, 150)
        # Scaled back: (150, 150) to (450, 450)
        bbox = detections[0]["bbox"]
        assert bbox["x1"] == pytest.approx(150.0, abs=1.0)
        assert bbox["x2"] == pytest.approx(450.0, abs=1.0)

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_normalized_coordinates(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class
    ):
        """Test detect() generates normalized VAPIX coordinates."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        # Frame with known dimensions (640x480)
        frame = np.zeros((480, 640, 3), dtype=np.uint8)

        # Mock YOLO to return detection at (100, 100) to (200, 300)
        mock_box = Mock()
        mock_box.xyxy = [Mock()]
        mock_box.xyxy[0].cpu = Mock()
        mock_box.xyxy[0].cpu().numpy = Mock(return_value=np.array([100, 100, 200, 300]))
        mock_box.conf = [0.85]
        mock_box.cls = [0]

        mock_result = Mock()
        mock_result.boxes = [mock_box]
        mock_result.names = {0: "person"}

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(frame)

        bbox = detections[0]["bbox"]

        # Verify normalized coordinates
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
    @patch('detector.torch')
    def test_detect_empty_results(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame
    ):
        """Test detect() handles empty results gracefully."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        # Mock YOLO with None boxes
        mock_result = Mock()
        mock_result.boxes = None

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detections = detector.detect(mock_frame)

        assert detections == []
        assert detector.last_detections == []

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_uses_gpu_when_available(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame
    ):
        """Test detect() uses GPU when available."""
        mock_torch.cuda.is_available.return_value = True
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        mock_result = Mock()
        mock_result.boxes = None

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()
        detector.detect(mock_frame)

        # Verify predict was called with GPU device
        call_kwargs = mock_model.predict.call_args[1]
        assert call_kwargs['device'] == 'cuda'
        assert call_kwargs['half'] is True  # FP16 for GPU

    @patch('detector.YOLO')
    @patch('detector.settings')
    @patch('detector.torch')
    def test_detect_frame_number_increment(
        self,
        mock_torch,
        mock_settings,
        mock_yolo_class,
        mock_frame
    ):
        """Test frame_number increments correctly."""
        mock_torch.cuda.is_available.return_value = False
        mock_settings.model_path = "yolov8n.pt"
        mock_settings.auto_scale_detection = False
        mock_settings.confidence_threshold = 0.5
        mock_settings.iou_threshold = 0.45

        mock_result = Mock()
        mock_result.boxes = None

        mock_model = MagicMock()
        mock_model.predict.return_value = [mock_result]
        mock_yolo_class.return_value = mock_model

        detector = ObjectDetector()

        assert detector.frame_number == 0
        detector.detect(mock_frame)
        assert detector.frame_number == 1
        detector.detect(mock_frame)
        assert detector.frame_number == 2
        detector.detect(mock_frame)
        assert detector.frame_number == 3
