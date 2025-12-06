/**
 * Detection synchronization
 * Syncs detection metadata with video frames
 */

import msgpack from 'msgpack-lite'
import type { DetectionData, DetectionFrame, DetectionMetadata } from '../types.js'

export class DetectionSync {
  private frames: DetectionFrame[]
  private fps: number
  private totalFrames: number

  constructor(
    private cameraId: string,
    detectionData: DetectionData
  ) {
    this.frames = detectionData.frames
    this.fps = detectionData.video_info.fps || 30
    this.totalFrames = detectionData.video_info.total_frames || this.frames.length
  }

  /**
   * Get detection metadata for a specific frame number
   * @param frameNumber - Current video frame number
   * @param dispatchTime - High-resolution dispatch timestamp (ms) for timing measurement
   * @param videoTimeMs - Video presentation time in ms (for sync with video element)
   * @returns MessagePack-encoded detection metadata
   */
  getDetectionForFrame(frameNumber: number, dispatchTime?: number, videoTimeMs?: number): Buffer {
    // Handle looping - wrap frame number to valid range
    const index = frameNumber % this.frames.length
    const frame = this.frames[index]
    const now = dispatchTime ?? Date.now()

    // Calculate video time from frame number if not provided
    const calculatedVideoTimeMs = videoTimeMs ?? (frameNumber / this.fps) * 1000

    if (!frame) {
      // Return empty detections if no frame data
      const metadata: DetectionMetadata = {
        camera_id: this.cameraId,
        frame_number: frameNumber,
        timestamp: now / 1000,  // Use current wall-clock time in seconds
        detection_count: 0,
        detections: [],
        detection_frame: frameNumber,
        dispatch_time: now,  // High-res ms timestamp for timing measurement
        video_time_ms: calculatedVideoTimeMs,  // Video presentation time for sync
      }
      return msgpack.encode(metadata)
    }

    const metadata: DetectionMetadata = {
      camera_id: this.cameraId,
      frame_number: frame.frame_number,
      timestamp: now / 1000,  // Use current wall-clock time in seconds
      detection_count: frame.detections.length,
      detections: frame.detections,
      detection_frame: frameNumber,
      dispatch_time: now,  // High-res ms timestamp for timing measurement
      video_time_ms: calculatedVideoTimeMs,  // Video presentation time for sync
    }

    return msgpack.encode(metadata)
  }

  /**
   * Get raw detection frame for tracking service
   */
  getRawDetectionForFrame(frameNumber: number): DetectionFrame | null {
    const index = frameNumber % this.frames.length
    return this.frames[index] || null
  }

  getFps(): number {
    return this.fps
  }

  getTotalFrames(): number {
    return this.totalFrames
  }
}
