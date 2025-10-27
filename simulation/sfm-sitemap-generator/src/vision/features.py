"""Feature extraction from images."""

import cv2
import numpy as np
from enum import Enum
from typing import Tuple, Optional
from dataclasses import dataclass


class FeatureType(Enum):
    """Supported feature detector types."""

    SIFT = "sift"
    ORB = "orb"
    AKAZE = "akaze"


@dataclass
class ImageFeatures:
    """Extracted features from an image."""

    keypoints: Tuple[cv2.KeyPoint, ...]  # OpenCV keypoints
    descriptors: np.ndarray  # Feature descriptors
    image_shape: Tuple[int, int]  # (height, width)
    feature_type: FeatureType


class FeatureExtractor:
    """Extract features from images using various detectors."""

    def __init__(self, feature_type: FeatureType = FeatureType.SIFT, max_features: int = 8000):
        """
        Initialize feature extractor.

        Args:
            feature_type: Type of feature detector
            max_features: Maximum number of features to extract
        """
        self.feature_type = feature_type
        self.max_features = max_features
        self.detector = self._create_detector()

    def _create_detector(self):
        """Create OpenCV feature detector based on type."""
        if self.feature_type == FeatureType.SIFT:
            return cv2.SIFT_create(nfeatures=self.max_features)
        elif self.feature_type == FeatureType.ORB:
            return cv2.ORB_create(nfeatures=self.max_features)
        elif self.feature_type == FeatureType.AKAZE:
            return cv2.AKAZE_create()
        else:
            raise ValueError(f"Unknown feature type: {self.feature_type}")

    def extract(self, image: np.ndarray) -> ImageFeatures:
        """
        Extract features from image.

        Args:
            image: Input image (grayscale or color)

        Returns:
            Extracted features
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        # Detect keypoints and compute descriptors
        keypoints, descriptors = self.detector.detectAndCompute(gray, None)

        if descriptors is None:
            # No features found
            descriptors = np.array([])
            keypoints = []

        return ImageFeatures(
            keypoints=tuple(keypoints),
            descriptors=descriptors,
            image_shape=gray.shape,
            feature_type=self.feature_type
        )

    def extract_from_file(self, image_path: str) -> ImageFeatures:
        """
        Extract features from image file.

        Args:
            image_path: Path to image file

        Returns:
            Extracted features
        """
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Could not load image: {image_path}")

        return self.extract(image)

    def visualize_keypoints(
        self,
        image: np.ndarray,
        features: ImageFeatures,
        max_display: Optional[int] = None
    ) -> np.ndarray:
        """
        Visualize keypoints on image.

        Args:
            image: Input image
            features: Extracted features
            max_display: Maximum number of keypoints to display

        Returns:
            Image with keypoints drawn
        """
        keypoints = features.keypoints
        if max_display is not None and len(keypoints) > max_display:
            # Sort by response (strength) and take top N
            keypoints = sorted(keypoints, key=lambda kp: kp.response, reverse=True)[:max_display]

        output = cv2.drawKeypoints(
            image,
            keypoints,
            None,
            flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
        )

        return output

    def get_keypoint_coordinates(self, features: ImageFeatures) -> np.ndarray:
        """
        Get keypoint coordinates as array.

        Args:
            features: Extracted features

        Returns:
            Nx2 array of (x, y) coordinates
        """
        return np.array([kp.pt for kp in features.keypoints])
