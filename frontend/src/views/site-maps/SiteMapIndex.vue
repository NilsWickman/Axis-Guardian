<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="border-b bg-card px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Site Maps</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Manage and view your site maps - manually created or auto-generated
          </p>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            to="/site-maps/generate"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Generate New Map
          </router-link>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="border-b bg-card px-6 py-3">
      <div class="flex items-center gap-4">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="activeFilter = filter.value"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeFilter === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          ]"
        >
          {{ filter.label }}
          <span v-if="filter.count" class="ml-2 text-xs opacity-70">({{ filter.count }})</span>
        </button>
      </div>
    </div>

    <!-- Site Maps Grid -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Empty State -->
      <div v-if="filteredMaps.length === 0" class="flex flex-col items-center justify-center h-full">
        <div class="text-center max-w-md">
          <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-foreground mb-2">No Site Maps Found</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Create your first site map by generating one from camera images
          </p>
          <router-link
            to="/site-maps/generate"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Generate Site Map
          </router-link>
        </div>
      </div>

      <!-- Site Maps Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="map in filteredMaps"
          :key="map.id"
          class="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewSiteMap(map)"
        >
          <!-- Thumbnail -->
          <div class="aspect-video bg-gray-900 relative">
            <div class="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </div>

            <!-- Source Badge -->
            <div class="absolute top-3 left-3">
              <span :class="[
                'px-2 py-1 text-xs font-medium rounded-md',
                map.source === 'generated-sfm' ? 'bg-blue-500/90 text-white' :
                map.source === 'generated-geometric' ? 'bg-green-500/90 text-white' :
                'bg-gray-500/90 text-white'
              ]">
                {{ getSourceLabel(map.source) }}
              </span>
            </div>

            <!-- 3D Badge -->
            <div v-if="map.reconstruction?.pointCloud" class="absolute top-3 right-3">
              <span class="px-2 py-1 text-xs font-medium rounded-md bg-purple-500/90 text-white flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
                3D
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="font-semibold text-foreground mb-1">{{ map.name }}</h3>
            <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
              {{ map.description }}
            </p>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-2 mb-3">
              <div class="text-center p-2 bg-muted rounded">
                <div class="text-xs text-muted-foreground">Cameras</div>
                <div class="text-sm font-semibold">{{ map.cameras.length }}</div>
              </div>
              <div class="text-center p-2 bg-muted rounded">
                <div class="text-xs text-muted-foreground">Walls</div>
                <div class="text-sm font-semibold">{{ map.walls.length }}</div>
              </div>
              <div class="text-center p-2 bg-muted rounded">
                <div class="text-xs text-muted-foreground">Area</div>
                <div class="text-sm font-semibold">{{ getAreaInMeters(map) }}m²</div>
              </div>
            </div>

            <!-- Generated Date -->
            <div class="text-xs text-muted-foreground mb-3">
              {{ map.generated_at ? 'Generated' : 'Created' }} {{ formatRelativeTime(map.generated_at || map.createdAt) }}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button
                @click.stop="viewSiteMap(map)"
                class="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                View 2D
              </button>
              <button
                v-if="map.reconstruction?.pointCloud"
                @click.stop="view3D(map)"
                class="flex-1 px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
              >
                View 3D
              </button>
              <button
                @click.stop="showOptions(map)"
                class="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { EnhancedSiteMap, SiteMapSource } from '@/types/sitemap'

const router = useRouter()

// Mock data - will be replaced with actual store/API
const siteMaps = ref<EnhancedSiteMap[]>([
  {
    id: 'sfm-auditorium-001',
    name: 'Auditorium Site Map',
    description: 'Auto-generated from 4 cameras using Structure from Motion',
    source: 'generated-sfm',
    width: 1800,
    height: 3200,
    scale: 50,
    origin: { x: 0, y: 0 },
    walls: Array(24).fill(null).map((_, i) => ({
      id: `wall-${i}`,
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
      type: 'external' as const,
      confidence: 0.85
    })),
    cameras: [
      {
        cameraId: 'camera1',
        x: 100,
        y: 200,
        rotation: 45,
        angle: -15,
        height: 1.68,
        fov: 92,
        viewDistance: 300,
        autoCalculateDistance: true,
        color: 'blue-500'
      },
      {
        cameraId: 'camera2',
        x: 300,
        y: 400,
        rotation: 135,
        angle: -15,
        height: 1.67,
        fov: 92,
        viewDistance: 300,
        autoCalculateDistance: true,
        color: 'green-500'
      },
      {
        cameraId: 'camera3',
        x: 500,
        y: 200,
        rotation: 225,
        angle: -15,
        height: 2.62,
        fov: 92,
        viewDistance: 300,
        autoCalculateDistance: true,
        color: 'red-500'
      },
      {
        cameraId: 'camera4',
        x: 700,
        y: 400,
        rotation: 315,
        angle: -15,
        height: 1.84,
        fov: 92,
        viewDistance: 300,
        autoCalculateDistance: true,
        color: 'purple-500'
      }
    ],
    reconstruction: {
      method: 'sfm',
      timestamp: new Date().toISOString(),
      pointCloud: {
        vertices: 124567,
        url: '/shared/site-maps/generated/sfm-auditorium-001/pointcloud.ply',
        format: 'ply'
      },
      cameraPoses: [
        {
          cameraId: 'camera1',
          position: [2.5, 4.2, 1.68],
          rotation: [0, 0.785, 0],
          confidence: 0.92
        }
      ]
    },
    cameras_used: ['camera1', 'camera2', 'camera3', 'camera4'],
    generated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
])

const activeFilter = ref<SiteMapSource | 'all'>('all')

const filters = computed(() => [
  { label: 'All Maps', value: 'all' as const, count: siteMaps.value.length },
  { label: 'SfM Generated', value: 'generated-sfm' as const, count: siteMaps.value.filter(m => m.source === 'generated-sfm').length },
  { label: 'GPS Generated', value: 'generated-geometric' as const, count: siteMaps.value.filter(m => m.source === 'generated-geometric').length },
  { label: 'Manual', value: 'manual' as const, count: siteMaps.value.filter(m => m.source === 'manual').length }
])

const filteredMaps = computed(() => {
  if (activeFilter.value === 'all') return siteMaps.value
  return siteMaps.value.filter(map => map.source === activeFilter.value)
})

function getSourceLabel(source: SiteMapSource): string {
  switch (source) {
    case 'generated-sfm': return 'SfM'
    case 'generated-geometric': return 'GPS'
    case 'manual': return 'Manual'
    default: return 'Unknown'
  }
}

function getAreaInMeters(map: EnhancedSiteMap): number {
  const widthM = map.width / map.scale
  const heightM = map.height / map.scale
  return Math.round(widthM * heightM)
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

function viewSiteMap(map: EnhancedSiteMap) {
  router.push(`/site-maps/${map.id}/view-2d`)
}

function view3D(map: EnhancedSiteMap) {
  router.push(`/site-maps/${map.id}/view-3d`)
}

function showOptions(map: EnhancedSiteMap) {
  console.log('Show options for', map.id)
  // TODO: Implement options menu (edit, delete, export)
}

onMounted(() => {
  // TODO: Load site maps from store/API
  console.log('Site maps loaded:', siteMaps.value.length)
})
</script>
