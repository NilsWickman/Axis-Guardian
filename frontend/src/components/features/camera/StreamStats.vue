<template>
  <div class="absolute top-2 right-2 pointer-events-none">
    <div class="text-white text-[10px] font-mono space-y-0.5 drop-shadow-lg">
      <div class="flex items-center space-x-1">
        <span class="opacity-70">Bitrate:</span>
        <span>{{ stats?.bitrate || '0.0' }} Mbps</span>
      </div>
      <div class="flex items-center space-x-1">
        <span class="opacity-70">Latency:</span>
        <span :class="latencyClass">
          {{ stats?.latency || '0' }} ms
        </span>
      </div>
      <div v-if="stats?.fps" class="flex items-center space-x-1">
        <span class="opacity-70">FPS:</span>
        <span>{{ stats.fps }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  stats?: {
    bitrate: string
    latency: number
    fps?: number
  }
  latencyThreshold?: number
}>(), {
  latencyThreshold: 100
})

const latencyClass = computed(() => {
  const latency = props.stats?.latency || 0
  return latency > props.latencyThreshold ? 'text-red-400' : 'text-green-400'
})
</script>
