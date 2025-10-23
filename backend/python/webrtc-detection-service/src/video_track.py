"""Custom WebRTC video track with detection metadata."""

import asyncio
import fractions
import json
import time
from typing import Optional
import cv2
import numpy as np
from av import VideoFrame
from aiortc import RTCDataChannel, VideoStreamTrack
from loguru import logger

from detector import ObjectDetector


class DetectionVideoTrack(VideoStreamTrack):
    """
    Custom video track that processes frames and sends detection metadata
    via data channel.
    """

    def __init__(
        self,
        rtsp_url: str,
        camera_id: str,
        detector: ObjectDetector,
        data_channel: Optional[RTCDataChannel] = None,
    ):
        """
        Initialize detection video track.

        Args:
            rtsp_url: RTSP stream URL
            camera_id: Camera identifier
            detector: ObjectDetector instance
            data_channel: WebRTC data channel for metadata
        """
        super().__init__()
        self.rtsp_url = rtsp_url
        self.camera_id = camera_id
        self.detector = detector
        self.data_channel = data_channel

        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_count = 0
        self.running = True

        # Video properties
        self.fps = 30
        self.frame_time = 1.0 / self.fps

        logger.info(f"DetectionVideoTrack initialized for {camera_id}")

    async def _connect_stream(self) -> bool:
        """Connect to RTSP stream."""
        try:
            logger.info(f"Connecting to {self.rtsp_url}")
            self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            if not self.cap.isOpened():
                logger.error(f"Failed to open stream: {self.rtsp_url}")
                return False

            # Get stream properties
            self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
            self.frame_time = 1.0 / self.fps

            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            logger.info(
                f"Connected to {self.camera_id}: {width}x{height} @ {self.fps:.1f} FPS"
            )
            return True

        except Exception as e:
            logger.error(f"Error connecting to {self.rtsp_url}: {e}")
            return False

    async def recv(self):
        """
        Receive next video frame.

        This is called by WebRTC when it needs a new frame.
        We read from RTSP, run detection, send metadata, and return the frame.
        """
        logger.debug(f"[{self.camera_id}] recv() called - frame {self.frame_count}")

        # Connect on first call
        if self.cap is None:
            connected = await self._connect_stream()
            if not connected:
                # Return black frame if connection failed
                return self._create_black_frame()

        # Read frame from RTSP
        try:
            ret, frame = self.cap.read()

            if not ret or frame is None:
                logger.warning(f"Lost connection to {self.camera_id}, reconnecting...")
                if self.cap:
                    self.cap.release()
                    self.cap = None
                return self._create_black_frame()

            self.frame_count += 1

            # Run object detection
            frame_timestamp = time.time()
            detections = self.detector.detect(frame, frame_timestamp)

            # Send detection metadata via data channel
            if self.data_channel and self.data_channel.readyState == "open":
                await self._send_detection_metadata(detections, frame_timestamp)

            # Convert BGR to RGB for WebRTC
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Create VideoFrame
            video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
            video_frame.pts = self.frame_count
            video_frame.time_base = fractions.Fraction(1, int(self.fps))

            # Control frame rate
            await asyncio.sleep(self.frame_time)

            return video_frame

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return self._create_black_frame()

    async def _send_detection_metadata(self, detections: list, timestamp: float):
        """Send detection metadata via data channel."""
        try:
            metadata = {
                "camera_id": self.camera_id,
                "frame_number": self.frame_count,
                "timestamp": timestamp,
                "detection_count": len(detections),
                "detections": detections,
            }

            message = json.dumps(metadata)
            self.data_channel.send(message)

            if detections:
                logger.debug(
                    f"Sent {len(detections)} detections for frame {self.frame_count}"
                )

        except Exception as e:
            logger.error(f"Error sending metadata: {e}")

    def _create_black_frame(self) -> VideoFrame:
        """Create a black frame when stream is unavailable."""
        black = np.zeros((480, 640, 3), dtype=np.uint8)
        frame = VideoFrame.from_ndarray(black, format="rgb24")
        frame.pts = self.frame_count
        frame.time_base = fractions.Fraction(1, int(self.fps))
        self.frame_count += 1
        return frame

    def stop(self):
        """Stop the video track."""
        super().stop()
        self.running = False
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info(f"DetectionVideoTrack stopped for {self.camera_id}")
