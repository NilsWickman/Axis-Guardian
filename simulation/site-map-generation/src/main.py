"""Site Map Generation Service - Main FastAPI application."""

import asyncio
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

import aiohttp
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from io import BytesIO

from .config import settings
from .depth_estimator import get_depth_estimator
from .occupancy_mapper import OccupancyGrid, create_grid_from_cameras
from .wall_detector import WallDetector
from .fog_of_war import FogOfWarProcessor
from .coordinate_transform import from_camera_dict

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Site Map Generation Service",
    description="Automatic site map generation from camera depth estimation",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class GenerationRequest(BaseModel):
    """Request to generate site map."""

    camera_ids: List[str] = Field(..., description="List of camera IDs to use")
    cameras_data: List[Dict[str, Any]] = Field(..., description="Camera data with position and capabilities")
    capture_method: str = Field(default="vapix", description="Method to capture images: 'vapix' or 'rtsp'")


class GenerationProgress(BaseModel):
    """Progress update for generation."""

    status: str  # 'pending', 'processing', 'completed', 'failed'
    current_camera: Optional[str] = None
    cameras_processed: int = 0
    total_cameras: int = 0
    message: str = ""


class GenerationResponse(BaseModel):
    """Response from site map generation."""

    generation_id: str
    status: str
    site_map_path: Optional[str] = None
    site_map_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# In-memory storage for generation jobs (in production, use Redis/DB)
generation_jobs: Dict[str, GenerationProgress] = {}


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Site Map Generation",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    estimator = get_depth_estimator()
    model_info = estimator.get_model_info()

    return {
        "status": "healthy",
        "depth_model": model_info,
        "settings": {
            "grid_resolution_cm": settings.grid_resolution_cm,
            "max_view_distance_m": settings.max_view_distance_m,
            "fog_of_war_enabled": settings.fog_of_war_enabled
        }
    }


