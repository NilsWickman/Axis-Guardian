<template>
  <div class="h-full w-full bg-background flex">
    <!-- Left Panel - Site Map Selector -->
    <SiteMapSelector
      :site-maps="siteMaps"
      :selected-map-id="selectedMapId"
      @select="selectMap"
      @add-new="openAddMapDialog"
      @edit="editMap"
    >
      <template #controls>
        <div class="p-3 border-b">
          <MapControls
            :show-grid="canvasOptions.showGrid"
            :show-labels="canvasOptions.showCameraLabels"
            @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
            @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
          />
        </div>
      </template>
    </SiteMapSelector>

    <!-- Main Content - Site Map Display -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Map Canvas Area -->
      <div class="flex-1 p-4 flex flex-col">
        <!-- Canvas Container -->
        <div class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden" ref="canvasContainer">
          <canvas
            ref="mapCanvas"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            @wheel="handleWheel"
            @click="onCameraClick"
            :class="isDragging ? 'cursor-grabbing' : (hoveredCamera ? 'cursor-pointer' : 'cursor-grab')"
            :style="canvasStyle"
          ></canvas>

          <!-- Coordinates and Zoom Display -->
          <CanvasOverlay position="bottom-left">
            <div class="bg-black/70 text-white px-3 py-1.5 rounded text-sm font-mono space-y-0.5">
              <div>Mouse: ({{ Math.round((interaction.mouseX.value - offsetX) / scale) }}, {{ Math.round((interaction.mouseY.value - offsetY) / scale) }})</div>
              <div>Zoom: {{ (scale * 100).toFixed(0) }}%</div>
            </div>
          </CanvasOverlay>

          <!-- Hover Tooltip -->
          <div
            v-if="hoveredCamera"
            class="absolute bg-black/90 text-white px-3 py-2 rounded text-xs pointer-events-none"
            :style="{
              left: `${interaction.mouseX.value + 10}px`,
              top: `${interaction.mouseY.value + 10}px`
            }"
          >
            <div class="font-semibold">{{ getCameraName(hoveredCamera.cameraId) }}</div>
            <div class="text-[10px] text-gray-300">{{ hoveredCamera.cameraId }}</div>
            <div class="text-[10px] text-gray-400 mt-1">
              Status: <span :class="getCameraStatus(hoveredCamera.cameraId) === 'online' ? 'text-green-400' : 'text-red-400'">
                {{ getCameraStatus(hoveredCamera.cameraId) }}
              </span>
            </div>
          </div>

          <!-- Instructions -->
          <CanvasOverlay v-if="!currentMap || currentMap.cameras.length === 0" position="center">
            <div class="bg-black/70 text-white px-6 py-4 rounded-lg text-center">
              <p class="font-semibold mb-2">{{ currentMap ? 'No cameras configured' : 'No site map selected' }}</p>
              <p class="text-sm text-gray-300">{{ currentMap ? 'Click "Configure Maps" to add cameras' : 'Select a site map from the list' }}</p>
            </div>
          </CanvasOverlay>
        </div>
      </div>

      <!-- Right Panel - Camera Info -->
      <div class="w-80 border-l bg-card p-4 overflow-y-auto">
        <h2 class="text-sm font-semibold mb-3">Cameras</h2>

        <!-- Camera List -->
        <CameraList
          v-if="currentMap && currentMap.cameras.length > 0"
          :cameras="currentMap.cameras"
          :selected-camera-id="selectedCamera?.cameraId || null"
          :get-camera-name="getCameraName"
          :get-camera-status="getCameraStatus"
          :get-color-hex="getColorHex"
          @select="selectCameraById"
        />

        <!-- Camera Details -->
        <CameraDetailsPanel
          :camera="selectedCamera"
          :get-camera-name="getCameraName"
          :get-camera-status="getCameraStatus"
          :get-color-badge-class="getColorBadgeClass"
          :get-color-badge-text="getColorBadgeText"
          :scale="currentMap?.scale || 50"
          @view-live="viewCameraLive"
        >
          <template #actions>
            <button
              @click="viewCameraLive"
              class="w-full mt-3 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
            >
              View Live Feed
            </button>
          </template>
        </CameraDetailsPanel>
      </div>
    </div>

    <!-- Camera Feed Modal -->
    <Dialog :open="showCameraModal" @update:open="(open) => !open && closeCameraModal()">
      <DialogContent class="max-w-[90vw] w-[90vw] h-[90vh] p-0">
        <div class="relative bg-gray-900 rounded-lg overflow-hidden w-full h-full">
          <video
            ref="feedVideoRef"
            class="w-full h-full object-contain"
            autoplay
            muted
            playsinline
          ></video>

          <!-- Loading State -->
          <div
            v-if="!streamReady"
            class="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Add New Site Map Modal -->
    <Dialog :open="showAddMapDialog" @update:open="(open) => !open && closeAddMapDialog()">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Site Map</DialogTitle>
          <DialogDescription>
            Upload a floor plan image to create a new site map. You can configure cameras later.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Name Input -->
          <div class="space-y-2">
            <label for="map-name" class="text-sm font-medium">Name *</label>
            <input
              id="map-name"
              v-model="newMapForm.name"
              type="text"
              placeholder="e.g., Building A - Floor 1"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <!-- Description Input -->
          <div class="space-y-2">
            <label for="map-description" class="text-sm font-medium">Description</label>
            <textarea
              id="map-description"
              v-model="newMapForm.description"
              placeholder="Optional description of this site map"
              rows="3"
              class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            ></textarea>
          </div>

          <!-- Floor Plan Upload -->
          <div class="space-y-2">
            <label for="floor-plan" class="text-sm font-medium">Floor Plan Image *</label>
            <div class="border-2 border-dashed border-input rounded-lg p-6 hover:border-primary/50 transition-colors">
              <input
                id="floor-plan"
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
              />

              <div v-if="!newMapForm.floorPlanFile" class="text-center">
                <svg
                  class="mx-auto h-12 w-12 text-muted-foreground"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="mt-4">
                  <button
                    type="button"
                    @click="fileInputRef?.click()"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Choose File
                  </button>
                  <p class="mt-2 text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>

              <div v-else class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-16 w-16 rounded border overflow-hidden bg-muted">
                    <img
                      v-if="newMapForm.floorPlanPreview"
                      :src="newMapForm.floorPlanPreview"
                      :alt="newMapForm.floorPlanFile.name"
                      class="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium">{{ newMapForm.floorPlanFile.name }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ formatFileSize(newMapForm.floorPlanFile.size) }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="clearFile"
                  class="text-sm text-destructive hover:text-destructive/90"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            @click="closeAddMapDialog"
            class="px-4 py-2 border rounded-md hover:bg-accent text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            @click.prevent="handleAddMap"
            :disabled="!canSubmitNewMap"
            class="px-4 py-2 rounded-md text-sm transition-colors"
            :class="canSubmitNewMap
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed'"
          >
            Add Site Map
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteMapStore } from '../stores/siteMaps'
import { useCameraStore } from '../stores/cameras'
import { useSiteMapCanvas, type CanvasRenderOptions } from '../composables/useSiteMapCanvas'
import { useCanvasInteraction } from '../composables/useCanvasInteraction'
import type { CameraPlacement } from '../stores/siteMaps'
import MapControls from '../components/features/site-map/MapControls.vue'
import SiteMapSelector from '../components/features/site-map/SiteMapSelector.vue'
import CameraList from '../components/features/camera/CameraList.vue'
import CameraDetailsPanel from '../components/features/camera/CameraDetailsPanel.vue'
import CanvasOverlay from '../components/layout/CanvasOverlay.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()
const { success: showSuccessToast, error: showErrorToast } = useToast()

