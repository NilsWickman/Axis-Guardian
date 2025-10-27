"""Render 2D site map visualization."""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from typing import List, Optional, Tuple
from pathlib import Path

from ..fusion.occupancy_grid import OccupancyGrid
from ..fusion.wall_extraction import WallSegment


class SiteMapRenderer:
    """Render 2D site map from occupancy grid and walls."""

    def __init__(
        self,
        occupancy_grid: OccupancyGrid,
        walls: List[WallSegment],
        camera_positions: Optional[List[Tuple[float, float, str]]] = None
    ):
        """
        Initialize renderer.

        Args:
            occupancy_grid: Occupancy grid
            walls: List of wall segments
            camera_positions: List of (x, y, camera_id) tuples
        """
        self.occupancy_grid = occupancy_grid
        self.walls = walls
        self.camera_positions = camera_positions or []

    def render(
        self,
        output_path: Optional[Path] = None,
        figsize: Tuple[int, int] = (12, 10),
        dpi: int = 150,
        show_grid: bool = True,
        show_walls: bool = True,
        show_cameras: bool = True,
        title: str = "Generated Site Map (Structure from Motion)"
    ) -> plt.Figure:
        """
        Render site map.

        Args:
            output_path: Path to save image (or None to just return figure)
            figsize: Figure size (width, height) in inches
            dpi: Image resolution
            show_grid: Show occupancy grid
            show_walls: Show wall segments
            show_cameras: Show camera positions
            title: Plot title

        Returns:
            Matplotlib figure
        """
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi)

        # Get grid dimensions in meters
        height_m, width_m = self.occupancy_grid.height_m, self.occupancy_grid.width_m
        origin_x, origin_y = self.occupancy_grid.origin

        # Set axis limits
        ax.set_xlim(origin_x, origin_x + width_m)
        ax.set_ylim(origin_y, origin_y + height_m)
        ax.set_aspect('equal')

        # Show occupancy grid if requested
        if show_grid:
            self._render_occupancy_grid(ax)

        # Show walls if requested
        if show_walls:
            self._render_walls(ax)

        # Show cameras if requested
        if show_cameras:
            self._render_cameras(ax)

        # Labels and title
        ax.set_xlabel('X (meters)', fontsize=12)
        ax.set_ylabel('Y (meters)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')

        # Grid
        ax.grid(True, alpha=0.3, linestyle='--')

        # Legend
        self._add_legend(ax, show_grid, show_walls, show_cameras)

        # Tight layout
        plt.tight_layout()

        # Save if requested
        if output_path is not None:
            plt.savefig(output_path, dpi=dpi, bbox_inches='tight')
            print(f"Site map saved to: {output_path}")

        return fig

    def _render_occupancy_grid(self, ax):
        """Render occupancy grid as background."""
        grid = self.occupancy_grid.grid
        origin_x, origin_y = self.occupancy_grid.origin
        resolution = self.occupancy_grid.resolution

        # Create extent for imshow
        extent = [
            origin_x,
            origin_x + self.occupancy_grid.width_m,
            origin_y,
            origin_y + self.occupancy_grid.height_m
        ]

        # Flip grid vertically for correct display
        grid_display = np.flipud(grid)

        # Create colormap: -1=gray (unknown), 0=white (free), 1=black (occupied)
        import matplotlib.colors as mcolors
        cmap = mcolors.ListedColormap(['lightgray', 'white', 'darkred'])
        bounds = [-1.5, -0.5, 0.5, 1.5]
        norm = mcolors.BoundaryNorm(bounds, cmap.N)

        ax.imshow(
            grid_display,
            extent=extent,
            cmap=cmap,
            norm=norm,
            alpha=0.4,
            interpolation='nearest'
        )

    def _render_walls(self, ax):
        """Render wall segments."""
        for wall in self.walls:
            # Color based on confidence
            if wall.confidence >= 0.7:
                color = 'darkred'
                linewidth = 3
                alpha = 1.0
            elif wall.confidence >= 0.5:
                color = 'red'
                linewidth = 2
                alpha = 0.8
            else:
                color = 'orange'
                linewidth = 1.5
                alpha = 0.6

            ax.plot(
                [wall.start[0], wall.end[0]],
                [wall.start[1], wall.end[1]],
                color=color,
                linewidth=linewidth,
                alpha=alpha,
                solid_capstyle='round'
            )

    def _render_cameras(self, ax):
        """Render camera positions."""
        for x, y, camera_id in self.camera_positions:
            # Draw camera marker
            ax.plot(x, y, 'o', color='blue', markersize=12, markeredgecolor='darkblue', markeredgewidth=2)

            # Draw camera label
            ax.text(
                x, y + 0.3,
                camera_id,
                fontsize=9,
                ha='center',
                va='bottom',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='lightblue', edgecolor='blue', alpha=0.8)
            )

    def _add_legend(self, ax, show_grid: bool, show_walls: bool, show_cameras: bool):
        """Add legend to plot."""
        legend_elements = []

        if show_grid:
            from matplotlib.patches import Patch
            legend_elements.append(Patch(facecolor='white', edgecolor='black', label='Free Space'))
            legend_elements.append(Patch(facecolor='darkred', edgecolor='black', alpha=0.4, label='Occupied'))

        if show_walls:
            from matplotlib.lines import Line2D
            legend_elements.append(Line2D([0], [0], color='darkred', linewidth=3, label='Walls (high conf.)'))

        if show_cameras:
            legend_elements.append(Line2D([0], [0], marker='o', color='w', markerfacecolor='blue',
                                          markersize=10, label='Cameras'))

        if legend_elements:
            ax.legend(handles=legend_elements, loc='upper right', fontsize=10)

    def render_simple(self, output_path: Path, dpi: int = 150):
        """
        Render simple site map (walls and cameras only).

        Args:
            output_path: Path to save image
            dpi: Image resolution
        """
        return self.render(
            output_path=output_path,
            dpi=dpi,
            show_grid=False,
            show_walls=True,
            show_cameras=True,
            title="Site Map (Walls and Cameras)"
        )
