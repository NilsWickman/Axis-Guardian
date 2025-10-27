"""Camera pose estimation from feature matches."""

import cv2
import numpy as np
from typing import Tuple, Optional
from dataclasses import dataclass

from .matching import MatchResult


@dataclass
class CameraPose:
    """Estimated camera pose."""

    R: np.ndarray  # 3x3 rotation matrix
    t: np.ndarray  # 3x1 translation vector
    camera1_idx: int
    camera2_idx: int
    inliers: int  # Number of inlier matches


class PoseEstimator:
    """Estimate relative camera poses from feature matches."""

    def __init__(
        self,
        focal_length: float = 1000.0,
        principal_point: Optional[Tuple[float, float]] = None,
        ransac_threshold: float = 2.0,
        min_triangulation_angle: float = 3.0
    ):
        """
        Initialize pose estimator.

        Args:
            focal_length: Camera focal length in pixels (estimate if unknown)
            principal_point: Principal point (cx, cy), or None for image center
            ransac_threshold: RANSAC inlier threshold in pixels
            min_triangulation_angle: Minimum angle for triangulation (degrees)
        """
        self.focal_length = focal_length
        self.principal_point = principal_point
        self.ransac_threshold = ransac_threshold
        self.min_triangulation_angle = min_triangulation_angle

    def _get_camera_matrix(self, image_shape: Tuple[int, int]) -> np.ndarray:
        """
        Get camera intrinsic matrix.

        Args:
            image_shape: (height, width) of image

        Returns:
            3x3 camera matrix K
        """
        h, w = image_shape

        if self.principal_point is None:
            cx, cy = w / 2, h / 2
        else:
            cx, cy = self.principal_point

        K = np.array([
            [self.focal_length, 0, cx],
            [0, self.focal_length, cy],
            [0, 0, 1]
        ])

        return K

    def estimate_pose(
        self,
        match_result: MatchResult,
        image1_shape: Tuple[int, int],
        image2_shape: Tuple[int, int]
    ) -> Optional[CameraPose]:
        """
        Estimate relative camera pose from feature matches.

        Args:
            match_result: Feature matches between two images
            image1_shape: Shape of first image (height, width)
            image2_shape: Shape of second image (height, width)

        Returns:
            Camera pose or None if estimation fails
        """
        points1 = match_result.points1
        points2 = match_result.points2

        if len(points1) < 8:
            # Need at least 8 points for essential matrix
            return None

        # Get camera matrices
        K1 = self._get_camera_matrix(image1_shape)
        K2 = self._get_camera_matrix(image2_shape)

        # Estimate essential matrix using RANSAC
        E, mask = cv2.findEssentialMat(
            points1,
            points2,
            K1,
            method=cv2.RANSAC,
            prob=0.999,
            threshold=self.ransac_threshold
        )

        if E is None or mask is None:
            return None

        # Count inliers
        inliers = np.sum(mask)

        if inliers < 8:
            return None

        # Recover camera pose from essential matrix
        # Returns 4 possible solutions, chooses best based on triangulation
        num_inliers, R, t, mask_pose = cv2.recoverPose(
            E,
            points1,
            points2,
            K1,
            mask=mask
        )

        if num_inliers < 8:
            return None

        return CameraPose(
            R=R,
            t=t,
            camera1_idx=match_result.image1_idx,
            camera2_idx=match_result.image2_idx,
            inliers=num_inliers
        )

    def triangulate_points(
        self,
        pose: CameraPose,
        match_result: MatchResult,
        image1_shape: Tuple[int, int],
        image2_shape: Tuple[int, int]
    ) -> np.ndarray:
        """
        Triangulate 3D points from matched features and camera pose.

        Args:
            pose: Estimated camera pose
            match_result: Feature matches
            image1_shape: Shape of first image
            image2_shape: Shape of second image

        Returns:
            Nx3 array of 3D points in camera1 coordinate system
        """
        K1 = self._get_camera_matrix(image1_shape)
        K2 = self._get_camera_matrix(image2_shape)

        # Camera projection matrices
        # Camera 1 is at origin (identity)
        P1 = K1 @ np.hstack([np.eye(3), np.zeros((3, 1))])

        # Camera 2 has rotation R and translation t
        P2 = K2 @ np.hstack([pose.R, pose.t])

        # Triangulate points
        points1 = match_result.points1.T  # 2xN
        points2 = match_result.points2.T  # 2xN

        points_4d = cv2.triangulatePoints(P1, P2, points1, points2)

        # Convert from homogeneous coordinates
        points_3d = points_4d[:3] / points_4d[3]

        return points_3d.T  # Nx3

    def filter_triangulated_points(
        self,
        points_3d: np.ndarray,
        pose: CameraPose,
        match_result: MatchResult
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Filter triangulated points based on quality criteria.

        Args:
            points_3d: Nx3 array of 3D points
            pose: Camera pose
            match_result: Feature matches

        Returns:
            (filtered_points_3d, mask) - Valid points and boolean mask
        """
        mask = np.ones(len(points_3d), dtype=bool)

        # 1. Remove points behind either camera
        # Camera 1 is at origin, Z should be positive
        mask &= points_3d[:, 2] > 0

        # Camera 2: transform points to camera 2 frame
        points_cam2 = (pose.R @ points_3d.T).T + pose.t.ravel()
        mask &= points_cam2[:, 2] > 0

        # 2. Remove points too far away (likely outliers)
        distances = np.linalg.norm(points_3d, axis=1)
        median_dist = np.median(distances)
        mask &= distances < 3 * median_dist  # Within 3x median distance

        # 3. Check triangulation angle (parallax)
        # Compute angle between rays from both cameras
        if self.min_triangulation_angle > 0:
            # Ray directions from camera 1
            rays1 = points_3d / np.linalg.norm(points_3d, axis=1, keepdims=True)

            # Ray directions from camera 2
            rays2 = points_cam2 / np.linalg.norm(points_cam2, axis=1, keepdims=True)

            # Angle between rays
            cos_angles = np.sum(rays1 * rays2, axis=1)
            cos_angles = np.clip(cos_angles, -1, 1)
            angles_deg = np.degrees(np.arccos(cos_angles))

            mask &= angles_deg >= self.min_triangulation_angle

        return points_3d[mask], mask

    def estimate_focal_length(self, image_shape: Tuple[int, int]) -> float:
        """
        Estimate focal length from image size.

        Uses typical assumption: focal_length ≈ 1.2 * max(width, height)

        Args:
            image_shape: (height, width)

        Returns:
            Estimated focal length in pixels
        """
        h, w = image_shape
        return 1.2 * max(w, h)
