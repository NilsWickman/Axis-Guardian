<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import { useMultiCameraAnnotation } from '@/composables/useMultiCameraAnnotation'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { AVAILABLE_VIDEOS } from '@/types/frame-review'
import { extractValue, RENDER_SCALE } from '@/utils/siteMapConversion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Multi-camera annotation composable
const annotation = useMultiCameraAnnotation()

// Site map config for floor plan
const { siteMap: activeSiteMap, loadSiteMap } = useSiteMapConfig()

// Camera sources - map AVAILABLE_VIDEOS to camera IDs
const cameraSources = [
  {
    cameraId: 'camera1',
    videoFile: 'hc3',
    videoPath: AVAILABLE_VIDEOS.find(v => v.id === 'hc3')?.videoPath ?? '',
    detectionsPath: AVAILABLE_VIDEOS.find(v => v.id === 'hc3')?.detectionsPath ?? '',
  },
  {
    cameraId: 'camera2',
    videoFile: 'hc4',
    videoPath: AVAILABLE_VIDEOS.find(v => v.id === 'hc4')?.videoPath ?? '',
    detectionsPath: AVAILABLE_VIDEOS.find(v => v.id === 'hc4')?.detectionsPath ?? '',
  },
]

// Refs
const videoRefs = ref<Map<string, HTMLVideoElement>>(new Map())
const videoCanvasRef = ref<HTMLCanvasElement | null>(null)
const floorPlanCanvasRef = ref<HTMLCanvasElement | null>(null)
const floorPlanContainerRef = ref<HTMLDivElement | null>(null)

// State
const isVideoReady = ref<Map<string, boolean>>(new Map())
const isInitialized = ref(false)
const selectionError = ref<string | null>(null)
let selectionErrorTimeout: number | null = null

// Handler for detection selection with feedback
function handleDetectionClick(cameraId: string, index: number): void {
  const result = annotation.toggleDetectionSelection(cameraId, index)

  if (!result.success && result.reason) {
    selectionError.value = result.reason

    // Clear existing timeout
    if (selectionErrorTimeout) {
      clearTimeout(selectionErrorTimeout)
    }

    // Auto-dismiss after 3 seconds
    selectionErrorTimeout = window.setTimeout(() => {
      selectionError.value = null
    }, 3000)
  }

  drawFloorPlan()
}

// Floor plan zoom/pan state
const floorPlanScale = ref(0.5)
const floorPlanOffset = ref({ x: 0, y: 0 })
const isFloorPlanDragging = ref(false)
const floorPlanDragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

// Canvas render options for floor plan
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: false,
  showCameraLabels: true,
  pixelsPerMeter: RENDER_SCALE
})

// Site map canvas composable for drawing FOV, obstacles, etc.
const siteMapCanvas = useSiteMapCanvas(floorPlanCanvasRef, ref(canvasOptions))

// Track colors by camera
const cameraColors: Record<string, string> = {
  'camera1': '#3b82f6', // blue
  'camera2': '#f97316', // orange
}

// Track colors for consistency within a camera
const trackColors = new Map<string, string>()
const colorPalette = [
  '#22c55e', '#ec4899', '#eab308', '#a855f7',
  '#84cc16', '#06b6d4', '#f43f5e', '#8b5cf6',
]

function getTrackColor(cameraId: string, trackId: number): string {
  const key = `${cameraId}-${trackId}`
  if (!trackColors.has(key)) {
    const colorIndex = trackColors.size % colorPalette.length
    trackColors.set(key, colorPalette[colorIndex])
  }
  return trackColors.get(key)!
}

// Initialize cameras on mount
async function initializeCameras(): Promise<void> {
  if (!activeSiteMap.value) return

  await annotation.initializeCameras(
    cameraSources,
    extractValue(activeSiteMap.value.width),
    extractValue(activeSiteMap.value.height)
  )
  isInitialized.value = true
}

// Set video ref for a camera
function setVideoRef(cameraId: string, el: HTMLVideoElement | null): void {
  if (el) {
    videoRefs.value.set(cameraId, el)
  } else {
    videoRefs.value.delete(cameraId)
  }
}

// Video loaded handler
function onVideoLoaded(cameraId: string): void {
  isVideoReady.value.set(cameraId, true)
  drawVideoFrame()
}

// Get current video element
const currentVideoEl = computed(() => {
  if (!annotation.activeCamera.value) return null
  return videoRefs.value.get(annotation.activeCamera.value) ?? null
})

