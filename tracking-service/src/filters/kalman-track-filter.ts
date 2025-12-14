/**
 * Kalman Filter for Track Position/Velocity Estimation
 *
 * Implements a 4-state Kalman filter for tracking position and velocity:
 *   State vector: [x, y, vx, vy]
 *   Observation: [x, y]
 *
 * Uses the kalman-filter npm package for efficient matrix operations.
 */

// @ts-expect-error - kalman-filter is a CommonJS module
import kalmanFilter from 'kalman-filter'
const { KalmanFilter, State } = kalmanFilter

import type { Point2D, KalmanState } from '../types.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KalmanStateInternal = any  // The library's State class instance

/**
 * Configuration for Kalman filter behavior
 */
export interface KalmanFilterConfig {
  /** Process noise (acceleration variance, m/s²). Higher = more responsive to changes */
  processNoise: number
  /** Measurement noise (position variance, m²). Higher = smoother but slower response */
  measurementNoise: number
  /** Initial position uncertainty (m²) */
  initialPositionUncertainty: number
  /** Initial velocity uncertainty (m/s)² */
  initialVelocityUncertainty: number
}

/**
 * Default Kalman filter configuration
 * Tuned for walking pedestrians (~1.4 m/s typical speed)
 *
 * Values based on evaluation by Dev4 (see docs/KALMAN_FILTER_TUNING.md):
 * - q_vel=1.0: Velocity process noise for walking (captures 0.5-2.0 m/s² accelerations)
 * - r_pos=0.25: Measurement noise (~0.5m std from camera projection error)
 *
 * These values provide:
 * - 1-step prediction RMSE: ~0.43m at 10Hz
 * - Good velocity responsiveness for direction changes
 * - Balance between smoothing and tracking lag
 */
export const DEFAULT_KALMAN_CONFIG: KalmanFilterConfig = {
  processNoise: ALGORITHM_CONSTANTS.kalman.processNoise,
  measurementNoise: ALGORITHM_CONSTANTS.kalman.measurementNoise,
  initialPositionUncertainty: ALGORITHM_CONSTANTS.kalman.initialPositionUncertainty,
  initialVelocityUncertainty: ALGORITHM_CONSTANTS.kalman.initialVelocityUncertainty,
}

/**
 * Kalman filter wrapper for track position/velocity estimation
 */
export class KalmanTrackFilter {
  private filter: KalmanFilter
  private config: KalmanFilterConfig
  // Store internal State objects keyed by track ID for proper library compatibility
  private stateCache: Map<string, KalmanStateInternal> = new Map()
  private static readonly MAX_CACHE_SIZE = ALGORITHM_CONSTANTS.kalman.maxCacheSize

  constructor(config: Partial<KalmanFilterConfig> = {}) {
    this.config = { ...DEFAULT_KALMAN_CONFIG, ...config }

    // Create Kalman filter with constant velocity model
    this.filter = new KalmanFilter({
      observation: {
        dimension: 2,  // We observe [x, y]
        // Observation matrix: extract position from state
        stateProjection: [
          [1, 0, 0, 0],  // x = state[0]
          [0, 1, 0, 0],  // y = state[1]
        ],
        // Measurement noise covariance
        covariance: [
          [this.config.measurementNoise, 0],
          [0, this.config.measurementNoise],
        ],
      },
      dynamic: {
        dimension: 4,  // State: [x, y, vx, vy]
        // Initial state
        init: {
          mean: [[0], [0], [0], [0]],
          covariance: [
            [this.config.initialPositionUncertainty, 0, 0, 0],
            [0, this.config.initialPositionUncertainty, 0, 0],
            [0, 0, this.config.initialVelocityUncertainty, 0],
            [0, 0, 0, this.config.initialVelocityUncertainty],
          ],
        },
        // State transition function (depends on time delta)
        transition: (params?: { deltaTime?: number }) => {
          const dt = params?.deltaTime ?? 1
          return [
            [1, 0, dt, 0],  // x = x + vx*dt
            [0, 1, 0, dt],  // y = y + vy*dt
            [0, 0, 1, 0],   // vx = vx
            [0, 0, 0, 1],   // vy = vy
          ]
        },
        // Process noise covariance (based on acceleration variance)
        covariance: (params?: { deltaTime?: number }) => {
          const dt = params?.deltaTime ?? 1
          const q = this.config.processNoise
          const dt2 = dt * dt
          const dt3 = dt2 * dt
          const dt4 = dt3 * dt

          // Process noise using constant acceleration model
          return [
            [q * dt4 / 4, 0, q * dt3 / 2, 0],
            [0, q * dt4 / 4, 0, q * dt3 / 2],
            [q * dt3 / 2, 0, q * dt2, 0],
            [0, q * dt3 / 2, 0, q * dt2],
          ]
        },
      },
    })
  }

