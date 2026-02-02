/**
 * Detection Processor - Main pipeline orchestrator
 *
 * Receives raw detections from camera emulators, projects them to world
 * coordinates, and feeds them into the TrackManager.
 */

import type { DetectionMessage, RawDetection, GlobalTrack, CameraDetection, CameraFrameInfo, CameraHealthStatus, DetectionAttributes } from '../types.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'
import { TrackManager } from '../tracks/track-manager.js'
import { CameraRegistry } from './camera-registry.js'
import { logProjectionFailure } from '../api/routes.js'
import { getPipelineLogger } from '../debug/pipeline-logger.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { BatchOptimizer, type BatchOptimizerConfig, type FrameAssignment } from '../optimization/batch-optimizer.js'
import { getMetrics } from '../metrics/index.js'
import {
  ProjectionPipeline,
  type IProjectionLogger,
  type ProjectionPipelineDeps,
  FULL_PIPELINE_CONFIG,
  MULTI_CAMERA_PIPELINE_CONFIG,
} from './projection-pipeline.js'

/**
 * Common interface for detection processors
 * Used by AcapClient and other consumers that need to process detections
 */
/** Room bounds for position validation */
export interface RoomBounds {
  width: number
  height: number
}

export interface IDetectionProcessor {
  processMessage(message: DetectionMessage): GlobalTrack[]
  processMultiCameraMessages(messages: DetectionMessage[]): GlobalTrack[]
  setObstacles(obstacles: SiteMapObstacle[]): void
  setRoomBounds(bounds: RoomBounds): void
  getCameraFrameInfo(): CameraFrameInfo[]
  getCameraHealthStatus(): CameraHealthStatus[]
  getLastProcessedFrame(cameraId: string): number
  updateFrameInfo(cameraId: string, frameNumber: number): void
  resetFrameTracking(): void
  processInjection(
    cameraId: string,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
    localTrackId?: number,
    attributes?: DetectionAttributes
  ): GlobalTrack | null
  processWorldPosition(
    cameraId: string,
    worldX: number,
    worldY: number,
    confidence: number,
    localTrackId?: number
  ): GlobalTrack
}

const IMAGE_WIDTH = ALGORITHM_CONSTANTS.detection.imageWidth
const IMAGE_HEIGHT = ALGORITHM_CONSTANTS.detection.imageHeight
// Threshold to detect camera restart (frame number reset)
const FRAME_JUMP_BACKWARD_THRESHOLD = ALGORITHM_CONSTANTS.detection.frameJumpBackwardThreshold

/**
 * Adapter that wraps the pipeline logger to match IProjectionLogger interface
 */
class PipelineLoggerAdapter implements IProjectionLogger {
  private logger = getPipelineLogger()

  logRawDetection(
    cameraId: string,
    detection: RawDetection,
    frameNumber: number
  ): string | null {
    return this.logger.logRawDetection(cameraId, detection, frameNumber)
  }

  logProjectedPosition(
    cameraId: string,
    localTrackId: number | undefined,
    worldX: number,
    worldY: number,
    isValid: boolean,
    projectionMethod: 'krt',
    projectionReason?: string,
    rawDetectionKey?: string
  ): void {
    this.logger.logProjectedPosition(
      cameraId,
      localTrackId,
      worldX,
      worldY,
      isValid,
      projectionMethod,
      projectionReason,
      rawDetectionKey
    )
  }
}

export class DetectionProcessor implements IDetectionProcessor {
  private lastProcessedFrames: Map<string, number> = new Map()
  private lastFrameTimestamps: Map<string, number> = new Map()
  private lastCleanupTime: number = Date.now()
  private static readonly MAX_CAMERAS = 100  // Prevent unbounded growth
  private static readonly CLEANUP_INTERVAL_MS = 60000  // Cleanup every minute
  /** Tables/furniture that block view (used for occlusion-based position adjustment) */
  private viewBlockingObstacles: SiteMapObstacle[] = []
  /** Optional batch optimizer for multi-frame global assignment */
  private batchOptimizer: BatchOptimizer | null = null
  /** Callback for when batch optimizer emits a frame */
  public onBatchFrameEmitted?: (assignment: FrameAssignment) => void
  /** Projection pipeline for detection processing */
  private projectionPipeline: ProjectionPipeline
  /** Dependencies for the projection pipeline */
  private pipelineDeps: ProjectionPipelineDeps

