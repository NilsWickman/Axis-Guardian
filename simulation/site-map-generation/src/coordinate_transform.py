"""Coordinate transformation utilities for converting camera space to world coordinates."""

import numpy as np
from typing import Tuple, Dict, Any
from dataclasses import dataclass
import math


@dataclass
class CameraPosition:
    """Camera position and orientation in world coordinates."""

    x: float  # meters
    y: float  # meters
    z: float  # meters (height above ground)
    azimuth: float  # degrees (0 = north, 90 = east, 180 = south, 270 = west)
    elevation: float  # degrees (positive = looking up, negative = looking down)


@dataclass
class CameraIntrinsics:
    """Camera intrinsic parameters."""

    width: int  # pixels
    height: int  # pixels
    fov: float  # degrees (horizontal field of view)

    @property
    def focal_length(self) -> Tuple[float, float]:
        """Calculate focal length from FOV."""
        # Horizontal focal length
        fx = self.width / (2 * math.tan(math.radians(self.fov / 2)))
        # Assume square pixels, same focal length for vertical
        fy = fx
        return fx, fy

    @property
    def principal_point(self) -> Tuple[float, float]:
        """Get principal point (optical center)."""
        cx = self.width / 2.0
        cy = self.height / 2.0
        return cx, cy


class CoordinateTransformer:
    """Transform coordinates between camera space and world space."""

    def __init__(self, position: CameraPosition, intrinsics: CameraIntrinsics):
        """
        Initialize coordinate transformer.

        Args:
            position: Camera position and orientation
            intrinsics: Camera intrinsic parameters
        """
        self.position = position
        self.intrinsics = intrinsics
        self._rotation_matrix = self._compute_rotation_matrix()

    def _compute_rotation_matrix(self) -> np.ndarray:
        """
        Compute rotation matrix from camera to world coordinates.

        Returns:
            3x3 rotation matrix
        """
        # Convert angles to radians
        azimuth_rad = math.radians(self.position.azimuth)
        elevation_rad = math.radians(self.position.elevation)

        # Rotation around Z-axis (azimuth)
        R_z = np.array([
            [math.cos(azimuth_rad), -math.sin(azimuth_rad), 0],
            [math.sin(azimuth_rad), math.cos(azimuth_rad), 0],
            [0, 0, 1]
        ])

        # Rotation around Y-axis (elevation)
        R_y = np.array([
            [math.cos(elevation_rad), 0, math.sin(elevation_rad)],
            [0, 1, 0],
            [-math.sin(elevation_rad), 0, math.cos(elevation_rad)]
        ])

        # Combined rotation: first elevation, then azimuth
        R = R_z @ R_y

        return R

    def pixel_to_camera_space(
        self,
        pixel_x: float,
        pixel_y: float,
        depth: float
    ) -> Tuple[float, float, float]:
        """
        Convert pixel coordinates + depth to camera space coordinates.

        Args:
            pixel_x: Pixel x-coordinate
            pixel_y: Pixel y-coordinate
            depth: Depth at pixel in meters

        Returns:
            (x, y, z) in camera space (meters)
        """
        fx, fy = self.intrinsics.focal_length
        cx, cy = self.intrinsics.principal_point

        # Pixel to camera coordinates
        x_cam = (pixel_x - cx) * depth / fx
        y_cam = (pixel_y - cy) * depth / fy
        z_cam = depth

        return x_cam, y_cam, z_cam

    def camera_to_world_space(
        self,
        x_cam: float,
        y_cam: float,
        z_cam: float
    ) -> Tuple[float, float, float]:
        """
        Convert camera space coordinates to world coordinates.

        Args:
            x_cam: X in camera space (meters)
            y_cam: Y in camera space (meters)
            z_cam: Z in camera space (meters)

        Returns:
            (x, y, z) in world space (meters)
        """
        # Apply rotation
        camera_point = np.array([x_cam, y_cam, z_cam])
        world_point = self._rotation_matrix @ camera_point

        # Apply translation
        x_world = world_point[0] + self.position.x
        y_world = world_point[1] + self.position.y
        z_world = world_point[2] + self.position.z

        return x_world, y_world, z_world

    def pixel_to_world(
        self,
        pixel_x: float,
        pixel_y: float,
        depth: float
    ) -> Tuple[float, float, float]:
        """
        Convert pixel coordinates + depth directly to world coordinates.

        Args:
            pixel_x: Pixel x-coordinate
            pixel_y: Pixel y-coordinate
            depth: Depth at pixel in meters

        Returns:
            (x, y, z) in world space (meters)
        """
        x_cam, y_cam, z_cam = self.pixel_to_camera_space(pixel_x, pixel_y, depth)
        return self.camera_to_world_space(x_cam, y_cam, z_cam)

    def pixel_to_ground_plane(
        self,
        pixel_x: float,
        pixel_y: float,
        depth: float
    ) -> Tuple[float, float]:
        """
        Project pixel to ground plane (z=0) in world coordinates.

        Args:
            pixel_x: Pixel x-coordinate
            pixel_y: Pixel y-coordinate
            depth: Depth at pixel in meters

        Returns:
            (x, y) on ground plane in world space (meters)
        """
        x_world, y_world, z_world = self.pixel_to_world(pixel_x, pixel_y, depth)

        # Project to ground plane (z = 0)
        # If camera is at height h and looking at point (x, y, z),
        # the ground projection is along the ray until z = 0

        if abs(z_world) < 0.01:  # Already on ground
            return x_world, y_world

        # Compute intersection with ground plane
        # Ray: P(t) = camera_pos + t * (point - camera_pos)
        # At ground: z_component = 0
        t = -self.position.z / (z_world - self.position.z)

        if t < 0:  # Point is above camera
            t = 0

        x_ground = self.position.x + t * (x_world - self.position.x)
        y_ground = self.position.y + t * (y_world - self.position.y)

        return x_ground, y_ground

    def get_fov_footprint(self, max_distance: float = 20.0) -> np.ndarray:
        """
        Calculate the field-of-view footprint on the ground plane.

        Args:
            max_distance: Maximum viewing distance in meters

        Returns:
            Array of (x, y) points defining the FOV polygon on ground plane
        """
        # Calculate FOV cone vertices
        fov_half = self.intrinsics.fov / 2

        # Four corners of the image at max distance
        corners_pixels = [
            (0, 0),  # Top-left
            (self.intrinsics.width, 0),  # Top-right
            (self.intrinsics.width, self.intrinsics.height),  # Bottom-right
            (0, self.intrinsics.height),  # Bottom-left
        ]

        # Project to ground plane
        footprint = []
        for px, py in corners_pixels:
            x_ground, y_ground = self.pixel_to_ground_plane(px, py, max_distance)
            footprint.append([x_ground, y_ground])

        return np.array(footprint)


def from_camera_dict(camera_data: Dict[str, Any], default_fov: float = 90.0) -> CoordinateTransformer:
    """
    Create CoordinateTransformer from camera data dictionary.

    Args:
        camera_data: Camera data with 'position' and 'capabilities'
        default_fov: Default FOV if not provided in camera data

    Returns:
        CoordinateTransformer instance
    """
    pos = camera_data.get("position", {})
    position = CameraPosition(
        x=pos.get("x", 0.0),
        y=pos.get("y", 0.0),
        z=pos.get("z", 1.8),  # Default height
        azimuth=pos.get("azimuth", 0.0),
        elevation=pos.get("elevation", 0.0)
    )

    caps = camera_data.get("capabilities", {})
    resolution = caps.get("resolution", "1920x1080")
    width, height = map(int, resolution.split("x"))

    intrinsics = CameraIntrinsics(
        width=width,
        height=height,
        fov=default_fov  # FOV not typically in capabilities, use default or VAPIX query
    )

    return CoordinateTransformer(position, intrinsics)
