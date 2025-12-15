/**
 * Detection Processor - Main pipeline orchestrator
 *
 * Receives raw detections from camera emulators, projects them to world
 * coordinates, and feeds them into the TrackManager.
 */

import type { DetectionMessage, RawDetection, GlobalTrack, CameraDetection, CameraFrameInfo } from '../types.js'
import {
  projectDetectionWithKRT,
  radToDeg,
  angleDifference,
} from '../projection/ground-plane.js'
import { TrackManager } from '../tracks/track-manager.js'
import { CameraRegistry } from './camera-registry.js'
import { logProjectionFailure } from '../api/routes.js'
import { getPipelineLogger } from '../debug/pipeline-logger.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { isPointInsideAnyObstacle } from '../geometry/obstacles.js'
import type { ZoneManager } from '../zones/zone-manager.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { BatchOptimizer, type BatchOptimizerConfig, type FrameAssignment } from '../optimization/batch-optimizer.js'

/**
 * Common interface for detection processors
 * Used by AcapClient and other consumers that need to process detections
 */
export interface IDetectionProcessor {
  processMessage(message: DetectionMessage): GlobalTrack[]
  processMultiCameraMessages(messages: DetectionMessage[]): GlobalTrack[]
  setZoneManager(zoneManager: ZoneManager): void
  setObstacles(obstacles: SiteMapObstacle[]): void
  getCameraFrameInfo(): CameraFrameInfo[]
  getLastProcessedFrame(cameraId: string): number
  updateFrameInfo(cameraId: string, frameNumber: number): void
  resetFrameTracking(): void
  processInjection(
    cameraId: string,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
    trackId?: number
  ): GlobalTrack | null
  processWorldPosition(
    cameraId: string,
    worldX: number,
    worldY: number,
    confidence: number,
    trackId?: number
  ): GlobalTrack
}

const MIN_CONFIDENCE = ALGORITHM_CONSTANTS.detection.minConfidence
const IMAGE_WIDTH = ALGORITHM_CONSTANTS.detection.imageWidth
const IMAGE_HEIGHT = ALGORITHM_CONSTANTS.detection.imageHeight
// Threshold to detect camera restart (frame number reset)
const FRAME_JUMP_BACKWARD_THRESHOLD = ALGORITHM_CONSTANTS.detection.frameJumpBackwardThreshold
// Same-camera deduplication distance (removes duplicate YOLO detections for same person)
const SAME_CAMERA_DEDUP_DISTANCE = ALGORITHM_CONSTANTS.detection.sameCameraDeduplicationDistanceM

export class DetectionProcessor implements IDetectionProcessor {
  private lastProcessedFrames: Map<string, number> = new Map()
  private lastFrameTimestamps: Map<string, number> = new Map()
  private lastCleanupTime: number = Date.now()
  private static readonly MAX_CAMERAS = 100  // Prevent unbounded growth
  private static readonly CLEANUP_INTERVAL_MS = 60000  // Cleanup every minute
  /** Obstacles that block tracking (detections inside are filtered out) */
  private trackingBlockingObstacles: SiteMapObstacle[] = []
  /** Tables/furniture that block view (used for occlusion-based position adjustment) */
  private viewBlockingObstacles: SiteMapObstacle[] = []
  private obstacleFilterCount: number = 0
  /** Counter for same-camera deduplicated detections */
  private sameCameraDeduplicatedCount: number = 0
  /** Optional batch optimizer for multi-frame global assignment */
  private batchOptimizer: BatchOptimizer | null = null
  /** Callback for when batch optimizer emits a frame */
  public onBatchFrameEmitted?: (assignment: FrameAssignment) => void

