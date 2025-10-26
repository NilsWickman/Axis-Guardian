/**
 * Global Camera Connection Manager
 *
 * Maintains persistent WebRTC connections to all cameras across the entire application.
 * Connections are established once and reused across all views for instant loading.
 */

import { ref, reactive, computed, onUnmounted, watch } from 'vue'
import { useWebRTCDetection, type DetectionMetadata } from './useWebRTCDetection'
import type { Detection } from '@/types/detection.types'

interface Camera {
  id: string
  name: string
}

interface CameraConnection {
  connection: ReturnType<typeof useWebRTCDetection>
  videoElement: HTMLVideoElement | null
  isConnected: boolean
  latestMetadata: DetectionMetadata | null
}

// Global state (singleton pattern - shared across all components)
const cameraConnections = reactive<Record<string, CameraConnection>>({})
const isInitialized = ref(false)
const isInitializing = ref(false)

// Available cameras
const cameras = ref<Camera[]>([
  { id: 'camera1', name: 'Camera 1 - Auditorium HC3' },
  { id: 'camera2', name: 'Camera 2 - Auditorium HC4' },
  { id: 'camera3', name: 'Camera 3 - Auditorium IP2' },
  { id: 'camera4', name: 'Camera 4 - Auditorium IP5' }
])

// Video synchronization state
let syncMonitorInterval: number | null = null
const SYNC_CHECK_INTERVAL = 2000 // Check sync every 2 seconds
const MAX_SYNC_DRIFT = 0.5 // Maximum allowed drift in seconds before correction (reduced from 1.0)
const SYNC_ENABLED = true // Enable/disable sync monitoring
let syncCorrectionCount = 0 // Track number of corrections for debugging

/**
 * Initialize all camera connections in the background
 * This is called automatically on first use
 */
async function initializeConnections() {
  if (isInitialized.value || isInitializing.value) {
    return
  }

  isInitializing.value = true

  try {
    // Create connections for all cameras
    await Promise.all(cameras.value.map(async (camera) => {
      if (cameraConnections[camera.id]) {
        return
      }

      // Create a hidden video element for this connection
      const videoElement = document.createElement('video')
      videoElement.autoplay = true
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.style.display = 'none'
      document.body.appendChild(videoElement)

      // Create WebRTC connection
      const connection = useWebRTCDetection(camera.id, {
        signalingUrl: 'http://localhost:8080',
        autoReconnect: true,
        reconnectDelay: 3000
      })

      // Store connection info
      cameraConnections[camera.id] = {
        connection,
        videoElement,
        isConnected: false,
        latestMetadata: null
      }

      // Set up detection callback to store latest metadata
      connection.setDetectionCallback((metadata) => {
        cameraConnections[camera.id].latestMetadata = metadata
      })

      // Monitor connection state
      const stateInterval = setInterval(() => {
        cameraConnections[camera.id].isConnected =
          connection.connectionState.value === 'connected'
      }, 100)

      // Connect WebRTC
      try {
        await connection.connect(videoElement)
      } catch (error) {
        console.error(`[ConnectionManager] Failed to connect ${camera.id}:`, error)
        clearInterval(stateInterval)
      }
    }))

    isInitialized.value = true

    // Start video synchronization monitoring
    if (SYNC_ENABLED) {
      startSyncMonitoring()
    }
  } catch (error) {
    console.error('[ConnectionManager] Failed to initialize connections:', error)
  } finally {
    isInitializing.value = false
  }
}

/**
 * Get connection for a specific camera
 */
function getConnection(cameraId: string): CameraConnection | null {
  return cameraConnections[cameraId] || null
}

/**
 * Get all connections
 */
function getAllConnections(): Record<string, CameraConnection> {
  return cameraConnections
}

/**
 * Get video stream for a camera
 */
function getVideoStream(cameraId: string): MediaStream | null {
  const conn = cameraConnections[cameraId]
  if (!conn?.videoElement?.srcObject) return null
  return conn.videoElement.srcObject as MediaStream
}

/**
 * Attach a camera stream to a video element
 */
function attachToVideoElement(cameraId: string, videoElement: HTMLVideoElement): boolean {
  const stream = getVideoStream(cameraId)
  if (!stream) {
    return false
  }

  videoElement.srcObject = stream
  videoElement.play().catch(e =>
    console.error(`[ConnectionManager] Error playing video for ${cameraId}:`, e)
  )
  return true
}

/**
 * Check if connections are ready
 */
