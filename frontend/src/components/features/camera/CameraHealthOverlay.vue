<template>
  <div
    class="camera-health-overlay absolute top-2 right-2 z-10"
    :title="tooltipText"
  >
    <!-- Compact status dot -->
    <div
      class="w-3 h-3 rounded-full border border-white/50 shadow-sm"
      :class="dotClasses"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCameraHealthStore, type CameraStatus } from '@/stores/cameraHealth'

interface Props {
  /** Camera ID to display health for */
  cameraId: string
}

const props = defineProps<Props>()

const healthStore = useCameraHealthStore()

const health = computed(() => healthStore.getCameraHealth(props.cameraId))
const status = computed<CameraStatus>(() => health.value?.status ?? 'unknown')

const tooltipText = computed(() => {
  if (!health.value) return 'Status: Unknown'

  const statusText = status.value.charAt(0).toUpperCase() + status.value.slice(1)
  const lastSeen = health.value.lastSeenMs < 1000
    ? `${health.value.lastSeenMs}ms ago`
    : `${(health.value.lastSeenMs / 1000).toFixed(1)}s ago`

  return `${statusText} - Frame #${health.value.lastFrameNumber} (${lastSeen})`
})

const dotClasses = computed(() => ({
  'bg-green-500': status.value === 'online',
  'bg-yellow-500 animate-pulse': status.value === 'stale',
  'bg-red-500': status.value === 'offline',
  'bg-gray-500': status.value === 'unknown',
}))
</script>

<style scoped>
.camera-health-overlay {
  pointer-events: auto;
}
</style>