  constructor(
    private trackManager: TrackManager,
    protected cameraRegistry: CameraRegistry,
    batchOptimizerConfig?: Partial<BatchOptimizerConfig>
  ) {
    // Initialize projection pipeline with logger
    this.projectionPipeline = new ProjectionPipeline(new PipelineLoggerAdapter())

    // Create pipeline dependencies
    this.pipelineDeps = {
      getCalibration: (cameraId) => this.cameraRegistry.getCalibration(cameraId),
      getCamera: (cameraId) => this.cameraRegistry.getCamera(cameraId),
      getBiasCorrection: (cameraId) => this.cameraRegistry.getBiasCorrection(cameraId),
      hasKnownLocalAssociation: (cameraId, localTrackId) => {
        return this.trackManager.getAllActiveTracks().some(t =>
          (t.cameraAssociations.get(cameraId)?.trackIds.includes(localTrackId)) === true
        )
      },
    }

    // Initialize batch optimizer if enabled
    if (ALGORITHM_CONSTANTS.batch.enabled || batchOptimizerConfig?.enabled) {
      this.batchOptimizer = new BatchOptimizer(
        {
          getActiveTracks: () => this.trackManager.getActiveTracks(),
          getAllTracks: () => this.trackManager.getAllTracks(),
          processBatchDetections: (dets) => this.trackManager.processBatchDetections(dets),
        },
        {
          ...ALGORITHM_CONSTANTS.batch,
          ...batchOptimizerConfig,
          onFrameEmitted: (assignment) => {
            this.onBatchFrameEmitted?.(assignment)
          },
        }
      )
      console.log(`[DetectionProcessor] Batch optimization enabled: ${ALGORITHM_CONSTANTS.batch.emissionDelayFrames} frame delay, ${ALGORITHM_CONSTANTS.batch.optimizationWindowSize} optimization window, ${ALGORITHM_CONSTANTS.batch.maxBufferSize} max buffer`)
    }
  }

  /**
   * Handle a camera restart / loop event where frame numbers jump backward.
   *
   * This is critical when running behind the sync buffer: synchronized processing
   * uses `processMultiCameraMessages()`, so restart detection must exist there too.
   *
   * We clear tracks to avoid mixing sessions and reset per-camera frame tracking
   * so new frames (starting near 0) are not treated as permanently out-of-order.
   */
  private handleCameraRestart(cameraId: string, lastFrame: number, newFrame: number): void {
    console.log(
      `[DetectionProcessor] Camera ${cameraId} appears to have restarted/looped ` +
      `(frame ${newFrame} < ${lastFrame} - ${FRAME_JUMP_BACKWARD_THRESHOLD}). ` +
      `Clearing all tracks and resetting frame tracking.`
    )
    this.trackManager.clearAllTracks()
    // Reset per-camera frame tracking so frame numbers starting from ~0 are accepted.
    this.lastProcessedFrames.delete(cameraId)
    this.lastFrameTimestamps.delete(cameraId)

    // If batch optimization is enabled, clear its internal buffer so it doesn't mix
    // frames across video loops. (No-op if optimizer doesn't implement reset.)
    this.batchOptimizer?.reset()
  }

  /**
   * Check if batch optimization is enabled
   */
  get isBatchOptimizationEnabled(): boolean {
    return this.batchOptimizer?.isEnabled ?? false
  }

  /**
   * Get batch optimizer status
   */
  getBatchOptimizerStatus(): { bufferSize: number; status: string; isBuffering: boolean; framesEmitted: number } | null {
    return this.batchOptimizer?.getStatus() ?? null
  }

