<template>
  <div class="h-full w-full bg-background flex">
    <!-- Left Panel - Changes based on mode -->
    <!-- Viewer Mode: Site Map Selector -->
    <SiteMapSelector
      v-if="!isEditingMode"
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

    <!-- Editor Mode: Site Map Details Form -->
    <div v-else class="w-64 border-r bg-card overflow-y-auto flex flex-col">
      <div class="p-4 border-b flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-foreground mb-2">Site Map Editor</h2>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Cameras:</span>
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                {{ localCameras.length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Walls:</span>
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                {{ localWalls.length }}
              </span>
            </div>
          </div>
        </div>
        <!-- Back Button -->
        <button
          @click="exitEditMode"
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
          @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
          @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
          @save="saveConfiguration"
        />
      </div>

      <!-- Site Map Details Form -->
      <div class="p-4">
        <div class="space-y-3">
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
        </div>
      </div>
    </div>

    <!-- Main Content - Site Map Display -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Map Canvas Area -->
      <div class="flex-1 p-4 flex flex-col">
        <!-- Canvas Container -->
        <div
          class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden"
          ref="canvasContainer"
          @dragover="onCanvasDragOver"
          @drop="onCanvasDrop"
        >
          <canvas
            ref="mapCanvas"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            @wheel="handleWheel"
            @click="onCameraClick"
            :class="canvasCursorClass"
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

          <!-- Wall Toolbar (Editor Mode Only) -->
          <WallToolbar
            v-if="isEditingMode"
            :is-active="wallEditor.isActive.value"
            :mode="wallEditor.mode.value"
            :wall-type="wallEditor.drawState.value.wallType"
            :selected-wall="wallEditor.selectedWall.value"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @set-mode="wallEditor.setMode($event)"
            @set-wall-type="wallEditor.setWallType($event)"
            @undo="undo"
            @redo="redo"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
          />

          <!-- Camera Configuration Popup -->
          <CameraConfigPopup
            :visible="showConfigPopup"
            :position="configPopupPosition"
            :camera-name="pendingCameraPlacement ? getCameraName(pendingCameraPlacement.camera.id) : ''"
            :config="cameraConfigDefaults"
            @confirm="handleCameraConfigConfirm"
            @cancel="handleCameraConfigCancel"
          />
        </div>
      </div>

      <!-- Right Panel - Changes based on mode -->
      <div class="w-80 border-l bg-card p-4 overflow-y-auto">
        <!-- Viewer Mode: Camera Info -->
        <template v-if="!isEditingMode">
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
        </template>

        <!-- Editor Mode: Available Cameras -->
        <template v-else>
          <h2 class="text-sm font-semibold mb-3">Available Cameras</h2>
          <p class="text-xs text-muted-foreground mb-3">Drag cameras onto the map</p>

          <!-- Available Cameras List -->
          <div class="space-y-2">
            <div
              v-for="camera in availableCameras"
              :key="camera.id"
              draggable="true"
              @dragstart="onCameraDragStart($event, camera)"
              @dragend="onCameraDragEnd"
              class="p-3 border rounded-lg cursor-move hover:bg-accent transition-colors"
            >
              <div class="flex items-center gap-2 mb-1">
                <div
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
                ></div>
                <span class="font-medium text-sm">{{ camera.name }}</span>
              </div>
              <p class="text-xs text-muted-foreground">{{ camera.id }}</p>
            </div>

            <p v-if="availableCameras.length === 0" class="text-xs text-muted-foreground text-center py-4">
              All cameras are placed on the map
            </p>
          </div>
        </template>
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteMapStore } from '../stores/siteMaps'
import { useCameraStore } from '../stores/cameras'
import { useSiteMapCanvas, type CanvasRenderOptions } from '../composables/useSiteMapCanvas'
import { useCanvasInteraction } from '../composables/useCanvasInteraction'
import { useWallEditor } from '../composables/useWallEditor'
import type { CameraPlacement, Wall } from '../stores/siteMaps'
import type { Camera } from '../types/generated'
import MapControls from '../components/features/site-map/MapControls.vue'
import SiteMapSelector from '../components/features/site-map/SiteMapSelector.vue'
import CameraList from '../components/features/camera/CameraList.vue'
import CameraDetailsPanel from '../components/features/camera/CameraDetailsPanel.vue'
import CanvasOverlay from '../components/layout/CanvasOverlay.vue'
import WallToolbar from '../components/features/site-map/WallToolbar.vue'
import CameraConfigPopup from '../components/features/site-map/CameraConfigPopup.vue'
import {
  Dialog,
  DialogContent,
} from '../components/ui/dialog'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()
const { success: showSuccessToast, error: showErrorToast } = useToast()

// Edit mode state
const isEditingMode = ref(false)
const editingMapId = ref<string | null>(null)

const siteMaps = computed(() => siteMapStore.siteMaps)
const selectedMapId = ref(siteMapStore.activeSiteMapId.value)
const currentMap = computed(() => siteMaps.value.find(m => m.id === selectedMapId.value))

// Track if initial render is complete to prevent visual snap
const isInitialRenderComplete = ref(false)

// Editor state
const hasUnsavedChanges = ref(false)
const siteMapForm = reactive({
  name: '',
  description: '',
  width: 0,
  height: 0,
})

// Local working copies for editing (not saved to store until user clicks Save)
const localWalls = ref<Wall[]>([])
const localCameras = ref<CameraPlacement[]>([])

// Original values to compare against for change detection
const originalData = ref({
  name: '',
  description: '',
  width: 0,
  height: 0,
  walls: [] as Wall[],
  cameras: [] as CameraPlacement[]
})

// Computed to get the current working data (local copy in edit mode, store data in viewer mode)
const workingWalls = computed(() => isEditingMode.value ? localWalls.value : currentMap.value?.walls || [])
const workingCameras = computed(() => isEditingMode.value ? localCameras.value : currentMap.value?.cameras || [])

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


// Composables
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const interaction = useCanvasInteraction(mapCanvas, canvas.findCameraAtPoint)
const wallEditor = useWallEditor()

// Camera drag state
const draggedCamera = ref<Camera | null>(null)

// Camera config popup state
const showConfigPopup = ref(false)
const configPopupPosition = ref({ x: 0, y: 0 })
const pendingCameraPlacement = ref<{ camera: Camera; x: number; y: number } | null>(null)
const cameraConfigDefaults = ref({
  height: 2.4,
  angle: 35,
  rotation: 0
})

// Available cameras (not yet placed on map)
const availableCameras = computed(() => {
  // In edit mode, use local working copy; in viewer mode, use store data
  const cameras = isEditingMode.value ? workingCameras.value : currentMap.value?.cameras || []
  const placedCameraIds = new Set(cameras.map(c => c.cameraId))
  return cameraStore.cameras.filter(c => !placedCameraIds.has(c.id))
})

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
  opacity: isInitialRenderComplete.value ? 1 : 0,
  transition: isInitialRenderComplete.value ? 'none' : 'opacity 0.1s',
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

// Cursor class based on mode and hover state
const canvasCursorClass = computed(() => {
  if (!isEditingMode.value) {
    // Viewer mode
    if (isDragging.value) return 'cursor-grabbing'
    if (hoveredCamera.value) return 'cursor-pointer'
    return 'cursor-grab'
  }

  // Editor mode
  if (isDragging.value) return 'cursor-grabbing'

  if (wallEditor.mode.value === 'draw') {
    return 'cursor-crosshair'
  } else if (wallEditor.mode.value === 'edit') {
    // Check if hovering over a wall endpoint or body
    if (wallEditor.hoverState.value.hoveredWall) {
      if (wallEditor.hoverState.value.hoveredPart === 'start' || wallEditor.hoverState.value.hoveredPart === 'end') {
        return 'cursor-move'
      }
      return 'cursor-move'
    }
    return 'cursor-default'
  }

  return 'cursor-default'
})

// Undo/Redo state
interface HistoryState {
  walls: Wall[]
  cameras: CameraPlacement[]
}

const history = ref<HistoryState[]>([])
const historyIndex = ref(-1)

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const saveHistoryState = () => {
  if (!isEditingMode.value) return

  // Remove any future states if we're not at the end
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  // Add current state (from local working copies)
  history.value.push({
    walls: JSON.parse(JSON.stringify(localWalls.value)),
    cameras: JSON.parse(JSON.stringify(localCameras.value))
  })

  historyIndex.value = history.value.length - 1

  // Limit history to 50 states
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

const undo = () => {
  if (!canUndo.value || !isEditingMode.value) return

  historyIndex.value--
  const state = history.value[historyIndex.value]

  // Update local working copies, not the store
  localWalls.value = JSON.parse(JSON.stringify(state.walls))
  localCameras.value = JSON.parse(JSON.stringify(state.cameras))

  drawMap()
}

const redo = () => {
  if (!canRedo.value || !isEditingMode.value) return

  historyIndex.value++
  const state = history.value[historyIndex.value]

  // Update local working copies, not the store
  localWalls.value = JSON.parse(JSON.stringify(state.walls))
  localCameras.value = JSON.parse(JSON.stringify(state.cameras))

  drawMap()
}

const selectMap = async (mapId: string) => {
  selectedMapId.value = mapId
  siteMapStore.setActiveSiteMap(mapId)
  selectedCamera.value = null
}

const editMap = (mapId: string) => {
  // Select the map if not already selected
  if (selectedMapId.value !== mapId) {
    selectedMapId.value = mapId
    siteMapStore.setActiveSiteMap(mapId)
  }

  isEditingMode.value = true
  editingMapId.value = mapId

  // Wait for currentMap to be set
  nextTick(() => {
    // Load site map details into form
    if (currentMap.value) {
      siteMapForm.name = currentMap.value.name
      siteMapForm.description = currentMap.value.description || ''
      siteMapForm.width = currentMap.value.width
      siteMapForm.height = currentMap.value.height

      // Create local working copies (deep clone)
      localWalls.value = JSON.parse(JSON.stringify(currentMap.value.walls))
      localCameras.value = JSON.parse(JSON.stringify(currentMap.value.cameras))

      // Store original values for change detection
      originalData.value = {
        name: currentMap.value.name,
        description: currentMap.value.description || '',
        width: currentMap.value.width,
        height: currentMap.value.height,
        walls: JSON.parse(JSON.stringify(currentMap.value.walls)),
        cameras: JSON.parse(JSON.stringify(currentMap.value.cameras))
      }

      // Initialize history with current state
      history.value = []
      historyIndex.value = -1
      saveHistoryState()
    }

    // Reset flags and initialize wall editor
    hasUnsavedChanges.value = false
    wallEditor.setMode('draw')

    // Redraw the canvas in edit mode
    drawMap()
    isInitialRenderComplete.value = true
  })
}

const saveConfiguration = () => {
  if (currentMap.value) {
    // Save all changes (form data, walls, and cameras) to the store
    siteMapStore.updateSiteMap(currentMap.value.id, {
      name: siteMapForm.name,
      description: siteMapForm.description,
      width: siteMapForm.width,
      height: siteMapForm.height,
      walls: JSON.parse(JSON.stringify(localWalls.value)),
      cameras: JSON.parse(JSON.stringify(localCameras.value)),
    })

    // Update original data to current values since we just saved
    originalData.value = {
      name: siteMapForm.name,
      description: siteMapForm.description,
      width: siteMapForm.width,
      height: siteMapForm.height,
      walls: JSON.parse(JSON.stringify(localWalls.value)),
      cameras: JSON.parse(JSON.stringify(localCameras.value))
    }

    hasUnsavedChanges.value = false
    showSuccessToast('Configuration saved successfully!')
  }
}

const exitEditMode = () => {
  // Check for unsaved changes and confirm with user
  if (hasUnsavedChanges.value) {
    const confirmed = window.confirm('You have unsaved changes. Are you sure you want to exit without saving?')
    if (!confirmed) {
      return
    }
  }

  isEditingMode.value = false
  editingMapId.value = null
  wallEditor.setMode('none')
  hasUnsavedChanges.value = false

  // Clear local working copies
  localWalls.value = []
  localCameras.value = []

  // Canvas stays mounted, just redraw
  drawMap()
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

  if (!isEditingMode.value) {
    // Viewer mode: pan the canvas
    isDragging.value = true
    dragStart.value = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offsetX.value,
      offsetY: offsetY.value
    }
    return
  }

  // Editor mode: wall drawing/editing
  const canvasX = (event.clientX - canvasContainer.value!.getBoundingClientRect().left - offsetX.value) / scale.value
  const canvasY = (event.clientY - canvasContainer.value!.getBoundingClientRect().top - offsetY.value) / scale.value

  if (wallEditor.mode.value === 'draw') {
    const snapped = wallEditor.snapPoint(canvasX, canvasY, localWalls.value)
    wallEditor.startDrawing(snapped.x, snapped.y)
    drawMap()
  } else if (wallEditor.mode.value === 'edit') {
    const wall = wallEditor.findWallAtPoint(canvasX, canvasY, localWalls.value)
    if (wall) {
      const endpoint = wallEditor.findEndpointAtPoint(canvasX, canvasY, wall)
      if (endpoint) {
        wallEditor.startDraggingEndpoint(wall, endpoint)
      } else {
        wallEditor.selectWall(wall)
      }
    } else {
      wallEditor.selectWall(null)
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  interaction.onMouseMove(event)

  if (!isEditingMode.value) {
    // Viewer mode: handle panning and hover
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
    return
  }

  // Editor mode: wall drawing/editing
  const canvasX = (event.clientX - canvasContainer.value!.getBoundingClientRect().left - offsetX.value) / scale.value
  const canvasY = (event.clientY - canvasContainer.value!.getBoundingClientRect().top - offsetY.value) / scale.value

  if (wallEditor.drawState.value.isDrawing) {
    const snapped = wallEditor.snapPoint(canvasX, canvasY, localWalls.value)
    wallEditor.updateDrawing(snapped.x, snapped.y)
    drawMap()
  } else if (wallEditor.dragState.value.isDragging) {
    const updatedWall = wallEditor.updateDraggingEndpoint(canvasX, canvasY, localWalls.value)
    if (updatedWall) {
      // Update local working copy, not the store
      const wallIndex = localWalls.value.findIndex(w => w.id === updatedWall.id)
      if (wallIndex !== -1) {
        localWalls.value[wallIndex] = updatedWall
      }
      drawMap()
    }
  } else {
    wallEditor.updateHoverState(canvasX, canvasY, localWalls.value, wallEditor.mode.value === 'edit')
    drawMap()
  }
}

const handleMouseUp = () => {
  if (!isEditingMode.value) {
    isDragging.value = false
    return
  }

  // Editor mode: finish wall drawing/editing
  if (wallEditor.drawState.value.isDrawing) {
    const newWall = wallEditor.finishDrawing()
    if (newWall) {
      saveHistoryState()
      // Add to local working copy, not the store
      localWalls.value.push(newWall)
      drawMap()
    }
  } else if (wallEditor.dragState.value.isDragging) {
    const wall = wallEditor.finishDraggingEndpoint()
    if (wall) {
      saveHistoryState()
      drawMap()
    }
  }

  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
  if (isEditingMode.value) {
    wallEditor.resetDrawing()
    wallEditor.clearHoverState()
  }
}

// Keyboard event handler
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isEditingMode.value) return

  // Delete key - delete selected wall
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (wallEditor.selectedWall.value) {
      event.preventDefault()
      saveHistoryState()
      // Remove from local working copy, not the store
      localWalls.value = localWalls.value.filter(w => w.id !== wallEditor.selectedWall.value?.id)
      wallEditor.selectWall(null)
      drawMap()
    }
  }

  // Ctrl+Z / Cmd+Z - Undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
  }

  // Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z - Redo
  if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
    event.preventDefault()
    redo()
  }
}

