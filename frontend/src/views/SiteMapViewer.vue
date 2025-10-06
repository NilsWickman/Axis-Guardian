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
          <h2 class="text-base font-bold">Site Map Editor</h2>
          <p class="text-xs text-muted-foreground mt-1">Configure cameras and walls</p>
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

          <!-- Wall Toolbar (Editor Mode Only) -->
          <WallToolbar
            v-if="isEditingMode"
            :is-active="wallEditor.isActive.value"
            :mode="wallEditor.mode.value"
            :wall-type="wallEditor.drawState.value.wallType"
            :selected-wall="wallEditor.selectedWall.value"
            :show-grid="canvasOptions.showGrid"
            :can-undo="false"
            :can-redo="false"
            @set-mode="wallEditor.setMode($event)"
            @set-wall-type="wallEditor.setWallType($event)"
            @delete-wall="deleteSelectedWall"
            @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
            @undo="() => {}"
            @redo="() => {}"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @reset-view="fitToView"
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
import type { CameraPlacement } from '../stores/siteMaps'
import type { Camera } from '../types/generated'
import MapControls from '../components/features/site-map/MapControls.vue'
import SiteMapSelector from '../components/features/site-map/SiteMapSelector.vue'
import CameraList from '../components/features/camera/CameraList.vue'
import CameraDetailsPanel from '../components/features/camera/CameraDetailsPanel.vue'
import CanvasOverlay from '../components/layout/CanvasOverlay.vue'
import WallToolbar from '../components/features/site-map/WallToolbar.vue'
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

