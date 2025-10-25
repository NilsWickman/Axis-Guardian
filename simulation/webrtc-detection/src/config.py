"""Configuration for WebRTC Detection Service."""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """WebRTC Detection Service settings."""

    # Server configuration
    host: str = Field(default="0.0.0.0", description="Server host", alias="webrtc_detection_host")
    port: int = Field(default=8080, description="Server port", alias="webrtc_detection_port")

    # WebRTC ICE servers
    stun_server: str = Field(
        default="stun:stun.l.google.com:19302", description="STUN server URL"
    )
    turn_server: Optional[str] = Field(default=None, description="TURN server URL")
    turn_username: Optional[str] = Field(default=None, description="TURN username")
    turn_password: Optional[str] = Field(default=None, description="TURN password")

    # Detection configuration
    model_path: str = Field(default="../../../../shared/models/yolov8n.pt", description="YOLOv8 model path")
    confidence_threshold: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Detection confidence threshold"
    )
    iou_threshold: float = Field(
        default=0.45, ge=0.0, le=1.0, description="NMS IOU threshold"
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
        default=True, description="Draw bounding boxes directly on video frames"
    )

    # Camera sources
    camera1_url: str = Field(
        default="rtsp://localhost:8554/camera1", description="Camera 1 RTSP URL (Auditorium HC3)"
    )
    camera2_url: str = Field(
        default="rtsp://localhost:8554/camera2", description="Camera 2 RTSP URL (Auditorium HC4)"
    )
    camera3_url: str = Field(
        default="rtsp://localhost:8554/camera3", description="Camera 3 RTSP URL (Auditorium IP2)"
    )
    camera4_url: str = Field(
        default="rtsp://localhost:8554/camera4", description="Camera 4 RTSP URL (Auditorium IP5)"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

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
