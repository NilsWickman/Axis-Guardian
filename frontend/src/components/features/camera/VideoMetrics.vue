<template>
  <div class="video-metrics-overlay">
    <!-- FPS -->
    <div class="metric-row">
      <div class="metric-label">FPS:</div>
      <div class="metric-value" :class="getFpsClass()">
        {{ fps }}
      </div>
    </div>

    <!-- Latency -->
    <div class="metric-row">
      <div class="metric-label">Latency:</div>
      <div class="metric-value" :class="getLatencyClass()">
        {{ latency }}ms
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

// Color-coded quality indicators

// FPS: Good >= 25, Fair >= 15, Poor < 15
function getFpsClass(): string {
  const fpsValue = fps.value
  if (fpsValue >= 25) return 'quality-good'
  if (fpsValue >= 15) return 'quality-fair'
  return 'quality-poor'
}

// Latency: Good <= 100ms, Fair <= 250ms, Poor > 250ms
function getLatencyClass(): string {
  const latencyValue = latency.value
  if (latencyValue <= 100) return 'quality-good'
  if (latencyValue <= 250) return 'quality-fair'
  return 'quality-poor'
}
</script>

<style scoped>
.video-metrics-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #e2e8f0;
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  gap: 16px;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-label {
  color: #94a3b8;
  font-weight: 600;
}

.metric-value {
  font-weight: 700;
  min-width: 50px;
  text-align: right;
}

/* Quality-based colors */
.quality-good {
  color: #22c55e !important;
}

.quality-fair {
  color: #f59e0b !important;
}

.quality-poor {
  color: #ef4444 !important;
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
