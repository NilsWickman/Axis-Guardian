#!/usr/bin/env python3
"""
Pre-render Detection Videos
============================

This script processes source videos to pre-compute YOLO detections and render
them directly onto the video frames. This eliminates real-time detection overhead
and enables high FPS streaming.

Features:
- Runs YOLO detection once on source videos
- Saves timestamped detection metadata (normalized bounding boxes)
- Renders videos with baked-in detection boxes and labels
- Optimizes output for low-latency streaming
- Supports batch processing of multiple videos

Usage:
    python prerender_detections.py --input video.mp4 --output rendered.mp4
    python prerender_detections.py --batch-all  # Process all source videos
    python prerender_detections.py --list       # Show available videos

Output:
    - {output_name}.mp4          - Pre-rendered video with detections
    - {output_name}.detections.json - Timestamped detection metadata

Author: Axis-Guardian Team
"""

import argparse
import json
import gzip
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict
import cv2
import numpy as np
from loguru import logger

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "webrtc-detection" / "src"))

try:
    from ultralytics import YOLO
    import torch
except ImportError:
    logger.error("Required packages not found. Install with: pip install ultralytics torch opencv-python")
    sys.exit(1)

# Temporarily disable weights_only for YOLOv8 model loading
# This is safe as we're loading models from trusted Ultralytics source
# TODO: Update ultralytics package when they add PyTorch 2.6+ support
_original_torch_load = torch.load

def _patched_torch_load(*args, **kwargs):
    """Patched torch.load that allows YOLOv8 models."""
    kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_torch_load


# Configuration
DEFAULT_MODEL = "yolov8n.pt"
DEFAULT_CONFIDENCE = 0.5
DEFAULT_IOU = 0.45
DEFAULT_INFERENCE_SIZE = 640

# Video paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
SOURCE_VIDEOS_DIR = PROJECT_ROOT / "shared" / "cameras"
RENDERED_VIDEOS_DIR = PROJECT_ROOT / "shared" / "cameras" / "rendered"
MODELS_DIR = PROJECT_ROOT / "shared" / "models"

# Class colors (BGR format for OpenCV)
CLASS_COLORS = {
    'person': (34, 197, 34),      # Green
    'car': (246, 130, 59),        # Blue
    'truck': (68, 68, 239),       # Red
    'bus': (214, 182, 6),         # Cyan
    'motorbike': (247, 85, 168),  # Purple
    'bicycle': (8, 179, 234),     # Yellow
}
DEFAULT_COLOR = (180, 163, 148)   # Gray


