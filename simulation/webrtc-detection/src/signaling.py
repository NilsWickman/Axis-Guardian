"""WebRTC signaling server with detection data channel."""

import asyncio
import json
from typing import Dict, Set
from aiohttp import web
import aiohttp_cors
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from loguru import logger

from config import settings, InterfaceMode
from detector import ObjectDetector
from video_track import DetectionVideoTrack
from video_track_preprocessed import find_detection_json_for_rtsp
from metadata_track import MetadataOnlyTrack
from metrics import metrics
from rtsp_pool import get_pool, init_pool, shutdown_pool
from camera_discovery import get_discovery, init_discovery, shutdown_discovery


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
        ready_route = self.app.router.add_get("/ready", self.readiness_check)
        metrics_route = self.app.router.add_get("/metrics", self.metrics_endpoint)
        cameras_route = self.app.router.add_get("/cameras", self.list_cameras)
        snapshot_route = self.app.router.add_get("/snapshot/{camera_id}", self.get_snapshot)

        # Add CORS to routes
        cors.add(offer_route)
        cors.add(health_route)
        cors.add(ready_route)
        cors.add(metrics_route)
        cors.add(cameras_route)
        cors.add(snapshot_route)

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

            # Get interface mode for this camera
            interface_mode = settings.get_interface_mode(camera_id)
            logger.info(f"Interface mode for {camera_id}: {interface_mode.value}")

            # Try to find pre-computed detections JSON file
            detections_json = find_detection_json_for_rtsp(rtsp_url, camera_id)

            # Handle different interface modes
            if interface_mode == InterfaceMode.METADATA_ONLY:
                # Metadata-only mode: no video track, only data channel
                metadata_track = None

                @pc.on("datachannel")
                def on_datachannel(channel):
                    nonlocal metadata_track
                    logger.info(f"Data channel received for metadata-only mode: {channel.label}")

                    # Create and start metadata-only track
                    metadata_track = MetadataOnlyTrack(
                        rtsp_url=rtsp_url,
                        camera_id=camera_id,
                        detector=self.detector,
                        data_channel=channel,
                        precomputed_detections_path=detections_json,
                    )

                    @channel.on("open")
                    def on_open():
                        logger.info(f"Data channel opened for {camera_id} (metadata-only)")
                        metadata_track.start()

                    @channel.on("close")
                    def on_close():
                        logger.info(f"Data channel closed for {camera_id} (metadata-only)")
                        if metadata_track:
                            asyncio.create_task(metadata_track.stop())

                logger.info(f"Configured metadata-only mode for {camera_id}")

            else:
                # Video modes: rtsp_only, video_metadata, or video_boxes
                # For rtsp_only, don't load precomputed detections (no metadata sent)
                precomputed_path = None if interface_mode == InterfaceMode.RTSP_ONLY else detections_json

                # Create detection video track (data channel will be set when received from client)
                video_track = DetectionVideoTrack(
                    rtsp_url=rtsp_url,
                    camera_id=camera_id,
                    detector=self.detector,
                    data_channel=None,
                    precomputed_detections_path=precomputed_path,
                    interface_mode=interface_mode,
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
        """
        Health check endpoint.

        Returns basic health status. For detailed readiness check use /ready.
        """
        return web.json_response(
            {
                "status": "healthy",
                "service": "webrtc-detection",
                "active_connections": len(self.pcs),
            }
        )

    async def readiness_check(self, request: web.Request) -> web.Response:
        """
        Readiness check endpoint with detailed status.

        Returns comprehensive system state including RTSP pool and camera discovery.
        """
        pool = get_pool()
        pool_stats = pool.get_pool_stats()

        discovery = get_discovery()
        discovery_stats = discovery.get_statistics()

        return web.json_response(
            {
                "status": "ready",
                "service": "webrtc-detection",
                "active_connections": len(self.pcs),
                "rtsp_pool": pool_stats,
                "camera_discovery": discovery_stats,
                "configured_sources": {
                    "camera1": settings.camera1_url,
                    "camera2": settings.camera2_url,
                    "camera3": settings.camera3_url,
                    "camera4": settings.camera4_url,
                },
            }
        )

    async def list_cameras(self, request: web.Request) -> web.Response:
        """
        List discovered cameras endpoint.

        Returns all discovered cameras with their details and availability.
        """
        discovery = get_discovery()
        cameras = discovery.get_cameras()

        camera_list = []
        for camera_id, camera in cameras.items():
            camera_list.append({
                "id": camera_id,
                "name": camera.name,
                "rtsp_url": camera.rtsp_url,
                "ready": camera.ready,
                "readers": camera.readers,
                "tracks": camera.tracks,
                "source": camera.source,
            })

        return web.json_response(
            {
                "cameras": camera_list,
                "count": len(camera_list),
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

    async def get_snapshot(self, request: web.Request) -> web.Response:
        """
        Snapshot endpoint for low-bandwidth mode.

        Returns a JPEG snapshot from the specified camera.
        Falls back to snapshot files generated by stream-mock-cameras-snapshot.sh.

        GET /snapshot/camera1 -> returns latest snapshot as image/jpeg
        """
        import os
        from pathlib import Path

        camera_id = request.match_info['camera_id']
        logger.info(f"Snapshot request for {camera_id}")

        # Path to snapshot file (generated by stream-mock-cameras-snapshot.sh)
        project_root = Path(__file__).parent.parent.parent.parent
        snapshot_path = project_root / "simulation" / "snapshots" / camera_id / "latest.jpg"

        if not snapshot_path.exists():
            return web.json_response(
                {
                    "error": f"Snapshot not available for {camera_id}",
                    "hint": "Start snapshot generator: ./simulation/scripts/stream-mock-cameras-snapshot.sh all"
                },
                status=404
            )

        try:
            # Read and return the snapshot
            with open(snapshot_path, 'rb') as f:
                snapshot_data = f.read()

            return web.Response(
                body=snapshot_data,
                content_type='image/jpeg',
                headers={
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            )
        except Exception as e:
            logger.exception(f"Error reading snapshot for {camera_id}: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def on_shutdown(self, app):
        """Cleanup on shutdown."""
        logger.info("Shutting down WebRTC server...")
        # Close all peer connections
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()

        # Shutdown RTSP connection pool
        await shutdown_pool()

        # Shutdown camera discovery
        await shutdown_discovery()

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
        # Initialize RTSP connection pool
        await init_pool()

        # Initialize camera discovery
        await init_discovery()

        # Start metrics logging
        asyncio.create_task(self.log_metrics_periodically())

    def run(self):
        """Run the signaling server."""
        self.app.on_shutdown.append(self.on_shutdown)
        self.app.on_startup.append(self.on_startup)

        logger.info(f"Starting WebRTC Signaling Server on {settings.host}:{settings.port}")
        logger.info(f"Metrics endpoint available at: http://{settings.host}:{settings.port}/metrics")
        web.run_app(self.app, host=settings.host, port=settings.port)
