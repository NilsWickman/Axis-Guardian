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

export interface CircleObstacle {
  center: Point
  radius: number
  obstacleHeight?: number // physical height in meters
}

export interface RectangleObstacle {
  center: Point
  width: number
  height: number
  rotation?: number // degrees
  obstacleHeight?: number // physical height in meters
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
 * Get intersection of a ray with a circle
 * Returns the closest intersection point, or null if no intersection
 */
export function getRayCircleIntersection(
  rayOrigin: Point,
  rayEnd: Point,
  circle: CircleObstacle
): Point | null {
  const dx = rayEnd.x - rayOrigin.x
  const dy = rayEnd.y - rayOrigin.y
  const fx = rayOrigin.x - circle.center.x
  const fy = rayOrigin.y - circle.center.y

  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - circle.radius * circle.radius

  const discriminant = b * b - 4 * a * c

  if (discriminant < 0) {
    return null // No intersection
  }

  const sqrtDisc = Math.sqrt(discriminant)
  const t1 = (-b - sqrtDisc) / (2 * a)
  const t2 = (-b + sqrtDisc) / (2 * a)

  // Find the closest valid intersection (t in [0, 1])
  let t = -1
  if (t1 >= 0 && t1 <= 1) {
    t = t1
  } else if (t2 >= 0 && t2 <= 1) {
    t = t2
  }

  if (t < 0) {
    return null
  }

  return {
    x: rayOrigin.x + t * dx,
    y: rayOrigin.y + t * dy,
  }
}

/**
 * Get edges of a rectangle as line segments (with rotation support)
 */
export function getRectangleEdges(rect: RectangleObstacle): LineSegment[] {
  const { center, width, height, rotation = 0 } = rect
  const halfWidth = width / 2
  const halfHeight = height / 2

  // Corner points in local coordinates
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ]

  // Rotate and translate corners to world coordinates
  const radians = (rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const worldCorners = corners.map((corner) => ({
    x: center.x + corner.x * cos - corner.y * sin,
    y: center.y + corner.x * sin + corner.y * cos,
  }))

  // Create edge segments
  return [
    { start: worldCorners[0], end: worldCorners[1] },
    { start: worldCorners[1], end: worldCorners[2] },
    { start: worldCorners[2], end: worldCorners[3] },
    { start: worldCorners[3], end: worldCorners[0] },
  ]
}

/**
 * Cast a ray from a point in a direction and find intersections with walls and obstacles
 * Returns the closest intersection point, or the ray endpoint if no intersection
 */
export function castRay(
  origin: Point,
  direction: { x: number; y: number },
  maxDistance: number,
  walls: LineSegment[],
  circles: CircleObstacle[] = [],
  rectangles: RectangleObstacle[] = []
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

  // Check intersection with circle obstacles
  for (const circle of circles) {
    const intersection = getRayCircleIntersection(origin, rayEnd, circle)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < closestDistance) {
        closestDistance = dist
        closestIntersection = intersection
      }
    }
  }

  // Check intersection with rectangle obstacles (convert to edges)
  for (const rect of rectangles) {
    const edges = getRectangleEdges(rect)
    for (const edge of edges) {
      const intersection = getLineIntersection(ray, edge)
      if (intersection) {
        const dist = distance(origin, intersection)
        if (dist < closestDistance) {
          closestDistance = dist
          closestIntersection = intersection
        }
      }
    }
  }

  return closestIntersection || rayEnd
}

/**
 * Get the tangent points from an external point to a circle
 * Returns two points where rays from the external point would graze the circle
 */
