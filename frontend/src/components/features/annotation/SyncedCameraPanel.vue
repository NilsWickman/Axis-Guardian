<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { FileDetection, NormalizedBbox, KeyframeAnnotation } from '@/types/keyframe-annotation'
import { bboxToCorners } from '@/types/keyframe-annotation'

const props = defineProps<{
  cameraId: string
  cameraLabel: string
  videoUrl: string
  detections: FileDetection[]
  selectedTrackId: number | null
  annotations: KeyframeAnnotation[]
  getPersonColor: (personId: number) => string
  getTrackTruthPersonId?: (cameraId: string, trackId: number) => number | null
  highlightedPersonId?: number | null
}>()

const emit = defineEmits<{
  selectDetection: [cameraId: string, trackId: number, bbox: NormalizedBbox, confidence: number]
  videoReady: [cameraId: string, duration: number]
  timeUpdate: [currentTime: number]
}>()

// Template refs
const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// Video layout for coordinate conversion
const videoLayout = ref({ offsetX: 0, offsetY: 0, drawW: 0, drawH: 0 })

// Expose video element for parent to control
defineExpose({
  videoElement: videoRef,
})

// Calculate video layout (scale + offset for letterboxing)
function refreshVideoLayout(): void {
  const video = videoRef.value
  const container = containerRef.value
  if (!video || !container) return

  const containerW = container.clientWidth
  const containerH = container.clientHeight
  const videoW = video.videoWidth || 1920
  const videoH = video.videoHeight || 1080

  if (!containerW || !containerH) return

  const scale = Math.min(containerW / videoW, containerH / videoH)
  const drawW = videoW * scale
  const drawH = videoH * scale

  videoLayout.value = {
    offsetX: (containerW - drawW) / 2,
    offsetY: (containerH - drawH) / 2,
    drawW,
    drawH,
  }
}

// Handle video metadata loaded
function onLoadedMetadata(): void {
  const video = videoRef.value
  if (video) {
    emit('videoReady', props.cameraId, video.duration)
    refreshVideoLayout()
  }
}

// Handle time update (only from this video if it's the master)
function onTimeUpdate(): void {
  const video = videoRef.value
  if (video) {
    emit('timeUpdate', video.currentTime)
  }
}

// Get annotation for a detection (if exists)
function getAnnotationForTrack(trackId: number): KeyframeAnnotation | null {
  return props.annotations.find(
    (a) => a.cameraId === props.cameraId && a.trackId === trackId
  ) ?? null
}

// Get track truth person ID (from legacy TrackTruths.json)
function getTrackTruthPerson(trackId: number): number | null {
  if (!props.getTrackTruthPersonId) return null
  return props.getTrackTruthPersonId(props.cameraId, trackId)
}

// Get the effective person ID for a detection (annotation takes priority over track truth)
function getEffectivePersonId(trackId: number): number | null {
  const annotation = getAnnotationForTrack(trackId)
  if (annotation) return annotation.personId
  return getTrackTruthPerson(trackId)
}

// Check if detection belongs to highlighted person
function isHighlightedPerson(trackId: number): boolean {
  if (props.highlightedPersonId == null) return false
  const personId = getEffectivePersonId(trackId)
  return personId === props.highlightedPersonId
}

// Calculate style for a detection bbox
function bboxStyle(detection: FileDetection): Record<string, string> {
  const { offsetX, offsetY, drawW, drawH } = videoLayout.value
  const corner = bboxToCorners(detection.bbox)

  const left = offsetX + corner.left * drawW
  const top = offsetY + corner.top * drawH
  const width = (corner.right - corner.left) * drawW
  const height = (corner.bottom - corner.top) * drawH

  const isSelected = detection.track_id === props.selectedTrackId
  const isHighlighted = isHighlightedPerson(detection.track_id)
  const personId = getEffectivePersonId(detection.track_id)
  const color = personId !== null ? props.getPersonColor(personId) : '#ffffff'

  // Stronger highlight when person is selected in palette
  if (isHighlighted) {
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderColor: color,
      borderWidth: '4px',
      backgroundColor: `${color}40`, // 25% opacity fill
      boxShadow: `0 0 16px ${color}, 0 0 32px ${color}80`,
    }
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderColor: color,
    borderWidth: isSelected ? '3px' : '2px',
    backgroundColor: `${color}25`, // 15% opacity fill
    boxShadow: isSelected ? `0 0 8px ${color}` : `0 0 4px ${color}80`,
  }
}

// Handle clicking on a detection bbox
function onBboxClick(detection: FileDetection): void {
  emit('selectDetection', props.cameraId, detection.track_id, detection.bbox, detection.confidence)
}

// Resize observer for container
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      refreshVideoLayout()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// Refresh layout when video source changes
watch(() => props.videoUrl, () => {
  setTimeout(refreshVideoLayout, 100)
})
</script>

<template>
  <div class="rounded-lg border border-border bg-card overflow-hidden flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="px-3 py-1.5 border-b border-border flex items-center justify-between">
      <span class="text-xs font-semibold text-foreground">{{ cameraLabel }}</span>
      <span class="text-[10px] font-mono text-muted-foreground">{{ detections.length }} det</span>
    </div>

    <!-- Video container -->
    <div ref="containerRef" class="flex-1 bg-black relative overflow-hidden min-h-0">
      <video
        ref="videoRef"
        :src="videoUrl"
        class="w-full h-full object-contain"
        playsinline
        preload="auto"
        muted
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @resize="refreshVideoLayout"
      />

      <!-- Detection bboxes overlay -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="det in detections"
          :key="det.track_id"
          class="absolute border-2 cursor-pointer pointer-events-auto transition-all"
          :class="{
            'ring-2 ring-white ring-offset-1': det.track_id === selectedTrackId,
          }"
          :style="bboxStyle(det)"
          @click.stop="onBboxClick(det)"
        >
          <!-- Track ID label -->
          <div
            class="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap"
            :style="{
              backgroundColor: getEffectivePersonId(det.track_id) !== null
                ? getPersonColor(getEffectivePersonId(det.track_id)!)
                : 'rgba(0,0,0,0.7)',
              color: 'white',
            }"
          >
            #{{ det.track_id }}
            <span v-if="getEffectivePersonId(det.track_id) !== null" class="ml-1">
              P{{ getEffectivePersonId(det.track_id) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Camera ID badge -->
      <div class="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-mono">
        {{ cameraId }}
      </div>
    </div>
  </div>
</template>
