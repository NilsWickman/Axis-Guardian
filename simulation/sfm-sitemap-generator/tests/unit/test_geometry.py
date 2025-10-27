"""Tests for geometry utilities."""

import numpy as np
import pytest
from src.utils.geometry import (
    rotation_matrix_to_euler,
    euler_to_rotation_matrix,
    transform_points,
    angle_between_vectors,
)


def test_euler_rotation_roundtrip():
    """Test conversion between Euler angles and rotation matrix."""
    # Original angles
    roll, pitch, yaw = 10.0, 20.0, 30.0

    # Convert to rotation matrix and back
    R = euler_to_rotation_matrix(roll, pitch, yaw)
    roll2, pitch2, yaw2 = rotation_matrix_to_euler(R)

    # Check roundtrip (allow small numerical error)
    assert np.allclose([roll, pitch, yaw], [roll2, pitch2, yaw2], atol=1e-10)


def test_transform_points():
    """Test point transformation."""
    # Create test points
    points = np.array([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ])

    # Identity rotation, unit translation
    R = np.eye(3)
    t = np.array([1, 2, 3])

    # Transform
    transformed = transform_points(points, R, t)

    # Check result
    expected = points + t
    assert np.allclose(transformed, expected)


def test_angle_between_vectors():
    """Test angle computation."""
    # Orthogonal vectors
    v1 = np.array([1, 0, 0])
    v2 = np.array([0, 1, 0])

    angle = angle_between_vectors(v1, v2, degrees=True)
    assert np.isclose(angle, 90.0)

    # Parallel vectors
    v1 = np.array([1, 0, 0])
    v2 = np.array([2, 0, 0])

    angle = angle_between_vectors(v1, v2, degrees=True)
    assert np.isclose(angle, 0.0)

    # Opposite vectors
    v1 = np.array([1, 0, 0])
    v2 = np.array([-1, 0, 0])

    angle = angle_between_vectors(v1, v2, degrees=True)
    assert np.isclose(angle, 180.0)


def test_rotation_matrix_orthonormality():
    """Test that generated rotation matrices are orthonormal."""
    R = euler_to_rotation_matrix(15.0, 30.0, 45.0)

    # Check orthonormality: R^T R = I
    should_be_identity = R.T @ R
    assert np.allclose(should_be_identity, np.eye(3))

    # Check determinant = 1
    det = np.linalg.det(R)
    assert np.isclose(det, 1.0)
