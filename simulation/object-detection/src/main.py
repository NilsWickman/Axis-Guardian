"""Object detection service main application."""

import signal
import sys
from typing import List, Dict, Any
from loguru import logger
import numpy as np

from config import settings
from detector import ObjectDetector
from stream_processor import StreamProcessor
from mqtt_publisher import MQTTPublisher
from sync_adjuster import sync_manager


class DetectionService:
    """Main object detection service orchestrator."""

    def __init__(self):
        """Initialize detection service."""
        self.detector = ObjectDetector()
        self.mqtt_publisher = MQTTPublisher()
        self.stream_processors: List[StreamProcessor] = []
        self.running = False

    def detection_callback(self, camera_id: str, detections: List[Dict[str, Any]], frame: np.ndarray):
        """
        Callback invoked when detections occur.

        Args:
            camera_id: Camera identifier
            detections: List of detections
            frame: Current video frame
        """
        # Log detections
        class_summary = {}
        for det in detections:
            class_name = det["class_name"]
            class_summary[class_name] = class_summary.get(class_name, 0) + 1

        logger.info(f"{camera_id}: Detected {class_summary}")

        # Publish to MQTT
        self.mqtt_publisher.publish_detections(camera_id, detections)
        self.mqtt_publisher.publish_summary(camera_id, detections)

    def start(self):
        """Start the detection service."""
        logger.info("=" * 60)
        logger.info("Starting Object Detection Service")
        logger.info("=" * 60)

        # Connect to MQTT broker
        try:
            self.mqtt_publisher.connect()
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            return

        # Initialize adaptive sync manager
        if settings.enable_adaptive_sync:
            try:
                sync_manager.connect_mqtt()
                for camera_id in settings.camera_urls.keys():
                    sync_manager.initialize_camera(camera_id)
                logger.info("Adaptive sync manager initialized")
            except Exception as e:
                logger.error(f"Failed to initialize sync manager: {e}")
                # Continue without adaptive sync
                settings.enable_adaptive_sync = False

        # Create stream processors for each camera
        for camera_id, rtsp_url in settings.camera_urls.items():
            processor = StreamProcessor(camera_id, rtsp_url, self.detector)
            processor.set_detection_callback(self.detection_callback)
            self.stream_processors.append(processor)

        # Start all stream processors
        for processor in self.stream_processors:
            processor.start()

        self.running = True
        logger.info(f"Detection service started with {len(self.stream_processors)} cameras")
        logger.info(f"Publishing detections to MQTT: {settings.mqtt_topic_prefix}/<camera_id>")

        # Keep main thread alive
        try:
            signal.pause()
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
            self.stop()

    def stop(self):
        """Stop the detection service."""
        if not self.running:
            return

        logger.info("Stopping detection service...")

        # Stop all stream processors
        for processor in self.stream_processors:
            processor.stop()

        # Disconnect from MQTT
        self.mqtt_publisher.disconnect()

        # Disconnect sync manager
        if settings.enable_adaptive_sync:
            try:
                sync_manager.disconnect()
                logger.info("Adaptive sync manager disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting sync manager: {e}")

        self.running = False
        logger.info("Detection service stopped")


def setup_logging():
    """Configure logging."""
    logger.remove()  # Remove default handler

    # Add console handler
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level=settings.log_level
    )

    # Add file handler
    logger.add(
        "logs/detection-service_{time}.log",
        rotation="500 MB",
        retention="10 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
    )


def signal_handler(signum, frame):
    """Handle termination signals."""
    logger.info(f"Received signal {signum}")
    sys.exit(0)


def main():
    """Main entry point."""
    # Setup logging
    setup_logging()

    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create and start service
    service = DetectionService()

    try:
        service.start()
    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        service.stop()
        sys.exit(1)


if __name__ == "__main__":
    main()
