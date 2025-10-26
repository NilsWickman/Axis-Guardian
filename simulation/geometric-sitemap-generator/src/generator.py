"""Main geometric site map generator."""

import numpy as np
import cv2
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from tqdm import tqdm

from core.camera import CameraConfig, CameraCalibration
from core.coordinate_system import WorldCoordinateSystem
from core.ground_plane import GroundPlaneMapper
from vision.segmentation import SemanticSegmenter, SegmentationResult
from fusion.occupancy_grid import OccupancyGrid
from fusion.bayesian_fusion import MultiViewFusion, CameraObservation
from fusion.wall_extraction import WallExtractor, WallSegment
from rendering.renderer import SiteMapRenderer


class GeometricSiteMapGenerator:
    """
    Generate site maps from camera metadata and images.

    This is the main entry point that orchestrates the entire pipeline.
    """

    def __init__(self, cameras: List[CameraConfig],
                 grid_resolution: float = 0.05,
                 segmentation_model: str = "nvidia/segformer-b5-finetuned-ade-640-640"):
        """
        Initialize generator.

        Args:
            cameras: List of camera configurations
            grid_resolution: Occupancy grid resolution in meters (default 5cm)
            segmentation_model: HuggingFace model for semantic segmentation
        """
        self.cameras = cameras
        self.grid_resolution = grid_resolution

        print(f"Initializing Geometric Site Map Generator...")
        print(f"  Cameras: {len(cameras)}")
        print(f"  Grid resolution: {grid_resolution}m")

        # Phase 1: Establish world coordinate system
        print("\n[Phase 1] Establishing world coordinate system...")
        self.world = WorldCoordinateSystem(cameras)
        print(f"  Origin (GPS): {self.world.origin_gps}")
        print(f"  Ground level: {self.world.ground_level:.2f}m")
        print(f"  UTM Zone: {self.world.utm_zone}")

        # Phase 2: Create camera calibrations
        print("\n[Phase 2] Calibrating cameras...")
        self.calibrations: Dict[str, CameraCalibration] = {}
        self.ground_mappers: Dict[str, GroundPlaneMapper] = {}

        for camera in tqdm(cameras, desc="Calibrating"):
            origin_utm = np.array([
                self.world.origin_gps[1],  # lon
                self.world.origin_gps[0],  # lat
                self.world.ground_level
            ])

            calib = CameraCalibration(camera, origin_utm)
            self.calibrations[camera.id] = calib

            mapper = GroundPlaneMapper(calib)
            self.ground_mappers[camera.id] = mapper

        # Phase 3: Initialize semantic segmenter
        print("\n[Phase 3] Loading semantic segmentation model...")
        self.segmenter = SemanticSegmenter(model_name=segmentation_model)

        # Prepare for fusion
        self.occupancy_grid: Optional[OccupancyGrid] = None
        self.walls: List[WallSegment] = []

    def generate(self, min_wall_length: float = 0.5,
                confidence_threshold: float = 0.5) -> Tuple[OccupancyGrid, List[WallSegment]]:
        """
        Generate site map from camera images.

        Args:
            min_wall_length: Minimum wall length in meters
            confidence_threshold: Minimum confidence for features

        Returns:
            (occupancy_grid, walls)
        """
        # Phase 4: Load and segment images
        print("\n[Phase 4] Processing camera images...")
        observations = []

        for camera in tqdm(self.cameras, desc="Segmenting images"):
            # Load image
            if not camera.image_path.exists():
                print(f"  Warning: Image not found for {camera.id}: {camera.image_path}")
                continue

            image = cv2.imread(str(camera.image_path))
            if image is None:
                print(f"  Warning: Failed to load image for {camera.id}")
                continue

            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Semantic segmentation
            segmentation = self.segmenter.segment_image(image)

            # Create observation
            obs = CameraObservation(
                camera_id=camera.id,
                segmentation=segmentation,
                calibration=self.calibrations[camera.id],
                ground_mapper=self.ground_mappers[camera.id],
                image=image
            )
            observations.append(obs)

        if len(observations) == 0:
            raise ValueError("No valid camera observations!")

        # Phase 5: Create occupancy grid
        print("\n[Phase 5] Creating occupancy grid...")
        bounds = self.world.get_scene_bounds(margin=20.0)
        bounds_2d = (bounds[0][:2], bounds[1][:2])

        self.occupancy_grid = OccupancyGrid(bounds_2d, resolution=self.grid_resolution)
        print(f"  Grid shape: {self.occupancy_grid.get_shape()}")
        print(f"  Grid bounds: {bounds_2d[0]} to {bounds_2d[1]}")

        # Phase 6: Multi-view fusion
        print("\n[Phase 6] Fusing multi-view observations...")
        fusion = MultiViewFusion(self.occupancy_grid)

        image_shapes = {
            obs.camera_id: obs.image.shape[:2]
            for obs in observations
        }

        fusion.fuse_multiple_observations(observations, image_shapes)
        print("  Fusion complete!")

        # Phase 7: Extract walls
        print("\n[Phase 7] Extracting walls...")
        extractor = WallExtractor(
            min_wall_length=min_wall_length,
            ransac_threshold=0.1,
            min_points=10
        )

        self.walls = extractor.extract_walls(
            self.occupancy_grid,
            occupancy_threshold=0.7,
            confidence_threshold=confidence_threshold
        )

        print(f"  Extracted {len(self.walls)} wall segments")
        total_length = sum(
            np.linalg.norm(w.end - w.start) for w in self.walls
        )
        print(f"  Total wall length: {total_length:.2f}m")

        return self.occupancy_grid, self.walls

    def render(self, output_path: Path,
              dpi: int = 150,
              show_occupancy: bool = True,
              show_walls: bool = True,
              show_cameras: bool = True,
              show_camera_fov: bool = True) -> np.ndarray:
        """
        Render site map to image.

        Args:
            output_path: Output file path
            dpi: Image resolution
            show_occupancy: Show occupancy grid
            show_walls: Show extracted walls
            show_cameras: Show camera positions
            show_camera_fov: Show camera FOV

        Returns:
            Rendered image
        """
        if self.occupancy_grid is None:
            raise ValueError("Must call generate() before render()")

        print(f"\n[Phase 8] Rendering site map...")
        renderer = SiteMapRenderer(
            self.occupancy_grid,
            self.walls,
            self.cameras
        )

        image = renderer.render_to_image(
            output_path,
            dpi=dpi,
            show_occupancy=show_occupancy,
            show_walls=show_walls,
            show_cameras=show_cameras,
            show_camera_fov=show_camera_fov
        )

        print(f"  Saved to: {output_path}")

        return image

    def export_data(self, output_dir: Path):
        """
        Export generated data to files.

        Args:
            output_dir: Output directory
        """
        if self.occupancy_grid is None:
            raise ValueError("Must call generate() before export_data()")

        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[Export] Exporting data to {output_dir}...")

        # Export occupancy grid
        np.savez(
            output_dir / "occupancy_grid.npz",
            probability=self.occupancy_grid.probability,
            confidence=self.occupancy_grid.confidence,
            observations=self.occupancy_grid.observations,
            min_point=self.occupancy_grid.min_point,
            max_point=self.occupancy_grid.max_point,
            resolution=self.occupancy_grid.resolution
        )
        print("  Saved occupancy_grid.npz")

        # Export walls
        walls_data = []
        for wall in self.walls:
            walls_data.append({
                'start': wall.start.tolist(),
                'end': wall.end.tolist(),
                'confidence': float(wall.confidence),
                'supporting_points': int(wall.supporting_points)
            })

        import json
        with open(output_dir / "walls.json", 'w') as f:
            json.dump(walls_data, f, indent=2)
        print("  Saved walls.json")

        # Export metadata
        metadata = {
            'num_cameras': len(self.cameras),
            'camera_ids': [cam.id for cam in self.cameras],
            'origin_gps': self.world.origin_gps,
            'ground_level': float(self.world.ground_level),
            'grid_resolution': float(self.grid_resolution),
            'num_walls': len(self.walls),
            'total_wall_length': float(sum(
                np.linalg.norm(w.end - w.start) for w in self.walls
            ))
        }

        with open(output_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        print("  Saved metadata.json")

    def get_statistics(self) -> Dict:
        """
        Get statistics about generated site map.

        Returns:
            Dictionary of statistics
        """
        if self.occupancy_grid is None:
            return {}

        grid = self.occupancy_grid

        # Count cells by state
        occupied = grid.get_occupancy_map(threshold=0.7, min_confidence=0.3)
        free = grid.get_free_space_map(threshold=0.3, min_confidence=0.3)

        total_cells = grid.width * grid.height
        occupied_cells = np.sum(occupied)
        free_cells = np.sum(free)
        unknown_cells = total_cells - occupied_cells - free_cells

        # Areas
        cell_area = grid.resolution ** 2
        total_area = total_cells * cell_area
        occupied_area = occupied_cells * cell_area
        free_area = free_cells * cell_area
        unknown_area = unknown_cells * cell_area

        stats = {
            'grid': {
                'resolution': float(grid.resolution),
                'width': int(grid.width),
                'height': int(grid.height),
                'total_cells': int(total_cells),
                'total_area_m2': float(total_area)
            },
            'occupancy': {
                'free_cells': int(free_cells),
                'free_area_m2': float(free_area),
                'free_percentage': float(free_cells / total_cells * 100),
                'occupied_cells': int(occupied_cells),
                'occupied_area_m2': float(occupied_area),
                'occupied_percentage': float(occupied_cells / total_cells * 100),
                'unknown_cells': int(unknown_cells),
                'unknown_area_m2': float(unknown_area),
                'unknown_percentage': float(unknown_cells / total_cells * 100)
            },
            'walls': {
                'count': len(self.walls),
                'total_length_m': float(sum(
                    np.linalg.norm(w.end - w.start) for w in self.walls
                )),
                'average_confidence': float(np.mean([w.confidence for w in self.walls]))
                if self.walls else 0.0
            }
        }

        return stats
