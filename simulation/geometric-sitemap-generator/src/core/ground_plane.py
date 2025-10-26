"""Ground plane extraction and homography computation."""

import numpy as np
import cv2
from typing import Tuple, Optional

from core.camera import CameraCalibration


class GroundPlaneMapper:
    """Compute homography for mapping image pixels to ground coordinates."""

    def __init__(self, calibration: CameraCalibration):
        """
        Initialize ground plane mapper.

        Args:
            calibration: Camera calibration object
        """
        self.calibration = calibration
        self.homography = self._compute_ground_homography()

    def _compute_ground_homography(self) -> np.ndarray:
        """
        Compute homography matrix H that maps image pixels to ground plane.

        For a point on the ground plane (Z=0), the projection is:
        s * [u, v, 1]^T = K * [R | t] * [X, Y, 0, 1]^T
        s * [u, v, 1]^T = K * [r1, r2, t] * [X, Y, 1]^T

        where r1, r2 are first two columns of R.

        The homography H = K * [r1, r2, t] maps ground points [X, Y] to image [u, v].
        We want the inverse: H_inv maps image to ground.

        Returns:
            3x3 homography matrix (image to ground)
        """
        K = self.calibration.K
        R = self.calibration.R
        t = self.calibration.t

        # Ground plane homography (ground to image)
        # H = K * [r1, r2, t]
        r1 = R[:, 0]
        r2 = R[:, 1]

        H_ground_to_image = K @ np.column_stack([r1, r2, t])

        # We want image to ground (inverse)
        H_image_to_ground = np.linalg.inv(H_ground_to_image)

        return H_image_to_ground

    def image_to_ground(self, image_points: np.ndarray) -> np.ndarray:
        """
        Map image coordinates to ground plane coordinates.

        Args:
            image_points: Nx2 array of image coordinates [u, v]

        Returns:
            Nx2 array of ground coordinates [X, Y] in world frame
        """
        if image_points.ndim == 1:
            image_points = image_points.reshape(1, -1)

        # Convert to homogeneous coordinates
        ones = np.ones((image_points.shape[0], 1))
        points_homogeneous = np.hstack([image_points, ones])

        # Apply homography
        ground_homogeneous = (self.homography @ points_homogeneous.T).T

        # Convert back to Cartesian
        ground_points = ground_homogeneous[:, :2] / ground_homogeneous[:, 2:3]

        return ground_points

    def ground_to_image(self, ground_points: np.ndarray) -> np.ndarray:
        """
        Map ground plane coordinates to image coordinates.

        Args:
            ground_points: Nx2 array of ground coordinates [X, Y]

        Returns:
            Nx2 array of image coordinates [u, v]
        """
        if ground_points.ndim == 1:
            ground_points = ground_points.reshape(1, -1)

        # Convert to homogeneous
        ones = np.ones((ground_points.shape[0], 1))
        points_homogeneous = np.hstack([ground_points, ones])

        # Apply inverse homography
        H_inv = np.linalg.inv(self.homography)
        image_homogeneous = (H_inv @ points_homogeneous.T).T

        # Convert to Cartesian
        image_points = image_homogeneous[:, :2] / image_homogeneous[:, 2:3]

        return image_points

    def get_ground_footprint(self, image_shape: Tuple[int, int],
                            grid_size: int = 20) -> np.ndarray:
        """
        Compute the ground area visible in the image.

        Args:
            image_shape: (height, width) of image
            grid_size: Number of points along each edge for sampling

        Returns:
            Nx2 array of ground coordinates forming the visible footprint
        """
        h, w = image_shape

        # Sample points along image borders
        # Top edge
        top_u = np.linspace(0, w - 1, grid_size)
        top_v = np.zeros(grid_size)

        # Bottom edge
        bottom_u = np.linspace(0, w - 1, grid_size)
        bottom_v = np.full(grid_size, h - 1)

        # Left edge
        left_u = np.zeros(grid_size)
        left_v = np.linspace(0, h - 1, grid_size)

        # Right edge
        right_u = np.full(grid_size, w - 1)
        right_v = np.linspace(0, h - 1, grid_size)

        # Combine all border points
        border_u = np.concatenate([top_u, bottom_u, left_u, right_u])
        border_v = np.concatenate([top_v, bottom_v, left_v, right_v])
        border_points = np.column_stack([border_u, border_v])

        # Map to ground
        ground_footprint = self.image_to_ground(border_points)

        return ground_footprint

    def is_ground_point_visible(self, ground_point: np.ndarray,
                                image_shape: Tuple[int, int]) -> bool:
        """
        Check if a ground point is visible in the image.

        Args:
            ground_point: 2D ground coordinate [X, Y]
            image_shape: (height, width) of image

        Returns:
            True if point projects inside image bounds
        """
        image_point = self.ground_to_image(ground_point).flatten()
        h, w = image_shape

        return 0 <= image_point[0] < w and 0 <= image_point[1] < h

    def warp_image_to_ground(self, image: np.ndarray,
                            ground_bounds: Tuple[np.ndarray, np.ndarray],
                            resolution: float = 0.05) -> Tuple[np.ndarray, np.ndarray]:
        """
        Warp image to bird's-eye view on ground plane.

        Args:
            image: Input image
            ground_bounds: (min_point, max_point) in ground coordinates [X, Y]
            resolution: Meters per pixel in output

        Returns:
            (warped_image, transform_matrix) where transform_matrix maps
            output pixels to ground coordinates
        """
        min_point, max_point = ground_bounds

        # Compute output size
        width_m = max_point[0] - min_point[0]
        height_m = max_point[1] - min_point[1]

        output_width = int(width_m / resolution)
        output_height = int(height_m / resolution)

        # Create grid of output pixel coordinates
        out_y, out_x = np.mgrid[0:output_height, 0:output_width]

        # Map output pixels to ground coordinates
        ground_x = min_point[0] + out_x * resolution
        ground_y = min_point[1] + out_y * resolution
        ground_points = np.stack([ground_x.ravel(), ground_y.ravel()], axis=1)

        # Map ground to image
        image_points = self.ground_to_image(ground_points)

        # Reshape for cv2.remap
        map_x = image_points[:, 0].reshape(output_height, output_width).astype(np.float32)
        map_y = image_points[:, 1].reshape(output_height, output_width).astype(np.float32)

        # Warp image
        warped = cv2.remap(image, map_x, map_y, cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=0)

        # Transform matrix (pixel to ground)
        transform = np.array([
            [resolution, 0, min_point[0]],
            [0, resolution, min_point[1]],
            [0, 0, 1]
        ])

        return warped, transform
