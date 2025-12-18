/**
 * Global Camera Connection Manager
 *
 * Maintains persistent WebRTC connections to all cameras across the entire application.
 * Connections are established once and reused across all views for instant loading.
 */

import { ref, reactive, computed, watch } from 'vue'
import { useMediasoupDetection, type DetectionMetadata } from './useMediasoupDetection'
import { config } from '@/config/environment'
import { loadSiteMapConfig } from '@/utils/siteMapConfigLoader'

interface Camera {
  id: string
  name: string
  webrtcUrl?: string
}

interface CameraConnection {
  connection: ReturnType<typeof useMediasoupDetection>
  videoElement: HTMLVideoElement | null
  /** Video elements that are currently displaying this camera stream (thumbnails/primary views) */
  attachedVideoElements: Set<HTMLVideoElement>
  isConnected: boolean
  latestMetadata: DetectionMetadata | null
  stateWatchStop: (() => void) | null  // Store watch cleanup function
  /** True if we paused this element as part of live sync (non-seekable streams) */
  pausedBySync?: boolean
  // Health monitoring state
  stuckStateCount: number
  lastHealthCheckTime: number
  frozenCheckCount: number
  // Decode/advance monitoring (more reliable than video.currentTime for MediaStream)
  lastFramesDecoded: number
  lastFrameDecodedAt: number
  stallMs: number
}

// Camera ID mapping (emulator uses camera-HC3/HC4, frontend uses camera1/camera2)
const CAMERA_ID_MAP: Record<string, string> = {
  'camera-HC3': 'camera1',
  'camera-HC4': 'camera2',
  'camera-IP2': 'camera3',
  'camera-IP5': 'camera4',
}

/**
 * Normalize camera ID from emulator format to frontend format
 */
function normalizeCameraId(cameraId: string): string {
  return CAMERA_ID_MAP[cameraId] || cameraId
}

/**
 * Normalize metadata to use frontend camera IDs
 */
function normalizeMetadata(metadata: DetectionMetadata): DetectionMetadata {
  return {
    ...metadata,
    camera_id: normalizeCameraId(metadata.camera_id)
  }
}

// Global state (singleton pattern - shared across all components)
const cameraConnections = reactive<Record<string, CameraConnection>>({})
const isInitialized = ref(false)
const isInitializing = ref(false)

// Reactive metadata map - updated directly when detection callbacks fire
// This provides a simpler reactive chain than accessing through cameraConnections
const cameraMetadataMap = reactive<Record<string, DetectionMetadata | null>>({})

// Available cameras - populated from JSON config
const cameras = ref<Camera[]>([])

// Fallback WebRTC URLs (from centralized config - HTTP WHEP protocol)
// Used if JSON config doesn't specify webrtcUrl
const fallbackWebRTCUrls: Record<string, string> = {
  camera1: config.camera1WebRTCUrl,
  camera2: config.camera2WebRTCUrl
}

/**
 * Get WebRTC URL for a camera
 * Uses URL from config if available, otherwise falls back to environment config
 */
function getWebRTCUrl(camera: Camera): string | undefined {
  const rawUrl = camera.webrtcUrl || fallbackWebRTCUrls[camera.id]
  if (!rawUrl) return undefined

  // In production, ignore localhost/loopback URLs coming from static configs
  // so external/mobile clients use the public signaling endpoints.
  if (!config.isDevelopment && typeof window !== 'undefined') {
    try {
      const parsed = new URL(rawUrl, window.location.origin)
      const host = parsed.hostname
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        return fallbackWebRTCUrls[camera.id] || rawUrl
      }
    } catch {
      if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(rawUrl)) {
        return fallbackWebRTCUrls[camera.id] || rawUrl
      }
    }
  }

  return rawUrl
}

// Video synchronization state
let syncMonitorInterval: number | null = null
const SYNC_CHECK_INTERVAL = 500 // Check sync twice per second so 1s offsets converge quickly
const MAX_SYNC_DRIFT = 0.2 // Maximum allowed drift in seconds before correction (tightened from 0.5)
// NOTE: For WebRTC MediaStreams, pausing to "sync" cameras causes visible stutter/freeze,
// especially when one stream is naturally slower. Keep this OFF by default.
const SYNC_ENABLED = false // Enable/disable sync monitoring

// Connection health monitoring
let healthMonitorInterval: number | null = null
const HEALTH_CHECK_INTERVAL = 10000 // Check connection health every 10 seconds (was 5s - reduced CPU pressure)
const RECONNECT_DELAY = 2000 // Wait 2 seconds before attempting reconnect

