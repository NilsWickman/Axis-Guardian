/**
 * Centralized Algorithm Tuning Constants
 *
 * This file is the single source of truth for all algorithm tuning parameters
 * in the tracking service. Module-specific configs should derive from these values.
 *
 * Organization:
 * - Each domain has its own interface and section in ALGORITHM_CONSTANTS
 * - Values are readonly to prevent accidental mutation
 * - Runtime-configurable values flow through TrackingConfig (types.ts)
 */

// =============================================================================
// Detection Pipeline Constants
// =============================================================================

export interface DetectionConstants {
  /** Minimum confidence required to process a detection (0-1) */
  readonly minConfidence: number
  /** Default image width in pixels */
  readonly imageWidth: number
  /** Default image height in pixels */
  readonly imageHeight: number
  /** Frame jump threshold to detect camera restart */
  readonly frameJumpBackwardThreshold: number
  /** Maximum cameras to track before cleanup */
  readonly maxCameras: number
  /** Cleanup interval in milliseconds */
  readonly cleanupIntervalMs: number
  /** Same-camera deduplication distance (meters) - removes duplicate detections from same frame */
  readonly sameCameraDeduplicationDistanceM: number
}

// =============================================================================
// Hungarian Assignment Constants
// =============================================================================

export interface AssignmentConstants {
  /** Maximum cost for valid assignment (meters) */
  readonly maxCost: number
  /** Bonus multiplier for existing camera-track associations (0-1, lower = stronger binding) */
  readonly associationBonus: number
  /** Penalty multiplier when track already has different trackId from same camera */
  readonly sameCameraPenalty: number
  /** Weight for velocity consistency cost component */
  readonly velocityConsistencyWeight: number
  /** Proximity threshold for detecting crossing tracks (meters) */
  readonly crossingProximityThreshold: number
  /** Cost multiplier for crossing tracks (tighter matching) */
  readonly crossingMaxCostMultiplier: number
  /** Weight for direction-of-travel consistency (0-1) */
  readonly directionConsistencyWeight: number
  /** Minimum speed (m/s) to consider direction constraint */
  readonly minSpeedForDirection: number
  /** Cost multiplier for cross-camera handoff (0-1, lower = more bonus) */
  readonly crossCameraBonus: number
  /** Time window for cross-camera bonus (ms) */
  readonly crossCameraBonusWindowMs: number
  /** Maximum plausible acceleration (m/s²) before penalty */
  readonly maxAccelerationMs2: number
  /** Weight for acceleration consistency cost component */
  readonly accelerationConsistencyWeight: number
  /** Weight for embedding similarity in cost (0-1) */
  readonly embeddingWeight: number
  /** Minimum embedding similarity to apply bonus (0-1) */
  readonly embeddingMinSimilarity: number
  /** Minimum embedding quality to use in matching (0-1) */
  readonly embeddingMinQuality: number
  /** Prediction time steps for trajectory intersection (ms) */
  readonly trajectoryPredictionSteps: readonly number[]
  /** Prediction window for trajectory intersection (ms) */
  readonly trajectoryPredictionWindowMs: number
  /** Intersection threshold for trajectory crossing (meters) */
  readonly intersectionThresholdM: number
}

// =============================================================================
// Track Lifecycle Constants
// =============================================================================

export interface TrackLifecycleConstants {
  /** Maximum distance for spatial correlation (meters) */
  readonly correlationDistanceM: number
  /** Time window for merging detections (ms) */
  readonly mergeWindowMs: number
  /** Time before track expires without detections (ms) */
  readonly trackExpiryMs: number
  /** Maximum trail positions to keep */
  readonly maxTrailLength: number
  /** Detections required to confirm track */
  readonly minDetectionsToConfirm: number
  /** Maximum human velocity (m/s) */
  readonly maxVelocityMs: number
  /** Expiry time for unconfirmed tracks (ms) */
  readonly unconfirmedTrackExpiryMs: number
  /** Minimum confidence to create new track (0-1) */
  readonly minCreationConfidence: number
  /** Maximum tracks before emergency cleanup */
  readonly maxTracks: number
  /** Minimum movement to add trail point (meters) */
  readonly minTrailMovementThreshold: number
}

