/**
 * Geometry utilities for ray-casting and line-of-sight calculations
 */

export interface Point {
  x: number
  y: number
}

export interface LineSegment {
  start: Point
  end: Point
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(line1: LineSegment, line2: LineSegment): boolean {
  const intersection = getLineIntersection(line1, line2)
  return intersection !== null
}

/**
 * Get the intersection point of two line segments
 * Returns null if they don't intersect
 */
export function getLineIntersection(line1: LineSegment, line2: LineSegment): Point | null {
  const x1 = line1.start.x
  const y1 = line1.start.y
  const x2 = line1.end.x
  const y2 = line1.end.y
  const x3 = line2.start.x
  const y3 = line2.start.y
  const x4 = line2.end.x
  const y4 = line2.end.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  // Lines are parallel
  if (Math.abs(denom) < 1e-10) {
    return null
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    }
  }

  return null
}

/**
 * Calculate the distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Cast a ray from a point in a direction and find intersections with walls
 * Returns the closest intersection point, or the ray endpoint if no intersection
 */
export function castRay(
  origin: Point,
  direction: { x: number; y: number },
  maxDistance: number,
  walls: LineSegment[]
): Point {
  // Calculate the ray endpoint
  const rayEnd: Point = {
    x: origin.x + direction.x * maxDistance,
    y: origin.y + direction.y * maxDistance,
  }

  const ray: LineSegment = { start: origin, end: rayEnd }

  let closestIntersection: Point | null = null
  let closestDistance = Infinity

  // Check intersection with each wall
  for (const wall of walls) {
    const intersection = getLineIntersection(ray, wall)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < closestDistance) {
        closestDistance = dist
        closestIntersection = intersection
      }
    }
  }

  return closestIntersection || rayEnd
}

/**
 * Calculate the visible FOV polygon for a camera, clipped by walls
 * Returns an array of points representing the visible area
 */
export function calculateVisibleFOV(
  cameraPosition: Point,
  rotation: number, // in degrees
  fov: number, // field of view in degrees
  viewDistance: number, // in pixels
  walls: LineSegment[]
): Point[] {
  const rotationRad = (rotation * Math.PI) / 180
  const halfFovRad = (fov / 2) * (Math.PI) / 180

  // Calculate the two edge angles of the FOV
  const leftAngle = rotationRad - halfFovRad
  const rightAngle = rotationRad + halfFovRad

  // Number of rays to cast (more rays = smoother polygon)
  const numRays = Math.max(Math.floor(fov / 2), 20)
  const angleStep = (fov * Math.PI / 180) / numRays

  const visiblePoints: Point[] = [cameraPosition]

  // Cast rays from right to left (clockwise)
  for (let i = 0; i <= numRays; i++) {
    const angle = rightAngle - i * angleStep
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    }

    const hitPoint = castRay(cameraPosition, direction, viewDistance, walls)
    visiblePoints.push(hitPoint)
  }

  // Close the polygon by returning to the camera position
  visiblePoints.push(cameraPosition)

  return visiblePoints
}

/**
 * Draw a polygon on a canvas context
 */
export function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], fillStyle?: string, strokeStyle?: string, lineWidth?: number) {
  if (points.length < 3) return

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  ctx.closePath()

  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth || 2
    ctx.stroke()
  }
}
