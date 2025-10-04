<template>
  <div class="h-full w-full bg-background">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 border-b">
      <h1 class="text-base font-bold text-foreground">Live Camera Feed</h1>
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

    <!-- Camera Grid - 4x4 Layout -->
    <div class="grid grid-cols-4 gap-1 p-1 h-[calc(100vh-60px)]">
      <div
        v-for="camera in cameras"
        :key="camera.id"
        class="relative bg-gray-900 rounded-lg overflow-hidden group"
      >
        <!-- Video Element -->
        <video
          :ref="el => videoRefs[camera.id] = el as HTMLVideoElement"
          class="w-full h-full object-cover"
          autoplay
          muted
          playsinline
        ></video>

        <!-- Camera Overlay Info -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none">
          <!-- Top Bar -->
          <div class="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
            <div>
              <h3 class="text-white font-semibold text-sm drop-shadow-lg">{{ camera.name }}</h3>
              <p class="text-white/80 text-[10px] drop-shadow-lg">{{ camera.id }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <!-- Status Indicator -->
              <div class="flex items-center space-x-1 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                <span
                  :class="camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'"
                  class="w-1.5 h-1.5 rounded-full animate-pulse"
                ></span>
                <span class="text-white text-[10px] uppercase">{{ camera.status }}</span>
              </div>
              <!-- Live Indicator -->
              <div class="flex items-center space-x-1 bg-red-600/90 px-1.5 py-0.5 rounded backdrop-blur-sm">
                <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                <span class="text-white text-[10px] font-semibold">LIVE</span>
              </div>
            </div>
          </div>

          <!-- Bottom Info Bar -->
          <div class="absolute bottom-0 left-0 right-0 p-3">
            <div class="flex justify-between items-end">
              <div class="text-white text-[10px] space-y-0.5">
                <div class="flex items-center space-x-1.5">
                  <span class="opacity-80">Resolution:</span>
                  <span class="font-mono">{{ camera.capabilities?.resolution || '1920x1080' }}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <span class="opacity-80">FPS:</span>
                  <span class="font-mono">{{ camera.capabilities?.fps || 30 }}</span>
                </div>
              </div>
              <div class="flex space-x-1.5 pointer-events-auto">
                <button
                  @click="toggleFullscreen(camera.id)"
                  class="px-2 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[10px] rounded transition-colors"
                >
                  Fullscreen
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div
          v-if="!streamReady[camera.id]"
          class="absolute inset-0 flex items-center justify-center bg-gray-900"
        >
          <div class="text-center text-white">
            <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
            <p class="text-sm">Connecting to camera...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="absolute bottom-4 right-4 max-w-md p-4 bg-destructive/90 text-white rounded-lg shadow-lg">
      <p class="font-medium">Error:</p>
      <p class="text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Camera } from '../types/generated'
import { useCameraStore } from '../stores/cameras'

// Use camera store
const cameraStore = useCameraStore()
const cameras = computed(() => cameraStore.cameras)

const videoRefs = ref<Record<string, HTMLVideoElement>>({})
const streamReady = ref<Record<string, boolean>>({})
const peerConnections = ref<Record<string, RTCPeerConnection>>({})
const error = ref<string | null>(null)

const onlineCameras = computed(() => cameraStore.onlineCount)

// Mock WebRTC setup for each camera
const setupMockWebRTC = async (camera: Camera) => {
  try {
    // Create RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    peerConnections.value[camera.id] = pc

    // Create a mock video stream using canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!

    // Animation function to simulate camera feed
    let frame = 0
    const animate = () => {
      // Draw background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid pattern
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

      // Draw moving elements to simulate motion
      const time = Date.now() / 1000

      // Simulate a moving object (like a person or vehicle)
      const x = (Math.sin(time * 0.5) * 0.4 + 0.5) * canvas.width
      const y = (Math.cos(time * 0.3) * 0.3 + 0.5) * canvas.height

      ctx.fillStyle = '#4ecca3'
      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.fill()

      // Draw camera info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(20, 20, 300, 120)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px monospace'
      ctx.fillText(camera.name, 40, 55)

      ctx.font = '16px monospace'
      ctx.fillStyle = '#4ecca3'
      ctx.fillText(`CAM ID: ${camera.id}`, 40, 85)
      ctx.fillText(`FPS: ${camera.capabilities?.fps || 30}`, 40, 110)

      // Draw timestamp
      const now = new Date()
      ctx.fillText(now.toLocaleTimeString(), 40, 135)

      // Draw "recording" indicator
      if (Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(canvas.width - 40, 40, 10, 0, Math.PI * 2)
        ctx.fill()
      }

      frame++
      if (peerConnections.value[camera.id]) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    // Capture stream from canvas
    const stream = canvas.captureStream(camera.capabilities?.fps || 30)

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
    })

    // Get video element and set stream
    const videoElement = videoRefs.value[camera.id]
    if (videoElement) {
      videoElement.srcObject = stream
      streamReady.value[camera.id] = true
    }

    console.log(`WebRTC stream started for ${camera.name}`)
  } catch (err) {
    console.error(`Failed to setup WebRTC for ${camera.name}:`, err)
    error.value = `Failed to connect to ${camera.name}`
  }
}

const refreshCameras = async () => {
  // Re-initialize all streams
  cameras.value.forEach(camera => {
    if (camera.status === 'online') {
      setupMockWebRTC(camera)
    }
  })
}

const toggleFullscreen = (cameraId: string) => {
  const videoElement = videoRefs.value[cameraId]
  if (videoElement) {
    if (!document.fullscreenElement) {
      videoElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

onMounted(() => {
  // Initialize WebRTC streams for all cameras
  setTimeout(() => {
    cameras.value.forEach(camera => {
      if (camera.status === 'online') {
        setupMockWebRTC(camera)
      }
    })
  }, 100)
})

onUnmounted(() => {
  // Clean up peer connections
  Object.values(peerConnections.value).forEach(pc => {
    pc.close()
  })
  peerConnections.value = {}
})
</script>
