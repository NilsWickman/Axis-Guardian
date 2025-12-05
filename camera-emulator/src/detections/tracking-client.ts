/**
 * Tracking service client
 * POSTs detections to the tracking service
 */

import type { Detection, DetectionFrame } from '../types.js'

export class TrackingClient {
  private errorCount = 0
  private maxErrorLog = 3

  constructor(
    private trackingServiceUrl: string,
    private trackingCameraId: string
  ) {}

  /**
   * POST detections to tracking service
   */
  async postDetections(frame: DetectionFrame): Promise<void> {
    if (frame.detections.length === 0) {
      return
    }

    try {
      const response = await fetch(`${this.trackingServiceUrl}/api/emulator-detections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: this.trackingCameraId,
          frame_number: frame.frame_number,
          timestamp: frame.timestamp,
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
