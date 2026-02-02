<template>
  <div class="h-full w-full bg-background flex flex-col lg:flex-row overflow-hidden">
    <!-- Main Content: Leaflet Map -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
      <div
        v-if="activeView === 'map'"
        class="flex-1 relative overflow-hidden"
        style="background-color: var(--canvas-background)"
      >
        <div ref="mapContainer" class="absolute inset-0"></div>

        <!-- Mouse Coordinates Display -->
        <div
          v-if="mouseCoords"
          class="absolute bottom-4 left-4 px-3 py-2 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap font-mono z-[1000]"
        >
          X: {{ mouseCoords.x.toFixed(2) }}m, Y: {{ mouseCoords.y.toFixed(2) }}m
        </div>

        <!-- Loading Overlay -->
        <div
          v-if="showMapLoadingOverlay"
          class="absolute inset-0 flex items-center justify-center z-[1001]"
          style="background-color: var(--canvas-background)"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>{{ !currentMap ? 'Loading site map...' : 'Initializing...' }}</p>
          </div>
        </div>
      </div>

      <!-- Camera Feed (same as original) -->
      <div v-else class="flex-1 relative bg-background overflow-hidden">
        <video
          ref="primaryVideoRef"
          autoplay
          muted
          playsinline
          @loadedmetadata="onPrimaryVideoLoaded"
          class="w-full h-full object-cover block"
        />

        <canvas ref="primaryCanvasRef" class="absolute top-0 left-0 w-full h-full pointer-events-none" />

        <div
          v-if="!selectedCamera || !primaryVideoDimensions"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground"
        >
          <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p v-if="!selectedCamera">Select a camera...</p>
          <p v-else>Initializing WebRTC...</p>
        </div>

        <VideoMetrics
          v-if="selectedCamera && currentConnection"
          :camera-id="selectedCamera.id"
          :connection-quality="currentConnectionQuality"
          :stats="currentStats"
          :connection-state="connectionState"
        />
      </div>
    </div>

    <!-- Sidebar: Camera Cards -->
    <div
      class="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card p-2 overflow-y-auto flex-shrink-0 max-h-[40vh] lg:max-h-none"
    >
      <h3 class="text-sm font-semibold mb-2 px-2 text-foreground">Views</h3>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 gap-2">
        <!-- Site Map Card -->
        <div @click="selectMap" :class="cardClasses(activeView === 'map')">
          <div class="mb-1.5 flex justify-between items-center">
            <span class="text-xs font-semibold text-foreground flex-1 truncate">Site Map (Leaflet)</span>
            <span class="text-[10px] font-mono text-muted-foreground tabular-nums">
              {{ currentMap ? 'LIVE' : '...' }}
            </span>
          </div>
          <div
            class="bg-background rounded-md overflow-hidden aspect-video relative border border-border/30 flex items-center justify-center"
          >
            <div ref="previewMapContainer" class="absolute inset-0"></div>
            <span v-if="!currentMap" class="text-[11px] font-medium text-muted-foreground z-10">Map</span>
          </div>
        </div>

        <!-- Camera Cards -->
        <div
          v-for="camera in cameras"
          :key="camera.id"
          @click="selectCamera(camera)"
          :class="cardClasses(activeView === 'camera' && selectedCamera?.id === camera.id)"
        >
          <div class="mb-1.5 flex justify-between items-center">
            <span class="text-xs font-semibold text-foreground flex-1 truncate">{{ camera.name }}</span>
            <div class="flex items-center gap-1.5 ml-1 flex-shrink-0">
              <div
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-200',
                  connectionStatuses[camera.id] ? 'bg-green-500' : 'bg-destructive',
                ]"
              />
              <span class="text-[10px] font-mono text-muted-foreground tabular-nums">
                {{ getTrackingDelayLabel(camera.id) }}
              </span>
            </div>
          </div>

          <div class="bg-background rounded-md overflow-hidden aspect-video relative border border-border/30">
            <video
              :ref="el => (thumbnailVideoRefs[camera.id] = el as HTMLVideoElement)"
              autoplay
              muted
              playsinline
              class="w-full h-full object-cover block"
            />
            <div v-if="showVideoLoadingOverlay" class="absolute inset-0 flex items-center justify-center bg-black/70">
              <div class="text-center text-muted-foreground">
                <div class="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                <p class="text-xs">Loading...</p>
              </div>
            </div>
          </div>

          <DetectionMetadataPanel
            :metadata="cameraMetadataMap[camera.id]"
            class="mt-1.5 bg-muted/20 rounded px-1.5 py-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCameraStore } from '@/stores/cameras'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { useLeafletSiteMap, type TrackData } from '@/composables/useLeafletSiteMap'
