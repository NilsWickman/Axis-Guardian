/**
 * Evaluation Module
 *
 * Provides ground truth evaluation capabilities for calibration and tracking accuracy.
 */

// Ground truth loading and validation
export {
  loadGroundTruth,
  loadAndValidateGroundTruth,
  validateGroundTruth,
  indexGroundTruth,
  getAnnotationsAtKeyframe,
  getCameraAnnotations,
  getCameraAnnotationsAtTime,
  getCameraAnnotationsWithWorldPosition,
  getAnnotationsWithWorldPosition,
  getPersonAnnotations,
  getPersonLabel,
  printGroundTruthSummary,
  type ValidationResult,
} from './ground-truth-loader.js'

// Reprojection error calculation
export {
  computeReprojectionError,
  computeCameraReprojectionStats,
  computeCameraReprojectionSamples,
  analyzeErrorBias,
  computeErrorPercentiles,
  formatReprojectionStats,
  printSampleErrors,
} from './reprojection-error.js'

// Track-to-GT matching
export {
  TrackMatcherState,
  matchTracksToGT,
  findClosestTrack,
  printMatchSummary,
  type IDSwitchRecord,
  type MatchConfig,
} from './track-matcher.js'

// MOT metrics computation
export {
  computeMOTMetrics,
  computeMOTMetricsWithState,
  computeExtendedMOTMetrics,
  computePersonStats,
  compileEvaluationResult,
  formatMOTMetrics,
  formatPersonStats,
  printEvaluationSummary,
  getSummaryLine,
} from './mot-metrics.js'
