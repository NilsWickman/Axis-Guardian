"""Export site map data to various formats."""

import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from ..fusion.occupancy_grid import OccupancyGrid
from ..fusion.wall_extraction import WallSegment
from ..fusion.point_cloud import PointCloud


def export_to_json(
    output_path: Path,
    occupancy_grid: OccupancyGrid,
    walls: List[WallSegment],
    camera_positions: List[tuple],
    config: Dict[str, Any],
    scale_px_per_m: int = 50
) -> Dict[str, Any]:
    """
    Export site map to JSON format (compatible with frontend).

    Args:
        output_path: Output JSON file path
        occupancy_grid: Occupancy grid
        walls: List of wall segments
        camera_positions: List of (x, y, camera_id) tuples
        config: Generation configuration
        scale_px_per_m: Pixels per meter for frontend

    Returns:
        JSON data dictionary
    """
    # Convert walls to JSON format
    walls_json = []
    for idx, wall in enumerate(walls):
        # Convert meters to pixels
        start_x_px = int((wall.start[0] - occupancy_grid.origin[0]) * scale_px_per_m)
        start_y_px = int((wall.start[1] - occupancy_grid.origin[1]) * scale_px_per_m)
        end_x_px = int((wall.end[0] - occupancy_grid.origin[0]) * scale_px_per_m)
        end_y_px = int((wall.end[1] - occupancy_grid.origin[1]) * scale_px_per_m)

        walls_json.append({
            "id": f"w-sfm-{idx}",
            "start": {"x": start_x_px, "y": start_y_px},
            "end": {"x": end_x_px, "y": end_y_px},
            "type": "detected",
            "confidence": float(wall.confidence),
            "source": "structure_from_motion"
        })

    # Convert camera positions to JSON format
    cameras_json = []
    for x, y, camera_id in camera_positions:
        x_px = int((x - occupancy_grid.origin[0]) * scale_px_per_m)
        y_px = int((y - occupancy_grid.origin[1]) * scale_px_per_m)

        cameras_json.append({
            "cameraId": camera_id,
            "x": x_px,
            "y": y_px,
            "rotation": 0,  # Not computed by SfM
            "angle": 0,
            "height": 1.8,  # Default
            "fov": 90,
            "viewDistance": int(10 * scale_px_per_m),  # 10 meters
            "autoCalculateDistance": True,
            "color": "blue-500"
        })

    # Create JSON structure
    width_px = int(occupancy_grid.width_m * scale_px_per_m)
    height_px = int(occupancy_grid.height_m * scale_px_per_m)

    data = {
        "id": f"map-sfm-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "name": config.get("name", "SfM Generated Site Map"),
        "description": config.get("description", "Generated using Structure from Motion"),
        "generated_at": datetime.now().isoformat(),
        "method": "structure_from_motion",
        "width": width_px,
        "height": height_px,
        "scale": scale_px_per_m,
        "origin": {
            "x": float(occupancy_grid.origin[0]),
            "y": float(occupancy_grid.origin[1])
        },
        "walls": walls_json,
        "cameras": cameras_json,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }

    # Save to file
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"JSON export saved to: {output_path}")

    return data


def export_to_ply(output_path: Path, point_cloud: PointCloud):
    """
    Export point cloud to PLY format.

    Args:
        output_path: Output PLY file path
        point_cloud: Point cloud to export
    """
    point_cloud.save_ply(str(output_path))
    print(f"PLY export saved to: {output_path}")
