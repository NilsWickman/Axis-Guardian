#!/usr/bin/env python3
"""
Structure from Motion Site Map Generator - Main Script

Generate site maps from camera images using Structure from Motion.
"""

import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.utils.config import load_config
from src.core.reconstruction import SfMReconstructor
from src.rendering.renderer import SiteMapRenderer
from src.rendering.exporter import export_to_json, export_to_ply


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Structure from Motion Site Map Generator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic generation
  python generate.py --config config/auditorium.yaml --output output/sitemap.png

  # With debug visualization
  python generate.py --config config/auditorium.yaml --output output/sitemap.png --debug

  # Export point cloud
  python generate.py --config config/auditorium.yaml --output output/sitemap.png --export-ply

  # Export all formats
  python generate.py --config config/auditorium.yaml --output output/sitemap.png --export-all
        """
    )

    parser.add_argument(
        '--config', '-c',
        required=True,
        help='Path to YAML configuration file'
    )

    parser.add_argument(
        '--output', '-o',
        required=True,
        help='Output site map image path (PNG)'
    )

    parser.add_argument(
        '--export-json',
        action='store_true',
        help='Export site map data to JSON format'
    )

    parser.add_argument(
        '--export-ply',
        action='store_true',
        help='Export 3D point cloud to PLY format'
    )

    parser.add_argument(
        '--export-all',
        action='store_true',
        help='Export all formats (JSON + PLY)'
    )

    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug visualizations'
    )

    parser.add_argument(
        '--dpi',
        type=int,
        default=150,
        help='Output image DPI (default: 150)'
    )

    args = parser.parse_args()

    # Load configuration
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Configuration file not found: {config_path}")
        sys.exit(1)

    print(f"Loading configuration from: {config_path}")
    config = load_config(config_path)

    # Create output directory
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Run SfM reconstruction
    try:
        reconstructor = SfMReconstructor(config)
        results = reconstructor.reconstruct()

    except Exception as e:
        print(f"\n❌ Reconstruction failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Render site map
    print("\n[Rendering] Creating site map visualization...")
    renderer = SiteMapRenderer(
        occupancy_grid=results["occupancy_grid"],
        walls=results["walls"],
        camera_positions=results["camera_positions"]
    )

    fig = renderer.render(
        output_path=output_path,
        dpi=args.dpi,
        show_grid=True,
        show_walls=True,
        show_cameras=True
    )

    print(f"✅ Site map saved to: {output_path}")

    # Export JSON if requested
    if args.export_json or args.export_all:
        json_path = output_path.with_suffix('.json')
        print(f"\n[Exporting] Saving JSON data...")
        export_to_json(
            output_path=json_path,
            occupancy_grid=results["occupancy_grid"],
            walls=results["walls"],
            camera_positions=results["camera_positions"],
            config=config.model_dump(),
            scale_px_per_m=config.generation.output_scale_px_per_m
        )
        print(f"✅ JSON data saved to: {json_path}")

    # Export PLY if requested
    if args.export_ply or args.export_all:
        ply_path = output_path.parent / f"{output_path.stem}_pointcloud.ply"
        print(f"\n[Exporting] Saving 3D point cloud...")
        export_to_ply(
            output_path=ply_path,
            point_cloud=results["aligned_cloud"]
        )
        print(f"✅ Point cloud saved to: {ply_path}")

    # Print summary
    print("\n" + "=" * 60)
    print("GENERATION SUMMARY")
    print("=" * 60)
    print(f"  Cameras: {len(config.cameras)}")
    print(f"  3D Points: {len(results['point_cloud'].points)}")
    print(f"  Ground Points: {len(results['aligned_cloud'].points)}")
    print(f"  Walls Detected: {len(results['walls'])}")
    print(f"  Grid Resolution: {config.generation.grid_resolution_m}m")
    print(f"  Grid Size: {results['occupancy_grid'].width_m:.2f}m × {results['occupancy_grid'].height_m:.2f}m")
    print("=" * 60)

    print(f"\n✅ Complete! Site map generated successfully.")


if __name__ == "__main__":
    main()
