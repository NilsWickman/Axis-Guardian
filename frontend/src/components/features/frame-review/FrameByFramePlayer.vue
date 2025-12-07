<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type { Detection, FrameData } from '@/types/frame-review'

const props = defineProps<{
  videoSrc: string
  frameData: FrameData | null
  fps: number
}>()

const emit = defineEmits<{
  (e: 'timeupdate', time: number): void
  (e: 'loaded', event: { duration: number; width: number; height: number }): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const isVideoLoaded = ref(false)
const videoDimensions = ref({ width: 0, height: 0 })

// Track colors by track_id for consistent coloring
const trackColors = new Map<number, string>()
const colorPalette = [
  '#00ff00', // green
  '#ff6600', // orange
  '#00ffff', // cyan
  '#ff00ff', // magenta
  '#ffff00', // yellow
  '#ff0066', // pink
  '#66ff00', // lime
  '#0066ff', // blue
  '#ff3333', // red
  '#33ffcc', // teal
]

function getTrackColor(trackId: number): string {
  if (!trackColors.has(trackId)) {
    const colorIndex = trackColors.size % colorPalette.length
    trackColors.set(trackId, colorPalette[colorIndex])
  }
  return trackColors.get(trackId)!
}

// Seek to a specific frame
function seekToFrame(frameNumber: number): void {
  if (!videoRef.value || props.fps <= 0) return
  const time = frameNumber / props.fps
  videoRef.value.currentTime = time
  videoRef.value.pause()
}

// Get current frame number
const currentFrame = computed(() => {
  if (!videoRef.value || props.fps <= 0) return 0
  return Math.round(videoRef.value.currentTime * props.fps)
})

// Expose methods for parent
defineExpose({
  seekToFrame,
  get video() { return videoRef.value },
})

// Handle video loaded
function onVideoLoaded(): void {
  const video = videoRef.value
  if (!video) return

  isVideoLoaded.value = true
  videoDimensions.value = {
    width: video.videoWidth,
    height: video.videoHeight,
  }

  // Sync canvas size
  updateCanvasSize()

  // Pause video for frame-by-frame navigation
  video.pause()

  emit('loaded', {
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
  })
}

// Update canvas size to match video
function updateCanvasSize(): void {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  // Match the displayed size of the video
  const rect = video.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
}

// Handle video time updates
function onTimeUpdate(): void {
  if (!videoRef.value) return
  emit('timeupdate', videoRef.value.currentTime)
  drawDetections()
}

// Draw detection bounding boxes on canvas
function drawDetections(): void {
  const canvas = canvasRef.value
  const video = videoRef.value
  if (!canvas || !video) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const detections = props.frameData?.detections
  if (!detections || detections.length === 0) return

  // Draw each detection
  detections.forEach((detection: Detection) => {
    const { bbox, class_name, confidence, track_id } = detection

    // Convert normalized coordinates to pixel coordinates
    const x = bbox.left * canvas.width
    const y = bbox.top * canvas.height
    const width = (bbox.right - bbox.left) * canvas.width
    const height = (bbox.bottom - bbox.top) * canvas.height

    const color = getTrackColor(track_id)

    // Draw bounding box
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // Draw label background
    const label = `#${track_id} ${class_name} ${(confidence * 100).toFixed(0)}%`
    ctx.font = 'bold 12px monospace'
    const textMetrics = ctx.measureText(label)
    const textHeight = 16
    const padding = 4

    ctx.fillStyle = color
    ctx.fillRect(x, y - textHeight - padding, textMetrics.width + padding * 2, textHeight + padding)

    // Draw label text
    ctx.fillStyle = '#000'
    ctx.fillText(label, x + padding, y - padding - 2)
  })
}

// Watch for frame data changes and redraw
watch(() => props.frameData, () => {
  drawDetections()
}, { deep: true })

// Watch for video source changes
watch(() => props.videoSrc, () => {
  isVideoLoaded.value = false
  trackColors.clear()
})

// Handle window resize
function onResize(): void {
  updateCanvasSize()
  drawDetections()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full bg-black rounded-lg overflow-hidden">
    <!-- Video Element -->
    <video
      ref="videoRef"
      :src="videoSrc"
      class="w-full h-auto"
      muted
      playsinline
      preload="auto"
      @loadedmetadata="onVideoLoaded"
      @timeupdate="onTimeUpdate"
      @seeked="drawDetections"
    />

    <!-- Canvas Overlay -->
    <canvas
      ref="canvasRef"
      class="absolute top-0 left-0 w-full h-full pointer-events-none"
    />

    <!-- Loading State -->
    <div
      v-if="!isVideoLoaded && videoSrc"
      class="absolute inset-0 flex items-center justify-center bg-black/50"
    >
      <div class="text-white text-sm">Loading video...</div>
    </div>

    <!-- No Video State -->
    <div
      v-if="!videoSrc"
      class="aspect-video flex items-center justify-center bg-muted"
    >
      <div class="text-muted-foreground text-sm">Select a video file to begin</div>
    </div>
  </div>
</template>
