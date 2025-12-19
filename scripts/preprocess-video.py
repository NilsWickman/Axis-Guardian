#!/usr/bin/env python3
"""
Video Preprocessing Pipeline

Process MP4 videos to generate detection metadata with tracking and ReID embeddings.

Usage:
    python preprocess-video.py input.mp4 --output detections.json.gz
    python preprocess-video.py input.mp4 --output-dir ./processed/ --render
    python preprocess-video.py input.mp4 --camera-id camera1 --output-dir ./processed/

Requirements:
    pip install -r requirements-preprocess.txt
"""

import argparse
import gzip
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np
from tqdm import tqdm

# Lazy imports for optional heavy dependencies
_yolo_model = None
_reid_model = None
_reid_transform = None


def get_yolo_model(model_path: str, device: str):
    """Lazy load YOLO model."""
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        _yolo_model = YOLO(model_path)
        _yolo_model.to(device)
    return _yolo_model


def get_reid_model(device: str):
    """Lazy load OSNet ReID model."""
    global _reid_model, _reid_transform
    if _reid_model is None:
        import torch
        import torchreid
        from torchvision import transforms

        # Build OSNet model
        _reid_model = torchreid.models.build_model(
            name='osnet_x1_0',
            num_classes=1000,  # Pretrained classes, we only use features
            pretrained=True,
            loss='softmax'
        )
        _reid_model = _reid_model.to(device)
        _reid_model.eval()

        # Standard transform for ReID models
        _reid_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((256, 128)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    return _reid_model, _reid_transform


# Color name mapping for clothing analysis
COLOR_NAMES = {
    'black': (0, 0, 0),
    'white': (255, 255, 255),
    'gray': (128, 128, 128),
    'red': (255, 0, 0),
    'green': (0, 128, 0),
    'blue': (0, 0, 255),
    'navy': (0, 0, 128),
    'brown': (139, 69, 19),
    'beige': (245, 245, 220),
    'yellow': (255, 255, 0),
    'orange': (255, 165, 0),
    'pink': (255, 192, 203),
    'purple': (128, 0, 128),
    'cyan': (0, 255, 255),
    'olive': (128, 128, 0),
    'maroon': (128, 0, 0),
    'teal': (0, 128, 128),
}


def rgb_to_color_name(rgb: Tuple[int, int, int]) -> str:
    """Map RGB to nearest named color."""
    min_dist = float('inf')
    closest_name = 'black'

    for name, ref_rgb in COLOR_NAMES.items():
        dist = sum((a - b) ** 2 for a, b in zip(rgb, ref_rgb))
        if dist < min_dist:
            min_dist = dist
            closest_name = name

    return closest_name


def analyze_clothing_colors(
    frame: np.ndarray,
    bbox: Tuple[float, float, float, float],
    n_colors: int = 3
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Analyze clothing colors from upper and lower body regions.

    Args:
        frame: BGR image
        bbox: Normalized [x, y, w, h] coordinates
        n_colors: Number of dominant colors to extract

    Returns:
        Dict with 'upper_clothing' and 'lower_clothing' color lists
    """
    from sklearn.cluster import KMeans

    h, w = frame.shape[:2]

    # Convert normalized coords to pixels
    x1 = int(bbox[0] * w)
    y1 = int(bbox[1] * h)
    x2 = int((bbox[0] + bbox[2]) * w)
    y2 = int((bbox[1] + bbox[3]) * h)

    # Clamp to image bounds
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)

    if x2 <= x1 or y2 <= y1:
        return _empty_colors()

    crop = frame[y1:y2, x1:x2]
    crop_h = crop.shape[0]

    if crop_h < 10:
        return _empty_colors()

    # Split into upper 40% and lower 40% (skip middle 20%)
    upper_end = int(crop_h * 0.4)
    lower_start = int(crop_h * 0.6)

    upper_region = crop[:upper_end, :]
    lower_region = crop[lower_start:, :]

    result = {}

    for region_name, region in [('upper_clothing', upper_region), ('lower_clothing', lower_region)]:
        if region.size == 0 or region.shape[0] < 5 or region.shape[1] < 5:
            result[region_name] = {'colors': [{'name': 'black', 'score': 1.0}]}
            continue

        # Convert to RGB and reshape for clustering
        region_rgb = cv2.cvtColor(region, cv2.COLOR_BGR2RGB)
        pixels = region_rgb.reshape(-1, 3).astype(np.float32)

        # Sample if too many pixels
        if len(pixels) > 1000:
            indices = np.random.choice(len(pixels), 1000, replace=False)
            pixels = pixels[indices]

        if len(pixels) < n_colors:
            result[region_name] = {'colors': [{'name': 'black', 'score': 1.0}]}
            continue

        # K-means clustering
        kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
        labels = kmeans.fit_predict(pixels)

        # Count labels and calculate scores
        unique, counts = np.unique(labels, return_counts=True)
        total = counts.sum()

        colors = []
        for cluster_idx in np.argsort(-counts):  # Sort by frequency
            center = kmeans.cluster_centers_[cluster_idx].astype(int)
            color_name = rgb_to_color_name(tuple(center))
            score = round(float(counts[cluster_idx] / total), 3)
            colors.append({'name': color_name, 'score': score})

        result[region_name] = {'colors': colors}

    return result


def _empty_colors() -> Dict[str, Any]:
    """Return empty color structure."""
    return {
        'upper_clothing': {'colors': [{'name': 'black', 'score': 1.0}]},
        'lower_clothing': {'colors': [{'name': 'black', 'score': 1.0}]}
    }


def extract_reid_embedding(
    frame: np.ndarray,
    bbox: Tuple[float, float, float, float],
    device: str
) -> Tuple[List[float], float]:
    """
    Extract ReID embedding for a detection.

    Args:
        frame: BGR image
        bbox: Normalized [x, y, w, h] coordinates
        device: torch device

    Returns:
        Tuple of (embedding list, quality score)
    """
    import torch

    model, transform = get_reid_model(device)

    h, w = frame.shape[:2]

    # Convert normalized coords to pixels
    x1 = int(bbox[0] * w)
    y1 = int(bbox[1] * h)
    x2 = int((bbox[0] + bbox[2]) * w)
    y2 = int((bbox[1] + bbox[3]) * h)

    # Clamp and validate
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)

    if x2 <= x1 or y2 <= y1:
        return [0.0] * 512, 0.0

    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return [0.0] * 512, 0.0

    # Convert BGR to RGB
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

    # Transform and add batch dimension
    img_tensor = transform(crop_rgb).unsqueeze(0).to(device)

    # Extract features
    with torch.no_grad():
        features = model(img_tensor)

    # Normalize to unit vector
    features = torch.nn.functional.normalize(features, p=2, dim=1)
    # Convert to Python floats for JSON serialization
    embedding = [float(x) for x in features.cpu().numpy().flatten()]

    # Quality based on crop size (larger = better)
    crop_area = (x2 - x1) * (y2 - y1)
    quality = min(1.0, crop_area / (128 * 256))  # Normalize to ideal ReID input size

    return embedding, round(float(quality), 2)


def process_video(
    input_path: str,
    output_path: str,
    model_path: str = 'yolov8x.pt',
    tracker: str = 'botsort.yaml',
    conf_threshold: float = 0.5,
    iou_threshold: float = 0.45,
    enable_reid: bool = True,
    enable_colors: bool = True,
    device: str = 'auto',
    render_output: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process video and generate detection metadata.

    Args:
        input_path: Path to input video
        output_path: Path for output JSON (will be gzipped if ends with .gz)
        model_path: YOLO model path
        tracker: Tracker config file
        conf_threshold: Detection confidence threshold
        iou_threshold: NMS IoU threshold
        enable_reid: Extract ReID embeddings
        enable_colors: Analyze clothing colors
        device: Compute device (auto, cuda, cpu, mps)
        render_output: Optional path for rendered video with bboxes

    Returns:
        Detection metadata dict
    """
    import torch

    # Auto-detect device
    if device == 'auto':
        if torch.cuda.is_available():
            device = 'cuda'
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = 'mps'
        else:
            device = 'cpu'

    print(f"Using device: {device}")

    # Open video
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {input_path}")

    # Get video info
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0

    cap.release()

    print(f"Video: {width}x{height} @ {fps:.2f} fps, {total_frames} frames, {duration:.1f}s")

    # Initialize YOLO model
    print(f"Loading model: {model_path}")
    model = get_yolo_model(model_path, device)

    # Setup video writer for rendering
    video_writer = None
    if render_output:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_writer = cv2.VideoWriter(render_output, fourcc, fps, (width, height))

    # Process video with tracking
    print("Processing video...")
    frames_data = []

    results = model.track(
        source=input_path,
        tracker=tracker,
        persist=True,
        conf=conf_threshold,
        iou=iou_threshold,
        classes=[0],  # person only
        stream=True,
        verbose=False,
        device=device
    )

    for frame_idx, result in enumerate(tqdm(results, total=total_frames, desc="Processing")):
        frame = result.orig_img
        timestamp = frame_idx / fps

        detections = []

        if result.boxes is not None and len(result.boxes) > 0:
            boxes = result.boxes

            for i in range(len(boxes)):
                # Get box coordinates (xyxy format)
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])

                # Convert to normalized xywh (ensure Python floats)
                bbox_x = x1 / width
                bbox_y = y1 / height
                bbox_w = (x2 - x1) / width
                bbox_h = (y2 - y1) / height
                bbox = [
                    round(float(bbox_x), 6),
                    round(float(bbox_y), 6),
                    round(float(bbox_w), 6),
                    round(float(bbox_h), 6)
                ]

                confidence = float(boxes.conf[i].cpu().numpy())
                class_id = int(boxes.cls[i].cpu().numpy())

                # Get track ID
                track_id = 0
                if boxes.id is not None:
                    track_id = int(boxes.id[i].cpu().numpy())

                detection = {
                    'bbox': bbox,
                    'confidence': round(confidence, 4),
                    'class_id': class_id,
                    'class_name': 'person',
                    'track_id': track_id,
                    'track_state': 'active',
                    'attributes': {}
                }

                # Extract ReID embedding
                if enable_reid:
                    embedding, quality = extract_reid_embedding(frame, bbox, device)
                    detection['attributes']['embedding'] = embedding
                    detection['attributes']['embedding_quality'] = quality

                # Analyze clothing colors
                if enable_colors:
                    colors = analyze_clothing_colors(frame, bbox)
                    detection['attributes']['upper_clothing'] = colors['upper_clothing']
                    detection['attributes']['lower_clothing'] = colors['lower_clothing']

                detections.append(detection)

                # Draw on frame for rendering
                if video_writer:
                    cv2.rectangle(
                        frame,
                        (int(x1), int(y1)),
                        (int(x2), int(y2)),
                        (0, 255, 0),
                        2
                    )
                    label = f"ID:{track_id} {confidence:.2f}"
                    cv2.putText(
                        frame,
                        label,
                        (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2
                    )

        frames_data.append({
            'frame_number': int(frame_idx),
            'timestamp': round(float(timestamp), 6),
            'detections': detections
        })

        if video_writer:
            video_writer.write(frame)

    if video_writer:
        video_writer.release()
        print(f"Rendered video saved to: {render_output}")

    # Build output structure
    output = {
        'format_version': '2.0',
        'detection_config': {
            'model': model_path,
            'tracker': tracker,
            'confidence_threshold': conf_threshold,
            'iou_threshold': iou_threshold,
            'reid_enabled': enable_reid,
            'color_analysis_enabled': enable_colors
        },
        'video_info': {
            'width': int(width),
            'height': int(height),
            'fps': round(float(fps), 2),
            'total_frames': int(total_frames),
            'duration': round(float(duration), 6)
        },
        'frames': frames_data
    }

    # Save output
    print(f"Saving to: {output_path}")
    if output_path.endswith('.gz'):
        with gzip.open(output_path, 'wt', encoding='utf-8') as f:
            json.dump(output, f)
    else:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)

    # Print summary
    total_detections = sum(len(f['detections']) for f in frames_data)
    unique_tracks = len(set(
        d['track_id']
        for f in frames_data
        for d in f['detections']
        if d['track_id'] > 0
    ))

    print(f"\nSummary:")
    print(f"  Frames processed: {len(frames_data)}")
    print(f"  Total detections: {total_detections}")
    print(f"  Unique tracks: {unique_tracks}")

    return output


