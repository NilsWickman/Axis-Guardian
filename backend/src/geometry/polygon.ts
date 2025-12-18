/**
 * Polygon Utilities - Point-in-polygon and polygon edge operations
 *
 * This module provides polygon-related geometric operations used for
 * zone detection, FOV checking, and obstacle collision.
 */

import { type Point2D, distance } from './primitives.js'

/**
 * Check if a point is inside a polygon using ray casting algorithm
 *
 * @param point - Point to test
 * @param polygon - Array of vertices defining the polygon (closed loop assumed)
 * @returns true if point is inside the polygon
 */
export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Calculate the minimum distance from a point to a line segment
 *
 * @param point - Point to measure from
 * @param segStart - Start of line segment
 * @param segEnd - End of line segment
 * @returns Minimum distance from point to segment
 */
export function distanceToLineSegment(
  point: Point2D,
  segStart: Point2D,
  segEnd: Point2D
): number {
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y
  const lengthSquared = dx * dx + dy * dy

  // Segment is a point
  if (lengthSquared === 0) {
    return distance(point, segStart)
  }

  // Project point onto line, clamped to segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared
    )
  )

  // Calculate closest point on segment
  const projection: Point2D = {
    x: segStart.x + t * dx,
    y: segStart.y + t * dy,
  }

  return distance(point, projection)
}

/**
 * Get all edges of a polygon as line segments
 *
 * @param polygon - Array of vertices defining the polygon
 * @returns Array of edges, each with start and end points
 */
export function getPolygonEdges(
  polygon: Point2D[]
): Array<{ start: Point2D; end: Point2D }> {
  const edges: Array<{ start: Point2D; end: Point2D }> = []
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    edges.push({ start: polygon[i], end: polygon[j] })
  }
  return edges
}

/**
 * Check if a point is near any edge of a polygon within a tolerance
 *
 * @param point - Point to test
 * @param polygon - Array of vertices defining the polygon
 * @param tolerance - Distance threshold in same units as polygon coordinates
 * @returns true if point is within tolerance of any polygon edge
 */
export function isPointNearPolygonEdge(
  point: Point2D,
  polygon: Point2D[],
  tolerance: number
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const dist = distanceToLineSegment(point, polygon[i], polygon[j])
    if (dist < tolerance) {
      return true
    }
  }
  return false
}

/**
 * Calculate the minimum distance from a point to any edge of a polygon
 *
 * @param point - Point to measure from
 * @param polygon - Array of vertices defining the polygon
 * @returns Minimum distance to any polygon edge
 */
export function distanceToPolygon(point: Point2D, polygon: Point2D[]): number {
  if (polygon.length < 2) return Infinity

  let minDist = Infinity
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const dist = distanceToLineSegment(point, polygon[i], polygon[j])
    minDist = Math.min(minDist, dist)
  }
  return minDist
}

/**
 * Calculate the centroid (center of mass) of a polygon
 *
 * @param polygon - Array of vertices defining the polygon
 * @returns Centroid point
 */
export function polygonCentroid(polygon: Point2D[]): Point2D {
  if (polygon.length === 0) return { x: 0, y: 0 }

  let sumX = 0
  let sumY = 0
  for (const p of polygon) {
    sumX += p.x
    sumY += p.y
  }
  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length,
  }
}