class DetectionRenderer:
    """Handles pre-rendering of detection videos."""

    # COCO class IDs for filtering (only detect these classes)
    # Set to None to detect all 80 COCO classes
    ALLOWED_CLASSES = {
        0: "person",
        2: "car",
    }

    def __init__(
        self,
        model_path: str = None,
        confidence: float = DEFAULT_CONFIDENCE,
        iou: float = DEFAULT_IOU,
        inference_size: int = DEFAULT_INFERENCE_SIZE,
    ):
        """
        Initialize detection renderer.

        Args:
            model_path: Path to YOLO model weights
            confidence: Detection confidence threshold
            iou: NMS IOU threshold
            inference_size: Size for YOLO inference (width in pixels)
        """
        if model_path is None:
            model_path = str(MODELS_DIR / DEFAULT_MODEL)

        logger.info(f"Loading YOLO model: {model_path}")
        self.model = YOLO(model_path)
        self.confidence = confidence
        self.iou = iou
        self.inference_size = inference_size

        logger.info(f"Model loaded successfully")
        logger.info(f"Confidence threshold: {confidence}")
        logger.info(f"IOU threshold: {iou}")
        logger.info(f"Inference size: {inference_size}px")

        if self.ALLOWED_CLASSES:
            logger.info(f"Filtering detections to classes: {list(self.ALLOWED_CLASSES.values())}")
        else:
            logger.info("Detecting all 80 COCO classes")

    def detect_frame(
        self,
        frame: np.ndarray,
        frame_timestamp: float,
        frame_number: int,
    ) -> List[Dict[str, Any]]:
        """
        Run YOLO detection on a single frame.

        Args:
            frame: Input frame (BGR)
            frame_timestamp: Frame timestamp in seconds
            frame_number: Frame index

        Returns:
            List of detection dictionaries with normalized bounding boxes
        """
        original_height, original_width = frame.shape[:2]

        # Downscale for faster inference
        inference_frame = frame
        scale_factor = 1.0

        if original_width > self.inference_size:
            scale_factor = self.inference_size / original_width
            new_width = self.inference_size
            new_height = int(original_height * scale_factor)
            inference_frame = cv2.resize(
                frame,
                (new_width, new_height),
                interpolation=cv2.INTER_LINEAR
            )

        # Run YOLO inference
        results = self.model.predict(
            inference_frame,
            conf=self.confidence,
            iou=self.iou,
            verbose=False,
            half=True,  # FP16 for faster inference
            device='cuda' if torch.cuda.is_available() else 'cpu',
        )

        detections = []

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                # Filter by class if ALLOWED_CLASSES is set
                class_id = int(box.cls[0])
                if self.ALLOWED_CLASSES is not None and class_id not in self.ALLOWED_CLASSES:
                    continue  # Skip this detection

                # Get box coordinates from inference frame
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Scale back to original frame size
                if scale_factor != 1.0:
                    x1 = x1 / scale_factor
                    y1 = y1 / scale_factor
                    x2 = x2 / scale_factor
                    y2 = y2 / scale_factor

                # Convert to normalized coordinates (0-1 range)
                left = float(x1 / original_width)
                top = float(y1 / original_height)
                right = float(x2 / original_width)
                bottom = float(y2 / original_height)

                confidence = float(box.conf[0])
                class_name = result.names[class_id]

                detection = {
                    "bbox": {
                        # Normalized coordinates (0-1 range) - VAPIX compliant
                        "left": left,
                        "top": top,
                        "right": right,
                        "bottom": bottom,
                    },
                    "confidence": confidence,
                    "class_id": class_id,
                    "class_name": class_name,
                }
                detections.append(detection)

                # Store pixel coordinates internally for drawing (not in JSON)
                detection['_pixel_coords'] = {
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                }

        return detections

    def draw_detections(
        self,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
    ) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame.

        Args:
            frame: Input frame (BGR)
            detections: List of detections

        Returns:
            Annotated frame
        """
        annotated = frame.copy()
        frame_height, frame_width = frame.shape[:2]

        for det in detections:
            bbox = det['bbox']
            class_name = det['class_name']
            confidence = det['confidence']

            # Get pixel coordinates from stored values or convert from normalized
            if '_pixel_coords' in det:
                pixel = det['_pixel_coords']
                x1 = int(pixel['x1'])
                y1 = int(pixel['y1'])
                x2 = int(pixel['x2'])
                y2 = int(pixel['y2'])
            else:
                # Convert normalized to pixel coordinates
                x1 = int(bbox['left'] * frame_width)
                y1 = int(bbox['top'] * frame_height)
                x2 = int(bbox['right'] * frame_width)
                y2 = int(bbox['bottom'] * frame_height)

            # Get color for this class
            color = CLASS_COLORS.get(class_name, DEFAULT_COLOR)

            # Draw bounding box (3px thick)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)

            # Prepare label
            label = f"{class_name} {int(confidence * 100)}%"

            # Calculate text size
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(
                label, font, font_scale, thickness
            )

            # Draw label background
            cv2.rectangle(
                annotated,
                (x1, y1 - text_height - 10),
                (x1 + text_width + 10, y1),
                color,
                -1  # Filled
            )

            # Draw label text
            cv2.putText(
                annotated,
                label,
                (x1 + 5, y1 - 5),
                font,
                font_scale,
                (0, 0, 0),  # Black text
                thickness,
                cv2.LINE_AA
            )

        return annotated

    def _save_enhanced_metadata(
        self,
        output_path: Path,
        input_path: Path,
        all_detections: List[Dict[str, Any]],
        video_info: Dict[str, Any],
        total_detection_count: int,
        processing_time: float,
        camera_id: Optional[str] = None,
    ) -> None:
        """
        Save detection metadata with all enhancements:
        - Sparse frame storage (only frames with detections)
        - Frame-level statistics
        - Temporal indexing
        - VAPIX metadata
        - Multiple output formats (JSON, JSON.gz, MessagePack)
        """
        # Try to get camera metadata from registry
        camera_model = "Unknown"
        camera_serial = "Unknown"
        if camera_id:
            try:
                sys.path.insert(0, str(Path(__file__).parent.parent / "config"))
                from camera_registry import get_camera_registry
                registry = get_camera_registry()
                camera = registry.get_camera(camera_id)
                if camera:
                    camera_model = camera.vapix.model
                    camera_serial = camera.vapix.serial_number
            except Exception as e:
                logger.debug(f"Could not load camera registry: {e}")

        # Implement sparse frame storage (only frames with detections)
        frames_with_detections = [
            frame for frame in all_detections
            if len(frame['detections']) > 0
        ]

        # Build temporal index
        frames_by_second = defaultdict(list)
        frames_with_class = defaultdict(list)
        high_confidence_frames = []
        all_classes = set()

        # Add frame-level statistics
        for frame in frames_with_detections:
            frame_num = frame['frame_number']
            detections = frame['detections']

            # Calculate second bucket
            second = int(frame['timestamp'])
            frames_by_second[second].append(frame_num)

            # Extract classes in this frame
            frame_classes = set()
            confidences = []

            for det in detections:
                class_name = det['class_name']
                confidence = det['confidence']

                frame_classes.add(class_name)
                all_classes.add(class_name)
                confidences.append(confidence)

                # Index by class
                frames_with_class[class_name].append(frame_num)

            # Add frame stats
            frame['stats'] = {
                "detection_count": len(detections),
                "classes": list(frame_classes),
                "avg_confidence": sum(confidences) / len(confidences) if confidences else 0,
                "max_confidence": max(confidences) if confidences else 0,
                "has_high_confidence": any(c > 0.9 for c in confidences),
            }

            # Track high confidence frames
            if frame['stats']['has_high_confidence']:
                high_confidence_frames.append(frame_num)

        # Build complete metadata structure
        metadata = {
            "format_version": "2.0",  # Version for backwards compatibility checking
            "video_info": video_info,
            "detection_config": {
                "model": "yolov8n",
                "confidence_threshold": self.confidence,
                "iou_threshold": self.iou,
                "inference_size": self.inference_size,
            },
            "vapix_metadata": {
                "camera_id": camera_id or "unknown",
                "camera_model": camera_model,
                "camera_serial": camera_serial,
                "analytics_module": "AXIS Object Analytics",
                "analytics_version": "1.0.0",
                "scenario": "object_detection",
            },
            "statistics": {
                "total_detections": total_detection_count,
                "total_frames": video_info['total_frames'],
                "total_frames_with_detections": len(frames_with_detections),
                "detection_density": len(frames_with_detections) / video_info['total_frames'],
                "unique_classes": list(all_classes),
                "class_distribution": {
                    cls: len(frames) for cls, frames in frames_with_class.items()
                },
                "processing_time_seconds": processing_time,
                "average_fps": video_info['total_frames'] / processing_time,
            },
            "index": {
                "frames_by_second": {str(k): v for k, v in sorted(frames_by_second.items())},
                "frames_with_class": {k: v for k, v in frames_with_class.items()},
                "high_confidence_frames": high_confidence_frames,
            },
            "frames": frames_with_detections,  # Sparse storage
        }

        # Save in multiple formats
        base_path = output_path.with_suffix('')

        # 1. JSON (human-readable)
        json_path = base_path.with_suffix('.detections.json')
        with open(json_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        json_size = json_path.stat().st_size

        # 2. JSON + gzip (compressed for production)
        gz_path = base_path.with_suffix('.detections.json.gz')
        with gzip.open(gz_path, 'wt', encoding='utf-8') as f:
            json.dump(metadata, f)
        gz_size = gz_path.stat().st_size

        logger.info(f"✓ Detection metadata saved in 2 formats:")
        logger.info(f"  JSON:    {json_path.name} ({json_size:,} bytes)")
        logger.info(f"  JSON.gz: {gz_path.name} ({gz_size:,} bytes, {100*gz_size/json_size:.1f}% of JSON)")
        logger.info(f"  Compression: {100 - 100*gz_size/json_size:.1f}% smaller")
        logger.info(f"  Sparse storage: {len(frames_with_detections)}/{video_info['total_frames']} frames ({100*len(frames_with_detections)/video_info['total_frames']:.1f}%)")

    def process_video(
        self,
        input_path: Path,
        output_path: Path,
        progress_callback=None,
        output_resolution: Optional[str] = None,
    ) -> Tuple[int, int]:
        """
        Process video: detect objects and render with bounding boxes.

        Args:
            input_path: Path to source video
            output_path: Path to save rendered video
            progress_callback: Optional callback(frame_num, total_frames)
            output_resolution: Optional resolution preset ('720p', '1080p', '480p')

        Returns:
            Tuple of (total_frames, total_detections)
        """
        logger.info(f"Processing video: {input_path}")

        # Open input video
        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise ValueError(f"Failed to open video: {input_path}")

        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        source_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        source_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Calculate output resolution
        width, height = source_width, source_height
        scale_factor = 1.0

        if output_resolution:
            resolution_presets = {
                '480p': (854, 480),
                '720p': (1280, 720),
                '1080p': (1920, 1080),
            }

            if output_resolution in resolution_presets:
                target_width, target_height = resolution_presets[output_resolution]
                # Maintain aspect ratio
                aspect_ratio = source_width / source_height
                target_aspect = target_width / target_height

                if abs(aspect_ratio - target_aspect) < 0.01:
                    # Aspect ratios match, use preset directly
                    width, height = target_width, target_height
                else:
                    # Scale to fit height, maintain aspect ratio
                    height = target_height
                    width = int(height * aspect_ratio)

                scale_factor = width / source_width
                logger.info(f"Output resolution: {width}x{height} (scaled {scale_factor:.2f}x from source)")
            else:
                logger.warning(f"Unknown resolution preset: {output_resolution}, using source resolution")

        logger.info(f"Source properties: {source_width}x{source_height} @ {fps:.2f} FPS ({total_frames} frames)")
        if scale_factor != 1.0:
            logger.info(f"Output properties: {width}x{height} @ {fps:.2f} FPS (optimized for {output_resolution} streaming)")

        # Create output directory
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Setup video writer - use XVID for compatibility, then convert to H.264 with FFmpeg
        # OpenCV often has issues with H.264 directly, so we use a two-step process
        temp_output_path = output_path.with_suffix('.temp.mp4')

        logger.info(f"Using two-step encoding: XVID → H.264 conversion")
        logger.info(f"  Step 1: Render with detections using XVID codec")
        logger.info(f"  Step 2: Convert to H.264 with FFmpeg for optimal streaming")

        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(
            str(temp_output_path),
            fourcc,
            fps,
            (width, height)
        )

        if not out.isOpened():
            raise ValueError(
                f"Failed to create temporary output video: {temp_output_path}\n"
                f"OpenCV VideoWriter initialization failed."
            )

        # Process frames
        all_detections = []
        frame_number = 0
        total_detection_count = 0
        start_time = time.time()

        logger.info("Starting detection and rendering...")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Calculate frame timestamp
            frame_timestamp = frame_number / fps

            # Run detection on original resolution
            detections = self.detect_frame(frame, frame_timestamp, frame_number)
            total_detection_count += len(detections)

            # Store detections with frame info (remove internal pixel coords from JSON)
            detections_for_json = []
            for det in detections:
                det_copy = det.copy()
                # Remove internal pixel coordinates before saving to JSON
                det_copy.pop('_pixel_coords', None)
                detections_for_json.append(det_copy)

            all_detections.append({
                "frame_number": frame_number,
                "timestamp": frame_timestamp,
                "detections": detections_for_json,
            })

            # Draw detections on frame at original resolution
            if detections:
                frame = self.draw_detections(frame, detections)

            # Scale frame to output resolution if needed
            if scale_factor != 1.0:
                frame = cv2.resize(
                    frame,
                    (width, height),
                    interpolation=cv2.INTER_LINEAR if scale_factor < 1.0 else cv2.INTER_CUBIC
                )

            # Write frame
            out.write(frame)

            # Progress callback
            if progress_callback:
                progress_callback(frame_number, total_frames)
            elif frame_number % 100 == 0:
                elapsed = time.time() - start_time
                fps_processing = frame_number / elapsed if elapsed > 0 else 0
                logger.info(
                    f"Progress: {frame_number}/{total_frames} frames "
                    f"({frame_number/total_frames*100:.1f}%) - "
                    f"{fps_processing:.1f} FPS"
                )

            frame_number += 1

        # Cleanup
        cap.release()
        out.release()

        processing_time = time.time() - start_time
        logger.info(f"✓ Video rendering complete!")
        logger.info(f"  Processed: {frame_number} frames in {processing_time:.1f}s")
        logger.info(f"  Average FPS: {frame_number/processing_time:.1f}")
        logger.info(f"  Total detections: {total_detection_count}")

        # Step 2: Convert to H.264 with FFmpeg
        logger.info(f"Converting to H.264 with FFmpeg...")
        import subprocess

        ffmpeg_cmd = [
            'ffmpeg',
            '-i', str(temp_output_path),
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-profile:v', 'baseline',
            '-level', '3.1',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-y',  # Overwrite output file
            str(output_path)
        ]

        try:
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"✓ H.264 conversion complete!")
            logger.info(f"  Final output: {output_path}")

            # Remove temporary file
            temp_output_path.unlink()
            logger.debug(f"Removed temporary file: {temp_output_path}")

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg conversion failed: {e}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise ValueError(
                f"Failed to convert video to H.264.\n"
                f"Temporary XVID file saved at: {temp_output_path}\n"
                f"You can manually convert with:\n"
                f"  ffmpeg -i {temp_output_path} -c:v libx264 -preset medium -crf 23 {output_path}"
            )

        # Save detection metadata with all improvements
        self._save_enhanced_metadata(
            output_path=output_path,
            input_path=input_path,
            all_detections=all_detections,
            video_info={
                "source_file": str(input_path.name),
                "output_file": str(output_path.name),
                "width": width,
                "height": height,
                "fps": fps,
                "total_frames": frame_number,
                "duration_seconds": frame_number / fps,
            },
            total_detection_count=total_detection_count,
            processing_time=processing_time,
        )

        return frame_number, total_detection_count


def list_source_videos():
    """List available source videos for processing."""
    if not SOURCE_VIDEOS_DIR.exists():
        logger.warning(f"Source videos directory not found: {SOURCE_VIDEOS_DIR}")
        return []

    videos = list(SOURCE_VIDEOS_DIR.glob("*.mp4"))
    # Exclude already rendered videos and any videos in subdirectories
    videos = [v for v in videos if v.parent == SOURCE_VIDEOS_DIR and "rendered" not in v.stem]
    return sorted(videos)


def check_if_needs_rerendering(video_path: Path) -> bool:
    """
    Check if a video needs to be re-rendered.

    A video needs re-rendering if:
    - No rendered version exists
    - Rendered version is older than source
    - Detection JSON is missing

    Args:
        video_path: Path to source video

    Returns:
        True if video should be (re)rendered
    """
    output_name = video_path.stem + "-rendered.mp4"
    output_path = RENDERED_VIDEOS_DIR / output_name
    json_path = output_path.with_suffix('.detections.json')

    # Check if rendered files exist
    if not output_path.exists() or not json_path.exists():
        return True

    # Check if source is newer than rendered
    source_mtime = video_path.stat().st_mtime
    rendered_mtime = output_path.stat().st_mtime

    if source_mtime > rendered_mtime:
        logger.info(f"Source video {video_path.name} is newer than rendered version")
        return True

    return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Pre-render detection videos for high-performance streaming",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process a single video
  python prerender_detections.py --input people-detection.mp4 --output people-rendered.mp4

  # Process all source videos
  python prerender_detections.py --batch-all

  # List available videos
  python prerender_detections.py --list

  # Use custom model and thresholds
  python prerender_detections.py --input video.mp4 --model yolov8m.pt --confidence 0.6
        """
    )

    parser.add_argument(
        "--input", "-i",
        type=str,
        help="Input video file (in shared/cameras/ or full path)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output video file (saved to shared/cameras/rendered/)"
    )
    parser.add_argument(
        "--batch-all",
        action="store_true",
        help="Process all videos in shared/cameras/"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available source videos"
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=None,
        help=f"YOLO model path (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--confidence", "-c",
        type=float,
        default=DEFAULT_CONFIDENCE,
        help=f"Detection confidence threshold (default: {DEFAULT_CONFIDENCE})"
    )
    parser.add_argument(
        "--iou",
        type=float,
        default=DEFAULT_IOU,
        help=f"NMS IOU threshold (default: {DEFAULT_IOU})"
    )
    parser.add_argument(
        "--inference-size",
        type=int,
        default=DEFAULT_INFERENCE_SIZE,
        help=f"Inference resolution width (default: {DEFAULT_INFERENCE_SIZE})"
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force re-rendering even if output files already exist"
    )
    parser.add_argument(
        "--resolution", "-r",
        type=str,
        choices=['480p', '720p', '1080p'],
        default=os.getenv('RENDER_RESOLUTION'),
        help="Output resolution preset (default: from RENDER_RESOLUTION env var or source resolution). 720p recommended for balance of quality and performance."
    )

    args = parser.parse_args()

    # Show resolution being used
    if args.resolution:
        logger.info(f"Using resolution preset: {args.resolution}")
        if os.getenv('RENDER_RESOLUTION') and not any('--resolution' in arg or '-r' in arg for arg in sys.argv):
            logger.info(f"  (from RENDER_RESOLUTION environment variable)")
    else:
        logger.info("Using source video resolution (no preset specified)")

    # List videos
    if args.list:
        logger.info("Available source videos:")
        videos = list_source_videos()
        if not videos:
            logger.warning("No videos found in shared/cameras/")
        for video in videos:
            logger.info(f"  - {video.name}")
        return

    # Create renderer
    renderer = DetectionRenderer(
        model_path=args.model,
        confidence=args.confidence,
        iou=args.iou,
        inference_size=args.inference_size,
    )

    # Batch processing
    if args.batch_all:
        videos = list_source_videos()
        if not videos:
            logger.error("No videos found to process")
            logger.info(f"Looking in: {SOURCE_VIDEOS_DIR}")
            logger.info("Please add .mp4 files to shared/cameras/ directory")
            return

        logger.info(f"Found {len(videos)} source videos in {SOURCE_VIDEOS_DIR}")

        # Check which videos need processing
        videos_to_process = []
        videos_skipped = []

        for video in videos:
            if args.force or check_if_needs_rerendering(video):
                videos_to_process.append(video)
            else:
                videos_skipped.append(video)

        if videos_skipped:
            logger.info(f"\nSkipping {len(videos_skipped)} videos (already rendered):")
            for video in videos_skipped:
                logger.info(f"  ✓ {video.name}")
            logger.info("\nUse --force to re-render all videos")

        if not videos_to_process:
            logger.info("\n✓ All videos are already pre-rendered!")
            logger.info(f"Rendered videos: {RENDERED_VIDEOS_DIR}")
            return

        logger.info(f"\nProcessing {len(videos_to_process)} videos...")

        processed = 0
        failed = 0

        for i, video in enumerate(videos_to_process, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing video {i}/{len(videos_to_process)}: {video.name}")
            logger.info(f"{'='*60}")

            output_name = video.stem + "-rendered.mp4"
            output_path = RENDERED_VIDEOS_DIR / output_name

            try:
                renderer.process_video(video, output_path, output_resolution=args.resolution)
                processed += 1
            except Exception as e:
                logger.error(f"Failed to process {video.name}: {e}")
                import traceback
                traceback.print_exc()
                failed += 1
                continue

        logger.info(f"\n{'='*60}")
        logger.info("✓ Batch processing complete!")
        logger.info(f"{'='*60}")
        logger.info(f"  Processed: {processed}")
        logger.info(f"  Skipped: {len(videos_skipped)}")
        logger.info(f"  Failed: {failed}")
        logger.info(f"  Output: {RENDERED_VIDEOS_DIR}")
        return

    # Single video processing
    if not args.input:
        parser.print_help()
        logger.error("\nError: --input required (or use --batch-all)")
        return

    # Resolve input path
    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = SOURCE_VIDEOS_DIR / input_path

    if not input_path.exists():
        logger.error(f"Input video not found: {input_path}")
        return

    # Resolve output path
    if args.output:
        output_path = Path(args.output)
        if not output_path.is_absolute():
            output_path = RENDERED_VIDEOS_DIR / output_path
    else:
        output_name = input_path.stem + "-rendered.mp4"
        output_path = RENDERED_VIDEOS_DIR / output_name

    # Process video
    try:
        renderer.process_video(input_path, output_path, output_resolution=args.resolution)
        logger.info("\n✓ Success! Video ready for streaming.")
        if args.resolution:
            logger.info(f"Rendered at {args.resolution} for optimized performance")
    except Exception as e:
        logger.error(f"Failed to process video: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
