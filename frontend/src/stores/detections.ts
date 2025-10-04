// Detection events store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Detection, Track } from '../types/generated'
import { mockDetections, mockTracks, addMockDetection, getDetectionsByCameraId } from '../mocks/data'

export const useDetectionStore = defineStore('detections', () => {
  // State
  const detections = ref<Detection[]>([...mockDetections])
  const tracks = ref<Track[]>([...mockTracks])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref({
    cameraId: '',
    type: '' as Detection['type'] | '',
    minConfidence: 0,
  })

  // Getters
  const recentDetections = computed(() =>
    [...detections.value].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50)
  )

  const filteredDetections = computed(() => {
    let result = [...detections.value]

    if (filters.value.cameraId) {
      result = result.filter((d) => d.cameraId === filters.value.cameraId)
    }

    if (filters.value.type) {
      result = result.filter((d) => d.type === filters.value.type)
    }

    if (filters.value.minConfidence > 0) {
      result = result.filter((d) => d.confidence >= filters.value.minConfidence)
    }

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  })

  const detectionCount = computed(() => detections.value.length)
  const activeTracksCount = computed(() => tracks.value.filter((t) => t.lastUpdate).length)

  // Actions
  async function fetchDetections(options?: { limit?: number; cameraId?: string }) {
    loading.value = true
    error.value = null
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      let result = [...mockDetections]

      if (options?.cameraId) {
        result = result.filter((d) => d.cameraId === options.cameraId)
      }

      if (options?.limit) {
        result = result.slice(0, options.limit)
      }

      detections.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch detections'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTracks() {
    loading.value = true
    error.value = null
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      tracks.value = [...mockTracks]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tracks'
      throw err
    } finally {
      loading.value = false
    }
  }

  function addDetection(detection: Omit<Detection, 'id' | 'timestamp'>) {
    const newDetection = addMockDetection(detection)
    detections.value.unshift(newDetection)
    return newDetection
  }

  function getDetectionsByCameraIdFromStore(cameraId: string): Detection[] {
    return detections.value.filter((d) => d.cameraId === cameraId)
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      cameraId: '',
      type: '',
      minConfidence: 0,
    }
  }

  return {
    // State
    detections,
    tracks,
    loading,
    error,
    filters,
    // Getters
    recentDetections,
    filteredDetections,
    detectionCount,
    activeTracksCount,
    // Actions
    fetchDetections,
    fetchTracks,
    addDetection,
    getDetectionsByCameraIdFromStore,
    setFilters,
    clearFilters,
  }
})