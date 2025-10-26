<template>
  <div class="webrtc-detection-view">
    <!-- Header -->
    <div class="header">
      <h1>🚀 WebRTC Detection with Data Channels</h1>
      <p class="subtitle">Frame-Synchronized Object Detection - Metadata arrives with each frame</p>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-item">
        <div :class="['status-indicator', { connected: globalConnected }]" />
        <span>WebRTC: {{ globalConnected ? 'Connected' : 'Connecting...' }}</span>
      </div>
      <div class="status-item">
        <div :class="['status-indicator', { connected: dataChannelConnected }]" />
        <span>Data Channel: {{ dataChannelConnected ? 'Open' : 'Closed' }}</span>
      </div>
      <div class="status-item">
        <span>Total Detections: <strong>{{ globalTotalDetections }}</strong></span>
      </div>
      <div class="status-item">
        <span>Cameras: <strong>{{ cameras.length }}</strong></span>
      </div>
      <button
        class="controls-toggle-button"
        @click="showControlsPanel = !showControlsPanel"
      >
        {{ showControlsPanel ? 'Hide' : 'Show' }} Controls
      </button>
    </div>

    <!-- Controls Panel -->
    <div v-if="showControlsPanel" class="controls-panel">
      <DetectionOverlayControls v-model="overlaySettings" />
    </div>

    <!-- Camera Grid -->
    <div class="camera-grid">
      <div v-for="camera in cameras" :key="camera.id" class="camera-card">
        <!-- Camera Header -->
        <div class="camera-header">
          <div class="camera-info">
            <div class="camera-name">{{ camera.name }}</div>
            <div class="camera-meta">
              <span class="frame-number">Frame: #{{ frameNumbers[camera.id] || 0 }}</span>
              <span class="detection-count">
                {{ detectionCounts[camera.id] || 0 }} objects
              </span>
            </div>
          </div>
          <ConnectionQualityBadge
            :connection-quality="getConnection(camera.id)?.connection.connectionQuality.value"
            :connection-state="connectionStates[camera.id]"
          />
        </div>

        <!-- Video Container with Canvas Overlay -->
        <div class="camera-container">
          <video
            :ref="el => videoRefs[camera.id] = el as HTMLVideoElement | null"
            :id="`video-${camera.id}`"
            autoplay
            muted
            playsinline
            @loadedmetadata="onVideoLoaded(camera.id)"
            @play="startDrawing(camera.id)"
          />

          <!-- Detection Overlay (Canvas) -->
          <canvas
            :ref="el => canvasRefs[camera.id] = el as HTMLCanvasElement | null"
            class="canvas-overlay"
          />

          <div v-if="!videoDimensions[camera.id]" class="no-stream">
            <div class="spinner"></div>
            <p>Initializing WebRTC...</p>
          </div>

          <!-- Video Metrics Overlay -->
          <VideoMetrics
            :camera-id="camera.id"
            :connection-quality="getConnection(camera.id)?.connection.connectionQuality"
            :stats="getConnection(camera.id)?.connection.stats"
            :connection-state="connectionStates[camera.id]"
          />

          <!-- Video Controls -->
          <VideoControls
            :camera-id="camera.id"
            :connection-state="connectionStates[camera.id]"
            :is-reconnecting="false"
            @toggle-play-pause="handlePlayPause(camera.id, $event)"
            @retry="handleRetry(camera.id)"
            @toggle-fullscreen="handleFullscreen(camera.id)"
          />
        </div>

        <!-- Detection Legend -->
        <div class="detection-legend">
          <template v-if="Object.keys(classCountsByCamera[camera.id] || {}).length > 0">
            <div
              v-for="(count, className) in classCountsByCamera[camera.id]"
              :key="className"
              class="legend-item"
            >
              <div
                class="legend-color"
                :style="{ background: getClassColor(className as string) }"
              />
              <span class="legend-label">{{ className }}:</span>
              <span class="legend-count">{{ count }}</span>
            </div>
          </template>
          <span v-else class="no-detections">No detections yet</span>
        </div>

        <!-- Coordinates Display -->
        <div v-if="overlaySettings.showCoordinates" class="coordinates-display">
          <template v-if="cameraDetections[camera.id]?.length">
            <div
              v-for="(det, idx) in cameraDetections[camera.id].filter(d => d.confidence >= overlaySettings.confidenceThreshold)"
              :key="idx"
              class="coordinate-item"
            >
              [{{ idx + 1 }}] {{ det.class_name }} ({{ (det.confidence * 100).toFixed(1) }}%) -
              Frame #{{ frameNumbers[camera.id] }} |
              Normalized: ({{ det.bbox.left.toFixed(3) }}, {{ det.bbox.top.toFixed(3) }}) to ({{ det.bbox.right.toFixed(3) }}, {{ det.bbox.bottom.toFixed(3) }})
            </div>
          </template>
          <div v-else class="no-detections">Waiting for detections...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import VideoMetrics from '@/components/features/camera/VideoMetrics.vue'
