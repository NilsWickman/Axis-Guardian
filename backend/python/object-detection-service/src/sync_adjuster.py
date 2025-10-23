"""Adaptive synchronization - dynamically adjust detection timestamps based on video feedback."""

import time
from typing import Dict, Optional
from loguru import logger
import paho.mqtt.client as mqtt
import json

from config import settings


class SyncFeedback:
    """Parsed sync feedback from frontend."""

    def __init__(self, data: Dict):
        self.camera_id: str = data.get("camera_id", "")
        self.video_playback_time_s: float = data.get("video_playback_time_s", 0.0)
        self.video_pts_ms: float = data.get("video_pts_ms", 0.0)
        self.wall_clock_time: float = data.get("wall_clock_time", 0.0)
        self.hls_latency_ms: float = data.get("hls_latency_ms", 0.0)
        self.loop_count: int = data.get("loop_count", 0)
        self.suggested_offset_ms: float = data.get("suggested_offset_ms", 0.0)
        self.measurement_quality: str = data.get("measurement_quality", "poor")
        self.timestamp: float = time.time()


class SyncAdjuster:
    """Dynamically adjust detection timestamps based on video playback feedback."""

    def __init__(self, camera_id: str):
        """
        Initialize sync adjuster for a camera.

        Args:
            camera_id: Camera identifier
        """
        self.camera_id = camera_id

        # Current dynamic offset (milliseconds)
        self.current_offset_ms: float = float(settings.detection_delay_ms)

        # Target offset from feedback
        self.target_offset_ms: float = self.current_offset_ms

        # Exponential moving average for smoothing
        self.ema_alpha: float = settings.sync_adaptation_rate

        # Feedback tracking
        self.last_feedback: Optional[SyncFeedback] = None
        self.last_feedback_time: float = 0.0
        self.feedback_count: int = 0
        self.adjustment_count: int = 0

        # Sync quality metrics
        self.sync_error_ms: float = 0.0
        self.sync_quality: str = "unknown"

        logger.info(
            f"{self.camera_id}: Sync adjuster initialized "
            f"(initial offset: {self.current_offset_ms}ms, "
            f"adaptation rate: {self.ema_alpha})"
        )

    def process_feedback(self, feedback: SyncFeedback) -> bool:
        """
        Process sync feedback and update offset.

        Args:
            feedback: Parsed sync feedback from frontend

        Returns:
            True if offset was adjusted, False otherwise
        """
        # Validate feedback
        if feedback.measurement_quality == "poor":
            logger.debug(f"{self.camera_id}: Ignoring poor quality feedback")
            return False

        # Store feedback
        self.last_feedback = feedback
        self.last_feedback_time = time.time()
        self.feedback_count += 1

        # Extract suggested offset
        suggested_offset = feedback.suggested_offset_ms

        # Update target with exponential moving average
        if self.feedback_count == 1:
            # First feedback - use directly
            self.target_offset_ms = suggested_offset
        else:
            # Apply EMA smoothing
            self.target_offset_ms = (
                self.ema_alpha * suggested_offset +
                (1 - self.ema_alpha) * self.target_offset_ms
            )

        # Calculate adjustment needed
        adjustment = self.target_offset_ms - self.current_offset_ms

        # Apply bounds checking (prevent large sudden jumps)
        max_adjustment = settings.sync_max_correction_ms
        if abs(adjustment) > max_adjustment:
            adjustment = max_adjustment if adjustment > 0 else -max_adjustment
            logger.warning(
                f"{self.camera_id}: Large sync correction clamped: "
                f"{self.target_offset_ms - self.current_offset_ms:.0f}ms → {adjustment:.0f}ms"
            )

        # Apply adjustment only if significant (> 100ms)
        if abs(adjustment) > 100:
            old_offset = self.current_offset_ms
            self.current_offset_ms += adjustment
            self.adjustment_count += 1

            logger.info(
                f"{self.camera_id}: Sync offset adjusted: "
                f"{old_offset:.0f}ms → {self.current_offset_ms:.0f}ms "
                f"(HLS latency: {feedback.hls_latency_ms:.0f}ms, "
                f"quality: {feedback.measurement_quality})"
            )

            # Calculate sync error
            self.sync_error_ms = abs(adjustment)
            self._update_sync_quality()

            return True

        return False

    def get_adjusted_offset(self) -> float:
        """
        Get current dynamic offset in milliseconds.

        Returns:
            Current offset in milliseconds
        """
        # Check if feedback is stale (> 10 seconds old)
        if settings.enable_adaptive_sync and self.last_feedback_time > 0:
            age = time.time() - self.last_feedback_time
            if age > 10.0:
                logger.debug(
                    f"{self.camera_id}: Sync feedback stale ({age:.1f}s), "
                    f"using current offset: {self.current_offset_ms:.0f}ms"
                )

        return self.current_offset_ms

    def _update_sync_quality(self):
        """Update sync quality assessment based on error."""
        if self.sync_error_ms < settings.sync_target_error_ms:
            self.sync_quality = "good"
        elif self.sync_error_ms < settings.sync_target_error_ms * 3:
            self.sync_quality = "fair"
        else:
            self.sync_quality = "poor"

    def get_status(self) -> Dict:
        """
        Get sync status for monitoring/debugging.

        Returns:
            Dictionary with sync status
        """
        return {
            "camera_id": self.camera_id,
            "current_offset_ms": round(self.current_offset_ms, 1),
            "target_offset_ms": round(self.target_offset_ms, 1),
            "sync_error_ms": round(self.sync_error_ms, 1),
            "sync_quality": self.sync_quality,
            "feedback_count": self.feedback_count,
            "adjustment_count": self.adjustment_count,
            "last_feedback_age_s": round(time.time() - self.last_feedback_time, 1) if self.last_feedback_time > 0 else None,
            "hls_latency_ms": round(self.last_feedback.hls_latency_ms, 1) if self.last_feedback else None,
        }


