/**
 * Ground Truth Types for Cross-Camera Evaluation
 *
 * Types for loading, validating, and evaluating tracking performance
 * against human-annotated ground truth data.
 */

import type { Point2D } from './geometry.js'

// ============================================================================
// Ground Truth Annotation Types
// ============================================================================

/**
 * Normalized bounding box [x, y, width, height] where all values are 0-1
 * x, y = top-left corner
 */
export type NormalizedBBox = [number, number, number, number]

/**
 * Single ground truth annotation for a person detection
 */
export interface GroundTruthAnnotation {
  /** Unique annotation ID */
  id: string
  /** Camera ID (camera1, camera2, camera3, camera4) */
  cameraId: string
  /** Timestamp in seconds from video start */
  timestamp: number
  /** System-assigned track ID (from annotation tool) */
  trackId?: number
  /** Ground truth person ID (1-20+) - the true identity */
  personId: number
  /** Normalized bounding box [x, y, w, h] in 0-1 range */
  bbox: NormalizedBBox
  /** Known world position in sitemap meters */
  worldPosition?: Point2D
  /** Detection confidence (from annotation tool) */
  confidence: number
  /** When this annotation was assigned */
  assignedAt?: string
}

/**
 * Person metadata for ground truth identification
 */
export interface GroundTruthPerson {
  /** Person ID (0 = invalid, 1-20+ = valid persons) */
  id: number
  /** Human-readable label (e.g., "Person 1", "Blue Jacket") */
  label: string
  /** Display color for visualization (hex) */
  color: string
  /** Optional thumbnail URL for verification */
  thumbnailUrl?: string
}

/**
 * Complete ground truth dataset from annotation tool
 */
export interface GroundTruthDataset {
  /** Schema version */
  version: string
  /** Keyframe interval in seconds */
  keyframeIntervalSeconds: number
  /** Video duration in seconds */
  videoDuration: number
  /** Camera IDs present in annotations */
  cameras: string[]
  /** All annotations */
  annotations: GroundTruthAnnotation[]
  /** Person metadata */
  persons: GroundTruthPerson[]
  /** Dataset metadata */
  metadata?: {
    createdAt: string
    lastModifiedAt: string
  }
}

// ============================================================================
// Evaluation Result Types
// ============================================================================

/**
 * Reprojection error statistics for a single camera
 */
export interface CameraReprojectionStats {
  cameraId: string
  /** Number of valid samples */
  sampleCount: number
  /** Mean reprojection error in meters */
  meanError: number
  /** Maximum reprojection error in meters */
  maxError: number
  /** Standard deviation of errors */
  stdError: number
  /** Median error in meters */
  medianError: number
  /** All individual errors for histogram analysis */
  errors: number[]
  /** Number of invalid projections (skipped) */
  invalidCount: number
}

/**
 * Single reprojection sample result
 */
export interface ReprojectionSample {
  annotationId: string
  cameraId: string
  personId: number
  timestamp: number
  /** Ground truth world position */
  gtPosition: Point2D
  /** Projected position from bbox */
  projectedPosition: Point2D | null
  /** Euclidean error in meters */
  error: number
  /** Whether projection was valid */
  isValid: boolean
  /** Reason for invalid projection */
  invalidReason?: string
}

/**
 * MOT (Multiple Object Tracking) metrics result
 *
 * Follows MOT Challenge standard definitions:
 * https://motchallenge.net/results/MOT17/
 */
export interface MOTMetrics {
  /** Multiple Object Tracking Accuracy: 1 - (FN + FP + IDSW) / GT */
  MOTA: number
  /** Multiple Object Tracking Precision: avg distance of matched pairs (meters) */
  MOTP: number
  /** Total ground truth annotations evaluated */
  totalGT: number
  /** True positive matches */
  truePositives: number
  /** False negatives (missed detections) */
  falseNegatives: number
  /** False positives (spurious tracks) */
  falsePositives: number
  /** ID switches (matched personId changes trackId) */
  idSwitches: number
  /** Track fragmentation count */
  fragmentations: number
  /** Recall: TP / (TP + FN) */
  recall: number
  /** Precision: TP / (TP + FP) */
  precision: number
  /** F1 score: 2 * (precision * recall) / (precision + recall) */
  f1Score: number

