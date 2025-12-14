<template>
  <div class="h-full w-full bg-background flex flex-col lg:flex-row overflow-hidden">
    <!-- Zone List Panel -->
    <div class="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col flex-shrink-0 max-h-[50vh] lg:max-h-none">
      <!-- Header -->
      <div class="p-4 border-b border-border flex items-center justify-between">
        <h2 class="text-lg font-semibold text-foreground">Zones</h2>
        <button
          @click="startDrawingZone"
          class="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4" />
          Add Zone
        </button>
      </div>

      <!-- Zone List -->
      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <div
          v-for="zone in zoneStore.zones"
          :key="zone.id"
          @click="selectZone(zone)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-all duration-200 border',
            selectedZone?.id === zone.id
              ? 'bg-accent border-primary'
              : 'bg-muted/50 border-transparent hover:bg-muted hover:border-border'
          ]"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: zone.color }"
              />
              <span class="font-medium text-sm text-foreground">{{ zone.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span
                :class="[
                  'px-1.5 py-0.5 text-xs rounded font-medium',
                  zone.enabled ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                ]"
              >
                {{ zone.enabled ? 'Active' : 'Disabled' }}
              </span>
            </div>
          </div>

          <!-- Zone Type Badge -->
          <div class="flex items-center gap-2 mb-2">
            <span
              :class="[
                'px-2 py-0.5 text-xs rounded-full font-medium',
                getZoneTypeBadgeClass(zone.type)
              ]"
            >
              {{ zone.type }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 text-xs rounded-full font-medium',
                getSeverityBadgeClass(zone.severity)
              ]"
            >
              {{ zone.severity }}
            </span>
          </div>

          <!-- Zone Metrics -->
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="bg-background/50 rounded p-1.5 text-center">
              <div class="text-muted-foreground">Inside</div>
              <div class="font-bold text-foreground">{{ getMetrics(zone.id).currentCount }}</div>
            </div>
            <div class="bg-background/50 rounded p-1.5 text-center">
              <div class="text-muted-foreground">Entered</div>
              <div class="font-bold text-foreground">{{ getMetrics(zone.id).totalEntered }}</div>
            </div>
            <div class="bg-background/50 rounded p-1.5 text-center">
              <div class="text-muted-foreground">Crossed</div>
              <div class="font-bold text-foreground">{{ getMetrics(zone.id).crossedCount }}</div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="zoneStore.zones.length === 0"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <ShieldAlert class="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p class="text-muted-foreground text-sm">No zones configured</p>
          <p class="text-muted-foreground/70 text-xs mt-1">Click "Add Zone" to create one</p>
        </div>
      </div>

      <!-- Selected Zone Actions -->
      <div v-if="selectedZone" class="p-3 border-t border-border bg-muted/30">
        <div class="flex items-center gap-2">
          <button
            @click="toggleZone(selectedZone)"
            :class="[
              'flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors',
              selectedZone.enabled
                ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
            ]"
          >
            {{ selectedZone.enabled ? 'Disable' : 'Enable' }}
          </button>
          <button
            @click="startEditingZone(selectedZone)"
            class="px-3 py-1.5 text-sm font-medium rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            @click="deleteZone(selectedZone)"
            class="px-3 py-1.5 text-sm font-medium rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Map Canvas Area -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
      <div
        class="flex-1 relative overflow-hidden"
        style="background-color: var(--canvas-background)"
        ref="canvasContainer"
        @click="handleCanvasClick"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <canvas
          ref="mapCanvas"
          :style="canvasStyle"
        ></canvas>

        <!-- Drawing Instructions -->
        <div
          v-if="isDrawingMode"
          class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg"
        >
          Click to add points. {{ drawingVertices.length >= 3 ? 'Click first point or press Enter to close.' : `Need ${3 - drawingVertices.length} more points.` }}
          <button @click="cancelDrawing" class="ml-3 underline">Cancel</button>
        </div>

        <!-- Mouse Position -->
        <div
          v-if="mousePosition && isMouseOverMap"
          class="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap font-mono"
          :style="{
            left: `${mouseScreenPos.x + 12}px`,
            top: `${mouseScreenPos.y - 8}px`,
            zIndex: 20
          }"
        >
          X: {{ mousePosition.x.toFixed(2) }}m, Y: {{ mousePosition.y.toFixed(2) }}m
        </div>

        <!-- Loading State -->
        <div
          v-if="!currentMap"
          class="absolute inset-0 flex items-center justify-center"
          style="background-color: var(--canvas-background)"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading site map...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Zone Creation Dialog -->
    <div
      v-if="showCreateDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreateDialog = false"
    >
      <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-foreground mb-4">Create Zone</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              v-model="newZone.name"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Zone name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              v-model="newZone.type"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="restricted">Restricted</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="monitored">Monitored</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Severity</label>
            <select
              v-model="newZone.severity"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showCreateDialog = false"
            class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createZone"
            :disabled="!newZone.name"
            class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Zone Edit Dialog -->
    <div
      v-if="showEditDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showEditDialog = false"
    >
      <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-foreground mb-4">Edit Zone</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              v-model="editZone.name"
              type="text"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Zone name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              v-model="editZone.type"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="restricted">Restricted</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="monitored">Monitored</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Severity</label>
            <select
              v-model="editZone.severity"
              class="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showEditDialog = false"
            class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveZone"
            :disabled="!editZone.name"
            class="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Plus, Trash2, ShieldAlert, Pencil } from 'lucide-vue-next'
