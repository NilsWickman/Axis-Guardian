<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-foreground mb-6">Surveillance Dashboard</h1>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-card border rounded-lg p-6">
        <h3 class="text-sm font-medium text-muted-foreground">Active Cameras</h3>
        <p class="text-2xl font-bold text-foreground">{{ onlineCameras }}/{{ totalCameras }}</p>
        <p class="text-sm text-green-600">{{ Math.round((onlineCameras/totalCameras)*100) }}% Online</p>
      </div>

      <div class="bg-card border rounded-lg p-6">
        <h3 class="text-sm font-medium text-muted-foreground">Recent Detections</h3>
        <p class="text-2xl font-bold text-foreground">{{ recentDetections.length }}</p>
        <p class="text-sm text-muted-foreground">Last 24 hours</p>
      </div>

      <div class="bg-card border rounded-lg p-6">
        <h3 class="text-sm font-medium text-muted-foreground">Active Alarms</h3>
        <p class="text-2xl font-bold text-red-600">{{ unacknowledgedAlarms }}</p>
        <p class="text-sm text-muted-foreground">Needs attention</p>
      </div>

      <div class="bg-card border rounded-lg p-6">
        <h3 class="text-sm font-medium text-muted-foreground">System Status</h3>
        <p class="text-2xl font-bold text-green-600">Online</p>
        <p class="text-sm text-muted-foreground">All systems operational</p>
      </div>
    </div>

    <!-- Live Data Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Detections -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Recent Detections</h2>
        <div v-if="loading" class="text-center py-4">
          <p class="text-muted-foreground">Loading detections...</p>
        </div>
        <div v-else-if="recentDetections.length === 0" class="text-center py-4">
          <p class="text-muted-foreground">No recent detections</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="detection in recentDetections.slice(0, 5)" :key="detection.id"
               class="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p class="font-medium">{{ detection.type.toUpperCase() }}</p>
              <p class="text-sm text-muted-foreground">Camera: {{ getCameraName(detection.cameraId) }}</p>
              <p class="text-sm text-muted-foreground">{{ formatTime(detection.timestamp) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">{{ Math.round(detection.confidence * 100) }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Cameras -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Camera Status</h2>
        <div v-if="loadingCameras" class="text-center py-4">
          <p class="text-muted-foreground">Loading cameras...</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="camera in cameras" :key="camera.id"
               class="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p class="font-medium">{{ camera.name }}</p>
              <p class="text-sm text-muted-foreground">{{ camera.id }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
                    class="w-2 h-2 rounded-full"></span>
              <span class="text-sm font-medium capitalize">{{ camera.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WebSocket Status -->
    <div class="mt-8 bg-card border rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Real-time Connection</h2>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <span :class="wsConnected ? 'bg-green-500' : 'bg-red-500'"
                class="w-3 h-3 rounded-full"></span>
          <span class="font-medium">WebSocket: {{ wsConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <div class="text-sm text-muted-foreground">
          Live detections: {{ liveDetectionCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CameraApiClient } from '../api/clients/cameras'
import { DetectionApiClient } from '../api/clients/detections'
import type { Camera, Detection, Alarm } from '../types/generated'

const cameras = ref<Camera[]>([])
const recentDetections = ref<Detection[]>([])
const alarms = ref<Alarm[]>([])
const loading = ref(true)
const loadingCameras = ref(true)
const wsConnected = ref(false)
const liveDetectionCount = ref(0)

const cameraClient = new CameraApiClient()
const detectionClient = new DetectionApiClient()

const totalCameras = computed(() => cameras.value.length)
const onlineCameras = computed(() => cameras.value.filter(c => c.status === 'online').length)
const unacknowledgedAlarms = computed(() => alarms.value.filter(a => !a.acknowledged).length)

let ws: WebSocket | null = null

const getCameraName = (cameraId: string) => {
  const camera = cameras.value.find(c => c.id === cameraId)
  return camera?.name || cameraId
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:8000/ws')

  ws.onopen = () => {
    wsConnected.value = true
    console.log('Dashboard WebSocket connected')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'detection') {
      liveDetectionCount.value++
      // Add new detection to the beginning of the list
      recentDetections.value.unshift(data.payload)
      // Keep only the latest 20 detections
      if (recentDetections.value.length > 20) {
        recentDetections.value = recentDetections.value.slice(0, 20)
      }
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    console.log('Dashboard WebSocket disconnected')
    // Try to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000)
  }

  ws.onerror = (error) => {
    console.error('Dashboard WebSocket error:', error)
    wsConnected.value = false
  }
}

const loadData = async () => {
  try {
    // Load cameras
    loadingCameras.value = true
    const camerasData = await cameraClient.getCameras()
    cameras.value = camerasData
    loadingCameras.value = false

    // Load recent detections
    loading.value = true
    const detectionsData = await detectionClient.getDetections({ limit: 10 })
    recentDetections.value = detectionsData
    loading.value = false

    // Load alarms
    const alarmsData = await detectionClient.getAlarms({ limit: 20 })
    alarms.value = alarmsData

  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    loading.value = false
    loadingCameras.value = false
  }
}

onMounted(() => {
  loadData()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>