// Camera configurations store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Camera } from '../types/generated'
import type { ApiError } from '../types/errors'
import { cameraService } from '../api/services/cameraService'

export const useCameraStore = defineStore('cameras', () => {
  // State - Initialize with mock cameras for development
  const cameras = ref<Camera[]>([
    {
      id: 'camera1',
      name: 'Front Entrance',
      status: 'online',
      model: 'AXIS P3245-LVE',
      ip_address: '192.168.1.101',
      location: 'Building A - Front',
      stream_url: 'rtsp://localhost:8554/camera1',
      resolution: '1920x1080',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'camera2',
      name: 'Parking Lot',
      status: 'online',
      model: 'AXIS M3046-V',
      ip_address: '192.168.1.102',
      location: 'Building A - Parking',
      stream_url: 'rtsp://localhost:8554/camera2',
      resolution: '1920x1080',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'camera3',
      name: 'Back Entrance',
      status: 'online',
      model: 'AXIS P3245-LVE',
      ip_address: '192.168.1.103',
      location: 'Building A - Back',
      stream_url: 'rtsp://localhost:8554/camera3',
      resolution: '1920x1080',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'camera4',
      name: 'Loading Dock',
      status: 'online',
      model: 'AXIS Q1656-LE',
      ip_address: '192.168.1.104',
      location: 'Building B - Loading',
      stream_url: 'rtsp://localhost:8554/camera4',
      resolution: '2560x1440',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'camera5',
      name: 'Hallway West',
      status: 'online',
      model: 'AXIS M3046-V',
      ip_address: '192.168.1.105',
      location: 'Building A - Hallway',
      stream_url: 'rtsp://localhost:8554/camera5',
      resolution: '1920x1080',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'camera6',
      name: 'Hallway East',
      status: 'offline',
      model: 'AXIS M3046-V',
      ip_address: '192.168.1.106',
      location: 'Building A - Hallway',
      stream_url: 'rtsp://localhost:8554/camera6',
      resolution: '1920x1080',
      fps: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ])
  const selectedCameraId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  // Getters
  const onlineCameras = computed(() => cameras.value.filter((c) => c.status === 'online'))
  const offlineCameras = computed(() => cameras.value.filter((c) => c.status === 'offline'))
  const selectedCamera = computed(() =>
    selectedCameraId.value ? cameras.value.find((c) => c.id === selectedCameraId.value) : null
  )
  const cameraCount = computed(() => cameras.value.length)
  const onlineCount = computed(() => onlineCameras.value.length)

  // Actions
  function getCameraByIdFromStore(id: string): Camera | undefined {
    return cameras.value.find((c) => c.id === id)
  }

  function selectCamera(id: string) {
    selectedCameraId.value = id
  }

  function clearSelection() {
    selectedCameraId.value = null
  }

  async function fetchCameras() {
    loading.value = true
    error.value = null
    try {
      cameras.value = await cameraService.getCameras()
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateCameraStatus(id: string, status: Camera['status']) {
    const camera = cameras.value.find((c) => c.id === id)
    if (camera) {
      camera.status = status
    }
  }

  function filterByStatus(status: Camera['status']): Camera[] {
    return cameras.value.filter((c) => c.status === status)
  }

  return {
    // State
    cameras,
    selectedCameraId,
    loading,
    error,
    // Getters
    onlineCameras,
    offlineCameras,
    selectedCamera,
    cameraCount,
    onlineCount,
    // Actions
    getCameraByIdFromStore,
    selectCamera,
    clearSelection,
    fetchCameras,
    updateCameraStatus,
    filterByStatus,
  }
})