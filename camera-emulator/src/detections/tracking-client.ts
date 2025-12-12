/**
 * Tracking service client
 * POSTs detections to the tracking service
 */

import type { Detection, DetectionFrame } from '../types.js'

// RTP clock rate for video (H.264 standard)
const RTP_CLOCK_RATE = 90000

export interface TrackingClientOptions {
  /** Video FPS for calculating video timing */
  fps?: number
}

export class TrackingClient {
  private errorCount = 0
  private maxErrorLog = 3
  private fps: number
  private rtpTicksPerFrame: number

  constructor(
    private trackingServiceUrl: string,
    private trackingCameraId: string,
    options: TrackingClientOptions = {}
  ) {
    this.fps = options.fps ?? 30
    this.rtpTicksPerFrame = Math.round(RTP_CLOCK_RATE / this.fps)
  }

  /**
   * POST detections to tracking service
   * Includes video timing info for frontend sync
   */
  async postDetections(frame: DetectionFrame): Promise<void> {
    if (frame.detections.length === 0) {
      return
    }

    // Calculate video timing for sync
    const videoTimeMs = (frame.frame_number / this.fps) * 1000
    const rtpTimestamp = frame.frame_number * this.rtpTicksPerFrame
    const dispatchTime = Date.now()
    const wallTimestampSec = dispatchTime / 1000

    try {
      const response = await fetch(`${this.trackingServiceUrl}/api/emulator-detections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: this.trackingCameraId,
          frame_number: frame.frame_number,
          // Use wall-clock timestamp so tracking service expiry works.
          // Relative video timing is provided separately via video_time_ms/rtp_timestamp.
          timestamp: wallTimestampSec,
          video_time_ms: videoTimeMs,
          rtp_timestamp: rtpTimestamp,
          dispatch_time: dispatchTime,
          detections: frame.detections,
        }),
        signal: AbortSignal.timeout(2000),  // 2 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Reset error count on success
      this.errorCount = 0
    } catch (error) {
      this.errorCount++
      if (this.errorCount <= this.maxErrorLog) {
        console.warn(`Tracking service error (${this.errorCount}):`, error)
      }
    }
  }
}
