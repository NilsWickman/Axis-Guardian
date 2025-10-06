<template>
  <div class="h-full w-full bg-background flex">
    <!-- Left Panel - Camera Configuration Form -->
    <div class="w-64 border-r bg-card overflow-y-auto flex flex-col">
      <div class="p-4 border-b flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold">Site Map Editor</h2>
          <p class="text-xs text-muted-foreground mt-1">Configure cameras and walls</p>
        </div>
        <!-- Back Button -->
        <button
          @click="goToViewer"
          type="button"
          class="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          title="Back to Viewer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
        </button>
      </div>

      <!-- Map Controls -->
      <div class="p-3 border-b">
        <MapControls
          :show-grid="canvasOptions.showGrid"
          :show-labels="canvasOptions.showCameraLabels"
          :show-save="hasUnsavedChanges"
          @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid; interaction.snapToGrid.value = canvasOptions.showGrid; wallEditor.setSnapOptions({ snapToGrid: canvasOptions.showGrid }); drawMap()"
          @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
          @save="saveConfiguration"
        />
      </div>

      <!-- Site Map Details Form -->
      <div class="p-4">
        <div class="space-y-3 pb-4 border-b mb-4">

        <div>
          <label class="block text-[10px] font-medium mb-1">Name</label>
          <input
            v-model="siteMapForm.name"
            type="text"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Site map name"
            @input="markAsChanged"
          />
        </div>

        <div>
          <label class="block text-[10px] font-medium mb-1">Description</label>
          <textarea
            v-model="siteMapForm.description"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background resize-none"
            rows="2"
            placeholder="Optional description"
            @input="markAsChanged"
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
              @input="markAsChanged"
            />
          </div>
          <div>
            <label class="block text-[10px] font-medium mb-1">Height (px)</label>
            <input
              v-model.number="siteMapForm.height"
              type="number"
              class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
              placeholder="Height"
              @input="markAsChanged"
            />
          </div>
        </div>

        <!-- Background Image Upload -->
        <div>
          <label class="block text-[10px] font-medium mb-1">Background Image</label>
          <input
            type="file"
            accept="image/*"
            @change="handleBackgroundImageUpload"
            class="w-full px-2 py-1.5 text-xs border rounded-lg bg-background file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground"
          />
        </div>
      </div>

      <!-- Bulk Edit Panel -->
      <BulkEditPanel
        v-if="cameraSelection.hasSelection() && !placement.selectedCameraId.value"
        :selected-count="cameraSelection.getSelectedCount()"
        @apply-field="handleBulkApplyField"
        @apply-all="handleBulkApplyAll"
        @delete-selected="handleDeleteSelected"
        @clear-selection="cameraSelection.clearSelection(); drawMap()"
      />

      <!-- Camera Configuration Form -->
      <div v-if="placement.selectedCameraId.value && !wallEditor.isActive.value && !cameraSelection.hasSelection()">
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

    </div>

    <!-- Middle Panel - 2D Map Canvas -->
    <div class="flex-1 p-4 flex flex-col">
      <!-- Canvas Container -->
      <div class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden" ref="canvasContainer">
        <canvas
          ref="mapCanvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @click="handleCanvasClick"
          @wheel="handleWheel"
          :class="getCanvasCursor()"
          :style="canvasStyle"
        ></canvas>

        <!-- Wall Toolbar -->
        <WallToolbar
          :is-active="wallEditor.isActive.value"
          :mode="wallEditor.mode.value"
          :wall-type="wallEditor.drawState.value.wallType"
          :selected-wall="wallEditor.selectedWall.value"
          :show-grid="canvasOptions.showGrid"
          :can-undo="history.canUndo.value"
          :can-redo="history.canRedo.value"
          @set-mode="(mode) => { wallEditor.setMode(mode); drawMap() }"
          @set-wall-type="(type) => { wallEditor.setWallType(type); drawMap() }"
          @delete-wall="handleDeleteWall"
          @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid; interaction.snapToGrid.value = canvasOptions.showGrid; wallEditor.setSnapOptions({ snapToGrid: canvasOptions.showGrid }); drawMap()"
          @undo="handleUndo"
          @redo="handleRedo"
          @zoom-in="interaction.handleZoom(1, (canvasContainer?.clientWidth || 0) / 2, (canvasContainer?.clientHeight || 0) / 2); drawMap()"
          @zoom-out="interaction.handleZoom(-1, (canvasContainer?.clientWidth || 0) / 2, (canvasContainer?.clientHeight || 0) / 2); drawMap()"
          @reset-view="fitToView(); drawMap()"
        />

        <!-- Coordinates Display -->
        <div class="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm font-mono">
          <div>Mouse: ({{ Math.round(interaction.mouseX.value / interaction.scale.value) }}, {{ Math.round(interaction.mouseY.value / interaction.scale.value) }}) px</div>
          <div class="text-[10px] text-gray-300">
            {{ (interaction.mouseX.value / interaction.scale.value / PIXELS_PER_METER).toFixed(2) }}m,
            {{ (interaction.mouseY.value / interaction.scale.value / PIXELS_PER_METER).toFixed(2) }}m
          </div>
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
          class="w-full text-left px-3 py-2 rounded-lg border transition-colors hover:bg-accent relative"
          :class="placement.selectedCameraId.value === camera.id ? 'bg-accent border-primary' : 'border-border'"
        >
          <div class="font-medium text-sm flex items-center gap-2">
            {{ camera.name }}
            <span
              v-if="cameraWarnings.has(camera.id)"
              class="text-yellow-500"
              :title="cameraWarnings.get(camera.id)?.map(w => w.message).join('\n')"
            >
              ⚠️
            </span>
          </div>
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
          <!-- Show warnings if any -->
          <div v-if="cameraWarnings.has(camera.id)" class="mt-1 space-y-0.5">
            <div
              v-for="(warning, idx) in cameraWarnings.get(camera.id)"
              :key="idx"
              class="text-[10px] text-yellow-600 flex items-start gap-1"
            >
              <span>•</span>
              <span>{{ warning.message }}</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useCameraStore } from '../stores/cameras'
