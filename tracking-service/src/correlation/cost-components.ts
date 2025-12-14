/**
 * Cost Components - Modular cost calculators for Hungarian assignment
 *
 * Extracted from hungarian-assignment.ts to provide:
 * - Independent testability for each cost component
 * - Clear separation of concerns
 * - Reusable cost calculation logic
 */

import type { Point2D, GlobalTrack, CameraDetection } from '../types.js'
import { cosineSimilarity } from '../tracks/attribute-aggregator.js'
import { getMetrics } from '../metrics/index.js'

// ============================================================================
// Association Cost Component
// ============================================================================

export interface AssociationCostConfig {
  /** Bonus multiplier for existing camera-track associations (0-1, lower = more bonus) */
  associationBonus: number
  /** Penalty multiplier when track already has different trackId from same camera */
  sameCameraPenalty: number
  /** Cost multiplier for cross-camera handoff (0-1, lower = more bonus) */
  crossCameraBonus: number
  /** Time window for cross-camera bonus (ms) */
  crossCameraBonusWindowMs: number
  /** Maximum cost threshold for determining "close" detections */
  maxCost: number
}

/**
 * Calculate association cost multiplier based on camera-track relationships
 *
 * Handles three cases:
 * 1. Same camera + same trackId: Strong bonus (likely same person)
 * 2. Same camera + different trackId: Bonus if close (fragmentation) or penalty (different person)
 * 3. Cross-camera: Bonus if track seen by other cameras recently (handoff)
 *
 * @returns Multiplier to apply to base distance cost (< 1 = bonus, > 1 = penalty)
 */
export function calculateAssociationMultiplier(
  detection: CameraDetection,
  track: GlobalTrack,
  baseDistance: number,
  config: AssociationCostConfig
): number {
  const assoc = track.cameraAssociations.get(detection.cameraId)

  // Case 1: Same camera + same trackId = strong bonus
  if (assoc?.trackIds.includes(detection.trackId)) {
    return config.associationBonus
  }

  // Case 2: Same camera + different trackId
  if (assoc && assoc.trackIds.length > 0) {
    const timeSinceSameCam = detection.timestamp - assoc.lastSeen

    // Tight thresholds to prevent track stealing
    const isRecentAndClose =
      baseDistance < config.maxCost * 0.25 && timeSinceSameCam < 250
    const isVeryClose = baseDistance < config.maxCost * 0.2

    if (isRecentAndClose || isVeryClose) {
      // Likely local tracker fragmentation - give bonus
      return 0.5
    } else {
      // Older or farther - probably different person, apply penalty
      return config.sameCameraPenalty
    }
  }

  // Case 3: Cross-camera - check if track seen by other cameras recently
  if (!assoc) {
    const hasRecentCrossCamera = Array.from(track.cameraAssociations.entries()).some(
      ([camId, camAssoc]) =>
        camId !== detection.cameraId &&
        detection.timestamp - camAssoc.lastSeen < config.crossCameraBonusWindowMs
    )
    if (hasRecentCrossCamera) {
      return config.crossCameraBonus
    }
  }

  // No adjustment
  return 1.0
}

// ============================================================================
// Motion Consistency Cost Component
// ============================================================================

export interface MotionCostConfig {
  /** Weight for velocity consistency cost (0-1) */
  velocityConsistencyWeight: number
  /** Weight for direction-of-travel consistency (0-1) */
  directionConsistencyWeight: number
  /** Minimum speed (m/s) to consider direction constraint */
  minSpeedForDirection: number
  /** Weight for acceleration consistency cost (0-1) */
  accelerationConsistencyWeight: number
  /** Maximum plausible acceleration (m/s²) before penalty */
  maxAccelerationMs2: number
}

/**
 * Calculate motion consistency cost (additive penalty)
 *
 * Penalizes assignments that would require:
 * - Implausible velocity changes
 * - Direction reversals
 * - Unrealistic acceleration
 *
 * @param detectionPos - World position of detection
 * @param track - Track being matched against
 * @param predictedVelocity - Kalman-predicted velocity (or null)
 * @param timeDeltaMs - Time since track was last seen (ms)
 * @returns Additive cost penalty in meters equivalent
 */