class SyncManager:
    """Manage sync adjusters for all cameras and handle MQTT communication."""

    def __init__(self):
        """Initialize sync manager."""
        self.adjusters: Dict[str, SyncAdjuster] = {}
        self.mqtt_client: Optional[mqtt.Client] = None
        self.connected: bool = False

    def initialize_camera(self, camera_id: str):
        """
        Initialize sync adjuster for a camera.

        Args:
            camera_id: Camera identifier
        """
        if camera_id not in self.adjusters:
            self.adjusters[camera_id] = SyncAdjuster(camera_id)
            logger.info(f"Initialized sync adjuster for {camera_id}")

    def connect_mqtt(self):
        """Connect to MQTT broker for receiving sync feedback."""
        if not settings.enable_adaptive_sync:
            logger.info("Adaptive sync disabled, skipping MQTT connection")
            return

        try:
            self.mqtt_client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION1,
                client_id="sync-manager"
            )

            self.mqtt_client.on_connect = self._on_connect
            self.mqtt_client.on_message = self._on_message

            self.mqtt_client.connect(settings.mqtt_host, settings.mqtt_port, keepalive=60)
            self.mqtt_client.loop_start()

            logger.info("Sync manager connected to MQTT broker")
        except Exception as e:
            logger.error(f"Failed to connect sync manager to MQTT: {e}")

    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker."""
        if rc == 0:
            self.connected = True
            # Subscribe to all sync feedback topics
            topic = f"{settings.mqtt_topic_prefix.replace('/detections', '/sync')}/+/feedback"
            client.subscribe(topic)
            logger.info(f"Subscribed to sync feedback: {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")

    def _on_message(self, client, userdata, msg):
        """Callback when sync feedback message received."""
        try:
            # Parse feedback
            data = json.loads(msg.payload.decode())
            feedback = SyncFeedback(data)

            # Initialize adjuster if needed
            if feedback.camera_id not in self.adjusters:
                self.initialize_camera(feedback.camera_id)

            # Process feedback
            adjuster = self.adjusters[feedback.camera_id]
            adjusted = adjuster.process_feedback(feedback)

            # Publish status update if offset changed
            if adjusted:
                self._publish_status(feedback.camera_id)

        except Exception as e:
            logger.error(f"Error processing sync feedback: {e}")

    def _publish_status(self, camera_id: str):
        """Publish sync status to MQTT."""
        if not self.mqtt_client or not self.connected:
            return

        adjuster = self.adjusters.get(camera_id)
        if not adjuster:
            return

        topic = f"{settings.mqtt_topic_prefix.replace('/detections', '/sync')}/{camera_id}/status"
        status = adjuster.get_status()

        try:
            self.mqtt_client.publish(topic, json.dumps(status), qos=0, retain=True)
        except Exception as e:
            logger.error(f"Error publishing sync status: {e}")

    def get_offset(self, camera_id: str) -> float:
        """
        Get current dynamic offset for a camera.

        Args:
            camera_id: Camera identifier

        Returns:
            Current offset in milliseconds
        """
        if not settings.enable_adaptive_sync:
            return float(settings.detection_delay_ms)

        adjuster = self.adjusters.get(camera_id)
        if adjuster:
            return adjuster.get_adjusted_offset()

        # Fallback to static offset
        return float(settings.detection_delay_ms)

    def disconnect(self):
        """Disconnect from MQTT broker."""
        if self.mqtt_client and self.connected:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            logger.info("Sync manager disconnected from MQTT")


# Global sync manager instance
sync_manager = SyncManager()
