<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { TrackVideoSegment } from '@/types/track-identity'
import type { Detection } from '@/types/frame-review'
import { normalizeBbox } from '@/types/frame-review'

const props = defineProps<{
  segment: TrackVideoSegment
  videoElement: HTMLVideoElement
  isActive: boolean
  getDetection?: (timestamp: number) => Detection | null
  personColor?: string
  containerSize?: { width: number; height: number }
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const progress = ref(0)
let animationId: number | null = null

// Canvas dimensions - fill container while maintaining aspect ratio
const canvasSize = computed(() => {
  const aspectRatio = props.segment.cropRegion.width / props.segment.cropRegion.height

  // Use container size if provided, otherwise fall back to defaults
  const maxWidth = props.containerSize?.width ?? 600
  const maxHeight = props.containerSize?.height ?? 600

  if (aspectRatio > 1) {
    // Landscape: fit to width
    const w = Math.min(maxWidth, maxHeight * aspectRatio)
    return { width: Math.round(w), height: Math.round(w / aspectRatio) }
  } else {
    // Portrait: fit to height
    const h = Math.min(maxHeight, maxWidth / aspectRatio)
    return { width: Math.round(h * aspectRatio), height: Math.round(h) }
  }
})

function drawFrame(): void {
  const canvas = canvasRef.value
  const video = props.videoElement
  const segment = props.segment

  if (!canvas || !video || video.readyState < 2) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const crop = segment.cropRegion
  const videoW = video.videoWidth
  const videoH = video.videoHeight

  // Source coordinates (from video)
  const sx = crop.left * videoW
  const sy = crop.top * videoH
  const sw = crop.width * videoW
  const sh = crop.height * videoH

  // Draw cropped region to canvas
  ctx.drawImage(
    video,
    sx, sy, sw, sh,
    0, 0, canvas.width, canvas.height
  )

  // Draw bounding box if detection callback is provided
  const detection = props.getDetection?.(video.currentTime)
  if (detection) {
    const bbox = normalizeBbox(detection.bbox)
    // Transform from video (normalized) coords to canvas coords, accounting for crop offset
    const bboxLeft = ((bbox.left - crop.left) / crop.width) * canvas.width
    const bboxTop = ((bbox.top - crop.top) / crop.height) * canvas.height
    const bboxWidth = ((bbox.right - bbox.left) / crop.width) * canvas.width
    const bboxHeight = ((bbox.bottom - bbox.top) / crop.height) * canvas.height

    ctx.strokeStyle = props.personColor ?? '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeRect(bboxLeft, bboxTop, bboxWidth, bboxHeight)
  }

  // Calculate progress
  const currentTime = video.currentTime
  const elapsed = currentTime - segment.startTimestamp
  progress.value = segment.duration > 0
    ? Math.max(0, Math.min(1, elapsed / segment.duration))
    : 0
}

function checkAndLoop(): void {
  const video = props.videoElement
  const segment = props.segment

  if (!video) return

  // If past end timestamp, loop back to start
  if (video.currentTime >= segment.endTimestamp) {
    video.currentTime = segment.startTimestamp
  }
}

function animate(): void {
  if (!props.isActive) return

  checkAndLoop()
  drawFrame()
  animationId = requestAnimationFrame(animate)
}

function startPlayback(): void {
  const video = props.videoElement
  const segment = props.segment

  if (!video) return

  // Seek to start of track
  video.currentTime = segment.startTimestamp
  video.play().catch(() => {
    // Autoplay may be blocked, that's ok
  })

  // Start render loop
  if (animationId) cancelAnimationFrame(animationId)
  animate()
}

function stopPlayback(): void {
  const video = props.videoElement
  if (video) video.pause()

  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Watch for segment changes
watch(() => props.segment, (newSegment, oldSegment) => {
  if (newSegment && props.isActive) {
    // Only restart if segment actually changed
    if (!oldSegment ||
        newSegment.cameraId !== oldSegment.cameraId ||
        newSegment.trackId !== oldSegment.trackId) {
      startPlayback()
    }
  }
})

// Watch for active state changes
watch(() => props.isActive, (isActive) => {
  if (isActive && props.segment) {
    startPlayback()
  } else {
    stopPlayback()
  }
})

onMounted(() => {
  if (props.isActive && props.segment) {
    startPlayback()
  }
})

onUnmounted(() => {
  stopPlayback()
})
</script>

<template>
  <div class="relative inline-block">
    <!-- Video canvas -->
    <canvas
      ref="canvasRef"
      :width="canvasSize.width"
      :height="canvasSize.height"
      class="rounded-lg border border-border bg-black"
    />

    <!-- Progress bar -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 rounded-b-lg overflow-hidden">
      <div
        class="h-full bg-primary transition-[width] duration-100"
        :style="{ width: `${progress * 100}%` }"
      />
    </div>

    <!-- Duration badge -->
    <div class="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
      {{ segment.duration.toFixed(1) }}s
    </div>
  </div>
</template>
