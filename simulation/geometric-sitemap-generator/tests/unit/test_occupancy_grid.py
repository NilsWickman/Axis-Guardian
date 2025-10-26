"""Unit tests for occupancy grid."""

import numpy as np
import pytest

from src.fusion.occupancy_grid import OccupancyGrid, CellState


class TestOccupancyGrid:
    """Test occupancy grid."""

    def test_initialization(self):
        """Test grid initialization."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Check dimensions
        assert grid.width == 100  # 10m / 0.1m
        assert grid.height == 100

        # Check initial state (unknown = 0.5)
        assert np.all(grid.probability == 0.5)
        assert np.all(grid.confidence == 0)
        assert np.all(grid.observations == 0)

    def test_world_to_grid_conversion(self):
        """Test coordinate conversion."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Test origin
        indices = grid.world_to_grid(np.array([0, 0]))
        np.testing.assert_array_equal(indices, [[0, 0]])

        # Test corner
        indices = grid.world_to_grid(np.array([10, 10]))
        assert indices[0, 0] == 100
        assert indices[0, 1] == 100

        # Test middle
        indices = grid.world_to_grid(np.array([5, 5]))
        assert abs(indices[0, 0] - 50) <= 1
        assert abs(indices[0, 1] - 50) <= 1

    def test_grid_to_world_conversion(self):
        """Test inverse coordinate conversion."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Test round-trip
        original = np.array([3.5, 7.2])
        indices = grid.world_to_grid(original)
        recovered = grid.grid_to_world(indices)

        # Should be close (within one cell)
        np.testing.assert_allclose(recovered[0], original, atol=resolution)

    def test_mark_occupied(self):
        """Test marking cells as occupied."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Mark cell as occupied
        point = np.array([[5, 5]])
        grid.mark_occupied(point, confidence=1.0)

        # Check probability increased
        indices = grid.world_to_grid(point)
        col, row = indices[0]
        assert grid.probability[row, col] > 0.5

    def test_mark_free(self):
        """Test marking cells as free."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Mark cell as free
        point = np.array([[5, 5]])
        grid.mark_free(point, confidence=1.0)

        # Check probability decreased
        indices = grid.world_to_grid(point)
        col, row = indices[0]
        assert grid.probability[row, col] < 0.5

    def test_ray_trace(self):
        """Test ray tracing through grid."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Trace ray from (0, 0) to (5, 5)
        start = np.array([0, 0])
        end = np.array([5, 5])

        cells = grid.ray_trace(start, end)

        # Should have cells
        assert len(cells) > 0

        # First cell should be near start
        first_world = grid.grid_to_world(np.array([cells[0]]))[0]
        assert np.linalg.norm(first_world - start) < 1.0

        # Last cell should be near end
        last_world = grid.grid_to_world(np.array([cells[-1]]))[0]
        assert np.linalg.norm(last_world - end) < 1.0

    def test_update_along_ray(self):
        """Test updating cells along ray."""
        min_point = np.array([0, 0])
        max_point = np.array([10, 10])
        resolution = 0.1

        grid = OccupancyGrid((min_point, max_point), resolution=resolution)

        # Update ray
        start = np.array([0, 0])
        end = np.array([5, 5])

        grid.update_along_ray(start, end, confidence=0.9)

        # End point should be occupied
        end_indices = grid.world_to_grid(end.reshape(1, -1))[0]
        col, row = end_indices
        assert grid.probability[row, col] > 0.5

        # Points along ray should be free
        mid = (start + end) / 2
        mid_indices = grid.world_to_grid(mid.reshape(1, -1))[0]
        col, row = mid_indices
        assert grid.probability[row, col] < 0.5
