<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTrackIdentityAnnotation } from '@/composables/useTrackIdentityAnnotation'
import { useTrackThumbnails, type OfflineTrackInfo } from '@/composables/useTrackThumbnails'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TrackVideoPlayer from '@/components/features/tracking/TrackVideoPlayer.vue'
import type { TrackVideoSegment } from '@/types/track-identity'

// Composables
const annotation = useTrackIdentityAnnotation()
const thumbnails = useTrackThumbnails()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// All tracks from detection files
const allTracks = ref<OfflineTrackInfo[]>([])
const currentTrackIndex = ref(0)

// Camera filter state
const selectedCamera = ref<string | null>(null) // null = all cameras

// Available cameras from loaded tracks
const availableCameras = computed(() => {
  const cameras = new Set<string>()
  for (const track of allTracks.value) {
    cameras.add(track.cameraId)
  }
  return Array.from(cameras).sort()
})

// Camera colors for visual distinction
const cameraColors: Record<string, string> = {
  camera1: '#3b82f6', // blue
  camera2: '#f97316', // orange
  camera3: '#22c55e', // green
  camera4: '#a855f7', // purple
}

// Filtered tracks based on selected camera
const filteredTracks = computed(() => {
  if (!selectedCamera.value) return allTracks.value
  return allTracks.value.filter(t => t.cameraId === selectedCamera.value)
})

// Cycle through cameras (null -> camera1 -> camera2 -> null)
function cycleCamera(): void {
  const cameras = availableCameras.value
  if (cameras.length === 0) return

  if (selectedCamera.value === null) {
    selectedCamera.value = cameras[0]
  } else {
    const currentIdx = cameras.indexOf(selectedCamera.value)
    if (currentIdx === cameras.length - 1) {
      selectedCamera.value = null // Back to "all"
    } else {
      selectedCamera.value = cameras[currentIdx + 1]
    }
  }

  // Reset to first track when camera changes
  currentTrackIndex.value = 0
  loadCurrentVideoSegment()
}

// Current video segment
const currentVideoSegment = ref<TrackVideoSegment | null>(null)
const isLoadingSegment = ref(false)

// Loading state
const isInitializing = ref(true)
const initError = ref<string | null>(null)

// Current track (uses filtered tracks)
const currentTrack = computed(() => {
  if (filteredTracks.value.length === 0) return null
  return filteredTracks.value[currentTrackIndex.value] ?? null
})

// Progress info (shows filtered count)
const progressInfo = computed(() => {
  const total = filteredTracks.value.length
  const current = currentTrackIndex.value + 1
  // Count annotated tracks in current filter
  const annotated = filteredTracks.value.filter(t => annotation.isTrackAnnotated(t.id)).length
  return { current, total, annotated }
})

const currentTrackPerson = computed(() => {
  if (!currentTrack.value) return null
  return annotation.getPersonForTrack(currentTrack.value.id)
})

// Current video element for playback
const currentVideoElement = computed(() => {
  if (!currentTrack.value) return null
  return thumbnails.getVideoElement(currentTrack.value.cameraId)
})

// Detection lookup callback for bounding box drawing
const getDetectionForCurrentTrack = computed(() => {
  if (!currentTrack.value) return undefined
  const { cameraId, trackId } = currentTrack.value
  return (timestamp: number) => thumbnails.getDetectionAtTimestamp(cameraId, trackId, timestamp)
})

// Person color for bounding box (white if unassigned)
const currentPersonColor = computed(() => {
  return currentTrackPerson.value?.color ?? '#ffffff'
})

// Video container size tracking
const videoContainerRef = ref<HTMLElement | null>(null)
const videoContainerSize = ref({ width: 600, height: 500 })

function updateContainerSize(): void {
  if (videoContainerRef.value) {
    const rect = videoContainerRef.value.getBoundingClientRect()
    // Leave some padding for the time info below
    videoContainerSize.value = {
      width: Math.floor(rect.width - 32),
      height: Math.floor(rect.height - 60)
    }
  }
}

