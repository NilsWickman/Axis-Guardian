#!/usr/bin/env python3
"""CLI tool to generate site map from camera configuration."""

import asyncio
import json
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.depth_estimator import get_depth_estimator
from src.occupancy_mapper import create_grid_from_cameras, crop_grid_to_occupied_bounds
from src.wall_detector import WallDetector
from src.semantic_wall_detector import SemanticWallDetector
from src.coverage_analyzer import CoverageAnalyzer
from src.wall_merger import WallMerger
from src.fog_of_war import FogOfWarProcessor
from src.coordinate_transform import from_camera_dict
from src.config import settings
from src.main import _capture_camera_image, _create_site_map_data

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def find_camera_video(camera_id: str) -> Optional[Path]:
    """
    Find the video file for a camera.

    Args:
        camera_id: Camera ID (e.g., 'camera1')

    Returns:
        Path to video file, or None if not found
    """
    # Map camera IDs to video files
    camera_to_video = {
        'camera1': 'view-HC3.mp4',
        'camera2': 'view-HC4.mp4',
        'camera3': 'view-IP2.mp4',
        'camera4': 'view-IP5.mp4',
    }

    video_name = camera_to_video.get(camera_id)
    if not video_name:
        return None

    # Check in shared/cameras directory
    project_root = Path(__file__).parent.parent.parent
    video_path = project_root / "shared" / "cameras" / video_name

    if video_path.exists():
        return video_path

    # Also check Auditorium subdirectory
    video_path_alt = project_root / "shared" / "cameras" / "Auditorium" / video_name
    if video_path_alt.exists():
        return video_path_alt

    return None


def find_frame_with_min_detections(video_path: Path, sample_interval: int = 30) -> Optional[np.ndarray]:
    """
    Find a frame with minimal detections (clean room view).

    Strategy: Sample frames, look for frames with least motion/change,
    which typically have fewer people/objects.

    Args:
        video_path: Path to video file
        sample_interval: Sample every Nth frame

    Returns:
        Frame as numpy array (RGB), or None if failed
    """
    logger.info(f"  Analyzing video to find clean frame: {video_path.name}")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        logger.error(f"  Failed to open video: {video_path}")
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    logger.info(f"  Video: {total_frames} frames @ {fps:.1f} FPS")

    # Sample frames and compute motion score
    frame_scores = []
    prev_gray = None

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_interval == 0:
            # Convert to grayscale for motion detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            if prev_gray is not None:
                # Compute motion as absolute difference
                diff = cv2.absdiff(gray, prev_gray)
                motion_score = np.mean(diff)

                frame_scores.append({
                    'frame_idx': frame_idx,
                    'motion_score': motion_score,
                    'frame': frame.copy()
                })

            prev_gray = gray

        frame_idx += 1

    cap.release()

    if not frame_scores:
        logger.warning("  No frames analyzed, using middle frame")
        # Fallback: get middle frame
        cap = cv2.VideoCapture(str(video_path))
        cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
        ret, frame = cap.read()
        cap.release()

        if ret:
            return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return None

    # Sort by motion score (lowest = least activity)
    frame_scores.sort(key=lambda x: x['motion_score'])

    # Get frame with lowest motion (cleanest room view)
    best_frame = frame_scores[0]
    logger.info(f"  Selected frame {best_frame['frame_idx']} (motion score: {best_frame['motion_score']:.2f})")
    logger.info(f"  This frame likely has minimal detections/activity")

    # Convert BGR to RGB
    return cv2.cvtColor(best_frame['frame'], cv2.COLOR_BGR2RGB)


def extract_clean_frame_from_video(camera_id: str) -> Optional[np.ndarray]:
    """
    Extract a clean frame from camera's video file.

    Args:
        camera_id: Camera ID

    Returns:
        Frame as numpy array (RGB), or None if failed
    """
    video_path = find_camera_video(camera_id)

    if video_path is None:
        logger.warning(f"  No video file found for {camera_id}")
        return None

    logger.info(f"  Using video: {video_path}")

    return find_frame_with_min_detections(video_path)


