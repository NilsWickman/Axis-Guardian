/**
 * Detection Processor - Main pipeline orchestrator
 *
 * Receives raw detections from camera emulators, projects them to world
 * coordinates, and feeds them into the TrackManager.
 */

import type { DetectionMessage, RawDetection, GlobalTrack, CameraDetection, CameraFrameInfo } from '../types.js'
import { projectDetectionToGround, projectDetectionWithKRT } from '../projection/ground-plane.js'
import { TrackManager } from '../tracks/track-manager.js'
import { CameraRegistry } from './camera-registry.js'
import { logProjectionFailure } from '../api/routes.js'
import { getPipelineLogger } from '../debug/pipeline-logger.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { isPointInsideAnyObstacle } from '../geometry/obstacles.js'

const MIN_CONFIDENCE = 0.7
const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

export class DetectionProcessor {
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

  constructor(
    private trackManager: TrackManager,
    private cameraRegistry: CameraRegistry
  ) {}

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
   */
  private isInsideObstacle(worldX: number, worldY: number): boolean {
    if (this.trackingBlockingObstacles.length === 0) return false
    return isPointInsideAnyObstacle({ x: worldX, y: worldY }, this.trackingBlockingObstacles)
  }

  /**
   * Process a detection message from a camera emulator
   * Uses batch processing with Hungarian algorithm for optimal assignment
   */
  processMessage(message: DetectionMessage): GlobalTrack[] {
    const cameraId = this.cameraRegistry.normalizeCameraId(message.camera_id)

    // Skip if we've already processed this frame
    const lastFrame = this.lastProcessedFrames.get(cameraId) ?? -1
    if (message.frame_number <= lastFrame) {
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
      // Try K/R/T projection first (more accurate), fall back to legacy
      // Pass camera and view-blocking obstacles for table occlusion detection
      const calibration = this.cameraRegistry.getCalibration(cameraId)
      let worldPoint: { x: number; y: number }
      let isValid: boolean
      let projectionMethod: 'krt' | 'legacy'
      let projectionReason: string | undefined

      if (calibration) {
        const krtResult = projectDetectionWithKRT(
          bbox,
          calibration,
          camera,
          this.viewBlockingObstacles,
          true,
          IMAGE_WIDTH,
          IMAGE_HEIGHT
        )
        worldPoint = krtResult.worldPoint
        isValid = krtResult.isValid
        projectionMethod = 'krt'
        projectionReason = krtResult.reason
      } else {
        const legacyResult = projectDetectionToGround(
          bbox,
          camera,
          this.viewBlockingObstacles,
          true,
          IMAGE_WIDTH,
          IMAGE_HEIGHT
        )
        worldPoint = legacyResult.worldPoint
        isValid = legacyResult.isValid
        projectionMethod = 'legacy'
        projectionReason = legacyResult.reason
      }

      // Apply camera-specific bias correction (from cross-camera evaluation)
      // This compensates for systematic projection errors identified in ground truth analysis
      const biasCorrection = this.cameraRegistry.getBiasCorrection(cameraId)
      worldPoint = {
        x: worldPoint.x + biasCorrection.x,
        y: worldPoint.y + biasCorrection.y,
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
      })
    }

    // Use batch processing with Hungarian algorithm for optimal assignment
    if (projectedDetections.length > 0) {
      return this.trackManager.processBatchDetections(projectedDetections)
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

    // Try K/R/T projection first (more accurate)
    const calibration = this.cameraRegistry.getCalibration(normalizedCameraId)
    if (calibration) {
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

      const track = this.trackManager.processDetection(
        normalizedCameraId,
        trackId,
        correctedX,
        correctedY,
        confidence
      )

      return track
    }

    // Fall back to legacy projection if no K/R/T calibration
    if (!camera) {
      if (this.debugCount < 3) console.warn(`Unknown camera: ${cameraId}`)
      return null
    }

    const result = projectDetectionToGround(
      bbox,
      camera,
      this.viewBlockingObstacles,
      true,
      IMAGE_WIDTH,
      IMAGE_HEIGHT
    )

    if (!result.isValid) {
      logProjectionFailure(`track=${trackId}: ${result.reason}, dist=${result.distance?.toFixed(1)}m`)
      return null
    }

    // Apply camera-specific bias correction
    const biasCorrection = this.cameraRegistry.getBiasCorrection(normalizedCameraId)
    const correctedX = result.worldPoint.x + biasCorrection.x
    const correctedY = result.worldPoint.y + biasCorrection.y

    const track = this.trackManager.processDetection(
      normalizedCameraId,
      trackId,
      correctedX,
      correctedY,
      confidence
    )

    return track
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
