"""3D point cloud processing."""

import numpy as np
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass


@dataclass
class PointCloud:
    """3D point cloud representation."""

    points: np.ndarray  # Nx3 array of 3D points
    colors: Optional[np.ndarray] = None  # Nx3 array of RGB colors (0-255)
    camera_id: Optional[str] = None  # Source camera ID

    def __post_init__(self):
        """Validate point cloud data."""
        assert self.points.ndim == 2 and self.points.shape[1] == 3, \
            "Points must be Nx3 array"

        if self.colors is not None:
            assert self.colors.shape == self.points.shape, \
                "Colors must match points shape"

    def transform(self, R: np.ndarray, t: np.ndarray) -> 'PointCloud':
        """
        Transform point cloud using rotation and translation.

        Args:
            R: 3x3 rotation matrix
            t: 3x1 translation vector

        Returns:
            Transformed point cloud
        """
        transformed_points = (R @ self.points.T).T + t.ravel()

        return PointCloud(
            points=transformed_points,
            colors=self.colors,
            camera_id=self.camera_id
        )

    def filter_by_bounds(
        self,
        min_bounds: Optional[np.ndarray] = None,
        max_bounds: Optional[np.ndarray] = None
    ) -> 'PointCloud':
        """
        Filter points within bounding box.

        Args:
            min_bounds: Minimum bounds (3,) or None
            max_bounds: Maximum bounds (3,) or None

        Returns:
            Filtered point cloud
        """
        mask = np.ones(len(self.points), dtype=bool)

        if min_bounds is not None:
            mask &= np.all(self.points >= min_bounds, axis=1)

        if max_bounds is not None:
            mask &= np.all(self.points <= max_bounds, axis=1)

        return PointCloud(
            points=self.points[mask],
            colors=self.colors[mask] if self.colors is not None else None,
            camera_id=self.camera_id
        )

    def downsample(self, voxel_size: float) -> 'PointCloud':
        """
        Downsample point cloud using voxel grid.

        Args:
            voxel_size: Size of voxel grid

        Returns:
            Downsampled point cloud
        """
        # Compute voxel indices
        voxel_indices = np.floor(self.points / voxel_size).astype(int)

        # Find unique voxels
        unique_voxels, inverse_indices = np.unique(
            voxel_indices,
            axis=0,
            return_inverse=True
        )

        # Average points in each voxel
        downsampled_points = np.zeros((len(unique_voxels), 3))
        downsampled_colors = np.zeros((len(unique_voxels), 3)) if self.colors is not None else None

        for i in range(len(unique_voxels)):
            mask = inverse_indices == i
            downsampled_points[i] = self.points[mask].mean(axis=0)

            if self.colors is not None:
                downsampled_colors[i] = self.colors[mask].mean(axis=0)

        return PointCloud(
            points=downsampled_points,
            colors=downsampled_colors,
            camera_id=self.camera_id
        )

    def compute_statistics(self) -> dict:
        """
        Compute statistics about point cloud.

        Returns:
            Dictionary of statistics
        """
        return {
            "num_points": len(self.points),
            "bounds_min": self.points.min(axis=0).tolist(),
            "bounds_max": self.points.max(axis=0).tolist(),
            "centroid": self.points.mean(axis=0).tolist(),
            "std_dev": self.points.std(axis=0).tolist(),
        }

    def save_ply(self, output_path: str):
        """
        Save point cloud to PLY file.

        Args:
            output_path: Output file path
        """
        with open(output_path, 'w') as f:
            # Write header
            f.write("ply\n")
            f.write("format ascii 1.0\n")
            f.write(f"element vertex {len(self.points)}\n")
            f.write("property float x\n")
            f.write("property float y\n")
            f.write("property float z\n")

            if self.colors is not None:
                f.write("property uchar red\n")
                f.write("property uchar green\n")
                f.write("property uchar blue\n")

            f.write("end_header\n")

            # Write points
            for i in range(len(self.points)):
                x, y, z = self.points[i]
                if self.colors is not None:
                    r, g, b = self.colors[i].astype(int)
                    f.write(f"{x} {y} {z} {r} {g} {b}\n")
                else:
                    f.write(f"{x} {y} {z}\n")


def merge_point_clouds(point_clouds: List[PointCloud]) -> PointCloud:
    """
    Merge multiple point clouds into one.

    Args:
        point_clouds: List of point clouds to merge

    Returns:
        Merged point cloud
    """
    if len(point_clouds) == 0:
        return PointCloud(points=np.empty((0, 3)))

    if len(point_clouds) == 1:
        return point_clouds[0]

    # Concatenate all points
    all_points = np.vstack([pc.points for pc in point_clouds])

    # Concatenate colors if available
    has_colors = all(pc.colors is not None for pc in point_clouds)
    if has_colors:
        all_colors = np.vstack([pc.colors for pc in point_clouds])
    else:
        all_colors = None

    return PointCloud(
        points=all_points,
        colors=all_colors
    )


def estimate_scale_from_heights(
    point_cloud: PointCloud,
    known_camera_heights: List[float],
    camera_z_coords: List[float]
) -> float:
    """
    Estimate metric scale from known camera heights.

    Args:
        point_cloud: Point cloud in arbitrary scale
        known_camera_heights: Known camera heights in meters
        camera_z_coords: Estimated camera Z coordinates from SfM

    Returns:
        Scale factor (meters per SfM unit)
    """
    if len(known_camera_heights) != len(camera_z_coords):
        raise ValueError("Mismatch in camera heights and coordinates")

    if len(known_camera_heights) < 2:
        # Use absolute height
        return known_camera_heights[0] / camera_z_coords[0]

    # Use height differences for robustness
    height_diffs = []
    coord_diffs = []

    for i in range(len(known_camera_heights)):
        for j in range(i + 1, len(known_camera_heights)):
            height_diff = abs(known_camera_heights[i] - known_camera_heights[j])
            coord_diff = abs(camera_z_coords[i] - camera_z_coords[j])

            if coord_diff > 0.01:  # Avoid division by very small numbers
                height_diffs.append(height_diff)
                coord_diffs.append(coord_diff)

    if len(height_diffs) == 0:
        # Fallback to absolute
        return known_camera_heights[0] / camera_z_coords[0]

    # Median scale estimate (robust to outliers)
    scales = np.array(height_diffs) / np.array(coord_diffs)
    return np.median(scales)


def estimate_scale_from_distances(
    camera_positions_3d: Dict[str, np.ndarray],
    known_distances: Dict[Tuple[str, str], float]
) -> float:
    """
    Estimate metric scale from known distances between cameras.

    Args:
        camera_positions_3d: Dictionary mapping camera IDs to 3D positions
        known_distances: Dictionary of (cam1_id, cam2_id) -> distance in meters

    Returns:
        Scale factor (meters per SfM unit)
    """
    if len(known_distances) == 0:
        raise ValueError("No known distances provided")

    scales = []

    for (cam1_id, cam2_id), known_dist in known_distances.items():
        if cam1_id in camera_positions_3d and cam2_id in camera_positions_3d:
            pos1 = camera_positions_3d[cam1_id]
            pos2 = camera_positions_3d[cam2_id]

            # Compute SfM distance
            sfm_dist = np.linalg.norm(pos2 - pos1)

            if sfm_dist > 0.01:  # Avoid division by zero
                scale = known_dist / sfm_dist
                scales.append(scale)

    if len(scales) == 0:
        raise ValueError("Could not compute scale from known distances")

    # Return median scale (robust to outliers)
    return np.median(scales)
