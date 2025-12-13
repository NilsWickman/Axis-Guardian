<template>
  <div class="h-full w-full bg-background flex flex-col lg:flex-row overflow-hidden">
    <!-- Site Map Canvas Area -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
      <!-- Canvas Container -->
      <div
        class="flex-1 relative overflow-hidden"
        style="background-color: var(--canvas-background)"
        ref="canvasContainer"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <canvas
          ref="mapCanvas"
          :style="canvasStyle"
        ></canvas>

        <!-- Person Position Overlay -->
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

        <!-- Mouse Position Tooltip -->
        <div
          v-if="mousePosition && isMouseOverMap"
          class="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap font-mono"
          :style="{
            left: `${mouseScreenPos.x + 12}px`,
            top: `${mouseScreenPos.y - 8}px`,
            zIndex: 20
          }"
        >
          X: {{ mousePosition.x.toFixed(2) }}m, Y: {{ mousePosition.y.toFixed(2) }}m
        </div>

        <!-- Debug Mode Toggle -->
        <button
          v-if="!isDemoMode"
          @click="showDebugMode = !showDebugMode"
          class="absolute bottom-4 left-4 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          :class="showDebugMode
            ? 'bg-amber-500/90 text-black'
            : 'bg-black/50 text-white hover:bg-black/70'"
          style="z-index: 11"
        >
          {{ showDebugMode ? 'Debug ON' : 'Debug' }}
        </button>

        <!-- Loading State -->
        <div
          v-if="!currentMap"
          class="absolute inset-0 flex items-center justify-center"
          style="background-color: var(--canvas-background)"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading site map...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Camera Cards Section -->
    <div class="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-border bg-card p-2 overflow-y-auto flex-shrink-0 max-h-[40vh] lg:max-h-none">
      <h3 class="text-sm font-semibold mb-2 px-2 text-foreground">All Cameras</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 gap-2">
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
            <span class="text-xs font-semibold text-foreground flex-1 truncate">{{ camera.name }}</span>
            <div
              :class="[
                'w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ml-1',
                connectionStatuses[camera.id]
                  ? 'bg-green-500'
                  : 'bg-destructive'
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

          <!-- Detection Metadata Panel -->
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
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCameraStore } from '@/stores/cameras'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useZoneStore } from '@/stores/zones'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { useTrackingServiceWebSocket } from '@/composables/useTrackingServiceWebSocket'
import { useDemoMode } from '@/composables/useDemoMode'
import { useTheme } from '@/composables/useTheme'
// Global track store is used by PersonPositionOverlay component
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'
import PersonPositionOverlay from '@/components/features/site-map/PersonPositionOverlay.vue'
import DetectionMetadataPanel from '@/components/features/camera/DetectionMetadataPanel.vue'

interface Camera {
  id: string
  name: string
}

// Stores and composables
const cameraStore = useCameraStore()
const globalTrackStore = useGlobalTrackStore()
const zoneStore = useZoneStore()
const { siteMap: currentMap, loadSiteMap } = useSiteMapConfig()
const { isDemoMode } = useDemoMode()
const { currentTheme } = useTheme()

// HC3 camera configuration (single camera tracking mode)
const TRACKED_CAMERA_ID = 'camera1'
const LOOP_DURATION_SECONDS = 10

// Canvas refs
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)

// Canvas options - no grid, no labels for clean view
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: false,
  showScaleReference: false,
  showCameraLabels: false,
  pixelsPerMeter: RENDER_SCALE
})

// Initialize canvas composable
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))

// Initialize tracking service WebSocket (server-side tracking with K/R/T projection)
const trackingWs = useTrackingServiceWebSocket({
  autoReconnect: true,
  reconnectIntervalMs: 3000,
})

