<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import { useMultiCameraAnnotation } from '@/composables/useMultiCameraAnnotation'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { AVAILABLE_VIDEOS, normalizeBbox } from '@/types/frame-review'
import { extractValue, RENDER_SCALE } from '@/utils/siteMapConversion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

// Refs - use reactive Maps for proper mutation tracking
const videoRefs = reactive<Map<string, HTMLVideoElement>>(new Map())
const videoCanvasRefs = reactive<Map<string, HTMLCanvasElement>>(new Map())
const floorPlanCanvasRef = ref<HTMLCanvasElement | null>(null)
const floorPlanContainerRef = ref<HTMLDivElement | null>(null)

// State - use reactive Map for proper mutation tracking
const isVideoReady = reactive<Map<string, boolean>>(new Map())
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
    videoRefs.set(cameraId, el)
  } else {
    videoRefs.delete(cameraId)
  }
}

// Set canvas ref for a camera
function setCanvasRef(cameraId: string, el: HTMLCanvasElement | null): void {
  if (el) {
    videoCanvasRefs.set(cameraId, el)
  } else {
    videoCanvasRefs.delete(cameraId)
  }
}

// Video loaded handler
function onVideoLoaded(cameraId: string): void {
  isVideoReady.set(cameraId, true)
  // Use nextTick to ensure Vue has processed reactivity updates
  nextTick(() => {
    drawAllVideoFrames()
  })
}

// Sync video to current timestamp
function syncVideoToTimestamp(): void {
  for (const [cameraId, videoEl] of videoRefs) {
    if (videoEl && isVideoReady.get(cameraId)) {
      videoEl.currentTime = annotation.currentTimestamp.value
    }
  }
}

// Get frame data for a specific camera
function getFrameDataForCamera(cameraId: string) {
  const cam = annotation.cameras.get(cameraId)
  if (!cam?.detectionData) return null

  // Find frame closest to current timestamp
  const frames = cam.detectionData.frames
  if (frames.length === 0) return null

  const timestamp = annotation.currentTimestamp.value
  let low = 0
  let high = frames.length - 1

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (frames[mid].timestamp < timestamp) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  if (low > 0) {
    const prevDiff = Math.abs(frames[low - 1].timestamp - timestamp)
    const currDiff = Math.abs(frames[low].timestamp - timestamp)
    if (prevDiff < currDiff) {
      return frames[low - 1]
    }
  }

  return frames[low]
}

// Draw video frame for a specific camera with bounding boxes
function drawVideoFrameForCamera(cameraId: string): void {
  const videoEl = videoRefs.get(cameraId)
  const canvas = videoCanvasRefs.get(cameraId)
  if (!videoEl || !canvas) return

  if (!isVideoReady.get(cameraId)) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size to match video
  if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
  }

  // Draw video frame
  ctx.drawImage(videoEl, 0, 0)

  // Draw bounding boxes for current frame detections
  const frameData = getFrameDataForCamera(cameraId)
  if (!frameData?.detections) return

  const videoWidth = videoEl.videoWidth
  const videoHeight = videoEl.videoHeight

  for (let i = 0; i < frameData.detections.length; i++) {
    const det = frameData.detections[i]
    const bbox = normalizeBbox(det.bbox)
    const trackId = det.track_id
    const color = getTrackColor(cameraId, trackId)
    const isSelected = annotation.isDetectionSelected(cameraId, i)
    const isAnnotated = annotation.isTrackAlreadyAnnotated(cameraId, trackId)

    // Convert normalized bbox (left, top, right, bottom) to pixel coordinates
    const x = bbox.left * videoWidth
    const y = bbox.top * videoHeight
    const w = (bbox.right - bbox.left) * videoWidth
    const h = (bbox.bottom - bbox.top) * videoHeight

    // Draw bounding box
    ctx.strokeStyle = color
    ctx.lineWidth = isSelected ? 4 : 2
    ctx.strokeRect(x, y, w, h)

    // Draw selection highlight
    if (isSelected) {
      ctx.fillStyle = color + '33' // 20% opacity
      ctx.fillRect(x, y, w, h)
    }

    // Draw annotated checkmark
    if (isAnnotated) {
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(x + w - 12, y + 12, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✓', x + w - 12, y + 16)
    }

    // Draw track label (larger font)
    const label = `#${trackId}`
    ctx.font = 'bold 24px monospace'
    const labelWidth = ctx.measureText(label).width + 12
    ctx.fillStyle = color
    ctx.fillRect(x, y - 32, labelWidth, 28)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(label, x + 6, y - 10)
  }
}

