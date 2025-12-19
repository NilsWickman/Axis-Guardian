<template>
  <div class="h-full w-full bg-background flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="font-semibold">Replay</div>
        <div v-if="recordingId" class="text-xs font-mono text-muted-foreground truncate">
          {{ recordingId }}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isDebugMode"
          class="px-2 py-1.5 text-xs font-semibold rounded border border-border hover:bg-accent"
          :class="showDetectionBoxes ? 'bg-accent' : ''"
          title="Show detection bounding boxes on video"
          @click="showDetectionBoxes = !showDetectionBoxes"
        >
          Boxes <span class="ml-1 font-mono opacity-80">({{ visibleDetectionBoxes.length }})</span>
        </button>

        <select
          v-if="replay.manifest.value?.cameras?.length"
          v-model="selectedCameraId"
          class="px-2 py-1.5 rounded border border-border bg-background text-xs"
        >
          <option
            v-for="c in replay.manifest.value.cameras"
            :key="c.cameraId"
            :value="c.cameraId"
          >
            {{ c.label }}
          </option>
        </select>

        <div class="flex items-center rounded border border-border overflow-hidden">
          <button
            class="px-2 py-1.5 text-xs font-semibold hover:bg-accent"
            :class="viewMode === 'camera' ? 'bg-accent' : ''"
            @click="viewMode = 'camera'"
          >
            Camera
          </button>
          <button
            class="px-2 py-1.5 text-xs font-semibold hover:bg-accent border-l border-border"
            :class="viewMode === 'split' ? 'bg-accent' : ''"
            @click="viewMode = 'split'"
          >
            Split
          </button>
          <button
            class="px-2 py-1.5 text-xs font-semibold hover:bg-accent border-l border-border"
            :class="viewMode === 'map' ? 'bg-accent' : ''"
            @click="viewMode = 'map'"
          >
            Map
          </button>
        </div>

        <div v-if="replay.isLoading.value" class="text-xs text-muted-foreground">Loading…</div>
        <div v-else-if="replay.error.value" class="text-xs text-destructive">{{ replay.error.value }}</div>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex-1 p-2 overflow-hidden">
      <div
        class="h-full grid gap-2 overflow-hidden"
        :class="viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'"
      >
        <!-- Camera -->
        <div
          v-show="viewMode !== 'map'"
          class="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
        >
          <div class="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
            {{ selectedCameraLabel }}
          </div>
          <div class="flex-1 bg-black overflow-hidden relative">
            <video
              ref="masterVideo"
              :src="selectedCameraSrc"
              class="w-full h-full object-contain"
              playsinline
              preload="auto"
              @loadedmetadata="onLoadedMetadata"
              @play="onPlay"
              @pause="onPause"
              @seeked="onSeeked"
              @timeupdate="onTimeUpdate"
            />

            <div v-if="isDebugMode" class="absolute left-2 top-2 z-20 pointer-events-none">
              <div class="px-2 py-1 rounded bg-black/60 text-white text-[11px] font-mono leading-relaxed">
                <div>cam={{ selectedCameraId }} t={{ currentVideoTimeMs }}ms</div>
                <div>tracks={{ globalTrackStore.activeTracks.length }} boxes={{ visibleDetectionBoxes.length }}</div>
                <div>layout: {{ videoLayout.drawW.toFixed(0) }}x{{ videoLayout.drawH.toFixed(0) }} offset={{ videoLayout.offsetX.toFixed(0) }},{{ videoLayout.offsetY.toFixed(0) }}</div>
                <div v-if="visibleDetectionBoxes[0]">
                  box0: x={{ visibleDetectionBoxes[0].bbox.x.toFixed(3) }} y={{ visibleDetectionBoxes[0].bbox.y.toFixed(3) }}
                </div>
              </div>
            </div>

            <div v-if="isDebugMode && showDetectionBoxes" class="absolute inset-0 z-10 pointer-events-none">
              <!-- Calibration crosshairs at video corners to verify coordinate system -->
              <div
                class="absolute w-4 h-4 border-l-2 border-t-2 border-yellow-400"
                :style="{ left: `${videoLayout.offsetX}px`, top: `${videoLayout.offsetY}px` }"
              />
              <div
                class="absolute w-4 h-4 border-r-2 border-t-2 border-yellow-400"
                :style="{ left: `${videoLayout.offsetX + videoLayout.drawW - 16}px`, top: `${videoLayout.offsetY}px` }"
              />
              <div
                class="absolute w-4 h-4 border-l-2 border-b-2 border-yellow-400"
                :style="{ left: `${videoLayout.offsetX}px`, top: `${videoLayout.offsetY + videoLayout.drawH - 16}px` }"
              />
              <div
                class="absolute w-4 h-4 border-r-2 border-b-2 border-yellow-400"
                :style="{ left: `${videoLayout.offsetX + videoLayout.drawW - 16}px`, top: `${videoLayout.offsetY + videoLayout.drawH - 16}px` }"
              />
              <!-- Detection boxes -->
              <div
                v-for="b in visibleDetectionBoxes"
                :key="b.id"
                class="absolute border-2 bg-black/0"
                :style="detectionBoxStyle(b)"
              >
                <div class="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono whitespace-nowrap">
                  {{ b.label }}|{{ b.cameraTrackId }} @{{ b.detVideoTimeMs ?? '?' }}ms
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Global map -->
        <div
          v-show="viewMode !== 'camera'"
          class="rounded-lg border border-border bg-card overflow-hidden flex flex-col"
        >
          <div class="px-3 py-2 border-b border-border text-xs font-semibold text-foreground">
            Global Map
          </div>
          <div class="flex-1 relative overflow-hidden" style="background-color: var(--canvas-background)">
            <canvas ref="mapCanvas" class="absolute inset-0" />
            <PersonPositionOverlay
              v-if="replayMap"
              :site-map="replayMap"
              :canvas-width="metersToPixels(extractValue(replayMap.width))"
              :canvas-height="metersToPixels(extractValue(replayMap.height))"
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
import { useSiteMapConfig, tryCreateSiteMapFromUnknown, type SiteMap } from '@/composables/useSiteMapConfig'
import { useDemoMode } from '@/composables/useDemoMode'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import PersonPositionOverlay from '@/components/features/site-map/PersonPositionOverlay.vue'
import { extractValue, metersToPixels, RENDER_SCALE } from '@/utils/siteMapConversion'

