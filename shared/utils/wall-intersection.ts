/**
 * Wall Intersection Resolver
 *
 * Calculates the angle at which an arc (circle) intersects a wall (line segment).
 * Used to resolve `alignToWall` references in arc segment geometry.
 */

interface Position2D {
  x: number
  y: number
}

interface Wall {
  id: string
  start: Position2D
  end: Position2D
}

interface ArcCenter {
  x: number
  y: number
}

/**
 * Calculate the angle (in degrees) at which a circle intersects a line segment.
 *
 * @param center - Center point of the arc/circle
 * @param radius - Radius of the arc (use outerRadius for outer edge alignment)
 * @param wallStart - Start point of the wall line segment
 * @param wallEnd - End point of the wall line segment
 * @returns Angle in degrees (0 = +X axis, 90 = +Y axis), or null if no intersection
 */
export function calculateWallIntersectionAngle(
  center: ArcCenter,
  radius: number,
  wallStart: Position2D,
  wallEnd: Position2D
): number | null {
  // Line segment from wallStart to wallEnd
  // Parametric form: P = wallStart + t * (wallEnd - wallStart), t in [0, 1]

  const dx = wallEnd.x - wallStart.x
  const dy = wallEnd.y - wallStart.y

  // Circle equation: (x - cx)^2 + (y - cy)^2 = r^2
  // Substitute parametric line into circle equation to get quadratic in t

  const fx = wallStart.x - center.x
  const fy = wallStart.y - center.y

  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius

  const discriminant = b * b - 4 * a * c

  if (discriminant < 0) {
    // No intersection
    return null
  }

  const sqrtDiscriminant = Math.sqrt(discriminant)

  // Two possible t values
  const t1 = (-b - sqrtDiscriminant) / (2 * a)
  const t2 = (-b + sqrtDiscriminant) / (2 * a)

  // Find valid intersection point(s) within the line segment [0, 1]
  // We may have 0, 1, or 2 valid intersections
  const validTs: number[] = []
  if (t1 >= 0 && t1 <= 1) validTs.push(t1)
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-9) validTs.push(t2)

  if (validTs.length === 0) {
    // Line segment doesn't intersect the circle (even though infinite line might)
    return null
  }

  // Calculate intersection points and their angles
  const angles: number[] = []
  for (const t of validTs) {
    const x = wallStart.x + t * dx
    const y = wallStart.y + t * dy

    // Calculate angle from center to intersection point
    // atan2 returns angle in radians, with 0 = +X axis
    const angleRad = Math.atan2(y - center.y, x - center.x)
    const angleDeg = angleRad * (180 / Math.PI)

    // Normalize to [0, 360)
    const normalizedAngle = ((angleDeg % 360) + 360) % 360
    angles.push(normalizedAngle)
  }

  // If there are two intersections, we might need both depending on context
  // For now, return the first one (typically the one closer to wallStart)
  // The caller can use offset to adjust if needed
  return angles[0]
}

/**
 * Resolve all `alignToWall` references in an arc segment geometry.
 *
 * @param arcSegment - Arc segment with potential wall alignment references
 * @param walls - Array of all walls in the sitemap
 * @returns Arc segment with resolved numeric angles
 */
export function resolveArcWallAlignments(
  arcSegment: {
    center: Position2D
    innerRadius: number
    outerRadius: number
    startAngle: number | { alignToWall: string; offset?: number }
    endAngle: number | { alignToWall: string; offset?: number }
    clockwise?: boolean
  },
  walls: Wall[]
): {
  center: Position2D
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  clockwise?: boolean
} {
  const wallMap = new Map(walls.map(w => [w.id, w]))

  const resolveAngle = (
    angle: number | { alignToWall: string; offset?: number },
    useOuterRadius: boolean = true
  ): number => {
    if (typeof angle === 'number') {
      return angle
    }

    const wall = wallMap.get(angle.alignToWall)
    if (!wall) {
      console.warn(`Wall not found: ${angle.alignToWall}`)
      return 0
    }

    // Use outer radius for alignment (outer edge of seating meets wall)
    const radius = useOuterRadius ? arcSegment.outerRadius : arcSegment.innerRadius

    const calculatedAngle = calculateWallIntersectionAngle(
      arcSegment.center,
      radius,
      wall.start,
      wall.end
    )

    if (calculatedAngle === null) {
      console.warn(`No intersection found between arc and wall: ${angle.alignToWall}`)
      return 0
    }

    return calculatedAngle + (angle.offset ?? 0)
  }

  return {
    center: arcSegment.center,
    innerRadius: arcSegment.innerRadius,
    outerRadius: arcSegment.outerRadius,
    startAngle: resolveAngle(arcSegment.startAngle),
    endAngle: resolveAngle(arcSegment.endAngle),
    clockwise: arcSegment.clockwise
  }
}

/**
 * Check if an angle value is a wall alignment reference
 */
export function isWallAlignment(
  angle: number | { alignToWall: string; offset?: number }
): angle is { alignToWall: string; offset?: number } {
  return typeof angle === 'object' && 'alignToWall' in angle
}
