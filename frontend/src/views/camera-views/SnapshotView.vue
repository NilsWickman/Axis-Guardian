<template>
  <div class="snapshot-view">
    <div class="header">
      <h2>Camera Snapshots (Low Bandwidth Mode)</h2>
      <div class="controls">
        <label>
          Update Interval:
          <select v-model="updateInterval">
            <option :value="1000">1 second</option>
            <option :value="2000">2 seconds</option>
            <option :value="5000">5 seconds</option>
            <option :value="10000">10 seconds</option>
          </select>
        </label>
        <button @click="togglePolling" :class="{ active: isPolling }">
          {{ isPolling ? 'Stop' : 'Start' }} Updates
        </button>
      </div>
    </div>

    <div class="camera-grid">
      <div v-for="camera in cameras" :key="camera.id" class="camera-card">
        <div class="camera-header">
          <h3>{{ camera.name }}</h3>
          <span class="last-update">{{ camera.lastUpdate }}</span>
        </div>
        <div class="snapshot-container">
          <img
            v-if="camera.snapshotUrl"
            :src="camera.snapshotUrl"
            :alt="`${camera.name} snapshot`"
            @error="handleImageError(camera.id)"
            class="snapshot-image"
          />
          <div v-else-if="camera.loading" class="loading">
            Loading snapshot...
          </div>
          <div v-else-if="camera.error" class="error">
            {{ camera.error }}
          </div>
          <div v-else class="placeholder">
            No snapshot available
          </div>
        </div>
        <div class="camera-footer">
          <span class="bandwidth">~{{ camera.bandwidth }}KB/s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { config } from '@/config/environment'

interface CameraSnapshot {
  id: string
  name: string
  snapshotUrl: string | null
  lastUpdate: string
  loading: boolean
  error: string | null
  bandwidth: number
}

const WEBRTC_DETECTION_URL = config.rtspProxyUrl

const cameras = ref<CameraSnapshot[]>([
  { id: 'camera1', name: 'Camera 1 (HC3)', snapshotUrl: null, lastUpdate: '-', loading: false, error: null, bandwidth: 0 },
  { id: 'camera2', name: 'Camera 2 (HC4)', snapshotUrl: null, lastUpdate: '-', loading: false, error: null, bandwidth: 0 },
  { id: 'camera3', name: 'Camera 3 (IP2)', snapshotUrl: null, lastUpdate: '-', loading: false, error: null, bandwidth: 0 },
  { id: 'camera4', name: 'Camera 4 (IP5)', snapshotUrl: null, lastUpdate: '-', loading: false, error: null, bandwidth: 0 },
])

const updateInterval = ref(2000) // 2 seconds default
const isPolling = ref(false)
let pollIntervalId: number | null = null
const lastFetchSizes = new Map<string, number>()

const fetchSnapshot = async (camera: CameraSnapshot) => {
  camera.loading = true
  camera.error = null

  try {
    const startTime = performance.now()
    // Add timestamp to bust browser cache
    const timestamp = Date.now()
    const response = await fetch(`${WEBRTC_DETECTION_URL}/snapshot/${camera.id}?t=${timestamp}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    const fetchTime = performance.now() - startTime

    // Calculate bandwidth (KB/s)
    const sizeKB = blob.size / 1024
    const timeSec = fetchTime / 1000
    camera.bandwidth = Math.round(sizeKB / timeSec)

    // Store size for averaging
    lastFetchSizes.set(camera.id, blob.size)

    // Revoke old object URL to prevent memory leaks
    if (camera.snapshotUrl) {
      URL.revokeObjectURL(camera.snapshotUrl)
    }

    // Create new object URL
    camera.snapshotUrl = URL.createObjectURL(blob)
    camera.lastUpdate = new Date().toLocaleTimeString()
    camera.error = null
  } catch (err) {
    camera.error = err instanceof Error ? err.message : 'Failed to load snapshot'
    console.error(`Error fetching snapshot for ${camera.id}:`, err)
  } finally {
    camera.loading = false
  }
}

const fetchAllSnapshots = async () => {
  await Promise.all(cameras.value.map(camera => fetchSnapshot(camera)))
}

const togglePolling = () => {
  if (isPolling.value) {
    stopPolling()
  } else {
    startPolling()
  }
}

const startPolling = () => {
  if (pollIntervalId !== null) {
    return
  }

  isPolling.value = true

  // Fetch immediately
  fetchAllSnapshots()

  // Then poll at interval
  pollIntervalId = window.setInterval(() => {
    fetchAllSnapshots()
  }, updateInterval.value)
}

const stopPolling = () => {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId)
    pollIntervalId = null
  }
  isPolling.value = false
}

const handleImageError = (cameraId: string) => {
  const camera = cameras.value.find(c => c.id === cameraId)
  if (camera) {
    camera.error = 'Failed to load image'
  }
}

// Watch for interval changes and restart polling if active
watch(updateInterval, () => {
  if (isPolling.value) {
    stopPolling()
    startPolling()
  }
})

onMounted(() => {
  // Auto-start polling on mount
  startPolling()
})

onUnmounted(() => {
  stopPolling()

  // Cleanup object URLs
  cameras.value.forEach(camera => {
    if (camera.snapshotUrl) {
      URL.revokeObjectURL(camera.snapshotUrl)
    }
  })
})
</script>

<style scoped>
.snapshot-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.controls select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.controls button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.controls button:hover {
  background-color: #2563eb;
}

.controls button.active {
  background-color: #dc2626;
}

.controls button.active:hover {
  background-color: #b91c1c;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.camera-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.camera-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.last-update {
  font-size: 0.75rem;
  color: #6b7280;
}

.snapshot-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snapshot-image {
  width: 100%;
  height: auto;
  display: block;
}

.loading,
.error,
.placeholder {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.error {
  color: #dc2626;
}

.camera-footer {
  padding: 0.5rem 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.bandwidth {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
}
</style>
