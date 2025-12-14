/**
 * Types Index - Barrel Export
 *
 * Re-exports all types from domain-specific modules for backward compatibility.
 * Existing imports of `from '../types.js'` will continue to work.
 */

// Geometry types
export type { Point2D, Point3D } from './geometry.js'

// Detection types
export type {
  ColorScore,
  ClothingTypeScore,
  ClothingAttributes,
  DetectionAttributes,
  RawDetection,
  DetectionMessage,
  DetectionBBox,
} from './detection.js'

// Camera types
export type {
  CameraParams,
  CameraConfig,
  ImageResolution,
  DistortionCoeffs,
  SiteMapCameraConfig,
  WorldTransform,
  CameraCalibration,
} from './camera.js'

// Projection types
export type { ImageParams, ProjectionResult, DebugInfo } from './projection.js'

// Track types
export type {
  TrackState,
  ExitReason,
  CameraDetection,
  CameraTrackAssociation,
  TrailPosition,
  VideoTimingInfo,
  KalmanState,
  AggregatedClothingAttributes,
  TrackAttributes,
  GlobalTrack,
  GlobalTrackJSON,
} from './track.js'

// Zone types
export type {
  ZoneType,
  ZoneSeverity,
  ZoneVertex,
  ZoneConfig,
  ZoneViolation,
  ZoneMetricsData,
} from './zone.js'

// Config types
export type { TrackingConfig } from './config.js'
export { DEFAULT_TRACKING_CONFIG } from './config.js'

// API types
export type {
  InjectDetectionRequest,
  TracksResponse,
  CameraFrameInfo,
  WebSocketMessage,
} from './api.js'
