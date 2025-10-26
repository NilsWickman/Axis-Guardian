"""Coverage gap analysis for detecting room boundaries and internal walls."""

import numpy as np
import logging
from typing import List, Tuple, Dict, Set
from dataclasses import dataclass
import cv2

from .wall_detector import WallSegment
from .occupancy_mapper import OccupancyGrid
from .coordinate_transform import CoordinateTransformer

logger = logging.getLogger(__name__)


@dataclass
class CameraGroup:
    """Group of cameras with overlapping coverage."""
    camera_indices: List[int]
    coverage_mask: np.ndarray
    center_of_mass: Tuple[float, float]


class CoverageAnalyzer:
    """Analyze camera coverage to detect room boundaries."""

    def __init__(self):
        """Initialize coverage analyzer."""
        self.min_gap_width_m = 0.5  # Minimum gap width to consider as wall
        self.min_wall_length_m = 1.0  # Minimum wall length to report

    def _create_coverage_map_from_masks(
        self,
        camera_explored_masks: List[np.ndarray]
    ) -> np.ndarray:
        """
        Create coverage map from pre-computed per-camera explored masks.

        Args:
            camera_explored_masks: List of per-camera explored masks

        Returns:
            Coverage map (HxWxN) where N is number of cameras
        """
        num_cameras = len(camera_explored_masks)

        if num_cameras == 0:
            raise ValueError("No camera masks provided")

        # Get grid dimensions from first mask
        height, width = camera_explored_masks[0].shape

        # Stack masks into coverage map
        coverage_map = np.stack(camera_explored_masks, axis=2)

        logger.info(f"Created coverage map from {num_cameras} pre-computed masks ({height}x{width})")

        # Log coverage statistics
        for cam_idx, mask in enumerate(camera_explored_masks):
            num_covered = mask.sum()
            total_cells = mask.size
            logger.info(f"  Camera {cam_idx + 1} covers {num_covered:,} cells ({100*num_covered/total_cells:.1f}%)")

        return coverage_map

    def create_coverage_map(
        self,
        grid: OccupancyGrid,
        transformers: List[CoordinateTransformer],
        max_distances: List[float]
    ) -> np.ndarray:
        """
        Create coverage map showing which cameras can see each grid cell.

        Args:
            grid: Occupancy grid
            transformers: List of coordinate transformers (one per camera)
            max_distances: Maximum viewing distance for each camera

        Returns:
            Coverage map (HxWxN) where N is number of cameras
            Each channel is binary mask for one camera
        """
        num_cameras = len(transformers)
        coverage_map = np.zeros((grid.height_cells, grid.width_cells, num_cameras), dtype=bool)

        logger.info(f"Creating coverage map for {num_cameras} cameras...")

        for cam_idx, (transformer, max_dist) in enumerate(zip(transformers, max_distances)):
            logger.info(f"  Processing coverage for camera {cam_idx + 1}/{num_cameras}...")

            # Get FOV footprint
            footprint = transformer.get_fov_footprint(max_dist)

            # Rasterize polygon
            from shapely.geometry import Polygon
            from shapely.prepared import prep

            poly = Polygon(footprint)
            prepared_poly = prep(poly)

            # Check each grid cell
            for row in range(grid.height_cells):
                for col in range(grid.width_cells):
                    x, y = grid.grid_to_world(row, col)
                    from shapely.geometry import Point
                    if prepared_poly.contains(Point(x, y)):
                        coverage_map[row, col, cam_idx] = True

            num_covered = coverage_map[:, :, cam_idx].sum()
            total_cells = grid.height_cells * grid.width_cells
            logger.info(f"    Camera {cam_idx + 1} covers {num_covered:,} cells ({100*num_covered/total_cells:.1f}%)")

        return coverage_map

    def find_camera_groups(
        self,
        coverage_map: np.ndarray,
        min_overlap: float = 0.01,
        use_spatial_clustering: bool = True
    ) -> List[CameraGroup]:
        """
        Group cameras by overlapping coverage or spatial proximity.

        Args:
            coverage_map: Coverage map (HxWxN)
            min_overlap: Minimum overlap ratio to group cameras
            use_spatial_clustering: If True, also group cameras by spatial proximity

        Returns:
            List of camera groups
        """
        num_cameras = coverage_map.shape[2]
        logger.info(f"Finding camera groups from {num_cameras} cameras...")

        # Build overlap matrix
        overlap_matrix = np.zeros((num_cameras, num_cameras))

        # Also build spatial proximity matrix
        centers = []
        for i in range(num_cameras):
            coverage_i = coverage_map[:, :, i]
            if coverage_i.sum() > 0:
                rows, cols = np.where(coverage_i)
                center = (rows.mean(), cols.mean())
            else:
                center = (0, 0)
            centers.append(center)

        for i in range(num_cameras):
            for j in range(i + 1, num_cameras):
                coverage_i = coverage_map[:, :, i]
                coverage_j = coverage_map[:, :, j]

                intersection = np.logical_and(coverage_i, coverage_j).sum()
                union = np.logical_or(coverage_i, coverage_j).sum()

                if union > 0:
                    iou = intersection / union
                    overlap_matrix[i, j] = iou
                    overlap_matrix[j, i] = iou

        # Use Union-Find to group cameras
        parent = list(range(num_cameras))

        def find(x):
            if parent[x] != x:
                parent[x] = find(parent[x])
            return parent[x]

        def union(x, y):
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py

        # Group cameras by overlap or spatial proximity
        for i in range(num_cameras):
            for j in range(i + 1, num_cameras):
                # Group if they have overlap
                if overlap_matrix[i, j] > min_overlap:
                    union(i, j)
                    continue

                # Or if they're spatially close (same region)
                if use_spatial_clustering:
                    dist = np.sqrt((centers[i][0] - centers[j][0])**2 +
                                 (centers[i][1] - centers[j][1])**2)
                    # Group if centers are within 20% of grid height (vertical separation)
                    # This helps identify cameras in different rooms (upper vs lower)
                    max_dist = 0.2 * coverage_map.shape[0]  # 20% of grid height
                    if dist < max_dist:
                        union(i, j)

        # Extract groups
        group_dict = {}
        for i in range(num_cameras):
            root = find(i)
            if root not in group_dict:
                group_dict[root] = []
            group_dict[root].append(i)

        groups = []
        for camera_indices in group_dict.values():
            # Create combined coverage mask
            combined_mask = np.any(coverage_map[:, :, camera_indices], axis=2)

            # Calculate center of mass
            rows, cols = np.where(combined_mask)
            if len(rows) > 0:
                center_row = rows.mean()
                center_col = cols.mean()
            else:
                center_row = 0
                center_col = 0

            group = CameraGroup(
                camera_indices=camera_indices,
                coverage_mask=combined_mask,
                center_of_mass=(center_row, center_col)
            )

            groups.append(group)

        logger.info(f"  Found {len(groups)} camera groups")
        for idx, group in enumerate(groups):
            logger.info(f"    Group {idx + 1}: cameras {group.camera_indices}, "
                       f"coverage: {group.coverage_mask.sum():,} cells")

        return groups

    def detect_coverage_gaps(
        self,
        grid: OccupancyGrid,
        groups: List[CameraGroup]
    ) -> List[np.ndarray]:
        """
        Detect gaps between camera group coverages.

        Args:
            grid: Occupancy grid
            groups: List of camera groups

        Returns:
            List of gap masks (one per pair of groups)
        """
        logger.info("Detecting coverage gaps between camera groups...")

        gaps = []

        for i in range(len(groups)):
            for j in range(i + 1, len(groups)):
                group_i = groups[i]
                group_j = groups[j]

                # Create combined coverage
                combined = np.logical_or(group_i.coverage_mask, group_j.coverage_mask)

                # Find boundary between groups
                # Dilate each group's coverage slightly
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                dilated_i = cv2.dilate(group_i.coverage_mask.astype(np.uint8), kernel)
                dilated_j = cv2.dilate(group_j.coverage_mask.astype(np.uint8), kernel)

                # Gap is where dilated regions meet but neither original region covers
                gap = np.logical_and(
                    np.logical_and(dilated_i, dilated_j),
                    np.logical_not(np.logical_or(group_i.coverage_mask, group_j.coverage_mask))
                )

                if gap.sum() > 0:
                    logger.info(f"  Found gap between groups {i+1} and {j+1}: {gap.sum():,} cells")
                    gaps.append(gap)

        return gaps

    def extract_wall_from_gap(
        self,
        grid: OccupancyGrid,
        gap_mask: np.ndarray
    ) -> List[WallSegment]:
        """
        Extract wall segments from coverage gap.

        Args:
            grid: Occupancy grid
            gap_mask: Binary mask of gap region

        Returns:
            List of wall segments
        """
        if gap_mask.sum() == 0:
            return []

        # Find skeleton of gap (thin line representing wall)
        from skimage.morphology import skeletonize

        skeleton = skeletonize(gap_mask)

        # Find contours/lines in skeleton
        skeleton_uint8 = (skeleton * 255).astype(np.uint8)

        # Use Hough Line Transform to detect lines
        lines = cv2.HoughLinesP(
            skeleton_uint8,
            rho=1,
            theta=np.pi/180,
            threshold=10,
            minLineLength=int(self.min_wall_length_m / grid.resolution_m),
            maxLineGap=int(0.5 / grid.resolution_m)  # Allow 0.5m gaps
        )

        if lines is None:
            logger.warning("  No lines found in gap skeleton")
            return []

        wall_segments = []

        for line in lines:
            x1, y1, x2, y2 = line[0]

            # Convert grid coordinates to world coordinates
            wx1, wy1 = grid.grid_to_world(int(y1), int(x1))
            wx2, wy2 = grid.grid_to_world(int(y2), int(x2))

            # Calculate length
            length = np.sqrt((wx2 - wx1)**2 + (wy2 - wy1)**2)

            if length < self.min_wall_length_m:
                continue

            wall = WallSegment(
                start_x=wx1,
                start_y=wy1,
                end_x=wx2,
                end_y=wy2,
                confidence=0.8,  # High confidence - inferred from coverage gap
                length=length,
                wall_type="internal"  # Interior wall separating rooms
            )

            wall_segments.append(wall)

        return wall_segments

    def detect_room_boundaries(
        self,
        grid: OccupancyGrid,
        transformers: List[CoordinateTransformer],
        max_distances: List[float],
        camera_explored_masks: List[np.ndarray] = None
    ) -> List[WallSegment]:
        """
        Detect room boundaries from camera coverage gaps.

        Args:
            grid: Occupancy grid
            transformers: Camera coordinate transformers
            max_distances: Maximum viewing distance per camera
            camera_explored_masks: Pre-computed per-camera explored masks (preferred)

        Returns:
            List of detected internal wall segments
        """
        logger.info("Detecting room boundaries from coverage gaps...")

        # Step 1: Create coverage map
        if camera_explored_masks is not None:
            # Use pre-computed masks (avoids coordinate transform issues)
            logger.info(f"Using pre-computed camera explored masks ({len(camera_explored_masks)} cameras)")
            coverage_map = self._create_coverage_map_from_masks(camera_explored_masks)
        else:
            # Fallback: rasterize FOVs (may have coordinate issues after grid cropping)
            logger.warning("No pre-computed masks provided, rasterizing FOVs (may have coordinate issues)")
            coverage_map = self.create_coverage_map(grid, transformers, max_distances)

        # Step 2: Group cameras by overlap
        groups = self.find_camera_groups(coverage_map, min_overlap=0.05)

        if len(groups) < 2:
            logger.info("Only one camera group found - no internal walls to detect")
            return []

        # Step 3: Detect gaps between groups
        gaps = self.detect_coverage_gaps(grid, groups)

        if not gaps:
            logger.info("No coverage gaps found between camera groups")
            return []

        # Step 4: Extract walls from gaps
        internal_walls = []
        for gap_idx, gap in enumerate(gaps):
            logger.info(f"  Extracting walls from gap {gap_idx + 1}/{len(gaps)}...")
            walls = self.extract_wall_from_gap(grid, gap)
            internal_walls.extend(walls)

        logger.info(f"Detected {len(internal_walls)} internal wall segments from coverage gaps")

        return internal_walls

    def analyze_room_topology(
        self,
        grid: OccupancyGrid,
        coverage_map: np.ndarray
    ) -> Dict[str, any]:
        """
        Analyze room topology from coverage map.

        Args:
            grid: Occupancy grid
            coverage_map: Coverage map

        Returns:
            Dictionary with topology information
        """
        # Combined coverage (any camera sees it)
        any_coverage = np.any(coverage_map, axis=2)

        # Find connected components in covered area
        num_labels, labels = cv2.connectedComponents(any_coverage.astype(np.uint8))

        # num_labels includes background (0), so num_rooms = num_labels - 1
        num_rooms = num_labels - 1

        logger.info(f"Topology analysis: Found {num_rooms} connected regions")

        # Calculate area of each region
        region_areas = []
        for label in range(1, num_labels):
            region_mask = (labels == label)
            area_cells = region_mask.sum()
            area_m2 = area_cells * (grid.resolution_m ** 2)
            region_areas.append(area_m2)

        return {
            "num_regions": num_rooms,
            "region_areas_m2": region_areas,
            "labels": labels
        }
