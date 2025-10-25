"""RTSP stream processor with object detection."""

import time
from typing import Optional, Callable
from threading import Thread, Event
from loguru import logger
import cv2
import numpy as np

from config import settings
from detector import ObjectDetector


class StreamProcessor:
    """Process RTSP stream with object detection."""

    def __init__(self, camera_id: str, rtsp_url: str, detector: ObjectDetector):
        """
        Initialize stream processor.

        Args:
            camera_id: Unique camera identifier
            rtsp_url: RTSP stream URL
            detector: ObjectDetector instance
        """
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.detector = detector
        self.running = Event()
        self.thread: Optional[Thread] = None
        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_count = 0
        self.detection_callback: Optional[Callable] = None

        # PTS-based timestamp tracking
        self.stream_start_time: Optional[float] = None  # Wall-clock time when stream started
        self.previous_pts_ms: float = 0.0  # Previous frame's PTS in milliseconds
        self.loop_count: int = 0  # Number of video loops detected
        self.video_duration_ms: float = 0.0  # Estimated video duration for loop detection

    def set_detection_callback(self, callback: Callable):
        """Set callback function to be called when detections occur."""
        self.detection_callback = callback

    def _get_frame_timestamp(self) -> tuple[float, float, int]:
        """
        Get timestamp for current frame using video PTS or wall-clock time.

        Returns:
            Tuple of (frame_timestamp, video_pts_ms, loop_count)
            - frame_timestamp: Unix timestamp in seconds for this frame
            - video_pts_ms: Video presentation timestamp in milliseconds
            - loop_count: Number of loops detected
        """
        if not settings.use_video_pts or not self.cap:
            # Fallback to wall-clock time
            return (time.time(), 0.0, 0)

        try:
            # Get video PTS (Presentation Timestamp) in milliseconds
            current_pts_ms = self.cap.get(cv2.CAP_PROP_POS_MSEC)

            # Initialize stream start time on first frame
            if self.stream_start_time is None:
                self.stream_start_time = time.time()
                self.previous_pts_ms = current_pts_ms
                logger.info(f"{self.camera_id}: PTS-based timing initialized at {current_pts_ms:.0f}ms")
                return (self.stream_start_time, current_pts_ms, 0)

            # Detect video loop (PTS jumps backward significantly)
            pts_delta = current_pts_ms - self.previous_pts_ms

            if pts_delta < -settings.pts_reset_threshold_ms:
                # Loop detected!
                self.loop_count += 1

                # Update estimated video duration if this seems more accurate
                if self.previous_pts_ms > self.video_duration_ms:
                    self.video_duration_ms = self.previous_pts_ms

                logger.info(
                    f"{self.camera_id}: Loop #{self.loop_count} detected "
                    f"(PTS: {self.previous_pts_ms:.0f}ms → {current_pts_ms:.0f}ms, "
                    f"duration: ~{self.video_duration_ms/1000:.1f}s)"
                )

            # Calculate frame timestamp:
            # base_time + (loops * video_duration) + current_pts
            frame_timestamp = (
                self.stream_start_time +
                (self.loop_count * self.video_duration_ms / 1000.0) +
                (current_pts_ms / 1000.0)
            )

            self.previous_pts_ms = current_pts_ms
            return (frame_timestamp, current_pts_ms, self.loop_count)

        except Exception as e:
            logger.warning(f"{self.camera_id}: Failed to read PTS, using wall-clock: {e}")
            return (time.time(), 0.0, self.loop_count)

    def start(self):
        """Start processing stream in background thread."""
        if self.thread and self.thread.is_alive():
            logger.warning(f"Stream processor for {self.camera_id} already running")
            return

        logger.info(f"Starting stream processor for {self.camera_id}")
        self.running.set()
        self.thread = Thread(target=self._process_stream, daemon=True)
        self.thread.start()

    def stop(self):
        """Stop processing stream."""
        logger.info(f"Stopping stream processor for {self.camera_id}")
        self.running.clear()

        if self.thread:
            self.thread.join(timeout=5.0)

        if self.cap:
            self.cap.release()
            self.cap = None

    def _connect_to_stream(self) -> bool:
        """
        Connect to RTSP stream.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            logger.info(f"Connecting to {self.rtsp_url}")

            # Open RTSP stream with OpenCV
            self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)

            # Set buffer size to reduce latency
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            if not self.cap.isOpened():
                logger.error(f"Failed to open stream: {self.rtsp_url}")
                return False

            # Read test frame
            ret, frame = self.cap.read()
            if not ret or frame is None:
                logger.error(f"Failed to read frame from: {self.rtsp_url}")
                return False

            fps = self.cap.get(cv2.CAP_PROP_FPS)
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            logger.info(f"Connected to {self.camera_id}: {width}x{height} @ {fps:.1f} FPS")
            return True

        except Exception as e:
            logger.error(f"Error connecting to stream {self.rtsp_url}: {e}")
            return False

    def _process_stream(self):
        """Main processing loop (runs in background thread)."""
        retry_count = 0
        retry_delay = 5.0

        while self.running.is_set():
            # Connect/reconnect to stream
            if not self._connect_to_stream():
                retry_count += 1
                logger.warning(f"Retrying connection in {retry_delay}s... (attempt {retry_count})")
                time.sleep(retry_delay)
                continue

            # Reset retry counter on successful connection
            retry_count = 0

            # Process frames
            fps_start = time.time()
            fps_frame_count = 0

            while self.running.is_set():
                try:
                    ret, frame = self.cap.read()

                    if not ret or frame is None:
                        logger.warning(f"Lost connection to {self.camera_id}")
                        break

                    self.frame_count += 1

                    # Skip frames based on frame_skip setting
                    if self.frame_count % settings.frame_skip != 0:
                        continue

                    # Get frame timestamp (PTS-based or wall-clock)
                    frame_timestamp, video_pts_ms, loop_count = self._get_frame_timestamp()

                    # Perform object detection with frame timestamp
                    detections = self.detector.detect(
                        frame,
                        frame_timestamp=frame_timestamp,
                        video_pts_ms=video_pts_ms,
                        loop_count=loop_count,
                        camera_id=self.camera_id
                    )

                    # Call callback if detections found
                    if detections and self.detection_callback:
                        self.detection_callback(self.camera_id, detections, frame)

                    # FPS limiting
                    fps_frame_count += 1
                    elapsed = time.time() - fps_start

                    if elapsed > 1.0:
                        actual_fps = fps_frame_count / elapsed
                        logger.debug(f"{self.camera_id}: {actual_fps:.1f} FPS processed")
                        fps_start = time.time()
                        fps_frame_count = 0

                    # Limit processing FPS
                    target_delay = 1.0 / settings.max_fps
                    time.sleep(max(0, target_delay - 0.001))

                except Exception as e:
                    logger.error(f"Error processing frame from {self.camera_id}: {e}")
                    break

            # Release capture before retry
            if self.cap:
                self.cap.release()
                self.cap = None

        logger.info(f"Stream processor for {self.camera_id} stopped")