// Draw all camera video frames
function drawAllVideoFrames(): void {
  for (const cameraId of videoRefs.keys()) {
    drawVideoFrameForCamera(cameraId)
  }
}

// Helper to get camera name
function getCameraName(cameraId: string): string {
  return cameraId
}

// Handle click on camera canvas to select detection
function handleCanvasClick(cameraId: string, event: MouseEvent): void {
  const canvas = videoCanvasRefs.get(cameraId)
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY

  // Find which detection was clicked
  const frameData = getFrameDataForCamera(cameraId)
  if (!frameData?.detections) return

  for (let i = 0; i < frameData.detections.length; i++) {
    const det = frameData.detections[i]
    const bbox = normalizeBbox(det.bbox)
    const bx = bbox.left * canvas.width
    const by = bbox.top * canvas.height
    const bw = (bbox.right - bbox.left) * canvas.width
    const bh = (bbox.bottom - bbox.top) * canvas.height

    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      handleDetectionClick(cameraId, i)
      return
    }
  }
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

    // Get color from the first linked detection's track
    const firstDet = ann.linkedDetections[0]
    const markerColor = firstDet
      ? getTrackColor(firstDet.cameraId, firstDet.trackId)
      : '#22c55e'

    // Draw annotation marker with track color
    ctx.fillStyle = markerColor
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw linked track IDs with their colors
    const trackLabels = ann.linkedDetections.map(d => `#${d.trackId}`)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(trackLabels.join('+'), px, py + 4)
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
    // Use track color instead of camera color
    const color = getTrackColor(sel.cameraId, sel.trackId)

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
    ctx.fillText(`#${sel.trackId}`, camX + offsetX, camY + offsetY + 4)
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

  drawAllVideoFrames()
  drawFloorPlan()
}

// Watch for timestamp changes
watch(() => annotation.currentTimestamp.value, () => {
  syncVideoToTimestamp()
  drawAllVideoFrames()
  drawFloorPlan()
})

// Watch for selection changes to redraw bboxes
watch(() => annotation.selectedDetections.value.length, () => {
  drawAllVideoFrames()
  drawFloorPlan()
})

// Animation loop - for playing videos
let animationId: number | null = null

