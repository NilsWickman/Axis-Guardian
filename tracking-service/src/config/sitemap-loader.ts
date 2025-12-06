/**
 * Site Map Configuration Loader
 *
 * Loads camera configurations from sitemap JSON files.
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
