"""Command-line interface for geometric site map generator."""

import argparse
import yaml
import json
from pathlib import Path
from typing import List
import sys

try:
    from .core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
    from .generator import GeometricSiteMapGenerator
except ImportError:
    # Running as script, not module
    from core.camera import CameraConfig, CameraOrientation, CameraIntrinsics
    from generator import GeometricSiteMapGenerator


def load_config(config_path: Path) -> List[CameraConfig]:
    """
    Load camera configurations from YAML file.

    Args:
        config_path: Path to configuration file

    Returns:
        List of camera configurations
    """
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    cameras = []

    for cam_data in config['cameras']:
        # Parse orientation
        orientation = CameraOrientation(
            pan=cam_data['orientation']['pan'],
            tilt=cam_data['orientation']['tilt'],
            roll=cam_data['orientation'].get('roll', 0.0)
        )

        # Parse intrinsics
        intrinsics = CameraIntrinsics(
            focal_length=cam_data['intrinsics']['focal_length'],
            sensor_size=tuple(cam_data['intrinsics']['sensor_size']),
            resolution=tuple(cam_data['intrinsics']['resolution']),
            fov=tuple(cam_data['intrinsics']['fov'])
        )

        # Create camera config
        camera = CameraConfig(
            id=cam_data['id'],
            gps=tuple(cam_data['gps']),
            mount_height=cam_data['mount_height'],
            orientation=orientation,
            intrinsics=intrinsics,
            image_path=Path(cam_data['image_path'])
        )

        cameras.append(camera)

    return cameras


def cmd_generate(args):
    """Generate site map command."""
    print("=" * 60)
    print("Geometric Site Map Generator")
    print("=" * 60)

    # Load configuration
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Configuration file not found: {config_path}")
        sys.exit(1)

    cameras = load_config(config_path)

    # Get generation parameters
    generation_config = {}
    with open(config_path, 'r') as f:
        full_config = yaml.safe_load(f)
        if 'generation' in full_config:
            generation_config = full_config['generation']

    grid_resolution = generation_config.get('grid_resolution', 0.05)
    min_wall_length = generation_config.get('min_wall_length', 0.5)
    confidence_threshold = generation_config.get('confidence_threshold', 0.5)
    segmentation_model = generation_config.get(
        'semantic_model',
        'nvidia/segformer-b5-finetuned-ade-640-640'
    )

    # Create generator
    generator = GeometricSiteMapGenerator(
        cameras=cameras,
        grid_resolution=grid_resolution,
        segmentation_model=segmentation_model
    )

    # Generate
    grid, walls = generator.generate(
        min_wall_length=min_wall_length,
        confidence_threshold=confidence_threshold
    )

    # Render
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    generator.render(
        output_path,
        dpi=args.dpi,
        show_occupancy=not args.no_occupancy,
        show_walls=not args.no_walls,
        show_cameras=not args.no_cameras,
        show_camera_fov=not args.no_fov
    )

    # Export data
    if args.export_data:
        export_dir = output_path.parent / f"{output_path.stem}_data"
        generator.export_data(export_dir)

    # Print statistics
    print("\n" + "=" * 60)
    print("STATISTICS")
    print("=" * 60)

    stats = generator.get_statistics()
    print(json.dumps(stats, indent=2))

    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)


def cmd_validate(args):
    """Validate configuration command."""
    print("Validating configuration...")

    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Configuration file not found: {config_path}")
        sys.exit(1)

    try:
        cameras = load_config(config_path)
        print(f"✓ Configuration valid!")
        print(f"  Cameras: {len(cameras)}")

        # Check images
        missing_images = []
        for camera in cameras:
            if not camera.image_path.exists():
                missing_images.append((camera.id, camera.image_path))

        if missing_images:
            print("\nWarning: Missing images:")
            for cam_id, path in missing_images:
                print(f"  - {cam_id}: {path}")
        else:
            print(f"  All images found!")

        # Print camera details
        print("\nCamera Details:")
        for camera in cameras:
            print(f"\n  {camera.id}:")
            print(f"    GPS: {camera.gps}")
            print(f"    Mount height: {camera.mount_height}m")
            print(f"    Orientation: pan={camera.orientation.pan}°, "
                  f"tilt={camera.orientation.tilt}°, roll={camera.orientation.roll}°")
            print(f"    FOV: {camera.intrinsics.fov[0]}° × {camera.intrinsics.fov[1]}°")
            print(f"    Resolution: {camera.intrinsics.resolution[0]}×{camera.intrinsics.resolution[1]}")
            print(f"    Image: {camera.image_path}")

    except Exception as e:
        print(f"✗ Configuration invalid: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Geometric Site Map Generator - Camera-first automatic spatial reconstruction',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate site map')
    gen_parser.add_argument('--config', '-c', required=True,
                           help='Path to configuration YAML file')
    gen_parser.add_argument('--output', '-o', required=True,
                           help='Output image path')
    gen_parser.add_argument('--dpi', type=int, default=150,
                           help='Output image DPI (default: 150)')
    gen_parser.add_argument('--no-occupancy', action='store_true',
                           help='Hide occupancy grid')
    gen_parser.add_argument('--no-walls', action='store_true',
                           help='Hide walls')
    gen_parser.add_argument('--no-cameras', action='store_true',
                           help='Hide cameras')
    gen_parser.add_argument('--no-fov', action='store_true',
                           help='Hide camera FOV')
    gen_parser.add_argument('--export-data', action='store_true',
                           help='Export raw data (grid, walls, metadata)')

    # Validate command
    val_parser = subparsers.add_parser('validate', help='Validate configuration')
    val_parser.add_argument('--config', '-c', required=True,
                           help='Path to configuration YAML file')

    # Parse arguments
    args = parser.parse_args()

    if args.command == 'generate':
        cmd_generate(args)
    elif args.command == 'validate':
        cmd_validate(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
