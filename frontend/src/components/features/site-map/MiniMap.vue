<template>
  <div class="space-y-1 pt-3 border-t mt-3">
    <h4 class="text-[10px] font-semibold text-muted-foreground uppercase">{{ title }}</h4>
    <div class="border rounded-lg bg-gray-900 p-2">
      <canvas
        ref="miniMapCanvas"
        @click="handleClick"
        class="w-full cursor-pointer"
        :style="{ aspectRatio: aspectRatio }"
      ></canvas>
    </div>
    <p class="text-[9px] text-muted-foreground text-center">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { SiteMap } from '@/stores/siteMaps'

const props = withDefaults(defineProps<{
  siteMap: SiteMap
  scale: number
  offsetX: number
  offsetY: number
  viewportWidth: number
  viewportHeight: number
  getColorHex: (color: string) => string
  title?: string
  hint?: string
}>(), {
  title: 'Viewport Overview',
  hint: 'Click to navigate'
})

const emit = defineEmits<{
  navigate: [{ offsetX: number; offsetY: number }]
}>()

const miniMapCanvas = ref<HTMLCanvasElement | null>(null)

const aspectRatio = computed(() => {
  return props.siteMap ? `${props.siteMap.width} / ${props.siteMap.height}` : '1'
})

const drawMiniMap = () => {
  const canvas = miniMapCanvas.value
  if (!canvas || !props.siteMap) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height

  const mapWidth = props.siteMap.width
  const mapHeight = props.siteMap.height
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height

  const scaleX = canvasWidth / mapWidth
  const scaleY = canvasHeight / mapHeight
  const miniScale = Math.min(scaleX, scaleY)

  const offsetXMini = (canvasWidth - mapWidth * miniScale) / 2
  const offsetYMini = (canvasHeight - mapHeight * miniScale) / 2

  // Clear
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Map background
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(offsetXMini, offsetYMini, mapWidth * miniScale, mapHeight * miniScale)

  // Walls
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1
  props.siteMap.walls.forEach(wall => {
    ctx.beginPath()
    ctx.moveTo(offsetXMini + wall.x1 * miniScale, offsetYMini + wall.y1 * miniScale)
    ctx.lineTo(offsetXMini + wall.x2 * miniScale, offsetYMini + wall.y2 * miniScale)
    ctx.stroke()
  })

  // Cameras
  props.siteMap.cameras.forEach(camera => {
    const x = offsetXMini + camera.x * miniScale
    const y = offsetYMini + camera.y * miniScale

    ctx.fillStyle = props.getColorHex(camera.color)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  // Viewport rectangle
  const viewportX = -props.offsetX / props.scale
  const viewportY = -props.offsetY / props.scale

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(
    offsetXMini + viewportX * miniScale,
    offsetYMini + viewportY * miniScale,
    props.viewportWidth * miniScale,
    props.viewportHeight * miniScale
  )

  // Overlay outside viewport
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'

  // Top
  ctx.fillRect(offsetXMini, offsetYMini, mapWidth * miniScale, viewportY * miniScale)
  // Left
  ctx.fillRect(offsetXMini, offsetYMini + viewportY * miniScale, viewportX * miniScale, props.viewportHeight * miniScale)
  // Right
  const rightX = offsetXMini + (viewportX + props.viewportWidth) * miniScale
  const rightWidth = mapWidth * miniScale - (viewportX + props.viewportWidth) * miniScale
  ctx.fillRect(rightX, offsetYMini + viewportY * miniScale, rightWidth, props.viewportHeight * miniScale)
  // Bottom
  const bottomY = offsetYMini + (viewportY + props.viewportHeight) * miniScale
  const bottomHeight = mapHeight * miniScale - (viewportY + props.viewportHeight) * miniScale
  ctx.fillRect(offsetXMini, bottomY, mapWidth * miniScale, bottomHeight)
}

const handleClick = (event: MouseEvent) => {
  const canvas = miniMapCanvas.value
  if (!canvas || !props.siteMap) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  const mapWidth = props.siteMap.width
  const mapHeight = props.siteMap.height
  const canvasWidth = rect.width
  const canvasHeight = rect.height

  const scaleX = canvasWidth / mapWidth
  const scaleY = canvasHeight / mapHeight
  const miniScale = Math.min(scaleX, scaleY)

  const offsetXMini = (canvasWidth - mapWidth * miniScale) / 2
  const offsetYMini = (canvasHeight - mapHeight * miniScale) / 2

  // Convert to map coords
  const mapX = (clickX - offsetXMini) / miniScale
  const mapY = (clickY - offsetYMini) / miniScale

  // Center viewport on clicked position
  const newViewportX = mapX - props.viewportWidth / 2
  const newViewportY = mapY - props.viewportHeight / 2

  emit('navigate', {
    offsetX: -newViewportX * props.scale,
    offsetY: -newViewportY * props.scale
  })
}

watch([
  () => props.siteMap,
  () => props.scale,
  () => props.offsetX,
  () => props.offsetY,
  () => props.viewportWidth,
  () => props.viewportHeight
], drawMiniMap, { deep: true })

onMounted(drawMiniMap)

defineExpose({ drawMiniMap })
</script>
