"""WebRTC signaling handler for camera emulator."""

import asyncio
import json
from pathlib import Path
from typing import Dict, Optional

from aiortc import RTCPeerConnection, RTCSessionDescription, RTCDataChannel, RTCConfiguration, RTCIceServer
from aiortc.contrib.media import MediaBlackhole
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger

from ..preprocessed import PlaybackSynchronizer
from .preprocessed_video_track import PreprocessedVideoTrack


class WebRTCSignalingHandler:
    """Handles WebRTC signaling and peer connections."""

    def __init__(
        self,
        camera_id: str,
        video_path: Path,
        metadata_path: Path,
        ice_servers: Optional[list] = None
    ):
        """Initialize WebRTC signaling handler.

        Args:
            camera_id: Camera identifier
            video_path: Path to preprocessed video file
            metadata_path: Path to .detections.json file
            ice_servers: List of ICE server configurations
        """
        self.camera_id = camera_id
        self.video_path = video_path
        self.metadata_path = metadata_path
        self.ice_servers = ice_servers or [
            {"urls": ["stun:stun.l.google.com:19302"]}
        ]

        # Active peer connections
        self.peer_connections: Dict[str, RTCPeerConnection] = {}

        # Playback synchronizer (shared across connections)
        self.synchronizer = PlaybackSynchronizer(
            video_path=video_path,
            metadata_path=metadata_path,
            fps=30.0,
            loop=True
        )

        logger.info(f"WebRTC signaling handler initialized for {camera_id}")

    async def handle_websocket(self, websocket: WebSocket, client_id: str):
        """Handle WebSocket connection for signaling.

        Args:
            websocket: FastAPI WebSocket connection
            client_id: Unique client identifier
        """
        await websocket.accept()
        logger.info(f"WebRTC signaling connection established: {client_id}")

        try:
            # Get the current event loop for thread-safe async operations
            loop = asyncio.get_running_loop()

            # Create peer connection with proper RTCConfiguration
            ice_servers = [RTCIceServer(urls=server["urls"]) for server in self.ice_servers]
            config = RTCConfiguration(iceServers=ice_servers)
            pc = RTCPeerConnection(configuration=config)
            self.peer_connections[client_id] = pc

            # Add video track
            video_track = PreprocessedVideoTrack(self.video_path, loop=True)
            pc.addTrack(video_track)

            # Create data channel for detection metadata
            data_channel = pc.createDataChannel("detections")

            @data_channel.on("open")
            def on_open():
                logger.info(f"Data channel opened for {client_id}")
                # Start sending detection metadata with the event loop reference
                self._start_metadata_sender(data_channel, loop)

            @pc.on("connectionstatechange")
            async def on_connectionstatechange():
                logger.info(f"Connection state: {pc.connectionState}")
                if pc.connectionState == "failed" or pc.connectionState == "closed":
                    await self._cleanup_connection(client_id)

            # Handle signaling messages
            while True:
                try:
                    message = await websocket.receive_text()
                    data = json.loads(message)

                    if data["type"] == "offer":
                        # Handle offer
                        await pc.setRemoteDescription(
                            RTCSessionDescription(
                                sdp=data["sdp"],
                                type=data["type"]
                            )
                        )

                        # Create answer
                        answer = await pc.createAnswer()
                        await pc.setLocalDescription(answer)

                        # Send answer
                        await websocket.send_text(json.dumps({
                            "type": pc.localDescription.type,
                            "sdp": pc.localDescription.sdp
                        }))

                    elif data["type"] == "ice-candidate":
                        # Handle ICE candidate
                        if data.get("candidate"):
                            await pc.addIceCandidate(data["candidate"])

                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected: {client_id}")
                    break
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON from {client_id}: {e}")
                    break
                except Exception as e:
                    logger.error(f"Error handling signaling message: {e}")
                    break

        except Exception as e:
            logger.error(f"WebRTC signaling error for {client_id}: {e}")

        finally:
            await self._cleanup_connection(client_id)

    def _start_metadata_sender(self, data_channel: RTCDataChannel, loop: asyncio.AbstractEventLoop):
        """Start sending detection metadata via data channel.

        Args:
            data_channel: WebRTC data channel
            loop: Event loop for thread-safe async operations
        """
        def send_metadata(frame_number: int, metadata):
            """Send metadata for current frame (called from background thread)."""
            if data_channel.readyState == "open":
                try:
                    message = {
                        "camera_id": self.camera_id,
                        "frame_number": frame_number,
                        "timestamp": metadata.timestamp,
                        "detection_count": metadata.detection_count,
                        "detections": metadata.detections
                    }
                    # Use call_soon_threadsafe to send from background thread
                    loop.call_soon_threadsafe(lambda: data_channel.send(json.dumps(message)))
                except Exception as e:
                    logger.error(f"Error sending metadata: {e}")

        # Subscribe to frame updates
        self.synchronizer.subscribe_frame(send_metadata)

        # Start playback if not already playing
        if not self.synchronizer.is_playing:
            self.synchronizer.start()

    async def _cleanup_connection(self, client_id: str):
        """Clean up peer connection.

        Args:
            client_id: Client identifier
        """
        if client_id in self.peer_connections:
            pc = self.peer_connections[client_id]
            await pc.close()
            del self.peer_connections[client_id]
            logger.info(f"Cleaned up connection: {client_id}")

    async def shutdown(self):
        """Shutdown signaling handler."""
        # Close all peer connections
        for client_id in list(self.peer_connections.keys()):
            await self._cleanup_connection(client_id)

        # Stop playback synchronizer
        self.synchronizer.stop()

        logger.info(f"WebRTC signaling handler shutdown for {self.camera_id}")
