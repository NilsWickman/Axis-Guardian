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
  { id: 'camera1', name: 'Camera 1 - People Detection' },
  { id: 'camera2', name: 'Camera 2 - Car Detection' },
  { id: 'camera3', name: 'Camera 3 - Mixed Detection' }
])

/**
 * Initialize all camera connections in the background
 * This is called automatically on first use
 */
async function initializeConnections() {
  if (isInitialized.value || isInitializing.value) {
    console.log('[ConnectionManager] Already initialized or initializing')
    return
  }

  isInitializing.value = true
  console.log('[ConnectionManager] Initializing all camera connections...')

  try {
    // Create connections for all cameras
    await Promise.all(cameras.value.map(async (camera) => {
      if (cameraConnections[camera.id]) {
        console.log(`[ConnectionManager] Connection for ${camera.id} already exists`)
        return
      }

      console.log(`[ConnectionManager] Creating connection for ${camera.id}`)

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
        console.log(`[ConnectionManager] ✓ Connected ${camera.id}`)
      } catch (error) {
        console.error(`[ConnectionManager] ✗ Failed to connect ${camera.id}:`, error)
        clearInterval(stateInterval)
      }
    }))

    isInitialized.value = true
    console.log('[ConnectionManager] All cameras initialized and ready')
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
    console.warn(`[ConnectionManager] No stream available for ${cameraId}`)
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
 * Cleanup all connections (call on app unmount)
 */
function cleanup() {
  console.log('[ConnectionManager] Cleaning up all connections')

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