// Load video segment for current track
function loadCurrentVideoSegment(): void {
  if (!currentTrack.value) {
    currentVideoSegment.value = null
    return
  }

  isLoadingSegment.value = true
  try {
    const segment = thumbnails.getVideoSegmentForTrack(
      currentTrack.value.cameraId,
      currentTrack.value.trackId
    )
    currentVideoSegment.value = segment
  } catch (e) {
    console.error('Failed to load video segment:', e)
    currentVideoSegment.value = null
  } finally {
    isLoadingSegment.value = false
  }
}

// Navigation (uses filtered tracks)
function goToTrack(index: number): void {
  if (index < 0 || index >= filteredTracks.value.length) return
  currentTrackIndex.value = index
  loadCurrentVideoSegment()
}

function nextTrack(): void {
  goToTrack(currentTrackIndex.value + 1)
}

function prevTrack(): void {
  goToTrack(currentTrackIndex.value - 1)
}

function goToNextUnannotated(): void {
  const tracks = filteredTracks.value
  for (let i = currentTrackIndex.value + 1; i < tracks.length; i++) {
    const track = tracks[i]
    if (!annotation.isTrackAnnotated(track.id)) {
      goToTrack(i)
      return
    }
  }
  // Wrap around
  for (let i = 0; i < currentTrackIndex.value; i++) {
    const track = tracks[i]
    if (!annotation.isTrackAnnotated(track.id)) {
      goToTrack(i)
      return
    }
  }
}

// Assign person to current track
function assignPerson(personId: number): void {
  if (!currentTrack.value) return
  annotation.assignPersonToTrack(currentTrack.value.id, personId)
}

// Mark track as invalid
function markAsInvalid(): void {
  if (!currentTrack.value) return
  annotation.assignPersonToTrack(currentTrack.value.id, 0) // 0 = Invalid
}

// Reset all annotations
function resetAnnotations(): void {
  if (confirm('Clear all annotations? This cannot be undone.')) {
    annotation.resetDataset('replay')
  }
}

// Handle keyboard shortcuts
function handleKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement) return

  // Number keys 1-9 assign person
  if (event.key >= '1' && event.key <= '9') {
    event.preventDefault()
    assignPerson(parseInt(event.key))
    return
  }

  // 0 assigns person 10
  if (event.key === '0') {
    event.preventDefault()
    assignPerson(10)
    return
  }

  switch (event.key) {
    case 'ArrowRight':
    case 'n':
      event.preventDefault()
      nextTrack()
      break
    case 'ArrowLeft':
    case 'p':
      event.preventDefault()
      prevTrack()
      break
    case 'u':
      event.preventDefault()
      goToNextUnannotated()
      break
    case 'x':
    case 'X':
      event.preventDefault()
      markAsInvalid()
      break
    case 'c':
    case 'C':
      event.preventDefault()
      cycleCamera()
      break
    case 'Delete':
    case 'Backspace':
      if (currentTrack.value) {
        event.preventDefault()
        annotation.unassignTrack(currentTrack.value.id)
      }
      break
    case 's':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        annotation.saveToLocalStorage()
      }
      break
  }
}

// Import file handler
function onImportClick(): void {
  fileInputRef.value?.click()
}

async function onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    await annotation.importFromJson(file)
  } catch (e) {
    console.error('Import failed:', e)
  }

  input.value = ''
}

// Format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ResizeObserver for video container
let resizeObserver: ResizeObserver | null = null

// Watch for container ref to become available (after loading finishes)
watch(videoContainerRef, (container) => {
  if (container && resizeObserver) {
    resizeObserver.observe(container)
    nextTick(() => updateContainerSize())
  }
})

// Lifecycle
onMounted(async () => {
  // Initialize annotation session
  annotation.initializeSession('replay')

  // Initialize thumbnail extraction and load detection files
  isInitializing.value = true
  try {
    await thumbnails.initialize()

    // Wait for videos to be ready
    let attempts = 0
    while (!thumbnails.areCamerasReady() && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 200))
      attempts++
    }

    // Get all tracks from detection files
    allTracks.value = thumbnails.getAllOfflineTracks()

    // Load first track's video segment
    if (allTracks.value.length > 0) {
      loadCurrentVideoSegment()
    }

    isInitializing.value = false
  } catch (e) {
    initError.value = e instanceof Error ? e.message : 'Failed to initialize'
    isInitializing.value = false
  }

  // Add keyboard listener
  window.addEventListener('keydown', handleKeydown)

  // Setup ResizeObserver for video container
  resizeObserver = new ResizeObserver(() => {
    updateContainerSize()
  })
  if (videoContainerRef.value) {
    resizeObserver.observe(videoContainerRef.value)
    updateContainerSize()
  }
})

