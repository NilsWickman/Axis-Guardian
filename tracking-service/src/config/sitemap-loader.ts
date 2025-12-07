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

export type ObstacleType = 'rectangle' | 'circle' | 'polygon'
export type ObstacleCategory = 'furniture' | 'structural' | 'equipment'

export interface SiteMapObstacle {
  id: string
  type: ObstacleType
  label?: string
  category?: ObstacleCategory
  position: { x: number; y: number }
  rotation?: number
  // For rectangles
  dimensions?: { width: number; height: number }
  // For circles
  radius?: number
  // For polygons
  vertices?: { x: number; y: number }[]
  // Physical height
  height?: number
  // Behavior flags
  blocksTracking?: boolean
  blocksView?: boolean
}

export interface SiteMapConfig {
  dimensions: {
    width: number
    height: number
    unit: string
  }
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
 * Load full sitemap config including obstacles
 */
export function loadFullSiteMapConfig(filePath: string): {
  config: SiteMapConfig
  cameras: Map<string, CameraParams>
  obstacles: SiteMapObstacle[]
} {
  const config = loadSiteMapConfig(filePath)
  const cameras = new Map<string, CameraParams>()

  for (const camera of config.cameras) {
    cameras.set(camera.id, siteMapCameraToCameraParams(camera))
  }

  const obstacles = (config.obstacles ?? []).filter(
    (obs) => obs.blocksTracking !== false
  )

  return { config, cameras, obstacles }
}
