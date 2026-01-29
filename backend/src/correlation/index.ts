/**
 * Correlation Module - Detection-to-track assignment
 *
 * This module provides algorithms for matching detections to existing tracks:
 * - Assignment strategy interface for algorithm abstraction
 * - Hungarian (Munkres) algorithm for optimal assignment
 * - Cost calculation components (association, motion, embedding)
 * - Track matching utilities
 * - Re-ID matching
 */

// Assignment strategy abstraction (canonical source for types)
export type {
  IAssignmentStrategy,
  AssignmentMatch,
  AssignmentResult,
  AssignmentConfig,
  HandoffGeometry,
} from './assignment-strategy.js'
export {
  DEFAULT_ASSIGNMENT_CONFIG,
} from './assignment-strategy.js'

// Strategy implementations
export { HungarianStrategy } from './hungarian-strategy.js'

// Hungarian assignment (implementation details)
export {
  buildCostMatrix,
  assignDetectionsToTracks,
  detectCrossingTracks,
  predictTrajectoryIntersections,
  identifyPredictiveHandoffTracks,
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