// Sync video to current timestamp
function syncVideoToTimestamp(): void {
  for (const [cameraId, videoEl] of videoRefs.value) {
    if (videoEl && isVideoReady.value.get(cameraId)) {
      videoEl.currentTime = annotation.currentTimestamp.value
    }
  }
}

// Draw video frame for active camera
function drawVideoFrame(): void {
  const videoEl = currentVideoEl.value
  const canvas = videoCanvasRef.value
  if (!videoEl || !canvas) return

  if (!isVideoReady.value.get(annotation.activeCamera.value ?? '')) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size to match video
  if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
  }

  // Draw video frame
  ctx.drawImage(videoEl, 0, 0)
}

// Helper to get camera name
function getCameraName(cameraId: string): string {
  return cameraId
}

// Draw floor plan with annotations
function drawFloorPlan(): void {
  const canvas = floorPlanCanvasRef.value
  const siteMap = activeSiteMap.value
  if (!canvas || !siteMap) return

  const width = extractValue(siteMap.width)
  const height = extractValue(siteMap.height)
  const scale = RENDER_SCALE

  // Set canvas size and initialize
  canvas.width = width * scale
  canvas.height = height * scale

  siteMapCanvas.initCanvas()
  siteMapCanvas.resizeCanvas(width * scale, height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw grid using composable
  siteMapCanvas.drawGrid()

  // Draw obstacles using composable
  if (siteMap.obstacles && siteMap.obstacles.length > 0) {
    siteMapCanvas.drawObstacles(siteMap.obstacles)
  }

  // Draw walls using composable
  if (siteMap.walls && siteMap.walls.length > 0) {
    siteMapCanvas.drawWalls(siteMap.walls)
  }

  // Draw cameras with FOV using composable
  for (const camera of siteMap.cameras) {
    siteMapCanvas.drawCamera(
      camera,
      getCameraName,
      false,
      false,
      siteMap.walls,
      siteMap.obstacles
    )
  }

  // Draw existing annotations at current timestamp
  const nearbyAnnotations = annotation.getAnnotationsNearTimestamp(1.0)
  for (const ann of nearbyAnnotations) {
    const px = ann.groundPosition.x * scale
    const py = ann.groundPosition.y * scale

    // Draw annotation marker
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw linked camera indicators
    const cameraIndicators = ann.linkedDetections.map(d => d.cameraId.replace('camera', 'C'))
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(cameraIndicators.join('+'), px, py + 4)
  }

  // Draw currently selected detections (not yet annotated)
  for (const sel of annotation.selectedDetections.value) {
    const camData = annotation.cameras.get(sel.cameraId)
    if (!camData) continue

    // Use camera position + offset to indicate approximate location
    const camera = siteMap.cameras.find(c => c.cameraId === sel.cameraId)
    if (!camera) continue

    const camX = extractValue(camera.position.x) * scale
    const camY = extractValue(camera.position.y) * scale
    const color = cameraColors[sel.cameraId] ?? '#888'

    // Draw a marker near the camera to show selection
    const offsetX = (sel.detectionIndex % 3 - 1) * 20
    const offsetY = 40 + Math.floor(sel.detectionIndex / 3) * 20

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(camX + offsetX, camY + offsetY, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw track ID
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${sel.trackId}`, camX + offsetX, camY + offsetY + 4)
  }
}

// Convert screen coordinates to canvas coordinates
function screenToCanvasCoords(event: MouseEvent): { x: number; y: number } | null {
  const container = floorPlanContainerRef.value
  const canvas = floorPlanCanvasRef.value
  if (!container || !canvas) return null

  const rect = container.getBoundingClientRect()
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  const canvasX = (screenX - floorPlanOffset.value.x) / floorPlanScale.value
  const canvasY = (screenY - floorPlanOffset.value.y) / floorPlanScale.value

  return { x: canvasX, y: canvasY }
}

// Handle click on floor plan to create annotation
function onFloorPlanClick(event: MouseEvent): void {
  if (isFloorPlanDragging.value) return

  const siteMap = activeSiteMap.value
  if (!siteMap) return

  if (annotation.selectedDetections.value.length === 0) {
    return // No detections selected
  }

  const coords = screenToCanvasCoords(event)
  if (!coords) return

  const scale = RENDER_SCALE
  const xMeters = coords.x / scale
  const yMeters = coords.y / scale

  // Validate within bounds
  const width = extractValue(siteMap.width)
  const height = extractValue(siteMap.height)
  if (xMeters < 0 || xMeters > width || yMeters < 0 || yMeters > height) {
    return
  }

  // Create annotation with all selected detections
  annotation.createAnnotation({ x: xMeters, y: yMeters })

  drawFloorPlan()
}

// Floor plan pan handlers
function onFloorPlanMouseDown(event: MouseEvent): void {
  if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
    isFloorPlanDragging.value = true
    floorPlanDragStart.value = {
      x: event.clientX,
      y: event.clientY,
      offsetX: floorPlanOffset.value.x,
      offsetY: floorPlanOffset.value.y
    }
    event.preventDefault()
  }
}

function onFloorPlanMouseMove(event: MouseEvent): void {
  if (isFloorPlanDragging.value) {
    const dx = event.clientX - floorPlanDragStart.value.x
    const dy = event.clientY - floorPlanDragStart.value.y
    floorPlanOffset.value = {
      x: floorPlanDragStart.value.offsetX + dx,
      y: floorPlanDragStart.value.offsetY + dy
    }
    return
  }

  const coords = screenToCanvasCoords(event)
  if (!coords) return

  const scale = RENDER_SCALE
  floorPlanCoords.value = {
    x: coords.x / scale,
    y: coords.y / scale
  }
}

function onFloorPlanMouseUp(): void {
  isFloorPlanDragging.value = false
}

function onFloorPlanMouseLeave(): void {
  isFloorPlanDragging.value = false
  floorPlanCoords.value = null
}

function onFloorPlanWheel(event: WheelEvent): void {
  event.preventDefault()

  const container = floorPlanContainerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const delta = -event.deltaY
  const zoomFactor = delta > 0 ? 1.1 : 0.9
  const newScale = Math.max(0.1, Math.min(2, floorPlanScale.value * zoomFactor))

  if (newScale !== floorPlanScale.value) {
    const scaleChange = newScale / floorPlanScale.value
    floorPlanOffset.value = {
      x: mouseX - (mouseX - floorPlanOffset.value.x) * scaleChange,
      y: mouseY - (mouseY - floorPlanOffset.value.y) * scaleChange
    }
    floorPlanScale.value = newScale
  }
}

function fitFloorPlanToView(): void {
  const container = floorPlanContainerRef.value
  const siteMap = activeSiteMap.value
  if (!container || !siteMap) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = extractValue(siteMap.width) * RENDER_SCALE
  const mapHeight = extractValue(siteMap.height) * RENDER_SCALE

  const padding = 20
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  floorPlanScale.value = newScale
  floorPlanOffset.value = {
    x: (containerWidth - mapWidth * newScale) / 2,
    y: (containerHeight - mapHeight * newScale) / 2
  }
}

const floorPlanCoords = ref<{ x: number; y: number } | null>(null)

// Keyboard navigation
function handleKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      annotation.goToPrevFrame()
      syncVideoToTimestamp()
      break
    case 'ArrowRight':
      event.preventDefault()
      annotation.goToNextFrame()
      syncVideoToTimestamp()
      break
    case '1':
      annotation.setActiveCamera('camera1')
      break
    case '2':
      annotation.setActiveCamera('camera2')
      break
    case 'Escape':
      annotation.clearSelections()
      break
    case 's':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        annotation.saveToLocalStorage()
      }
      break
  }

  drawVideoFrame()
  drawFloorPlan()
}

// Watch for timestamp changes
watch(() => annotation.currentTimestamp.value, () => {
  syncVideoToTimestamp()
  drawVideoFrame()
  drawFloorPlan()
})

// Watch for active camera changes
watch(() => annotation.activeCamera.value, () => {
  drawVideoFrame()
})

// Watch for selection changes
watch(() => annotation.selectedDetections.value.length, () => {
  drawFloorPlan()
})

// Animation loop
let animationId: number | null = null

function startAnimationLoop(): void {
  const animate = () => {
    const videoEl = currentVideoEl.value
    if (videoEl && !videoEl.paused) {
      drawVideoFrame()
    }
    animationId = requestAnimationFrame(animate)
  }
  animate()
}

function stopAnimationLoop(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  startAnimationLoop()

  // Load site map configuration
  await loadSiteMap()

  // Initialize cameras when site map is ready
  if (activeSiteMap.value) {
    await initializeCameras()
    drawFloorPlan()
    setTimeout(fitFloorPlanToView, 100)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopAnimationLoop()
})

watch(activeSiteMap, async () => {
  if (activeSiteMap.value && !isInitialized.value) {
    await initializeCameras()
  }
  drawFloorPlan()
  setTimeout(fitFloorPlanToView, 50)
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold">Cross-Camera Annotator</h1>
        <div class="text-sm text-muted-foreground">
          Select detections from cameras, then click floor plan to annotate
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Stats -->
        <div v-if="annotation.stats.value" class="text-sm">
          <span class="text-muted-foreground">Annotations:</span>
          <span class="ml-1 font-mono font-semibold">
            {{ annotation.stats.value.totalAnnotations }}
          </span>
        </div>

        <!-- Selection count -->
        <div v-if="annotation.selectedDetections.value.length > 0" class="text-sm">
          <span class="px-2 py-1 bg-primary/20 rounded font-mono">
            {{ annotation.selectedDetections.value.length }} selected
          </span>
        </div>

        <!-- Save/Export -->
        <div class="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            :disabled="!annotation.isModified.value"
            @click="annotation.saveToLocalStorage()"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="annotation.exportAsJson()"
          >
            Export JSON
          </Button>
        </div>
      </div>
    </div>

    <!-- Error notification for already-annotated tracks -->
    <div
      v-if="selectionError"
      class="px-4 py-2 bg-destructive/10 border-b border-destructive/30 text-destructive text-sm flex items-center justify-between"
    >
      <span>{{ selectionError }}</span>
      <button
        class="text-destructive hover:text-destructive/80 font-semibold"
        @click="selectionError = null"
      >
        ✕
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
      <!-- Left: Video with Camera Tabs -->
      <div class="flex flex-col gap-3 min-h-0">
        <Card class="flex-1 flex flex-col min-h-0">
          <!-- Camera Tabs -->
          <CardHeader class="py-2 px-3">
            <div class="flex items-center justify-between">
              <Tabs
                :model-value="annotation.activeCamera.value ?? ''"
                @update:model-value="(v) => annotation.setActiveCamera(v as string)"
              >
                <TabsList>
                  <TabsTrigger
                    v-for="cam in annotation.cameraList.value"
                    :key="cam.cameraId"
                    :value="cam.cameraId"
                    class="gap-2"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: cameraColors[cam.cameraId] }"
                    />
                    {{ cam.cameraId }}
                    <span
                      v-if="annotation.getSelectionsForCamera(cam.cameraId).length > 0"
                      class="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs"
                    >
                      {{ annotation.getSelectionsForCamera(cam.cameraId).length }}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <span class="font-mono text-sm text-muted-foreground">
                {{ annotation.currentTimestamp.value.toFixed(2) }}s
              </span>
            </div>
          </CardHeader>

          <CardContent class="flex-1 p-2 min-h-0 relative">
            <!-- Hidden video elements for each camera -->
            <video
              v-for="cam in annotation.cameraList.value"
              :key="cam.cameraId"
              :ref="(el) => setVideoRef(cam.cameraId, el as HTMLVideoElement)"
              :src="cam.videoPath"
              class="hidden"
              @loadeddata="onVideoLoaded(cam.cameraId)"
              muted
            />

            <!-- Canvas for rendering video frame -->
            <canvas
              ref="videoCanvasRef"
              class="w-full h-full object-contain"
            />

            <!-- Loading state -->
            <div
              v-if="!isInitialized"
              class="absolute inset-0 flex items-center justify-center bg-muted/50"
            >
              <p class="text-muted-foreground">Loading cameras...</p>
            </div>
          </CardContent>
        </Card>

        <!-- Timeline Navigation -->
        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" @click="annotation.goToPrevFrame(); syncVideoToTimestamp()">
            ← Prev
          </Button>

          <input
            type="range"
            :min="0"
            :max="annotation.totalDuration.value"
            :step="0.1"
            :value="annotation.currentTimestamp.value"
            class="flex-1"
            @input="(e) => {
              const ts = parseFloat((e.target as HTMLInputElement).value)
              annotation.goToTimestamp(ts)
              syncVideoToTimestamp()
            }"
          />

          <Button size="sm" variant="outline" @click="annotation.goToNextFrame(); syncVideoToTimestamp()">
            Next →
          </Button>
        </div>
      </div>

      <!-- Right: Floor Plan + Detection List -->
      <div class="flex flex-col gap-3 min-h-0">
        <!-- Floor Plan -->
        <Card class="flex-1 flex flex-col min-h-0">
          <CardHeader class="py-2 px-3">
            <CardTitle class="text-sm flex items-center justify-between">
              <span>Floor Plan - Click to Set Position</span>
              <div class="flex items-center gap-3">
                <span v-if="floorPlanCoords" class="font-mono text-muted-foreground">
                  {{ floorPlanCoords.x.toFixed(2) }}m, {{ floorPlanCoords.y.toFixed(2) }}m
                </span>
                <span class="font-mono text-muted-foreground text-xs">
                  {{ (floorPlanScale * 100).toFixed(0) }}%
                </span>
                <Button size="sm" variant="ghost" class="h-6 px-2 text-xs" @click="fitFloorPlanToView">
                  Fit
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent class="flex-1 p-0 min-h-0 relative overflow-hidden">
            <div
              ref="floorPlanContainerRef"
              class="absolute inset-0"
              :class="[
                annotation.selectedDetections.value.length > 0 ? 'cursor-crosshair' : 'cursor-grab',
                isFloorPlanDragging ? 'cursor-grabbing' : ''
              ]"
              @click="onFloorPlanClick"
              @mousedown="onFloorPlanMouseDown"
              @mousemove="onFloorPlanMouseMove"
              @mouseup="onFloorPlanMouseUp"
              @mouseleave="onFloorPlanMouseLeave"
              @wheel="onFloorPlanWheel"
            >
              <canvas
                ref="floorPlanCanvasRef"
                :style="{
                  position: 'absolute',
                  left: `${floorPlanOffset.x}px`,
                  top: `${floorPlanOffset.y}px`,
                  transform: `scale(${floorPlanScale})`,
                  transformOrigin: 'top left',
                }"
              />
            </div>

            <div
              v-if="!activeSiteMap"
              class="absolute inset-0 flex items-center justify-center bg-muted/50"
            >
              <p class="text-muted-foreground">No site map loaded</p>
            </div>

            <div class="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Scroll to zoom, Shift+drag to pan
            </div>
          </CardContent>
        </Card>

        <!-- Detections List for Active Camera -->
        <Card class="h-[200px] flex flex-col">
          <CardHeader class="py-2 px-3">
            <CardTitle class="text-sm flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: cameraColors[annotation.activeCamera.value ?? ''] }"
              />
              Detections - {{ annotation.activeCamera.value }}
              ({{ annotation.currentFrameData.value?.detections.length ?? 0 }})
            </CardTitle>
          </CardHeader>
          <CardContent class="flex-1 p-2 overflow-y-auto">
            <div
              v-if="!annotation.currentFrameData.value?.detections.length"
              class="text-sm text-muted-foreground text-center py-4"
            >
              No detections at this timestamp
            </div>

            <div v-else class="space-y-1">
              <div
                v-for="(det, index) in annotation.currentFrameData.value.detections"
                :key="index"
                class="p-2 rounded text-xs transition-colors"
                :class="[
                  annotation.isTrackAlreadyAnnotated(annotation.activeCamera.value ?? '', det.track_id)
                    ? 'bg-green-500/20 cursor-not-allowed opacity-60'
                    : annotation.isDetectionSelected(annotation.activeCamera.value ?? '', index)
                      ? 'bg-primary/20 ring-1 ring-primary cursor-pointer'
                      : 'bg-muted/50 hover:bg-muted cursor-pointer'
                ]"
                @click="handleDetectionClick(annotation.activeCamera.value ?? '', index)"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getTrackColor(annotation.activeCamera.value ?? '', det.track_id) }"
                  />
                  <span class="font-semibold">Track #{{ det.track_id }}</span>
                  <span class="text-muted-foreground">
                    {{ (det.confidence * 100).toFixed(0) }}%
                  </span>

                  <span
                    v-if="annotation.isTrackAlreadyAnnotated(annotation.activeCamera.value ?? '', det.track_id)"
                    class="ml-auto text-green-500 font-semibold"
                  >
                    ✓ Annotated
                  </span>
                  <span
                    v-else-if="annotation.isDetectionSelected(annotation.activeCamera.value ?? '', index)"
                    class="ml-auto text-primary font-semibold"
                  >
                    Selected
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="border-t px-4 py-2 text-xs text-muted-foreground flex gap-6">
      <span><kbd class="px-1 bg-muted rounded">←</kbd> <kbd class="px-1 bg-muted rounded">→</kbd> Navigate frames</span>
      <span><kbd class="px-1 bg-muted rounded">1</kbd> <kbd class="px-1 bg-muted rounded">2</kbd> Switch camera</span>
      <span><kbd class="px-1 bg-muted rounded">Esc</kbd> Clear selections</span>
      <span><kbd class="px-1 bg-muted rounded">Ctrl+S</kbd> Save</span>
    </div>
  </div>
</template>