// Canvas transform state (fixed, no zoom/pan)
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// Canvas style (no rotation - coordinates are pre-rotated in config)
const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${offsetX.value}px`,
  top: `${offsetY.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

// Global connection manager for camera thumbnails
const {
  cameras,
  isInitialized,
  connectionStatuses,
  cameraMetadataMap,
  attachToVideoElement,
  setLoopForCamera,
} = useCameraConnectionManager()

// State
const selectedCamera = ref<Camera | null>(null)
const thumbnailVideoRefs = ref<Record<string, HTMLVideoElement | null>>({})
const showDebugMode = ref(false)

// Mouse position tracking
const mousePosition = ref<{ x: number; y: number } | null>(null)
const mouseScreenPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const isMouseOverMap = ref(false)

// Helper functions
const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

// Mouse position handlers - convert screen coords to world coords (meters)
const handleMouseMove = (event: MouseEvent) => {
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Store screen position for tooltip
  mouseScreenPos.value = { x: mouseX, y: mouseY }

  // Convert screen position to canvas position (accounting for offset and scale)
  const canvasX = (mouseX - offsetX.value) / scale.value
  const canvasY = (mouseY - offsetY.value) / scale.value

  // Convert canvas pixels to meters
  const worldX = canvasX / RENDER_SCALE
  const worldY = canvasY / RENDER_SCALE

  // Check if within map bounds
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

// Draw map
const drawMap = () => {
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()

  // Draw obstacles before cameras (below FOV cones)
  canvas.drawObstacles(currentMap.value.obstacles)

  canvas.drawWalls(currentMap.value.walls)

  // Draw zones in minimal mode (just dashed outlines, subtle fill when occupied)
  if (zoneStore.enabledZones.length > 0) {
    canvas.drawZones(zoneStore.enabledZones, null, null, false, zoneStore.zoneMetrics, true)
  }

  // Pre-calculate all camera FOV polygons for overlap detection
  const allCameraFOVs = currentMap.value.cameras.map(camera =>
    canvas.getCameraFOVPolygon(camera, currentMap.value!.walls, currentMap.value!.obstacles)
  )

  // Draw each camera, passing other cameras' FOVs for shadow overlap detection
  currentMap.value.cameras.forEach((camera, index) => {
    // Get FOVs of all other cameras (exclude current camera's FOV)
    const otherCameraFOVs = allCameraFOVs.filter((_, i) => i !== index)
    canvas.drawCamera(camera, getCameraName, false, false, currentMap.value!.walls, currentMap.value!.obstacles, otherCameraFOVs)
  })
}

// Resize canvas
const resizeCanvas = () => {
  if (!currentMap.value) return

  const widthPixels = metersToPixels(extractValue(currentMap.value.width))
  const heightPixels = metersToPixels(extractValue(currentMap.value.height))

  canvas.resizeCanvas(widthPixels, heightPixels)
  drawMap()
}

// Fit to view (locked, no user interaction)
const fitToView = () => {
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = metersToPixels(extractValue(currentMap.value.width))
  const mapHeight = metersToPixels(extractValue(currentMap.value.height))

  if (containerWidth < 100 || containerHeight < 100) return

  const padding = 60

  // Calculate scale to fit the entire map
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY)

  scale.value = newScale

  // Center the map in the container
  const scaledWidth = mapWidth * newScale
  const scaledHeight = mapHeight * newScale

  offsetX.value = (containerWidth - scaledWidth) / 2
  offsetY.value = (containerHeight - scaledHeight) / 2
}

// Camera selection
function selectCamera(camera: Camera) {
  selectedCamera.value = camera
}

// Attach thumbnail videos
async function attachThumbnailVideos() {
  if (!isInitialized.value) {
    const maxWait = 10000
    const startTime = Date.now()
    while (!isInitialized.value && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!isInitialized.value) {
      console.error('[SiteTracking] Timeout waiting for connections')
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

// Watch current map
watch(currentMap, async (newMap) => {
  if (newMap) {
    await nextTick()
    fitToView()
    await nextTick()
    resizeCanvas()
  }
})

// Redraw canvas when theme changes
watch(currentTheme, () => {
  if (currentMap.value) {
    drawMap()
  }
})

// Redraw canvas when zones change
watch(() => zoneStore.zones, () => {
  if (currentMap.value) {
    drawMap()
  }
}, { deep: true })

// Redraw canvas when zone metrics change (occupancy updates)
watch(() => zoneStore.zoneMetrics, () => {
  if (currentMap.value) {
    drawMap()
  }
}, { deep: true })

// Resize handler
const handleResize = () => {
  resizeCanvas()
  fitToView()
}

onMounted(async () => {
  if (!canvas.initCanvas()) return

  // Load site map configuration
  await loadSiteMap()

  if (currentMap.value) {
    // Calculate fit-to-view scale FIRST to avoid layout shift
    fitToView()
    resizeCanvas()
    drawMap()
  }

  window.addEventListener('resize', handleResize)

  // Attach thumbnails
  await attachThumbnailVideos()

  // Configure HC3 camera (camera1) to loop at 10 seconds
  // Clear all tracks when video loops to prevent stale track data
  const loopConfigured = setLoopForCamera(
    TRACKED_CAMERA_ID,
    LOOP_DURATION_SECONDS,
    () => {
      globalTrackStore.clearAllTracks()
    }
  )
  if (!loopConfigured) {
    console.warn(`[SiteTracking] Could not configure loop for ${TRACKED_CAMERA_ID} - camera not connected`)
  }

  // Auto-select first camera (HC3)
  const hc3Camera = cameras.value.find(c => c.id === TRACKED_CAMERA_ID)
  if (hc3Camera) {
    selectCamera(hc3Camera)
  } else if (cameras.value.length > 0) {
    selectCamera(cameras.value[0])
  }

  // Connect to tracking service WebSocket for real-time track updates
  trackingWs.connect()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trackingWs.disconnect()
})
</script>