  constructor(
    private trackManager: TrackManager,
    protected cameraRegistry: CameraRegistry,
    batchOptimizerConfig?: Partial<BatchOptimizerConfig>
  ) {
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
   * Set zone manager for camera restart detection (future use)
   * @param _zoneManager - Zone manager instance (currently unused, placeholder for future feature)
   */
  setZoneManager(_zoneManager: ZoneManager): void {
    // Future use: clear zone states on camera restart
  }

  /**
   * Set obstacles for detection filtering and occlusion detection
   * - Obstacles with blocksTracking=true will filter out detections inside them
   * - Obstacles with blocksView=true and height >= 0.8m will be used for occlusion detection
   */
  setObstacles(obstacles: SiteMapObstacle[]): void {
    // Obstacles that block tracking (detections inside are filtered out)
    this.trackingBlockingObstacles = obstacles.filter((obs) => obs.blocksTracking !== false)

    // Tables/furniture that block view (used for occlusion-based position adjustment)
    // Only include obstacles that:
    // 1. Have blocksView=true
    // 2. Are at table height (0.8m - 1.3m) - lower than a standing person
    // 3. Are furniture category (not structural like pillars)
    this.viewBlockingObstacles = obstacles.filter((obs) =>
      obs.blocksView === true &&
      obs.height !== undefined &&
      obs.height >= 0.8 &&
      obs.height <= 1.3 &&  // Table height, not pillar height
      obs.category === 'furniture'  // Only furniture, not structural
    )

    console.log(`[DetectionProcessor] Loaded ${this.trackingBlockingObstacles.length} tracking-blocking obstacles`)
    console.log(`[DetectionProcessor] Loaded ${this.viewBlockingObstacles.length} view-blocking obstacles (tables)`)
  }

  /**
   * Check if a world position is inside any tracking-blocking obstacle
   * Uses a margin to account for projection error - only filters if significantly inside
   */
  private isInsideObstacle(worldX: number, worldY: number): boolean {
    if (this.trackingBlockingObstacles.length === 0) return false
    // Use 0.15m margin to avoid filtering detections near obstacle edges due to projection error
    // This allows people sitting near pillars to be tracked
    const OBSTACLE_FILTER_MARGIN = 0.15
    return isPointInsideAnyObstacle({ x: worldX, y: worldY }, this.trackingBlockingObstacles, OBSTACLE_FILTER_MARGIN)
  }

  /**
   * Deduplicate same-camera detections that are very close in world coordinates.
   * This handles cases where YOLO outputs multiple overlapping bounding boxes
   * for the same person with different track IDs.
   *
   * Algorithm: Greedy NMS - keep highest confidence detection, remove others within threshold
   */
  private deduplicateSameCameraDetections(detections: CameraDetection[]): CameraDetection[] {
    if (detections.length <= 1) return detections

    // Group detections by camera
    const byCamera = new Map<string, CameraDetection[]>()
    for (const det of detections) {
      const existing = byCamera.get(det.cameraId)
      if (existing) {
        existing.push(det)
      } else {
        byCamera.set(det.cameraId, [det])
      }
    }

    const result: CameraDetection[] = []

    for (const [cameraId, cameraDetections] of byCamera) {
      if (cameraDetections.length === 1) {
        result.push(cameraDetections[0])
        continue
      }

      // Sort by confidence descending (keep highest confidence first)
      const sorted = [...cameraDetections].sort((a, b) => b.confidence - a.confidence)
      const kept: CameraDetection[] = []
      const suppressed = new Set<number>()

      for (let i = 0; i < sorted.length; i++) {
        if (suppressed.has(i)) continue

        const current = sorted[i]
        kept.push(current)

        // Suppress all lower-confidence detections within threshold distance
        for (let j = i + 1; j < sorted.length; j++) {
          if (suppressed.has(j)) continue

          const other = sorted[j]
          const dx = current.worldX - other.worldX
          const dy = current.worldY - other.worldY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < SAME_CAMERA_DEDUP_DISTANCE) {
            suppressed.add(j)
            this.sameCameraDeduplicatedCount++
            if (this.sameCameraDeduplicatedCount <= 5 || this.sameCameraDeduplicatedCount % 500 === 0) {
              console.log(
                `[DetectionProcessor] Deduplicated same-camera detection: camera=${cameraId} ` +
                `dist=${distance.toFixed(3)}m kept_conf=${current.confidence.toFixed(2)} ` +
                `removed_conf=${other.confidence.toFixed(2)} [total: ${this.sameCameraDeduplicatedCount}]`
              )
            }
          }
        }
      }

      result.push(...kept)
    }

    return result
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
      console.log(`[DetectionProcessor] Camera ${cameraId} appears to have restarted (frame ${message.frame_number} < ${lastFrame}). Clearing all tracks.`)
      this.trackManager.clearAllTracks()
    }

