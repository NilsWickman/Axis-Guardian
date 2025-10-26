<template>
  <div class="video-metrics-overlay">
    <span class="metric-text">{{ fps }} FPS</span>
    <span class="metric-separator">|</span>
    <span class="metric-text">{{ latency }}ms</span>
    <!-- Debug: show raw values -->
    <span v-if="false" style="font-size: 10px; color: red;">
      (cq.fps={{ connectionQuality?.fps }}, stats.latency={{ stats?.latencyMs }})
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface ConnectionQuality {
  packetLoss: number
  jitter: number
  roundTripTime: number
  bitrate: number
  framesDropped: number
  framesDecoded: number
  fps?: number
  timestamp: number
}

interface Stats {
  framesReceived: number
  detectionsReceived: number
  avgDetectionsPerFrame: number
  lastUpdateTime: number
  droppedStaleDetections: number
  latencyMs: number
}

const props = defineProps<{
  cameraId: string
  connectionQuality?: ConnectionQuality
  stats?: Stats
  connectionState?: RTCPeerConnectionState
}>()

// Computed metrics with fallbacks
const fps = computed(() => props.connectionQuality?.fps || 0)
const latency = computed(() => Math.round(props.stats?.latencyMs || 0))

// Debug: Watch for changes (throttled to once per 2 seconds)
let lastLogTime = 0
watch([() => props.connectionQuality, () => props.stats], ([cq, st]) => {
  const now = Date.now()
  if (now - lastLogTime > 2000) {
    console.log(`[VideoMetrics] ${props.cameraId} - connectionQuality:`, cq, 'stats:', st)
    lastLogTime = now
  }
}, { immediate: true })

// Also log on mount
console.log(`[VideoMetrics] ${props.cameraId} - MOUNTED with connectionQuality:`, props.connectionQuality, 'stats:', props.stats)
</script>

<style scoped>
.video-metrics-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #94a3b8;
  z-index: 10;
  display: flex;
  gap: 8px;
  align-items: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.metric-text {
  font-weight: 500;
}

.metric-separator {
  opacity: 0.5;
}
</style>
