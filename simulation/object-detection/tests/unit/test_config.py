"""Unit tests for configuration management."""

import pytest
from pydantic import ValidationError


@pytest.mark.unit
class TestSettings:
    """Tests for Settings configuration class."""

    def test_default_values(self, test_config_env):
        """Test Settings loads with default values."""
        from config import Settings

        settings = Settings()

        # Verify defaults (from test_config_env fixture)
        assert settings.camera1_url == "rtsp://test-host:8554/camera1"
        assert settings.mqtt_host == "test-mqtt-host"
        assert settings.mqtt_port == 1883
        assert settings.confidence_threshold == 0.5
        assert settings.frame_skip == 2
        assert settings.max_fps == 15

    def test_confidence_threshold_validation(self, test_config_env, monkeypatch):
        """Test confidence threshold is validated (0.0-1.0)."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "0.75")
        settings = Settings()
        assert settings.confidence_threshold == 0.75

        # Invalid value (> 1.0) should use default or fail validation
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "1.5")
        with pytest.raises(ValidationError):
            settings = Settings()

        # Invalid value (< 0.0) should fail validation
        monkeypatch.setenv("CONFIDENCE_THRESHOLD", "-0.5")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_iou_threshold_validation(self, test_config_env, monkeypatch):
        """Test IOU threshold is validated (0.0-1.0)."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("IOU_THRESHOLD", "0.45")
        settings = Settings()
        assert settings.iou_threshold == 0.45

        # Invalid value should fail validation
        monkeypatch.setenv("IOU_THRESHOLD", "2.0")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_target_classes_property(self, test_config_env, monkeypatch):
        """Test target_classes property parses detect_classes string."""
        from config import Settings

        monkeypatch.setenv("DETECT_CLASSES", "person,car,truck,bus")
        settings = Settings()

        target_classes = settings.target_classes

        assert isinstance(target_classes, list)
        assert len(target_classes) == 4
        assert "person" in target_classes
        assert "car" in target_classes
        assert "truck" in target_classes
        assert "bus" in target_classes

    def test_target_classes_with_spaces(self, test_config_env, monkeypatch):
        """Test target_classes handles spaces correctly."""
        from config import Settings

        monkeypatch.setenv("DETECT_CLASSES", "person, car, truck , bus")
        settings = Settings()

        target_classes = settings.target_classes

        # Should strip whitespace
        assert "person" in target_classes
        assert "car" in target_classes
        assert "truck" in target_classes
        assert "bus" in target_classes

    def test_camera_urls_property(self, test_config_env):
        """Test camera_urls property returns dict of all camera URLs."""
        from config import Settings

        settings = Settings()
        camera_urls = settings.camera_urls

        assert isinstance(camera_urls, dict)
        assert "camera1" in camera_urls
        assert "camera2" in camera_urls
        assert "camera3" in camera_urls
        assert camera_urls["camera1"] == "rtsp://test-host:8554/camera1"
        assert camera_urls["camera2"] == "rtsp://test-host:8554/camera2"
        assert camera_urls["camera3"] == "rtsp://test-host:8554/camera3"

    def test_detection_delay_ms(self, test_config_env, monkeypatch):
        """Test detection_delay_ms can be positive, negative, or zero."""
        from config import Settings

        # Negative (typical for HLS)
        monkeypatch.setenv("DETECTION_DELAY_MS", "-15000")
        settings = Settings()
        assert settings.detection_delay_ms == -15000

        # Positive
        monkeypatch.setenv("DETECTION_DELAY_MS", "5000")
        settings = Settings()
        assert settings.detection_delay_ms == 5000

        # Zero
        monkeypatch.setenv("DETECTION_DELAY_MS", "0")
        settings = Settings()
        assert settings.detection_delay_ms == 0

    def test_use_video_pts(self, test_config_env, monkeypatch):
        """Test use_video_pts boolean configuration."""
        from config import Settings

        monkeypatch.setenv("USE_VIDEO_PTS", "true")
        settings = Settings()
        assert settings.use_video_pts is True

        monkeypatch.setenv("USE_VIDEO_PTS", "false")
        settings = Settings()
        assert settings.use_video_pts is False

    def test_adaptive_sync_settings(self, test_config_env, monkeypatch):
        """Test adaptive synchronization settings."""
        from config import Settings

        monkeypatch.setenv("ENABLE_ADAPTIVE_SYNC", "true")
        monkeypatch.setenv("SYNC_ADAPTATION_RATE", "0.5")
        monkeypatch.setenv("SYNC_MAX_CORRECTION_MS", "3000")
        monkeypatch.setenv("SYNC_TARGET_ERROR_MS", "300")

        settings = Settings()

        assert settings.enable_adaptive_sync is True
        assert settings.sync_adaptation_rate == 0.5
        assert settings.sync_max_correction_ms == 3000.0
        assert settings.sync_target_error_ms == 300.0

    def test_sync_adaptation_rate_validation(self, test_config_env, monkeypatch):
        """Test sync_adaptation_rate is validated (0.1-1.0)."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("SYNC_ADAPTATION_RATE", "0.5")
        settings = Settings()
        assert settings.sync_adaptation_rate == 0.5

        # Too low
        monkeypatch.setenv("SYNC_ADAPTATION_RATE", "0.05")
        with pytest.raises(ValidationError):
            settings = Settings()

        # Too high
        monkeypatch.setenv("SYNC_ADAPTATION_RATE", "1.5")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_pts_reset_threshold_validation(self, test_config_env, monkeypatch):
        """Test pts_reset_threshold_ms has minimum value."""
        from config import Settings

        # Valid value
        monkeypatch.setenv("PTS_RESET_THRESHOLD_MS", "5000")
        settings = Settings()
        assert settings.pts_reset_threshold_ms == 5000.0

        # Too low (< 1000)
        monkeypatch.setenv("PTS_RESET_THRESHOLD_MS", "500")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_frame_skip_minimum(self, test_config_env, monkeypatch):
        """Test frame_skip has minimum value of 1."""
        from config import Settings

        monkeypatch.setenv("FRAME_SKIP", "3")
        settings = Settings()
        assert settings.frame_skip == 3

        # Zero should fail
        monkeypatch.setenv("FRAME_SKIP", "0")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_max_fps_minimum(self, test_config_env, monkeypatch):
        """Test max_fps has minimum value of 1."""
        from config import Settings

        monkeypatch.setenv("MAX_FPS", "30")
        settings = Settings()
        assert settings.max_fps == 30

        # Zero should fail
        monkeypatch.setenv("MAX_FPS", "0")
        with pytest.raises(ValidationError):
            settings = Settings()

    def test_model_size_property(self, test_config_env, monkeypatch):
        """Test model_size property returns yolo_model_size."""
        from config import Settings

        monkeypatch.setenv("YOLO_MODEL_SIZE", "yolov8m")
        settings = Settings()

        assert settings.model_size == "yolov8m"

    def test_mqtt_configuration(self, test_config_env, monkeypatch):
        """Test MQTT configuration settings."""
        from config import Settings

        monkeypatch.setenv("MQTT_HOST", "mqtt.example.com")
        monkeypatch.setenv("MQTT_PORT", "8883")
        monkeypatch.setenv("MQTT_TOPIC_PREFIX", "test/detections")

        settings = Settings()

        assert settings.mqtt_host == "mqtt.example.com"
        assert settings.mqtt_port == 8883
        assert settings.mqtt_topic_prefix == "test/detections"

    def test_log_level(self, test_config_env, monkeypatch):
        """Test log_level configuration."""
        from config import Settings

        monkeypatch.setenv("LOG_LEVEL", "DEBUG")
        settings = Settings()
        assert settings.log_level == "DEBUG"

        monkeypatch.setenv("LOG_LEVEL", "INFO")
        settings = Settings()
        assert settings.log_level == "INFO"
