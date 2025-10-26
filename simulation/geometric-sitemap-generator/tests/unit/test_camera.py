"""Unit tests for camera module."""

import numpy as np
import pytest
from pathlib import Path

from src.core.camera import (
    CameraIntrinsics,
    CameraOrientation,
    CameraConfig,
    CameraCalibration
)


class TestCameraIntrinsics:
    """Test camera intrinsics."""

    def test_intrinsic_matrix(self):
        """Test intrinsic matrix computation."""
        intrinsics = CameraIntrinsics(
            focal_length=4.0,  # mm
            sensor_size=(0.357, 0.357),  # inches (1/2.8")
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        )

        K = intrinsics.get_intrinsic_matrix()

        # Check shape
        assert K.shape == (3, 3)

        # Check structure
        assert K[0, 1] == 0  # No skew
        assert K[1, 0] == 0
        assert K[2, 0] == 0
        assert K[2, 1] == 0
        assert K[2, 2] == 1

        # Check focal lengths are positive
        assert K[0, 0] > 0  # fx
        assert K[1, 1] > 0  # fy

        # Principal point should be near center
        assert abs(K[0, 2] - 1920/2) < 1  # cx
        assert abs(K[1, 2] - 1080/2) < 1  # cy


class TestCameraOrientation:
    """Test camera orientation."""

    def test_rotation_matrix_identity(self):
        """Test rotation matrix for zero orientation."""
        orientation = CameraOrientation(pan=0, tilt=0, roll=0)
        R = orientation.get_rotation_matrix()

        # Should be identity
        np.testing.assert_array_almost_equal(R, np.eye(3))

    def test_rotation_matrix_orthogonal(self):
        """Test that rotation matrix is orthogonal."""
        orientation = CameraOrientation(pan=45, tilt=-15, roll=10)
        R = orientation.get_rotation_matrix()

        # R * R^T should be identity
        identity = R @ R.T
        np.testing.assert_array_almost_equal(identity, np.eye(3))

        # Determinant should be 1
        det = np.linalg.det(R)
        assert abs(det - 1.0) < 1e-6

    def test_rotation_matrix_pan(self):
        """Test pan-only rotation."""
        orientation = CameraOrientation(pan=90, tilt=0, roll=0)
        R = orientation.get_rotation_matrix()

        # Pan 90° should rotate around Z axis
        # X points east → Y points north after 90° pan
        # (Exact values depend on convention)
        assert R.shape == (3, 3)


class TestCameraCalibration:
    """Test camera calibration."""

    def test_camera_center(self):
        """Test camera center computation."""
        intrinsics = CameraIntrinsics(
            focal_length=4.0,
            sensor_size=(0.357, 0.357),
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        )

        orientation = CameraOrientation(pan=0, tilt=0, roll=0)

        camera = CameraConfig(
            id="test_cam",
            gps=(35.9940, -78.9018, 120.5),
            mount_height=3.5,
            orientation=orientation,
            intrinsics=intrinsics,
            image_path=Path("dummy.jpg")
        )

        world_origin = np.array([0, 0, 0])
        calib = CameraCalibration(camera, world_origin)

        center = calib.get_camera_center()

        # Should be 3D point
        assert center.shape == (3,)

    def test_projection(self):
        """Test 3D to 2D projection."""
        intrinsics = CameraIntrinsics(
            focal_length=4.0,
            sensor_size=(0.357, 0.357),
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        )

        orientation = CameraOrientation(pan=0, tilt=-15, roll=0)

        camera = CameraConfig(
            id="test_cam",
            gps=(35.9940, -78.9018, 120.5),
            mount_height=3.5,
            orientation=orientation,
            intrinsics=intrinsics,
            image_path=Path("dummy.jpg")
        )

        world_origin = np.array([0, 0, 0])
        calib = CameraCalibration(camera, world_origin)

        # Project a point in front of camera
        point_3d = np.array([0, 10, 0])  # 10m in front
        point_2d = calib.project_world_to_image(point_3d)

        # Should be 2D
        assert point_2d.shape == (1, 2)

        # Should be within image bounds (roughly)
        u, v = point_2d[0]
        assert -1000 < u < 3000  # Allow some margin
        assert -1000 < v < 2000
