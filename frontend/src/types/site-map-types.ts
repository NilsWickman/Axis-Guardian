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
}

export type ObstacleType = 'rectangle' | 'circle' | 'polygon'
export type ObstacleCategory = 'furniture' | 'structural' | 'equipment'

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
  // Physical height for FOV occlusion
  height?: number
  // Behavior flags
  blocksTracking?: boolean
  blocksView?: boolean
  // Display
  color?: string
}
