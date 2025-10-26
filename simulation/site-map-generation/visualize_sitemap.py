#!/usr/bin/env python3
"""Visualize generated site map for comparison with real sitemap."""

import json
import sys
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

def visualize_sitemap(sitemap_path: Path, output_path: Path = None):
    """
    Visualize site map from JSON data.

    Args:
        sitemap_path: Path to sitemap JSON file
        output_path: Path to save visualization PNG (optional)
    """
    # Load sitemap data
    with open(sitemap_path, 'r') as f:
        data = json.load(f)

    # Create figure
    fig, ax = plt.subplots(figsize=(12, 10))

    width_px = data['width']
    height_px = data['height']
    scale = data['scale']  # pixels per meter

    # Set axis limits
    ax.set_xlim(0, width_px)
    ax.set_ylim(height_px, 0)  # Flip Y axis
    ax.set_aspect('equal')

    # Add grid (1 meter spacing)
    meter_spacing_px = scale
    ax.grid(True, which='major', linestyle='--', linewidth=0.5, alpha=0.3)
    ax.set_xticks(np.arange(0, width_px, meter_spacing_px))
    ax.set_yticks(np.arange(0, height_px, meter_spacing_px))

    # Add scale labels (in meters)
    x_labels = [f"{int(x/scale)}m" for x in range(0, width_px, meter_spacing_px)]
    y_labels = [f"{int(y/scale)}m" for y in range(0, height_px, meter_spacing_px)]
    ax.set_xticklabels(x_labels, fontsize=8)
    ax.set_yticklabels(y_labels, fontsize=8)

    # Draw fog of war regions (light gray)
    for region in data.get('fog_of_war_regions', []):
        polygon = region['polygon']
        poly_coords = [(p['x'], p['y']) for p in polygon]
        poly = patches.Polygon(
            poly_coords,
            closed=True,
            facecolor='lightgray',
            edgecolor='gray',
            linewidth=1,
            alpha=0.3,
            label='Fog of War' if 'Fog of War' not in [t.get_text() for t in ax.get_legend_handles_labels()[1]] else ""
        )
        ax.add_patch(poly)

    # Draw walls
    detected_walls = []
    assumed_walls = []

    for wall in data.get('walls', []):
        start = wall['start']
        end = wall['end']
        wall_type = wall.get('type', 'detected')

        if wall_type == 'assumed':
            assumed_walls.append(wall)
            color = 'red'
            linestyle = '--'
            linewidth = 2
            alpha = 0.6
        else:
            detected_walls.append(wall)
            color = 'black'
            linestyle = '-'
            linewidth = 3
            alpha = 1.0

        ax.plot(
            [start['x'], end['x']],
            [start['y'], end['y']],
            color=color,
            linestyle=linestyle,
            linewidth=linewidth,
            alpha=alpha
        )

    # Draw cameras
    for camera in data.get('cameras', []):
        x = camera['x']
        y = camera['y']
        rotation = camera['rotation']
        fov = camera.get('fov', 90)
        view_distance = camera.get('viewDistance', 1200)
        camera_id = camera['cameraId']

        # Draw camera position (circle)
        circle = plt.Circle((x, y), 50, color='blue', fill=True, alpha=0.8, zorder=10)
        ax.add_patch(circle)

        # Draw camera label
        ax.text(x, y - 120, camera_id, ha='center', va='top', fontsize=10,
                fontweight='bold', color='blue')

        # Draw FOV cone
        fov_half = fov / 2
        angle1 = rotation - fov_half
        angle2 = rotation + fov_half

        # Convert angles to radians
        angle1_rad = np.deg2rad(angle1)
        angle2_rad = np.deg2rad(angle2)

        # Create FOV wedge points
        fov_points = [(x, y)]
        angles = np.linspace(angle1_rad, angle2_rad, 20)
        for angle in angles:
            fov_x = x + view_distance * np.cos(angle)
            fov_y = y + view_distance * np.sin(angle)
            fov_points.append((fov_x, fov_y))
        fov_points.append((x, y))

        # Draw FOV wedge
        fov_poly = patches.Polygon(
            fov_points,
            closed=True,
            facecolor='blue',
            edgecolor='blue',
            linewidth=1,
            alpha=0.1,
            zorder=1
        )
        ax.add_patch(fov_poly)

        # Draw direction arrow
        arrow_length = 200
        arrow_dx = arrow_length * np.cos(np.deg2rad(rotation))
        arrow_dy = arrow_length * np.sin(np.deg2rad(rotation))
        ax.arrow(x, y, arrow_dx, arrow_dy, head_width=80, head_length=60,
                fc='blue', ec='blue', alpha=0.8, zorder=11)

    # Add title and legend
    ax.set_title(f"Generated Site Map\n{data['name']}", fontsize=14, fontweight='bold')
    ax.set_xlabel("X (meters)", fontsize=12)
    ax.set_ylabel("Y (meters)", fontsize=12)

    # Create custom legend
    legend_elements = [
        patches.Patch(facecolor='black', label=f'Detected Walls ({len(detected_walls)})'),
        patches.Patch(facecolor='red', label=f'Assumed Walls ({len(assumed_walls)})', linestyle='--'),
        patches.Patch(facecolor='lightgray', label='Fog of War Regions', alpha=0.3),
        patches.Patch(facecolor='blue', label=f'Cameras ({len(data.get("cameras", []))})'),
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)

    # Add metadata text
    metadata_text = (
        f"Generated: {data.get('generated_at', 'unknown')}\n"
        f"Dimensions: {width_px}x{height_px} px ({width_px/scale:.1f}x{height_px/scale:.1f} m)\n"
        f"Scale: {scale} px/m"
    )
    ax.text(0.02, 0.98, metadata_text, transform=ax.transAxes,
            fontsize=9, verticalalignment='top', bbox=dict(boxstyle='round',
            facecolor='wheat', alpha=0.5))

    plt.tight_layout()

    # Save or show
    if output_path:
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"✓ Visualization saved to {output_path}")
    else:
        plt.show()

    plt.close()

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Visualize generated site map")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent.parent.parent / "shared" / "site-maps" / "generated" / "sitemap-setup.json",
        help="Input sitemap JSON file"
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output PNG file (default: show plot)"
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: Sitemap file not found: {args.input}", file=sys.stderr)
        return 1

    visualize_sitemap(args.input, args.output)
    return 0

if __name__ == "__main__":
    sys.exit(main())