// =============================================================================
// Exclusion Zone Constants
// =============================================================================

export interface ExclusionZoneConstants {
  /** Exclusion radius for confirmed tracks (meters) */
  readonly confirmedExclusionRadius: number
  /** Exclusion radius for unconfirmed tracks (meters) */
  readonly unconfirmedExclusionRadius: number
  /** Exclusion radius for cross-camera detections (meters) */
  readonly crossCameraExclusionRadius: number
  /** Time window for cross-camera exclusion (ms) */
  readonly crossCameraExclusionTimeMs: number
}

// =============================================================================
// Track Merging Constants
// =============================================================================

export interface TrackMergerConstants {
  /** Max distance between tracks to consider merging (meters) */
  readonly mergeDistanceM: number
  /** Min confidence score (0-1) required to merge tracks */
  readonly mergeConfidenceThreshold: number
  /** Max velocity difference (m/s) to allow merge */
  readonly mergeVelocityThreshold: number
  /** Max distance for unconfirmed track merges (meters) */
  readonly unconfirmedMergeDistanceM: number
  /** Min confidence for unconfirmed track merges */
  readonly unconfirmedMergeConfidenceThreshold: number
  /** Max distance for cross-camera unconfirmed merges (meters) */
  readonly crossCameraMergeDistanceM: number
  /** Min detections for reliable velocity estimate */
  readonly minDetectionsForVelocity: number
  /** Bonus for simultaneous detections from different cameras */
  readonly simultaneousDetectionBonus: number
  /** Time window for simultaneous detection (ms) */
  readonly simultaneousWindowMs: number
  /** Speed below which tracks are "slow" (m/s) */
  readonly slowSpeedThreshold: number
  /** Speed above which tracks are "fast" (m/s) */
  readonly fastSpeedThreshold: number
  /** Distance multiplier for slow-moving tracks */
  readonly slowSpeedDistanceMultiplier: number
  /** Distance multiplier for fast-moving tracks */
  readonly fastSpeedDistanceMultiplier: number
  /** Confidence threshold reduction for slow tracks */
  readonly slowSpeedThresholdReduction: number
}

// =============================================================================
// Occlusion Handling Constants
// =============================================================================

export interface OcclusionConstants {
  /** Frames to miss before transitioning to occluded */
  readonly missedFramesBeforeOcclusion: number
  /** Time to coast occluded tracks (ms) */
  readonly occlusionCoastTimeMs: number
  /** Detections required to exit occlusion state */
  readonly detectionsToExitOcclusion: number
  /** Gate expansion multiplier for re-identification */
  readonly reidentificationGateMultiplier: number
  /** Timeout for FOV boundary exits (ms) */
  readonly fovExitTimeoutMs: number
  /** Timeout for room boundary exits (ms) */
  readonly boundaryExitTimeoutMs: number
  /** Maximum pillar occlusion duration (ms) */
  readonly maxPillarOcclusionMs: number
  /** Timeout for partial pillar occlusion (50%+ cameras blocked, ms) */
  readonly partialPillarOcclusionMs: number
  /** Minimum time before exiting occlusion state (flicker protection, ms) */
  readonly minRecoveryTimeMs: number
  /** Max coast time for non-pillar occlusions (ms) */
  readonly maxNonPillarCoastMs: number
  /** Velocity damping factor during coasting (0-1) */
  readonly coastingDampingFactor: number
  /** Maximum trail length for occlusion predictions */
  readonly maxOcclusionTrailLength: number
  /** Quality retention bonus factor - multiplier for quality-based timeout extension */
  readonly qualityRetentionBonus: number
  /** Maximum retention multiplier (cap) */
  readonly maxRetentionMultiplier: number
  /** Minimum embedding quality to apply retention bonus */
  readonly minQualityForRetention: number
}