  /**
   * Create a library State instance from our KalmanState
   */
  private createLibraryState(state: KalmanState): KalmanStateInternal {
    return new State({
      mean: state.mean,
      covariance: state.covariance,
    })
  }

  /**
   * Initialize filter state from first observation
   */
  initialize(position: Point2D, timestamp: number): KalmanState {
    return {
      mean: [[position.x], [position.y], [0], [0]],
      covariance: [
        [this.config.initialPositionUncertainty, 0, 0, 0],
        [0, this.config.initialPositionUncertainty, 0, 0],
        [0, 0, this.config.initialVelocityUncertainty, 0],
        [0, 0, 0, this.config.initialVelocityUncertainty],
      ],
      lastTimestamp: timestamp,
    }
  }

  /**
   * Update filter with new observation
   * @param state Current state
   * @param position New observation
   * @param timestamp Current time in ms
   * @param trackId Optional track ID for state caching
   */
  update(state: KalmanState, position: Point2D, timestamp: number, trackId?: string): KalmanState {
    const dt = (timestamp - state.lastTimestamp) / 1000  // Convert ms to seconds

    // Skip update if time delta is too small
    if (dt < 0.001) {
      return state
    }

    try {
      // Get or create library State instance
      let libState: KalmanStateInternal
      if (trackId && this.stateCache.has(trackId)) {
        libState = this.stateCache.get(trackId)!
      } else {
        libState = this.createLibraryState(state)
      }

      // filter() returns the corrected State directly (not { corrected: State })
      const correctedState = this.filter.filter({
        previousCorrected: libState,
        observation: [[position.x], [position.y]],
        deltaTime: dt,
      })

      // Cache the corrected state for next update
      if (trackId) {
        this.stateCache.set(trackId, correctedState)
        // Emergency cleanup if cache grows too large
        if (this.stateCache.size > KalmanTrackFilter.MAX_CACHE_SIZE) {
          this.evictOldestEntries()
        }
      }

      return {
        mean: correctedState.mean,
        covariance: correctedState.covariance,
        lastTimestamp: timestamp,
      }
    } catch (error) {
      // If filter fails, return a fresh state at the new position
      console.warn('Kalman filter update failed, reinitializing:', error)
      const newState = this.initialize(position, timestamp)
      // Clear cached state on error
      if (trackId) {
        this.stateCache.delete(trackId)
      }
      return newState
    }
  }

  /**
   * Remove cached state for a track (call when track expires)
   */
  removeTrackState(trackId: string): void {
    this.stateCache.delete(trackId)
  }

  /**
   * Clear all cached states
   */
  clearCache(): void {
    this.stateCache.clear()
  }

  /**
   * Evict oldest entries when cache exceeds max size
   * Uses FIFO eviction (Map maintains insertion order)
   */
  private evictOldestEntries(): void {
    const targetSize = Math.floor(KalmanTrackFilter.MAX_CACHE_SIZE * 0.8)  // Remove 20%
    const keysToRemove = Array.from(this.stateCache.keys())
      .slice(0, this.stateCache.size - targetSize)

    for (const key of keysToRemove) {
      this.stateCache.delete(key)
    }
  }

  /**
   * Get current cache size (for monitoring)
   */
  getCacheSize(): number {
    return this.stateCache.size
  }