import { useZoneStore, type ZoneConfig, type ZoneType, type ZoneSeverity } from '@/stores/zones'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import { useTrackingServiceWebSocket } from '@/composables/useTrackingServiceWebSocket'
import { useTheme } from '@/composables/useTheme'
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'

const zoneStore = useZoneStore()
const { siteMap: currentMap, loadSiteMap } = useSiteMapConfig()
const { currentTheme } = useTheme()

// Canvas refs
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)

// Canvas options - no scale reference ruler on zones page
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: false,
  showCameraLabels: false,
  pixelsPerMeter: RENDER_SCALE
})

// Initialize canvas composable
const canvas = useSiteMapCanvas(mapCanvas, ref(canvasOptions))

// WebSocket connection
const trackingWs = useTrackingServiceWebSocket({
  autoReconnect: true,
  reconnectIntervalMs: 3000,
})

// Canvas transform state
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

// Zone selection and editing
const selectedZone = ref<ZoneConfig | null>(null)
const isDrawingMode = ref(false)
const drawingVertices = ref<{ x: number; y: number }[]>([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)

const newZone = reactive({
  name: '',
  type: 'restricted' as ZoneType,
  severity: 'medium' as ZoneSeverity,
})

const editZone = reactive({
  id: '',
  name: '',
  type: 'restricted' as ZoneType,
  severity: 'medium' as ZoneSeverity,
})

// Mouse position tracking
const mousePosition = ref<{ x: number; y: number } | null>(null)
const mouseScreenPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const isMouseOverMap = ref(false)

// Zone type colors
const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  restricted: '#ef4444',
  entry: '#22c55e',
  exit: '#f97316',
  monitored: '#3b82f6',
}

// Helper functions
const getMetrics = (zoneId: string) => {
  return zoneStore.getMetrics(zoneId) || { currentCount: 0, totalEntered: 0, crossedCount: 0 }
}

const getZoneTypeBadgeClass = (type: ZoneType) => {
  const classes: Record<ZoneType, string> = {
    restricted: 'bg-red-500/20 text-red-500',
    entry: 'bg-green-500/20 text-green-500',
    exit: 'bg-orange-500/20 text-orange-500',
    monitored: 'bg-blue-500/20 text-blue-500',
  }
  return classes[type]
}

const getSeverityBadgeClass = (severity: ZoneSeverity) => {
  const classes: Record<ZoneSeverity, string> = {
    low: 'bg-slate-500/20 text-slate-400',
    medium: 'bg-yellow-500/20 text-yellow-500',
    high: 'bg-orange-500/20 text-orange-500',
    critical: 'bg-red-500/20 text-red-500',
  }
  return classes[severity]
}

const selectZone = (zone: ZoneConfig) => {
  selectedZone.value = zone
  drawMap()
}

const startDrawingZone = () => {
  isDrawingMode.value = true
  drawingVertices.value = []
  selectedZone.value = null
}

const cancelDrawing = () => {
  isDrawingMode.value = false
  drawingVertices.value = []
  drawMap()
}

const handleCanvasClick = (event: MouseEvent) => {
  if (!isDrawingMode.value || !currentMap.value) return

  const container = canvasContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const canvasX = (mouseX - offsetX.value) / scale.value
  const canvasY = (mouseY - offsetY.value) / scale.value

  const worldX = canvasX / RENDER_SCALE
  const worldY = canvasY / RENDER_SCALE

  // Check if clicking near first point to close polygon
  if (drawingVertices.value.length >= 3) {
    const first = drawingVertices.value[0]
    const distance = Math.sqrt((worldX - first.x) ** 2 + (worldY - first.y) ** 2)
    if (distance < 0.5) {
      // Close polygon and show create dialog
      isDrawingMode.value = false
      showCreateDialog.value = true
      return
    }
  }

  drawingVertices.value.push({ x: worldX, y: worldY })
  drawMap()
}

const createZone = async () => {
  if (!newZone.name || drawingVertices.value.length < 3) return

  const siteConfigId = currentMap.value?.id || 'default'

  await zoneStore.createZone({
    siteConfigId,
    name: newZone.name,
    type: newZone.type,
    severity: newZone.severity,
    vertices: drawingVertices.value,
    enabled: true,
    color: ZONE_TYPE_COLORS[newZone.type],
    cooldownMs: 5000,
  })

  // Reset
  showCreateDialog.value = false
  drawingVertices.value = []
  newZone.name = ''
  newZone.type = 'restricted'
  newZone.severity = 'medium'
  drawMap()
}

