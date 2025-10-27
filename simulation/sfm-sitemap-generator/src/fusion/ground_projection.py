"""Project 3D point cloud to 2D ground plane."""

import numpy as np
from typing import Tuple, Optional

from .point_cloud import PointCloud
from ..utils.geometry import fit_plane_ransac, align_points_to_xy_plane


class GroundPlaneProjector:
    """Project 3D points to 2D ground plane."""

    def __init__(self, ground_tolerance: float = 0.5):
        """
        Initialize ground plane projector.

        Args:
            ground_tolerance: Height tolerance for ground plane (meters)
        """
        self.ground_tolerance = ground_tolerance
        self.ground_plane_normal: Optional[np.ndarray] = None
        self.ground_plane_point: Optional[np.ndarray] = None
        self.transform_R: Optional[np.ndarray] = None
        self.transform_t: Optional[np.ndarray] = None

    def fit_ground_plane(self, point_cloud: PointCloud) -> Tuple[np.ndarray, np.ndarray]:
        """
        Fit ground plane to lowest points in cloud.

        Args:
            point_cloud: Input point cloud

        Returns:
            (normal, point_on_plane) - Ground plane parameters
        """
        # Extract lower percentile of points (likely ground)
        z_values = point_cloud.points[:, 2]
        threshold = np.percentile(z_values, 20)  # Bottom 20%
        ground_candidates = point_cloud.points[z_values <= threshold]

        # Fit plane using RANSAC
        # Use min_samples = min(20% of points, actual number of points)
        min_samples = min(max(3, len(ground_candidates) // 5), len(ground_candidates))

        normal, point = fit_plane_ransac(
            ground_candidates,
            threshold=0.1,
            min_samples=min_samples,
            max_iterations=1000
        )

        self.ground_plane_normal = normal
        self.ground_plane_point = point

        return normal, point

    def align_to_xy_plane(self, point_cloud: PointCloud) -> PointCloud:
        """
        Align point cloud so ground plane becomes XY plane (z=0).

        Args:
            point_cloud: Input point cloud

        Returns:
            Aligned point cloud
        """
        if self.ground_plane_normal is None:
            self.fit_ground_plane(point_cloud)

        # Align points to XY plane
        aligned_points, R, t = align_points_to_xy_plane(point_cloud.points)

        # Store transformation for later use
        self.transform_R = R
        self.transform_t = t

        return PointCloud(
            points=aligned_points,
            colors=point_cloud.colors,
            camera_id=point_cloud.camera_id
        )

    def filter_ground_points(self, point_cloud: PointCloud) -> PointCloud:
        """
        Filter points near ground plane (z ≈ 0 after alignment).

        Args:
            point_cloud: Aligned point cloud

        Returns:
            Filtered point cloud with only ground points
        """
        z_values = point_cloud.points[:, 2]
        mask = np.abs(z_values) <= self.ground_tolerance

        return PointCloud(
            points=point_cloud.points[mask],
            colors=point_cloud.colors[mask] if point_cloud.colors is not None else None,
            camera_id=point_cloud.camera_id
        )

    def project_to_2d(self, point_cloud: PointCloud) -> np.ndarray:
        """
        Project 3D points to 2D (drop z coordinate).

        Args:
            point_cloud: 3D point cloud

        Returns:
            Nx2 array of 2D points (x, y)
        """
        return point_cloud.points[:, :2]

    def full_pipeline(self, point_cloud: PointCloud) -> Tuple[np.ndarray, PointCloud]:
        """
        Complete pipeline: align, filter, and project to 2D.

        Args:
            point_cloud: Input 3D point cloud

        Returns:
            (points_2d, aligned_cloud) - 2D points and aligned cloud
        """
        # Step 1: Align to XY plane
        aligned = self.align_to_xy_plane(point_cloud)

        # Step 2: Filter to ground points
        ground_points = self.filter_ground_points(aligned)

        # Step 3: Project to 2D
        points_2d = self.project_to_2d(ground_points)

        return points_2d, ground_points