  /**
   * Set obstacles for detection filtering and occlusion detection
   * - Obstacles with blocksTracking=true will filter out detections inside them
   * - Obstacles with blocksView=true and height >= 0.8m will be used for occlusion detection
   */
  setObstacles(obstacles: SiteMapObstacle[]): void {
    // Delegate to projection pipeline
    this.projectionPipeline.setObstacles(obstacles)

    // Keep view-blocking obstacles locally for processInjection()
    this.viewBlockingObstacles = obstacles.filter((obs) =>
      obs.blocksView === true &&
      obs.height !== undefined &&
      obs.height >= 0.8 &&
      obs.height <= 1.3 &&
      obs.category === 'furniture'
    )

    const trackingBlocking = obstacles.filter((obs) => obs.blocksTracking !== false)
    console.log(`[DetectionProcessor] Loaded ${trackingBlocking.length} tracking-blocking obstacles`)
    console.log(`[DetectionProcessor] Loaded ${this.viewBlockingObstacles.length} view-blocking obstacles (tables)`)
  }

  /**
   * Set room bounds for filtering out-of-bounds projections
   * Detections projecting outside room bounds will be filtered out
   */
  setRoomBounds(bounds: RoomBounds): void {
    // Delegate to projection pipeline
    this.projectionPipeline.setRoomBounds(bounds)
    console.log(`[DetectionProcessor] Room bounds set: ${bounds.width}m x ${bounds.height}m`)
  }

  /**
   * Process a detection message from a camera emulator
   * Uses batch processing with Hungarian algorithm for optimal assignment
   */
  processMessage(message: DetectionMessage): GlobalTrack[] {
    const cameraId = this.cameraRegistry.normalizeCameraId(message.camera_id)

    // Check for frame number changes
    const lastFrame = this.lastProcessedFrames.get(cameraId) ?? -1

    // Detect camera restart: frame number jumped backward significantly
    if (lastFrame > 0 && message.frame_number < lastFrame - FRAME_JUMP_BACKWARD_THRESHOLD) {
      this.handleCameraRestart(cameraId, lastFrame, message.frame_number)
    }

    // Skip if we've already processed this frame (unless camera restarted)
    const lastFrameAfterRestart = this.lastProcessedFrames.get(cameraId) ?? -1
    if (
      message.frame_number <= lastFrameAfterRestart &&
      message.frame_number >= lastFrameAfterRestart - FRAME_JUMP_BACKWARD_THRESHOLD
    ) {
      return []
    }
    this.lastProcessedFrames.set(cameraId, message.frame_number)
    this.lastFrameTimestamps.set(cameraId, Date.now())

    // Periodic cleanup to prevent memory leaks from stale camera entries
    this.periodicCleanup()

    // Get camera parameters - early return if camera not found
    const camera = this.cameraRegistry.getCamera(cameraId)
    if (!camera) {
      console.warn(`Unknown camera: ${cameraId}`)
      return []
    }

    // Convert timestamp from seconds to ms
    const timestampMs = message.timestamp * 1000

    // Use projection pipeline for all detection processing
    const projectedDetections = this.projectionPipeline.projectDetections(
      message.detections,
      cameraId,
      message.frame_number,
      timestampMs,
      message.video_time_ms,
      message.rtp_timestamp,
      this.pipelineDeps,
      FULL_PIPELINE_CONFIG
    )

    // Route through batch optimizer if enabled, otherwise use direct processing
    let result: GlobalTrack[] = []
    if (projectedDetections.length > 0) {
      if (this.batchOptimizer) {
        // Batch mode: buffer frames for multi-frame optimization
        // Returns tracks during hybrid mode (first window) or empty during buffering
        result = this.batchOptimizer.addFrame(
          message.frame_number,
          timestampMs,
          projectedDetections
        )
      } else {
        // Frame-by-frame mode: direct Hungarian assignment
        result = this.trackManager.processBatchDetections(projectedDetections)
      }
    }

    // Record end-to-end latency if dispatch_time was provided
    if (message.dispatch_time) {
      const latencyMs = Date.now() - message.dispatch_time
      getMetrics().recordLatency(latencyMs)
    }

    return result
  }

  // Debug counter
  private debugCount = 0

