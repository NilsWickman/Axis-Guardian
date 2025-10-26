"""Semantic segmentation for scene understanding."""

import numpy as np
import torch
from torch import nn
from transformers import AutoImageProcessor, AutoModelForSemanticSegmentation
from PIL import Image
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class SegmentClass(Enum):
    """Semantic segment classes relevant for site mapping."""
    WALKABLE = "walkable"  # Roads, sidewalks, paths
    WALL = "wall"  # Walls, buildings, fences
    OBSTACLE = "obstacle"  # Various obstacles
    VEGETATION = "vegetation"  # Trees, grass
    VEHICLE = "vehicle"  # Parked vehicles
    UNKNOWN = "unknown"


@dataclass
class SegmentationResult:
    """Result of semantic segmentation."""
    segmentation_map: np.ndarray  # HxW array of class indices
    confidence_map: np.ndarray  # HxW array of confidence scores
    class_mapping: Dict[int, SegmentClass]  # Maps indices to semantic classes


class SemanticSegmenter:
    """Semantic segmentation using pretrained models."""

    # ADE20K class mappings to our semantic classes
    ADE20K_TO_SEMANTIC = {
        # Walkable surfaces
        4: SegmentClass.WALKABLE,    # floor
        6: SegmentClass.WALKABLE,    # road
        11: SegmentClass.WALKABLE,   # sidewalk, pavement
        29: SegmentClass.WALKABLE,   # path
        52: SegmentClass.WALKABLE,   # runway

        # Walls and boundaries
        0: SegmentClass.WALL,        # wall
        1: SegmentClass.WALL,        # building, edifice
        2: SegmentClass.WALL,        # fence, fencing
        8: SegmentClass.WALL,        # door
        14: SegmentClass.WALL,       # windowpane, window

        # Vegetation
        9: SegmentClass.VEGETATION,  # tree
        10: SegmentClass.VEGETATION, # grass
        66: SegmentClass.VEGETATION, # plant, flora

        # Vehicles
        20: SegmentClass.VEHICLE,    # car
        80: SegmentClass.VEHICLE,    # truck
        83: SegmentClass.VEHICLE,    # bus

        # Obstacles
        19: SegmentClass.OBSTACLE,   # pole
        23: SegmentClass.OBSTACLE,   # box
        33: SegmentClass.OBSTACLE,   # chair
        64: SegmentClass.OBSTACLE,   # desk
    }

    def __init__(self, model_name: str = "nvidia/segformer-b5-finetuned-ade-640-640",
                 device: Optional[str] = None):
        """
        Initialize semantic segmenter.

        Args:
            model_name: HuggingFace model identifier
            device: Device to run on ('cuda', 'cpu', or None for auto)
        """
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')

        # Load model and processor
        self.processor = AutoImageProcessor.from_pretrained(model_name)
        self.model = AutoModelForSemanticSegmentation.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()

        # Get number of classes
        self.num_classes = self.model.config.num_labels

    def segment_image(self, image: np.ndarray) -> SegmentationResult:
        """
        Perform semantic segmentation on image.

        Args:
            image: RGB image as numpy array (HxWx3)

        Returns:
            SegmentationResult with segmentation map and confidence
        """
        # Convert to PIL for processor
        if isinstance(image, np.ndarray):
            pil_image = Image.fromarray(image)
        else:
            pil_image = image

        # Preprocess
        inputs = self.processor(images=pil_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits  # [B, num_classes, H, W]

        # Get predictions and confidence
        # Upsample to original size
        upsampled_logits = nn.functional.interpolate(
            logits,
            size=pil_image.size[::-1],  # (height, width)
            mode='bilinear',
            align_corners=False
        )

        # Softmax to get probabilities
        probs = torch.softmax(upsampled_logits, dim=1)[0]  # [num_classes, H, W]

        # Get predicted class and confidence
        confidence_map, segmentation_map = torch.max(probs, dim=0)

        # Convert to numpy
        segmentation_map = segmentation_map.cpu().numpy()
        confidence_map = confidence_map.cpu().numpy()

        # Map ADE20K classes to our semantic classes
        class_mapping = self._create_class_mapping(segmentation_map)

        return SegmentationResult(
            segmentation_map=segmentation_map,
            confidence_map=confidence_map,
            class_mapping=class_mapping
        )

    def _create_class_mapping(self, segmentation_map: np.ndarray) -> Dict[int, SegmentClass]:
        """
        Create mapping from segmentation indices to semantic classes.

        Args:
            segmentation_map: HxW array of class indices

        Returns:
            Dictionary mapping indices to SegmentClass
        """
        unique_classes = np.unique(segmentation_map)
        mapping = {}

        for cls_idx in unique_classes:
            mapping[cls_idx] = self.ADE20K_TO_SEMANTIC.get(
                cls_idx, SegmentClass.UNKNOWN
            )

        return mapping

    def extract_class_mask(self, result: SegmentationResult,
                          target_class: SegmentClass,
                          min_confidence: float = 0.5) -> np.ndarray:
        """
        Extract binary mask for a specific semantic class.

        Args:
            result: Segmentation result
            target_class: Target semantic class
            min_confidence: Minimum confidence threshold

        Returns:
            Binary mask (HxW) where True indicates target class
        """
        # Find all indices that map to target class
        target_indices = [
            idx for idx, cls in result.class_mapping.items()
            if cls == target_class
        ]

        # Create binary mask
        mask = np.zeros_like(result.segmentation_map, dtype=bool)
        for idx in target_indices:
            class_mask = result.segmentation_map == idx
            confident_mask = result.confidence_map >= min_confidence
            mask |= (class_mask & confident_mask)

        return mask

    def extract_boundaries(self, mask: np.ndarray,
                          kernel_size: int = 3) -> np.ndarray:
        """
        Extract boundaries from binary mask using morphological operations.

        Args:
            mask: Binary mask
            kernel_size: Size of morphological kernel

        Returns:
            Binary boundary mask
        """
        import cv2

        # Dilate and subtract to get boundary
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        dilated = cv2.dilate(mask.astype(np.uint8), kernel, iterations=1)
        eroded = cv2.erode(mask.astype(np.uint8), kernel, iterations=1)

        boundary = (dilated - eroded) > 0

        return boundary

    def get_segment_contours(self, mask: np.ndarray) -> List[np.ndarray]:
        """
        Get contours of segments from binary mask.

        Args:
            mask: Binary mask

        Returns:
            List of contours (each Nx2 array of points)
        """
        import cv2

        contours, _ = cv2.findContours(
            mask.astype(np.uint8),
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        # Convert to list of Nx2 arrays
        contours = [cnt.squeeze() for cnt in contours if len(cnt) > 2]

        return contours
