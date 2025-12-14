#!/usr/bin/env python3
"""
YOLOv8 + Re-ID Preprocessor

Extracts detection bounding boxes, clothing attributes, and re-ID embeddings
from video files for the Axis-Guardian tracking system.

Models used:
- YOLOv8x: Person detection with bounding boxes
- OSNet-x1.0: Re-ID embeddings (512-dim vectors)
- Simple color analysis: Clothing color extraction

Usage:
    python yolo_reid_preprocessor.py --input video.mp4 --output detections.json
"""

import argparse
import json
import gzip
import sys
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

import cv2
import numpy as np
import torch
from tqdm import tqdm

# Conditional imports with helpful error messages
try:
    from ultralytics import YOLO
except ImportError:
    print("Error: ultralytics not installed. Run: pip install ultralytics")
    sys.exit(1)

try:
    import torchreid
except ImportError:
    print("Warning: torchreid not installed. Re-ID embeddings will be disabled.")
    print("Install with: pip install torchreid")
    torchreid = None


@dataclass
class ColorScore:
    name: str
    score: float


@dataclass
class ClothingTypeScore:
    name: str
    score: float


@dataclass
class ClothingAttributes:
    colors: list[ColorScore]
    type: Optional[ClothingTypeScore] = None


@dataclass
class DetectionAttributes:
    upper_clothing: Optional[ClothingAttributes] = None
    lower_clothing: Optional[ClothingAttributes] = None
    embedding: Optional[list[float]] = None
    embedding_quality: Optional[float] = None


@dataclass
class Detection:
    bbox: list[float]  # [x, y, width, height] normalized 0-1
    confidence: float
    class_id: int
    class_name: str
    track_id: Optional[int] = None
    track_state: Optional[str] = None
    attributes: Optional[DetectionAttributes] = None


@dataclass
class DetectionFrame:
    frame_number: int
    timestamp: float
    detections: list[Detection]


# Predefined clothing colors for classification
CLOTHING_COLORS = {
    'black': np.array([0, 0, 0]),
    'white': np.array([255, 255, 255]),
    'gray': np.array([128, 128, 128]),
    'red': np.array([180, 50, 50]),
    'blue': np.array([50, 50, 180]),
    'green': np.array([50, 150, 50]),
    'yellow': np.array([200, 200, 50]),
    'orange': np.array([220, 150, 50]),
    'purple': np.array([130, 50, 150]),
    'pink': np.array([220, 130, 170]),
    'brown': np.array([100, 70, 40]),
    'beige': np.array([200, 180, 150]),
    'navy': np.array([30, 30, 100]),
    'cyan': np.array([50, 180, 180]),
}


class ColorAnalyzer:
    """Analyzes clothing colors from cropped person images."""

    def __init__(self):
        self.color_names = list(CLOTHING_COLORS.keys())
        self.color_values = np.array(list(CLOTHING_COLORS.values()))

    def analyze_region(self, img: np.ndarray) -> list[ColorScore]:
        """Analyze dominant colors in an image region."""
        if img.size == 0 or img.shape[0] < 5 or img.shape[1] < 5:
            return []

        # Resize for faster processing
        small = cv2.resize(img, (32, 32))
        pixels = small.reshape(-1, 3).astype(np.float32)

        # Calculate histogram-weighted color matching
        color_scores = {}
        for name, color_val in zip(self.color_names, self.color_values):
            # Euclidean distance in RGB space
            distances = np.linalg.norm(pixels - color_val, axis=1)
            # Convert to similarity score (0-1)
            similarities = 1 / (1 + distances / 100)
            color_scores[name] = float(np.mean(similarities))

        # Sort by score and take top 3
        sorted_colors = sorted(color_scores.items(), key=lambda x: x[1], reverse=True)[:3]

        # Normalize scores
        total = sum(s for _, s in sorted_colors)
        if total > 0:
            return [ColorScore(name=n, score=round(s / total, 3)) for n, s in sorted_colors]
        return []

    def extract_clothing_colors(
        self, img: np.ndarray, bbox: tuple[int, int, int, int]
    ) -> tuple[list[ColorScore], list[ColorScore]]:
        """Extract upper and lower body clothing colors."""
        x, y, w, h = bbox

        # Crop person region
        person = img[y:y+h, x:x+w]
        if person.size == 0:
            return [], []

        # Split into upper (torso) and lower (legs) regions
        # Upper: 20-50% of height (skip head)
        # Lower: 50-90% of height (skip feet)
        upper_start = int(h * 0.2)
        upper_end = int(h * 0.5)
        lower_start = int(h * 0.5)
        lower_end = int(h * 0.9)

        upper_region = person[upper_start:upper_end, :]
        lower_region = person[lower_start:lower_end, :]

        upper_colors = self.analyze_region(upper_region)
        lower_colors = self.analyze_region(lower_region)

        return upper_colors, lower_colors