import ConnectionQualityBadge from '@/components/features/camera/ConnectionQualityBadge.vue'
import VideoControls from '@/components/features/camera/VideoControls.vue'
import DetectionOverlayControls from '@/components/features/camera/DetectionOverlayControls.vue'
import type { Detection } from '@/types/detection.types'
import type { OverlaySettings } from '@/components/features/camera/DetectionOverlayControls.vue'

interface Camera {
  id: string
  name: string
}

// Global connection manager
const {
  cameras: globalCameras,
  isInitialized,
  connectionStatuses,
  attachToVideoElement,
  getConnection
} = useCameraConnectionManager()

// Convert to local array format
const cameras = globalCameras.value as Camera[]

// Overlay settings (shared across all cameras)
const overlaySettings = ref<OverlaySettings>({
  overlayMode: 'full',
  showLabels: true,
  showConfidence: true,
  showCoordinates: true,
  confidenceThreshold: 0.5
})

// Show controls panel
const showControlsPanel = ref(false)

// Class colors
const CLASS_COLORS: Record<string, string> = {
  person: '#22c55e',
  car: '#3b82f6',
  truck: '#ef4444',
  bus: '#06b6d4',
  motorbike: '#a855f7',
  bicycle: '#eab308'
}

// State
const videoRefs = ref<Record<string, HTMLVideoElement | null>>({})
const canvasRefs = ref<Record<string, HTMLCanvasElement | null>>({})

// Aggregated state
const videoDimensions = reactive<Record<string, { width: number; height: number }>>({})
const cameraDetections = reactive<Record<string, Detection[]>>({})
const frameNumbers = reactive<Record<string, number>>({})
const detectionCounts = reactive<Record<string, number>>({})
const cameraTotalDetections = reactive<Record<string, number>>({})
const classCountsByCamera = reactive<Record<string, Record<string, number>>>({})
const connectionStates = reactive<Record<string, RTCPeerConnectionState>>({})
const dataChannelStates = reactive<Record<string, boolean>>({})

// Throttle mechanism for debug overlay updates (100ms = 10 Hz max)
const lastDebugUpdateTime = reactive<Record<string, number>>({})
const DEBUG_UPDATE_THROTTLE_MS = 100

// Global computed
const globalConnected = computed(() => {
  return Object.values(connectionStatuses.value).some(status => status === true)
})

const dataChannelConnected = computed(() => {
  return cameras.some(camera => {
    const conn = getConnection(camera.id)
    return conn?.connection.isDataChannelOpen.value === true
  })
})

const globalTotalDetections = computed(() =>
  Object.values(cameraTotalDetections).reduce((sum, count) => sum + count, 0)
)

// Methods
function getClassColor(className: string): string {
  return CLASS_COLORS[className] || '#94a3b8'
}

function onVideoLoaded(cameraId: string) {
  const video = videoRefs.value[cameraId]
  const canvas = canvasRefs.value[cameraId]

  if (video && canvas && video.videoWidth > 0) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    videoDimensions[cameraId] = {
      width: video.videoWidth,
      height: video.videoHeight
    }
  }
}

function startDrawing(cameraId: string) {
  // No longer using RAF loop - drawing is triggered by detection callbacks
  // Initial draw to clear canvas
  drawDetections(cameraId)
}

function drawDetections(cameraId: string) {
  // Skip if overlay mode is off
  if (overlaySettings.value.overlayMode === 'off') return

  const canvas = canvasRefs.value[cameraId]
  const video = videoRefs.value[cameraId]

  if (!canvas || !video || !video.videoWidth) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const detections = cameraDetections[cameraId]
  if (!detections || detections.length === 0) return

  // Filter by confidence threshold
  const filteredDetections = detections.filter(
    d => d.confidence >= overlaySettings.value.confidenceThreshold
  )

  // Draw each detection
  filteredDetections.forEach(detection => {
    const { bbox, class_name, confidence } = detection

    // Convert VAPIX normalized coordinates to pixel coordinates
    const x = bbox.left * canvas.width
    const y = bbox.top * canvas.height
    const width = (bbox.right - bbox.left) * canvas.width
    const height = (bbox.bottom - bbox.top) * canvas.height

    const color = getClassColor(class_name)

    // Draw bounding box
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, width, height)

    // Draw label (only in 'full' mode)
    if (overlaySettings.value.overlayMode === 'full') {
      let label = ''

      if (overlaySettings.value.showLabels) {
        label += class_name
      }

      if (overlaySettings.value.showConfidence) {
        label += (label ? ' ' : '') + `${(confidence * 100).toFixed(0)}%`
      }

      if (label) {
        ctx.font = 'bold 14px Arial'
        const textMetrics = ctx.measureText(label)
        const textHeight = 20

        // Draw label background
        ctx.fillStyle = color
        ctx.fillRect(x, y - textHeight - 5, textMetrics.width + 10, textHeight)

        // Draw label text
        ctx.fillStyle = '#000'
        ctx.fillText(label, x + 5, y - 8)
      }
    }
  })
}

// Handler functions for video controls
function handlePlayPause(cameraId: string, isPaused: boolean) {
  const conn = getConnection(cameraId)
  if (!conn) return

  if (isPaused) {
    conn.connection.pauseVideo()
  } else {
    conn.connection.resumeVideo()
  }
}

