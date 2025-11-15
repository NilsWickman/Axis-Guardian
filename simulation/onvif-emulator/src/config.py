"""Configuration management for ONVIF Camera Emulator."""

import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        # Point to root .env file for project-wide configuration
        env_file=Path(__file__).parent.parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra fields from shared .env file
    )

    # Camera Configuration
    camera_id: str = Field(default="camera1", description="Unique camera identifier")
    camera_registry_path: Path = Field(
        default=Path(__file__).parent.parent.parent / "config" / "cameras.yaml",
        description="Path to camera registry YAML file",
    )

    # ONVIF Service Configuration
    onvif_host: str = Field(default="0.0.0.0", description="ONVIF service bind host")
    onvif_port: int = Field(default=80, description="ONVIF service port")
    onvif_enable_auth: bool = Field(default=True, description="Enable ONVIF authentication")

    # Authentication
    onvif_username: str = Field(default="admin", description="ONVIF username")
    onvif_password: str = Field(default="axis123", description="ONVIF password")

    # MediaMTX Integration
    mediamtx_host: str = Field(default="host.docker.internal", description="MediaMTX host")
    mediamtx_rtsp_port: int = Field(default=8554, description="MediaMTX RTSP port")
    mediamtx_api_port: int = Field(default=9997, description="MediaMTX API port")

    # RTSP Stream URL (can be overridden per camera)
    rtsp_url: Optional[str] = Field(
        default=None, description="Override RTSP stream URL for this camera"
    )

    # Event Generation
    onvif_event_motion_interval: int = Field(
        default=45, description="Average interval between motion events (seconds)"
    )
    onvif_event_object_interval: int = Field(
        default=180, description="Average interval between object detection events (seconds)"
    )

    # WSDL Files
    wsdl_dir: Path = Field(
        default=Path(__file__).parent.parent / "wsdl",
        description="Directory containing ONVIF WSDL files",
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    # Preprocessed Data
    preprocessed_mode: bool = Field(default=True, description="Use preprocessed video/metadata")
    preprocessed_dir: Path = Field(
        default=Path("/data/preprocessed/720p"),
        description="Directory containing preprocessed videos and metadata"
    )
    preprocessed_quality: str = Field(default="720p", description="Preprocessed video quality")

    @property
    def rtsp_stream_url(self) -> str:
        """Get RTSP stream URL for this camera."""
        if self.rtsp_url:
            return self.rtsp_url
        return f"rtsp://{self.mediamtx_host}:{self.mediamtx_rtsp_port}/{self.camera_id}"

    @property
    def mediamtx_api_url(self) -> str:
        """Get MediaMTX API base URL."""
        return f"http://{self.mediamtx_host}:{self.mediamtx_api_port}"

    @property
    def preprocessed_video_path(self) -> Path:
        """Get preprocessed video path for this camera."""
        # Try camera-specific video name first
        video_name = f"{self.camera_id}-preprocessed.mp4"
        video_path = self.preprocessed_dir / video_name

        if video_path.exists():
            return video_path

        # Fallback: try to find any preprocessed video for this camera
        for ext in [".mp4", "-preprocessed.mp4"]:
            fallback = self.preprocessed_dir / f"{self.camera_id}{ext}"
            if fallback.exists():
                return fallback

        # Return expected path even if doesn't exist
        return video_path

    @property
    def preprocessed_metadata_path(self) -> Path:
        """Get preprocessed metadata path for this camera."""
        # Try .gz version first (compressed)
        metadata_name = f"{self.camera_id}-preprocessed.detections.json.gz"
        metadata_path = self.preprocessed_dir / metadata_name

        if metadata_path.exists():
            return metadata_path

        # Try uncompressed version
        metadata_name = f"{self.camera_id}-preprocessed.detections.json"
        metadata_path = self.preprocessed_dir / metadata_name

        if metadata_path.exists():
            return metadata_path

        # Fallback patterns
        for pattern in [
            f"{self.camera_id}.detections.json.gz",
            f"{self.camera_id}.detections.json",
        ]:
            fallback = self.preprocessed_dir / pattern
            if fallback.exists():
                return fallback

        # Return expected path even if doesn't exist
        return self.preprocessed_dir / f"{self.camera_id}-preprocessed.detections.json"


# Global settings instance
settings = Settings()
