<template>
  <div class="h-full w-full bg-background flex">
    <!-- Left Panel - Site Map Selector -->
    <div class="w-80 border-r bg-card overflow-y-auto flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-base font-bold">Site Maps</h2>
        <p class="text-xs text-muted-foreground mt-1">Select a site map to view</p>
      </div>

      <div class="flex-1 p-3 space-y-2">
        <div
          v-for="map in siteMaps"
          :key="map.id"
          @click="selectMap(map.id)"
          class="p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
          :class="selectedMapId === map.id ? 'bg-accent border-accent-foreground ring-2 ring-primary' : 'hover:bg-accent/50'"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-sm">{{ map.name }}</h3>
            <span
              v-if="selectedMapId === map.id"
              class="text-xs text-primary font-semibold"
            >
              Active
            </span>
          </div>

          <p v-if="map.description" class="text-xs text-muted-foreground mb-2">
            {{ map.description }}
          </p>

          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">Cameras:</span>
              <span class="font-semibold">{{ map.cameras.length }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">Size:</span>
              <span class="font-mono text-[10px]">{{ map.width }}×{{ map.height }}</span>
            </div>
          </div>

          <div class="mt-2 text-[10px] text-muted-foreground">
            Updated: {{ formatDate(map.updatedAt) }}
          </div>
        </div>
      </div>

      <div class="p-3 border-t">
        <button
          @click="goToEditor"
          class="w-full px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          Configure Site Maps
        </button>
      </div>
    </div>

    <!-- Main Content - Site Map Display -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Map Canvas Area -->
      <div class="flex-1 p-4 flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <div v-if="currentMap">
            <h2 class="text-lg font-semibold">{{ currentMap.name }}</h2>
            <p v-if="currentMap.description" class="text-sm text-muted-foreground">
              {{ currentMap.description }}
            </p>
          </div>

          <MapControls
            :show-grid="canvasOptions.showGrid"
            :show-scale-reference="canvasOptions.showScaleReference"
            :show-labels="canvasOptions.showCameraLabels"
            :show-fit-to-view="true"
            @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
            @toggle-scale="canvasOptions.showScaleReference = !canvasOptions.showScaleReference"
            @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
            @fit-to-view="fitToView"
          />
        </div>

        <!-- Canvas Container -->
        <div class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden" ref="canvasContainer">
          <canvas
            ref="mapCanvas"
            @mousemove="handleMouseMove"
            @click="onCameraClick"
            class="cursor-pointer"
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
              Status: <span :class="getCameraStatus(hoveredCamera.cameraId) === 'online' ? 'text-green-400' : 'text-red-400'">
                {{ getCameraStatus(hoveredCamera.cameraId) }}
              </span>
            </div>
            <div class="text-[10px] text-gray-400">
              Click to view details
            </div>
          </div>

          <!-- Instructions -->
          <div v-if="!currentMap || currentMap.cameras.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="bg-black/70 text-white px-6 py-4 rounded-lg text-center">
              <p class="font-semibold mb-2">{{ currentMap ? 'No cameras configured' : 'No site map selected' }}</p>
              <p class="text-sm text-gray-300">{{ currentMap ? 'Click "Configure Maps" to add cameras' : 'Select a site map from the list' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Camera Info -->
      <div class="w-80 border-l bg-card p-4 overflow-y-auto">
        <h2 class="text-sm font-semibold mb-3">Camera Details</h2>

        <div v-if="selectedCamera" class="space-y-4">
          <div class="border-b pb-3">
            <h3 class="text-base font-semibold mb-1">{{ getCameraName(selectedCamera.cameraId) }}</h3>
            <p class="text-xs text-muted-foreground">{{ selectedCamera.cameraId }}</p>
          </div>

          <!-- Position Information -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase">Position</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-xs text-muted-foreground">X:</span>
                <span class="ml-2 font-mono">{{ selectedCamera.x }}px</span>
              </div>
              <div>
                <span class="text-xs text-muted-foreground">Y:</span>
                <span class="ml-2 font-mono">{{ selectedCamera.y }}px</span>
              </div>
            </div>
          </div>

          <!-- Camera Settings -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase">Camera Settings</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Rotation:</span>
                <span class="font-mono">{{ selectedCamera.rotation }}°</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Down Angle:</span>
                <span class="font-mono">{{ selectedCamera.angle }}°</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Height:</span>
                <span class="font-mono">{{ selectedCamera.height }}m</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">FOV:</span>
                <span class="font-mono">{{ selectedCamera.fov }}°</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">View Distance:</span>
                <span class="font-mono">{{ selectedCamera.viewDistance }}px ({{ (selectedCamera.viewDistance / (currentMap?.scale || 50)).toFixed(1) }}m)</span>
              </div>
            </div>
          </div>

          <!-- Camera Color -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase">Display</h4>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">Color:</span>
              <div
                class="w-8 h-8 rounded border-2 border-border"
                :style="{ backgroundColor: selectedCamera.color }"
              ></div>
              <span class="font-mono text-sm">{{ selectedCamera.color }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="selectedCamera.notes" class="space-y-2">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase">Notes</h4>
            <p class="text-sm">{{ selectedCamera.notes }}</p>
          </div>

          <!-- Camera Status -->
          <div class="space-y-2 pt-3 border-t">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase">Live Status</h4>
            <div class="flex items-center gap-2">
              <span
                :class="getCameraStatus(selectedCamera.cameraId) === 'online' ? 'bg-green-500' : 'bg-red-500'"
                class="w-2 h-2 rounded-full animate-pulse"
              ></span>
              <span class="text-sm capitalize">{{ getCameraStatus(selectedCamera.cameraId) }}</span>
            </div>
          </div>

          <button
            @click="viewCameraLive"
            class="w-full mt-4 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            View Live Feed
          </button>
        </div>

        <div v-else class="flex items-center justify-center h-40 border rounded-lg bg-muted/30">
          <p class="text-xs text-muted-foreground text-center px-4">
            Click on a camera<br/>to view details
          </p>
        </div>

        <!-- Camera List -->
        <div v-if="currentMap && currentMap.cameras.length > 0" class="mt-6">
          <h3 class="text-sm font-semibold mb-2">All Cameras on Map</h3>
          <div class="space-y-1">
            <div
              v-for="camera in currentMap.cameras"
              :key="camera.cameraId"
              @click="selectCameraById(camera.cameraId)"
              class="p-2 border rounded cursor-pointer hover:bg-accent transition-colors text-sm"
              :class="selectedCamera?.cameraId === camera.cameraId ? 'bg-accent border-accent-foreground' : ''"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: camera.color }"
                  ></div>
                  <span class="font-medium">{{ getCameraName(camera.cameraId) }}</span>
                </div>
                <span
                  :class="getCameraStatus(camera.cameraId) === 'online' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'"
                  class="px-1.5 py-0.5 text-[9px] font-semibold rounded-full"
                >
                  {{ getCameraStatus(camera.cameraId) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteMapStore } from '../stores/siteMaps'
import { useCameraStore } from '../stores/cameras'
import { useSiteMapCanvas, type CanvasRenderOptions } from '../composables/useSiteMapCanvas'
import { useCanvasInteraction } from '../composables/useCanvasInteraction'
import type { CameraPlacement } from '../stores/siteMaps'
import MapControls from '../components/features/site-map/MapControls.vue'

const router = useRouter()
const siteMapStore = useSiteMapStore()
const cameraStore = useCameraStore()

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

// Composables
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))
const interaction = useCanvasInteraction(mapCanvas, canvas.findCameraAtPoint)

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

const selectMap = (mapId: string) => {
  selectedMapId.value = mapId
  siteMapStore.setActiveSiteMap(mapId)
  selectedCamera.value = null
  resetCanvasTransform()
  resizeCanvas()
  setTimeout(fitToView, 100)
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const getCameraStatus = (cameraId: string): string => {
  const camera = cameraStore.cameras.find(c => c.id === cameraId)
  return camera?.status || 'offline'
}

const selectCameraById = (cameraId: string) => {
  if (currentMap.value) {
    selectedCamera.value = currentMap.value.cameras.find(c => c.cameraId === cameraId) || null
    drawMap()
  }
}

const onCameraClick = (event: MouseEvent) => {
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

const handleMouseMove = (event: MouseEvent) => {
  interaction.onMouseMove(event)

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

const drawMap = () => {
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
  const canvasEl = mapCanvas.value
  const container = canvasContainer.value
  if (!canvasEl || !container || !currentMap.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = currentMap.value.width
  const mapHeight = currentMap.value.height

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.min(scaleX, scaleY, 1)

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2
}

const goToEditor = () => {
  router.push('/site-config/editor')
}

const viewCameraLive = () => {
  if (selectedCamera.value) {
    router.push('/cameras/focus')
  }
}

const resizeCanvas = () => {
  const canvasEl = mapCanvas.value
  if (!canvasEl || !currentMap.value) return

  canvas.resizeCanvas(currentMap.value.width, currentMap.value.height)
  drawMap()
}

watch([
  () => canvasOptions.showGrid,
  () => canvasOptions.showScaleReference,
  () => canvasOptions.showCameraLabels
], () => {
  canvas.requestRedraw(drawMap)
})

watch(currentMap, () => {
  if (currentMap.value) {
    resizeCanvas()
    setTimeout(fitToView, 100)
  }
  canvas.requestRedraw(drawMap)
})

onMounted(() => {
  if (!canvas.initCanvas()) return

  // Auto-select first site map if none is currently selected or valid
  if ((!selectedMapId.value || !currentMap.value) && siteMaps.value.length > 0) {
    selectMap(siteMaps.value[0].id)
  } else if (currentMap.value) {
    // Map is already selected, just render it
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
})
</script>
