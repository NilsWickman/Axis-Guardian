/**
 * Shared geometry types for Axis Guardian
 */

/**
 * 2D point/position in world coordinates (meters)
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * @deprecated Use Point2D instead. Alias kept for backwards compatibility.
 */
export type Position2D = Point2D

/**
 * 3D point/position in world coordinates (meters)
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * @deprecated Use Point3D instead. Alias kept for backwards compatibility.
 */
export type Position3D = Point3D