function startAnimationLoop(): void {
  const animate = () => {
    // Check if any video is playing
    let anyPlaying = false
    for (const videoEl of videoRefs.values()) {
      if (videoEl && !videoEl.paused) {
        anyPlaying = true
        break
      }
    }
    if (anyPlaying) {
      drawAllVideoFrames()
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

    // Wait for Vue to render video elements, then try to draw
    await nextTick()
    // Give videos a moment to start loading and trigger loadeddata
    setTimeout(() => {
      drawAllVideoFrames()
    }, 500)
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

    <!-- Main Content: Cameras stacked left, Site map right -->
    <div class="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
      <!-- Top: Cameras (stacked) | Site Map (larger) -->
      <div class="flex-1 grid grid-cols-2 gap-3 min-h-0">
        <!-- Left: Cameras stacked vertically -->
        <div class="flex flex-col gap-2 min-h-0">
          <!-- Camera 1 -->
          <Card class="flex-1 flex flex-col min-h-0">
            <CardHeader class="py-1 px-2">
              <CardTitle class="text-sm flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cameraColors['camera1'] }" />
                Camera 1
                <span v-if="annotation.getSelectionsForCamera('camera1').length > 0" class="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {{ annotation.getSelectionsForCamera('camera1').length }}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent class="flex-1 p-1 min-h-0 relative flex items-center justify-center bg-black">
              <video
                :ref="(el) => setVideoRef('camera1', el as HTMLVideoElement)"
                :src="cameraSources[0]?.videoPath"
                class="hidden"
                @loadeddata="onVideoLoaded('camera1')"
                muted
              />
              <canvas
                :ref="(el) => setCanvasRef('camera1', el as HTMLCanvasElement)"
                class="max-w-full max-h-full"
                style="aspect-ratio: 16/9;"
                @click="handleCanvasClick('camera1', $event)"
              />
            </CardContent>
          </Card>

          <!-- Camera 2 -->
          <Card class="flex-1 flex flex-col min-h-0">
            <CardHeader class="py-1 px-2">
              <CardTitle class="text-sm flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cameraColors['camera2'] }" />
                Camera 2
                <span v-if="annotation.getSelectionsForCamera('camera2').length > 0" class="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {{ annotation.getSelectionsForCamera('camera2').length }}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent class="flex-1 p-1 min-h-0 relative flex items-center justify-center bg-black">
              <video
                :ref="(el) => setVideoRef('camera2', el as HTMLVideoElement)"
                :src="cameraSources[1]?.videoPath"
                class="hidden"
                @loadeddata="onVideoLoaded('camera2')"
                muted
              />
              <canvas
                :ref="(el) => setCanvasRef('camera2', el as HTMLCanvasElement)"
                class="max-w-full max-h-full"
                style="aspect-ratio: 16/9;"
                @click="handleCanvasClick('camera2', $event)"
              />
            </CardContent>
          </Card>
        </div>

        <!-- Right: Site Map (larger) -->
        <Card class="flex flex-col min-h-0">
          <CardHeader class="py-1 px-2">
            <CardTitle class="text-sm flex items-center justify-between">
              <span>Site Map - Click to annotate</span>
              <div class="flex items-center gap-2">
                <span v-if="floorPlanCoords" class="font-mono text-muted-foreground text-xs">
                  {{ floorPlanCoords.x.toFixed(2) }}m, {{ floorPlanCoords.y.toFixed(2) }}m
                </span>
                <Button size="sm" variant="ghost" class="h-5 px-1 text-xs" @click="fitFloorPlanToView">
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
            <div v-if="!activeSiteMap" class="absolute inset-0 flex items-center justify-center bg-muted/50">
              <p class="text-muted-foreground text-sm">No site map</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Bottom: Timeline + Dynamic Track Grid -->
      <div class="flex items-center gap-3">
        <!-- Timeline -->
        <div class="flex-1 flex items-center gap-2">
          <Button size="sm" variant="outline" @click="annotation.goToPrevFrame(); syncVideoToTimestamp()">
            ←
          </Button>

          <div class="flex-1 flex flex-col gap-1">
            <input
              type="range"
              :min="0"
              :max="annotation.totalDuration.value"
              :step="0.1"
              :value="annotation.currentTimestamp.value"
              class="w-full"
              @input="(e) => {
                const ts = parseFloat((e.target as HTMLInputElement).value)
                annotation.goToTimestamp(ts)
                syncVideoToTimestamp()
              }"
            />
            <div class="text-center font-mono text-sm text-muted-foreground">
              {{ annotation.currentTimestamp.value.toFixed(2) }}s / {{ annotation.totalDuration.value.toFixed(1) }}s
            </div>
          </div>

          <Button size="sm" variant="outline" @click="annotation.goToNextFrame(); syncVideoToTimestamp()">
            →
          </Button>
        </div>

        <!-- Dynamic Track Grid - grouped by camera -->
        <div class="flex gap-4">
          <template v-for="cam in ['camera1', 'camera2']" :key="cam">
            <div class="flex items-center gap-1">
              <!-- Camera label -->
              <div class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cameraColors[cam] }" />
                <span>{{ cam === 'camera1' ? 'C1' : 'C2' }}</span>
              </div>
              <!-- Detections for this camera -->
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="(det, index) in (getFrameDataForCamera(cam)?.detections || [])"
                  :key="`${cam}-${det.track_id}`"
                  class="px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
                  :class="[
                    annotation.isDetectionSelected(cam, index)
                      ? 'bg-primary/30 ring-2 ring-primary'
                      : annotation.isTrackAlreadyAnnotated(cam, det.track_id)
                        ? 'bg-green-500/20 opacity-60'
                        : 'bg-muted/50 hover:bg-muted'
                  ]"
                  @click="handleDetectionClick(cam, index)"
                >
                  <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: getTrackColor(cam, det.track_id) }" />
                  <span class="font-mono">#{{ det.track_id }}</span>
                  <span v-if="annotation.isTrackAlreadyAnnotated(cam, det.track_id)" class="text-green-500">✓</span>
                </button>
                <span v-if="(getFrameDataForCamera(cam)?.detections || []).length === 0" class="text-xs text-muted-foreground px-1">
                  -
                </span>
              </div>
            </div>
          </template>
        </div>
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
