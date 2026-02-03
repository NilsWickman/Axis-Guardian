/**
 * Kalman State Manager
 *
 * Centralizes all Kalman filter state management operations for tracks.
 * Provides high-level methods for common state transitions instead of
 * requiring direct manipulation of kalmanState.mean[][] arrays.
 *
 * This extraction from TrackManager improves:
 * - Encapsulation: State manipulation details hidden behind clear interfaces
 * - Testability: Kalman operations can be tested in isolation
 * - Maintainability: Single place to modify state transition logic
 */

import type { GlobalTrack, Point2D, KalmanState } from '../types.js'
import { KalmanTrackFilter } from './kalman-track-filter.js'
import type { RoomBounds } from '../geometry/fov-geometry.js'
import { clampPointToRoom } from '../geometry/fov-geometry.js'

/**
 * Result of clamping a position to room bounds
 */
export interface ClampResult {
  position: Point2D
  clampedX: boolean
  clampedY: boolean
}

/**
 * Kalman State Manager
 *
 * Encapsulates all Kalman filter state management for tracks.
 * Prevents direct manipulation of track.kalmanState.mean[][] throughout codebase.
 */
export class KalmanStateManager {
  private filter: KalmanTrackFilter

  constructor(filter?: KalmanTrackFilter) {
    this.filter = filter ?? new KalmanTrackFilter()
  }

