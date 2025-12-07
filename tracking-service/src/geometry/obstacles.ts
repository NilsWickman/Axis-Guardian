/**
 * Obstacle Geometry Utilities
 *
 * Provides geometric operations for obstacle collision detection
 * used in the tracking pipeline.
 */

import type { SiteMapObstacle } from '../config/sitemap-loader.js'

export interface Point2D {
  x: number
  y: number
}

/**
 * Check if a point is inside a circular obstacle
 */
function isPointInCircle(
  point: Point2D,
  center: Point2D,
  radius: number
): boolean {
  const dx = point.x - center.x
  const dy = point.y - center.y
  return dx * dx + dy * dy <= radius * radius
}

/**
 * Check if a point is inside a rectangle (with rotation support)
 */
function isPointInRectangle(
  point: Point2D,
  center: Point2D,
  width: number,
  height: number,
  rotationDegrees: number = 0
): boolean {
  // Translate point to rectangle's local coordinate system
  const dx = point.x - center.x
  const dy = point.y - center.y

  // Apply inverse rotation if needed
  let localX = dx
  let localY = dy

  if (rotationDegrees !== 0) {
    const radians = (-rotationDegrees * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    localX = dx * cos - dy * sin
    localY = dx * sin + dy * cos
  }

  // Check if point is within the axis-aligned bounds
  const halfWidth = width / 2
  const halfHeight = height / 2

  return (
    Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight
  )
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Point2D, vertices: Point2D[]): boolean {
  if (vertices.length < 3) return false

  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y

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
 * Check if a point is inside an obstacle
 */
export function isPointInsideObstacle(
  point: Point2D,
  obstacle: SiteMapObstacle
): boolean {
  switch (obstacle.type) {
    case 'circle':
      if (obstacle.radius === undefined) return false
      return isPointInCircle(point, obstacle.position, obstacle.radius)

    case 'rectangle':
      if (!obstacle.dimensions) return false
      return isPointInRectangle(
        point,
        obstacle.position,
        obstacle.dimensions.width,
        obstacle.dimensions.height,
        obstacle.rotation ?? 0
      )

    case 'polygon':
      if (!obstacle.vertices || obstacle.vertices.length < 3) return false
      return isPointInPolygon(point, obstacle.vertices)

    default:
      return false
  }
}

/**
 * Check if a point is inside any of the given obstacles
 */
export function isPointInsideAnyObstacle(
  point: Point2D,
  obstacles: SiteMapObstacle[]
): boolean {
  return obstacles.some((obstacle) => isPointInsideObstacle(point, obstacle))
}

/**
 * Find which obstacle (if any) contains the point
 */
export function findObstacleContainingPoint(
  point: Point2D,
  obstacles: SiteMapObstacle[]
): SiteMapObstacle | null {
  return obstacles.find((obstacle) => isPointInsideObstacle(point, obstacle)) ?? null
}

/**
 * Calculate the minimum distance from a point to an obstacle's boundary
 * Returns 0 if the point is inside the obstacle
 * Returns negative distance if inside (useful for penetration depth)
 */
export function distanceToObstacle(
  point: Point2D,
  obstacle: SiteMapObstacle
): number {
  switch (obstacle.type) {
    case 'circle': {
      if (obstacle.radius === undefined) return Infinity
      const dx = point.x - obstacle.position.x
      const dy = point.y - obstacle.position.y
      const distanceToCenter = Math.sqrt(dx * dx + dy * dy)
      return distanceToCenter - obstacle.radius
    }

    case 'rectangle': {
      if (!obstacle.dimensions) return Infinity
      const { width, height } = obstacle.dimensions
      const rotation = obstacle.rotation ?? 0

      // Transform point to local coordinates
      const dx = point.x - obstacle.position.x
      const dy = point.y - obstacle.position.y

      let localX = dx
      let localY = dy

      if (rotation !== 0) {
        const radians = (-rotation * Math.PI) / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        localX = dx * cos - dy * sin
        localY = dx * sin + dy * cos
      }

      const halfWidth = width / 2
      const halfHeight = height / 2

      // Distance to nearest edge
      const distX = Math.abs(localX) - halfWidth
      const distY = Math.abs(localY) - halfHeight

      if (distX > 0 && distY > 0) {
        // Point is in corner region
        return Math.sqrt(distX * distX + distY * distY)
      } else if (distX > 0) {
        return distX
      } else if (distY > 0) {
        return distY
      } else {
        // Point is inside - return negative (penetration depth)
        return Math.max(distX, distY)
      }
    }

    case 'polygon': {
      // Simplified: just check if inside
      if (!obstacle.vertices || obstacle.vertices.length < 3) return Infinity
      if (isPointInPolygon(point, obstacle.vertices)) {
        return -1 // Inside, but we don't compute exact penetration
      }
      // Outside - compute minimum distance to edges
      let minDist = Infinity
      const vertices = obstacle.vertices
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length
        const dist = distanceToLineSegment(point, vertices[i], vertices[j])
        minDist = Math.min(minDist, dist)
      }
      return minDist
    }

    default:
      return Infinity
  }
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    // Line segment is a point
    const px = point.x - lineStart.x
    const py = point.y - lineStart.y
    return Math.sqrt(px * px + py * py)
  }

  // Project point onto line segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        lengthSquared
    )
  )

  const projX = lineStart.x + t * dx
  const projY = lineStart.y + t * dy

  const distX = point.x - projX
  const distY = point.y - projY

  return Math.sqrt(distX * distX + distY * distY)
}

/**
 * Check if a line segment intersects with an obstacle
 * Useful for checking if a track path would pass through an obstacle
 */
export function doesPathIntersectObstacle(
  start: Point2D,
  end: Point2D,
  obstacle: SiteMapObstacle
): boolean {
  // Simple approach: sample points along the path
  const samples = 10
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const point = {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y),
    }
    if (isPointInsideObstacle(point, obstacle)) {
      return true
    }
  }
  return false
}

/**
 * Check if a path intersects any obstacle
 */
export function doesPathIntersectAnyObstacle(
  start: Point2D,
  end: Point2D,
  obstacles: SiteMapObstacle[]
): boolean {
  return obstacles.some((obstacle) =>
    doesPathIntersectObstacle(start, end, obstacle)
  )
}

/**
 * Get a buffer zone around an obstacle (expanded boundary)
 * Returns the effective radius for collision checking with a margin
 */
export function getObstacleBufferRadius(
  obstacle: SiteMapObstacle,
  bufferMeters: number = 0.3
): number {
  switch (obstacle.type) {
    case 'circle':
      return (obstacle.radius ?? 0) + bufferMeters

    case 'rectangle': {
      if (!obstacle.dimensions) return bufferMeters
      // Return half-diagonal plus buffer
      const { width, height } = obstacle.dimensions
      const halfDiagonal = Math.sqrt(width * width + height * height) / 2
      return halfDiagonal + bufferMeters
    }

    case 'polygon': {
      if (!obstacle.vertices || obstacle.vertices.length < 3) return bufferMeters
      // Return max distance from center to any vertex plus buffer
      let maxDist = 0
      for (const vertex of obstacle.vertices) {
        const dx = vertex.x - obstacle.position.x
        const dy = vertex.y - obstacle.position.y
        maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy))
      }
      return maxDist + bufferMeters
    }

    default:
      return bufferMeters
  }
}