@app.post("/api/generate", response_model=GenerationResponse)
async def generate_site_map(
    request: GenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate site map from camera depth estimation.

    Args:
        request: Generation request with camera IDs and data
        background_tasks: FastAPI background tasks

    Returns:
        Generation response with job ID
    """
    generation_id = str(uuid.uuid4())

    logger.info(f"Starting site map generation {generation_id} with {len(request.camera_ids)} cameras")

    # Initialize job tracking
    generation_jobs[generation_id] = GenerationProgress(
        status="pending",
        total_cameras=len(request.camera_ids),
        message="Initializing..."
    )

    # Start generation in background
    background_tasks.add_task(
        _run_generation,
        generation_id,
        request.camera_ids,
        request.cameras_data,
        request.capture_method
    )

    return GenerationResponse(
        generation_id=generation_id,
        status="pending"
    )


@app.get("/api/generate/{generation_id}", response_model=GenerationResponse)
async def get_generation_status(generation_id: str):
    """
    Get status of site map generation.

    Args:
        generation_id: Generation job ID

    Returns:
        Generation response with current status
    """
    if generation_id not in generation_jobs:
        raise HTTPException(status_code=404, detail="Generation job not found")

    progress = generation_jobs[generation_id]

    # Load site map data if completed
    site_map_data = None
    site_map_path = None

    if progress.status == "completed":
        site_map_path = str(settings.output_dir / f"sitemap-{generation_id}.json")
        try:
            import json
            with open(site_map_path, 'r') as f:
                site_map_data = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load site map data: {e}")

    return GenerationResponse(
        generation_id=generation_id,
        status=progress.status,
        site_map_path=site_map_path,
        site_map_data=site_map_data,
        error=progress.message if progress.status == "failed" else None
    )


async def _run_generation(
    generation_id: str,
    camera_ids: List[str],
    cameras_data: List[Dict[str, Any]],
    capture_method: str
):
    """
    Run site map generation (background task).

    Args:
        generation_id: Generation job ID
        camera_ids: List of camera IDs
        cameras_data: Camera data
        capture_method: Method to capture images
    """
    try:
        # Update status
        generation_jobs[generation_id].status = "processing"
        generation_jobs[generation_id].message = "Creating occupancy grid..."

        # Create occupancy grid
        grid = create_grid_from_cameras(cameras_data)

        # Get depth estimator
        estimator = get_depth_estimator()

        # Process each camera
        for idx, (camera_id, camera_data) in enumerate(zip(camera_ids, cameras_data)):
            generation_jobs[generation_id].current_camera = camera_id
            generation_jobs[generation_id].cameras_processed = idx
            generation_jobs[generation_id].message = f"Processing {camera_id}..."

            logger.info(f"Processing camera {camera_id} ({idx + 1}/{len(camera_ids)})")

            try:
                # Capture image from camera
                image = await _capture_camera_image(camera_id, camera_data, capture_method)

                # Extract camera parameters for calibration
                camera_height_m = camera_data.get("position", {}).get("z", 1.8)
                camera_elevation_deg = camera_data.get("position", {}).get("elevation", 0)

                # Estimate depth with metric calibration
                depth_map = estimator.estimate_depth(
                    image,
                    camera_height_m=camera_height_m,
                    camera_elevation_deg=camera_elevation_deg
                )

                # Create coordinate transformer
                transformer = from_camera_dict(camera_data)

                # Update occupancy grid
                grid.update_from_depth_map(depth_map, transformer, sample_rate=10)

                # Mark FOV as explored
                grid.mark_fov_as_explored(transformer, settings.max_view_distance_m)

            except Exception as e:
                logger.error(f"Failed to process camera {camera_id}: {e}")
                # Continue with other cameras

        # Detect walls
        generation_jobs[generation_id].message = "Detecting walls..."
        wall_detector = WallDetector()
        walls = wall_detector.detect_walls(grid)

        # Process fog of war
        fog_processor = FogOfWarProcessor()
        fog_regions_poly = fog_processor.identify_fog_regions(grid)
        fog_regions = fog_processor.fill_fog_with_assumptions(fog_regions_poly, walls)

        # Create assumed walls from fog regions
        assumed_walls = fog_processor.create_wall_segments_from_assumptions(fog_regions)

        # Combine detected and assumed walls
        all_walls = walls + assumed_walls

        # Generate site map data
        generation_jobs[generation_id].message = "Generating site map..."
        site_map_data = _create_site_map_data(
            generation_id,
            camera_ids,
            cameras_data,
            grid,
            all_walls,
            fog_regions
        )

        # Save to file
        output_path = settings.output_dir / f"sitemap-{generation_id}.json"
        settings.output_dir.mkdir(parents=True, exist_ok=True)

        import json
        with open(output_path, 'w') as f:
            json.dump(site_map_data, f, indent=2)

        logger.info(f"Site map saved to {output_path}")

        # Update status
        generation_jobs[generation_id].status = "completed"
        generation_jobs[generation_id].cameras_processed = len(camera_ids)
        generation_jobs[generation_id].message = "Generation completed successfully"

    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        generation_jobs[generation_id].status = "failed"
        generation_jobs[generation_id].message = str(e)


async def _capture_camera_image(
    camera_id: str,
    camera_data: Dict[str, Any],
    method: str
) -> Image.Image:
    """
    Capture image from camera.

    Args:
        camera_id: Camera ID
        camera_data: Camera data
        method: Capture method ('vapix' or 'rtsp')

    Returns:
        PIL Image
    """
    if method == "vapix":
        # Use VAPIX snapshot API
        ip_address = camera_data.get("ipAddress", "localhost")
        port = settings.vapix_default_port
        url = f"http://{ip_address}:{port}/axis-cgi/jpg/image.cgi"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=settings.vapix_timeout_s) as response:
                if response.status != 200:
                    raise Exception(f"Failed to capture from {camera_id}: {response.status}")

                image_data = await response.read()
                image = Image.open(BytesIO(image_data)).convert("RGB")
                return image

    elif method == "rtsp":
        # Capture RTSP frame (requires ffmpeg or cv2)
        rtsp_url = camera_data.get("rtspUrl", f"rtsp://localhost:8554/{camera_id}")

        import cv2
        cap = cv2.VideoCapture(rtsp_url)

        if not cap.isOpened():
            raise Exception(f"Failed to open RTSP stream: {rtsp_url}")

        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise Exception(f"Failed to read frame from {rtsp_url}")

        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(frame_rgb)
        return image

    else:
        raise ValueError(f"Unknown capture method: {method}")


def _create_site_map_data(
    generation_id: str,
    camera_ids: List[str],
    cameras_data: List[Dict[str, Any]],
    grid: OccupancyGrid,
    walls: List,
    fog_regions: List
) -> Dict[str, Any]:
    """
    Create site map data structure.

    Args:
        generation_id: Generation ID
        camera_ids: Camera IDs
        cameras_data: Camera data
        grid: Occupancy grid
        walls: Wall segments
        fog_regions: Fog of war regions

    Returns:
        Site map data dictionary
    """
    # Convert grid dimensions to pixels
    width_px = int(grid.width_m * settings.output_scale_px_per_m)
    height_px = int(grid.height_m * settings.output_scale_px_per_m)

    # Convert walls to output format
    walls_output = []
    for idx, wall in enumerate(walls):
        # Convert meters to pixels
        start_x_px = int((wall.start_x - grid.origin_x) * settings.output_scale_px_per_m)
        start_y_px = int((wall.start_y - grid.origin_y) * settings.output_scale_px_per_m)
        end_x_px = int((wall.end_x - grid.origin_x) * settings.output_scale_px_per_m)
        end_y_px = int((wall.end_y - grid.origin_y) * settings.output_scale_px_per_m)

        walls_output.append({
            "id": f"w-auto-{idx}",
            "start": {"x": start_x_px, "y": start_y_px},
            "end": {"x": end_x_px, "y": end_y_px},
            "type": wall.wall_type,
            "confidence": wall.confidence,
            "source": "depth_estimation"
        })

    # Convert fog regions to output format
    fog_output = []
    for region in fog_regions:
        polygon_px = []
        for x, y in region.polygon:
            x_px = int((x - grid.origin_x) * settings.output_scale_px_per_m)
            y_px = int((y - grid.origin_y) * settings.output_scale_px_per_m)
            polygon_px.append({"x": x_px, "y": y_px})

        fog_output.append({
            "polygon": polygon_px,
            "assumed_type": region.assumed_type,
            "confidence": region.confidence,
            "area_m2": region.area_m2
        })

    # Create camera placements (convert to pixel coordinates)
    cameras_output = []
    for camera_id, camera_data in zip(camera_ids, cameras_data):
        pos = camera_data.get("position", {})
        x_px = int((pos.get("x", 0) - grid.origin_x) * settings.output_scale_px_per_m)
        y_px = int((pos.get("y", 0) - grid.origin_y) * settings.output_scale_px_per_m)

        cameras_output.append({
            "cameraId": camera_id,
            "x": x_px,
            "y": y_px,
            "rotation": pos.get("azimuth", 0),
            "angle": pos.get("elevation", 0),
            "height": pos.get("z", 1.8),
            "fov": 90,  # Default
            "viewDistance": int(settings.max_view_distance_m * settings.output_scale_px_per_m),
            "autoCalculateDistance": True,
            "color": "blue-500"
        })

    return {
        "id": f"map-gen-{generation_id}",
        "name": "Auto-generated from cameras",
        "description": f"Generated from {len(camera_ids)} cameras on {datetime.now().isoformat()}",
        "generated_at": datetime.now().isoformat(),
        "cameras_used": camera_ids,
        "width": width_px,
        "height": height_px,
        "scale": settings.output_scale_px_per_m,
        "origin": {
            "x": grid.origin_x,
            "y": grid.origin_y
        },
        "walls": walls_output,
        "fog_of_war_regions": fog_output,
        "cameras": cameras_output,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )
