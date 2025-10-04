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
      id: 'map-warehouse-main',
      name: 'Main Warehouse Floor',
      description: 'Primary warehouse area with loading docks and storage zones',
      width: 1200,
      height: 800,
      scale: 50,
      // Example walls demonstrating the wall tracing system
      // To add more walls: trace wall segments from the floorplan image,
      // measuring coordinates in pixels from the top-left corner (0,0)
      walls: [
        // External perimeter walls (thicker, white)
        { id: 'w-ext-1', start: { x: 50, y: 50 }, end: { x: 1150, y: 50 }, type: 'external', thickness: 6 },
        { id: 'w-ext-2', start: { x: 1150, y: 50 }, end: { x: 1150, y: 750 }, type: 'external', thickness: 6 },
        { id: 'w-ext-3', start: { x: 1150, y: 750 }, end: { x: 50, y: 750 }, type: 'external', thickness: 6 },
        { id: 'w-ext-4', start: { x: 50, y: 750 }, end: { x: 50, y: 50 }, type: 'external', thickness: 6 },

        // Internal walls dividing sections
        { id: 'w-int-1', start: { x: 400, y: 50 }, end: { x: 400, y: 400 }, type: 'internal', thickness: 4 },
        { id: 'w-int-2', start: { x: 800, y: 50 }, end: { x: 800, y: 400 }, type: 'internal', thickness: 4 },
        { id: 'w-int-3', start: { x: 50, y: 400 }, end: { x: 1150, y: 400 }, type: 'internal', thickness: 4 },

        // Doors (dashed lines for visual distinction)
        { id: 'w-door-1', start: { x: 400, y: 200 }, end: { x: 400, y: 250 }, type: 'door', thickness: 3 },
        { id: 'w-door-2', start: { x: 800, y: 200 }, end: { x: 800, y: 250 }, type: 'door', thickness: 3 },
        { id: 'w-door-3', start: { x: 550, y: 400 }, end: { x: 650, y: 400 }, type: 'door', thickness: 3 },
      ],
      cameras: [
        {
          cameraId: 'cam-01',
          x: 200,
          y: 150,
          rotation: 135,
          angle: 45,
          height: 4.5,
          fov: 90,
          viewDistance: 225,
          autoCalculateDistance: true,
          color: '#4ecca3',
          notes: 'Monitors main entrance and loading zone',
        },
        {
          cameraId: 'cam-02',
          x: 600,
          y: 400,
          rotation: 270,
          angle: 30,
          height: 5.0,
          fov: 110,
          viewDistance: 289,
          autoCalculateDistance: true,
          color: '#60a5fa',
          notes: 'Covers parking lot and external perimeter',
        },
        {
          cameraId: 'cam-03',
          x: 950,
          y: 200,
          rotation: 180,
          angle: 40,
          height: 6.0,
          fov: 80,
          viewDistance: 357,
          autoCalculateDistance: true,
          color: '#f87171',
          notes: 'Wide angle view of warehouse interior',
        },
        {
          cameraId: 'cam-04',
          x: 450,
          y: 650,
          rotation: 45,
          angle: 50,
          height: 4.0,
          fov: 95,
          viewDistance: 168,
          autoCalculateDistance: true,
          color: '#fbbf24',
          notes: 'Loading dock monitoring',
        },
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'map-office-building',
      name: 'Office Building - Ground Floor',
      description: 'Ground floor lobby and common areas',
      width: 1000,
      height: 700,
      scale: 50,
      walls: [], // Manually traced walls would be added here based on floorplan
      cameras: [
        {
          cameraId: 'cam-05',
          x: 300,
          y: 350,
          rotation: 90,
          angle: 35,
          height: 3.5,
          fov: 100,
          viewDistance: 250,
          autoCalculateDistance: true,
          color: '#8b5cf6',
          notes: 'Main lobby entrance',
        },
        {
          cameraId: 'cam-06',
          x: 700,
          y: 200,
          rotation: 225,
          angle: 40,
          height: 3.8,
          fov: 85,
          viewDistance: 227,
          autoCalculateDistance: true,
          color: '#ec4899',
          notes: 'Perimeter coverage - north side',
        },
      ],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15'),
    },
    {
      id: 'map-parking-lot',
      name: 'Employee Parking Lot',
      description: 'Outdoor parking area with vehicle detection zones',
      width: 1400,
      height: 900,
      scale: 50,
      walls: [], // Manually traced walls would be added here based on floorplan
      cameras: [
        {
          cameraId: 'cam-02',
          x: 400,
          y: 300,
          rotation: 0,
          angle: 55,
          height: 7.0,
          fov: 120,
          viewDistance: 245,
          autoCalculateDistance: true,
          color: '#60a5fa',
          notes: 'Overview of parking rows A-D',
        },
      ],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-10'),
    },
  ])

  const activeSiteMapId = ref<string>('map-warehouse-main')

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
  }
})
