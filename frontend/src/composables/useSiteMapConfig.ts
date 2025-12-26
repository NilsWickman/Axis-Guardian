/**
 * Composable for loading and using site map configuration
 *
 * Replaces the deleted siteMaps store by loading configuration directly
 * from the siteMapConfigLoader and converting it to the expected types.
 */

import { ref, type Ref } from 'vue'
import {
  loadSiteMapConfig,
  type SiteMapConfig,
  type SiteMapConfigCamera,
  type SiteMapConfigWall,
  type SiteMapConfigObstacle,
} from '../utils/siteMapConfigLoader'
import type { CameraPlacement, Wall, Obstacle, AngleWallAlignment, WallIntersectionPoints } from '../types/site-map-types'
import { RENDER_SCALE, setMapHeight, type UnitValue } from '../utils/siteMapConversion'

/**
 * Type guard to check if an angle value is an alignToWall object
 */
function isAlignToWall(value: unknown): value is AngleWallAlignment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'alignToWall' in value &&
    typeof (value as AngleWallAlignment).alignToWall === 'string'
  )
}

/**
 * Result of a circle-line intersection calculation
 */
interface CircleLineIntersection {
  point: { x: number; y: number }
  angle: number  // degrees, 0 = +X, 90 = +Y
}

/**
 * Calculate where a circle intersects a line segment (wall).
 * Returns both the intersection point and the angle.
 *
 * @param cx - Circle center X
 * @param cy - Circle center Y
 * @param radius - Circle radius
 * @param x1 - Wall start X
 * @param y1 - Wall start Y
 * @param x2 - Wall end X
 * @param y2 - Wall end Y
 * @returns Intersection point and angle, or null if no intersection
 */
