"""Geometric utility functions."""

import numpy as np
from typing import Tuple, Optional
from scipy.spatial.transform import Rotation


def rotation_matrix_to_euler(R: np.ndarray) -> Tuple[float, float, float]:
    """
    Convert rotation matrix to Euler angles (roll, pitch, yaw).

    Args:
        R: 3x3 rotation matrix

    Returns:
        (roll, pitch, yaw) in degrees
    """
    rot = Rotation.from_matrix(R)
    euler = rot.as_euler('xyz', degrees=True)
    return tuple(euler)


def euler_to_rotation_matrix(roll: float, pitch: float, yaw: float) -> np.ndarray:
    """
    Convert Euler angles to rotation matrix.

    Args:
        roll: Roll angle in degrees
        pitch: Pitch angle in degrees
        yaw: Yaw angle in degrees

    Returns:
        3x3 rotation matrix
    """
    rot = Rotation.from_euler('xyz', [roll, pitch, yaw], degrees=True)
    return rot.as_matrix()


def transform_points(points: np.ndarray, R: np.ndarray, t: np.ndarray) -> np.ndarray:
    """
    Transform 3D points using rotation and translation.

    Args:
        points: Nx3 array of 3D points
        R: 3x3 rotation matrix
        t: 3x1 translation vector

    Returns:
        Nx3 array of transformed points
    """
    return (R @ points.T).T + t.ravel()


def fit_plane_ransac(
    points: np.ndarray,
    threshold: float = 0.1,
    min_samples: int = 3,
    max_iterations: int = 1000,
    random_state: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Fit a plane to 3D points using RANSAC.

    Args:
        points: Nx3 array of 3D points
        threshold: Distance threshold for inliers
        min_samples: Minimum samples to fit plane
        max_iterations: Maximum RANSAC iterations
        random_state: Random seed for reproducibility

    Returns:
        (normal, point_on_plane) - Plane parameters
    """
    from sklearn.linear_model import RANSACRegressor

    if random_state is not None:
        np.random.seed(random_state)

    # Fit plane: ax + by + cz + d = 0
    # Rearrange: z = -(a/c)x - (b/c)y - (d/c)
    X = points[:, :2]  # x, y
    y = points[:, 2]   # z

    ransac = RANSACRegressor(
        min_samples=min_samples,
        residual_threshold=threshold,
        max_trials=max_iterations,
        random_state=random_state
    )
    ransac.fit(X, y)

    # Extract plane coefficients
    a, b = ransac.estimator_.coef_
    d = ransac.estimator_.intercept_

    # Normal vector: [a, b, -1] (normalized)
    normal = np.array([a, b, -1])
    normal = normal / np.linalg.norm(normal)

    # Point on plane (use mean of inliers)
    inlier_mask = ransac.inlier_mask_
    point_on_plane = points[inlier_mask].mean(axis=0)

    return normal, point_on_plane


def angle_between_vectors(v1: np.ndarray, v2: np.ndarray, degrees: bool = True) -> float:
    """
    Compute angle between two vectors.

    Args:
        v1: First vector
        v2: Second vector
        degrees: Return angle in degrees (default True)

    Returns:
        Angle between vectors
    """
    v1_norm = v1 / np.linalg.norm(v1)
    v2_norm = v2 / np.linalg.norm(v2)

    cos_angle = np.clip(np.dot(v1_norm, v2_norm), -1.0, 1.0)
    angle = np.arccos(cos_angle)

    if degrees:
        return np.degrees(angle)
    return angle


def project_points_to_plane(
    points: np.ndarray,
    plane_normal: np.ndarray,
    plane_point: np.ndarray
) -> np.ndarray:
    """
    Project 3D points onto a plane.

    Args:
        points: Nx3 array of 3D points
        plane_normal: Normal vector of plane (3,)
        plane_point: Point on plane (3,)

    Returns:
        Nx3 array of projected points
    """
    # Distance from each point to plane
    v = points - plane_point
    dist = np.dot(v, plane_normal.reshape(-1, 1))

    # Project points onto plane
    projected = points - dist * plane_normal

    return projected


def align_points_to_xy_plane(points: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Align 3D points so the best-fit plane becomes the XY plane.

    Args:
        points: Nx3 array of 3D points

    Returns:
        (aligned_points, rotation_matrix, translation) - Aligned points and transform
    """
    # Fit plane to points
    normal, centroid = fit_plane_ransac(points)

    # Compute rotation to align normal with Z-axis
    z_axis = np.array([0, 0, 1])

    # Rotation axis: cross product
    axis = np.cross(normal, z_axis)
    axis_norm = np.linalg.norm(axis)

    if axis_norm < 1e-6:
        # Already aligned or opposite
        if normal[2] > 0:
            R = np.eye(3)
        else:
            R = np.diag([1, 1, -1])
    else:
        axis = axis / axis_norm

        # Rotation angle
        angle = angle_between_vectors(normal, z_axis, degrees=False)

        # Rodrigues' rotation formula
        K = np.array([
            [0, -axis[2], axis[1]],
            [axis[2], 0, -axis[0]],
            [-axis[1], axis[0], 0]
        ])

        R = np.eye(3) + np.sin(angle) * K + (1 - np.cos(angle)) * (K @ K)

    # Translate to origin, rotate, translate back
    points_centered = points - centroid
    points_rotated = (R @ points_centered.T).T

    return points_rotated, R, centroid
