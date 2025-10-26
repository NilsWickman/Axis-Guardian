"""
Frame buffer pooling to eliminate memory allocations per frame.

This module provides a thread-safe pool of pre-allocated numpy arrays
for frame storage, significantly reducing memory allocation overhead
during video processing.
"""

import threading
import queue
from typing import Tuple, Optional
import numpy as np
from loguru import logger


class FrameBufferPool:
    """
    Thread-safe pool of pre-allocated frame buffers.

    Reduces memory allocation overhead by reusing numpy arrays.
    Each buffer is pre-allocated with the specified shape and dtype.
    """

    def __init__(
        self,
        pool_size: int = 20,
        frame_shape: Tuple[int, int, int] = (720, 1280, 3),
        dtype: np.dtype = np.uint8
    ):
        """
        Initialize the frame buffer pool.

        Args:
            pool_size: Number of buffers to pre-allocate
            frame_shape: Shape of each buffer (height, width, channels)
            dtype: NumPy data type for buffers
        """
        self.pool_size = pool_size
        self.frame_shape = frame_shape
        self.dtype = dtype

        # Thread-safe queue for available buffers
        self._available = queue.Queue(maxsize=pool_size)

        # Track all buffers (for cleanup)
        self._all_buffers = []

        # Statistics
        self._lock = threading.Lock()
        self._total_acquired = 0
        self._total_released = 0
        self._allocation_count = 0
        self._high_water_mark = 0

        # Pre-allocate buffers
        self._preallocate()

        logger.info(
            f"FrameBufferPool initialized: {pool_size} buffers of shape {frame_shape}, "
            f"total memory: {self._calculate_pool_size_mb():.2f} MB"
        )

    def _preallocate(self):
        """Pre-allocate all buffers in the pool."""
        for _ in range(self.pool_size):
            buffer = np.zeros(self.frame_shape, dtype=self.dtype)
            self._all_buffers.append(buffer)
            self._available.put(buffer)

        self._allocation_count = self.pool_size

    def _calculate_pool_size_mb(self) -> float:
        """Calculate total pool size in megabytes."""
        bytes_per_buffer = np.prod(self.frame_shape) * np.dtype(self.dtype).itemsize
        total_bytes = bytes_per_buffer * self.pool_size
        return total_bytes / (1024 * 1024)

    def acquire(self, timeout: float = 1.0) -> Optional[np.ndarray]:
        """
        Acquire a buffer from the pool.

        Args:
            timeout: Maximum time to wait for an available buffer (seconds)

        Returns:
            A pre-allocated numpy array, or None if timeout occurs
        """
        try:
            buffer = self._available.get(timeout=timeout)

            with self._lock:
                self._total_acquired += 1
                current_usage = self.pool_size - self._available.qsize()
                self._high_water_mark = max(self._high_water_mark, current_usage)

            return buffer

        except queue.Empty:
            logger.warning(
                f"FrameBufferPool exhausted! Waited {timeout}s for buffer. "
                f"Consider increasing pool_size (current: {self.pool_size})"
            )
            return None

    def release(self, buffer: np.ndarray):
        """
        Release a buffer back to the pool.

        Args:
            buffer: The buffer to release
        """
        try:
            # Validate it's one of our buffers
            if buffer.shape != self.frame_shape or buffer.dtype != self.dtype:
                logger.warning(
                    f"Attempted to release buffer with wrong shape/dtype: "
                    f"{buffer.shape} {buffer.dtype} (expected {self.frame_shape} {self.dtype})"
                )
                return

            self._available.put_nowait(buffer)

            with self._lock:
                self._total_released += 1

        except queue.Full:
            # This shouldn't happen if acquire/release are balanced
            logger.error(
                f"FrameBufferPool full during release! This indicates a bug. "
                f"Acquired: {self._total_acquired}, Released: {self._total_released}"
            )

    def get_stats(self) -> dict:
        """
        Get pool statistics.

        Returns:
            Dictionary with pool usage statistics
        """
        with self._lock:
            available_count = self._available.qsize()
            in_use = self.pool_size - available_count

            return {
                'pool_size': self.pool_size,
                'available': available_count,
                'in_use': in_use,
                'total_acquired': self._total_acquired,
                'total_released': self._total_released,
                'allocation_count': self._allocation_count,
                'high_water_mark': self._high_water_mark,
                'pool_size_mb': self._calculate_pool_size_mb(),
                'utilization_percent': (in_use / self.pool_size) * 100 if self.pool_size > 0 else 0
            }

    def resize_pool(self, new_size: int):
        """
        Resize the pool (add or remove buffers).

        Note: This should only be called when all buffers are released.

        Args:
            new_size: New pool size
        """
        if new_size < 1:
            logger.error(f"Invalid pool size: {new_size}, must be >= 1")
            return

        with self._lock:
            current_available = self._available.qsize()

            if current_available != self.pool_size:
                logger.warning(
                    f"Cannot resize pool while buffers are in use "
                    f"({self.pool_size - current_available} buffers checked out)"
                )
                return

            # Clear existing buffers
            while not self._available.empty():
                try:
                    self._available.get_nowait()
                except queue.Empty:
                    break

            self._all_buffers.clear()

            # Update size and reallocate
            self.pool_size = new_size
            self._available = queue.Queue(maxsize=new_size)
            self._preallocate()

            logger.info(
                f"FrameBufferPool resized to {new_size} buffers "
                f"({self._calculate_pool_size_mb():.2f} MB)"
            )

    def cleanup(self):
        """Clean up all buffers (call on shutdown)."""
        with self._lock:
            # Clear the queue
            while not self._available.empty():
                try:
                    self._available.get_nowait()
                except queue.Empty:
                    break

            # Clear references to allow GC
            self._all_buffers.clear()

            logger.info(
                f"FrameBufferPool cleaned up. Total acquired: {self._total_acquired}, "
                f"released: {self._total_released}, high water mark: {self._high_water_mark}/{self.pool_size}"
            )


class GlobalFrameBufferPool:
    """
    Singleton wrapper for global frame buffer pool access.

    Provides a shared pool across all cameras to maximize buffer reuse.
    """

    _instance: Optional[FrameBufferPool] = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(
        cls,
        pool_size: int = 30,
        frame_shape: Tuple[int, int, int] = (720, 1280, 3)
    ) -> FrameBufferPool:
        """
        Get or create the global frame buffer pool instance.

        Args:
            pool_size: Number of buffers (only used on first call)
            frame_shape: Frame shape (only used on first call)

        Returns:
            The global FrameBufferPool instance
        """
        if cls._instance is None:
            with cls._lock:
                # Double-check pattern
                if cls._instance is None:
                    cls._instance = FrameBufferPool(
                        pool_size=pool_size,
                        frame_shape=frame_shape
                    )

        return cls._instance

    @classmethod
    def cleanup(cls):
        """Clean up the global pool (call on application shutdown)."""
        if cls._instance is not None:
            cls._instance.cleanup()
            cls._instance = None
