"""
WebRTC Camera Emulator for Axis Guardian
Streams preprocessed MP4 files with synchronized detection metadata via WebRTC data channels
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Optional
import msgpack
from aiohttp import web
from aiohttp import WSMsgType
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCConfiguration, RTCIceServer
from aiortc.sdp import candidate_from_sdp
from aiortc.contrib.media import MediaPlayer
from av import VideoFrame
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def rewrite_sdp_for_localhost(sdp: str) -> str:
    """
    Rewrite SDP - DISABLED for now to preserve original IPs.
    When running in Docker with port forwarding, the original IPs should work.
    """
    logger.info(f"[SDP REWRITE] Keeping original SDP (rewriting disabled)")
    return sdp


class DetectionVideoTrack(VideoStreamTrack):
    """
    Video track that streams from MP4 file with looping support
    """

    def __init__(self, video_path: str):
        super().__init__()
        self.video_path = video_path
        self.player: Optional[MediaPlayer] = None
        self._start_time = time.time()
        self._frame_count = 0
        self._restart_player()

    def _restart_player(self):
        """Restart the video player for looping"""
        if self.player:
            self.player.audio = None  # Clean up old player

        self.player = MediaPlayer(
            self.video_path,
            format='mp4',
            options={'fflags': 'nobuffer'}
        )
        logger.info(f"Started/restarted video player for {self.video_path}")

    async def recv(self) -> VideoFrame:
        """Receive next video frame, loop when finished"""
        try:
            frame = await self.player.video.recv()
            self._frame_count += 1
            return frame
        except Exception as e:
            # Video ended, restart for looping
            logger.info(f"Video ended, looping... (played {self._frame_count} frames)")
            self._restart_player()
            self._frame_count = 0
            frame = await self.player.video.recv()
            return frame


class CameraEmulator:
    """
    Emulates an AXIS camera with WebRTC streaming and detection metadata
    """

    def __init__(
        self,
        camera_id: str,
        video_path: str,
        detections_path: str,
        port: int,
        vapix_metadata: Optional[Dict] = None
    ):
        self.camera_id = camera_id
        self.video_path = Path(video_path)
        self.detections_path = Path(detections_path)
        self.port = port
        self.vapix_metadata = vapix_metadata or {}

        # Load detection data
        self.detection_data = self._load_detections()
        self.video_info = self.detection_data.get('video_info', {})

        # WebRTC connections
        self.pcs: Dict[str, RTCPeerConnection] = {}
        self.detection_channels: Dict[str, any] = {}

        # App server
        self.app = web.Application()
        self._setup_routes()

    def _load_detections(self) -> Dict:
        """Load detection JSON file"""
        logger.info(f"Loading detections from {self.detections_path}")

        if self.detections_path.suffix == '.gz':
            import gzip
            with gzip.open(self.detections_path, 'rt') as f:
                return json.load(f)
        else:
            with open(self.detections_path, 'r') as f:
                return json.load(f)

    def _setup_routes(self):
        """Setup HTTP routes for signaling and VAPIX emulation"""
        self.app.router.add_post('/offer', self.handle_offer)
        self.app.router.add_get('/ws/webrtc', self.handle_websocket_signaling)
        self.app.router.add_get('/vapix/camera', self.handle_vapix_info)
        self.app.router.add_get('/vapix/analytics', self.handle_vapix_analytics)
        self.app.router.add_get('/health', self.handle_health)

        # CORS support
        self.app.middlewares.append(self._cors_middleware)

    @web.middleware
    async def _cors_middleware(self, request, handler):
        """Add CORS headers"""
        if request.method == 'OPTIONS':
            return web.Response(
                headers={
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            )

        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    async def handle_websocket_signaling(self, request: web.Request) -> web.WebSocketResponse:
        """Handle WebSocket-based WebRTC signaling"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        logger.info(f"WebSocket signaling connection opened for camera {self.camera_id}")

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    data = json.loads(msg.data)

                    if data.get('type') == 'offer':
                        # Handle WebRTC offer
                        offer = RTCSessionDescription(sdp=data['sdp'], type='offer')

                        # Create peer connection
                        # For Docker: disable STUN to avoid discovering Docker internal IPs
                        # This forces ICE to use host candidates only (127.0.0.1)
                        pc = RTCPeerConnection(
                            configuration=RTCConfiguration(iceServers=[])
                        )

                        pc_id = f"ws_pc_{len(self.pcs)}"
                        self.pcs[pc_id] = pc

                        logger.info(f"Created WebRTC connection {pc_id} for camera {self.camera_id}")

                        @pc.on('connectionstatechange')
                        async def on_connectionstatechange():
                            logger.info(f"Connection state: {pc.connectionState}")
                            if pc.connectionState == 'failed' or pc.connectionState == 'closed':
                                await self._cleanup_connection(pc_id)

                        # Add video track
                        video_track = DetectionVideoTrack(str(self.video_path))
                        pc.addTrack(video_track)

                        # Create data channel for detections
                        detection_channel = pc.createDataChannel('detections')
                        self.detection_channels[pc_id] = detection_channel

                        @detection_channel.on('open')
                        def on_open():
                            logger.info(f"Detection data channel opened for {pc_id}")
                            asyncio.create_task(self._send_detections(pc_id, video_track))

                        # Handle offer
                        await pc.setRemoteDescription(offer)

                        # Create answer
                        answer = await pc.createAnswer()
                        await pc.setLocalDescription(answer)

                        # Send answer back via WebSocket
                        # Rewrite SDP to replace Docker IPs with localhost
                        rewritten_sdp = rewrite_sdp_for_localhost(pc.localDescription.sdp)
                        await ws.send_json({
                            'type': 'answer',
                            'sdp': rewritten_sdp
                        })

                        # Handle ICE candidates
                        @pc.on('icecandidate')
                        async def on_icecandidate(event):
                            if event.candidate:
                                # Rewrite ICE candidate IPs to localhost
                                import re
                                original_candidate = event.candidate.candidate
                                rewritten_candidate = re.sub(r'(typ\s+\w+\s+)172\.\d+\.\d+\.\d+', r'\g<1>127.0.0.1', original_candidate)
                                rewritten_candidate = re.sub(r'(typ\s+\w+\s+)10\.\d+\.\d+\.\d+', r'\g<1>127.0.0.1', rewritten_candidate)
                                rewritten_candidate = re.sub(r'(typ\s+\w+\s+)192\.168\.\d+\.\d+', r'\g<1>127.0.0.1', rewritten_candidate)

                                logger.info(f"[ICE CANDIDATE] Original: {original_candidate}")
                                logger.info(f"[ICE CANDIDATE] Rewritten: {rewritten_candidate}")

                                await ws.send_json({
                                    'type': 'ice-candidate',
                                    'candidate': {
                                        'candidate': rewritten_candidate,
                                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                                        'sdpMid': event.candidate.sdpMid
                                    }
                                })

                    elif data.get('type') == 'ice-candidate':
                        # Handle ICE candidate from client
                        # Find the most recent peer connection for this WebSocket
                        if self.pcs:
                            pc_id = list(self.pcs.keys())[-1]
                            pc = self.pcs[pc_id]
                            candidate_dict = data.get('candidate')
                            if candidate_dict and isinstance(candidate_dict, dict):
                                # Parse the SDP candidate string into an RTCIceCandidate object
                                candidate_sdp = candidate_dict.get('candidate')
                                if candidate_sdp:
                                    # Parse the candidate string (e.g., "candidate:123 1 udp ...")
                                    ice_candidate = candidate_from_sdp(candidate_sdp)
                                    ice_candidate.sdpMid = candidate_dict.get('sdpMid')
                                    ice_candidate.sdpMLineIndex = candidate_dict.get('sdpMLineIndex')
                                    await pc.addIceCandidate(ice_candidate)

                elif msg.type == WSMsgType.ERROR:
                    logger.error(f'WebSocket error: {ws.exception()}')

        except Exception as e:
            logger.error(f"Error in WebSocket signaling: {e}")
        finally:
            logger.info(f"WebSocket signaling connection closed for camera {self.camera_id}")

        return ws

    async def handle_offer(self, request: web.Request) -> web.Response:
        """Handle HTTP POST WebRTC offer from client (legacy support)"""
        params = await request.json()
        offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

        # Create peer connection with STUN server for NAT traversal
        pc = RTCPeerConnection(
            configuration=RTCConfiguration(
                iceServers=[RTCIceServer(urls=["stun:stun.l.google.com:19302"])]
            )
        )

        pc_id = f"pc_{len(self.pcs)}"
        self.pcs[pc_id] = pc

        logger.info(f"Created WebRTC connection {pc_id} for camera {self.camera_id}")

        @pc.on('connectionstatechange')
        async def on_connectionstatechange():
            logger.info(f"Connection state: {pc.connectionState}")
            if pc.connectionState == 'failed' or pc.connectionState == 'closed':
                await self._cleanup_connection(pc_id)

        # Add video track
        video_track = DetectionVideoTrack(str(self.video_path))
        pc.addTrack(video_track)

        # Create data channel for detections
        detection_channel = pc.createDataChannel('detections')
        self.detection_channels[pc_id] = detection_channel

        @detection_channel.on('open')
        def on_open():
            logger.info(f"Detection data channel opened for {pc_id}")
            asyncio.create_task(self._send_detections(pc_id, video_track))

        # Handle offer
        await pc.setRemoteDescription(offer)

        # Create answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        # Rewrite SDP to replace Docker IPs with localhost
        rewritten_sdp = rewrite_sdp_for_localhost(pc.localDescription.sdp)

        return web.json_response({
            'sdp': rewritten_sdp,
            'type': pc.localDescription.type
        })

    async def _send_detections(self, pc_id: str, video_track: DetectionVideoTrack):
        """Send detection metadata synchronized with video frames"""
        logger.info(f"Starting detection metadata stream for {pc_id}")

        fps = self.video_info.get('fps', 30)
        frame_duration = 1.0 / fps
        frames_data = self.detection_data.get('frames', [])
        total_frames = len(frames_data)

        frame_index = 0

        while pc_id in self.detection_channels:
            channel = self.detection_channels[pc_id]

            if channel.readyState != 'open':
                await asyncio.sleep(0.1)
                continue

            # Get current frame number from video track
            current_frame = video_track._frame_count

            # Loop through detection frames
            if current_frame < len(frames_data):
                frame_data = frames_data[current_frame]
            else:
                # Video looped, restart detection index
                frame_index = current_frame % total_frames if total_frames > 0 else 0
                frame_data = frames_data[frame_index] if frames_data else None

            if frame_data:
                # Prepare detection message matching frontend DetectionMetadata interface
                detection_msg = {
                    'camera_id': self.camera_id,
                    'frame_number': frame_data['frame_number'],
                    'timestamp': frame_data['timestamp'],
                    'detection_count': len(frame_data.get('detections', [])),
                    'detections': frame_data.get('detections', []),
                    'detection_frame': current_frame
                }

                # Serialize with msgpack for efficiency
                try:
                    packed_data = msgpack.packb(detection_msg)
                    channel.send(packed_data)
                except Exception as e:
                    logger.error(f"Error sending detection data: {e}")

            # Sync with video frame rate
            await asyncio.sleep(frame_duration)

    async def _cleanup_connection(self, pc_id: str):
        """Clean up peer connection resources"""
        # Check if connection exists before cleanup to prevent duplicate cleanup
        if pc_id not in self.pcs and pc_id not in self.detection_channels:
            logger.debug(f"Connection {pc_id} already cleaned up, skipping")
            return

        if pc_id in self.pcs:
            try:
                await self.pcs[pc_id].close()
            except Exception as e:
                logger.error(f"Error closing peer connection {pc_id}: {e}")
            finally:
                del self.pcs[pc_id]

        if pc_id in self.detection_channels:
            del self.detection_channels[pc_id]

        logger.info(f"Cleaned up connection {pc_id}")

    async def handle_vapix_info(self, request: web.Request) -> web.Response:
        """Emulate VAPIX camera info endpoint"""
        camera_info = {
            'camera_id': self.camera_id,
            'model': self.vapix_metadata.get('camera_model', 'AXIS P3245-LVE'),
            'serial': self.vapix_metadata.get('camera_serial', f'SERIAL-{self.camera_id}'),
            'firmware': '11.11.73',
            'resolution': {
                'width': self.video_info.get('width', 1920),
                'height': self.video_info.get('height', 1080)
            },
            'fps': self.video_info.get('fps', 30),
            'capabilities': {
                'ptz': False,
                'audio': False,
                'analytics': True
            }
        }
        return web.json_response(camera_info)

    async def handle_vapix_analytics(self, request: web.Request) -> web.Response:
        """Emulate VAPIX analytics metadata endpoint"""
        analytics_info = {
            'analytics_module': self.vapix_metadata.get('analytics_module', 'AXIS Object Analytics'),
            'analytics_version': self.vapix_metadata.get('analytics_version', '1.0.0'),
            'scenario': self.vapix_metadata.get('scenario', 'object_detection'),
            'detection_config': self.detection_data.get('detection_config', {}),
            'statistics': self.detection_data.get('statistics', {})
        }
        return web.json_response(analytics_info)

    async def handle_health(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        return web.json_response({
            'status': 'online',
            'camera_id': self.camera_id,
            'active_connections': len(self.pcs),
            'video_loaded': self.video_path.exists(),
            'detections_loaded': len(self.detection_data.get('frames', [])) > 0
        })

    async def start(self):
        """Start the emulator server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        logger.info(f"Camera emulator '{self.camera_id}' started on port {self.port}")
        logger.info(f"  Video: {self.video_path}")
        logger.info(f"  Detections: {len(self.detection_data.get('frames', []))} frames")
        logger.info(f"  Signaling: http://localhost:{self.port}/offer")


async def main():
    """Start multiple camera emulators"""
    import os

    # Configuration from environment or defaults
    base_path = Path(os.getenv('CAMERA_DATA_PATH', '/shared/cameras/preprocessed/1080p'))

    cameras = [
        {
            'camera_id': 'camera-HC3',
            'video_path': base_path / 'view-HC3-preprocessed.mp4',
            'detections_path': base_path / 'view-HC3-preprocessed.detections.json.gz',
            'port': 9101,
            'vapix_metadata': {
                'camera_model': 'AXIS P3245-LVE',
                'camera_serial': 'ACCC8EF12345',
                'analytics_module': 'AXIS Object Analytics',
                'analytics_version': '1.0.0',
                'scenario': 'object_detection'
            }
        },
        {
            'camera_id': 'camera-HC4',
            'video_path': base_path / 'view-HC4-preprocessed.mp4',
            'detections_path': base_path / 'view-HC4-preprocessed.detections.json.gz',
            'port': 9102,
            'vapix_metadata': {
                'camera_model': 'AXIS M3046-V',
                'camera_serial': 'ACCC8EF12346',
                'analytics_module': 'AXIS Object Analytics',
                'analytics_version': '1.0.0',
                'scenario': 'object_detection'
            }
        }
    ]

    # Start all camera emulators
    emulators = []
    for config in cameras:
        emulator = CameraEmulator(**config)
        emulators.append(emulator)
        await emulator.start()

    logger.info(f"All {len(emulators)} camera emulators started successfully")
    logger.info("Press Ctrl+C to stop")

    # Keep running
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        logger.info("Shutting down emulators...")


if __name__ == '__main__':
    asyncio.run(main())