const siteMaps = computed(() => siteMapStore.siteMaps)
const selectedMapId = ref(siteMapStore.activeSiteMapId.value)
const currentMap = computed(() => siteMaps.value.find(m => m.id === selectedMapId.value))

const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const selectedCamera = ref<CameraPlacement | null>(null)

// Canvas options
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: true,
  showCameraLabels: true,
  pixelsPerMeter: 50
})

// Camera feed modal
const showCameraModal = ref(false)
const feedVideoRef = ref<HTMLVideoElement | null>(null)
const streamReady = ref(false)
const activePeerConnection = ref<RTCPeerConnection | null>(null)

// Add new site map modal
const showAddMapDialog = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const newMapForm = reactive({
  name: '',
  description: '',
  floorPlanFile: null as File | null,
  floorPlanPreview: null as string | null,
})

const canSubmitNewMap = computed(() => {
  return newMapForm.name.trim() !== ''
})

// Composables
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const interaction = useCanvasInteraction(mapCanvas, canvas.findCameraAtPoint)

// Canvas scaling and panning
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const minScale = 0.1
const maxScale = 5

// Drag state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${offsetX.value}px`,
  top: `${offsetY.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

// Hovered camera
const hoveredCamera = computed(() => {
  if (!currentMap.value) return null
  const canvasX = (interaction.mouseX.value - offsetX.value) / scale.value
  const canvasY = (interaction.mouseY.value - offsetY.value) / scale.value
  return canvas.findCameraAtPoint(
    canvasX,
    canvasY,
    currentMap.value.cameras
  )
})

const selectMap = async (mapId: string) => {
  console.log('[selectMap] START - mapId:', mapId)

  selectedMapId.value = mapId
  siteMapStore.setActiveSiteMap(mapId)
  selectedCamera.value = null

  // Note: resizeCanvas() and fitToView() are handled by the watch on currentMap
  console.log('[selectMap] Map changed, watch will handle resize/fit')
}

const editMap = (mapId: string) => {
  router.push({ name: 'SiteMapEditor', params: { mapId } })
}

const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const getCameraStatus = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera?.status || 'offline'
}

const getColorBadgeText = (color: string): string => {
  // If it's a hex color, return a generic label
  if (color.startsWith('#')) {
    return 'Custom'
  }

  // Parse Tailwind color class (e.g., "red-500" or "bg-red-500")
  const match = color.match(/(?:bg-)?(\w+)-(\d+)/)
  if (!match) return 'Color'

  const [, colorName, shade] = match
  const shadeNum = parseInt(shade)

  // Capitalize color name
  const formattedName = colorName.charAt(0).toUpperCase() + colorName.slice(1)

  // Determine if it's light or dark based on shade
  if (shadeNum < 500) {
    return `Light ${formattedName}`
  } else {
    return `Dark ${formattedName}`
  }
}

const getColorBadgeClass = (color: string): string => {
  // If it's a hex color, use neutral styling
  if (color.startsWith('#')) {
    return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  // Parse Tailwind color class
  const match = color.match(/(?:bg-)?(\w+)-(\d+)/)
  if (!match) return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'

  const [, colorName, shade] = match
  const shadeNum = parseInt(shade)

  // Use lighter background with darker text for light shades
  // Use darker background with lighter text for dark shades
  if (shadeNum < 500) {
    return `bg-${colorName}-100 text-${colorName}-900 dark:bg-${colorName}-900/30 dark:text-${colorName}-200`
  } else {
    return `bg-${colorName}-500/20 text-${colorName}-900 dark:bg-${colorName}-500/30 dark:text-${colorName}-200`
  }
}

// Tailwind color map for inline styles
const TAILWIND_COLOR_MAP: Record<string, string> = {
  'red-400': '#f87171', 'red-500': '#ef4444',
  'orange-400': '#fb923c', 'orange-500': '#f97316',
  'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
  'yellow-400': '#facc15', 'yellow-500': '#eab308',
  'lime-400': '#a3e635', 'lime-500': '#84cc16',
  'green-400': '#4ade80', 'green-500': '#22c55e',
  'emerald-400': '#34d399', 'emerald-500': '#10b981',
  'teal-400': '#2dd4bf', 'teal-500': '#14b8a6',
  'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
  'sky-400': '#38bdf8', 'sky-500': '#0ea5e9',
  'blue-400': '#60a5fa', 'blue-500': '#3b82f6',
  'indigo-400': '#818cf8', 'indigo-500': '#6366f1',
  'violet-400': '#a78bfa', 'violet-500': '#8b5cf6',
  'purple-400': '#c084fc', 'purple-500': '#a855f7',
  'fuchsia-400': '#e879f9', 'fuchsia-500': '#d946ef',
  'pink-400': '#f472b6', 'pink-500': '#ec4899',
  'rose-400': '#fb7185', 'rose-500': '#f43f5e',
}

const getColorHex = (color: string): string => {
  if (color.startsWith('#')) return color
  const cleanColor = color.replace(/^bg-/, '')
  return TAILWIND_COLOR_MAP[cleanColor] || '#6366f1'
}

const selectCameraById = (cameraId: string) => {
  if (currentMap.value) {
    selectedCamera.value = currentMap.value.cameras.find(c => c.cameraId === cameraId) || null
    drawMap()
  }
}

const onCameraClick = (event: MouseEvent) => {
  // Don't handle click if we just finished dragging
  if (isDragging.value) return
  if (!currentMap.value) return

  const coords = interaction.getCanvasCoordinates(event)
  const canvasX = (coords.x - offsetX.value) / scale.value
  const canvasY = (coords.y - offsetY.value) / scale.value
  const camera = canvas.findCameraAtPoint(canvasX, canvasY, currentMap.value.cameras)

  if (camera) {
    selectedCamera.value = camera
  } else {
    selectedCamera.value = null
  }

  drawMap()
}

const handleMouseDown = (event: MouseEvent) => {
  // Only start drag on left click
  if (event.button !== 0) return

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    offsetX: offsetX.value,
    offsetY: offsetY.value
  }
}

const handleMouseMove = (event: MouseEvent) => {
  interaction.onMouseMove(event)

  // Handle panning
  if (isDragging.value) {
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y
    offsetX.value = dragStart.value.offsetX + dx
    offsetY.value = dragStart.value.offsetY + dy
    drawMap()
    return
  }

  // Handle hover detection
  if (currentMap.value) {
    const canvasX = (interaction.mouseX.value - offsetX.value) / scale.value
    const canvasY = (interaction.mouseY.value - offsetY.value) / scale.value
    const hovered = canvas.findCameraAtPoint(
      canvasX,
      canvasY,
      currentMap.value.cameras
    )
    canvas.hoveredCameraId.value = hovered?.cameraId || null
  }

  canvas.requestRedraw(drawMap)
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Zoom factor
  const delta = -event.deltaY
  const zoomIntensity = 0.001
  const zoom = Math.exp(delta * zoomIntensity)

  const newScale = Math.max(minScale, Math.min(maxScale, scale.value * zoom))

  if (newScale !== scale.value) {
    // Zoom towards mouse position
    const scaleChange = newScale / scale.value
    offsetX.value = mouseX - (mouseX - offsetX.value) * scaleChange
    offsetY.value = mouseY - (mouseY - offsetY.value) * scaleChange
    scale.value = newScale

    drawMap()
  }
}

const zoomIn = () => {
  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const zoomFactor = 1.2
  const newScale = Math.min(maxScale, scale.value * zoomFactor)

  if (newScale !== scale.value) {
    const scaleChange = newScale / scale.value
    offsetX.value = centerX - (centerX - offsetX.value) * scaleChange
    offsetY.value = centerY - (centerY - offsetY.value) * scaleChange
    scale.value = newScale
    drawMap()
  }
}

const zoomOut = () => {
  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const zoomFactor = 1 / 1.2
  const newScale = Math.max(minScale, scale.value * zoomFactor)

  if (newScale !== scale.value) {
    const scaleChange = newScale / scale.value
    offsetX.value = centerX - (centerX - offsetX.value) * scaleChange
    offsetY.value = centerY - (centerY - offsetY.value) * scaleChange
    scale.value = newScale
    drawMap()
  }
}

const resetZoom = () => {
  scale.value = 1
  // Center the map
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = currentMap.value.width
  const mapHeight = currentMap.value.height

  offsetX.value = (containerWidth - mapWidth) / 2
  offsetY.value = (containerHeight - mapHeight) / 2
  drawMap()
}

const drawMap = () => {
  console.log('[drawMap] Called - scale/offset:', { scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value })
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawWalls(currentMap.value.walls)

  currentMap.value.cameras.forEach(camera => {
    const isSelected = selectedCamera.value?.cameraId === camera.cameraId
    canvas.drawCamera(camera, getCameraName, isSelected, false, currentMap.value.walls)
  })
}

const resetCanvasTransform = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

const fitToView = () => {
  console.log('[fitToView] START')
  const canvasEl = mapCanvas.value
  const container = canvasContainer.value
  if (!canvasEl || !container || !currentMap.value) {
    console.log('[fitToView] EARLY EXIT - missing elements')
    return
  }

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = currentMap.value.width
  const mapHeight = currentMap.value.height

  console.log('[fitToView] Container:', { containerWidth, containerHeight })
  console.log('[fitToView] Map:', { mapWidth, mapHeight })

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  console.log('[fitToView] Calculated:', { scaleX, scaleY, newScale })

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2

  console.log('[fitToView] Set values:', { scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value })
}

const setupMockWebRTC = async () => {
  if (!selectedCamera.value) return

  try {
    // Close existing connection if any
    if (activePeerConnection.value) {
      activePeerConnection.value.close()
    }

    streamReady.value = false
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    activePeerConnection.value = pc

    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!

    const camera = cameraStore.cameras.find(c => c.id === selectedCamera.value?.cameraId)

    const animate = () => {
      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = '#16213e'
      ctx.lineWidth = 2
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Animated circle
      const time = Date.now() / 1000
      const x = (Math.sin(time * 0.5) * 0.4 + 0.5) * canvas.width
      const y = (Math.cos(time * 0.3) * 0.3 + 0.5) * canvas.height

      ctx.fillStyle = '#4ecca3'
      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.fill()

      // Camera info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(20, 20, 350, 140)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(camera?.name || 'Camera', 40, 55)

      ctx.font = '16px monospace'
      ctx.fillStyle = '#4ecca3'
      ctx.fillText(`CAM ID: ${selectedCamera.value?.cameraId}`, 40, 85)
      ctx.fillText(`Position: (${selectedCamera.value?.x}, ${selectedCamera.value?.y})`, 40, 110)

      const now = new Date()
      ctx.fillText(now.toLocaleTimeString(), 40, 135)

      // Recording indicator
      if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(canvas.width - 40, 40, 10, 0, Math.PI * 2)
        ctx.fill()
      }

      if (activePeerConnection.value && showCameraModal.value) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    const stream = canvas.captureStream(30)
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    if (feedVideoRef.value) {
      feedVideoRef.value.srcObject = stream
      streamReady.value = true
    }
  } catch (err) {
    console.error('Failed to setup WebRTC:', err)
  }
}

const viewCameraLive = () => {
  if (selectedCamera.value) {
    showCameraModal.value = true
    // Give the modal time to render the video element
    setTimeout(() => {
      setupMockWebRTC()
    }, 100)
  }
}

const closeCameraModal = () => {
  showCameraModal.value = false
  streamReady.value = false
  if (activePeerConnection.value) {
    activePeerConnection.value.close()
    activePeerConnection.value = null
  }
}

const openAddMapDialog = () => {
  showAddMapDialog.value = true
}

const closeAddMapDialog = () => {
  showAddMapDialog.value = false
  // Reset form
  newMapForm.name = ''
  newMapForm.description = ''
  newMapForm.floorPlanFile = null
  newMapForm.floorPlanPreview = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showErrorToast('File size must be less than 10MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select an image file')
      return
    }

    newMapForm.floorPlanFile = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      newMapForm.floorPlanPreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearFile = () => {
  newMapForm.floorPlanFile = null
  newMapForm.floorPlanPreview = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleAddMap = async () => {
  if (!canSubmitNewMap.value) return

  try {
    let width = 1000
    let height = 800
    let imagePath: string | undefined = undefined

    // If floor plan is provided, get its dimensions
    if (newMapForm.floorPlanFile && newMapForm.floorPlanPreview) {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => {
          width = img.width
          height = img.height
          resolve(null)
        }
        img.onerror = reject
        img.src = newMapForm.floorPlanPreview!
      })
      imagePath = newMapForm.floorPlanPreview
    }

    // Create the new site map
    const newMap = siteMapStore.addSiteMap({
      name: newMapForm.name,
      description: newMapForm.description || undefined,
      imagePath,
      width,
      height,
      scale: 50, // Default scale: 50 pixels per meter
      cameras: [],
      walls: [],
    })

    // Select the newly created map
    selectMap(newMap.id)

    showSuccessToast(`Site map "${newMapForm.name}" created successfully!`)
    closeAddMapDialog()
  } catch (error) {
    console.error('Failed to create site map:', error)
    showErrorToast('Failed to create site map. Please try again.')
  }
}

const resizeCanvas = () => {
  console.log('[resizeCanvas] START')
  const canvasEl = mapCanvas.value
  if (!canvasEl || !currentMap.value) {
    console.log('[resizeCanvas] EARLY EXIT - missing elements')
    return
  }

  console.log('[resizeCanvas] Resizing to:', { width: currentMap.value.width, height: currentMap.value.height })
  canvas.resizeCanvas(currentMap.value.width, currentMap.value.height)
  console.log('[resizeCanvas] Calling drawMap()')
  drawMap()
}

watch([
  () => canvasOptions.showGrid,
  () => canvasOptions.showScaleReference,
  () => canvasOptions.showCameraLabels
], () => {
  canvas.requestRedraw(drawMap)
})

watch(currentMap, async (newMap) => {
  console.log('[watch currentMap] Map changed')
  if (newMap) {
    // Wait for DOM to update, then set zoom/position before drawing
    await nextTick()
    fitToView()
    resizeCanvas()
  }
})

onMounted(() => {
  if (!canvas.initCanvas()) return

  // Auto-select first site map if none is currently selected or valid
  if ((!selectedMapId.value || !currentMap.value) && siteMaps.value.length > 0) {
    selectMap(siteMaps.value[0].id)
  } else if (currentMap.value) {
    // Map is already selected, render it
    resizeCanvas()
    drawMap()
    setTimeout(fitToView, 100)
  }

  window.addEventListener('resize', () => {
    resizeCanvas()
    fitToView()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (activePeerConnection.value) {
    activePeerConnection.value.close()
  }
})
</script>
