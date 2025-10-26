"""Geometric utility functions."""

import numpy as np
from typing import Tuple, Optional


def rotation_matrix_from_euler(roll: float, pitch: float, yaw: float) -> np.ndarray:
    """
    Create rotation matrix from Euler angles (ZYX convention).

    Args:
        roll: Roll angle in radians (rotation around X)
        pitch: Pitch angle in radians (rotation around Y)
        yaw: Yaw angle in radians (rotation around Z)

    Returns:
        3x3 rotation matrix
    """
    # Roll (X-axis)
    R_x = np.array([
        [1, 0, 0],
        [0, np.cos(roll), -np.sin(roll)],
        [0, np.sin(roll), np.cos(roll)]
    ])

    # Pitch (Y-axis)
    R_y = np.array([
        [np.cos(pitch), 0, np.sin(pitch)],
        [0, 1, 0],
        [-np.sin(pitch), 0, np.cos(pitch)]
    ])

    # Yaw (Z-axis)
    R_z = np.array([
        [np.cos(yaw), -np.sin(yaw), 0],
        [np.sin(yaw), np.cos(yaw), 0],
        [0, 0, 1]
    ])

    # Combined: R = Rz * Ry * Rx
    return R_z @ R_y @ R_x


def euler_from_rotation_matrix(R: np.ndarray) -> Tuple[float, float, float]:
    """
    Extract Euler angles from rotation matrix (ZYX convention).

    Args:
        R: 3x3 rotation matrix

    Returns:
        (roll, pitch, yaw) in radians
    """
    # Check for gimbal lock
    sy = np.sqrt(R[0, 0]**2 + R[1, 0]**2)

    singular = sy < 1e-6

    if not singular:
        roll = np.arctan2(R[2, 1], R[2, 2])
        pitch = np.arctan2(-R[2, 0], sy)
        yaw = np.arctan2(R[1, 0], R[0, 0])
    else:
        roll = np.arctan2(-R[1, 2], R[1, 1])
        pitch = np.arctan2(-R[2, 0], sy)
        yaw = 0

    return roll, pitch, yaw


def normalize_vector(v: np.ndarray) -> np.ndarray:
    """
    Normalize a vector to unit length.

    Args:
        v: Input vector

    Returns:
        Normalized vector
    """
    norm = np.linalg.norm(v)
    if norm < 1e-10:
        return v
    return v / norm


