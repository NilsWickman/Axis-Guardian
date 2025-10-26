"""Occupancy grid mapping for site map generation."""

import numpy as np
from typing import Tuple, Optional, List
from dataclasses import dataclass
import logging

from .config import settings
from .coordinate_transform import CoordinateTransformer

logger = logging.getLogger(__name__)


@dataclass
class OccupancyCell:
    """Single cell in the occupancy grid."""

    occupied: float = 0.0  # Probability of occupancy [0, 1]
    explored: bool = False  # Whether this cell has been observed by any camera
    count: int = 0  # Number of observations


class OccupancyGrid:
    """2D occupancy grid for mapping the environment."""

    def __init__(
        self,
        resolution_m: float,
        width_m: float,
        height_m: float,
        origin_x: float = 0.0,
        origin_y: float = 0.0
    ):
        """
        Initialize occupancy grid.

        Args:
            resolution_m: Grid resolution in meters (cell size)
            width_m: Grid width in meters
            height_m: Grid height in meters
            origin_x: Origin x-coordinate in world space
            origin_y: Origin y-coordinate in world space
        """
        self.resolution_m = resolution_m
        self.width_m = width_m
        self.height_m = height_m
        self.origin_x = origin_x
        self.origin_y = origin_y

        # Grid dimensions in cells
        self.width_cells = int(np.ceil(width_m / resolution_m))
        self.height_cells = int(np.ceil(height_m / resolution_m))

        # Occupancy data
        self.occupancy = np.zeros((self.height_cells, self.width_cells), dtype=np.float32)
        self.explored = np.zeros((self.height_cells, self.width_cells), dtype=bool)
        self.count = np.zeros((self.height_cells, self.width_cells), dtype=np.int32)

        logger.info(f"Occupancy grid initialized: {self.width_cells}x{self.height_cells} cells "
                   f"({width_m}x{height_m}m @ {resolution_m}m resolution)")

    def world_to_grid(self, x: float, y: float) -> Tuple[int, int]:
        """
        Convert world coordinates to grid indices.

        Args:
            x: World x-coordinate (meters)
            y: World y-coordinate (meters)

        Returns:
            (row, col) grid indices
        """
        col = int((x - self.origin_x) / self.resolution_m)
        row = int((y - self.origin_y) / self.resolution_m)
        return row, col

    def grid_to_world(self, row: int, col: int) -> Tuple[float, float]:
        """
        Convert grid indices to world coordinates (cell center).

        Args:
            row: Grid row index
            col: Grid column index

        Returns:
            (x, y) world coordinates (meters)
        """
        x = self.origin_x + (col + 0.5) * self.resolution_m
        y = self.origin_y + (row + 0.5) * self.resolution_m
        return x, y

    def is_valid_cell(self, row: int, col: int) -> bool:
        """Check if grid cell is within bounds."""
        return 0 <= row < self.height_cells and 0 <= col < self.width_cells

    def update_from_depth_map(
        self,
        depth_map: np.ndarray,
        transformer: CoordinateTransformer,
        sample_rate: int = 10
    ) -> np.ndarray:
        """
        Update occupancy grid from depth map and camera transform.

        Args:
            depth_map: Depth map (HxW) in meters
            transformer: Coordinate transformer for this camera
            sample_rate: Sample every Nth pixel (for performance)

        Returns:
            Per-camera explored mask (for coverage analysis)
        """
        height, width = depth_map.shape

        logger.info(f"Updating occupancy grid from depth map ({height}x{width}), "
                   f"sample_rate={sample_rate}")

        points_added = 0
        points_skipped = 0

        # Create per-camera explored mask
        camera_explored = np.zeros((self.height_cells, self.width_cells), dtype=bool)
        logger.debug(f"Created camera mask with shape {camera_explored.shape} (grid: {self.height_cells}x{self.width_cells})")

        # Sample pixels
        for py in range(0, height, sample_rate):
            for px in range(0, width, sample_rate):
                depth = depth_map[py, px]

                # Skip invalid depth
                if depth <= 0 or not np.isfinite(depth):
                    continue

                # Transform to ground plane
                try:
                    x_world, y_world = transformer.pixel_to_ground_plane(px, py, depth)
                except Exception as e:
                    continue

                # Convert to grid coordinates
                row, col = self.world_to_grid(x_world, y_world)

                # Update grid
                if self.is_valid_cell(row, col):
                    # Mark as explored (global)
                    self.explored[row, col] = True

                    # Mark as explored by THIS camera (per-camera mask)
                    try:
                        camera_explored[row, col] = True
                    except IndexError as e:
                        logger.error(f"IndexError marking camera_explored[{row}, {col}]: {e}. Mask shape: {camera_explored.shape}, Grid: {self.height_cells}x{self.width_cells}")
                        raise

                    # Increment observation count
                    self.count[row, col] += 1

                    # Update occupancy (exponential moving average)
                    # Closer points = higher occupancy
                    max_dist = settings.max_view_distance_m
                    occupancy_value = 1.0 - min(depth / max_dist, 1.0)

                    # Weighted update
                    alpha = 0.3  # Learning rate
                    self.occupancy[row, col] = (
                        (1 - alpha) * self.occupancy[row, col] +
                        alpha * occupancy_value
                    )

                    points_added += 1
                else:
                    points_skipped += 1

        logger.info(f"Added {points_added} points to grid, skipped {points_skipped} out-of-bounds")
        logger.info(f"Camera mask has {camera_explored.sum():,} explored cells out of {camera_explored.size:,} total")

        if camera_explored.sum() < 10 and points_added > 1000:
            logger.warning(f"Very few unique cells ({camera_explored.sum()}) despite many points ({points_added})! Points may be projecting to same cells.")

        return camera_explored

    def mark_fov_as_explored(self, transformer: CoordinateTransformer, max_distance: float):
        """
        Mark the camera's field of view as explored.

        Args:
            transformer: Coordinate transformer for camera
            max_distance: Maximum viewing distance
        """
        # Get FOV footprint
        footprint = transformer.get_fov_footprint(max_distance)

        # Rasterize polygon
        from shapely.geometry import Polygon
        from shapely.prepared import prep

        poly = Polygon(footprint)
        prepared_poly = prep(poly)

        # Check each grid cell
        for row in range(self.height_cells):
            for col in range(self.width_cells):
                x, y = self.grid_to_world(row, col)
                from shapely.geometry import Point
                if prepared_poly.contains(Point(x, y)):
                    self.explored[row, col] = True

    def get_confidence_map(self) -> np.ndarray:
        """
        Get confidence map based on observation count.

        Returns:
            Confidence map (0-1) where higher = more confident
        """
        # Confidence based on number of observations
        # Saturate at 5 observations
        confidence = np.minimum(self.count / 5.0, 1.0)
        return confidence

    def get_occupancy_threshold(self, threshold: float = 0.5) -> np.ndarray:
        """
        Get binary occupancy map based on threshold.

        Args:
            threshold: Occupancy threshold (0-1)

        Returns:
            Binary map (True = occupied, False = free)
        """
        return self.occupancy >= threshold

    def get_explored_regions(self) -> np.ndarray:
        """
        Get explored regions mask.

        Returns:
            Boolean array where True = explored
        """
        return self.explored.copy()

    def get_unexplored_regions(self) -> np.ndarray:
        """
        Get unexplored regions mask.

        Returns:
            Boolean array where True = unexplored
        """
        return ~self.explored

    def to_dict(self) -> dict:
        """
        Convert grid to dictionary for serialization.

        Returns:
            Dictionary representation
        """
        return {
            "resolution_m": self.resolution_m,
            "width_m": self.width_m,
            "height_m": self.height_m,
            "origin_x": self.origin_x,
            "origin_y": self.origin_y,
            "width_cells": self.width_cells,
            "height_cells": self.height_cells,
            "occupancy": self.occupancy.tolist(),
            "explored": self.explored.tolist(),
            "confidence": self.get_confidence_map().tolist()
        }


