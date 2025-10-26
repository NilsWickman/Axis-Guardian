#!/usr/bin/env python3
"""
Example usage of the Geometric Site Map Generator.

This script demonstrates how to use the generator programmatically
(as opposed to using the CLI).
"""

from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
from generator import GeometricSiteMapGenerator


def main():
    """Run example site map generation."""

    print("=" * 70)
    print("Geometric Site Map Generator - Example Usage")
    print("=" * 70)

    # Define cameras manually (instead of loading from YAML)
    cameras = []

    # Camera 1
    cameras.append(CameraConfig(
        id="camera1",
        gps=(35.9940, -78.9018, 120.5),
        mount_height=3.5,
        orientation=CameraOrientation(pan=45.0, tilt=-15.0, roll=0.0),
        intrinsics=CameraIntrinsics(
            focal_length=4.0,
            sensor_size=(0.357, 0.357),
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        ),
        image_path=Path("../../shared/cameras/view-HC3.mp4.0001.jpg")
    ))

    # Camera 2
    cameras.append(CameraConfig(
        id="camera2",
        gps=(35.9942, -78.9020, 121.0),
        mount_height=3.8,
        orientation=CameraOrientation(pan=135.0, tilt=-18.0, roll=0.0),
        intrinsics=CameraIntrinsics(
            focal_length=4.0,
            sensor_size=(0.357, 0.357),
            resolution=(1920, 1080),
            fov=(92.0, 50.0)
        ),
        image_path=Path("../../shared/cameras/view-HC4.mp4.0001.jpg")
    ))

    # Create generator
    generator = GeometricSiteMapGenerator(
        cameras=cameras,
        grid_resolution=0.05,  # 5cm cells
        segmentation_model="nvidia/segformer-b5-finetuned-ade-640-640"
    )

    # Generate site map
    print("\n" + "=" * 70)
    print("GENERATING SITE MAP")
    print("=" * 70)

    occupancy_grid, walls = generator.generate(
        min_wall_length=0.5,
        confidence_threshold=0.5
    )

    # Get statistics
    stats = generator.get_statistics()

    print("\n" + "=" * 70)
    print("STATISTICS")
    print("=" * 70)
    print(f"Grid Resolution: {stats['grid']['resolution']}m")
    print(f"Grid Size: {stats['grid']['width']} × {stats['grid']['height']} cells")
    print(f"Total Area: {stats['grid']['total_area_m2']:.2f} m²")
    print()
    print(f"Free Space: {stats['occupancy']['free_area_m2']:.2f} m² "
          f"({stats['occupancy']['free_percentage']:.1f}%)")
    print(f"Occupied: {stats['occupancy']['occupied_area_m2']:.2f} m² "
          f"({stats['occupancy']['occupied_percentage']:.1f}%)")
    print(f"Unknown: {stats['occupancy']['unknown_area_m2']:.2f} m² "
          f"({stats['occupancy']['unknown_percentage']:.1f}%)")
    print()
    print(f"Walls Detected: {stats['walls']['count']}")
    print(f"Total Wall Length: {stats['walls']['total_length_m']:.2f} m")
    print(f"Average Wall Confidence: {stats['walls']['average_confidence']:.3f}")

    # Render
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    print("\n" + "=" * 70)
    print("RENDERING")
    print("=" * 70)

    generator.render(
        output_path=output_dir / "sitemap.png",
        dpi=150,
        show_occupancy=True,
        show_walls=True,
        show_cameras=True,
        show_camera_fov=True
    )

    # Export data
    generator.export_data(output_dir / "data")

    print("\n" + "=" * 70)
    print("COMPLETE!")
    print("=" * 70)
    print(f"Output saved to: {output_dir.absolute()}")
    print()
    print("Files generated:")
    print("  - sitemap.png          (Rendered site map)")
    print("  - data/occupancy_grid.npz  (Raw occupancy data)")
    print("  - data/walls.json      (Extracted walls)")
    print("  - data/metadata.json   (Generation metadata)")


if __name__ == "__main__":
    main()
