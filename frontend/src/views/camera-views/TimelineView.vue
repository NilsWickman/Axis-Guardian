<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 border-b">
      <h1 class="text-base font-bold text-foreground">Timeline View</h1>
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <label class="text-xs text-muted-foreground">Playback Speed:</label>
          <select
            v-model="playbackSpeed"
            class="px-2 py-1 text-xs border rounded bg-background"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>
        <span class="text-xs text-muted-foreground">
          {{ cameras.length }} cameras
        </span>
        <button
          @click="refreshCameras"
          class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Camera Grid with Timeline -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Camera Grid -->
      <div class="flex-1 grid grid-cols-2 gap-2 p-2 overflow-auto">
        <div
          v-for="camera in cameras"
          :key="camera.id"
          class="relative bg-gray-900 rounded-lg overflow-hidden group"
        >
          <video
            :ref="el => videoRefs[camera.id] = el as HTMLVideoElement"
            class="w-full h-full object-cover"
            autoplay
            muted
            playsinline
          ></video>

          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none">
            <div class="absolute top-0 left-0 right-0 p-2 flex justify-between items-start">
              <div>
                <h3 class="text-white font-semibold text-xs drop-shadow-lg">{{ camera.name }}</h3>
                <p class="text-white/70 text-[9px] drop-shadow-lg">{{ camera.id }}</p>
              </div>
              <div class="flex items-center space-x-1 bg-black/50 px-1 py-0.5 rounded backdrop-blur-sm">
                <span
                  :class="camera.status === 'online' ? 'bg-status-online' : 'bg-status-offline'"
                  class="w-1 h-1 rounded-full"
                ></span>
                <span class="text-white text-[9px] uppercase">{{ isPlaying ? 'PLAYING' : 'PAUSED' }}</span>
              </div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-2">
              <div class="text-white text-[9px]">
                {{ currentTime }}
              </div>
            </div>
          </div>

          <div
            v-if="!streamReady[camera.id]"
            class="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <div class="text-center text-white">
              <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2 mx-auto"></div>
              <p class="text-[10px]">Loading...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Controls -->
      <div class="border-t bg-card p-4 space-y-3">
        <!-- Timeline Scrubber -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>{{ formatTime(timelineStart) }}</span>
            <span>{{ currentTime }}</span>
            <span>{{ formatTime(timelineEnd) }}</span>
          </div>

          <!-- Timeline Bar -->
          <div class="relative h-16 bg-background rounded border">
            <!-- Event Markers -->
            <div
              v-for="event in events"
              :key="event.id"
              class="absolute top-0 bottom-0 bg-status-configuring/30 border-l-2 border-status-configuring"
              :style="{ left: `${((event.timestamp - timelineStart) / (timelineEnd - timelineStart)) * 100}%`, width: '2px' }"
              :title="`${event.type} - ${event.camera}`"
            ></div>

            <!-- Current Time Indicator -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
              :style="{ left: `${timelinePosition}%` }"
            >
              <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full"></div>
            </div>

            <!-- Clickable Timeline -->
            <input
              type="range"
              v-model="timelinePosition"
              min="0"
              max="100"
              step="0.1"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @input="seekToPosition"
            />
          </div>

          <!-- Event Legend -->
          <div class="flex items-center justify-center space-x-4 text-[10px] text-muted-foreground">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-status-configuring rounded-full"></div>
              <span>Motion Detected</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-status-offline rounded-full"></div>
              <span>Alarm Triggered</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-status-online rounded-full"></div>
              <span>Recording</span>
            </div>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="flex items-center justify-center space-x-3">
          <button
            @click="skipBackward"
            class="p-2 rounded-full hover:bg-accent transition-colors"
            title="Skip 10s backward"
          >
            <SkipBack class="w-5 h-5" />
          </button>

          <button
            @click="togglePlayPause"
            class="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play v-if="!isPlaying" class="w-6 h-6" />
            <Pause v-else class="w-6 h-6" />
          </button>

          <button
            @click="skipForward"
            class="p-2 rounded-full hover:bg-accent transition-colors"
            title="Skip 10s forward"
          >
            <SkipForward class="w-5 h-5" />
          </button>

          <div class="w-px h-8 bg-border mx-2"></div>

          <button
            @click="goToLive"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-semibold flex items-center space-x-1"
          >
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Go Live</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import type { Camera } from '../../types/generated'