// Single camera mode - only connect to HC3 (camera1) for testing
// Set to null to connect to all cameras
const SINGLE_CAMERA_MODE: string | null = null

// Video element pool for reuse (prevents orphaned elements)
const videoElementPool: HTMLVideoElement[] = []
const MAX_POOL_SIZE = 10

/**
 * Get a video element from the pool or create a new one
 */
function getPooledVideoElement(): HTMLVideoElement {
  let element = videoElementPool.pop()
  if (!element) {
    element = document.createElement('video')
  }
  element.autoplay = true
  element.muted = true
  element.playsInline = true
  // Avoid `display:none` — some browsers throttle/stop decoding for hidden video,
  // which makes the shared MediaStream appear frozen and can trigger reconnection loops.
  element.style.position = 'fixed'
  element.style.left = '-9999px'
  element.style.top = '0'
  element.style.width = '1px'
  element.style.height = '1px'
  element.style.opacity = '0'
  element.style.pointerEvents = 'none'
  document.body.appendChild(element)
  return element
}

/**
 * Release a video element back to the pool
 */
function releaseVideoElement(element: HTMLVideoElement): void {
  // Stop playback and clear source
  element.pause()
  element.srcObject = null
  element.removeAttribute('src')
  element.load() // Reset the element

  // Remove from DOM
  element.remove()

  // Add to pool if not full
  if (videoElementPool.length < MAX_POOL_SIZE) {
    videoElementPool.push(element)
  }
}

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
    // Load cameras from JSON config (single source of truth)
    const siteMapConfig = await loadSiteMapConfig()
    let loadedCameras = siteMapConfig.cameras.map(cam => ({
      id: cam.id,
      name: cam.name,
      webrtcUrl: cam.webrtcUrl
    }))

    // Filter to single camera if in single camera mode
    if (SINGLE_CAMERA_MODE !== null) {
      loadedCameras = loadedCameras.filter(cam => cam.id === SINGLE_CAMERA_MODE)
    }

    cameras.value = loadedCameras

    // Create connections for all cameras sequentially
    // Sequential connection avoids WebRTC/mediasoup race conditions that can occur
    // when multiple connections are initialized simultaneously
    for (const camera of cameras.value) {
      if (cameraConnections[camera.id]) {
        continue
      }

      // Get a video element from pool (or create new one)
      const videoElement = getPooledVideoElement()

      // Create WebRTC connection to camera-specific ONVIF emulator
      const signalingUrl = getWebRTCUrl(camera)
      if (!signalingUrl) {
        console.error(`No WebRTC URL configured for ${camera.id}`)
        continue
      }

      const connection = useMediasoupDetection(camera.id, {
        signalingUrl,
        autoReconnect: true,
        reconnectDelay: 3000
      })

      // Store connection info
      cameraConnections[camera.id] = {
        connection,
        videoElement,
        attachedVideoElements: new Set<HTMLVideoElement>(),
        isConnected: false,
        latestMetadata: null,
        stateWatchStop: null,
        // Health monitoring state
        stuckStateCount: 0,
        lastHealthCheckTime: 0,
        frozenCheckCount: 0,
        // Decode/advance monitoring
        lastFramesDecoded: 0,
        lastFrameDecodedAt: Date.now(),
        stallMs: 0
      }

      // Initialize metadata map entry
      cameraMetadataMap[camera.id] = null

      // Set up detection callback to store latest metadata
      // Normalize camera_id in metadata to match frontend camera IDs
      // Update both cameraConnections (for backward compat) and cameraMetadataMap (for reactivity)
      connection.setDetectionCallback((metadata) => {
        const normalizedMetadata = normalizeMetadata(metadata)
        cameraConnections[camera.id].latestMetadata = normalizedMetadata
        cameraMetadataMap[camera.id] = normalizedMetadata
      })

      // Monitor connection state reactively (not polling)
      const stateWatchStop = watch(
        () => connection.connectionState.value,
        (newState) => {
          cameraConnections[camera.id].isConnected = newState === 'connected'
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
    }

    isInitialized.value = true

    // Start video synchronization monitoring
    if (SYNC_ENABLED) {
      startSyncMonitoring()
    }

    // Start connection health monitoring
    startHealthMonitoring()
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

  // Track attached elements so sync monitoring can affect what the user actually sees.
  const conn = cameraConnections[cameraId]
  if (conn) {
    conn.attachedVideoElements.add(videoElement)
    // Best-effort cleanup: remove the element from the set if it gets detached/reset.
    const cleanupKey = '__axis_guardian_camera_attach_cleanup__'
    const existingCleanup = (videoElement as any)[cleanupKey] as (() => void) | undefined
    if (!existingCleanup) {
      const cleanup = () => {
        try {
          conn.attachedVideoElements.delete(videoElement)
        } catch {
          // ignore
        }
        try {
          videoElement.removeEventListener('emptied', cleanup)
          videoElement.removeEventListener('abort', cleanup)
          videoElement.removeEventListener('ended', cleanup)
        } catch {
          // ignore
        }
        ;(videoElement as any)[cleanupKey] = undefined
      }
      ;(videoElement as any)[cleanupKey] = cleanup
      videoElement.addEventListener('emptied', cleanup)
      videoElement.addEventListener('abort', cleanup)
      videoElement.addEventListener('ended', cleanup)
    }
  }

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
  // Always clear existing interval first to prevent multiplication
  if (syncMonitorInterval !== null) {
    clearInterval(syncMonitorInterval)
    syncMonitorInterval = null
  }

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
  }
}