function areConnectionsReady(): boolean {
  return isInitialized.value && Object.values(cameraConnections).length > 0
}

/**
 * Get connection status for all cameras
 */
function getConnectionStatuses(): Record<string, boolean> {
  const statuses: Record<string, boolean> = {}
  for (const [id, conn] of Object.entries(cameraConnections)) {
    statuses[id] = conn.isConnected
  }
  return statuses
}

/**
 * Start monitoring video synchronization across all cameras
 */
function startSyncMonitoring() {
  if (syncMonitorInterval !== null) {
    return // Already monitoring
  }

  console.log('[ConnectionManager] Starting video synchronization monitoring')

  syncMonitorInterval = window.setInterval(() => {
    synchronizeVideos()
  }, SYNC_CHECK_INTERVAL)
}

/**
 * Stop monitoring video synchronization
 */
function stopSyncMonitoring() {
  if (syncMonitorInterval !== null) {
    clearInterval(syncMonitorInterval)
    syncMonitorInterval = null
    console.log('[ConnectionManager] Stopped video synchronization monitoring')
  }
}

/**
 * Synchronize all video elements to prevent drift
 */
function synchronizeVideos() {
  const videoElements: Array<{ id: string; element: HTMLVideoElement; currentTime: number }> = []

  // Collect all video elements with their current playback positions
  for (const [id, conn] of Object.entries(cameraConnections)) {
    if (!conn.videoElement || !conn.isConnected) {
      continue
    }

    const video = conn.videoElement

    // Skip if video is not playing or doesn't have valid time
    if (video.paused || video.readyState < 2 || isNaN(video.currentTime)) {
      continue
    }

    videoElements.push({
      id,
      element: video,
      currentTime: video.currentTime
    })
  }

  // Need at least 2 videos to synchronize
  if (videoElements.length < 2) {
    return
  }

  // Find the video that's furthest ahead (reference point)
  // We sync all videos to the most advanced one to avoid rewinding
  const referenceVideo = videoElements.reduce((max, current) =>
    current.currentTime > max.currentTime ? current : max
  )

  // Log sync status every 10 checks (every 20 seconds)
  if (syncCorrectionCount % 10 === 0) {
    const drifts = videoElements
      .map(v => `${v.id}=${v.currentTime.toFixed(2)}s`)
      .join(', ')
    console.log(`[ConnectionManager] Sync check - Times: ${drifts}`)
  }

  // Check each video against the reference
  for (const video of videoElements) {
    if (video.id === referenceVideo.id) {
      continue // Skip the reference video
    }

    const drift = referenceVideo.currentTime - video.currentTime

    // If drift exceeds threshold, adjust the lagging video
    if (Math.abs(drift) > MAX_SYNC_DRIFT) {
      syncCorrectionCount++
      console.warn(
        `[ConnectionManager] ⚠️ Sync drift #${syncCorrectionCount}: ${video.id} is ${drift.toFixed(2)}s ${drift > 0 ? 'behind' : 'ahead of'} ${referenceVideo.id}, correcting...`
      )

      // Jump to the reference time (seek to live edge)
      try {
        video.element.currentTime = referenceVideo.currentTime
        console.log(`[ConnectionManager] ✓ Synced ${video.id} to ${referenceVideo.currentTime.toFixed(2)}s`)
      } catch (error) {
        console.error(`[ConnectionManager] ✗ Failed to sync ${video.id}:`, error)
      }
    }
  }
}

/**
 * Cleanup all connections (call on app unmount)
 */
function cleanup() {
  // Stop sync monitoring
  stopSyncMonitoring()

  for (const [id, conn] of Object.entries(cameraConnections)) {
    conn.connection.disconnect()
    if (conn.videoElement) {
      conn.videoElement.remove()
    }
  }

  // Clear connections
  Object.keys(cameraConnections).forEach(key => {
    delete cameraConnections[key]
  })

  isInitialized.value = false
}

/**
 * Main composable export
 */
export function useCameraConnectionManager() {
  // Auto-initialize on first use
  if (!isInitialized.value && !isInitializing.value) {
    initializeConnections()
  }

  return {
    // State
    cameras: computed(() => cameras.value),
    isInitialized: computed(() => isInitialized.value),
    isInitializing: computed(() => isInitializing.value),
    connections: computed(() => getAllConnections()),
    connectionStatuses: computed(() => getConnectionStatuses()),

    // Methods
    initializeConnections,
    getConnection,
    getAllConnections,
    getVideoStream,
    attachToVideoElement,
    areConnectionsReady,
    cleanup
  }
}
