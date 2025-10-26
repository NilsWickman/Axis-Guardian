"""2D site map rendering."""

import numpy as np
import cv2
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon as MplPolygon
from matplotlib.lines import Line2D
from typing import List, Tuple, Optional
from pathlib import Path

from fusion.occupancy_grid import OccupancyGrid
from fusion.wall_extraction import WallSegment
from core.camera import CameraConfig


class SiteMapRenderer:
    """Render site map to various formats."""

    def __init__(self, grid: OccupancyGrid,
                 walls: List[WallSegment],
                 cameras: List[CameraConfig]):
        """
        Initialize renderer.

        Args:
            grid: Occupancy grid
            walls: Extracted wall segments
            cameras: Camera configurations
        """
        self.grid = grid
        self.walls = walls
        self.cameras = cameras

    def render_to_image(self, output_path: Path,
                       dpi: int = 150,
                       show_occupancy: bool = True,
                       show_walls: bool = True,
                       show_cameras: bool = True,
                       show_camera_fov: bool = True) -> np.ndarray:
        """
        Render site map to image file.

        Args:
            output_path: Output file path
            dpi: Image resolution
            show_occupancy: Show occupancy grid
            show_walls: Show extracted walls
            show_cameras: Show camera positions
            show_camera_fov: Show camera field of view

        Returns:
            Rendered image as numpy array
        """
        # Create figure
        min_point, max_point = self.grid.get_bounds()
        width = max_point[0] - min_point[0]
        height = max_point[1] - min_point[1]

        # Figure size in inches (maintain aspect ratio)
        fig_width = 12
        fig_height = fig_width * (height / width)

        fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=dpi)

        # Set limits and aspect
        ax.set_xlim(min_point[0], max_point[0])
        ax.set_ylim(min_point[1], max_point[1])
        ax.set_aspect('equal')

        # Render layers
        if show_occupancy:
            self._render_occupancy(ax)

        if show_walls:
            self._render_walls(ax)

        if show_cameras:
            self._render_cameras(ax, show_fov=show_camera_fov)

        # Styling
        ax.set_xlabel('X (meters)')
        ax.set_ylabel('Y (meters)')
        ax.set_title('Generated Site Map', fontsize=16, fontweight='bold')
        ax.grid(True, alpha=0.3, linestyle='--')

        # Legend
        self._add_legend(ax, show_occupancy, show_walls, show_cameras)

        # Save
        plt.tight_layout()
        plt.savefig(output_path, dpi=dpi, bbox_inches='tight')

        # Convert to numpy array
        fig.canvas.draw()
        image = np.frombuffer(fig.canvas.buffer_rgba(), dtype=np.uint8)
        image = image.reshape(fig.canvas.get_width_height()[::-1] + (4,))
        image = image[:, :, :3]  # Convert RGBA to RGB

        plt.close(fig)

        return image

    def _render_occupancy(self, ax):
        """Render occupancy grid."""
        # Get probability map
        prob_map = self.grid.probability.copy()
        confidence_map = self.grid.confidence

        # Mask low confidence areas
        prob_map[confidence_map < 0.3] = 0.5  # Gray for unknown

        # Create colored map
        # Free space (prob < 0.3): Light green
        # Occupied (prob > 0.7): Dark red
        # Unknown (0.3 <= prob <= 0.7): Gray

        colored_map = np.zeros((*prob_map.shape, 4))  # RGBA

        # Free space
        free_mask = prob_map < 0.3
        colored_map[free_mask] = [0.8, 1.0, 0.8, 0.5]  # Light green, semi-transparent

        # Occupied
        occupied_mask = prob_map > 0.7
        intensity = (prob_map[occupied_mask] - 0.7) / 0.3  # 0 to 1
        colored_map[occupied_mask, 0] = 0.8  # Red
        colored_map[occupied_mask, 1] = 0.2  # Green
        colored_map[occupied_mask, 2] = 0.2  # Blue
        colored_map[occupied_mask, 3] = 0.3 + 0.5 * intensity  # Alpha

        # Unknown
        unknown_mask = ~(free_mask | occupied_mask)
        colored_map[unknown_mask] = [0.7, 0.7, 0.7, 0.3]  # Gray

        # Plot
        min_point, max_point = self.grid.get_bounds()
        extent = [min_point[0], max_point[0], min_point[1], max_point[1]]

        ax.imshow(colored_map, origin='lower', extent=extent, aspect='auto')

    def _render_walls(self, ax):
        """Render wall segments."""
        for wall in self.walls:
            # Color by confidence
            confidence = wall.confidence
            color = plt.cm.Reds(0.4 + 0.6 * confidence)  # Darker = more confident

            ax.plot(
                [wall.start[0], wall.end[0]],
                [wall.start[1], wall.end[1]],
                color=color,
                linewidth=3,
                solid_capstyle='round',
                zorder=10
            )

    def _render_cameras(self, ax, show_fov: bool = True):
        """Render camera positions and FOV."""
        from core.coordinate_system import WorldCoordinateSystem

        # Create world coordinate system
        world = WorldCoordinateSystem(self.cameras)

        for camera in self.cameras:
            # Camera position
            pos = world.get_camera_world_position(camera)

            # Plot camera
            ax.plot(pos[0], pos[1], 'bo', markersize=10, zorder=20,
                   markeredgecolor='white', markeredgewidth=2)

            # Camera label
            ax.text(pos[0], pos[1] + 0.5, camera.id,
                   ha='center', va='bottom', fontsize=9,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                            edgecolor='blue', alpha=0.8),
                   zorder=21)

            # FOV cone
            if show_fov:
                self._render_camera_fov(ax, camera, pos, world)

    def _render_camera_fov(self, ax, camera: CameraConfig,
                          pos: np.ndarray, world):
        """Render camera field of view cone."""
        # Get camera orientation
        pan_rad = np.deg2rad(camera.orientation.pan)
        fov_h = camera.intrinsics.fov[0]  # Horizontal FOV in degrees
        fov_h_rad = np.deg2rad(fov_h)

        # Camera look direction (in world XY plane)
        look_dir = np.array([np.cos(pan_rad), np.sin(pan_rad)])

        # FOV cone angles
        angle_left = pan_rad + fov_h_rad / 2
        angle_right = pan_rad - fov_h_rad / 2

        # FOV range (arbitrary visual length)
        fov_range = 15.0  # meters

        # Cone points
        left_dir = np.array([np.cos(angle_left), np.sin(angle_left)])
        right_dir = np.array([np.cos(angle_right), np.sin(angle_right)])

        left_point = pos[:2] + left_dir * fov_range
        right_point = pos[:2] + right_dir * fov_range

        # Draw cone
        cone_points = np.array([
            pos[:2],
            left_point,
            right_point
        ])

        polygon = MplPolygon(cone_points, closed=True,
                           facecolor='blue', alpha=0.1,
                           edgecolor='blue', linewidth=1,
                           linestyle='--', zorder=5)
        ax.add_patch(polygon)

    def _add_legend(self, ax, show_occupancy: bool,
                   show_walls: bool, show_cameras: bool):
        """Add legend to plot."""
        legend_elements = []

        if show_occupancy:
            legend_elements.extend([
                Line2D([0], [0], marker='s', color='w',
                      markerfacecolor=(0.8, 1.0, 0.8), markersize=10,
                      label='Free Space'),
                Line2D([0], [0], marker='s', color='w',
                      markerfacecolor=(0.8, 0.2, 0.2), markersize=10,
                      label='Occupied'),
            ])

        if show_walls:
            legend_elements.append(
                Line2D([0], [0], color='red', linewidth=3,
                      label='Walls')
            )

        if show_cameras:
            legend_elements.extend([
                Line2D([0], [0], marker='o', color='w',
                      markerfacecolor='blue', markersize=10,
                      markeredgecolor='white', markeredgewidth=2,
                      label='Cameras'),
                Line2D([0], [0], color='blue', linewidth=1,
                      linestyle='--', label='Camera FOV')
            ])

        if legend_elements:
            ax.legend(handles=legend_elements, loc='upper right',
                     framealpha=0.9)

    def render_top_down_view(self, output_path: Path,
                            pixels_per_meter: int = 50) -> np.ndarray:
        """
        Render simple top-down view for computer vision applications.

        Args:
            output_path: Output file path
            pixels_per_meter: Resolution in pixels per meter

        Returns:
            Rendered image (grayscale)
        """
        min_point, max_point = self.grid.get_bounds()
        width = max_point[0] - min_point[0]
        height = max_point[1] - min_point[1]

        img_width = int(width * pixels_per_meter)
        img_height = int(height * pixels_per_meter)

        # Create image
        image = np.ones((img_height, img_width), dtype=np.uint8) * 128  # Gray

        # Draw free space (white)
        free_space = self.grid.get_free_space_map(threshold=0.3, min_confidence=0.3)
        for row in range(free_space.shape[0]):
            for col in range(free_space.shape[1]):
                if free_space[row, col]:
                    # Map to image coordinates
                    world_point = self.grid.grid_to_world(np.array([[col, row]]))[0]
                    img_x = int((world_point[0] - min_point[0]) * pixels_per_meter)
                    img_y = int((world_point[1] - min_point[1]) * pixels_per_meter)

                    if 0 <= img_x < img_width and 0 <= img_y < img_height:
                        # Flip Y for image coordinates
                        image[img_height - 1 - img_y, img_x] = 255

        # Draw walls (black)
        for wall in self.walls:
            # Convert to image coordinates
            start_x = int((wall.start[0] - min_point[0]) * pixels_per_meter)
            start_y = int((wall.start[1] - min_point[1]) * pixels_per_meter)
            end_x = int((wall.end[0] - min_point[0]) * pixels_per_meter)
            end_y = int((wall.end[1] - min_point[1]) * pixels_per_meter)

            # Flip Y
            start_y = img_height - 1 - start_y
            end_y = img_height - 1 - end_y

            cv2.line(image, (start_x, start_y), (end_x, end_y),
                    color=0, thickness=3)

        # Save
        cv2.imwrite(str(output_path), image)

        return image
