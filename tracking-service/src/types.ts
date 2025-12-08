/**
 * Core Type Definitions for Tracking Service
 */

// ============================================================================
// Geometry Types
// ============================================================================

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

// ============================================================================
// Detection Types (from camera emulators)
// ============================================================================

/**
 * Detection message from camera emulator (msgpack format)
 */
export interface DetectionMessage {
  camera_id: string
  frame_number: number
  timestamp: number // seconds
  detection_count: number
  detections: RawDetection[]
}

/**
 * Single detection from camera
 */
export interface RawDetection {
  class_name: string
  bbox: [number, number, number, number] // [x, y, w, h] normalized 0-1
  confidence: number
  track_id?: number
}

/**
 * Detection bounding box (can be normalized or pixel coords)
 */
export interface DetectionBBox {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// Camera Configuration
// ============================================================================

/**
 * Camera parameters for projection
 */
export interface CameraParams {
  /** Camera position in world coordinates (meters) */
  position: Point3D
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down from horizontal) */
  elevation: number
  /** Horizontal field of view in degrees */
  fov: number
}

/**
 * Camera configuration for registry
 */
export interface CameraConfig {
  cameraId: string
  position: { x: number; y: number; z: number }
  azimuth: number
  elevation: number
  fov: number
}

/**
 * Image resolution
 */
export interface ImageResolution {
  width: number
  height: number
}

/**
 * Sitemap camera config format (for loading from JSON)
 */
export interface SiteMapCameraConfig {
  id: string
  position: { x: number; y: number }
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down). Default: 45 */
  elevation?: number
  /** Camera mount height in meters */
  height: number
  /** Horizontal field of view in degrees */
  fieldOfView: number
  /** Image resolution in pixels */
  resolution?: ImageResolution
  /** Lens distortion coefficients */
  distortion?: DistortionCoeffs
  /** ACAP device ID for mapping live camera MQTT topics to this camera */
  acapDeviceId?: string
}

/**
 * Lens distortion coefficients (Brown-Conrady model)
 */
export interface DistortionCoeffs {
  /** Radial distortion coefficient 1 */
  k1: number
  /** Radial distortion coefficient 2 */
  k2: number
  /** Radial distortion coefficient 3 */
  k3: number
  /** Tangential distortion coefficient 1 */
  p1: number
  /** Tangential distortion coefficient 2 */
  p2: number
}

/**
 * 2D rigid transformation for converting between coordinate systems
 * Used to transform dataset coordinates to sitemap coordinates
 */
export interface WorldTransform {
  /** 2x2 rotation matrix */
  rotation: number[][]
  /** [tx, ty] translation offset */
  translation: number[]
  /** Scale factor (default 1.0) */
  scale?: number
}

/**
 * Camera calibration matrices (K/R/T) for accurate projection
 * From dataset cam_param.mat file
 */
export interface CameraCalibration {
  /** 3x3 intrinsic matrix (focal length, principal point) */
  K: number[][]
  /** 3x3 rotation matrix (camera orientation) */
  R: number[][]
  /** 3x1 translation vector (camera position in world coords) */
  T: number[]
  /** Image center [cx, cy] in pixels */
  center: [number, number]
  /** Scale factor (usually 1) */
  scale: number
  /** Optional lens distortion coefficients */
  distortion?: DistortionCoeffs
  /** Optional world coordinate transformation (dataset to sitemap coords) */
  worldTransform?: WorldTransform
}

// ============================================================================
// Projection Types
// ============================================================================

export interface ImageParams {
  width: number
  height: number
}

export interface ProjectionResult {
  worldPoint: Point2D
  distance: number
  isValid: boolean
  reason?: string
}

export interface DebugInfo {
  normalizedImagePoint: Point2D
  focalLength: number
  rayCamera: Point3D
  rayWorld: Point3D
  groundIntersectionT: number
}

// ============================================================================
// Track Types
// ============================================================================

/**
 * Position data from a single camera detection
 */
export interface CameraDetection {
  cameraId: string
  trackId: number
  worldX: number
  worldY: number
  confidence: number
  timestamp: number // Unix timestamp in ms
  /** Frame number from source camera (for frame-based missed detection) */
  frameNumber?: number
}

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

/**
 * Global track that spans multiple cameras
 */
export interface GlobalTrack {
  globalTrackId: string
  cameraAssociations: Map<string, CameraTrackAssociation>
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
}

/**
 * Serializable version of GlobalTrack (for JSON API)
 */
export interface GlobalTrackJSON {
  globalTrackId: string
  cameraAssociations: Record<string, CameraTrackAssociation>
  currentPosition: Point2D
  trail: TrailPosition[]
  color: string
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  detectionCount: number
  confidence: number
  state: TrackState
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Track lifecycle state for occlusion handling
 */
export type TrackState = 'unconfirmed' | 'confirmed' | 'occluded'

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
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  correlationDistanceM: 0.6,       // Increased from 0.5 to handle cross-camera projection variance
  mergeWindowMs: 200,
  trackExpiryMs: 5000,             // Tracks expire after 5 seconds without detections
  maxTrailLength: 20,
  minDetectionsToConfirm: 2,       // Reduced from 3 for faster track confirmation
  maxVelocityMs: 50,
  unconfirmedTrackExpiryMs: 2000,  // Ghost tracks expire faster
  minCreationConfidence: 0.7,      // Require higher confidence for new tracks
  exclusionRadius: 0.5,            // Exclusion radius for confirmed tracks
  crossingProximityThreshold: 1.5, // Detect crossing when tracks within 1.5m
  occlusionCoastTimeMs: 3000,      // Coast for 3 seconds during occlusion (allows walking behind pillars)
  reidentificationGateMultiplier: 4.0, // 4x expanded gate for re-ID after occlusion
  missedFramesBeforeOcclusion: 5,  // Require 5 missed frames before transitioning to occluded
  detectionsToExitOcclusion: 2,    // Require 2 detections to exit occlusion state
  clusteringDistanceM: 0.6,        // Cluster detections within 0.6m from different cameras
  mergeDistanceM: 0.6,             // Consider merging tracks within 0.6m
  mergeConfidenceThreshold: 0.7,   // Require 70% confidence to merge tracks
  unconfirmedExclusionRadius: 0.7, // Larger exclusion for unconfirmed (prevent duplicates in overlap)
  unconfirmedMergeDistanceM: 0.4,  // Tighter merge distance for unconfirmed tracks
  crossCameraBonus: 0.7,           // 30% cost reduction for cross-camera handoff
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Detection injection request (for testing via REST API)
 */
export interface InjectDetectionRequest {
  camera_id: string
  timestamp?: number
  frame_number?: number
  detections: Array<{
    class_name?: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    track_id?: number
  }>
}

/**
 * Track list response
 */
export interface TracksResponse {
  count: number
  tracks: GlobalTrackJSON[]
}

/**
 * Frame info per camera for timing diagnostics
 */
export interface CameraFrameInfo {
  cameraId: string
  frameNumber: number
  timestamp: number
}

/**
 * WebSocket message types
 */
export type WebSocketMessage =
  | { type: 'snapshot'; tracks: GlobalTrackJSON[]; frames?: CameraFrameInfo[] }
  | { type: 'track_created'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_updated'; track: GlobalTrackJSON; frames?: CameraFrameInfo[] }
  | { type: 'track_expired'; trackId: string; frames?: CameraFrameInfo[] }
