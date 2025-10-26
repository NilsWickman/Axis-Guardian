"""Camera models and calibration."""

from dataclasses import dataclass
from typing import Tuple, Optional
import numpy as np
from pathlib import Path


@dataclass
class CameraIntrinsics:
    """Camera intrinsic parameters."""
    focal_length: float  # mm
    sensor_size: Tuple[float, float]  # inches (width, height)
    resolution: Tuple[int, int]  # pixels (width, height)
    fov: Tuple[float, float]  # degrees (horizontal, vertical)
    distortion_coeffs: Optional[np.ndarray] = None  # [k1, k2, p1, p2, k3]

    def get_intrinsic_matrix(self) -> np.ndarray:
        """
        Compute camera intrinsic matrix K.

        Returns:
            3x3 intrinsic matrix [[fx, 0, cx], [0, fy, cy], [0, 0, 1]]
        """
        width, height = self.resolution

        # Focal length in pixels
        # sensor_size is in inches, convert to mm: 1 inch = 25.4 mm
        sensor_width_mm = self.sensor_size[0] * 25.4
        sensor_height_mm = self.sensor_size[1] * 25.4

        fx = (self.focal_length / sensor_width_mm) * width
        fy = (self.focal_length / sensor_height_mm) * height

        # Principal point (image center)
        cx = width / 2.0
        cy = height / 2.0

        return np.array([
            [fx, 0, cx],
            [0, fy, cy],
            [0, 0, 1]
        ], dtype=np.float64)


@dataclass
class CameraOrientation:
    """Camera orientation in world frame."""
    pan: float  # degrees from north (clockwise positive)
    tilt: float  # degrees from horizon (negative = looking down)
    roll: float  # degrees (rotation around optical axis)

    def get_rotation_matrix(self) -> np.ndarray:
        """
        Compute rotation matrix from world to camera frame.

        Convention: ZYX Euler angles (yaw-pitch-roll)
        - Pan (yaw): rotation around world Z-axis (up)
        - Tilt (pitch): rotation around camera Y-axis
        - Roll: rotation around camera X-axis (optical axis)

        Returns:
            3x3 rotation matrix R_world_to_camera
        """
        # Convert to radians
        pan_rad = np.deg2rad(self.pan)
        tilt_rad = np.deg2rad(self.tilt)
        roll_rad = np.deg2rad(self.roll)

        # Rotation matrices
        # Pan (yaw) around Z-axis
        R_pan = np.array([
            [np.cos(pan_rad), -np.sin(pan_rad), 0],
            [np.sin(pan_rad), np.cos(pan_rad), 0],
            [0, 0, 1]
        ])

        # Tilt (pitch) around Y-axis
        R_tilt = np.array([
            [np.cos(tilt_rad), 0, np.sin(tilt_rad)],
            [0, 1, 0],
            [-np.sin(tilt_rad), 0, np.cos(tilt_rad)]
        ])

        # Roll around X-axis
        R_roll = np.array([
            [1, 0, 0],
            [0, np.cos(roll_rad), -np.sin(roll_rad)],
            [0, np.sin(roll_rad), np.cos(roll_rad)]
        ])

        # Combined rotation: R = R_roll * R_tilt * R_pan
        R = R_roll @ R_tilt @ R_pan

        return R


@dataclass
class CameraConfig:
    """Complete camera configuration."""
    id: str
    gps: Tuple[float, float, float]  # (latitude, longitude, elevation_meters)
    mount_height: float  # meters above ground
    orientation: CameraOrientation
    intrinsics: CameraIntrinsics
    image_path: Path

    def __post_init__(self):
        """Convert image_path to Path object if string."""
        if isinstance(self.image_path, str):
            self.image_path = Path(self.image_path)


class CameraCalibration:
    """Camera calibration and projection utilities."""

    def __init__(self, camera: CameraConfig, world_origin: np.ndarray):
        """
        Initialize camera calibration.

        Args:
            camera: Camera configuration
            world_origin: World coordinate system origin [x, y, z] in meters (UTM)
        """
        self.camera = camera
        self.world_origin = world_origin

        # Compute matrices
        self.K = camera.intrinsics.get_intrinsic_matrix()
        self.R = camera.orientation.get_rotation_matrix()
        self.t = self._compute_translation_vector()

        # Extrinsic matrix [R | t]
        self.extrinsic = np.hstack([self.R, self.t.reshape(3, 1)])

        # Projection matrix P = K[R | t]
        self.P = self.K @ self.extrinsic

    def _compute_translation_vector(self) -> np.ndarray:
        """
        Compute camera center in world coordinates.

        Returns:
            3D translation vector (relative to world origin)
        """
        # Camera position in world frame
        lat, lon, elevation = self.camera.gps

        # For now, use simple local approximation
        # In production, use pyproj for proper UTM conversion
        # This assumes world_origin is also in similar local coordinates

        # Simple planar approximation (works for small areas)
        # 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(lat)
        meters_per_deg_lat = 111000
        meters_per_deg_lon = 111000 * np.cos(np.deg2rad(lat))

        # Assume world_origin is [0, 0, ground_level]
        x = (lon - self.world_origin[0]) * meters_per_deg_lon
        y = (lat - self.world_origin[1]) * meters_per_deg_lat
        z = elevation - self.world_origin[2]

        return np.array([x, y, z], dtype=np.float64)

    def get_camera_center(self) -> np.ndarray:
        """
        Get camera center in world coordinates.

        Returns:
            3D point [x, y, z] in world frame
        """
        # Camera center C = -R^T * t
        return -self.R.T @ self.t

    def project_world_to_image(self, points_3d: np.ndarray) -> np.ndarray:
        """
        Project 3D world points to 2D image coordinates.

        Args:
            points_3d: Nx3 array of 3D points in world frame

        Returns:
            Nx2 array of image coordinates [u, v]
        """
        if points_3d.ndim == 1:
            points_3d = points_3d.reshape(1, -1)

        # Convert to homogeneous coordinates
        ones = np.ones((points_3d.shape[0], 1))
        points_homogeneous = np.hstack([points_3d, ones])

        # Project: p = P * X
        projected = (self.P @ points_homogeneous.T).T

        # Convert from homogeneous to Cartesian
        image_coords = projected[:, :2] / projected[:, 2:3]

        return image_coords

    def is_point_visible(self, point_3d: np.ndarray, image_shape: Tuple[int, int]) -> bool:
        """
        Check if a 3D point is visible in the camera.

        Args:
            point_3d: 3D point in world frame [x, y, z]
            image_shape: Image dimensions (height, width)

        Returns:
            True if point projects inside image bounds and is in front of camera
        """
        # Check if point is in front of camera
        point_camera = self.R @ (point_3d - self.t)
        if point_camera[2] <= 0:  # Behind camera
            return False

        # Check if projects inside image
        uv = self.project_world_to_image(point_3d).flatten()
        h, w = image_shape

        return 0 <= uv[0] < w and 0 <= uv[1] < h

    def get_ground_level(self) -> float:
        """
        Get ground level elevation (camera elevation - mount height).

        Returns:
            Ground elevation in meters
        """
        return self.camera.gps[2] - self.camera.mount_height
