"""Unit tests for adaptive timestamp synchronization."""

import pytest
import time
from unittest.mock import Mock, patch, MagicMock
import json

from sync_adjuster import SyncAdjuster, SyncFeedback, SyncManager


@pytest.mark.unit
class TestSyncFeedback:
    """Tests for SyncFeedback class."""

    def test_sync_feedback_initialization(self):
        """Test SyncFeedback creates object from dict."""
        data = {
            "camera_id": "camera1",
            "video_playback_time_s": 10.5,
            "video_pts_ms": 10500.0,
            "wall_clock_time": 1234567890.123,
            "hls_latency_ms": 15000.0,
            "loop_count": 2,
            "suggested_offset_ms": -15000.0,
            "measurement_quality": "good"
        }

        feedback = SyncFeedback(data)

        assert feedback.camera_id == "camera1"
        assert feedback.video_playback_time_s == 10.5
        assert feedback.video_pts_ms == 10500.0
        assert feedback.hls_latency_ms == 15000.0
        assert feedback.loop_count == 2
        assert feedback.suggested_offset_ms == -15000.0
        assert feedback.measurement_quality == "good"
        assert isinstance(feedback.timestamp, float)

    def test_sync_feedback_missing_fields(self):
        """Test SyncFeedback handles missing fields gracefully."""
        data = {"camera_id": "camera1"}

        feedback = SyncFeedback(data)

        assert feedback.camera_id == "camera1"
        assert feedback.video_playback_time_s == 0.0
        assert feedback.hls_latency_ms == 0.0
        assert feedback.suggested_offset_ms == 0.0
        assert feedback.measurement_quality == "poor"


