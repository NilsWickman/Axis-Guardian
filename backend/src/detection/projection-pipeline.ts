/**
 * Projection Pipeline
 *
 * Encapsulates the detection projection logic used by DetectionProcessor.
 * This deduplicates the projection code between processMessage() and
 * processMultiCameraMessages().
 *
 * The pipeline handles:
 * - Detection projection (KRT matrices, lens distortion)
 * - Confidence filtering
 * - FOV angle sanity checks
 * - Table occlusion handling
 * - Obstacle filtering
 * - Room bounds filtering
 * - Pillar shadow downweighting
 * - Same-camera deduplication
 */

import type {
  RawDetection,
  CameraDetection,
  CameraParams,
  CameraCalibration,
} from '../types.js'
import {
  projectDetectionWithKRT,
  estimateBBoxHeightExtension,
  radToDeg,
  angleDifference,
} from '../projection/ground-plane.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { isPointInsideAnyObstacle, clampBehindOccludingTable2D } from '../geometry/obstacles.js'
import { isPointOccludedByAnyPillar } from '../geometry/pillar-shadow.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { getMetrics } from '../metrics/index.js'

// ============================================================================
// Constants
// ============================================================================

const MIN_CONFIDENCE = ALGORITHM_CONSTANTS.detection.minConfidence
const IMAGE_WIDTH = ALGORITHM_CONSTANTS.detection.imageWidth
const IMAGE_HEIGHT = ALGORITHM_CONSTANTS.detection.imageHeight
const SAME_CAMERA_DEDUP_DISTANCE = ALGORITHM_CONSTANTS.detection.sameCameraDeduplicationDistanceM
const SAME_CAMERA_DEDUP_MAX_IMAGE_DISTANCE_PX = 90
const OBSTACLE_FILTER_MARGIN = 0.15

// ============================================================================
// Logger Interface
// ============================================================================

/**
 * Interface for dependency injection of logging into the projection pipeline.
 * Allows the pipeline to be used with different logging strategies.
 */
export interface IProjectionLogger {
  /**
   * Log a raw detection from a camera
   * @returns A key that can be used to link projected positions back to raw detections
   */
  logRawDetection(
    cameraId: string,
    detection: RawDetection,
    frameNumber: number
  ): string | null

  /**
   * Log a projected position
   */
  logProjectedPosition(
    cameraId: string,
    localTrackId: number | undefined,
    worldX: number,
    worldY: number,
    isValid: boolean,
    projectionMethod: 'krt',
    projectionReason?: string,
    rawDetectionKey?: string
  ): void
}

/**
 * No-op logger implementation for when logging is not needed
 */
export class NullProjectionLogger implements IProjectionLogger {
  logRawDetection(): null {
    return null
  }
  logProjectedPosition(): void {
    // No-op
  }
}

// ============================================================================
// Pipeline Configuration
// ============================================================================

/**
 * Configuration options for the projection pipeline
 */
export interface ProjectionPipelineConfig {
  /** Enable table occlusion estimation and clamping */
  enableTableOcclusion: boolean
  /** Enable FOV angle sanity check */
  enableFovCheck: boolean
  /** Enable relaxed confidence for table-occluded detections */
  enableRelaxedConfidence: boolean
  /** Enable pillar shadow downweighting */
  enablePillarShadowDownweight: boolean
  /** Enable same-camera deduplication */
  enableSameCameraDedup: boolean
}

/**
 * Default configuration for processMessage() path (full features)
 */
export const FULL_PIPELINE_CONFIG: ProjectionPipelineConfig = {
  enableTableOcclusion: true,
  enableFovCheck: true,
  enableRelaxedConfidence: true,
  enablePillarShadowDownweight: true,
  enableSameCameraDedup: true,
}

/**
 * Configuration for processMultiCameraMessages() path (simpler features)
 * FOV check disabled because sitemap-generated calibration may not match
 * actual camera orientations. Room bounds check provides sufficient filtering.
 */
