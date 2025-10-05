<template>
  <div class="h-full w-full bg-background flex">
    <!-- Left Panel - Camera Configuration Form -->
    <div class="w-64 border-r bg-card p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">Site Map Editor</h2>
        <button
          @click="goToViewer"
          class="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          ← Viewer
        </button>
      </div>

      <!-- Site Map Details Form -->
      <div class="space-y-3 pb-4 border-b mb-4">
        <div>
          <label class="block text-[10px] font-medium mb-1">Site Map</label>
          <select
            v-model="selectedSiteMapId"
            @change="onSiteMapChange"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option v-for="map in siteMaps" :key="map.id" :value="map.id">
              {{ map.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-medium mb-1">Name</label>
          <input
            v-model="siteMapForm.name"
            type="text"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Site map name"
          />
        </div>

        <div>
          <label class="block text-[10px] font-medium mb-1">Description</label>
          <textarea
            v-model="siteMapForm.description"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background resize-none"
            rows="2"
            placeholder="Optional description"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-medium mb-1">Width (px)</label>
            <input
              v-model.number="siteMapForm.width"
              type="number"
              class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
              placeholder="Width"
            />
          </div>
          <div>
            <label class="block text-[10px] font-medium mb-1">Height (px)</label>
            <input
              v-model.number="siteMapForm.height"
              type="number"
              class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
              placeholder="Height"
            />
          </div>
        </div>

        <button
          @click="updateSiteMapDetails"
          class="w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Update Details
        </button>
      </div>

      <!-- Camera Configuration Form -->
      <div v-if="placement.selectedCameraId.value">
        <h3 class="text-sm font-semibold mb-3">Camera Configuration</h3>
        <CameraConfigForm
        :config="placement.cameraConfig.value"
        :camera-name="getCameraName(placement.selectedCameraId.value)"
        :is-updating="placement.isUpdating.value"
        :calculated-distance="placement.calculatedDistance.value"
        :validation-errors="validationErrors"
        :is-valid="isValid"
        :pixels-per-meter="PIXELS_PER_METER"
        @update="updateCameraConfig"
        @save="addCameraToMap"
        @remove="removeCameraFromMap"
        />
      </div>
    </div>

    <!-- Middle Panel - 2D Map Canvas -->
    <div class="flex-1 p-4 flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">
          {{ currentSiteMap?.name || 'Site Map' }}
        </h2>

        <MapControls
          :show-grid="canvasOptions.showGrid"
          :show-labels="canvasOptions.showCameraLabels"
          :show-history="true"
          :can-undo="history.canUndo.value"
          :can-redo="history.canRedo.value"
          :show-reset-view="true"
          :show-save="true"
          @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
          @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
          @undo="handleUndo"
          @redo="handleRedo"
          @reset-view="drawMap"
          @save="saveConfiguration"
        />
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden" ref="canvasContainer">
        <canvas
          ref="mapCanvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @click="handleCanvasClick"
          :class="interaction.dragState.value.isDragging ? 'cursor-grabbing' : 'cursor-crosshair'"
          :style="canvasStyle"
        ></canvas>

        <!-- Coordinates Display -->
        <div class="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm font-mono">
          Mouse: ({{ Math.round((interaction.mouseX.value - offsetX) / scale) }}, {{ Math.round((interaction.mouseY.value - offsetY) / scale) }})
        </div>

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
            Position: ({{ hoveredCamera.x }}, {{ hoveredCamera.y }})
          </div>
          <div class="text-[10px] text-gray-400">
            Click to edit • Drag to move
          </div>
        </div>

        <!-- Instructions -->
        <div v-if="!placement.selectedCameraId.value && placedCameras.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="bg-black/70 text-white px-6 py-4 rounded-lg text-center">
            <p class="font-semibold mb-2">Select a camera to place it on the map</p>
            <p class="text-sm text-gray-300">Click anywhere on the map to place the camera</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Available Cameras -->
    <div class="w-80 border-l bg-card p-4 overflow-y-auto">
      <h2 class="text-sm font-semibold mb-3">Available Cameras</h2>
      <div class="space-y-2">
        <button
          v-for="camera in availableCameras"
          :key="camera.id"
          @click="selectCamera(camera.id)"
          class="w-full text-left px-3 py-2 rounded-lg border transition-colors hover:bg-accent"
          :class="placement.selectedCameraId.value === camera.id ? 'bg-accent border-primary' : 'border-border'"
        >
          <div class="font-medium text-sm">{{ camera.name }}</div>
          <div class="text-xs text-muted-foreground mt-0.5">{{ camera.id }}</div>
          <div class="flex items-center gap-1 mt-1">
            <div
              class="h-1.5 w-1.5 rounded-full"
              :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-xs" :class="camera.status === 'online' ? 'text-green-600' : 'text-red-600'">
              {{ camera.status }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCameraStore } from '../stores/cameras'
import { useSiteMapStore, type CameraPlacement } from '../stores/siteMaps'
import { useSiteMapCanvas, type CanvasRenderOptions } from '../composables/useSiteMapCanvas'
import { useCameraPlacement } from '../composables/useCameraPlacement'
import { useCanvasInteraction } from '../composables/useCanvasInteraction'
import { useConfigHistory } from '../composables/useConfigHistory'
import { useToast } from '../composables/useToast'
import CameraConfigForm from '../components/features/site-map/CameraConfigForm.vue'
import MapControls from '../components/features/site-map/MapControls.vue'

const router = useRouter()
const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()
const toast = useToast()

const PIXELS_PER_METER = 50

// Data
const siteMaps = computed(() => siteMapStore.siteMaps)
const selectedSiteMapId = ref(siteMapStore.activeSiteMapId.value)
const currentSiteMap = computed(() => siteMaps.value.find(m => m.id === selectedSiteMapId.value))
const availableCameras = computed(() => cameraStore.cameras)
const placedCameras = ref<CameraPlacement[]>([])

// Site map form
const siteMapForm = reactive({
  name: '',
  description: '',
  width: 0,
  height: 0,
})

// Canvas
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: false,
  showCameraLabels: true,
  pixelsPerMeter: PIXELS_PER_METER
})

