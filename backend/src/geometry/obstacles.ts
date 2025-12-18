/**
 * Obstacle Geometry Utilities
 *
 * Provides geometric operations for obstacle collision detection
 * used in the tracking pipeline.
 */

import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import { type Point2D } from './primitives.js'
import { isPointInPolygon, distanceToLineSegment } from './polygon.js'

// Re-export Point2D for backward compatibility
export type { Point2D }

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
 * Check if a point is inside an obstacle
 * @param margin - Positive margin shrinks the obstacle (for filtering with tolerance)
 */
export function isPointInsideObstacle(
  point: Point2D,
  obstacle: SiteMapObstacle,
  margin: number = 0
): boolean {
  switch (obstacle.type) {
    case 'circle':
      if (obstacle.radius === undefined) return false
      // Apply margin to shrink the effective radius
      const effectiveRadius = Math.max(0, obstacle.radius - margin)
      return isPointInCircle(point, obstacle.position, effectiveRadius)

    case 'rectangle':
      if (!obstacle.dimensions) return false
      // Apply margin to shrink the effective dimensions
      const effectiveWidth = Math.max(0, obstacle.dimensions.width - margin * 2)
      const effectiveHeight = Math.max(0, obstacle.dimensions.height - margin * 2)
      return isPointInRectangle(
        point,
        obstacle.position,
        effectiveWidth,
        effectiveHeight,
        obstacle.rotation ?? 0
      )

    case 'polygon':
      if (!obstacle.vertices || obstacle.vertices.length < 3) return false
      // Polygon margin would require complex shrinking - not supported
      return isPointInPolygon(point, obstacle.vertices)

    default:
      return false
  }
}

/**
 * Check if a point is inside any of the given obstacles
 * @param margin - Positive margin shrinks obstacles (for filtering with tolerance)
 */
