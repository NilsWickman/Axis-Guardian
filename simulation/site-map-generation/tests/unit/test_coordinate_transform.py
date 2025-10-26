"""Unit tests for coordinate transformations."""

import pytest
import numpy as np
import math

from src.coordinate_transform import (
    CameraPosition,
    CameraIntrinsics,
    CoordinateTransformer
)


def test_camera_intrinsics_focal_length():
    """Test focal length calculation from FOV."""
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    fx, fy = intrinsics.focal_length

    # For 90-degree FOV, focal length should be approximately width/2
    expected_fx = 1920 / (2 * math.tan(math.radians(45)))
    assert abs(fx - expected_fx) < 0.1
    assert fx == fy  # Square pixels


def test_camera_intrinsics_principal_point():
    """Test principal point calculation."""
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    cx, cy = intrinsics.principal_point

    assert cx == 960.0  # width / 2
    assert cy == 540.0  # height / 2


def test_pixel_to_camera_space_identity():
    """Test pixel to camera space conversion at optical center."""
    position = CameraPosition(x=0, y=0, z=2.0, azimuth=0, elevation=0)
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    transformer = CoordinateTransformer(position, intrinsics)

    # Pixel at optical center should map to (0, 0, depth) in camera space
    x_cam, y_cam, z_cam = transformer.pixel_to_camera_space(960, 540, 1.0)

    assert abs(x_cam) < 0.01
    assert abs(y_cam) < 0.01
    assert abs(z_cam - 1.0) < 0.01


def test_camera_to_world_no_rotation():
    """Test camera to world transformation with no rotation."""
    position = CameraPosition(x=5.0, y=10.0, z=2.0, azimuth=0, elevation=0)
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    transformer = CoordinateTransformer(position, intrinsics)

    # Point at origin in camera space should be at camera position in world
    x_world, y_world, z_world = transformer.camera_to_world_space(0, 0, 0)

    assert abs(x_world - 5.0) < 0.01
    assert abs(y_world - 10.0) < 0.01
    assert abs(z_world - 2.0) < 0.01


def test_camera_to_world_with_azimuth():
    """Test camera to world transformation with azimuth rotation."""
    # Camera facing east (90 degrees)
    position = CameraPosition(x=0, y=0, z=2.0, azimuth=90, elevation=0)
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    transformer = CoordinateTransformer(position, intrinsics)

    # Point 1m forward in camera space (z=1) should be 1m east in world (x=1)
    x_world, y_world, z_world = transformer.camera_to_world_space(0, 0, 1.0)

    # After 90-degree rotation around Z-axis, forward (0,0,1) becomes (1,0,0)
    assert abs(x_world - 1.0) < 0.01
    assert abs(y_world - 0.0) < 0.01
    assert abs(z_world - 2.0) < 0.01


def test_pixel_to_ground_plane():
    """Test projection to ground plane."""
    # Camera at height 2m looking straight down
    position = CameraPosition(x=0, y=0, z=2.0, azimuth=0, elevation=-90)
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    transformer = CoordinateTransformer(position, intrinsics)

    # Center pixel should project to camera x,y position on ground
    x_ground, y_ground = transformer.pixel_to_ground_plane(960, 540, 2.0)

    assert abs(x_ground - 0.0) < 0.1
    assert abs(y_ground - 0.0) < 0.1


def test_fov_footprint():
    """Test FOV footprint calculation."""
    position = CameraPosition(x=0, y=0, z=2.0, azimuth=0, elevation=0)
    intrinsics = CameraIntrinsics(width=1920, height=1080, fov=90.0)
    transformer = CoordinateTransformer(position, intrinsics)

    footprint = transformer.get_fov_footprint(max_distance=10.0)

    # Should return 4 points (quadrilateral)
    assert footprint.shape == (4, 2)

    # All points should be at finite coordinates
    assert np.all(np.isfinite(footprint))
