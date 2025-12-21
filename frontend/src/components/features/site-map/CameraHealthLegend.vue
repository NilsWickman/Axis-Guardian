<template>
  <div class="camera-health-legend bg-black/70 rounded-lg p-3 text-white text-sm">
    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-gray-600">
      <span class="font-semibold">Camera Status</span>
      <span class="text-xs text-gray-400">({{ cameras.length }})</span>
    </div>

    <!-- Camera list -->
    <div class="space-y-1.5 max-h-48 overflow-y-auto">
      <div
        v-for="camera in sortedCameras"
        :key="camera.cameraId"
        class="flex items-center gap-2"
      >
        <!-- Status dot -->
        <div
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="getStatusDotClass(camera.status)"
        />

        <!-- Camera name -->
        <span class="flex-1 truncate text-xs">
          {{ camera.cameraId }}
        </span>

        <!-- Frame number -->
        <span class="text-xs text-gray-400 tabular-nums">
          #{{ camera.lastFrameNumber }}
        </span>

        <!-- Latency -->
        <span class="text-xs tabular-nums w-12 text-right" :class="getLatencyClass(camera.lastSeenMs)">
          {{ formatLatency(camera.lastSeenMs) }}
        </span>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="cameras.length > 0" class="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
      <span class="text-green-400">{{ onlineCount }}</span> online
      <span v-if="staleCount > 0" class="ml-2">
        <span class="text-yellow-400">{{ staleCount }}</span> stale
      </span>
      <span v-if="offlineCount > 0" class="ml-2">
        <span class="text-red-400">{{ offlineCount }}</span> offline
      </span>
    </div>

    <!-- Empty state -->
    <div v-if="cameras.length === 0" class="text-xs text-gray-400 italic">
      No camera data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useCameraHealthStore, type CameraStatus } from '@/stores/cameraHealth'

const healthStore = useCameraHealthStore()

const cameras = computed(() => healthStore.allCameras)

// Sort cameras: online first, then stale, then offline
const sortedCameras = computed(() => {
  const statusOrder: Record<CameraStatus, number> = {
    online: 0,
    stale: 1,
    offline: 2,
    unknown: 3,
  }
  return [...cameras.value].sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status]
    if (orderDiff !== 0) return orderDiff
    return a.cameraId.localeCompare(b.cameraId)
  })
})

const onlineCount = computed(() => healthStore.onlineCameras.length)
const staleCount = computed(() => healthStore.staleCameras.length)
const offlineCount = computed(() => healthStore.offlineCameras.length)

function getStatusDotClass(status: CameraStatus): string {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'stale': return 'bg-yellow-500'
    case 'offline': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

function getLatencyClass(ms: number): string {
  if (ms < 1000) return 'text-green-400'
  if (ms < 3000) return 'text-yellow-400'
  return 'text-red-400'
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// Start polling when component mounts
onMounted(() => {
  healthStore.startPolling(5000)
})

// Stop polling when component unmounts
onUnmounted(() => {
  healthStore.stopPolling()
})
</script>

<style scoped>
.camera-health-legend {
  min-width: 200px;
}
</style>