    // Skip if we've already processed this frame (unless camera restarted)
    if (message.frame_number <= lastFrame && message.frame_number >= lastFrame - FRAME_JUMP_BACKWARD_THRESHOLD) {
      return []
    }
    this.lastProcessedFrames.set(cameraId, message.frame_number)
    this.lastFrameTimestamps.set(cameraId, Date.now())

    // Periodic cleanup to prevent memory leaks from stale camera entries
    this.periodicCleanup()

    // Get camera parameters
    const camera = this.cameraRegistry.getCamera(cameraId)
    if (!camera) {
      console.warn(`Unknown camera: ${cameraId}`)
      return []
    }

    // Convert timestamp from seconds to ms
    const timestampMs = message.timestamp * 1000

    // Project all detections to world coordinates
    const projectedDetections: CameraDetection[] = []
    const logger = getPipelineLogger()

    for (const detection of message.detections) {
      // Filter for person detections with sufficient confidence
      if (detection.class_name !== 'person' || detection.confidence < MIN_CONFIDENCE) {
        continue
      }

      // Convert bbox array to object format
      const bbox = this.parseBBox(detection)
      if (!bbox) continue

      // Log raw detection
      const rawDetectionKey = logger.logRawDetection(cameraId, detection, message.frame_number)

      // Project to world coordinates
      // Project to world coordinates using K/R/T calibration.
      // Pass camera and view-blocking obstacles for table occlusion detection.
      const calibration = this.cameraRegistry.getCalibration(cameraId)
      let worldPoint: { x: number; y: number }
      let rawWorldPoint: { x: number; y: number }
      let isValid: boolean
      let projectionMethod: 'krt'
      let projectionReason: string | undefined

      if (!calibration) {
        // KRT-only pipeline: without calibration we cannot project.
        // Log as invalid and skip this detection.
        rawWorldPoint = { x: NaN, y: NaN }
        isValid = false
        projectionMethod = 'krt'
        projectionReason = 'no_calibration'
      } else {
        const krtResult = projectDetectionWithKRT(
          bbox,
          calibration,
          camera,
          this.viewBlockingObstacles,
          true,
          IMAGE_WIDTH,
          IMAGE_HEIGHT
        )
        rawWorldPoint = krtResult.worldPoint
        isValid = krtResult.isValid
        projectionMethod = 'krt'
        projectionReason = krtResult.reason

        // Sanity check against camera azimuth/FOV; if outside, drop rather than falling back.
        if (isValid) {
          const dx = rawWorldPoint.x - camera.position.x
          const dy = rawWorldPoint.y - camera.position.y
          const angleToPoint = radToDeg(Math.atan2(dx, dy))
          const diffDeg = Math.abs(angleDifference(angleToPoint, camera.azimuth))
          const fovMarginDeg = 15
          if (diffDeg > (camera.fov / 2 + fovMarginDeg)) {
            isValid = false
            projectionReason = 'krt_outside_fov'
          }
        }
      }

      // Apply camera-specific bias correction (from cross-camera evaluation)
      // This compensates for systematic projection errors identified in ground truth analysis
      const biasCorrection = this.cameraRegistry.getBiasCorrection(cameraId)
      worldPoint = {
        x: rawWorldPoint.x + biasCorrection.x,
        y: rawWorldPoint.y + biasCorrection.y,
      }

      // Log projected position (key available for linking in future)
      logger.logProjectedPosition(
        cameraId,
        detection.track_id,
        worldPoint.x,
        worldPoint.y,
        isValid,
        projectionMethod,
        projectionReason,
        rawDetectionKey ?? undefined
      )

      if (!isValid) {
        continue
      }

      // Filter detections that project inside obstacles
      if (this.isInsideObstacle(worldPoint.x, worldPoint.y)) {
        this.obstacleFilterCount++
        if (this.obstacleFilterCount <= 10 || this.obstacleFilterCount % 100 === 0) {
          console.log(
            `[DetectionProcessor] Filtered detection inside obstacle: (${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}) [total filtered: ${this.obstacleFilterCount}]`
          )
        }
        continue
      }

      // Add to batch for Hungarian assignment
      projectedDetections.push({
        cameraId,
        trackId: detection.track_id ?? 0,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        confidence: detection.confidence,
        timestamp: timestampMs,
        frameNumber: message.frame_number,
        videoTimeMs: message.video_time_ms,
        rtpTimestamp: message.rtp_timestamp,
        attributes: detection.attributes,  // Pass through re-ID attributes
        cameraPosition: { x: camera.position.x, y: camera.position.y },  // For distance-based weighting
      })
    }

