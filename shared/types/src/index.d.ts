/**
 * Shared types for Axis Guardian
 *
 * This package provides canonical type definitions used across
 * frontend, backend, and other services.
 */
export type { Position2D, Position3D } from './geometry';
export type { SiteMapCameraConfig, SiteMapWall, SiteMapDimensions, SiteMapConfig, Dimensions2D, ObstacleCategory, ObstacleType, ObstacleBase, RectangleObstacle, CircleObstacle, PolygonObstacle, Obstacle, } from './sitemap';
export { isRectangleObstacle, isCircleObstacle, isPolygonObstacle, } from './sitemap';
export type { TrackState, ExitReason, CameraDetection, CameraTrackAssociation, TrailPosition, VideoTimingInfo, ColorScore, ClothingTypeScore, AggregatedClothingAttributes, TrackAttributes, DetectionAttributes, GlobalTrackJSON, CameraFrameInfo, } from './track';
//# sourceMappingURL=index.d.ts.map
