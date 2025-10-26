"""Bayesian fusion of multiple camera observations."""

import numpy as np
from typing import List, Tuple, Dict
from dataclasses import dataclass

from core.camera import CameraCalibration, CameraConfig
from core.ground_plane import GroundPlaneMapper
from vision.segmentation import SemanticSegmenter, SegmentationResult, SegmentClass
from fusion.occupancy_grid import OccupancyGrid


@dataclass
class CameraObservation:
    """Observation from a single camera."""
    camera_id: str
    segmentation: SegmentationResult
    calibration: CameraCalibration
    ground_mapper: GroundPlaneMapper
    image: np.ndarray


class MultiViewFusion:
    """Fuse observations from multiple cameras into occupancy grid."""

    def __init__(self, occupancy_grid: OccupancyGrid):
        """
        Initialize multi-view fusion.

        Args:
            occupancy_grid: Shared occupancy grid
        """
        self.grid = occupancy_grid

    def fuse_observation(self, observation: CameraObservation,
                        image_shape: Tuple[int, int]):
        """
        Fuse a single camera observation into the occupancy grid.

        Args:
            observation: Camera observation
            image_shape: (height, width) of image
        """
        # Process walkable areas (free space)
        self._fuse_walkable(observation, image_shape)

        # Process walls and obstacles (occupied space)
        self._fuse_obstacles(observation, image_shape)

    def _fuse_walkable(self, observation: CameraObservation,
                      image_shape: Tuple[int, int]):
        """
        Fuse walkable areas into occupancy grid as free space.

        Args:
            observation: Camera observation
            image_shape: (height, width) of image
        """
        segmenter = SemanticSegmenter()  # TODO: pass as parameter
        walkable_mask = segmenter.extract_class_mask(
            observation.segmentation,
            SegmentClass.WALKABLE,
            min_confidence=0.5
        )

        # Sample points from walkable mask
        y_coords, x_coords = np.where(walkable_mask)

        if len(x_coords) == 0:
            return

        # Subsample to reduce computation (every Nth pixel)
        step = max(1, len(x_coords) // 10000)
        x_coords = x_coords[::step]
        y_coords = y_coords[::step]

        image_points = np.column_stack([x_coords, y_coords])

        # Map to ground plane
        ground_points = observation.ground_mapper.image_to_ground(image_points)

        # Compute confidence based on distance from camera
        camera_pos = observation.calibration.get_camera_center()[:2]
        distances = np.linalg.norm(ground_points - camera_pos, axis=1)

        # Confidence decreases with distance
        # At 0m: 1.0, at 50m: 0.5, exponential decay
        confidence = np.exp(-distances / 30.0)

        # Also weight by segmentation confidence
        seg_confidence = observation.segmentation.confidence_map[y_coords, x_coords]
        combined_confidence = confidence * seg_confidence

        # Update grid
        for point, conf in zip(ground_points, combined_confidence):
            self.grid.mark_free(point.reshape(1, -1), confidence=float(conf))

    def _fuse_obstacles(self, observation: CameraObservation,
                       image_shape: Tuple[int, int]):
        """
        Fuse obstacles (walls, objects) into occupancy grid.

        Args:
            observation: Camera observation
            image_shape: (height, width) of image
        """
        segmenter = SemanticSegmenter()  # TODO: pass as parameter

        # Combine wall and obstacle masks
        wall_mask = segmenter.extract_class_mask(
            observation.segmentation,
            SegmentClass.WALL,
            min_confidence=0.6
        )

        obstacle_mask = segmenter.extract_class_mask(
            observation.segmentation,
            SegmentClass.OBSTACLE,
            min_confidence=0.6
        )

        occupied_mask = wall_mask | obstacle_mask

        # Extract boundaries (more precise than full region)
        boundaries = segmenter.extract_boundaries(occupied_mask, kernel_size=3)

        # Sample boundary points
        y_coords, x_coords = np.where(boundaries)

        if len(x_coords) == 0:
            return

        # Subsample
        step = max(1, len(x_coords) // 5000)
        x_coords = x_coords[::step]
        y_coords = y_coords[::step]

        image_points = np.column_stack([x_coords, y_coords])

        # Map to ground plane
        ground_points = observation.ground_mapper.image_to_ground(image_points)

        # Compute confidence
        camera_pos = observation.calibration.get_camera_center()[:2]
        distances = np.linalg.norm(ground_points - camera_pos, axis=1)

        # Higher confidence for obstacles (we're more certain)
        confidence = np.exp(-distances / 40.0) * 1.2
        confidence = np.clip(confidence, 0, 1)

        # Segmentation confidence
        seg_confidence = observation.segmentation.confidence_map[y_coords, x_coords]
        combined_confidence = confidence * seg_confidence

        # Update grid
        for point, conf in zip(ground_points, combined_confidence):
            self.grid.mark_occupied(point.reshape(1, -1), confidence=float(conf))

    def fuse_multiple_observations(self, observations: List[CameraObservation],
                                   image_shapes: Dict[str, Tuple[int, int]]):
        """
        Fuse observations from multiple cameras.

        Args:
            observations: List of camera observations
            image_shapes: Dictionary mapping camera_id to (height, width)
        """
        for obs in observations:
            image_shape = image_shapes.get(obs.camera_id)
            if image_shape is None:
                image_shape = obs.image.shape[:2]

            self.fuse_observation(obs, image_shape)

    def compute_observation_weight(self, camera_pos: np.ndarray,
                                  ground_point: np.ndarray,
                                  view_direction: np.ndarray) -> float:
        """
        Compute weight for observation based on geometry.

        Observations are weighted by:
        - Distance (closer is better)
        - Viewing angle (perpendicular is better)
        - Occlusion (visible is better)

        Args:
            camera_pos: Camera position [x, y]
            ground_point: Ground point [x, y]
            view_direction: Camera view direction [x, y] (unit vector)

        Returns:
            Weight between 0 and 1
        """
        # Distance weight
        distance = np.linalg.norm(ground_point - camera_pos)
        distance_weight = np.exp(-distance / 30.0)

        # Viewing angle weight
        to_point = ground_point - camera_pos
        to_point_norm = to_point / (np.linalg.norm(to_point) + 1e-6)

        # Cosine of angle between view direction and ray to point
        cos_angle = np.dot(view_direction, to_point_norm)

        # Perpendicular viewing is best (cos_angle ≈ 0)
        # But we want points in front of camera (cos_angle > 0)
        angle_weight = max(0, cos_angle) * 0.5 + 0.5

        # Combined weight
        weight = distance_weight * angle_weight

        return float(weight)
