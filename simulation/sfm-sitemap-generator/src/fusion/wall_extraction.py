"""Extract wall boundaries from occupancy grid."""

import numpy as np
import cv2
from typing import List, Tuple
from dataclasses import dataclass
from sklearn.linear_model import RANSACRegressor


@dataclass
class WallSegment:
    """Wall segment representation."""

    start: np.ndarray  # 2D start point (x, y) in meters
    end: np.ndarray    # 2D end point (x, y) in meters
    confidence: float  # Confidence score (0-1)
    supporting_points: int  # Number of edge points supporting this wall


class WallExtractor:
    """Extract wall boundaries from occupancy grid."""

    def __init__(
        self,
        min_wall_length: float = 0.5,
        ransac_threshold: float = 0.1,
        merge_threshold: float = 0.3,
        min_points: int = 10
    ):
        """
        Initialize wall extractor.

        Args:
            min_wall_length: Minimum wall length in meters
            ransac_threshold: RANSAC inlier threshold in meters
            merge_threshold: Threshold for merging collinear walls in meters
            min_points: Minimum points to fit wall
        """
        self.min_wall_length = min_wall_length
        self.ransac_threshold = ransac_threshold
        self.merge_threshold = merge_threshold
        self.min_points = min_points

    def extract_walls(
        self,
        occupancy_grid,
        detection_threshold: float = 0.7
    ) -> List[WallSegment]:
        """
        Extract wall segments from occupancy grid.

        Args:
            occupancy_grid: OccupancyGrid object
            detection_threshold: Threshold for wall detection

        Returns:
            List of wall segments
        """
        # Step 1: Detect edges in occupancy grid
        edge_points = self._detect_edges(occupancy_grid)

        if len(edge_points) < self.min_points:
            return []

        # Step 2: Extract line segments using RANSAC
        wall_segments = self._fit_lines_ransac(edge_points, occupancy_grid)

        # Step 3: Merge collinear segments
        merged_walls = self._merge_collinear_segments(wall_segments)

        # Step 4: Filter by minimum length
        filtered_walls = [
            wall for wall in merged_walls
            if np.linalg.norm(wall.end - wall.start) >= self.min_wall_length
        ]

        return filtered_walls

    def _detect_edges(self, occupancy_grid) -> np.ndarray:
        """
        Detect edges in occupancy grid.

        Args:
            occupancy_grid: OccupancyGrid object

        Returns:
            Nx2 array of edge points in world coordinates
        """
        # Convert to binary image
        occupied = (occupancy_grid.grid == 1).astype(np.uint8) * 255

        # Apply Canny edge detection
        edges = cv2.Canny(occupied, 50, 150)

        # Find edge pixel coordinates
        edge_pixels = np.argwhere(edges > 0)  # (row, col)

        if len(edge_pixels) == 0:
            return np.array([]).reshape(0, 2)

        # Convert to world coordinates
        edge_points = occupancy_grid.grid_to_world(edge_pixels)

        return edge_points

    def _fit_lines_ransac(
        self,
        points: np.ndarray,
        occupancy_grid
    ) -> List[WallSegment]:
        """
        Fit line segments to edge points using RANSAC.

        Args:
            points: Nx2 array of edge points
            occupancy_grid: OccupancyGrid object

        Returns:
            List of wall segments
        """
        walls = []
        remaining_points = points.copy()

        # Iteratively fit lines until too few points remain
        max_iterations = 100
        iteration = 0

        while len(remaining_points) >= self.min_points and iteration < max_iterations:
            iteration += 1

            # Fit line using RANSAC
            try:
                wall, inliers = self._fit_single_line(remaining_points)
                if wall is not None:
                    walls.append(wall)

                    # Remove inliers from remaining points
                    remaining_points = remaining_points[~inliers]
                else:
                    break
            except:
                break

        return walls

    def _fit_single_line(
        self,
        points: np.ndarray
    ) -> Tuple[WallSegment, np.ndarray]:
        """
        Fit single line to points using RANSAC.

        Args:
            points: Nx2 array of points

        Returns:
            (wall_segment, inlier_mask) or (None, None) if failed
        """
        if len(points) < self.min_points:
            return None, None

        # Fit line using RANSAC
        # Try vertical vs horizontal orientation
        x_range = points[:, 0].max() - points[:, 0].min()
        y_range = points[:, 1].max() - points[:, 1].min()

        if x_range > y_range:
            # Fit y = mx + b (horizontal-ish line)
            X = points[:, 0].reshape(-1, 1)
            y = points[:, 1]
        else:
            # Fit x = my + b (vertical-ish line)
            X = points[:, 1].reshape(-1, 1)
            y = points[:, 0]

        try:
            ransac = RANSACRegressor(
                min_samples=self.min_points,
                residual_threshold=self.ransac_threshold,
                max_trials=1000,
                random_state=None
            )
            ransac.fit(X, y)

            inlier_mask = ransac.inlier_mask_
            num_inliers = np.sum(inlier_mask)

            if num_inliers < self.min_points:
                return None, None

            # Extract inlier points
            inlier_points = points[inlier_mask]

            # Find endpoints (extremes along line)
            if x_range > y_range:
                min_idx = np.argmin(inlier_points[:, 0])
                max_idx = np.argmax(inlier_points[:, 0])
            else:
                min_idx = np.argmin(inlier_points[:, 1])
                max_idx = np.argmax(inlier_points[:, 1])

            start = inlier_points[min_idx]
            end = inlier_points[max_idx]

            # Compute confidence based on inlier ratio
            confidence = num_inliers / len(points)

            wall = WallSegment(
                start=start,
                end=end,
                confidence=min(confidence, 1.0),
                supporting_points=num_inliers
            )

            return wall, inlier_mask

        except:
            return None, None

    def _merge_collinear_segments(self, walls: List[WallSegment]) -> List[WallSegment]:
        """
        Merge collinear wall segments that are close together.

        Args:
            walls: List of wall segments

        Returns:
            Merged list of wall segments
        """
        if len(walls) <= 1:
            return walls

        merged = []
        used = set()

        for i, wall1 in enumerate(walls):
            if i in used:
                continue

            # Find collinear segments
            group = [wall1]
            used.add(i)

            for j, wall2 in enumerate(walls[i + 1:], start=i + 1):
                if j in used:
                    continue

                if self._are_collinear(wall1, wall2):
                    group.append(wall2)
                    used.add(j)

            # Merge group into single segment
            if len(group) == 1:
                merged.append(wall1)
            else:
                merged_wall = self._merge_segment_group(group)
                merged.append(merged_wall)

        return merged

    def _are_collinear(self, wall1: WallSegment, wall2: WallSegment) -> bool:
        """
        Check if two wall segments are approximately collinear.

        Args:
            wall1: First wall segment
            wall2: Second wall segment

        Returns:
            True if collinear
        """
        # Get all four endpoints
        points = np.array([wall1.start, wall1.end, wall2.start, wall2.end])

        # Fit line to all points
        X = points[:, 0].reshape(-1, 1)
        y = points[:, 1]

        try:
            from sklearn.linear_model import LinearRegression
            model = LinearRegression()
            model.fit(X, y)

            # Compute residuals
            y_pred = model.predict(X)
            residuals = np.abs(y - y_pred)

            # Check if all points close to line
            return np.max(residuals) < self.merge_threshold

        except:
            return False

    def _merge_segment_group(self, walls: List[WallSegment]) -> WallSegment:
        """
        Merge group of collinear segments into one.

        Args:
            walls: List of collinear wall segments

        Returns:
            Merged wall segment
        """
        # Collect all endpoints
        all_points = []
        for wall in walls:
            all_points.append(wall.start)
            all_points.append(wall.end)
        all_points = np.array(all_points)

        # Find overall start and end (extremes)
        centroid = all_points.mean(axis=0)
        distances = np.linalg.norm(all_points - centroid, axis=1)

        furthest_indices = np.argsort(distances)[-2:]
        start = all_points[furthest_indices[0]]
        end = all_points[furthest_indices[1]]

        # Average confidence
        avg_confidence = np.mean([wall.confidence for wall in walls])
        total_points = sum(wall.supporting_points for wall in walls)

        return WallSegment(
            start=start,
            end=end,
            confidence=avg_confidence,
            supporting_points=total_points
        )
