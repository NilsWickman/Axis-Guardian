/**
 * Track Types
 *
 * Types for global tracks that span multiple cameras.
 *
 * NOTE: Core track types are defined here and should match the definitions
 * in shared/types/src/track.ts. The shared types package provides canonical
 * definitions that the frontend imports directly.
 */

import type { Point2D } from './geometry.js'
import type { DetectionAttributes, ColorScore, ClothingTypeScore } from './detection.js'

// ============================================================================
// Track State Types
// ============================================================================

/**
 * Track lifecycle state for occlusion handling
 */
export type TrackState = 'unconfirmed' | 'confirmed' | 'occluded'

/**
 * Reason why a track stopped being detected
 * Used to determine timeout behavior and display mode
 *
 * IMPORTANT: This must match the definition in shared/types/src/track.ts
 */
export type ExitReason =
  | 'fov_exit'
  | 'boundary_exit'
  | 'pillar_occlusion'
  | 'partial_occlusion'
  | 'timeout'
  | null

/**
 * Camera-specific track association
 */
export interface CameraTrackAssociation {
  cameraId: string
  trackIds: number[]
  lastSeen: number
  /** Last frame number this track was seen in from this camera */
  lastFrameNumber?: number
}

/**
 * Trail position for history visualization
 */
export interface TrailPosition {
  x: number
  y: number
  timestamp: number
}

/**
 * Video timing information for track synchronization
 */
export interface VideoTimingInfo {
  /** Video time in milliseconds (position within video) */
  videoTimeMs: number
  /** RTP timestamp (90kHz clock) for frame-perfect sync */
  rtpTimestamp?: number
  /** Frame number from source camera */
  frameNumber: number
  /** Camera ID that provided this timing */
  cameraId: string
}

/**
 * Aggregated clothing attributes for a track
 * Dominant colors/type determined by weighted voting across detections
 */
export interface AggregatedClothingAttributes {
  /** Top colors by vote count (max 3) */
  dominant_colors: ColorScore[]
  /** Most common clothing type */
  type?: ClothingTypeScore
}

/**
 * Track-level aggregated attributes from multiple detections
 * Used for person re-identification and display
 */
export interface TrackAttributes {
  /** Upper body clothing aggregate */
  upper_clothing: AggregatedClothingAttributes
  /** Lower body clothing aggregate */
  lower_clothing: AggregatedClothingAttributes
  /** Averaged re-ID embedding (quality-weighted) */
  embedding?: number[]
  /** Confidence in the aggregated embedding (0-1) */
  embedding_quality: number
  /** Number of detection samples used for aggregation */
  sample_count: number
}

/**
 * Frame info for timing diagnostics
 */
export interface CameraFrameInfo {
  cameraId: string
  frameNumber: number
  timestamp: number
}

// ============================================================================
// Camera Detection (extended with local types)
// ============================================================================

/**
 * Position data from a single camera detection
 * Extended from shared type with local dependencies
 */
export interface CameraDetection {
  cameraId: string
  /** Local track ID from the camera's tracker (e.g., ByteTrack). NOT a global track ID. */
  localTrackId: number
  worldX: number
  worldY: number
  confidence: number
  timestamp: number // Unix timestamp in ms
  /** Image-space detection bounding box (normalized 0..1), if available */
  bbox?: { x: number; y: number; width: number; height: number }
  /** Image-space center (pixels) for same-camera deduplication sanity checks */
  imageCenter?: Point2D
  /** True if the feet are likely occluded by a table (used for relaxed creation/dedup heuristics) */
  isTableOccluded?: boolean
  /** Frame number from source camera (for frame-based missed detection) */
  frameNumber?: number
  /** Video time in milliseconds (position within video, for sync) */
  videoTimeMs?: number
  /** RTP timestamp (90kHz clock) for frame-perfect sync */
  rtpTimestamp?: number
  /** Person attributes from re-ID preprocessing (optional) */
  attributes?: DetectionAttributes
  /** Camera position in world coordinates (for distance-based weighting) */
  cameraPosition?: Point2D
}

// ============================================================================
// Kalman Filter State (internal to backend)
// ============================================================================

/**
 * Kalman filter state for position/velocity estimation
 */
export interface KalmanState {
  /** State vector [[x], [y], [vx], [vy]] */
  mean: number[][]
  /** 4x4 covariance matrix */
  covariance: number[][]
  /** Last update timestamp in ms */
  lastTimestamp: number
}

// ============================================================================
// Global Track
// ============================================================================

/**
 * Global track that spans multiple cameras
 */
export interface GlobalTrack {
  globalTrackId: string
  cameraAssociations: Map<string, CameraTrackAssociation>
  /** Latest image-space detections per camera (used for video box overlays) */
  cameraDetections: Map<string, CameraImageDetection>
  currentPosition: Point2D
  trail: TrailPosition[]
  color: string
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  detectionCount: number
  confidence: number
  pendingDetections: CameraDetection[]
  /** Kalman filter state for motion estimation */
  kalmanState?: KalmanState
  /** Track lifecycle state for occlusion handling */
  state: TrackState
  /** Timestamp when track entered occluded state */
  occludedSince?: number
  /** Number of consecutive frames without detection */
  missedFrames: number
  /** Number of consecutive detections since entering occlusion (for hysteresis) */
  consecutiveDetections: number
  /** Count of times this track has recovered from occlusion (for adaptive timeout) */
  occlusionCount: number
  /** Reason why track stopped being detected (for smart timeout behavior) */
  exitReason?: ExitReason
  /** Predicted position during pillar occlusion (ghost track) */
  predictedPosition?: Point2D
  /** Video timing from the most recent detection (for frontend sync) */
  videoTiming?: VideoTimingInfo
  /** Aggregated person attributes for re-ID and display (optional) */
  attributes?: TrackAttributes
}

/**
 * Serializable version of GlobalTrack (for JSON API)
 * This is the format sent to the frontend via WebSocket
 *
 * IMPORTANT: This must match the definition in shared/types/src/track.ts
 */
export interface GlobalTrackJSON {
  globalTrackId: string
  cameraAssociations: Record<string, CameraTrackAssociation>
  /**
   * Latest per-camera image-space detections (normalized bbox), used for drawing boxes on video.
   * Optional for backwards compatibility.
   */
  cameraDetections?: Record<string, CameraImageDetection>
  currentPosition: Point2D
  trail: TrailPosition[]
  color: string
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  detectionCount: number
  confidence: number
  state: TrackState
  /** Reason why track stopped being detected */
  exitReason?: ExitReason
  /** Predicted position during pillar occlusion (ghost track) */
  predictedPosition?: Point2D
  /** Video timing from the most recent detection (for frontend sync) */
  videoTiming?: VideoTimingInfo
  /** Aggregated person attributes for re-ID and display (optional) */
  attributes?: TrackAttributes
}

export interface DetectionBBox {
  x: number
  y: number
  width: number
  height: number
}

export interface CameraImageDetection {
  cameraId: string
  bbox: DetectionBBox
  confidence: number
  timestamp: number
  frameNumber?: number
  videoTimeMs?: number
}
