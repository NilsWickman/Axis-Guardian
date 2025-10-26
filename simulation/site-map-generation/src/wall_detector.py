"""Wall detection from occupancy grids using edge detection and line segment detection."""

import numpy as np
import cv2
from typing import List, Tuple, Optional
from dataclasses import dataclass
import logging
from scipy import ndimage

from .config import settings
from .occupancy_mapper import OccupancyGrid

logger = logging.getLogger(__name__)


@dataclass
class WallSegment:
    """A detected wall segment in world coordinates."""

    start_x: float  # meters
    start_y: float  # meters
    end_x: float  # meters
    end_y: float  # meters
    confidence: float  # 0-1
    length: float  # meters
    wall_type: str = "internal"  # 'external' or 'internal'

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "start": {"x": self.start_x, "y": self.start_y},
            "end": {"x": self.end_x, "y": self.end_y},
            "confidence": self.confidence,
            "length": self.length,
            "type": self.wall_type
        }


class WallDetector:
    """Detect walls from occupancy grids."""

    def __init__(self):
        """Initialize wall detector."""
        self.min_length_m = settings.wall_min_length_m
        self.merge_distance_m = settings.wall_merge_distance_m
        self.gradient_threshold = settings.wall_detection_gradient_threshold

    def detect_walls(self, grid: OccupancyGrid) -> List[WallSegment]:
        """
        Detect wall segments from occupancy grid.

        Args:
            grid: Occupancy grid

        Returns:
            List of detected wall segments
        """
        logger.info("Detecting walls from occupancy grid...")

        # Step 1: Compute gradient magnitude (edges)
        edges = self._detect_edges(grid)

        # Step 2: Detect line segments using LSD
        lines = self._detect_line_segments(edges, grid)

        # Step 3: Filter by minimum length
        lines = self._filter_short_lines(lines, grid)

        # Step 4: Merge collinear segments
        lines = self._merge_collinear_lines(lines, grid)

        # Step 5: Convert to WallSegment objects with confidence
        walls = self._create_wall_segments(lines, grid)

        logger.info(f"Detected {len(walls)} wall segments")

        return walls

    def _detect_edges(self, grid: OccupancyGrid) -> np.ndarray:
        """
        Detect edges in occupancy grid using Sobel operator.

        Args:
            grid: Occupancy grid

        Returns:
            Edge magnitude map
        """
        # Apply Gaussian blur to reduce noise
        occupancy_smooth = ndimage.gaussian_filter(grid.occupancy, sigma=1.0)

        # Sobel edge detection
        grad_x = ndimage.sobel(occupancy_smooth, axis=1)
        grad_y = ndimage.sobel(occupancy_smooth, axis=0)

        # Gradient magnitude
        gradient_magnitude = np.hypot(grad_x, grad_y)

        # Normalize
        if gradient_magnitude.max() > 0:
            gradient_magnitude = gradient_magnitude / gradient_magnitude.max()

        # Threshold
        edges = gradient_magnitude > self.gradient_threshold

        return edges.astype(np.uint8) * 255

    def _detect_line_segments(self, edges: np.ndarray, grid: OccupancyGrid) -> np.ndarray:
        """
        Detect line segments using Line Segment Detector (LSD).

        Args:
            edges: Binary edge image
            grid: Occupancy grid (for reference)

        Returns:
            Array of line segments (x1, y1, x2, y2) in grid coordinates
        """
        # Create LSD detector
        lsd = cv2.createLineSegmentDetector(0)

        # Detect lines
        lines, width, prec, nfa = lsd.detect(edges)

        if lines is None:
            logger.warning("No lines detected by LSD")
            return np.array([])

        # Reshape to (N, 4)
        lines = lines.reshape(-1, 4)

        logger.info(f"LSD detected {len(lines)} raw line segments")

        return lines

    def _filter_short_lines(self, lines: np.ndarray, grid: OccupancyGrid) -> np.ndarray:
        """
        Filter out short line segments.

        Args:
            lines: Line segments in grid coordinates
            grid: Occupancy grid

        Returns:
            Filtered lines
        """
        if len(lines) == 0:
            return lines

        # Compute line lengths in meters
        min_length_cells = self.min_length_m / grid.resolution_m

        # Calculate lengths
        lengths = np.sqrt(
            (lines[:, 2] - lines[:, 0]) ** 2 +
            (lines[:, 3] - lines[:, 1]) ** 2
        )

        # Filter
        mask = lengths >= min_length_cells
        filtered = lines[mask]

        logger.info(f"Filtered {len(lines) - len(filtered)} short lines "
                   f"(< {self.min_length_m}m)")

        return filtered

    def _merge_collinear_lines(self, lines: np.ndarray, grid: OccupancyGrid) -> np.ndarray:
        """
        Merge collinear line segments.

        Args:
            lines: Line segments in grid coordinates
            grid: Occupancy grid

        Returns:
            Merged lines
        """
        if len(lines) == 0:
            return lines

        merge_distance_cells = self.merge_distance_m / grid.resolution_m

        merged = []
        used = np.zeros(len(lines), dtype=bool)

        for i in range(len(lines)):
            if used[i]:
                continue

            current = lines[i].copy()
            used[i] = True

            # Try to merge with other lines
            merged_any = True
            while merged_any:
                merged_any = False
                for j in range(len(lines)):
                    if used[j]:
                        continue

                    # Check if collinear and close
                    if self._are_collinear_and_close(current, lines[j], merge_distance_cells):
                        # Merge by extending endpoints
                        current = self._merge_two_lines(current, lines[j])
                        used[j] = True
                        merged_any = True

            merged.append(current)

        merged = np.array(merged)
        logger.info(f"Merged {len(lines)} lines into {len(merged)} segments")

        return merged

    def _are_collinear_and_close(
        self,
        line1: np.ndarray,
        line2: np.ndarray,
        max_distance: float
    ) -> bool:
        """
        Check if two lines are collinear and close enough to merge.

        Args:
            line1: First line (x1, y1, x2, y2)
            line2: Second line (x1, y1, x2, y2)
            max_distance: Maximum distance for merging

        Returns:
            True if lines should be merged
        """
        # Compute line angles
        angle1 = np.arctan2(line1[3] - line1[1], line1[2] - line1[0])
        angle2 = np.arctan2(line2[3] - line2[1], line2[2] - line2[0])

        # Normalize to [0, π]
        angle1 = angle1 % np.pi
        angle2 = angle2 % np.pi

        # Check angle difference (allow ~5 degrees)
        angle_diff = min(abs(angle1 - angle2), np.pi - abs(angle1 - angle2))
        if angle_diff > np.radians(5):
            return False

        # Check distance between endpoints
        # Try all combinations of endpoints
        endpoints1 = [(line1[0], line1[1]), (line1[2], line1[3])]
        endpoints2 = [(line2[0], line2[1]), (line2[2], line2[3])]

        for p1 in endpoints1:
            for p2 in endpoints2:
                dist = np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
                if dist <= max_distance:
                    return True

        return False

    def _merge_two_lines(self, line1: np.ndarray, line2: np.ndarray) -> np.ndarray:
        """
        Merge two lines by extending to outermost endpoints.

        Args:
            line1: First line
            line2: Second line

        Returns:
            Merged line
        """
        # Get all endpoints
        points = np.array([
            [line1[0], line1[1]],
            [line1[2], line1[3]],
            [line2[0], line2[1]],
            [line2[2], line2[3]]
        ])

        # Find the two points that are farthest apart
        max_dist = 0
        best_pair = (0, 1)

        for i in range(len(points)):
            for j in range(i + 1, len(points)):
                dist = np.sqrt((points[i][0] - points[j][0]) ** 2 +
                             (points[i][1] - points[j][1]) ** 2)
                if dist > max_dist:
                    max_dist = dist
                    best_pair = (i, j)

        # Create merged line
        p1 = points[best_pair[0]]
        p2 = points[best_pair[1]]

        return np.array([p1[0], p1[1], p2[0], p2[1]])

    def _create_wall_segments(self, lines: np.ndarray, grid: OccupancyGrid) -> List[WallSegment]:
        """
        Convert line segments to WallSegment objects.

        Args:
            lines: Line segments in grid coordinates
            grid: Occupancy grid

        Returns:
            List of WallSegment objects
        """
        walls = []

        for line in lines:
            # Convert grid coordinates to world coordinates
            x1, y1 = grid.grid_to_world(int(line[1]), int(line[0]))
            x2, y2 = grid.grid_to_world(int(line[3]), int(line[2]))

            # Compute length
            length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

            # Compute confidence based on nearby occupancy values
            confidence = self._compute_wall_confidence(line, grid)

            # Determine wall type (external vs internal)
            # For now, mark as internal (can be refined later)
            wall_type = "internal"

            wall = WallSegment(
                start_x=x1,
                start_y=y1,
                end_x=x2,
                end_y=y2,
                confidence=confidence,
                length=length,
                wall_type=wall_type
            )

            walls.append(wall)

        return walls

    def _compute_wall_confidence(self, line: np.ndarray, grid: OccupancyGrid) -> float:
        """
        Compute confidence for a wall segment based on occupancy grid.

        Args:
            line: Line segment in grid coordinates
            grid: Occupancy grid

        Returns:
            Confidence value (0-1)
        """
        # Sample points along the line
        num_samples = max(int(np.hypot(line[2] - line[0], line[3] - line[1])), 10)

        confidences = []

        for i in range(num_samples):
            t = i / num_samples
            x = int(line[0] + t * (line[2] - line[0]))
            y = int(line[1] + t * (line[3] - line[1]))

            if grid.is_valid_cell(y, x):
                # Confidence based on observation count
                conf = min(grid.count[y, x] / 5.0, 1.0)
                confidences.append(conf)

        if not confidences:
            return 0.5  # Default

        return float(np.mean(confidences))
