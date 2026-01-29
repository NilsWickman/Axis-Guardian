/**
 * Shared types for Axis Guardian
 *
 * This package provides canonical type definitions used across
 * frontend, backend, and other services.
 */

export type { Point2D, Point3D, Position2D, Position3D } from './geometry.js'

export type {
  SiteMapCameraConfig,
  SiteMapWall,
  SiteMapDimensions,
  SiteMapConfig,
  // Obstacle types
  Dimensions2D,
  ObstacleCategory,
  ObstacleType,
  ObstacleBase,
  RectangleObstacle,
  CircleObstacle,
  PolygonObstacle,
  Obstacle,
} from './sitemap.js'

export {
  isRectangleObstacle,
  isCircleObstacle,
  isPolygonObstacle,
} from './sitemap.js'

// Track types - canonical definitions for tracking data
export type {
  TrackState,
  ExitReason,
  NormalizedBBox,
  CameraDetection,
  DetectionBBox,
  CameraImageDetection,
  CameraTrackAssociation,
  TrailPosition,
  VideoTimingInfo,
  ColorScore,
  ClothingTypeScore,
  AggregatedClothingAttributes,
  TrackAttributes,
  DetectionAttributes,
  GlobalTrackJSON,
  CameraFrameInfo,
} from './track.js'

// Config types - shared configuration interface
export type { TrackingConfigBase } from './config.js'
export { DEFAULT_TRACKING_CONFIG_BASE } from './config.js'
