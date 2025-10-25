"""WebRTC signaling server with detection data channel."""

import asyncio
import json
from typing import Dict, Set
from aiohttp import web
import aiohttp_cors
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from loguru import logger

from config import settings
from detector import ObjectDetector
from video_track import DetectionVideoTrack
from video_track_precomputed import find_detection_json_for_rtsp
from metrics import metrics


class WebRTCSignalingServer:
    """WebRTC signaling server for detection streaming."""

    def __init__(self):
        """Initialize signaling server."""
        self.app = web.Application()
        self.pcs: Set[RTCPeerConnection] = set()
        self.detector = ObjectDetector()

        # Configure CORS
        cors = aiohttp_cors.setup(self.app, defaults={
            "http://localhost:5173": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods=["GET", "POST", "OPTIONS"]
            )
        })

        # Configure routes
        offer_route = self.app.router.add_post("/offer", self.handle_offer)
        health_route = self.app.router.add_get("/health", self.health_check)
        metrics_route = self.app.router.add_get("/metrics", self.metrics_endpoint)

        # Add CORS to routes
        cors.add(offer_route)
        cors.add(health_route)
        cors.add(metrics_route)

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

        logger.info("WebRTC Signaling Server initialized with CORS enabled")

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

            # Set remote description (offer) FIRST
            await pc.setRemoteDescription(offer)

            # Get camera RTSP URL
            camera_urls = {
                "camera1": settings.camera1_url,
                "camera2": settings.camera2_url,
                "camera3": settings.camera3_url,
                "camera4": settings.camera4_url,
            }
            rtsp_url = camera_urls.get(camera_id, settings.camera1_url)

            # Try to find pre-computed detections JSON file
            detections_json = find_detection_json_for_rtsp(rtsp_url, camera_id)

            # Create detection video track (data channel will be set when received from client)
            # If pre-computed detections are available, they will be loaded automatically
            video_track = DetectionVideoTrack(
                rtsp_url=rtsp_url,
                camera_id=camera_id,
                detector=self.detector,
                data_channel=None,
                precomputed_detections_path=detections_json,
            )

            # Handle data channel from client
            @pc.on("datachannel")
            def on_datachannel(channel):
                logger.info(f"Data channel received: {channel.label}")
                video_track.data_channel = channel

                @channel.on("open")
                def on_open():
                    logger.info(f"Data channel opened for {camera_id}")

                @channel.on("close")
                def on_close():
                    logger.info(f"Data channel closed for {camera_id}")

            # Find the recvonly video transceiver created by the client
            # and add our sending track to it
            for transceiver in pc.getTransceivers():
                if transceiver.kind == "video" and transceiver.direction == "recvonly":
                    # Change direction to sendrecv so we can send video
                    transceiver.direction = "sendrecv"
                    # Replace the track
                    if transceiver.sender:
                        transceiver.sender.replaceTrack(video_track)
                    logger.info(f"Added video track to transceiver for {camera_id}, direction: {transceiver.direction}")
                    break
            else:
                # Fallback: add track if no suitable transceiver found
                pc.addTrack(video_track)
                logger.info(f"Added new video track for {camera_id}")

            # Create answer with codec preferences
            answer = await pc.createAnswer()

            # Modify SDP for low-latency H.264
            sdp_lines = answer.sdp.split('\r\n')
            modified_sdp = []

            for line in sdp_lines:
                modified_sdp.append(line)

                # Add H.264 baseline profile and low-latency parameters
                if line.startswith('a=rtpmap:') and 'H264' in line:
                    # Extract payload type
                    payload_type = line.split(':')[1].split(' ')[0]

                    # Add format parameters for low-latency streaming
                    modified_sdp.append(
                        f'a=fmtp:{payload_type} '
                        'level-asymmetry-allowed=1;'
                        'packetization-mode=1;'
                        'profile-level-id=42e01f'  # Baseline profile, level 3.1
                    )

                    # Add bitrate constraints (1-3 Mbps)
                    modified_sdp.append(f'a=fmtp:{payload_type} x-google-min-bitrate=1000')
                    modified_sdp.append(f'a=fmtp:{payload_type} x-google-max-bitrate=3000')
                    modified_sdp.append(f'a=fmtp:{payload_type} x-google-start-bitrate=1500')

            answer.sdp = '\r\n'.join(modified_sdp)

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
            logger.exception(f"Error handling offer for {camera_id}: {e}")
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
                    "camera4": settings.camera4_url,
                },
            }
        )

    async def metrics_endpoint(self, request: web.Request) -> web.Response:
        """
        Metrics endpoint for monitoring.

        Returns metrics in JSON format (compatible with Prometheus JSON exporter)
        or Prometheus text format based on Accept header.
        """
        accept = request.headers.get('Accept', 'application/json')

        if 'text/plain' in accept or 'prometheus' in accept:
            # Return Prometheus text format
            metrics_text = metrics.export_prometheus_text()
            return web.Response(
                text=metrics_text,
                content_type='text/plain; version=0.0.4'
            )
        else:
            # Return JSON format
            metrics_data = metrics.get_all_metrics()
            return web.json_response(metrics_data)

    async def on_shutdown(self, app):
        """Cleanup on shutdown."""
        logger.info("Shutting down WebRTC server...")
        # Close all peer connections
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()

    async def log_metrics_periodically(self):
        """Log metrics summary every 60 seconds."""
        try:
            while True:
                await asyncio.sleep(60)
                try:
                    metrics.log_summary()
                except Exception as e:
                    logger.error(f"Error logging metrics: {e}")
        except asyncio.CancelledError:
            logger.info("Metrics logging task cancelled")
        except Exception as e:
            logger.error(f"Metrics logging task error: {e}")

    async def on_startup(self, app):
        """Start background tasks on startup."""
        asyncio.create_task(self.log_metrics_periodically())

    def run(self):
        """Run the signaling server."""
        self.app.on_shutdown.append(self.on_shutdown)
        self.app.on_startup.append(self.on_startup)

        logger.info(f"Starting WebRTC Signaling Server on {settings.host}:{settings.port}")
        logger.info(f"Metrics endpoint available at: http://{settings.host}:{settings.port}/metrics")
        web.run_app(self.app, host=settings.host, port=settings.port)
