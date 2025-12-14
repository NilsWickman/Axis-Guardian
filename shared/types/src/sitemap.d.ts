/**
 * Site Map Configuration Types
 *
 * Canonical type definitions for site map configuration.
 * Used by frontend, tracking-service, and any other services.
 */
import type { Position2D } from './geometry';
/**
 * Camera configuration as stored in JSON config files.
 * This is the canonical format for serialization.
 */
/**
 * Image resolution
 */
export interface ImageResolution {
    width: number;
    height: number;
}
/**
 * Lens distortion coefficients (Brown-Conrady model)
 */
export interface DistortionCoeffs {
    /** Radial distortion coefficient 1 */
    k1: number;
    /** Radial distortion coefficient 2 */
    k2: number;
    /** Tangential distortion coefficient 1 */
    p1: number;
    /** Tangential distortion coefficient 2 */
    p2: number;
}
export interface SiteMapCameraConfig {
    /** Unique camera identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Camera model (optional) */
    model?: string;
    /** RTSP stream URL */
    rtspUrl?: string;
    /** WebRTC endpoint URL */
    webrtcUrl?: string;
    /** Camera IP address */
    ipAddress?: string;
    /** Position on the site map (meters) */
    position: Position2D;
    /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
    azimuth: number;
    /** Elevation angle in degrees (positive = looking down from horizontal) */
    elevation: number;
    /** Camera mounting height in meters */
    height: number;
    /** Horizontal field of view in degrees */
    fieldOfView: number;
    /** Image resolution in pixels */
    resolution?: ImageResolution;
    /** Lens distortion coefficients */
    distortion?: DistortionCoeffs;
    /** Display color for visualization */
    color?: string;
}
/**
 * Wall segment in a site map
 */
export interface SiteMapWall {
    id: string;
    start: Position2D;
    end: Position2D;
    type?: 'external' | 'internal' | 'door';
}
/**
 * Site map dimensions
 */
export interface SiteMapDimensions {
    width: number;
    height: number;
    unit: 'meters' | 'feet';
}
/**
 * 2D dimensions for obstacles
 */
export interface Dimensions2D {
    width: number;
    height: number;
}
/**
 * Obstacle category determines styling and default behavior
 */
export type ObstacleCategory = 'furniture' | 'structural' | 'equipment';
/**
 * Obstacle geometry type
 */
export type ObstacleType = 'rectangle' | 'circle' | 'polygon';
/**
 * Base obstacle properties shared by all obstacle types
 */
export interface ObstacleBase {
    /** Unique obstacle identifier */
    id: string;
    /** Obstacle geometry type */
    type: ObstacleType;
    /** Human-readable name (e.g., 'Conference Table') */
    label?: string;
    /** Obstacle category for styling and behavior */
    category?: ObstacleCategory;
    /** Center position in meters */
    position: Position2D;
    /** Rotation in degrees (clockwise from north) */
    rotation?: number;
    /** Physical height in meters (for FOV occlusion calculation) */
    height?: number;
    /** If true, prevents tracks from being created inside this obstacle */
    blocksTracking?: boolean;
    /** If true, occludes camera field of view */
    blocksView?: boolean;
    /** Display color (Tailwind class or hex) */
    color?: string;
}
/**
 * Rectangular obstacle (tables, desks, equipment racks)
 */
export interface RectangleObstacle extends ObstacleBase {
    type: 'rectangle';
    /** Width and height in meters */
    dimensions: Dimensions2D;
}
/**
 * Circular obstacle (pillars, columns)
 */
export interface CircleObstacle extends ObstacleBase {
    type: 'circle';
    /** Radius in meters */
    radius: number;
}
/**
 * Polygon obstacle (complex shapes)
 */
export interface PolygonObstacle extends ObstacleBase {
    type: 'polygon';
    /** Array of vertex positions (minimum 3) */
    vertices: Position2D[];
}
/**
 * Union type for all obstacle types
 */
export type Obstacle = RectangleObstacle | CircleObstacle | PolygonObstacle;
/**
 * Type guard to check if obstacle is a rectangle
 */
export declare function isRectangleObstacle(obstacle: Obstacle): obstacle is RectangleObstacle;
/**
 * Type guard to check if obstacle is a circle
 */
export declare function isCircleObstacle(obstacle: Obstacle): obstacle is CircleObstacle;
/**
 * Type guard to check if obstacle is a polygon
 */
export declare function isPolygonObstacle(obstacle: Obstacle): obstacle is PolygonObstacle;
/**
 * Complete site map configuration (JSON format)
 */
export interface SiteMapConfig {
    dimensions: SiteMapDimensions;
    origin?: Position2D;
    walls: SiteMapWall[];
    cameras: SiteMapCameraConfig[];
    obstacles?: Obstacle[];
}
//# sourceMappingURL=sitemap.d.ts.map