/**
 * Composable for loading and using site map configuration
 *
 * Replaces the deleted siteMaps store by loading configuration directly
 * from the siteMapConfigLoader and converting it to the expected types.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
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

/**
 * Convert SiteMapConfigCamera to CameraPlacement
 */
function configCameraToCameraPlacement(camera: SiteMapConfigCamera): CameraPlacement {
  return {
    cameraId: camera.id,
    position: {
      x: toUnitValue(camera.position.x),
      y: toUnitValue(camera.position.y),
    },
    azimuth: toUnitValue(camera.azimuth, 'deg'),
    elevation: toUnitValue(camera.elevation ?? 45, 'deg'),
    height: toUnitValue(camera.height),
    fov: toUnitValue(camera.fieldOfView, 'deg'),
    color: camera.color ?? '#3b82f6',
  }
}

/**
 * Convert SiteMapConfigWall to Wall
 */
function configWallToWall(wall: SiteMapConfigWall): Wall {
  return {
    id: wall.id,
    start: {
      x: toUnitValue(wall.start.x),
      y: toUnitValue(wall.start.y),
    },
    end: {
      x: toUnitValue(wall.end.x),
      y: toUnitValue(wall.end.y),
    },
    type: wall.type,
  }
}

/**
 * Convert SiteMapConfigObstacle to Obstacle
 */
function configObstacleToObstacle(obstacle: SiteMapConfigObstacle): Obstacle {
  const result: Obstacle = {
    id: obstacle.id,
    type: obstacle.type,
    label: obstacle.label,
    category: obstacle.category,
    position: {
      x: toUnitValue(obstacle.position.x),
      y: toUnitValue(obstacle.position.y),
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

  return result
}

/**
 * Convert SiteMapConfig to SiteMap
 */
function configToSiteMap(config: SiteMapConfig): SiteMap {
  return {
    id: 'default',
    name: 'Site Map',
    width: toUnitValue(config.dimensions.width),
    height: toUnitValue(config.dimensions.height),
    walls: config.walls.map(configWallToWall),
    cameras: config.cameras.map(configCameraToCameraPlacement),
    obstacles: (config.obstacles ?? []).map(configObstacleToObstacle),
    renderScale: RENDER_SCALE,
    origin: config.origin ?? { x: 0, y: 0 },
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
