/**
 * Projection Types
 *
 * Types for ground-plane projection calculations.
 */

import type { Point2D, Point3D } from './geometry.js'

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
