<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import type { SiteMap } from '@/composables/useSiteMapConfig'
import type { KeyframeAnnotation } from '@/types/keyframe-annotation'
import {
  extractValue,
  metersToPixels,
  metersToCanvasY,
  setMapHeight,
  RENDER_SCALE,
} from '@/utils/siteMapConversion'

const props = defineProps<{
  siteMap: SiteMap | null
  annotations: KeyframeAnnotation[]
  selectedAnnotationId: string | null
  getPersonColor: (personId: number) => string
}>()

const emit = defineEmits<{
  clickPosition: [x: number, y: number] // World coordinates in meters
}>()

// Canvas and container refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// Canvas options
const canvasOptions = ref<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: true,
  showCameraLabels: true,
  pixelsPerMeter: RENDER_SCALE,
})

// Use sitemap canvas composable
const canvas = useSiteMapCanvas(canvasRef, canvasOptions)

// Mouse position for hover display
const mouseWorldPos = ref<{ x: number; y: number } | null>(null)

// Container dimensions for scaling
const containerSize = ref({ width: 400, height: 300 })

// Canvas dimensions (full resolution)
const canvasWidth = computed(() => {
  if (!props.siteMap) return 400
  return metersToPixels(extractValue(props.siteMap.width))
})

const canvasHeight = computed(() => {
  if (!props.siteMap) return 300
  return metersToPixels(extractValue(props.siteMap.height))
})

// Scale factor to fit canvas in container
const canvasScale = computed(() => {
  if (!props.siteMap) return 1
  const scaleX = containerSize.value.width / canvasWidth.value
  const scaleY = containerSize.value.height / canvasHeight.value
  return Math.min(scaleX, scaleY, 1) // Don't scale up, only down
})

// Scaled canvas display dimensions
const scaledCanvasStyle = computed(() => ({
  width: `${canvasWidth.value * canvasScale.value}px`,
  height: `${canvasHeight.value * canvasScale.value}px`,
}))

// Update container size on resize
function updateContainerSize(): void {
  if (containerRef.value) {
    containerSize.value = {
      width: containerRef.value.clientWidth,
      height: containerRef.value.clientHeight,
    }
  }
}

// ResizeObserver for container
let resizeObserver: ResizeObserver | null = null

// Draw the sitemap
function drawSiteMap(): void {
  if (!props.siteMap || !canvasRef.value) return

  const mapHeight = extractValue(props.siteMap.height)
  setMapHeight(mapHeight)

  canvas.resizeCanvas(canvasWidth.value, canvasHeight.value)
  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawObstacles(props.siteMap.obstacles)
  canvas.drawWalls(props.siteMap.walls)

  // Draw cameras with FOVs
  const getCameraName = (id: string) => {
    const cam = props.siteMap!.cameras.find((c) => c.cameraId === id)
    return cam?.cameraId ?? id
  }
  for (const camera of props.siteMap.cameras) {
    canvas.drawCamera(
      camera,
      getCameraName,
      false, // not selected
      false, // not preview
      props.siteMap.walls,
      props.siteMap.obstacles
    )
  }

  // Draw annotation markers
  drawAnnotationMarkers()
}

// Draw annotation position markers on sitemap
function drawAnnotationMarkers(): void {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx || !props.siteMap) return

  // Note: setMapHeight is already called in drawSiteMap before this is called

  for (const ann of props.annotations) {
    if (!ann.worldPosition) continue

    const x = metersToPixels(ann.worldPosition.x)
    const y = metersToCanvasY(ann.worldPosition.y)
    const color = props.getPersonColor(ann.personId)
    const isSelected = ann.id === props.selectedAnnotationId

    // Draw marker circle
    ctx.beginPath()
    ctx.arc(x, y, isSelected ? 12 : 8, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#ffffff' : '#000000'
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.stroke()

    // Draw person ID label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ann.personId.toString(), x, y)
  }
}

// Convert canvas coordinates to world coordinates
function canvasToWorld(canvasX: number, canvasY: number): { x: number; y: number } {
  if (!props.siteMap) return { x: 0, y: 0 }

  const mapHeight = extractValue(props.siteMap.height)
  const worldX = canvasX / RENDER_SCALE
  const worldY = mapHeight - canvasY / RENDER_SCALE

  return { x: worldX, y: worldY }
}

// Handle canvas click
function onCanvasClick(event: MouseEvent): void {
  if (!canvasRef.value || !props.siteMap) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  const canvasX = (event.clientX - rect.left) * scaleX
  const canvasY = (event.clientY - rect.top) * scaleY

  const worldPos = canvasToWorld(canvasX, canvasY)
  emit('clickPosition', worldPos.x, worldPos.y)
}

// Handle mouse move for coordinate display
function onMouseMove(event: MouseEvent): void {
  if (!canvasRef.value || !props.siteMap) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  const canvasX = (event.clientX - rect.left) * scaleX
  const canvasY = (event.clientY - rect.top) * scaleY

  mouseWorldPos.value = canvasToWorld(canvasX, canvasY)
}

function onMouseLeave(): void {
  mouseWorldPos.value = null
}

// Redraw when sitemap or annotations change
watch(
  () => [props.siteMap, props.annotations, props.selectedAnnotationId],
  () => {
    drawSiteMap()
  },
  { deep: true }
)

// Redraw when container size changes
watch(containerSize, () => {
  drawSiteMap()
})

onMounted(() => {
  updateContainerSize()
  drawSiteMap()

  // Watch for container resize
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div class="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full">
    <!-- Header -->
    <div class="px-3 py-1.5 border-b border-border flex items-center justify-between">
      <span class="text-xs font-semibold text-foreground">Sitemap</span>
      <span v-if="mouseWorldPos" class="text-[10px] font-mono text-muted-foreground">
        ({{ mouseWorldPos.x.toFixed(2) }}, {{ mouseWorldPos.y.toFixed(2) }}) m
      </span>
      <span v-else class="text-[10px] text-muted-foreground">
        Click to set position
      </span>
    </div>

    <!-- Canvas container -->
    <div
      ref="containerRef"
      class="flex-1 relative overflow-hidden flex items-center justify-center"
      style="background-color: var(--canvas-background, #1a1a2e)"
    >
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        :style="scaledCanvasStyle"
        class="cursor-crosshair"
        @click="onCanvasClick"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      />

      <!-- Instructions overlay -->
      <div
        v-if="!siteMap"
        class="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm"
      >
        Loading sitemap...
      </div>
    </div>

    <!-- Legend -->
    <div class="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">
      {{ annotations.filter(a => a.worldPosition).length }} positions annotated
    </div>
  </div>
</template>
