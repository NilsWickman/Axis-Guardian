"""
Camera Discovery Module

Automatically discovers available camera streams from MediaMTX API.
Provides dynamic camera configuration without manual URL management.
"""

import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass
import aiohttp
from loguru import logger


@dataclass
class DiscoveredCamera:
    """Represents a discovered camera stream."""
    path: str
    name: str
    source: str
    ready: bool
    readers: int
    tracks: List[str]
    bytes_sent: int
    rtsp_url: str


class CameraDiscovery:
    """
    Camera discovery service using MediaMTX API.

    Automatically finds available RTSP streams and maps them to camera configurations.
    """

    def __init__(
        self,
        mediamtx_api_url: str = "http://localhost:9997",
        polling_interval: float = 30.0,
    ):
        """
        Initialize camera discovery.

        Args:
            mediamtx_api_url: MediaMTX API base URL
            polling_interval: Time between discovery polls (seconds)
        """
        self.api_url = mediamtx_api_url.rstrip('/')
        self.polling_interval = polling_interval
        self._cameras: Dict[str, DiscoveredCamera] = {}
        self._running = False
        self._discovery_task: Optional[asyncio.Task] = None

        logger.info(f"Camera Discovery initialized: {self.api_url}")

    async def start(self):
        """Start automatic camera discovery."""
        if self._running:
            return

        self._running = True

        # Initial discovery
        await self.discover_cameras()

        # Start polling task
        self._discovery_task = asyncio.create_task(self._discovery_loop())
        logger.info(f"Camera discovery started (polling every {self.polling_interval}s)")

    async def stop(self):
        """Stop camera discovery."""
        self._running = False

        if self._discovery_task:
            self._discovery_task.cancel()
            try:
                await self._discovery_task
            except asyncio.CancelledError:
                pass

        logger.info("Camera discovery stopped")

    async def discover_cameras(self) -> Dict[str, DiscoveredCamera]:
        """
        Discover available cameras from MediaMTX.

        Returns:
            Dictionary mapping camera IDs to DiscoveredCamera objects
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Get list of paths from MediaMTX API
                async with session.get(
                    f"{self.api_url}/v3/paths/list",
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as response:
                    if response.status != 200:
                        logger.error(f"MediaMTX API returned status {response.status}")
                        return self._cameras

                    data = await response.json()

                    # Clear previous cameras
                    self._cameras.clear()

                    # Extract path information
                    paths = data.get("items", [])

                    for path_data in paths:
                        path_name = path_data.get("name", "")

                        # Skip non-camera paths
                        if not path_name.startswith("camera"):
                            continue

                        # Extract camera info
                        camera = DiscoveredCamera(
                            path=path_name,
                            name=self._generate_camera_name(path_name),
                            source=path_data.get("source", {}).get("type", "unknown"),
                            ready=path_data.get("ready", False),
                            readers=path_data.get("readers", 0),
                            tracks=self._extract_tracks(path_data),
                            bytes_sent=path_data.get("bytesSent", 0),
                            rtsp_url=self._build_rtsp_url(path_name),
                        )

                        self._cameras[path_name] = camera

                    logger.info(f"Discovered {len(self._cameras)} cameras: {list(self._cameras.keys())}")
                    return self._cameras

        except aiohttp.ClientError as e:
            logger.warning(f"Failed to connect to MediaMTX API: {e}")
            return self._cameras
        except Exception as e:
            logger.error(f"Error discovering cameras: {e}")
            return self._cameras

    def get_cameras(self) -> Dict[str, DiscoveredCamera]:
        """Get currently discovered cameras."""
        return self._cameras.copy()

    def get_camera(self, camera_id: str) -> Optional[DiscoveredCamera]:
        """Get specific camera by ID."""
        return self._cameras.get(camera_id)

    def get_camera_urls(self) -> Dict[str, str]:
        """Get mapping of camera IDs to RTSP URLs."""
        return {
            camera_id: camera.rtsp_url
            for camera_id, camera in self._cameras.items()
        }

    async def _discovery_loop(self):
        """Background task for periodic camera discovery."""
        while self._running:
            try:
                await asyncio.sleep(self.polling_interval)
                await self.discover_cameras()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in discovery loop: {e}")

    def _generate_camera_name(self, path: str) -> str:
        """
        Generate human-readable camera name from path.

        Args:
            path: Camera path (e.g., "camera1", "camera2")

        Returns:
            Human-readable name (e.g., "Camera 1", "Camera 2")
        """
        # Try to extract number from path
        if path.startswith("camera"):
            number = path.replace("camera", "")
            if number.isdigit():
                # Map known camera IDs to names (can be expanded)
                name_mapping = {
                    "1": "Auditorium HC3",
                    "2": "Auditorium HC4",
                    "3": "Auditorium IP2",
                    "4": "Auditorium IP5",
                }
                return name_mapping.get(number, f"Camera {number}")

        # Fallback to path name
        return path.replace("_", " ").title()

    def _extract_tracks(self, path_data: Dict) -> List[str]:
        """Extract track types from path data."""
        tracks = []
        source = path_data.get("source", {})

        if isinstance(source, dict):
            # Check for video/audio tracks
            if source.get("video"):
                tracks.append("video")
            if source.get("audio"):
                tracks.append("audio")

        return tracks

    def _build_rtsp_url(self, path: str, host: str = "localhost", port: int = 8554) -> str:
        """
        Build RTSP URL for camera path.

        Args:
            path: Camera path name
            host: MediaMTX RTSP host
            port: MediaMTX RTSP port

        Returns:
            Full RTSP URL
        """
        return f"rtsp://{host}:{port}/{path}"

    def get_statistics(self) -> Dict:
        """Get discovery statistics."""
        total_readers = sum(cam.readers for cam in self._cameras.values())
        ready_cameras = sum(1 for cam in self._cameras.values() if cam.ready)

        return {
            "total_cameras": len(self._cameras),
            "ready_cameras": ready_cameras,
            "total_readers": total_readers,
            "cameras": {
                camera_id: {
                    "name": cam.name,
                    "ready": cam.ready,
                    "readers": cam.readers,
                    "tracks": cam.tracks,
                }
                for camera_id, cam in self._cameras.items()
            },
        }


# Global discovery instance
_discovery: Optional[CameraDiscovery] = None


def get_discovery() -> CameraDiscovery:
    """Get or create the global camera discovery instance."""
    global _discovery
    if _discovery is None:
        from config import settings
        mediamtx_api = f"http://{getattr(settings, 'mediamtx_host', 'localhost')}:9997"
        _discovery = CameraDiscovery(mediamtx_api_url=mediamtx_api)
    return _discovery


async def init_discovery():
    """Initialize and start camera discovery."""
    discovery = get_discovery()
    await discovery.start()
    return discovery


async def shutdown_discovery():
    """Shutdown camera discovery."""
    global _discovery
    if _discovery is not None:
        await _discovery.stop()
        _discovery = None
