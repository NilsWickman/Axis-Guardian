import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UnitValue } from '../utils/siteMapConversion'
import { RENDER_SCALE, createMeterUnit, createDegreeUnit } from '../utils/siteMapConversion'

export interface CameraPlacement {
  cameraId: string
  position: {
    x: UnitValue
    y: UnitValue
  }
  rotation: UnitValue
  angle: UnitValue
  height: UnitValue
  fov: UnitValue
  viewDistance: UnitValue
  autoCalculateDistance: boolean
  color: string
  notes?: string
}

export interface Wall {
  id: string
  start: {
    x: UnitValue
    y: UnitValue
  }
  end: {
    x: UnitValue
    y: UnitValue
  }
  type?: 'external' | 'internal' | 'door'
}

export interface SiteMap {
  id: string
  name: string
  description?: string
  imagePath?: string
  width: UnitValue
  height: UnitValue
  renderScale: number // Fixed at 100 pixels per meter
  cameras: CameraPlacement[]
  walls: Wall[]
  createdAt: Date
  updatedAt: Date
}

export const useSiteMapStore = defineStore('siteMaps', () => {
  console.log('[SiteMapStore] Initializing store')
  const siteMaps = ref<SiteMap[]>([])

  const activeSiteMapId = ref<string | null>(null)
  console.log('[SiteMapStore] Initial activeSiteMapId:', activeSiteMapId.value)
  console.log('[SiteMapStore] Initial siteMaps count:', siteMaps.value.length)

  const activeSiteMap = computed(() => {
    if (!activeSiteMapId.value) return null
    return siteMaps.value.find(map => map.id === activeSiteMapId.value) || null
  })

  const setActiveSiteMap = (mapId: string) => {
    console.log(`[SiteMapStore] setActiveSiteMap called: ${activeSiteMapId.value} -> ${mapId}`)
    console.trace() // Show the call stack
    activeSiteMapId.value = mapId
  }

  const addSiteMap = (siteMap: Omit<SiteMap, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMap: SiteMap = {
      ...siteMap,
      id: `map-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    console.log('[SiteMapStore] addSiteMap called - creating new map:', newMap.id)
    console.trace()
    siteMaps.value.push(newMap)
    return newMap
  }

  const updateSiteMap = (mapId: string, updates: Partial<SiteMap>) => {
    const index = siteMaps.value.findIndex(map => map.id === mapId)
    if (index !== -1) {
      siteMaps.value[index] = {
        ...siteMaps.value[index],
        ...updates,
        updatedAt: new Date(),
      }
    }
  }

  const deleteSiteMap = (mapId: string) => {
    siteMaps.value = siteMaps.value.filter(map => map.id !== mapId)
  }

  const updateCameraPlacement = (mapId: string, cameraId: string, placement: CameraPlacement) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      const cameraIndex = map.cameras.findIndex(c => c.cameraId === cameraId)
      if (cameraIndex !== -1) {
        map.cameras[cameraIndex] = placement
      } else {
        map.cameras.push(placement)
      }
      map.updatedAt = new Date()
    }
  }

  const removeCameraPlacement = (mapId: string, cameraId: string) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      map.cameras = map.cameras.filter(c => c.cameraId !== cameraId)
      map.updatedAt = new Date()
    }
  }

  const addCameraToSiteMap = (mapId: string, placement: CameraPlacement) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      map.cameras.push(placement)
      map.updatedAt = new Date()
    }
  }

  const addWallToSiteMap = (mapId: string, wall: Wall) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      map.walls.push(wall)
      map.updatedAt = new Date()
    }
  }

  const updateWallInSiteMap = (mapId: string, wall: Wall) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      const wallIndex = map.walls.findIndex(w => w.id === wall.id)
      if (wallIndex !== -1) {
        map.walls[wallIndex] = wall
        map.updatedAt = new Date()
      }
    }
  }

  const removeWallFromSiteMap = (mapId: string, wallId: string) => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (map) {
      map.walls = map.walls.filter(w => w.id !== wallId)
      map.updatedAt = new Date()
    }
  }

  /**
   * Export a site map to JSON string with proper formatting
   */
  const exportSiteMapToJSON = (mapId: string): string => {
    const map = siteMaps.value.find(m => m.id === mapId)
    if (!map) {
      throw new Error(`Site map with ID "${mapId}" not found`)
    }

    // Create a serializable copy (dates will be converted to ISO strings)
    const exportData = {
      ...map,
      createdAt: map.createdAt.toISOString(),
      updatedAt: map.updatedAt.toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Download a site map as a JSON file
   */
  const downloadSiteMapJSON = (mapId: string, filename?: string) => {
    try {
      const json = exportSiteMapToJSON(mapId)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      const map = siteMaps.value.find(m => m.id === mapId)
      const safeName = (map?.name || mapId).replace(/[^a-z0-9]/gi, '-').toLowerCase()
      link.href = url
      link.download = filename || `sitemap-${safeName}-${Date.now()}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download site map:', error)
      throw error
    }
  }

  /**
   * Import a site map from JSON string
   */
  const importSiteMapFromJSON = (jsonString: string): SiteMap => {
    try {
      const data = JSON.parse(jsonString)

      // Validate required fields
      if (!data.id || !data.name || !data.width || !data.height) {
        throw new Error('Invalid site map format: missing required fields')
      }

      // Convert date strings back to Date objects
      const siteMap: SiteMap = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        renderScale: data.renderScale || RENDER_SCALE // Default to current scale if missing
      }

      // Check if a map with this ID already exists
      const existingIndex = siteMaps.value.findIndex(m => m.id === siteMap.id)
      if (existingIndex !== -1) {
        // Update existing map
        siteMaps.value[existingIndex] = siteMap
      } else {
        // Add as new map
        siteMaps.value.push(siteMap)
      }

      return siteMap
    } catch (error) {
      console.error('Failed to import site map:', error)
      throw error
    }
  }

  /**
   * Import site map from a File object
   */
  const importSiteMapFromFile = (file: File): Promise<SiteMap> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string
          const siteMap = importSiteMapFromJSON(jsonString)
          resolve(siteMap)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  return {
    siteMaps,
    activeSiteMapId,
    activeSiteMap,
    setActiveSiteMap,
    addSiteMap,
    updateSiteMap,
    deleteSiteMap,
    updateCameraPlacement,
    removeCameraPlacement,
    addCameraToSiteMap,
    addWallToSiteMap,
    updateWallInSiteMap,
    removeWallFromSiteMap,
    exportSiteMapToJSON,
    downloadSiteMapJSON,
    importSiteMapFromJSON,
    importSiteMapFromFile,
  }
})
