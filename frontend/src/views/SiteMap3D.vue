<template>
  <div class="site-map-3d h-screen flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">3D Site Map Generator</h1>
          <p class="text-sm text-gray-600 mt-1">
            Generate and visualize 3D reconstructions from camera videos
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="generateSiteMap"
            :disabled="isGenerating"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ isGenerating ? 'Generating...' : 'Generate Site Map' }}
          </button>
          <button
            @click="loadExistingSiteMap"
            :disabled="isGenerating || !availableMaps.length"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Load Existing
          </button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <div class="w-80 bg-gray-50 border-r overflow-y-auto">
        <div class="p-4 space-y-6">
          <!-- Generation Status -->
          <div v-if="isGenerating || generationStatus" class="bg-white rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold mb-3">Generation Status</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div
                  v-if="isGenerating"
                  class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
                ></div>
                <div
                  v-else-if="generationStatus?.status === 'completed'"
                  class="w-4 h-4 bg-green-500 rounded-full"
                ></div>
                <div
                  v-else-if="generationStatus?.status === 'error'"
                  class="w-4 h-4 bg-red-500 rounded-full"
                ></div>
                <span class="text-sm">{{ generationStatus?.message || 'Processing...' }}</span>
              </div>

              <!-- Progress Bar -->
              <div v-if="isGenerating" class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${generationStatus?.progress || 0}%` }"
                ></div>
              </div>

              <!-- Error Message -->
              <div
                v-if="generationStatus?.status === 'error'"
                class="text-sm text-red-600 bg-red-50 p-2 rounded"
              >
                {{ generationStatus.error }}
              </div>
            </div>
          </div>

          <!-- Available Camera Videos -->
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold mb-3">Camera Videos</h3>
            <div v-if="cameraVideos.length" class="space-y-2">
              <div
                v-for="video in cameraVideos"
                :key="video.name"
                class="text-sm p-2 bg-gray-50 rounded border"
              >
                <div class="font-medium">{{ video.name }}</div>
                <div class="text-gray-500 text-xs mt-1">
                  {{ formatFileSize(video.size) }}
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">No videos found</div>
          </div>

          <!-- Existing Site Maps -->
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold mb-3">Generated Maps</h3>
            <div v-if="availableMaps.length" class="space-y-2">
              <button
                v-for="map in availableMaps"
                :key="map.name"
                @click="loadSiteMap(map.name)"
                class="w-full text-left p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
              >
                <div class="font-medium text-sm">{{ map.name }}</div>
                <div class="text-gray-500 text-xs mt-1">
                  {{ formatDate(map.created) }} • {{ formatFileSize(map.size) }}
                </div>
              </button>
            </div>
            <div v-else class="text-sm text-gray-500">No maps generated yet</div>
          </div>

          <!-- View Controls -->
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold mb-3">View Controls</h3>
            <div class="space-y-3 text-sm">
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="showFloor" type="checkbox" class="rounded" />
                  <span>Show Floor</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="showWalls" type="checkbox" class="rounded" />
                  <span>Show Walls</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="showCameras" type="checkbox" class="rounded" />
                  <span>Show Cameras</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="showPointCloud" type="checkbox" class="rounded" />
                  <span>Show Point Cloud</span>
                </label>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="showGrid" type="checkbox" class="rounded" />
                  <span>Show Grid</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Camera Info -->
          <div v-if="sceneInfo" class="bg-white rounded-lg p-4 shadow-sm">
            <h3 class="font-semibold mb-3">Scene Info</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Cameras:</span>
                <span class="font-medium">{{ sceneInfo.cameras }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Walls:</span>
                <span class="font-medium">{{ sceneInfo.walls }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Points:</span>
                <span class="font-medium">{{ sceneInfo.points.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3D Viewer -->
      <div class="flex-1 relative bg-gray-900">
        <canvas ref="canvasRef" class="w-full h-full"></canvas>

        <!-- Overlay Controls -->
        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div class="text-xs text-gray-600 space-y-1">
            <div><kbd class="px-1 bg-gray-200 rounded">Left Click + Drag</kbd> Rotate</div>
            <div><kbd class="px-1 bg-gray-200 rounded">Right Click + Drag</kbd> Pan</div>
            <div><kbd class="px-1 bg-gray-200 rounded">Scroll</kbd> Zoom</div>
            <div><kbd class="px-1 bg-gray-200 rounded">R</kbd> Reset View</div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div
          v-if="isLoadingModel"
          class="absolute inset-0 bg-gray-900/80 flex items-center justify-center"
        >
          <div class="text-center text-white">
            <div class="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div class="text-lg font-medium">Loading 3D Model...</div>
          </div>
        </div>

        <!-- No Model Overlay -->
        <div
          v-if="!currentModel && !isLoadingModel"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="text-center text-white max-w-md">
            <div class="text-6xl mb-4">📐</div>
            <h2 class="text-2xl font-bold mb-2">No Site Map Loaded</h2>
            <p class="text-gray-400 mb-6">
              Generate a new 3D site map from your camera videos or load an existing one.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { use3DViewer } from '@/composables/use3DViewer'

interface CameraVideo {
  name: string
  size: number
  path: string
}

interface SiteMapFile {
  name: string
  size: number
  created: number
  url: string
}

interface GenerationStatus {
  status: 'idle' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  output_file: string | null
  error: string | null
}

const API_BASE = import.meta.env.VITE_SITE_MAP_API || 'http://localhost:8081'

// Refs
const canvasRef = ref<HTMLCanvasElement>()
const cameraVideos = ref<CameraVideo[]>([])
const availableMaps = ref<SiteMapFile[]>([])
const isGenerating = ref(false)
const isLoadingModel = ref(false)
const generationStatus = ref<GenerationStatus | null>(null)
const currentModel = ref<string | null>(null)

// View controls
const showFloor = ref(true)
const showWalls = ref(true)
const showCameras = ref(true)
const showPointCloud = ref(false)
const showGrid = ref(true)

const sceneInfo = ref<{ cameras: number; walls: number; points: number } | null>(null)

// 3D Viewer composable
const { initViewer, loadModel, updateVisibility, resetCamera, cleanup } = use3DViewer()

// Fetch available camera videos
async function fetchCameraVideos() {
  try {
    const response = await fetch(`${API_BASE}/api/cameras/list`)
    const data = await response.json()
    cameraVideos.value = data.videos || []
  } catch (error) {
    console.error('Failed to fetch camera videos:', error)
  }
}

// Fetch available site maps
async function fetchAvailableMaps() {
  try {
    const response = await fetch(`${API_BASE}/api/site-maps/list`)
    const data = await response.json()
    availableMaps.value = data.files || []
  } catch (error) {
    console.error('Failed to fetch site maps:', error)
  }
}

// Generate new site map
async function generateSiteMap() {
  isGenerating.value = true
  generationStatus.value = {
    status: 'processing',
    progress: 0,
    message: 'Starting generation...',
    output_file: null,
    error: null
  }

  try {
    const response = await fetch(`${API_BASE}/api/site-maps/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_name: `site_map_${Date.now()}`,
        device: 'cpu'
      })
    })

    if (!response.ok) {
      throw new Error('Generation failed to start')
    }

    // Poll for status
    pollGenerationStatus()
  } catch (error) {
    console.error('Failed to start generation:', error)
    generationStatus.value = {
      status: 'error',
      progress: 0,
      message: 'Failed to start generation',
      output_file: null,
      error: String(error)
    }
    isGenerating.value = false
  }
}