/**
 * Synchronize all video elements to prevent drift
 */
function synchronizeVideos() {
  const videoElements: Array<{ id: string; element: HTMLVideoElement; currentTime: number }> = []

  // Collect all video elements with their current playback positions
  for (const [id, conn] of Object.entries(cameraConnections)) {
    if (!conn.isConnected) {
      continue
    }

    // Prefer a currently attached (visible) element; fall back to the hidden pooled element.
    const attached = Array.from(conn.attachedVideoElements.values())
    const video = attached.length > 0 ? attached[0] : conn.videoElement
    if (!video) continue

    // Skip if we don't have a decodable frame/time yet
    if (video.readyState < 2 || isNaN(video.currentTime)) {
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

  // For non-seekable streams (MediaStream/WebRTC), we can't seek currentTime.
  // Instead, we pause streams that are ahead until the lagging stream catches up.

  // For seekable sources (e.g., VOD), we can still use the old "sync to most advanced" logic.
  const referenceVideo = videoElements.reduce((max, current) =>
    current.currentTime > max.currentTime ? current : max
  )

  // Determine if any elements are seekable; if so, do a simple seek-to-reference.
  // Otherwise do live pause/resume based on the slowest stream (minTime).
  const anySeekable = videoElements.some(v =>
    Number.isFinite(v.element.duration) && v.element.seekable && v.element.seekable.length > 0
  )

  if (anySeekable) {
    // Seek lagging elements up to the most advanced time.
    for (const video of videoElements) {
      const drift = referenceVideo.currentTime - video.currentTime
      if (Math.abs(drift) <= MAX_SYNC_DRIFT) continue

      const isSeekable =
        Number.isFinite(video.element.duration) &&
        video.element.seekable &&
        video.element.seekable.length > 0
      if (!isSeekable) continue

      try {
        video.element.currentTime = referenceVideo.currentTime
      } catch (error) {
        console.error(`[ConnectionManager] ✗ Failed to seek-sync ${video.id}:`, error)
      }
    }
    return
  }

  // Live WebRTC MediaStream:
  // Do NOT pause/resume to "sync" — it creates stutter and makes one stream appear frozen.
  // We only *observe* drift for logging/diagnostics.
  return
}

/**
 * Start monitoring connection health for all cameras
 */
function startHealthMonitoring() {
  // Always clear existing interval first to prevent multiplication
  if (healthMonitorInterval !== null) {
    clearInterval(healthMonitorInterval)
    healthMonitorInterval = null
  }

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
  }
}

/**
 * Check health of all connections and attempt recovery if needed
 */
function checkConnectionHealth() {
  for (const [id, conn] of Object.entries(cameraConnections)) {
    const connectionState = conn.connection.connectionState.value
    const isConnected = conn.connection.isConnected.value

    // Check for failed or disconnected connections
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      attemptReconnection(id)
      continue
    }

    // Check for connections stuck in 'new' or 'closed' state (never fully established or closed without proper handling)
    // This catches cases where the WebRTC transport was never created or was closed unexpectedly
    if ((connectionState === 'new' || connectionState === 'closed') && !isConnected) {
      // Track how long the connection has been stuck
      conn.stuckStateCount = (conn.stuckStateCount || 0) + 1

      // If stuck for 3 consecutive checks (30 seconds), attempt reconnection
      if (conn.stuckStateCount >= 3) {
        attemptReconnection(id)
        conn.stuckStateCount = 0
      }
    } else if (isConnected) {
      // Connection is healthy, reset stuck counter
      conn.stuckStateCount = 0
    }

    // Check for frozen video streams using decoded-frame progression (more reliable than currentTime).
    if (connectionState === 'connected') {
      const q = conn.connection.connectionQuality.value
      const framesDecoded = q?.framesDecoded ?? 0
      const now = Date.now()

      if (framesDecoded > conn.lastFramesDecoded) {
        conn.lastFramesDecoded = framesDecoded
        conn.lastFrameDecodedAt = now
      }

      conn.stallMs = now - (conn.lastFrameDecodedAt || now)

      // If we haven't decoded a new frame for a while, treat as frozen and recover.
      // (Threshold intentionally low to reflect UX; recovery is still rate-limited by HEALTH_CHECK_INTERVAL.)
      const FREEZE_THRESHOLD_MS = 3000
      if (conn.stallMs > FREEZE_THRESHOLD_MS) {
        attemptStreamRecovery(id)
        // Reset baseline so we don't immediately re-trigger on the next health tick.
        conn.lastFrameDecodedAt = now
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

  try {
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY))

    // Clear stale metadata before reconnection
    conn.latestMetadata = null

    // Disconnect with externalReconnecting=true to prevent duplicate reconnection attempts
    conn.connection.disconnect(true)

    // Release old video element back to pool
    if (conn.videoElement) {
      releaseVideoElement(conn.videoElement)
    }

    // Get a fresh video element from pool
    const videoElement = getPooledVideoElement()
    conn.videoElement = videoElement

    // Reconnect
    await conn.connection.connect(videoElement)

    // Re-attach to any visible video elements
    // This will be handled by the views automatically via their attachment logic
  } catch (error) {
    console.error(`[ConnectionManager] Failed to reconnect ${cameraId}:`, error)
    // Reset the external reconnecting flag so auto-reconnect can take over
    // This prevents the connection from being permanently stuck
    conn.connection.resetExternalReconnecting()
  }
}

/**
 * Attempt to recover a frozen video stream
 */
async function attemptStreamRecovery(cameraId: string) {
  const conn = cameraConnections[cameraId]
  if (!conn?.videoElement) return

  try {
    // Try to restart playback
    await conn.videoElement.play()
  } catch (error) {
    // If playback restart fails, attempt full reconnection
    await attemptReconnection(cameraId)
  }
}

/**
 * Set loop duration for a specific camera
 * @param cameraId - Camera ID to configure
 * @param durationSeconds - Loop after N seconds (null to disable)
 * @param onLoop - Callback when video loops
 */
function setLoopForCamera(
  cameraId: string,
  durationSeconds: number | null,
  onLoop?: () => void
): boolean {
  const conn = cameraConnections[cameraId]
  if (!conn) {
    return false
  }

  conn.connection.setLoopDuration(durationSeconds, onLoop)
  return true
}

/**
 * Cleanup all connections (call on app unmount)
 */
function cleanup() {
  // Stop all monitoring
  stopSyncMonitoring()
  stopHealthMonitoring()

  for (const [_id, conn] of Object.entries(cameraConnections)) {
    // Stop reactive state watchers
    if (conn.stateWatchStop) {
      conn.stateWatchStop()
    }

    // Disconnect WebRTC
    conn.connection.disconnect()

    // Release video element back to pool
    if (conn.videoElement) {
      releaseVideoElement(conn.videoElement)
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
  // Auto-initialization removed - connections must be manually initialized
  // Call initializeConnections() when needed

  return {
    // State
    cameras: computed(() => cameras.value),
    isInitialized: computed(() => isInitialized.value),
    isInitializing: computed(() => isInitializing.value),
    connections: computed(() => getAllConnections()),
    connectionStatuses: computed(() => getConnectionStatuses()),
    // Video health for UI (freeze/stall detection)
    videoHealthByCamera: computed(() => {
      const out: Record<string, { fps: number; stallMs: number; framesDecoded: number } | null> = {}
      for (const [id, conn] of Object.entries(cameraConnections)) {
        const q = conn.connection.connectionQuality.value
        out[id] = q
          ? { fps: q.fps || 0, stallMs: conn.stallMs || 0, framesDecoded: q.framesDecoded || 0 }
          : null
      }
      return out
    }),
    // Reactive metadata map - use this for detection display (better reactivity)
    cameraMetadataMap,

    // Methods
    initializeConnections,
    getConnection,
    getAllConnections,
    getVideoStream,
    attachToVideoElement,
    areConnectionsReady,
    setLoopForCamera,
    cleanup
  }
}
