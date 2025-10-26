"""Computer vision feature extraction for spatial mapping."""

import numpy as np
import cv2
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class VanishingPoint:
    """Detected vanishing point."""
    point: np.ndarray  # 2D image coordinates
    direction: np.ndarray  # 3D direction in camera frame
    confidence: float
    supporting_lines: List[np.ndarray]  # Lines that converge to this point


class FeatureExtractor:
    """Extract geometric features from images."""

    def __init__(self):
        """Initialize feature extractor."""
        pass

    def detect_lines(self, image: np.ndarray,
                     min_line_length: int = 50,
                     max_line_gap: int = 10) -> List[np.ndarray]:
        """
        Detect lines in image using Hough transform.

        Args:
            image: Input image (grayscale or RGB)
            min_line_length: Minimum line length in pixels
            max_line_gap: Maximum gap between line segments

        Returns:
            List of lines, each as [x1, y1, x2, y2]
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image.copy()

        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        # Probabilistic Hough Line Transform
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=50,
            minLineLength=min_line_length,
            maxLineGap=max_line_gap
        )

        if lines is None:
            return []

        # Convert to list of arrays
        return [line[0] for line in lines]

    def detect_vanishing_points(self, lines: List[np.ndarray],
                                image_shape: Tuple[int, int],
                                max_vps: int = 3) -> List[VanishingPoint]:
        """
        Detect vanishing points from line segments.

        Uses RANSAC to find dominant vanishing points.

        Args:
            lines: List of line segments [x1, y1, x2, y2]
            image_shape: (height, width) of image
            max_vps: Maximum number of vanishing points to detect

        Returns:
            List of detected vanishing points
        """
        if len(lines) < 2:
            return []

        # Convert lines to homogeneous coordinates
        line_equations = []
        for line in lines:
            x1, y1, x2, y2 = line
            # Line equation: ax + by + c = 0
            # Cross product of two points gives line in homogeneous coords
            p1 = np.array([x1, y1, 1])
            p2 = np.array([x2, y2, 1])
            l = np.cross(p1, p2)
            line_equations.append(l / np.linalg.norm(l[:2]))  # Normalize

        line_equations = np.array(line_equations)

        vanishing_points = []

        for _ in range(max_vps):
            best_vp = None
            best_inliers = []
            best_score = 0

            # RANSAC
            n_iterations = min(500, len(line_equations) * 10)
            threshold = 0.01  # Cosine similarity threshold

            for _ in range(n_iterations):
                # Sample two lines
                idx = np.random.choice(len(line_equations), 2, replace=False)
                l1, l2 = line_equations[idx]

                # Compute intersection (vanishing point)
                vp = np.cross(l1, l2)
                if abs(vp[2]) < 1e-6:  # Lines parallel
                    continue

                vp = vp / vp[2]  # Normalize

                # Check if within reasonable bounds
                h, w = image_shape
                if not (-w * 2 < vp[0] < w * 3 and -h * 2 < vp[1] < h * 3):
                    continue

                # Find inliers (lines passing through this VP)
                inliers = []
                for i, l in enumerate(line_equations):
                    # Distance from line to VP
                    dist = abs(np.dot(l, vp)) / np.linalg.norm(l[:2])

                    if dist < threshold * max(w, h):
                        inliers.append(i)

                score = len(inliers)
                if score > best_score:
                    best_score = score
                    best_vp = vp[:2]
                    best_inliers = inliers

            if best_score < 5:  # Need at least 5 supporting lines
                break

            # Remove inlier lines for next iteration
            line_equations = np.delete(line_equations, best_inliers, axis=0)

            # Compute confidence
            confidence = best_score / len(lines)

            vanishing_points.append(VanishingPoint(
                point=best_vp,
                direction=np.array([0, 0, 0]),  # TODO: compute from camera params
                confidence=confidence,
                supporting_lines=[lines[i] for i in best_inliers]
            ))

        return vanishing_points

    def detect_horizon(self, image: np.ndarray) -> Optional[Tuple[float, float]]:
        """
        Detect horizon line in image.

        Args:
            image: Input image

        Returns:
            (y_coordinate, confidence) or None if not found
        """
        # Simple method: detect horizontal vanishing line
        lines = self.detect_lines(image)

        if len(lines) == 0:
            return None

        # Filter for mostly horizontal lines
        horizontal_lines = []
        for line in lines:
            x1, y1, x2, y2 = line
            angle = np.abs(np.arctan2(y2 - y1, x2 - x1))
            if angle < np.pi / 6:  # Within 30 degrees of horizontal
                horizontal_lines.append(line)

        if len(horizontal_lines) < 3:
            return None

        # Take median Y coordinate
        y_coords = []
        for line in horizontal_lines:
            x1, y1, x2, y2 = line
            y_coords.append((y1 + y2) / 2)

        horizon_y = np.median(y_coords)
        confidence = len(horizontal_lines) / max(len(lines), 1)

        return horizon_y, confidence

    def extract_corners(self, image: np.ndarray,
                       max_corners: int = 1000,
                       quality_level: float = 0.01,
                       min_distance: int = 10) -> np.ndarray:
        """
        Extract corner features using Shi-Tomasi.

        Args:
            image: Input image
            max_corners: Maximum number of corners to detect
            quality_level: Quality threshold
            min_distance: Minimum distance between corners

        Returns:
            Nx2 array of corner coordinates
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image.copy()

        corners = cv2.goodFeaturesToTrack(
            gray,
            maxCorners=max_corners,
            qualityLevel=quality_level,
            minDistance=min_distance
        )

        if corners is None:
            return np.array([])

        return corners.reshape(-1, 2)

    def match_features(self, image1: np.ndarray, image2: np.ndarray,
                      method: str = 'orb') -> Tuple[np.ndarray, np.ndarray]:
        """
        Match features between two images.

        Args:
            image1: First image
            image2: Second image
            method: Feature detector ('orb', 'sift', or 'surf')

        Returns:
            (points1, points2) where each is Nx2 array of matched points
        """
        # Convert to grayscale
        if len(image1.shape) == 3:
            gray1 = cv2.cvtColor(image1, cv2.COLOR_RGB2GRAY)
        else:
            gray1 = image1.copy()

        if len(image2.shape) == 3:
            gray2 = cv2.cvtColor(image2, cv2.COLOR_RGB2GRAY)
        else:
            gray2 = image2.copy()

        # Create feature detector
        if method == 'orb':
            detector = cv2.ORB_create(nfeatures=2000)
        elif method == 'sift':
            detector = cv2.SIFT_create()
        else:
            raise ValueError(f"Unknown method: {method}")

        # Detect and compute
        kp1, des1 = detector.detectAndCompute(gray1, None)
        kp2, des2 = detector.detectAndCompute(gray2, None)

        if des1 is None or des2 is None or len(kp1) < 4 or len(kp2) < 4:
            return np.array([]), np.array([])

        # Match features
        if method == 'orb':
            matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        else:
            matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)

        matches = matcher.knnMatch(des1, des2, k=2)

        # Apply ratio test
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        if len(good_matches) < 4:
            return np.array([]), np.array([])

        # Extract matched points
        points1 = np.array([kp1[m.queryIdx].pt for m in good_matches])
        points2 = np.array([kp2[m.trainIdx].pt for m in good_matches])

        return points1, points2