  /**
   * Get the underlying Kalman filter (for advanced operations)
   */
  getFilter(): KalmanTrackFilter {
    return this.filter
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /**
   * Initialize Kalman state for a new track
   */
  initialize(position: Point2D, timestamp: number): KalmanState {
    return this.filter.initialize(position, timestamp)
  }

  // ===========================================================================
  // State Updates
  // ===========================================================================

  /**
   * Update track state with a new detection measurement
   *
   * Handles:
   * - Kalman filter update with the measurement
   * - Room bounds clamping if provided
   * - Velocity zeroing on clamped axes
   *
   * @returns The filtered position after update
   */
  updateWithMeasurement(
    track: GlobalTrack,
    measurement: Point2D,
    timestamp: number,
    roomBounds?: RoomBounds
  ): Point2D {
    if (!track.kalmanState) {
      return measurement
    }

    // Apply room bounds clamping to measurement first
    let measurementClampedX = false
    let measurementClampedY = false
    let clampedMeasurement = measurement

    if (roomBounds) {
      const clampResult = clampPointToRoom(measurement, roomBounds, 0.05)
      clampedMeasurement = clampResult.point
      measurementClampedX = clampResult.clampedX
      measurementClampedY = clampResult.clampedY
    }

    // Update Kalman filter
    track.kalmanState = this.filter.update(
      track.kalmanState,
      clampedMeasurement,
      timestamp,
      track.globalTrackId
    )

    // Get filtered position
    let filteredPosition = this.filter.getPosition(track.kalmanState)

    // Validate and clamp Kalman output
    if (!Number.isFinite(filteredPosition.x) || !Number.isFinite(filteredPosition.y)) {
      return clampedMeasurement
    }

    // Clamp filtered output as well (Kalman can overshoot slightly near boundaries)
    let outputClampedX = false
    let outputClampedY = false

    if (roomBounds) {
      const clampResult = clampPointToRoom(filteredPosition, roomBounds, 0.05)
      filteredPosition = clampResult.point
      outputClampedX = clampResult.clampedX
      outputClampedY = clampResult.clampedY

      // Keep Kalman internal state consistent with clamped output
      track.kalmanState.mean[0][0] = filteredPosition.x
      track.kalmanState.mean[1][0] = filteredPosition.y

      // Zero velocity on clamped axes to prevent "wall bounce"
      if (outputClampedX) {
        track.kalmanState.mean[2][0] = 0
      }
      if (outputClampedY) {
        track.kalmanState.mean[3][0] = 0
      }
    }

    // Also zero velocity if measurement itself was clamped
    if (measurementClampedX) {
      track.kalmanState.mean[2][0] = 0
    }
    if (measurementClampedY) {
      track.kalmanState.mean[3][0] = 0
    }

    // Reduce covariance on constrained axes
    // When position is clamped to boundary, we have high certainty about both
    // position (at boundary) and velocity (zero on that axis)
    const CONSTRAINED_POSITION_VARIANCE = 0.01 // 10cm std dev when at boundary
    const CONSTRAINED_VELOCITY_VARIANCE = 0.01 // Very low velocity uncertainty

    const clampedX = measurementClampedX || outputClampedX
    const clampedY = measurementClampedY || outputClampedY

    if (clampedX) {
      // Reduce X position and velocity variance
      track.kalmanState.covariance[0][0] = Math.min(
        track.kalmanState.covariance[0][0],
        CONSTRAINED_POSITION_VARIANCE
      )
      track.kalmanState.covariance[2][2] = Math.min(
        track.kalmanState.covariance[2][2],
        CONSTRAINED_VELOCITY_VARIANCE
      )
      // Zero cross-covariances for X axis
      track.kalmanState.covariance[0][2] = 0
      track.kalmanState.covariance[2][0] = 0
    }

    if (clampedY) {
      // Reduce Y position and velocity variance
      track.kalmanState.covariance[1][1] = Math.min(
        track.kalmanState.covariance[1][1],
        CONSTRAINED_POSITION_VARIANCE
      )
      track.kalmanState.covariance[3][3] = Math.min(
        track.kalmanState.covariance[3][3],
        CONSTRAINED_VELOCITY_VARIANCE
      )
      // Zero cross-covariances for Y axis
      track.kalmanState.covariance[1][3] = 0
      track.kalmanState.covariance[3][1] = 0
    }

    return filteredPosition
  }

  /**
   * Reset Kalman state when track re-enters after boundary/FOV exit
   *
   * When a track exits via boundary/FOV, the velocity still points toward the edge.
   * If we don't reset it, the filter produces erratic predictions when reconciling
   * the stale edge-pointing velocity with new observations.
   */
  resetOnReentry(track: GlobalTrack, newPosition: Point2D, timestamp: number): void {
    if (!track.kalmanState) {
      return
    }

    // Reset velocity to zero
    track.kalmanState.mean[2][0] = 0 // vx
    track.kalmanState.mean[3][0] = 0 // vy

    // Update position to match new detection
    track.kalmanState.mean[0][0] = newPosition.x
    track.kalmanState.mean[1][0] = newPosition.y
    track.kalmanState.lastTimestamp = timestamp

    // Clear the cached library state so it gets recreated with fresh values
    this.filter.removeTrackState(track.globalTrackId)
  }

  /**
   * Sync Kalman position with externally computed position
   *
   * Used when position is computed outside Kalman (e.g., startup stabilization)
   * to keep Kalman state consistent and avoid "snap back" on next update.
   */
  syncPosition(track: GlobalTrack, position: Point2D): void {
    if (!track.kalmanState) {
      return
    }

    track.kalmanState.mean[0][0] = position.x
    track.kalmanState.mean[1][0] = position.y
  }

  /**
   * Sync Kalman position after clamping, optionally zeroing velocity
   */
  syncPositionWithClamp(
    track: GlobalTrack,
    position: Point2D,
    clampedX: boolean,
    clampedY: boolean
  ): void {
    if (!track.kalmanState) {
      return
    }

    track.kalmanState.mean[0][0] = position.x
    track.kalmanState.mean[1][0] = position.y

    // Zero velocity on clamped axes
    if (clampedX) {
      track.kalmanState.mean[2][0] = 0
    }
    if (clampedY) {
      track.kalmanState.mean[3][0] = 0
    }
  }

  // ===========================================================================
  // Velocity Operations
  // ===========================================================================

  /**
   * Apply velocity damping during occlusion coasting
   *
   * Reduces velocity to prevent drift/bouncing during occlusion.
   * Curve predictions have built-in arc constraints, so only use for linear.
   */
  applyVelocityDamping(track: GlobalTrack, dampingFactor: number): void {
    if (!track.kalmanState) {
      return
    }

    track.kalmanState.mean[2][0] *= dampingFactor // vx
    track.kalmanState.mean[3][0] *= dampingFactor // vy
  }

  /**
   * Scale velocity by a factor (used when position jump is scaled down)
   *
   * When jump prevention scales position by factor s, velocity should also
   * be scaled by s to prevent overprediction on the next frame.
   * This keeps the Kalman filter's velocity estimate consistent with
   * the observed (scaled) movement.
   */
  scaleVelocity(track: GlobalTrack, scaleFactor: number): void {
    if (!track.kalmanState) {
      return
    }

    track.kalmanState.mean[2][0] *= scaleFactor // vx
    track.kalmanState.mean[3][0] *= scaleFactor // vy
  }

  /**
   * Reset velocity to zero (e.g., when track hits boundary during coasting)
   */
  resetVelocity(track: GlobalTrack): void {
    if (!track.kalmanState) {
      return
    }

    track.kalmanState.mean[2][0] = 0
    track.kalmanState.mean[3][0] = 0
  }

  /**
   * Zero velocity on specific axes
   */
  zeroVelocityOnAxes(track: GlobalTrack, zeroX: boolean, zeroY: boolean): void {
    if (!track.kalmanState) {
      return
    }

    if (zeroX) {
      track.kalmanState.mean[2][0] = 0
    }
    if (zeroY) {
      track.kalmanState.mean[3][0] = 0
    }
  }

  // ===========================================================================
  // Prediction Operations
  // ===========================================================================

  /**
   * Predict position forward in time
   */
  predict(track: GlobalTrack, deltaMs: number): Point2D | undefined {
    if (!track.kalmanState) {
      return undefined
    }

    return this.filter.predict(track.kalmanState, deltaMs)
  }

  /**
   * Predict position and clamp to room bounds
   *
   * Also updates Kalman state to match clamped position and zeros velocity
   * on clamped axes to prevent bouncing.
   */
  predictAndClamp(
    track: GlobalTrack,
    deltaMs: number,
    roomBounds: RoomBounds,
    margin: number = 0.1
  ): ClampResult | undefined {
    if (!track.kalmanState) {
      return undefined
    }

    const predicted = this.filter.predict(track.kalmanState, deltaMs)
    const clampResult = clampPointToRoom(predicted, roomBounds, margin)

    // Update Kalman state to match clamped position
    if (clampResult.clampedX || clampResult.clampedY) {
      if (clampResult.clampedX) {
        track.kalmanState.mean[2][0] = 0 // Zero X velocity
        track.kalmanState.mean[0][0] = clampResult.point.x
      }
      if (clampResult.clampedY) {
        track.kalmanState.mean[3][0] = 0 // Zero Y velocity
        track.kalmanState.mean[1][0] = clampResult.point.y
      }
    }

    return {
      position: clampResult.point,
      clampedX: clampResult.clampedX,
      clampedY: clampResult.clampedY,
    }
  }

  // ===========================================================================
  // Accessors (delegating to KalmanTrackFilter)
  // ===========================================================================

  /**
   * Get current position from Kalman state
   */
  getPosition(track: GlobalTrack): Point2D | undefined {
    if (!track.kalmanState) {
      return undefined
    }
    return this.filter.getPosition(track.kalmanState)
  }

  /**
   * Get current velocity from Kalman state
   */
  getVelocity(track: GlobalTrack): Point2D | undefined {
    if (!track.kalmanState) {
      return undefined
    }
    return this.filter.getVelocity(track.kalmanState)
  }

  /**
   * Get current speed from Kalman state
   */
  getSpeed(track: GlobalTrack): number {
    if (!track.kalmanState) {
      return 0
    }
    return this.filter.getSpeed(track.kalmanState)
  }

  /**
   * Get position uncertainty (standard deviation) in meters
   */
  getPositionUncertainty(track: GlobalTrack): number {
    if (!track.kalmanState) {
      return Infinity
    }
    return this.filter.getPositionUncertainty(track.kalmanState)
  }

  /**
   * Get gating distance for data association
   */
  getGatingDistance(track: GlobalTrack, baseDistance: number = 1.0): number {
    if (!track.kalmanState) {
      return baseDistance * 2 // Return max gate when no Kalman state
    }
    return this.filter.getGatingDistance(track.kalmanState, baseDistance)
  }

  /**
   * Calculate Mahalanobis distance between measurement and predicted state
   */
  getMahalanobisDistance(track: GlobalTrack, measurement: Point2D): number {
    if (!track.kalmanState) {
      return Infinity
    }
    return this.filter.getMahalanobisDistance(track.kalmanState, measurement)
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Remove cached state for a track (call when track expires)
   */
  removeTrackState(trackId: string): void {
    this.filter.removeTrackState(trackId)
  }

  /**
   * Clear all cached states
   */
  clearCache(): void {
    this.filter.clearCache()
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics() {
    return this.filter.getCacheMetrics()
  }
}
