"""Wall and boundary extraction from occupancy grid."""

import numpy as np
import cv2
from typing import List, Tuple
from dataclasses import dataclass
from sklearn.cluster import DBSCAN

from fusion.occupancy_grid import OccupancyGrid


@dataclass
class WallSegment:
    """A wall segment in world coordinates."""
    start: np.ndarray  # [x, y]
    end: np.ndarray  # [x, y]
    confidence: float
    supporting_points: int


class WallExtractor:
    """Extract walls from occupancy grid using RANSAC and line fitting."""

    def __init__(self, min_wall_length: float = 0.5,
                 ransac_threshold: float = 0.1,
                 min_points: int = 10):
        """
        Initialize wall extractor.

        Args:
            min_wall_length: Minimum wall length in meters
            ransac_threshold: RANSAC inlier threshold in meters
            min_points: Minimum points to constitute a wall
        """
        self.min_wall_length = min_wall_length
        self.ransac_threshold = ransac_threshold
        self.min_points = min_points

    def extract_walls(self, grid: OccupancyGrid,
                     occupancy_threshold: float = 0.7,
                     confidence_threshold: float = 0.4) -> List[WallSegment]:
        """
        Extract wall segments from occupancy grid.

        Args:
            grid: Occupancy grid
            occupancy_threshold: Threshold for occupied cells
            confidence_threshold: Minimum confidence

        Returns:
            List of wall segments
        """
        # Get occupied cells
        occupied = grid.get_occupancy_map(
            threshold=occupancy_threshold,
            min_confidence=confidence_threshold
        )

        # Get world coordinates of occupied cells
        occupied_indices = np.argwhere(occupied)  # [row, col]
        if len(occupied_indices) == 0:
            return []

        # Convert to world coordinates
        # Note: argwhere returns [row, col], we need [col, row] for world coords
        grid_indices = occupied_indices[:, [1, 0]]  # Swap to [col, row]
        world_points = grid.grid_to_world(grid_indices)

        # Extract lines using RANSAC
        walls = self._ransac_line_fitting(world_points, grid)

        # Merge collinear walls
        walls = self._merge_collinear_walls(walls)

        # Filter by length
        walls = [w for w in walls if self._wall_length(w) >= self.min_wall_length]

        return walls

    def _ransac_line_fitting(self, points: np.ndarray,
                            grid: OccupancyGrid,
                            max_iterations: int = 1000) -> List[WallSegment]:
        """
        Fit multiple lines to points using RANSAC.

        Args:
            points: Nx2 array of world points
            grid: Occupancy grid (for confidence lookup)
            max_iterations: Maximum RANSAC iterations per line

        Returns:
            List of wall segments
        """
        walls = []
        remaining_points = points.copy()

        while len(remaining_points) >= self.min_points:
            best_line = None
            best_inliers = []
            best_score = 0

            # RANSAC
            n_iterations = min(max_iterations, len(remaining_points) * 5)

            for _ in range(n_iterations):
                # Sample two points
                if len(remaining_points) < 2:
                    break

                idx = np.random.choice(len(remaining_points), 2, replace=False)
                p1, p2 = remaining_points[idx]

                # Compute line parameters: ax + by + c = 0
                direction = p2 - p1
                length = np.linalg.norm(direction)

                if length < 0.1:  # Too short
                    continue

                direction = direction / length

                # Normal to line
                normal = np.array([-direction[1], direction[0]])

                # Distance from line to all points
                c = -np.dot(normal, p1)
                distances = np.abs(np.dot(remaining_points, normal) + c)

                # Find inliers
                inliers_mask = distances < self.ransac_threshold
                inliers = remaining_points[inliers_mask]

                score = len(inliers)
                if score > best_score and score >= self.min_points:
                    best_score = score
                    best_inliers = inliers
                    best_line = (normal, c)

            if best_line is None or len(best_inliers) < self.min_points:
                break

            # Fit line to all inliers (least squares)
            wall = self._fit_line_segment(best_inliers)

            if wall is not None:
                # Compute confidence from grid
                confidence = self._compute_wall_confidence(wall, grid)
                wall.confidence = confidence
                wall.supporting_points = len(best_inliers)
                walls.append(wall)

            # Remove inliers for next iteration
            # Find which points in remaining_points are inliers
            inlier_set = set(map(tuple, best_inliers))
            remaining_mask = np.array([
                tuple(p) not in inlier_set for p in remaining_points
            ])
            remaining_points = remaining_points[remaining_mask]

        return walls

    def _fit_line_segment(self, points: np.ndarray) -> WallSegment:
        """
        Fit line segment to points using PCA.

        Args:
            points: Nx2 array of points

        Returns:
            WallSegment or None
        """
        if len(points) < 2:
            return None

        # Compute PCA
        mean = np.mean(points, axis=0)
        centered = points - mean

        cov = np.cov(centered.T)
        eigenvalues, eigenvectors = np.linalg.eig(cov)

        # Principal direction (largest eigenvalue)
        principal_idx = np.argmax(eigenvalues)
        direction = eigenvectors[:, principal_idx]

        # Project points onto principal axis
        projections = np.dot(centered, direction)

        # Find extent along principal axis
        min_proj = np.min(projections)
        max_proj = np.max(projections)

        # Compute endpoints
        start = mean + min_proj * direction
        end = mean + max_proj * direction

        return WallSegment(
            start=start,
            end=end,
            confidence=0.0,  # Will be computed later
            supporting_points=len(points)
        )

    def _compute_wall_confidence(self, wall: WallSegment,
                                grid: OccupancyGrid) -> float:
        """
        Compute confidence for a wall based on grid values.

        Args:
            wall: Wall segment
            grid: Occupancy grid

        Returns:
            Confidence score 0-1
        """
        # Sample points along wall
        n_samples = max(10, int(self._wall_length(wall) / grid.resolution))
        t = np.linspace(0, 1, n_samples)

        wall_points = (
            wall.start.reshape(1, -1) +
            t.reshape(-1, 1) * (wall.end - wall.start).reshape(1, -1)
        )

        # Get grid indices
        indices = grid.world_to_grid(wall_points)
        valid = grid.is_valid_index(indices)

        if not np.any(valid):
            return 0.0

        # Get confidence values
        confidences = []
        for idx, is_valid in zip(indices, valid):
            if is_valid:
                col, row = idx
                confidences.append(grid.confidence[row, col])

        if len(confidences) == 0:
            return 0.0

        return float(np.mean(confidences))

    def _wall_length(self, wall: WallSegment) -> float:
        """Compute wall length."""
        return float(np.linalg.norm(wall.end - wall.start))

    def _merge_collinear_walls(self, walls: List[WallSegment],
                              angle_threshold: float = 5.0,
                              distance_threshold: float = 0.2) -> List[WallSegment]:
        """
        Merge collinear wall segments.

        Args:
            walls: List of wall segments
            angle_threshold: Maximum angle difference in degrees
            distance_threshold: Maximum perpendicular distance in meters

        Returns:
            Merged walls
        """
        if len(walls) <= 1:
            return walls

        merged = []
        used = set()

        for i, wall1 in enumerate(walls):
            if i in used:
                continue

            # Find all walls collinear with wall1
            collinear_group = [wall1]

            dir1 = wall1.end - wall1.start
            dir1 = dir1 / np.linalg.norm(dir1)

            for j, wall2 in enumerate(walls):
                if j <= i or j in used:
                    continue

                # Check if collinear
                dir2 = wall2.end - wall2.start
                dir2 = dir2 / np.linalg.norm(dir2)

                # Angle between directions
                cos_angle = abs(np.dot(dir1, dir2))
                angle_deg = np.rad2deg(np.arccos(np.clip(cos_angle, -1, 1)))

                if angle_deg > angle_threshold and angle_deg < 180 - angle_threshold:
                    continue

                # Check perpendicular distance
                # Distance from wall2 endpoints to wall1 line
                normal = np.array([-dir1[1], dir1[0]])
                c = -np.dot(normal, wall1.start)

                dist_start = abs(np.dot(normal, wall2.start) + c)
                dist_end = abs(np.dot(normal, wall2.end) + c)

                if max(dist_start, dist_end) > distance_threshold:
                    continue

                # Collinear!
                collinear_group.append(wall2)
                used.add(j)

            # Merge group
            if len(collinear_group) == 1:
                merged.append(wall1)
            else:
                merged_wall = self._merge_wall_group(collinear_group)
                merged.append(merged_wall)

            used.add(i)

        return merged

    def _merge_wall_group(self, walls: List[WallSegment]) -> WallSegment:
        """
        Merge a group of collinear walls into one.

        Args:
            walls: List of collinear walls

        Returns:
            Single merged wall
        """
        # Collect all endpoints
        points = []
        for wall in walls:
            points.append(wall.start)
            points.append(wall.end)

        points = np.array(points)

        # Fit line to all points
        merged = self._fit_line_segment(points)

        # Aggregate confidence
        merged.confidence = np.mean([w.confidence for w in walls])
        merged.supporting_points = sum(w.supporting_points for w in walls)

        return merged

    def extract_zones(self, walls: List[WallSegment],
                     grid: OccupancyGrid) -> List[np.ndarray]:
        """
        Extract enclosed zones from walls.

        Args:
            walls: List of wall segments
            grid: Occupancy grid

        Returns:
            List of zone polygons (each Nx2 array)
        """
        # This is complex - for now, return empty
        # Full implementation would:
        # 1. Build graph from wall endpoints
        # 2. Find cycles (rooms)
        # 3. Return polygons

        # TODO: Implement zone extraction
        return []
