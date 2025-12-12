/**
 * Site Configuration Store
 *
 * Provides site configuration data (cameras, walls, obstacles) loaded from JSON config.
 * Used by Site Tracking for camera placements and detection projection.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UnitValue } from '../utils/siteMapConversion'
import { RENDER_SCALE, createMeterUnit, createDegreeUnit } from '../utils/siteMapConversion'
import { loadSiteMapConfig, type SiteMapConfig } from '../utils/siteMapConfigLoader'

// Re-export types from the types file for backward compatibility
export type { CameraPlacement, Wall, Obstacle, ObstacleType, ObstacleCategory } from '../types/site-map-types'

import type { CameraPlacement, Wall, Obstacle } from '../types/site-map-types'

export interface SiteMap {
  id: string
  name: string
  description?: string
  imagePath?: string
  width: UnitValue
  height: UnitValue
  origin?: { x: number; y: number }
  renderScale: number
  cameras: CameraPlacement[]
  walls: Wall[]
  obstacles: Obstacle[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Transform loaded JSON config into a SiteMap object
 */
function transformConfigToSiteMap(config: SiteMapConfig): SiteMap {
  return {
    id: 'config-sitemap-001',
    name: 'Rectangular Room',
    description: `${config.dimensions.width}m x ${config.dimensions.height}m room with ${config.cameras.length} cameras`,
    width: createMeterUnit(config.dimensions.width),
    height: createMeterUnit(config.dimensions.height),
    origin: config.origin ?? { x: 0, y: 0 },
    renderScale: RENDER_SCALE,
    cameras: config.cameras.map((cam) => ({
      cameraId: cam.id,
      position: {
        x: createMeterUnit(cam.position.x),
        y: createMeterUnit(cam.position.y)
      },
      azimuth: createDegreeUnit(cam.azimuth),
      elevation: createDegreeUnit(cam.elevation ?? 45),
      height: createMeterUnit(cam.height),
      fov: createDegreeUnit(cam.fieldOfView),
      color: cam.color || 'cyan-500'
    })),
    walls: config.walls.map((wall) => ({
      id: wall.id,
      start: {
        x: createMeterUnit(wall.start.x),
        y: createMeterUnit(wall.start.y)
      },
      end: {
        x: createMeterUnit(wall.end.x),
        y: createMeterUnit(wall.end.y)
      },
      type: wall.type || 'external'
    })),
    obstacles: (config.obstacles ?? []).map((obs) => ({
      id: obs.id,
      type: obs.type,
      label: obs.label,
      category: obs.category ?? 'furniture',
      position: {
        x: createMeterUnit(obs.position.x),
        y: createMeterUnit(obs.position.y)
      },
      rotation: obs.rotation ?? 0,
      dimensions: obs.dimensions ? {
        width: createMeterUnit(obs.dimensions.width),
        height: createMeterUnit(obs.dimensions.height)
      } : undefined,
      radius: obs.radius !== undefined ? createMeterUnit(obs.radius) : undefined,
      vertices: obs.vertices?.map(v => ({
        x: createMeterUnit(v.x),
        y: createMeterUnit(v.y)
      })),
      height: obs.height ?? 1.0,
      blocksTracking: obs.blocksTracking ?? true,
      blocksView: obs.blocksView ?? true,
      color: obs.color
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const useSiteMapStore = defineStore('siteMaps', () => {
  // State
  const siteMaps = ref<SiteMap[]>([])
  const activeSiteMapId = ref<string | null>(null)
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)

  // Initialize site map from JSON config
  async function initializeSiteMaps() {
    isLoading.value = true
    loadError.value = null

    try {
      const config = await loadSiteMapConfig()
      const configMap = transformConfigToSiteMap(config)
      siteMaps.value = [configMap]
      activeSiteMapId.value = configMap.id
    } catch (error) {
      console.error('[SiteMapStore] Failed to load site map configuration:', error)
      loadError.value = 'Failed to load site map configuration'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize on store creation
  initializeSiteMaps()

  const activeSiteMap = computed(() => {
    if (!activeSiteMapId.value) return null
    return siteMaps.value.find(map => map.id === activeSiteMapId.value) || null
  })

  const setActiveSiteMap = (mapId: string) => {
    activeSiteMapId.value = mapId
  }

  return {
    // State
    siteMaps,
    activeSiteMapId,
    activeSiteMap,
    isLoading,
    loadError,
    // Actions
    initializeSiteMaps,
    setActiveSiteMap,
  }
})
