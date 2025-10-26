<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-sidebar-border">
      <h1 class="text-base font-bold text-foreground">Focus View - WebRTC Detection</h1>
      <div class="flex items-center space-x-3">
        <div class="flex items-center gap-2">
          <div :class="['status-indicator', { connected: isConnected }]" />
          <span class="text-xs text-muted-foreground">
            {{ isConnected ? 'Connected' : 'Connecting...' }}
          </span>
        </div>
        <span class="text-xs text-muted-foreground">
          {{ cameras.length }} cameras
        </span>
        <button
          @click="refreshCameras"
          class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Main Layout: Primary Camera + Thumbnail Strip -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Primary Camera Feed -->
      <div class="flex-1 p-4">
        <div v-if="selectedCamera" class="camera-container h-full">
          <div class="camera-header">
            <div class="camera-info">
              <div class="camera-name">{{ selectedCamera.name }}</div>
              <div class="camera-meta">
                <span class="frame-number">Frame: #{{ frameNumber }}</span>
                <span class="detection-count">{{ detectionCount }} objects</span>
              </div>
            </div>
            <div :class="['connection-badge', { connected: connectionState === 'connected' }]">
              {{ connectionState || 'disconnected' }}
            </div>
          </div>

          <div class="video-wrapper">
            <video
              ref="primaryVideoRef"
              autoplay
              muted
              playsinline
              @loadedmetadata="onVideoLoaded"
              @play="startDrawing"
            />

            <!-- Detection Overlay (Canvas) -->
            <canvas ref="primaryCanvasRef" class="canvas-overlay" />

            <div v-if="!videoDimensions" class="no-stream">
              <div class="spinner"></div>
              <p>Initializing WebRTC...</p>
            </div>

            <!-- Video Metrics Overlay -->
            <VideoMetrics
              v-if="selectedCamera && currentConnection"
              :camera-id="selectedCamera.id"
              :connection-quality="currentConnection.connectionQuality"
              :stats="currentConnection.stats"
              :connection-state="connectionState"
            />
          </div>

          <!-- Detection Legend -->
          <div class="detection-legend">
            <template v-if="classCounts && Object.keys(classCounts).length > 0">
              <div
                v-for="(count, className) in classCounts"
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
        </div>
        <div v-else class="h-full flex items-center justify-center text-muted-foreground">
          Select a camera to view
        </div>
      </div>

      <!-- Thumbnail Strip -->
      <div class="w-64 border-l bg-card p-2 overflow-y-auto">
        <h3 class="text-sm font-semibold mb-2 px-2">All Cameras</h3>
        <div class="space-y-2">
          <div
            v-for="camera in cameras"
            :key="camera.id"
            @click="selectCamera(camera)"
            :class="[
              'camera-thumbnail',
              { 'selected': selectedCamera?.id === camera.id }
            ]"
          >
            <div class="thumbnail-header">
              <span class="thumbnail-name">{{ camera.name }}</span>
              <div
                :class="['thumbnail-status', { connected: connectionStatuses[camera.id] }]"
              />
            </div>
            <div class="thumbnail-video-container">
              <video
                :ref="el => thumbnailVideoRefs[camera.id] = el as HTMLVideoElement"
                autoplay
                muted
                playsinline
                class="thumbnail-video"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import VideoMetrics from '@/components/features/camera/VideoMetrics.vue'
import type { Detection } from '@/types/detection.types'

interface Camera {
  id: string
  name: string
}

// Global connection manager
const {
  cameras,
  isInitialized,
  isInitializing,
  connections,
  connectionStatuses,
  attachToVideoElement,
  getConnection
} = useCameraConnectionManager()

// Server-side rendering flag
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
const selectedCamera = ref<Camera | null>(null)
const primaryVideoRef = ref<HTMLVideoElement | null>(null)
const primaryCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbnailVideoRefs = ref<Record<string, HTMLVideoElement | null>>({})

// Current camera state (switches instantly)
const videoDimensions = ref<{ width: number; height: number } | null>(null)
const currentDetections = ref<Detection[]>([])
const frameNumber = ref(0)
const detectionCount = ref(0)
const classCounts = ref<Record<string, number>>({})
const connectionState = ref<RTCPeerConnectionState>('new')

// Computed
const isConnected = computed(() => connectionState.value === 'connected')
const currentConnection = computed(() => {
  if (!selectedCamera.value) return null
  const conn = getConnection(selectedCamera.value.id)
  console.log(`[FocusView] currentConnection for ${selectedCamera.value.id}:`, conn?.connection)
  if (conn?.connection) {
    console.log(`[FocusView] - connectionQuality:`, conn.connection.connectionQuality)
    console.log(`[FocusView] - stats:`, conn.connection.stats)
  }
  return conn?.connection || null
})

// Methods
function getClassColor(className: string): string {
  return CLASS_COLORS[className] || '#94a3b8'
}

function onVideoLoaded() {
  const video = primaryVideoRef.value
  const canvas = primaryCanvasRef.value

  if (video && canvas && video.videoWidth > 0) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    videoDimensions.value = {
      width: video.videoWidth,
      height: video.videoHeight
    }
  }
}

