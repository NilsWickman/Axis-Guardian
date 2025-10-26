"""
RTSP Connection Pool Manager

Manages persistent RTSP connections for efficient camera stream handling.
Provides connection pooling, health monitoring, and automatic reconnection.
"""

import asyncio
import time
from typing import Dict, Optional
from dataclasses import dataclass
import cv2
from loguru import logger


@dataclass
class RTSPConnection:
    """Represents a pooled RTSP connection."""
    camera_id: str
    rtsp_url: str
    capture: cv2.VideoCapture
    last_used: float
    last_health_check: float
    consecutive_failures: int = 0
    is_healthy: bool = True


class RTSPConnectionPool:
    """
    RTSP Connection Pool for efficient camera stream management.

    Features:
    - Connection reuse across multiple requests
    - Health monitoring with automatic reconnection
    - Idle connection cleanup
    - Connection keepalive
    """

    def __init__(
        self,
        max_connections: int = 50,  # Maximum total connections
        max_idle_time: float = 300.0,  # 5 minutes
        health_check_interval: float = 30.0,  # 30 seconds
        max_failures_before_reconnect: int = 3,
    ):
        """
        Initialize RTSP connection pool.

        Args:
            max_connections: Maximum number of concurrent connections
            max_idle_time: Maximum time (seconds) a connection can be idle before cleanup
            health_check_interval: Time between health checks (seconds)
            max_failures_before_reconnect: Failures before forcing reconnection
        """
        self._pool: Dict[str, RTSPConnection] = {}
        self._max_connections = max_connections
        self._max_idle_time = max_idle_time
        self._health_check_interval = health_check_interval
        self._max_failures = max_failures_before_reconnect
        self._cleanup_task: Optional[asyncio.Task] = None
        self._running = False

        # Semaphore to limit concurrent connections
        self._semaphore = asyncio.Semaphore(max_connections)

        # Connection statistics
        self._total_created = 0
        self._total_closed = 0
        self._total_health_checks = 0
        self._total_health_failures = 0

        logger.info(
            f"RTSP Connection Pool initialized with max_connections={max_connections}"
        )

    async def start(self):
        """Start the connection pool background tasks."""
        if self._running:
            return

        self._running = True
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("RTSP Connection Pool started")

    async def stop(self):
        """Stop the connection pool and close all connections."""
        self._running = False

        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Close all connections
        for camera_id in list(self._pool.keys()):
            await self._close_connection(camera_id)

        logger.info("RTSP Connection Pool stopped")

    async def get_connection(
        self,
        camera_id: str,
        rtsp_url: str,
        buffer_size: int = 3,
    ) -> Optional[cv2.VideoCapture]:
        """
        Get an RTSP connection from the pool (creates if doesn't exist).

        Args:
            camera_id: Unique camera identifier
            rtsp_url: RTSP stream URL
            buffer_size: Buffer size for the connection

        Returns:
            VideoCapture instance or None if connection fails
        """
        current_time = time.time()

        # Check if we have an existing connection
        if camera_id in self._pool:
            conn = self._pool[camera_id]

            # Verify connection is still healthy
            if conn.is_healthy and conn.capture.isOpened():
                conn.last_used = current_time

                # Perform health check if needed
                if current_time - conn.last_health_check > self._health_check_interval:
                    is_healthy = await self._health_check(conn)
                    if not is_healthy:
                        logger.warning(f"[{camera_id}] Connection unhealthy, reconnecting...")
                        await self._close_connection(camera_id)
                    else:
                        return conn.capture
            else:
                # Connection is unhealthy, close and recreate
                await self._close_connection(camera_id)

        # Enforce connection limit using semaphore
        async with self._semaphore:
            # Double-check we don't have the connection (might have been created while waiting)
            if camera_id in self._pool:
                return self._pool[camera_id].capture

            # Create new connection
            return await self._create_connection(camera_id, rtsp_url, buffer_size)

    async def _create_connection(
        self,
        camera_id: str,
        rtsp_url: str,
        buffer_size: int,
    ) -> Optional[cv2.VideoCapture]:
        """Create a new RTSP connection."""
        try:
            self._total_created += 1
            logger.info(f"[{camera_id}] Creating new RTSP connection: {rtsp_url}")

            # Create capture with optimized settings
            cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)

            # Configure connection
            cap.set(cv2.CAP_PROP_BUFFERSIZE, buffer_size)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)  # 5 second timeout
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000)  # 3 second read timeout

            # Try hardware acceleration
            try:
                cap.set(cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY)
            except Exception:
                pass  # Not all systems support this

            if not cap.isOpened():
                logger.error(f"[{camera_id}] Failed to open RTSP connection")
                return None

            # Store in pool
            current_time = time.time()
            self._pool[camera_id] = RTSPConnection(
                camera_id=camera_id,
                rtsp_url=rtsp_url,
                capture=cap,
                last_used=current_time,
                last_health_check=current_time,
                consecutive_failures=0,
                is_healthy=True,
            )

            logger.info(f"[{camera_id}] RTSP connection established (total: {len(self._pool)}/{self._max_connections})")
            return cap

        except Exception as e:
            logger.error(f"[{camera_id}] Error creating RTSP connection: {e}")
            return None

    async def _health_check(self, conn: RTSPConnection) -> bool:
        """
        Perform lightweight health check on a connection.

        Instead of reading a full frame, just check if the connection is still open.
        This is much faster and doesn't waste bandwidth.

        Args:
            conn: Connection to check

        Returns:
            True if healthy, False otherwise
        """
        try:
            self._total_health_checks += 1
            current_time = time.time()
            conn.last_health_check = current_time

            # Lightweight check: just verify the capture is still opened
            # This doesn't read a frame, so it's very fast
            if conn.capture.isOpened():
                conn.consecutive_failures = 0
                conn.is_healthy = True
                return True
            else:
                conn.consecutive_failures += 1
                self._total_health_failures += 1

                if conn.consecutive_failures >= self._max_failures:
                    conn.is_healthy = False
                    logger.warning(
                        f"[{conn.camera_id}] Health check failed "
                        f"({conn.consecutive_failures} consecutive failures)"
                    )
                    return False

                return True  # Still give it a chance

        except Exception as e:
            logger.error(f"[{conn.camera_id}] Health check error: {e}")
            conn.consecutive_failures += 1
            conn.is_healthy = False
            self._total_health_failures += 1
            return False

    async def _close_connection(self, camera_id: str):
        """Close and remove a connection from the pool."""
        if camera_id in self._pool:
            conn = self._pool[camera_id]
            try:
                conn.capture.release()
                self._total_closed += 1
                logger.info(f"[{camera_id}] RTSP connection closed (remaining: {len(self._pool)-1}/{self._max_connections})")
            except Exception as e:
                logger.error(f"[{camera_id}] Error closing connection: {e}")
            finally:
                del self._pool[camera_id]

    async def _cleanup_loop(self):
        """Background task to clean up idle connections."""
        while self._running:
            try:
                await asyncio.sleep(60)  # Check every minute

                current_time = time.time()
                idle_connections = []

                for camera_id, conn in self._pool.items():
                    idle_time = current_time - conn.last_used

                    if idle_time > self._max_idle_time:
                        idle_connections.append(camera_id)

                # Close idle connections
                for camera_id in idle_connections:
                    logger.info(
                        f"[{camera_id}] Closing idle connection "
                        f"(idle for {self._max_idle_time}s)"
                    )
                    await self._close_connection(camera_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")

    def get_pool_stats(self) -> Dict:
        """Get statistics about the connection pool."""
        current_time = time.time()

        stats = {
            "total_connections": len(self._pool),
            "max_connections": self._max_connections,
            "healthy_connections": sum(1 for c in self._pool.values() if c.is_healthy),
            "total_created": self._total_created,
            "total_closed": self._total_closed,
            "total_health_checks": self._total_health_checks,
            "total_health_failures": self._total_health_failures,
            "health_check_success_rate": (
                (self._total_health_checks - self._total_health_failures) / self._total_health_checks * 100
                if self._total_health_checks > 0 else 100.0
            ),
            "connections": {}
        }

        for camera_id, conn in self._pool.items():
            stats["connections"][camera_id] = {
                "is_healthy": conn.is_healthy,
                "idle_time": current_time - conn.last_used,
                "consecutive_failures": conn.consecutive_failures,
                "last_health_check": current_time - conn.last_health_check,
            }

        return stats


# Global connection pool instance
_pool: Optional[RTSPConnectionPool] = None


def get_pool() -> RTSPConnectionPool:
    """Get or create the global connection pool."""
    global _pool
    if _pool is None:
        _pool = RTSPConnectionPool()
    return _pool


async def init_pool():
    """Initialize and start the global connection pool."""
    pool = get_pool()
    await pool.start()
    return pool


async def shutdown_pool():
    """Shutdown the global connection pool."""
    global _pool
    if _pool is not None:
        await _pool.stop()
        _pool = None