import { useBackendWebSocket } from '@/composables/useBackendWebSocket'
import DetectionMetadataPanel from '@/components/features/camera/DetectionMetadataPanel.vue'
import VideoMetrics from '@/components/features/camera/VideoMetrics.vue'
import type { Detection } from '@/types/detection.types'
import {
  normalizePixelBbox,
  calculateObjectCoverTransform,
  transformBboxToCanvas,
} from '@/utils/bbox-transform'

interface Camera {
  id: string
  name: string
}

type ActiveView = 'map' | 'camera'

const route = useRoute()
const router = useRouter()

// Stores and composables
const cameraStore = useCameraStore()
const globalTrackStore = useGlobalTrackStore()
const { siteMap: currentMap, loadSiteMap } = useSiteMapConfig()

// Leaflet map composable
const leafletOptions = ref({
  showGrid: true,
  showCameraLabels: true,
})
const leaflet = useLeafletSiteMap(leafletOptions)

// Preview map composable
const previewLeafletOptions = ref({
  showGrid: false,
  showCameraLabels: false,
})
const previewLeaflet = useLeafletSiteMap(previewLeafletOptions)

// Map container refs
const mapContainer = ref<HTMLDivElement | null>(null)
const previewMapContainer = ref<HTMLDivElement | null>(null)

// WebSocket connection
const trackingWs = useBackendWebSocket({
  autoReconnect: true,
})

// Global connection manager
const {
  cameras,
  isInitialized,
  connectionStatuses,
  videoHealthByCamera,
  cameraMetadataMap,
  attachToVideoElement,
  getConnection,
} = useCameraConnectionManager()

// Selection state
const activeView = ref<ActiveView>('map')
const selectedCamera = ref<Camera | null>(null)

function setRouteSelection(nextView: ActiveView, nextCameraId?: string) {
  const q: Record<string, string> = { view: nextView }
  if (nextView === 'camera') {
    const cameraId = nextCameraId || selectedCamera.value?.id
    if (cameraId) q.cameraId = cameraId
  }
  void router.replace({ query: q })
}

function syncFromRoute() {
  const viewQuery = route.query.view
  const nextView = viewQuery === 'map' || viewQuery === 'camera' ? viewQuery : null
  if (nextView) activeView.value = nextView

  const cameraIdQuery = route.query.cameraId
  const cameraId = typeof cameraIdQuery === 'string' ? cameraIdQuery : null
  if (cameraId) {
    const cam = cameras.value.find(c => c.id === cameraId)
    if (cam) selectedCamera.value = cam
  }
}

watch(() => [route.query.view, route.query.cameraId], syncFromRoute, { immediate: true })
watch(cameras, syncFromRoute)

function selectMap() {
  activeView.value = 'map'
  setRouteSelection('map')
}

function selectCamera(camera: Camera) {
  selectedCamera.value = camera
  activeView.value = 'camera'
  setRouteSelection('camera', camera.id)
  void attachPrimaryVideo(camera.id)
}

// Card styling
function cardClasses(isActive: boolean) {
  return [
    'p-2 rounded-lg cursor-pointer transition-all duration-200 border-2',
    'bg-muted/70 shadow-md dark:shadow-sm dark:shadow-black/20',
    isActive
      ? 'bg-background border-primary/70 shadow-lg dark:shadow-md'
      : 'border hover:bg-accent hover:border-primary/30 hover:shadow-lg dark:hover:shadow-md',
  ]
}