// Canvas scaling
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

// Composables
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const placement = useCameraPlacement(PIXELS_PER_METER)
const interaction = useCanvasInteraction(mapCanvas, canvas.findCameraAtPoint)
const history = useConfigHistory<CameraPlacement[]>()

// Validation
const validation = computed(() => placement.validateConfig())
const validationErrors = computed(() => validation.value.errors)
const isValid = computed(() => validation.value.isValid)

// Hovered camera
const hoveredCamera = computed(() => {
  if (interaction.dragState.value.isDragging) return null
  return canvas.findCameraAtPoint(
    interaction.mouseX.value,
    interaction.mouseY.value,
    placedCameras.value
  )
})

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault()
      handleUndo()
    } else if (e.key === 'y') {
      e.preventDefault()
      handleRedo()
    } else if (e.key === 's') {
      e.preventDefault()
      saveConfiguration()
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (placement.selectedCameraId.value && placement.isUpdating.value) {
      e.preventDefault()
      removeCameraFromMap()
    }
  } else if (e.key === 'Escape') {
    placement.resetConfig()
    drawMap()
  } else if (e.key === 'g') {
    canvasOptions.showGrid = !canvasOptions.showGrid
  } else if (e.key === 'l') {
    canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels
  }
}

// Camera functions
const getCameraName = (cameraId: string): string => {
  const camera = availableCameras.value.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const getCameraStatus = (cameraId: string): string => {
  const camera = availableCameras.value.find(c => c.id === cameraId)
  return camera?.status || 'offline'
}

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

const selectCamera = (cameraId: string) => {
  const placed = placedCameras.value.find(p => p.cameraId === cameraId)

  if (placed) {
    placement.loadPlacedCamera(placed)
  } else {
    placement.resetConfig()
    placement.selectedCameraId.value = cameraId
  }

  drawMap()
}

const updateCameraConfig = (field: string, value: any) => {
  (placement.cameraConfig.value as any)[field] = value
  canvas.requestRedraw(drawMap)
}

const addCameraToMap = () => {
  if (!placement.selectedCameraId.value || !isValid.value) return

  const newPlacement = placement.createPlacement()

  if (placement.isUpdating.value && placement.selectedPlacedCamera.value) {
    const index = placedCameras.value.findIndex(
      p => p.cameraId === placement.selectedPlacedCamera.value?.cameraId
    )
    if (index !== -1) {
      placedCameras.value[index] = newPlacement
    }
  } else {
    placedCameras.value = placedCameras.value.filter(
      p => p.cameraId !== placement.selectedCameraId.value
    )
    placedCameras.value.push(newPlacement)
  }

  // Add to history
  history.addToHistory([...placedCameras.value])

  // Switch to edit mode
  placement.loadPlacedCamera(newPlacement)

  toast.success('Camera placed successfully')
  drawMap()
}

const removeCameraFromMap = () => {
  if (placement.selectedPlacedCamera.value) {
    placedCameras.value = placedCameras.value.filter(
      p => p.cameraId !== placement.selectedPlacedCamera.value?.cameraId
    )

    history.addToHistory([...placedCameras.value])

    placement.resetConfig()
    toast.success('Camera removed from map')
    drawMap()
  }
}

const handleUndo = () => {
  const state = history.undo()
  if (state) {
    placedCameras.value = state
    placement.resetConfig()
    toast.success('Undo successful')
    drawMap()
  }
}

const handleRedo = () => {
  const state = history.redo()
  if (state) {
    placedCameras.value = state
    placement.resetConfig()
    toast.success('Redo successful')
    drawMap()
  }
}

// Canvas interaction handlers
const handleMouseDown = (event: MouseEvent) => {
  // Convert to canvas coordinates
  const coords = interaction.getCanvasCoordinates(event)
  const canvasX = (coords.x - offsetX.value) / scale.value
  const canvasY = (coords.y - offsetY.value) / scale.value

  const camera = canvas.findCameraAtPoint(canvasX, canvasY, placedCameras.value)
  if (camera) {
    interaction.startDrag(camera, coords.x, coords.y)
    placement.loadPlacedCamera(camera)
    canvas.requestRedraw(drawMap)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  interaction.onMouseMove(event)

  // Convert screen coordinates to canvas coordinates accounting for scale
  const screenX = interaction.mouseX.value
  const screenY = interaction.mouseY.value
  const canvasX = (screenX - offsetX.value) / scale.value
  const canvasY = (screenY - offsetY.value) / scale.value

  // Update hovered camera using canvas coordinates
  const hovered = canvas.findCameraAtPoint(
    canvasX,
    canvasY,
    placedCameras.value
  )
  canvas.hoveredCameraId.value = hovered?.cameraId || null

  // Handle dragging
  if (interaction.dragState.value.isDragging && placement.selectedCameraId.value) {
    const newPos = interaction.onDragMove(event)
    if (newPos) {
      const adjustedX = (newPos.x - offsetX.value) / scale.value
      const adjustedY = (newPos.y - offsetY.value) / scale.value
      placement.updatePosition(adjustedX, adjustedY)
    }
  }

  // Handle preview (new placement mode)
  if (placement.selectedCameraId.value && !placement.isUpdating.value) {
    placement.updatePosition(canvasX, canvasY)
  }

  canvas.requestRedraw(drawMap)
}

const handleMouseUp = () => {
  const { wasDragging } = interaction.onMouseUp()

  if (wasDragging && placement.selectedCameraId.value && placement.isUpdating.value) {
    // Update the placed camera position
    addCameraToMap()
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  // Only place on click if in new placement mode (not updating/editing)
  if (placement.selectedCameraId.value && !placement.isUpdating.value) {
    const coords = interaction.getCanvasCoordinates(event)
    const canvasX = (coords.x - offsetX.value) / scale.value
    const canvasY = (coords.y - offsetY.value) / scale.value
    placement.updatePosition(canvasX, canvasY)
    addCameraToMap()
  }
}

// Drawing
const drawMap = () => {
  if (!currentSiteMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawWalls(currentSiteMap.value.walls)

  // Draw all placed cameras except the one being edited
  placedCameras.value.forEach(camera => {
    if (placement.isUpdating.value && placement.selectedPlacedCamera.value?.cameraId === camera.cameraId) {
      return
    }
    const isSelected = false
    canvas.drawCamera(camera, getCameraName, isSelected, false, currentSiteMap.value.walls)
  })

  // Draw preview or editing camera
  if (placement.selectedCameraId.value) {
    const preview = placement.createPlacement()
    const isPreview = !placement.isUpdating.value
    canvas.drawCamera(preview, getCameraName, true, isPreview, currentSiteMap.value.walls)
  }
}

// Site map management
const onSiteMapChange = () => {
  siteMapStore.setActiveSiteMap(selectedSiteMapId.value)
  loadSiteMapCameras()
}

const loadSiteMapCameras = () => {
  if (currentSiteMap.value) {
    placedCameras.value = [...currentSiteMap.value.cameras]
    placement.resetConfig()
    history.initialize([...placedCameras.value])

    // Update form with current site map details
    siteMapForm.name = currentSiteMap.value.name
    siteMapForm.description = currentSiteMap.value.description || ''
    siteMapForm.width = currentSiteMap.value.width
    siteMapForm.height = currentSiteMap.value.height

    resizeCanvas()
    setTimeout(fitToView, 100)
  }
}

const updateSiteMapDetails = () => {
  if (currentSiteMap.value) {
    siteMapStore.updateSiteMap(currentSiteMap.value.id, {
      name: siteMapForm.name,
      description: siteMapForm.description,
      width: siteMapForm.width,
      height: siteMapForm.height,
    })
    toast.success('Site map details updated!')
    resizeCanvas()
    setTimeout(fitToView, 100)
  }
}

const saveConfiguration = () => {
  if (currentSiteMap.value) {
    siteMapStore.updateSiteMap(currentSiteMap.value.id, {
      cameras: placedCameras.value
    })
    toast.success('Configuration saved successfully!')
  }
}

const goToViewer = () => {
  router.push('/site-config')
}

const fitToView = () => {
  const canvasEl = mapCanvas.value
  const container = canvasContainer.value
  if (!canvasEl || !container || !currentSiteMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = currentSiteMap.value.width
  const mapHeight = currentSiteMap.value.height

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2
}

const resizeCanvas = () => {
  const canvasEl = mapCanvas.value
  if (!canvasEl || !currentSiteMap.value) return

  canvas.resizeCanvas(currentSiteMap.value.width, currentSiteMap.value.height)
  drawMap()
}

// Watchers
watch([
  () => canvasOptions.showGrid,
  () => canvasOptions.showCameraLabels
], () => {
  canvas.requestRedraw(drawMap)
})

// Lifecycle
onMounted(() => {
  if (!canvas.initCanvas()) return

  loadSiteMapCameras()

  window.addEventListener('resize', () => {
    resizeCanvas()
    fitToView()
  })
  window.addEventListener('keydown', handleKeyDown)

  drawMap()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
