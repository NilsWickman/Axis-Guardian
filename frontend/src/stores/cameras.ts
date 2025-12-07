// Camera configurations store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Camera } from '../types/generated'
import type { ApiError } from '../types/errors'
import { cameraService } from '../api/services/cameraService'
import { loadSiteMapConfig, type SiteMapConfigCamera } from '../utils/siteMapConfigLoader'

/**
 * Transform config camera to Camera type
 */
function transformConfigToCamera(configCamera: SiteMapConfigCamera): Camera {
  return {
    id: configCamera.id,
    name: configCamera.name,
    rtspUrl: configCamera.rtspUrl,
    status: 'online', // Default status, updated by WebSocket
    model: configCamera.model,
    ipAddress: configCamera.ipAddress,
    position: {
      x: configCamera.position.x,
      y: configCamera.position.y,
      z: configCamera.height,
      azimuth: configCamera.azimuth
    }
  }
}

export const useCameraStore = defineStore('cameras', () => {
  // State - Start empty, populated from JSON config
  const cameras = ref<Camera[]>([])
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

  /**
   * Initialize cameras from JSON config (single source of truth)
   */
  async function initializeFromConfig() {
    loading.value = true
    error.value = null
    try {
      const config = await loadSiteMapConfig()
      cameras.value = config.cameras.map(transformConfigToCamera)
      console.log('[CameraStore] Initialized from config:', cameras.value.length, 'cameras')
    } catch (err) {
      console.error('[CameraStore] Failed to initialize from config:', err)
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
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
    initializeFromConfig,
  }
})