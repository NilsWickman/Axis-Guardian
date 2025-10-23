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
      name: 'Site Map 2',
      description: 'Residential apartment with kitchen, living areas, and bedrooms',
      width: 795,
      height: 1011,
      scale: 80, // Approximately 80 pixels per meter based on 6m width
      walls: [
        // External perimeter walls
        { id: 'w-ext-1', start: { x: 60, y: 60 }, end: { x: 735, y: 60 }, type: 'external', thickness: 6 },
        { id: 'w-ext-2', start: { x: 735, y: 60 }, end: { x: 735, y: 950 }, type: 'external', thickness: 6 },
        { id: 'w-ext-3', start: { x: 735, y: 950 }, end: { x: 60, y: 950 }, type: 'external', thickness: 6 },
        { id: 'w-ext-4', start: { x: 60, y: 950 }, end: { x: 60, y: 60 }, type: 'external', thickness: 6 },

        // Vertical divider between living area and bedroom
        { id: 'w-int-1', start: { x: 60, y: 290 }, end: { x: 150, y: 290 }, type: 'internal', thickness: 4 },
        { id: 'w-int-2', start: { x: 350, y: 60 }, end: { x: 350, y: 290 }, type: 'internal', thickness: 4 },

        // Horizontal wall separating upper and middle sections
        { id: 'w-int-3', start: { x: 60, y: 290 }, end: { x: 540, y: 290 }, type: 'internal', thickness: 4 },

        // Kitchen/stairs area walls
        { id: 'w-int-4', start: { x: 280, y: 290 }, end: { x: 280, y: 615 }, type: 'internal', thickness: 4 },
        { id: 'w-int-5', start: { x: 540, y: 290 }, end: { x: 540, y: 615 }, type: 'internal', thickness: 4 },

        // Bottom section horizontal divider
        { id: 'w-int-6', start: { x: 60, y: 615 }, end: { x: 735, y: 615 }, type: 'internal', thickness: 4 },

        // Bathroom walls
        { id: 'w-int-7', start: { x: 60, y: 750 }, end: { x: 350, y: 750 }, type: 'internal', thickness: 4 },
        { id: 'w-int-8', start: { x: 350, y: 750 }, end: { x: 350, y: 950 }, type: 'internal', thickness: 4 },

        // Bedroom divider
        { id: 'w-int-9', start: { x: 540, y: 615 }, end: { x: 540, y: 750 }, type: 'internal', thickness: 4 },
      ],
      cameras: [
        {
          cameraId: 'cam-01',
          x: 120, y: 120,
          rotation: 135,
          angle: 35,
          height: 2.4,
          fov: 90,
          viewDistance: 150,
          autoCalculateDistance: true,
          color: 'emerald-400',
          notes: 'Living room corner view',
        },
        {
          cameraId: 'cam-02',
          x: 650, y: 150,
          rotation: 225,
          angle: 35,
          height: 2.4,
          fov: 100,
          viewDistance: 160,
          autoCalculateDistance: true,
          color: 'blue-500',
          notes: 'Bedroom entrance coverage',
        },
        {
          cameraId: 'cam-03',
          x: 400, y: 450,
          rotation: 180,
          angle: 40,
          height: 2.6,
          fov: 110,
          viewDistance: 140,
          autoCalculateDistance: true,
          color: 'red-500',
          notes: 'Hallway and stairs monitoring',
        },
        {
          cameraId: 'cam-04',
          x: 200, y: 850,
          rotation: 90,
          angle: 35,
          height: 2.4,
          fov: 95,
          viewDistance: 130,
          autoCalculateDistance: true,
          color: 'amber-400',
          notes: 'Bathroom and bedroom area',
        },
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-20'),
    },
    {
      id: 'map-office-building',
      name: 'Site Map 1',
      description: 'Ground floor with offices, conference rooms, and stairwell',
      width: 700,
      height: 612,
      scale: 60,
      walls: [
        // External perimeter
        { id: 'w-ext-1', start: { x: 20, y: 20 }, end: { x: 680, y: 20 }, type: 'external', thickness: 6 },
        { id: 'w-ext-2', start: { x: 680, y: 20 }, end: { x: 680, y: 592 }, type: 'external', thickness: 6 },
        { id: 'w-ext-3', start: { x: 680, y: 592 }, end: { x: 20, y: 592 }, type: 'external', thickness: 6 },
        { id: 'w-ext-4', start: { x: 20, y: 592 }, end: { x: 20, y: 20 }, type: 'external', thickness: 6 },

        // Stairwell walls (left side)
        { id: 'w-int-1', start: { x: 20, y: 110 }, end: { x: 140, y: 110 }, type: 'internal', thickness: 4 },
        { id: 'w-int-2', start: { x: 140, y: 110 }, end: { x: 140, y: 380 }, type: 'internal', thickness: 4 },
        { id: 'w-int-3', start: { x: 140, y: 380 }, end: { x: 20, y: 380 }, type: 'internal', thickness: 4 },

        // Central corridor walls
        { id: 'w-int-4', start: { x: 140, y: 200 }, end: { x: 420, y: 200 }, type: 'internal', thickness: 4 },
        { id: 'w-int-5', start: { x: 140, y: 380 }, end: { x: 420, y: 380 }, type: 'internal', thickness: 4 },

        // Right section dividers
        { id: 'w-int-6', start: { x: 420, y: 20 }, end: { x: 420, y: 200 }, type: 'internal', thickness: 4 },
        { id: 'w-int-7', start: { x: 420, y: 380 }, end: { x: 420, y: 592 }, type: 'internal', thickness: 4 },
        { id: 'w-int-8', start: { x: 550, y: 200 }, end: { x: 550, y: 380 }, type: 'internal', thickness: 4 },

        // Top room dividers
        { id: 'w-int-9', start: { x: 320, y: 20 }, end: { x: 320, y: 100 }, type: 'internal', thickness: 4 },
      ],
      cameras: [
        {
          cameraId: 'cam-05',
          x: 80, y: 240,
          rotation: 90,
          angle: 30,
          height: 2.8,
          fov: 90,
          viewDistance: 120,
          autoCalculateDistance: true,
          color: 'purple-500',
          notes: 'Stairwell monitoring',
        },
        {
          cameraId: 'cam-06',
          x: 600, y: 100,
          rotation: 225,
          angle: 35,
          height: 2.8,
          fov: 100,
          viewDistance: 140,
          autoCalculateDistance: true,
          color: 'pink-500',
          notes: 'Upper office corridor',
        },
      ],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-15'),
    },
    {
      id: 'map-parking-lot',
      name: 'Site Map 3',
      description: 'Main floor with bedrooms, kitchen, family room, and bathroom',
      width: 2732,
      height: 1908,
      scale: 105, // Approximately 105 pixels per meter based on 26' (~8m) width
      walls: [
        // External perimeter (black thick walls in the image)
        { id: 'w-ext-1', start: { x: 410, y: 145 }, end: { x: 2280, y: 145 }, type: 'external', thickness: 8 },
        { id: 'w-ext-2', start: { x: 2280, y: 145 }, end: { x: 2280, y: 1420 }, type: 'external', thickness: 8 },
        { id: 'w-ext-3', start: { x: 2280, y: 1420 }, end: { x: 410, y: 1420 }, type: 'external', thickness: 8 },
        { id: 'w-ext-4', start: { x: 410, y: 1420 }, end: { x: 410, y: 145 }, type: 'external', thickness: 8 },

        // Front porch extension
        { id: 'w-ext-5', start: { x: 410, y: 1420 }, end: { x: 410, y: 1660 }, type: 'external', thickness: 8 },
        { id: 'w-ext-6', start: { x: 410, y: 1660 }, end: { x: 2280, y: 1660 }, type: 'external', thickness: 8 },
        { id: 'w-ext-7', start: { x: 2280, y: 1660 }, end: { x: 2280, y: 1420 }, type: 'external', thickness: 8 },

        // Bathroom divider (left side)
        { id: 'w-int-1', start: { x: 410, y: 280 }, end: { x: 800, y: 280 }, type: 'internal', thickness: 5 },
        { id: 'w-int-2', start: { x: 800, y: 280 }, end: { x: 800, y: 680 }, type: 'internal', thickness: 5 },
        { id: 'w-int-3', start: { x: 800, y: 680 }, end: { x: 410, y: 680 }, type: 'internal', thickness: 5 },

        // Bedroom #1 walls
        { id: 'w-int-4', start: { x: 800, y: 145 }, end: { x: 800, y: 420 }, type: 'internal', thickness: 5 },
        { id: 'w-int-5', start: { x: 800, y: 420 }, end: { x: 1220, y: 420 }, type: 'internal', thickness: 5 },

        // Vertical divider to master bedroom
        { id: 'w-int-6', start: { x: 1220, y: 145 }, end: { x: 1220, y: 680 }, type: 'internal', thickness: 5 },

        // Stairs area wall
        { id: 'w-int-7', start: { x: 1220, y: 680 }, end: { x: 1660, y: 680 }, type: 'internal', thickness: 5 },
        { id: 'w-int-8', start: { x: 1660, y: 420 }, end: { x: 1660, y: 1020 }, type: 'internal', thickness: 5 },

        // Kitchen/dining divider
        { id: 'w-int-9', start: { x: 410, y: 1020 }, end: { x: 1010, y: 1020 }, type: 'internal', thickness: 5 },
        { id: 'w-int-10', start: { x: 1010, y: 1020 }, end: { x: 1010, y: 1420 }, type: 'internal', thickness: 5 },
      ],
      cameras: [
        {
          cameraId: 'cam-02',
          x: 900, y: 800,
          rotation: 90,
          angle: 40,
          height: 2.4,
          fov: 110,
          viewDistance: 200,
          autoCalculateDistance: true,
          color: 'blue-500',
          notes: 'Hallway and family room entrance',
        },
        {
          cameraId: 'cam-05',
          x: 2150, y: 300,
          rotation: 225,
          angle: 35,
          height: 2.4,
          fov: 95,
          viewDistance: 180,
          autoCalculateDistance: true,
          color: 'purple-500',
          notes: 'Master bedroom coverage',
        },
        {
          cameraId: 'cam-06',
          x: 700, y: 1280,
          rotation: 45,
          angle: 38,
          height: 2.4,
          fov: 100,
          viewDistance: 190,
          autoCalculateDistance: true,
          color: 'pink-500',
          notes: 'Kitchen and dining area',
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
