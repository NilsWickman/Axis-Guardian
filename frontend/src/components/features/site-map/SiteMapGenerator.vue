<template>
  <div class="site-map-generator">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Generate Site Map from Cameras
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Automatically create a site map using depth estimation from connected cameras
        </p>
      </div>

      <button
        v-if="!generationStore.isGenerating && generationStore.lastGeneratedMap"
        @click="clearGeneration"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Clear Results
      </button>
    </div>

    <!-- Service Status -->
    <div v-if="generationStore.serviceAvailable === false" class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="font-medium text-yellow-800 dark:text-yellow-200">Site Map Generation Service Unavailable</p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            The generation service is not running. Start it with: <code class="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-800 rounded">make sitemap-service</code>
          </p>
        </div>
      </div>
    </div>

    <!-- Camera Selection -->
    <div v-if="!generationStore.isGenerating && !generationStore.lastGeneratedMap" class="space-y-4">
      <!-- Camera Checklist -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">Connected Cameras</h4>

        <div v-if="cameraStore.onlineCameras.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No online cameras available
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="camera in cameraStore.onlineCameras"
            :key="camera.id"
            class="flex items-center gap-2 text-sm"
          >
            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-900 dark:text-white font-medium">{{ camera.name }}</span>
            <span class="text-gray-500 dark:text-gray-400 text-xs">
              ({{ camera.position.x.toFixed(1) }}m, {{ camera.position.y.toFixed(1) }}m)
            </span>
          </div>
        </div>
      </div>

      <!-- Generate Button -->
      <button
        @click="startGeneration"
        :disabled="!generationStore.canGenerate || cameraStore.onlineCameras.length === 0"
        class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        <span v-if="cameraStore.onlineCameras.length === 0">No Cameras Available</span>
        <span v-else>Generate Site Map from {{ cameraStore.onlineCameras.length }} Camera{{ cameraStore.onlineCameras.length > 1 ? 's' : '' }}</span>
      </button>

      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        This process may take 1-2 minutes depending on the number of cameras
      </p>
    </div>

    <!-- Generation Progress -->
    <div v-if="generationStore.isGenerating" class="space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ generationStore.progressMessage || 'Processing...' }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ generationStore.progressPercentage }}%
            </span>
          </div>

          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${generationStore.progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Current Camera -->
        <div v-if="generationStore.progress" class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="(generationStore.progress as any).current_camera">
            Processing: <span class="font-medium text-gray-900 dark:text-white">{{ (generationStore.progress as any).current_camera }}</span>
          </span>
        </div>

        <!-- Spinner -->
        <div class="flex justify-center mt-6">
          <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- Generation Results -->
    <div v-if="generationStore.lastGeneratedMap && !generationStore.isGenerating" class="space-y-4">
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="font-medium text-green-800 dark:text-green-200">Site Map Generated Successfully</p>
            <div class="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
              <p><strong>Walls Detected:</strong> {{ generationStore.lastGeneratedMap.walls.length }}</p>
              <p><strong>Fog of War Regions:</strong> {{ generationStore.lastGeneratedMap.fog_of_war_regions.length }}</p>
              <p><strong>Dimensions:</strong> {{ (generationStore.lastGeneratedMap.width / generationStore.lastGeneratedMap.scale).toFixed(1) }}m × {{ (generationStore.lastGeneratedMap.height / generationStore.lastGeneratedMap.scale).toFixed(1) }}m</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="applyToCurrentMap"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Apply to Current Site Map
        </button>

        <button
          @click="downloadSiteMap"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
        >
          Download JSON
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="generationStore.error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <p class="font-medium text-red-800 dark:text-red-200">Generation Failed</p>
          <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ generationStore.error }}</p>
        </div>
        <button
          @click="generationStore.clearError"
          class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </path>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCameraStore } from '../../../stores/cameras'
import { useSiteMapGenerationStore } from '../../../stores/siteMapGeneration'
import { useSiteMapStore } from '../../../stores/siteMaps'

const cameraStore = useCameraStore()
const generationStore = useSiteMapGenerationStore()
const siteMapStore = useSiteMapStore()

// Check service availability on mount
onMounted(async () => {
  await generationStore.checkServiceAvailability()
})

// Start generation
async function startGeneration() {
  try {
    await generationStore.generateFromAllOnlineCameras()
  } catch (error) {
    console.error('Generation failed:', error)
  }
}

// Clear generation results
function clearGeneration() {
  generationStore.resetGeneration()
}

// Apply generated map to current site map
function applyToCurrentMap() {
  if (!generationStore.lastGeneratedMap) return

  const generatedMap = generationStore.lastGeneratedMap

  // Convert generated walls to site map walls
  const newWalls = generatedMap.walls.map((wall) => ({
    id: wall.id,
    start: wall.start,
    end: wall.end,
    type: (wall.type === 'assumed' ? 'internal' : wall.type) as 'external' | 'internal' | 'door',
    thickness: wall.confidence < 0.5 ? 2 : 4, // Thinner for low confidence
  }))

  // Update current site map
  const activeSiteMap = siteMapStore.activeSiteMap
  if (activeSiteMap) {
    // Add new walls
    newWalls.forEach((wall) => {
      siteMapStore.addWallToSiteMap(activeSiteMap.id, wall)
    })

    // Update cameras if needed
    generatedMap.cameras.forEach((camPlacement) => {
      const existing = activeSiteMap.cameras.find((c) => c.cameraId === camPlacement.cameraId)
      if (!existing) {
        siteMapStore.addCameraToSiteMap(activeSiteMap.id, camPlacement)
      }
    })
  }

  alert(`Applied ${newWalls.length} walls to site map`)
}

// Download site map as JSON
function downloadSiteMap() {
  if (!generationStore.lastGeneratedMap) return

  const dataStr = JSON.stringify(generationStore.lastGeneratedMap, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `sitemap-${generationStore.lastGeneratedMap.id}.json`
  link.click()

  URL.revokeObjectURL(url)
}
</script>
