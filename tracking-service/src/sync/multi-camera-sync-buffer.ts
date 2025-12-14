/**
 * Multi-Camera Synchronization Buffer
 *
 * Buffers detection messages from multiple cameras and releases them
 * together when all cameras have reported for a given frame window,
 * or when a timeout expires.
 *
 * This enables proper cross-camera correlation in the tracking pipeline
 * by processing detections from multiple cameras as a single batch.
 */

import type { DetectionMessage } from '../types.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { getMetrics } from '../metrics/index.js'

export interface SyncBufferConfig {
  /** Maximum time to wait for all cameras to report (ms) */
  syncWindowMs: number
  /** Minimum cameras required before considering a batch complete */
  minCamerasForSync: number
  /** Maximum detections to buffer before forcing flush */
  maxBufferedDetections: number
  /** Frame bucket size in ms (groups frames within this window) */
  frameBucketMs: number
  /** Enable frame-number based correlation (for emulators with same video) */
  useFrameNumberCorrelation: boolean
}

export interface SyncMetrics {
  /** Total batches processed */
  batchesProcessed: number
  /** Batches released due to timeout */
  timeoutFlushes: number
  /** Batches released due to all cameras reporting */
  completeBatches: number
  /** Average cameras per batch */
  avgCamerasPerBatch: number
  /** Average detections per batch */
  avgDetectionsPerBatch: number
  /** Maximum frame skew between cameras (ms) */
  maxFrameSkewMs: number
  /** Average sync wait time (ms) */
  avgSyncWaitMs: number
  /** Dropped stale frames */
  droppedStaleFrames: number
  /** Current buffer size */
  currentBufferSize: number
  /** Clock offsets per camera */
  cameraClockOffsets: Map<string, number>
}

/** Pending frame from a single camera */
interface PendingFrame {
  message: DetectionMessage
  receivedAt: number
  frameKey: string
}

/** Bucket of frames to be processed together */
interface FrameBucket {
  frameKey: string
  frames: Map<string, PendingFrame>
  createdAt: number
  videoTimeMs?: number
}

/**
 * Multi-Camera Sync Buffer
 *
 * Groups detection messages by frame time and releases them together
 * for synchronized multi-camera processing.
 */
export class MultiCameraSyncBuffer {
  private config: SyncBufferConfig
  private buckets: Map<string, FrameBucket> = new Map()
  private knownCameras: Set<string> = new Set()
  private flushCallback: ((messages: DetectionMessage[]) => void) | null = null
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private metrics: SyncMetrics
  private batchCameraCounts: number[] = []
  private batchDetectionCounts: number[] = []
  private syncWaitTimes: number[] = []
  private frameSkews: number[] = []
  private cameraClockOffsets: Map<string, number> = new Map()

  constructor(config?: Partial<SyncBufferConfig>) {
    const defaults = ALGORITHM_CONSTANTS.sync
    this.config = {
      syncWindowMs: config?.syncWindowMs ?? defaults.syncWindowMs,
      minCamerasForSync: config?.minCamerasForSync ?? defaults.minCamerasForSync,
      maxBufferedDetections: config?.maxBufferedDetections ?? defaults.maxBufferedDetections,
      frameBucketMs: config?.frameBucketMs ?? defaults.frameBucketMs,
      useFrameNumberCorrelation: config?.useFrameNumberCorrelation ?? defaults.useFrameNumberCorrelation,
    }

    this.metrics = {
      batchesProcessed: 0,
      timeoutFlushes: 0,
      completeBatches: 0,
      avgCamerasPerBatch: 0,
      avgDetectionsPerBatch: 0,
      maxFrameSkewMs: 0,
      avgSyncWaitMs: 0,
      droppedStaleFrames: 0,
      currentBufferSize: 0,
      cameraClockOffsets: new Map(),
    }

    // Start the flush timer
    this.startFlushTimer()
  }

  /**
   * Set the callback for when a batch is ready
   */
  onFlush(callback: (messages: DetectionMessage[]) => void): void {
    this.flushCallback = callback
  }

  /**
   * Register a known camera (affects sync completion logic)
   */
  registerCamera(cameraId: string): void {
    this.knownCameras.add(cameraId)
  }

  /**
   * Unregister a camera
   */
  unregisterCamera(cameraId: string): void {
    this.knownCameras.delete(cameraId)
  }

  /**
   * Get list of registered cameras
   */
  getRegisteredCameras(): string[] {
    return Array.from(this.knownCameras)
  }

