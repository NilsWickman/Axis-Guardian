/**
 * Hungarian Assignment Strategy
 *
 * Implements IAssignmentStrategy using the Munkres (Hungarian) algorithm
 * for globally optimal detection-to-track assignment.
 */

import type { CameraDetection, GlobalTrack } from '../types.js'
import type {
  IAssignmentStrategy,
  AssignmentResult,
  AssignmentConfig,
  HandoffGeometry,
} from './assignment-strategy.js'
import { DEFAULT_ASSIGNMENT_CONFIG } from './assignment-strategy.js'
import { assignDetectionsToTracks } from './hungarian-assignment.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'

/**
 * Hungarian (Munkres) assignment strategy.
 *
 * Provides globally optimal assignment that minimizes total cost across
 * all detection-track pairs. More accurate than greedy but O(n³) complexity.
 *
 * @example
 * ```typescript
 * // Create with default configuration
 * const strategy = new HungarianStrategy()
 *
 * // Create with custom configuration
 * const strategy = new HungarianStrategy({
 *   maxCost: 2.0,
 *   embeddingWeight: 0.5,
 * })
 *
 * // Use in TrackManager
 * const result = strategy.assign(detections, tracks)
 * ```
 */
export class HungarianStrategy implements IAssignmentStrategy {
  readonly name = 'hungarian'

  private config: AssignmentConfig
  private kalmanFilter: KalmanTrackFilter

  constructor(config: Partial<AssignmentConfig> = {}) {
    this.config = { ...DEFAULT_ASSIGNMENT_CONFIG, ...config }
    this.kalmanFilter = config.kalmanFilter ?? new KalmanTrackFilter()
  }

  /**
   * Assign detections to tracks using Hungarian algorithm
   *
   * @param detections - Array of detections to assign
   * @param tracks - Array of active tracks
   * @param handoffGeometry - Optional geometry for predictive handoff zones
   * @returns Assignment result with matches and unmatched items
   */
  assign(
    detections: CameraDetection[],
    tracks: GlobalTrack[],
    handoffGeometry?: HandoffGeometry
  ): AssignmentResult {
    return assignDetectionsToTracks(
      detections,
      tracks,
      {
        ...this.config,
        kalmanFilter: this.kalmanFilter,
      },
      handoffGeometry
    )
  }

  /**
   * Update configuration at runtime
   *
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<AssignmentConfig>): void {
    this.config = { ...this.config, ...config }
    if (config.kalmanFilter) {
      this.kalmanFilter = config.kalmanFilter
    }
  }

  /**
   * Get current configuration (for inspection/debugging)
   */
  getConfig(): Readonly<AssignmentConfig> {
    return { ...this.config }
  }
}