// Loading states
const isBootLoading = ref(true)
const showMapLoadingOverlay = computed(() => !currentMap.value || isBootLoading.value || !leaflet.mapRef.value)
const showVideoLoadingOverlay = computed(() => isBootLoading.value)

// Tracking delay display
const TRACKING_DELAY_AVG_WINDOW_MS = 5000
const delaySamplesByCamera = ref(new Map<string, Array<{ t: number; v: number }>>())

function recordDelaySamples(now: number) {
  for (const camera of cameras.value) {
    const frame = globalTrackStore.getFrameInfoForCamera(camera.id)
    if (!frame?.timestamp) continue

    const delay = Math.max(0, now - frame.timestamp)
    const existing = delaySamplesByCamera.value.get(camera.id) ?? []
    existing.push({ t: now, v: delay })

    const cutoff = now - TRACKING_DELAY_AVG_WINDOW_MS
    while (existing.length > 0 && existing[0].t < cutoff) {
      existing.shift()
    }

    delaySamplesByCamera.value.set(camera.id, existing)
  }
}

function getTrackingDelayLabel(cameraId: string): string {
  const vh = videoHealthByCamera.value[cameraId]
  if (connectionStatuses.value[cameraId] && vh && vh.stallMs > 1500) {
    return `FROZEN ${Math.round(vh.stallMs)}ms`
  }

  const samples = delaySamplesByCamera.value.get(cameraId)
  if (!samples || samples.length === 0) return '--ms'
  const avg = samples.reduce((sum, s) => sum + s.v, 0) / samples.length
  return `${Math.round(avg)}ms`
}

// Mouse coordinates from Leaflet
const mouseCoords = computed(() => leaflet.getMouseCoordinates())

// Camera name helper
const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

// Initialize and render the Leaflet map
async function initializeMap() {
  if (!currentMap.value) {
    await loadSiteMap()
  }
  if (!currentMap.value || !mapContainer.value) return

  // Wait for container to have dimensions
  await nextTick()
  for (let i = 0; i < 30; i++) {
    if (mapContainer.value?.clientWidth && mapContainer.value?.clientHeight) break
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }

  if (!mapContainer.value?.clientWidth) return

  // Initialize the map
  leaflet.initMap(mapContainer.value, currentMap.value)

  // Draw all layers
  leaflet.drawGrid()
  leaflet.drawWalls(currentMap.value.walls)
  leaflet.drawObstacles(currentMap.value.obstacles)
  leaflet.drawCameras(
    currentMap.value.cameras,
    getCameraName,
    currentMap.value.walls,
    currentMap.value.obstacles
  )

  isBootLoading.value = false
}

// Initialize preview map
async function initializePreviewMap() {
  if (!currentMap.value || !previewMapContainer.value) return

  await nextTick()
  for (let i = 0; i < 10; i++) {
    if (previewMapContainer.value?.clientWidth && previewMapContainer.value?.clientHeight) break
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }

  if (!previewMapContainer.value?.clientWidth) return

  previewLeaflet.initMap(previewMapContainer.value, currentMap.value)

  previewLeaflet.drawWalls(currentMap.value.walls)
  previewLeaflet.drawObstacles(currentMap.value.obstacles)
  previewLeaflet.drawCameras(
    currentMap.value.cameras,
    getCameraName,
    currentMap.value.walls,
    currentMap.value.obstacles
  )
}

// Update tracks on the map
let trackUpdateInterval: number | null = null

function updateTracksOnMap() {
  if (!leaflet.mapRef.value) return

  const tracks = globalTrackStore.activeTracks
  const trackData: TrackData[] = tracks.map(track => ({
    id: track.globalTrackId,
    position: track.predictedPosition || track.currentPosition,
    color: track.color,
    trail: track.trail?.slice(-20),
    isGhost: !!track.predictedPosition,
  }))

  leaflet.updateTracks(trackData)

  // Also update preview
  if (previewLeaflet.mapRef.value) {
    previewLeaflet.updateTracks(trackData)
  }
}