def angle_between_vectors(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Compute angle between two vectors.

    Args:
        v1: First vector
        v2: Second vector

    Returns:
        Angle in radians [0, π]
    """
    v1_norm = normalize_vector(v1)
    v2_norm = normalize_vector(v2)

    cos_angle = np.clip(np.dot(v1_norm, v2_norm), -1.0, 1.0)
    return np.arccos(cos_angle)


def project_point_to_line(point: np.ndarray, line_point: np.ndarray,
                         line_direction: np.ndarray) -> np.ndarray:
    """
    Project a point onto a line.

    Args:
        point: Point to project
        line_point: A point on the line
        line_direction: Direction vector of the line (need not be normalized)

    Returns:
        Projected point on the line
    """
    direction = normalize_vector(line_direction)
    v = point - line_point
    projection_length = np.dot(v, direction)
    return line_point + projection_length * direction


def distance_point_to_line(point: np.ndarray, line_point: np.ndarray,
                           line_direction: np.ndarray) -> float:
    """
    Compute perpendicular distance from point to line.

    Args:
        point: Point
        line_point: A point on the line
        line_direction: Direction vector of the line

    Returns:
        Distance in same units as inputs
    """
    projection = project_point_to_line(point, line_point, line_direction)
    return float(np.linalg.norm(point - projection))


def line_segment_intersection_2d(seg1_start: np.ndarray, seg1_end: np.ndarray,
                                 seg2_start: np.ndarray, seg2_end: np.ndarray,
                                 tolerance: float = 1e-10) -> Optional[np.ndarray]:
    """
    Find intersection point of two 2D line segments.

    Args:
        seg1_start: Start of first segment
        seg1_end: End of first segment
        seg2_start: Start of second segment
        seg2_end: End of second segment
        tolerance: Numerical tolerance

    Returns:
        Intersection point or None if segments don't intersect
    """
    # Direction vectors
    d1 = seg1_end - seg1_start
    d2 = seg2_end - seg2_start

    # Solve: seg1_start + t1*d1 = seg2_start + t2*d2
    # In matrix form: [d1 | -d2] * [t1, t2]^T = seg2_start - seg1_start

    A = np.column_stack([d1, -d2])
    b = seg2_start - seg1_start

    # Check if lines are parallel
    det = np.linalg.det(A)
    if abs(det) < tolerance:
        return None

    # Solve
    t = np.linalg.solve(A, b)
    t1, t2 = t

    # Check if intersection is within both segments
    if 0 <= t1 <= 1 and 0 <= t2 <= 1:
        intersection = seg1_start + t1 * d1
        return intersection

    return None


def polygon_area_2d(vertices: np.ndarray) -> float:
    """
    Compute area of a 2D polygon using shoelace formula.

    Args:
        vertices: Nx2 array of polygon vertices (in order)

    Returns:
        Area (positive for counter-clockwise, negative for clockwise)
    """
    n = len(vertices)
    if n < 3:
        return 0.0

    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += vertices[i, 0] * vertices[j, 1]
        area -= vertices[j, 0] * vertices[i, 1]

    return abs(area) / 2.0


def point_in_polygon_2d(point: np.ndarray, vertices: np.ndarray) -> bool:
    """
    Check if point is inside polygon (2D).

    Uses ray casting algorithm.

    Args:
        point: 2D point
        vertices: Nx2 array of polygon vertices

    Returns:
        True if point is inside polygon
    """
    n = len(vertices)
    inside = False

    p1x, p1y = vertices[0]
    for i in range(1, n + 1):
        p2x, p2y = vertices[i % n]

        if point[1] > min(p1y, p2y):
            if point[1] <= max(p1y, p2y):
                if point[0] <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (point[1] - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or point[0] <= xinters:
                        inside = not inside

        p1x, p1y = p2x, p2y

    return inside


def fit_plane_ransac(points: np.ndarray, num_iterations: int = 1000,
                     threshold: float = 0.1) -> Tuple[np.ndarray, float, np.ndarray]:
    """
    Fit plane to 3D points using RANSAC.

    Plane equation: n·(p - p0) = 0 or n·p + d = 0

    Args:
        points: Nx3 array of 3D points
        num_iterations: Number of RANSAC iterations
        threshold: Inlier threshold

    Returns:
        (normal, d, inliers) where normal is unit normal vector,
        d is distance from origin, inliers is boolean mask
    """
    if len(points) < 3:
        raise ValueError("Need at least 3 points to fit plane")

    best_normal = None
    best_d = None
    best_inliers = None
    best_count = 0

    for _ in range(num_iterations):
        # Sample 3 points
        idx = np.random.choice(len(points), 3, replace=False)
        sample = points[idx]

        # Compute plane from 3 points
        v1 = sample[1] - sample[0]
        v2 = sample[2] - sample[0]
        normal = np.cross(v1, v2)

        norm = np.linalg.norm(normal)
        if norm < 1e-6:
            continue

        normal = normal / norm

        # Plane equation: n·p + d = 0
        d = -np.dot(normal, sample[0])

        # Find inliers
        distances = np.abs(np.dot(points, normal) + d)
        inliers = distances < threshold

        count = np.sum(inliers)
        if count > best_count:
            best_count = count
            best_normal = normal
            best_d = d
            best_inliers = inliers

    if best_normal is None:
        raise ValueError("Failed to fit plane")

    return best_normal, best_d, best_inliers


def transform_points(points: np.ndarray, R: np.ndarray,
                     t: np.ndarray) -> np.ndarray:
    """
    Apply rigid transformation to points.

    Args:
        points: Nx3 array of points
        R: 3x3 rotation matrix
        t: 3D translation vector

    Returns:
        Transformed points
    """
    return (R @ points.T).T + t


def homogeneous_transform(R: np.ndarray, t: np.ndarray) -> np.ndarray:
    """
    Create 4x4 homogeneous transformation matrix.

    Args:
        R: 3x3 rotation matrix
        t: 3D translation vector

    Returns:
        4x4 transformation matrix
    """
    T = np.eye(4)
    T[:3, :3] = R
    T[:3, 3] = t
    return T
