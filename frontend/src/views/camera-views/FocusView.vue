<template>
  <div class="h-full w-full bg-background flex overflow-hidden">
    <!-- Main Layout: Primary Camera + Thumbnail Strip -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Primary Camera Feed -->
      <div class="flex-1">
        <div class="flex flex-col bg-background overflow-hidden w-full h-full">
          <div class="relative bg-background w-full h-full overflow-hidden">
            <video
              ref="primaryVideoRef"
              autoplay
              muted
              playsinline
              @loadedmetadata="onVideoLoaded"
              @play="startDrawing"
              class="w-full h-full object-cover block"
            />

            <!-- Detection Overlay (Canvas) -->
            <canvas ref="primaryCanvasRef" class="absolute top-0 left-0 w-full h-full pointer-events-none" />

            <div v-if="!selectedCamera || !videoDimensions" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground">
              <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <p v-if="!selectedCamera">Loading camera...</p>
              <p v-else>Initializing WebRTC...</p>
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
        </div>
      </div>

      <!-- Thumbnail Strip -->
      <div class="w-64 border-l border-border bg-card p-2 overflow-y-auto">
        <h3 class="text-sm font-semibold mb-2 px-2 text-foreground">All Cameras</h3>
        <div class="space-y-2">
          <div
            v-for="camera in cameras"
            :key="camera.id"
            @click="selectCamera(camera)"
            :class="[
              'p-2 rounded-lg cursor-pointer transition-all duration-200 border-2',
              'bg-muted/70 shadow-md dark:shadow-sm dark:shadow-black/20',
              selectedCamera?.id === camera.id
                ? 'bg-background border-primary/70 shadow-lg dark:shadow-md'
                : 'border hover:bg-accent hover:border-primary/30 hover:shadow-lg dark:hover:shadow-md'
            ]"
          >
            <div class="mb-1.5 flex justify-between items-center">
              <span class="text-xs font-semibold text-foreground flex-1">{{ camera.name }}</span>
              <div
                :class="[
                  'w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200',
                  connectionStatuses[camera.id]
                    ? 'bg-green-500'
                    : 'destructive'
                ]"
              />
            </div>
            <div class="bg-background rounded-md overflow-hidden aspect-video relative border border-border/30">
              <video
                :ref="el => thumbnailVideoRefs[camera.id] = el as HTMLVideoElement"
                autoplay
                muted
                playsinline
                class="w-full h-full object-cover block"
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
const currentConnection = computed(() => {
  if (!selectedCamera.value) return null
  const conn = getConnection(selectedCamera.value.id)
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

// Attach thumbnail videos to global connections with robust retry logic
async function attachThumbnailVideos() {
  console.log('[FocusView] Starting video attachment process')

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
    console.log('[FocusView] Connections initialized successfully')
  }

  // Robust retry logic for DOM element availability
  const maxRetries = 10
  const retryDelay = 100 // ms

  // Attach each thumbnail video to its corresponding global connection
  for (const camera of cameras.value) {
    let videoElement: HTMLVideoElement | null = null
    let retries = 0

    // Retry until we find the video element or max retries reached
    while (!videoElement && retries < maxRetries) {
      videoElement = thumbnailVideoRefs.value[camera.id]
      if (!videoElement) {
        retries++
        console.log(`[FocusView] Waiting for ${camera.id} video element (attempt ${retries}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (!videoElement) {
      console.error(`[FocusView] Failed to find video element for ${camera.id} after ${maxRetries} retries`)
      continue
    }

    console.log(`[FocusView] Attaching stream to ${camera.id} thumbnail`)

    // Attach to global connection (stream already flowing!)
    const attached = attachToVideoElement(camera.id, videoElement)
    if (!attached) {
      console.warn(`[FocusView] Failed to attach stream to ${camera.id}`)
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

  console.log('[FocusView] All thumbnails attached successfully')

  // Monitor connection state for selected camera
  setInterval(() => {
    if (selectedCamera.value) {
      const conn = getConnection(selectedCamera.value.id)
      if (conn) {
        connectionState.value = conn.connection.connectionState.value
      }
    }
  }, 100)
}

// Select camera (instant switch - no reconnection needed)
function selectCamera(camera: Camera) {
  console.log(`[FocusView] Selecting camera: ${camera.id}`)

  selectedCamera.value = camera
  videoDimensions.value = null

  // Get connection from global manager
  const conn = getConnection(camera.id)
  if (!conn) {
    console.error(`[FocusView] No connection found for ${camera.id}`)
    return
  }

  // Attach stream to main video with retry logic
  if (primaryVideoRef.value) {
    const attached = attachToVideoElement(camera.id, primaryVideoRef.value)
    if (attached) {
      console.log(`[FocusView] Successfully attached ${camera.id} to primary video`)
    } else {
      console.warn(`[FocusView] Failed to attach ${camera.id} to primary video, will retry...`)
      // Retry after a short delay
      setTimeout(() => {
        if (primaryVideoRef.value && selectedCamera.value?.id === camera.id) {
          const retryAttached = attachToVideoElement(camera.id, primaryVideoRef.value)
          if (retryAttached) {
            console.log(`[FocusView] Retry successful for ${camera.id}`)
          } else {
            console.error(`[FocusView] Retry failed for ${camera.id}`)
          }
        }
      }, 200)
    }
  }

  // Update state immediately
  currentDetections.value = conn.connection.currentDetections.value
  frameNumber.value = conn.connection.frameNumber.value
  detectionCount.value = conn.connection.detectionCount.value
  classCounts.value = conn.connection.classCounts.value
  connectionState.value = conn.connection.connectionState.value
}

onMounted(async () => {
  // Attach thumbnails to global connections (connections are already initialized globally)
  await attachThumbnailVideos()

  // Wait a tick to ensure primary video ref is ready in DOM
  await new Promise(resolve => setTimeout(resolve, 50))

  // Auto-select first camera
  if (cameras.value.length > 0 && primaryVideoRef.value) {
    console.log('[FocusView] Auto-selecting first camera on mount')
    selectCamera(cameras.value[0])
  } else if (!primaryVideoRef.value) {
    console.warn('[FocusView] Primary video ref not ready, retrying...')
    // Retry after a short delay
    setTimeout(() => {
      if (cameras.value.length > 0 && primaryVideoRef.value) {
        selectCamera(cameras.value[0])
      }
    }, 200)
  }
})

onUnmounted(() => {
  // Note: We don't disconnect here because connections are global
  // They stay active for instant loading on other pages
})
</script>
