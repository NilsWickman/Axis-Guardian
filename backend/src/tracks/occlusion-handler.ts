/**
 * Occlusion Handler - Manages track occlusion states and coasting
 *
 * Extracted from TrackManager to provide focused responsibility for
 * handling occlusion state transitions and track coasting.
 */

import type { GlobalTrack, Point2D, TrackingConfig } from '../types.js'
import type { KalmanTrackFilter } from '../filters/kalman-track-filter.js'
import type { FrameTracker } from './frame-tracker.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import {
  classifyExitReason,
  getTimeoutForExitReason,
  type ExitReason,
} from '../geometry/exit-detection.js'
import {
  calculateCombinedFOVPolygons,
  isPointInAnyFOV,
  isPointInRoom,
  type CameraConfig,
  type RoomBounds,
} from '../geometry/fov-geometry.js'
import { doesPathIntersectObstacle } from '../geometry/obstacles.js'
import { predictPosition } from '../correlation/track-matcher.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

export interface SiteMapGeometry {
  cameras: CameraConfig[]
  obstacles: SiteMapObstacle[]
  roomBounds: RoomBounds
}

export interface OcclusionHandlerConfig {
  /** Frames to miss before transitioning to occluded */
  missedFramesBeforeOcclusion: number
  /** Time to coast occluded tracks (ms) */
  occlusionCoastTimeMs: number
  /** Detections required to exit occlusion state */
  detectionsToExitOcclusion: number
  /** Maximum trail length for predictions */
  maxTrailLength: number
}

const DEFAULT_CONFIG: OcclusionHandlerConfig = {
  missedFramesBeforeOcclusion: ALGORITHM_CONSTANTS.occlusion.missedFramesBeforeOcclusion,
  occlusionCoastTimeMs: ALGORITHM_CONSTANTS.occlusion.occlusionCoastTimeMs,
  detectionsToExitOcclusion: ALGORITHM_CONSTANTS.occlusion.detectionsToExitOcclusion,
  maxTrailLength: ALGORITHM_CONSTANTS.occlusion.maxOcclusionTrailLength,
}

/**
 * Callback interface for recording occlusion metrics
 */
export interface OcclusionMetricsRecorder {
  recordOcclusionStart(): void
  recordOcclusionEnd(durationMs: number, recovered: boolean): void
}

/**
 * Result of checking if a track should transition to occluded state
 */
export interface OcclusionCheckResult {
  shouldOcclude: boolean
  exitReason?: ExitReason
  predictedExitPoint?: Point2D
}

/**
 * Result of coasting a track
 */
export interface CoastResult {
  /** New predicted position, or null if coasting should stop */
  position: Point2D | null
  /** Whether to stop coasting (exit FOV/room or timeout) */
  shouldStopCoasting: boolean
  /** Updated exit reason if changed */
  exitReason?: ExitReason
}

/**
 * OcclusionHandler - Manages occlusion state transitions and track coasting
 *
 * Responsibilities:
 * - Detecting when tracks should transition to occluded state
 * - Classifying exit reasons (pillar, FOV, boundary)
 * - Coasting tracks with Kalman prediction during occlusion
 * - Applying velocity damping for non-pillar occlusions
 * - Determining when to stop coasting
 */
export class OcclusionHandler {
  private config: OcclusionHandlerConfig
  private geometry?: SiteMapGeometry
  private kalmanFilter: KalmanTrackFilter
  private frameTracker: FrameTracker
  private metricsRecorder?: OcclusionMetricsRecorder

  /** Cached FOV polygons for efficiency */
  private cachedFovPolygons?: Point2D[][]

  constructor(
    kalmanFilter: KalmanTrackFilter,
    frameTracker: FrameTracker,
    config: Partial<OcclusionHandlerConfig> = {},
    metricsRecorder?: OcclusionMetricsRecorder
  ) {
    this.kalmanFilter = kalmanFilter
    this.frameTracker = frameTracker
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metricsRecorder = metricsRecorder
  }

  /**
   * Set the sitemap geometry for exit detection
   */
  setGeometry(geometry: SiteMapGeometry): void {
    this.geometry = geometry
    this.cachedFovPolygons = calculateCombinedFOVPolygons(
      geometry.cameras,
      geometry.roomBounds
    )
  }

  /**
   * Get velocity from a track's Kalman state
   */
  getTrackVelocity(track: GlobalTrack): Point2D {
    const kalmanState = track.kalmanState
    if (kalmanState && kalmanState.mean.length >= 4) {
      return {
        x: kalmanState.mean[2][0],
        y: kalmanState.mean[3][0],
      }
    }
    return { x: 0, y: 0 }
  }