import { useSiteMapStore, type CameraPlacement, type Wall } from '../stores/siteMaps'

interface Props {
  mapId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  back: []
}>()
import { useSiteMapCanvas, type CanvasRenderOptions } from '../composables/useSiteMapCanvas'
import { useCameraPlacement } from '../composables/useCameraPlacement'
import { useCanvasInteraction } from '../composables/useCanvasInteraction'
import { useConfigHistory } from '../composables/useConfigHistory'
import { useToast } from '../composables/useToast'
import { useWallEditor } from '../composables/useWallEditor'
import { useCameraSelection } from '../composables/useCameraSelection'
import { useCameraValidation } from '../composables/useCameraValidation'
import CameraConfigForm from '../components/features/site-map/CameraConfigForm.vue'
import MapControls from '../components/features/site-map/MapControls.vue'
import WallToolbar from '../components/features/site-map/WallToolbar.vue'
import BulkEditPanel from '../components/features/site-map/BulkEditPanel.vue'

const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()
const toast = useToast()

const PIXELS_PER_METER = 50

// Data
const siteMaps = computed(() => siteMapStore.siteMaps)
// Use prop mapId
const selectedSiteMapId = ref(props.mapId)
const currentSiteMap = computed(() => siteMaps.value.find(m => m.id === selectedSiteMapId.value))
const availableCameras = computed(() => cameraStore.cameras)
const placedCameras = ref<CameraPlacement[]>([])
const hasUnsavedChanges = ref(false)

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

