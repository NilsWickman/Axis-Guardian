<template>
  <div class="h-full w-full bg-background flex flex-col lg:flex-row overflow-hidden">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
      <!-- Site Map -->
      <div
        v-if="activeView === 'map'"
        class="flex-1 relative overflow-hidden"
        style="background-color: var(--canvas-background)"
        ref="canvasContainer"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <canvas ref="mapCanvas" :style="canvasStyle"></canvas>

        <PersonPositionOverlay
          v-if="currentMap"
          :site-map="currentMap"
          :canvas-width="metersToPixels(extractValue(currentMap.width))"
          :canvas-height="metersToPixels(extractValue(currentMap.height))"
          :show-trails="true"
          :show-confidence="true"
          :show-person-icon="false"
          :show-stats="!isDemoMode"
          :show-heatmap="false"
          :show-debug-mode="showDebugMode"
          :marker-radius="8"
          :max-trail-length="20"
          :style="{
            position: 'absolute',
            left: `${offsetX}px`,
            top: `${offsetY}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }"
        />

        <div
          v-if="mousePosition && isMouseOverMap"
          class="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap font-mono"
          :style="{
            left: `${mouseScreenPos.x + 12}px`,
            top: `${mouseScreenPos.y - 8}px`,
            zIndex: 20,
          }"
        >
          X: {{ mousePosition.x.toFixed(2) }}m, Y: {{ mousePosition.y.toFixed(2) }}m
        </div>

        <button
          v-if="!isDemoMode"
          @click="showDebugMode = !showDebugMode"
          class="absolute bottom-4 left-4 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          :class="
            showDebugMode
              ? 'bg-amber-500/90 text-black'
              : 'bg-black/50 text-white hover:bg-black/70'
          "
          style="z-index: 11"
        >
          {{ showDebugMode ? 'Debug ON' : 'Debug' }}
        </button>

        <div
          v-if="showMapLoadingOverlay"
          class="absolute inset-0 flex items-center justify-center"
          style="background-color: var(--canvas-background)"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>{{ !currentMap ? 'Loading site map...' : 'Restarting…' }}</p>
          </div>
        </div>
      </div>

      <!-- Camera Feed -->
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
          <p v-if="!selectedCamera">Select a camera…</p>
          <p v-else>Initializing WebRTC…</p>
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

    <!-- Cards -->
    <div
      class="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card p-2 overflow-y-auto flex-shrink-0 max-h-[40vh] lg:max-h-none"
    >
      <h3 class="text-sm font-semibold mb-2 px-2 text-foreground">Views</h3>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 gap-2">
        <!-- Site Map Card -->
        <div @click="selectMap" :class="cardClasses(activeView === 'map')">
          <div class="mb-1.5 flex justify-between items-center">
            <span class="text-xs font-semibold text-foreground flex-1 truncate">Site Map</span>
            <span class="text-[10px] font-mono text-muted-foreground tabular-nums">
              {{ currentMap ? 'LIVE' : '…' }}
            </span>
          </div>
          <div
            ref="mapPreviewContainer"
            class="bg-background rounded-md overflow-hidden aspect-video relative border border-border/30 flex items-center justify-center"
          >
            <canvas
              ref="mapPreviewCanvas"
              class="absolute inset-0 w-full h-full pointer-events-none"
            />
            <span v-if="!currentMap" class="text-[11px] font-medium text-muted-foreground">Map</span>
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
                <p class="text-xs">{{ isRestarting ? 'Restarting…' : 'Loading…' }}</p>
              </div>
            </div>
          </div>

          <DetectionMetadataPanel
            v-if="!isDemoMode"
            :metadata="cameraMetadataMap[camera.id]"
            class="mt-1.5 bg-muted/20 rounded px-1.5 py-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCameraStore } from '@/stores/cameras'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useZoneStore } from '@/stores/zones'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { useTrackingServiceWebSocket } from '@/composables/useTrackingServiceWebSocket'
import { useDemoMode } from '@/composables/useDemoMode'
import { useTheme } from '@/composables/useTheme'
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'
import { sleep } from '@/utils/sleep'
import PersonPositionOverlay from '@/components/features/site-map/PersonPositionOverlay.vue'
import DetectionMetadataPanel from '@/components/features/camera/DetectionMetadataPanel.vue'
import VideoMetrics from '@/components/features/camera/VideoMetrics.vue'
import type { Detection } from '@/types/detection.types'

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
const zoneStore = useZoneStore()
const { siteMap: currentMap, loadSiteMap } = useSiteMapConfig()
const { isDemoMode } = useDemoMode()
const { currentTheme } = useTheme()

// Single camera tracking mode (HC3 loop sync)
const TRACKED_CAMERA_ID = 'camera1'
const LOOP_DURATION_SECONDS = 10

// Canvas refs
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const mapPreviewCanvas = ref<HTMLCanvasElement | null>(null)
const mapPreviewContainer = ref<HTMLDivElement | null>(null)

// Camera refs
const primaryVideoRef = ref<HTMLVideoElement | null>(null)
const primaryCanvasRef = ref<HTMLCanvasElement | null>(null)

// Canvas options - minimal map view
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: false,
  showScaleReference: false,
  showCameraLabels: false,
  pixelsPerMeter: RENDER_SCALE,
})

const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const previewCanvas = useSiteMapCanvas(mapPreviewCanvas, ref(canvasOptions))

const trackingWs = useTrackingServiceWebSocket({
  autoReconnect: true,
  reconnectIntervalMs: 3000,
})

// Global connection manager (thumbnails + primary view)
const {
  cameras,
  isInitialized,
  connectionStatuses,
  videoHealthByCamera,
  cameraMetadataMap,
  attachToVideoElement,
  getConnection,
  setLoopForCamera,
} = useCameraConnectionManager()

// Selection state
const activeView = ref<ActiveView>('camera')
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

// Map transform state (fixed, no zoom/pan)
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${offsetX.value}px`,
  top: `${offsetY.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

const showDebugMode = ref(false)
const isRestarting = ref(false)
const isBootLoading = ref(true)
let restartTimer: number | null = null

const RESTART_LOADING_MS = 2000

function triggerRestartLoading(): void {
  isRestarting.value = true
  canvas.clearCanvas()

  if (restartTimer) {
    window.clearTimeout(restartTimer)
  }

  restartTimer = window.setTimeout(() => {
    isRestarting.value = false
    restartTimer = null
    drawMap()
  }, RESTART_LOADING_MS)
}

const showMapLoadingOverlay = computed(() => !currentMap.value || isBootLoading.value || isRestarting.value)
const showVideoLoadingOverlay = computed(() => isBootLoading.value || isRestarting.value)

// Tracking delay display (rolling average age of latest tracking-service frame per camera)
let nowInterval: number | null = null
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

// Mouse position tracking
const mousePosition = ref<{ x: number; y: number } | null>(null)
const mouseScreenPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const isMouseOverMap = ref(false)

const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const handleMouseMove = (event: MouseEvent) => {
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  mouseScreenPos.value = { x: mouseX, y: mouseY }

  const canvasX = (mouseX - offsetX.value) / scale.value
  const canvasY = (mouseY - offsetY.value) / scale.value

  const worldX = canvasX / RENDER_SCALE
  const worldY = canvasY / RENDER_SCALE

  const mapWidth = extractValue(currentMap.value.width)
  const mapHeight = extractValue(currentMap.value.height)

  if (worldX >= 0 && worldX <= mapWidth && worldY >= 0 && worldY <= mapHeight) {
    mousePosition.value = { x: worldX, y: worldY }
    isMouseOverMap.value = true
  } else {
    isMouseOverMap.value = false
  }
}

const handleMouseLeave = () => {
  isMouseOverMap.value = false
  mousePosition.value = null
}

const drawMap = () => {
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()

  canvas.drawObstacles(currentMap.value.obstacles)
  canvas.drawWalls(currentMap.value.walls)

  if (zoneStore.enabledZones.length > 0) {
    canvas.drawZones(zoneStore.enabledZones, null, null, false, zoneStore.zoneMetrics, true)
  }

  const allCameraFOVs = currentMap.value.cameras.map(camera =>
    canvas.getCameraFOVPolygon(camera, currentMap.value!.walls, currentMap.value!.obstacles),
  )

  currentMap.value.cameras.forEach((camera, index) => {
    const otherCameraFOVs = allCameraFOVs.filter((_, i) => i !== index)
    canvas.drawCamera(
      camera,
      getCameraName,
      false,
      false,
      currentMap.value!.walls,
      currentMap.value!.obstacles,
      otherCameraFOVs,
    )
  })
}

const resizeCanvas = () => {
  if (!currentMap.value) return

  const widthPixels = metersToPixels(extractValue(currentMap.value.width))
  const heightPixels = metersToPixels(extractValue(currentMap.value.height))

  canvas.resizeCanvas(widthPixels, heightPixels)
  drawMap()
}

const fitToView = () => {
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = metersToPixels(extractValue(currentMap.value.width))
  const mapHeight = metersToPixels(extractValue(currentMap.value.height))

  if (containerWidth < 100 || containerHeight < 100) return

  const padding = 60
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY)

  scale.value = newScale

  const scaledWidth = mapWidth * newScale
  const scaledHeight = mapHeight * newScale

  offsetX.value = (containerWidth - scaledWidth) / 2
  offsetY.value = (containerHeight - scaledHeight) / 2
}

const thumbnailVideoRefs = ref<Record<string, HTMLVideoElement | null>>({})

async function attachThumbnailVideos() {
  if (!isInitialized.value) {
    const maxWait = 10000
    const startTime = Date.now()
    while (!isInitialized.value && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!isInitialized.value) {
      console.error('[TrackingView] Timeout waiting for connections')
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

// Primary camera feed
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

function onPrimaryVideoLoaded() {
  const video = primaryVideoRef.value
  const canvasEl = primaryCanvasRef.value
  if (!video || !canvasEl || video.videoWidth <= 0) return

  canvasEl.width = video.videoWidth
  canvasEl.height = video.videoHeight
  primaryVideoDimensions.value = { width: video.videoWidth, height: video.videoHeight }
}

function drawDetections() {
  const canvasEl = primaryCanvasRef.value
  if (!canvasEl || !primaryVideoDimensions.value) return

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
  if (currentDetections.value.length === 0) return

  for (const detection of currentDetections.value) {
    const { bbox, class_name, confidence } = detection
    const color = CLASS_COLORS[class_name] || '#94a3b8'

    const x = bbox.left * canvasEl.width
    const y = bbox.top * canvasEl.height
    const w = (bbox.right - bbox.left) * canvasEl.width
    const h = (bbox.bottom - bbox.top) * canvasEl.height

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, w, h)

    const label = `${class_name} ${(confidence * 100).toFixed(0)}%`
    ctx.font = 'bold 14px Arial'
    const textMetrics = ctx.measureText(label)
    const textHeight = 20

    ctx.fillStyle = color
    ctx.fillRect(x, y - textHeight - 5, textMetrics.width + 10, textHeight)
    ctx.fillStyle = '#000'
    ctx.fillText(label, x + 5, y - 8)
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

watch(activeView, () => {
  if (activeView.value === 'camera' && selectedCamera.value) {
    void attachPrimaryVideo(selectedCamera.value.id)
  }
})

async function renderSiteMap(): Promise<void> {
  if (!currentMap.value) {
    await loadSiteMap()
  }
  if (!currentMap.value) return

  // The map canvas is created/destroyed by `v-if="activeView === 'map'"`.
  // When switching back to the map, wait for refs + layout to be ready before resizing/drawing.
  for (let i = 0; i < 30; i++) {
    await nextTick()
    if (canvasContainer.value?.clientWidth && canvasContainer.value?.clientHeight && canvas.initCanvas()) break
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
  }

  if (!canvas.initCanvas()) return

  fitToView()
  resizeCanvas()
}

let previewRenderRaf: number | null = null

function schedulePreviewRender(): void {
  if (previewRenderRaf) return
  previewRenderRaf = window.requestAnimationFrame(() => {
    previewRenderRaf = null
    void renderSiteMapPreview()
  })
}

async function renderSiteMapPreview(): Promise<void> {
  if (!currentMap.value) {
    await loadSiteMap()
  }
  if (!currentMap.value) return

  const canvasEl = mapPreviewCanvas.value
  const containerEl = mapPreviewContainer.value
  if (!canvasEl || !containerEl) return

  for (let i = 0; i < 10; i++) {
    await nextTick()
    if (containerEl.clientWidth && containerEl.clientHeight && previewCanvas.initCanvas()) break
    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))
  }

  const containerWidth = containerEl.clientWidth
  const containerHeight = containerEl.clientHeight
  if (containerWidth < 10 || containerHeight < 10) return

  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.max(1, Math.floor(containerWidth * dpr))
  const targetHeight = Math.max(1, Math.floor(containerHeight * dpr))
  if (canvasEl.width !== targetWidth) canvasEl.width = targetWidth
  if (canvasEl.height !== targetHeight) canvasEl.height = targetHeight

  if (!previewCanvas.initCanvas()) return
  const ctx = previewCanvas.ctx.value
  if (!ctx) return

  const mapWidthM = extractValue(currentMap.value.width)
  const mapHeightM = extractValue(currentMap.value.height)
  if (mapWidthM <= 0 || mapHeightM <= 0) return

  const padding = 8
  const ppm = Math.min(
    (containerWidth - padding * 2) / mapWidthM,
    (containerHeight - padding * 2) / mapHeightM,
  )
  if (!Number.isFinite(ppm) || ppm <= 0) return

  const scaleFactor = ppm / RENDER_SCALE
  const offsetX = (containerWidth - mapWidthM * ppm) / 2
  const offsetY = (containerHeight - mapHeightM * ppm) / 2

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
  ctx.setTransform(dpr * scaleFactor, 0, 0, dpr * scaleFactor, dpr * offsetX, dpr * offsetY)

  previewCanvas.drawObstacles(currentMap.value.obstacles)
  previewCanvas.drawWalls(currentMap.value.walls)

  if (zoneStore.enabledZones.length > 0) {
    previewCanvas.drawZones(zoneStore.enabledZones, null, null, false, zoneStore.zoneMetrics, true)
  }

  const allCameraFOVs = currentMap.value.cameras.map(camera =>
    previewCanvas.getCameraFOVPolygon(camera, currentMap.value!.walls, currentMap.value!.obstacles),
  )

  currentMap.value.cameras.forEach((camera, index) => {
    const otherCameraFOVs = allCameraFOVs.filter((_, i) => i !== index)
    previewCanvas.drawCamera(
      camera,
      getCameraName,
      false,
      false,
      currentMap.value!.walls,
      currentMap.value!.obstacles,
      otherCameraFOVs,
    )
  })

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

watch(activeView, async nextView => {
  if (nextView !== 'map') return
  await renderSiteMap()
})

watch(
  mapCanvas,
  async el => {
    if (!el) return
    if (activeView.value !== 'map') return
    await renderSiteMap()
  },
  { flush: 'post' },
)

watch(currentTheme, () => {
  if (currentMap.value) {
    drawMap()
  }
  schedulePreviewRender()
})

watch(
  () => zoneStore.zones,
  () => {
    if (currentMap.value) {
      drawMap()
    }
    schedulePreviewRender()
  },
  { deep: true },
)

watch(
  () => zoneStore.zoneMetrics,
  () => {
    if (currentMap.value) {
      drawMap()
    }
    schedulePreviewRender()
  },
  { deep: true },
)

watch(currentMap, async newMap => {
  if (newMap) {
    await nextTick()
    fitToView()
    await nextTick()
    resizeCanvas()
  }
  schedulePreviewRender()
})

const handleResize = () => {
  resizeCanvas()
  fitToView()
  schedulePreviewRender()
}

onMounted(async () => {
  void sleep(RESTART_LOADING_MS).then(() => {
    isBootLoading.value = false
  })

  nowInterval = window.setInterval(() => {
    const now = Date.now()
    recordDelaySamples(now)
  }, 250)

  await loadSiteMap()

  schedulePreviewRender()

  if (activeView.value === 'map') {
    await renderSiteMap()
  }

  window.addEventListener('resize', handleResize)

  await attachThumbnailVideos()
  registerDetectionCallbacks()

  const loopConfigured = setLoopForCamera(TRACKED_CAMERA_ID, LOOP_DURATION_SECONDS, () => {
    triggerRestartLoading()
    globalTrackStore.clearAllTracks()
  })
  if (!loopConfigured) {
  }

  // Default selection if route didn't specify anything
  if (!selectedCamera.value && cameras.value.length > 0) {
    const preferred = cameras.value.find(c => c.id === TRACKED_CAMERA_ID) ?? cameras.value[0]
    selectedCamera.value = preferred
  }

  if (activeView.value === 'camera' && selectedCamera.value) {
    await attachPrimaryVideo(selectedCamera.value.id)
  }

  trackingWs.connect()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trackingWs.disconnect()
  if (previewRenderRaf) {
    window.cancelAnimationFrame(previewRenderRaf)
    previewRenderRaf = null
  }
  if (restartTimer) {
    window.clearTimeout(restartTimer)
    restartTimer = null
  }
  if (nowInterval) {
    clearInterval(nowInterval)
    nowInterval = null
  }

  for (const cleanup of detectionCallbackCleanups.value.values()) {
    cleanup()
  }
  detectionCallbackCleanups.value.clear()
})
</script>