def create_grid_from_cameras(cameras: List[dict], use_calibrated_margin: bool = True) -> OccupancyGrid:
    """
    Create occupancy grid sized to fit all cameras with margin.

    Args:
        cameras: List of camera dictionaries with 'position' field
        use_calibrated_margin: If True, calculate margin based on camera heights/angles
                               If False, use fixed max_view_distance (old behavior)

    Returns:
        OccupancyGrid instance
    """
    if not cameras:
        # Default grid
        return OccupancyGrid(
            resolution_m=settings.grid_resolution_cm / 100.0,
            width_m=settings.grid_default_size_m,
            height_m=settings.grid_default_size_m
        )

    # Find bounding box of all cameras
    positions = [cam.get("position", {}) for cam in cameras]
    xs = [pos.get("x", 0.0) for pos in positions]
    ys = [pos.get("y", 0.0) for pos in positions]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    # Calculate appropriate margin
    if use_calibrated_margin:
        # Use camera-specific viewing distances based on height and elevation
        margins = []
        for cam in cameras:
            pos = cam.get("position", {})
            height = pos.get("z", 1.8)
            elevation = pos.get("elevation", 0)

            # Estimate viewing distance: distance = height / tan(angle)
            # For nearly horizontal cameras, assume 30° effective downward view
            elevation_rad = np.radians(abs(elevation))
            if elevation_rad < np.radians(5):
                effective_angle = np.radians(30)
                viewing_dist = height / np.tan(effective_angle)
            else:
                viewing_dist = height / np.tan(elevation_rad)

            # Clamp to reasonable range
            viewing_dist = np.clip(viewing_dist, height * 0.5, settings.max_view_distance_m)
            margins.append(viewing_dist)

        # Use average margin with some padding
        margin = np.mean(margins) * 1.2  # 20% padding
        logger.info(f"Using calibrated margin: {margin:.2f}m (camera-specific viewing distances)")
    else:
        # Use fixed margin (old behavior)
        margin = settings.max_view_distance_m
        logger.info(f"Using fixed margin: {margin:.2f}m")

    min_x -= margin
    max_x += margin
    min_y -= margin
    max_y += margin

    width_m = max_x - min_x
    height_m = max_y - min_y

    logger.info(f"Creating grid from {len(cameras)} cameras: "
               f"bounds=({min_x:.1f}, {min_y:.1f}) to ({max_x:.1f}, {max_y:.1f})")

    return OccupancyGrid(
        resolution_m=settings.grid_resolution_cm / 100.0,
        width_m=width_m,
        height_m=height_m,
        origin_x=min_x,
        origin_y=min_y
    )


