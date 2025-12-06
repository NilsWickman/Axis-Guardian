#!/usr/bin/env python3
"""
Chart the number of detected people per frame from a detections JSON file.

Usage:
    python scripts/chart_detections.py [path_to_detections.json.gz]

If no path is provided, defaults to:
    shared/cameras/preprocessed/1080p/view-HC3-rendered.detections.json.gz
"""

import gzip
import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def load_detections(filepath: str) -> dict:
    """Load detections from a gzipped JSON file."""
    with gzip.open(filepath, 'rt', encoding='utf-8') as f:
        return json.load(f)


def extract_person_counts(data: dict) -> tuple[list[int], list[int]]:
    """Extract frame numbers and person counts from detection data."""
    frames = data.get('frames', [])
    total_frames = data.get('video_info', {}).get('total_frames', len(frames))

    # Create arrays for all frames (some may have no detections)
    frame_numbers = list(range(total_frames))
    person_counts = [0] * total_frames

    for frame in frames:
        frame_num = frame['frame_number']
        # Count only 'person' class detections
        count = sum(
            1 for det in frame.get('detections', [])
            if det.get('class_name') == 'person'
        )
        if frame_num < total_frames:
            person_counts[frame_num] = count

    return frame_numbers, person_counts


def create_chart(frame_numbers: list[int], person_counts: list[int],
                 video_info: dict, output_path: str | None = None):
    """Create and display/save the detection chart."""
    fig, ax = plt.subplots(figsize=(14, 6))

    # Plot the data
    ax.plot(frame_numbers, person_counts, linewidth=0.5, color='#2196F3', alpha=0.7)
    ax.fill_between(frame_numbers, person_counts, alpha=0.3, color='#2196F3')

    # Add smoothed line (rolling average)
    window = 30  # ~1 second at 30fps
    if len(person_counts) > window:
        smoothed = np.convolve(person_counts, np.ones(window)/window, mode='valid')
        smoothed_frames = frame_numbers[window//2:window//2 + len(smoothed)]
        ax.plot(smoothed_frames, smoothed, linewidth=2, color='#FF5722',
                label=f'Rolling avg ({window} frames)', alpha=0.9)

    # Configure axes
    ax.set_xlabel('Frame Number', fontsize=12)
    ax.set_ylabel('Number of People Detected', fontsize=12)
    ax.set_title('People Detection Count Over Time', fontsize=14, fontweight='bold')

    # Add secondary x-axis for time
    fps = video_info.get('fps', 30)
    ax2 = ax.twiny()
    ax2.set_xlim(ax.get_xlim()[0] / fps, ax.get_xlim()[1] / fps)
    ax2.set_xlabel('Time (seconds)', fontsize=12)

    # Statistics annotation
    stats_text = (
        f"Total Frames: {len(frame_numbers)}\n"
        f"FPS: {fps:.2f}\n"
        f"Duration: {video_info.get('duration_seconds', 0):.1f}s\n"
        f"Avg People: {np.mean(person_counts):.1f}\n"
        f"Max People: {max(person_counts)}\n"
        f"Min People: {min(person_counts)}"
    )
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=10,
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    ax.legend(loc='upper right')
    ax.grid(True, alpha=0.3)
    ax.set_ylim(bottom=0)

    plt.tight_layout()

    if output_path:
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"Chart saved to: {output_path}")

    plt.show()


def main():
    # Default path
    default_path = "shared/cameras/preprocessed/1080p/view-HC3-rendered.detections.json.gz"

    filepath = sys.argv[1] if len(sys.argv) > 1 else default_path

    if not Path(filepath).exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    print(f"Loading detections from: {filepath}")
    data = load_detections(filepath)

    video_info = data.get('video_info', {})
    print(f"Video: {video_info.get('source_file', 'unknown')}")
    print(f"Resolution: {video_info.get('width')}x{video_info.get('height')}")
    print(f"Duration: {video_info.get('duration_seconds', 0):.1f}s at {video_info.get('fps', 0):.2f} fps")

    frame_numbers, person_counts = extract_person_counts(data)

    print(f"\nDetection Statistics:")
    print(f"  Total frames: {len(frame_numbers)}")
    print(f"  Frames with detections: {sum(1 for c in person_counts if c > 0)}")
    print(f"  Average people per frame: {np.mean(person_counts):.2f}")
    print(f"  Max people in single frame: {max(person_counts)}")
    print(f"  Min people in single frame: {min(person_counts)}")

    # Output path (optional)
    output_path = Path(filepath).stem + "_chart.png"

    create_chart(frame_numbers, person_counts, video_info, output_path)


if __name__ == "__main__":
    main()