// Camera video handling
const thumbnailVideoRefs = ref<Record<string, HTMLVideoElement | null>>({})
const primaryVideoRef = ref<HTMLVideoElement | null>(null)
const primaryCanvasRef = ref<HTMLCanvasElement | null>(null)
const primaryVideoDimensions = ref<{ width: number; height: number } | null>(null)
const currentDetections = ref<Detection[]>([])
const connectionState = ref<RTCPeerConnectionState>('new')

const currentConnection = computed(() => {
  if (!selectedCamera.value) return null
  const conn = getConnection(selectedCamera.value.id)
  return conn?.connection || null
})

const currentConnectionQuality = computed(() => currentConnection.value?.connectionQuality.value)
const currentStats = computed(() => currentConnection.value?.stats.value)

const CLASS_COLORS: Record<string, string> = {
  person: '#22c55e',
  car: '#3b82f6',
  truck: '#ef4444',
  bus: '#06b6d4',
  motorbike: '#a855f7',
  bicycle: '#eab308',
}

/**
 * Update canvas dimensions to match container size.
 * This ensures the canvas overlay aligns with the video element.
 */
function updateVideoLayout() {
  const canvas = primaryCanvasRef.value
  if (!canvas) return

  const containerW = canvas.clientWidth
  const containerH = canvas.clientHeight

  // Set canvas drawing surface to match container
  canvas.width = containerW
  canvas.height = containerH
}

function onPrimaryVideoLoaded() {
  const video = primaryVideoRef.value
  if (!video || video.videoWidth <= 0) return

  primaryVideoDimensions.value = { width: video.videoWidth, height: video.videoHeight }
  updateVideoLayout()
}

function drawDetections() {
  const canvasEl = primaryCanvasRef.value
  const video = primaryVideoRef.value
  if (!canvasEl || !video || !primaryVideoDimensions.value) return

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
  if (currentDetections.value.length === 0) return

  const videoW = video.videoWidth
  const videoH = video.videoHeight

  // Calculate object-cover transform (how CSS scales/crops the video)
  const transform = calculateObjectCoverTransform(
    videoW,
    videoH,
    canvasEl.width,
    canvasEl.height
  )

  for (const detection of currentDetections.value) {
    const { class_name, confidence } = detection
    const color = CLASS_COLORS[class_name] || '#94a3b8'

    // Camera-emulator always sends pixel coordinates [x, y, w, h]
    // Runtime check for array (type says object but actual data is array)
    const rawBbox = detection.bbox as unknown
    let pixelBbox: [number, number, number, number]

    if (Array.isArray(rawBbox)) {
      pixelBbox = rawBbox as [number, number, number, number]
    } else if (rawBbox && typeof rawBbox === 'object') {
      // Convert object format {left, top, right, bottom} back to [x, y, w, h]
      const b = rawBbox as { left: number; top: number; right: number; bottom: number }
      pixelBbox = [b.left, b.top, b.right - b.left, b.bottom - b.top]
    } else {
      continue // Skip invalid bbox
    }

    // Step 1: Normalize pixel coords to 0-1 range
    const normalized = normalizePixelBbox(pixelBbox, videoW, videoH)

    // Step 2: Transform to canvas coordinates with object-cover offset
    const canvasBbox = transformBboxToCanvas(normalized, transform, videoW, videoH)

    // Draw bounding box
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(canvasBbox.x, canvasBbox.y, canvasBbox.width, canvasBbox.height)

    // Draw label
    const label = `${class_name} ${(confidence * 100).toFixed(0)}%`
    ctx.font = 'bold 14px Arial'
    const textMetrics = ctx.measureText(label)
    const textHeight = 20

    ctx.fillStyle = color
    ctx.fillRect(canvasBbox.x, canvasBbox.y - textHeight - 5, textMetrics.width + 10, textHeight)
    ctx.fillStyle = '#000'
    ctx.fillText(label, canvasBbox.x + 5, canvasBbox.y - 8)
  }
}