  /**
   * Add a detection message to the buffer
   */
  addMessage(message: DetectionMessage): void {
    const receivedAt = Date.now()
    const cameraId = message.camera_id

    // Track known cameras
    this.knownCameras.add(cameraId)

    // Calculate frame key for bucketing
    const frameKey = this.calculateFrameKey(message)

    // Get or create bucket
    let bucket = this.buckets.get(frameKey)
    if (!bucket) {
      bucket = {
        frameKey,
        frames: new Map(),
        createdAt: receivedAt,
        videoTimeMs: message.video_time_ms,
      }
      this.buckets.set(frameKey, bucket)
    }

    // Add frame to bucket (replace if same camera already present)
    bucket.frames.set(cameraId, {
      message,
      receivedAt,
      frameKey,
    })

    // Update buffer size metric
    this.updateBufferSize()

    // Check if we should flush this bucket immediately
    this.checkBucketCompletion(bucket)

    // Check if buffer is getting too large
    this.checkBufferOverflow()
  }

  /**
   * Calculate a frame key for bucketing
   *
   * Uses frame number if available and correlation is enabled,
   * otherwise falls back to time-based bucketing.
   */
  private calculateFrameKey(message: DetectionMessage): string {
    if (this.config.useFrameNumberCorrelation && message.frame_number !== undefined) {
      // Frame number based correlation (ideal for synced emulators)
      return `frame-${message.frame_number}`
    }

    // Time-based bucketing
    const videoTimeMs = message.video_time_ms ?? (message.timestamp * 1000)
    const bucketIndex = Math.floor(videoTimeMs / this.config.frameBucketMs)
    return `time-${bucketIndex}`
  }

  /**
   * Check if a bucket is complete and should be flushed
   */
  private checkBucketCompletion(bucket: FrameBucket): void {
    const cameraCount = bucket.frames.size
    const knownCameraCount = this.knownCameras.size

    // Complete if all known cameras have reported
    if (knownCameraCount > 0 && cameraCount >= knownCameraCount) {
      this.flushBucket(bucket, 'complete')
      return
    }

    // Complete if we have minimum cameras and it's been long enough
    if (cameraCount >= this.config.minCamerasForSync) {
      const age = Date.now() - bucket.createdAt
      if (age >= this.config.syncWindowMs / 2) {
        // Half the sync window with minimum cameras
        this.flushBucket(bucket, 'partial')
      }
    }
  }

  /**
   * Check if buffer is overflowing and needs emergency flush
   */
  private checkBufferOverflow(): void {
    let totalDetections = 0
    for (const bucket of this.buckets.values()) {
      for (const frame of bucket.frames.values()) {
        totalDetections += frame.message.detections.length
      }
    }

    if (totalDetections > this.config.maxBufferedDetections) {
      console.warn(`[SyncBuffer] Buffer overflow (${totalDetections} detections), flushing oldest buckets`)
      this.flushOldestBuckets(Math.ceil(this.buckets.size / 2))
    }
  }

  /**
   * Flush oldest N buckets
   */
  private flushOldestBuckets(count: number): void {
    const sortedBuckets = Array.from(this.buckets.values())
      .sort((a, b) => a.createdAt - b.createdAt)

    for (let i = 0; i < Math.min(count, sortedBuckets.length); i++) {
      this.flushBucket(sortedBuckets[i], 'overflow')
    }
  }

  /**
   * Flush a single bucket
   */
  private flushBucket(
    bucket: FrameBucket,
    reason: 'complete' | 'timeout' | 'partial' | 'overflow'
  ): void {
    // Remove from pending buckets
    this.buckets.delete(bucket.frameKey)

    // Collect messages
    const messages: DetectionMessage[] = []
    const timestamps: number[] = []

    for (const frame of bucket.frames.values()) {
      messages.push(frame.message)
      timestamps.push(frame.receivedAt)
    }

    if (messages.length === 0) return

    // Update metrics
    const now = Date.now()
    const waitTime = now - bucket.createdAt
    this.syncWaitTimes.push(waitTime)
    if (this.syncWaitTimes.length > 100) this.syncWaitTimes.shift()

    this.batchCameraCounts.push(messages.length)
    if (this.batchCameraCounts.length > 100) this.batchCameraCounts.shift()

    const detectionCount = messages.reduce((sum, m) => sum + m.detections.length, 0)
    this.batchDetectionCounts.push(detectionCount)
    if (this.batchDetectionCounts.length > 100) this.batchDetectionCounts.shift()

    // Calculate frame skew
    if (timestamps.length > 1) {
      const minTs = Math.min(...timestamps)
      const maxTs = Math.max(...timestamps)
      const skew = maxTs - minTs
      this.frameSkews.push(skew)
      if (this.frameSkews.length > 100) this.frameSkews.shift()
    }

    this.metrics.batchesProcessed++
    if (reason === 'complete') {
      this.metrics.completeBatches++
    } else if (reason === 'timeout') {
      this.metrics.timeoutFlushes++
    }

    // Record to global metrics
    getMetrics().recordSyncBatch(
      messages.length,
      detectionCount,
      waitTime,
      reason === 'complete'
    )

    // Invoke callback
    if (this.flushCallback) {
      this.flushCallback(messages)
    }

    this.updateBufferSize()
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) return

