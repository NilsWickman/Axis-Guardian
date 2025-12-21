/**
 * Site Map Configuration Loader
 *
 * Loads camera configurations and obstacles from sitemap JSON files.
 */

import { readFileSync } from 'fs'
import type { CameraParams } from '../types.js'

export interface SiteMapCamera {
  id: string
  name: string
  position: { x: number; y: number }
  azimuth: number
  elevation?: number
  height: number
  fieldOfView: number
}

// ============================================================================
// Floor Plane Types (for lecture halls with slanted floors)
// ============================================================================

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface FloorPlaneGradient {
  /** Compass direction the floor slopes toward (0=North, 90=East) */
  direction: number
  /** Slope ratio (rise/run), e.g., 0.12 = 12% grade */
  slope: number
}

export interface FloorPlane {
  /** Floor type: 'flat' (z=0) or 'inclined' (sloped surface) */
  type: 'flat' | 'inclined'
  /** A point on the floor plane (used as reference for inclined planes) */
  origin?: Position3D
  /** Unit normal vector of the floor plane (for inclined: tilted from [0,0,1]) */
  normal?: Position3D
  /** Alternative to normal: specify slope direction and magnitude */
  gradient?: FloorPlaneGradient
}

/** Default flat floor plane at z=0 */
export const DEFAULT_FLOOR_PLANE: FloorPlane = {
  type: 'flat',
  origin: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
}

// ============================================================================
// Obstacle Types
// ============================================================================

export type ObstacleType = 'rectangle' | 'circle' | 'polygon' | 'bench-row'
export type ObstacleCategory = 'furniture' | 'structural' | 'equipment' | 'seating'

/** Geometry for a seating row (bench, desk, or stadium seating) */
export interface BenchRowGeometry {
  /** Start point of the row centerline (includes Z elevation) */
  start: Position3D
  /** End point of the row centerline (includes Z elevation) */
  end: Position3D
  /** Depth of each seat/desk in meters (perpendicular to row line) */
  depth?: number
  /** Height of seat surface above floor in meters */
  seatHeight?: number
  /** Height of backrest above floor in meters */
  backrestHeight?: number
  /** Height of attached desk/table surface (if any) */
  deskHeight?: number
  /** Spacing between individual seats */
  spacing?: number
}

export interface SiteMapObstacle {
  id: string
  type: ObstacleType
  label?: string
  category?: ObstacleCategory
  // For rectangles, circles, polygons
  position?: { x: number; y: number }
  rotation?: number
  // For rectangles
  dimensions?: { width: number; height: number }
  // For circles
  radius?: number
  // For polygons
  vertices?: { x: number; y: number }[]
  // For bench-row
  benchRow?: BenchRowGeometry
  // Physical height (for standard obstacles)
  height?: number
  // Expected head height of seated person (for seating obstacles)
  seatedPersonHeight?: number
  // Behavior flags
  blocksTracking?: boolean
  blocksView?: boolean
  // Display color
  color?: string
}

export interface SiteMapConfig {
  dimensions: {
    width: number
    height: number
    unit: string
  }
  /** Floor plane configuration (defaults to flat at z=0) */
  floorPlane?: FloorPlane
  cameras: SiteMapCamera[]
  walls?: Array<{
    id: string
    start: { x: number; y: number }
    end: { x: number; y: number }
    type: string
  }>
  obstacles?: SiteMapObstacle[]
}

/**
 * Load sitemap configuration from a JSON file
 */
export function loadSiteMapConfig(filePath: string): SiteMapConfig {
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as SiteMapConfig
}

/**
 * Convert sitemap camera config to CameraParams for projection
 */
export function siteMapCameraToCameraParams(camera: SiteMapCamera): CameraParams {
  return {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.height,
    },
    azimuth: camera.azimuth,
    elevation: camera.elevation ?? 45,
    fov: camera.fieldOfView,
  }
}

/**
 * Load all cameras from a sitemap file and return as CameraParams map
 */