const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${interaction.offsetX.value}px`,
  top: `${interaction.offsetY.value}px`,
  transform: `scale(${interaction.scale.value})`,
  transformOrigin: 'top left',
}))

// Composables
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const placement = useCameraPlacement(PIXELS_PER_METER)
const interaction = useCanvasInteraction(mapCanvas, canvas.findCameraAtPoint)
const history = useConfigHistory<CameraPlacement[]>()
const wallEditor = useWallEditor()
const cameraSelection = useCameraSelection()
const cameraValidation = useCameraValidation()

// Set grid size from pixels per meter
interaction.gridSize.value = PIXELS_PER_METER
wallEditor.setSnapOptions({ gridSize: PIXELS_PER_METER })

// Camera warnings
const cameraWarnings = computed(() => {
  if (!currentSiteMap.value) return new Map()

  const warnings = new Map<string, ReturnType<typeof cameraValidation.validateCamera>>()
  placedCameras.value.forEach(camera => {
    const cameraWarnings = cameraValidation.validateCamera(camera, currentSiteMap.value.walls)
    if (cameraWarnings.length > 0) {
      warnings.set(camera.cameraId, cameraWarnings)
    }
  })
  return warnings
})

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

// Get cursor style based on current state
const getCanvasCursor = () => {
  if (interaction.panState.value.isPanning) return 'cursor-grabbing'
  if (interaction.dragState.value.isDragging) return 'cursor-move'

  if (wallEditor.isActive.value && wallEditor.mode.value === 'edit') {
    const hoveredPart = wallEditor.hoverState.value.hoveredPart
    if (hoveredPart === 'start' || hoveredPart === 'end') {
      return 'cursor-move' // Show move cursor for endpoints
    } else if (hoveredPart === 'body') {
      return 'cursor-pointer' // Show pointer for wall body
    }
  }

  if (wallEditor.isActive.value) return 'cursor-crosshair'

  return 'cursor-default'
}

// Mark as changed
const markAsChanged = () => {
  hasUnsavedChanges.value = true
}

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
    } else if (e.key === 'c') {
      // Copy camera config
      if (placement.selectedCameraId.value && placement.isUpdating.value) {
        e.preventDefault()
        const camera = placedCameras.value.find(c => c.cameraId === placement.selectedCameraId.value)
        if (camera) {
          cameraSelection.copyCameraConfig(camera)
          toast.success('Camera configuration copied')
        }
      }
    } else if (e.key === 'v') {
      // Paste camera config
      if (placement.selectedCameraId.value && placement.isUpdating.value && cameraSelection.hasCopiedConfig()) {
        e.preventDefault()
        const camera = placedCameras.value.find(c => c.cameraId === placement.selectedCameraId.value)
        if (camera) {
          const updated = cameraSelection.pasteCameraConfig(camera)
          placement.loadPlacedCamera(updated)
          toast.success('Camera configuration pasted')
          drawMap()
        }
      }
    } else if (e.key === 'a') {
      // Select all cameras
      e.preventDefault()
      cameraSelection.selectAll(placedCameras.value.map(c => c.cameraId))
      toast.success(`Selected ${placedCameras.value.length} cameras`)
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (cameraSelection.hasSelection()) {
      e.preventDefault()
      handleDeleteSelected()
    } else if (placement.selectedCameraId.value && placement.isUpdating.value) {
      e.preventDefault()
      removeCameraFromMap()
    } else if (wallEditor.selectedWall.value) {
      e.preventDefault()
      handleDeleteWall()
    }
  } else if (e.key === 'Escape') {
    if (wallEditor.isActive.value) {
      wallEditor.setMode('none')
    } else {
      cameraSelection.clearSelection()
      placement.resetConfig()
    }
    drawMap()
  } else if (e.key === 'g') {
    canvasOptions.showGrid = !canvasOptions.showGrid
  } else if (e.key === 'l') {
    canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels
  } else if (e.key === 's') {
    interaction.toggleSnapToGrid()
    toast.success(`Snap to grid ${interaction.snapToGrid.value ? 'enabled' : 'disabled'}`)
  } else if (e.key === 'w') {
    // Toggle wall editor
    if (wallEditor.isActive.value) {
      wallEditor.setMode('none')
    } else {
      wallEditor.setMode('draw')
    }
    drawMap()
  } else if (e.key === 'd' && wallEditor.isActive.value) {
    // Draw mode (only when wall editor is active)
    wallEditor.setMode('draw')
    drawMap()
  } else if (e.key === 'e' && wallEditor.isActive.value) {
    // Edit mode (only when wall editor is active)
    wallEditor.setMode('edit')
    drawMap()
  } else if (e.key === 'x' && wallEditor.isActive.value) {
    // Delete mode (only when wall editor is active)
    wallEditor.setMode('delete')
    drawMap()
  } else if (e.key === '1' && wallEditor.isActive.value) {
    // Internal wall type
    wallEditor.setWallType('internal')
  } else if (e.key === '2' && wallEditor.isActive.value) {
    // External wall type
    wallEditor.setWallType('external')
  } else if (e.key === '3' && wallEditor.isActive.value) {
    // Door wall type
    wallEditor.setWallType('door')
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

  markAsChanged()
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
    markAsChanged()
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

// Wall editor handlers
const handleActivateWallEditor = () => {
  console.log('Activating wall editor')
  wallEditor.setMode('draw')
  console.log('Wall editor mode set to:', wallEditor.mode.value, 'isActive:', wallEditor.isActive.value)
  drawMap()
}

const handleDeleteWall = () => {
  if (!currentSiteMap.value || !wallEditor.selectedWall.value) return

  siteMapStore.updateSiteMap(currentSiteMap.value.id, {
    walls: currentSiteMap.value.walls.filter(w => w.id !== wallEditor.selectedWall.value?.id)
  })
  wallEditor.selectWall(null)
  markAsChanged()
  toast.success('Wall deleted')
  drawMap()
}

// Camera selection handlers
const handleDeleteSelected = () => {
  if (!cameraSelection.hasSelection()) return

  const selectedIds = cameraSelection.getSelectedIds()
  placedCameras.value = placedCameras.value.filter(c => !selectedIds.includes(c.cameraId))

  history.addToHistory([...placedCameras.value])
  cameraSelection.clearSelection()

  toast.success(`Deleted ${selectedIds.length} camera(s)`)
  drawMap()
}

const handleBulkApplyField = (field: string, value: any) => {
  if (!cameraSelection.hasSelection()) return

  const selectedIds = cameraSelection.getSelectedIds()
  placedCameras.value = placedCameras.value.map(camera => {
    if (selectedIds.includes(camera.cameraId)) {
      return { ...camera, [field]: value }
    }
    return camera
  })

  history.addToHistory([...placedCameras.value])
  toast.success(`Updated ${field} for ${selectedIds.length} camera(s)`)
  drawMap()
}

const handleBulkApplyAll = (config: any) => {
  if (!cameraSelection.hasSelection()) return

  const selectedIds = cameraSelection.getSelectedIds()
  placedCameras.value = placedCameras.value.map(camera => {
    if (selectedIds.includes(camera.cameraId)) {
      return { ...camera, ...config }
    }
    return camera
  })

  history.addToHistory([...placedCameras.value])
  toast.success(`Updated ${selectedIds.length} camera(s)`)
  drawMap()
}

// Canvas interaction handlers
const handleMouseDown = (event: MouseEvent) => {
  const coords = interaction.getCanvasCoordinates(event)
  // getCanvasCoordinates already accounts for canvas position, just need to account for scale
  const canvasX = coords.x / interaction.scale.value
  const canvasY = coords.y / interaction.scale.value

  console.log('MouseDown - Wall editor active:', wallEditor.isActive.value, 'Mode:', wallEditor.mode.value, 'Coords:', canvasX, canvasY)

  // Wall editor mode - but allow camera interaction in edit mode
  if (wallEditor.isActive.value) {
    console.log('Wall editor is active, handling wall interaction')
    if (wallEditor.mode.value === 'draw') {
      const walls = currentSiteMap.value?.walls || []
      const snapped = wallEditor.snapPoint(canvasX, canvasY, walls)
      console.log('Starting to draw wall at', snapped.x, snapped.y)
      wallEditor.startDrawing(snapped.x, snapped.y)
      return
    } else if (wallEditor.mode.value === 'delete') {
      if (!currentSiteMap.value) return
      const wall = wallEditor.findWallAtPoint(canvasX, canvasY, currentSiteMap.value.walls)
      if (wall) {
        siteMapStore.updateSiteMap(currentSiteMap.value.id, {
          walls: currentSiteMap.value.walls.filter(w => w.id !== wall.id)
        })
        markAsChanged()
        toast.success('Wall deleted')
        drawMap()
      }
      return
    } else if (wallEditor.mode.value === 'edit') {
      // In edit mode, first check for walls, then allow camera interaction
      if (!currentSiteMap.value) return
      const wall = wallEditor.findWallAtPoint(canvasX, canvasY, currentSiteMap.value.walls)
      if (wall) {
        // Edit mode - check if clicking on an endpoint
        const endpoint = wallEditor.findEndpointAtPoint(canvasX, canvasY, wall)
        if (endpoint) {
          wallEditor.startDraggingEndpoint(wall, endpoint)
        } else {
          wallEditor.selectWall(wall)
        }
        drawMap()
        return
      }
      // If no wall was clicked, fall through to allow camera interaction
    }
  }

  // Pan mode with Space or middle mouse button
  if (event.button === 1 || event.shiftKey) {
    interaction.startPan(event.clientX, event.clientY)
    return
  }

  // Camera interaction
  const camera = canvas.findCameraAtPoint(canvasX, canvasY, placedCameras.value)
  if (camera) {
    // Multi-select with Ctrl/Cmd
    if (event.ctrlKey || event.metaKey) {
      cameraSelection.toggleSelection(camera.cameraId, true)
    } else {
      cameraSelection.clearSelection()
      interaction.startDrag(camera, coords.x, coords.y)
      placement.loadPlacedCamera(camera)
    }
    canvas.requestRedraw(drawMap)
  } else {
    // Deselect if clicking on empty space
    if (!event.ctrlKey && !event.metaKey) {
      cameraSelection.clearSelection()
      canvas.requestRedraw(drawMap)
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  interaction.onMouseMove(event)

  const screenX = interaction.mouseX.value
  const screenY = interaction.mouseY.value
  // mouseX/mouseY are already relative to canvas, just need to account for scale
  const canvasX = screenX / interaction.scale.value
  const canvasY = screenY / interaction.scale.value

  // Handle panning
  if (interaction.panState.value.isPanning) {
    interaction.updatePan(event.clientX, event.clientY)
    canvas.requestRedraw(drawMap)
    return
  }

  // Handle wall drawing
  if (wallEditor.drawState.value.isDrawing) {
    const walls = currentSiteMap.value?.walls || []
    const snapped = wallEditor.snapPoint(canvasX, canvasY, walls)
    console.log('Updating wall drawing position to', snapped.x, snapped.y)
    wallEditor.updateDrawing(snapped.x, snapped.y)
    canvas.requestRedraw(drawMap)
    return
  }

  // Handle wall endpoint dragging
  if (wallEditor.dragState.value.isDragging) {
    const walls = currentSiteMap.value?.walls || []
    const updatedWall = wallEditor.updateDraggingEndpoint(canvasX, canvasY, walls)
    if (updatedWall) {
      wallEditor.dragState.value.draggedWall = updatedWall
      canvas.requestRedraw(drawMap)
    }
    return
  }

  // Update wall hover state when in edit mode
  if (wallEditor.isActive.value && wallEditor.mode.value === 'edit' && currentSiteMap.value) {
    wallEditor.updateHoverState(canvasX, canvasY, currentSiteMap.value.walls, true)
  } else {
    wallEditor.clearHoverState()
  }

  // Update hovered camera
  const hovered = canvas.findCameraAtPoint(canvasX, canvasY, placedCameras.value)
  canvas.hoveredCameraId.value = hovered?.cameraId || null

  // Handle dragging
  if (interaction.dragState.value.isDragging && placement.selectedCameraId.value) {
    const newPos = interaction.onDragMove(event)
    if (newPos) {
      let adjustedX = (newPos.x - interaction.offsetX.value) / interaction.scale.value
      let adjustedY = (newPos.y - interaction.offsetY.value) / interaction.scale.value

      // Apply snap to grid
      if (interaction.snapToGrid.value) {
        const snapped = interaction.snapToGridPoint(adjustedX, adjustedY)
        adjustedX = snapped.x
        adjustedY = snapped.y
      }

      placement.updatePosition(adjustedX, adjustedY)
    }
  }

  // Handle preview (new placement mode)
  if (placement.selectedCameraId.value && !placement.isUpdating.value) {
    let previewX = canvasX
    let previewY = canvasY

    // Apply snap to grid
    if (interaction.snapToGrid.value) {
      const snapped = interaction.snapToGridPoint(canvasX, canvasY)
      previewX = snapped.x
      previewY = snapped.y
    }

    placement.updatePosition(previewX, previewY)
  }

  canvas.requestRedraw(drawMap)
}

const handleMouseUp = () => {
  // End panning
  if (interaction.panState.value.isPanning) {
    interaction.endPan()
    return
  }

  // Finish wall drawing
  if (wallEditor.drawState.value.isDrawing) {
    console.log('Finishing wall drawing')
    const newWall = wallEditor.finishDrawing()
    console.log('New wall created:', newWall)
    if (newWall && currentSiteMap.value) {
      console.log('Adding wall to site map')
      siteMapStore.updateSiteMap(currentSiteMap.value.id, {
        walls: [...currentSiteMap.value.walls, newWall]
      })
      markAsChanged()
      toast.success('Wall added')
      drawMap()
    }
    return
  }

  // Finish wall endpoint dragging
  if (wallEditor.dragState.value.isDragging) {
    const draggedWall = wallEditor.finishDraggingEndpoint()
    if (draggedWall && currentSiteMap.value) {
      const updatedWalls = currentSiteMap.value.walls.map(w =>
        w.id === draggedWall.id ? draggedWall : w
      )
      siteMapStore.updateSiteMap(currentSiteMap.value.id, {
        walls: updatedWalls
      })
      markAsChanged()
      toast.success('Wall endpoint updated')
      drawMap()
    }
    return
  }

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
    let canvasX = coords.x / interaction.scale.value
    let canvasY = coords.y / interaction.scale.value

    // Apply snap to grid
    if (interaction.snapToGrid.value) {
      const snapped = interaction.snapToGridPoint(canvasX, canvasY)
      canvasX = snapped.x
      canvasY = snapped.y
    }

    placement.updatePosition(canvasX, canvasY)
    addCameraToMap()
  }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const mouseX = event.clientX - (canvasContainer.value?.getBoundingClientRect().left || 0)
  const mouseY = event.clientY - (canvasContainer.value?.getBoundingClientRect().top || 0)

  interaction.handleZoom(event.deltaY > 0 ? -1 : 1, mouseX, mouseY)
  canvas.requestRedraw(drawMap)
}

// Drawing
const drawMap = () => {
  if (!currentSiteMap.value) return

  canvas.clearCanvas()

  // Draw background image if loaded
  canvas.drawBackgroundImage()

  canvas.drawGrid()
  canvas.drawScaleReference()

  // Draw walls with selection, but use the dragged wall if dragging
  const wallsToDraw = wallEditor.dragState.value.isDragging && wallEditor.dragState.value.draggedWall
    ? currentSiteMap.value.walls.map(w =>
        w.id === wallEditor.dragState.value.draggedWall?.id ? wallEditor.dragState.value.draggedWall : w
      )
    : currentSiteMap.value.walls
  canvas.drawWalls(
    wallsToDraw,
    wallEditor.selectedWall.value?.id,
    wallEditor.hoverState.value.hoveredWall?.id,
    wallEditor.hoverState.value.hoveredPart
  )

  // Draw wall preview if drawing
  if (wallEditor.drawState.value.isDrawing && wallEditor.drawState.value.startPoint && wallEditor.drawState.value.currentPoint) {
    console.log('Drawing wall preview from', wallEditor.drawState.value.startPoint, 'to', wallEditor.drawState.value.currentPoint)
    canvas.drawPreviewWall(
      wallEditor.drawState.value.startPoint,
      wallEditor.drawState.value.currentPoint,
      wallEditor.drawState.value.wallType,
      wallEditor.drawState.value.thickness
    )
    // Draw measurements for wall being drawn
    canvas.drawWallMeasurements(
      wallEditor.drawState.value.startPoint,
      wallEditor.drawState.value.currentPoint,
      PIXELS_PER_METER
    )
  }

  // Draw measurements when dragging wall endpoint
  if (wallEditor.dragState.value.isDragging && wallEditor.dragState.value.draggedWall) {
    const wall = wallEditor.dragState.value.draggedWall
    canvas.drawWallMeasurements(wall.start, wall.end, PIXELS_PER_METER)
  }

  // Draw all placed cameras except the one being edited
  placedCameras.value.forEach(camera => {
    if (placement.isUpdating.value && placement.selectedPlacedCamera.value?.cameraId === camera.cameraId) {
      return
    }
    const isSelected = cameraSelection.isSelected(camera.cameraId)
    canvas.drawCamera(camera, getCameraName, isSelected, false, currentSiteMap.value.walls)
  })

  // Draw preview or editing camera (allow in edit mode)
  if (placement.selectedCameraId.value && (!wallEditor.isActive.value || wallEditor.mode.value === 'edit')) {
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
    setTimeout(() => {
      fitToView()
      drawMap()
    }, 100)
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
      cameras: placedCameras.value,
      name: siteMapForm.name,
      description: siteMapForm.description,
      width: siteMapForm.width,
      height: siteMapForm.height,
    })
    hasUnsavedChanges.value = false
    toast.success('Configuration saved successfully!')
  }
}

const goToViewer = () => {
  emit('back')
}

const fitToView = () => {
  const canvasEl = mapCanvas.value
  const container = canvasContainer.value
  if (!canvasEl || !container || !currentSiteMap.value) return

  interaction.resetView(
    currentSiteMap.value.width,
    currentSiteMap.value.height,
    container.clientWidth,
    container.clientHeight
  )
}

const handleDeleteSiteMap = () => {
  if (!currentSiteMap.value) return

  if (confirm(`Are you sure you want to delete "${currentSiteMap.value.name}"? This cannot be undone.`)) {
    siteMapStore.deleteSiteMap(currentSiteMap.value.id)
    toast.success('Site map deleted')
    // Go back to viewer
    emit('back')
  }
}

const handleBackgroundImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    const imagePath = e.target?.result as string
    if (!currentSiteMap.value) return

    try {
      await canvas.loadBackgroundImage(imagePath)
      siteMapStore.updateSiteMap(currentSiteMap.value.id, {
        imagePath
      })
      toast.success('Background image uploaded')
      drawMap()
    } catch (error) {
      toast.error('Failed to load background image')
    }
  }

  reader.readAsDataURL(file)
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

// Watch for mapId changes
watch(() => props.mapId, (newMapId) => {
  selectedSiteMapId.value = newMapId
  loadSiteMapCameras()
})

// Lifecycle
onMounted(async () => {
  if (!canvas.initCanvas()) return

  // Set the active site map in the store
  if (selectedSiteMapId.value) {
    siteMapStore.setActiveSiteMap(selectedSiteMapId.value)
  }

  // Load background image if exists
  if (currentSiteMap.value?.imagePath) {
    try {
      await canvas.loadBackgroundImage(currentSiteMap.value.imagePath)
    } catch (error) {
      console.error('Failed to load background image:', error)
    }
  }

  loadSiteMapCameras()

  window.addEventListener('resize', () => {
    resizeCanvas()
    fitToView()
  })
  window.addEventListener('keydown', handleKeyDown)

  // Activate wall editor by default
  wallEditor.setMode('draw')
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
