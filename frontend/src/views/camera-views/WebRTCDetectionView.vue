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
      <button @click="showDebugOverlay = !showDebugOverlay" class="debug-toggle">
        {{ showDebugOverlay ? '🔍 Hide Debug' : '🔍 Show Debug' }}
      </button>
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
          <div
            :class="['connection-badge', { connected: connectionStates[camera.id] === 'connected' }]"
          >
            {{ connectionStates[camera.id] || 'disconnected' }}
          </div>
        </div>

        <!-- Video Container with Canvas Overlay -->
        <div class="camera-container">
          <video
            :ref="el => videoRefs[camera.id] = el"
            :id="`video-${camera.id}`"
            autoplay
            muted
            playsinline
            @loadedmetadata="onVideoLoaded(camera.id)"
            @play="startDrawing(camera.id)"
          />

          <!-- Detection Overlay (Canvas) -->
          <canvas
            :ref="el => canvasRefs[camera.id] = el"
            class="canvas-overlay"
          />

          <div v-if="!videoDimensions[camera.id]" class="no-stream">
            <div class="spinner"></div>
            <p>Initializing WebRTC...</p>
          </div>

          <!-- Debug Timing Overlay -->
          <div v-if="showDebugOverlay" class="debug-overlay">
            <div class="debug-section-header">WebRTC Data Channel</div>

            <div class="debug-section">
              <div class="debug-label">Connection:</div>
              <div class="debug-value" :class="getConnectionClass(camera.id)">
                {{ connectionStates[camera.id] || 'new' }}
              </div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Data Channel:</div>
              <div class="debug-value" :class="{ 'sync-enabled': dataChannelStates[camera.id] }">
                {{ dataChannelStates[camera.id] ? 'Open' : 'Closed' }}
              </div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Frame Number:</div>
              <div class="debug-value">{{ frameNumbers[camera.id] || 0 }}</div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Frames Received:</div>
              <div class="debug-value">{{ cameraStats[camera.id]?.framesReceived || 0 }}</div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Total Detections:</div>
              <div class="debug-value">{{ cameraTotalDetections[camera.id] || 0 }}</div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Avg/Frame:</div>
              <div class="debug-value">
                {{ (cameraStats[camera.id]?.avgDetectionsPerFrame || 0).toFixed(2) }}
              </div>
            </div>

            <div class="debug-section">
              <div class="debug-label">Last Update:</div>
              <div class="debug-value">
                {{ formatTimestamp(cameraStats[camera.id]?.lastUpdateTime) }}
              </div>
            </div>
          </div>
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
        <div class="coordinates-display">
          <template v-if="cameraDetections[camera.id]?.length">
            <div
              v-for="(det, idx) in cameraDetections[camera.id]"
              :key="idx"
              class="coordinate-item"
            >
              [{{ idx + 1 }}] {{ det.class_name }} ({{ (det.confidence * 100).toFixed(1) }}%) -
              Frame #{{ frameNumbers[camera.id] }} |
              Pixel: ({{ det.bbox.x1.toFixed(0) }}, {{ det.bbox.y1.toFixed(0) }}) |
              VAPIX: ({{ det.bbox.left.toFixed(3) }}, {{ det.bbox.top.toFixed(3) }})
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
import { useWebRTCDetection } from '@/composables/useWebRTCDetection'
import type { Detection } from '@/types/detection.types'

interface Camera {
  id: string
  name: string
}

// Cameras configuration
const cameras: Camera[] = [
  { id: 'camera1', name: 'Camera 1 - People Detection' },
  { id: 'camera2', name: 'Camera 2 - Car Detection' },
  { id: 'camera3', name: 'Camera 3 - Mixed Detection' }
]

// Server-side rendering flag (set to true if backend draws on frames)
const serverSideRendering = ref(true)

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
const showDebugOverlay = ref(true)

// Per-camera WebRTC connections
const webrtcConnections = reactive<Record<string, ReturnType<typeof useWebRTCDetection>>>({})

// Aggregated state
const videoDimensions = reactive<Record<string, { width: number; height: number }>>({})
const cameraDetections = reactive<Record<string, Detection[]>>({})
const frameNumbers = reactive<Record<string, number>>({})
const detectionCounts = reactive<Record<string, number>>({})
const cameraTotalDetections = reactive<Record<string, number>>({})
const classCountsByCamera = reactive<Record<string, Record<string, number>>>({})
const connectionStates = reactive<Record<string, RTCPeerConnectionState>>({})
const dataChannelStates = reactive<Record<string, boolean>>({})
const cameraStats = reactive<Record<string, any>>({})
const animationFrames = ref<Record<string, number>>({})

// Global computed
const globalConnected = computed(() =>
  Object.values(connectionStates).some(state => state === 'connected')
)

const dataChannelConnected = computed(() =>
  Object.values(dataChannelStates).some(state => state === true)
)