const toggleZone = async (zone: ZoneConfig) => {
  await zoneStore.toggleZone(zone.id)
  drawMap()
}

const startEditingZone = (zone: ZoneConfig) => {
  editZone.id = zone.id
  editZone.name = zone.name
  editZone.type = zone.type
  editZone.severity = zone.severity
  showEditDialog.value = true
}

const saveZone = async () => {
  if (!editZone.name || !editZone.id) return

  await zoneStore.updateZone(editZone.id, {
    name: editZone.name,
    type: editZone.type,
    severity: editZone.severity,
    color: ZONE_TYPE_COLORS[editZone.type],
  })

  showEditDialog.value = false

  // Update selected zone reference if it was edited
  if (selectedZone.value?.id === editZone.id) {
    selectedZone.value = zoneStore.getZoneById(editZone.id) || null
  }

  drawMap()
}

const deleteZone = async (zone: ZoneConfig) => {
  if (confirm(`Delete zone "${zone.name}"?`)) {
    await zoneStore.deleteZone(zone.id)
    selectedZone.value = null
    drawMap()
  }
}

// Mouse handlers
const handleMouseMove = (event: MouseEvent) => {
  const container = canvasContainer.value
  if (!container || !currentMap.value) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  mouseScreenPos.value = { x: mouseX, y: mouseY }

  const canvasX = (mouseX - offsetX.value) / scale.value
  const canvasY = (mouseY - offsetY.value) / scale.value

  const worldX = canvasX / RENDER_SCALE
  const worldY = canvasY / RENDER_SCALE

  const mapWidth = extractValue(currentMap.value.width)
  const mapHeight = extractValue(currentMap.value.height)

  if (worldX >= 0 && worldX <= mapWidth && worldY >= 0 && worldY <= mapHeight) {
    mousePosition.value = { x: worldX, y: worldY }
    isMouseOverMap.value = true
  } else {
    isMouseOverMap.value = false
  }
}

const handleMouseLeave = () => {
  isMouseOverMap.value = false
  mousePosition.value = null
}

// Draw map
const drawMap = () => {
  if (!currentMap.value) return

  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawObstacles(currentMap.value.obstacles)
  canvas.drawWalls(currentMap.value.walls)

  // Draw zones with selection highlighting
  if (zoneStore.zones.length > 0) {
    canvas.drawZones(
      zoneStore.zones,
      null,
      selectedZone.value?.id || null,
      true,
      zoneStore.zoneMetrics
    )
  }

  // Draw zone being created
  if (isDrawingMode.value && drawingVertices.value.length > 0) {
    canvas.drawZonePreview(drawingVertices.value, newZone.type, undefined, mousePosition.value ?? undefined)
  }

  // Draw cameras (simplified, no FOV)
  currentMap.value.cameras.forEach(camera => {
    canvas.drawCamera(camera, (id) => id, false, false, currentMap.value!.walls, currentMap.value!.obstacles, [])
  })
}

// Resize handlers
const resizeCanvas = () => {
  if (!currentMap.value) return

  const widthPixels = metersToPixels(extractValue(currentMap.value.width))
  const heightPixels = metersToPixels(extractValue(currentMap.value.height))

  canvas.resizeCanvas(widthPixels, heightPixels)
  drawMap()
}

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
  const newScale = Math.min(scaleX, scaleY)

  scale.value = newScale

  const scaledWidth = mapWidth * newScale
  const scaledHeight = mapHeight * newScale

  offsetX.value = (containerWidth - scaledWidth) / 2
  offsetY.value = (containerHeight - scaledHeight) / 2
}

const handleResize = () => {
  resizeCanvas()
  fitToView()
}

// Keyboard handler for closing polygon and dialogs
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && isDrawingMode.value && drawingVertices.value.length >= 3) {
    isDrawingMode.value = false
    showCreateDialog.value = true
  } else if (event.key === 'Escape') {
    cancelDrawing()
    showCreateDialog.value = false
    showEditDialog.value = false
  }
}

// Watchers
watch(currentMap, async (newMap) => {
  if (newMap) {
    await nextTick()
    fitToView()
    await nextTick()
    resizeCanvas()
  }
})

watch(currentTheme, () => {
  if (currentMap.value) {
    drawMap()
  }
})

watch(() => zoneStore.zones, () => {
  if (currentMap.value) {
    drawMap()
  }
}, { deep: true })

watch(() => zoneStore.zoneMetrics, () => {
  if (currentMap.value) {
    drawMap()
  }
}, { deep: true })

onMounted(async () => {
  if (!canvas.initCanvas()) return

  await loadSiteMap()
  await zoneStore.fetchZones()

  if (currentMap.value) {
    fitToView()
    resizeCanvas()
    drawMap()
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)

  trackingWs.connect()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  trackingWs.disconnect()
})
</script>