function calculateWallIntersection(
  cx: number,
  cy: number,
  radius: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CircleLineIntersection | null {
  // Line segment direction
  const dx = x2 - x1
  const dy = y2 - y1

  // Vector from line start to circle center
  const fx = x1 - cx
  const fy = y1 - cy

  // Quadratic equation coefficients: at² + bt + c = 0
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - radius * radius

  const discriminant = b * b - 4 * a * c

  if (discriminant < 0) {
    // No intersection
    return null
  }

  const sqrtDisc = Math.sqrt(discriminant)

  // Two potential intersection parameters
  const t1 = (-b - sqrtDisc) / (2 * a)
  const t2 = (-b + sqrtDisc) / (2 * a)

  // Find valid intersection(s) within the line segment [0, 1]
  const validTs: number[] = []
  if (t1 >= 0 && t1 <= 1) validTs.push(t1)
  if (t2 >= 0 && t2 <= 1) validTs.push(t2)

  if (validTs.length === 0) {
    // Intersections are outside the line segment
    return null
  }

  // Use the first valid intersection (or average if both are valid)
  const t = validTs.length === 1 ? validTs[0] : (validTs[0] + validTs[1]) / 2

  // Calculate intersection point
  const ix = x1 + t * dx
  const iy = y1 + t * dy

  // Calculate angle from circle center to intersection point
  // atan2 gives angle where 0 = +X (right), π/2 = +Y (up)
  const angleRad = Math.atan2(iy - cy, ix - cx)
  let angleDeg = angleRad * 180 / Math.PI

  // Normalize to 0-360 range
  if (angleDeg < 0) angleDeg += 360

  return {
    point: { x: ix, y: iy },
    angle: angleDeg
  }
}

/**
 * Legacy wrapper that returns just the angle for backward compatibility
 */
function calculateWallIntersectionAngle(
  cx: number,
  cy: number,
  radius: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number | null {
  const result = calculateWallIntersection(cx, cy, radius, x1, y1, x2, y2)
  return result?.angle ?? null
}

/**
 * Calculate intersection points for both inner and outer radii with a wall.
 * Used for wall-aligned arc segment sides.
 */
function calculateWallIntersectionPoints(
  walls: SiteMapConfigWall[],
  wallId: string,
  arcCenterX: number,
  arcCenterY: number,
  innerRadius: number,
  outerRadius: number
): WallIntersectionPoints | null {
  const wall = walls.find(w => w.id === wallId)
  if (!wall) {
    console.warn(`[useSiteMapConfig] Wall not found for side alignment: ${wallId}`)
    return null
  }

  const x1 = asNumber(wall.start?.x)
  const y1 = asNumber(wall.start?.y)
  const x2 = asNumber(wall.end?.x)
  const y2 = asNumber(wall.end?.y)

  const outerIntersection = calculateWallIntersection(arcCenterX, arcCenterY, outerRadius, x1, y1, x2, y2)
  const innerIntersection = calculateWallIntersection(arcCenterX, arcCenterY, innerRadius, x1, y1, x2, y2)

  if (!outerIntersection || !innerIntersection) {
    console.warn(`[useSiteMapConfig] No intersection found between arc and wall: ${wallId}`)
    return null
  }

  return {
    outer: outerIntersection.point,
    inner: innerIntersection.point
  }
}

/**
 * Resolve an angle value that may be a number, UnitValue, or alignToWall object.
 *
 * @param angleValue - The angle value to resolve
 * @param walls - Array of walls to look up for alignToWall
 * @param arcCenterX - Arc center X coordinate
 * @param arcCenterY - Arc center Y coordinate
 * @param radius - Arc radius to use for intersection calculation
 * @returns Resolved angle as UnitValue in degrees
 */
function resolveAngleValue(
  angleValue: number | { value: number; unit?: string } | AngleWallAlignment,
  walls: SiteMapConfigWall[],
  arcCenterX: number,
  arcCenterY: number,
  radius: number
): UnitValue {
  // If it's a plain number, convert to UnitValue
  if (typeof angleValue === 'number') {
    return { value: angleValue, unit: 'deg' }
  }

  // If it's already a UnitValue (has 'value' property but no 'alignToWall')
  if ('value' in angleValue && !isAlignToWall(angleValue)) {
    return { value: angleValue.value, unit: angleValue.unit ?? 'deg' }
  }

  // It's an alignToWall object
  if (isAlignToWall(angleValue)) {
    const wallId = angleValue.alignToWall
    const offset = angleValue.offset ?? 0

    // Find the wall
    const wall = walls.find(w => w.id === wallId)
    if (!wall) {
      console.warn(`[useSiteMapConfig] Wall not found for alignToWall: ${wallId}`)
      return { value: 0, unit: 'deg' }
    }

    // Get wall coordinates
    const x1 = asNumber(wall.start?.x)
    const y1 = asNumber(wall.start?.y)
    const x2 = asNumber(wall.end?.x)
    const y2 = asNumber(wall.end?.y)

    // Calculate intersection angle
    const angle = calculateWallIntersectionAngle(
      arcCenterX,
      arcCenterY,
      radius,
      x1, y1,
      x2, y2
    )

    if (angle === null) {
      console.warn(`[useSiteMapConfig] No intersection found between arc and wall: ${wallId}`)
      return { value: 0, unit: 'deg' }
    }

    // Apply offset and return
    return { value: angle + offset, unit: 'deg' }
  }

  // Fallback
  return { value: 0, unit: 'deg' }
}

/**
 * Site map data structure compatible with canvas rendering
 */
export interface SiteMap {
  id: string
  name: string
  width: UnitValue
  height: UnitValue
  walls: Wall[]
  cameras: CameraPlacement[]
  obstacles: Obstacle[]
  /** Pixels per meter for rendering */
  renderScale: number
  /** Origin point for coordinate system */
  origin: { x: number; y: number }
}

/**
 * Convert a number to UnitValue format
 */
function toUnitValue(value: number, unit: string = 'm'): UnitValue {
  return { value, unit }
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Convert SiteMapConfigCamera to CameraPlacement
 */
function configCameraToCameraPlacement(camera: SiteMapConfigCamera): CameraPlacement {
  return {
    cameraId: asString(camera.id, 'unknown'),
    position: {
      x: toUnitValue(asNumber(camera.position?.x)),
      y: toUnitValue(asNumber(camera.position?.y)),
    },
    azimuth: toUnitValue(asNumber(camera.azimuth), 'deg'),
    elevation: toUnitValue(asNumber(camera.elevation, 45), 'deg'),
    height: toUnitValue(asNumber(camera.height)),
    fov: toUnitValue(asNumber(camera.fieldOfView, 60), 'deg'),
    color: asString(camera.color, '#3b82f6') || '#3b82f6',
  }
}

/**
 * Convert SiteMapConfigWall to Wall
 */
function configWallToWall(wall: SiteMapConfigWall): Wall {
  const result: Wall = {
    id: asString(wall.id, ''),
    start: {
      x: toUnitValue(asNumber(wall.start?.x)),
      y: toUnitValue(asNumber(wall.start?.y)),
    },
    end: {
      x: toUnitValue(asNumber(wall.end?.x)),
      y: toUnitValue(asNumber(wall.end?.y)),
    },
    type: wall.type,
  }

  // Add arc geometry support
  if (wall.geometry) {
    result.geometry = wall.geometry
  }

  if (wall.arc) {
    result.arc = {
      center: {
        x: toUnitValue(asNumber(wall.arc.center?.x)),
        y: toUnitValue(asNumber(wall.arc.center?.y)),
      },
      radius: toUnitValue(asNumber(wall.arc.radius)),
      startAngle: toUnitValue(asNumber(wall.arc.startAngle), 'deg'),
      endAngle: toUnitValue(asNumber(wall.arc.endAngle), 'deg'),
      clockwise: wall.arc.clockwise ?? false,
    }
  }

  return result
}

/**
 * Convert SiteMapConfigObstacle to Obstacle
 * @param obstacle - The obstacle configuration
 * @param walls - Array of walls for resolving alignToWall references in arc segments
 */
function configObstacleToObstacle(obstacle: SiteMapConfigObstacle, walls: SiteMapConfigWall[]): Obstacle {
  // For arc-segments, use the arc center as position if no position is provided
  const position = obstacle.position ?? obstacle.arcSegment?.center ?? { x: 0, y: 0 }

  const result: Obstacle = {
    id: obstacle.id,
    type: obstacle.type,
    label: obstacle.label,
    category: obstacle.category,
    position: {
      x: toUnitValue(position.x),
      y: toUnitValue(position.y),
    },
    rotation: obstacle.rotation,
    height: obstacle.height,
    blocksTracking: obstacle.blocksTracking,
    blocksView: obstacle.blocksView,
    color: obstacle.color,
  }

  if (obstacle.dimensions) {
    result.dimensions = {
      width: toUnitValue(obstacle.dimensions.width),
      height: toUnitValue(obstacle.dimensions.height),
    }
  }

  if (obstacle.radius !== undefined) {
    result.radius = toUnitValue(obstacle.radius)
  }

  if (obstacle.vertices) {
    result.vertices = obstacle.vertices.map(v => ({
      x: toUnitValue(v.x),
      y: toUnitValue(v.y),
    }))
  }

  if (obstacle.arcSegment) {
    const arcCenterX = asNumber(obstacle.arcSegment.center.x)
    const arcCenterY = asNumber(obstacle.arcSegment.center.y)
    const innerRadius = asNumber(obstacle.arcSegment.innerRadius)
    const outerRadius = asNumber(obstacle.arcSegment.outerRadius)

    // Get side wall IDs if specified
    const startSideWall = (obstacle.arcSegment as Record<string, unknown>).startSideWall as string | undefined
    const endSideWall = (obstacle.arcSegment as Record<string, unknown>).endSideWall as string | undefined

    // Calculate wall intersection points if side walls are specified
    const startSidePoints = startSideWall
      ? calculateWallIntersectionPoints(walls, startSideWall, arcCenterX, arcCenterY, innerRadius, outerRadius)
      : undefined
    const endSidePoints = endSideWall
      ? calculateWallIntersectionPoints(walls, endSideWall, arcCenterX, arcCenterY, innerRadius, outerRadius)
      : undefined

    result.arcSegment = {
      center: {
        x: toUnitValue(arcCenterX),
        y: toUnitValue(arcCenterY),
      },
      innerRadius: toUnitValue(innerRadius),
      outerRadius: toUnitValue(outerRadius),
      startAngle: resolveAngleValue(obstacle.arcSegment.startAngle, walls, arcCenterX, arcCenterY, outerRadius),
      endAngle: resolveAngleValue(obstacle.arcSegment.endAngle, walls, arcCenterX, arcCenterY, outerRadius),
      clockwise: obstacle.arcSegment.clockwise,
      startSideWall,
      endSideWall,
      startSidePoints: startSidePoints ?? undefined,
      endSidePoints: endSidePoints ?? undefined,
    }
  }

  // Handle linear obstacles (two-point + width)
  if (obstacle.linear) {
    result.linear = {
      start: {
        x: toUnitValue(obstacle.linear.start.x),
        y: toUnitValue(obstacle.linear.start.y),
      },
      end: {
        x: toUnitValue(obstacle.linear.end.x),
        y: toUnitValue(obstacle.linear.end.y),
      },
      width: toUnitValue(obstacle.linear.width),
    }
  }

  return result
}

/**
 * Convert SiteMapConfig to SiteMap
 */
function configToSiteMap(config: SiteMapConfig): SiteMap {
  // Pass walls to obstacle converter for alignToWall resolution
  const walls = config.walls
  return {
    id: 'default',
    name: 'Site Map',
    width: toUnitValue(asNumber(config.dimensions?.width)),
    height: toUnitValue(asNumber(config.dimensions?.height)),
    walls: walls.map(configWallToWall),
    cameras: config.cameras.map(configCameraToCameraPlacement),
    obstacles: (config.obstacles ?? []).map(o => configObstacleToObstacle(o, walls)),
    renderScale: RENDER_SCALE,
    origin: config.origin ?? { x: 0, y: 0 },
  }
}

function isSiteMapConfigCandidate(value: unknown): value is SiteMapConfig {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const dimensions = v.dimensions as Record<string, unknown> | undefined
  if (!dimensions || typeof dimensions !== 'object') return false
  if (!Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height)) return false
  if (!Array.isArray(v.walls) || !Array.isArray(v.cameras)) return false
  return true
}

export function tryCreateSiteMapFromUnknown(value: unknown): SiteMap | null {
  if (!isSiteMapConfigCandidate(value)) return null
  try {
    return configToSiteMap(value)
  } catch {
    return null
  }
}

// Singleton state for the site map
const siteMap = ref<SiteMap | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(false)

/**
 * Composable for accessing site map configuration
 */
export function useSiteMapConfig(): {
  siteMap: Ref<SiteMap | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  isLoaded: Ref<boolean>
  loadSiteMap: () => Promise<SiteMap | null>
  getCameraPlacement: (cameraId: string) => CameraPlacement | undefined
} {
  /**
   * Load the site map configuration
   */
  async function loadSiteMap(): Promise<SiteMap | null> {
    if (siteMap.value) {
      return siteMap.value
    }

    if (isLoading.value) {
      // Wait for existing load to complete
      while (isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return siteMap.value
    }

    isLoading.value = true
    error.value = null

    try {
      const config = await loadSiteMapConfig()
      siteMap.value = configToSiteMap(config)

      // Set the map height for Y-axis coordinate transformation in canvas rendering
      const heightMeters = asNumber(config.dimensions?.height, 30)
      setMapHeight(heightMeters)

      isLoaded.value = true
      return siteMap.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load site map'
      console.error('[useSiteMapConfig] Failed to load:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get camera placement by ID
   */
  function getCameraPlacement(cameraId: string): CameraPlacement | undefined {
    return siteMap.value?.cameras.find(c => c.cameraId === cameraId)
  }

  return {
    siteMap,
    isLoading,
    error,
    isLoaded,
    loadSiteMap,
    getCameraPlacement,
  }
}
