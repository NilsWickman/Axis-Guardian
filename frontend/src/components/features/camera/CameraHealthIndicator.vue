<template>
  <div
    class="camera-health-indicator flex items-center gap-1.5"
    :title="tooltipText"
  >
    <!-- Status dot -->
    <div
      class="w-2 h-2 rounded-full flex-shrink-0"
      :class="dotClasses"
    />

    <!-- Camera name (optional) -->
    <span v-if="showName" class="text-xs font-medium truncate">
      {{ displayName }}
    </span>

    <!-- Frame info (optional) -->
    <span v-if="showFrame && health" class="text-xs text-gray-400">
      #{{ health.lastFrameNumber }}
    </span>

    <!-- Latency (optional) -->
    <span v-if="showLatency && health" class="text-xs" :class="latencyClasses">
      {{ formatLatency(health.lastSeenMs) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCameraHealthStore, type CameraHealthStatus, type CameraStatus } from '@/stores/cameraHealth'

interface Props {
  /** Camera ID to display health for */
  cameraId: string
  /** Show camera name */
  showName?: boolean
  /** Show frame number */
  showFrame?: boolean
  /** Show latency */
  showLatency?: boolean
  /** Custom display name (overrides cameraId) */
  displayName?: string
}

const props = withDefaults(defineProps<Props>(), {
  showName: false,
  showFrame: false,
  showLatency: false,
})

const healthStore = useCameraHealthStore()

const health = computed<CameraHealthStatus | undefined>(() =>
  healthStore.getCameraHealth(props.cameraId)
)

const status = computed<CameraStatus>(() =>
  health.value?.status ?? 'unknown'
)

const displayName = computed(() =>
  props.displayName ?? props.cameraId
)

const tooltipText = computed(() => {
  if (!health.value) return `${displayName.value}: Unknown`

  const statusText = status.value.charAt(0).toUpperCase() + status.value.slice(1)
  const latency = formatLatency(health.value.lastSeenMs)
  return `${displayName.value}: ${statusText} (${latency})`
})

const dotClasses = computed(() => ({
  'bg-green-500': status.value === 'online',
  'bg-yellow-500': status.value === 'stale',
  'bg-red-500': status.value === 'offline',
  'bg-gray-500': status.value === 'unknown',
}))

const latencyClasses = computed(() => {
  if (!health.value) return 'text-gray-400'
  if (health.value.lastSeenMs < 1000) return 'text-green-400'
  if (health.value.lastSeenMs < 3000) return 'text-yellow-400'
  return 'text-red-400'
})

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<style scoped>
.camera-health-indicator {
  user-select: none;
}
</style>