@pytest.mark.unit
class TestSyncAdjuster:
    """Tests for SyncAdjuster class."""

    @patch('sync_adjuster.settings')
    def test_initialization(self, mock_settings):
        """Test SyncAdjuster initializes with correct defaults."""
        mock_settings.detection_delay_ms = -15000
        mock_settings.sync_adaptation_rate = 0.3

        adjuster = SyncAdjuster("camera1")

        assert adjuster.camera_id == "camera1"
        assert adjuster.current_offset_ms == -15000.0
        assert adjuster.target_offset_ms == -15000.0
        assert adjuster.ema_alpha == 0.3
        assert adjuster.feedback_count == 0
        assert adjuster.adjustment_count == 0
        assert adjuster.sync_quality == "unknown"

    @patch('sync_adjuster.settings')
    def test_process_feedback_poor_quality_ignored(self, mock_settings):
        """Test poor quality feedback is ignored."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3

        adjuster = SyncAdjuster("camera1")
        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -10000.0,
            "measurement_quality": "poor"
        })

        result = adjuster.process_feedback(feedback)

        assert result is False
        assert adjuster.feedback_count == 0
        assert adjuster.current_offset_ms == 0.0

    @patch('sync_adjuster.settings')
    def test_process_feedback_first_feedback(self, mock_settings):
        """Test first feedback is applied directly."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")
        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -2000.0,
            "hls_latency_ms": 15000.0,
            "measurement_quality": "good"
        })

        result = adjuster.process_feedback(feedback)

        assert result is True
        assert adjuster.feedback_count == 1
        assert adjuster.target_offset_ms == -2000.0
        assert adjuster.current_offset_ms == -2000.0
        assert adjuster.adjustment_count == 1

    @patch('sync_adjuster.settings')
    def test_process_feedback_ema_smoothing(self, mock_settings):
        """Test exponential moving average smoothing works correctly."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.5
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")

        # First feedback: -1000ms
        feedback1 = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -1000.0,
            "measurement_quality": "good"
        })
        adjuster.process_feedback(feedback1)
        assert adjuster.target_offset_ms == -1000.0

        # Second feedback: -2000ms
        # EMA: 0.5 * (-2000) + 0.5 * (-1000) = -1500
        feedback2 = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -2000.0,
            "measurement_quality": "good"
        })
        adjuster.process_feedback(feedback2)

        assert adjuster.target_offset_ms == -1500.0
        assert adjuster.feedback_count == 2

    @patch('sync_adjuster.settings')
    def test_process_feedback_max_correction_limit(self, mock_settings):
        """Test large corrections are clamped to max_correction_ms."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 2000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")

        # Suggest a very large offset
        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -10000.0,
            "measurement_quality": "good"
        })

        result = adjuster.process_feedback(feedback)

        assert result is True
        # Should be clamped to max_correction_ms
        assert adjuster.current_offset_ms == -2000.0

    @patch('sync_adjuster.settings')
    def test_process_feedback_small_adjustment_ignored(self, mock_settings):
        """Test adjustments < 100ms are ignored."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0

        adjuster = SyncAdjuster("camera1")

        # Small adjustment (< 100ms)
        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -50.0,
            "measurement_quality": "good"
        })

        result = adjuster.process_feedback(feedback)

        # Feedback is stored but adjustment not applied
        assert result is False
        assert adjuster.feedback_count == 1
        assert adjuster.current_offset_ms == 0.0
        assert adjuster.adjustment_count == 0

    @patch('sync_adjuster.settings')
    def test_get_adjusted_offset(self, mock_settings):
        """Test get_adjusted_offset returns current offset."""
        mock_settings.detection_delay_ms = -15000
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.enable_adaptive_sync = True

        adjuster = SyncAdjuster("camera1")
        adjuster.current_offset_ms = -12000.0

        offset = adjuster.get_adjusted_offset()

        assert offset == -12000.0

    @patch('sync_adjuster.settings')
    def test_sync_quality_assessment(self, mock_settings):
        """Test sync quality is correctly assessed."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")

        # Good quality (error < 500ms)
        adjuster.sync_error_ms = 300.0
        adjuster._update_sync_quality()
        assert adjuster.sync_quality == "good"

        # Fair quality (500ms <= error < 1500ms)
        adjuster.sync_error_ms = 1000.0
        adjuster._update_sync_quality()
        assert adjuster.sync_quality == "fair"

        # Poor quality (error >= 1500ms)
        adjuster.sync_error_ms = 2000.0
        adjuster._update_sync_quality()
        assert adjuster.sync_quality == "poor"

    @patch('sync_adjuster.settings')
    def test_get_status(self, mock_settings):
        """Test get_status returns correct status dictionary."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")
        adjuster.current_offset_ms = -12000.0
        adjuster.target_offset_ms = -12500.0
        adjuster.sync_error_ms = 500.0
        adjuster.sync_quality = "good"
        adjuster.feedback_count = 5
        adjuster.adjustment_count = 3

        # Process feedback to set last_feedback
        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": -12500.0,
            "hls_latency_ms": 15000.0,
            "measurement_quality": "good"
        })
        adjuster.process_feedback(feedback)

        status = adjuster.get_status()

        assert status["camera_id"] == "camera1"
        assert status["current_offset_ms"] == -12000.0
        assert status["target_offset_ms"] == -12500.0
        assert status["sync_error_ms"] == 500.0
        assert status["sync_quality"] == "fair"  # Changed after processing feedback
        assert status["feedback_count"] == 6
        assert status["adjustment_count"] == 4
        assert status["hls_latency_ms"] == 15000.0

    @pytest.mark.parametrize("initial_offset,suggested_offset,expected_direction", [
        (0, -5000, "negative"),
        (-10000, -5000, "positive"),
        (-5000, -5000, "none"),
    ])
    @patch('sync_adjuster.settings')
    def test_offset_adjustment_direction(self, mock_settings, initial_offset, suggested_offset, expected_direction):
        """Test offset adjustments work in both directions."""
        mock_settings.detection_delay_ms = initial_offset
        mock_settings.sync_adaptation_rate = 1.0  # Full adjustment for testing
        mock_settings.sync_max_correction_ms = 10000.0
        mock_settings.sync_target_error_ms = 500.0

        adjuster = SyncAdjuster("camera1")

        feedback = SyncFeedback({
            "camera_id": "camera1",
            "suggested_offset_ms": float(suggested_offset),
            "measurement_quality": "good"
        })

        initial = adjuster.current_offset_ms
        adjuster.process_feedback(feedback)
        final = adjuster.current_offset_ms

        if expected_direction == "negative":
            assert final < initial
        elif expected_direction == "positive":
            assert final > initial
        elif expected_direction == "none":
            assert final == initial


@pytest.mark.unit
class TestSyncManager:
    """Tests for SyncManager class."""

    def test_initialization(self):
        """Test SyncManager initializes correctly."""
        manager = SyncManager()

        assert manager.adjusters == {}
        assert manager.mqtt_client is None
        assert manager.connected is False

    def test_initialize_camera(self):
        """Test camera adjuster initialization."""
        manager = SyncManager()
        manager.initialize_camera("camera1")

        assert "camera1" in manager.adjusters
        assert isinstance(manager.adjusters["camera1"], SyncAdjuster)
        assert manager.adjusters["camera1"].camera_id == "camera1"

    def test_initialize_camera_idempotent(self):
        """Test initializing same camera multiple times doesn't create duplicates."""
        manager = SyncManager()
        manager.initialize_camera("camera1")
        adjuster1 = manager.adjusters["camera1"]

        manager.initialize_camera("camera1")
        adjuster2 = manager.adjusters["camera1"]

        assert adjuster1 is adjuster2

    @patch('sync_adjuster.settings')
    def test_get_offset_without_adjuster(self, mock_settings):
        """Test get_offset returns static offset when no adjuster exists."""
        mock_settings.detection_delay_ms = -15000
        mock_settings.enable_adaptive_sync = True

        manager = SyncManager()
        offset = manager.get_offset("camera_unknown")

        assert offset == -15000.0

    @patch('sync_adjuster.settings')
    def test_get_offset_with_adjuster(self, mock_settings):
        """Test get_offset returns dynamic offset from adjuster."""
        mock_settings.detection_delay_ms = -15000
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.enable_adaptive_sync = True

        manager = SyncManager()
        manager.initialize_camera("camera1")
        manager.adjusters["camera1"].current_offset_ms = -12000.0

        offset = manager.get_offset("camera1")

        assert offset == -12000.0

    @patch('sync_adjuster.settings')
    def test_get_offset_adaptive_sync_disabled(self, mock_settings):
        """Test get_offset returns static offset when adaptive sync is disabled."""
        mock_settings.detection_delay_ms = -15000
        mock_settings.enable_adaptive_sync = False

        manager = SyncManager()
        manager.initialize_camera("camera1")
        manager.adjusters["camera1"].current_offset_ms = -12000.0

        offset = manager.get_offset("camera1")

        # Should return static offset, not adjuster offset
        assert offset == -15000.0

    @patch('sync_adjuster.mqtt.Client')
    @patch('sync_adjuster.settings')
    def test_connect_mqtt(self, mock_settings, mock_mqtt_class):
        """Test MQTT connection setup."""
        mock_settings.enable_adaptive_sync = True
        mock_settings.mqtt_host = "localhost"
        mock_settings.mqtt_port = 1883

        mock_client = MagicMock()
        mock_mqtt_class.return_value = mock_client

        manager = SyncManager()
        manager.connect_mqtt()

        # Verify MQTT client was created and configured
        mock_mqtt_class.assert_called_once()
        mock_client.connect.assert_called_once_with("localhost", 1883, keepalive=60)
        mock_client.loop_start.assert_called_once()

    @patch('sync_adjuster.settings')
    def test_connect_mqtt_disabled(self, mock_settings):
        """Test MQTT connection skipped when adaptive sync is disabled."""
        mock_settings.enable_adaptive_sync = False

        manager = SyncManager()
        manager.connect_mqtt()

        assert manager.mqtt_client is None

    @patch('sync_adjuster.settings')
    def test_on_message_creates_adjuster(self, mock_settings):
        """Test _on_message creates adjuster for new camera."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0

        manager = SyncManager()

        # Simulate MQTT message
        msg = Mock()
        msg.payload = json.dumps({
            "camera_id": "camera1",
            "suggested_offset_ms": -2000.0,
            "measurement_quality": "good"
        }).encode()

        manager._on_message(None, None, msg)

        # Verify adjuster was created
        assert "camera1" in manager.adjusters

    @patch('sync_adjuster.settings')
    def test_on_message_processes_feedback(self, mock_settings):
        """Test _on_message processes feedback correctly."""
        mock_settings.detection_delay_ms = 0
        mock_settings.sync_adaptation_rate = 0.3
        mock_settings.sync_max_correction_ms = 5000.0
        mock_settings.sync_target_error_ms = 500.0
        mock_settings.mqtt_topic_prefix = "surveillance/detections"

        manager = SyncManager()
        manager.initialize_camera("camera1")

        # Simulate MQTT message
        msg = Mock()
        msg.payload = json.dumps({
            "camera_id": "camera1",
            "suggested_offset_ms": -2000.0,
            "hls_latency_ms": 15000.0,
            "measurement_quality": "good"
        }).encode()

        manager._on_message(None, None, msg)

        # Verify feedback was processed
        adjuster = manager.adjusters["camera1"]
        assert adjuster.feedback_count == 1
        assert adjuster.current_offset_ms == -2000.0
