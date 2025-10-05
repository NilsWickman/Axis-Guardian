<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 border-b">
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
          :stream-ready="selectedCamera ? streamReady[selectedCamera.id] : false"
        >
          <template #overlays>
            <!-- Alert Indicators -->
            <CameraAlerts
              v-if="selectedCamera"
              :alerts="activeAlerts[selectedCamera.id]"
            />

            <!-- Bitrate/Latency Display (Top Right) -->
            <StreamStats
              v-if="selectedCamera && !compactMode"
              :stats="streamStats[selectedCamera.id]"
            />
          </template>
        </CameraFeedDisplay>

        <!-- Metadata Panel (Collapsible) -->
        <CameraMetadataPanel
          v-if="selectedCamera && selectedCamera.capabilities?.analytics && !compactMode"
          v-model:open="metadataPanelOpen"
          :metadata="cameraMetadata[selectedCamera.id]"
        />

        <!-- Clip Creator (Collapsible) -->
        <ClipCreator
          v-if="selectedCamera && !compactMode"
          v-model:open="clipCreatorOpen"
          :is-recording="isRecording"
          :recording-duration="recordingDuration"
          :markers="clipMarkers"
          @start-recording="startRecording"
          @stop-recording="stopRecording"
          @save-clip="saveClip"
          @add-marker="addClipMarker"
          @clear-markers="clipMarkers = []"
        />
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
            :stream-ready="streamReady[camera.id]"
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
import CameraAlerts from '@/components/features/camera/CameraAlerts.vue'
import StreamStats from '@/components/features/camera/StreamStats.vue'
import CameraMetadataPanel from '@/components/features/camera/CameraMetadataPanel.vue'
import ClipCreator from '@/components/features/camera/ClipCreator.vue'

const cameras = ref<Camera[]>([
  {
    id: 'cam-01',
    name: 'Front Entrance',
    rtspUrl: 'rtsp://camera1.local/stream',
    status: 'online',
    capabilities: { ptz: true, audio: true, analytics: true, resolution: '1920x1080', fps: 30 },
  },
  {
    id: 'cam-02',
    name: 'Parking Lot',
    rtspUrl: 'rtsp://camera2.local/stream',
    status: 'online',
    capabilities: { ptz: false, audio: false, analytics: true, resolution: '1920x1080', fps: 25 },
  },
  {
    id: 'cam-03',
    name: 'Warehouse',
    rtspUrl: 'rtsp://camera3.local/stream',
    status: 'online',
    capabilities: { ptz: true, audio: false, analytics: true, resolution: '2560x1440', fps: 30 },
  },
  {
    id: 'cam-04',
    name: 'Loading Dock',
    rtspUrl: 'rtsp://camera4.local/stream',
    status: 'online',
    capabilities: { ptz: false, audio: true, analytics: false, resolution: '1920x1080', fps: 30 },
  },
  {
    id: 'cam-05',
    name: 'Back Entrance',
    rtspUrl: 'rtsp://camera5.local/stream',
    status: 'online',
    capabilities: { ptz: true, audio: false, analytics: true, resolution: '1920x1080', fps: 30 },
  },
  {
    id: 'cam-06',
    name: 'Perimeter North',
    rtspUrl: 'rtsp://camera6.local/stream',
    status: 'online',
    capabilities: { ptz: false, audio: false, analytics: true, resolution: '1920x1080', fps: 25 },
  },
])

const selectedCamera = ref<Camera | null>(null)
const videoRefs = ref<Record<string, HTMLVideoElement>>({})
const streamReady = ref<Record<string, boolean>>({})
const peerConnections = ref<Record<string, RTCPeerConnection>>({})

// UI State
const compactMode = ref(false)
const metadataPanelOpen = ref(false)
const clipCreatorOpen = ref(false)

// Recording State
const isRecording = ref(false)
const recordingDuration = ref('00:00')
const recordingStartTime = ref<number | null>(null)
const recordingInterval = ref<number | null>(null)
const clipMarkers = ref<number[]>([])

// Analytics & Alerts
const activeAlerts = ref<Record<string, Array<{ id: string; type: string; message: string }>>>({})
const streamStats = ref<Record<string, { bitrate: string; latency: number }>>({})
const cameraMetadata = ref<Record<string, {
  peopleCount: number
  vehicleCount: number
  motionLevel: string
  detections: Array<{ id: string; object: string; confidence: number }>
}>>({})

const onlineCameras = computed(() => cameras.value.filter(c => c.status === 'online').length)

const selectCamera = (camera: Camera) => {
  selectedCamera.value = camera
}

// Watch for camera selection and ensure stream is ready
watch(selectedCamera, async (newCamera) => {
  if (newCamera) {
    console.log('Selected camera changed to:', newCamera.name)
    // Wait for video element to be in DOM
    await new Promise(resolve => setTimeout(resolve, 150))
    setupMockWebRTC(newCamera)
  }
}, { immediate: false })

