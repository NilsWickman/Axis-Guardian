import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CameraPlacement {
  cameraId: string
  x: number
  y: number
  rotation: number
  angle: number
  height: number
  fov: number
  viewDistance: number
  autoCalculateDistance: boolean
  color: string
  notes?: string
}

export interface Wall {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  type?: 'external' | 'internal' | 'door'
  thickness?: number
}

export interface SiteMap {
  id: string
  name: string
  description?: string
  imagePath?: string
  width: number
  height: number
  scale: number // pixels per meter
  cameras: CameraPlacement[]
  walls: Wall[]
  createdAt: Date
  updatedAt: Date
}

export const useSiteMapStore = defineStore('siteMaps', () => {
  const siteMaps = ref<SiteMap[]>([
    {
      id: 'map-auditorium',
      name: 'Auditorium - Main Hall',
      description: 'UCLA Auditorium with 4-camera multi-view tracking setup (21m x 28m)',
      width: 1260, // 21m * 60 pixels/meter
      height: 1680, // 28m * 60 pixels/meter
      scale: 60, // 60 pixels per meter
      walls: [
        // External perimeter walls
        { id: 'w-ext-1', start: { x: 60, y: 60 }, end: { x: 1200, y: 60 }, type: 'external', thickness: 8 },
        { id: 'w-ext-2', start: { x: 1200, y: 60 }, end: { x: 1200, y: 1620 }, type: 'external', thickness: 8 },
        { id: 'w-ext-3', start: { x: 1200, y: 1620 }, end: { x: 60, y: 1620 }, type: 'external', thickness: 8 },
        { id: 'w-ext-4', start: { x: 60, y: 1620 }, end: { x: 60, y: 60 }, type: 'external', thickness: 8 },

        // Stage area (front of auditorium, 0-3m depth)
        { id: 'w-stage-1', start: { x: 60, y: 240 }, end: { x: 1200, y: 240 }, type: 'internal', thickness: 4 },

        // Seating area dividers (approximate rows)
        { id: 'w-aisle-1', start: { x: 420, y: 240 }, end: { x: 420, y: 1620 }, type: 'internal', thickness: 3 },
        { id: 'w-aisle-2', start: { x: 840, y: 240 }, end: { x: 840, y: 1620 }, type: 'internal', thickness: 3 },
      ],
      cameras: [
        {
          cameraId: 'camera1',
          x: 1033, // 16.22m * 60 + 60 (offset)
          y: 78,   // 0.3m * 60 + 60 (offset)
          rotation: 18, // Azimuth angle
          angle: 1,     // Elevation angle (positive = looking slightly up)
          height: 1.68,
          fov: 90,
          viewDistance: 240, // ~4m viewing distance at 60px/m
          autoCalculateDistance: true,
          color: 'emerald-400',
          notes: 'High Corner View 3 - Front-Right position covering stage area',
        },
        {
          cameraId: 'camera2',
          x: 114,  // 0.9m * 60 + 60
          y: 90,   // 0.5m * 60 + 60
          rotation: 313, // Azimuth angle (northwest)
          angle: -5,     // Elevation angle (negative = looking slightly down)
          height: 1.67,
          fov: 90,
          viewDistance: 240,
          autoCalculateDistance: true,
          color: 'blue-500',
          notes: 'High Corner View 4 - Front-Left position with downward angle',
        },
        {
          cameraId: 'camera3',
          x: 1296,  // 20.6m * 60 + 60
          y: 1758,  // 28.31m * 60 + 60
          rotation: 140, // Azimuth angle (southeast)
          angle: -9,     // Elevation angle (looking down from highest mount)
          height: 2.62,  // Tallest camera mounting
          fov: 90,
          viewDistance: 300, // Longer distance from elevated position
          autoCalculateDistance: true,
          color: 'red-500',
          notes: 'IP Camera View 2 - Back-Right elevated position (highest mount at 2.62m)',
        },
        {
          cameraId: 'camera4',
          x: 694,   // 10.57m * 60 + 60
          y: 1039,  // 16.31m * 60 + 60
          rotation: 339, // Azimuth angle (nearly north)
          angle: 0,      // Elevation angle (level)
          height: 1.84,
          fov: 90,
          viewDistance: 270,
          autoCalculateDistance: true,
          color: 'amber-400',
          notes: 'IP Camera View 5 - Center-Back position with level view angle',
        },
      ],
      createdAt: new Date('2025-01-26'),
      updatedAt: new Date('2025-01-26'),
    },
  ])

  const activeSiteMapId = ref<string>('map-auditorium')

  const activeSiteMap = computed(() =>
    siteMaps.value.find(map => map.id === activeSiteMapId.value) || siteMaps.value[0]
  )

  const setActiveSiteMap = (mapId: string) => {
    activeSiteMapId.value = mapId
  }

  const addSiteMap = (siteMap: Omit<SiteMap, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMap: SiteMap = {
      ...siteMap,
      id: `map-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
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
  }
})