class ReIDExtractor:
    """Extracts re-ID embeddings using OSNet model."""

    def __init__(self, model_name: str = 'osnet_x1_0', device: str = 'auto'):
        if torchreid is None:
            self.model = None
            self.device = None
            print("Warning: Re-ID extraction disabled (torchreid not installed)")
            return

        if device == 'auto':
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        print(f"Loading OSNet model on {self.device}...")
        self.model = torchreid.utils.FeatureExtractor(
            model_name=model_name,
            device=str(self.device),
        )
        print("OSNet model loaded.")

    def extract(self, img: np.ndarray, bboxes: list[tuple[int, int, int, int]]) -> list[tuple[list[float], float]]:
        """Extract embeddings for all bboxes in an image.

        Returns list of (embedding, quality) tuples.
        """
        if self.model is None or len(bboxes) == 0:
            return [(None, 0.0)] * len(bboxes)

        crops = []
        valid_indices = []

        for i, (x, y, w, h) in enumerate(bboxes):
            # Crop person
            crop = img[y:y+h, x:x+w]
            if crop.size == 0 or crop.shape[0] < 32 or crop.shape[1] < 32:
                continue

            # Resize to OSNet input size (256x128 for person re-id)
            crop_resized = cv2.resize(crop, (128, 256))
            # Convert BGR to RGB
            crop_rgb = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2RGB)
            crops.append(crop_rgb)
            valid_indices.append(i)

        if len(crops) == 0:
            return [(None, 0.0)] * len(bboxes)

        # Batch extract embeddings
        with torch.no_grad():
            features = self.model(crops)

        # L2 normalize embeddings
        features = features / torch.norm(features, dim=1, keepdim=True)

        results = [(None, 0.0)] * len(bboxes)
        for idx, feat in zip(valid_indices, features):
            embedding = feat.cpu().numpy().tolist()
            # Quality based on feature magnitude before normalization (higher = more confident)
            quality = min(1.0, float(torch.norm(feat).item()) / 50.0)
            results[idx] = (embedding, quality)

        return results


