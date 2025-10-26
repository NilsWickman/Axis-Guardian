"""Wall segment merging and filtering for cleaner output."""

import numpy as np
import logging
from typing import List, Tuple
from sklearn.cluster import DBSCAN

from .wall_detector import WallSegment

logger = logging.getLogger(__name__)


class WallMerger:
    """Merge and filter wall segments for cleaner output."""

    def __init__(
        self,
        min_length_m: float = 1.0,
        merge_distance_m: float = 0.5,
        angle_tolerance_deg: float = 10.0
    ):
        """
        Initialize wall merger.

        Args:
            min_length_m: Minimum wall length to keep (meters)
            merge_distance_m: Maximum distance to merge walls (meters)
            angle_tolerance_deg: Maximum angle difference to merge (degrees)
        """
        self.min_length_m = min_length_m
        self.merge_distance_m = merge_distance_m
        self.angle_tolerance_deg = angle_tolerance_deg

    def filter_short_walls(self, walls: List[WallSegment]) -> List[WallSegment]:
        """
        Filter out short wall segments.

        Args:
            walls: List of wall segments

        Returns:
            Filtered list
        """
        filtered = [w for w in walls if w.length >= self.min_length_m]

        logger.info(f"Filtered {len(walls) - len(filtered)} short walls "
                   f"(< {self.min_length_m}m), kept {len(filtered)}")

        return filtered

    def _get_wall_angle(self, wall: WallSegment) -> float:
        """
        Get wall angle in radians.

        Args:
            wall: Wall segment

        Returns:
            Angle in radians [0, π]
        """
        dx = wall.end_x - wall.start_x
        dy = wall.end_y - wall.start_y

        angle = np.arctan2(dy, dx)

        # Normalize to [0, π] (ignore direction)
        angle = angle % np.pi

        return angle

    def _are_collinear(
        self,
        wall1: WallSegment,
        wall2: WallSegment
    ) -> bool:
        """
        Check if two walls are collinear.

        Args:
            wall1: First wall
            wall2: Second wall

        Returns:
            True if collinear
        """
        angle1 = self._get_wall_angle(wall1)
        angle2 = self._get_wall_angle(wall2)

        # Check angle difference
        angle_diff = min(abs(angle1 - angle2), np.pi - abs(angle1 - angle2))

        tolerance_rad = np.deg2rad(self.angle_tolerance_deg)

        return angle_diff < tolerance_rad

    def _distance_between_walls(
        self,
        wall1: WallSegment,
        wall2: WallSegment
    ) -> float:
        """
        Calculate minimum distance between two wall segments.

        Args:
            wall1: First wall
            wall2: Second wall

        Returns:
            Minimum distance in meters
        """
        # Get all endpoint combinations
        points1 = [(wall1.start_x, wall1.start_y), (wall1.end_x, wall1.end_y)]
        points2 = [(wall2.start_x, wall2.start_y), (wall2.end_x, wall2.end_y)]

        min_dist = float('inf')

        for p1 in points1:
            for p2 in points2:
                dist = np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
                min_dist = min(min_dist, dist)

        return min_dist

    def _merge_two_walls(
        self,
        wall1: WallSegment,
        wall2: WallSegment
    ) -> WallSegment:
        """
        Merge two collinear walls into one.

        Args:
            wall1: First wall
            wall2: Second wall

        Returns:
            Merged wall segment
        """
        # Get all endpoints
        points = [
            (wall1.start_x, wall1.start_y),
            (wall1.end_x, wall1.end_y),
            (wall2.start_x, wall2.start_y),
            (wall2.end_x, wall2.end_y)
        ]

        # Find the two points that are farthest apart
        max_dist = 0
        best_pair = (0, 1)

        for i in range(len(points)):
            for j in range(i + 1, len(points)):
                dist = np.sqrt((points[i][0] - points[j][0])**2 +
                             (points[i][1] - points[j][1])**2)
                if dist > max_dist:
                    max_dist = dist
                    best_pair = (i, j)

        # Create merged wall
        p1 = points[best_pair[0]]
        p2 = points[best_pair[1]]

        merged = WallSegment(
            start_x=p1[0],
            start_y=p1[1],
            end_x=p2[0],
            end_y=p2[1],
            confidence=max(wall1.confidence, wall2.confidence),
            length=max_dist,
            wall_type=wall1.wall_type if wall1.confidence > wall2.confidence else wall2.wall_type
        )

        return merged

    def merge_collinear_walls(self, walls: List[WallSegment]) -> List[WallSegment]:
        """
        Merge collinear wall segments.

        Args:
            walls: List of wall segments

        Returns:
            Merged list
        """
        if len(walls) < 2:
            return walls

        logger.info(f"Merging {len(walls)} walls...")

        merged = []
        used = set()

        for i in range(len(walls)):
            if i in used:
                continue

            current = walls[i]
            used.add(i)

            # Try to merge with other walls
            merged_any = True
            while merged_any:
                merged_any = False

                for j in range(len(walls)):
                    if j in used:
                        continue

                    # Check if collinear and close
                    if self._are_collinear(current, walls[j]):
                        dist = self._distance_between_walls(current, walls[j])

                        if dist < self.merge_distance_m:
                            # Merge
                            current = self._merge_two_walls(current, walls[j])
                            used.add(j)
                            merged_any = True

            merged.append(current)

        logger.info(f"Merged into {len(merged)} wall segments")

        return merged

    def cluster_walls_by_position(
        self,
        walls: List[WallSegment],
        eps: float = 1.0
    ) -> List[List[WallSegment]]:
        """
        Cluster walls by spatial position using DBSCAN.

        Args:
            walls: List of wall segments
            eps: DBSCAN eps parameter (meters)

        Returns:
            List of wall clusters
        """
        if len(walls) == 0:
            return []

        # Extract wall centers
        centers = np.array([
            [(w.start_x + w.end_x) / 2, (w.start_y + w.end_y) / 2]
            for w in walls
        ])

        # Cluster
        clustering = DBSCAN(eps=eps, min_samples=1).fit(centers)
        labels = clustering.labels_

        # Group by cluster
        clusters = {}
        for idx, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(walls[idx])

        logger.info(f"Clustered {len(walls)} walls into {len(clusters)} groups")

        return list(clusters.values())

    def snap_walls_to_principal_axes(self, walls: List[WallSegment]) -> List[WallSegment]:
        """
        Snap walls to principal axes (0°, 90°, 45°, 135°) for cleaner appearance.

        Args:
            walls: List of wall segments

        Returns:
            List of snapped wall segments
        """
        snap_tolerance_deg = 5.0  # Snap if within 5° of principal angle
        principal_angles = [0, 45, 90, 135]  # Principal axes in degrees

        snapped_walls = []

        for wall in walls:
            angle = self._get_wall_angle(wall)
            angle_deg = np.rad2deg(angle)

            # Find nearest principal angle
            nearest_angle = min(principal_angles, key=lambda x: min(abs(angle_deg - x), abs(angle_deg - x + 180)))

            # Check if within tolerance
            angle_diff = min(abs(angle_deg - nearest_angle), abs(angle_deg - nearest_angle + 180))

            if angle_diff < snap_tolerance_deg:
                # Snap to principal angle
                snapped_wall = self._rotate_wall_to_angle(wall, nearest_angle)
                snapped_walls.append(snapped_wall)
                logger.debug(f"Snapped wall from {angle_deg:.1f}° to {nearest_angle}°")
            else:
                # Keep original
                snapped_walls.append(wall)

        num_snapped = sum(1 for i, (orig, snapped) in enumerate(zip(walls, snapped_walls))
                         if not np.allclose([orig.start_x, orig.start_y, orig.end_x, orig.end_y],
                                           [snapped.start_x, snapped.start_y, snapped.end_x, snapped.end_y]))

        logger.info(f"Snapped {num_snapped}/{len(walls)} walls to principal axes")

        return snapped_walls

    def _rotate_wall_to_angle(self, wall: WallSegment, target_angle_deg: float) -> WallSegment:
        """
        Rotate wall to target angle while keeping center point fixed.

        Args:
            wall: Wall segment to rotate
            target_angle_deg: Target angle in degrees

        Returns:
            Rotated wall segment
        """
        # Calculate wall center
        center_x = (wall.start_x + wall.end_x) / 2
        center_y = (wall.start_y + wall.end_y) / 2

        # Calculate half-length
        half_length = wall.length / 2

        # Convert target angle to radians
        target_angle_rad = np.deg2rad(target_angle_deg)

        # Calculate new endpoints
        dx = half_length * np.cos(target_angle_rad)
        dy = half_length * np.sin(target_angle_rad)

        new_start_x = center_x - dx
        new_start_y = center_y - dy
        new_end_x = center_x + dx
        new_end_y = center_y + dy

        # Create snapped wall
        snapped_wall = WallSegment(
            start_x=new_start_x,
            start_y=new_start_y,
            end_x=new_end_x,
            end_y=new_end_y,
            confidence=wall.confidence,
            length=wall.length,
            wall_type=wall.wall_type
        )

        return snapped_wall

    def merge_walls(self, walls: List[WallSegment]) -> List[WallSegment]:
        """
        Complete wall merging pipeline.

        Args:
            walls: List of wall segments

        Returns:
            Merged and filtered wall segments
        """
        logger.info(f"Starting wall merging pipeline with {len(walls)} walls...")

        # Step 1: Filter short walls
        walls = self.filter_short_walls(walls)

        if len(walls) == 0:
            logger.warning("No walls remaining after filtering")
            return []

        # Step 2: Snap to principal axes for cleaner appearance
        walls = self.snap_walls_to_principal_axes(walls)

        # Step 3: Merge collinear walls (after snapping, more walls will be collinear)
        walls = self.merge_collinear_walls(walls)

        # Step 4: Filter again (merged walls might still be short)
        walls = self.filter_short_walls(walls)

        logger.info(f"Wall merging complete: {len(walls)} final walls")

        return walls

    def analyze_wall_statistics(self, walls: List[WallSegment]) -> dict:
        """
        Analyze wall statistics.

        Args:
            walls: List of wall segments

        Returns:
            Dictionary with statistics
        """
        if not walls:
            return {
                "count": 0,
                "total_length_m": 0,
                "avg_length_m": 0,
                "max_length_m": 0,
                "min_length_m": 0
            }

        lengths = [w.length for w in walls]
        confidences = [w.confidence for w in walls]

        # Analyze angles
        angles = [self._get_wall_angle(w) for w in walls]
        angles_deg = [np.rad2deg(a) for a in angles]

        stats = {
            "count": len(walls),
            "total_length_m": sum(lengths),
            "avg_length_m": np.mean(lengths),
            "max_length_m": max(lengths),
            "min_length_m": min(lengths),
            "median_length_m": np.median(lengths),
            "avg_confidence": np.mean(confidences),
            "avg_angle_deg": np.mean(angles_deg),
            "angle_std_deg": np.std(angles_deg)
        }

        return stats
