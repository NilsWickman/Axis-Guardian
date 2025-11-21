/**
 * Global Camera Connection Manager
 *
 * Maintains persistent WebRTC connections to all cameras across the entire application.
 * Connections are established once and reused across all views for instant loading.
 */

import { ref, reactive, computed, watch } from 'vue'
import { useWebRTCDetection, type DetectionMetadata } from './useWebRTCDetection'
import type { Detection } from '@/types/detection.types'
import { config } from '@/config/environment'

interface Camera {
  id: string
  name: string
}

interface CameraConnection {
  connection: ReturnType<typeof useWebRTCDetection>
  videoElement: HTMLVideoElement | null
  isConnected: boolean
  latestMetadata: DetectionMetadata | null
  stateWatchStop: (() => void) | null  // Store watch cleanup function
}

// Global state (singleton pattern - shared across all components)
const cameraConnections = reactive<Record<string, CameraConnection>>({})
const isInitialized = ref(false)
const isInitializing = ref(false)

// Available cameras with their WebRTC endpoints
const cameras = ref<Camera[]>([
  { id: 'camera1', name: 'Camera 1 - Auditorium HC3' },
  { id: 'camera2', name: 'Camera 2 - Auditorium HC4' }
])

// Camera-specific WebRTC URLs (from centralized config - HTTP WHEP protocol)
const cameraWebRTCUrls: Record<string, string> = {
  camera1: config.camera1WebRTCUrl,
  camera2: config.camera2WebRTCUrl
}

// Video synchronization state
let syncMonitorInterval: number | null = null
const SYNC_CHECK_INTERVAL = 2000 // Check sync every 2 seconds
const MAX_SYNC_DRIFT = 0.5 // Maximum allowed drift in seconds before correction (reduced from 1.0)
const SYNC_ENABLED = true // Enable/disable sync monitoring
let syncCorrectionCount = 0 // Track number of corrections for debugging

// Connection health monitoring
let healthMonitorInterval: number | null = null
const HEALTH_CHECK_INTERVAL = 5000 // Check connection health every 5 seconds
const RECONNECT_DELAY = 2000 // Wait 2 seconds before attempting reconnect

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

      // Create WebRTC connection to camera-specific ONVIF emulator
      const signalingUrl = cameraWebRTCUrls[camera.id]
      if (!signalingUrl) {
        console.error(`No WebRTC URL configured for ${camera.id}`)
        return
      }

      const connection = useWebRTCDetection(camera.id, {
        signalingUrl,
        autoReconnect: true,
        reconnectDelay: 3000
      })

      // Store connection info
      cameraConnections[camera.id] = {
        connection,
        videoElement,
        isConnected: false,
        latestMetadata: null,
        stateWatchStop: null
      }

      // Set up detection callback to store latest metadata
      connection.setDetectionCallback((metadata) => {
        cameraConnections[camera.id].latestMetadata = metadata
      })

      // Monitor connection state reactively (not polling)
      const stateWatchStop = watch(
        () => connection.connectionState.value,
        (newState) => {
          cameraConnections[camera.id].isConnected = newState === 'connected'
          console.log(`[ConnectionManager] ${camera.id} connection state: ${newState}`)
        },
        { immediate: true }
      )

      // Store cleanup function
      cameraConnections[camera.id].stateWatchStop = stateWatchStop

      // Connect WebRTC
      try {
        await connection.connect(videoElement)
      } catch (error) {
        console.error(`[ConnectionManager] Failed to connect ${camera.id}:`, error)
        // Cleanup watch on connection failure
        stateWatchStop()
        cameraConnections[camera.id].stateWatchStop = null
      }
    }))

    isInitialized.value = true

    // Start video synchronization monitoring
    if (SYNC_ENABLED) {
      startSyncMonitoring()
    }

    // Start connection health monitoring
    startHealthMonitoring()

    console.log('[ConnectionManager] All connections initialized and monitoring started')
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
 * Start monitoring connection health for all cameras
 */
function startHealthMonitoring() {
  if (healthMonitorInterval !== null) {
    return // Already monitoring
  }

  console.log('[ConnectionManager] Starting connection health monitoring')

  healthMonitorInterval = window.setInterval(() => {
    checkConnectionHealth()
  }, HEALTH_CHECK_INTERVAL)
}

/**
 * Stop monitoring connection health
 */
function stopHealthMonitoring() {
  if (healthMonitorInterval !== null) {
    clearInterval(healthMonitorInterval)
    healthMonitorInterval = null
    console.log('[ConnectionManager] Stopped connection health monitoring')
  }
}

