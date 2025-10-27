"""2D occupancy grid from point cloud."""

import numpy as np
from typing import Tuple, Optional
from dataclasses import dataclass


@dataclass
class OccupancyGrid:
    """2D occupancy grid representation."""

    grid: np.ndarray  # HxW grid (0=free, 1=occupied, -1=unknown)
    resolution: float  # Grid cell size in meters
    origin: np.ndarray  # 2D origin (x, y) in meters
    width_m: float  # Width in meters
    height_m: float  # Height in meters

    def get_shape(self) -> Tuple[int, int]:
        """Get grid shape (height, width)."""
        return self.grid.shape

    def world_to_grid(self, points_2d: np.ndarray) -> np.ndarray:
        """
        Convert world coordinates to grid indices.

        Args:
            points_2d: Nx2 array of world coordinates

        Returns:
            Nx2 array of grid indices (row, col)
        """
        # Offset by origin
        points_local = points_2d - self.origin

        # Convert to grid coordinates
        grid_coords = points_local / self.resolution

        # Flip y-axis (grid row increases downward, y increases upward)
        rows = self.grid.shape[0] - 1 - grid_coords[:, 1].astype(int)
        cols = grid_coords[:, 0].astype(int)

        return np.column_stack([rows, cols])

    def grid_to_world(self, grid_indices: np.ndarray) -> np.ndarray:
        """
        Convert grid indices to world coordinates.

        Args:
            grid_indices: Nx2 array of grid indices (row, col)

        Returns:
            Nx2 array of world coordinates
        """
        rows, cols = grid_indices[:, 0], grid_indices[:, 1]

        # Flip y-axis
        y = (self.grid.shape[0] - 1 - rows) * self.resolution
        x = cols * self.resolution

        # Add origin
        points_2d = np.column_stack([x, y]) + self.origin

        return points_2d

    def mark_occupied(self, points_2d: np.ndarray):
        """
        Mark grid cells as occupied based on 2D points.

        Args:
            points_2d: Nx2 array of world coordinates
        """
        grid_coords = self.world_to_grid(points_2d)

        # Filter valid indices
        valid_mask = (
            (grid_coords[:, 0] >= 0) &
            (grid_coords[:, 0] < self.grid.shape[0]) &
            (grid_coords[:, 1] >= 0) &
            (grid_coords[:, 1] < self.grid.shape[1])
        )

        valid_coords = grid_coords[valid_mask]

        # Mark cells as occupied
        self.grid[valid_coords[:, 0], valid_coords[:, 1]] = 1

    def get_occupancy_map(self, threshold: float = 0.5) -> np.ndarray:
        """
        Get binary occupancy map.

        Args:
            threshold: Threshold for occupied cells

        Returns:
            Binary mask (True = occupied)
        """
        return self.grid >= threshold

    def get_free_space_map(self) -> np.ndarray:
        """
        Get free space map.

        Returns:
            Binary mask (True = free)
        """
        return self.grid == 0

    def dilate_obstacles(self, iterations: int = 1) -> 'OccupancyGrid':
        """
        Dilate obstacle cells (useful for safety margins).

        Args:
            iterations: Number of dilation iterations

        Returns:
            New occupancy grid with dilated obstacles
        """
        from scipy.ndimage import binary_dilation

        occupied = self.grid == 1
        dilated = binary_dilation(occupied, iterations=iterations)

        new_grid = self.grid.copy()
        new_grid[dilated] = 1

        return OccupancyGrid(
            grid=new_grid,
            resolution=self.resolution,
            origin=self.origin,
            width_m=self.width_m,
            height_m=self.height_m
        )


def create_occupancy_grid(
    points_2d: np.ndarray,
    resolution: float = 0.05,
    margin: float = 1.0
) -> OccupancyGrid:
    """
    Create occupancy grid from 2D points.

    Args:
        points_2d: Nx2 array of 2D points
        resolution: Grid cell size in meters
        margin: Margin around points in meters

    Returns:
        Occupancy grid
    """
    # Compute bounding box
    min_coords = points_2d.min(axis=0) - margin
    max_coords = points_2d.max(axis=0) + margin

    # Compute grid dimensions
    width_m = max_coords[0] - min_coords[0]
    height_m = max_coords[1] - min_coords[1]

    grid_width = int(np.ceil(width_m / resolution))
    grid_height = int(np.ceil(height_m / resolution))

    # Initialize grid (unknown: -1, free: 0, occupied: 1)
    grid = np.zeros((grid_height, grid_width), dtype=np.int8)

    # Create occupancy grid object
    occ_grid = OccupancyGrid(
        grid=grid,
        resolution=resolution,
        origin=min_coords,
        width_m=width_m,
        height_m=height_m
    )

    # Mark occupied cells
    occ_grid.mark_occupied(points_2d)

    return occ_grid
