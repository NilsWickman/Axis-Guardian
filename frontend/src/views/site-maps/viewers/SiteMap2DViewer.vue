<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="border-b bg-card px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link
            to="/site-maps"
            class="p-2 hover:bg-accent rounded transition-colors"
            title="Back to Site Maps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
          </router-link>
          <div>
            <h1 class="text-xl font-bold text-foreground">{{ activeSiteMap.name }}</h1>
            <p class="text-xs text-muted-foreground">2D Site Map Viewer with Person Position Tracking</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Controls -->
          <MapControls
            :show-grid="canvasOptions.showGrid"
            :show-labels="canvasOptions.showCameraLabels"
            :show-person-positions="showPersonPositions"
            @toggle-grid="canvasOptions.showGrid = !canvasOptions.showGrid"
            @toggle-labels="canvasOptions.showCameraLabels = !canvasOptions.showCameraLabels"
            @toggle-person-positions="showPersonPositions = !showPersonPositions"
          />
          <router-link
            :to="`/site-maps/${siteMapId}/view-3d`"
            class="px-3 py-2 border border-border rounded hover:bg-accent transition-colors text-sm"
          >
            View 3D
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-hidden">
      <!-- Use SiteMapViewer component with selector hidden -->
      <SiteMapViewer :hide-selector="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteMapStore } from '@/stores/siteMaps'
import type { CanvasRenderOptions } from '@/composables/useSiteMapCanvas'
import SiteMapViewer from '@/views/SiteMapViewer.vue'
import MapControls from '@/components/features/site-map/MapControls.vue'

const route = useRoute()
const siteMapId = ref(route.params.id as string)
const siteMapStore = useSiteMapStore()

console.log('[2D Viewer] Setup running - route.params.id:', route.params.id)
console.log('[2D Viewer] siteMapId.value:', siteMapId.value)
console.log('[2D Viewer] Current activeSiteMapId:', siteMapStore.activeSiteMapId)

// Set the active site map IMMEDIATELY during setup (before any child component renders)
if (siteMapId.value) {
  siteMapStore.setActiveSiteMap(siteMapId.value)
  console.log(`[2D Viewer] Set active site map to ${siteMapId.value}`)
} else {
  console.warn('[2D Viewer] No siteMapId from route params!')
}

// Use the store's active site map
const activeSiteMap = computed(() => siteMapStore.activeSiteMap)

// Canvas display options
const canvasOptions = reactive<CanvasRenderOptions>({
  showGrid: true,
  showScaleReference: true,
  showCameraLabels: true,
  pixelsPerMeter: 50
})

// Person position tracking toggle
const showPersonPositions = ref(true)
</script>
