/**
 * Assignment Strategy Interface
 *
 * Abstracts the detection-to-track assignment algorithm to allow different
 * implementations (Hungarian, greedy, GNN, etc.) to be swapped without
 * modifying TrackManager.
 */

import type { CameraDetection, GlobalTrack, Point2D } from '../types.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Result of a single detection-track match
 */
export interface AssignmentMatch {
  detection: CameraDetection
  track: GlobalTrack
  cost: number
}

/**
 * Result of assignment operation
 */
export interface AssignmentResult {
  /** Successfully matched detection-track pairs */
  matches: AssignmentMatch[]
  /** Detections that couldn't be matched to any track */
  unmatchedDetections: CameraDetection[]
  /** Tracks that weren't matched to any detection */
  unmatchedTracks: GlobalTrack[]
  /** Total assignment cost (for diagnostics) */
  totalCost: number
}

/**
 * Geometry information for predictive handoff zones
 */
export interface HandoffGeometry {
  /** FOV polygons for all cameras */
  fovPolygons: Point2D[][]
  /** Room boundary dimensions */
  roomBounds: { width: number; height: number }
}

/**
 * Configuration for assignment algorithms
 *
 * Core parameters are required; advanced parameters are optional and will
 * use defaults from ALGORITHM_CONSTANTS if not provided.
 */
export interface AssignmentConfig {
  // === Core Parameters (required) ===
  /** Maximum cost for valid assignment (meters) */
  maxCost: number
  /** Use Kalman prediction for track position */
  useKalmanPrediction: boolean
  /** Kalman filter instance for predictions */
  kalmanFilter?: KalmanTrackFilter
  /** Bonus multiplier for existing camera-track associations (0-1) */
  associationBonus: number
  /** Penalty multiplier when track already has different localTrackId from same camera */
  sameCameraPenalty: number

  // === Embedding/ReID Parameters ===
  /** Weight for embedding similarity in cost (0-1) */
  embeddingWeight: number
  /** Minimum embedding similarity to apply bonus (0-1) */
  embeddingMinSimilarity: number
  /** Minimum embedding quality to use in matching (0-1) */
  embeddingMinQuality: number

  // === Motion Consistency Parameters ===
  /** Weight for velocity consistency cost component */
  velocityConsistencyWeight: number
  /** Weight for direction-of-travel consistency (0-1) */
  directionConsistencyWeight: number
  /** Minimum speed (m/s) to consider direction constraint */
  minSpeedForDirection: number
  /** Maximum plausible acceleration (m/s²) before penalty */
  maxAccelerationMs2: number
  /** Weight for acceleration consistency cost component */
  accelerationConsistencyWeight: number

  // === Cross-Camera Parameters ===
  /** Cost multiplier for cross-camera handoff (0-1, lower = more bonus) */
  crossCameraBonus: number
  /** Time window for cross-camera bonus (ms) */
  crossCameraBonusWindowMs: number

  // === Crossing Detection Parameters ===
  /** Proximity threshold for detecting crossing tracks (meters) */
  crossingProximityThreshold: number
  /** Cost multiplier for crossing tracks (tighter matching) */
  crossingMaxCostMultiplier: number
  /** Minimum embedding similarity required during crossing (appearance gate) */
  crossingMinSimilarity: number
  /** Penalty multiplier for poor embedding match during crossing */
  crossingMismatchPenalty: number
  /** Minimum embedding quality to apply crossing gate */
  crossingMinQuality: number

  // === Adaptive Gating Parameters ===
  /** Minimum detection count for tight adaptive gating */
  minConfidenceForTightGate: number
  /** Gate reduction factor for confident tracks (0-1) */
  confidentTrackGateFactor: number
  /** Minimum embedding quality for adaptive gating */
  adaptiveMinQuality: number
}

// ============================================================================
// Strategy Interface
// ============================================================================

/**
 * Interface for detection-to-track assignment strategies.
 *
 * Implementations can use different algorithms:
 * - HungarianStrategy: Optimal global assignment using Munkres algorithm
 * - GreedyStrategy: Fast nearest-neighbor assignment
 * - GNNStrategy: Graph neural network based assignment
 *
 * @example
 * ```typescript
 * const strategy: IAssignmentStrategy = new HungarianStrategy(config)
 * const result = strategy.assign(detections, tracks)
 * ```
 */
export interface IAssignmentStrategy {
  /**
   * Assign detections to tracks
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
  ): AssignmentResult

  /**
   * Get the strategy name (for logging/metrics)
   */
  readonly name: string

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<AssignmentConfig>): void
}

// ============================================================================
// Default Configuration
// ============================================================================

import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Default assignment configuration derived from algorithm constants.
 * All parameters are sourced from the centralized ALGORITHM_CONSTANTS.
 */
export const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  // Core parameters
  maxCost: ALGORITHM_CONSTANTS.assignment.maxCost,
  useKalmanPrediction: true,
  associationBonus: ALGORITHM_CONSTANTS.assignment.associationBonus,
  sameCameraPenalty: ALGORITHM_CONSTANTS.assignment.sameCameraPenalty,

  // Embedding/ReID parameters
  embeddingWeight: ALGORITHM_CONSTANTS.assignment.embeddingWeight,
  embeddingMinSimilarity: ALGORITHM_CONSTANTS.assignment.embeddingMinSimilarity,
  embeddingMinQuality: ALGORITHM_CONSTANTS.assignment.embeddingMinQuality,

  // Motion consistency parameters
  velocityConsistencyWeight: ALGORITHM_CONSTANTS.assignment.velocityConsistencyWeight,
  directionConsistencyWeight: ALGORITHM_CONSTANTS.assignment.directionConsistencyWeight,
  minSpeedForDirection: ALGORITHM_CONSTANTS.assignment.minSpeedForDirection,
  maxAccelerationMs2: ALGORITHM_CONSTANTS.assignment.maxAccelerationMs2,
  accelerationConsistencyWeight: ALGORITHM_CONSTANTS.assignment.accelerationConsistencyWeight,

  // Cross-camera parameters
  crossCameraBonus: ALGORITHM_CONSTANTS.assignment.crossCameraBonus,
  crossCameraBonusWindowMs: ALGORITHM_CONSTANTS.assignment.crossCameraBonusWindowMs,

  // Crossing detection parameters
  crossingProximityThreshold: ALGORITHM_CONSTANTS.assignment.crossingProximityThreshold,
  crossingMaxCostMultiplier: ALGORITHM_CONSTANTS.assignment.crossingMaxCostMultiplier,
  // These are not in ALGORITHM_CONSTANTS.assignment, use reasonable defaults
  crossingMinSimilarity: 0.70,
  crossingMismatchPenalty: 3.0,
  crossingMinQuality: 0.35,

  // Adaptive gating parameters
  minConfidenceForTightGate: 5,
  confidentTrackGateFactor: 0.7,
  adaptiveMinQuality: 0.4,
}
