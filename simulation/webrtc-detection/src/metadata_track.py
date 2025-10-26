"""Metadata-only track for sending detection data without video."""

import asyncio
import time
from typing import Optional, Dict, List, Any
from concurrent.futures import ThreadPoolExecutor
import cv2
import msgpack
from aiortc import RTCDataChannel
from loguru import logger

from detector import ObjectDetector
from metrics import metrics
from video_track_preprocessed import load_preprocessed_detections, get_detection_for_frame


class MetadataOnlyTrack:
    """
    Metadata-only track that processes frames for detection but doesn't send video.
    Only sends detection metadata via data channel.
    """

    def __init__(
        self,
        rtsp_url: str,
        camera_id: str,
        detector: ObjectDetector,
        data_channel: Optional[RTCDataChannel] = None,
        precomputed_detections_path: Optional[str] = None,
    ):
        """
        Initialize metadata-only track.

        Args:
            rtsp_url: RTSP stream URL
            camera_id: Camera identifier
            detector: ObjectDetector instance
            data_channel: WebRTC data channel for metadata
            precomputed_detections_path: Optional path to pre-computed detections JSON
        """
        self.rtsp_url = rtsp_url
        self.camera_id = camera_id
        self.detector = detector
        self.data_channel = data_channel

        # Pre-processed detections support
        self.preprocessed_detections: Optional[Dict[int, List[Any]]] = None
        self.use_preprocessed = False
        if precomputed_detections_path:
            self.preprocessed_detections = load_preprocessed_detections(precomputed_detections_path)
            self.use_preprocessed = self.preprocessed_detections is not None

        # Per-camera thread pool for detection
        self._executor = ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix=f"detect-meta-{camera_id}"
        )

        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_count = 0
        self.running = False
        self.task: Optional[asyncio.Task] = None

        # Video properties
        self.fps = 30
        self.frame_time = 1.0 / self.fps

        # Detection state
        self.detection_cache = {}
        self.last_detection_frame = -1
        self.frames_since_detection = 0
        self.latest_detections = []

        logger.info(f"MetadataOnlyTrack initialized for {camera_id}")
        if self.use_preprocessed:
            logger.info(f"  ✓ Using pre-processed detections (optimized mode)")

    async def _connect_stream(self) -> bool:
        """Connect to RTSP stream."""
        try:
            logger.info(f"[MetadataOnly] Connecting to {self.rtsp_url}")

            self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)

            # Set timeout values
            self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)
            self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 2)  # Minimal buffer for metadata-only

            if not self.cap.isOpened():
                logger.error(f"[MetadataOnly] Failed to open stream: {self.rtsp_url}")
                return False

            # Get stream properties
            self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
            self.frame_time = 1.0 / self.fps

            logger.info(f"[MetadataOnly] Connected to {self.camera_id} @ {self.fps:.1f} FPS")
            return True

        except Exception as e:
            logger.error(f"[MetadataOnly] Error connecting to {self.rtsp_url}: {e}")
            return False

    async def _process_loop(self):
        """Main processing loop for metadata-only mode."""
        logger.info(f"[MetadataOnly] Starting processing loop for {self.camera_id}")

        # Connect to stream
        connected = await self._connect_stream()
        if not connected:
            logger.error(f"[MetadataOnly] Failed to connect, stopping")
            return

        while self.running:
            try:
                frame_start = time.time()

                # Read frame from RTSP
                ret, frame = self.cap.read()

                if not ret or frame is None:
                    logger.warning(f"[MetadataOnly] Lost connection to {self.camera_id}, reconnecting...")
                    if self.cap:
                        self.cap.release()
                        self.cap = None
                    await asyncio.sleep(1)
                    connected = await self._connect_stream()
                    if not connected:
                        await asyncio.sleep(5)
                    continue

                self.frame_count += 1
                frame_timestamp = time.time()

                # Process detections
                if self.use_preprocessed:
                    # Use pre-processed detections
                    detections = get_detection_for_frame(self.preprocessed_detections, self.frame_count)

                    if detections:
                        self.latest_detections = detections
                        self.detection_cache[self.frame_count] = {
                            "detections": detections,
                            "timestamp": frame_timestamp,
                        }

                        # Keep cache reasonable
                        if len(self.detection_cache) > 10:
                            oldest_frame = min(self.detection_cache.keys())
                            del self.detection_cache[oldest_frame]

                        metrics.increment_counter('detections_preprocessed_total', labels={'camera': self.camera_id})
                else:
                    # Real-time detection
                    from config import settings

                    should_detect = self.frames_since_detection >= settings.frame_skip

                    if should_detect:
                        metrics.increment_counter('detections_initiated_total', labels={'camera': self.camera_id})

                        loop = asyncio.get_event_loop()
                        detection_start = time.time()

                        def on_complete(f):
                            detection_time = time.time() - detection_start
                            metrics.observe_histogram(
                                'detection_latency_seconds',
                                detection_time,
                                labels={'camera': self.camera_id}
                            )
                            try:
                                detections = f.result()
                                self.detection_cache[self.frame_count] = {
                                    "detections": detections,
                                    "timestamp": frame_timestamp,
                                }
                                self.latest_detections = detections

                                if len(self.detection_cache) > 10:
                                    oldest_frame = min(self.detection_cache.keys())
                                    del self.detection_cache[oldest_frame]
                            except Exception as e:
                                logger.error(f"[MetadataOnly] Detection error: {e}")

                        detection_future = loop.run_in_executor(
                            self._executor,
                            self.detector.detect,
                            frame,
                            frame_timestamp
                        )
                        detection_future.add_done_callback(on_complete)
                        self.last_detection_frame = self.frame_count
                        self.frames_since_detection = 0
                    else:
                        self.frames_since_detection += 1

                # Send detection metadata via data channel
                await self._send_metadata(self.frame_count, frame_timestamp)

                # Frame timing
                processing_time = time.time() - frame_start
                sleep_time = max(0, self.frame_time - processing_time)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

            except Exception as e:
                logger.error(f"[MetadataOnly] Error in processing loop: {e}")
                await asyncio.sleep(1)

    async def _send_metadata(self, current_frame: int, timestamp: float):
        """Send detection metadata via data channel."""
        if not self.data_channel or self.data_channel.readyState != "open":
            return

        # Find most recent detection result
        available_frames = [f for f in self.detection_cache.keys() if f <= current_frame]
        if not available_frames:
            return

        latest_frame = max(available_frames)
        cached = self.detection_cache.get(latest_frame)

        if cached:
            try:
                metadata = {
                    "camera_id": self.camera_id,
                    "frame_number": current_frame,
                    "timestamp": timestamp,
                    "detection_count": len(cached["detections"]),
                    "detections": cached["detections"],
                    "detection_frame": latest_frame,
                    "format": "msgpack",
                    "metadata_only": True,  # Flag to indicate no video
                }

                message = msgpack.packb(metadata, use_bin_type=True)
                self.data_channel.send(message)

            except Exception as e:
                logger.error(f"[MetadataOnly] Error sending metadata: {e}")

    def start(self):
        """Start the metadata processing."""
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self._process_loop())
        logger.info(f"[MetadataOnly] Started for {self.camera_id}")

    async def stop(self):
        """Stop the metadata processing."""
        self.running = False

        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        if self.cap:
            self.cap.release()
            self.cap = None

        if hasattr(self, '_executor'):
            self._executor.shutdown(wait=True, cancel_futures=True)

        logger.info(f"[MetadataOnly] Stopped for {self.camera_id}")
