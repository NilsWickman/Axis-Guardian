/**
 * Site Map Types
 *
 * Types for camera placements, walls, and obstacles used by the canvas rendering
 * composables for site tracking visualization.
 */

import type { UnitValue } from '../utils/siteMapConversion'

export interface CameraPlacement {
  cameraId: string
  position: {
    x: UnitValue
    y: UnitValue
  }
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: UnitValue
  /** Elevation angle in degrees (positive = looking down) */
  elevation: UnitValue
  /** Camera mount height */
  height: UnitValue
  /** Horizontal field of view */
  fov: UnitValue
  color: string
  notes?: string
}

export interface ArcParameters {
  center: { x: UnitValue; y: UnitValue }
  radius: UnitValue
  startAngle: UnitValue  // degrees (0 = right/+X, 90 = down/+Y)
  endAngle: UnitValue    // degrees
  clockwise?: boolean
}

export interface AngleWallAlignment {
  alignToWall: string  // ID of the wall to align to
  offset?: number      // Optional offset in degrees from calculated intersection
}

/**
 * AngleValue can be a UnitValue or an alignToWall reference (in JSON config only).
 * Note: AngleWallAlignment is resolved to UnitValue during config loading in useSiteMapConfig.ts
 */
export type AngleValue = UnitValue | AngleWallAlignment

/**
 * Intersection points where an arc meets a wall (for wall-aligned sides)
 */
export interface WallIntersectionPoints {
  outer: { x: number; y: number }  // Where outer radius intersects wall
  inner: { x: number; y: number }  // Where inner radius intersects wall
}

/**
 * Arc segment geometry for curved seating rows.
 * Note: startAngle and endAngle are always resolved UnitValue at runtime.
 * The JSON config may use AngleWallAlignment objects which get resolved during loading.
 */
export interface ArcSegmentGeometry {
  center: { x: UnitValue; y: UnitValue }
  innerRadius: UnitValue
  outerRadius: UnitValue
  startAngle: UnitValue  // degrees (0 = right/+X, 90 = up/+Y) - resolved from wall alignment if needed
  endAngle: UnitValue    // degrees - resolved from wall alignment if needed
  clockwise?: boolean
  // Wall-aligned sides: if specified, the side edge follows the wall instead of being radial
  startSideWall?: string  // Wall ID for start side alignment
  endSideWall?: string    // Wall ID for end side alignment
  // Calculated intersection points (populated during config loading if side walls are specified)
  startSidePoints?: WallIntersectionPoints
  endSidePoints?: WallIntersectionPoints
}

export interface LinearGeometry {
  start: { x: UnitValue; y: UnitValue }
  end: { x: UnitValue; y: UnitValue }
  width: UnitValue  // perpendicular width in meters
}

export interface Wall {
  id: string
  start: {
    x: UnitValue
    y: UnitValue
  }
  end: {
    x: UnitValue
    y: UnitValue
  }
  type?: 'external' | 'internal' | 'door'
  geometry?: 'line' | 'arc'
  arc?: ArcParameters
}

export type ObstacleType = 'rectangle' | 'circle' | 'polygon' | 'arc-segment' | 'linear'
export type ObstacleCategory = 'furniture' | 'structural' | 'equipment' | 'seating'

export interface Obstacle {
  id: string
  type: ObstacleType
  label?: string
  category?: ObstacleCategory
  position: {
    x: UnitValue
    y: UnitValue
  }
  rotation?: number
  // For rectangles
  dimensions?: {
    width: UnitValue
    height: UnitValue
  }
  // For circles
  radius?: UnitValue
  // For polygons
  vertices?: { x: UnitValue; y: UnitValue }[]
  // For arc-segments (curved seating rows)
  arcSegment?: ArcSegmentGeometry
  // For linear obstacles (two-point + width)
  linear?: LinearGeometry
  // Physical height for FOV occlusion
  height?: number
  // Behavior flags
  blocksTracking?: boolean
  blocksView?: boolean
  // Display
  color?: string
}
