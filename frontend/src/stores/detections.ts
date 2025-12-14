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

// Resource limits to prevent memory exhaustion
const MAX_DETECTIONS = 1000
const MAX_TRACKS = 500

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

  // Mock detection generator for simulating live detections
  let mockDetectionInterval: ReturnType<typeof setInterval> | null = null

  function startMockDetectionGenerator() {
    if (mockDetectionInterval) return

    console.log('[DetectionStore] Starting mock detection generator')

    // Generate initial detections
    generateMockDetections()

    // Generate new detections every 2 seconds
    mockDetectionInterval = setInterval(() => {
      generateMockDetections()
    }, 2000)
  }

  function generateMockDetections() {
    const cameras = ['camera1', 'camera2']
    const now = new Date().toISOString()

    cameras.forEach((cameraId, cameraIndex) => {
      // Generate 1-2 person detections per camera
      const numDetections = Math.floor(Math.random() * 2) + 1

      for (let i = 0; i < numDetections; i++) {
        const trackId = cameraIndex * 10 + i + 1 // Consistent track IDs per camera

        // Generate bbox in normalized-ish range (simulating person positions)
        // These will be converted to world coordinates by the tracking system
        const baseX = 0.2 + Math.random() * 0.6 // 0.2-0.8 range
        const baseY = 0.3 + Math.random() * 0.4 // 0.3-0.7 range
        const width = 0.05 + Math.random() * 0.05
        const height = 0.15 + Math.random() * 0.1

        const detection: Detection = {
          id: `mock-${cameraId}-${Date.now()}-${i}`,
          timestamp: now,
          cameraId,
          type: 'person',
          confidence: 0.85 + Math.random() * 0.1,
          bbox: {
            x: baseX * 1920, // Scale to pixel coordinates
            y: baseY * 1080,
            width: width * 1920,
            height: height * 1080,
          },
          trackId: trackId,
        }

        addDetection(detection)
      }
    })
  }

  function stopMockDetectionGenerator() {
    if (mockDetectionInterval) {
      clearInterval(mockDetectionInterval)
      mockDetectionInterval = null
    }
  }

  // WebSocket event handlers
  function initWebSocket() {
    // In mock mode, start mock detection generator instead of WebSocket
    if (config.useMockData) {
      console.log('Detection WebSocket: Skipping connection (mock mode enabled)')
      startMockDetectionGenerator()
      return
    }

    wsClient.on('detection.new', (detection: Detection) => {
      // Add new detection to the beginning of the list
      detections.value.unshift(detection)
      // Keep only last MAX_DETECTIONS in memory
      if (detections.value.length > MAX_DETECTIONS) {
        detections.value = detections.value.slice(0, MAX_DETECTIONS)
      }
    })

    wsClient.on('track.update', (track: Track) => {
      const index = tracks.value.findIndex((t) => t.trackId === track.trackId)
      if (index !== -1) {
        tracks.value[index] = track
      } else {
        tracks.value.push(track)
        // Trim tracks array to prevent unbounded growth
        if (tracks.value.length > MAX_TRACKS) {
          tracks.value = tracks.value.slice(-MAX_TRACKS)
        }
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
    if (config.useMockData) {
      stopMockDetectionGenerator()
    } else {
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
    // Keep only last MAX_DETECTIONS
    if (detections.value.length > MAX_DETECTIONS) {
      detections.value = detections.value.slice(0, MAX_DETECTIONS)
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
    fetchDetectionStats,
    addDetection,
    getDetectionsByCameraIdFromStore,
    setFilters,
    clearFilters,
  }
})