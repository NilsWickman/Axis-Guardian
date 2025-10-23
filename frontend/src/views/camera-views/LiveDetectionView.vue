<template>
  <div class="live-detection-view">
    <!-- Header -->
    <div class="header">
      <h1>🎥 Live Detection Viewer</h1>
      <p class="subtitle">Real-time Object Detection with VAPIX-Compliant Bounding Boxes</p>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-item">
        <div :class="['status-indicator', { connected: isConnected }]" />
        <span>MQTT: {{ isConnected ? 'Connected' : 'Connecting...' }}</span>
      </div>
      <div class="status-item">
        <div :class="['status-indicator', 'connected']" />
        <span>Streams: {{ cameras.length }} active</span>
      </div>
      <div class="status-item">
        <span>Total Detections: <strong>{{ totalDetections }}</strong></span>
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
          <div class="camera-name">{{ camera.name }}</div>
          <div class="detection-count">
            {{ cameraDetections[camera.id]?.count || 0 }} objects
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
            crossorigin="anonymous"
            @loadedmetadata="onVideoLoaded(camera.id)"
            @play="startDrawing(camera.id)"
          >
            <source :src="camera.streamUrl" type="application/x-mpegURL" />
          </video>
          <canvas
            :ref="el => canvasRefs[camera.id] = el"
            :id="`canvas-${camera.id}`"
            class="canvas-overlay"
          />
          <div v-if="!videoLoaded[camera.id]" class="no-stream">Loading stream...</div>

          <!-- Debug Timing Overlay -->
          <div v-if="showDebugOverlay" class="debug-overlay">
            <div class="debug-section">
              <div class="debug-label">Video Playback:</div>
              <div class="debug-value">{{ videoPlaybackTimes[camera.id]?.toFixed(2) || '0.00' }}s</div>
            </div>
            <template v-if="getTiming(camera.id)?.value">
              <div class="debug-section">
                <div class="debug-label">Detection Time:</div>
                <div class="debug-value">{{ new Date(getTiming(camera.id)!.value!.frame_timestamp * 1000).toLocaleTimeString() }}</div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Processing Latency:</div>
                <div class="debug-value">{{ getTiming(camera.id)?.value?.processing_latency_ms.toFixed(1) }}ms</div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Sync Offset:</div>
                <div class="debug-value" :class="{ 'sync-warning': Math.abs(getTiming(camera.id)?.value?.detection_delay_ms || 0) > 0 }">
                  {{ getTiming(camera.id)?.value?.detection_delay_ms }}ms
                </div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Stream Delay:</div>
                <div class="debug-value" :class="{ 'sync-warning': getStreamDelay(camera.id) > 1000 }">
                  {{ (getStreamDelay(camera.id) / 1000).toFixed(1) }}s
                </div>
              </div>
              <div v-if="getTiming(camera.id)?.value?.pts_based" class="debug-section">
                <div class="debug-label">Video PTS:</div>
                <div class="debug-value">{{ (getTiming(camera.id)?.value?.video_pts_ms / 1000).toFixed(1) }}s</div>
              </div>
              <div v-if="getTiming(camera.id)?.value?.pts_based" class="debug-section">
                <div class="debug-label">Loops:</div>
                <div class="debug-value">{{ getTiming(camera.id)?.value?.loop_count }}</div>
              </div>
              <div class="debug-section">
                <div class="debug-label">PTS Mode:</div>
                <div class="debug-value" :class="{ 'sync-enabled': getTiming(camera.id)?.value?.use_video_pts }">
                  {{ getTiming(camera.id)?.value?.use_video_pts ? 'Enabled' : 'Disabled' }}
                </div>
              </div>
            </template>

            <!-- Adaptive Sync Metrics -->
            <div v-if="getMetrics(camera.id)?.value">
              <div class="debug-divider"></div>
              <div class="debug-section-header">Adaptive Sync</div>
              <div class="debug-section">
                <div class="debug-label">HLS Latency:</div>
                <div class="debug-value" :class="getMetrics(camera.id)?.value ? getSyncQualityClass(getMetrics(camera.id).value.quality) : ''">
                  {{ getMetrics(camera.id)?.value?.latency_ms?.toFixed(0) ?? 'N/A' }}ms
                </div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Sync Quality:</div>
                <div class="debug-value" :class="getMetrics(camera.id)?.value ? getSyncQualityClass(getMetrics(camera.id).value.quality) : ''">
                  {{ getMetrics(camera.id)?.value?.quality?.toUpperCase() ?? 'N/A' }}
                </div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Suggested Offset:</div>
                <div class="debug-value">
                  {{ getMetrics(camera.id)?.value?.suggested_offset_ms?.toFixed(0) ?? 'N/A' }}ms
                </div>
              </div>
              <div class="debug-section">
                <div class="debug-label">Measurements:</div>
                <div class="debug-value">
                  {{ getMetrics(camera.id)?.value?.measurement_count ?? 0 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detection Legend -->
        <div class="detection-legend">
          <template v-if="Object.keys(cameraDetections[camera.id]?.classCounts || {}).length > 0">
            <div
              v-for="(count, className) in cameraDetections[camera.id]?.classCounts"
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
          <template v-if="cameraDetections[camera.id]?.detections?.length">
            <div
              v-for="(det, idx) in cameraDetections[camera.id].detections"
              :key="idx"
              class="coordinate-item"
            >
              [{{ idx + 1 }}] {{ det.class_name }} ({{ (det.confidence * 100).toFixed(1) }}%) -
              VAPIX: left={{ det.bbox.left.toFixed(3) }}, top={{ det.bbox.top.toFixed(3) }},
              right={{ det.bbox.right.toFixed(3) }}, bottom={{ det.bbox.bottom.toFixed(3) }}
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
import { useDetections } from '@/composables/useDetections'
import { useVideoSync } from '@/composables/useVideoSync'
import Hls from 'hls.js'

interface Camera {
  id: string
  name: string
  streamUrl: string
}

interface Detection {
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
    x1: number
    y1: number
    x2: number
    y2: number
    width: number
    height: number
  }
  confidence: number
  class_name: string
  class_id: number
  timestamp: number
}

interface CameraDetectionData {
  detections: Detection[]
  count: number
  classCounts: Record<string, number>
}

// Cameras configuration
const cameras: Camera[] = [
  {
    id: 'camera1',
    name: 'Camera 1 - People Detection',
    streamUrl: 'http://localhost:8888/camera1/index.m3u8'
  },
  {
    id: 'camera2',
    name: 'Camera 2 - Car Detection',
    streamUrl: 'http://localhost:8888/camera2/index.m3u8'
  },
  {
    id: 'camera3',
    name: 'Camera 3 - Mixed Detection',
    streamUrl: 'http://localhost:8888/camera3/index.m3u8'
  }
]

// Class colors (VAPIX-style)
const CLASS_COLORS: Record<string, string> = {
  person: '#22c55e',
  car: '#3b82f6',
  truck: '#ef4444',
  bus: '#06b6d4',
  motorbike: '#a855f7',
  bicycle: '#eab308'
}

// Detection composable
const { isConnected, connect, subscribe, getDetections, getTotalCount, getTiming } = useDetections()

// Video sync composable
const { connect: connectSync, startMonitoring, stopMonitoring, getMetrics } = useVideoSync()

// Refs
const videoRefs = ref<Record<string, HTMLVideoElement | null>>({})
const canvasRefs = ref<Record<string, HTMLCanvasElement | null>>({})
const videoLoaded = ref<Record<string, boolean>>({})
const cameraDetections = reactive<Record<string, CameraDetectionData>>({})
const animationFrames = ref<Record<string, number>>({})
const hlsInstances = ref<Record<string, Hls>>({})
const videoPlaybackTimes = ref<Record<string, number>>({})
const showDebugOverlay = ref(true)

// Initialize camera detection data
cameras.forEach(camera => {
  cameraDetections[camera.id] = { detections: [], count: 0, classCounts: {} }
  videoLoaded.value[camera.id] = false
  videoPlaybackTimes.value[camera.id] = 0
})

// Update video playback time continuously
setInterval(() => {
  cameras.forEach(camera => {
    const video = videoRefs.value[camera.id]
    if (video && !video.paused) {
      videoPlaybackTimes.value[camera.id] = video.currentTime
    }
  })
}, 100)

// Computed
const totalDetections = computed(() => {
  return Object.values(cameraDetections).reduce((sum, data) => sum + data.count, 0)
})

// Methods
function getClassColor(className: string): string {
  return CLASS_COLORS[className] || '#94a3b8'
}

function getSyncQualityClass(quality: 'good' | 'fair' | 'poor'): string {
  switch (quality) {
    case 'good':
      return 'sync-quality-good'
    case 'fair':
      return 'sync-quality-fair'
    case 'poor':
      return 'sync-quality-poor'
    default:
      return ''
  }
}

function getStreamDelay(cameraId: string): number {
  const timing = getTiming(cameraId)?.value
  if (!timing) return 0

  // Calculate how far behind the video player is compared to real-time detections
  // Positive value means video is behind (delayed)
  const now = Date.now() / 1000 // Current time in seconds
  const detectionTime = timing.frame_timestamp
  const streamDelay = (now - detectionTime) * 1000 // Convert to milliseconds

  return Math.max(0, streamDelay)
}

function onVideoLoaded(cameraId: string) {
  const video = videoRefs.value[cameraId]
  const canvas = canvasRefs.value[cameraId]

  if (video && canvas) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    videoLoaded.value[cameraId] = true
  }
}