// =============================================================================
// Local Track Stitching Constants
// =============================================================================

export interface StitchingConstants {
  /** Maximum gap for stitching (ms) */
  readonly maxGapMs: number
  /** Distance multiplier for stitching */
  readonly maxDistanceMultiplier: number
  /** Maximum ended tracks to keep per camera */
  readonly maxEntriesPerCamera: number
}

// =============================================================================
// Re-ID Constants
// =============================================================================

export interface ReIDConstants {
  /** Minimum cosine similarity to consider a match (0-1) */
  readonly minSimilarity: number
  /** Bonus multiplier for same-camera re-ID */
  readonly sameCameraBonus: number
  /** Maximum age for track re-ID (ms) - legacy, use adaptive window instead */
  readonly maxTrackAgeMs: number
  /** Minimum embedding quality for matching (0-1) */
  readonly minEmbeddingQuality: number
  /** High similarity threshold for merge override */
  readonly highSimilarityThreshold: number
  /** Distance override for high similarity (meters) */
  readonly highSimilarityDistanceOverride: number
  /** Base re-ID window (ms) - applied when embedding quality is 0 */
  readonly baseReidAgeMs: number
  /** Quality boost factor - multiplier for embedding quality contribution */
  readonly qualityBoostFactor: number
  /** Maximum re-ID window (ms) - cap to prevent unbounded extension */
  readonly adaptiveMaxReidAgeMs: number
}

// =============================================================================
// Kalman Filter Constants
// =============================================================================

export interface KalmanFilterConstants {
  /** Process noise - velocity variance (m/s)² */
  readonly processNoise: number
  /** Measurement noise - position variance (m²) */
  readonly measurementNoise: number
  /** Initial position uncertainty (m²) */
  readonly initialPositionUncertainty: number
  /** Initial velocity uncertainty (m/s)² */
  readonly initialVelocityUncertainty: number
  /** Maximum cache size for Kalman states */
  readonly maxCacheSize: number
}

// =============================================================================
// Clustering Constants
// =============================================================================

export interface ClusteringConstants {
  /** Max distance to cluster detections from different cameras (meters) */
  readonly clusteringDistanceM: number
}

// =============================================================================
// Position Merging Constants (Multi-camera fusion)
// =============================================================================

export interface PositionMergingConstants {
  /** Divergence threshold for camera selection (meters) */
  readonly divergenceThreshold: number
  /** Epsilon for inverse-distance weighting (prevents extreme weights at close range) */
  readonly distanceWeightEpsilon: number
}

// =============================================================================
// Attribute Aggregation Constants
// =============================================================================

export interface AttributeAggregationConstants {
  /** Maximum dominant colors to keep */
  readonly maxDominantColors: number
  /** Minimum color score threshold */
  readonly minColorScore: number
  /** Minimum samples for reliable embedding */
  readonly minEmbeddingSamples: number
}

// =============================================================================
// Velocity Validation Constants
// =============================================================================

export interface VelocityConstants {
  /** Impossible velocity threshold (m/s) - for rejection */
  readonly impossibleVelocityMs: number
  /** Mahalanobis distance threshold for cross-camera */
  readonly mahalanobisThreshold: number
  /** Relaxed Mahalanobis threshold for same-camera re-ID */
  readonly sameCameraMahalanobisThreshold: number
  /** Minimum time delta for velocity check (ms) */
  readonly minTimeDeltaMs: number
  /** Time window for same-camera re-ID (ms) */
  readonly sameCameraReIDWindowMs: number
}

// =============================================================================
// Multi-Camera Synchronization Constants
// =============================================================================

