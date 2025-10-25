"""Configuration management for object detection service."""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Camera streams
    camera1_url: str = Field(default="rtsp://localhost:8554/camera1")
    camera2_url: str = Field(default="rtsp://localhost:8554/camera2")
    camera3_url: str = Field(default="rtsp://localhost:8554/camera3")

    # MQTT configuration
    mqtt_host: str = Field(default="localhost")
    mqtt_port: int = Field(default=1883)
    mqtt_topic_prefix: str = Field(default="surveillance/detections")

    # Detection parameters
    confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    iou_threshold: float = Field(default=0.45, ge=0.0, le=1.0)
    yolo_model_path: str = Field(default="../../../../shared/models/yolov8n.pt", alias="model_path")
    yolo_model_size: str = Field(default="yolov8n", alias="model_size")  # Kept for backward compatibility

    # Target classes to detect
    detect_classes: str = Field(default="person,car,truck,bus,motorbike,bicycle")

    # Performance settings
    frame_skip: int = Field(default=2, ge=1)
    max_fps: int = Field(default=15, ge=1)

    # Timestamp synchronization
    # Add delay to detection timestamps to compensate for video player latency (in milliseconds)
    # Positive values delay detections, negative values advance them
    # Typical HLS latency is 6000-30000ms, WebRTC is 200-2000ms, RTSP is 200-500ms
    detection_delay_ms: int = Field(default=0)

    # PTS-based timestamp tracking (for looped videos)
    # Use video presentation timestamps instead of wall-clock time
    # This prevents timestamp drift when videos loop
    use_video_pts: bool = Field(default=True)

    # PTS reset threshold for loop detection (milliseconds)
    # When PTS jumps backward by more than this amount, a loop is detected
    # Should be ~50% of video duration to avoid false positives
    pts_reset_threshold_ms: float = Field(default=5000.0, ge=1000.0)

    # Adaptive synchronization (bidirectional feedback loop)
    # Dynamically adjust timestamps based on real-time HLS latency measurements
    enable_adaptive_sync: bool = Field(default=True)

    # Adaptation rate for exponential moving average (0-1)
    # Higher = faster adaptation but more jitter, Lower = smoother but slower
    # Recommended: 0.3 for stable networks, 0.5 for variable networks
    sync_adaptation_rate: float = Field(default=0.3, ge=0.1, le=1.0)

    # Maximum single offset correction (milliseconds)
    # Prevents wild swings from erroneous measurements
    sync_max_correction_ms: float = Field(default=5000.0, ge=500.0)

    # Target sync error threshold (milliseconds)
    # Error below this is considered "good" quality
    sync_target_error_ms: float = Field(default=500.0, ge=100.0)

    # Logging
    log_level: str = Field(default="INFO")

    class Config:
        # Use root .env file (project-wide configuration)
        env_file = "../../../../.env"
        case_sensitive = False
        populate_by_name = True
        protected_namespaces = ()
        extra = "ignore"  # Ignore extra fields from shared .env

    @property
    def model_size(self) -> str:
        """Get model size."""
        return self.yolo_model_size

    @property
    def target_classes(self) -> List[str]:
        """Parse detect_classes string into list."""
        return [cls.strip() for cls in self.detect_classes.split(",")]

    @property
    def camera_urls(self) -> dict:
        """Get all camera URLs as dictionary."""
        return {
            "camera1": self.camera1_url,
            "camera2": self.camera2_url,
            "camera3": self.camera3_url,
        }


# Global settings instance
settings = Settings()
