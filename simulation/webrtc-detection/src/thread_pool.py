"""
Shared thread pool for camera processing.

Provides a global thread pool shared across all cameras instead of
creating a separate ThreadPoolExecutor per camera. This reduces
resource overhead when managing many cameras.
"""

import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from loguru import logger


class SharedThreadPool:
    """
    Singleton thread pool shared across all cameras.

    Benefits over per-camera pools:
    - Reduced resource overhead (threads, memory)
    - Better CPU utilization across cameras
    - Automatic load balancing
    - Easier to monitor and tune
    """

    _instance: Optional[ThreadPoolExecutor] = None
    _lock = threading.Lock()
    _max_workers: int = 4

    @classmethod
    def get_instance(cls, max_workers: int = None) -> ThreadPoolExecutor:
        """
        Get or create the global thread pool instance.

        Args:
            max_workers: Maximum worker threads (only used on first call)

        Returns:
            The global ThreadPoolExecutor instance
        """
        if cls._instance is None:
            with cls._lock:
                # Double-check pattern
                if cls._instance is None:
                    # Default to 4 workers (1 per typical camera)
                    # Can be increased for more cameras
                    if max_workers is None:
                        max_workers = cls._max_workers

                    cls._max_workers = max_workers
                    cls._instance = ThreadPoolExecutor(
                        max_workers=max_workers,
                        thread_name_prefix="camera-worker"
                    )

                    logger.info(
                        f"Shared thread pool initialized with {max_workers} workers "
                        f"for all cameras"
                    )

        return cls._instance

    @classmethod
    def shutdown(cls, wait: bool = True):
        """
        Shutdown the global thread pool.

        Args:
            wait: If True, wait for pending tasks to complete
        """
        if cls._instance is not None:
            with cls._lock:
                if cls._instance is not None:
                    logger.info(f"Shutting down shared thread pool (wait={wait})...")
                    cls._instance.shutdown(wait=wait, cancel_futures=not wait)
                    cls._instance = None
                    logger.info("Shared thread pool shut down successfully")

    @classmethod
    def resize_pool(cls, new_size: int):
        """
        Resize the thread pool (requires shutdown and recreation).

        Note: This will cancel all pending tasks!

        Args:
            new_size: New number of worker threads
        """
        logger.warning(
            f"Resizing thread pool from {cls._max_workers} to {new_size} workers. "
            f"This will cancel pending tasks!"
        )

        cls.shutdown(wait=False)
        cls._max_workers = new_size
        cls.get_instance(max_workers=new_size)


def get_shared_pool(max_workers: int = None) -> ThreadPoolExecutor:
    """
    Convenience function to get the shared thread pool.

    Args:
        max_workers: Maximum worker threads (only used on first call)

    Returns:
        The global ThreadPoolExecutor instance
    """
    return SharedThreadPool.get_instance(max_workers)


def shutdown_shared_pool(wait: bool = True):
    """
    Convenience function to shutdown the shared thread pool.

    Args:
        wait: If True, wait for pending tasks to complete
    """
    SharedThreadPool.shutdown(wait)
