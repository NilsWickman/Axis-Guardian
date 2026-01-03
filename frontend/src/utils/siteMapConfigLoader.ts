/**
 * Site Map Configuration Loader
 *
 * Loads site map and camera configuration with the following priority:
 * 1. Tracking service API (database-backed, runtime source of truth)
 * 2. Static JSON file (fallback for development/offline mode)
 */

import { config } from '../config/environment'

export interface ImageResolution {
  width: number
  height: number
}

export interface DistortionCoeffs {
  k1: number
  k2: number
  p1: number
  p2: number
}

export interface SiteMapConfigCamera {
  id: string
  name: string
  model?: string
  rtspUrl: string
  webrtcUrl?: string
  ipAddress?: string
  position: { x: number; y: number }
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down). Default: 45 */
  elevation?: number
  /** Camera mount height in meters */
  height: number
  /** Horizontal field of view in degrees */
  fieldOfView: number
  /** Image resolution in pixels */
  resolution?: ImageResolution
  /** Lens distortion coefficients */
  distortion?: DistortionCoeffs
  color?: string
}

export interface SiteMapConfigArc {
  center: { x: number; y: number }
  radius: number
  startAngle: number  // degrees
  endAngle: number    // degrees
  clockwise?: boolean
}

export interface SiteMapConfigWall {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  type?: 'external' | 'internal' | 'door'
  geometry?: 'line' | 'arc'
  arc?: SiteMapConfigArc
}

export interface SiteMapConfigObstacle {
  id: string
  type: 'rectangle' | 'circle' | 'polygon' | 'arc-segment'
  label?: string
  category?: 'furniture' | 'structural' | 'equipment' | 'seating'
  position?: { x: number; y: number }
  rotation?: number
  dimensions?: { width: number; height: number }
  radius?: number
  vertices?: { x: number; y: number }[]
  arcSegment?: {
    center: { x: number; y: number }
    innerRadius: number
    outerRadius: number
    startAngle: number
    endAngle: number
    clockwise?: boolean
  }
  linear?: {
    start: { x: number; y: number }
    end: { x: number; y: number }
    width: number
  }
  height?: number
  blocksTracking?: boolean
  blocksView?: boolean
  seatedPersonHeight?: number
  color?: string
}

export interface SiteMapConfig {
  dimensions: { width: number; height: number; unit: string }
  origin?: { x: number; y: number }
  walls: SiteMapConfigWall[]
  cameras: SiteMapConfigCamera[]
  obstacles?: SiteMapConfigObstacle[]
}

const STATIC_CONFIG_PATH = `${import.meta.env.BASE_URL}sitemap-rectangular-room.json`

let cachedConfig: SiteMapConfig | null = null
let configSource: 'api' | 'static' | null = null

/**
 * Attempt to load config from tracking service API
 */
async function loadFromApi(): Promise<SiteMapConfig | null> {
  const apiUrl = `${config.trackingServiceApiUrl}/api/sitemap`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch {
    return null
  }
}

/**
 * Load config from static JSON file
 */
async function loadFromStatic(): Promise<SiteMapConfig> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  const response = await fetch(STATIC_CONFIG_PATH, { signal: controller.signal })
  clearTimeout(timeoutId)
  if (!response.ok) {
    throw new Error(`Failed to load site map config: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Load site map configuration.
 * Tries tracking service API first, falls back to static JSON.
 * Results are cached after first successful load.
 */
export async function loadSiteMapConfig(): Promise<SiteMapConfig> {
  if (cachedConfig) {
    return cachedConfig
  }

  // Try API first (unless in explicit mock mode)
  if (!config.useMockData) {
    const apiConfig = await loadFromApi()
    if (apiConfig) {
      cachedConfig = apiConfig
      configSource = 'api'
      return apiConfig
    }
  }

  // Fall back to static file
  const staticConfig = await loadFromStatic()
  cachedConfig = staticConfig
  configSource = 'static'
  return staticConfig
}

/**
 * Clear the cached configuration (useful for testing or reloading)
 */
export function clearConfigCache(): void {
  cachedConfig = null
  configSource = null
}

/**
 * Get the current config source ('api', 'static', or null if not loaded)
 */
export function getConfigSource(): 'api' | 'static' | null {
  return configSource
}
