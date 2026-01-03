<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDetectionFiles } from '@/composables/useDetectionFiles'
import { useMultiCameraVideoSync } from '@/composables/useMultiCameraVideoSync'
import { useKeyframeAnnotation } from '@/composables/useKeyframeAnnotation'
import { useSiteMapConfig } from '@/composables/useSiteMapConfig'
import SyncedCameraPanel from '@/components/features/annotation/SyncedCameraPanel.vue'
import KeyframeTimeline from '@/components/features/annotation/KeyframeTimeline.vue'
import PersonPalette from '@/components/features/annotation/PersonPalette.vue'
import SitemapAnnotationPanel from '@/components/features/annotation/SitemapAnnotationPanel.vue'
import type { CameraConfig, NormalizedBbox, SelectedDetection } from '@/types/keyframe-annotation'

// Camera configurations (all use .gz for faster loading)
const CAMERAS: CameraConfig[] = [
  { id: 'camera1', label: 'HC3', videoPath: '/cameras/view-HC3.mp4', detectionsPath: '/cameras/view-HC3.detections.json.gz' },
  { id: 'camera2', label: 'HC4', videoPath: '/cameras/view-HC4.mp4', detectionsPath: '/cameras/view-HC4.detections.json.gz' },
  { id: 'camera3', label: 'IP2', videoPath: '/cameras/view-IP2.mp4', detectionsPath: '/cameras/view-IP2.detections.json.gz' },
  { id: 'camera4', label: 'IP5', videoPath: '/cameras/view-IP5.mp4', detectionsPath: '/cameras/view-IP5.detections.json.gz' },
]

// Settings
const keyframeInterval = ref(5) // seconds

// Composables
const detectionFiles = useDetectionFiles()
const annotationManager = useKeyframeAnnotation()
const { siteMap, loadSiteMap } = useSiteMapConfig()

// Video refs for each camera
const cameraRefs = ref<Map<string, InstanceType<typeof SyncedCameraPanel>>>(new Map())

// Build video refs array for sync composable
const videoRefs = computed(() =>
  CAMERAS.map((cam) => ({
    cameraId: cam.id,
    element: computed(() => cameraRefs.value.get(cam.id)?.videoElement ?? null),
  }))
)

const videoSync = useMultiCameraVideoSync(videoRefs.value)

// Selection state
const selectedDetection = ref<SelectedDetection | null>(null)
const selectedPersonId = ref<number | null>(null)

// Track the last annotation that needs a position
const pendingPositionAnnotationId = ref<string | null>(null)

// Current detections for each camera
const cameraDetections = computed(() => {
  const timestamp = videoSync.masterTimestamp.value
  return CAMERAS.map((cam) => ({
    cameraId: cam.id,
    detections: detectionFiles.getDetectionsAtTimestamp(cam.id, timestamp),
  }))
})

// Annotations at current timestamp
const currentAnnotations = computed(() => {
  return annotationManager.getAnnotationsAtTimestamp(videoSync.masterTimestamp.value, 0.5)
})

// Count of annotations with positions
const positionedAnnotationsCount = computed(() => {
  return annotationManager.annotations.value.filter((a) => a.worldPosition).length
})

// Persons present at current timestamp (have detections with track truths)
const presentPersonIds = computed(() => {
  const ids = new Set<number>()
  for (const camDet of cameraDetections.value) {
    for (const det of camDet.detections) {
      const personId = annotationManager.getTrackTruthPersonId(camDet.cameraId, det.track_id)
      if (personId !== null && personId !== 0) { // Exclude "Invalid" (0)
        ids.add(personId)
      }
    }
  }
  return ids
})

// Get person color
function getPersonColor(personId: number): string {
  const person = annotationManager.getPersonById(personId)
  return person?.color ?? '#ffffff'
}

// Handle detection selection
function onDetectionSelected(cameraId: string, trackId: number, bbox: NormalizedBbox, _confidence: number): void {
  selectedDetection.value = {
    cameraId,
    trackId,
    bbox,
    timestamp: videoSync.masterTimestamp.value,
  }
  // Clear pending position when selecting new detection
  pendingPositionAnnotationId.value = null
}

