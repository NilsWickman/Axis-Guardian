"""Site Map Generation Service - Package initialization."""

from .config import settings
from .depth_estimator import DepthEstimator, get_depth_estimator
from .coordinate_transform import CoordinateTransformer, CameraPosition, CameraIntrinsics
from .occupancy_mapper import OccupancyGrid, create_grid_from_cameras
from .wall_detector import WallDetector, WallSegment
from .fog_of_war import FogOfWarProcessor, FogOfWarRegion

__version__ = "1.0.0"

__all__ = [
    "settings",
    "DepthEstimator",
    "get_depth_estimator",
    "CoordinateTransformer",
    "CameraPosition",
    "CameraIntrinsics",
    "OccupancyGrid",
    "create_grid_from_cameras",
    "WallDetector",
    "WallSegment",
    "FogOfWarProcessor",
    "FogOfWarRegion",
]
