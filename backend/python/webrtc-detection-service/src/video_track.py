"""Custom WebRTC video track with detection metadata."""

import asyncio
import fractions
import json
import os
import time
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from collections import deque
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

    # Shared thread pool for detection processing
    _executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="detection")

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
        self.target_frame_time = 1.0 / self.fps

        # Frame queue for async processing
        self.frame_queue = deque(maxlen=5)  # Max 5 frames buffered
        self.detection_cache = {}  # frame_number -> detections
        self.last_detection_frame = -1
        self.frames_since_detection = 0
        self.latest_detections = []  # Most recent detections to draw
        self.detection_frame_number = -1  # Frame number of latest_detections

        # Performance tracking
        self.last_frame_time = time.time()
        self.avg_processing_time = 0.033  # Initial estimate: 33ms
        self.dropped_frames = 0
        self.corrupted_frames = 0
        self.last_valid_frame = None  # Cache last good frame for error recovery

        # Colors for different classes (BGR format)
        self.class_colors = {
            'person': (34, 197, 34),      # Green
            'car': (246, 130, 59),        # Blue
            'truck': (68, 68, 239),       # Red
            'bus': (214, 182, 6),         # Cyan
            'motorbike': (247, 85, 168),  # Purple
            'bicycle': (8, 179, 234)      # Yellow
        }

        logger.info(f"DetectionVideoTrack initialized for {camera_id}")

    async def _connect_stream(self) -> bool:
        """Connect to RTSP stream with optimized settings for reliability."""
        try:
            logger.info(f"Connecting to {self.rtsp_url}")

            # Set FFmpeg environment variables for better RTSP reliability
            # Use TCP transport instead of UDP to prevent packet loss
            os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'rtsp_transport;tcp|fflags;nobuffer|flags;low_delay'

            self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)

            # Enable hardware acceleration if available
            # Try different backends: CUDA, DXVA (Windows), VAAPI (Linux), VideoToolbox (macOS)
            try:
                self.cap.set(cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY)
                logger.info("Hardware acceleration enabled for video decode")
            except Exception as e:
                logger.warning(f"Hardware acceleration not available: {e}")

            # Set timeout values for better error handling
            self.cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)  # 5 second open timeout
            self.cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000)  # 3 second read timeout

            # Optimize buffer size for smoother playback (3-5 frames)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)

            # Enable low-latency mode
            self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))

            # Disable OpenCV error verbosity to reduce H.264 decoder noise
            # Errors will still be logged but less spammy
            cv2.setLogLevel(0)  # 0 = Silent, 1 = Errors only

            if not self.cap.isOpened():
                logger.error(f"Failed to open stream: {self.rtsp_url}")
                return False

            # Get stream properties
            self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
            self.frame_time = 1.0 / self.fps
            self.target_frame_time = 1.0 / self.fps

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
        We read from RTSP, run detection asynchronously, and return the frame.
        """
        frame_start = time.time()

        # Connect on first call
        if self.cap is None:
            connected = await self._connect_stream()
            if not connected:
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

            # Validate frame integrity
            if not self._is_valid_frame(frame):
                self.corrupted_frames += 1

                # Log periodically to avoid spam
                if self.corrupted_frames % 30 == 0:
                    logger.warning(
                        f"[{self.camera_id}] Corrupted frames detected: {self.corrupted_frames} total. "
                        "This may be due to network issues or RTSP stream quality."
                    )

                # Use last valid frame if available, otherwise return current (may have artifacts)
                if self.last_valid_frame is not None:
                    frame = self.last_valid_frame.copy()
                # else: continue with potentially corrupted frame to avoid stream interruption
            else:
                # Cache this valid frame for error recovery
                self.last_valid_frame = frame.copy()

            self.frame_count += 1
            frame_timestamp = time.time()

            # Decide if we should run detection on this frame
            should_detect = self._should_run_detection()

            if should_detect:
                # Run detection asynchronously in thread pool
                loop = asyncio.get_event_loop()
                detection_future = loop.run_in_executor(
                    self._executor,
                    self.detector.detect,
                    frame.copy(),  # Copy frame to avoid race conditions
                    frame_timestamp
                )

                # Don't await - let detection run in background
                # Store future for retrieval when ready
                detection_future.add_done_callback(
                    lambda f: self._on_detection_complete(f, self.frame_count, frame_timestamp)
                )
                self.last_detection_frame = self.frame_count
                self.frames_since_detection = 0
            else:
                self.frames_since_detection += 1

            # Send any ready detection results via data channel
            await self._send_cached_detections(self.frame_count, frame_timestamp)

            # Draw detections on frame before encoding
            frame_with_detections = self._draw_detections_on_frame(frame)

            # Convert BGR to RGB for WebRTC
            frame_rgb = cv2.cvtColor(frame_with_detections, cv2.COLOR_BGR2RGB)

            # Create VideoFrame
            video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
            video_frame.pts = self.frame_count
            video_frame.time_base = fractions.Fraction(1, int(self.fps))

            # Adaptive frame timing
            processing_time = time.time() - frame_start
            self.avg_processing_time = 0.8 * self.avg_processing_time + 0.2 * processing_time

            # Sleep only if we're ahead of schedule
            sleep_time = max(0, self.target_frame_time - processing_time)
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                self.dropped_frames += 1
                if self.dropped_frames % 30 == 0:
                    logger.warning(
                        f"[{self.camera_id}] Running behind: {self.dropped_frames} frames dropped, "
                        f"avg processing time: {self.avg_processing_time*1000:.1f}ms"
                    )

            return video_frame

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return self._create_black_frame()

    def _is_valid_frame(self, frame: np.ndarray) -> bool:
        """
        Validate frame integrity to detect corrupted frames from H.264 decode errors.

        Args:
            frame: Frame to validate

        Returns:
            True if frame appears valid, False if likely corrupted
        """
        if frame is None or frame.size == 0:
            return False

        # Check for extreme values that indicate corruption
        try:
            # Calculate basic statistics
            mean_val = np.mean(frame)
            std_val = np.std(frame)

            # Corrupted frames often have:
            # - Very low std dev (all pixels similar - often black or green artifacts)
            # - Extreme mean values (all black or all white)
            # - NaN or inf values

            if np.isnan(mean_val) or np.isinf(mean_val):
                return False

            # All black (mean near 0) with low variation
            if mean_val < 5 and std_val < 5:
                return False

            # All white (mean near 255) with low variation
            if mean_val > 250 and std_val < 5:
                return False

            # Extremely low variation (likely solid color artifact)
            if std_val < 1:
                return False

            return True

        except Exception as e:
            logger.debug(f"Frame validation error: {e}")
            return True  # Assume valid if validation fails

    def _should_run_detection(self) -> bool:
        """
        Decide if we should run detection on current frame.
        Uses adaptive frame skipping based on processing load.
        """
        from config import settings

        # Always detect if we haven't detected recently
        if self.frames_since_detection >= settings.frame_skip:
            return True

        # Skip if processing is lagging
        if self.avg_processing_time > self.target_frame_time * 0.8:
            return False

        return self.frames_since_detection >= settings.frame_skip

    def _on_detection_complete(self, future, frame_number: int, timestamp: float):
        """Callback when detection completes in background thread."""
        try:
            detections = future.result()
            # Cache detections with frame number
            self.detection_cache[frame_number] = {
                "detections": detections,
                "timestamp": timestamp,
            }

            # Update latest detections for drawing WITH frame number
            # Only update if this is newer than current (async callbacks can arrive out of order)
            if frame_number > self.detection_frame_number:
                self.latest_detections = detections
                self.detection_frame_number = frame_number
                logger.debug(f"Updated detections for frame {frame_number}")

            # Keep cache size reasonable (last 10 frames)
            if len(self.detection_cache) > 10:
                oldest_frame = min(self.detection_cache.keys())
                del self.detection_cache[oldest_frame]

        except Exception as e:
            logger.error(f"Error in detection callback: {e}")

    def _draw_detections_on_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Draw bounding boxes and labels directly on the frame.

        Args:
            frame: BGR frame to draw on

        Returns:
            Frame with detections drawn
        """
        from config import settings

        if not settings.draw_on_frame or not self.latest_detections:
            return frame

        # Work on a copy to avoid modifying original
        annotated_frame = frame.copy()
        frame_height, frame_width = frame.shape[:2]

        # Calculate frame age (how many frames ago was this detection made)
        frame_age = self.frame_count - self.detection_frame_number

        # Only draw if detection is recent (within 5 frames = ~167ms at 30fps)
        if frame_age > 5:
            logger.debug(f"Skipping stale detection (age: {frame_age} frames)")
            return frame

        for detection in self.latest_detections:
            bbox = detection['bbox']
            class_name = detection['class_name']
            confidence = detection['confidence']

            # Get pixel coordinates
            x1 = int(bbox['x1'])
            y1 = int(bbox['y1'])
            x2 = int(bbox['x2'])
            y2 = int(bbox['y2'])

            # Get color for this class
            color = self.class_colors.get(class_name, (180, 163, 148))  # Default gray

            # Draw bounding box (thicker line for better visibility)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 3)

            # Prepare label with frame age indicator (for debugging sync)
            if frame_age == 0:
                label = f"{class_name} {int(confidence * 100)}%"  # Perfect sync
            else:
                label = f"{class_name} {int(confidence * 100)}% [-{frame_age}f]"  # Show lag

            # Calculate text size for background
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(
                label, font, font_scale, thickness
            )

            # Adjust box color alpha based on age (older = more transparent)
            # Older detections get darker boxes to indicate staleness
            if frame_age > 0:
                # Make color darker for stale detections
                color = tuple(int(c * 0.7) for c in color)

            # Draw label background
            cv2.rectangle(
                annotated_frame,
                (x1, y1 - text_height - 10),
                (x1 + text_width + 10, y1),
                color,
                -1  # Filled
            )

            # Draw label text
            cv2.putText(
                annotated_frame,
                label,
                (x1 + 5, y1 - 5),
                font,
                font_scale,
                (0, 0, 0),  # Black text
                thickness,
                cv2.LINE_AA
            )

        return annotated_frame

    async def _send_cached_detections(self, current_frame: int, timestamp: float):
        """Send detection results from cache via data channel."""
        if not self.data_channel or self.data_channel.readyState != "open":
            return

        # Find most recent detection result
        available_frames = [f for f in self.detection_cache.keys() if f <= current_frame]
        if not available_frames:
            return

        # Use most recent detection
        latest_frame = max(available_frames)
        cached = self.detection_cache.get(latest_frame)

        if cached:
            try:
                metadata = {
                    "camera_id": self.camera_id,
                    "frame_number": current_frame,  # Use current frame for sync
                    "timestamp": timestamp,
                    "detection_count": len(cached["detections"]),
                    "detections": cached["detections"],
                    "detection_frame": latest_frame,  # Original detection frame
                }

                message = json.dumps(metadata)
                self.data_channel.send(message)

                if cached["detections"]:
                    logger.debug(
                        f"Sent {len(cached['detections'])} detections "
                        f"(from frame {latest_frame}) for frame {current_frame}"
                    )

            except Exception as e:
                logger.error(f"Error sending cached metadata: {e}")

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