const setupMockWebRTC = async (camera: Camera) => {
  try {
    console.log('Setting up WebRTC for:', camera.name, camera.id)

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peerConnections.value[camera.id] = pc

    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!

    const animate = () => {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#16213e'
      ctx.lineWidth = 2
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      const time = Date.now() / 1000
      const x = (Math.sin(time * 0.5) * 0.4 + 0.5) * canvas.width
      const y = (Math.cos(time * 0.3) * 0.3 + 0.5) * canvas.height

      ctx.fillStyle = '#4ecca3'
      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(20, 20, 300, 120)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(camera.name, 40, 55)

      ctx.font = '16px monospace'
      ctx.fillStyle = '#4ecca3'
      ctx.fillText(`CAM ID: ${camera.id}`, 40, 85)
      ctx.fillText(`FPS: ${camera.capabilities?.fps || 30}`, 40, 110)

      const now = new Date()
      ctx.fillText(now.toLocaleTimeString(), 40, 135)

      if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(canvas.width - 40, 40, 10, 0, Math.PI * 2)
        ctx.fill()
      }

      if (peerConnections.value[camera.id]) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    const stream = canvas.captureStream(camera.capabilities?.fps || 30)
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    const videoElement = videoRefs.value[camera.id]
    console.log('Video element for', camera.id, ':', videoElement)

    if (videoElement) {
      videoElement.srcObject = stream
      streamReady.value[camera.id] = true
      console.log('Stream set for', camera.id, 'streamReady:', streamReady.value[camera.id])
    } else {
      console.warn('Video element not found for', camera.id)
    }
  } catch (err) {
    console.error(`Failed to setup WebRTC for ${camera.name}:`, err)
  }
}

const refreshCameras = () => {
  cameras.value.forEach(camera => {
    if (camera.status === 'online') {
      setupMockWebRTC(camera)
    }
  })
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

const startRecording = () => {
  isRecording.value = true
  recordingStartTime.value = Date.now()

  recordingInterval.value = window.setInterval(() => {
    if (recordingStartTime.value) {
      const elapsed = Math.floor((Date.now() - recordingStartTime.value) / 1000)
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0')
      const seconds = (elapsed % 60).toString().padStart(2, '0')
      recordingDuration.value = `${minutes}:${seconds}`
    }
  }, 1000)

  console.log('Recording started for:', selectedCamera.value?.name)
}

const stopRecording = () => {
  isRecording.value = false
  if (recordingInterval.value) {
    clearInterval(recordingInterval.value)
    recordingInterval.value = null
  }
  console.log('Recording stopped. Duration:', recordingDuration.value)
  recordingDuration.value = '00:00'
  recordingStartTime.value = null
}

const addClipMarker = (percentage: number) => {
  if (clipMarkers.value.length >= 2) {
    clipMarkers.value = []
  }

  clipMarkers.value.push(percentage)
  clipMarkers.value.sort((a, b) => a - b)
}

const saveClip = () => {
  if (clipMarkers.value.length !== 2) return

  const startTime = Math.round(clipMarkers.value[0] * 0.6)
  const endTime = Math.round(clipMarkers.value[1] * 0.6)
  const duration = endTime - startTime

  console.log(`Saving clip: ${startTime}s to ${endTime}s (${duration}s duration)`)
  alert(`Clip saved: ${duration}s from ${selectedCamera.value?.name}`)
  clipMarkers.value = []
}

// Mock data generators
const generateMockAlerts = () => {
  const alertTypes = [
    { type: 'Motion Detected', message: 'Zone A' },
    { type: 'Person Detected', message: 'Entrance area' },
    { type: 'Vehicle Detected', message: 'Parking lot' },
  ]

  cameras.value.forEach(camera => {
    if (Math.random() > 0.85 && camera.capabilities?.analytics) {
      const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      if (!activeAlerts.value[camera.id]) {
        activeAlerts.value[camera.id] = []
      }
      activeAlerts.value[camera.id].push({
        id: `alert-${Date.now()}`,
        ...alert
      })

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        if (activeAlerts.value[camera.id]) {
          activeAlerts.value[camera.id] = activeAlerts.value[camera.id].filter(
            a => a.id !== `alert-${Date.now()}`
          )
        }
      }, 5000)
    }
  })
}

const generateMockMetadata = () => {
  cameras.value.forEach(camera => {
    if (camera.capabilities?.analytics) {
      const peopleCount = Math.floor(Math.random() * 8)
      const vehicleCount = Math.floor(Math.random() * 5)
      const motionLevels = ['Low', 'Medium', 'High']

      const detections = []
      if (peopleCount > 0) {
        detections.push({
          id: `det-p-${Date.now()}`,
          object: 'Person',
          confidence: Math.floor(85 + Math.random() * 15)
        })
      }
      if (vehicleCount > 0) {
        detections.push({
          id: `det-v-${Date.now()}`,
          object: 'Vehicle',
          confidence: Math.floor(80 + Math.random() * 20)
        })
      }

      cameraMetadata.value[camera.id] = {
        peopleCount,
        vehicleCount,
        motionLevel: motionLevels[Math.floor(Math.random() * motionLevels.length)],
        detections: detections.slice(0, 3)
      }
    }
  })
}

const generateMockStreamStats = () => {
  cameras.value.forEach(camera => {
    streamStats.value[camera.id] = {
      bitrate: (2.0 + Math.random() * 1.5).toFixed(1),
      latency: Math.floor(30 + Math.random() * 80)
    }
  })
}

onMounted(() => {
  setTimeout(() => {
    cameras.value.forEach(camera => {
      if (camera.status === 'online') {
        setupMockWebRTC(camera)
      }
    })
    // Auto-select first camera
    if (cameras.value.length > 0) {
      selectedCamera.value = cameras.value[0]
    }
  }, 100)

  // Generate initial mock data
  generateMockStreamStats()
  generateMockMetadata()

  // Update mock data periodically
  const metadataInterval = setInterval(() => {
    generateMockMetadata()
  }, 3000)

  const alertsInterval = setInterval(() => {
    generateMockAlerts()
  }, 8000)

  const statsInterval = setInterval(() => {
    generateMockStreamStats()
  }, 2000)

  // Cleanup
  onUnmounted(() => {
    clearInterval(metadataInterval)
    clearInterval(alertsInterval)
    clearInterval(statsInterval)
  })
})

onUnmounted(() => {
  Object.values(peerConnections.value).forEach(pc => pc.close())
  peerConnections.value = {}

  if (recordingInterval.value) {
    clearInterval(recordingInterval.value)
  }
})
</script>
