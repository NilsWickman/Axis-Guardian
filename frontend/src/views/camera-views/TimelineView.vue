<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header with Controls -->
    <div class="border-b border-sidebar-border p-4 space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-base font-bold text-foreground">Timeline View</h1>
      </div>

      <!-- Selection Controls -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Date Selection -->
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Date</label>
          <input
            v-model="selectedDate"
            type="date"
            class="w-full px-3 py-1.5 text-xs border rounded bg-background"
            @change="onDateChange"
          />
        </div>

        <!-- Time Range Selection -->
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Time Range</label>
          <Select v-model="selectedTimeRange" @update:model-value="onTimeRangeChange">
            <SelectTrigger class="w-full h-[30px] text-xs">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="12h">Last 12 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Camera Selection -->
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Camera View</label>
          <Select v-model="selectedCameraView" @update:model-value="onCameraViewChange">
            <SelectTrigger class="w-full h-[30px] text-xs">
              <SelectValue placeholder="Select camera view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cameras</SelectItem>
              <SelectItem value="site">By Site</SelectItem>
              <SelectItem v-for="camera in cameras" :key="camera.id" :value="camera.id">
                {{ camera.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Playback Speed -->
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Playback Speed</label>
          <Select v-model="playbackSpeed">
            <SelectTrigger class="w-full h-[30px] text-xs">
              <SelectValue placeholder="Select speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="0.25">0.25x</SelectItem>
              <SelectItem :value="0.5">0.5x</SelectItem>
              <SelectItem :value="1">1x</SelectItem>
              <SelectItem :value="2">2x</SelectItem>
              <SelectItem :value="4">4x</SelectItem>
              <SelectItem :value="8">8x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Custom Time Range -->
      <div v-if="selectedTimeRange === 'custom'" class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">Start Time</label>
          <input
            v-model="customStartTime"
            type="time"
            class="w-full px-3 py-1.5 text-xs border rounded bg-background"
            @change="onCustomRangeChange"
          />
        </div>
        <div>
          <label class="text-xs text-muted-foreground mb-1 block">End Time</label>
          <input
            v-model="customEndTime"
            type="time"
            class="w-full px-3 py-1.5 text-xs border rounded bg-background"
            @change="onCustomRangeChange"
          />
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="flex items-center space-x-6 text-xs">
        <div>
          <span class="text-muted-foreground">Selected:</span>
          <span class="ml-1 font-semibold">{{ displayedCameras.length }} cameras</span>
        </div>
        <div>
          <span class="text-muted-foreground">Duration:</span>
          <span class="ml-1 font-semibold">{{ formatDuration(timelineEnd - timelineStart) }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Events:</span>
          <span class="ml-1 font-semibold">{{ events.length }}</span>
        </div>
      </div>
    </div>

    <!-- Camera Grid with Timeline -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Camera Grid -->
      <div class="flex-1 grid gap-2 p-2 overflow-auto" :class="gridClasses">
        <div
          v-for="camera in displayedCameras"
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
          <!-- Timeline Bar -->
          <div class="relative h-20 bg-background rounded border">
            <!-- Recording Segments -->
            <div class="absolute top-0 h-6 left-0 right-0 flex">
              <div
                v-for="(segment, idx) in recordingSegments"
                :key="idx"
                class="absolute h-full bg-blue-500/30"
                :style="{
                  left: `${((segment.start - timelineStart) / timelineDuration) * 100}%`,
                  width: `${((segment.end - segment.start) / timelineDuration) * 100}%`
                }"
              ></div>
            </div>

            <!-- Event Markers -->
            <div
              v-for="event in events"
              :key="event.id"
              class="absolute top-6 bottom-6 bg-status-configuring/40 border-l-2 border-status-configuring cursor-pointer hover:bg-status-configuring/60 transition-colors"
              :style="{ left: `${((event.timestamp - timelineStart) / timelineDuration) * 100}%`, width: '3px' }"
              :title="`${event.type} - ${event.camera} at ${formatTime(event.timestamp)}`"
              @click="seekToEvent(event.timestamp)"
            ></div>

            <!-- Current Time Indicator -->
            <div
              class="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
              :style="{ left: `${timelinePosition}%` }"
            >
              <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full"></div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full"></div>
            </div>

            <!-- Time Labels Inside Timeline -->
            <div class="absolute bottom-1 left-2 text-[10px] text-muted-foreground pointer-events-none">
              {{ formatTime(timelineStart, false) }}
            </div>
            <div class="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground pointer-events-none">
              {{ currentTime }}
            </div>
            <div class="absolute bottom-1 right-2 text-[10px] text-muted-foreground pointer-events-none">
              {{ formatTime(timelineEnd, false) }}
            </div>

            <!-- Selection Range -->
            <div
              v-if="selectionStart !== null && selectionEnd !== null"
              class="absolute top-0 bottom-0 bg-yellow-500/20 border-x-2 border-yellow-500"
              :style="{
                left: `${Math.min(selectionStart, selectionEnd)}%`,
                width: `${Math.abs(selectionEnd - selectionStart)}%`
              }"
            ></div>

            <!-- Clickable Timeline -->
            <input
              type="range"
              v-model="timelinePosition"
              min="0"
              max="100"
              step="0.1"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              @input="seekToPosition"
              @mousedown="startSelection"
              @mousemove="updateSelection"
              @mouseup="endSelection"
            />
          </div>

          <!-- Event Legend -->
          <div class="flex items-center space-x-4 text-[10px]">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span class="text-muted-foreground">Recording</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-status-configuring rounded-full"></div>
              <span class="text-muted-foreground">Events ({{ events.length }})</span>
            </div>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="flex items-center justify-center space-x-3">
          <button
            @click="skipBackward"
            class="p-1.5 rounded-full hover:bg-accent transition-colors"
            title="Skip 10s backward"
          >
            <SkipBack class="w-4 h-4" />
          </button>

          <button
            @click="togglePlayPause"
            class="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Play v-if="!isPlaying" class="w-4 h-4" />
            <Pause v-else class="w-4 h-4" />
          </button>

          <button
            @click="skipForward"
            class="p-1.5 rounded-full hover:bg-accent transition-colors"
            title="Skip 10s forward"
          >
            <SkipForward class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { useCameraStore } from '@/stores/cameras'
import type { Camera } from '../../types/generated'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const cameraStore = useCameraStore()

const cameras = computed(() => cameraStore.cameras)
const videoRefs = ref<Record<string, HTMLVideoElement>>({})
const streamReady = ref<Record<string, boolean>>({})
const peerConnections = ref<Record<string, RTCPeerConnection>>({})

// Selection state
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedTimeRange = ref('1h')
const selectedCameraView = ref('all')
const customStartTime = ref('00:00')
const customEndTime = ref('23:59')

// Playback state
const isPlaying = ref(false)
const playbackSpeed = ref(1)
const timelinePosition = ref(100) // Start at current time

// Timeline selection
const selectionStart = ref<number | null>(null)
const selectionEnd = ref<number | null>(null)
const isSelecting = ref(false)

// Timeline range
const timelineStart = ref(Date.now() - 3600000) // 1 hour ago
const timelineEnd = ref(Date.now())

const timelineDuration = computed(() => timelineEnd.value - timelineStart.value)

const currentTime = computed(() => {
  const timestamp = timelineStart.value + (timelinePosition.value / 100) * timelineDuration.value
  return formatTime(timestamp)
})

// Mock events
const events = ref([
  { id: '1', type: 'motion', camera: 'cam-01', timestamp: Date.now() - 1800000 },
  { id: '2', type: 'motion', camera: 'cam-02', timestamp: Date.now() - 2400000 },
  { id: '3', type: 'alarm', camera: 'cam-03', timestamp: Date.now() - 3000000 },
  { id: '4', type: 'motion', camera: 'cam-01', timestamp: Date.now() - 900000 },
  { id: '5', type: 'motion', camera: 'cam-04', timestamp: Date.now() - 600000 },
])

// Mock recording segments
const recordingSegments = ref([
  { start: Date.now() - 3600000, end: Date.now() - 3000000 },
  { start: Date.now() - 2800000, end: Date.now() - 1800000 },
  { start: Date.now() - 1600000, end: Date.now() },
])

const displayedCameras = computed(() => {
  if (selectedCameraView.value === 'all') {
    return cameras.value
  } else if (selectedCameraView.value === 'site') {
    // Filter by site (assuming all cameras are in same site for now)
    return cameras.value
  } else {
    return cameras.value.filter(c => c.id === selectedCameraView.value)
  }
})

const gridClasses = computed(() => {
  const count = displayedCameras.value.length
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-3'
  return 'grid-cols-4'
})

const formatTime = (timestamp: number, includeSeconds = true) => {
  const date = new Date(timestamp)
  if (includeSeconds) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } else {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
}

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

const onDateChange = () => {
  updateTimelineRange()
}

const onTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    updateTimelineRange()
  }
}