const cameras = ref<Camera[]>([
  { id: 'cam-01', name: 'Front Entrance', rtspUrl: 'rtsp://camera1.local/stream', status: 'online', capabilities: { ptz: true, audio: true, analytics: true, resolution: '1920x1080', fps: 30 } },
  { id: 'cam-02', name: 'Parking Lot', rtspUrl: 'rtsp://camera2.local/stream', status: 'online', capabilities: { ptz: false, audio: false, analytics: true, resolution: '1920x1080', fps: 25 } },
  { id: 'cam-03', name: 'Warehouse', rtspUrl: 'rtsp://camera3.local/stream', status: 'online', capabilities: { ptz: true, audio: false, analytics: true, resolution: '2560x1440', fps: 30 } },
  { id: 'cam-04', name: 'Loading Dock', rtspUrl: 'rtsp://camera4.local/stream', status: 'online', capabilities: { ptz: false, audio: true, analytics: false, resolution: '1920x1080', fps: 30 } },
])

const videoRefs = ref<Record<string, HTMLVideoElement>>({})
const streamReady = ref<Record<string, boolean>>({})
const peerConnections = ref<Record<string, RTCPeerConnection>>({})

const isPlaying = ref(false)
const playbackSpeed = ref(1)
const timelinePosition = ref(75) // Start at 75% (representing "near live")

// Timeline represents last 1 hour
const timelineStart = Date.now() - 3600000 // 1 hour ago
const timelineEnd = Date.now()

const currentTime = computed(() => {
  const timestamp = timelineStart + (timelinePosition.value / 100) * (timelineEnd - timelineStart)
  return formatTime(timestamp)
})

const events = ref([
  { id: '1', type: 'motion', camera: 'cam-01', timestamp: Date.now() - 1800000 }, // 30 min ago
  { id: '2', type: 'motion', camera: 'cam-02', timestamp: Date.now() - 2400000 }, // 40 min ago
  { id: '3', type: 'alarm', camera: 'cam-03', timestamp: Date.now() - 3000000 }, // 50 min ago
  { id: '4', type: 'motion', camera: 'cam-01', timestamp: Date.now() - 900000 },  // 15 min ago
  { id: '5', type: 'motion', camera: 'cam-04', timestamp: Date.now() - 600000 },  // 10 min ago
])

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value
}

const skipBackward = () => {
  timelinePosition.value = Math.max(0, timelinePosition.value - 2.78) // Skip back 10s (in 1h = 2.78%)
}

const skipForward = () => {
  timelinePosition.value = Math.min(100, timelinePosition.value + 2.78) // Skip forward 10s
}

const seekToPosition = () => {
  // Position updated via v-model
}

const goToLive = () => {
  timelinePosition.value = 100
  isPlaying.value = true
}

let playbackInterval: number | null = null

watch([isPlaying, playbackSpeed], () => {
  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }

  if (isPlaying.value) {
    playbackInterval = window.setInterval(() => {
      timelinePosition.value = Math.min(100, timelinePosition.value + (0.0278 * playbackSpeed.value)) // 0.1s increment
    }, 100)
  }
})

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

onMounted(() => {
  setTimeout(() => {
    cameras.value.forEach(camera => {
      if (camera.status === 'online') {
        setupMockWebRTC(camera)
      }
    })
  }, 100)
})

onUnmounted(() => {
  if (playbackInterval) {
    clearInterval(playbackInterval)
  }
  Object.values(peerConnections.value).forEach(pc => pc.close())
  peerConnections.value = {}
})
</script>