// Handle person assignment
function onPersonSelected(personId: number): void {
  // Toggle person highlight (for showing their bboxes across cameras)
  if (selectedPersonId.value === personId) {
    selectedPersonId.value = null
  } else {
    selectedPersonId.value = personId
  }

  // If a detection is selected, assign the person to it
  if (selectedDetection.value) {
    const det = cameraDetections.value
      .find((cd) => cd.cameraId === selectedDetection.value!.cameraId)
      ?.detections.find((d) => d.track_id === selectedDetection.value!.trackId)

    const annotation = annotationManager.assignPerson({
      timestamp: videoSync.masterTimestamp.value,
      cameraId: selectedDetection.value.cameraId,
      trackId: selectedDetection.value.trackId,
      personId,
      bbox: det?.bbox ?? selectedDetection.value.bbox,
      confidence: det?.confidence ?? 0,
    })

    // Set this annotation as pending for position
    pendingPositionAnnotationId.value = annotation.id

    // Clear detection selection (but keep annotation selected for position)
    selectedDetection.value = null
    return
  }

  // No detection selected - find a detection with this person's track truth
  for (const camDet of cameraDetections.value) {
    for (const det of camDet.detections) {
      const truthPersonId = annotationManager.getTrackTruthPersonId(camDet.cameraId, det.track_id)
      if (truthPersonId === personId) {
        // Found a detection for this person - create annotation and go to position mode
        const annotation = annotationManager.assignPerson({
          timestamp: videoSync.masterTimestamp.value,
          cameraId: camDet.cameraId,
          trackId: det.track_id,
          personId,
          bbox: det.bbox,
          confidence: det.confidence,
        })

        // Set pending for position
        pendingPositionAnnotationId.value = annotation.id
        return
      }
    }
  }
}

// Handle sitemap click to set position
function onSitemapClick(x: number, y: number): void {
  if (pendingPositionAnnotationId.value) {
    annotationManager.setWorldPosition(pendingPositionAnnotationId.value, x, y)
    pendingPositionAnnotationId.value = null
  }
}

// Handle seek from timeline
async function onSeek(timestamp: number): Promise<void> {
  await videoSync.seekTo(timestamp)
}

// Handle prev/next keyframe
async function onPrevKeyframe(): Promise<void> {
  await videoSync.jumpToKeyframe('prev', keyframeInterval.value)
}

async function onNextKeyframe(): Promise<void> {
  await videoSync.jumpToKeyframe('next', keyframeInterval.value)
}

// Handle camera panel ready
function onCameraReady(cameraId: string, duration: number): void {
  videoSync.onMetadataLoaded(cameraId, duration)
}

// Handle time update from master camera (first camera)
function onTimeUpdate(currentTime: number): void {
  videoSync.onMasterTimeUpdate(currentTime)
}

// Export annotations
function exportAnnotations(): void {
  annotationManager.downloadDataset('cross-camera-annotations.json')
}

// Import annotations
function importAnnotations(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    annotationManager.importDataset(text)
  }
  input.click()
}

// Keyboard shortcuts
function onKeyDown(event: KeyboardEvent): void {
  // Ignore if in input field
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  // Space: toggle play/pause
  if (event.code === 'Space') {
    event.preventDefault()
    videoSync.togglePlayPause()
    return
  }

  // Arrow keys: prev/next keyframe
  if (event.code === 'ArrowLeft') {
    event.preventDefault()
    onPrevKeyframe()
    return
  }
  if (event.code === 'ArrowRight') {
    event.preventDefault()
    onNextKeyframe()
    return
  }

  // Escape: clear selection
  if (event.code === 'Escape') {
    selectedDetection.value = null
    pendingPositionAnnotationId.value = null
    return
  }

  // Number keys: assign person (only if detection selected)
  if (selectedDetection.value) {
    const num = parseInt(event.key)
    if (!isNaN(num)) {
      const personId = event.shiftKey ? num + 10 : num
      if (personId <= 20) {
        event.preventDefault()
        onPersonSelected(personId)
      }
    }
  }
}

// Set camera ref
function setCameraRef(cameraId: string, ref: InstanceType<typeof SyncedCameraPanel> | null): void {
  if (ref) {
    cameraRefs.value.set(cameraId, ref)
  } else {
    cameraRefs.value.delete(cameraId)
  }
}

