<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTrackIdentityAnnotation } from '@/composables/useTrackIdentityAnnotation'
import { useTrackThumbnails, type OfflineTrackInfo } from '@/composables/useTrackThumbnails'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TrackThumbnailSet } from '@/types/track-identity'

// Composables
const annotation = useTrackIdentityAnnotation()
const thumbnails = useTrackThumbnails()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// All tracks from detection files
const allTracks = ref<OfflineTrackInfo[]>([])
const currentTrackIndex = ref(0)

// Current track thumbnails
const currentThumbnails = ref<TrackThumbnailSet | null>(null)
const isLoadingThumbnails = ref(false)
const currentImageIndex = ref(0)

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

// Current thumbnail
const currentThumbnail = computed(() => {
  if (!currentThumbnails.value || currentThumbnails.value.thumbnails.length === 0) return null
  return currentThumbnails.value.thumbnails[currentImageIndex.value] ?? null
})

// Total images count
const totalImages = computed(() => currentThumbnails.value?.thumbnails.length ?? 0)

// Load thumbnails for current track
async function loadCurrentThumbnails(): Promise<void> {
  if (!currentTrack.value) {
    currentThumbnails.value = null
    currentImageIndex.value = 0
    return
  }

  isLoadingThumbnails.value = true
  currentImageIndex.value = 0
  try {
    const thumbs = await thumbnails.getThumbnailsForOfflineTrack(
      currentTrack.value.cameraId,
      currentTrack.value.trackId
    )
    currentThumbnails.value = thumbs
  } catch (e) {
    console.error('Failed to load thumbnails:', e)
    currentThumbnails.value = null
  } finally {
    isLoadingThumbnails.value = false
  }
}

// Image carousel navigation
function nextImage(): void {
  if (totalImages.value > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % totalImages.value
  }
}

function prevImage(): void {
  if (totalImages.value > 0) {
    currentImageIndex.value = (currentImageIndex.value - 1 + totalImages.value) % totalImages.value
  }
}

function goToImage(index: number): void {
  if (index >= 0 && index < totalImages.value) {
    currentImageIndex.value = index
  }
}

// Navigation
function goToTrack(index: number): void {
  if (index < 0 || index >= allTracks.value.length) return
  currentTrackIndex.value = index
  loadCurrentThumbnails()
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

// Set current image as person thumbnail
function setPersonThumbnail(personId: number): void {
  if (!currentThumbnail.value) return
  annotation.setPersonThumbnail(personId, currentThumbnail.value.dataUrl)
}

// Clear person thumbnail
function clearPersonThumbnail(personId: number): void {
  annotation.clearPersonThumbnail(personId)
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
      event.preventDefault()
      if (event.shiftKey) {
        nextImage()
      } else {
        nextTrack()
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (event.shiftKey) {
        prevImage()
      } else {
        prevTrack()
      }
      break
    case 'n':
      event.preventDefault()
      nextTrack()
      break
    case 'p':
      event.preventDefault()
      prevTrack()
      break
    case ',':
    case '<':
      event.preventDefault()
      prevImage()
      break
    case '.':
    case '>':
      event.preventDefault()
      nextImage()
      break
    case 'u':
      event.preventDefault()
      goToNextUnannotated()
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

    // Load first track's thumbnails
    if (allTracks.value.length > 0) {
      await loadCurrentThumbnails()
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

      <!-- Thumbnails Display -->
      <div class="flex-1 flex gap-4 min-h-0">
        <!-- Main Thumbnail Area -->
        <Card class="flex-1 flex flex-col min-h-0">
          <CardHeader class="py-3">
            <CardTitle class="text-base">Track Images</CardTitle>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col items-center justify-center">
            <div v-if="isLoadingThumbnails" class="text-center">
              <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <div class="text-sm text-muted-foreground">Extracting images...</div>
            </div>
            <div v-else-if="currentThumbnail" class="flex flex-col items-center w-full max-w-md">
              <!-- Main image -->
              <div class="relative w-full rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  :src="currentThumbnail.dataUrl"
                  :alt="`Track thumbnail ${currentImageIndex + 1}`"
                  class="w-full h-auto max-h-[400px] object-contain"
                />
                <!-- Image info overlay -->
                <div class="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/50 text-white text-sm flex justify-between">
                  <span>{{ formatDuration(currentThumbnail.timestamp) }}</span>
                  <span>{{ (currentThumbnail.confidence * 100).toFixed(0) }}% confidence</span>
                </div>
              </div>

              <!-- Carousel controls -->
              <div class="flex items-center justify-center gap-4 mt-4">
                <!-- Previous button -->
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="totalImages <= 1"
                  @click="prevImage"
                >
                  &larr;
                </Button>

                <!-- Dots indicator -->
                <div class="flex items-center gap-2">
                  <button
                    v-for="idx in totalImages"
                    :key="idx"
                    class="w-3 h-3 rounded-full transition-colors"
                    :class="idx - 1 === currentImageIndex ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'"
                    @click="goToImage(idx - 1)"
                  />
                </div>

                <!-- Next button -->
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="totalImages <= 1"
                  @click="nextImage"
                >
                  &rarr;
                </Button>
              </div>

              <!-- Image counter -->
              <div class="text-sm text-muted-foreground mt-2">
                Image {{ currentImageIndex + 1 }} of {{ totalImages }}
              </div>
            </div>
            <div v-else class="text-center text-muted-foreground">
              No images available for this track
            </div>
          </CardContent>
        </Card>

        <!-- Person Assignment Panel -->
        <Card class="w-80 flex-shrink-0 overflow-y-auto">
          <CardHeader class="py-3">
            <CardTitle class="text-base">Assign Person</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="person in annotation.persons.value"
                :key="person.id"
                class="relative group flex flex-col items-center justify-center rounded-lg border-2 p-1 transition-all hover:scale-105"
                :class="{
                  'ring-2 ring-offset-2 ring-primary': currentTrackPerson?.id === person.id,
                }"
                :style="{
                  borderColor: person.color,
                }"
                :title="`Click: Assign Person ${person.id}\nRight-click: Set thumbnail from current image`"
                @click="assignPerson(person.id)"
                @contextmenu.prevent="currentThumbnail ? setPersonThumbnail(person.id) : null"
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
                    class="w-full h-full object-cover"
                  />
                  <span
                    v-else
                    class="text-xl font-bold"
                    :style="{ color: person.color }"
                  >
                    {{ person.id }}
                  </span>
                </div>
                <!-- Person number badge -->
                <div
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  :style="{ backgroundColor: person.color }"
                >
                  {{ person.id }}
                </div>
                <!-- Clear thumbnail button (on hover) -->
                <button
                  v-if="person.thumbnailUrl"
                  class="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Clear thumbnail"
                  @click.stop="clearPersonThumbnail(person.id)"
                >
                  &times;
                </button>
              </button>
            </div>

            <div class="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
              <div><kbd class="px-1 bg-muted rounded">1-9, 0</kbd> Assign person 1-10</div>
              <div><kbd class="px-1 bg-muted rounded">&larr;</kbd> <kbd class="px-1 bg-muted rounded">&rarr;</kbd> Navigate tracks</div>
              <div><kbd class="px-1 bg-muted rounded">,</kbd> <kbd class="px-1 bg-muted rounded">.</kbd> Cycle images</div>
              <div><kbd class="px-1 bg-muted rounded">U</kbd> Next unannotated</div>
              <div><kbd class="px-1 bg-muted rounded">Del</kbd> Remove assignment</div>
              <div class="mt-2 text-muted-foreground/70">Right-click button to set thumbnail</div>
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
