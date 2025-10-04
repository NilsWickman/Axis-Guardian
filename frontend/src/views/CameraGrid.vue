<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Camera Grid</h1>
      <div class="flex items-center space-x-4">
        <span class="text-sm text-muted-foreground">
          {{ onlineCameras }}/{{ cameras.length }} cameras online
        </span>
        <button @click="refreshCameras"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-card border rounded-lg p-6 animate-pulse">
        <div class="h-48 bg-muted rounded-lg mb-4"></div>
        <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>

    <!-- Camera Grid -->
    <div v-else-if="cameras.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="camera in cameras" :key="camera.id"
           class="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">

        <!-- Camera Feed Placeholder -->
        <div class="relative h-48 bg-gray-900 flex items-center justify-center">
          <div class="text-center text-white">
            <div class="text-6xl mb-2">📹</div>
            <p class="text-sm">Live Feed</p>
            <p class="text-xs opacity-75">{{ camera.rtspUrl }}</p>
          </div>

          <!-- Status Indicator -->
          <div class="absolute top-3 right-3 flex items-center space-x-2 bg-black/50 px-2 py-1 rounded">
            <span :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
                  class="w-2 h-2 rounded-full"></span>
            <span class="text-white text-xs capitalize">{{ camera.status }}</span>
          </div>

          <!-- PTZ Indicator -->
          <div v-if="camera.capabilities?.ptz"
               class="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded">
            <span class="text-white text-xs">PTZ</span>
          </div>
        </div>

        <!-- Camera Info -->
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-lg">{{ camera.name }}</h3>
            <span class="text-sm text-muted-foreground">{{ camera.id }}</span>
          </div>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex justify-between">
              <span>Resolution:</span>
              <span>{{ camera.capabilities?.resolution || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between">
              <span>FPS:</span>
              <span>{{ camera.capabilities?.fps || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Analytics:</span>
              <span>{{ camera.capabilities?.analytics ? 'Enabled' : 'Disabled' }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 flex space-x-2">
            <button @click="viewCamera(camera)"
                    class="flex-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">
              View
            </button>
            <button @click="getSnapshot(camera)"
                    :disabled="camera.status !== 'online'"
                    class="px-3 py-2 border border-border text-sm rounded hover:bg-accent disabled:opacity-50">
              Snapshot
            </button>
            <button v-if="camera.capabilities?.ptz" @click="controlPTZ(camera)"
                    :disabled="camera.status !== 'online'"
                    class="px-3 py-2 border border-border text-sm rounded hover:bg-accent disabled:opacity-50">
              PTZ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">📹</div>
      <h3 class="text-xl font-semibold mb-2">No Cameras Found</h3>
      <p class="text-muted-foreground mb-4">No cameras are currently configured in the system.</p>
      <button @click="refreshCameras"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
        Refresh
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <p class="text-destructive font-medium">Error loading cameras:</p>
      <p class="text-destructive text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CameraApiClient } from '../api/clients/cameras'
import type { Camera } from '../types/generated'

const cameras = ref<Camera[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const cameraClient = new CameraApiClient()

const onlineCameras = computed(() =>
  cameras.value.filter(camera => camera.status === 'online').length
)

const refreshCameras = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await cameraClient.getCameras()
    cameras.value = data
    console.log('Loaded cameras:', data)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Failed to load cameras:', err)
  } finally {
    loading.value = false
  }
}

const viewCamera = (camera: Camera) => {
  // TODO: Open detailed camera view
  console.log('Viewing camera:', camera.name)
  alert(`Viewing camera: ${camera.name}\nStatus: ${camera.status}\nRTSP: ${camera.rtspUrl}`)
}

const getSnapshot = async (camera: Camera) => {
  try {
    console.log('Getting snapshot for:', camera.name)
    const blob = await cameraClient.getSnapshot(camera.id)

    // Create a download link for the snapshot
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${camera.name}-snapshot-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('Snapshot downloaded for:', camera.name)
  } catch (err) {
    console.error('Failed to get snapshot:', err)
    alert(`Failed to get snapshot: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

const controlPTZ = (camera: Camera) => {
  // TODO: Open PTZ control panel
  console.log('PTZ control for:', camera.name)
  alert(`PTZ Control for: ${camera.name}\nCapabilities: ${JSON.stringify(camera.capabilities?.ptz)}`)
}

onMounted(() => {
  refreshCameras()
})
</script>