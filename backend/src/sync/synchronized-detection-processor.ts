/**
 * Synchronized Detection Processor
 *
 * Wraps a DetectionProcessor with a MultiCameraSyncBuffer to provide
 * synchronized multi-camera detection processing.
 *
 * When enabled, incoming detections are buffered and grouped by frame
 * before being processed together, enabling proper cross-camera correlation.
 */

import type { DetectionMessage, GlobalTrack, CameraFrameInfo, CameraHealthStatus } from '../types.js'
import type { IDetectionProcessor, RoomBounds } from '../detection/detection-processor.js'
import { MultiCameraSyncBuffer, type SyncBufferConfig } from './multi-camera-sync-buffer.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { randomUUID } from 'node:crypto'

export interface SynchronizedProcessorConfig extends Partial<SyncBufferConfig> {
  /** Enable synchronization buffer (default: from ALGORITHM_CONSTANTS) */
  enabled?: boolean
}

/**
 * Synchronized Detection Processor
 *
 * Provides optional multi-camera synchronization by buffering detections
 * and releasing them together when all cameras have reported.
 */
export class SynchronizedDetectionProcessor implements IDetectionProcessor {
  private processor: IDetectionProcessor
  private syncBuffer: MultiCameraSyncBuffer | null = null
  private enabled: boolean
  private lastResults: GlobalTrack[] = []
  private waiters: Map<string, { resolve: (r: FlushAwaitResult) => void; timeout: ReturnType<typeof setTimeout> }> = new Map()

  constructor(
    processor: IDetectionProcessor,
    config?: SynchronizedProcessorConfig
  ) {
    this.processor = processor
    this.enabled = config?.enabled ?? ALGORITHM_CONSTANTS.sync.enabled

    if (this.enabled) {
      this.syncBuffer = new MultiCameraSyncBuffer(config)

      // Set up the flush callback to process synchronized batches
      this.syncBuffer.onFlush((messages) => {
        const tracks = this.processor.processMultiCameraMessages(messages)
        this.lastResults = tracks

        // Resolve any callers waiting for *their* message to be included in this flush.
        // We match by an internal request id attached to the DetectionMessage object.
        for (const msg of messages) {
          const id = (msg as unknown as { __requestId?: string }).__requestId
          if (!id) continue
          const waiter = this.waiters.get(id)
          if (!waiter) continue
          clearTimeout(waiter.timeout)
          this.waiters.delete(id)
          waiter.resolve({ tracks, timedOut: false })
        }
      })

      console.log('[SyncProcessor] Multi-camera synchronization enabled')
    } else {
      console.log('[SyncProcessor] Synchronization disabled, processing immediately')
    }
  }

  /**
   * Get the underlying sync buffer (for status/metrics)
   */
  getSyncBuffer(): MultiCameraSyncBuffer | null {
    return this.syncBuffer
  }

  /**
   * Check if synchronization is enabled
   */
  isSyncEnabled(): boolean {
    return this.enabled && this.syncBuffer !== null
  }

  /**
   * Process a detection message
   *
   * If sync is enabled, buffers the message and returns results from
   * the most recent synchronized batch. Otherwise, processes immediately.
   */
  processMessage(message: DetectionMessage): GlobalTrack[] {
    if (this.syncBuffer) {
      // Add to sync buffer - results will come via flush callback
      this.syncBuffer.addMessage(message)

      // Return the most recent results (may be from a previous batch)
      // This maintains backwards compatibility with callers expecting immediate results
      return this.lastResults
    }

    // No sync buffer - process immediately
    return this.processor.processMessage(message)
  }

