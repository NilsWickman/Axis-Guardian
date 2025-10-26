#!/usr/bin/env python3
"""
Demo with REAL GPS coordinates from the auditorium.
"""

import sys
from pathlib import Path
import yaml

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
from generator import GeometricSiteMapGenerator


def load_config_yaml(config_path: Path):
    """Load camera configurations from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    cameras = []
    for cam_data in config['cameras']:
        orientation = CameraOrientation(
            pan=cam_data['orientation']['pan'],
            tilt=cam_data['orientation']['tilt'],
            roll=cam_data['orientation'].get('roll', 0.0)
        )

        intrinsics = CameraIntrinsics(
            focal_length=cam_data['intrinsics']['focal_length'],
            sensor_size=tuple(cam_data['intrinsics']['sensor_size']),
            resolution=tuple(cam_data['intrinsics']['resolution']),
            fov=tuple(cam_data['intrinsics']['fov'])
        )

        camera = CameraConfig(
            id=cam_data['id'],
            gps=tuple(cam_data['gps']),
            mount_height=cam_data['mount_height'],
            orientation=orientation,
            intrinsics=intrinsics,
            image_path=Path(cam_data['image_path'])
        )
        cameras.append(camera)

    generation_config = config.get('generation', {})
    return cameras, generation_config


def main():
    print("=" * 70)
    print("Geometric Site Map Generator - Real GPS Coordinates")
    print("=" * 70)

    # Load configuration
    base_path = Path(__file__).parent
    config_path = base_path / "config/auditorium_real.yaml"

    cameras, gen_config = load_config_yaml(config_path)

    print(f"\nLoaded {len(cameras)} cameras with REAL GPS coordinates:")
    for cam in cameras:
        print(f"  {cam.id}: lat={cam.gps[0]:.8f}, lon={cam.gps[1]:.8f}, "
              f"pan={cam.orientation.pan}°, tilt={cam.orientation.tilt}°")

    # Create generator
    try:
        generator = GeometricSiteMapGenerator(
            cameras=cameras,
            grid_resolution=gen_config.get('grid_resolution', 0.05),
            segmentation_model=gen_config.get('semantic_model',
                                             'nvidia/segformer-b0-finetuned-ade-512-512')
        )

        # Generate
        grid, walls = generator.generate(
            min_wall_length=gen_config.get('min_wall_length', 0.3),
            confidence_threshold=gen_config.get('confidence_threshold', 0.3)
        )

        # Create output directory
        output_dir = base_path / "output"
        output_dir.mkdir(exist_ok=True)

        # Render
        output_path = output_dir / "auditorium_sitemap_real.png"
        generator.render(
            output_path,
            dpi=150,
            show_occupancy=True,
            show_walls=True,
            show_cameras=True,
            show_camera_fov=True
        )

        # Export data
        data_dir = output_dir / "auditorium_data"
        generator.export_data(data_dir)

        # Get stats
        stats = generator.get_statistics()

        print("\n" + "=" * 70)
        print("STATISTICS")
        print("=" * 70)
        print(f"Grid: {stats['grid']['width']}×{stats['grid']['height']} cells")
        print(f"Resolution: {stats['grid']['resolution']}m per cell")
        print(f"Total Area: {stats['grid']['total_area_m2']:.2f} m²")
        print(f"Free Space: {stats['occupancy']['free_area_m2']:.2f} m² "
              f"({stats['occupancy']['free_percentage']:.1f}%)")
        print(f"Occupied: {stats['occupancy']['occupied_area_m2']:.2f} m² "
              f"({stats['occupancy']['occupied_percentage']:.1f}%)")
        print(f"Unknown: {stats['occupancy']['unknown_area_m2']:.2f} m² "
              f"({stats['occupancy']['unknown_percentage']:.1f}%)")
        print(f"Walls: {stats['walls']['count']} "
              f"({stats['walls']['total_length_m']:.2f}m total)")
        if stats['walls']['count'] > 0:
            print(f"Average Wall Confidence: {stats['walls']['average_confidence']:.3f}")

        print("\n" + "=" * 70)
        print("COMPLETE!")
        print("=" * 70)
        print(f"Site map: {output_path}")
        print(f"Data exported to: {data_dir}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