export function isPointInsideAnyObstacle(
  point: Point2D,
  obstacles: SiteMapObstacle[],
  margin: number = 0
): boolean {
  return obstacles.some((obstacle) => isPointInsideObstacle(point, obstacle, margin))
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

// ============================================================================
// 3D Ray-Table Intersection Utilities
// ============================================================================

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Ray3D {
  origin: Point3D
  direction: Point3D
}

export interface TableIntersection {
  point: Point3D
  distance: number
  table: SiteMapObstacle
}

/**
 * Find where a 3D ray intersects a horizontal plane at given height
 */
function intersectHorizontalPlane(
  ray: Ray3D,
  planeHeight: number
): { point: Point3D; distance: number } | null {
  // Check if ray is parallel to plane
  if (Math.abs(ray.direction.z) < 1e-10) {
    return null
  }

  // Calculate intersection parameter t
  const t = (planeHeight - ray.origin.z) / ray.direction.z

  // Reject if behind camera or too far
  if (t < 0 || t > 1000) {
    return null
  }

  // Calculate intersection point
  const point: Point3D = {
    x: ray.origin.x + t * ray.direction.x,
    y: ray.origin.y + t * ray.direction.y,
    z: planeHeight,
  }

  return { point, distance: t }
}

/**
 * Find where a 3D ray intersects a table at its height
 * Returns null if no intersection or ray doesn't pass through table footprint
 */
export function findRayTableIntersection(
  ray: Ray3D,
  table: SiteMapObstacle
): TableIntersection | null {
  const tableHeight = table.height ?? 1.0

  // Find where ray intersects the plane at table height
  const planeIntersection = intersectHorizontalPlane(ray, tableHeight)
  if (!planeIntersection) {
    return null
  }

  // Check if intersection point is inside table's 2D footprint
  const point2D: Point2D = {
    x: planeIntersection.point.x,
    y: planeIntersection.point.y,
  }
  if (!isPointInsideObstacle(point2D, table)) {
    return null
  }

  return {
    point: planeIntersection.point,
    distance: planeIntersection.distance,
    table,
  }
}

/**
 * Find all tables that occlude a camera's view along a ray direction
 * Returns tables sorted by distance from camera (closest first)
 */
export function findOccludingTables(
  cameraPos: Point3D,
  rayDirection: Point3D,
  tables: SiteMapObstacle[]
): TableIntersection[] {
  const ray: Ray3D = { origin: cameraPos, direction: rayDirection }

  const intersections: TableIntersection[] = []
  for (const table of tables) {
    const intersection = findRayTableIntersection(ray, table)
    if (intersection) {
      intersections.push(intersection)
    }
  }

  // Sort by distance (closest first)
  return intersections.sort((a, b) => a.distance - b.distance)
}

// ============================================================================
// 2D Table Occlusion Utilities (used for clamping “behind table” projections)
// ============================================================================

function rotate2D(point: Point2D, degrees: number): Point2D {
  if (degrees === 0) return point
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

/**
 * Ray-rectangle intersection in 2D (with rotation support).
 * Returns enter/exit distances t along the ray: origin + t * dir, t >= 0.
 */
export function intersectRayWithRectangle2D(
  origin: Point2D,
  dir: Point2D,
  rect: SiteMapObstacle
): { tEnter: number; tExit: number } | null {
  if (rect.type !== 'rectangle' || !rect.dimensions) return null

  const rot = rect.rotation ?? 0

  // Transform into rectangle local space
  const oLocal = rotate2D({ x: origin.x - rect.position.x, y: origin.y - rect.position.y }, -rot)
  const dLocal = rotate2D(dir, -rot)

  const halfW = rect.dimensions.width / 2
  const halfH = rect.dimensions.height / 2

  const slab = (o: number, d: number, min: number, max: number): { t0: number; t1: number } | null => {
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return null
      return { t0: -Infinity, t1: Infinity }
    }
    const t0 = (min - o) / d
    const t1 = (max - o) / d
    return t0 < t1 ? { t0, t1 } : { t0: t1, t1: t0 }
  }

  const sx = slab(oLocal.x, dLocal.x, -halfW, halfW)
  if (!sx) return null
  const sy = slab(oLocal.y, dLocal.y, -halfH, halfH)
  if (!sy) return null

  const tEnter = Math.max(sx.t0, sy.t0)
  const tExit = Math.min(sx.t1, sy.t1)

  if (!Number.isFinite(tExit) || tExit < 0) return null
  if (tExit < Math.max(tEnter, 0)) return null

  return { tEnter: Math.max(tEnter, 0), tExit }
}

/**
 * Clamp a table-occluded projected world point so it cannot lie arbitrarily far behind
 * the occluding table. This prevents “snapping to the wall” when foot estimation overshoots.
 *
 * We find the nearest table intersected by the camera->point ray, then clamp the point to be
 * at most `maxBehindM` beyond the *far* edge of that table along the ray direction.
 */
export function clampBehindOccludingTable2D(
  cameraPos: Point2D,
  worldPoint: Point2D,
  tables: SiteMapObstacle[],
  maxBehindM: number,
  minBehindM: number = 0
): { point: Point2D; clamped: boolean } {
  if (tables.length === 0) return { point: worldPoint, clamped: false }

  const vx = worldPoint.x - cameraPos.x
  const vy = worldPoint.y - cameraPos.y
  const len = Math.sqrt(vx * vx + vy * vy)
  if (len < 1e-6) return { point: worldPoint, clamped: false }
  const dir = { x: vx / len, y: vy / len }

  // Find closest intersected table (smallest tEnter)
  let best: { tEnter: number; tExit: number } | null = null
  for (const t of tables) {
    const hit = intersectRayWithRectangle2D(cameraPos, dir, t)
    if (!hit) continue
    if (!best || hit.tEnter < best.tEnter) best = hit
  }

  if (!best) return { point: worldPoint, clamped: false }

  // If the person is table-occluded, the feet must lie BEYOND the table along this ray.
  // Some projections under-extend (placing the point in front of the table), while others
  // over-extend (placing it far behind, often near a wall). Clamp to a small band behind
  // the far table edge: [tExit + minBehindM, tExit + maxBehindM].
  const minT = best.tExit + Math.max(0, minBehindM)
  const maxT = best.tExit + Math.max(Math.max(0, maxBehindM), Math.max(0, minBehindM))

  let targetT = len
  let clamped = false
  if (len < minT) {
    targetT = minT
    clamped = true
  } else if (len > maxT) {
    targetT = maxT
    clamped = true
  } else {
    return { point: worldPoint, clamped: false }
  }

  return {
    point: {
      x: cameraPos.x + dir.x * targetT,
      y: cameraPos.y + dir.y * targetT,
    },
    clamped,
  }
}
