<template>
  <div class="absolute inset-0 pointer-events-none">
    <svg
      v-if="videoWidth > 0 && videoHeight > 0"
      :width="containerWidth"
      :height="containerHeight"
      :viewBox="`0 0 ${videoWidth} ${videoHeight}`"
      preserveAspectRatio="xMidYMid slice"
      class="absolute top-0 left-0 w-full h-full"
    >
      <g
        v-for="(detection, index) in detections"
        :key="`${detection.timestamp}-${index}`"
      >
        <!-- Bounding box rectangle -->
        <rect
          :x="detection.bbox.x1"
          :y="detection.bbox.y1"
          :width="detection.bbox.width"
          :height="detection.bbox.height"
          :stroke="getClassColor(detection.class_name)"
          :stroke-width="strokeWidth"
          fill="none"
          stroke-linejoin="round"
        />

        <!-- Detection label background -->
        <rect
          :x="detection.bbox.x1"
          :y="detection.bbox.y1 - labelHeight"
          :width="getLabelWidth(detection)"
          :height="labelHeight"
          :fill="getClassColor(detection.class_name)"
          opacity="0.8"
        />

        <!-- Detection label text -->
        <text
          :x="detection.bbox.x1 + 4"
          :y="detection.bbox.y1 - 4"
          :font-size="fontSize"
          fill="white"
          font-weight="600"
          font-family="sans-serif"
        >
          {{ detection.class_name }} {{ Math.round(detection.confidence * 100) }}%
        </text>
      </g>
    </svg>

    <!-- Detection count badge -->
    <div
      v-if="detections.length > 0"
      class="absolute top-2 right-2 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-semibold pointer-events-auto"
    >
      {{ detections.length }} {{ detections.length === 1 ? 'detection' : 'detections' }}
    </div>

    <!-- MQTT connection indicator -->
    <div
      v-if="showConnectionStatus"
      class="absolute top-2 left-2 flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs pointer-events-auto"
    >
      <div
        class="w-2 h-2 rounded-full"
        :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
      ></div>
      <span>{{ isConnected ? 'Live' : 'Offline' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { Detection } from '@/types/detection.types'

const props = defineProps({
  detections: {
    type: Array as PropType<Detection[]>,
    required: true
  },
  videoWidth: {
    type: Number,
    required: true
  },
  videoHeight: {
    type: Number,
    required: true
  },
  containerWidth: {
    type: Number,
    required: true
  },
  containerHeight: {
    type: Number,
    required: true
  },
  showConnectionStatus: {
    type: Boolean,
    default: false
  },
  isConnected: {
    type: Boolean,
    default: false
  }
})

// Color mapping for different detection classes
const CLASS_COLORS: Record<string, string> = {
  person: '#4ade80',      // Green
  car: '#3b82f6',         // Blue
  truck: '#ef4444',       // Red
  bus: '#06b6d4',         // Cyan
  motorbike: '#ec4899',   // Pink
  bicycle: '#eab308',     // Yellow
  default: '#8b5cf6'      // Purple
}

/**
 * Get color for a detection class
 */
const getClassColor = (className: string): string => {
  return CLASS_COLORS[className.toLowerCase()] || CLASS_COLORS.default
}

/**
 * Calculate label width based on text content
 * Approximation: ~8px per character for font-size 14
 */
const getLabelWidth = (detection: Detection): number => {
  const text = `${detection.class_name} ${Math.round(detection.confidence * 100)}%`
  return Math.max(text.length * 8 + 8, 60)
}

// Responsive sizing based on video dimensions
const fontSize = computed(() => {
  const avgDim = (props.videoWidth + props.videoHeight) / 2
  return Math.max(Math.round(avgDim / 60), 12)
})

const labelHeight = computed(() => fontSize.value + 8)

const strokeWidth = computed(() => {
  const avgDim = (props.videoWidth + props.videoHeight) / 2
  return Math.max(Math.round(avgDim / 400), 2)
})
</script>
