<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDetectionFile } from '@/composables/useDetectionFile'
import { AVAILABLE_VIDEOS, type VideoFileOption, type Detection } from '@/types/frame-review'
import FrameByFramePlayer from '@/components/features/frame-review/FrameByFramePlayer.vue'
import FrameControls from '@/components/features/frame-review/FrameControls.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Detection file loading
const {
  loadDetectionFile,
  getFrameData,
  isLoading,
  error,
  fps,
  totalFrames,
  videoInfo,
} = useDetectionFile()

// Selected video file
const selectedVideoId = ref<string>('')
const selectedVideo = computed<VideoFileOption | null>(() =>
  AVAILABLE_VIDEOS.find(v => v.id === selectedVideoId.value) ?? null
)

// Current frame state
const currentFrame = ref(0)
const currentTimestamp = computed(() => {
  if (fps.value <= 0) return 0
  return currentFrame.value / fps.value
})

// Current frame data from detection file
const currentFrameData = computed(() => getFrameData(currentFrame.value))

// Player ref
const playerRef = ref<InstanceType<typeof FrameByFramePlayer> | null>(null)

// Video source URL
const videoSrc = computed(() => selectedVideo.value?.videoPath ?? '')

// Handle video file selection
async function onVideoSelect(videoId: string): Promise<void> {
  selectedVideoId.value = videoId
  currentFrame.value = 0

  const video = AVAILABLE_VIDEOS.find(v => v.id === videoId)
  if (video) {
    await loadDetectionFile(video.detectionsPath)
  }
}

// Handle frame seeking
function onSeekFrame(frame: number): void {
  currentFrame.value = frame
  playerRef.value?.seekToFrame(frame)
}

// Handle video time updates from player
function onTimeUpdate(time: number): void {
  if (fps.value > 0) {
    currentFrame.value = Math.round(time * fps.value)
  }
}

// Handle video loaded
function onVideoLoaded(event: { duration: number; width: number; height: number }): void {
  console.log('Video loaded:', event)
}

// Get track color for display
const trackColors = new Map<number, string>()
const colorPalette = [
  'bg-green-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500',
  'bg-yellow-500', 'bg-purple-500', 'bg-lime-500', 'bg-blue-500',
]

function getTrackColorClass(trackId: number): string {
  if (!trackColors.has(trackId)) {
    const colorIndex = trackColors.size % colorPalette.length
    trackColors.set(trackId, colorPalette[colorIndex])
  }
  return trackColors.get(trackId)!
}

// Reset track colors when video changes
watch(selectedVideoId, () => {
  trackColors.clear()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b px-4 py-3 flex items-center justify-between">
      <h1 class="text-lg font-semibold">Frame Review</h1>

      <!-- Video File Selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">Video:</span>
        <Select :model-value="selectedVideoId" @update:model-value="onVideoSelect">
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Select a video..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="video in AVAILABLE_VIDEOS"
              :key="video.id"
              :value="video.id"
            >
              {{ video.displayName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading/Error States -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground">Loading detection data...</div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-destructive">Error: {{ error }}</div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 grid grid-cols-[1fr,380px] gap-4 p-4 overflow-hidden">
      <!-- Left: Video Player -->
      <div class="flex flex-col gap-3 min-h-0">
        <!-- Player -->
        <div class="flex-1 min-h-0">
          <FrameByFramePlayer
            ref="playerRef"
            :video-src="videoSrc"
            :frame-data="currentFrameData"
            :fps="fps"
            @timeupdate="onTimeUpdate"
            @loaded="onVideoLoaded"
          />
        </div>

        <!-- Controls -->
        <FrameControls
          v-if="totalFrames > 0"
          :current-frame="currentFrame"
          :total-frames="totalFrames"
          :fps="fps"
          :timestamp="currentTimestamp"
          @seek="onSeekFrame"
        />
      </div>

      <!-- Right: Metadata Panel -->
      <div class="flex flex-col gap-3 overflow-y-auto">
        <!-- Frame Info Card -->
        <Card>
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Frame Info</CardTitle>
          </CardHeader>
          <CardContent class="py-2 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Frame:</span>
              <span class="font-mono">{{ currentFrame }} / {{ totalFrames - 1 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Time:</span>
              <span class="font-mono">{{ currentTimestamp.toFixed(3) }}s</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">FPS:</span>
              <span class="font-mono">{{ fps.toFixed(2) }}</span>
            </div>
            <div v-if="videoInfo" class="flex justify-between">
              <span class="text-muted-foreground">Resolution:</span>
              <span class="font-mono">{{ videoInfo.width }}x{{ videoInfo.height }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Detections:</span>
              <span class="font-mono">{{ currentFrameData?.detections.length ?? 0 }}</span>
            </div>
          </CardContent>
        </Card>

        <!-- Frame Stats Card -->
        <Card v-if="currentFrameData?.stats">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">Frame Stats</CardTitle>
          </CardHeader>
          <CardContent class="py-2 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Avg Confidence:</span>
              <span class="font-mono">{{ (currentFrameData.stats.avg_confidence * 100).toFixed(1) }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Max Confidence:</span>
              <span class="font-mono">{{ (currentFrameData.stats.max_confidence * 100).toFixed(1) }}%</span>
            </div>
          </CardContent>
        </Card>

        <!-- Detections List Card -->
        <Card class="flex-1 min-h-0 flex flex-col">
          <CardHeader class="py-3">
            <CardTitle class="text-sm">
              Detections ({{ currentFrameData?.detections.length ?? 0 }})
            </CardTitle>
          </CardHeader>
          <CardContent class="py-2 flex-1 overflow-y-auto">
            <div v-if="!currentFrameData?.detections.length" class="text-sm text-muted-foreground text-center py-4">
              No detections in this frame
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(det, index) in currentFrameData.detections"
                :key="index"
                class="p-2 bg-muted/50 rounded text-xs space-y-1"
              >
                <!-- Detection Header -->
                <div class="flex items-center gap-2">
                  <div
                    :class="[getTrackColorClass(det.track_id), 'w-3 h-3 rounded-full']"
                  />
                  <span class="font-semibold">
                    Track #{{ det.track_id }}
                  </span>
                  <span class="text-muted-foreground">{{ det.class_name }}</span>
                  <span class="ml-auto font-mono">
                    {{ (det.confidence * 100).toFixed(0) }}%
                  </span>
                </div>

                <!-- Bounding Box -->
                <div class="font-mono text-muted-foreground pl-5">
                  bbox: [{{ det.bbox.left.toFixed(3) }}, {{ det.bbox.top.toFixed(3) }}, {{ det.bbox.right.toFixed(3) }}, {{ det.bbox.bottom.toFixed(3) }}]
                </div>

                <!-- Track State -->
                <div class="pl-5 text-muted-foreground">
                  state: {{ det.track_state }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!selectedVideoId && !isLoading"
      class="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none"
    >
      <div class="text-center space-y-2 pointer-events-auto">
        <p class="text-muted-foreground">Select a video file to begin frame review</p>
        <p class="text-xs text-muted-foreground/60">
          Use arrow keys to navigate frames after loading
        </p>
      </div>
    </div>
  </div>
</template>
