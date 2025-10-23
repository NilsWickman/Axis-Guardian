"""WebRTC signaling server with detection data channel."""

import asyncio
import json
from typing import Dict, Set
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from loguru import logger

from config import settings
from detector import ObjectDetector
from video_track import DetectionVideoTrack


class WebRTCSignalingServer:
    """WebRTC signaling server for detection streaming."""

    def __init__(self):
        """Initialize signaling server."""
        self.app = web.Application()
        self.pcs: Set[RTCPeerConnection] = set()
        self.detector = ObjectDetector()

        # Configure routes
        self.app.router.add_post("/offer", self.handle_offer)
        self.app.router.add_get("/health", self.health_check)

        # ICE servers configuration
        ice_servers = [RTCIceServer(urls=[settings.stun_server])]

        if settings.turn_server:
            ice_servers.append(
                RTCIceServer(
                    urls=[settings.turn_server],
                    username=settings.turn_username,
                    credential=settings.turn_password,
                )
            )

        self.rtc_configuration = RTCConfiguration(iceServers=ice_servers)

        logger.info("WebRTC Signaling Server initialized")

    async def handle_offer(self, request: web.Request) -> web.Response:
        """
        Handle WebRTC offer from client.

        Expected POST body:
        {
            "sdp": "...",
            "type": "offer",
            "camera_id": "camera1"
        }
        """
        try:
            params = await request.json()
            offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
            camera_id = params.get("camera_id", "camera1")

            logger.info(f"Received offer for {camera_id}")

            # Create peer connection
            pc = RTCPeerConnection(configuration=self.rtc_configuration)
            self.pcs.add(pc)

            # Track cleanup on connection close
            @pc.on("connectionstatechange")
            async def on_connectionstatechange():
                logger.info(f"Connection state: {pc.connectionState}")
                if pc.connectionState == "failed" or pc.connectionState == "closed":
                    await pc.close()
                    self.pcs.discard(pc)

            # Create data channel for detections
            data_channel = pc.createDataChannel("detections")

            @data_channel.on("open")
            def on_open():
                logger.info(f"Data channel opened for {camera_id}")

            @data_channel.on("close")
            def on_close():
                logger.info(f"Data channel closed for {camera_id}")

            # Get camera RTSP URL
            camera_urls = {
                "camera1": settings.camera1_url,
                "camera2": settings.camera2_url,
                "camera3": settings.camera3_url,
            }
            rtsp_url = camera_urls.get(camera_id, settings.camera1_url)

            # Create detection video track
            video_track = DetectionVideoTrack(
                rtsp_url=rtsp_url,
                camera_id=camera_id,
                detector=self.detector,
                data_channel=data_channel,
            )

            # Add video track to peer connection
            pc.addTrack(video_track)

            # Set remote description (offer)
            await pc.setRemoteDescription(offer)

            # Create answer
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            logger.info(f"Created answer for {camera_id}")

            # Return answer to client
            return web.json_response(
                {
                    "sdp": pc.localDescription.sdp,
                    "type": pc.localDescription.type,
                }
            )

        except Exception as e:
            logger.error(f"Error handling offer: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def health_check(self, request: web.Request) -> web.Response:
        """Health check endpoint."""
        return web.json_response(
            {
                "status": "healthy",
                "active_connections": len(self.pcs),
                "camera_sources": {
                    "camera1": settings.camera1_url,
                    "camera2": settings.camera2_url,
                    "camera3": settings.camera3_url,
                },
            }
        )

    async def on_shutdown(self, app):
        """Cleanup on shutdown."""
        logger.info("Shutting down WebRTC server...")
        # Close all peer connections
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()

    def run(self):
        """Run the signaling server."""
        self.app.on_shutdown.append(self.on_shutdown)

        logger.info(f"Starting WebRTC Signaling Server on {settings.host}:{settings.port}")
        web.run_app(self.app, host=settings.host, port=settings.port)
