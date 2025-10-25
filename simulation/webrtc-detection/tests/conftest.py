"""Pytest configuration and shared fixtures for WebRTC detection tests."""

import os
import sys
from pathlib import Path
from typing import Generator
import pytest
import numpy as np

# Add src directory to Python path
ROOT_DIR = Path(__file__).parent.parent
SRC_DIR = ROOT_DIR / "src"
sys.path.insert(0, str(SRC_DIR))


@pytest.fixture
def test_config_env(monkeypatch) -> None:
    """Set test environment variables for configuration."""
    monkeypatch.setenv("CAMERA1_URL", "rtsp://test-host:8554/camera1")
    monkeypatch.setenv("CAMERA2_URL", "rtsp://test-host:8554/camera2")
    monkeypatch.setenv("CAMERA3_URL", "rtsp://test-host:8554/camera3")
    monkeypatch.setenv("CONFIDENCE_THRESHOLD", "0.5")
    monkeypatch.setenv("SIGNALING_PORT", "8080")


@pytest.fixture
def mock_frame() -> np.ndarray:
    """Generate a simple test frame (640x480 RGB)."""
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def mock_frame_hd() -> np.ndarray:
    """Generate an HD test frame (1920x1080 RGB)."""
    return np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)


@pytest.fixture
def mock_solid_frame() -> np.ndarray:
    """Generate a solid color frame for testing frame validation."""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:, :] = [100, 150, 200]  # Solid blue-ish color
    return frame


@pytest.fixture
def mock_black_frame() -> np.ndarray:
    """Generate a black frame (corrupted frame simulation)."""
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def mock_corrupted_frame() -> np.ndarray:
    """Generate a corrupted frame (very low std dev, solid color artifact)."""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:, :] = [2, 2, 2]  # Almost black with very low variance
    return frame


@pytest.fixture
def mock_yolo_results():
    """Mock YOLO detection results structure.

    Returns a factory function that generates mock results.
    """
    def _create_mock_results(num_detections: int = 2, confidence: float = 0.8):
        """Create mock YOLO results.

        Args:
            num_detections: Number of detections to simulate
            confidence: Confidence score for detections

        Returns:
            List of mock detection results compatible with YOLO format
        """
        from unittest.mock import Mock

        # Mock boxes
        mock_boxes = []
        for i in range(num_detections):
            box = Mock()
            box.xyxy = np.array([[10 + i*50, 10 + i*50, 100 + i*50, 100 + i*50]])
            box.conf = np.array([confidence])
            box.cls = np.array([0.0])  # Person class
            mock_boxes.append(box)

        # Mock result object
        result = Mock()
        result.boxes = mock_boxes
        result.names = {0: "person", 1: "bicycle", 2: "car"}

        return [result]

    return _create_mock_results


@pytest.fixture
def model_path() -> str:
    """Return path to YOLO test model."""
    # Use the tiny yolov8n model from shared/models
    project_root = ROOT_DIR.parent.parent.parent
    model_file = project_root / "shared" / "models" / "yolov8n.pt"

    if model_file.exists():
        return str(model_file)

    # Fallback for CI/testing without model
    return "yolov8n.pt"


@pytest.fixture
def mock_cv2_videocapture(mocker):
    """Create a mock cv2.VideoCapture object."""
    mock_cap = mocker.Mock()
    mock_cap.isOpened = mocker.Mock(return_value=True)
    mock_cap.read = mocker.Mock(return_value=(True, np.zeros((480, 640, 3), dtype=np.uint8)))
    mock_cap.get = mocker.Mock(return_value=0.0)
    mock_cap.set = mocker.Mock(return_value=True)
    mock_cap.release = mocker.Mock()
    return mock_cap


@pytest.fixture
def mock_webrtc_video_frame(mock_frame):
    """Create a mock aiortc VideoFrame."""
    from unittest.mock import Mock

    frame = Mock()
    frame.to_ndarray = Mock(return_value=mock_frame)
    frame.width = 640
    frame.height = 480
    return frame


@pytest.fixture
def sample_detection_dict() -> dict:
    """Sample detection dictionary matching detector output format."""
    return {
        "class": "person",
        "confidence": 0.85,
        "bbox": {
            "x1": 100,
            "y1": 100,
            "x2": 200,
            "y2": 300,
            "width": 100,
            "height": 200
        }
    }


@pytest.fixture
def sample_detections_list(sample_detection_dict) -> list:
    """Sample list of detections."""
    return [
        sample_detection_dict,
        {
            "class": "car",
            "confidence": 0.92,
            "bbox": {
                "x1": 300,
                "y1": 200,
                "x2": 500,
                "y2": 400,
                "width": 200,
                "height": 200
            }
        }
    ]


@pytest.fixture
def event_loop():
    """Create an event loop for async tests."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