def main():
    parser = argparse.ArgumentParser(
        description='Process video to generate detection metadata with tracking and ReID.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s input.mp4 --output detections.json.gz
  %(prog)s input.mp4 --output-dir ./processed/ --render
  %(prog)s input.mp4 --camera-id camera1 --no-reid
        """
    )

    parser.add_argument('input', help='Input video file (MP4)')
    parser.add_argument('-o', '--output', help='Output JSON file (default: {input}.detections.json.gz)')
    parser.add_argument('--output-dir', help='Output directory (creates {basename}.detections.json.gz)')
    parser.add_argument('--camera-id', help='Camera identifier for naming')
    parser.add_argument('--render', action='store_true', help='Also output rendered video with bboxes')
    parser.add_argument('--model', default='yolov8x.pt', help='YOLO model (default: yolov8x.pt)')
    parser.add_argument('--tracker', default='botsort.yaml', help='Tracker config (default: botsort.yaml)')
    parser.add_argument('--conf', type=float, default=0.5, help='Confidence threshold (default: 0.5)')
    parser.add_argument('--iou', type=float, default=0.45, help='IoU threshold (default: 0.45)')
    parser.add_argument('--no-reid', action='store_true', help='Disable ReID embeddings')
    parser.add_argument('--no-colors', action='store_true', help='Disable color analysis')
    parser.add_argument('--device', default='auto', choices=['auto', 'cuda', 'cpu', 'mps'],
                        help='Device (default: auto)')

    args = parser.parse_args()

    # Validate input
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # Determine output path
    if args.output:
        output_path = args.output
    elif args.output_dir:
        os.makedirs(args.output_dir, exist_ok=True)
        basename = Path(args.input).stem
        if args.camera_id:
            basename = args.camera_id
        output_path = os.path.join(args.output_dir, f"{basename}.detections.json.gz")
    else:
        output_path = str(Path(args.input).with_suffix('.detections.json.gz'))

    # Determine render output path
    render_output = None
    if args.render:
        render_basename = Path(output_path).stem.replace('.detections.json', '').replace('.detections', '')
        render_output = str(Path(output_path).parent / f"{render_basename}.rendered.mp4")

    # Process video
    try:
        process_video(
            input_path=args.input,
            output_path=output_path,
            model_path=args.model,
            tracker=args.tracker,
            conf_threshold=args.conf,
            iou_threshold=args.iou,
            enable_reid=not args.no_reid,
            enable_colors=not args.no_colors,
            device=args.device,
            render_output=render_output
        )
        print("\nDone!")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
