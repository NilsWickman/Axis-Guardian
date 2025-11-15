"""WebRTC video track for preprocessed video files."""

import asyncio
import fractions
import time
from pathlib import Path
from typing import Optional

import av
import numpy as np
from aiortc import VideoStreamTrack
from av import VideoFrame
from loguru import logger


class PreprocessedVideoTrack(VideoStreamTrack):
    """Video track that streams preprocessed video files."""

    def __init__(self, video_path: Path, loop: bool = True):
        """Initialize preprocessed video track.

        Args:
            video_path: Path to preprocessed video file (MP4)
            loop: Whether to loop the video
        """
        super().__init__()
        self.video_path = Path(video_path)
        self.loop = loop

        # Open video container
        self.container: Optional[av.container.InputContainer] = None
        self.stream: Optional[av.video.stream.VideoStream] = None
        self._open_video()

        # Timing
        self.start_time: Optional[float] = None
        self.frame_count = 0

        logger.info(
            f"Initialized preprocessed video track: {video_path.name} "
            f"({self.stream.width}x{self.stream.height} @ {self.stream.average_rate}fps)"
        )

    def _open_video(self):
        """Open video file."""
        try:
            self.container = av.open(str(self.video_path))
            self.stream = self.container.streams.video[0]
            self.stream.thread_type = "AUTO"
        except Exception as e:
            logger.error(f"Failed to open video {self.video_path}: {e}")
            raise

    def _close_video(self):
        """Close video file."""
        if self.container:
            self.container.close()
            self.container = None
            self.stream = None

    async def recv(self) -> VideoFrame:
        """Receive next video frame.

        Returns:
            VideoFrame for WebRTC
        """
        if self.start_time is None:
            self.start_time = time.time()

        try:
            # Get next frame from container
            for packet in self.container.demux(self.stream):
                for frame in packet.decode():
                    # Update timing
                    pts = frame.pts
                    time_base = self.stream.time_base
                    frame_time = float(pts * time_base) if pts is not None else 0.0

                    # Calculate target presentation time
                    if self.start_time is not None:
                        elapsed = time.time() - self.start_time
                        if frame_time > elapsed:
                            # Sleep to maintain frame rate
                            await asyncio.sleep(frame_time - elapsed)

                    # Update frame timestamp for WebRTC
                    frame.pts = int((time.time() - self.start_time) * 90000)  # 90kHz clock
                    frame.time_base = fractions.Fraction(1, 90000)

                    self.frame_count += 1
                    return frame

            # End of video
            if self.loop:
                logger.debug("Looping video")
                self._close_video()
                self._open_video()
                self.start_time = time.time()
                self.frame_count = 0
                # Recursively get first frame of looped video
                return await self.recv()
            else:
                logger.info("Video playback finished")
                raise Exception("End of video stream")

        except Exception as e:
            logger.error(f"Error receiving frame: {e}")
            raise

    def stop(self):
        """Stop the video track."""
        super().stop()
        self._close_video()
        logger.info("Preprocessed video track stopped")