const globalTotalDetections = computed(() =>
  Object.values(cameraTotalDetections).reduce((sum, count) => sum + count, 0)
)

// Methods
function getClassColor(className: string): string {
  return CLASS_COLORS[className] || '#94a3b8'
}

function getConnectionClass(cameraId: string): string {
  const state = connectionStates[cameraId]
  if (state === 'connected') return 'sync-quality-good'
  if (state === 'connecting') return 'sync-quality-fair'
  return 'sync-quality-poor'
}

function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return 'N/A'
  return new Date(timestamp * 1000).toLocaleTimeString()
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
    console.log(`Video loaded for ${cameraId}: ${video.videoWidth}x${video.videoHeight}`)
  }
}

function startDrawing(cameraId: string) {
  // No longer using RAF loop - drawing is triggered by detection callbacks
  // Initial draw to clear canvas
  drawDetections(cameraId)
}

function drawDetections(cameraId: string) {
  // Skip if server-side rendering is enabled
  if (serverSideRendering.value) return

  const canvas = canvasRefs.value[cameraId]
  const video = videoRefs.value[cameraId]

  if (!canvas || !video || !video.videoWidth) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const detections = cameraDetections[cameraId]
  if (!detections || detections.length === 0) return

  // Draw each detection
  detections.forEach(detection => {
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

    // Draw label background
    const label = `${class_name} ${(confidence * 100).toFixed(0)}%`
    ctx.font = 'bold 14px Arial'
    const textMetrics = ctx.measureText(label)
    const textHeight = 20

    ctx.fillStyle = color
    ctx.fillRect(x, y - textHeight - 5, textMetrics.width + 10, textHeight)

    // Draw label text
    ctx.fillStyle = '#000'
    ctx.fillText(label, x + 5, y - 8)
  })
}

// Initialize WebRTC connections for each camera
async function initializeWebRTC() {
  for (const camera of cameras) {
    // Create WebRTC connection
    const connection = useWebRTCDetection(camera.id, {
      signalingUrl: 'http://localhost:8080',
      autoReconnect: true,
      reconnectDelay: 3000
    })

    webrtcConnections[camera.id] = connection

    // Set up reactive callback for immediate updates
    connection.setDetectionCallback((metadata) => {
      // Update state reactively when detections arrive
      cameraDetections[camera.id] = metadata.detections
      frameNumbers[camera.id] = metadata.frame_number
      detectionCounts[camera.id] = metadata.detection_count
      cameraTotalDetections[camera.id] = connection.totalDetections.value
      classCountsByCamera[camera.id] = connection.classCounts.value
      cameraStats[camera.id] = connection.stats.value

      // Only trigger canvas redraw if client-side rendering
      if (!serverSideRendering.value) {
        drawDetections(camera.id)
      }
    })

    // Wait for video element to be mounted
    await new Promise(resolve => setTimeout(resolve, 100))

    const videoEl = videoRefs.value[camera.id]
    if (!videoEl) {
      console.error(`Video element not found for ${camera.id}`)
      continue
    }

    try {
      // Connect WebRTC
      await connection.connect(videoEl)

      // Update connection states reactively
      const stateUpdateInterval = setInterval(() => {
        connectionStates[camera.id] = connection.connectionState.value
        dataChannelStates[camera.id] = connection.isDataChannelOpen.value
      }, 100) // Check connection state at 10 Hz

      // Store interval ID for cleanup
      animationFrames.value[camera.id] = stateUpdateInterval

      console.log(`WebRTC initialized for ${camera.id}`)
    } catch (error) {
      console.error(`Failed to initialize WebRTC for ${camera.id}:`, error)
    }
  }
}

// Lifecycle
onMounted(async () => {
  await initializeWebRTC()
})

onUnmounted(() => {
  // Clear all state update intervals
  Object.values(animationFrames.value).forEach(id => clearInterval(id))

  // Disconnect all WebRTC connections
  Object.values(webrtcConnections).forEach(conn => {
    conn.disconnect()
  })
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

.debug-toggle {
  background: #1e293b;
  color: #e2e8f0;
  border: 2px solid #475569;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.debug-toggle:hover {
  background: #334155;
  border-color: #64748b;
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

.debug-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid #334155;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #e2e8f0;
  min-width: 200px;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.debug-section {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #334155;
}

.debug-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.debug-section-header {
  font-weight: 700;
  color: #3b82f6;
  text-align: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.debug-label {
  color: #94a3b8;
  font-weight: 600;
}

.debug-value {
  color: #22c55e;
  font-weight: 700;
}

.sync-enabled {
  color: #22c55e !important;
  font-weight: 700;
}

.sync-quality-good {
  color: #22c55e !important;
  font-weight: 700;
}

.sync-quality-fair {
  color: #f59e0b !important;
  font-weight: 700;
}

.sync-quality-poor {
  color: #ef4444 !important;
  font-weight: 700;
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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