export interface SyncConstants {
  /** Maximum time to wait for all cameras to report (ms) */
  readonly syncWindowMs: number
  /** Minimum cameras required before considering a batch complete */
  readonly minCamerasForSync: number
  /** Maximum detections to buffer before forcing flush */
  readonly maxBufferedDetections: number
  /** Frame bucket size in ms (groups frames within this window) */
  readonly frameBucketMs: number
  /** Enable frame-number based correlation (for emulators with same video) */
  readonly useFrameNumberCorrelation: boolean
  /** Enable sync buffer (false = process immediately as before) */
  readonly enabled: boolean
  /** Stale frame threshold multiplier (frames older than syncWindowMs * this are dropped) */
  readonly staleFrameMultiplier: number
}

// =============================================================================
// Trajectory Prediction Constants (for curve-aware coasting)
// =============================================================================

export interface TrajectoryConstants {
  /** Minimum trail points needed for curve detection */
  readonly minTrailPointsForCurve: number
  /** Maximum trail age for curve fitting (ms) */
  readonly maxTrailAgeForCurveMs: number
  /** Minimum curvature (1/meters) to use curve extrapolation - below this use linear */
  readonly minCurvatureThreshold: number
  /** Weight blend between linear and curve prediction (0=all linear, 1=all curve) */
  readonly curveBlendWeight: number
  /** Maximum extrapolation time for curve (ms) - falls back to linear beyond this */
  readonly maxCurveExtrapolationMs: number
}

// =============================================================================
// Predictive Handoff Constants
// =============================================================================

export interface HandoffConstants {
  /** Distance from FOV boundary to trigger predictive handoff (meters) */
  readonly handoffZoneDistanceM: number
  /** Velocity component toward boundary needed for predictive mode (m/s) */
  readonly minVelocityTowardBoundary: number
  /** Time-to-boundary threshold for predictive handoff (ms) */
  readonly timeToBoundaryThresholdMs: number
  /** Cost reduction for tracks in predictive handoff zone (0-1, lower = more bonus) */
  readonly predictiveHandoffBonus: number
  /** Gate expansion for tracks in predictive handoff zone */
  readonly predictiveGateExpansion: number
}

// =============================================================================
// Combined Algorithm Constants Interface
// =============================================================================

export interface AlgorithmConstants {
  readonly detection: DetectionConstants
  readonly assignment: AssignmentConstants
  readonly trackLifecycle: TrackLifecycleConstants
  readonly exclusionZone: ExclusionZoneConstants
  readonly trackMerger: TrackMergerConstants
  readonly occlusion: OcclusionConstants
  readonly stitching: StitchingConstants
  readonly reid: ReIDConstants
  readonly kalman: KalmanFilterConstants
  readonly clustering: ClusteringConstants
  readonly positionMerging: PositionMergingConstants
  readonly attributeAggregation: AttributeAggregationConstants
  readonly velocity: VelocityConstants
  readonly sync: SyncConstants
  readonly trajectory: TrajectoryConstants
  readonly handoff: HandoffConstants
}

// =============================================================================
// Default Values
// =============================================================================