function handleRetry(cameraId: string) {
  const conn = getConnection(cameraId)
  if (!conn) return

  conn.connection.retryConnection()
}

function handleFullscreen(cameraId: string) {
  const videoEl = videoRefs.value[cameraId]
  if (!videoEl) return

  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    videoEl.parentElement?.requestFullscreen()
  }
}

// Attach video elements to global connections
async function attachVideosToConnections() {
  console.log('[WebRTCDetectionView] Attaching videos to global connections...')

  // If connections aren't initialized yet, wait (only happens on first load)
  if (!isInitialized.value) {
    console.log('[WebRTCDetectionView] Waiting for connections to initialize...')
    const maxWait = 10000 // 10 seconds
    const startTime = Date.now()
    while (!isInitialized.value && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!isInitialized.value) {
      console.error('[WebRTCDetectionView] Timeout waiting for connections to initialize')
      return
    }
  } else {
    console.log('[WebRTCDetectionView] Connections already initialized - instant attach!')
  }

  // Minimal wait for video elements to be in DOM
  await new Promise(resolve => setTimeout(resolve, 50))

  // Attach each video to its corresponding global connection
  for (const camera of cameras) {
    const videoEl = videoRefs.value[camera.id]
    if (!videoEl) {
      console.warn(`[WebRTCDetectionView] Video element not found for ${camera.id}`)
      continue
    }

    // Attach to global connection (stream already flowing!)
    const attached = attachToVideoElement(camera.id, videoEl)
    if (attached) {
      console.log(`[WebRTCDetectionView] ✓ Instantly attached ${camera.id} (stream was ready)`)
    }

    // Get connection and set up callbacks
    const conn = getConnection(camera.id)
    if (!conn) {
      console.error(`[WebRTCDetectionView] No connection found for ${camera.id}`)
      continue
    }

    // Set up reactive callback with throttled debug updates
    conn.connection.setDetectionCallback((metadata) => {
      // Always update detections for canvas drawing (real-time)
      cameraDetections[camera.id] = metadata.detections

      // Trigger canvas redraw based on overlay settings
      if (overlaySettings.value.overlayMode !== 'off') {
        drawDetections(camera.id)
      }

      // Throttle debug overlay updates to 10 Hz (every 100ms)
      const now = Date.now()
      const lastUpdate = lastDebugUpdateTime[camera.id] || 0

      if (now - lastUpdate >= DEBUG_UPDATE_THROTTLE_MS) {
        // Update debug state (causes Vue re-render)
        frameNumbers[camera.id] = metadata.frame_number
        detectionCounts[camera.id] = metadata.detection_count
        cameraTotalDetections[camera.id] = conn.connection.totalDetections.value
        classCountsByCamera[camera.id] = conn.connection.classCounts.value

        lastDebugUpdateTime[camera.id] = now
      }
    })
  }

  // Monitor connection states for all cameras
  setInterval(() => {
    cameras.forEach(camera => {
      const conn = getConnection(camera.id)
      if (conn) {
        connectionStates[camera.id] = conn.connection.connectionState.value
        dataChannelStates[camera.id] = conn.connection.isDataChannelOpen.value
      }
    })
  }, 100)

  console.log('[WebRTCDetectionView] All videos attached')
}

// Lifecycle
onMounted(async () => {
  await attachVideosToConnections()
})

onUnmounted(() => {
  // Note: We don't disconnect here because connections are global
  // They stay active for instant loading on other pages
  console.log('[WebRTCDetectionView] Unmounting (connections remain active)')
})
</script>

<style scoped>
.webrtc-detection-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
  color: #e2e8f0;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #94a3b8;
  font-size: 1.125rem;
  margin-top: 10px;
}

.status-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.controls-toggle-button {
  padding: 8px 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.controls-toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.controls-toggle-button:active {
  transform: translateY(0);
}

.controls-panel {
  max-width: 1800px;
  margin: 0 auto 30px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #64748b;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background: #22c55e;
}

.webrtc-badge {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 30px;
  max-width: 1800px;
  margin: 0 auto;
}

.camera-card {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.camera-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #334155, #1e293b);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #475569;
}

.camera-info {
  flex: 1;
}

.camera-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.camera-meta {
  display: flex;
  gap: 12px;
  font-size: 0.875rem;
  color: #94a3b8;
}

.frame-number {
  font-family: 'Courier New', monospace;
}

.detection-count {
  background: #3b82f6;
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
}

.connection-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #ef4444;
  color: white;
}

.connection-badge.connected {
  background: #22c55e;
}

.camera-container {
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.no-stream {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detection-legend {
  padding: 15px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background: #0f172a;
  min-height: 50px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-label {
  font-size: 0.875rem;
}

.legend-count {
  font-weight: 600;
  color: #3b82f6;
}

.no-detections {
  color: #64748b;
  font-size: 0.875rem;
}

.coordinates-display {
  padding: 10px 20px;
  background: #0f172a;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
  max-height: 150px;
  overflow-y: auto;
}

.coordinate-item {
  margin: 2px 0;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
