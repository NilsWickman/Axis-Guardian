/**
 * Filters Module
 *
 * Provides Kalman filtering and state management for tracks.
 */

// Kalman filter core
export {
  KalmanTrackFilter,
  DEFAULT_KALMAN_CONFIG,
  type KalmanFilterConfig,
  // Curve estimation for trajectory-aware coasting
  estimateTrailCurvature,
  predictAlongCurve,
  blendPredictions,
  type CurvatureEstimate,
  getDefaultKalmanFilter,
} from './kalman-track-filter.js'

// Kalman state manager (encapsulates state operations)
export {
  KalmanStateManager,
  type ClampResult,
} from './kalman-state-manager.js'
