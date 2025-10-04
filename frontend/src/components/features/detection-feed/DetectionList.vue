<template>
  <div class="detection-list space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-foreground">Live Detection Feed</h2>
      <div class="flex items-center space-x-2">
        <Badge :variant="isConnected ? 'default' : 'destructive'">
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </Badge>
        <Button @click="toggleConnection" size="sm">
          {{ isConnected ? 'Disconnect' : 'Connect' }}
        </Button>
      </div>
    </div>

    <div class="grid gap-4">
      <div v-if="detections.length === 0" class="text-center p-8 text-muted-foreground">
        <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Search class="w-8 h-8" />
        </div>
        No detections received yet
      </div>

      <DetectionCard
        v-for="detection in detections"
        :key="detection.id"
        :detection="detection"
        @view-camera="handleViewCamera"
        @create-alarm="handleCreateAlarm"
      />
    </div>

    <div v-if="detections.length > 0" class="text-center">
      <Button @click="loadMore" variant="outline" :disabled="loading">
        {{ loading ? 'Loading...' : 'Load More' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-vue-next'
import DetectionCard from './DetectionCard.vue'
import type { Detection } from '@/types/generated'
import { DetectionApiClient } from '@/api/clients/detections'
import { useWebSocket } from '@/composables/useWebSocket'

const detections = ref<Detection[]>([])
const loading = ref(false)
const isConnected = ref(false)

const detectionApi = new DetectionApiClient()
const { connect, disconnect, isConnected: wsConnected } = useWebSocket('/ws/detections')

// Real-time detection updates via WebSocket
const handleWebSocketMessage = (data: any) => {
  if (data.type === 'detection') {
    const newDetection = data.payload as Detection
    detections.value.unshift(newDetection)

    // Keep only last 50 detections for performance
    if (detections.value.length > 50) {
      detections.value = detections.value.slice(0, 50)
    }
  }
}

const toggleConnection = () => {
  if (isConnected.value) {
    disconnect()
    isConnected.value = false
  } else {
    connect(handleWebSocketMessage)
    isConnected.value = true
  }
}

const loadMore = async () => {
  loading.value = true
  try {
    const newDetections = await detectionApi.getDetections({
      offset: detections.value.length,
      limit: 20
    })
    detections.value.push(...newDetections)
  } catch (error) {
    console.error('Failed to load more detections:', error)
  } finally {
    loading.value = false
  }
}

const handleViewCamera = (cameraId: string) => {
  // Emit event to parent to switch to camera view
  emit('view-camera', cameraId)
}

const handleCreateAlarm = (detection: Detection) => {
  // Emit event to parent to create alarm from detection
  emit('create-alarm', detection)
}

const emit = defineEmits<{
  'view-camera': [cameraId: string]
  'create-alarm': [detection: Detection]
}>()

onMounted(async () => {
  // Load initial detections
  try {
    const initialDetections = await detectionApi.getDetections({ limit: 20 })
    detections.value = initialDetections
  } catch (error) {
    console.error('Failed to load initial detections:', error)
  }

  // Auto-connect to real-time feed
  toggleConnection()
})

onUnmounted(() => {
  if (isConnected.value) {
    disconnect()
  }
})
</script>