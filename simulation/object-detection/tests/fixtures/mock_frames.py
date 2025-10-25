"""Utilities for generating mock video frames for testing."""

import numpy as np
from typing import Tuple


def create_random_frame(
    width: int = 640,
    height: int = 480,
    channels: int = 3,
    seed: int = None
) -> np.ndarray:
    """Create a random frame with specified dimensions.

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        channels: Number of color channels (3 for RGB, 1 for grayscale)
        seed: Random seed for reproducibility

    Returns:
        numpy array of shape (height, width, channels)
    """
    if seed is not None:
        np.random.seed(seed)
    return np.random.randint(0, 255, (height, width, channels), dtype=np.uint8)


def create_solid_color_frame(
    color: Tuple[int, int, int],
    width: int = 640,
    height: int = 480
) -> np.ndarray:
    """Create a frame filled with a solid color.

    Args:
        color: RGB tuple (r, g, b) with values 0-255
        width: Frame width in pixels
        height: Frame height in pixels

    Returns:
        numpy array of shape (height, width, 3)
    """
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:, :] = color
    return frame


def create_gradient_frame(
    width: int = 640,
    height: int = 480,
    horizontal: bool = True
) -> np.ndarray:
    """Create a frame with a gradient pattern.

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        horizontal: If True, gradient is horizontal, else vertical

    Returns:
        numpy array of shape (height, width, 3)
    """
    frame = np.zeros((height, width, 3), dtype=np.uint8)

    if horizontal:
        gradient = np.linspace(0, 255, width, dtype=np.uint8)
        frame[:, :, 0] = gradient
        frame[:, :, 1] = gradient
        frame[:, :, 2] = gradient
    else:
        gradient = np.linspace(0, 255, height, dtype=np.uint8)
        frame[:, :, 0] = gradient[:, np.newaxis]
        frame[:, :, 1] = gradient[:, np.newaxis]
        frame[:, :, 2] = gradient[:, np.newaxis]

    return frame


def create_checkerboard_frame(
    width: int = 640,
    height: int = 480,
    square_size: int = 40
) -> np.ndarray:
    """Create a checkerboard pattern frame.

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        square_size: Size of each checkerboard square

    Returns:
        numpy array of shape (height, width, 3)
    """
    frame = np.zeros((height, width, 3), dtype=np.uint8)

    for y in range(0, height, square_size):
        for x in range(0, width, square_size):
            if ((x // square_size) + (y // square_size)) % 2 == 0:
                y_end = min(y + square_size, height)
                x_end = min(x + square_size, width)
                frame[y:y_end, x:x_end] = [255, 255, 255]

    return frame


def create_frame_with_box(
    width: int = 640,
    height: int = 480,
    box_color: Tuple[int, int, int] = (255, 0, 0),
    box_coords: Tuple[int, int, int, int] = (100, 100, 200, 200),
    background_color: Tuple[int, int, int] = (50, 50, 50)
) -> np.ndarray:
    """Create a frame with a colored box (useful for testing bounding box detection).

    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        box_color: RGB color of the box
        box_coords: Box coordinates (x1, y1, x2, y2)
        background_color: RGB background color

    Returns:
        numpy array of shape (height, width, 3)
    """
    frame = create_solid_color_frame(background_color, width, height)

    x1, y1, x2, y2 = box_coords
    # Ensure coordinates are within frame bounds
    x1 = max(0, min(x1, width))
    x2 = max(0, min(x2, width))
    y1 = max(0, min(y1, height))
    y2 = max(0, min(y2, height))

    frame[y1:y2, x1:x2] = box_color

    return frame


def create_corrupted_frame(
    corruption_type: str = "black",
    width: int = 640,
    height: int = 480
) -> np.ndarray:
    """Create a corrupted frame for testing error handling.

    Args:
        corruption_type: Type of corruption - "black", "solid_low_var", "noise"
        width: Frame width in pixels
        height: Frame height in pixels

    Returns:
        numpy array of corrupted frame
    """
    if corruption_type == "black":
        # All black frame (mean < 5)
        return np.zeros((height, width, 3), dtype=np.uint8)

    elif corruption_type == "solid_low_var":
        # Solid color with very low variance (std < 1)
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:, :] = [2, 2, 2]
        return frame

    elif corruption_type == "noise":
        # Very noisy frame
        return np.random.randint(0, 5, (height, width, 3), dtype=np.uint8)

    else:
        raise ValueError(f"Unknown corruption type: {corruption_type}")


def create_frame_sequence(
    num_frames: int = 10,
    width: int = 640,
    height: int = 480,
    pattern: str = "random"
) -> list:
    """Create a sequence of frames.

    Args:
        num_frames: Number of frames to generate
        width: Frame width in pixels
        height: Frame height in pixels
        pattern: Frame pattern - "random", "solid", "gradient", "checkerboard"

    Returns:
        List of numpy arrays
    """
    frames = []

    for i in range(num_frames):
        if pattern == "random":
            frame = create_random_frame(width, height, seed=i)
        elif pattern == "solid":
            # Cycle through different colors
            colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
            color = colors[i % len(colors)]
            frame = create_solid_color_frame(color, width, height)
        elif pattern == "gradient":
            frame = create_gradient_frame(width, height, horizontal=(i % 2 == 0))
        elif pattern == "checkerboard":
            frame = create_checkerboard_frame(width, height)
        else:
            raise ValueError(f"Unknown pattern: {pattern}")

        frames.append(frame)

    return frames
