"""World coordinate system and transformations."""

from typing import List, Tuple
import numpy as np
from pyproj import Transformer, CRS

from core.camera import CameraConfig


class WorldCoordinateSystem:
    """Establishes and manages world coordinate system from GPS data."""

    def __init__(self, cameras: List[CameraConfig]):
        """
        Initialize world coordinate system from camera GPS coordinates.

        Args:
            cameras: List of camera configurations with GPS data
        """
        self.cameras = cameras

        # Compute scene center as origin
        self.origin_gps = self._compute_scene_center()

        # Setup UTM projection for accurate metric coordinates
        self.utm_crs, self.utm_zone = self._setup_utm_projection()

        # Transformer from WGS84 (lat/lon) to UTM
        self.transformer = Transformer.from_crs(
            CRS.from_epsg(4326),  # WGS84
            self.utm_crs,
            always_xy=True
        )

        # Compute origin in UTM
        self.origin_utm = self.gps_to_utm(*self.origin_gps[:2])

        # Ground level (average of all camera ground levels)
        self.ground_level = self._compute_ground_level()

    def _compute_scene_center(self) -> Tuple[float, float, float]:
        """
        Compute scene center from camera positions.

        Returns:
            (latitude, longitude, elevation) of scene center
        """
        lats = [cam.gps[0] for cam in self.cameras]
        lons = [cam.gps[1] for cam in self.cameras]
        elevs = [cam.gps[2] for cam in self.cameras]

        return (
            np.mean(lats),
            np.mean(lons),
            np.mean(elevs)
        )

    def _setup_utm_projection(self) -> Tuple[CRS, int]:
        """
        Setup UTM projection based on scene location.

        Returns:
            (UTM CRS, UTM zone number)
        """
        lat, lon, _ = self.origin_gps

        # Compute UTM zone
        utm_zone = int((lon + 180) / 6) + 1

        # Determine hemisphere
        hemisphere = 'north' if lat >= 0 else 'south'

        # Create UTM CRS
        # EPSG code: 326XX for north, 327XX for south (XX = zone)
        epsg_base = 32600 if hemisphere == 'north' else 32700
        epsg_code = epsg_base + utm_zone

        utm_crs = CRS.from_epsg(epsg_code)

        return utm_crs, utm_zone

    def _compute_ground_level(self) -> float:
        """
        Compute average ground level from cameras.

        Returns:
            Ground elevation in meters
        """
        ground_levels = [
            cam.gps[2] - cam.mount_height
            for cam in self.cameras
        ]
        return np.mean(ground_levels)

    def gps_to_utm(self, lon: float, lat: float) -> Tuple[float, float]:
        """
        Convert GPS coordinates to UTM.

        Args:
            lon: Longitude
            lat: Latitude

        Returns:
            (easting, northing) in meters
        """
        easting, northing = self.transformer.transform(lon, lat)
        return easting, northing

    def gps_to_world(self, lat: float, lon: float, elevation: float) -> np.ndarray:
        """
        Convert GPS coordinates to world frame.

        Args:
            lat: Latitude
            lon: Longitude
            elevation: Elevation in meters

        Returns:
            3D point [x, y, z] in world frame (origin at scene center)
        """
        # Convert to UTM
        easting, northing = self.gps_to_utm(lon, lat)
        origin_easting, origin_northing = self.origin_utm

        # Relative to origin
        x = easting - origin_easting
        y = northing - origin_northing
        z = elevation - self.ground_level

        return np.array([x, y, z], dtype=np.float64)

    def world_to_gps(self, point: np.ndarray) -> Tuple[float, float, float]:
        """
        Convert world coordinates to GPS.

        Args:
            point: 3D point [x, y, z] in world frame

        Returns:
            (latitude, longitude, elevation)
        """
        # Convert to UTM
        origin_easting, origin_northing = self.origin_utm
        easting = point[0] + origin_easting
        northing = point[1] + origin_northing

        # Convert back to WGS84
        transformer_inverse = Transformer.from_crs(
            self.utm_crs,
            CRS.from_epsg(4326),
            always_xy=True
        )
        lon, lat = transformer_inverse.transform(easting, northing)

        elevation = point[2] + self.ground_level

        return lat, lon, elevation

    def get_scene_bounds(self, margin: float = 10.0) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute scene bounding box in world coordinates.

        Args:
            margin: Additional margin around cameras in meters

        Returns:
            (min_point, max_point) as 3D arrays [x, y, z]
        """
        camera_positions = []
        for cam in self.cameras:
            pos = self.gps_to_world(*cam.gps)
            camera_positions.append(pos)

        positions = np.array(camera_positions)

        min_point = positions.min(axis=0) - margin
        max_point = positions.max(axis=0) + margin

        # Set Z bounds based on ground and typical height
        min_point[2] = -1.0  # 1m below ground
        max_point[2] = 5.0   # 5m above ground (for obstacles)

        return min_point, max_point

    def get_camera_world_position(self, camera: CameraConfig) -> np.ndarray:
        """
        Get camera position in world frame.

        Args:
            camera: Camera configuration

        Returns:
            3D position [x, y, z] in world frame
        """
        return self.gps_to_world(*camera.gps)

    def get_ground_plane_equation(self) -> Tuple[np.ndarray, float]:
        """
        Get ground plane equation in world frame.

        The ground plane is assumed to be Z = 0 in world coordinates
        (since world origin is at ground level).

        Returns:
            (normal_vector, d) where normal·point + d = 0
        """
        # Ground plane: Z = 0
        # Normal vector points up
        normal = np.array([0, 0, 1], dtype=np.float64)
        d = 0.0

        return normal, d
