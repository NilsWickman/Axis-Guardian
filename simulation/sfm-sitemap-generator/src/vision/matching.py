"""Feature matching between image pairs."""

import cv2
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass

from .features import ImageFeatures, FeatureType


@dataclass
class MatchResult:
    """Result of feature matching between two images."""

    image1_idx: int
    image2_idx: int
    matches: List[cv2.DMatch]  # Good matches after filtering
    points1: np.ndarray  # Matched points in image 1 (Nx2)
    points2: np.ndarray  # Matched points in image 2 (Nx2)
    num_matches: int


class FeatureMatcher:
    """Match features between image pairs."""

    def __init__(
        self,
        feature_type: FeatureType = FeatureType.SIFT,
        ratio_threshold: float = 0.7,
        min_matches: int = 50
    ):
        """
        Initialize feature matcher.

        Args:
            feature_type: Type of features being matched
            ratio_threshold: Lowe's ratio test threshold (0.7 typical)
            min_matches: Minimum number of matches required
        """
        self.feature_type = feature_type
        self.ratio_threshold = ratio_threshold
        self.min_matches = min_matches
        self.matcher = self._create_matcher()

    def _create_matcher(self):
        """Create OpenCV feature matcher based on type."""
        if self.feature_type == FeatureType.SIFT or self.feature_type == FeatureType.AKAZE:
            # SIFT/AKAZE use floating-point descriptors (L2 norm)
            return cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
        elif self.feature_type == FeatureType.ORB:
            # ORB uses binary descriptors (Hamming distance)
            return cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        else:
            raise ValueError(f"Unknown feature type: {self.feature_type}")

    def match_pair(
        self,
        features1: ImageFeatures,
        features2: ImageFeatures,
        image1_idx: int = 0,
        image2_idx: int = 1
    ) -> Optional[MatchResult]:
        """
        Match features between two images.

        Args:
            features1: Features from first image
            features2: Features from second image
            image1_idx: Index of first image
            image2_idx: Index of second image

        Returns:
            Match result or None if insufficient matches
        """
        if features1.descriptors.size == 0 or features2.descriptors.size == 0:
            return None

        # Match descriptors using k-NN (k=2 for Lowe's ratio test)
        knn_matches = self.matcher.knnMatch(features1.descriptors, features2.descriptors, k=2)

        # Apply Lowe's ratio test
        good_matches = []
        for match_pair in knn_matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < self.ratio_threshold * n.distance:
                    good_matches.append(m)

        # Check minimum matches
        if len(good_matches) < self.min_matches:
            return None

        # Extract matched point coordinates
        points1 = np.array([features1.keypoints[m.queryIdx].pt for m in good_matches])
        points2 = np.array([features2.keypoints[m.trainIdx].pt for m in good_matches])

        return MatchResult(
            image1_idx=image1_idx,
            image2_idx=image2_idx,
            matches=good_matches,
            points1=points1,
            points2=points2,
            num_matches=len(good_matches)
        )

    def match_all_pairs(
        self,
        features_list: List[ImageFeatures]
    ) -> List[MatchResult]:
        """
        Match features across all image pairs.

        Args:
            features_list: List of features from multiple images

        Returns:
            List of successful match results
        """
        match_results = []

        # Match all pairs (i, j) where i < j
        for i in range(len(features_list)):
            for j in range(i + 1, len(features_list)):
                result = self.match_pair(
                    features_list[i],
                    features_list[j],
                    image1_idx=i,
                    image2_idx=j
                )

                if result is not None:
                    match_results.append(result)

        return match_results

    def visualize_matches(
        self,
        image1: np.ndarray,
        image2: np.ndarray,
        features1: ImageFeatures,
        features2: ImageFeatures,
        match_result: MatchResult,
        max_display: Optional[int] = 50
    ) -> np.ndarray:
        """
        Visualize feature matches between two images.

        Args:
            image1: First image
            image2: Second image
            features1: Features from first image
            features2: Features from second image
            match_result: Match result
            max_display: Maximum number of matches to display

        Returns:
            Visualization image
        """
        matches = match_result.matches
        if max_display is not None and len(matches) > max_display:
            # Sort by distance (quality) and take best N
            matches = sorted(matches, key=lambda m: m.distance)[:max_display]

        output = cv2.drawMatches(
            image1,
            features1.keypoints,
            image2,
            features2.keypoints,
            matches,
            None,
            flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
        )

        return output

    def filter_matches_geometric(
        self,
        match_result: MatchResult,
        method: str = "fundamental",
        ransac_threshold: float = 2.0
    ) -> MatchResult:
        """
        Filter matches using geometric constraints (RANSAC).

        Args:
            match_result: Initial match result
            method: Geometric constraint ("fundamental" or "homography")
            ransac_threshold: RANSAC inlier threshold in pixels

        Returns:
            Filtered match result with only inliers
        """
        points1 = match_result.points1
        points2 = match_result.points2

        if method == "fundamental":
            # Fundamental matrix estimation
            F, mask = cv2.findFundamentalMat(
                points1,
                points2,
                cv2.FM_RANSAC,
                ransac_threshold
            )
        elif method == "homography":
            # Homography estimation
            H, mask = cv2.findHomography(
                points1,
                points2,
                cv2.RANSAC,
                ransac_threshold
            )
        else:
            raise ValueError(f"Unknown method: {method}")

        if mask is None:
            # Estimation failed, return original
            return match_result

        # Filter matches using inlier mask
        mask = mask.ravel().astype(bool)
        inlier_matches = [m for m, is_inlier in zip(match_result.matches, mask) if is_inlier]
        inlier_points1 = points1[mask]
        inlier_points2 = points2[mask]

        return MatchResult(
            image1_idx=match_result.image1_idx,
            image2_idx=match_result.image2_idx,
            matches=inlier_matches,
            points1=inlier_points1,
            points2=inlier_points2,
            num_matches=len(inlier_matches)
        )
