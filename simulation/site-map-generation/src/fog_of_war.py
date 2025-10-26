"""Fog of war handling with square room assumptions for unexplored areas."""

import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
import logging
from shapely.geometry import Polygon, MultiPolygon, Point, LineString
from shapely.ops import unary_union, polygonize
from shapely import affinity

from .config import settings
from .occupancy_mapper import OccupancyGrid
from .wall_detector import WallSegment

logger = logging.getLogger(__name__)


@dataclass
class FogOfWarRegion:
    """A region marked as fog of war with assumed geometry."""

    polygon: List[Tuple[float, float]]  # vertices in world coordinates
    confidence: float  # 0-1
    assumed_type: str  # 'square_room', 'rectangular_room', 'unknown'
    area_m2: float  # area in square meters

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "polygon": [{"x": x, "y": y} for x, y in self.polygon],
            "confidence": self.confidence,
            "assumed_type": self.assumed_type,
            "area_m2": self.area_m2
        }


class FogOfWarProcessor:
    """Process fog of war regions and fill with assumed room geometries."""

    def __init__(self):
        """Initialize fog of war processor."""
        self.square_aspect_min = settings.square_room_aspect_ratio_min
        self.square_aspect_max = settings.square_room_aspect_ratio_max
        self.fog_confidence_threshold = settings.fog_confidence_threshold

    def identify_fog_regions(self, grid: OccupancyGrid) -> List[Polygon]:
        """
        Identify unexplored regions (fog of war) in the occupancy grid.

        Args:
            grid: Occupancy grid

        Returns:
            List of Polygon objects representing fog regions
        """
        logger.info("Identifying fog of war regions...")

        # Get unexplored mask
        unexplored = grid.get_unexplored_regions()

        # Also include low-confidence explored areas
        confidence = grid.get_confidence_map()
        low_confidence = confidence < self.fog_confidence_threshold

        # Combine masks
        fog_mask = unexplored | low_confidence

        # Convert to polygons
        fog_polygons = self._mask_to_polygons(fog_mask, grid)

        logger.info(f"Identified {len(fog_polygons)} fog of war regions")

        return fog_polygons

    def _mask_to_polygons(self, mask: np.ndarray, grid: OccupancyGrid) -> List[Polygon]:
        """
        Convert binary mask to polygons.

        Args:
            mask: Binary mask (True = fog)
            grid: Occupancy grid

        Returns:
            List of Polygon objects in world coordinates
        """
        import cv2

        # Find contours
        mask_uint8 = mask.astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        polygons = []

        for contour in contours:
            if len(contour) < 3:
                continue

            # Convert grid coordinates to world coordinates
            world_coords = []
            for point in contour[:, 0, :]:
                col, row = point
                x, y = grid.grid_to_world(row, col)
                world_coords.append((x, y))

            # Create polygon
            try:
                poly = Polygon(world_coords)
                if poly.is_valid and poly.area > 0:
                    polygons.append(poly)
            except Exception as e:
                logger.warning(f"Failed to create polygon from contour: {e}")
                continue

        return polygons

    def fill_fog_with_assumptions(
        self,
        fog_regions: List[Polygon],
        walls: List[WallSegment]
    ) -> List[FogOfWarRegion]:
        """
        Fill fog of war regions with assumed room geometries.

        Args:
            fog_regions: List of fog polygons
            walls: Detected wall segments

        Returns:
            List of FogOfWarRegion objects with assumed geometries
        """
        logger.info(f"Filling {len(fog_regions)} fog regions with assumptions...")

        assumed_regions = []

        for fog_poly in fog_regions:
            # Get bounding box
            bbox = fog_poly.bounds  # (minx, miny, maxx, maxy)
            width = bbox[2] - bbox[0]
            height = bbox[3] - bbox[1]

            # Check aspect ratio
            aspect_ratio = width / height if height > 0 else 999

            # Determine assumed type
            if self.square_aspect_min <= aspect_ratio <= self.square_aspect_max:
                assumed_type = "square_room"
                confidence = 0.4  # Medium-low confidence
            elif 0.5 <= aspect_ratio <= 2.0:
                assumed_type = "rectangular_room"
                confidence = 0.3  # Low confidence
            else:
                assumed_type = "unknown"
                confidence = 0.1  # Very low confidence

            # Create axis-aligned bounding box as assumed room
            assumed_polygon = [
                (bbox[0], bbox[1]),  # bottom-left
                (bbox[2], bbox[1]),  # bottom-right
                (bbox[2], bbox[3]),  # top-right
                (bbox[0], bbox[3]),  # top-left
            ]

            area = width * height

            region = FogOfWarRegion(
                polygon=assumed_polygon,
                confidence=confidence,
                assumed_type=assumed_type,
                area_m2=area
            )

            assumed_regions.append(region)

        logger.info(f"Created {len(assumed_regions)} assumed room regions")

        return assumed_regions

    def find_enclosed_gaps(
        self,
        walls: List[WallSegment],
        grid: OccupancyGrid
    ) -> List[Polygon]:
        """
        Find enclosed gaps between wall segments.

        Args:
            walls: List of wall segments
            grid: Occupancy grid

        Returns:
            List of enclosed gap polygons
        """
        if not walls:
            return []

        logger.info("Finding enclosed gaps between walls...")

        # Convert walls to LineString objects
        lines = []
        for wall in walls:
            line = LineString([(wall.start_x, wall.start_y), (wall.end_x, wall.end_y)])
            lines.append(line)

        # Union all lines
        merged = unary_union(lines)

        # Polygonize to find enclosed areas
        polygons = list(polygonize(merged))

        logger.info(f"Found {len(polygons)} enclosed gaps")

        return polygons

    def classify_fog_confidence(
        self,
        fog_region: Polygon,
        grid: OccupancyGrid
    ) -> float:
        """
        Classify confidence of fog region based on nearby explored areas.

        Args:
            fog_region: Fog polygon
            grid: Occupancy grid

        Returns:
            Confidence value (0-1)
        """
        # Sample grid cells within polygon
        minx, miny, maxx, maxy = fog_region.bounds

        # Convert to grid coordinates
        min_row, min_col = grid.world_to_grid(minx, miny)
        max_row, max_col = grid.world_to_grid(maxx, maxy)

        # Sample cells
        confidence_values = []

        for row in range(max(0, min_row), min(grid.height_cells, max_row + 1)):
            for col in range(max(0, min_col), min(grid.width_cells, max_col + 1)):
                x, y = grid.grid_to_world(row, col)

                if fog_region.contains(Point(x, y)):
                    # Check nearby cells for confidence
                    nearby_conf = self._get_nearby_confidence(row, col, grid, radius=5)
                    confidence_values.append(nearby_conf)

        if not confidence_values:
            return 0.2  # Default low confidence

        # Average confidence of nearby areas
        return float(np.mean(confidence_values))

    def _get_nearby_confidence(
        self,
        row: int,
        col: int,
        grid: OccupancyGrid,
        radius: int = 5
    ) -> float:
        """
        Get average confidence of nearby cells.

        Args:
            row: Grid row
            col: Grid column
            grid: Occupancy grid
            radius: Search radius in cells

        Returns:
            Average confidence
        """
        confidences = []

        for dr in range(-radius, radius + 1):
            for dc in range(-radius, radius + 1):
                r = row + dr
                c = col + dc

                if grid.is_valid_cell(r, c) and grid.explored[r, c]:
                    conf = min(grid.count[r, c] / 5.0, 1.0)
                    confidences.append(conf)

        if not confidences:
            return 0.0

        return float(np.mean(confidences))

    def create_wall_segments_from_assumptions(
        self,
        fog_regions: List[FogOfWarRegion]
    ) -> List[WallSegment]:
        """
        Create wall segments for assumed room boundaries.

        Args:
            fog_regions: List of assumed fog regions

        Returns:
            List of WallSegment objects for boundaries
        """
        walls = []

        for region in fog_regions:
            polygon = region.polygon

            # Create wall segments for each edge
            for i in range(len(polygon)):
                p1 = polygon[i]
                p2 = polygon[(i + 1) % len(polygon)]

                length = np.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

                wall = WallSegment(
                    start_x=p1[0],
                    start_y=p1[1],
                    end_x=p2[0],
                    end_y=p2[1],
                    confidence=region.confidence,  # Inherit from region
                    length=length,
                    wall_type="assumed"
                )

                walls.append(wall)

        logger.info(f"Created {len(walls)} wall segments from assumed regions")

        return walls