function startDrawing(cameraId: string) {
  const draw = () => {
    drawDetections(cameraId)
    animationFrames.value[cameraId] = requestAnimationFrame(draw)
  }
  draw()
}

function drawDetections(cameraId: string) {
  const canvas = canvasRefs.value[cameraId]
  const video = videoRefs.value[cameraId]

  if (!canvas || !video || !video.videoWidth) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const detections = cameraDetections[cameraId]?.detections
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

function updateDetections(cameraId: string, detections: Detection[]) {
  // Note: We don't filter by timestamp age here because DETECTION_DELAY_MS
  // can make detections appear very old (e.g., -10000ms for HLS sync).
  // The MQTT stream already provides fresh detections, so we show them all.

  // Count by class
  const classCounts: Record<string, number> = {}
  detections.forEach(det => {
    classCounts[det.class_name] = (classCounts[det.class_name] || 0) + 1
  })

  cameraDetections[cameraId] = {
    detections: detections,
    count: detections.length,
    classCounts
  }
}

// Initialize HLS for a camera
function initializeHLS(camera: Camera) {
  const video = videoRefs.value[camera.id]
  if (!video) return

  if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    })

    hls.loadSource(camera.streamUrl)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(e => console.error('Error playing video:', e))

      // Start sync monitoring for this camera
      // Note: Need to pass refs, not raw objects
      const videoRef = computed(() => videoRefs.value[camera.id])
      const hlsRef = computed(() => hlsInstances.value[camera.id])
      startMonitoring(camera.id, videoRef, hlsRef)
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS fatal error:', data)
        // Try to recover
        setTimeout(() => {
          hls.loadSource(camera.streamUrl)
        }, 1000)
      }
    })

    hlsInstances.value[camera.id] = hls
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    video.src = camera.streamUrl
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(e => console.error('Error playing video:', e))

      // Start sync monitoring for native HLS
      const videoRef = computed(() => videoRefs.value[camera.id])
      const hlsRef = ref<Hls | null>(null)
      startMonitoring(camera.id, videoRef, hlsRef)
    })
  }
}

