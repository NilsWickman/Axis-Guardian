// Camera configurations store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Camera } from '../types/generated'
import { mockCameras, getCameraById, getCamerasByStatus } from '../mocks/data'

export const useCameraStore = defineStore('cameras', () => {
  // State
  const cameras = ref<Camera[]>([...mockCameras])
  const selectedCameraId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      cameras.value = [...mockCameras]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch cameras'
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