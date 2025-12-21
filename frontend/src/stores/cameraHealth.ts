/**
 * Camera health store
 * Fetches and tracks camera health status from backend
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { config } from '@/config/environment'

export type CameraStatus = 'online' | 'stale' | 'offline' | 'unknown'

export interface CameraHealthStatus {
  cameraId: string
  lastFrameNumber: number
  lastSeenMs: number
  clockOffsetMs: number
  frameDropRate: number
  status: CameraStatus
}

export interface CameraHealthResponse {
  cameras: CameraHealthStatus[]
  timestamp: number
  error?: string
}

export const useCameraHealthStore = defineStore('cameraHealth', () => {
  const cameras = ref<Map<string, CameraHealthStatus>>(new Map())
  const lastFetched = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let fetchInterval: ReturnType<typeof setInterval> | null = null

  // Computed: all camera health statuses as array
  const allCameras = computed(() => Array.from(cameras.value.values()))

  // Computed: cameras grouped by status
  const onlineCameras = computed(() =>
    allCameras.value.filter(c => c.status === 'online')
  )
  const staleCameras = computed(() =>
    allCameras.value.filter(c => c.status === 'stale')
  )
  const offlineCameras = computed(() =>
    allCameras.value.filter(c => c.status === 'offline')
  )

  // Get health status for a specific camera
  function getCameraHealth(cameraId: string): CameraHealthStatus | undefined {
    return cameras.value.get(cameraId)
  }

  // Get status for a specific camera (with fallback)
  function getCameraStatus(cameraId: string): CameraStatus {
    return cameras.value.get(cameraId)?.status ?? 'unknown'
  }

  // Fetch camera health from backend
  async function fetchHealth(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const baseUrl = config.apiBaseUrl || 'http://localhost:3010'
      const response = await fetch(`${baseUrl}/api/cameras/health`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: CameraHealthResponse = await response.json()

      if (data.error) {
        error.value = data.error
      } else {
        // Update camera map
        const newMap = new Map<string, CameraHealthStatus>()
        for (const camera of data.cameras) {
          newMap.set(camera.cameraId, camera)
        }
        cameras.value = newMap
        lastFetched.value = data.timestamp
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch camera health'
      console.error('[CameraHealth] Fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Start periodic health polling
  function startPolling(intervalMs: number = 5000): void {
    if (fetchInterval) return

    // Fetch immediately
    fetchHealth()

    // Then poll periodically
    fetchInterval = setInterval(fetchHealth, intervalMs)
  }

  // Stop polling
  function stopPolling(): void {
    if (fetchInterval) {
      clearInterval(fetchInterval)
      fetchInterval = null
    }
  }

  return {
    // State
    cameras,
    lastFetched,
    isLoading,
    error,

    // Computed
    allCameras,
    onlineCameras,
    staleCameras,
    offlineCameras,

    // Actions
    getCameraHealth,
    getCameraStatus,
    fetchHealth,
    startPolling,
    stopPolling,
  }
})
