<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Detection History</h1>
      <div class="flex items-center space-x-4">
        <span class="text-sm text-muted-foreground">
          {{ detectionCount }} total detections
        </span>
        <button
          @click="refreshDetections"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-4 p-4 bg-card border rounded-lg">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Camera:</label>
        <select
          v-model="filters.cameraId"
          @change="applyFilters"
          class="px-3 py-1 border border-border rounded text-sm"
        >
          <option value="">All Cameras</option>
          <option v-for="camera in cameras" :key="camera.id" :value="camera.id">
            {{ camera.name }}
          </option>
        </select>
      </div>

      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Type:</label>
        <select
          v-model="filters.type"
          @change="applyFilters"
          class="px-3 py-1 border border-border rounded text-sm"
        >
          <option value="">All Types</option>
          <option value="person">Person</option>
          <option value="vehicle">Vehicle</option>
          <option value="animal">Animal</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Min Confidence:</label>
        <input
          v-model.number="filters.minConfidence"
          @change="applyFilters"
          type="range"
          min="0"
          max="1"
          step="0.1"
          class="w-32"
        />
        <span class="text-sm w-12">{{ (filters.minConfidence * 100).toFixed(0) }}%</span>
      </div>

      <button @click="clearFilters" class="px-3 py-1 border border-border rounded text-sm hover:bg-accent">
        Clear Filters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-card border rounded-lg p-4 animate-pulse">
        <div class="flex justify-between items-start">
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-muted rounded w-1/3"></div>
            <div class="h-3 bg-muted rounded w-1/2"></div>
            <div class="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div class="h-20 w-20 bg-muted rounded"></div>
        </div>
      </div>
    </div>

    <!-- Detections List -->
    <div v-else-if="filteredDetections.length > 0" class="space-y-4">
      <div
        v-for="detection in filteredDetections"
        :key="detection.id"
        class="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <!-- Detection Header -->
            <div class="flex items-center space-x-3 mb-2">
              <span :class="getTypeColor(detection.type)" class="px-2 py-1 text-xs font-medium rounded-full uppercase">
                {{ detection.type }}
              </span>
              <span class="text-sm font-medium">{{ getCameraName(detection.cameraId) }}</span>
              <span class="text-xs text-muted-foreground">{{ formatTime(detection.timestamp) }}</span>
            </div>

            <!-- Detection Details -->
            <div class="space-y-1 text-sm">
              <div class="flex items-center space-x-4">
                <span class="text-muted-foreground">Confidence:</span>
                <div class="flex items-center space-x-2">
                  <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      :style="{ width: `${detection.confidence * 100}%` }"
                      :class="getConfidenceColor(detection.confidence)"
                      class="h-full"
                    ></div>
                  </div>
                  <span class="font-mono">{{ (detection.confidence * 100).toFixed(1) }}%</span>
                </div>
              </div>

              <div v-if="detection.attributes" class="flex items-center space-x-4">
                <span class="text-muted-foreground">Attributes:</span>
                <div class="flex gap-2">
                  <span
                    v-for="(value, key) in detection.attributes"
                    :key="key"
                    class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {{ key }}: {{ value }}
                  </span>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <span class="text-muted-foreground">Bounding Box:</span>
                <span class="font-mono text-xs">
                  x:{{ detection.bbox.x.toFixed(0) }} y:{{ detection.bbox.y.toFixed(0) }} w:{{
                    detection.bbox.width.toFixed(0)
                  }}
                  h:{{ detection.bbox.height.toFixed(0) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Placeholder for detection snapshot -->
          <div class="ml-4 w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span class="text-gray-400 text-xs">No Image</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-semibold mb-2">No Detections Found</h3>
      <p class="text-muted-foreground mb-4">
        {{ hasFilters ? 'No detections match the current filters.' : 'No detections have been recorded.' }}
      </p>
      <button
        @click="hasFilters ? clearFilters() : refreshDetections()"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        {{ hasFilters ? 'Clear Filters' : 'Refresh' }}
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <p class="text-destructive font-medium">Error loading detections:</p>
      <p class="text-destructive text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDetectionStore } from '../stores/detections'
import { useCameraStore } from '../stores/cameras'

const detectionStore = useDetectionStore()
const cameraStore = useCameraStore()

const loading = computed(() => detectionStore.loading)
const error = computed(() => detectionStore.error)
const filteredDetections = computed(() => detectionStore.filteredDetections)
const detectionCount = computed(() => detectionStore.detectionCount)
const cameras = computed(() => cameraStore.cameras)

const filters = computed({
  get: () => detectionStore.filters,
  set: (value) => detectionStore.setFilters(value),
})

const hasFilters = computed(
  () => filters.value.cameraId || filters.value.type || filters.value.minConfidence > 0
)

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

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'bg-green-500'
  if (confidence >= 0.7) return 'bg-yellow-500'
  return 'bg-orange-500'
}

const getCameraName = (cameraId: string): string => {
  const camera = cameras.value.find((c) => c.id === cameraId)
  return camera ? camera.name : cameraId
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const refreshDetections = async () => {
  try {
    await detectionStore.fetchDetections({ limit: 50 })
  } catch (err) {
    console.error('Failed to load detections:', err)
  }
}

const applyFilters = () => {
  console.log('Applying filters:', filters.value)
}

const clearFilters = () => {
  detectionStore.clearFilters()
}

onMounted(() => {
  cameraStore.fetchCameras()
  refreshDetections()
})
</script>