// Poll generation status
async function pollGenerationStatus() {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/site-maps/status`)
      const status: GenerationStatus = await response.json()

      generationStatus.value = status

      if (status.status === 'completed') {
        clearInterval(interval)
        isGenerating.value = false

        // Refresh available maps
        await fetchAvailableMaps()

        // Auto-load the generated map
        if (status.output_file) {
          await loadSiteMap(status.output_file)
        }
      } else if (status.status === 'error') {
        clearInterval(interval)
        isGenerating.value = false
      }
    } catch (error) {
      console.error('Failed to poll status:', error)
      clearInterval(interval)
      isGenerating.value = false
    }
  }, 1000)
}

// Load existing site map
async function loadExistingSiteMap() {
  if (availableMaps.value.length > 0) {
    await loadSiteMap(availableMaps.value[0].name)
  }
}

// Load specific site map
async function loadSiteMap(filename: string) {
  isLoadingModel.value = true
  currentModel.value = null

  try {
    const url = `${API_BASE}/api/site-maps/${filename}`
    const info = await loadModel(url)

    currentModel.value = filename
    sceneInfo.value = info

    console.log('Loaded site map:', filename, info)
  } catch (error) {
    console.error('Failed to load site map:', error)
    alert(`Failed to load site map: ${error}`)
  } finally {
    isLoadingModel.value = false
  }
}

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString()
}

// Watch for visibility changes
watch([showFloor, showWalls, showCameras, showPointCloud, showGrid], () => {
  updateVisibility({
    floor: showFloor.value,
    walls: showWalls.value,
    cameras: showCameras.value,
    pointCloud: showPointCloud.value,
    grid: showGrid.value
  })
})

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'r' || event.key === 'R') {
    resetCamera()
  }
}

// Lifecycle
onMounted(async () => {
  if (canvasRef.value) {
    initViewer(canvasRef.value)
  }

  await Promise.all([fetchCameraVideos(), fetchAvailableMaps()])

  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
kbd {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}
</style>
