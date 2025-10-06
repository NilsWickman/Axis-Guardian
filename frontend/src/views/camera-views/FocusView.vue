<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-sidebar-border">
      <h1 class="text-base font-bold text-foreground">Focus View</h1>
      <div class="flex items-center space-x-3">
        <span class="text-xs text-muted-foreground">
          {{ onlineCameras }}/{{ cameras.length }} cameras online
        </span>
        <button
          @click="compactMode = !compactMode"
          class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
          :class="compactMode ? 'bg-accent' : ''"
          title="Toggle Compact Mode"
        >
          {{ compactMode ? 'Expanded' : 'Compact' }}
        </button>
        <button
          v-if="selectedCamera"
          @click="popOutCamera"
          class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
          title="Pop Out Camera"
        >
          Pop Out
        </button>
        <button
          @click="refreshCameras"
          class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Main Layout: Primary Camera + Thumbnail Strip -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Primary Camera Feed -->
      <div class="flex-1 p-4">
        <CameraFeedDisplay
          :camera="selectedCamera"
          @video-ready="onVideoReady"
        >
          <template #overlays>
            <PersonOverlay
              v-for="overlay in currentOverlays"
              :key="overlay.id"
              :overlay="overlay"
              :container-width="containerWidth"
              :container-height="containerHeight"
            />
          </template>
        </CameraFeedDisplay>
      </div>

      <!-- Thumbnail Strip -->
      <div class="w-64 border-l bg-card p-2 overflow-y-auto">
        <h3 class="text-sm font-semibold mb-2 px-2">All Cameras</h3>
        <div class="space-y-2">
          <CameraThumbnail
            v-for="camera in cameras"
            :key="camera.id"
            :camera="camera"
            :is-selected="selectedCamera?.id === camera.id"
            @select="selectCamera"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Camera } from '../../types/generated'
import CameraFeedDisplay from '@/components/features/camera/CameraFeedDisplay.vue'
import CameraThumbnail from '@/components/features/camera/CameraThumbnail.vue'
import PersonOverlay from '@/components/features/camera/PersonOverlay.vue'
import { useCameraOverlays } from '@/composables/useCameraOverlays'

const cameras = ref<Camera[]>([])

const selectedCamera = ref<Camera | null>(null)

// Video refs for pop-out functionality
const videoRefs = ref<Record<string, HTMLVideoElement>>({})

// UI State
const compactMode = ref(false)

// Camera overlays
const { getOverlays } = useCameraOverlays()

// Container dimensions for overlay positioning
const containerWidth = ref(1920)
const containerHeight = ref(1080)

const onlineCameras = computed(() => cameras.value.filter(c => c.status === 'online').length)

const currentOverlays = computed(() => {
  if (!selectedCamera.value) return []
  return getOverlays(selectedCamera.value.id)
})

const selectCamera = (camera: Camera) => {
  selectedCamera.value = camera
}

const onVideoReady = (cameraId: string, videoElement: HTMLVideoElement) => {
  videoRefs.value[cameraId] = videoElement
}

// Fetch cameras from the mock server
const fetchCameras = async () => {
  try {
    const response = await fetch('http://localhost:8000/axis-cgi/cameras/list')
    if (response.ok) {
      const camerasData = await response.json()
      cameras.value = camerasData
      console.log('Loaded cameras:', camerasData)

      // Auto-select first camera if none selected
      if (!selectedCamera.value && camerasData.length > 0) {
        selectedCamera.value = camerasData[0]
      }
    } else {
      console.error('Failed to fetch cameras:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching cameras:', error)
  }
}

const refreshCameras = () => {
  // Reload cameras from server
  fetchCameras()
}

const takeSnapshot = () => {
  console.log('Taking snapshot of:', selectedCamera.value?.name)
  alert(`Snapshot taken of: ${selectedCamera.value?.name}`)
}

const popOutCamera = () => {
  if (!selectedCamera.value) return

  const width = 1280
  const height = 720
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2

  const popoutWindow = window.open(
    '',
    `camera-${selectedCamera.value.id}`,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes`
  )

  if (popoutWindow) {
    const cameraName = selectedCamera.value.name
    const cameraId = selectedCamera.value.id

    popoutWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cameraName} - Live Feed</title>
          <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; }
            video { width: 100vw; height: 100vh; object-fit: contain; }
            .overlay {
              position: absolute;
              top: 10px;
              left: 10px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 8px 12px;
              border-radius: 4px;
              font-family: sans-serif;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="overlay">${cameraName}</div>
          <video id="popout-video" autoplay muted playsinline></video>
          <script>
            // Request parent to send stream
            window.opener.postMessage({
              type: 'REQUEST_STREAM',
              cameraId: '${cameraId}'
            }, '*');

            // Listen for stream
            window.addEventListener('message', (event) => {
              if (event.data.type === 'STREAM_DATA' && event.data.cameraId === '${cameraId}') {
                const video = document.getElementById('popout-video');
                if (video && event.data.stream) {
                  video.srcObject = event.data.stream;
                }
              }
            });
          <` + `/script>
        </body>
      </html>
    `)
    popoutWindow.document.close()

    // Listen for stream requests
    window.addEventListener('message', (event) => {
      if (event.data.type === 'REQUEST_STREAM' && event.data.cameraId === selectedCamera.value?.id) {
        const videoElement = videoRefs.value[event.data.cameraId]
        if (videoElement && videoElement.srcObject) {
          popoutWindow.postMessage({
            type: 'STREAM_DATA',
            cameraId: event.data.cameraId,
            stream: videoElement.srcObject
          }, '*')
        }
      }
    })
  }
}

onMounted(async () => {
  // Fetch cameras from server
  await fetchCameras()
})
</script>