const onCustomRangeChange = () => {
  updateTimelineRange()
}

const updateTimelineRange = () => {
  const date = new Date(selectedDate.value)

  if (selectedTimeRange.value === 'custom') {
    const [startHour, startMin] = customStartTime.value.split(':').map(Number)
    const [endHour, endMin] = customEndTime.value.split(':').map(Number)

    const start = new Date(date)
    start.setHours(startHour, startMin, 0, 0)

    const end = new Date(date)
    end.setHours(endHour, endMin, 59, 999)

    timelineStart.value = start.getTime()
    timelineEnd.value = end.getTime()
  } else {
    const hours = parseInt(selectedTimeRange.value)
    const now = new Date()
    timelineEnd.value = now.getTime()
    timelineStart.value = timelineEnd.value - (hours * 3600000)
  }
}

const onCameraViewChange = () => {
  // Camera view changed, refresh streams
  refreshCameras()
}

const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value
}

const skipBackward = () => {
  timelinePosition.value = Math.max(0, timelinePosition.value - 2.78) // ~10s
}

const skipForward = () => {
  timelinePosition.value = Math.min(100, timelinePosition.value + 2.78) // ~10s
}

const seekToPosition = () => {
  // Position updated via v-model
}

const seekToEvent = (timestamp: number) => {
  const position = ((timestamp - timelineStart.value) / timelineDuration.value) * 100
  timelinePosition.value = Math.max(0, Math.min(100, position))
}

