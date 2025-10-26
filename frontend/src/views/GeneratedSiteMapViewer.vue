<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="border-b bg-card px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Auto-Generated Site Map</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Site map automatically generated from camera configuration
          </p>
        </div>
        <button
          v-if="siteMapData"
          @click="loadSiteMap"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          Reload
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading site map...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">Failed to Load Site Map</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
        <button
          @click="loadSiteMap"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="siteMapData" class="flex-1 flex overflow-hidden">
      <!-- Left Panel - Metadata -->
      <div class="w-80 border-r bg-card p-6 overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">Site Map Information</h2>

        <div class="space-y-4">
          <!-- Basic Info -->
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <p class="text-sm font-medium">{{ siteMapData.name }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <p class="text-sm">{{ siteMapData.description }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Generated At</label>
            <p class="text-sm">{{ formatDate(siteMapData.generated_at) }}</p>
          </div>

          <!-- Dimensions -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Dimensions</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-muted-foreground mb-1">Width</label>
                <p class="text-sm font-medium">{{ siteMapData.width }}px</p>
                <p class="text-xs text-muted-foreground">{{ (siteMapData.width / siteMapData.scale).toFixed(1) }}m</p>
              </div>
              <div>
                <label class="block text-xs text-muted-foreground mb-1">Height</label>
                <p class="text-sm font-medium">{{ siteMapData.height }}px</p>
                <p class="text-xs text-muted-foreground">{{ (siteMapData.height / siteMapData.scale).toFixed(1) }}m</p>
              </div>
            </div>
            <div class="mt-3">
              <label class="block text-xs text-muted-foreground mb-1">Scale</label>
              <p class="text-sm font-medium">{{ siteMapData.scale }} px/m</p>
            </div>
          </div>

          <!-- Statistics -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Statistics</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between p-2 bg-muted rounded">
                <span class="text-xs text-muted-foreground">Cameras</span>
                <span class="text-sm font-semibold">{{ siteMapData.cameras.length }}</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-muted rounded">
                <span class="text-xs text-muted-foreground">Walls</span>
                <span class="text-sm font-semibold">{{ siteMapData.walls.length }}</span>
              </div>
              <div class="flex items-center justify-between p-2 bg-muted rounded">
                <span class="text-xs text-muted-foreground">Fog of War Regions</span>
                <span class="text-sm font-semibold">{{ siteMapData.fog_of_war_regions?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Cameras Used -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Cameras Used</h3>
            <div class="space-y-1">
              <div
                v-for="cameraId in siteMapData.cameras_used"
                :key="cameraId"
                class="text-xs p-2 bg-muted rounded flex items-center gap-2"
              >
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                {{ cameraId }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center - Canvas Display -->
      <div class="flex-1 p-6 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="showGrid"
                type="checkbox"
                class="rounded border-gray-300"
              />
              <span>Show Grid</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="showCameraLabels"
                type="checkbox"
                class="rounded border-gray-300"
              />
              <span>Show Labels</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="showFogOfWar"
                type="checkbox"
                class="rounded border-gray-300"
              />
              <span>Show Fog of War</span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="zoomOut"
              class="p-2 border rounded hover:bg-accent transition-colors"
              title="Zoom Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span class="text-sm font-mono w-16 text-center">{{ (scale * 100).toFixed(0) }}%</span>
            <button
              @click="zoomIn"
              class="p-2 border rounded hover:bg-accent transition-colors"
              title="Zoom In"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button
              @click="fitToView"
              class="p-2 border rounded hover:bg-accent transition-colors"
              title="Fit to View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Canvas Container -->
        <div
          ref="canvasContainer"
          class="flex-1 border rounded-lg bg-gray-900 relative overflow-hidden"
          @wheel="handleWheel"
        >
          <canvas
            ref="mapCanvas"
            :class="canvasCursorClass"
            :style="canvasStyle"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
          ></canvas>

          <!-- Coordinates Display -->
          <div class="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm font-mono">
            <div>Zoom: {{ (scale * 100).toFixed(0) }}%</div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Camera List -->
      <div class="w-80 border-l bg-card p-6 overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">Cameras ({{ siteMapData.cameras.length }})</h2>

        <div class="space-y-3">
          <div
            v-for="camera in siteMapData.cameras"
            :key="camera.cameraId"
            class="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            @click="selectedCameraId = camera.cameraId"
            :class="{ 'border-primary bg-accent': selectedCameraId === camera.cameraId }"
          >
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: getColorHex(camera.color) }"
              ></div>
              <span class="font-medium text-sm">{{ camera.cameraId }}</span>
            </div>
            <div class="text-xs text-muted-foreground space-y-1">
              <div>Position: ({{ (camera.x / siteMapData.scale).toFixed(1) }}m, {{ (camera.y / siteMapData.scale).toFixed(1) }}m)</div>
              <div>Height: {{ camera.height }}m</div>
              <div>Rotation: {{ camera.rotation }}°</div>
              <div>Angle: {{ camera.angle }}°</div>
              <div>FOV: {{ camera.fov }}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  siteMapClient,
  type GeneratedSiteMap,
  type GeneratedWall,
  type FogOfWarRegion,
  type CameraPlacement
} from '@/api/siteMapClient'

type SiteMapData = GeneratedSiteMap
type Wall = GeneratedWall
type Camera = CameraPlacement

const loading = ref(true)
const error = ref<string | null>(null)
const siteMapData = ref<SiteMapData | null>(null)

const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)

const showGrid = ref(true)
const showCameraLabels = ref(true)
const showFogOfWar = ref(true)

const scale = ref(0.3) // Start zoomed out to fit large map
const offsetX = ref(0)
const offsetY = ref(0)
const minScale = 0.05
const maxScale = 3

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const selectedCameraId = ref<string | null>(null)

const canvasStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${offsetX.value}px`,
  top: `${offsetY.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

const canvasCursorClass = computed(() => {
  if (isDragging.value) return 'cursor-grabbing'
  return 'cursor-grab'
})

// Tailwind color map for rendering
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
  return TAILWIND_COLOR_MAP[cleanColor] || '#3b82f6'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadSiteMap = async () => {
  loading.value = true
  error.value = null

  try {
    // Load the generated site map using the API client
    const data = await siteMapClient.loadGeneratedSiteMap()
    siteMapData.value = data

    // Wait for next tick to ensure canvas is available
    setTimeout(() => {
      initCanvas()
      fitToView()
      drawMap()
    }, 100)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load site map'
    console.error('Error loading site map:', err)
  } finally {
    loading.value = false
  }
}

const initCanvas = () => {
  if (!mapCanvas.value || !siteMapData.value) return false

  const canvas = mapCanvas.value
  canvas.width = siteMapData.value.width
  canvas.height = siteMapData.value.height

  return true
}

const drawMap = () => {
  const canvas = mapCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !siteMapData.value) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw grid
  if (showGrid.value) {
    drawGrid(ctx)
  }

  // Draw fog of war regions
  if (showFogOfWar.value && siteMapData.value.fog_of_war_regions) {
    drawFogOfWar(ctx, siteMapData.value.fog_of_war_regions)
  }

  // Draw walls
  drawWalls(ctx, siteMapData.value.walls)

  // Draw cameras
  siteMapData.value.cameras.forEach(camera => {
    const isSelected = selectedCameraId.value === camera.cameraId
    drawCamera(ctx, camera, isSelected)
  })
}

const drawGrid = (ctx: CanvasRenderingContext2D) => {
  if (!siteMapData.value) return

  const gridSize = siteMapData.value.scale // 1 meter in pixels

  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)'
  ctx.lineWidth = 1

  // Vertical lines
  for (let x = 0; x <= siteMapData.value.width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, siteMapData.value.height)
    ctx.stroke()
  }

  // Horizontal lines
  for (let y = 0; y <= siteMapData.value.height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(siteMapData.value.width, y)
    ctx.stroke()
  }
}