export function loadCamerasFromSiteMap(
  filePath: string
): Map<string, CameraParams> {
  const config = loadSiteMapConfig(filePath)
  const cameras = new Map<string, CameraParams>()

  for (const camera of config.cameras) {
    cameras.set(camera.id, siteMapCameraToCameraParams(camera))
  }

  return cameras
}

/**
 * Load obstacles from a sitemap file
 * Only returns obstacles that block tracking (blocksTracking: true)
 */
export function loadObstaclesFromSiteMap(
  filePath: string
): SiteMapObstacle[] {
  const config = loadSiteMapConfig(filePath)
  return (config.obstacles ?? []).filter(
    (obs) => obs.blocksTracking !== false
  )
}

/**
 * Convert gradient specification to normal vector
 * Gradient defines slope direction and magnitude; we compute the plane normal
 */
export function gradientToNormal(gradient: FloorPlaneGradient): Position3D {
  const { direction, slope } = gradient

  // Convert direction to radians (0=North/+Y, 90=East/+X, clockwise)
  const dirRad = (direction * Math.PI) / 180

  // The slope direction vector in the XY plane
  // direction=0 means slope toward +Y (North)
  // direction=90 means slope toward +X (East)
  const slopeX = Math.sin(dirRad)
  const slopeY = Math.cos(dirRad)

  // For a plane with slope s in direction (sx, sy):
  // The normal is (-s*sx, -s*sy, 1) normalized
  const nx = -slope * slopeX
  const ny = -slope * slopeY
  const nz = 1

  // Normalize
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
  return {
    x: nx / len,
    y: ny / len,
    z: nz / len,
  }
}

/**
 * Normalize a floor plane configuration, ensuring it has origin and normal
 */
export function normalizeFloorPlane(floor?: FloorPlane): FloorPlane {
  if (!floor || floor.type === 'flat') {
    return DEFAULT_FLOOR_PLANE
  }

  // Inclined plane - ensure we have origin and normal
  const origin = floor.origin ?? { x: 0, y: 0, z: 0 }

  let normal: Position3D
  if (floor.normal) {
    // Normalize the provided normal vector
    const len = Math.sqrt(
      floor.normal.x ** 2 + floor.normal.y ** 2 + floor.normal.z ** 2
    )
    normal = len > 0
      ? { x: floor.normal.x / len, y: floor.normal.y / len, z: floor.normal.z / len }
      : { x: 0, y: 0, z: 1 }
  } else if (floor.gradient) {
    normal = gradientToNormal(floor.gradient)
  } else {
    // Fallback to flat
    normal = { x: 0, y: 0, z: 1 }
  }

  return { type: 'inclined', origin, normal }
}

/**
 * Load full sitemap config including obstacles and floor plane
 */
export function loadFullSiteMapConfig(filePath: string): {
  config: SiteMapConfig
  cameras: Map<string, CameraParams>
  obstacles: SiteMapObstacle[]
  floorPlane: FloorPlane
} {
  const config = loadSiteMapConfig(filePath)
  const cameras = new Map<string, CameraParams>()

  for (const camera of config.cameras) {
    cameras.set(camera.id, siteMapCameraToCameraParams(camera))
  }

  const obstacles = (config.obstacles ?? []).filter(
    (obs) => obs.blocksTracking !== false
  )

  const floorPlane = normalizeFloorPlane(config.floorPlane)

  return { config, cameras, obstacles, floorPlane }
}

/**
 * Convert sitemap cameras to geometry CameraConfig format for FOV calculations
 */
export function siteMapCamerasToGeometryConfig(cameras: SiteMapCamera[]): Array<{
  id: string
  position: { x: number; y: number }
  azimuth: number
  fieldOfView: number
}> {
  return cameras.map(cam => ({
    id: cam.id,
    position: { x: cam.position.x, y: cam.position.y },
    azimuth: cam.azimuth,
    fieldOfView: cam.fieldOfView,
  }))
}