// Initialize on mount
onMounted(async () => {
  // Load sitemap
  await loadSiteMap()

  // Load legacy track truths (for person thumbnails and track mappings)
  await annotationManager.loadTrackTruths()

  // Load detection files
  await detectionFiles.loadCameras(CAMERAS)

  // Initialize annotation session
  annotationManager.initializeSession(
    CAMERAS.map((c) => c.id),
    keyframeInterval.value,
    detectionFiles.videoDuration.value
  )

  // Add keyboard listener
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

// Re-initialize annotations when interval changes
watch(keyframeInterval, () => {
  annotationManager.initializeSession(
    CAMERAS.map((c) => c.id),
    keyframeInterval.value,
    detectionFiles.videoDuration.value
  )
})
</script>

<template>
  <div class="h-full w-full bg-background flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h1 class="font-semibold">Cross-Camera Annotator</h1>
        <span class="text-xs text-muted-foreground">
          {{ annotationManager.totalAnnotations.value }} annotations
          ({{ positionedAnnotationsCount }} with positions)
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- Keyframe interval selector -->
        <label class="flex items-center gap-2 text-xs">
          <span class="text-muted-foreground">Interval:</span>
          <select
            v-model="keyframeInterval"
            class="px-2 py-1 rounded border border-border bg-background text-xs"
          >
            <option :value="1">1s</option>
            <option :value="2">2s</option>
            <option :value="5">5s</option>
            <option :value="10">10s</option>
            <option :value="15">15s</option>
          </select>
        </label>

        <!-- Import/Export buttons -->
        <button
          class="px-2 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent"
          @click="importAnnotations"
        >
          Import
        </button>
        <button
          class="px-2 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent"
          @click="exportAnnotations"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="detectionFiles.isLoading.value" class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground">Loading detection files...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="detectionFiles.loadError.value" class="flex-1 flex items-center justify-center">
      <div class="text-destructive">{{ detectionFiles.loadError.value }}</div>
    </div>

    <!-- Main content -->
    <template v-else>
      <!-- Main grid: cameras on left, sitemap on right -->
      <div class="flex-1 p-2 flex gap-2 overflow-hidden min-h-0">
        <!-- Camera grid (2x2) - takes ~70% width -->
        <div class="flex-[2] grid grid-cols-2 grid-rows-2 gap-2 min-h-0">
          <SyncedCameraPanel
            v-for="(cam, idx) in CAMERAS"
            :key="cam.id"
            :ref="(r: any) => setCameraRef(cam.id, r)"
            :camera-id="cam.id"
            :camera-label="cam.label"
            :video-url="cam.videoPath"
            :detections="cameraDetections.find((cd) => cd.cameraId === cam.id)?.detections ?? []"
            :selected-track-id="selectedDetection?.cameraId === cam.id ? selectedDetection.trackId : null"
            :annotations="currentAnnotations.filter((a) => a.cameraId === cam.id)"
            :get-person-color="getPersonColor"
            :get-track-truth-person-id="annotationManager.getTrackTruthPersonId"
            :highlighted-person-id="selectedPersonId"
            @select-detection="onDetectionSelected"
            @video-ready="onCameraReady"
            @time-update="idx === 0 ? onTimeUpdate($event) : undefined"
          />
        </div>

        <!-- Sitemap panel - takes ~30% width -->
        <div class="flex-1 flex flex-col gap-2 min-h-0 min-w-0">
          <SitemapAnnotationPanel
            :site-map="siteMap"
            :annotations="currentAnnotations"
            :selected-annotation-id="pendingPositionAnnotationId"
            :get-person-color="getPersonColor"
            class="flex-1 min-h-0"
            @click-position="onSitemapClick"
          />
        </div>
      </div>

      <!-- Timeline -->
      <KeyframeTimeline
        :duration="videoSync.duration.value"
        :current-time="videoSync.masterTimestamp.value"
        :interval-seconds="keyframeInterval"
        :annotation-count="currentAnnotations.length"
        @seek="onSeek"
        @prev-keyframe="onPrevKeyframe"
        @next-keyframe="onNextKeyframe"
      />

      <!-- Person palette -->
      <PersonPalette
        :persons="annotationManager.persons.value"
        :selected-person-id="selectedPersonId"
        :annotation-counts="annotationManager.annotationCountByPerson.value"
        :has-selection="selectedDetection !== null"
        :present-person-ids="presentPersonIds"
        @select-person="onPersonSelected"
      />
    </template>
  </div>
</template>
