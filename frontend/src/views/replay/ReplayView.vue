<template>
  <div class="h-full w-full bg-background flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="border-b border-border px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="font-semibold">Replay</div>
        <div v-if="recordingId" class="text-xs font-mono text-muted-foreground">
          {{ recordingId }}
        </div>
      </div>
      <div v-if="replay.isLoading.value" class="text-xs text-muted-foreground">Loading…</div>
      <div v-else-if="replay.error.value" class="text-xs text-destructive">{{ replay.error.value }}</div>
    </div>

    <!-- Main 3-pane area -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 overflow-hidden">
      <!-- Camera 1 -->
      <div class="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
        <div class="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
          {{ cam1Label }}
        </div>
        <div class="flex-1 bg-black overflow-hidden">
          <video
            ref="cam1Video"
            :src="cam1Src"
            class="w-full h-full object-contain"
            playsinline
            preload="auto"
            @loadedmetadata="onLoadedMetadata"
            @play="syncPlay"
            @pause="syncPause"
            @seeking="onSeeking"
          />
        </div>
      </div>

      <!-- Camera 2 -->
      <div class="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
        <div class="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
          {{ cam2Label }}
        </div>
        <div class="flex-1 bg-black overflow-hidden">
          <video
            ref="cam2Video"
            :src="cam2Src"
            class="w-full h-full object-contain"
            playsinline
            preload="auto"
            muted
          />
        </div>
      </div>

      <!-- Global map -->
      <div class="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
        <div class="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
          Global Map
        </div>
        <div class="flex-1 relative overflow-hidden" style="background-color: var(--canvas-background)">
          <canvas ref="mapCanvas" class="absolute inset-0" />
          <PersonPositionOverlay
            v-if="currentMap"
            :site-map="currentMap"
            :canvas-width="metersToPixels(extractValue(currentMap.width))"
            :canvas-height="metersToPixels(extractValue(currentMap.height))"
            :show-trails="true"
            :show-confidence="true"
            :show-person-icon="false"
            :show-stats="false"
            :show-heatmap="false"
            :show-debug-mode="false"
            :marker-radius="8"
            :max-trail-length="20"
            :style="{
              position: 'absolute',
              left: '0px',
              top: '0px',
              pointerEvents: 'none',
            }"
          />
        </div>
      </div>
    </div>

    <!-- Timeline controls -->
    <div class="border-t border-border px-4 py-3 flex items-center gap-3">
      <button
        class="px-3 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent"
        @click="togglePlay"
      >
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>

      <input
        class="flex-1"
        type="range"
        :min="0"
        :max="durationSec"
        step="0.05"
        :value="currentSec"
        @input="onScrub"
      />

      <div class="text-xs font-mono text-muted-foreground w-28 text-right">
        {{ currentSec.toFixed(2) }}s / {{ durationSec.toFixed(2) }}s
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useReplay } from '@/composables/useReplay'
import { useSiteMapCanvas, type CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import PersonPositionOverlay from '@/components/features/site-map/PersonPositionOverlay.vue'
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'

const route = useRoute()
const recordingId = computed(() => String(route.params.recordingId || ''))

const cam1Video = ref<HTMLVideoElement | null>(null)
const cam2Video = ref<HTMLVideoElement | null>(null)

const { siteMap: currentMap, loadSiteMap } = useSiteMapConfig()
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasOptions = ref<CanvasRenderOptions>({
  showGrid: false,
  showScaleReference: false,
  showCameraLabels: false,
  pixelsPerMeter: RENDER_SCALE,
})
const canvas = useSiteMapCanvas(mapCanvas, canvasOptions)

const replay = useReplay({ masterVideo: cam1Video })

const durationSec = ref(0)
const currentSec = ref(0)
const isPlaying = ref(false)

const cam1Src = computed(() => replay.manifest.value?.cameras?.[0]?.videoUrl ?? '')
const cam2Src = computed(() => replay.manifest.value?.cameras?.[1]?.videoUrl ?? '')
const cam1Label = computed(() => replay.manifest.value?.cameras?.[0]?.label ?? 'Camera 1')
const cam2Label = computed(() => replay.manifest.value?.cameras?.[1]?.label ?? 'Camera 2')

function drawMap(): void {
  if (!currentMap.value) return
  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawObstacles(currentMap.value.obstacles)
  canvas.drawWalls(currentMap.value.walls)
  const allCameraFOVs = currentMap.value.cameras.map(camera =>
    canvas.getCameraFOVPolygon(camera, currentMap.value!.walls, currentMap.value!.obstacles)
  )
  currentMap.value.cameras.forEach((camera, idx) => {
    const other = allCameraFOVs.filter((_, i) => i !== idx)
    canvas.drawCamera(camera, (id) => id, false, false, currentMap.value!.walls, currentMap.value!.obstacles, other)
  })
}

function onLoadedMetadata(): void {
  const v = cam1Video.value
  if (!v) return
  if (Number.isFinite(v.duration)) durationSec.value = v.duration
}

function syncPlay(): void {
  isPlaying.value = true
  const v1 = cam1Video.value
  const v2 = cam2Video.value
  if (!v1 || !v2) return
  // Keep cam2 near cam1; allow slight drift during playback.
  try {
    v2.currentTime = v1.currentTime
    void v2.play()
  } catch {
    // ignore
  }
}

function syncPause(): void {
  isPlaying.value = false
  cam2Video.value?.pause()
}

async function onSeeking(): Promise<void> {
  const v1 = cam1Video.value
  const v2 = cam2Video.value
  if (!v1 || !v2) return
  v2.currentTime = v1.currentTime
  await replay.seekTo(Math.round(v1.currentTime * 1000))
}

async function onScrub(e: Event): Promise<void> {
  const value = Number((e.target as HTMLInputElement).value)
  const v1 = cam1Video.value
  const v2 = cam2Video.value
  if (!v1 || !v2) return
  v1.pause()
  v2.pause()
  isPlaying.value = false
  v1.currentTime = value
  v2.currentTime = value
  currentSec.value = value
  await replay.seekTo(Math.round(value * 1000))
}

function togglePlay(): void {
  const v1 = cam1Video.value
  const v2 = cam2Video.value
  if (!v1 || !v2) return
  if (v1.paused) {
    void v1.play()
  } else {
    v1.pause()
    v2.pause()
  }
}

onMounted(async () => {
  await loadSiteMap()
  await nextTick()
  drawMap()
  await replay.openRecording(recordingId.value)
})

watch(recordingId, async (id) => {
  if (!id) return
  await replay.openRecording(id)
})

// Keep current time display in sync
const clockInterval = window.setInterval(() => {
  const v = cam1Video.value
  if (!v) return
  currentSec.value = v.currentTime
}, 100)

onUnmounted(() => {
  window.clearInterval(clockInterval)
})
</script>