const route = useRoute()
const recordingId = computed(() => String(route.params.recordingId || ''))

const masterVideo = ref<HTMLVideoElement | null>(null)

const { loadSiteMap } = useSiteMapConfig()
const replayMap = ref<SiteMap | null>(null)
const mapCanvas = ref<HTMLCanvasElement | null>(null)
const canvasOptions = ref<CanvasRenderOptions>({
  showGrid: false,
  showScaleReference: false,
  showCameraLabels: false,
  pixelsPerMeter: RENDER_SCALE,
})
const canvas = useSiteMapCanvas(mapCanvas, canvasOptions)

const replay = useReplay({ masterVideo })

const durationSec = ref(0)
const currentSec = ref(0)
const isPlaying = ref(false)

const selectedCameraId = ref('')
const selectedCamera = computed(() => {
  const m = replay.manifest.value
  if (!m?.cameras?.length) return null
  return m.cameras.find(c => c.cameraId === selectedCameraId.value) ?? m.cameras[0] ?? null
})
const selectedCameraSrc = computed(() => selectedCamera.value?.videoUrl ?? '')
const selectedCameraLabel = computed(() => selectedCamera.value?.label ?? selectedCamera.value?.cameraId ?? 'Camera')
const viewMode = ref<'camera' | 'split' | 'map'>('split')

const { isDemoMode } = useDemoMode()
const isDebugMode = computed(() => !isDemoMode.value)
const showDetectionBoxes = ref(false)

const globalTrackStore = useGlobalTrackStore()

const videoLayout = ref({ offsetX: 0, offsetY: 0, drawW: 0, drawH: 0 })

function refreshOverlayRect(): void {
  const v = masterVideo.value
  if (!v) return
  const containerW = v.clientWidth
  const containerH = v.clientHeight
  const videoW = v.videoWidth
  const videoH = v.videoHeight
  if (!containerW || !containerH) return

  if (!videoW || !videoH) {
    videoLayout.value = { offsetX: 0, offsetY: 0, drawW: containerW, drawH: containerH }
    return
  }

  const scale = Math.min(containerW / videoW, containerH / videoH)
  const drawW = videoW * scale
  const drawH = videoH * scale
  videoLayout.value = {
    offsetX: (containerW - drawW) / 2,
    offsetY: (containerH - drawH) / 2,
    drawW,
    drawH,
  }
}

interface VisibleDetectionBox {
  id: string
  label: string
  cameraTrackId: string
  bbox: { x: number; y: number; width: number; height: number }
  detVideoTimeMs?: number
}

// Use currentSec as reactive dependency so visibleDetectionBoxes updates during playback
const currentVideoTimeMs = computed(() => {
  // Depend on currentSec to make this reactive during video playback
  void currentSec.value
  const v = masterVideo.value
  return v ? Math.round(v.currentTime * 1000) : 0
})

const visibleDetectionBoxes = computed<VisibleDetectionBox[]>(() => {
  const camId = selectedCameraId.value
  if (!camId) return []
  const nowMs = currentVideoTimeMs.value

  const results: VisibleDetectionBox[] = []
  for (const t of globalTrackStore.activeTracks) {
    const det = t.cameraDetections?.[camId]
    const bbox = det?.bbox
    if (!bbox) continue
    if (typeof det.videoTimeMs === 'number' && Math.abs(det.videoTimeMs - nowMs) > 500) continue

    // Get camera-specific track ID from associations
    const camAssoc = t.cameraAssociations?.get(camId)
    const camTrackIds = camAssoc?.trackIds ?? []
    const camTrackId = camTrackIds.length > 0 ? `cam${camTrackIds[camTrackIds.length - 1]}` : '?'

    results.push({
      id: `${t.globalTrackId}:${camId}`,
      label: t.globalTrackId.replace('global-', 'G'),
      cameraTrackId: camTrackId,
      bbox,
      detVideoTimeMs: det.videoTimeMs,
    })
  }
  return results
})

