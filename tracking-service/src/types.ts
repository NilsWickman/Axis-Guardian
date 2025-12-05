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
  /** Maximum viewing distance in meters */
  maxDistance: number
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
  viewDistance: number
}

/**
 * Sitemap camera config format (for loading from JSON)
 */
export interface SiteMapCameraConfig {
  id: string
  position: { x: number; y: number }
  rotation: number
  elevation?: number
  height: number
  fieldOfView: number
  viewDistance: number
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
}

/**
 * Camera-specific track association
 */
export interface CameraTrackAssociation {
  cameraId: string
  trackIds: number[]
  lastSeen: number
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
}

// ============================================================================
// Configuration
// ============================================================================

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
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  correlationDistanceM: 0.5,  // Reduced to prevent merging different people
  mergeWindowMs: 200,
  trackExpiryMs: 5000,
  maxTrailLength: 20,
  minDetectionsToConfirm: 3,
  maxVelocityMs: 50,
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
 * WebSocket message types
 */
export type WebSocketMessage =
  | { type: 'snapshot'; tracks: GlobalTrackJSON[] }
  | { type: 'track_created'; track: GlobalTrackJSON }
  | { type: 'track_updated'; track: GlobalTrackJSON }
  | { type: 'track_expired'; trackId: string }