async function attachThumbnailVideos() {
  if (!isInitialized.value) {
    const maxWait = 10000
    const startTime = Date.now()
    while (!isInitialized.value && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!isInitialized.value) {
      console.error('[TrackingLeafletView] Timeout waiting for connections')
      return
    }
  }

  const maxRetries = 10
  const retryDelay = 100

  for (const camera of cameras.value) {
    let videoElement: HTMLVideoElement | null = null
    let retries = 0

    while (!videoElement && retries < maxRetries) {
      videoElement = thumbnailVideoRefs.value[camera.id]
      if (!videoElement) {
        retries++
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (videoElement) {
      attachToVideoElement(camera.id, videoElement)
    }
  }
}

async function attachPrimaryVideo(cameraId: string) {
  const maxRetries = 10
  const retryDelay = 100

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const videoEl = primaryVideoRef.value
    if (videoEl) {
      primaryVideoDimensions.value = null
      const attached = attachToVideoElement(cameraId, videoEl)
      if (attached) return
    }
    await new Promise(resolve => setTimeout(resolve, retryDelay))
  }
}

const detectionCallbackCleanups = ref(new Map<string, () => void>())

function registerDetectionCallbacks() {
  for (const camera of cameras.value) {
    if (detectionCallbackCleanups.value.has(camera.id)) continue
    const conn = getConnection(camera.id)
    if (!conn) continue

    const cleanup = conn.connection.setDetectionCallback(metadata => {
      if (activeView.value !== 'camera') return
      if (selectedCamera.value?.id !== camera.id) return

      currentDetections.value = metadata.detections
      connectionState.value = conn.connection.connectionState.value as RTCPeerConnectionState

      if (!primaryVideoDimensions.value) {
        onPrimaryVideoLoaded()
      }
      drawDetections()
    })
    detectionCallbackCleanups.value.set(camera.id, cleanup)
  }
}

// Watchers
watch(activeView, async () => {
  if (activeView.value === 'map') {
    await nextTick()
    if (!leaflet.mapRef.value && mapContainer.value) {
      await initializeMap()
    }
    leaflet.fitToBounds()
  } else if (activeView.value === 'camera' && selectedCamera.value) {
    void attachPrimaryVideo(selectedCamera.value.id)
  }
})

watch(cameras, () => {
  registerDetectionCallbacks()
})

// Lifecycle
let nowInterval: number | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await loadSiteMap()
  await nextTick()

  // Connect WebSocket
  trackingWs.connect()

  // Initialize maps
  await initializeMap()
  await initializePreviewMap()

  // Attach video thumbnails
  void attachThumbnailVideos()

  // Register detection callbacks
  registerDetectionCallbacks()

  // Track update loop
  trackUpdateInterval = window.setInterval(() => {
    updateTracksOnMap()
  }, 50) // 20fps updates

  // Delay sampling interval
  nowInterval = window.setInterval(() => {
    recordDelaySamples(Date.now())
  }, 1000)

  // Setup resize observer to recalculate video layout on container resize
  resizeObserver = new ResizeObserver(() => {
    if (activeView.value === 'camera' && primaryVideoRef.value) {
      updateVideoLayout()
    }
  })

  // Observe the video container for resize events
  const videoContainer = document.querySelector('.flex-1.relative.bg-background.overflow-hidden')
  if (videoContainer) {
    resizeObserver.observe(videoContainer)
  }
})

onUnmounted(() => {
  leaflet.destroyMap()
  previewLeaflet.destroyMap()
  trackingWs.disconnect()

  if (trackUpdateInterval) {
    clearInterval(trackUpdateInterval)
  }
  if (nowInterval) {
    clearInterval(nowInterval)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  for (const cleanup of detectionCallbackCleanups.value.values()) {
    cleanup()
  }
})
</script>

<style>
/* Leaflet container styling */
.leaflet-container {
  background-color: var(--canvas-background, #1a1a2e) !important;
  font-family: inherit;
}

/* Hide Leaflet attribution */
.leaflet-control-attribution {
  display: none !important;
}

/* Grid label styling */
.leaflet-grid-label {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Camera icon styling */
.leaflet-camera-icon {
  background: transparent !important;
  border: none !important;
}

/* Zoom controls */
.leaflet-control-zoom {
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 4px !important;
}

.leaflet-control-zoom a {
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: white !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.leaflet-control-zoom a:hover {
  background-color: rgba(0, 0, 0, 0.9) !important;
}
</style>