function detectionBoxStyle(b: VisibleDetectionBox): Record<string, string> {
  const { offsetX, offsetY, drawW, drawH } = videoLayout.value
  const left = offsetX + b.bbox.x * drawW
  const top = offsetY + b.bbox.y * drawH
  const width = b.bbox.width * drawW
  const height = b.bbox.height * drawH
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderColor: '#3b82f6',
  }
}

const pendingSeekSec = ref<number | null>(null)
const resumeAfterSwitch = ref(false)

function drawMap(): void {
  if (!replayMap.value) return
  const w = metersToPixels(extractValue(replayMap.value.width))
  const h = metersToPixels(extractValue(replayMap.value.height))
  canvas.resizeCanvas(w, h)
  canvas.clearCanvas()
  canvas.drawGrid()
  canvas.drawScaleReference()
  canvas.drawObstacles(replayMap.value.obstacles)
  canvas.drawWalls(replayMap.value.walls)
  const allCameraFOVs = replayMap.value.cameras.map(camera =>
    canvas.getCameraFOVPolygon(camera, replayMap.value!.walls, replayMap.value!.obstacles)
  )
  replayMap.value.cameras.forEach((camera, idx) => {
    const other = allCameraFOVs.filter((_, i) => i !== idx)
    canvas.drawCamera(camera, (id) => id, false, false, replayMap.value!.walls, replayMap.value!.obstacles, other)
  })
}

function onLoadedMetadata(): void {
  const v = masterVideo.value
  if (!v) return
  refreshOverlayRect()
  const manifestDurationMs = replay.manifest.value?.durationMs
  if (manifestDurationMs && Number.isFinite(manifestDurationMs)) {
    durationSec.value = Math.max(0, manifestDurationMs / 1000)
  } else if (Number.isFinite(v.duration)) {
    durationSec.value = v.duration
  }

  if (pendingSeekSec.value !== null) {
    try {
      v.currentTime = pendingSeekSec.value
    } catch {
      // ignore
    }
    pendingSeekSec.value = null
    if (resumeAfterSwitch.value) {
      try {
        void v.play()
      } catch {
        // ignore
      }
    }
    resumeAfterSwitch.value = false
  }
}

function onPlay(): void {
  isPlaying.value = true
}

function onPause(): void {
  isPlaying.value = false
}

function onTimeUpdate(): void {
  const v = masterVideo.value
  if (!v) return
  currentSec.value = v.currentTime
}

async function onSeeked(): Promise<void> {
  const v = masterVideo.value
  if (!v) return
  await replay.seekTo(Math.round(v.currentTime * 1000))
}

async function onScrub(e: Event): Promise<void> {
  const value = Number((e.target as HTMLInputElement).value)
  const v = masterVideo.value
  if (!v) return
  v.pause()
  isPlaying.value = false
  v.currentTime = value
  currentSec.value = value
}

function togglePlay(): void {
  const v = masterVideo.value
  if (!v) return
  if (v.paused) {
    void v.play()
  } else {
    v.pause()
  }
}

onMounted(async () => {
  await nextTick()
  refreshOverlayRect()
  await replay.openRecording(recordingId.value)
  window.addEventListener('resize', refreshOverlayRect)
})

watch(recordingId, async (id) => {
  if (!id) return
  refreshOverlayRect()
  await replay.openRecording(id)
})

watch(() => replay.manifest.value, async (m) => {
  if (!m) return

  if (!selectedCameraId.value || !m.cameras.some(c => c.cameraId === selectedCameraId.value)) {
    selectedCameraId.value = m.cameras[0]?.cameraId ?? ''
  }

  const mapFromRecording = tryCreateSiteMapFromUnknown(m.siteMapConfig)
  if (mapFromRecording) {
    replayMap.value = mapFromRecording
  } else {
    const fallback = await loadSiteMap()
    replayMap.value = fallback
  }

  await nextTick()
  drawMap()
}, { immediate: true })

watch(selectedCameraSrc, (newSrc, oldSrc) => {
  if (!newSrc || newSrc === oldSrc) return
  const v = masterVideo.value
  if (!v) return
  pendingSeekSec.value = v.currentTime
  resumeAfterSwitch.value = !v.paused
  v.pause()
})

watch(viewMode, async (mode) => {
  await nextTick()
  refreshOverlayRect()
  if (mode !== 'camera') drawMap()
})

// Keep current time display in sync
const clockInterval = window.setInterval(() => {
  const v = masterVideo.value
  if (!v) return
  currentSec.value = v.currentTime
}, 100)

watch(isDebugMode, (v) => {
  if (!v) showDetectionBoxes.value = false
}, { immediate: true })

onUnmounted(() => {
  window.clearInterval(clockInterval)
  window.removeEventListener('resize', refreshOverlayRect)
})
</script>