export const MULTI_CAMERA_PIPELINE_CONFIG: ProjectionPipelineConfig = {
  enableTableOcclusion: false,
  enableFovCheck: false,
  enableRelaxedConfidence: false,
  enablePillarShadowDownweight: true,
  enableSameCameraDedup: true,
}

// ============================================================================
// Pipeline Dependencies
// ============================================================================

/**
 * Dependencies required by the projection pipeline
 */
export interface ProjectionPipelineDeps {
  /** Get camera calibration by ID */
  getCalibration(cameraId: string): CameraCalibration | undefined
  /** Get camera parameters by ID */
  getCamera(cameraId: string): CameraParams | undefined
  /** Get bias correction for camera */
  getBiasCorrection(cameraId: string): { x: number; y: number }
  /** Check if a local track ID is associated with an existing global track */
  hasKnownLocalAssociation(cameraId: string, localTrackId: number): boolean
}

// ============================================================================
// Projection Result Types
// ============================================================================

/**
 * Result of projecting a single detection
 */
export interface SingleProjectionResult {
  /** Projected world position */
  worldPoint: { x: number; y: number }
  /** Whether projection is valid */
  isValid: boolean
  /** Projection method used */
  projectionMethod: 'krt'
  /** Reason for failure if invalid */
  projectionReason?: string
  /** Whether detection is table-occluded */
  isTableOccluded: boolean
  /** Local track ID from detector */
  localTrackId: number
  /** Original confidence (may be adjusted) */
  confidence: number
  /** Bounding box in normalized coordinates */
  bbox: { x: number; y: number; width: number; height: number }
}

// ============================================================================
// Projection Pipeline Class
// ============================================================================

/**
 * ProjectionPipeline - Encapsulates detection projection logic
 *
 * This class handles the complete pipeline from raw detections to
 * camera detections ready for track assignment.
 */
export class ProjectionPipeline {
  private logger: IProjectionLogger
  private trackingBlockingObstacles: SiteMapObstacle[] = []
  private viewBlockingObstacles: SiteMapObstacle[] = []
  private roomBounds: { width: number; height: number } | null = null

  // Counters for logging (throttled)
  private obstacleFilterCount = 0
  private outOfBoundsFilterCount = 0
  private pillarShadowDownweightedCount = 0
  private sameCameraDeduplicatedCount = 0

  constructor(logger?: IProjectionLogger) {
    this.logger = logger ?? new NullProjectionLogger()
  }

  /**
   * Set obstacles for detection filtering and occlusion detection
   */
  setObstacles(obstacles: SiteMapObstacle[]): void {
    // Obstacles that block tracking (detections inside are filtered out)
    this.trackingBlockingObstacles = obstacles.filter(
      (obs) => obs.blocksTracking !== false
    )

    // Tables/furniture that block view (used for occlusion-based position adjustment)
    this.viewBlockingObstacles = obstacles.filter(
      (obs) =>
        obs.blocksView === true &&
        obs.height !== undefined &&
        obs.height >= 0.8 &&
        obs.height <= 1.3 &&
        obs.category === 'furniture'
    )
  }

  /**
   * Set room bounds for filtering out-of-bounds projections
   */
  setRoomBounds(bounds: { width: number; height: number }): void {
    this.roomBounds = bounds
  }