  /**
   * Predict state forward in time
   */
  predict(state: KalmanState, deltaMs: number): Point2D {
    const dt = deltaMs / 1000  // Convert ms to seconds

    // Simple linear prediction using current velocity
    const x = state.mean[0][0]
    const y = state.mean[1][0]
    const vx = state.mean[2][0]
    const vy = state.mean[3][0]

    return {
      x: x + vx * dt,
      y: y + vy * dt,
    }
  }

  /**
   * Get current position estimate from state
   */
  getPosition(state: KalmanState): Point2D {
    return {
      x: state.mean[0][0],
      y: state.mean[1][0],
    }
  }

  /**
   * Get current velocity estimate from state
   */
  getVelocity(state: KalmanState): Point2D {
    return {
      x: state.mean[2][0],
      y: state.mean[3][0],
    }
  }

  /**
   * Get speed in m/s
   */
  getSpeed(state: KalmanState): number {
    const vx = state.mean[2][0]
    const vy = state.mean[3][0]
    return Math.sqrt(vx * vx + vy * vy)
  }

  /**
   * Get position uncertainty (standard deviation) in meters
   */
  getPositionUncertainty(state: KalmanState): number {
    // Return average of x and y position variances
    const varX = state.covariance[0][0]
    const varY = state.covariance[1][1]
    return Math.sqrt((varX + varY) / 2)
  }

  /**
   * Calculate Mahalanobis distance between a measurement and predicted state.
   * This is the statistically principled way to measure association likelihood.
   * Returns the number of standard deviations the measurement is from the prediction.
   *
   * @param state - Current Kalman state (after prediction)
   * @param measurement - Observed position {x, y}
   * @returns Mahalanobis distance (unitless, in standard deviations)
   */
  getMahalanobisDistance(state: KalmanState, measurement: Point2D): number {
    // Innovation (residual): difference between measurement and predicted position
    const dx = measurement.x - state.mean[0][0]
    const dy = measurement.y - state.mean[1][0]

    // Extract position covariance (2x2 submatrix)
    const S00 = state.covariance[0][0]
    const S01 = state.covariance[0][1]
    const S10 = state.covariance[1][0]
    const S11 = state.covariance[1][1]

    // Determinant of 2x2 covariance matrix
    const det = S00 * S11 - S01 * S10

    // Guard against singular matrix
    if (Math.abs(det) < 1e-10) {
      // Fall back to Euclidean distance normalized by average variance
      const avgVar = (S00 + S11) / 2
      if (avgVar < 1e-10) return Math.sqrt(dx * dx + dy * dy)
      return Math.sqrt((dx * dx + dy * dy) / avgVar)
    }

    // Inverse of 2x2 covariance matrix
    const invS00 = S11 / det
    const invS01 = -S01 / det
    const invS10 = -S10 / det
    const invS11 = S00 / det

    // Mahalanobis distance: sqrt(d^T * S^-1 * d)
    const mahal = Math.sqrt(
      dx * (invS00 * dx + invS01 * dy) +
      dy * (invS10 * dx + invS11 * dy)
    )

    return mahal
  }

  /**
   * Get gating distance for data association
   * Returns adaptive threshold based on position uncertainty
   * Capped at 2x base distance to prevent over-expansion with high initial uncertainty
   */
  getGatingDistance(state: KalmanState, baseDistance: number = 1.0): number {
    const uncertainty = this.getPositionUncertainty(state)
    // Expand gate based on uncertainty, but cap at 2x base to prevent
    // unreasonable expansion with high initial uncertainty
    const expanded = baseDistance + 2 * uncertainty
    return Math.min(expanded, baseDistance * 2)
  }
}

/**
 * Singleton instance with default config
 */
let defaultFilter: KalmanTrackFilter | null = null

/**
 * Get or create default Kalman filter instance
 */
export function getDefaultKalmanFilter(): KalmanTrackFilter {
  if (!defaultFilter) {
    defaultFilter = new KalmanTrackFilter()
  }
  return defaultFilter
}