    // Deduplicate same-camera detections before sending to track manager
    const deduplicatedDetections = this.deduplicateSameCameraDetections(projectedDetections)

    // Route through batch optimizer if enabled, otherwise use direct processing
    if (deduplicatedDetections.length > 0) {
      if (this.batchOptimizer) {
        // Batch mode: buffer frames for multi-frame optimization
        // Returns tracks during hybrid mode (first window) or empty during buffering
        return this.batchOptimizer.addFrame(
          message.frame_number,
          timestampMs,
          deduplicatedDetections
        )
      } else {
        // Frame-by-frame mode: direct Hungarian assignment
        return this.trackManager.processBatchDetections(deduplicatedDetections)
      }
    }

    return []
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
    trackId: number = 0
  ): GlobalTrack | null {
    const normalizedCameraId = this.cameraRegistry.normalizeCameraId(cameraId)

    // Get camera for occlusion detection
    const camera = this.cameraRegistry.getCamera(normalizedCameraId)

    // KRT-only injection: without calibration we cannot project.
    const calibration = this.cameraRegistry.getCalibration(normalizedCameraId)
    if (!camera || !calibration) {
      if (this.debugCount < 3) console.warn(`No calibration for camera: ${cameraId}`)
      logProjectionFailure(`track=${trackId}: no_calibration`)
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
      logProjectionFailure(`track=${trackId}: ${result.reason}`)
      return null
    }

    // Apply camera-specific bias correction
    const biasCorrection = this.cameraRegistry.getBiasCorrection(normalizedCameraId)
    const correctedX = result.worldPoint.x + biasCorrection.x
    const correctedY = result.worldPoint.y + biasCorrection.y

    return this.trackManager.processDetection(
      normalizedCameraId,
      trackId,
      correctedX,
      correctedY,
      confidence
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
    trackId: number = 0
  ): GlobalTrack {
    return this.trackManager.processDetection(
      cameraId,
      trackId,
      worldX,
      worldY,
      confidence
    )
  }

  private parseBBox(detection: RawDetection): { x: number; y: number; width: number; height: number } | null {
    // Handle array format [x, y, w, h]
    if (Array.isArray(detection.bbox) && detection.bbox.length === 4) {
      const [x, y, width, height] = detection.bbox
      return { x, y, width, height }
    }

    // Handle object format (for injection API)
    if (detection.bbox && typeof detection.bbox === 'object') {
      const b = detection.bbox as unknown as {
        x?: number
        y?: number
        width?: number
        height?: number
        left?: number
        top?: number
        right?: number
        bottom?: number
      }

      // Handle {x, y, width, height} format
      if (b.x !== undefined && b.y !== undefined && b.width !== undefined && b.height !== undefined) {
        return { x: b.x, y: b.y, width: b.width, height: b.height }
      }

      // Handle {left, top, right, bottom} format (from camera emulators)
      if (b.left !== undefined && b.top !== undefined && b.right !== undefined && b.bottom !== undefined) {
        return {
          x: b.left,
          y: b.top,
          width: b.right - b.left,
          height: b.bottom - b.top,
        }
      }
    }

    return null
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
    const logger = getPipelineLogger()

    for (const message of messages) {
      const cameraId = this.cameraRegistry.normalizeCameraId(message.camera_id)

      // Skip if we've already processed this frame
      const lastFrame = this.lastProcessedFrames.get(cameraId) ?? -1
      if (message.frame_number <= lastFrame) {
        continue
      }
      this.lastProcessedFrames.set(cameraId, message.frame_number)
      this.lastFrameTimestamps.set(cameraId, Date.now())

      // Get camera parameters
      const camera = this.cameraRegistry.getCamera(cameraId)
      if (!camera) {
        console.warn(`Unknown camera: ${cameraId}`)
        continue
      }

      // Convert timestamp from seconds to ms
      const timestampMs = message.timestamp * 1000

      // Project all detections to world coordinates
      for (const detection of message.detections) {
        // Filter for person detections with sufficient confidence
        if (detection.class_name !== 'person' || detection.confidence < MIN_CONFIDENCE) {
          continue
        }

        // Convert bbox array to object format
        const bbox = this.parseBBox(detection)
        if (!bbox) continue

        // Log raw detection
        const rawDetectionKey = logger.logRawDetection(cameraId, detection, message.frame_number)

        // Project to world coordinates
        const calibration = this.cameraRegistry.getCalibration(cameraId)
        let worldPoint: { x: number; y: number }
        let rawWorldPoint: { x: number; y: number }
        let isValid: boolean
        let projectionMethod: 'krt'
        let projectionReason: string | undefined

        if (!calibration) {
          rawWorldPoint = { x: NaN, y: NaN }
          isValid = false
          projectionMethod = 'krt'
          projectionReason = 'no_calibration'
        } else {
          const krtResult = projectDetectionWithKRT(
            bbox,
            calibration,
            camera,
            this.viewBlockingObstacles,
            true,
            IMAGE_WIDTH,
            IMAGE_HEIGHT
          )
          rawWorldPoint = krtResult.worldPoint
          isValid = krtResult.isValid
          projectionMethod = 'krt'
          projectionReason = krtResult.reason

          if (isValid) {
            const dx = rawWorldPoint.x - camera.position.x
            const dy = rawWorldPoint.y - camera.position.y
            const angleToPoint = radToDeg(Math.atan2(dx, dy))
            const diffDeg = Math.abs(angleDifference(angleToPoint, camera.azimuth))
            const fovMarginDeg = 15
            if (diffDeg > (camera.fov / 2 + fovMarginDeg)) {
              isValid = false
              projectionReason = 'krt_outside_fov'
            }
          }
        }

        // Apply camera-specific bias correction
        const biasCorrection = this.cameraRegistry.getBiasCorrection(cameraId)
        worldPoint = {
          x: rawWorldPoint.x + biasCorrection.x,
          y: rawWorldPoint.y + biasCorrection.y,
        }

        // Log projected position
        logger.logProjectedPosition(
          cameraId,
          detection.track_id,
          worldPoint.x,
          worldPoint.y,
          isValid,
          projectionMethod,
          projectionReason,
          rawDetectionKey ?? undefined
        )

        if (!isValid) {
          continue
        }

        // Filter detections that project inside obstacles
        if (this.isInsideObstacle(worldPoint.x, worldPoint.y)) {
          this.obstacleFilterCount++
          continue
        }

        // Add to combined batch for all cameras
        allProjectedDetections.push({
          cameraId,
          trackId: detection.track_id ?? 0,
          worldX: worldPoint.x,
          worldY: worldPoint.y,
          confidence: detection.confidence,
          timestamp: timestampMs,
          frameNumber: message.frame_number,
          videoTimeMs: message.video_time_ms,
          rtpTimestamp: message.rtp_timestamp,
          attributes: detection.attributes,  // Pass through re-ID attributes
          cameraPosition: { x: camera.position.x, y: camera.position.y },  // For distance-based weighting
        })
      }
    }

    // Periodic cleanup
    this.periodicCleanup()

    // Deduplicate same-camera detections before sending to track manager
    const deduplicatedDetections = this.deduplicateSameCameraDetections(allProjectedDetections)

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

