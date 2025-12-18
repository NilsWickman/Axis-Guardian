/**
 * Pipeline Debug Logger
 *
 * Logs full tracking pipeline data to SQLite for troubleshooting.
 * Can be enabled/disabled at runtime via API or env var.
 *
 * Pipeline stages logged:
 * 1. Raw detections (from camera emulator)
 * 2. Projected positions (after ground-plane projection)
 * 3. Track associations (after Hungarian assignment)
 * 4. Track state snapshots (periodic Kalman filter state)
 */

import { eq } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  debugSessions,
  debugRawDetections,
  debugProjectedPositions,
  debugTrackAssociations,
  debugTrackStates,
  type NewDebugRawDetection,
  type NewDebugProjectedPosition,
  type NewDebugTrackAssociation,
  type NewDebugTrackState,
} from '../db/schema.js'
import type { GlobalTrack, RawDetection } from '../types.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'

export interface PipelineLoggerConfig {
  enabled: boolean
  batchSize: number  // Number of records to batch before flushing
  flushIntervalMs: number  // Max time before forcing flush
  logTrackStateIntervalMs: number  // How often to snapshot track states
}

const DEFAULT_CONFIG: PipelineLoggerConfig = {
  enabled: false,
  batchSize: 100,
  flushIntervalMs: 1000,
  logTrackStateIntervalMs: 500,
}

/**
 * Singleton pipeline logger for debug data collection
 */
export class PipelineLogger {
  private static instance: PipelineLogger | null = null

  private config: PipelineLoggerConfig
  private currentSessionId: string | null = null
  private lastTrackStateLog: number = 0

  // Batched records
  private rawDetectionBatch: NewDebugRawDetection[] = []
  private projectedPositionBatch: NewDebugProjectedPosition[] = []
  private trackAssociationBatch: NewDebugTrackAssociation[] = []
  private trackStateBatch: NewDebugTrackState[] = []

  // Map raw detection to its DB id for linking
  private rawDetectionIdMap: Map<string, number> = new Map()
  private projectedPositionIdMap: Map<string, number> = new Map()

  private flushTimer: NodeJS.Timeout | null = null

  private constructor(config: Partial<PipelineLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Check env var for initial state
    if (process.env.DEBUG_PIPELINE === 'true') {
      this.config.enabled = true
    }
  }