const drawFogOfWar = (ctx: CanvasRenderingContext2D, regions: FogOfWarRegion[]) => {
  regions.forEach(region => {
    if (region.polygon.length === 0) return

    ctx.fillStyle = 'rgba(100, 100, 100, 0.1)'
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 5])

    ctx.beginPath()
    ctx.moveTo(region.polygon[0].x, region.polygon[0].y)
    region.polygon.forEach((point, i) => {
      if (i > 0) {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.setLineDash([])
  })
}

const drawWalls = (ctx: CanvasRenderingContext2D, walls: Wall[]) => {
  walls.forEach(wall => {
    // Color based on wall type
    let color = '#666666'
    if (wall.type === 'external') color = '#333333'
    else if (wall.type === 'internal') color = '#555555'
    else if (wall.type === 'assumed') color = '#888888'

    // Adjust opacity based on confidence
    const opacity = wall.confidence ? wall.confidence : 1
    ctx.strokeStyle = color + Math.round(opacity * 255).toString(16).padStart(2, '0')
    ctx.lineWidth = 4

    ctx.beginPath()
    ctx.moveTo(wall.start.x, wall.start.y)
    ctx.lineTo(wall.end.x, wall.end.y)
    ctx.stroke()
  })
}

const drawCamera = (ctx: CanvasRenderingContext2D, camera: Camera, isSelected: boolean) => {
  const color = getColorHex(camera.color)

  // Draw FOV cone
  ctx.save()
  ctx.translate(camera.x, camera.y)
  ctx.rotate((camera.rotation * Math.PI) / 180)

  // FOV cone
  const viewDistance = camera.viewDistance
  const fovRad = (camera.fov * Math.PI) / 180

  ctx.fillStyle = color + '20' // 20 = ~12% opacity
  ctx.strokeStyle = color + '60' // 60 = ~38% opacity
  ctx.lineWidth = 1

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, viewDistance, -fovRad / 2, fovRad / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()

  // Draw camera icon
  const size = isSelected ? 20 : 16
  ctx.fillStyle = color
  ctx.strokeStyle = isSelected ? '#ffffff' : color
  ctx.lineWidth = isSelected ? 3 : 2

  ctx.beginPath()
  ctx.arc(camera.x, camera.y, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Draw direction indicator
  ctx.save()
  ctx.translate(camera.x, camera.y)
  ctx.rotate((camera.rotation * Math.PI) / 180)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(size / 4, 0)
  ctx.lineTo(-size / 4, -size / 4)
  ctx.lineTo(-size / 4, size / 4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Draw label
  if (showCameraLabels.value) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    ctx.fillText(camera.cameraId, camera.x, camera.y + size / 2 + 8)

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const delta = -event.deltaY
  const zoomIntensity = 0.001
  const zoom = Math.exp(delta * zoomIntensity)

  const newScale = Math.max(minScale, Math.min(maxScale, scale.value * zoom))

  if (newScale !== scale.value) {
    const scaleChange = newScale / scale.value
    offsetX.value = mouseX - (mouseX - offsetX.value) * scaleChange
    offsetY.value = mouseY - (mouseY - offsetY.value) * scaleChange
    scale.value = newScale
    drawMap()
  }
}

const handleMouseDown = (event: MouseEvent) => {
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
  if (!isDragging.value) return

  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  offsetX.value = dragStart.value.offsetX + dx
  offsetY.value = dragStart.value.offsetY + dy
  drawMap()
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
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

const fitToView = () => {
  const canvas = mapCanvas.value
  const container = canvasContainer.value
  if (!canvas || !container || !siteMapData.value) return

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const mapWidth = siteMapData.value.width
  const mapHeight = siteMapData.value.height

  if (containerWidth < 100 || containerHeight < 100) return

  const padding = 40
  const scaleX = (containerWidth - padding * 2) / mapWidth
  const scaleY = (containerHeight - padding * 2) / mapHeight
  const newScale = Math.max(minScale, Math.min(scaleX, scaleY, 1))

  scale.value = newScale
  offsetX.value = (containerWidth - mapWidth * newScale) / 2
  offsetY.value = (containerHeight - mapHeight * newScale) / 2

  drawMap()
}

watch([showGrid, showCameraLabels, showFogOfWar], () => {
  drawMap()
})

watch(selectedCameraId, () => {
  drawMap()
})

const handleResize = () => {
  fitToView()
}

onMounted(() => {
  loadSiteMap()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
