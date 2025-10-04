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
        <div class="relative bg-gray-900 rounded-lg overflow-hidden h-full">
          <video
            v-if="selectedCamera"
            :ref="el => videoRefs[selectedCamera.id] = el as HTMLVideoElement"
            class="w-full h-full object-contain"
            autoplay
            muted
            playsinline
          ></video>

          <!-- Camera Info Overlay -->
          <div
            v-if="selectedCamera"
            class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none"
          >
            <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              <div>
                <h3 class="text-white font-semibold text-sm drop-shadow-lg">
                  {{ selectedCamera.name }}
                </h3>
                <p class="text-white/80 text-xs drop-shadow-lg">{{ selectedCamera.id }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                  <span
                    :class="
                      selectedCamera.status === 'online' ? 'bg-status-online' : 'bg-status-offline'
                    "
                    class="w-1.5 h-1.5 rounded-full animate-pulse"
                  ></span>
                  <span class="text-white text-xs uppercase">{{ selectedCamera.status }}</span>
                </div>
                <div class="flex items-center space-x-1 bg-red-600/90 px-2 py-0.5 rounded backdrop-blur-sm">
                  <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  <span class="text-white text-xs font-semibold">LIVE</span>
                </div>
              </div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-4">
              <div class="flex justify-between items-end">
                <div class="text-white text-sm space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="opacity-80">Resolution:</span>
                    <span class="font-mono">{{ selectedCamera.capabilities?.resolution || '1920x1080' }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="opacity-80">FPS:</span>
                    <span class="font-mono">{{ selectedCamera.capabilities?.fps || 30 }}</span>
                  </div>
                </div>
                <div class="flex space-x-2 pointer-events-auto">
                  <button
                    @click="takeSnapshot"
                    class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm rounded transition-colors"
                  >
                    Snapshot
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="!selectedCamera || !streamReady[selectedCamera.id]"
            class="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <div class="text-center text-white">
              <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
              <p class="text-lg">{{ selectedCamera ? 'Connecting to camera...' : 'Select a camera' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Thumbnail Strip -->
      <div class="w-64 border-l bg-card p-2 overflow-y-auto">
        <h3 class="text-sm font-semibold mb-2 px-2">All Cameras</h3>
        <div class="space-y-2">
          <div
            v-for="camera in cameras"
            :key="camera.id"
            @click="selectCamera(camera)"
            class="relative bg-gray-900 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
            :class="{ 'ring-2 ring-primary': selectedCamera?.id === camera.id }"
          >
            <video
              :ref="el => videoRefs[camera.id] = el as HTMLVideoElement"
              class="w-full h-32 object-cover"
              autoplay
              muted
              playsinline
            ></video>

            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
              <div class="text-white text-xs">
                <div class="font-semibold">{{ camera.name }}</div>
                <div class="text-white/70">{{ camera.id }}</div>
              </div>
            </div>

            <div
              class="absolute top-2 right-2 flex items-center space-x-1 bg-black/50 px-1 py-0.5 rounded backdrop-blur-sm"
            >
              <span
                :class="camera.status === 'online' ? 'bg-status-online' : 'bg-status-offline'"
                class="w-1 h-1 rounded-full"
              ></span>
            </div>

            <div
              v-if="!streamReady[camera.id]"
              class="absolute inset-0 flex items-center justify-center bg-gray-900"
            >
              <div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Camera } from '../../types/generated'

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

const onlineCameras = computed(() => cameras.value.filter(c => c.status === 'online').length)

const selectCamera = (camera: Camera) => {
  selectedCamera.value = camera
}

const setupMockWebRTC = async (camera: Camera) => {
  try {
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
    if (videoElement) {
      videoElement.srcObject = stream
      streamReady.value[camera.id] = true
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
})

onUnmounted(() => {
  Object.values(peerConnections.value).forEach(pc => pc.close())
  peerConnections.value = {}
})
</script>
