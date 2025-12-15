/**
 * Optimization Module - Multi-frame batch optimization
 *
 * This module provides algorithms for optimizing detection-to-track assignment
 * across multiple frames simultaneously:
 * - BatchOptimizer - Main class for buffering and batch optimization
 * - Temporal assignment with block coordinate descent
 * - RTS Kalman smoother for trajectory refinement
 */

// Batch optimizer (main entry point)
export {
  BatchOptimizer,
  type BatchOptimizerConfig,
  type BatchWindow,
  type FrameBatch,
  type OptimizationResult,
  type FrameAssignment,
  type BatchMetrics,
} from './batch-optimizer.js'

// Temporal assignment algorithm
export {
  buildTemporalCostMatrix,
  solveBlockCoordinateDescent,
  evaluateTotalCost,
  type TemporalAssignment,
} from './temporal-assignment.js'

// RTS Kalman smoother
export {
  runRTSSmootherBackward,
  smoothTrajectories,
  computeSmootherGain,
} from './rts-smoother.js'
