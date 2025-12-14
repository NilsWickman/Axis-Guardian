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
  /** Maximum age for track re-ID (ms) */
  readonly maxTrackAgeMs: number
  /** Minimum embedding quality for matching (0-1) */
  readonly minEmbeddingQuality: number
  /** High similarity threshold for merge override */
  readonly highSimilarityThreshold: number
  /** Distance override for high similarity (meters) */
  readonly highSimilarityDistanceOverride: number
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
  /** Base weight for camera1 (based on calibration accuracy) */
  readonly camera1BaseWeight: number
  /** Base weight for camera2 (based on calibration accuracy) */
  readonly camera2BaseWeight: number
  /** Regional boost factor for preferred camera */
  readonly regionalBoostFactor: number
  /** Regional penalty factor for non-preferred camera */
  readonly regionalPenaltyFactor: number
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
    maxCost: 1.0,  // Tightened from 1.2 for better precision
    associationBonus: 0.08,  // Stronger binding for existing associations (was 0.1)
    sameCameraPenalty: 1.5,
    velocityConsistencyWeight: 0.15,
    crossingProximityThreshold: 1.5,
    crossingMaxCostMultiplier: 0.4,  // Tighter for crossings (was 0.5)
    directionConsistencyWeight: 0.2,
    minSpeedForDirection: 0.2,
    crossCameraBonus: 0.6,
    crossCameraBonusWindowMs: 2000,
    maxAccelerationMs2: 3.0,
    accelerationConsistencyWeight: 0.1,
    embeddingWeight: 0.25,  // Increased from 0.1 for better ReID utilization
    embeddingMinSimilarity: 0.65,  // Lowered from 0.7 for more embedding matches
    embeddingMinQuality: 0.25,  // Lowered from 0.3 for more embeddings used
    trajectoryPredictionSteps: [200, 500, 800, 1000],
    trajectoryPredictionWindowMs: 1000,
    intersectionThresholdM: 0.8,
  },

  trackLifecycle: {
    correlationDistanceM: 0.9,  // Tightened from 1.2 for better precision
    mergeWindowMs: 200,
    trackExpiryMs: 7000,  // Reduced from 10s to reduce ghost tracks
    maxTrailLength: 20,
    minDetectionsToConfirm: 3,  // Increased from 2 for more reliable tracks
    maxVelocityMs: 8,
    unconfirmedTrackExpiryMs: 3000,  // Reduced from 5s to clean up ghosts faster
    minCreationConfidence: 0.7,
    maxTracks: 200,
    minTrailMovementThreshold: 0.1,
  },

  exclusionZone: {
    confirmedExclusionRadius: 0.8,  // Increased - prevent duplicates within projection error range
    unconfirmedExclusionRadius: 1.0,  // Increased - catch early duplicates in overlap zones
    crossCameraExclusionRadius: 0.8,  // Increased - match clustering distance to prevent cross-camera duplicates
    crossCameraExclusionTimeMs: 300,  // Increased time window for cross-camera duplicate detection
  },

  trackMerger: {
    mergeDistanceM: 0.8,  // Increased - catch duplicates within projection error range
    mergeConfidenceThreshold: 0.6,  // Lowered slightly - merge more aggressively to eliminate duplicates
    mergeVelocityThreshold: 1.5,  // Increased - allow more velocity variation during merge
    unconfirmedMergeDistanceM: 0.6,  // Increased - catch unconfirmed duplicates
    unconfirmedMergeConfidenceThreshold: 0.4,  // Lowered - merge unconfirmed tracks more readily
    crossCameraMergeDistanceM: 1.0,  // Increased - account for projection errors between cameras
    minDetectionsForVelocity: 3,
    simultaneousDetectionBonus: 0.15,
    simultaneousWindowMs: 150,
    slowSpeedThreshold: 0.3,
    fastSpeedThreshold: 1.0,
    slowSpeedDistanceMultiplier: 1.5,
    fastSpeedDistanceMultiplier: 0.7,
    slowSpeedThresholdReduction: 0.15,
  },

  occlusion: {
    missedFramesBeforeOcclusion: 8,
    occlusionCoastTimeMs: 7000,
    detectionsToExitOcclusion: 2,  // Increased from 1 for hysteresis (flicker protection)
    reidentificationGateMultiplier: 4.0,
    fovExitTimeoutMs: 1500,
    boundaryExitTimeoutMs: 1000,
    maxPillarOcclusionMs: 5000,
    maxNonPillarCoastMs: 1500,
    coastingDampingFactor: 0.92,
    maxOcclusionTrailLength: 50,
    minRecoveryTimeMs: 300,  // Minimum time before exiting occlusion (flicker protection)
    partialPillarOcclusionMs: 3000,  // Timeout for partial pillar occlusion (50%+ blocked)
  },

  stitching: {
    maxGapMs: 3000,
    maxDistanceMultiplier: 2.5,
    maxEntriesPerCamera: 50,
  },

  reid: {
    minSimilarity: 0.75,  // Lowered from 0.85 for more matches
    sameCameraBonus: 1.15,  // Increased from 1.1 for stronger same-camera binding
    maxTrackAgeMs: 8000,  // Increased from 7s for longer re-ID window
    minEmbeddingQuality: 0.25,  // Lowered from 0.3 for more embeddings
    highSimilarityThreshold: 0.8,
    highSimilarityDistanceOverride: 2.0,
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
    camera1BaseWeight: 1.2,
    camera2BaseWeight: 0.8,
    regionalBoostFactor: 1.3,
    regionalPenaltyFactor: 0.7,
  },

  attributeAggregation: {
    maxDominantColors: 3,
    minColorScore: 0.1,
    minEmbeddingSamples: 2,
  },

  velocity: {
    impossibleVelocityMs: 50,
    mahalanobisThreshold: 4.0,
    sameCameraMahalanobisThreshold: 6.0,
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
} as const