  /**
   * Project detections from a camera frame to world coordinates
   *
   * @param detections - Raw detections from camera
   * @param cameraId - Normalized camera ID
   * @param frameNumber - Frame number
   * @param timestampMs - Timestamp in milliseconds
   * @param videoTimeMs - Optional video time for sync
   * @param rtpTimestamp - Optional RTP timestamp for sync
   * @param deps - Dependencies for camera registry and track manager access
   * @param config - Pipeline configuration options
   * @returns Array of camera detections ready for track assignment
   */
  projectDetections(
    detections: RawDetection[],
    cameraId: string,
    frameNumber: number,
    timestampMs: number,
    videoTimeMs: number | undefined,
    rtpTimestamp: number | undefined,
    deps: ProjectionPipelineDeps,
    config: ProjectionPipelineConfig
  ): CameraDetection[] {
    const camera = deps.getCamera(cameraId)
    if (!camera) {
      return []
    }

    const projectedDetections: CameraDetection[] = []

    for (const detection of detections) {
      // Filter for person detections
      if (detection.class_name !== 'person') {
        continue
      }

      // Parse bounding box
      const bbox = this.parseBBox(detection)
      if (!bbox) continue

      // Table occlusion estimation (before confidence filtering)
      let isTableOccluded = false
      if (config.enableTableOcclusion) {
        const tableExtension = estimateBBoxHeightExtension(
          bbox,
          camera,
          this.viewBlockingObstacles,
          true,
          IMAGE_WIDTH,
          IMAGE_HEIGHT
        )
        isTableOccluded = tableExtension > 1.05
      }

      // Confidence filtering with optional relaxation
      const localTrackId = detection.track_id ?? 0
      let confidence = detection.confidence

      if (config.enableRelaxedConfidence) {
        const relaxedMinConfidence = Math.max(0.55, MIN_CONFIDENCE - 0.15)
        if (
          confidence < MIN_CONFIDENCE &&
          !(isTableOccluded && localTrackId !== 0 && confidence >= relaxedMinConfidence)
        ) {
          continue
        }
      } else {
        if (confidence < MIN_CONFIDENCE) {
          continue
        }
      }

      // Log raw detection
      const rawDetectionKey = this.logger.logRawDetection(cameraId, detection, frameNumber)

      // Project to world coordinates
      const projectionResult = this.projectSingleDetection(
        bbox,
        cameraId,
        camera,
        deps,
        config
      )

      // Apply table occlusion clamping
      let worldPoint = projectionResult.worldPoint
      if (config.enableTableOcclusion && isTableOccluded && this.viewBlockingObstacles.length > 0) {
        const MAX_BEHIND_TABLE_M = 0.9
        const MIN_BEHIND_TABLE_M = 0.2
        const clamped = clampBehindOccludingTable2D(
          { x: camera.position.x, y: camera.position.y },
          { x: worldPoint.x, y: worldPoint.y },
          this.viewBlockingObstacles,
          MAX_BEHIND_TABLE_M,
          MIN_BEHIND_TABLE_M
        )
        worldPoint = clamped.point
      }

      // Log projected position
      this.logger.logProjectedPosition(
        cameraId,
        detection.track_id,
        worldPoint.x,
        worldPoint.y,
        projectionResult.isValid,
        projectionResult.projectionMethod,
        projectionResult.projectionReason,
        rawDetectionKey ?? undefined
      )

      if (!projectionResult.isValid) {
        continue
      }

      // Apply post-projection filters
      const filterResult = this.applyPostProjectionFilters(
        worldPoint,
        { x: camera.position.x, y: camera.position.y },
        detection,
        cameraId,
        deps,
        config
      )

      if (!filterResult.passed) {
        continue
      }

      confidence = filterResult.adjustedConfidence

      // Skip invalid projections
      if (!Number.isFinite(worldPoint.x) || !Number.isFinite(worldPoint.y)) {
        continue
      }

      // Add to batch for Hungarian assignment
      projectedDetections.push({
        cameraId,
        localTrackId,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        confidence,
        timestamp: timestampMs,
        bbox,
        frameNumber,
        videoTimeMs,
        rtpTimestamp,
        attributes: detection.attributes,
        cameraPosition: { x: camera.position.x, y: camera.position.y },
        imageCenter: {
          x: (bbox.x + bbox.width / 2) * IMAGE_WIDTH,
          y: (bbox.y + bbox.height / 2) * IMAGE_HEIGHT,
        },
        isTableOccluded,
      })
    }

    // Apply same-camera deduplication if enabled
    if (config.enableSameCameraDedup) {
      return this.deduplicateSameCameraDetections(projectedDetections)
    }

    return projectedDetections
  }