  /**
   * Process a detection message and (best-effort) wait for the sync buffer flush
   * that contains this message, so HTTP callers can get a coherent per-request result.
   *
   * If the flush doesn't happen within timeoutMs, returns the latest known results.
   */
  async processMessageAwaitFlush(
    message: DetectionMessage,
    timeoutMs: number = Math.max(250, (ALGORITHM_CONSTANTS.sync.syncWindowMs ?? 66) * 3)
  ): Promise<FlushAwaitResult> {
    if (!this.syncBuffer) {
      return { tracks: this.processor.processMessage(message), timedOut: false }
    }

    const msgWithId = message as unknown as { __requestId?: string }
    const requestId = msgWithId.__requestId ?? randomUUID()
    msgWithId.__requestId = requestId

    // Avoid leaking waiters if a duplicate id somehow occurs.
    const existing = this.waiters.get(requestId)
    if (existing) {
      clearTimeout(existing.timeout)
      this.waiters.delete(requestId)
    }

    return await new Promise<FlushAwaitResult>((resolve) => {
      const timeout = setTimeout(() => {
        this.waiters.delete(requestId)
        resolve({ tracks: this.lastResults, timedOut: true })
      }, timeoutMs)

      this.waiters.set(requestId, { resolve, timeout })
      this.syncBuffer!.addMessage(message)
    })
  }

  /**
   * Process multiple camera messages together
   *
   * When called directly (e.g., from batch endpoint), bypasses the sync buffer
   * since the caller is already providing synchronized data.
   */
  processMultiCameraMessages(messages: DetectionMessage[]): GlobalTrack[] {
    // Direct multi-camera call bypasses sync buffer
    const results = this.processor.processMultiCameraMessages(messages)
    this.lastResults = results
    return results
  }

  /**
   * Register a camera with the sync buffer
   */
  registerCamera(cameraId: string): void {
    this.syncBuffer?.registerCamera(cameraId)
  }

  /**
   * Unregister a camera from the sync buffer
   */
  unregisterCamera(cameraId: string): void {
    this.syncBuffer?.unregisterCamera(cameraId)
  }

  // ========== IDetectionProcessor delegation ==========

  setObstacles(obstacles: SiteMapObstacle[]): void {
    this.processor.setObstacles(obstacles)
  }

  setRoomBounds(bounds: RoomBounds): void {
    this.processor.setRoomBounds(bounds)
  }

  getCameraFrameInfo(): CameraFrameInfo[] {
    return this.processor.getCameraFrameInfo()
  }

  getCameraHealthStatus(): CameraHealthStatus[] {
    return this.processor.getCameraHealthStatus()
  }

  getLastProcessedFrame(cameraId: string): number {
    return this.processor.getLastProcessedFrame(cameraId)
  }

  updateFrameInfo(cameraId: string, frameNumber: number): void {
    this.processor.updateFrameInfo(cameraId, frameNumber)
  }

  resetFrameTracking(): void {
    this.processor.resetFrameTracking()
    this.syncBuffer?.reset()
    this.lastResults = []
    // Clear any pending waiters (return empty results rather than hanging).
    for (const waiter of this.waiters.values()) {
      clearTimeout(waiter.timeout)
      waiter.resolve({ tracks: [], timedOut: true })
    }
    this.waiters.clear()
  }

  processInjection(
    cameraId: string,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
    trackId?: number
  ): GlobalTrack | null {
    return this.processor.processInjection(cameraId, bbox, confidence, trackId)
  }

  processWorldPosition(
    cameraId: string,
    worldX: number,
    worldY: number,
    confidence: number,
    trackId?: number
  ): GlobalTrack {
    return this.processor.processWorldPosition(cameraId, worldX, worldY, confidence, trackId)
  }

  /**
   * Flush any pending detections in the sync buffer
   */
  flush(): void {
    this.syncBuffer?.flushAll()
  }

  /**
   * Destroy the processor (cleanup timers)
   */
  destroy(): void {
    this.syncBuffer?.destroy()
    this.syncBuffer = null
    for (const waiter of this.waiters.values()) {
      clearTimeout(waiter.timeout)
      waiter.resolve({ tracks: [], timedOut: true })
    }
    this.waiters.clear()
  }
}

export interface FlushAwaitResult {
  tracks: GlobalTrack[]
  timedOut: boolean
}
