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
import type { CameraPlacement, Wall, Obstacle } from '../types/site-map-types'
import { RENDER_SCALE, type UnitValue } from '../utils/siteMapConversion'

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
 */
function configObstacleToObstacle(obstacle: SiteMapConfigObstacle): Obstacle {
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
    result.arcSegment = {
      center: {
        x: toUnitValue(obstacle.arcSegment.center.x),
        y: toUnitValue(obstacle.arcSegment.center.y),
      },
      innerRadius: toUnitValue(obstacle.arcSegment.innerRadius),
      outerRadius: toUnitValue(obstacle.arcSegment.outerRadius),
      startAngle: toUnitValue(obstacle.arcSegment.startAngle),
      endAngle: toUnitValue(obstacle.arcSegment.endAngle),
      clockwise: obstacle.arcSegment.clockwise,
    }
  }

  return result
}

/**
 * Convert SiteMapConfig to SiteMap
 */
function configToSiteMap(config: SiteMapConfig): SiteMap {
  return {
    id: 'default',
    name: 'Site Map',
    width: toUnitValue(asNumber(config.dimensions?.width)),
    height: toUnitValue(asNumber(config.dimensions?.height)),
    walls: config.walls.map(configWallToWall),
    cameras: config.cameras.map(configCameraToCameraPlacement),
    obstacles: (config.obstacles ?? []).map(configObstacleToObstacle),
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
