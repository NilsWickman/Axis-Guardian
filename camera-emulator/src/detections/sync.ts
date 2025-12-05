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
   * @returns MessagePack-encoded detection metadata
   */
  getDetectionForFrame(frameNumber: number): Buffer {
    // Handle looping - wrap frame number to valid range
    const index = frameNumber % this.frames.length
    const frame = this.frames[index]

    if (!frame) {
      // Return empty detections if no frame data
      const metadata: DetectionMetadata = {
        camera_id: this.cameraId,
        frame_number: frameNumber,
        timestamp: frameNumber / this.fps,
        detection_count: 0,
        detections: [],
        detection_frame: frameNumber,
      }
      return msgpack.encode(metadata)
    }

    const metadata: DetectionMetadata = {
      camera_id: this.cameraId,
      frame_number: frame.frame_number,
      timestamp: frame.timestamp,
      detection_count: frame.detections.length,
      detections: frame.detections,
      detection_frame: frameNumber,
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