  /**
   * Process a detection injection request (for testing)
   */
  processInjection(
    cameraId: string,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
    localTrackId: number = 0,
    attributes?: DetectionAttributes
  ): GlobalTrack | null {
    const normalizedCameraId = this.cameraRegistry.normalizeCameraId(cameraId)

    // Get camera for occlusion detection
    const camera = this.cameraRegistry.getCamera(normalizedCameraId)

    // KRT-only injection: without calibration we cannot project.
    const calibration = this.cameraRegistry.getCalibration(normalizedCameraId)
    if (!camera || !calibration) {
      if (this.debugCount < 3) console.warn(`No calibration for camera: ${cameraId}`)
      logProjectionFailure(`track=${localTrackId}: no_calibration`)
      return null
    }

    const result = projectDetectionWithKRT(
      bbox,
      calibration,
      camera,
      this.viewBlockingObstacles,
      true,
      IMAGE_WIDTH,
      IMAGE_HEIGHT
    )

    if (!result.isValid) {
      logProjectionFailure(`track=${localTrackId}: ${result.reason}`)
      return null
    }

    // Apply camera-specific bias correction
    const biasCorrection = this.cameraRegistry.getBiasCorrection(normalizedCameraId)
    const correctedX = result.worldPoint.x + biasCorrection.x
    const correctedY = result.worldPoint.y + biasCorrection.y

    return this.trackManager.processDetection(
      normalizedCameraId,
      localTrackId,
      correctedX,
      correctedY,
      confidence,
      attributes
    )
  }

  /**
   * Process a direct world position (bypasses projection)
   */
  processWorldPosition(
    cameraId: string,
    worldX: number,
    worldY: number,
    confidence: number,
    localTrackId: number = 0
  ): GlobalTrack {
    return this.trackManager.processDetection(
      cameraId,
      localTrackId,
      worldX,
      worldY,
      confidence
    )
  }

  /**
   * Process multiple detection messages from different cameras TOGETHER
   * This is the key for cross-camera correlation - by processing all cameras'
   * detections in a single batch, we can properly cluster same-person detections
   * from different cameras before Hungarian assignment.
   *
   * Use this when you have synchronized or near-synchronized frames from multiple cameras.
   */
  processMultiCameraMessages(messages: DetectionMessage[]): GlobalTrack[] {
    if (messages.length === 0) return []

    const allProjectedDetections: CameraDetection[] = []

    for (const message of messages) {
      const cameraId = this.cameraRegistry.normalizeCameraId(message.camera_id)

      // Detect camera restart / loop: frame number jumped backward significantly.
      // This path is used by the sync buffer, so without this check we'd permanently
      // ignore all frames after a video loop (frame_number resets to 0).
      const lastFrame = this.lastProcessedFrames.get(cameraId) ?? -1
      if (lastFrame > 0 && message.frame_number < lastFrame - FRAME_JUMP_BACKWARD_THRESHOLD) {
        this.handleCameraRestart(cameraId, lastFrame, message.frame_number)
      }

      // Skip if we've already processed this frame (after possible restart reset)
      const lastFrameAfterRestart = this.lastProcessedFrames.get(cameraId) ?? -1
      if (message.frame_number <= lastFrameAfterRestart) {
        continue
      }
      this.lastProcessedFrames.set(cameraId, message.frame_number)
      this.lastFrameTimestamps.set(cameraId, Date.now())

      // Convert timestamp from seconds to ms
      const timestampMs = message.timestamp * 1000

      // Use projection pipeline for all detection processing
      // Note: MULTI_CAMERA_PIPELINE_CONFIG has FOV check disabled and no table occlusion
      const projectedDetections = this.projectionPipeline.projectDetections(
        message.detections,
        cameraId,
        message.frame_number,
        timestampMs,
        message.video_time_ms,
        message.rtp_timestamp,
        this.pipelineDeps,
        MULTI_CAMERA_PIPELINE_CONFIG
      )

      allProjectedDetections.push(...projectedDetections)
    }

    // Periodic cleanup
    this.periodicCleanup()

    // Deduplicate same-camera detections across all cameras
    const deduplicatedDetections = this.projectionPipeline.deduplicateMultiCameraDetections(allProjectedDetections)

    // Process ALL cameras' detections together in a single batch
    // This allows proper cross-camera clustering before Hungarian assignment
    if (deduplicatedDetections.length > 0) {
      return this.trackManager.processBatchDetections(deduplicatedDetections)
    }

    return []
  }

