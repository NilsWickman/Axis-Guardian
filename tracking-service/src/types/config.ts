/**
 * Configuration Types
 *
 * Tracking configuration parameters and defaults.
 */

import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Tracking configuration parameters
 */
export interface TrackingConfig {
  correlationDistanceM: number
  mergeWindowMs: number
  trackExpiryMs: number
  maxTrailLength: number
  minDetectionsToConfirm: number
  maxVelocityMs: number
  /** Expiry time for unconfirmed tracks (faster cleanup of ghost tracks) */
  unconfirmedTrackExpiryMs: number
  /** Minimum confidence required to create a new track */
  minCreationConfidence: number
  /** Exclusion radius - no new tracks within this distance of confirmed tracks */
  exclusionRadius: number
  /** Proximity threshold for detecting crossing events */
  crossingProximityThreshold: number
  /** Maximum coast time for occluded tracks before expiry */
  occlusionCoastTimeMs: number
  /** Gate expansion multiplier for re-identification */
  reidentificationGateMultiplier: number
  /** Number of consecutive missed frames before transitioning to occluded state */
  missedFramesBeforeOcclusion: number
  /** Number of consecutive detections required to exit occlusion state */
  detectionsToExitOcclusion: number
  /** Minimum time (ms) before a track can exit occlusion state (flicker protection) */
  minRecoveryTimeMs: number
  /** Max distance to cluster unmatched detections from different cameras */
  clusteringDistanceM: number
  /** Max distance between tracks to consider merging */
  mergeDistanceM: number
  /** Min confidence score (0-1) required to merge tracks */
  mergeConfidenceThreshold: number
  /** Exclusion radius for unconfirmed tracks (larger to prevent duplicates in overlap zone) */
  unconfirmedExclusionRadius: number
  /** Max distance between unconfirmed tracks to consider merging (tighter than confirmed) */
  unconfirmedMergeDistanceM: number
  /** Cost multiplier for cross-camera handoff (0-1, lower = more bonus) */
  crossCameraBonus: number
  /** Timeout for FOV boundary exits (ms) - tracks exiting camera view */
  fovExitTimeoutMs: number
  /** Timeout for room boundary exits (ms) - tracks leaving the monitored area */
  boundaryExitTimeoutMs: number
  /** Maximum pillar occlusion duration (ms) - ghost track timeout */
  maxPillarOcclusionMs: number
  /** Partial pillar occlusion duration (ms) - 50%+ cameras blocked but not all */
  partialPillarOcclusionMs: number
  /** Max distance for cross-camera unconfirmed track merges (expanded for projection variance) */
  crossCameraMergeDistanceM: number
  /** Exclusion radius for cross-camera duplicate prevention */
  crossCameraExclusionRadius: number
  /** Time window (ms) for cross-camera exclusion check */
  crossCameraExclusionTimeMs: number
  /** Minimum detections for reliable velocity estimate in merge scoring */
  minDetectionsForVelocityMerge: number
  /** Bonus for simultaneous detections from different cameras */
  simultaneousDetectionBonus: number
  /** Time window (ms) to consider detections simultaneous */
  simultaneousWindowMs: number
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  // Track lifecycle (from algorithm-constants.ts trackLifecycle)
  correlationDistanceM: ALGORITHM_CONSTANTS.trackLifecycle.correlationDistanceM,
  mergeWindowMs: ALGORITHM_CONSTANTS.trackLifecycle.mergeWindowMs,
  trackExpiryMs: ALGORITHM_CONSTANTS.trackLifecycle.trackExpiryMs,
  maxTrailLength: ALGORITHM_CONSTANTS.trackLifecycle.maxTrailLength,
  minDetectionsToConfirm: ALGORITHM_CONSTANTS.trackLifecycle.minDetectionsToConfirm,
  maxVelocityMs: ALGORITHM_CONSTANTS.trackLifecycle.maxVelocityMs,
  unconfirmedTrackExpiryMs: ALGORITHM_CONSTANTS.trackLifecycle.unconfirmedTrackExpiryMs,
  minCreationConfidence: ALGORITHM_CONSTANTS.trackLifecycle.minCreationConfidence,

  // Exclusion zones (from algorithm-constants.ts exclusionZone)
  exclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.confirmedExclusionRadius,
  unconfirmedExclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.unconfirmedExclusionRadius,
  crossCameraExclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.crossCameraExclusionRadius,
  crossCameraExclusionTimeMs: ALGORITHM_CONSTANTS.exclusionZone.crossCameraExclusionTimeMs,

  // Occlusion handling (from algorithm-constants.ts occlusion)
  occlusionCoastTimeMs: ALGORITHM_CONSTANTS.occlusion.occlusionCoastTimeMs,
  reidentificationGateMultiplier: ALGORITHM_CONSTANTS.occlusion.reidentificationGateMultiplier,
  missedFramesBeforeOcclusion: ALGORITHM_CONSTANTS.occlusion.missedFramesBeforeOcclusion,
  detectionsToExitOcclusion: ALGORITHM_CONSTANTS.occlusion.detectionsToExitOcclusion,
  minRecoveryTimeMs: ALGORITHM_CONSTANTS.occlusion.minRecoveryTimeMs,
  fovExitTimeoutMs: ALGORITHM_CONSTANTS.occlusion.fovExitTimeoutMs,
  boundaryExitTimeoutMs: ALGORITHM_CONSTANTS.occlusion.boundaryExitTimeoutMs,
  maxPillarOcclusionMs: ALGORITHM_CONSTANTS.occlusion.maxPillarOcclusionMs,
  partialPillarOcclusionMs: ALGORITHM_CONSTANTS.occlusion.partialPillarOcclusionMs,

  // Clustering (from algorithm-constants.ts clustering)
  clusteringDistanceM: ALGORITHM_CONSTANTS.clustering.clusteringDistanceM,

  // Track merging (from algorithm-constants.ts trackMerger)
  mergeDistanceM: 0.8, // TrackingConfig uses different value than TrackMerger internal
  mergeConfidenceThreshold: 0.6, // TrackingConfig uses different value than TrackMerger internal
  unconfirmedMergeDistanceM: ALGORITHM_CONSTANTS.trackMerger.unconfirmedMergeDistanceM,
  crossCameraMergeDistanceM: 1.0, // TrackingConfig uses expanded value
  minDetectionsForVelocityMerge: ALGORITHM_CONSTANTS.trackMerger.minDetectionsForVelocity,
  simultaneousDetectionBonus: 0.08, // TrackingConfig uses reduced value
  simultaneousWindowMs: ALGORITHM_CONSTANTS.trackMerger.simultaneousWindowMs,

  // Cross-camera (from algorithm-constants.ts assignment)
  crossingProximityThreshold: ALGORITHM_CONSTANTS.assignment.crossingProximityThreshold,
  crossCameraBonus: 0.7, // TrackingConfig uses different value
}
