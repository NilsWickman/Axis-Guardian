"""Configuration for Site Map Generation Service."""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Site Map Generation Service settings."""

    # Server configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8091, description="Server port")

    # Depth estimation model configuration
    depth_model_name: str = Field(
        default="depth-anything/Depth-Anything-V2-Large-hf",
        description="HuggingFace model ID for depth estimation"
    )
    depth_model_cache_dir: Path = Field(
        default=Path(__file__).parent.parent / "models",
        description="Directory to cache downloaded models"
    )
    device: str = Field(
        default="cuda",
        description="Device for inference: 'cuda', 'cpu', or 'mps' (auto-detect if available)"
    )

    # Occupancy grid configuration
    grid_resolution_cm: float = Field(
        default=10.0,
        ge=1.0,
        le=100.0,
        description="Occupancy grid resolution in centimeters (10cm = 10 cells per meter)"
    )
    grid_default_size_m: float = Field(
        default=30.0,
        ge=10.0,
        le=200.0,
        description="Default grid size in meters (auto-expand if needed)"
    )

    # Wall detection configuration
    wall_detection_gradient_threshold: float = Field(
        default=0.3,
        ge=0.1,
        le=1.0,
        description="Gradient threshold for wall detection (higher = fewer walls detected)"
    )
    wall_min_length_m: float = Field(
        default=0.5,
        ge=0.1,
        le=5.0,
        description="Minimum wall length in meters"
    )
    wall_merge_distance_m: float = Field(
        default=0.2,
        ge=0.05,
        le=1.0,
        description="Distance threshold for merging collinear walls"
    )

    # Fog of war configuration
    fog_of_war_enabled: bool = Field(
        default=True,
        description="Enable fog of war with square room assumptions"
    )
    square_room_aspect_ratio_min: float = Field(
        default=0.7,
        description="Minimum aspect ratio for square room detection"
    )
    square_room_aspect_ratio_max: float = Field(
        default=1.3,
        description="Maximum aspect ratio for square room detection"
    )
    fog_confidence_threshold: float = Field(
        default=0.5,
        description="Confidence threshold below which areas are considered fog of war"
    )

    # Camera configuration
    camera_default_fov: float = Field(
        default=90.0,
        description="Default camera FOV in degrees (if not provided by camera)"
    )
    camera_default_resolution: tuple[int, int] = Field(
        default=(1920, 1080),
        description="Default camera resolution (width, height)"
    )
    max_view_distance_m: float = Field(
        default=20.0,
        description="Maximum view distance for cameras in meters"
    )

    # VAPIX API configuration
    vapix_timeout_s: float = Field(
        default=5.0,
        description="Timeout for VAPIX API requests in seconds"
    )
    vapix_default_port: int = Field(
        default=8090,
        description="Default VAPIX API port (simulator)"
    )

    # Output configuration
    output_dir: Path = Field(
        default=Path(__file__).parent.parent.parent.parent / "shared" / "site-maps" / "generated",
        description="Directory to save generated site maps"
    )
    output_scale_px_per_m: int = Field(
        default=60,
        description="Output scale in pixels per meter (matching frontend default)"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    class Config:
        # Use root .env file (project-wide configuration)
        env_file = Path(__file__).parent.parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        env_prefix = "SITEMAP_GEN_"
        extra = "ignore"


# Global settings instance
settings = Settings()
