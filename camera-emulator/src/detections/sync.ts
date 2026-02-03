/**
 * Detection synchronization
 * Syncs detection metadata with video frames
 */

import msgpack from 'msgpack-lite'
import type { DetectionData, DetectionFrame, DetectionMetadata } from '../types.js'

// RTP clock rate for video (H.264 standard)
const RTP_CLOCK_RATE = 90000

export class DetectionSync {
  private frames: DetectionFrame[]
  private fps: number
  private totalFrames: number
  private rtpTicksPerFrame: number
  /** Map from frame_number to DetectionFrame for O(1) lookup */
  private frameMap: Map<number, DetectionFrame>

  constructor(
    private cameraId: string,
    detectionData: DetectionData
  ) {
    this.frames = detectionData.frames
    this.fps = detectionData.video_info.fps || 30
    this.totalFrames = detectionData.video_info.total_frames || this.frames.length
    // Calculate RTP ticks per frame (e.g., 90000/30 = 3000 ticks per frame at 30fps)
    this.rtpTicksPerFrame = Math.round(RTP_CLOCK_RATE / this.fps)

    // Build frame map for O(1) lookup by frame_number
    // This handles sparse detection arrays where some frames have no detections
    this.frameMap = new Map()
    for (const frame of this.frames) {
      this.frameMap.set(frame.frame_number, frame)
    }
  }

  /**
   * Get detection metadata for a specific frame number
   * @param frameNumber - Current video frame number
   * @param dispatchTime - High-resolution dispatch timestamp (ms) for timing measurement
   * @param videoTimeMs - Video presentation time in ms (for sync with video element)
   * @param actualRtpTimestamp - Actual RTP timestamp from FFmpeg's output time (preferred over calculated)
   * @returns MessagePack-encoded detection metadata
   */
  getDetectionForFrame(frameNumber: number, dispatchTime?: number, videoTimeMs?: number, actualRtpTimestamp?: number): Buffer {
    // Handle looping - wrap to video frame range (not array length)
    // This ensures both cameras use the same video frame number for sync
    const videoFrameNumber = frameNumber % this.totalFrames
    // Look up by frame_number, not array index (handles sparse arrays)
    const frame = this.frameMap.get(videoFrameNumber)
    const now = dispatchTime ?? Date.now()

    // Calculate video time from frame number if not provided
    const calculatedVideoTimeMs = videoTimeMs ?? (frameNumber / this.fps) * 1000

    // Use actual RTP timestamp from FFmpeg's output time if available
    // This ensures detection timestamps match the video's actual presentation time
    // Fall back to calculated timestamp for backwards compatibility
    const rtpTimestamp = actualRtpTimestamp ?? (frameNumber * this.rtpTicksPerFrame)

    if (!frame) {
      // Return empty detections if no frame data (sparse array - no detections for this frame)
      const metadata: DetectionMetadata = {
        camera_id: this.cameraId,
        frame_number: videoFrameNumber,  // Use video frame number for consistency
        timestamp: now / 1000,  // Use current wall-clock time in seconds
        detection_count: 0,
        detections: [],
        detection_frame: videoFrameNumber,  // Video frame number (0 to totalFrames-1)
        dispatch_time: now,  // High-res ms timestamp for timing measurement
        video_time_ms: calculatedVideoTimeMs,  // Video presentation time for sync
        rtp_timestamp: rtpTimestamp,  // RTP timestamp for frame-perfect sync
        fps: this.fps,  // Video frame rate for frame-based sync
      }
      return msgpack.encode(metadata)
    }

    const metadata: DetectionMetadata = {
      camera_id: this.cameraId,
      frame_number: videoFrameNumber,  // Use video frame number for consistency
      timestamp: now / 1000,  // Use current wall-clock time in seconds
      detection_count: frame.detections.length,
      detections: frame.detections,
      detection_frame: videoFrameNumber,  // Video frame number (0 to totalFrames-1)
      dispatch_time: now,  // High-res ms timestamp for timing measurement
      video_time_ms: calculatedVideoTimeMs,  // Video presentation time for sync
      rtp_timestamp: rtpTimestamp,  // RTP timestamp for frame-perfect sync
      fps: this.fps,  // Video frame rate for frame-based sync
    }

    return msgpack.encode(metadata)
  }

  /**
   * Get raw detection frame for tracking service
   */
  getRawDetectionForFrame(frameNumber: number): DetectionFrame | null {
    // Handle looping - wrap to video frame range (not array length)
    const videoFrameNumber = frameNumber % this.totalFrames
    const frame = this.frameMap.get(videoFrameNumber)
    if (!frame) {
      return null
    }
    // Return frame with consistent video frame number
    return {
      ...frame,
      frame_number: videoFrameNumber,
    }
  }

  getFps(): number {
    return this.fps
  }

  getTotalFrames(): number {
    return this.totalFrames
  }
}
