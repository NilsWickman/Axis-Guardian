#!/usr/bin/env python3
"""
Demo script - generates site map without CLI complexity.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import numpy as np
from core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
from generator import GeometricSiteMapGenerator

def main():
    print("=" * 70)
    print("Geometric Site Map Generator - Demo")
    print("=" * 70)

    # Define cameras with sample images
    base_path = Path(__file__).parent

    cameras = [
        CameraConfig(
            id="camera1",
            gps=(35.9940, -78.9018, 120.5),
            mount_height=3.5,
            orientation=CameraOrientation(pan=0.0, tilt=-15.0, roll=0.0),
            intrinsics=CameraIntrinsics(
                focal_length=4.0,
                sensor_size=(0.357, 0.357),
                resolution=(1920, 1080),
                fov=(92.0, 50.0)
            ),
            image_path=base_path / "sample_images/camera1.jpg"
        ),
        CameraConfig(
            id="camera2",
            gps=(35.9942, -78.9020, 121.0),
            mount_height=3.8,
            orientation=CameraOrientation(pan=90.0, tilt=-18.0, roll=0.0),
            intrinsics=CameraIntrinsics(
                focal_length=4.0,
                sensor_size=(0.357, 0.357),
                resolution=(1920, 1080),
                fov=(92.0, 50.0)
            ),
            image_path=base_path / "sample_images/camera2.jpg"
        ),
        CameraConfig(
            id="camera3",
            gps=(35.9938, -78.9016, 119.8),
            mount_height=3.2,
            orientation=CameraOrientation(pan=180.0, tilt=-12.0, roll=0.0),
            intrinsics=CameraIntrinsics(
                focal_length=4.0,
                sensor_size=(0.357, 0.357),
                resolution=(1920, 1080),
                fov=(92.0, 50.0)
            ),
            image_path=base_path / "sample_images/camera3.jpg"
        ),
        CameraConfig(
            id="camera4",
            gps=(35.9936, -78.9022, 120.2),
            mount_height=3.6,
            orientation=CameraOrientation(pan=270.0, tilt=-16.0, roll=0.0),
            intrinsics=CameraIntrinsics(
                focal_length=4.0,
                sensor_size=(0.357, 0.357),
                resolution=(1920, 1080),
                fov=(92.0, 50.0)
            ),
            image_path=base_path / "sample_images/camera4.jpg"
        ),
    ]

    # Create generator
    try:
        generator = GeometricSiteMapGenerator(
            cameras=cameras,
            grid_resolution=0.1,  # 10cm for faster demo
            segmentation_model="nvidia/segformer-b0-finetuned-ade-512-512"  # Fastest
        )

        # Generate
        grid, walls = generator.generate(
            min_wall_length=0.5,
            confidence_threshold=0.4
        )

        # Create output directory
        output_dir = base_path / "output"
        output_dir.mkdir(exist_ok=True)

        # Render
        output_path = output_dir / "demo_sitemap.png"
        generator.render(
            output_path,
            dpi=150,
            show_occupancy=True,
            show_walls=True,
            show_cameras=True,
            show_camera_fov=True
        )

        # Get stats
        stats = generator.get_statistics()

        print("\n" + "=" * 70)
        print("STATISTICS")
        print("=" * 70)
        print(f"Grid: {stats['grid']['width']}×{stats['grid']['height']} cells")
        print(f"Total Area: {stats['grid']['total_area_m2']:.2f} m²")
        print(f"Free Space: {stats['occupancy']['free_percentage']:.1f}%")
        print(f"Occupied: {stats['occupancy']['occupied_percentage']:.1f}%")
        print(f"Walls: {stats['walls']['count']} ({stats['walls']['total_length_m']:.2f}m)")

        print("\n" + "=" * 70)
        print("COMPLETE!")
        print("=" * 70)
        print(f"Site map saved to: {output_path}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