/**
 * Check health of all connections and attempt recovery if needed
 */
function checkConnectionHealth() {
  for (const [id, conn] of Object.entries(cameraConnections)) {
    const connectionState = conn.connection.connectionState.value
    const videoElement = conn.videoElement

    // Check for failed or disconnected connections
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      console.warn(`[ConnectionManager] Connection to ${id} is ${connectionState}, attempting recovery...`)
      attemptReconnection(id)
      continue
    }

    // Check for frozen video streams
    if (videoElement && connectionState === 'connected') {
      // Check if video is playing but time isn't advancing (frozen stream)
      const currentTime = videoElement.currentTime
      const readyState = videoElement.readyState

      // Store last known time for drift detection
      if (!conn.connection.lastHealthCheckTime) {
        conn.connection.lastHealthCheckTime = currentTime
        continue
      }

      const timeDelta = currentTime - conn.connection.lastHealthCheckTime
      conn.connection.lastHealthCheckTime = currentTime

      // If video claims to be ready but time hasn't advanced in 5 seconds, it's frozen
      if (readyState >= 2 && timeDelta === 0 && !videoElement.paused) {
        conn.connection.frozenCheckCount = (conn.connection.frozenCheckCount || 0) + 1

        // If frozen for 2 consecutive checks (10 seconds), attempt recovery
        if (conn.connection.frozenCheckCount >= 2) {
          console.warn(`[ConnectionManager] Video stream for ${id} appears frozen, attempting recovery...`)
          attemptStreamRecovery(id)
          conn.connection.frozenCheckCount = 0
        }
      } else {
        // Stream is healthy, reset counter
        conn.connection.frozenCheckCount = 0
      }
    }
  }
}

/**
 * Attempt to reconnect a failed camera connection
 */
async function attemptReconnection(cameraId: string) {
  const conn = cameraConnections[cameraId]
  if (!conn) return

  console.log(`[ConnectionManager] Reconnecting ${cameraId}...`)

  try {
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY))

    // Disconnect with externalReconnecting=true to prevent duplicate reconnection attempts
    conn.connection.disconnect(true)

    // Create a new video element if the old one is broken
    if (conn.videoElement) {
      conn.videoElement.remove()
    }

    const videoElement = document.createElement('video')
    videoElement.autoplay = true
    videoElement.muted = true
    videoElement.playsInline = true
    videoElement.style.display = 'none'
    document.body.appendChild(videoElement)

    conn.videoElement = videoElement

    // Reconnect
    await conn.connection.connect(videoElement)
    console.log(`[ConnectionManager] Successfully reconnected ${cameraId}`)

    // Re-attach to any visible video elements
    // This will be handled by the views automatically via their attachment logic
  } catch (error) {
    console.error(`[ConnectionManager] Failed to reconnect ${cameraId}:`, error)
  }
}

/**
 * Attempt to recover a frozen video stream
 */
async function attemptStreamRecovery(cameraId: string) {
  const conn = cameraConnections[cameraId]
  if (!conn?.videoElement) return

  console.log(`[ConnectionManager] Attempting stream recovery for ${cameraId}`)

  try {
    // Try to restart playback
    await conn.videoElement.play()
    console.log(`[ConnectionManager] Stream recovery successful for ${cameraId}`)
  } catch (error) {
    // If playback restart fails, attempt full reconnection
    console.warn(`[ConnectionManager] Playback restart failed, attempting full reconnection for ${cameraId}`)
    await attemptReconnection(cameraId)
  }
}

/**
 * Cleanup all connections (call on app unmount)
 */
function cleanup() {
  // Stop all monitoring
  stopSyncMonitoring()
  stopHealthMonitoring()

  for (const [id, conn] of Object.entries(cameraConnections)) {
    // Stop reactive state watchers
    if (conn.stateWatchStop) {
      conn.stateWatchStop()
    }

    // Disconnect WebRTC
    conn.connection.disconnect()

    // Remove video element from DOM
    if (conn.videoElement) {
      conn.videoElement.remove()
    }
  }

  // Clear connections
  Object.keys(cameraConnections).forEach(key => {
    delete cameraConnections[key]
  })

  isInitialized.value = false
  console.log('[ConnectionManager] All connections cleaned up')
}

/**
 * Main composable export
 */
export function useCameraConnectionManager() {
  // Auto-initialization removed - connections must be manually initialized
  // Call initializeConnections() when needed

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