async def generate_from_mock_cameras(output_path: Path = None, force: bool = False):
    """
    Generate site map from mock camera data.

    Args:
        output_path: Path to save generated site map (default: sitemap-setup.json)
        force: If True, regenerate even if file exists. If False, skip if exists.

    Returns:
        Site map data dictionary
    """
    # Determine output path
    if output_path is None:
        output_path = settings.output_dir / "sitemap-setup.json"

    # Check if file already exists (unless force=True)
    if output_path.exists() and not force:
        logger.info(f"Site map already exists: {output_path}")
        logger.info("Skipping generation (use --force to regenerate)")

        # Load and return existing site map
        try:
            with open(output_path, 'r') as f:
                existing_data = json.load(f)
            logger.info(f"✓ Using existing site map")
            logger.info(f"  - {len(existing_data.get('walls', []))} walls")
            logger.info(f"  - {len(existing_data.get('fog_of_war_regions', []))} fog of war regions")
            logger.info(f"  - Generated: {existing_data.get('generated_at', 'unknown')}")
            return existing_data
        except Exception as e:
            logger.warning(f"Failed to load existing site map: {e}")
            logger.info("Proceeding with regeneration...")

    # Load mock camera data from frontend
    mock_cameras_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "mocks" / "data.ts"

    logger.info("Loading mock camera data...")

    # Define mock cameras (matching frontend/src/mocks/data.ts)
    cameras_data = [
        {
            "id": "camera1",
            "name": "Auditorium - High Corner View 3",
            "position": {
                "x": 16.22,
                "y": 0.3,
                "z": 1.68,
                "azimuth": 18,
                "elevation": 1
            },
            "capabilities": {
                "resolution": "1920x1080",
                "fps": 30
            },
            "ipAddress": "192.168.1.101",
            "rtspUrl": "rtsp://localhost:8554/camera1"
        },
        {
            "id": "camera2",
            "name": "Auditorium - High Corner View 4",
            "position": {
                "x": 0.9,
                "y": 0.5,
                "z": 1.67,
                "azimuth": 313,
                "elevation": -5
            },
            "capabilities": {
                "resolution": "1920x1080",
                "fps": 30
            },
            "ipAddress": "192.168.1.102",
            "rtspUrl": "rtsp://localhost:8554/camera2"
        },
        {
            "id": "camera3",
            "name": "Auditorium - IP Camera View 2",
            "position": {
                "x": 20.6,
                "y": 28.31,
                "z": 2.62,
                "azimuth": 140,
                "elevation": -9
            },
            "capabilities": {
                "resolution": "1920x1080",
                "fps": 30
            },
            "ipAddress": "192.168.1.103",
            "rtspUrl": "rtsp://localhost:8554/camera3"
        },
        {
            "id": "camera4",
            "name": "Auditorium - IP Camera View 5",
            "position": {
                "x": 10.57,
                "y": 16.31,
                "z": 1.84,
                "azimuth": 339,
                "elevation": 0
            },
            "capabilities": {
                "resolution": "1920x1080",
                "fps": 30
            },
            "ipAddress": "192.168.1.104",
            "rtspUrl": "rtsp://localhost:8554/camera4"
        }
    ]

    camera_ids = [cam["id"] for cam in cameras_data]

    logger.info(f"Generating site map from {len(camera_ids)} cameras...")

    try:
        # Create occupancy grid with calibrated margins
        logger.info("Creating occupancy grid with calibrated margins...")
        grid = create_grid_from_cameras(cameras_data, use_calibrated_margin=True)

        # Get depth estimator
        logger.info("Loading depth estimation model (this may take a few minutes on first run)...")
        estimator = get_depth_estimator()

        # Store images, depth maps, transformers, and explored masks for later processing
        camera_images = []
        camera_depth_maps = []
        camera_transformers = []
        camera_explored_masks = []

        # Process each camera
        for idx, (camera_id, camera_data) in enumerate(zip(camera_ids, cameras_data)):
            logger.info(f"Processing camera {camera_id} ({idx + 1}/{len(camera_ids)})...")

            try:
                image = None

                # Priority 1: Extract clean frame from video (best for setup)
                logger.info(f"  Extracting clean frame from video...")
                frame_array = extract_clean_frame_from_video(camera_id)

                if frame_array is not None:
                    from PIL import Image
                    image = Image.fromarray(frame_array)
                    logger.info(f"  ✓ Using clean frame from video")
                else:
                    logger.warning(f"  Video extraction failed, trying live capture...")

                    # Priority 2: Try live camera capture
                    try:
                        logger.info(f"  Attempting RTSP capture: {camera_data['rtspUrl']}")
                        image = await _capture_camera_image(camera_id, camera_data, "rtsp")
                    except Exception as e:
                        logger.warning(f"  RTSP capture failed: {e}")

                    # Priority 3: Try VAPIX if RTSP failed
                    if image is None:
                        try:
                            logger.info(f"  Attempting VAPIX capture from {camera_data['ipAddress']}")
                            image = await _capture_camera_image(camera_id, camera_data, "vapix")
                        except Exception as e:
                            logger.warning(f"  VAPIX capture failed: {e}")

                # Priority 4: Fallback to synthetic data
                if image is None:
                    logger.warning(f"  All capture methods failed, using synthetic occupancy data")
                    # Create synthetic occupancy based on camera FOV
                    transformer = from_camera_dict(camera_data)
                    grid.mark_fov_as_explored(transformer, settings.max_view_distance_m)
                    continue

                # Extract camera parameters for calibration
                camera_height_m = camera_data.get("position", {}).get("z", 1.8)
                camera_elevation_deg = camera_data.get("position", {}).get("elevation", 0)

                # Estimate depth with metric calibration
                logger.info(f"  Estimating depth with ground plane calibration...")
                logger.info(f"    Camera height: {camera_height_m:.2f}m, Elevation: {camera_elevation_deg:.1f}°")
                depth_map = estimator.estimate_depth(
                    image,
                    camera_height_m=camera_height_m,
                    camera_elevation_deg=camera_elevation_deg
                )

                # Create coordinate transformer
                transformer = from_camera_dict(camera_data)

                # Store for semantic wall detection
                camera_images.append(image)
                camera_depth_maps.append(depth_map)
                camera_transformers.append(transformer)

                # Update occupancy grid and get per-camera explored mask
                logger.info(f"  Updating occupancy grid...")
                camera_mask = grid.update_from_depth_map(depth_map, transformer, sample_rate=10)

                # Store camera mask for coverage analysis
                camera_explored_masks.append(camera_mask)
                logger.info(f"    Camera {idx+1} mask: {camera_mask.sum():,} explored cells ({100*camera_mask.sum()/camera_mask.size:.1f}%)")

                # Mark FOV as explored
                grid.mark_fov_as_explored(transformer, settings.max_view_distance_m)

            except Exception as e:
                logger.error(f"Failed to process camera {camera_id}: {e}")
                # Continue with other cameras

        # Crop grid to actual occupied bounds
        logger.info("Cropping grid to occupied bounds...")
        grid_before_crop = grid
        grid = crop_grid_to_occupied_bounds(grid, padding_m=2.0)

        # Crop camera masks to match new grid (use same cropping logic)
        # The crop function extracts a sub-region, so we need to apply the same crop to masks
        if camera_explored_masks:
            # Find the crop region
            occupied_mask = grid_before_crop.explored | (grid_before_crop.occupancy > 0.1)
            rows, cols = np.where(occupied_mask)
            if len(rows) > 0:
                min_row, max_row = rows.min(), rows.max()
                min_col, max_col = cols.min(), cols.max()

                # Add padding
                padding_cells = int(2.0 / grid_before_crop.resolution_m)
                min_row = max(0, min_row - padding_cells)
                max_row = min(grid_before_crop.height_cells - 1, max_row + padding_cells)
                min_col = max(0, min_col - padding_cells)
                max_col = min(grid_before_crop.width_cells - 1, max_col + padding_cells)

                # Crop each camera mask
                camera_explored_masks = [
                    mask[min_row:max_row+1, min_col:max_col+1]
                    for mask in camera_explored_masks
                ]
                logger.info(f"  Cropped {len(camera_explored_masks)} camera masks to match new grid")

        # Detect walls using semantic segmentation
        logger.info("Detecting walls using semantic segmentation...")
        semantic_detector = SemanticWallDetector(model_name="facebook/mask2former-swin-tiny-ade-semantic")

        semantic_walls = []
        for idx, (image, depth_map, transformer) in enumerate(zip(camera_images, camera_depth_maps, camera_transformers)):
            logger.info(f"  Processing semantic walls from camera {idx + 1}/{len(camera_images)}...")
            try:
                walls_from_camera = semantic_detector.detect_walls_from_image(image, depth_map, transformer)
                semantic_walls.extend(walls_from_camera)
            except Exception as e:
                logger.error(f"  Failed to detect semantic walls from camera {idx + 1}: {e}")

        logger.info(f"  Detected {len(semantic_walls)} wall segments from semantic segmentation")

        # Also try traditional edge-based wall detection (as backup)
        logger.info("Detecting walls using traditional edge detection (backup)...")
        wall_detector = WallDetector()
        edge_walls = wall_detector.detect_walls(grid)
        logger.info(f"  Detected {len(edge_walls)} wall segments from edge detection")

        # Detect internal walls from coverage gaps (Phase 3)
        logger.info("Detecting internal walls from coverage gaps...")
        coverage_analyzer = CoverageAnalyzer()

        # Calculate max distances for each camera (from calibrated depth)
        max_distances = []
        for camera_data in cameras_data:
            height = camera_data.get("position", {}).get("z", 1.8)
            elevation = camera_data.get("position", {}).get("elevation", 0)
            elevation_rad = np.radians(abs(elevation))

            if elevation_rad < np.radians(5):
                effective_angle = np.radians(30)
                viewing_dist = height / np.tan(effective_angle)
            else:
                viewing_dist = height / np.tan(elevation_rad)

            viewing_dist = np.clip(viewing_dist, height * 0.5, settings.max_view_distance_m)
            max_distances.append(viewing_dist)

        try:
            internal_walls = coverage_analyzer.detect_room_boundaries(
                grid,
                camera_transformers,
                max_distances,
                camera_explored_masks=camera_explored_masks  # Pass pre-computed masks
            )
            logger.info(f"  Detected {len(internal_walls)} internal wall segments")
        except Exception as e:
            logger.error(f"  Failed to detect internal walls: {e}")
            logger.exception(e)  # Log full traceback for debugging
            internal_walls = []

        # Combine all detection methods
        walls = semantic_walls + edge_walls + internal_walls
        logger.info(f"  Total walls detected (before merging): {len(walls)} ({len(semantic_walls)} semantic + {len(edge_walls)} edge + {len(internal_walls)} internal)")

        # Phase 4: Merge and clean wall segments
        logger.info("Merging and filtering wall segments...")

        # Auto-tune parameters based on space size
        space_area = grid.width_m * grid.height_m
        logger.info(f"  Space area: {space_area:.1f} m²")

        # Adaptive parameters based on space size
        if space_area > 1000:  # Very large space (> 1000m²)
            min_length = 2.0
            merge_distance = 1.0
            logger.info(f"  Very large space: using aggressive merging (min_length={min_length}m)")
        elif space_area > 500:  # Large space (500-1000m²)
            min_length = 1.5
            merge_distance = 0.7
            logger.info(f"  Large space: using moderate merging (min_length={min_length}m)")
        elif space_area > 200:  # Medium space (200-500m²)
            min_length = 1.0
            merge_distance = 0.5
            logger.info(f"  Medium space: using standard merging (min_length={min_length}m)")
        else:  # Small space (< 200m²)
            min_length = 0.5
            merge_distance = 0.3
            logger.info(f"  Small space: using fine-grained merging (min_length={min_length}m)")

        wall_merger = WallMerger(
            min_length_m=min_length,
            merge_distance_m=merge_distance,
            angle_tolerance_deg=10.0
        )

        # Get statistics before merging
        if walls:
            logger.info(f"  Sample wall lengths (first 10): {[f'{w.length:.3f}m' for w in walls[:10]]}")
            logger.info(f"  Wall length range: {min(w.length for w in walls):.3f}m to {max(w.length for w in walls):.3f}m")

        stats_before = wall_merger.analyze_wall_statistics(walls)
        logger.info(f"  Before merging: {stats_before['count']} walls, "
                   f"avg length: {stats_before['avg_length_m']:.2f}m, "
                   f"total length: {stats_before['total_length_m']:.2f}m")

        # Merge walls
        walls = wall_merger.merge_walls(walls)

        # Get statistics after merging
        stats_after = wall_merger.analyze_wall_statistics(walls)
        logger.info(f"  After merging: {stats_after['count']} walls, "
                   f"avg length: {stats_after['avg_length_m']:.2f}m, "
                   f"total length: {stats_after['total_length_m']:.2f}m")
        logger.info(f"  ✓ Reduced from {stats_before['count']} to {stats_after['count']} walls "
                   f"({100 * (stats_before['count'] - stats_after['count']) / stats_before['count']:.1f}% reduction)")

        # Process fog of war
        logger.info("Processing fog of war regions...")
        fog_processor = FogOfWarProcessor()
        fog_regions_poly = fog_processor.identify_fog_regions(grid)
        fog_regions = fog_processor.fill_fog_with_assumptions(fog_regions_poly, walls)
        logger.info(f"  Created {len(fog_regions)} fog of war regions")

        # Create assumed walls from fog regions
        assumed_walls = fog_processor.create_wall_segments_from_assumptions(fog_regions)
        logger.info(f"  Generated {len(assumed_walls)} assumed wall segments")

        # Combine detected and assumed walls
        all_walls = walls + assumed_walls

        # Generate site map data
        logger.info("Generating site map data...")
        generation_id = "setup"
        site_map_data = _create_site_map_data(
            generation_id,
            camera_ids,
            cameras_data,
            grid,
            all_walls,
            fog_regions
        )

        # Save to file
        settings.output_dir.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(site_map_data, f, indent=2)

        logger.info(f"✓ Site map saved to {output_path}")
        logger.info(f"  - {len(all_walls)} walls ({len(walls)} detected, {len(assumed_walls)} assumed)")
        logger.info(f"  - {len(fog_regions)} fog of war regions")
        logger.info(f"  - Dimensions: {site_map_data['width']}x{site_map_data['height']} px")

        return site_map_data

    except Exception as e:
        logger.error(f"Site map generation failed: {e}", exc_info=True)
        raise


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate site map from cameras")
    parser.add_argument(
        "--output",
        type=Path,
        help="Output path for site map JSON (default: shared/site-maps/generated/sitemap-setup.json)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force regeneration even if site map already exists"
    )

    args = parser.parse_args()

    # Run async generation
    try:
        asyncio.run(generate_from_mock_cameras(args.output, force=args.force))
        print("\n✓ Site map generation complete!")
        return 0
    except Exception as e:
        print(f"\n✗ Site map generation failed: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
