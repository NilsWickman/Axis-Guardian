"""Custom WebRTC video track with detection metadata."""

import asyncio
import fractions
import json
import os
import time
from pathlib import Path
from typing import Optional, Dict, List, Any
from concurrent.futures import ThreadPoolExecutor
from collections import deque
import cv2
import numpy as np
import msgpack
from av import VideoFrame
from aiortc import RTCDataChannel, VideoStreamTrack
from loguru import logger

from detector import ObjectDetector
from metrics import metrics
from video_track_precomputed import load_precomputed_detections, get_detection_for_frame


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
        precomputed_detections_path: Optional[str] = None,
    ):
        """
        Initialize detection video track.

        Args:
            rtsp_url: RTSP stream URL
            camera_id: Camera identifier
            detector: ObjectDetector instance
            data_channel: WebRTC data channel for metadata
            precomputed_detections_path: Optional path to pre-computed detections JSON
        """
        super().__init__()
        self.rtsp_url = rtsp_url
        self.camera_id = camera_id
        self.detector = detector
        self.data_channel = data_channel

        # Pre-computed detections support
        self.precomputed_detections: Optional[Dict[int, List[Any]]] = None
        self.use_precomputed = False
        if precomputed_detections_path:
            self.precomputed_detections = load_precomputed_detections(precomputed_detections_path)
            self.use_precomputed = self.precomputed_detections is not None

        # Per-camera thread pool to avoid cross-camera blocking
        # Using 1 worker ensures sequential processing for this camera
        self._executor = ThreadPoolExecutor(
            max_workers=1,
            thread_name_prefix=f"detect-{camera_id}"
        )

        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_count = 0
        self.running = True

        # Video properties
        self.fps = 30
        self.frame_time = 1.0 / self.fps
        self.target_frame_time = 1.0 / self.fps

        # Adaptive FPS control
        self.current_fps_limit = 30  # Start at max, will be adjusted dynamically
        self.min_fps = 10  # Never go below 10 FPS
        self.overload_counter = 0  # Track consecutive overload frames
        self.underload_counter = 0  # Track consecutive underload frames

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

        # Adaptive buffer sizing
        self.buffer_size = 2  # Start with low latency (2 frames)
        self.frame_loss_count = 0
        self.total_frames_attempted = 0
        self.last_buffer_adjustment = time.time()
        self.buffer_adjustment_interval = 10.0  # Adjust every 10 seconds

        # Frame validation with temporal consistency
        self.frame_history = deque(maxlen=30)  # Last 30 frames statistics

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
        if self.use_precomputed:
            logger.info(f"  ✓ Using pre-computed detections (optimized mode)")

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

            # Set adaptive buffer size (starts at 2, can grow to 10)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, self.buffer_size)
            logger.info(f"RTSP buffer size set to {self.buffer_size} frames")

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
            self.total_frames_attempted += 1
            ret, frame = self.cap.read()

            if not ret or frame is None:
                self.frame_loss_count += 1
                metrics.increment_counter('frames_lost_total', labels={'camera': self.camera_id})
                logger.warning(f"Lost connection to {self.camera_id}, reconnecting...")
                if self.cap:
                    self.cap.release()
                    self.cap = None

                # Adjust buffer before reconnecting
                self._adjust_buffer_size()
                return self._create_black_frame()

            # Track successful frame reads
            metrics.increment_counter('frames_read_total', labels={'camera': self.camera_id})

            # Validate frame integrity (sampled - every 10th frame for performance)
            # This reduces CPU overhead while still catching persistent corruption issues
            if self.frame_count % 10 == 0:
                if not self._is_valid_frame(frame):
                    self.corrupted_frames += 1
                    metrics.increment_counter('frames_corrupted_total', labels={'camera': self.camera_id})

                    # Log periodically to avoid spam
                    if self.corrupted_frames % 30 == 0:
                        logger.warning(
                            f"[{self.camera_id}] Corrupted frames detected: {self.corrupted_frames} total. "
                            "This may be due to network issues or RTSP stream quality."
                        )

                    # Use last valid frame if available, otherwise return current (may have artifacts)
                    if self.last_valid_frame is not None:
                        frame = self.last_valid_frame
                    # else: continue with potentially corrupted frame to avoid stream interruption
                else:
                    # Cache this valid frame for error recovery
                    self.last_valid_frame = frame.copy()

            self.frame_count += 1
            frame_timestamp = time.time()

            # Handle detections: pre-computed or real-time
            if self.use_precomputed:
                # Use pre-computed detections (instant lookup, no processing)
                detections = get_detection_for_frame(self.precomputed_detections, self.frame_count)

                if detections:
                    # Update latest detections for drawing
                    self.latest_detections = detections
                    self.detection_frame_number = self.frame_count

                    # Cache for data channel sending
                    self.detection_cache[self.frame_count] = {
                        "detections": detections,
                        "timestamp": frame_timestamp,
                    }

                    # Keep cache reasonable
                    if len(self.detection_cache) > 10:
                        oldest_frame = min(self.detection_cache.keys())
                        del self.detection_cache[oldest_frame]

                    metrics.increment_counter('detections_precomputed_total', labels={'camera': self.camera_id})
            else:
                # Real-time detection (original behavior)
                should_detect = self._should_run_detection()

                if should_detect:
                    # Track detections initiated
                    metrics.increment_counter('detections_initiated_total', labels={'camera': self.camera_id})

                    # Run detection asynchronously in thread pool
                    # Note: We don't copy the frame here since:
                    # 1. The detector will only read from it (no mutations)
                    # 2. OpenCV operations are thread-safe for reading
                    # 3. Detection processing happens before next frame arrives
                    # 4. This saves ~1MB memory copy per detection on 720p
                    loop = asyncio.get_event_loop()

                    # Time the detection
                    detection_start = time.time()

                    def on_complete_with_timing(f):
                        detection_time = time.time() - detection_start
                        metrics.observe_histogram(
                            'detection_latency_seconds',
                            detection_time,
                            labels={'camera': self.camera_id}
                        )
                        self._on_detection_complete(f, self.frame_count, frame_timestamp)

                    detection_future = loop.run_in_executor(
                        self._executor,
                        self.detector.detect,
                        frame,  # No copy - safe since detector only reads
                        frame_timestamp
                    )

                    # Don't await - let detection run in background
                    # Store future for retrieval when ready
                    detection_future.add_done_callback(on_complete_with_timing)
                    self.last_detection_frame = self.frame_count
                    self.frames_since_detection = 0
                else:
                    self.frames_since_detection += 1
                    metrics.increment_counter('detections_skipped_total', labels={'camera': self.camera_id})

            # Send any ready detection results via data channel
            await self._send_cached_detections(self.frame_count, frame_timestamp)

            # Draw detections on frame before encoding (only if not pre-rendered)
            # Pre-rendered videos already have boxes drawn, so skip drawing
            if self.use_precomputed:
                frame_with_detections = frame  # Already has detections drawn
            else:
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

            # Track processing time
            metrics.observe_histogram(
                'frame_processing_seconds',
                processing_time,
                labels={'camera': self.camera_id}
            )

            # Update gauges
            metrics.set_gauge('buffer_size', self.buffer_size, labels={'camera': self.camera_id})
            metrics.set_gauge('avg_processing_time_seconds', self.avg_processing_time, labels={'camera': self.camera_id})
            metrics.set_gauge('current_fps_limit', self.current_fps_limit, labels={'camera': self.camera_id})

            # Periodic buffer adjustment based on frame loss rate
            self._adjust_buffer_size()

            # Adaptive FPS throttling: reduce FPS when system is overloaded
            self._adjust_fps_limit(processing_time)

            # Sleep based on current FPS limit
            adaptive_frame_time = 1.0 / self.current_fps_limit
            sleep_time = max(0, adaptive_frame_time - processing_time)
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                self.dropped_frames += 1
                if self.dropped_frames % 30 == 0:
                    logger.warning(
                        f"[{self.camera_id}] Running behind: {self.dropped_frames} frames dropped, "
                        f"avg processing time: {self.avg_processing_time*1000:.1f}ms, "
                        f"current FPS limit: {self.current_fps_limit}"
                    )

            return video_frame

        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return self._create_black_frame()

    def _adjust_buffer_size(self):
        """
        Adaptively adjust RTSP buffer size based on frame loss rate.

        - Low frame loss (< 2%): Reduce buffer for lower latency
        - Medium frame loss (2-5%): Keep current buffer
        - High frame loss (> 5%): Increase buffer for stability
        """
        current_time = time.time()
        time_since_adjustment = current_time - self.last_buffer_adjustment

        # Only adjust every N seconds to avoid thrashing
        if time_since_adjustment < self.buffer_adjustment_interval:
            return

        # Calculate frame loss rate
        if self.total_frames_attempted > 0:
            frame_loss_rate = self.frame_loss_count / self.total_frames_attempted
        else:
            frame_loss_rate = 0.0

        old_buffer_size = self.buffer_size

        # Adjust buffer based on loss rate
        if frame_loss_rate > 0.05:  # > 5% loss - increase buffer
            self.buffer_size = min(10, self.buffer_size + 2)
            logger.info(
                f"[{self.camera_id}] High frame loss ({frame_loss_rate*100:.1f}%), "
                f"increasing buffer: {old_buffer_size} → {self.buffer_size}"
            )
        elif frame_loss_rate < 0.02 and self.buffer_size > 2:  # < 2% loss - reduce buffer
            self.buffer_size = max(2, self.buffer_size - 1)
            logger.info(
                f"[{self.camera_id}] Low frame loss ({frame_loss_rate*100:.1f}%), "
                f"reducing buffer for lower latency: {old_buffer_size} → {self.buffer_size}"
            )
        else:
            # 2-5% loss is acceptable, keep current buffer
            logger.debug(
                f"[{self.camera_id}] Frame loss rate: {frame_loss_rate*100:.1f}%, "
                f"buffer stable at {self.buffer_size}"
            )

        # Update buffer if it changed and we have an active capture
        if self.buffer_size != old_buffer_size and self.cap is not None:
            try:
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, self.buffer_size)
            except Exception as e:
                logger.warning(f"Failed to update buffer size: {e}")

        # Reset counters
        self.frame_loss_count = 0
        self.total_frames_attempted = 0
        self.last_buffer_adjustment = current_time

    def _adjust_fps_limit(self, processing_time: float):
        """
        Adaptively adjust FPS limit based on processing load.

        If processing is taking too long relative to target frame time,
        reduce FPS to prevent accumulating lag. If processing is consistently
        fast, increase FPS back toward the maximum.

        Args:
            processing_time: Time taken to process current frame in seconds
        """
        from config import settings

        # Get target FPS from settings (respects MAX_FPS env var)
        max_fps = min(settings.max_fps, 30)  # Cap at 30 FPS

        # Calculate load factor: how much of the target frame time we're using
        target_frame_time = 1.0 / self.current_fps_limit
        load_factor = processing_time / target_frame_time

        # Thresholds for adjustment
        overload_threshold = 0.90  # Using >90% of available time = overloaded
        underload_threshold = 0.70  # Using <70% of available time = underloaded

        if load_factor > overload_threshold:
            # System is overloaded - increment counter
            self.overload_counter += 1
            self.underload_counter = 0

            # Reduce FPS after 5 consecutive overload frames (prevents jitter)
            if self.overload_counter >= 5:
                old_fps = self.current_fps_limit
                # Reduce by 20% or at least 2 FPS, but never below min_fps
                reduction = max(2, int(self.current_fps_limit * 0.2))
                self.current_fps_limit = max(self.min_fps, self.current_fps_limit - reduction)

                if self.current_fps_limit != old_fps:
                    logger.info(
                        f"[{self.camera_id}] High CPU load detected "
                        f"(processing: {processing_time*1000:.1f}ms, target: {target_frame_time*1000:.1f}ms), "
                        f"reducing FPS: {old_fps} → {self.current_fps_limit}"
                    )
                    self.overload_counter = 0  # Reset after adjustment

        elif load_factor < underload_threshold:
            # System has spare capacity - increment counter
            self.underload_counter += 1
            self.overload_counter = 0

            # Increase FPS after 30 consecutive underload frames (be conservative)
            if self.underload_counter >= 30 and self.current_fps_limit < max_fps:
                old_fps = self.current_fps_limit
                # Increase by 10% or at least 1 FPS, but never above max_fps
                increase = max(1, int(self.current_fps_limit * 0.1))
                self.current_fps_limit = min(max_fps, self.current_fps_limit + increase)

                if self.current_fps_limit != old_fps:
                    logger.info(
                        f"[{self.camera_id}] Spare CPU capacity detected, "
                        f"increasing FPS: {old_fps} → {self.current_fps_limit}"
                    )
                    self.underload_counter = 0  # Reset after adjustment
        else:
            # Load is in acceptable range - reset counters
            self.overload_counter = 0
            self.underload_counter = 0

    def _is_valid_frame(self, frame: np.ndarray) -> bool:
        """
        Validate frame integrity using temporal consistency to detect corrupted frames.

        Uses historical frame statistics to detect sudden anomalies that indicate
        H.264 decode errors or transmission corruption.

        Args:
            frame: Frame to validate

        Returns:
            True if frame appears valid, False if likely corrupted
        """
        if frame is None or frame.size == 0:
            return False

        try:
            # Calculate frame statistics
            mean_val = np.mean(frame)
            std_val = np.std(frame)

            # Check for NaN or inf values
            if np.isnan(mean_val) or np.isinf(mean_val):
                return False

            # Extremely low variation (solid color artifact)
            if std_val < 1:
                return False

            # Temporal consistency check (if we have history)
            if len(self.frame_history) >= 5:
                # Calculate historical averages
                hist_means = [h['mean'] for h in self.frame_history]
                hist_stds = [h['std'] for h in self.frame_history]

                avg_mean = np.mean(hist_means)
                avg_std = np.mean(hist_stds)
                std_of_means = np.std(hist_means)

                # Detect sudden dramatic changes (likely corruption)
                # Allow for scene changes but catch decoder errors

                # Sudden jump to all black/white (common corruption pattern)
                if (mean_val < 5 and avg_mean > 50) or (mean_val > 250 and avg_mean < 200):
                    return False

                # Dramatic mean change (> 3 standard deviations from history)
                # But only if the scene has been relatively stable
                if std_of_means < 20:  # Stable scene
                    mean_deviation = abs(mean_val - avg_mean)
                    threshold = 3 * std_of_means + 20  # Add base threshold

                    if mean_deviation > threshold:
                        return False

                # Sudden std collapse (corruption often creates uniform regions)
                if std_val < avg_std * 0.3 and avg_std > 10:
                    return False

            # Store current frame stats for future validation
            self.frame_history.append({
                'mean': mean_val,
                'std': std_val,
                'timestamp': time.time()
            })

            return True

        except Exception as e:
            # Silently fail - assume valid to avoid blocking stream
            return True

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
            return frame

        for detection in self.latest_detections:
            bbox = detection['bbox']
            class_name = detection['class_name']
            confidence = detection['confidence']

            # Convert normalized coordinates to pixels
            x1 = int(bbox['left'] * frame_width)
            y1 = int(bbox['top'] * frame_height)
            x2 = int(bbox['right'] * frame_width)
            y2 = int(bbox['bottom'] * frame_height)

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
        """Send detection results from cache via data channel using MessagePack."""
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
                    "format": "msgpack",  # Indicate MessagePack encoding
                }

                # Serialize with MessagePack (30-50% smaller than JSON)
                message = msgpack.packb(metadata, use_bin_type=True)
                self.data_channel.send(message)

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

        # Shutdown the per-camera thread pool
        if hasattr(self, '_executor'):
            self._executor.shutdown(wait=True, cancel_futures=True)
            logger.debug(f"Shutdown thread pool for {self.camera_id}")

        logger.info(f"DetectionVideoTrack stopped for {self.camera_id}")