def crop_grid_to_occupied_bounds(grid: OccupancyGrid, padding_m: float = 2.0) -> OccupancyGrid:
    """
    Crop grid to actual occupied bounds, removing empty space.

    Args:
        grid: Original occupancy grid
        padding_m: Padding to add around occupied region (meters)

    Returns:
        New cropped OccupancyGrid
    """
    # Find occupied cells
    occupied_mask = grid.explored | (grid.occupancy > 0.1)

    if not occupied_mask.any():
        logger.warning("No occupied cells found, returning original grid")
        return grid

    # Find bounding box of occupied cells
    rows, cols = np.where(occupied_mask)

    if len(rows) == 0:
        logger.warning("No occupied rows found, returning original grid")
        return grid

    min_row, max_row = rows.min(), rows.max()
    min_col, max_col = cols.min(), cols.max()

    # Add padding
    padding_cells = int(padding_m / grid.resolution_m)
    min_row = max(0, min_row - padding_cells)
    max_row = min(grid.height_cells - 1, max_row + padding_cells)
    min_col = max(0, min_col - padding_cells)
    max_col = min(grid.width_cells - 1, max_col + padding_cells)

    # Calculate new grid parameters
    new_origin_x, new_origin_y = grid.grid_to_world(min_row, min_col)
    new_width_cells = max_col - min_col + 1
    new_height_cells = max_row - min_row + 1
    new_width_m = new_width_cells * grid.resolution_m
    new_height_m = new_height_cells * grid.resolution_m

    logger.info(f"Cropping grid from {grid.width_cells}x{grid.height_cells} "
               f"to {new_width_cells}x{new_height_cells} cells")
    logger.info(f"New dimensions: {new_width_m:.1f}x{new_height_m:.1f}m "
               f"(was {grid.width_m:.1f}x{grid.height_m:.1f}m)")

    # Create new grid
    new_grid = OccupancyGrid(
        resolution_m=grid.resolution_m,
        width_m=new_width_m,
        height_m=new_height_m,
        origin_x=new_origin_x,
        origin_y=new_origin_y
    )

    # Copy data
    new_grid.occupancy = grid.occupancy[min_row:max_row+1, min_col:max_col+1].copy()
    new_grid.explored = grid.explored[min_row:max_row+1, min_col:max_col+1].copy()
    new_grid.count = grid.count[min_row:max_row+1, min_col:max_col+1].copy()

    return new_grid
