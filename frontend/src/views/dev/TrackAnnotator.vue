<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// Current video segment
const currentVideoSegment = ref<TrackVideoSegment | null>(null)
const isLoadingSegment = ref(false)

// Loading state
const isInitializing = ref(true)
const initError = ref<string | null>(null)

// Current track
const currentTrack = computed(() => {
  if (allTracks.value.length === 0) return null
  return allTracks.value[currentTrackIndex.value] ?? null
})

// Progress info
const progressInfo = computed(() => {
  const total = allTracks.value.length
  const current = currentTrackIndex.value + 1
  const annotated = annotation.stats.value?.uniqueTracks ?? 0
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

// Navigation
function goToTrack(index: number): void {
  if (index < 0 || index >= allTracks.value.length) return
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
  for (let i = currentTrackIndex.value + 1; i < allTracks.value.length; i++) {
    const track = allTracks.value[i]
    if (!annotation.isTrackAnnotated(track.id)) {
      goToTrack(i)
      return
    }
  }
  // Wrap around
  for (let i = 0; i < currentTrackIndex.value; i++) {
    const track = allTracks.value[i]
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
})

onUnmounted(() => {
  thumbnails.cleanup()
  window.removeEventListener('keydown', handleKeydown)
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
            :disabled="currentTrackIndex >= allTracks.length - 1"
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

        <!-- Track Info -->
        <div v-if="currentTrack" class="flex-1 flex items-center gap-4">
          <div class="font-mono text-sm bg-muted px-3 py-1 rounded">
            {{ currentTrack.cameraId }} / Track #{{ currentTrack.trackId }}
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
          <CardContent class="flex-1 flex flex-col items-center justify-center">
            <div v-if="isLoadingSegment" class="text-center">
              <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <div class="text-sm text-muted-foreground">Loading video...</div>
            </div>
            <div v-else-if="currentVideoSegment && currentVideoElement" class="flex flex-col items-center">
              <TrackVideoPlayer
                :segment="currentVideoSegment"
                :video-element="currentVideoElement"
                :is-active="true"
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
              v-for="(track, idx) in allTracks"
              :key="track.id"
              class="w-8 h-8 rounded text-xs font-mono flex-shrink-0 transition-colors"
              :class="{
                'bg-primary text-primary-foreground': idx === currentTrackIndex,
                'bg-green-500 text-white': idx !== currentTrackIndex && annotation.isTrackAnnotated(track.id),
                'bg-muted hover:bg-muted/80': idx !== currentTrackIndex && !annotation.isTrackAnnotated(track.id),
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
