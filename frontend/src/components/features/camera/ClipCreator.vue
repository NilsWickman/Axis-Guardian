<template>
  <div class="mt-2 border rounded-lg bg-card overflow-hidden">
    <button
      @click="emit('update:open', !open)"
      class="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold hover:bg-accent transition-colors"
    >
      <span>{{ title }}</span>
      <span>{{ open ? '▼' : '▶' }}</span>
    </button>
    <div v-if="open" class="px-3 py-3 border-t text-xs space-y-3">
      <!-- Recording Controls -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <button
            v-if="!isRecording"
            @click="emit('start-recording')"
            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center space-x-1"
          >
            <span class="w-2 h-2 bg-white rounded-full"></span>
            <span>Start Recording</span>
          </button>
          <button
            v-else
            @click="emit('stop-recording')"
            class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors flex items-center space-x-1"
          >
            <span class="w-2 h-2 bg-white"></span>
            <span>Stop Recording</span>
          </button>
          <span v-if="isRecording" class="text-red-600 font-mono">
            {{ recordingDuration }}
          </span>
        </div>
        <button
          v-if="markers.length === 2"
          @click="emit('save-clip')"
          class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
        >
          Save Clip
        </button>
      </div>

      <!-- Timeline -->
      <div class="space-y-1">
        <div class="text-muted-foreground text-[10px]">{{ timelineLabel }}</div>
        <div class="relative h-12 bg-muted rounded overflow-hidden">
          <!-- Grid -->
          <div class="absolute inset-0 flex">
            <div
              v-for="i in 12"
              :key="i"
              class="flex-1 border-r border-border/30"
            ></div>
          </div>

          <!-- Markers -->
          <div
            v-for="(marker, index) in markers"
            :key="index"
            class="absolute top-0 bottom-0 w-0.5 bg-primary cursor-pointer"
            :style="{ left: `${marker}%` }"
          >
            <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-primary text-white text-[8px] px-1 rounded">
              {{ index === 0 ? 'Start' : 'End' }}
            </div>
          </div>

          <!-- Selected Region -->
          <div
            v-if="markers.length === 2"
            class="absolute top-0 bottom-0 bg-primary/20"
            :style="{ left: `${Math.min(...markers)}%`, width: `${Math.abs(markers[1] - markers[0])}%` }"
          ></div>

          <!-- Click area -->
          <div
            @click="handleTimelineClick"
            class="absolute inset-0 cursor-crosshair"
          ></div>
        </div>
        <div class="flex justify-between text-[9px] text-muted-foreground">
          <span>{{ timelineStartLabel }}</span>
          <span>{{ timelineMidLabel }}</span>
          <span>{{ timelineEndLabel }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between text-[10px]">
        <span class="text-muted-foreground">{{ statusText }}</span>
        <button
          v-if="markers.length > 0"
          @click="emit('clear-markers')"
          class="text-red-600 hover:text-red-700"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  isRecording: boolean
  recordingDuration: string
  markers: number[]
  title?: string
  timelineLabel?: string
  timelineStartLabel?: string
  timelineMidLabel?: string
  timelineEndLabel?: string
}>(), {
  title: 'Clip Creator',
  timelineLabel: 'Timeline (last 60s)',
  timelineStartLabel: '-60s',
  timelineMidLabel: '-30s',
  timelineEndLabel: 'Now'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'start-recording': []
  'stop-recording': []
  'save-clip': []
  'add-marker': [percentage: number]
  'clear-markers': []
}>()

const statusText = computed(() => {
  if (props.markers.length === 0) return 'Click timeline to mark clip start and end'
  if (props.markers.length === 1) return 'Mark clip end point'
  const duration = Math.abs(Math.round((props.markers[1] - props.markers[0]) * 0.6))
  return `Clip: ${duration}s`
})

const handleTimelineClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = (x / rect.width) * 100
  emit('add-marker', Math.max(0, Math.min(100, percentage)))
}
</script>