// Setup MQTT subscriptions
async function setupDetections() {
  await connect()

  cameras.forEach(async camera => {
    await subscribe(camera.id)

    // Watch for new detections
    const detectionGetter = getDetections(camera.id)
    const unwatchDetections = setInterval(() => {
      const dets = detectionGetter.value
      if (dets && dets.length > 0) {
        updateDetections(camera.id, dets as Detection[])
      }
    }, 100)

    // Store cleanup
    onUnmounted(() => clearInterval(unwatchDetections))
  })
}

// Setup adaptive sync monitoring
async function setupAdaptiveSync() {
  try {
    await connectSync()
    console.log('Adaptive sync initialized')
  } catch (err) {
    console.warn('Adaptive sync not available:', err)
    // Continue without adaptive sync
  }
}

// Lifecycle
onMounted(() => {
  // Initialize HLS for each camera
  cameras.forEach(camera => {
    // Wait a bit for video elements to be mounted
    setTimeout(() => initializeHLS(camera), 100)
  })

  // Setup detection and sync systems
  setupDetections()
  setupAdaptiveSync()
})

onUnmounted(() => {
  // Cancel all animation frames
  Object.values(animationFrames.value).forEach(id => cancelAnimationFrame(id))

  // Stop sync monitoring for all cameras
  cameras.forEach(camera => stopMonitoring(camera.id))

  // Destroy HLS instances
  Object.values(hlsInstances.value).forEach(hls => {
    hls.destroy()
  })
})
</script>

<style scoped>
.live-detection-view {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.subtitle {
  color: #94a3b8;
  font-size: 1rem;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1e293b;
  border-radius: 8px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background: #22c55e;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

.camera-name {
  font-size: 1.25rem;
  font-weight: 600;
}

.detection-count {
  background: #3b82f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
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

.debug-label {
  color: #94a3b8;
  font-weight: 600;
}

.debug-value {
  color: #22c55e;
  font-weight: 700;
}

.sync-warning {
  color: #f59e0b !important;
  animation: pulse-warning 2s infinite;
}

.sync-enabled {
  color: #22c55e !important;
  font-weight: 700;
}

@keyframes pulse-warning {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.debug-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #475569, transparent);
  margin: 12px 0;
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
</style>
