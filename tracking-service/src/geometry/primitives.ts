/**
 * Geometry Primitives - Core types and functions for 2D/3D geometry
 *
 * This module provides the foundational geometric types and distance
 * calculations used throughout the tracking system.
 */

/**
 * 2D point with x,y coordinates
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * 3D point with x,y,z coordinates
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * Line segment defined by start and end points
 */
export interface LineSegment {
  start: Point2D
  end: Point2D
}

/**
 * Calculate Euclidean distance between two 2D points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate squared Euclidean distance between two 2D points
 * (Faster when only comparing distances, avoids sqrt)
 */
export function distanceSquared(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return dx * dx + dy * dy
}

/**
 * Normalize an angle to the range [0, 2π)
 */
export function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI
  let normalized = angle % twoPi
  if (normalized < 0) normalized += twoPi
  return normalized
}

/**
 * Calculate the shortest angular difference between two angles
 * Returns a value in the range [-π, π]
 */
export function angleDifference(a1: number, a2: number): number {
  let diff = normalizeAngle(a2) - normalizeAngle(a1)
  if (diff > Math.PI) diff -= 2 * Math.PI
  if (diff < -Math.PI) diff += 2 * Math.PI
  return diff
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Linear interpolation between two 2D points
 */
export function lerpPoint2D(p1: Point2D, p2: Point2D, t: number): Point2D {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  }
}