    this.flushTimer = setInterval(() => {
      this.flushExpiredBuckets()
    }, Math.max(16, this.config.syncWindowMs / 4))
  }

  /**
   * Stop the flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Flush buckets that have exceeded the sync window
   */
  private flushExpiredBuckets(): void {
    const now = Date.now()
    const expiredBuckets: FrameBucket[] = []

    for (const bucket of this.buckets.values()) {
      const age = now - bucket.createdAt
      if (age >= this.config.syncWindowMs) {
        expiredBuckets.push(bucket)
      }
    }

    for (const bucket of expiredBuckets) {
      this.flushBucket(bucket, 'timeout')
    }

    // Drop very stale buckets (> 2x sync window) without processing
    const staleThreshold = this.config.syncWindowMs * 2
    for (const bucket of this.buckets.values()) {
      const age = now - bucket.createdAt
      if (age >= staleThreshold) {
        this.buckets.delete(bucket.frameKey)
        this.metrics.droppedStaleFrames++
      }
    }
  }

  /**
   * Update buffer size metric
   */
  private updateBufferSize(): void {
    let size = 0
    for (const bucket of this.buckets.values()) {
      size += bucket.frames.size
    }
    this.metrics.currentBufferSize = size
  }

  /**
   * Record a clock offset for a camera
   */
  recordClockOffset(cameraId: string, offsetMs: number): void {
    this.cameraClockOffsets.set(cameraId, offsetMs)
    this.metrics.cameraClockOffsets = new Map(this.cameraClockOffsets)
  }

  /**
   * Get server time (for clock sync)
   */
  getServerTime(): number {
    return Date.now()
  }

  /**
   * Get current sync metrics
   */
  getMetrics(): SyncMetrics {
    // Update computed metrics
    if (this.batchCameraCounts.length > 0) {
      this.metrics.avgCamerasPerBatch =
        this.batchCameraCounts.reduce((a, b) => a + b, 0) / this.batchCameraCounts.length
    }

    if (this.batchDetectionCounts.length > 0) {
      this.metrics.avgDetectionsPerBatch =
        this.batchDetectionCounts.reduce((a, b) => a + b, 0) / this.batchDetectionCounts.length
    }

    if (this.frameSkews.length > 0) {
      this.metrics.maxFrameSkewMs = Math.max(...this.frameSkews)
    }

    if (this.syncWaitTimes.length > 0) {
      this.metrics.avgSyncWaitMs =
        this.syncWaitTimes.reduce((a, b) => a + b, 0) / this.syncWaitTimes.length
    }

    return { ...this.metrics }
  }

  /**
   * Flush all pending buckets immediately
   */
  flushAll(): void {
    const buckets = Array.from(this.buckets.values())
    for (const bucket of buckets) {
      this.flushBucket(bucket, 'timeout')
    }
  }

  /**
   * Reset the buffer
   */
  reset(): void {
    this.buckets.clear()
    this.metrics = {
      batchesProcessed: 0,
      timeoutFlushes: 0,
      completeBatches: 0,
      avgCamerasPerBatch: 0,
      avgDetectionsPerBatch: 0,
      maxFrameSkewMs: 0,
      avgSyncWaitMs: 0,
      droppedStaleFrames: 0,
      currentBufferSize: 0,
      cameraClockOffsets: new Map(),
    }
    this.batchCameraCounts = []
    this.batchDetectionCounts = []
    this.syncWaitTimes = []
    this.frameSkews = []
  }

  /**
   * Destroy the buffer (stop timers)
   */
  destroy(): void {
    this.stopFlushTimer()
    this.buckets.clear()
    this.flushCallback = null
  }
}
