/**
 * Shared types for Axis Guardian
 *
 * This package provides canonical type definitions used across
 * frontend, backend, and other services.
 */

export type { Position2D, Position3D } from './geometry'

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
} from './sitemap'

export {
  isRectangleObstacle,
  isCircleObstacle,
  isPolygonObstacle,
} from './sitemap'

// Track types - canonical definitions for tracking data
export type {
  TrackState,
  ExitReason,
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
} from './track'

// Config types - shared configuration interface
export type { TrackingConfigBase } from './config'
export { DEFAULT_TRACKING_CONFIG_BASE } from './config'