  /**
   * Deduplicate detections across multiple cameras
   * Call this after collecting detections from all cameras in a synchronized batch
   */
  deduplicateMultiCameraDetections(detections: CameraDetection[]): CameraDetection[] {
    return this.deduplicateSameCameraDetections(detections)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Parse bounding box from various formats
   */
  private parseBBox(
    detection: RawDetection
  ): { x: number; y: number; width: number; height: number } | null {
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
      if (
        b.x !== undefined &&
        b.y !== undefined &&
        b.width !== undefined &&
        b.height !== undefined
      ) {
        return { x: b.x, y: b.y, width: b.width, height: b.height }
      }

      // Handle {left, top, right, bottom} format
      if (
        b.left !== undefined &&
        b.top !== undefined &&
        b.right !== undefined &&
        b.bottom !== undefined
      ) {
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
   * Project a single detection to world coordinates
   */
  private projectSingleDetection(
    bbox: { x: number; y: number; width: number; height: number },
    cameraId: string,
    camera: CameraParams,
    deps: ProjectionPipelineDeps,
    config: ProjectionPipelineConfig
  ): {
    worldPoint: { x: number; y: number }
    isValid: boolean
    projectionMethod: 'krt'
    projectionReason?: string
  } {
    const calibration = deps.getCalibration(cameraId)
    let rawWorldPoint: { x: number; y: number }
    let isValid: boolean
    const projectionMethod: 'krt' = 'krt'
    let projectionReason: string | undefined

    if (!calibration) {
      rawWorldPoint = { x: NaN, y: NaN }
      isValid = false
      projectionReason = 'no_calibration'
      getMetrics().recordProjectionFailureDetailed('no_calibration', cameraId)
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
      projectionReason = krtResult.reason

      // FOV angle sanity check (optional)
      if (config.enableFovCheck && isValid) {
        const dx = rawWorldPoint.x - camera.position.x
        const dy = rawWorldPoint.y - camera.position.y
        const angleToPoint = radToDeg(Math.atan2(dx, dy))
        const diffDeg = Math.abs(angleDifference(angleToPoint, camera.azimuth))
        const fovMarginDeg = 15
        if (diffDeg > camera.fov / 2 + fovMarginDeg) {
          isValid = false
          projectionReason = 'krt_outside_fov'
          getMetrics().recordProjectionFailureDetailed('outside_fov', cameraId)
        }
      } else if (!isValid && projectionReason) {
        const reason = projectionReason.includes('behind')
          ? 'behind_camera'
          : projectionReason.includes('distort')
            ? 'distortion_failure'
            : projectionReason.includes('invalid')
              ? 'invalid_coordinates'
              : 'other'
        getMetrics().recordProjectionFailureDetailed(reason, cameraId)
      }
    }

    // Apply camera-specific bias correction
    const biasCorrection = deps.getBiasCorrection(cameraId)
    const worldPoint = {
      x: rawWorldPoint.x + biasCorrection.x,
      y: rawWorldPoint.y + biasCorrection.y,
    }

    return {
      worldPoint,
      isValid,
      projectionMethod,
      projectionReason,
    }
  }

  /**
   * Apply post-projection filters (obstacles, bounds, pillar shadow)
   */
  private applyPostProjectionFilters(
    worldPoint: { x: number; y: number },
    cameraPosition: { x: number; y: number },
    detection: RawDetection,
    cameraId: string,
    deps: ProjectionPipelineDeps,
    config: ProjectionPipelineConfig
  ): { passed: boolean; adjustedConfidence: number } {
    let confidence = detection.confidence

    // Filter detections inside obstacles
    if (this.isInsideObstacle(worldPoint.x, worldPoint.y)) {
      this.obstacleFilterCount++
      if (this.obstacleFilterCount <= 10 || this.obstacleFilterCount % 100 === 0) {
        console.log(
          `[ProjectionPipeline] Filtered detection inside obstacle: ` +
            `(${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}) ` +
            `[total filtered: ${this.obstacleFilterCount}]`
        )
      }
      return { passed: false, adjustedConfidence: confidence }
    }

    // Filter detections outside room bounds
    if (this.isOutsideRoomBounds(worldPoint.x, worldPoint.y)) {
      this.outOfBoundsFilterCount++
      if (this.outOfBoundsFilterCount <= 10 || this.outOfBoundsFilterCount % 100 === 0) {
        console.log(
          `[ProjectionPipeline] Filtered detection outside room bounds: ` +
            `(${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}) ` +
            `[total filtered: ${this.outOfBoundsFilterCount}]`
        )
      }
      return { passed: false, adjustedConfidence: confidence }
    }

    // Pillar shadow downweighting
    if (
      config.enablePillarShadowDownweight &&
      this.trackingBlockingObstacles.length > 0 &&
      isPointOccludedByAnyPillar(cameraPosition, worldPoint, this.trackingBlockingObstacles)
    ) {
      const hasKnownLocalAssociation =
        detection.track_id !== undefined &&
        detection.track_id !== 0 &&
        deps.hasKnownLocalAssociation(cameraId, detection.track_id)

      if (!hasKnownLocalAssociation) {
        confidence = Math.min(confidence, 0.69)
        this.pillarShadowDownweightedCount++
        if (
          this.pillarShadowDownweightedCount <= 10 ||
          this.pillarShadowDownweightedCount % 200 === 0
        ) {
          console.log(
            `[ProjectionPipeline] Downweighted detection behind pillar (camera=${cameraId}) ` +
              `(${worldPoint.x.toFixed(2)}, ${worldPoint.y.toFixed(2)}) ` +
              `[total: ${this.pillarShadowDownweightedCount}]`
          )
        }
      }
    }

    // Skip invalid projections
    if (!Number.isFinite(worldPoint.x) || !Number.isFinite(worldPoint.y)) {
      return { passed: false, adjustedConfidence: confidence }
    }

    return { passed: true, adjustedConfidence: confidence }
  }

  /**
   * Check if a point is inside any tracking-blocking obstacle
   */
  private isInsideObstacle(worldX: number, worldY: number): boolean {
    if (this.trackingBlockingObstacles.length === 0) return false
    return isPointInsideAnyObstacle(
      { x: worldX, y: worldY },
      this.trackingBlockingObstacles,
      OBSTACLE_FILTER_MARGIN
    )
  }

  /**
   * Check if a point is outside room bounds
   */
  private isOutsideRoomBounds(x: number, y: number): boolean {
    if (!this.roomBounds) return false
    const margin = 0.5 // Allow 0.5m outside for edge cases
    return (
      x < -margin ||
      x > this.roomBounds.width + margin ||
      y < -margin ||
      y > this.roomBounds.height + margin
    )
  }

  /**
   * Deduplicate same-camera detections that are very close in world coordinates
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
            // If both have image centers, require them to also be close in image space
            if (current.imageCenter && other.imageCenter) {
              const ix = current.imageCenter.x - other.imageCenter.x
              const iy = current.imageCenter.y - other.imageCenter.y
              const imageDist = Math.sqrt(ix * ix + iy * iy)
              if (imageDist > SAME_CAMERA_DEDUP_MAX_IMAGE_DISTANCE_PX) {
                continue
              }
            }

            suppressed.add(j)
            this.sameCameraDeduplicatedCount++
            if (
              this.sameCameraDeduplicatedCount <= 5 ||
              this.sameCameraDeduplicatedCount % 500 === 0
            ) {
              console.log(
                `[ProjectionPipeline] Deduplicated same-camera detection: camera=${cameraId} ` +
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
}
