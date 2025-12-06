/**
 * Site Map Configuration Loader
 *
 * Loads site map and camera configuration from a single JSON file,
 * providing a single source of truth for both stores.
 */

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
  color?: string
}

export interface SiteMapConfigWall {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  type?: 'external' | 'internal' | 'door'
}

export interface SiteMapConfig {
  dimensions: { width: number; height: number; unit: string }
  origin?: { x: number; y: number }
  walls: SiteMapConfigWall[]
  cameras: SiteMapConfigCamera[]
}

const CONFIG_PATH = '/sitemap-rectangular-room.json'

let cachedConfig: SiteMapConfig | null = null

/**
 * Load site map configuration from JSON file.
 * Results are cached after first successful load.
 */
export async function loadSiteMapConfig(): Promise<SiteMapConfig> {
  if (cachedConfig) {
    console.log('[SiteMapConfigLoader] Returning cached configuration')
    return cachedConfig
  }

  console.log('[SiteMapConfigLoader] Loading configuration from', CONFIG_PATH)

  const response = await fetch(CONFIG_PATH)
  if (!response.ok) {
    throw new Error(`Failed to load site map config: ${response.status} ${response.statusText}`)
  }

  const config: SiteMapConfig = await response.json()

  console.log('[SiteMapConfigLoader] Configuration loaded:', {
    dimensions: `${config.dimensions.width}m x ${config.dimensions.height}m`,
    cameras: config.cameras.length,
    walls: config.walls.length
  })

  cachedConfig = config
  return config
}

/**
 * Clear the cached configuration (useful for testing or reloading)
 */
export function clearConfigCache(): void {
  cachedConfig = null
}
