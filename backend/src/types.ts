/**
 * Core Type Definitions for Tracking Service
 *
 * This file re-exports all types from the domain-specific modules in types/.
 * For new code, prefer importing from specific modules:
 *   - types/geometry.ts  - Point2D, Point3D
 *   - types/detection.ts - RawDetection, DetectionMessage, DetectionAttributes
 *   - types/camera.ts    - CameraConfig, CameraCalibration, SiteMapCameraConfig
 *   - types/projection.ts - ProjectionResult, ImageParams
 *   - types/track.ts     - GlobalTrack, CameraDetection, TrackState
 *   - types/config.ts    - TrackingConfig, DEFAULT_TRACKING_CONFIG
 *   - types/api.ts       - WebSocketMessage, TracksResponse
 */

export * from './types/index.js'
