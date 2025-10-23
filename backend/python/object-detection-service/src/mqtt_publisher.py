"""MQTT publisher for detection events."""

import json
import time
from typing import List, Dict, Any, Optional
from loguru import logger
import paho.mqtt.client as mqtt

from config import settings


class MQTTPublisher:
    """Publish object detection events to MQTT broker."""

    def __init__(self):
        """Initialize MQTT client."""
        # Use VERSION1 for backward compatibility with existing callbacks
        self.client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION1,
            client_id="object-detection-service"
        )
        self.connected = False

        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish

    def connect(self):
        """Connect to MQTT broker."""
        try:
            logger.info(f"Connecting to MQTT broker at {settings.mqtt_host}:{settings.mqtt_port}")
            self.client.connect(settings.mqtt_host, settings.mqtt_port, keepalive=60)
            self.client.loop_start()

        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise

    def disconnect(self):
        """Disconnect from MQTT broker."""
        logger.info("Disconnecting from MQTT broker")
        self.client.loop_stop()
        self.client.disconnect()

    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker."""
        if rc == 0:
            self.connected = True
            logger.info("Connected to MQTT broker")
        else:
            self.connected = False
            logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker."""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected disconnect from MQTT broker. Return code: {rc}")
        else:
            logger.info("Disconnected from MQTT broker")

    def _on_publish(self, client, userdata, mid):
        """Callback when message is published."""
        logger.debug(f"Message {mid} published")

    def publish_detections(self, camera_id: str, detections: List[Dict[str, Any]]):
        """
        Publish detection events to MQTT.

        Args:
            camera_id: Camera identifier
            detections: List of detection dictionaries
        """
        if not self.connected:
            logger.warning("Not connected to MQTT broker, skipping publish")
            return

        if not detections:
            return

        # Extract timing information from detections
        frame_timestamp = detections[0]["timestamp"] if detections else time.time()
        publish_timestamp = time.time()

        # Extract PTS metadata if available
        video_pts_ms = detections[0].get("video_pts_ms", 0.0) if detections else 0.0
        loop_count = detections[0].get("loop_count", 0) if detections else 0
        pts_based = detections[0].get("pts_based", False) if detections else False

        # Calculate actual processing latency (excluding sync offset)
        # frame_timestamp already includes the detection_delay_ms offset,
        # so we need to subtract it to get the real processing time
        actual_frame_time = frame_timestamp - (settings.detection_delay_ms / 1000.0)
        processing_latency_ms = (publish_timestamp - actual_frame_time) * 1000

        # Build detection message with comprehensive timestamp metadata
        message = {
            "camera_id": camera_id,
            "timestamp": frame_timestamp,  # Original frame timestamp
            "publish_timestamp": publish_timestamp,  # When message was published
            "detection_count": len(detections),
            "detections": detections,
            "timing": {
                "frame_timestamp": frame_timestamp,  # When frame was captured/processed
                "publish_timestamp": publish_timestamp,  # When MQTT message was sent
                "processing_latency_ms": round(processing_latency_ms, 2),  # Detection processing time
                "detection_delay_ms": settings.detection_delay_ms,  # Configured sync offset
                # PTS-based timing metadata
                "video_pts_ms": video_pts_ms,  # Video presentation timestamp
                "loop_count": loop_count,  # Number of loops detected
                "pts_based": pts_based,  # Whether using PTS-based timing
                "use_video_pts": settings.use_video_pts,  # Configuration flag
            }
        }

        # Publish to camera-specific topic
        topic = f"{settings.mqtt_topic_prefix}/{camera_id}"

        try:
            result = self.client.publish(
                topic,
                payload=json.dumps(message),
                qos=1,
                retain=False
            )

            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                logger.error(f"Failed to publish to {topic}: {result.rc}")
            else:
                logger.debug(f"Published {len(detections)} detections to {topic} (latency: {processing_latency_ms:.1f}ms)")

        except Exception as e:
            logger.error(f"Error publishing to MQTT: {e}")

    def publish_summary(self, camera_id: str, detections: List[Dict[str, Any]]):
        """
        Publish detection summary (grouped by class).

        Args:
            camera_id: Camera identifier
            detections: List of detection dictionaries
        """
        if not self.connected or not detections:
            return

        # Group detections by class
        class_counts = {}
        for det in detections:
            class_name = det["class_name"]
            class_counts[class_name] = class_counts.get(class_name, 0) + 1

        # Build summary message
        summary = {
            "camera_id": camera_id,
            "timestamp": time.time(),
            "total_detections": len(detections),
            "class_counts": class_counts
        }

        # Publish to summary topic
        topic = f"{settings.mqtt_topic_prefix}/{camera_id}/summary"

        try:
            self.client.publish(
                topic,
                payload=json.dumps(summary),
                qos=1,
                retain=True  # Retain last summary
            )
            logger.debug(f"Published summary to {topic}: {class_counts}")

        except Exception as e:
            logger.error(f"Error publishing summary to MQTT: {e}")