// Available cameras (not yet placed on map)
const availableCameras = computed(() => {
  if (!currentMap.value) return cameraStore.cameras

  const placedCameraIds = new Set(currentMap.value.cameras.map(c => c.cameraId))
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

const selectMap = async (mapId: string) => {
  console.log('[selectMap] START - mapId:', mapId)
  console.log('[selectMap] isEditingMode:', isEditingMode.value)

  selectedMapId.value = mapId
  siteMapStore.setActiveSiteMap(mapId)
  selectedCamera.value = null

  // Note: resizeCanvas() and fitToView() are handled by the watch on currentMap
  console.log('[selectMap] Map changed, watch will handle resize/fit')
  console.log('[selectMap] Current scale/offset:', { scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value })
}

const editMap = (mapId: string) => {
  console.log('[editMap] Entering edit mode for mapId:', mapId)
  isEditingMode.value = true
  editingMapId.value = mapId

  // Load site map details into form
  if (currentMap.value) {
    siteMapForm.name = currentMap.value.name
    siteMapForm.description = currentMap.value.description || ''
    siteMapForm.width = currentMap.value.width
    siteMapForm.height = currentMap.value.height
  }

  // Reset flags and initialize wall editor
  hasUnsavedChanges.value = false
  wallEditor.setMode('draw')

  // Redraw the canvas in edit mode
  console.log('[editMap] Redrawing canvas for edit mode')
  drawMap()
  isInitialRenderComplete.value = true
}

const markAsChanged = () => {
  hasUnsavedChanges.value = true
}

const saveConfiguration = () => {
  if (currentMap.value) {
    siteMapStore.updateSiteMap(currentMap.value.id, {
      name: siteMapForm.name,
      description: siteMapForm.description,
      width: siteMapForm.width,
      height: siteMapForm.height,
    })
    hasUnsavedChanges.value = false
    showSuccessToast('Configuration saved successfully!')
  }
}

const exitEditMode = () => {
  console.log('[exitEditMode] START')
  isEditingMode.value = false
  editingMapId.value = null
  wallEditor.setMode('none')

  // Canvas stays mounted, just redraw
  console.log('[exitEditMode] Redrawing canvas in viewer mode')
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
    const snapped = wallEditor.snapPoint(canvasX, canvasY, currentMap.value?.walls || [])
    wallEditor.startDrawing(snapped.x, snapped.y)
    drawMap()
  } else if (wallEditor.mode.value === 'edit' && currentMap.value) {
    const wall = wallEditor.findWallAtPoint(canvasX, canvasY, currentMap.value.walls)
    if (wall) {
      const endpoint = wallEditor.findEndpointAtPoint(canvasX, canvasY, wall)
      if (endpoint) {
        wallEditor.startDraggingEndpoint(wall, endpoint)
      } else {
        wallEditor.selectWall(wall)
      }
    }
  } else if (wallEditor.mode.value === 'delete' && currentMap.value) {
    const wall = wallEditor.findWallAtPoint(canvasX, canvasY, currentMap.value.walls)
    if (wall && currentMap.value) {
      siteMapStore.removeWallFromSiteMap(currentMap.value.id, wall.id)
      markAsChanged()
      drawMap()
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
    const snapped = wallEditor.snapPoint(canvasX, canvasY, currentMap.value?.walls || [])
    wallEditor.updateDrawing(snapped.x, snapped.y)
    drawMap()
  } else if (wallEditor.dragState.value.isDragging && currentMap.value) {
    const updatedWall = wallEditor.updateDraggingEndpoint(canvasX, canvasY, currentMap.value.walls)
    if (updatedWall) {
      siteMapStore.updateWallInSiteMap(currentMap.value.id, updatedWall)
      drawMap()
    }
  } else if (currentMap.value) {
    wallEditor.updateHoverState(canvasX, canvasY, currentMap.value.walls, wallEditor.mode.value === 'edit')
    drawMap()
  }
}

const handleMouseUp = () => {
  if (!isEditingMode.value) {
    isDragging.value = false
    return
  }

  // Editor mode: finish wall drawing/editing
  if (wallEditor.drawState.value.isDrawing && currentMap.value) {
    const newWall = wallEditor.finishDrawing()
    if (newWall) {
      siteMapStore.addWallToSiteMap(currentMap.value.id, newWall)
      markAsChanged()
      drawMap()
    }
  } else if (wallEditor.dragState.value.isDragging && currentMap.value) {
    const wall = wallEditor.finishDraggingEndpoint()
    if (wall) {
      markAsChanged()
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

// Wall operations
const deleteSelectedWall = () => {
  if (wallEditor.selectedWall.value && currentMap.value) {
    siteMapStore.removeWallFromSiteMap(currentMap.value.id, wallEditor.selectedWall.value.id)
    wallEditor.selectWall(null)
    markAsChanged()
    drawMap()
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
  if (!draggedCamera.value || !currentMap.value || !canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const canvasX = (event.clientX - rect.left - offsetX.value) / scale.value
  const canvasY = (event.clientY - rect.top - offsetY.value) / scale.value

  // Add camera to map
  const newPlacement: CameraPlacement = {
    cameraId: draggedCamera.value.id,
    x: Math.round(canvasX),
    y: Math.round(canvasY),
    rotation: 0,
    fieldOfView: 90,
    viewDistance: 200,
    color: 'blue-500'
  }

  siteMapStore.addCameraToSiteMap(currentMap.value.id, newPlacement)
  markAsChanged()
  drawMap()
  draggedCamera.value = null
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
  console.log('[drawMap] isEditingMode:', isEditingMode.value)

  if (!currentMap.value) {
    console.log('[drawMap] Skipping - no current map')
    return
  }

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawWalls(currentMap.value.walls)

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
  console.log('[fitToView] isEditingMode:', isEditingMode.value)

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
  console.log('[openAddMapDialog] Creating new site map')
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

  console.log('[openAddMapDialog] New map created with id:', newMap.id)
  // Enter edit mode with the new site map
  isEditingMode.value = true
  editingMapId.value = newMap.id
}

const resizeCanvas = () => {
  console.log('[resizeCanvas] START')
  console.log('[resizeCanvas] isEditingMode:', isEditingMode.value)

  const canvasEl = mapCanvas.value
  if (!canvasEl || !currentMap.value) {
    console.log('[resizeCanvas] EARLY EXIT - missing elements')
    return
  }

  console.log('[resizeCanvas] Resizing to:', { width: currentMap.value.width, height: currentMap.value.height })
  canvas.resizeCanvas(currentMap.value.width, currentMap.value.height)
  console.log('[resizeCanvas] Calling drawMap()')
  drawMap()

  // Mark initial render as complete after first successful draw
  if (!isInitialRenderComplete.value) {
    console.log('[resizeCanvas] Marking initial render complete')
    setTimeout(() => {
      isInitialRenderComplete.value = true
    }, 50)
  }
}

watch(isEditingMode, (newValue, oldValue) => {
  console.log('[watch isEditingMode] Changed from', oldValue, 'to', newValue)
})

watch([
  () => canvasOptions.showGrid,
  () => canvasOptions.showScaleReference,
  () => canvasOptions.showCameraLabels
], () => {
  canvas.requestRedraw(drawMap)
})

watch(currentMap, async (newMap, oldMap) => {
  console.log('[watch currentMap] Map changed from', oldMap?.id, 'to', newMap?.id)
  console.log('[watch currentMap] isEditingMode:', isEditingMode.value)

  if (newMap) {
    console.log('[watch currentMap] Waiting for nextTick')
    // Wait for DOM to update, then set zoom/position before drawing
    await nextTick()
    console.log('[watch currentMap] Calling fitToView and resizeCanvas')
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
  console.log('[SiteMapViewer onMounted] START')
  console.log('[SiteMapViewer onMounted] isEditingMode:', isEditingMode.value)

  if (!canvas.initCanvas()) {
    console.log('[SiteMapViewer onMounted] Failed to init canvas')
    return
  }

  console.log('[SiteMapViewer onMounted] Canvas initialized')
  console.log('[SiteMapViewer onMounted] selectedMapId:', selectedMapId.value)
  console.log('[SiteMapViewer onMounted] currentMap:', currentMap.value?.id)

  // Auto-select first site map if none is currently selected or valid
  if ((!selectedMapId.value || !currentMap.value) && siteMaps.value.length > 0) {
    console.log('[SiteMapViewer onMounted] Auto-selecting first map')
    selectMap(siteMaps.value[0].id)
  } else if (currentMap.value) {
    console.log('[SiteMapViewer onMounted] Map already selected, rendering')
    // Map is already selected, render it
    resizeCanvas()
    drawMap()
    setTimeout(() => {
      console.log('[SiteMapViewer onMounted] Fitting to view after 100ms')
      fitToView()
    }, 100)
  }

  window.addEventListener('resize', handleResize)

  // Set up real-time camera status updates
  // In real implementation, this would use WebSocket or SSE for live updates
  // Here we simulate it by periodically checking status and updating the display
  statusUpdateInterval = window.setInterval(() => {
    // Skip if in edit mode
    if (isEditingMode.value) {
      return
    }

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
  console.log('[SiteMapViewer onUnmounted] Cleaning up')
  window.removeEventListener('resize', handleResize)

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
