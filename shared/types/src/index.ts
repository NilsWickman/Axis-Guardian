/**
 * Shared types for Axis Guardian
 *
 * This package provides canonical type definitions used across
 * frontend, tracking-service, and other services.
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