  static getInstance(config?: Partial<PipelineLoggerConfig>): PipelineLogger {
    if (!PipelineLogger.instance) {
      PipelineLogger.instance = new PipelineLogger(config)
    }
    return PipelineLogger.instance
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Start a new debug session
   */
  async startSession(name?: string): Promise<string> {
    const db = getDb()
    const sessionId = `debug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    await db.insert(debugSessions).values({
      id: sessionId,
      name: name ?? `Debug Session ${new Date().toISOString()}`,
    })

    this.currentSessionId = sessionId
    this.config.enabled = true
    this.startFlushTimer()

    console.log(`[PipelineLogger] Started session: ${sessionId}`)
    return sessionId
  }

  /**
   * End the current debug session
   */
  async endSession(notes?: string): Promise<void> {
    if (!this.currentSessionId) return

    // Flush any remaining batches
    await this.flush()
    this.stopFlushTimer()

    const db = getDb()
    await db.update(debugSessions)
      .set({
        endedAt: new Date(),
        notes,
      })
      .where(eq(debugSessions.id, this.currentSessionId))

    console.log(`[PipelineLogger] Ended session: ${this.currentSessionId}`)
    this.currentSessionId = null
    this.config.enabled = false
  }

  /**
   * Check if logging is currently enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.currentSessionId !== null
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId
  }

  // ============================================================================
  // Logging Methods
  // ============================================================================

  /**
   * Log a raw detection from camera emulator
   */
  logRawDetection(
    cameraId: string,
    detection: RawDetection,
    frameNumber?: number
  ): string | null {
    if (!this.isEnabled()) return null

    const timestamp = Date.now()
    const detectionKey = `${cameraId}-${frameNumber}-${detection.track_id}`

    // Parse bbox
    let bbox = { x: 0, y: 0, width: 0, height: 0 }
    if (Array.isArray(detection.bbox) && detection.bbox.length === 4) {
      bbox = {
        x: detection.bbox[0],
        y: detection.bbox[1],
        width: detection.bbox[2],
        height: detection.bbox[3],
      }
    }

    this.rawDetectionBatch.push({
      sessionId: this.currentSessionId!,
      timestamp,
      cameraId,
      frameNumber: frameNumber ?? null,
      trackId: detection.track_id ?? null,
      className: detection.class_name,
      confidence: detection.confidence,
      bboxX: bbox.x,
      bboxY: bbox.y,
      bboxWidth: bbox.width,
      bboxHeight: bbox.height,
    })

    this.checkBatchFlush()
    return detectionKey
  }

  /**
   * Log a projected position after ground-plane projection
   */
  logProjectedPosition(
    cameraId: string,
    trackId: number | undefined,
    worldX: number,
    worldY: number,
    isValid: boolean,
    projectionMethod: 'krt' | 'legacy',
    reason?: string,
    rawDetectionKey?: string
  ): string | null {
    if (!this.isEnabled()) return null

    const timestamp = Date.now()
    const positionKey = `${cameraId}-${timestamp}-${trackId}`

    this.projectedPositionBatch.push({
      sessionId: this.currentSessionId!,
      rawDetectionId: rawDetectionKey ? this.rawDetectionIdMap.get(rawDetectionKey) ?? null : null,
      timestamp,
      cameraId,
      trackId: trackId ?? null,
      worldX,
      worldY,
      isValid,
      projectionReason: reason ?? null,
      projectionMethod,
    })

    this.checkBatchFlush()
    return positionKey
  }

  /**
   * Log a track association after Hungarian assignment
   */
  logTrackAssociation(
    cameraId: string,
    cameraTrackId: number | undefined,
    worldX: number,
    worldY: number,
    globalTrackId: string | null,
    assignmentType: 'matched' | 'new_track' | 'reidentified' | 'rejected',
    cost?: number,
    projectedPositionKey?: string
  ): void {
    if (!this.isEnabled()) return

    this.trackAssociationBatch.push({
      sessionId: this.currentSessionId!,
      projectedPositionId: projectedPositionKey ? this.projectedPositionIdMap.get(projectedPositionKey) ?? null : null,
      timestamp: Date.now(),
      cameraId,
      cameraTrackId: cameraTrackId ?? null,
      worldX,
      worldY,
      globalTrackId,
      assignmentType,
      assignmentCost: cost ?? null,
    })

    this.checkBatchFlush()
  }

  /**
   * Log track state snapshots (call periodically)
   */
  logTrackStates(tracks: GlobalTrack[], kalmanFilter?: KalmanTrackFilter): void {
    if (!this.isEnabled()) return

    const now = Date.now()

    // Rate limit track state logging
    if (now - this.lastTrackStateLog < this.config.logTrackStateIntervalMs) {
      return
    }
    this.lastTrackStateLog = now

    for (const track of tracks) {
      let velocityX = 0
      let velocityY = 0
      let positionUncertainty = 0

      if (track.kalmanState && kalmanFilter) {
        const velocity = kalmanFilter.getVelocity(track.kalmanState)
        velocityX = velocity.x
        velocityY = velocity.y
        positionUncertainty = kalmanFilter.getPositionUncertainty(track.kalmanState)
      }

      const cameraIds = Array.from(track.cameraAssociations.keys())

      this.trackStateBatch.push({
        sessionId: this.currentSessionId!,
        timestamp: now,
        globalTrackId: track.globalTrackId,
        positionX: track.currentPosition.x,
        positionY: track.currentPosition.y,
        velocityX,
        velocityY,
        positionUncertainty,
        state: track.state ?? 'confirmed',
        isActive: track.isActive,
        isConfirmed: track.isConfirmed,
        detectionCount: track.detectionCount,
        confidence: track.confidence,
        missedFrames: track.missedFrames ?? 0,
        cameraIds: JSON.stringify(cameraIds),
      })
    }

    this.checkBatchFlush()
  }

  // ============================================================================
  // Batch Management
  // ============================================================================

  private checkBatchFlush(): void {
    const totalSize =
      this.rawDetectionBatch.length +
      this.projectedPositionBatch.length +
      this.trackAssociationBatch.length +
      this.trackStateBatch.length

    if (totalSize >= this.config.batchSize) {
      this.flush().catch(err => console.error('[PipelineLogger] Flush error:', err))
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return

    this.flushTimer = setInterval(() => {
      this.flush().catch(err => console.error('[PipelineLogger] Timer flush error:', err))
    }, this.config.flushIntervalMs)
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Flush all batched records to database
   */
  async flush(): Promise<void> {
    if (!this.currentSessionId) return

    const db = getDb()

    try {
      // Flush raw detections
      if (this.rawDetectionBatch.length > 0) {
        const batch = [...this.rawDetectionBatch]
        this.rawDetectionBatch = []
        await db.insert(debugRawDetections).values(batch)
      }

      // Flush projected positions
      if (this.projectedPositionBatch.length > 0) {
        const batch = [...this.projectedPositionBatch]
        this.projectedPositionBatch = []
        await db.insert(debugProjectedPositions).values(batch)
      }

      // Flush track associations
      if (this.trackAssociationBatch.length > 0) {
        const batch = [...this.trackAssociationBatch]
        this.trackAssociationBatch = []
        await db.insert(debugTrackAssociations).values(batch)
      }

      // Flush track states
      if (this.trackStateBatch.length > 0) {
        const batch = [...this.trackStateBatch]
        this.trackStateBatch = []
        await db.insert(debugTrackStates).values(batch)
      }
    } catch (error) {
      console.error('[PipelineLogger] Database flush error:', error)
    }
  }

  // ============================================================================
  // Query Methods (for troubleshooting)
  // ============================================================================

  /**
   * Get stats for current or specified session
   */
  async getSessionStats(sessionId?: string): Promise<{
    rawDetections: number
    projectedPositions: number
    trackAssociations: number
    trackStates: number
  }> {
    const db = getDb()
    const id = sessionId ?? this.currentSessionId
    if (!id) return { rawDetections: 0, projectedPositions: 0, trackAssociations: 0, trackStates: 0 }

    const [rawCount] = await db
      .select({ count: debugRawDetections.id })
      .from(debugRawDetections)
      .where(eq(debugRawDetections.sessionId, id))

    const [projectedCount] = await db
      .select({ count: debugProjectedPositions.id })
      .from(debugProjectedPositions)
      .where(eq(debugProjectedPositions.sessionId, id))

    const [assocCount] = await db
      .select({ count: debugTrackAssociations.id })
      .from(debugTrackAssociations)
      .where(eq(debugTrackAssociations.sessionId, id))

    const [stateCount] = await db
      .select({ count: debugTrackStates.id })
      .from(debugTrackStates)
      .where(eq(debugTrackStates.sessionId, id))

    return {
      rawDetections: rawCount?.count ?? 0,
      projectedPositions: projectedCount?.count ?? 0,
      trackAssociations: assocCount?.count ?? 0,
      trackStates: stateCount?.count ?? 0,
    }
  }
}

// Export singleton getter
export function getPipelineLogger(): PipelineLogger {
  return PipelineLogger.getInstance()
}