class YOLOReIDPreprocessor:
    """Main preprocessor combining YOLOv8 detection with re-ID attributes."""

    def __init__(
        self,
        yolo_model: str = 'yolov8x.pt',
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        device: str = 'auto',
        enable_reid: bool = True,
        enable_colors: bool = True,
    ):
        print(f"Loading YOLOv8 model: {yolo_model}")
        self.yolo = YOLO(yolo_model)
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold

        if device == 'auto':
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device

        self.color_analyzer = ColorAnalyzer() if enable_colors else None
        self.reid_extractor = ReIDExtractor(device=self.device) if enable_reid else None

    def _get_model_name(self) -> str:
        """Get YOLO model name safely across different ultralytics versions."""
        try:
            if hasattr(self.yolo, 'ckpt_path') and self.yolo.ckpt_path:
                return str(Path(self.yolo.ckpt_path).name)
            if hasattr(self.yolo, 'model_name'):
                return self.yolo.model_name
            return 'yolov8'
        except Exception:
            return 'yolov8'

    def process_video(
        self,
        video_path: str,
        output_path: Optional[str] = None,
        max_frames: Optional[int] = None,
        track: bool = True,
    ) -> dict:
        """Process a video file and extract detections with attributes.

        Args:
            video_path: Path to input video file
            output_path: Path to output JSON file (optional)
            max_frames: Maximum frames to process (optional)
            track: Enable YOLOv8 tracking for persistent IDs

        Returns:
            Detection data dictionary
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if max_frames:
            total_frames = min(total_frames, max_frames)

        print(f"Processing {total_frames} frames at {fps:.1f} FPS ({width}x{height})")

        frames_data: list[DetectionFrame] = []
        track_id_map: dict[int, int] = {}  # YOLO track ID -> consistent ID

        for frame_num in tqdm(range(total_frames), desc="Processing frames"):
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = frame_num / fps

            # Run YOLOv8 detection/tracking
            if track:
                results = self.yolo.track(
                    frame,
                    persist=True,
                    conf=self.confidence_threshold,
                    iou=self.iou_threshold,
                    classes=[0],  # Person class only
                    device=self.device,
                    verbose=False,
                )
            else:
                results = self.yolo(
                    frame,
                    conf=self.confidence_threshold,
                    iou=self.iou_threshold,
                    classes=[0],
                    device=self.device,
                    verbose=False,
                )

            detections = []
            bboxes_for_reid = []

            for result in results:
                if result.boxes is None:
                    continue

                boxes = result.boxes
                for i in range(len(boxes)):
                    # Get bounding box (xyxy format)
                    xyxy = boxes.xyxy[i].cpu().numpy()
                    x1, y1, x2, y2 = map(int, xyxy)
                    conf = float(boxes.conf[i])

                    # Normalize bbox to [x, y, w, h] in 0-1 range
                    bbox_norm = [
                        x1 / width,
                        y1 / height,
                        (x2 - x1) / width,
                        (y2 - y1) / height,
                    ]

                    # Get track ID if available
                    track_id = None
                    track_state = None
                    if track and boxes.id is not None:
                        raw_id = int(boxes.id[i])
                        if raw_id not in track_id_map:
                            track_id_map[raw_id] = len(track_id_map) + 1
                        track_id = track_id_map[raw_id]
                        track_state = 'active'

                    det = Detection(
                        bbox=bbox_norm,
                        confidence=round(conf, 4),
                        class_id=0,
                        class_name='person',
                        track_id=track_id,
                        track_state=track_state,
                    )

                    bboxes_for_reid.append((x1, y1, x2 - x1, y2 - y1))
                    detections.append(det)

            # Extract attributes for all detections
            if len(detections) > 0:
                # Extract clothing colors
                if self.color_analyzer:
                    for det, (x, y, w, h) in zip(detections, bboxes_for_reid):
                        upper_colors, lower_colors = self.color_analyzer.extract_clothing_colors(
                            frame, (x, y, w, h)
                        )
                        if upper_colors or lower_colors:
                            det.attributes = DetectionAttributes(
                                upper_clothing=ClothingAttributes(colors=upper_colors) if upper_colors else None,
                                lower_clothing=ClothingAttributes(colors=lower_colors) if lower_colors else None,
                            )

                # Extract re-ID embeddings
                if self.reid_extractor and self.reid_extractor.model is not None:
                    embeddings = self.reid_extractor.extract(frame, bboxes_for_reid)
                    for det, (emb, quality) in zip(detections, embeddings):
                        if emb is not None:
                            if det.attributes is None:
                                det.attributes = DetectionAttributes()
                            det.attributes.embedding = emb
                            det.attributes.embedding_quality = round(quality, 3)

            frames_data.append(DetectionFrame(
                frame_number=frame_num,
                timestamp=round(timestamp, 4),
                detections=detections,
            ))

        cap.release()

        # Build output structure
        output = {
            'format_version': '2.0',
            'video_info': {
                'width': width,
                'height': height,
                'fps': fps,
                'total_frames': total_frames,
                'duration': total_frames / fps,
            },
            'detection_config': {
                'model': self._get_model_name(),
                'confidence_threshold': self.confidence_threshold,
                'iou_threshold': self.iou_threshold,
                'reid_enabled': self.reid_extractor is not None and self.reid_extractor.model is not None,
                'color_analysis_enabled': self.color_analyzer is not None,
            },
            'frames': [self._frame_to_dict(f) for f in frames_data],
        }

        # Save output
        if output_path:
            self._save_output(output, output_path)

        return output

    def _frame_to_dict(self, frame: DetectionFrame) -> dict:
        """Convert DetectionFrame to dictionary."""
        return {
            'frame_number': frame.frame_number,
            'timestamp': frame.timestamp,
            'detections': [self._detection_to_dict(d) for d in frame.detections],
        }

    def _detection_to_dict(self, det: Detection) -> dict:
        """Convert Detection to dictionary."""
        d = {
            'bbox': det.bbox,
            'confidence': det.confidence,
            'class_id': det.class_id,
            'class_name': det.class_name,
        }
        if det.track_id is not None:
            d['track_id'] = det.track_id
        if det.track_state is not None:
            d['track_state'] = det.track_state
        if det.attributes is not None:
            d['attributes'] = self._attributes_to_dict(det.attributes)
        return d

    def _attributes_to_dict(self, attrs: DetectionAttributes) -> dict:
        """Convert DetectionAttributes to dictionary."""
        d = {}
        if attrs.upper_clothing:
            d['upper_clothing'] = {
                'colors': [asdict(c) for c in attrs.upper_clothing.colors],
            }
            if attrs.upper_clothing.type:
                d['upper_clothing']['type'] = asdict(attrs.upper_clothing.type)
        if attrs.lower_clothing:
            d['lower_clothing'] = {
                'colors': [asdict(c) for c in attrs.lower_clothing.colors],
            }
            if attrs.lower_clothing.type:
                d['lower_clothing']['type'] = asdict(attrs.lower_clothing.type)
        if attrs.embedding is not None:
            d['embedding'] = attrs.embedding
        if attrs.embedding_quality is not None:
            d['embedding_quality'] = attrs.embedding_quality
        return d

    def _save_output(self, output: dict, path: str) -> None:
        """Save output to JSON or gzipped JSON."""
        path = Path(path)

        if path.suffix == '.gz':
            with gzip.open(path, 'wt', encoding='utf-8') as f:
                json.dump(output, f)
        else:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2)

        # Calculate file size
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"Output saved to {path} ({size_mb:.2f} MB)")


def main():
    parser = argparse.ArgumentParser(
        description='YOLOv8 + Re-ID Preprocessor for Axis-Guardian',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic usage
    python yolo_reid_preprocessor.py --input video.mp4 --output detections.json

    # With gzip compression
    python yolo_reid_preprocessor.py --input video.mp4 --output detections.json.gz

    # Disable re-ID embeddings (faster, smaller output)
    python yolo_reid_preprocessor.py --input video.mp4 --output detections.json --no-reid

    # Process only first 100 frames
    python yolo_reid_preprocessor.py --input video.mp4 --output detections.json --max-frames 100
        """
    )

    parser.add_argument('--input', '-i', required=True, help='Input video file')
    parser.add_argument('--output', '-o', required=True, help='Output JSON file (use .json.gz for compression)')
    parser.add_argument('--yolo-model', default='yolov8x.pt', help='YOLOv8 model file (default: yolov8x.pt)')
    parser.add_argument('--confidence', type=float, default=0.5, help='Detection confidence threshold (default: 0.5)')
    parser.add_argument('--iou', type=float, default=0.45, help='IOU threshold for NMS (default: 0.45)')
    parser.add_argument('--device', default='auto', help='Device: auto, cpu, cuda, cuda:0, etc.')
    parser.add_argument('--max-frames', type=int, help='Maximum frames to process')
    parser.add_argument('--no-track', action='store_true', help='Disable YOLOv8 tracking')
    parser.add_argument('--no-reid', action='store_true', help='Disable re-ID embedding extraction')
    parser.add_argument('--no-colors', action='store_true', help='Disable clothing color analysis')

    args = parser.parse_args()

    # Validate input
    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Create preprocessor
    preprocessor = YOLOReIDPreprocessor(
        yolo_model=args.yolo_model,
        confidence_threshold=args.confidence,
        iou_threshold=args.iou,
        device=args.device,
        enable_reid=not args.no_reid,
        enable_colors=not args.no_colors,
    )

    # Process video
    preprocessor.process_video(
        video_path=args.input,
        output_path=args.output,
        max_frames=args.max_frames,
        track=not args.no_track,
    )

    print("Done!")


if __name__ == '__main__':
    main()