  // Extended MOT Challenge Metrics
  /** IDF1: ID F1 score - measures identity preservation */
  idf1?: number
  /** IDTP: ID true positives (correctly identified detections) */
  idtp?: number
  /** IDFP: ID false positives (detections with wrong ID) */
  idfp?: number
  /** IDFN: ID false negatives (missed identifications) */
  idfn?: number
  /** MT: Mostly Tracked - count of GT trajectories tracked >= 80% */
  mostlyTracked?: number
  /** PT: Partially Tracked - count of GT trajectories tracked 20-80% */
  partiallyTracked?: number
  /** ML: Mostly Lost - count of GT trajectories tracked < 20% */
  mostlyLost?: number
  /** Total unique GT identities (persons) */
  totalGTIdentities?: number
}

/**
 * Per-person tracking statistics
 */
export interface PersonTrackingStats {
  personId: number
  label: string
  /** Total annotations for this person */
  totalAnnotations: number
  /** Successfully matched annotations */
  matchedAnnotations: number
  /** Missed annotations (false negatives) */
  missedAnnotations: number
  /** All track IDs assigned to this person */
  trackIds: string[]
  /** Number of ID switches */
  idSwitchCount: number
  /** Number of track fragments */
  fragmentCount: number
  /** Average position error when matched (meters) */
  avgPositionError: number
}

/**
 * Match result for a single ground truth annotation
 */
export interface GTMatchResult {
  annotation: GroundTruthAnnotation
  /** Matched track (null if no match = false negative) */
  matchedTrackId: string | null
  /** Matched track position */
  matchedPosition: Point2D | null
  /** Distance to matched track (if matched) */
  matchDistance: number | null
  /** Whether this is an ID switch from previous frame */
  isIdSwitch: boolean
  /** Previous track ID for this person (for ID switch detection) */
  previousTrackId: string | null
}

/**
 * Frame-level matching result
 */
export interface FrameMatchResult {
  timestamp: number
  /** All GT match results */
  matches: GTMatchResult[]
  /** Track IDs with no GT match (potential false positives) */
  unmatchedTrackIds: string[]
  /** Statistics */
  stats: {
    gtCount: number
    matchCount: number
    fnCount: number
    fpCount: number
    idSwitchCount: number
    avgMatchDistance: number
  }
}

/**
 * Complete evaluation result
 */
export interface GroundTruthEvaluationResult {
  /** Dataset info */
  datasetVersion: string
  evaluatedAt: string
  keyframesEvaluated: number

  /** Aggregate MOT metrics */
  mot: MOTMetrics

  /** Per-camera reprojection stats (if calibration evaluated) */
  cameraStats?: CameraReprojectionStats[]

  /** Per-person tracking stats */
  personStats: PersonTrackingStats[]

  /** Configuration used */
  config: {
    matchDistanceThreshold: number // meters
    keyframeInterval: number // seconds
  }
}

// ============================================================================
// Indexed Ground Truth (for efficient lookup)
// ============================================================================

/**
 * Indexed ground truth for efficient lookup during evaluation
 */
export interface IndexedGroundTruth {
  /** All annotations */
  annotations: GroundTruthAnnotation[]
  /** Annotations by timestamp (keyframe seconds -> annotations) */
  byTimestamp: Map<number, GroundTruthAnnotation[]>
  /** Annotations by camera */
  byCamera: Map<string, GroundTruthAnnotation[]>
  /** Annotations by person */
  byPerson: Map<number, GroundTruthAnnotation[]>
  /** Person metadata */
  persons: Map<number, GroundTruthPerson>
  /** Keyframe timestamps in order */
  keyframes: number[]
  /** Metadata */
  meta: {
    version: string
    videoDuration: number
    keyframeInterval: number
    cameraIds: string[]
    personCount: number
    annotationCount: number
  }
}
