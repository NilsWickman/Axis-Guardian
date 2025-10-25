<template>
  <div
    :class="['quality-badge', qualityClass]"
    :title="tooltipText"
  >
    <div class="quality-indicator" />
    <span class="quality-text">{{ qualityLabel }}</span>
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

const props = defineProps<{
  connectionQuality?: ConnectionQuality
  connectionState?: RTCPeerConnectionState
}>()

/**
 * Calculate overall quality score (0-100) based on multiple metrics
 */
const qualityScore = computed(() => {
  if (!props.connectionQuality || props.connectionState !== 'connected') {
    return 0
  }

  const { packetLoss, jitter, roundTripTime, fps = 0, framesDropped, framesDecoded } = props.connectionQuality

  let score = 100

  // Packet loss penalty (up to -40 points)
  score -= Math.min(packetLoss * 4, 40)

  // Jitter penalty (up to -20 points)
  // Good: <30ms, Fair: 30-100ms, Poor: >100ms
  if (jitter > 100) {
    score -= 20
  } else if (jitter > 30) {
    score -= (jitter - 30) / 3.5 // Linear scale from 30-100ms
  }

  // RTT penalty (up to -20 points)
  // Good: <100ms, Fair: 100-250ms, Poor: >250ms
  if (roundTripTime > 250) {
    score -= 20
  } else if (roundTripTime > 100) {
    score -= (roundTripTime - 100) / 7.5 // Linear scale from 100-250ms
  }

  // FPS penalty (up to -15 points)
  // Good: >=25fps, Fair: 15-25fps, Poor: <15fps
  if (fps < 15) {
    score -= 15
  } else if (fps < 25) {
    score -= (25 - fps) * 1.5
  }

  // Frame drop ratio penalty (up to -5 points)
  if (framesDecoded > 0) {
    const dropRatio = framesDropped / framesDecoded
    score -= Math.min(dropRatio * 100, 5)
  }

  return Math.max(0, Math.min(100, score))
})

const qualityLabel = computed(() => {
  const score = qualityScore.value

  if (props.connectionState !== 'connected') {
    return 'Disconnected'
  }

  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
})

const qualityClass = computed(() => {
  const score = qualityScore.value

  if (props.connectionState !== 'connected') {
    return 'quality-disconnected'
  }

  if (score >= 80) return 'quality-excellent'
  if (score >= 60) return 'quality-good'
  if (score >= 40) return 'quality-fair'
  return 'quality-poor'
})

const tooltipText = computed(() => {
  if (!props.connectionQuality || props.connectionState !== 'connected') {
    return 'Connection not established'
  }

  const { packetLoss, jitter, roundTripTime, fps = 0 } = props.connectionQuality

  return `Quality Score: ${Math.round(qualityScore.value)}%
Packet Loss: ${packetLoss.toFixed(2)}%
Jitter: ${jitter}ms
RTT: ${roundTripTime}ms
FPS: ${fps}`
})
</script>

<style scoped>
.quality-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.quality-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.quality-text {
  line-height: 1;
}

/* Quality states */
.quality-excellent {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.quality-excellent .quality-indicator {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.quality-good {
  background: rgba(34, 197, 94, 0.12);
  color: #10b981;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.quality-good .quality-indicator {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.quality-fair {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.quality-fair .quality-indicator {
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  animation: pulse-warning 2s infinite;
}

.quality-poor {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.quality-poor .quality-indicator {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  animation: pulse-error 1.5s infinite;
}

.quality-disconnected {
  background: rgba(100, 116, 139, 0.15);
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.quality-disconnected .quality-indicator {
  background: #64748b;
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes pulse-error {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}
</style>
