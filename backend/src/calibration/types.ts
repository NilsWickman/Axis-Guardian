/**
 * Auto-Calibration Types
 *
 * Types for cross-camera matching, projection optimization,
 * and tracking parameter tuning.
 */

// ============================================================================
// Cross-Camera Matching
// ============================================================================

/**
 * Bounding box in normalized coordinates (0-1)
 */
export interface NormalizedBBox {
  /** Center X (0-1) */
  centerX: number
  /** Center Y (0-1) */
  centerY: number
  /** Width (0-1) */
  width: number
  /** Height (0-1) */
  height: number
  /** Bottom Y for foot position (0-1) */
  bottomY: number
}

/**
 * Detection with embedding for cross-camera matching
 */
export interface MatchableDetection {
  cameraId: string
  frameNumber: number
  timestamp: number
  /** Local track ID from the camera's tracker (e.g., ByteTrack) */
  localTrackId: number
  bbox: NormalizedBBox
  embedding: number[]
  embeddingQuality: number
  confidence: number
}

/**
 * A matched pair of detections from different cameras
 * representing the same person at (approximately) the same time
 */
export interface CrossCameraMatch {
  /** Timestamp of the match (average of both detections) */
  timestamp: number
  /** Detection from first camera */
  detection1: MatchableDetection
  /** Detection from second camera */
  detection2: MatchableDetection
  /** Cosine similarity of embeddings (0-1) */
  similarity: number
  /** Person ID if validated by TrackTruths */
  personId?: number
  /** Whether this match is validated by TrackTruths annotations */
  isValidated?: boolean
}

/**
 * Configuration for cross-camera match discovery
 */
export interface MatchDiscoveryConfig {
  /** Minimum embedding similarity threshold (default: 0.65) */
  minSimilarity: number
  /** Maximum time gap between frames to consider simultaneous (ms, default: 100) */
  maxFrameGapMs: number
  /** Minimum matches required to proceed with calibration */
  minMatchesRequired: number
  /** Minimum embedding quality threshold (default: 0.5) */
  minEmbeddingQuality: number
}

// ============================================================================
// TrackTruths Annotations
// ============================================================================

/**
 * Single annotation linking a global track ID to a person ID
 */
export interface TrackTruthAnnotation {
  globalTrackId: string
  personId: number
  assignedAt: string
}

/**
 * TrackTruths.json file structure
 */
export interface TrackTruthsFile {
  version: string
  annotations: TrackTruthAnnotation[]
}

// ============================================================================
// Detection File Format
// ============================================================================

/**
 * Single frame from detection file
 */
export interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Array<{
    bbox: [number, number, number, number] // [x, y, w, h] normalized
    confidence: number
    class_id: number
    class_name: string
    track_id: number
    track_state?: string
    attributes?: {
      embedding?: number[]
      embedding_quality?: number
      upper_clothing?: {
        colors: Array<{ name: string; score: number }>
      }
      lower_clothing?: {
        colors: Array<{ name: string; score: number }>
      }
    }
  }>
}

/**
 * Detection file structure (from .detections.json.gz)
 */
export interface DetectionFile {
  format_version: string
  video_info: {
    filename: string
    resolution: { width: number; height: number }
    fps: number
    frame_count: number
    duration_seconds: number
  }
  detection_info: {
    model: string
    tracker: string
    reid_model?: string
    color_analysis?: boolean
  }
  frames: DetectionFrame[]
}

// ============================================================================
// Projection Optimization
// ============================================================================

/**
 * Camera calibration parameters for optimization
 */
export interface CalibrationParams {
  /** Focal length (affects K matrix) */
  focalLength: number
  /** Azimuth offset from sitemap value (degrees) */
  azimuthOffset: number
  /** Elevation offset from sitemap value (degrees) */
  elevationOffset: number
  /** Principal point X offset */
  principalPointXOffset: number
  /** Principal point Y offset */
  principalPointYOffset: number
}

/**
 * Result of projection optimization
 */
export interface OptimizationResult {
  /** Optimized parameters per camera */
  cameraParams: Map<string, CalibrationParams>
  /** Initial mean convergence error (meters) */
  initialMeanError: number
  /** Final mean convergence error (meters) */
  finalMeanError: number
  /** Number of optimization iterations */
  iterations: number
  /** Total matches used */
  matchesUsed: number
  /** Matches validated by TrackTruths */
  validatedMatches: number
}

/**
 * Calibration output file format
 */
export interface CalibrationOutput {
  version: string
  method: string
  generatedAt: string
  metrics: {
    matchesUsed: number
    validatedMatches: number
    initialMeanError: number
    finalMeanError: number
    iterations: number
  }
  cameras: Array<{
    cameraId: string
    K: number[][]
    R: number[][]
    T: number[]
    center: [number, number]
    scale: number
    calibration_params: {
      focal_length: number
      azimuth_offset: number
      elevation_offset: number
      effective_azimuth: number
      effective_elevation: number
    }
  }>
}

// ============================================================================
// Tracking Parameter Tuning
// ============================================================================

/**
 * Tunable tracking parameters
 */
export interface TunableParams {
  assignment: {
    maxCost: number
    embeddingWeight: number
    crossCameraBonus: number
  }
  trackMerger: {
    mergeDistanceM: number
    crossCameraMergeDistanceM: number
  }
  reid: {
    minSimilarity: number
    highSimilarityThreshold: number
  }
  exclusionZone: {
    confirmedExclusionRadius: number
    crossCameraExclusionRadius: number
  }
}

/**
 * Tracking evaluation metrics
 */
export interface TrackingMetrics {
  /** Multiple Object Tracking Accuracy (higher is better) */
  MOTA: number
  /** ID F1 Score (higher is better) */
  IDF1: number
  /** ID switch rate (lower is better) */
  idSwitchRate: number
  /** Track fragmentation rate (lower is better) */
  fragmentationRate: number
  /** False positive rate (lower is better) */
  falsePositiveRate: number
  /** Mostly tracked ratio (higher is better) */
  mostlyTracked: number
  /** Mostly lost ratio (lower is better) */
  mostlyLost: number
}

/**
 * Result of tracking parameter tuning
 */
export interface TuningResult {
  params: TunableParams
  metrics: TrackingMetrics
  score: number
}

// ============================================================================
// Sitemap Types (for reference)
// ============================================================================

/**
 * Camera definition from sitemap JSON
 */
export interface SitemapCamera {
  id: string
  position: { x: number; y: number }
  azimuth: number
  elevation?: number
  height: number
  fieldOfView: number
}

/**
 * Sitemap configuration
 */
export interface SitemapConfig {
  dimensions: { width: number; height: number; unit: string }
  cameras: SitemapCamera[]
}