  /**
   * Check if a confirmed track should transition to occluded state
   * based on missed frames
   */
  checkShouldOcclude(
    track: GlobalTrack,
    now: number
  ): OcclusionCheckResult {
    if (track.state !== 'confirmed') {
      return { shouldOcclude: false }
    }

    // Calculate missed frames across cameras
    const perCameraMissed: number[] = []
    for (const [cameraId, assoc] of track.cameraAssociations) {
      if (assoc.lastFrameNumber !== undefined) {
        const missed = this.frameTracker.getMissedFrames(cameraId, assoc.lastFrameNumber)
        if (missed !== undefined) {
          perCameraMissed.push(missed)
        }
      }
    }

    // Use minimum missed frames across cameras so a multi-camera track stays active
    // while at least one camera still sees the person.
    let totalMissedFrames = perCameraMissed.length > 0
      ? Math.min(...perCameraMissed)
      : 0

    // Fall back to time-based detection if no frame info available
    const timeSinceLastSeen = now - track.lastSeen
    if (perCameraMissed.length === 0 && timeSinceLastSeen > 100) {
      totalMissedFrames = Math.floor(timeSinceLastSeen / 100) // Assume ~10fps
    }

    if (totalMissedFrames < this.config.missedFramesBeforeOcclusion) {
      return { shouldOcclude: false }
    }

    // Classify why the track disappeared
    let exitReason: ExitReason = 'timeout'
    let predictedExitPoint: Point2D | undefined

    if (this.geometry) {
      const velocity = this.getTrackVelocity(track)
      const exitResult = classifyExitReason(
        track.currentPosition,
        velocity,
        this.geometry.cameras,
        this.geometry.obstacles,
        this.geometry.roomBounds
      )
      exitReason = exitResult.reason
      predictedExitPoint = exitResult.predictedExitPoint ?? undefined
    }

    this.metricsRecorder?.recordOcclusionStart()

    return {
      shouldOcclude: true,
      exitReason,
      predictedExitPoint,
    }
  }

  /**
   * Check if an unconfirmed track should transition to occluded state
   * (when it disappears near a pillar)
   */
  checkUnconfirmedShouldOcclude(
    track: GlobalTrack,
    timeSinceLastSeen: number,
    unconfirmedExpiryMs: number
  ): OcclusionCheckResult {
    if (track.state !== 'unconfirmed') {
      return { shouldOcclude: false }
    }

    if (timeSinceLastSeen <= unconfirmedExpiryMs) {
      return { shouldOcclude: false }
    }

    // Before expiring, check if track might be behind a pillar
    if (this.geometry && track.detectionCount >= 1) {
      const velocity = this.getTrackVelocity(track)
      const exitResult = classifyExitReason(
        track.currentPosition,
        velocity,
        this.geometry.cameras,
        this.geometry.obstacles,
        this.geometry.roomBounds
      )

      // If track disappeared near a pillar or timeout, transition to occluded
      if (exitResult.reason === 'pillar_occlusion' || exitResult.reason === 'timeout') {
        this.metricsRecorder?.recordOcclusionStart()
        return {
          shouldOcclude: true,
          exitReason: exitResult.reason,
          predictedExitPoint: exitResult.predictedExitPoint ?? undefined,
        }
      }
    }

    return { shouldOcclude: false }
  }