// Camera drag and drop
const onCameraDragStart = (event: DragEvent, camera: Camera) => {
  draggedCamera.value = camera
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify(camera))
  }
}

const onCameraDragEnd = () => {
  draggedCamera.value = null
}

const onCanvasDragOver = (event: DragEvent) => {
  if (!draggedCamera.value || !isEditingMode.value) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  if (!draggedCamera.value || !canvasContainer.value || !isEditingMode.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const canvasX = (event.clientX - rect.left - offsetX.value) / scale.value
  const canvasY = (event.clientY - rect.top - offsetY.value) / scale.value

  // Store pending camera placement
  pendingCameraPlacement.value = {
    camera: draggedCamera.value,
    x: Math.round(canvasX),
    y: Math.round(canvasY)
  }

  // Position the popup near the drop location but offset to avoid covering the camera
  // Convert canvas coordinates to screen coordinates
  const screenX = canvasX * scale.value + offsetX.value
  const screenY = canvasY * scale.value + offsetY.value

  configPopupPosition.value = {
    x: event.clientX - rect.left + 20, // Offset to the right
    y: event.clientY - rect.top - 100  // Offset upwards
  }

  // Show the configuration popup
  showConfigPopup.value = true
  draggedCamera.value = null
}

const handleCameraConfigConfirm = (config: { height: number; angle: number; rotation: number }) => {
  if (!pendingCameraPlacement.value) return

  const newPlacement: CameraPlacement = {
    cameraId: pendingCameraPlacement.value.camera.id,
    x: pendingCameraPlacement.value.x,
    y: pendingCameraPlacement.value.y,
    rotation: config.rotation,
    angle: config.angle,
    height: config.height,
    fov: 90,
    viewDistance: 200,
    autoCalculateDistance: true,
    color: 'blue-500'
  }

  saveHistoryState()
  // Add to local working copy, not the store
  localCameras.value.push(newPlacement)
  drawMap()

  // Close popup and clear pending placement
  showConfigPopup.value = false
  pendingCameraPlacement.value = null

  showSuccessToast('Camera placed successfully!')
}

const handleCameraConfigCancel = () => {
  showConfigPopup.value = false
  pendingCameraPlacement.value = null
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
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()

  // Use working data (local copies in edit mode, store data in viewer mode)
  canvas.drawWalls(workingWalls.value)

  // Draw wall preview in edit mode
  if (isEditingMode.value && wallEditor.drawState.value.isDrawing) {
    const start = wallEditor.drawState.value.startPoint
    const current = wallEditor.drawState.value.currentPoint
    if (start && current) {
      const ctx = mapCanvas.value?.getContext('2d')
      if (ctx) {
        ctx.save()
        ctx.strokeStyle = '#fbbf24' // Yellow preview
        ctx.lineWidth = wallEditor.drawState.value.thickness
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(current.x, current.y)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  workingCameras.value.forEach(camera => {
    const isSelected = selectedCamera.value?.cameraId === camera.cameraId
    canvas.drawCamera(camera, getCameraName, isSelected, false, workingWalls.value)
  })
}

const resetCanvasTransform = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

const fitToView = () => {
  const canvasEl = mapCanvas.value
  const container = canvasContainer.value
  if (!canvasEl || !container || !currentMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = currentMap.value.width
  const mapHeight = currentMap.value.height

  // Skip if container is too small (not ready yet)
  if (containerWidth < 100 || containerHeight < 100) return

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  // Ensure scale is always positive and within bounds
  const newScale = Math.max(minScale, Math.min(scaleX, scaleY, 1))

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2
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
  // Create a new blank site map
  const newMap = siteMapStore.addSiteMap({
    name: 'New Site Map',
    description: '',
    imagePath: undefined,
    width: 1000,
    height: 800,
    scale: 50, // Default scale: 50 pixels per meter
    cameras: [],
    walls: [],
  })

  // Enter edit mode with the new site map using editMap
  editMap(newMap.id)
}

const resizeCanvas = () => {
  const canvasEl = mapCanvas.value
  if (!canvasEl || !currentMap.value) return

  canvas.resizeCanvas(currentMap.value.width, currentMap.value.height)
  drawMap()

  // Mark initial render as complete after first successful draw
  if (!isInitialRenderComplete.value) {
    setTimeout(() => {
      isInitialRenderComplete.value = true
    }, 50)
  }
}


watch([
  () => canvasOptions.showGrid,
  () => canvasOptions.showScaleReference,
  () => canvasOptions.showCameraLabels
], () => {
  canvas.requestRedraw(drawMap)
})

// Watch for changes in edit mode to automatically update hasUnsavedChanges
watch([
  () => siteMapForm.name,
  () => siteMapForm.description,
  () => siteMapForm.width,
  () => siteMapForm.height,
  () => localWalls.value.length,
  () => localCameras.value.length,
  localWalls,
  localCameras
], () => {
  if (!isEditingMode.value) return

  // Check if anything has changed from original
  const formChanged =
    siteMapForm.name !== originalData.value.name ||
    siteMapForm.description !== originalData.value.description ||
    siteMapForm.width !== originalData.value.width ||
    siteMapForm.height !== originalData.value.height

  const wallsChanged = JSON.stringify(localWalls.value) !== JSON.stringify(originalData.value.walls)
  const camerasChanged = JSON.stringify(localCameras.value) !== JSON.stringify(originalData.value.cameras)

  hasUnsavedChanges.value = formChanged || wallsChanged || camerasChanged
}, { deep: true })

watch(currentMap, async (newMap, oldMap) => {
  // Skip if the map ID hasn't actually changed (just switching modes)
  if (oldMap?.id === newMap?.id) return

  if (newMap) {
    // Wait for DOM to update, then set zoom/position before drawing
    await nextTick()
    // Important: Call fitToView FIRST to set transform, THEN resize which will draw
    fitToView()
    // Small delay to ensure transform is applied before drawing
    await nextTick()
    resizeCanvas()
  }
})

// Real-time camera status update interval
let statusUpdateInterval: number | null = null

// Resize handler
const handleResize = () => {
  resizeCanvas()
  fitToView()
}

onMounted(() => {
  if (!canvas.initCanvas()) return

  // Auto-select first site map if none is currently selected or valid
  if ((!selectedMapId.value || !currentMap.value) && siteMaps.value.length > 0) {
    selectMap(siteMaps.value[0].id)
  } else if (currentMap.value) {
    // Map is already selected, render it
    resizeCanvas()
    drawMap()
    setTimeout(() => {
      fitToView()
    }, 100)
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)

  // Initialize history with current state
  if (currentMap.value) {
    saveHistoryState()
  }

  // Set up real-time camera status updates
  // In real implementation, this would use WebSocket or SSE for live updates
  // Here we simulate it by periodically checking status and updating the display
  statusUpdateInterval = window.setInterval(() => {
    // Skip if in edit mode
    if (isEditingMode.value) return

    // Simulate random status changes for demonstration
    // In production, this would fetch real status from backend
    const cameras = cameraStore.cameras
    let hasChanges = false

    cameras.forEach(camera => {
      // 5% chance of status change per update cycle
      if (Math.random() < 0.05) {
        const currentStatus = camera.status
        const newStatus = currentStatus === 'online' ? 'offline' : 'online'

        // Update the camera status in the store
        // This simulates receiving a status update from the backend
        camera.status = newStatus
        hasChanges = true
      }
    })

    // Redraw the map if there were any status changes
    if (hasChanges && currentMap.value) {
      drawMap()
    }
  }, 3000) // Update every 3 seconds
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)

  if (activePeerConnection.value) {
    activePeerConnection.value.close()
  }

  // Clear the status update interval
  if (statusUpdateInterval !== null) {
    clearInterval(statusUpdateInterval)
    statusUpdateInterval = null
  }
})
</script>