const goToLive = () => {
  selectedTimeRange.value = '1h'
  updateTimelineRange()
  timelinePosition.value = 100
  isPlaying.value = true
}

const previousEvent = () => {
  const currentTimestamp = timelineStart.value + (timelinePosition.value / 100) * timelineDuration.value
  const prevEvents = events.value.filter(e => e.timestamp < currentTimestamp).sort((a, b) => b.timestamp - a.timestamp)
  if (prevEvents.length > 0) {
    seekToEvent(prevEvents[0].timestamp)
  }
}

const nextEvent = () => {
  const currentTimestamp = timelineStart.value + (timelinePosition.value / 100) * timelineDuration.value
  const nextEvents = events.value.filter(e => e.timestamp > currentTimestamp).sort((a, b) => a.timestamp - b.timestamp)
  if (nextEvents.length > 0) {
    seekToEvent(nextEvents[0].timestamp)
  }
}

const zoomIn = () => {
  const currentTimestamp = timelineStart.value + (timelinePosition.value / 100) * timelineDuration.value
  const newDuration = timelineDuration.value * 0.5
  timelineStart.value = currentTimestamp - newDuration / 2
  timelineEnd.value = currentTimestamp + newDuration / 2
}

const zoomOut = () => {
  const currentTimestamp = timelineStart.value + (timelinePosition.value / 100) * timelineDuration.value
  const newDuration = timelineDuration.value * 2
  timelineStart.value = currentTimestamp - newDuration / 2
  timelineEnd.value = currentTimestamp + newDuration / 2
}

const resetZoom = () => {
  updateTimelineRange()
}

const startSelection = (e: MouseEvent) => {
  if (e.shiftKey) {
    isSelecting.value = true
    selectionStart.value = timelinePosition.value
    selectionEnd.value = timelinePosition.value
  }
}

const updateSelection = (e: MouseEvent) => {
  if (isSelecting.value) {
    selectionEnd.value = timelinePosition.value
  }
}

const endSelection = () => {
  if (isSelecting.value) {
    isSelecting.value = false
    // Handle selection (e.g., export, bookmark, etc.)
    console.log('Selection made:', selectionStart.value, selectionEnd.value)
  }
}

let playbackInterval: number | null = null

watch([isPlaying, playbackSpeed], () => {
  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }

  if (isPlaying.value) {
    playbackInterval = window.setInterval(() => {
      timelinePosition.value = Math.min(100, timelinePosition.value + (0.0278 * playbackSpeed.value))
      if (timelinePosition.value >= 100) {
        isPlaying.value = false
      }
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
  displayedCameras.value.forEach(camera => {
    if (camera.status === 'online') {
      setupMockWebRTC(camera)
    }
  })
}

onMounted(() => {
  setTimeout(() => {
    displayedCameras.value.forEach(camera => {
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
