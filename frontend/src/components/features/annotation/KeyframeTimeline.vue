<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  duration: number // Total duration in seconds
  currentTime: number // Current time in seconds
  intervalSeconds: number // Keyframe interval
  annotationCount: number // Total annotations at current keyframe
}>()

const emit = defineEmits<{
  seek: [timestamp: number]
  prevKeyframe: []
  nextKeyframe: []
}>()

// Compute keyframe positions
const keyframes = computed(() => {
  const result: number[] = []
  for (let t = 0; t < props.duration; t += props.intervalSeconds) {
    result.push(t)
  }
  return result
})

// Current keyframe index
const currentKeyframeIndex = computed(() => {
  return Math.floor(props.currentTime / props.intervalSeconds)
})

// Total keyframes
const totalKeyframes = computed(() => keyframes.value.length)

// Format time as MM:SS.ms
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
}

// Handle scrubber input
function onScrub(event: Event): void {
  const target = event.target as HTMLInputElement
  const time = parseFloat(target.value)
  emit('seek', time)
}

// Go to previous keyframe
function gotoPrevKeyframe(): void {
  emit('prevKeyframe')
}

// Go to next keyframe
function gotoNextKeyframe(): void {
  emit('nextKeyframe')
}

// Calculate marker position as percentage
function markerPosition(timestamp: number): string {
  if (props.duration === 0) return '0%'
  return `${(timestamp / props.duration) * 100}%`
}
</script>

<template>
  <div class="border-t border-border bg-card px-4 py-3">
    <!-- Controls row -->
    <div class="flex items-center gap-3">
      <!-- Prev button -->
      <button
        class="px-2 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent disabled:opacity-50"
        :disabled="currentKeyframeIndex === 0"
        title="Previous keyframe (←)"
        @click="gotoPrevKeyframe"
      >
        ◀ Prev
      </button>

      <!-- Timeline scrubber -->
      <div class="flex-1 relative">
        <!-- Keyframe markers -->
        <div class="absolute inset-x-0 top-0 h-1 pointer-events-none">
          <div
            v-for="(kf, idx) in keyframes"
            :key="idx"
            class="absolute w-0.5 h-full bg-primary/60"
            :style="{ left: markerPosition(kf) }"
          />
        </div>

        <!-- Range input -->
        <input
          class="w-full h-2 mt-1 cursor-pointer"
          type="range"
          :min="0"
          :max="duration"
          step="0.1"
          :value="currentTime"
          @input="onScrub"
        />
      </div>

      <!-- Next button -->
      <button
        class="px-2 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent disabled:opacity-50"
        :disabled="currentKeyframeIndex >= totalKeyframes - 1"
        title="Next keyframe (→)"
        @click="gotoNextKeyframe"
      >
        Next ▶
      </button>
    </div>

    <!-- Info row -->
    <div class="flex items-center justify-between mt-2 text-xs text-muted-foreground">
      <div class="font-mono">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>

      <div class="flex items-center gap-4">
        <span>
          Keyframe {{ currentKeyframeIndex + 1 }} / {{ totalKeyframes }}
        </span>
        <span class="text-foreground">
          {{ annotationCount }} annotations
        </span>
      </div>
    </div>
  </div>
</template>