function getCircleTangentPoints(from: Point, circle: CircleObstacle): Point[] {
  const dx = circle.center.x - from.x
  const dy = circle.center.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Point is inside or on the circle
  if (dist <= circle.radius) {
    return []
  }

  // Angle from point to circle center
  const angleToCenter = Math.atan2(dy, dx)

  // Angle offset for tangent lines
  const tangentAngle = Math.asin(circle.radius / dist)

  // Two tangent points
  const angle1 = angleToCenter + tangentAngle
  const angle2 = angleToCenter - tangentAngle

  // Calculate tangent points on the circle
  const tangentDist = Math.sqrt(dist * dist - circle.radius * circle.radius)

  return [
    {
      x: from.x + tangentDist * Math.cos(angle1),
      y: from.y + tangentDist * Math.sin(angle1),
    },
    {
      x: from.x + tangentDist * Math.cos(angle2),
      y: from.y + tangentDist * Math.sin(angle2),
    },
  ]
}

/**
 * Normalize angle to [0, 2π)
 */
function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
  return angle
}

/**
 * Check if angle is within FOV bounds (handling wrap-around)
 */
function isAngleInFOV(angle: number, leftAngle: number, rightAngle: number): boolean {
  const a = normalizeAngle(angle)
  const left = normalizeAngle(leftAngle)
  const right = normalizeAngle(rightAngle)

  if (right >= left) {
    // Normal case: FOV doesn't wrap around
    return a >= left && a <= right
  } else {
    // FOV wraps around 0/2π
    return a >= left || a <= right
  }
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y

    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Height-aware occlusion options
 */
export interface HeightAwareOptions {
  cameraHeight: number    // camera height in meters
  targetHeight: number    // target (person) height in meters, default ~1.7m
  pixelsPerMeter: number  // conversion factor for distance calculations
}

/**
 * Ground shadow zone - area behind obstacle where ground/feet can't be seen
 */
export interface GroundShadowZone {
  polygon: Point[]        // the shadow polygon
  obstacleId?: string     // optional reference to the obstacle
}

/**
 * Calculate the ground shadow zone behind an obstacle
 * This is the triangular area behind an obstacle where the camera can see over it
 * (at person height) but cannot see the ground level
 *
 * The shadow extends from the obstacle to where the camera's line-of-sight
 * to the top of the obstacle reaches ground level
 */
export function calculateGroundShadowZone(
  cameraPosition: Point,
  cameraHeight: number,
  obstacle: { center: Point; width?: number; height?: number; radius?: number; rotation?: number; obstacleHeight?: number },
  pixelsPerMeter: number,
  maxDistance: number = 10 // max shadow distance in meters
): Point[] | null {
  const obstacleHeight = obstacle.obstacleHeight
  if (obstacleHeight === undefined || obstacleHeight <= 0) return null

  // Camera must be above obstacle for shadow to exist
  if (cameraHeight <= obstacleHeight) return null

  // Calculate where the shadow ends (where line from camera over obstacle hits ground)
  // Using similar triangles: shadowLength / cameraHeight = (shadowLength - obstacleDistance) / obstacleHeight
  // Solving: shadowLength = obstacleDistance * cameraHeight / (cameraHeight - obstacleHeight)

  const dx = obstacle.center.x - cameraPosition.x
  const dy = obstacle.center.y - cameraPosition.y
  const distToObstacle = Math.sqrt(dx * dx + dy * dy) / pixelsPerMeter // in meters

  if (distToObstacle < 0.1) return null // too close

  const heightDiff = cameraHeight - obstacleHeight
  const shadowEndDistance = Math.min(
    distToObstacle * cameraHeight / heightDiff,
    distToObstacle + maxDistance
  )

  // Direction from camera to obstacle
  const angle = Math.atan2(dy, dx)

  // Calculate obstacle's angular width as seen from camera
  let angularHalfWidth: number

  if (obstacle.radius !== undefined) {
    // Circle: use tangent angle
    const radiusMeters = obstacle.radius / pixelsPerMeter
    angularHalfWidth = Math.atan2(radiusMeters, distToObstacle)
  } else if (obstacle.width !== undefined && obstacle.height !== undefined) {
    // Rectangle: approximate with diagonal
    const halfDiagonal = Math.sqrt(
      Math.pow(obstacle.width / 2, 2) + Math.pow(obstacle.height / 2, 2)
    ) / pixelsPerMeter
    angularHalfWidth = Math.atan2(halfDiagonal, distToObstacle)
  } else {
    return null
  }

  // Add small buffer for visual clarity
  angularHalfWidth += 0.02

  // Calculate shadow polygon points
  // Near edge (at obstacle distance)
  const nearDist = distToObstacle * pixelsPerMeter
  const nearLeft: Point = {
    x: cameraPosition.x + nearDist * Math.cos(angle - angularHalfWidth),
    y: cameraPosition.y + nearDist * Math.sin(angle - angularHalfWidth)
  }
  const nearRight: Point = {
    x: cameraPosition.x + nearDist * Math.cos(angle + angularHalfWidth),
    y: cameraPosition.y + nearDist * Math.sin(angle + angularHalfWidth)
  }

  // Far edge (where shadow ends)
  const farDist = shadowEndDistance * pixelsPerMeter
  const farLeft: Point = {
    x: cameraPosition.x + farDist * Math.cos(angle - angularHalfWidth),
    y: cameraPosition.y + farDist * Math.sin(angle - angularHalfWidth)
  }
  const farRight: Point = {
    x: cameraPosition.x + farDist * Math.cos(angle + angularHalfWidth),
    y: cameraPosition.y + farDist * Math.sin(angle + angularHalfWidth)
  }

  return [nearLeft, nearRight, farRight, farLeft]
}

/**
 * Check if an obstacle blocks view based on heights
 * Returns true if the obstacle is tall enough to block line of sight from camera to target
 */
function doesObstacleBlockView(
  cameraPos: Point,
  obstaclePos: Point,
  obstacleHeight: number | undefined,
  cameraHeight: number,
  targetHeight: number,
  pixelsPerMeter: number
): boolean {
  // If no height specified, assume infinite height (always blocks)
  if (obstacleHeight === undefined) return true

  // If obstacle is taller than both camera and target, it blocks
  if (obstacleHeight >= cameraHeight && obstacleHeight >= targetHeight) return true

  // If camera is above obstacle and target is above obstacle, camera can see over it
  if (cameraHeight > obstacleHeight && targetHeight > obstacleHeight) return false

  // Calculate the horizontal distance from camera to obstacle (in meters)
  const dx = (obstaclePos.x - cameraPos.x) / pixelsPerMeter
  const dy = (obstaclePos.y - cameraPos.y) / pixelsPerMeter
  const distToObstacle = Math.sqrt(dx * dx + dy * dy)

  // If very close to obstacle, treat as blocking
  if (distToObstacle < 0.5) return true

  // Calculate the angle of view from camera down to obstacle top
  // If this angle is steep enough, camera can see over obstacle to see target behind it
  const heightDiffCameraToObstacle = cameraHeight - obstacleHeight

  // For a target at distance D behind obstacle, can camera see it?
  // The "shadow" extends behind the obstacle based on the geometry
  // If camera looks down at angle θ = atan(heightDiff / dist),
  // everything at target height and beyond the shadow zone is visible

  // Simple heuristic: if camera is significantly above obstacle (>0.5m),
  // and target is above obstacle, don't block
  if (heightDiffCameraToObstacle > 0.3 && targetHeight > obstacleHeight) {
    return false
  }

  return true
}

/**
 * Calculate the visible FOV polygon for a camera, clipped by walls and obstacles
 * Uses ray-casting to obstacle edges for proper shadow wrapping
 * Returns an array of points representing the visible area
 */
export function calculateVisibleFOV(
  cameraPosition: Point,
  rotation: number, // azimuth in degrees (0° = North/+Y, clockwise)
  fov: number, // field of view in degrees
  viewDistance: number, // in pixels
  walls: LineSegment[],
  circles: CircleObstacle[] = [],
  rectangles: RectangleObstacle[] = [],
  heightOptions?: HeightAwareOptions
): Point[] {
  // Filter obstacles based on height if height-aware options provided
  let effectiveCircles = circles
  let effectiveRectangles = rectangles

  if (heightOptions) {
    const { cameraHeight, targetHeight, pixelsPerMeter } = heightOptions

    // Filter circles - only include those that actually block view at person height
    effectiveCircles = circles.filter((circle) =>
      doesObstacleBlockView(
        cameraPosition,
        circle.center,
        circle.obstacleHeight,
        cameraHeight,
        targetHeight,
        pixelsPerMeter
      )
    )

    // Filter rectangles - only include those that actually block view at person height
    effectiveRectangles = rectangles.filter((rect) =>
      doesObstacleBlockView(
        cameraPosition,
        rect.center,
        rect.obstacleHeight,
        cameraHeight,
        targetHeight,
        pixelsPerMeter
      )
    )
  }

  // Convert from azimuth (0° = North/+Y world, clockwise) to canvas angle
  const canvasAngle = 90 - rotation
  const rotationRad = (canvasAngle * Math.PI) / 180
  const halfFovRad = (fov / 2) * (Math.PI / 180)

  // Calculate the two edge angles of the FOV
  const leftAngle = rotationRad - halfFovRad
  const rightAngle = rotationRad + halfFovRad

  // Collect all angles to cast rays at
  const angles: number[] = []

  // 1. Add regular sweep angles for smooth FOV edges
  const numRays = Math.max(Math.floor(fov / 2), 20)
  const angleStep = (fov * Math.PI / 180) / numRays
  for (let i = 0; i <= numRays; i++) {
    angles.push(rightAngle - i * angleStep)
  }

  // 2. Add angles to wall endpoints
  for (const wall of walls) {
    for (const point of [wall.start, wall.end]) {
      const dx = point.x - cameraPosition.x
      const dy = point.y - cameraPosition.y
      const angle = Math.atan2(dy, dx)
      if (isAngleInFOV(angle, leftAngle, rightAngle)) {
        // Add angle and slightly offset angles to catch edges
        angles.push(angle)
        angles.push(angle + 0.0001)
        angles.push(angle - 0.0001)
      }
    }
  }

  // 3. Add angles to rectangle corners
  for (const rect of effectiveRectangles) {
    const edges = getRectangleEdges(rect)
    for (const edge of edges) {
      for (const point of [edge.start, edge.end]) {
        const dx = point.x - cameraPosition.x
        const dy = point.y - cameraPosition.y
        const angle = Math.atan2(dy, dx)
        if (isAngleInFOV(angle, leftAngle, rightAngle)) {
          angles.push(angle)
          angles.push(angle + 0.0001)
          angles.push(angle - 0.0001)
        }
      }
    }
  }

  // 4. Add angles to circle tangent points
  for (const circle of effectiveCircles) {
    const tangents = getCircleTangentPoints(cameraPosition, circle)
    for (const point of tangents) {
      const dx = point.x - cameraPosition.x
      const dy = point.y - cameraPosition.y
      const angle = Math.atan2(dy, dx)
      if (isAngleInFOV(angle, leftAngle, rightAngle)) {
        angles.push(angle)
        angles.push(angle + 0.0001)
        angles.push(angle - 0.0001)
      }
    }
  }

  // Sort angles (right to left for clockwise sweep)
  angles.sort((a, b) => b - a)

  // Remove duplicate angles (within small epsilon)
  const uniqueAngles: number[] = []
  for (const angle of angles) {
    if (uniqueAngles.length === 0 || Math.abs(angle - uniqueAngles[uniqueAngles.length - 1]) > 0.00005) {
      uniqueAngles.push(angle)
    }
  }

  // Cast rays at each angle
  const visiblePoints: Point[] = [cameraPosition]

  for (const angle of uniqueAngles) {
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    }

    const hitPoint = castRay(cameraPosition, direction, viewDistance, walls, effectiveCircles, effectiveRectangles)
    visiblePoints.push(hitPoint)
  }

  // Close the polygon
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