export const ALGORITHM_CONSTANTS: AlgorithmConstants = {
  detection: {
    minConfidence: 0.7,
    imageWidth: 1920,
    imageHeight: 1080,
    frameJumpBackwardThreshold: 10,
    maxCameras: 100,
    cleanupIntervalMs: 60000,
    sameCameraDeduplicationDistanceM: 0.3,  // Remove duplicate detections within 30cm on same camera
  },

  assignment: {
    maxCost: 1.2,  // Slightly relaxed for better track continuity
    associationBonus: 0.05,  // Even stronger binding for existing associations
    sameCameraPenalty: 1.8,  // Increased - stronger penalty against same-camera double assignments
    velocityConsistencyWeight: 0.2,  // Increased for better motion consistency
    crossingProximityThreshold: 1.5,
    crossingMaxCostMultiplier: 0.35,  // Tighter for crossings
    directionConsistencyWeight: 0.25,  // Increased for better direction matching
    minSpeedForDirection: 0.15,  // Lowered - consider direction at lower speeds
    crossCameraBonus: 0.5,  // Stronger bonus for cross-camera handoffs
    crossCameraBonusWindowMs: 2500,  // Extended window
    maxAccelerationMs2: 3.5,  // Slightly relaxed
    accelerationConsistencyWeight: 0.1,
    embeddingWeight: 0.55,  // Increased from 0.45 - stronger appearance matching to reduce ID swaps
    embeddingMinSimilarity: 0.60,  // Lowered from 0.65 for more embedding matches
    embeddingMinQuality: 0.01,  // Lowered to 0.01 to use embeddings from preprocessor (quality bug outputs 0.02)
    trajectoryPredictionSteps: [200, 500, 800, 1000],
    trajectoryPredictionWindowMs: 1000,
    intersectionThresholdM: 0.8,
  },

  trackLifecycle: {
    correlationDistanceM: 1.0,  // Standard correlation distance
    mergeWindowMs: 200,
    trackExpiryMs: 5000,  // Balanced expiry
    maxTrailLength: 20,
    minDetectionsToConfirm: 3,  // Standard track confirmation
    maxVelocityMs: 8,
    unconfirmedTrackExpiryMs: 2000,  // Standard expiry
    minCreationConfidence: 0.7,  // Lower confidence - allow more track creation
    maxTracks: 200,
    minTrailMovementThreshold: 0.1,
  },

  exclusionZone: {
    confirmedExclusionRadius: 0.5,  // Small - only prevent very close duplicates
    unconfirmedExclusionRadius: 0.6,  // Small - allow more separate tracks
    crossCameraExclusionRadius: 0.5,  // Small for cross-camera
    crossCameraExclusionTimeMs: 200,  // Short time window
  },

  trackMerger: {
    mergeDistanceM: 0.4,  // Very small - only merge nearly identical tracks
    mergeConfidenceThreshold: 0.7,  // High - require high confidence to merge
    mergeVelocityThreshold: 1.0,  // Strict velocity matching
    unconfirmedMergeDistanceM: 0.3,  // Very small - tight merge for unconfirmed
    unconfirmedMergeConfidenceThreshold: 0.6,  // High confidence
    crossCameraMergeDistanceM: 0.4,  // Very small for cross-camera
    minDetectionsForVelocity: 3,
    simultaneousDetectionBonus: 0.05,  // Small bonus
    simultaneousWindowMs: 100,  // Tight window
    slowSpeedThreshold: 0.3,
    fastSpeedThreshold: 1.0,
    slowSpeedDistanceMultiplier: 1.0,  // No multiplier
    fastSpeedDistanceMultiplier: 0.8,
    slowSpeedThresholdReduction: 0.05,  // Small reduction
  },

  occlusion: {
    missedFramesBeforeOcclusion: 10,  // Standard occlusion transition
    occlusionCoastTimeMs: 5000,  // Moderate coasting time
    detectionsToExitOcclusion: 2,  // Keep hysteresis (flicker protection)
    reidentificationGateMultiplier: 4.5,  // Moderate gate for re-ID
    fovExitTimeoutMs: 1500,  // Standard timeout
    boundaryExitTimeoutMs: 1000,  // Standard timeout
    maxPillarOcclusionMs: 2500,  // Standard pillar occlusion
    maxNonPillarCoastMs: 1500,  // Standard non-pillar coast
    coastingDampingFactor: 0.80,  // 20% velocity reduction per update
    maxOcclusionTrailLength: 50,
    minRecoveryTimeMs: 300,  // Minimum time before exiting occlusion (flicker protection)
    partialPillarOcclusionMs: 2500,  // Standard partial pillar occlusion
    // Quality-adaptive retention: timeout *= (1 + bonus * normalizedQuality)
    qualityRetentionBonus: 0.5,  // quality=1.0 gives 1.5x timeout
    maxRetentionMultiplier: 1.8,  // Cap to prevent excessive coasting
    minQualityForRetention: 0.01,  // Lowered to 0.01 to work with preprocessor quality bug (outputs 0.02)
  },

  stitching: {
    maxGapMs: 5000,  // Increased - allow stitching over longer gaps
    maxDistanceMultiplier: 3.0,  // Increased - allow stitching over larger distances
    maxEntriesPerCamera: 100,  // Increased - remember more ended tracks
  },

  reid: {
    minSimilarity: 0.70,  // Lowered from 0.75 for more matches
    sameCameraBonus: 1.2,  // Increased for stronger same-camera binding
    maxTrackAgeMs: 6000,  // Legacy - use adaptive window instead
    minEmbeddingQuality: 0.01,  // Lowered to 0.01 for more embeddings (preprocessor outputs 0.02)
    highSimilarityThreshold: 0.75,  // Lowered for more high-similarity overrides
    highSimilarityDistanceOverride: 2.5,  // Increased distance override for high similarity matches
    // Quality-adaptive re-ID window: timeout = baseAge * (1 + boostFactor * quality)
    baseReidAgeMs: 4000,  // Reduced base window
    qualityBoostFactor: 1.5,  // quality=1.0 gives 1.5x boost
    adaptiveMaxReidAgeMs: 8000,  // Reduced cap to prevent stale matches
  },

  kalman: {
    processNoise: 0.7,  // Reduced - smoother position estimates, less responsive to rapid changes
    measurementNoise: 0.3,  // Slightly increased - more smoothing for noisy measurements
    initialPositionUncertainty: 1,
    initialVelocityUncertainty: 1,
    maxCacheSize: 500,
  },

  clustering: {
    clusteringDistanceM: 0.9,  // Increased - account for projection error between cameras (~0.4m average)
  },

  positionMerging: {
    divergenceThreshold: 0.8,
    distanceWeightEpsilon: 1.0,  // At 1m distance, weight = 0.5; at 2m, weight = 0.2
  },

  attributeAggregation: {
    maxDominantColors: 3,
    minColorScore: 0.1,
    minEmbeddingSamples: 2,
  },

  velocity: {
    impossibleVelocityMs: 50,
    mahalanobisThreshold: 5.5,  // Relaxed from 4.0 - less strict gating for occluded track recovery
    sameCameraMahalanobisThreshold: 7.0,  // Relaxed from 6.0 - better same-camera re-ID
    minTimeDeltaMs: 50,
    sameCameraReIDWindowMs: 500,
  },

  sync: {
    syncWindowMs: 66,               // Tightened from 100ms (2 frames at 30fps)
    minCamerasForSync: 1,           // Minimum cameras before partial flush
    maxBufferedDetections: 500,     // Emergency flush if buffer gets too large
    frameBucketMs: 33,              // ~30fps frame buckets
    useFrameNumberCorrelation: true, // Use frame numbers for emulator sync
    enabled: true,                  // Enable sync buffer by default
    staleFrameMultiplier: 2,        // Drop frames older than 2x sync window
  },

  // Trajectory curve estimation for coasting - uses geometry, not tuned params
  trajectory: {
    minTrailPointsForCurve: 5,  // Need 5+ points to fit a circle
    maxTrailAgeForCurveMs: 2000,  // Only use recent 2s of trail
    minCurvatureThreshold: 0.1,  // 10m radius minimum - below this use linear
    curveBlendWeight: 0.4,  // 40% curve, 60% linear - more conservative to reduce erratic predictions
    maxCurveExtrapolationMs: 1500,  // Don't trust curve beyond 1.5s
  },

  // Predictive handoff zones - uses velocity toward boundary
  handoff: {
    handoffZoneDistanceM: 1.5,  // Within 1.5m of FOV edge
    minVelocityTowardBoundary: 0.3,  // Must be moving > 0.3 m/s toward edge
    timeToBoundaryThresholdMs: 2000,  // Expected to exit within 2s
    predictiveHandoffBonus: 0.7,  // 30% cost reduction for handoff candidates
    predictiveGateExpansion: 1.3,  // 30% wider spatial gate
  },
} as const
