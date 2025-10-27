"""Configuration loading and validation."""

from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import yaml


class CameraConfig(BaseModel):
    """Camera configuration."""

    id: str
    image: str
    height_m: Optional[float] = None  # Mount height above ground
    local_position: Optional[List[float]] = None  # Optional [x, y, z] position in meters


class GenerationConfig(BaseModel):
    """Generation parameters."""

    # Feature extraction
    feature_type: str = Field(default="sift", description="Feature detector: sift, orb, akaze")
    max_features: int = Field(default=8000, description="Maximum features per image")

    # Matching
    match_ratio_threshold: float = Field(default=0.7, description="Lowe's ratio test threshold")
    min_matches: int = Field(default=50, description="Minimum matches for pose estimation")

    # Reconstruction
    ransac_threshold: float = Field(default=2.0, description="RANSAC inlier threshold (pixels)")
    min_triangulation_angle: float = Field(default=3.0, description="Minimum triangulation angle (degrees)")

    # 2D projection
    ground_plane_tolerance: float = Field(default=0.5, description="Height tolerance for ground plane (meters)")
    grid_resolution_m: float = Field(default=0.05, description="Grid cell size (meters)")

    # Wall extraction
    min_wall_length_m: float = Field(default=0.5, description="Minimum wall length (meters)")
    wall_merge_threshold: float = Field(default=0.3, description="Merge nearby walls (meters)")
    wall_detection_threshold: float = Field(default=0.7, description="Wall detection confidence threshold")

    # Scale calibration
    use_known_distances: bool = Field(default=True, description="Use known distances for scale calibration")
    use_known_heights: bool = Field(default=True, description="Use known heights for scale calibration")

    # Output
    output_scale_px_per_m: int = Field(default=50, description="Pixels per meter in output")


class SiteMapConfig(BaseModel):
    """Complete site map generation configuration."""

    name: str
    description: str = ""
    images_dir: str
    cameras: List[CameraConfig]
    generation: GenerationConfig = Field(default_factory=GenerationConfig)


def load_config(config_path: Path) -> SiteMapConfig:
    """
    Load configuration from YAML file.

    Args:
        config_path: Path to YAML configuration file

    Returns:
        Validated configuration object
    """
    with open(config_path, 'r') as f:
        data = yaml.safe_load(f)

    return SiteMapConfig(**data)


def save_config(config: SiteMapConfig, output_path: Path):
    """
    Save configuration to YAML file.

    Args:
        config: Configuration object
        output_path: Path to save YAML file
    """
    with open(output_path, 'w') as f:
        yaml.dump(config.model_dump(), f, default_flow_style=False, sort_keys=False)
