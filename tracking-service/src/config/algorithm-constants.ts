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
// Batch Optimization Constants (Multi-frame global assignment)
// =============================================================================

export interface BatchOptimizationConstants {
  /** Enable batch optimization mode (false = frame-by-frame) */
  readonly enabled: boolean
  /** Maximum frames to keep in rolling buffer (context window) */
  readonly maxBufferSize: number
  /** Minimum frames needed before starting emission (delay in frames) */
  readonly emissionDelayFrames: number
  /** Frames to optimize at once (optimization window) */
  readonly optimizationWindowSize: number
  /** Maximum time to wait before forcing optimization (ms) */
  readonly maxBatchDelayMs: number
  /** Penalty for ID switch within batch (meters equivalent) */
  readonly idSwitchPenalty: number
  /** Weight for trajectory smoothness penalty (0-1) */
  readonly smoothnessWeight: number
  /** Cost multiplier bonus for temporal continuity (0-1, lower = stronger bonus) */
  readonly temporalContinuityBonus: number
  /** Cost for creating new track (meters equivalent) */
  readonly trackBirthCost: number
  /** Cost per frame for unmatched track (meters equivalent) */
  readonly trackDeathCost: number
  /** Maximum iterations for block coordinate descent */
  readonly maxIterations: number
  /** Convergence threshold for optimization (meters) */
  readonly convergenceThreshold: number
  /** Enable streaming emission (vs batch emission) */
  readonly streamingEmission: boolean
  /** Frames to emit per tick when streaming */
  readonly emissionBatchSize: number
  /** @deprecated Use maxBufferSize instead */
  readonly batchSize: number
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
  readonly batch: BatchOptimizationConstants
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
    velocityConsistencyWeight: 0.25,  // Increased from 0.2 - penalize impossible velocities (helps VCI)
    crossingProximityThreshold: 1.5,
    crossingMaxCostMultiplier: 0.35,  // Tighter for crossings
    directionConsistencyWeight: 0.25,  // Increased for better direction matching
    minSpeedForDirection: 0.15,  // Lowered - consider direction at lower speeds
    crossCameraBonus: 0.35,  // Increased bonus (lower = stronger) for cross-camera handoffs
    crossCameraBonusWindowMs: 4000,  // Extended window from 2500ms for cross-camera association
    maxAccelerationMs2: 3.5,  // Slightly relaxed
    accelerationConsistencyWeight: 0.1,
    embeddingWeight: 0.50,  // Reduced from 0.70 - balance spatial vs appearance to reduce jitter
    embeddingMinSimilarity: 0.55,  // Raised from 0.50 - reduce noise from poor matches
    embeddingMinQuality: 0.15,  // Raised from 0.01 to 0.15 - filter garbage embeddings (helps VCI)
    trajectoryPredictionSteps: [200, 500, 800, 1000],
    trajectoryPredictionWindowMs: 1000,
    intersectionThresholdM: 0.8,
  },

  trackLifecycle: {
    correlationDistanceM: 1.0,  // Standard correlation distance
    mergeWindowMs: 200,
    trackExpiryMs: 8000,  // Increased from 5000ms - longer timeout to reduce ID fragmentation
    maxTrailLength: 20,
    minDetectionsToConfirm: 3,  // Standard track confirmation
    maxVelocityMs: 8,
    unconfirmedTrackExpiryMs: 3000,  // Increased from 2000ms - give unconfirmed tracks more time
    minCreationConfidence: 0.7,  // Lower confidence - allow more track creation
    maxTracks: 200,
    minTrailMovementThreshold: 0.2,  // Increased from 0.1 - reduce trail jitter from small movements
  },

  exclusionZone: {
    confirmedExclusionRadius: 0.5,  // Small - only prevent very close duplicates
    unconfirmedExclusionRadius: 0.8,  // Increased from 0.6 to account for projection error between cameras
    crossCameraExclusionRadius: 0.5,  // Small for cross-camera
    crossCameraExclusionTimeMs: 400,  // Doubled from 200ms to catch async camera delivery
  },

  trackMerger: {
    mergeDistanceM: 0.6,  // Extended from 0.4m - allow projection variance (~0.4m typical error)
    mergeConfidenceThreshold: 0.65,  // Lowered from 0.7 - more permissive merging
    mergeVelocityThreshold: 1.5,  // Relaxed from 1.0m/s - less strict velocity matching
    unconfirmedMergeDistanceM: 0.5,  // Extended from 0.3m - more forgiving for unconfirmed
    unconfirmedMergeConfidenceThreshold: 0.55,  // Lowered from 0.6 - more permissive
    crossCameraMergeDistanceM: 0.7,  // Extended from 0.4m - account for projection error
    minDetectionsForVelocity: 3,
    simultaneousDetectionBonus: 0.1,  // Increased from 0.05 - stronger same-time bonus
    simultaneousWindowMs: 150,  // Extended from 100ms - wider simultaneous window
    slowSpeedThreshold: 0.3,
    fastSpeedThreshold: 1.0,
    slowSpeedDistanceMultiplier: 1.2,  // Increased from 1.0 - expand radius for slow tracks
    fastSpeedDistanceMultiplier: 0.8,
    slowSpeedThresholdReduction: 0.05,  // Small reduction
  },

  occlusion: {
    missedFramesBeforeOcclusion: 10,  // Standard occlusion transition
    occlusionCoastTimeMs: 3000,  // Reduced from 8000ms - faster ghost track cleanup
    detectionsToExitOcclusion: 2,  // Keep hysteresis (flicker protection)
    reidentificationGateMultiplier: 5.5,  // Increased from 4.5 - wider gate for re-ID after occlusion
    fovExitTimeoutMs: 3000,  // Allow cross-camera handoff gaps before expiring FOV-exit tracks
    boundaryExitTimeoutMs: 1000,  // Reduced from 2000ms - faster boundary exit cleanup
    // Pillar occlusions can involve multi-second detection gaps (camera sync jitter + brief dropout).
    // Keep this conservative to prevent track fragmentation at the start of videos.
    maxPillarOcclusionMs: 6000,
    maxNonPillarCoastMs: 2000,  // Reduced from 4000ms - shorter non-pillar coast
    coastingDampingFactor: 0.5,  // Reduced from 0.88 - much faster velocity decay during coast
    maxOcclusionTrailLength: 50,
    minRecoveryTimeMs: 300,  // Minimum time before exiting occlusion (flicker protection)
    // Partial pillar occlusions flicker; allow enough time to recover without respawning.
    partialPillarOcclusionMs: 4000,
    // Quality-adaptive retention: timeout *= (1 + bonus * normalizedQuality)
    qualityRetentionBonus: 0.3,  // Reduced from 0.8 - less timeout extension for quality
    maxRetentionMultiplier: 1.5,  // Reduced from 2.5 - cap timeout extension
    minQualityForRetention: 0.01,  // Lowered to 0.01 to work with preprocessor quality bug (outputs 0.02)
  },

  stitching: {
    maxGapMs: 15000,  // Extended from 10s to 15s - allow stitching over longer gaps for occlusion recovery
    maxDistanceMultiplier: 5.0,  // Extended from 4.0 to 5.0 - allow larger distance stitching
    maxEntriesPerCamera: 200,  // Increased from 150 - remember more ended tracks for stitching
  },

  reid: {
    minSimilarity: 0.55,  // Lowered from 0.70 - more permissive matching to reduce ID fragmentation
    sameCameraBonus: 1.4,  // Increased from 1.2 - stronger same-camera binding
    maxTrackAgeMs: 10000,  // Increased from 6000ms - legacy, use adaptive window instead
    minEmbeddingQuality: 0.01,  // Lowered to 0.01 for more embeddings (preprocessor outputs 0.02)
    highSimilarityThreshold: 0.65,  // Lowered from 0.75 - more high-similarity overrides
    highSimilarityDistanceOverride: 4.0,  // Increased from 2.5m - larger distance override for high similarity
    // Quality-adaptive re-ID window: timeout = baseAge * (1 + boostFactor * quality)
    baseReidAgeMs: 8000,  // Extended from 6s to 8s - longer base window for re-ID (helps TCI)
    qualityBoostFactor: 2.5,  // Increased from 2.0 - quality=1.0 gives 2.5x boost
    adaptiveMaxReidAgeMs: 20000,  // Extended from 15s to 20s - allow re-ID over longer gaps
  },

  kalman: {
    processNoise: 0.7,  // Reduced - smoother position estimates, less responsive to rapid changes
    measurementNoise: 0.5,  // Increased from 0.3 - more smoothing to reduce jitter from projection noise
    initialPositionUncertainty: 1,
    initialVelocityUncertainty: 1,
    maxCacheSize: 500,
  },

  clustering: {
    clusteringDistanceM: 0.9,  // Reduced from 1.2m to prevent wrong merges - 0.9m balances projection error vs merge accuracy
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
    mahalanobisThreshold: 7.0,  // Relaxed from 5.5 - less strict gating for cross-camera handoffs
    sameCameraMahalanobisThreshold: 9.0,  // Relaxed from 7.0 - better same-camera re-ID
    minTimeDeltaMs: 50,
    sameCameraReIDWindowMs: 1000,  // Increased from 500ms - longer window for same-camera re-ID
  },

  sync: {
    // Increased to tolerate real-world camera / HTTP jitter so multi-camera batches can complete.
    // (66ms was frequently too tight, leading to single-camera timeout flushes and poor handoffs.)
    syncWindowMs: 200,
    minCamerasForSync: 1,           // Minimum cameras before partial flush
    maxBufferedDetections: 500,     // Emergency flush if buffer gets too large
    frameBucketMs: 33,              // ~30fps frame buckets
    // Time-based bucketing is more robust for real multi-camera feeds (different videos / imperfect frame alignment).
    // Frame-number correlation can be enabled per-deployment when cameras are known to share an identical frame clock.
    useFrameNumberCorrelation: false,
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
    handoffZoneDistanceM: 2.5,  // Increased from 1.5m - wider handoff zone near FOV edge
    minVelocityTowardBoundary: 0.2,  // Lowered from 0.3 - trigger handoff at slower speeds
    timeToBoundaryThresholdMs: 3000,  // Increased from 2000ms - longer prediction window
    predictiveHandoffBonus: 0.5,  // Increased bonus (was 0.7) - 50% cost reduction for handoff candidates
    predictiveGateExpansion: 1.6,  // Increased from 1.3 - 60% wider spatial gate for handoffs
  },

  // Multi-frame batch optimization - sliding window with continuous emission
  batch: {
    enabled: true,                   // Re-enabled for debugging
    maxBufferSize: 150,              // Keep up to 150 frames for context (5s @ 30fps)
    emissionDelayFrames: 30,         // Emit after 30 frames (~1s delay for stability)
    optimizationWindowSize: 30,      // Optimize 30 frames at a time
    maxBatchDelayMs: 2000,           // Force flush after 2 seconds max
    idSwitchPenalty: 2.0,            // Heavy penalty for ID switches (2m equivalent)
    smoothnessWeight: 0.3,           // Weight for trajectory smoothness in cost
    temporalContinuityBonus: 0.8,    // 20% cost reduction for temporal continuity
    trackBirthCost: 0.9,             // Cost to create new track - raised from 0.5 to discourage fragmentation
    trackDeathCost: 0.3,             // Cost per frame for unmatched track
    maxIterations: 5,                // Block coordinate descent iterations
    convergenceThreshold: 0.01,      // Stop when improvement < 1cm
    streamingEmission: true,         // Stream results for smooth display
    emissionBatchSize: 1,            // Emit 1 frame per incoming frame (continuous)
    batchSize: 30,                   // @deprecated - use optimizationWindowSize
  },
} as const
