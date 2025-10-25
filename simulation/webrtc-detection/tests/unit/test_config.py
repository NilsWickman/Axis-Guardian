"""Unit tests for WebRTC detection configuration management."""

import pytest
from pydantic import ValidationError


@pytest.mark.unit
class TestSettings:
    """Tests for Settings configuration class."""

    def test_default_values(self, test_config_env):
        """Test Settings loads with default values."""
        from config import Settings

        settings = Settings()

        # Server configuration
        assert settings.host == "0.0.0.0"
        assert settings.port == 8080

        # Detection configuration
        assert settings.confidence_threshold == 0.5
        assert settings.iou_threshold == 0.45
        assert settings.frame_skip == 1
        assert settings.max_fps == 30
        assert settings.detection_resolution == 640
        assert settings.auto_scale_detection is True
        assert settings.draw_on_frame is True

        # Camera URLs (from test_config_env fixture)
        assert settings.camera1_url == "rtsp://test-host:8554/camera1"

    def test_server_configuration(self, test_config_env, monkeypatch):
        """Test server host and port configuration."""
        from config import Settings

        monkeypatch.setenv("WEBRTC_DETECTION_HOST", "127.0.0.1")
        monkeypatch.setenv("WEBRTC_DETECTION_PORT", "9090")

        settings = Settings()

        assert settings.host == "127.0.0.1"
        assert settings.port == 9090

    def test_stun_server_configuration(self, test_config_env, monkeypatch):
        """Test STUN server configuration."""
        from config import Settings

        monkeypatch.setenv("STUN_SERVER", "stun:stun.example.com:3478")
        settings = Settings()

        assert settings.stun_server == "stun:stun.example.com:3478"

    def test_turn_server_configuration(self, test_config_env, monkeypatch):
        """Test TURN server configuration."""
        from config import Settings

        monkeypatch.setenv("TURN_SERVER", "turn:turn.example.com:3478")
        monkeypatch.setenv("TURN_USERNAME", "testuser")
        monkeypatch.setenv("TURN_PASSWORD", "testpass")

        settings = Settings()

        assert settings.turn_server == "turn:turn.example.com:3478"
        assert settings.turn_username == "testuser"
        assert settings.turn_password == "testpass"

    def test_confidence_threshold_validation(self, test_config_env, monkeypatch):
        """Test confidence threshold is validated (0.0-1.0)."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "0.75")
        settings = Settings()
        assert settings.confidence_threshold == 0.75

        # Invalid value (> 1.0)
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "1.5")
        with pytest.raises(ValidationError):
            settings = Settings()

        # Invalid value (< 0.0)
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "-0.5")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_iou_threshold_validation(self, test_config_env, monkeypatch):
        """Test IOU threshold is validated (0.0-1.0)."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("IOU_THRESHOLD", "0.6")
        settings = Settings()
        assert settings.iou_threshold == 0.6

        # Invalid value
        monkeypatch.setenv("IOU_THRESHOLD", "2.0")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_frame_skip_validation(self, test_config_env, monkeypatch):
        """Test frame_skip has minimum value of 1."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("FRAME_SKIP", "2")
        settings = Settings()
        assert settings.frame_skip == 2

        # Invalid value (< 1)
        monkeypatch.setenv("FRAME_SKIP", "0")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_max_fps_validation(self, test_config_env, monkeypatch):
        """Test max_fps is validated (1-60)."""
        from config import Settings

        # Valid values
        monkeypatch.setenv("MAX_FPS", "15")
        settings = Settings()
        assert settings.max_fps == 15

        monkeypatch.setenv("MAX_FPS", "60")
        settings = Settings()
        assert settings.max_fps == 60

        # Too low
        monkeypatch.setenv("MAX_FPS", "0")
        with pytest.raises(ValidationError):
            settings = Settings()

        # Too high
        monkeypatch.setenv("MAX_FPS", "120")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_detection_resolution_validation(self, test_config_env, monkeypatch):
        """Test detection_resolution is validated (320-1280)."""
        from config import Settings

        # Valid values
        monkeypatch.setenv("DETECTION_RESOLUTION", "640")
        settings = Settings()
        assert settings.detection_resolution == 640

        monkeypatch.setenv("DETECTION_RESOLUTION", "1280")
        settings = Settings()
        assert settings.detection_resolution == 1280

        # Too low
        monkeypatch.setenv("DETECTION_RESOLUTION", "160")
        with pytest.raises(ValidationError):
            settings = Settings()

        # Too high
        monkeypatch.setenv("DETECTION_RESOLUTION", "1920")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_auto_scale_detection(self, test_config_env, monkeypatch):
        """Test auto_scale_detection boolean configuration."""
        from config import Settings

        monkeypatch.setenv("AUTO_SCALE_DETECTION", "true")
        settings = Settings()
        assert settings.auto_scale_detection is True

        monkeypatch.setenv("AUTO_SCALE_DETECTION", "false")
        settings = Settings()
        assert settings.auto_scale_detection is False

    def test_draw_on_frame(self, test_config_env, monkeypatch):
        """Test draw_on_frame boolean configuration."""
        from config import Settings

        monkeypatch.setenv("DRAW_ON_FRAME", "true")
        settings = Settings()
        assert settings.draw_on_frame is True

        monkeypatch.setenv("DRAW_ON_FRAME", "false")
        settings = Settings()
        assert settings.draw_on_frame is False

    def test_camera_urls(self, test_config_env, monkeypatch):
        """Test camera URL configuration."""
        from config import Settings

        monkeypatch.setenv("CAMERA1_URL", "rtsp://camera1.local:554/stream")
        monkeypatch.setenv("CAMERA2_URL", "rtsp://camera2.local:554/stream")
        monkeypatch.setenv("CAMERA3_URL", "rtsp://camera3.local:554/stream")

        settings = Settings()

        assert settings.camera1_url == "rtsp://camera1.local:554/stream"
        assert settings.camera2_url == "rtsp://camera2.local:554/stream"
        assert settings.camera3_url == "rtsp://camera3.local:554/stream"

    def test_model_path(self, test_config_env, monkeypatch):
        """Test model_path configuration."""
        from config import Settings

        monkeypatch.setenv("MODEL_PATH", "/custom/path/yolov8n.pt")
        settings = Settings()

        assert settings.model_path == "/custom/path/yolov8n.pt"

    def test_log_level(self, test_config_env, monkeypatch):
        """Test log_level configuration."""
        from config import Settings

        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        settings = Settings()
        assert settings.log_level == "DEBUG"

        monkeypatch.setenv("LOG_LEVEL", "WARNING")
        settings = Settings()
        assert settings.log_level == "WARNING"

    def test_port_alias(self, test_config_env, monkeypatch):
        """Test port can be set via alias."""
        from config import Settings

        # Using alias
        monkeypatch.setenv("WEBRTC_DETECTION_PORT", "9999")
        settings = Settings()
        assert settings.port == 9999

    def test_host_alias(self, test_config_env, monkeypatch):
        """Test host can be set via alias."""
        from config import Settings

        # Using alias
        monkeypatch.setenv("WEBRTC_DETECTION_HOST", "192.168.1.100")
        settings = Settings()
        assert settings.host == "192.168.1.100"