  /**
   * Reset frame tracking (useful for testing)
   */
  resetFrameTracking(): void {
    this.lastProcessedFrames.clear()
    this.lastFrameTimestamps.clear()
    this.lastCleanupTime = Date.now()
  }

  /**
   * Get last processed frame for a camera
   */
  getLastProcessedFrame(cameraId: string): number {
    return this.lastProcessedFrames.get(cameraId) ?? -1
  }

  /**
   * Get frame info for all cameras (for WebSocket broadcasting)
   */
  getCameraFrameInfo(): CameraFrameInfo[] {
    const frames: CameraFrameInfo[] = []
    for (const [cameraId, frameNumber] of this.lastProcessedFrames.entries()) {
      const timestamp = this.lastFrameTimestamps.get(cameraId) ?? 0
      frames.push({ cameraId, frameNumber, timestamp })
    }
    return frames
  }

  /**
   * Get camera health status for all cameras
   * Includes staleness detection and frame drop rate
   */
  getCameraHealthStatus(): CameraHealthStatus[] {
    const now = Date.now()
    const healthStatuses: CameraHealthStatus[] = []
    const STALE_THRESHOLD_MS = 3000  // 3 seconds without update = stale
    const OFFLINE_THRESHOLD_MS = 10000  // 10 seconds = offline

    for (const [cameraId, frameNumber] of this.lastProcessedFrames.entries()) {
      const lastTimestamp = this.lastFrameTimestamps.get(cameraId) ?? 0
      const lastSeenMs = now - lastTimestamp

      // Determine status based on time since last detection
      let status: 'online' | 'stale' | 'offline' = 'online'
      if (lastSeenMs > OFFLINE_THRESHOLD_MS) {
        status = 'offline'
      } else if (lastSeenMs > STALE_THRESHOLD_MS) {
        status = 'stale'
      }

      healthStatuses.push({
        cameraId,
        lastFrameNumber: frameNumber,
        lastSeenMs,
        clockOffsetMs: 0,  // TODO: integrate with sync buffer if available
        frameDropRate: 0,  // TODO: track frame gaps
        status,
      })
    }

    return healthStatuses
  }

  /**
   * Update frame info for a camera (called from HTTP API routes)
   */
  updateFrameInfo(cameraId: string, frameNumber: number): void {
    const normalizedCameraId = this.cameraRegistry.normalizeCameraId(cameraId)
    this.lastProcessedFrames.set(normalizedCameraId, frameNumber)
    this.lastFrameTimestamps.set(normalizedCameraId, Date.now())
  }

  /**
   * Periodic cleanup to prevent memory leaks from accumulated camera entries
   * Removes entries for cameras not in the registry (stale/disconnected cameras)
   */
  private periodicCleanup(): void {
    const now = Date.now()
    if (now - this.lastCleanupTime < DetectionProcessor.CLEANUP_INTERVAL_MS) {
      return
    }
    this.lastCleanupTime = now

    // Remove entries for cameras no longer in the registry
    const registeredCameras = new Set(this.cameraRegistry.getCameraIds())
    const cameraIds = Array.from(this.lastProcessedFrames.keys())
    for (const cameraId of cameraIds) {
      if (!registeredCameras.has(cameraId)) {
        this.lastProcessedFrames.delete(cameraId)
      }
    }

    // Emergency cleanup if too many entries (hard limit)
    if (this.lastProcessedFrames.size > DetectionProcessor.MAX_CAMERAS) {
      // Keep only the most recently used cameras
      const entries = Array.from(this.lastProcessedFrames.entries())
        .sort((a, b) => b[1] - a[1])  // Sort by frame number (higher = more recent)
        .slice(0, DetectionProcessor.MAX_CAMERAS)

      this.lastProcessedFrames.clear()
      for (const [id, frame] of entries) {
        this.lastProcessedFrames.set(id, frame)
      }
    }
  }
}
