<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-foreground mb-6">Analytics</h1>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Total Cameras -->
      <div class="bg-card border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Cameras</p>
            <p class="text-3xl font-bold mt-1">{{ cameraCount }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">📹</span>
          </div>
        </div>
        <div class="mt-4 text-sm">
          <span class="text-green-600">{{ onlineCount }} online</span>
          <span class="text-muted-foreground"> • </span>
          <span class="text-red-600">{{ offlineCount }} offline</span>
        </div>
      </div>

      <!-- Total Detections -->
      <div class="bg-card border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Detections</p>
            <p class="text-3xl font-bold mt-1">{{ detectionCount }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔍</span>
          </div>
        </div>
        <div class="mt-4 text-sm text-muted-foreground">Last 24 hours</div>
      </div>

      <!-- Active Alarms -->
      <div class="bg-card border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Active Alarms</p>
            <p class="text-3xl font-bold mt-1">{{ unacknowledgedAlarms }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🚨</span>
          </div>
        </div>
        <div class="mt-4 text-sm">
          <span class="text-red-600">{{ criticalAlarms }} critical</span>
        </div>
      </div>

      <!-- Active Tracks -->
      <div class="bg-card border rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Active Tracks</p>
            <p class="text-3xl font-bold mt-1">{{ activeTracksCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🎯</span>
          </div>
        </div>
        <div class="mt-4 text-sm text-muted-foreground">Currently tracking</div>
      </div>
    </div>

    <!-- Detection Type Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4">Detection Types</h2>
        <div class="space-y-4">
          <div v-for="stat in detectionTypeStats" :key="stat.type" class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span :class="stat.color" class="px-2 py-1 text-xs font-medium rounded-full uppercase">
                {{ stat.type }}
              </span>
              <span class="text-sm text-muted-foreground">{{ stat.count }} detections</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div :style="{ width: `${stat.percentage}%` }" :class="stat.bgColor" class="h-full"></div>
              </div>
              <span class="text-sm font-mono">{{ stat.percentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Alarm Severity Breakdown -->
      <div class="bg-card border rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4">Alarm Severity</h2>
        <div class="space-y-4">
          <div v-for="stat in alarmSeverityStats" :key="stat.severity" class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span :class="stat.color" class="px-2 py-1 text-xs font-medium rounded-full uppercase">
                {{ stat.severity }}
              </span>
              <span class="text-sm text-muted-foreground">{{ stat.count }} alarms</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div :style="{ width: `${stat.percentage}%` }" :class="stat.bgColor" class="h-full"></div>
              </div>
              <span class="text-sm font-mono">{{ stat.percentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-card border rounded-lg p-6">
      <h2 class="text-xl font-bold mb-4">Recent Activity</h2>
      <div class="space-y-3">
        <div v-for="detection in recentDetections.slice(0, 5)" :key="detection.id" class="flex items-center justify-between py-2 border-b last:border-b-0">
          <div class="flex items-center space-x-3">
            <span :class="getTypeColor(detection.type)" class="px-2 py-1 text-xs font-medium rounded-full">
              {{ detection.type }}
            </span>
            <span class="text-sm">{{ getCameraName(detection.cameraId) }}</span>
          </div>
          <div class="text-sm text-muted-foreground">{{ formatTime(detection.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCameraStore } from '../stores/cameras'
import { useAlarmStore } from '../stores/alarms'
import { useDetectionStore } from '../stores/detections'

const cameraStore = useCameraStore()
const alarmStore = useAlarmStore()
const detectionStore = useDetectionStore()

// Camera stats
const cameraCount = computed(() => cameraStore.cameraCount)
const onlineCount = computed(() => cameraStore.onlineCount)
const offlineCount = computed(() => cameraStore.cameras.length - cameraStore.onlineCount)

// Alarm stats
const unacknowledgedAlarms = computed(() => alarmStore.unacknowledgedCount)
const criticalAlarms = computed(() => alarmStore.criticalAlarms.length)

// Detection stats
const detectionCount = computed(() => detectionStore.detectionCount)
const activeTracksCount = computed(() => detectionStore.activeTracksCount)
const recentDetections = computed(() => detectionStore.recentDetections)

// Detection type breakdown
const detectionTypeStats = computed(() => {
  const types = ['person', 'vehicle', 'animal', 'unknown']
  const total = detectionStore.detections.length || 1

  return types.map((type) => {
    const count = detectionStore.detections.filter((d) => d.type === type).length
    const percentage = (count / total) * 100

    const colorMap = {
      person: { color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-500' },
      vehicle: { color: 'bg-purple-100 text-purple-800', bgColor: 'bg-purple-500' },
      animal: { color: 'bg-green-100 text-green-800', bgColor: 'bg-green-500' },
      unknown: { color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-500' },
    }

    return {
      type,
      count,
      percentage,
      color: colorMap[type as keyof typeof colorMap].color,
      bgColor: colorMap[type as keyof typeof colorMap].bgColor,
    }
  })
})

// Alarm severity breakdown
const alarmSeverityStats = computed(() => {
  const severities = ['critical', 'high', 'medium', 'low']
  const total = alarmStore.alarms.length || 1

  return severities.map((severity) => {
    const count = alarmStore.alarms.filter((a) => a.severity === severity).length
    const percentage = (count / total) * 100

    const colorMap = {
      critical: { color: 'bg-red-100 text-red-800', bgColor: 'bg-red-500' },
      high: { color: 'bg-orange-100 text-orange-800', bgColor: 'bg-orange-500' },
      medium: { color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-500' },
      low: { color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-500' },
    }

    return {
      severity,
      count,
      percentage,
      color: colorMap[severity as keyof typeof colorMap].color,
      bgColor: colorMap[severity as keyof typeof colorMap].bgColor,
    }
  })
})

const getTypeColor = (type: string) => {
  switch (type) {
    case 'person':
      return 'bg-blue-100 text-blue-800'
    case 'vehicle':
      return 'bg-purple-100 text-purple-800'
    case 'animal':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getCameraName = (cameraId: string): string => {
  const camera = cameraStore.cameras.find((c) => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  cameraStore.fetchCameras()
  alarmStore.fetchAlarms()
  detectionStore.fetchDetections()
})
</script>