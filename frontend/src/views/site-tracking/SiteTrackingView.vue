<template>
  <div class="h-full w-full bg-background flex overflow-hidden">
    <!-- Site Map Canvas Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Canvas Container -->
      <div
        class="flex-1 bg-gray-900 relative overflow-hidden"
        ref="canvasContainer"
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
          :show-stats="true"
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

        <!-- Debug Mode Toggle -->
        <button
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
          class="absolute inset-0 flex items-center justify-center bg-gray-900"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading site map...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Camera Thumbnail Strip -->
    <div class="w-64 border-l border-border bg-card p-2 overflow-y-auto flex-shrink-0">
      <h3 class="text-sm font-semibold mb-2 px-2 text-foreground">All Cameras</h3>
      <div class="space-y-2">
        <div
          v-for="camera in cameras"
          :key="camera.id"
          @click="selectCamera(camera)"
          :class="[
            'p-2 rounded-lg cursor-pointer transition-all duration-200 border-2',
            'bg-muted/30',
            selectedCamera?.id === camera.id
              ? 'bg-background border-primary/30'
              : 'border-transparent hover:bg-accent hover:border-primary/30'
          ]"
        >
          <div class="mb-1.5 flex justify-between items-center">
            <span class="text-xs font-semibold text-foreground flex-1">{{ camera.name }}</span>
            <div
              :class="[
                'w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200',
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
            :metadata="cameraDetectionMetadata[camera.id]"
            class="mt-1.5 bg-muted/20 rounded px-1.5 py-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSiteMapStore } from '@/stores/siteMaps'
import { useCameraStore } from '@/stores/cameras'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { usePersonPositionTracking } from '@/composables/usePersonPositionTracking'
// Global track store is used by PersonPositionOverlay component
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'
import PersonPositionOverlay from '@/components/features/site-map/PersonPositionOverlay.vue'
import DetectionMetadataPanel from '@/components/features/camera/DetectionMetadataPanel.vue'

interface Camera {
  id: string
  name: string
}

// Stores
const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()
const globalTrackStore = useGlobalTrackStore()

// HC3 camera configuration (single camera tracking mode)
const TRACKED_CAMERA_ID = 'camera1'
const LOOP_DURATION_SECONDS = 10

const siteMaps = computed(() => siteMapStore.siteMaps)

// Use the active site map from the store, or fall back to the first available
const currentMap = computed(() => {
  // First check if there's already an active site map
  if (siteMapStore.activeSiteMap) {
    return siteMapStore.activeSiteMap
  }
  // Otherwise use the first available site map
  return siteMaps.value.length > 0 ? siteMaps.value[0] : null
})

// Set the active site map if not already set
if (!siteMapStore.activeSiteMapId && siteMaps.value.length > 0) {
  siteMapStore.setActiveSiteMap(siteMaps.value[0].id)
}

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

// Initialize person position tracking
const positionTracking = usePersonPositionTracking({
  enabled: true,
  updateIntervalMs: 500,
  minConfidence: 0.5,
})

// Canvas transform state (fixed, no zoom/pan)
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// Canvas style
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
  connections,
  attachToVideoElement,
  setLoopForCamera,
} = useCameraConnectionManager()

// Reactive detection metadata - updates when connections change
const cameraDetectionMetadata = computed(() => {
  const metadata: Record<string, typeof connections.value[string]['latestMetadata']> = {}
  for (const cameraId in connections.value) {
    metadata[cameraId] = connections.value[cameraId]?.latestMetadata ?? null
  }
  return metadata
})

// State
const selectedCamera = ref<Camera | null>(null)
const thumbnailVideoRefs = ref<Record<string, HTMLVideoElement | null>>({})
const showDebugMode = ref(false)

// Helper functions
const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

// Draw map
const drawMap = () => {
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawWalls(currentMap.value.walls)

  currentMap.value.cameras.forEach(camera => {
    canvas.drawCamera(camera, getCameraName, false, false, currentMap.value!.walls)
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

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2
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

// Resize handler
const handleResize = () => {
  resizeCanvas()
  fitToView()
}

onMounted(async () => {
  if (!canvas.initCanvas()) return

  if (currentMap.value) {
    resizeCanvas()
    drawMap()
    setTimeout(() => {
      fitToView()
    }, 100)
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
      console.log(`[SiteTracking] Video looped - clearing all tracks`)
      globalTrackStore.clearAllTracks()
    }
  )
  if (loopConfigured) {
    console.log(`[SiteTracking] Configured ${TRACKED_CAMERA_ID} to loop at ${LOOP_DURATION_SECONDS}s`)
  } else {
    console.warn(`[SiteTracking] Could not configure loop for ${TRACKED_CAMERA_ID} - camera not connected`)
  }

  // Auto-select first camera (HC3)
  const hc3Camera = cameras.value.find(c => c.id === TRACKED_CAMERA_ID)
  if (hc3Camera) {
    selectCamera(hc3Camera)
  } else if (cameras.value.length > 0) {
    selectCamera(cameras.value[0])
  }

  // Start position tracking
  positionTracking.startTracking()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  positionTracking.stopTracking()
})
</script>