export function calculateMotionConsistencyCost(
  detectionPos: Point2D,
  track: GlobalTrack,
  predictedVelocity: Point2D | null,
  timeDeltaMs: number,
  config: MotionCostConfig
): number {
  if (!predictedVelocity || config.velocityConsistencyWeight <= 0) {
    return 0
  }

  const dt = timeDeltaMs / 1000 // Convert to seconds
  if (dt <= 0.01) {
    return 0
  }

  let totalPenalty = 0

  // Calculate implied velocity from current position to detection
  const impliedVelocity = {
    x: (detectionPos.x - track.currentPosition.x) / dt,
    y: (detectionPos.y - track.currentPosition.y) / dt,
  }

  // 1. Velocity consistency penalty
  const velocityChange = Math.sqrt(
    Math.pow(impliedVelocity.x - predictedVelocity.x, 2) +
    Math.pow(impliedVelocity.y - predictedVelocity.y, 2)
  )
  totalPenalty += Math.min(0.5, velocityChange * config.velocityConsistencyWeight)

  // 2. Direction-of-travel consistency penalty
  if (config.directionConsistencyWeight > 0) {
    const currentSpeed = Math.sqrt(
      predictedVelocity.x * predictedVelocity.x +
      predictedVelocity.y * predictedVelocity.y
    )
    const impliedSpeed = Math.sqrt(
      impliedVelocity.x * impliedVelocity.x +
      impliedVelocity.y * impliedVelocity.y
    )

    // Only apply if track has meaningful velocity
    if (currentSpeed > config.minSpeedForDirection && impliedSpeed > config.minSpeedForDirection) {
      const dotProduct =
        predictedVelocity.x * impliedVelocity.x +
        predictedVelocity.y * impliedVelocity.y
      const directionSimilarity = dotProduct / (currentSpeed * impliedSpeed)

      // directionSimilarity: 1 = same direction, -1 = opposite
      // Convert to penalty: 0 for same direction, 1 for opposite
      const directionPenalty = (1 - directionSimilarity) / 2
      totalPenalty += Math.min(0.5, directionPenalty * config.directionConsistencyWeight)
    }
  }

  // 3. Acceleration consistency penalty
  if (config.accelerationConsistencyWeight > 0 && dt > 0.05) {
    const accelerationX = (impliedVelocity.x - predictedVelocity.x) / dt
    const accelerationY = (impliedVelocity.y - predictedVelocity.y) / dt
    const acceleration = Math.sqrt(accelerationX * accelerationX + accelerationY * accelerationY)

    if (acceleration > config.maxAccelerationMs2) {
      const excessAccel = acceleration - config.maxAccelerationMs2
      totalPenalty += Math.min(0.4, excessAccel * config.accelerationConsistencyWeight)
    }
  }

  return totalPenalty
}

// ============================================================================
// Embedding Similarity Cost Component
// ============================================================================

export interface EmbeddingCostConfig {
  /** Weight for embedding similarity in cost (0-1) */
  embeddingWeight: number
  /** Minimum embedding similarity to apply bonus (0-1) */
  embeddingMinSimilarity: number
  /** Minimum embedding quality to use in matching (0-1) */
  embeddingMinQuality: number
}

export interface EmbeddingCostResult {
  /** Multiplier to apply to cost (< 1 = bonus, > 1 = penalty) */
  multiplier: number
  /** Whether a bonus was applied */
  bonusApplied: boolean
  /** Whether a penalty was applied */
  penaltyApplied: boolean
  /** Similarity score if computed */
  similarity?: number
}

/**
 * Calculate embedding similarity cost multiplier
 *
 * Uses Re-ID embeddings to adjust cost:
 * - High similarity (> threshold): Apply bonus (reduce cost)
 * - Very low similarity (< 0.3): Apply penalty for established tracks
 *
 * Temporal gating: Reduced weight for frame-to-frame tracking,
 * full weight for re-identification scenarios (> 500ms gap) or cross-camera.
 *
 * @returns Result with multiplier and metadata
 */
