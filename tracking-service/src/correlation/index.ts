/**
 * Correlation Module - Detection-to-track assignment
 *
 * This module provides algorithms for matching detections to existing tracks:
 * - Hungarian (Munkres) algorithm for optimal assignment
 * - Cost calculation components (association, motion, embedding)
 * - Track matching utilities
 * - Re-ID matching
 */

// Hungarian assignment
export {
  type AssignmentResult,
  type AssignmentConfig,
  buildCostMatrix,
  assignDetectionsToTracks,
  detectCrossingTracks,
  predictTrajectoryIntersections,
} from './hungarian-assignment.js'

// Cost calculation components
export {
  type AssociationCostConfig,
  type MotionCostConfig,
  type EmbeddingCostConfig,
  type EmbeddingCostResult,
  type CostConfig,
  DEFAULT_COST_CONFIG,
  calculateAssociationMultiplier,
  calculateMotionConsistencyCost,
  calculateEmbeddingSimilarityMultiplier,
} from './cost-components.js'

// Track matching utilities
export {
  calculateDistance,
  calculateDistanceSquared,
  findBestMatch,
  mergeWorldPositions,
  calculateCorrelationScore,
  predictPosition,
} from './track-matcher.js'

// Re-ID matching
export { ReIDMatcher } from './reid-matcher.js'
