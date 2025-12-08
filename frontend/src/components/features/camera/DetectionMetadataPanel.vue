<template>
  <div class="detection-metadata-panel text-xs">
    <!-- Header with stats -->
    <div class="flex justify-between items-center mb-1 px-1">
      <span class="text-muted-foreground">Detections</span>
      <span class="font-mono" :class="detectionCount > 0 ? 'text-green-400' : 'text-muted-foreground'">
        {{ detectionCount }}
      </span>
    </div>

    <!-- Bounding box list -->
    <div
      v-if="detections.length > 0"
      class="space-y-1 max-h-32 overflow-y-auto"
    >
      <div
        v-for="(det, idx) in detections"
        :key="det.track_id ?? idx"
        class="bg-background/50 rounded px-1.5 py-1 border border-border/50"
      >
        <!-- Detection header -->
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-1">
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getTrackColor(det.track_id) }"
            />
            <span class="font-medium text-foreground">
              {{ det.class_name }}
            </span>
            <span v-if="det.track_id !== undefined" class="text-muted-foreground">
              #{{ det.track_id }}
            </span>
          </div>
          <span
            class="font-mono"
            :class="getConfidenceClass(det.confidence)"
          >
            {{ (det.confidence * 100).toFixed(0) }}%
          </span>
        </div>

        <!-- Bounding box coordinates -->
        <div class="mt-0.5 font-mono text-muted-foreground grid grid-cols-2 gap-x-2">
          <span>L: {{ formatCoord(det.bbox.left) }}</span>
          <span>R: {{ formatCoord(det.bbox.right) }}</span>
          <span>T: {{ formatCoord(det.bbox.top) }}</span>
          <span>B: {{ formatCoord(det.bbox.bottom) }}</span>
        </div>

        <!-- Derived values -->
        <div class="mt-0.5 font-mono text-muted-foreground/70 flex gap-2">
          <span>W: {{ formatCoord(det.bbox.right - det.bbox.left) }}</span>
          <span>H: {{ formatCoord(det.bbox.bottom - det.bbox.top) }}</span>
          <span>Cx: {{ formatCoord((det.bbox.left + det.bbox.right) / 2) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center text-muted-foreground/50 py-2"
    >
      No detections
    </div>

    <!-- Frame info -->
    <div
      v-if="metadata"
      class="mt-1 pt-1 border-t border-border/30 font-mono flex justify-between"
      :class="isStale ? 'text-muted-foreground/40' : 'text-muted-foreground/70'"
    >
      <span>Frame: {{ metadata.frame_number }}</span>
      <span :class="isStale ? 'text-yellow-500/50' : ''">
        {{ formatTimestamp(metadata.timestamp) }}
        <span v-if="isStale" class="text-yellow-500/70"> (stale)</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Detection } from '@/types/detection.types'
import type { DetectionMetadata } from '@/composables/useMediasoupDetection'

interface Props {
  metadata: DetectionMetadata | null
}

const props = defineProps<Props>()

// Track current time for staleness detection
const now = ref(Date.now())
let staleCheckInterval: number | null = null

onMounted(() => {
  // Update current time every second for staleness check
  staleCheckInterval = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (staleCheckInterval) {
    clearInterval(staleCheckInterval)
  }
})

// Check if metadata is stale (more than 3 seconds old)
const isStale = computed(() => {
  if (!props.metadata?.timestamp) return false
  const metadataAge = now.value - props.metadata.timestamp * 1000
  return metadataAge > 3000
})

// Track colors matching globalTracks color palette
const TRACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'
]

const detections = computed<Detection[]>(() =>
  props.metadata?.detections ?? []
)

const detectionCount = computed(() =>
  props.metadata?.detection_count ?? 0
)

function getTrackColor(trackId: number | undefined): string {
  if (trackId === undefined) return '#6b7280'
  return TRACK_COLORS[trackId % TRACK_COLORS.length]
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-400'
  if (confidence >= 0.6) return 'text-yellow-400'
  return 'text-orange-400'
}

function formatCoord(value: number): string {
  return value.toFixed(3)
}

function formatTimestamp(ts: number): string {
  // Timestamp is in seconds
  const date = new Date(ts * 1000)
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.detection-metadata-panel {
  font-size: 0.65rem;
  line-height: 1.2;
}
</style>