export function calculateEmbeddingSimilarityMultiplier(
  detection: CameraDetection,
  track: GlobalTrack,
  timeSinceLastSeenMs: number,
  config: EmbeddingCostConfig,
  recordMetrics: boolean = true
): EmbeddingCostResult {
  const result: EmbeddingCostResult = {
    multiplier: 1.0,
    bonusApplied: false,
    penaltyApplied: false,
  }

  if (config.embeddingWeight <= 0) {
    return result
  }

  const detEmbedding = detection.attributes?.embedding
  const detQuality = detection.attributes?.embedding_quality ?? 0
  const trackEmbedding = track.attributes?.embedding
  const trackQuality = track.attributes?.embedding_quality ?? 0

  // Temporal gating: Full weight for re-ID or cross-camera, reduced for frame-to-frame
  const isReidentification = timeSinceLastSeenMs > 500
  const isCrossCamera = !track.cameraAssociations.has(detection.cameraId)

  const effectiveWeight =
    isReidentification || isCrossCamera
      ? config.embeddingWeight
      : config.embeddingWeight * 0.3

  // Check if both embeddings are valid and sufficient quality
  if (
    effectiveWeight <= 0 ||
    !detEmbedding ||
    !trackEmbedding ||
    detEmbedding.length === 0 ||
    trackEmbedding.length !== detEmbedding.length ||
    detQuality < config.embeddingMinQuality ||
    trackQuality < config.embeddingMinQuality
  ) {
    return result
  }

  const similarity = cosineSimilarity(detEmbedding, trackEmbedding)
  result.similarity = similarity

  // Record embedding comparison for metrics
  if (recordMetrics) {
    getMetrics().recordEmbeddingComparison(similarity)
  }

  if (similarity > config.embeddingMinSimilarity) {
    // High similarity = bonus (reduce cost)
    const embeddingBonus =
      1 -
      (effectiveWeight * (similarity - config.embeddingMinSimilarity)) /
        (1 - config.embeddingMinSimilarity)
    result.multiplier = embeddingBonus
    result.bonusApplied = true
    if (recordMetrics) {
      getMetrics().recordEmbeddingBonus()
    }
  } else if (similarity < 0.3) {
    // Very low similarity = penalty for well-established tracks
    if (
      trackQuality > 0.6 &&
      track.attributes?.sample_count &&
      track.attributes.sample_count >= 5
    ) {
      const embeddingPenalty = 1 + effectiveWeight * (0.3 - similarity)
      result.multiplier = embeddingPenalty
      result.penaltyApplied = true
      if (recordMetrics) {
        getMetrics().recordEmbeddingPenalty()
      }
    }
  }

  return result
}

// ============================================================================
// Appearance-Gated Crossing Detection
// ============================================================================

export interface CrossingGateConfig {
  /** Minimum embedding similarity required for crossing scenarios */
  crossingMinSimilarity: number
  /** Heavy penalty multiplier when embeddings don't match during crossing */
  crossingMismatchPenalty: number
  /** Minimum embedding quality to apply crossing gate */
  crossingMinQuality: number
}

/**
 * Apply appearance-gated penalty for crossing track scenarios
 *
 * When multiple tracks are in close proximity (crossing), use ReID embeddings
 * to prevent ID switches. If embeddings are available and don't match well,
 * apply a heavy penalty to prevent incorrect assignment.
 *
 * @param detection - Detection being assigned
 * @param track - Track being considered
 * @param isTrackCrossing - Whether this track is in a crossing situation
 * @param config - Crossing gate configuration
 * @returns Multiplier (1.0 = no change, > 1 = penalty for mismatch)
 */
export function calculateCrossingGateMultiplier(
  detection: CameraDetection,
  track: GlobalTrack,
  isTrackCrossing: boolean,
  config: CrossingGateConfig
): { multiplier: number; reason: string } {
  // Only apply gating if track is in crossing situation
  if (!isTrackCrossing) {
    return { multiplier: 1.0, reason: 'not_crossing' }
  }

  const detEmbedding = detection.attributes?.embedding
  const detQuality = detection.attributes?.embedding_quality ?? 0
  const trackEmbedding = track.attributes?.embedding
  const trackQuality = track.attributes?.embedding_quality ?? 0

  // If embeddings not available, can't apply gate - fall back to motion
  if (
    !detEmbedding ||
    !trackEmbedding ||
    detEmbedding.length === 0 ||
    trackEmbedding.length !== detEmbedding.length
  ) {
    return { multiplier: 1.0, reason: 'no_embeddings' }
  }

  // Skip if quality is too low for reliable matching
  if (detQuality < config.crossingMinQuality || trackQuality < config.crossingMinQuality) {
    return { multiplier: 1.0, reason: 'low_quality' }
  }

  const similarity = cosineSimilarity(detEmbedding, trackEmbedding)

  // Record crossing event for metrics
  getMetrics().recordCrossingEvent()

  if (similarity >= config.crossingMinSimilarity) {
    // Good match - allow assignment and record success
    getMetrics().recordCrossingResolved()
    return { multiplier: 0.8, reason: 'appearance_match' }  // Small bonus for confirmed match
  } else {
    // Poor match during crossing - apply heavy penalty to prevent ID switch
    return {
      multiplier: config.crossingMismatchPenalty,
      reason: `appearance_mismatch:${similarity.toFixed(2)}`,
    }
  }
}

