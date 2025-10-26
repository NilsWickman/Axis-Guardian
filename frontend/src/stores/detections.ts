// Detection events store
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { Detection, Track } from '../types/generated'
import type { ApiError } from '../types/errors'
import { detectionService } from '../api/services/detectionService'
import { DetectionWebSocketClient } from '../api/websocket/detection'
import { config } from '../config/environment'

// WebSocket client instance
const wsClient = new DetectionWebSocketClient()

export const useDetectionStore = defineStore('detections', () => {
  // State
  const detections = ref<Detection[]>([])
  const tracks = ref<Track[]>([])
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  const wsConnected = ref(false)

  // Filters
  const filters = ref({
    cameraId: '',
    type: '' as Detection['type'] | '',
    minConfidence: 0,
  })

  // WebSocket event handlers
  function initWebSocket() {
    // Only connect WebSocket when not in mock mode
    if (config.useMockData) {
      console.log('Detection WebSocket: Skipping connection (mock mode enabled)')
      return
    }

    wsClient.on('detection.new', (detection: Detection) => {
      // Add new detection to the beginning of the list
      detections.value.unshift(detection)
      // Keep only last 1000 detections in memory
      if (detections.value.length > 1000) {
        detections.value = detections.value.slice(0, 1000)
      }
    })

    wsClient.on('track.update', (track: Track) => {
      const index = tracks.value.findIndex((t) => t.trackId === track.trackId)
      if (index !== -1) {
        tracks.value[index] = track
      } else {
        tracks.value.push(track)
      }
    })

    wsClient.on('connected', () => {
      wsConnected.value = true
      console.log('Detection WebSocket connected')
    })

    wsClient.on('disconnected', () => {
      wsConnected.value = false
      console.log('Detection WebSocket disconnected')
    })

    wsClient.on('error', (err) => {
      console.error('Detection WebSocket error:', err)
    })

    // Connect to WebSocket
    wsClient.connect().catch((err) => {
      console.error('Failed to connect to Detection WebSocket:', err)
    })
  }

  // Initialize WebSocket on store creation
  initWebSocket()

  // Cleanup on unmount
  onUnmounted(() => {
    if (!config.useMockData) {
      wsClient.disconnect()
    }
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
      detections.value = await detectionService.getDetections({
        cameraId: options?.cameraId,
        limit: options?.limit,
      })
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTracks(cameraId?: string) {
    loading.value = true
    error.value = null
    try {
      tracks.value = await detectionService.getTracks({ cameraId })
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDetectionStats(cameraId?: string) {
    try {
      return await detectionService.getDetectionStats({ cameraId })
    } catch (err) {
      error.value = err as ApiError
      throw err
    }
  }

  function addDetection(detection: Detection) {
    detections.value.unshift(detection)
    // Keep only last 1000 detections
    if (detections.value.length > 1000) {
      detections.value = detections.value.slice(0, 1000)
    }
    return detection
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