function startDrawing() {
  // Initial draw to clear canvas
  drawDetections()
}

function drawDetections() {
  // Skip if server-side rendering is enabled
  if (serverSideRendering.value) return

  const canvas = primaryCanvasRef.value
  const video = primaryVideoRef.value

  if (!canvas || !video || !video.videoWidth) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const detections = currentDetections.value
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

// Attach thumbnail videos to global connections
async function attachThumbnailVideos() {
  console.log('[FocusView] Attaching thumbnail videos to global connections...')

  // If connections aren't initialized yet, wait (only happens on first load)
  if (!isInitialized.value) {
    console.log('[FocusView] Waiting for connections to initialize...')
    const maxWait = 10000 // 10 seconds
    const startTime = Date.now()
    while (!isInitialized.value && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!isInitialized.value) {
      console.error('[FocusView] Timeout waiting for connections to initialize')
      return
    }
  } else {
    console.log('[FocusView] Connections already initialized - instant attach!')
  }

  // Minimal wait for video elements to be in DOM
  await new Promise(resolve => setTimeout(resolve, 50))

  // Attach each thumbnail video to its corresponding global connection
  for (const camera of cameras.value) {
    const thumbnailVideo = thumbnailVideoRefs.value[camera.id]
    if (!thumbnailVideo) {
      console.warn(`[FocusView] Thumbnail video not found for ${camera.id}, retrying...`)
      // Retry once after a short delay
      await new Promise(resolve => setTimeout(resolve, 50))
      const retryVideo = thumbnailVideoRefs.value[camera.id]
      if (!retryVideo) {
        console.error(`[FocusView] Still no video element for ${camera.id}`)
        continue
      }
    }

    const videoElement = thumbnailVideoRefs.value[camera.id]
    if (!videoElement) continue

    // Attach to global connection (stream already flowing!)
    const attached = attachToVideoElement(camera.id, videoElement)
    if (attached) {
      console.log(`[FocusView] ✓ Instantly attached ${camera.id} (stream was ready)`)
    }

    // Set up detection callback for this camera (idempotent - safe to call multiple times)
    const conn = getConnection(camera.id)
    if (conn) {
      conn.connection.setDetectionCallback((metadata) => {
        // If this is the selected camera, update the main view
        if (selectedCamera.value?.id === camera.id) {
          currentDetections.value = metadata.detections
          frameNumber.value = metadata.frame_number
          detectionCount.value = metadata.detection_count
          classCounts.value = conn.connection.classCounts.value

          // Only trigger canvas redraw if client-side rendering
          if (!serverSideRendering.value) {
            drawDetections()
          }
        }
      })
    }
  }

  // Monitor connection state for selected camera
  setInterval(() => {
    if (selectedCamera.value) {
      const conn = getConnection(selectedCamera.value.id)
      if (conn) {
        connectionState.value = conn.connection.connectionState.value
      }
    }
  }, 100)

  console.log('[FocusView] All thumbnails attached')
}

// Select camera (instant switch - no reconnection needed)
function selectCamera(camera: Camera) {
  console.log(`[FocusView] Switching to ${camera.id}`)

  selectedCamera.value = camera
  videoDimensions.value = null

  // Get connection from global manager
  const conn = getConnection(camera.id)
  if (!conn) {
    console.error(`[FocusView] No connection found for ${camera.id}`)
    return
  }

  // Attach stream to main video
  if (primaryVideoRef.value) {
    attachToVideoElement(camera.id, primaryVideoRef.value)
  }

  // Update state immediately
  currentDetections.value = conn.connection.currentDetections.value
  frameNumber.value = conn.connection.frameNumber.value
  detectionCount.value = conn.connection.detectionCount.value
  classCounts.value = conn.connection.classCounts.value
  connectionState.value = conn.connection.connectionState.value
}

const refreshCameras = () => {
  console.log('Refreshing cameras...')
}

onMounted(async () => {
  // Attach thumbnails to global connections (connections are already initialized globally)
  await attachThumbnailVideos()

  // Auto-select first camera
  if (cameras.value.length > 0) {
    selectCamera(cameras.value[0])
  }
})

onUnmounted(() => {
  // Note: We don't disconnect here because connections are global
  // They stay active for instant loading on other pages
  console.log('[FocusView] Unmounting (connections remain active)')
})
</script>

<style scoped>
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

.camera-container {
  display: flex;
  flex-direction: column;
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
  color: #e2e8f0;
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

.video-wrapper {
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex: 1;
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
  color: #e2e8f0;
}

.legend-count {
  font-weight: 600;
  color: #3b82f6;
}

.no-detections {
  color: #64748b;
  font-size: 0.875rem;
}

.camera-thumbnail {
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.camera-thumbnail:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.camera-thumbnail.selected {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.thumbnail-header {
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thumbnail-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
  flex: 1;
}

.thumbnail-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  flex-shrink: 0;
}

.thumbnail-status.connected {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.thumbnail-video-container {
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  position: relative;
}

.thumbnail-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