onUnmounted(() => {
  thumbnails.cleanup()
  window.removeEventListener('keydown', handleKeydown)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-semibold">Track Identity Annotator</h1>
        <div v-if="!isInitializing" class="text-sm text-muted-foreground">
          Track {{ progressInfo.current }} of {{ progressInfo.total }}
          <span class="mx-2">|</span>
          {{ progressInfo.annotated }} annotated
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!annotation.isModified.value"
            @click="annotation.saveToLocalStorage()"
          >
            Save
          </Button>
          <Button variant="outline" size="sm" @click="annotation.exportAsJson()">
            Export
          </Button>
          <Button variant="outline" size="sm" @click="onImportClick">
            Import
          </Button>
          <Button variant="destructive" size="sm" @click="resetAnnotations">
            Reset
          </Button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="onFileSelected"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitializing" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <div class="text-lg font-medium">Loading detection data...</div>
        <div class="text-sm text-muted-foreground mt-2">This may take a moment for large files</div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="initError" class="flex-1 flex items-center justify-center">
      <div class="text-center text-destructive">
        <div class="text-lg font-medium">Failed to load</div>
        <div class="text-sm mt-2">{{ initError }}</div>
      </div>
    </div>

    <!-- No Tracks State -->
    <div v-else-if="allTracks.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <div class="text-lg font-medium">No tracks found</div>
        <div class="text-sm mt-2">Detection files may be empty or not loaded</div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 flex flex-col p-4 overflow-hidden">
      <!-- Track Info Bar -->
      <div class="flex items-center gap-4 mb-4">
        <!-- Navigation -->
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentTrackIndex === 0"
            @click="prevTrack"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentTrackIndex >= filteredTracks.length - 1"
            @click="nextTrack"
          >
            Next
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="goToNextUnannotated"
          >
            Next Unannotated
          </Button>
        </div>

        <!-- Camera Filter (clickable) -->
        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer"
          :style="{
            borderColor: selectedCamera ? cameraColors[selectedCamera] ?? '#6b7280' : '#6b7280',
            backgroundColor: selectedCamera ? (cameraColors[selectedCamera] ?? '#6b7280') + '20' : 'transparent'
          }"
          title="Click to cycle cameras"
          @click="cycleCamera"
        >
          <span
            v-if="selectedCamera"
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: cameraColors[selectedCamera] ?? '#6b7280' }"
          />
          <span class="font-mono text-sm font-medium">
            {{ selectedCamera ?? 'All Cameras' }}
          </span>
          <span class="text-xs text-muted-foreground">
            ({{ filteredTracks.length }})
          </span>
        </button>

        <!-- Track Info -->
        <div v-if="currentTrack" class="flex-1 flex items-center gap-4">
          <div class="font-mono text-sm bg-muted px-3 py-1 rounded">
            Track #{{ currentTrack.trackId }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ currentTrack.frameCount }} frames
            <span class="mx-1">|</span>
            {{ formatDuration(currentTrack.firstSeen) }} - {{ formatDuration(currentTrack.lastSeen) }}
            <span class="mx-1">|</span>
            {{ (currentTrack.avgConfidence * 100).toFixed(0) }}% conf
          </div>
        </div>

        <!-- Current Assignment -->
        <div v-if="currentTrackPerson" class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Assigned:</span>
          <span
            class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold"
            :style="{ backgroundColor: currentTrackPerson.color }"
          >
            {{ currentTrackPerson.id }}
          </span>
        </div>
      </div>

      <!-- Video Display -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- Main Video Area -->
        <Card class="flex-1 flex flex-col min-h-0">
          <CardHeader class="py-3">
            <CardTitle class="text-base">Track Video</CardTitle>
          </CardHeader>
          <CardContent ref="videoContainerRef" class="flex-1 flex flex-col items-center justify-center p-4">
            <div v-if="isLoadingSegment" class="text-center">
              <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <div class="text-sm text-muted-foreground">Loading video...</div>
            </div>
            <div v-else-if="currentVideoSegment && currentVideoElement" class="flex flex-col items-center">
              <TrackVideoPlayer
                :segment="currentVideoSegment"
                :video-element="currentVideoElement"
                :is-active="true"
                :get-detection="getDetectionForCurrentTrack"
                :person-color="currentPersonColor"
                :container-size="videoContainerSize"
              />
              <!-- Track time info -->
              <div class="text-sm text-muted-foreground mt-4">
                {{ formatDuration(currentVideoSegment.startTimestamp) }} -
                {{ formatDuration(currentVideoSegment.endTimestamp) }}
              </div>
            </div>
            <div v-else class="text-center text-muted-foreground">
              No video available for this track
            </div>
          </CardContent>
        </Card>

        <!-- Person Assignment Panel -->
        <Card class="w-80 flex-shrink-0 overflow-y-auto">
          <CardHeader class="py-3">
            <CardTitle class="text-base">Assign Person</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Invalid/Reflection button -->
            <button
              class="w-full mb-3 py-2 px-4 rounded-lg border-2 border-gray-500 bg-gray-100 dark:bg-gray-800 flex items-center justify-center gap-2 transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
              :class="{
                'ring-2 ring-offset-2 ring-primary': currentTrackPerson?.id === 0,
              }"
              title="Mark as Invalid/Reflection (X)"
              @click="markAsInvalid"
            >
              <span class="text-gray-600 dark:text-gray-400 font-medium">Mark as Invalid / Reflection</span>
            </button>

            <!-- Person grid -->
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="person in annotation.persons.value.filter(p => p.id > 0)"
                :key="person.id"
                class="relative flex flex-col items-center justify-center rounded-lg border-2 p-1 transition-all hover:scale-105"
                :class="{
                  'ring-2 ring-offset-2 ring-primary': currentTrackPerson?.id === person.id,
                }"
                :style="{
                  borderColor: person.color,
                }"
                :title="`Assign Person ${person.id}`"
                @click="assignPerson(person.id)"
              >
                <!-- Thumbnail or number -->
                <div
                  class="w-14 h-14 rounded overflow-hidden flex items-center justify-center"
                  :style="{ backgroundColor: person.thumbnailUrl ? 'transparent' : person.color + '20' }"
                >
                  <img
                    v-if="person.thumbnailUrl"
                    :src="person.thumbnailUrl"
                    :alt="`Person ${person.id}`"
                    class="w-full h-full object-cover object-top"
                  />
                  <span
                    v-else
                    class="text-xl font-bold"
                    :style="{ color: person.color }"
                  >
                    {{ person.id }}
                  </span>
                </div>
              </button>
            </div>

            <div class="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
              <div><kbd class="px-1 bg-muted rounded">1-9, 0</kbd> Assign person 1-10</div>
              <div><kbd class="px-1 bg-muted rounded">X</kbd> Mark as Invalid</div>
              <div><kbd class="px-1 bg-muted rounded">&larr;</kbd> <kbd class="px-1 bg-muted rounded">&rarr;</kbd> Navigate tracks</div>
              <div><kbd class="px-1 bg-muted rounded">U</kbd> Next unannotated</div>
              <div><kbd class="px-1 bg-muted rounded">C</kbd> Cycle cameras</div>
              <div><kbd class="px-1 bg-muted rounded">Del</kbd> Remove assignment</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Track List (mini) -->
      <Card class="mt-4 max-h-32">
        <CardContent class="py-2 overflow-x-auto">
          <div class="flex gap-1">
            <button
              v-for="(track, idx) in filteredTracks"
              :key="track.id"
              class="w-8 h-8 rounded text-xs font-mono flex-shrink-0 transition-colors border-2"
              :class="{
                'bg-primary text-primary-foreground': idx === currentTrackIndex,
                'bg-green-500 text-white': idx !== currentTrackIndex && annotation.isTrackAnnotated(track.id),
                'bg-muted hover:bg-muted/80': idx !== currentTrackIndex && !annotation.isTrackAnnotated(track.id),
              }"
              :style="{
                borderColor: !selectedCamera ? (cameraColors[track.cameraId] ?? 'transparent') : 'transparent'
              }"
              :title="`${track.cameraId} #${track.trackId}`"
              @click="goToTrack(idx)"
            >
              {{ track.trackId }}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