// ============================================================================
// Adaptive Gating for Confident Tracks
// ============================================================================

export interface AdaptiveGateConfig {
  /** Minimum confidence (detection count) for tight gating */
  minConfidenceForTightGate: number
  /** Gate reduction factor for confident tracks (0-1, lower = tighter) */
  confidentTrackGateFactor: number
  /** Minimum embedding quality for adaptive gating */
  adaptiveMinQuality: number
}

/**
 * Calculate adaptive gate factor based on track confidence
 *
 * Confident tracks (high detection count, good embedding quality) get tighter
 * matching gates to prevent drift. New tracks get looser gates to allow
 * initial association.
 *
 * @param track - Track to evaluate
 * @param config - Adaptive gate configuration
 * @returns Gate factor multiplier (< 1 = tighter gate)
 */
export function calculateAdaptiveGateFactor(
  track: GlobalTrack,
  config: AdaptiveGateConfig
): number {
  const detectionCount = track.detectionCount
  const embeddingQuality = track.attributes?.embedding_quality ?? 0

  // New tracks get full gate
  if (detectionCount < config.minConfidenceForTightGate) {
    return 1.0
  }

  // High-quality, confident tracks get tighter gate
  const hasGoodEmbedding = embeddingQuality >= config.adaptiveMinQuality
  const confidenceFactor = Math.min(1.0, detectionCount / 10)  // Cap at 10 detections

  if (hasGoodEmbedding) {
    // Tighter gate for tracks with good appearance model
    return 1.0 - (1.0 - config.confidentTrackGateFactor) * confidenceFactor
  } else {
    // Slightly tighter gate even without embedding, based on detection count
    return 1.0 - (1.0 - config.confidentTrackGateFactor) * confidenceFactor * 0.5
  }
}

// ============================================================================
// Combined Cost Configuration
// ============================================================================

/**
 * Full cost configuration combining all components
 */
export interface CostConfig extends AssociationCostConfig, MotionCostConfig, EmbeddingCostConfig, CrossingGateConfig, AdaptiveGateConfig {
  /** Use Kalman prediction for track position */
  useKalmanPrediction: boolean
}

/**
 * Default cost configuration values
 */
export const DEFAULT_COST_CONFIG: CostConfig = {
  // Association
  maxCost: 1.0,
  associationBonus: 0.1,
  sameCameraPenalty: 1.5,
  crossCameraBonus: 0.6,
  crossCameraBonusWindowMs: 2000,
  // Motion
  velocityConsistencyWeight: 0.15,
  directionConsistencyWeight: 0.2,
  minSpeedForDirection: 0.2,
  accelerationConsistencyWeight: 0.1,
  maxAccelerationMs2: 3.0,
  // Embedding
  embeddingWeight: 0.25,
  embeddingMinSimilarity: 0.65,
  embeddingMinQuality: 0.25,
  // Crossing Gate (appearance-gated association)
  crossingMinSimilarity: 0.70,  // Require higher similarity during crossings
  crossingMismatchPenalty: 3.0,  // Heavy penalty for poor matches during crossing
  crossingMinQuality: 0.35,  // Minimum quality to apply crossing gate
  // Adaptive Gate
  minConfidenceForTightGate: 5,  // Need 5+ detections for tight gating
  confidentTrackGateFactor: 0.7,  // Reduce gate to 70% for confident tracks
  adaptiveMinQuality: 0.4,  // Quality threshold for adaptive gating
  // Kalman
  useKalmanPrediction: true,
}
