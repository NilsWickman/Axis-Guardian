"""Occupancy grid representation for spatial mapping."""

import numpy as np
from typing import Tuple, Optional, List
from dataclasses import dataclass
from enum import Enum


class CellState(Enum):
    """Occupancy cell state."""
    UNKNOWN = 0
    FREE = 1
    OCCUPIED = 2


@dataclass
class OccupancyCell:
    """Single cell in occupancy grid."""
    state: CellState
    probability: float  # 0.0 to 1.0 (probability of being occupied)
    confidence: float  # Confidence in the observation
    observations: int = 0  # Number of times observed


class OccupancyGrid:
    """2D occupancy grid for spatial mapping."""

    def __init__(self, bounds: Tuple[np.ndarray, np.ndarray],
                 resolution: float = 0.05):
        """
        Initialize occupancy grid.

        Args:
            bounds: (min_point, max_point) as 2D arrays [x, y]
            resolution: Cell size in meters
        """
        self.min_point = bounds[0]
        self.max_point = bounds[1]
        self.resolution = resolution

        # Compute grid dimensions
        self.width = int(np.ceil((self.max_point[0] - self.min_point[0]) / resolution))
        self.height = int(np.ceil((self.max_point[1] - self.min_point[1]) / resolution))

        # Initialize grids
        self.probability = np.ones((self.height, self.width)) * 0.5  # Unknown = 0.5
        self.confidence = np.zeros((self.height, self.width))
        self.observations = np.zeros((self.height, self.width), dtype=np.int32)

    def world_to_grid(self, points: np.ndarray) -> np.ndarray:
        """
        Convert world coordinates to grid indices.

        Args:
            points: Nx2 array of world coordinates [x, y]

        Returns:
            Nx2 array of grid indices [col, row]
        """
        if points.ndim == 1:
            points = points.reshape(1, -1)

        # Convert to grid coordinates
        grid_coords = (points - self.min_point) / self.resolution

        # Round to nearest integer
        indices = np.round(grid_coords).astype(np.int32)

        return indices

    def grid_to_world(self, indices: np.ndarray) -> np.ndarray:
        """
        Convert grid indices to world coordinates.

        Args:
            indices: Nx2 array of grid indices [col, row]

        Returns:
            Nx2 array of world coordinates [x, y] (cell centers)
        """
        if indices.ndim == 1:
            indices = indices.reshape(1, -1)

        # Convert to world coordinates (cell centers)
        world_coords = (indices + 0.5) * self.resolution + self.min_point

        return world_coords

    def is_valid_index(self, indices: np.ndarray) -> np.ndarray:
        """
        Check if grid indices are valid.

        Args:
            indices: Nx2 array of grid indices [col, row]

        Returns:
            Boolean array of length N
        """
        if indices.ndim == 1:
            indices = indices.reshape(1, -1)

        valid = (
            (indices[:, 0] >= 0) & (indices[:, 0] < self.width) &
            (indices[:, 1] >= 0) & (indices[:, 1] < self.height)
        )

        return valid

    def update_cells(self, points: np.ndarray, occupied: bool,
                    confidence: float = 1.0):
        """
        Update occupancy for cells at given points.

        Args:
            points: Nx2 array of world coordinates
            occupied: True if cells are occupied, False if free
            confidence: Confidence weight for update
        """
        indices = self.world_to_grid(points)
        valid = self.is_valid_index(indices)

        for idx, is_valid in zip(indices, valid):
            if not is_valid:
                continue

            col, row = idx

            # Bayesian update
            prior = self.probability[row, col]

            # Likelihood: P(observation | state)
            if occupied:
                likelihood = 0.9  # High probability if truly occupied
            else:
                likelihood = 0.1  # Low probability if truly free

            # Posterior: P(state | observation) ∝ P(observation | state) * P(state)
            posterior = (likelihood * prior) / (
                likelihood * prior + (1 - likelihood) * (1 - prior)
            )

            # Weighted update based on confidence
            self.probability[row, col] = (
                confidence * posterior +
                (1 - confidence) * prior
            )

            # Update confidence (exponential moving average)
            alpha = 0.3
            self.confidence[row, col] = (
                alpha * confidence +
                (1 - alpha) * self.confidence[row, col]
            )

            # Increment observation count
            self.observations[row, col] += 1

    def mark_free(self, points: np.ndarray, confidence: float = 1.0):
        """Mark cells as free space."""
        self.update_cells(points, occupied=False, confidence=confidence)

    def mark_occupied(self, points: np.ndarray, confidence: float = 1.0):
        """Mark cells as occupied."""
        self.update_cells(points, occupied=True, confidence=confidence)

    def get_occupancy_map(self, threshold: float = 0.7,
                         min_confidence: float = 0.3) -> np.ndarray:
        """
        Get binary occupancy map.

        Args:
            threshold: Probability threshold for occupied
            min_confidence: Minimum confidence to include

        Returns:
            Binary map (HxW) where True = occupied
        """
        occupied = self.probability > threshold
        confident = self.confidence >= min_confidence

        return occupied & confident

    def get_free_space_map(self, threshold: float = 0.3,
                          min_confidence: float = 0.3) -> np.ndarray:
        """
        Get binary free space map.

        Args:
            threshold: Probability threshold for free (below this = free)
            min_confidence: Minimum confidence to include

        Returns:
            Binary map (HxW) where True = free space
        """
        free = self.probability < threshold
        confident = self.confidence >= min_confidence

        return free & confident

    def ray_trace(self, start: np.ndarray, end: np.ndarray) -> List[Tuple[int, int]]:
        """
        Get all grid cells along a ray using Bresenham's algorithm.

        Args:
            start: Start point in world coordinates [x, y]
            end: End point in world coordinates [x, y]

        Returns:
            List of (col, row) tuples along the ray
        """
        # Convert to grid indices
        start_idx = self.world_to_grid(start).flatten()
        end_idx = self.world_to_grid(end).flatten()

        # Bresenham's line algorithm
        cells = []

        x0, y0 = start_idx
        x1, y1 = end_idx

        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy

        x, y = x0, y0

        while True:
            if 0 <= x < self.width and 0 <= y < self.height:
                cells.append((x, y))

            if x == x1 and y == y1:
                break

            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

        return cells

    def update_along_ray(self, start: np.ndarray, end: np.ndarray,
                        confidence: float = 0.8):
        """
        Update cells along a ray (free) and endpoint (occupied).

        This is useful for sensor measurements where we know:
        - Ray traveled through free space to reach obstacle
        - Obstacle is at endpoint

        Args:
            start: Ray start in world coordinates [x, y]
            end: Ray end (obstacle) in world coordinates [x, y]
            confidence: Confidence weight
        """
        cells = self.ray_trace(start, end)

        if len(cells) == 0:
            return

        # All cells except last are free
        for col, row in cells[:-1]:
            prior = self.probability[row, col]
            likelihood = 0.1  # Low probability of occupied
            posterior = (likelihood * prior) / (
                likelihood * prior + (1 - likelihood) * (1 - prior)
            )

            self.probability[row, col] = (
                confidence * posterior + (1 - confidence) * prior
            )
            self.confidence[row, col] = max(self.confidence[row, col], confidence * 0.5)
            self.observations[row, col] += 1

        # Last cell is occupied
        col, row = cells[-1]
        prior = self.probability[row, col]
        likelihood = 0.9  # High probability of occupied
        posterior = (likelihood * prior) / (
            likelihood * prior + (1 - likelihood) * (1 - prior)
        )

        self.probability[row, col] = (
            confidence * posterior + (1 - confidence) * prior
        )
        self.confidence[row, col] = max(self.confidence[row, col], confidence)
        self.observations[row, col] += 1

    def get_bounds(self) -> Tuple[np.ndarray, np.ndarray]:
        """Get world bounds of the grid."""
        return self.min_point, self.max_point

    def get_shape(self) -> Tuple[int, int]:
        """Get grid shape (height, width)."""
        return self.height, self.width