  /**
   * Coast an occluded track forward using Kalman prediction
   *
   * Uses progressive velocity damping based on time since occlusion to
   * provide smoother predictions that account for increasing uncertainty.
   */
  coastTrack(track: GlobalTrack, now: number): CoastResult {
    const dtMs = now - track.lastSeen

    // Check if we should stop coasting based on time
    const maxCoastMs = this.config.occlusionCoastTimeMs
    if (dtMs <= 50 || dtMs > maxCoastMs) {
      return { position: null, shouldStopCoasting: dtMs > maxCoastMs }
    }

    const isPillarGhost = track.exitReason === 'pillar_occlusion'
    const timeSinceOcclusion = now - (track.occludedSince ?? now)
    const maxNonPillarCoastMs = ALGORITHM_CONSTANTS.occlusion.maxNonPillarCoastMs

    // Stop coasting after maxNonPillarCoastMs for non-pillar occlusions
    if (!isPillarGhost && timeSinceOcclusion > maxNonPillarCoastMs) {
      return { position: null, shouldStopCoasting: true }
    }

    // Get predicted position
    let predictedPos: Point2D | null = null
    if (track.kalmanState) {
      predictedPos = this.kalmanFilter.predict(track.kalmanState, dtMs)

      // Apply exponential velocity decay during coasting
      // Velocity decays as exp(-t/tau) where tau is the decay time constant
      // This naturally reduces drift: at 1s ~37% velocity remains, at 2s ~14%, at 3s ~5%
      const occlusionDurationSec = timeSinceOcclusion / 1000
      const maxCovariance = 25

      if (!isPillarGhost) {
        // Non-pillar: exponential decay with 1.2s time constant
        // At 1.4 m/s walking speed: 1s→0.6m/s, 2s→0.25m/s, 3s→0.11m/s (vs 3.5m drift with old linear)
        const decayTimeConstant = 1.2  // seconds
        const decayFactor = Math.exp(-occlusionDurationSec / decayTimeConstant)
        track.kalmanState.mean[2][0] *= decayFactor // vx
        track.kalmanState.mean[3][0] *= decayFactor // vy

        // Grow covariance to reflect increasing uncertainty
        const uncertaintyGrowthFactor = 1 + (occlusionDurationSec * 0.3)
        if (track.kalmanState.covariance) {
          track.kalmanState.covariance[0][0] = Math.min(
            track.kalmanState.covariance[0][0] * uncertaintyGrowthFactor,
            maxCovariance
          )
          track.kalmanState.covariance[1][1] = Math.min(
            track.kalmanState.covariance[1][1] * uncertaintyGrowthFactor,
            maxCovariance
          )
        }
      } else {
        // Pillar occlusion: slower exponential decay (2.5s time constant)
        // Person likely continues moving behind pillar, so decay slower
        const decayTimeConstant = 2.5  // seconds
        const decayFactor = Math.exp(-occlusionDurationSec / decayTimeConstant)
        track.kalmanState.mean[2][0] *= decayFactor // vx
        track.kalmanState.mean[3][0] *= decayFactor // vy

        // Slower covariance growth for pillar (higher confidence in continued motion)
        const uncertaintyGrowthFactor = 1 + (occlusionDurationSec * 0.15)
        if (track.kalmanState.covariance) {
          track.kalmanState.covariance[0][0] = Math.min(
            track.kalmanState.covariance[0][0] * uncertaintyGrowthFactor,
            maxCovariance
          )
          track.kalmanState.covariance[1][1] = Math.min(
            track.kalmanState.covariance[1][1] * uncertaintyGrowthFactor,
            maxCovariance
          )
        }
      }
    } else if (track.trail.length >= 2) {
      // Fall back to trail-based prediction with damping
      predictedPos = predictPosition(track.trail, dtMs)

      // Apply simple speed decay for trail-based prediction
      if (!isPillarGhost && predictedPos && track.trail.length >= 2) {
        const lastPos = track.trail[track.trail.length - 1]
        const occlusionDurationSec = timeSinceOcclusion / 1000
        const decayFactor = Math.exp(-occlusionDurationSec * 0.3)  // Exponential decay

        // Interpolate between last known position and predicted position
        predictedPos = {
          x: lastPos.x + (predictedPos.x - lastPos.x) * decayFactor,
          y: lastPos.y + (predictedPos.y - lastPos.y) * decayFactor,
        }
      }
    }

    if (!predictedPos) {
      return { position: null, shouldStopCoasting: false }
    }

    // Check if prediction path intersects any blocking obstacles
    // This prevents ghost tracks from drifting through pillars
    if (this.geometry?.obstacles) {
      const blockingObstacles = this.geometry.obstacles.filter(
        o => o.blocksTracking && o.type === 'circle'
      )

      for (const obstacle of blockingObstacles) {
        if (doesPathIntersectObstacle(track.currentPosition, predictedPos, obstacle)) {
          // Clamp to last position - don't predict through obstacles
          // Zero velocity to prevent further drift
          if (track.kalmanState) {
            track.kalmanState.mean[2][0] = 0  // vx
            track.kalmanState.mean[3][0] = 0  // vy
          }
          // Return current position instead of predicted (stay where last seen)
          return { position: track.currentPosition, shouldStopCoasting: false }
        }
      }
    }

    // Check if prediction exits the room
    if (this.geometry?.roomBounds && !isPointInRoom(predictedPos, this.geometry.roomBounds, 0)) {
      // Zero velocity to prevent bouncing on re-emergence
      if (track.kalmanState) {
        track.kalmanState.mean[2][0] = 0
        track.kalmanState.mean[3][0] = 0
      }
      return {
        position: null,
        shouldStopCoasting: true,
        exitReason: 'boundary_exit',
      }
    }

    // Check if prediction exits all FOVs
    if (this.cachedFovPolygons && !isPointInAnyFOV(predictedPos, this.cachedFovPolygons, 0)) {
      // Zero velocity to prevent bouncing on re-emergence
      if (track.kalmanState) {
        track.kalmanState.mean[2][0] = 0
        track.kalmanState.mean[3][0] = 0
      }
      return {
        position: null,
        shouldStopCoasting: true,
        exitReason: 'fov_exit',
      }
    }

    return { position: predictedPos, shouldStopCoasting: false }
  }

  /**
   * Get the appropriate timeout for a track's exit reason
   */
  getTimeoutForTrack(track: GlobalTrack, defaultConfig: TrackingConfig): number {
    if (!this.geometry) {
      return this.config.occlusionCoastTimeMs
    }
    return getTimeoutForExitReason(track.exitReason ?? 'timeout', defaultConfig)
  }

  /**
   * Check if a track should expire based on occlusion timeout
   */
  shouldExpireOccludedTrack(track: GlobalTrack, now: number, config: TrackingConfig): boolean {
    if (track.state !== 'occluded') return false

    const timeSinceOcclusion = now - (track.occludedSince ?? track.lastSeen)
    const effectiveTimeout = this.getTimeoutForTrack(track, config)

    return timeSinceOcclusion > effectiveTimeout
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OcclusionHandlerConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): OcclusionHandlerConfig {
    return { ...this.config }
  }

  /**
   * Set the metrics recorder
   */
  setMetricsRecorder(recorder: OcclusionMetricsRecorder): void {
    this.metricsRecorder = recorder
  }
}
