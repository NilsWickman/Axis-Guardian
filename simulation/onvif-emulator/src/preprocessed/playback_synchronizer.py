"""Playback synchronizer for preprocessed video and metadata."""

import time
from pathlib import Path
from threading import Lock, Thread
from typing import Callable, Dict, List, Optional

from loguru import logger

from .metadata_loader import DetectionMetadata, MetadataLoader


class PlaybackSynchronizer:
    """Synchronizes preprocessed video playback with detection metadata."""

    def __init__(
        self,
        video_path: Path,
        metadata_path: Path,
        fps: float = 30.0,
        loop: bool = True
    ):
        """Initialize playback synchronizer.

        Args:
            video_path: Path to preprocessed video file
            metadata_path: Path to .detections.json file
            fps: Video frames per second
            loop: Whether to loop playback
        """
        self.video_path = Path(video_path)
        self.metadata_path = Path(metadata_path)
        self.fps = fps
        self.loop = loop

        # Load metadata
        self.metadata_loader = MetadataLoader(metadata_path)

        # Playback state
        self.current_frame = 0
        self.current_timestamp = 0.0
        self.is_playing = False
        self.playback_speed = 1.0
        self.start_time: Optional[float] = None
        self._lock = Lock()

        # Subscribers
        self.frame_callbacks: List[Callable[[int, DetectionMetadata], None]] = []
        self.timestamp_callbacks: List[Callable[[float, DetectionMetadata], None]] = []

        # Playback thread
        self.playback_thread: Optional[Thread] = None

        logger.info(
            f"Initialized playback synchronizer: "
            f"{self.metadata_loader.total_frames} frames, "
            f"{self.metadata_loader.duration:.2f}s duration"
        )

    def subscribe_frame(self, callback: Callable[[int, DetectionMetadata], None]) -> None:
        """Subscribe to frame updates.

        Args:
            callback: Function called with (frame_number, metadata)
        """
        self.frame_callbacks.append(callback)

    def subscribe_timestamp(self, callback: Callable[[float, DetectionMetadata], None]) -> None:
        """Subscribe to timestamp updates.

        Args:
            callback: Function called with (timestamp, metadata)
        """
        self.timestamp_callbacks.append(callback)

    def start(self) -> None:
        """Start playback."""
        if self.is_playing:
            logger.warning("Playback already started")
            return

        with self._lock:
            self.is_playing = True
            self.start_time = time.time()
            self.current_frame = 0
            self.current_timestamp = 0.0

        self.playback_thread = Thread(target=self._playback_loop, daemon=True)
        self.playback_thread.start()

        logger.info("Playback started")

    def stop(self) -> None:
        """Stop playback."""
        if not self.is_playing:
            return

        with self._lock:
            self.is_playing = False

        if self.playback_thread:
            self.playback_thread.join(timeout=2.0)

        logger.info("Playback stopped")

    def pause(self) -> None:
        """Pause playback."""
        with self._lock:
            self.is_playing = False
        logger.info("Playback paused")

    def resume(self) -> None:
        """Resume playback."""
        if not self.is_playing:
            self.start()

    def seek(self, frame_number: int) -> None:
        """Seek to a specific frame.

        Args:
            frame_number: Target frame number
        """
        with self._lock:
            self.current_frame = max(0, min(frame_number, self.metadata_loader.total_frames - 1))
            metadata = self.metadata_loader.get_by_frame(self.current_frame)
            if metadata:
                self.current_timestamp = metadata.timestamp
            self.start_time = time.time() - (self.current_timestamp / self.playback_speed)

        logger.debug(f"Seeked to frame {self.current_frame}")

    def seek_timestamp(self, timestamp: float) -> None:
        """Seek to a specific timestamp.

        Args:
            timestamp: Target timestamp in seconds
        """
        metadata = self.metadata_loader.get_by_timestamp(timestamp)
        if metadata:
            self.seek(metadata.frame_number)

    def set_playback_speed(self, speed: float) -> None:
        """Set playback speed multiplier.

        Args:
            speed: Speed multiplier (1.0 = normal, 2.0 = 2x speed, etc.)
        """
        with self._lock:
            old_speed = self.playback_speed
            self.playback_speed = max(0.1, min(speed, 10.0))

            # Adjust start_time to maintain current position
            if self.start_time is not None:
                elapsed_video_time = (time.time() - self.start_time) * old_speed
                self.start_time = time.time() - (elapsed_video_time / self.playback_speed)

        logger.info(f"Playback speed set to {self.playback_speed}x")

    def _playback_loop(self) -> None:
        """Main playback loop."""
        frame_duration = 1.0 / self.fps

        while True:
            with self._lock:
                if not self.is_playing:
                    break

                # Calculate current playback position
                if self.start_time is not None:
                    elapsed_real_time = time.time() - self.start_time
                    elapsed_video_time = elapsed_real_time * self.playback_speed

                    # Calculate target frame based on elapsed time
                    target_frame = int(elapsed_video_time * self.fps)

                    # Check if we've reached the end
                    if target_frame >= self.metadata_loader.total_frames:
                        if self.loop:
                            # Loop back to start
                            self.current_frame = 0
                            self.current_timestamp = 0.0
                            self.start_time = time.time()
                            logger.debug("Looping playback")
                        else:
                            # Stop playback
                            self.is_playing = False
                            logger.info("Playback finished")
                            break
                    else:
                        self.current_frame = target_frame

                    # Get metadata for current frame
                    metadata = self.metadata_loader.get_by_frame(self.current_frame)
                    if metadata:
                        self.current_timestamp = metadata.timestamp

                        # Notify subscribers
                        try:
                            for callback in self.frame_callbacks:
                                callback(self.current_frame, metadata)
                            for callback in self.timestamp_callbacks:
                                callback(self.current_timestamp, metadata)
                        except Exception as e:
                            logger.error(f"Error in playback callback: {e}")

            # Sleep for frame duration (adjusted for playback speed)
            time.sleep(frame_duration / self.playback_speed)

    def get_current_metadata(self) -> Optional[DetectionMetadata]:
        """Get metadata for current frame.

        Returns:
            Current frame metadata or None
        """
        with self._lock:
            return self.metadata_loader.get_by_frame(self.current_frame)

    def get_statistics(self) -> Dict:
        """Get playback and metadata statistics.

        Returns:
            Dictionary with statistics
        """
        metadata_stats = self.metadata_loader.get_statistics()

        with self._lock:
            metadata_stats.update({
                "current_frame": self.current_frame,
                "current_timestamp": self.current_timestamp,
                "is_playing": self.is_playing,
                "playback_speed": self.playback_speed,
                "fps": self.fps,
                "loop": self.loop
            })

        return metadata_stats
