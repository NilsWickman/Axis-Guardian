"""Configuration for WebRTC Detection Service."""

import os
from enum import Enum
from pathlib import Path
from typing import Optional, Dict
from pydantic_settings import BaseSettings
from pydantic import Field


class InterfaceMode(str, Enum):
    """Camera interface mode enumeration."""

    RTSP_ONLY = "rtsp_only"          # Raw RTSP feed, no detection
    METADATA_ONLY = "metadata_only"   # Metadata via data channel/MQTT, no video
    VIDEO_METADATA = "video_metadata" # Video + metadata, no bounding boxes
    VIDEO_BOXES = "video_boxes"       # Video with bounding boxes + metadata (default)


class Settings(BaseSettings):
    """WebRTC Detection Service settings."""

    # Server configuration
    host: str = Field(default="0.0.0.0", description="Server host", alias="webrtc_detection_host")
    port: int = Field(default=8080, description="Server port", alias="webrtc_detection_port")

    # MediaMTX configuration
    mediamtx_host: str = Field(default="localhost", description="MediaMTX host")
    mediamtx_rtsp_port: int = Field(default=8554, description="MediaMTX RTSP port")
    mediamtx_api_port: int = Field(default=9997, description="MediaMTX API port")

    # WebRTC ICE servers
    stun_server: str = Field(
        default="stun:stun.l.google.com:19302", description="STUN server URL"
    )
    turn_server: Optional[str] = Field(default=None, description="TURN server URL")
    turn_username: Optional[str] = Field(default=None, description="TURN username")
    turn_password: Optional[str] = Field(default=None, description="TURN password")

    # Detection configuration
    model_path: str = Field(
        default="../../../../shared/models/yolov8n.pt",
        description="YOLOv8 model path (use REALTIME_MODEL_PATH env var)",
        alias="realtime_model_path"
    )
    confidence_threshold: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Detection confidence threshold (legacy, use detection_confidence_threshold for tracking)"
    )
    iou_threshold: float = Field(
        default=0.45, ge=0.0, le=1.0, description="NMS IOU threshold"
    )

    # Two-tier confidence system for tracking
    two_tier_confidence_enabled: bool = Field(
        default=True, description="Enable two-tier confidence filtering with tracking"
    )
    detection_confidence_threshold: float = Field(
        default=0.25, ge=0.0, le=1.0,
        description="YOLO output threshold - lower to capture potential track matches"
    )
    new_track_confidence_threshold: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Minimum confidence to START a new track (higher = stricter)"
    )
    frame_skip: int = Field(
        default=1, ge=1, description="Process every Nth frame (1 = every frame)"
    )
    max_fps: int = Field(
        default=30, ge=1, le=60, description="Maximum processing FPS"
    )
    detection_resolution: int = Field(
        default=640, ge=320, le=1280, description="Resolution for YOLO inference (width)"
    )
    auto_scale_detection: bool = Field(
        default=True, description="Automatically scale down high-res frames for detection"
    )
    draw_on_frame: bool = Field(
        default=True, description="Draw bounding boxes directly on video frames (deprecated, use camera_interface_mode)"
    )

    # Object tracking configuration
    enable_tracking: bool = Field(
        default=True, description="Enable object tracking for persistent IDs across frames"
    )
    track_activation_threshold: float = Field(
        default=0.25, ge=0.0, le=1.0,
        description="ByteTrack internal threshold - should match detection_confidence_threshold"
    )
    lost_track_buffer: int = Field(
        default=30, ge=1, le=120,
        description="Number of frames to keep lost tracks before deletion"
    )
    minimum_matching_threshold: float = Field(
        default=0.7, ge=0.0, le=1.0,
        description="Minimum IOU for matching detections to tracks (higher = stricter)"
    )
    track_history_length: int = Field(
        default=10, ge=1, le=30,
        description="Number of frames to use for temporal smoothing"
    )

    # Confidence boosting for stable tracks
    confidence_boost_enabled: bool = Field(
        default=True, description="Enable confidence boosting for stable tracked objects"
    )
    max_confidence_boost: float = Field(
        default=0.15, ge=0.0, le=0.5,
        description="Maximum confidence boost for stable tracks (linear ramp over 30 frames)"
    )

    # Interface mode configuration
    camera_interface_mode: InterfaceMode = Field(
        default=InterfaceMode.VIDEO_BOXES,
        description="Default camera interface mode for all cameras"
    )
    camera1_interface_mode: Optional[InterfaceMode] = Field(
        default=None, description="Camera 1 interface mode override"
    )
    camera2_interface_mode: Optional[InterfaceMode] = Field(
        default=None, description="Camera 2 interface mode override"
    )
    camera3_interface_mode: Optional[InterfaceMode] = Field(
        default=None, description="Camera 3 interface mode override"
    )
    camera4_interface_mode: Optional[InterfaceMode] = Field(
        default=None, description="Camera 4 interface mode override"
    )

    # Camera sources (defaults use mediamtx_host, can be overridden via env vars)
    camera1_url: Optional[str] = Field(
        default=None, description="Camera 1 RTSP URL (Auditorium HC3)"
    )
    camera2_url: Optional[str] = Field(
        default=None, description="Camera 2 RTSP URL (Auditorium HC4)"
    )
    camera3_url: Optional[str] = Field(
        default=None, description="Camera 3 RTSP URL (Auditorium IP2)"
    )
    camera4_url: Optional[str] = Field(
        default=None, description="Camera 4 RTSP URL (Auditorium IP5)"
    )

    def get_camera_url(self, camera_id: str) -> str:
        """Get camera RTSP URL, building from mediamtx_host if not explicitly set."""
        url_attr = f"{camera_id}_url"
        url = getattr(self, url_attr, None)
        if url:
            return url
        # Build URL from mediamtx_host
        return f"rtsp://{self.mediamtx_host}:{self.mediamtx_rtsp_port}/{camera_id}"

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    def get_interface_mode(self, camera_id: str) -> InterfaceMode:
        """
        Get the interface mode for a specific camera.

        Args:
            camera_id: Camera identifier (e.g., "camera1", "camera2")

        Returns:
            InterfaceMode for the specified camera (per-camera override or default)
        """
        # Check for per-camera override
        override_attr = f"{camera_id}_interface_mode"
        if hasattr(self, override_attr):
            override = getattr(self, override_attr)
            if override is not None:
                return override

        # Fall back to default
        return self.camera_interface_mode

    class Config:
        # Use root .env file (project-wide configuration)
        env_file = Path(__file__).parent.parent.parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        populate_by_name = True
        extra = "ignore"  # Ignore extra fields from shared .env
        protected_namespaces = ()  # Allow model_* field names


# Global settings instance
settings = Settings()
