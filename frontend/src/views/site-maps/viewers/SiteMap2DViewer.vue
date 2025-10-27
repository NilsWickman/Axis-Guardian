<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="border-b bg-card px-6 py-4">
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
            <h1 class="text-2xl font-bold text-foreground">{{ siteMap?.name || 'Site Map 2D View' }}</h1>
            <p class="text-sm text-muted-foreground mt-1">
              2D Canvas Visualization
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <router-link
            v-if="siteMap?.reconstruction?.pointCloud"
            :to="`/site-maps/${siteMapId}/view-3d`"
            class="px-3 py-2 border border-border rounded hover:bg-accent transition-colors text-sm"
          >
            View 3D
          </router-link>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="text-center max-w-md">
        <div class="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </div>

        <h2 class="text-2xl font-bold mb-3">2D Viewer Coming Soon</h2>
        <p class="text-muted-foreground mb-6">
          The 2D canvas viewer is being integrated. For now, please use the 3D viewer to explore your site map.
        </p>

        <div v-if="siteMap" class="mb-6 p-4 bg-muted rounded-lg text-left">
          <h3 class="font-semibold mb-3">Site Map Info</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Name:</span>
              <span class="font-medium">{{ siteMap.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Source:</span>
              <span class="font-medium">{{ getSourceLabel(siteMap.source) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Cameras:</span>
              <span class="font-medium">{{ siteMap.cameras.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Walls:</span>
              <span class="font-medium">{{ siteMap.walls.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Area:</span>
              <span class="font-medium">{{ getAreaInMeters(siteMap) }}m²</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <router-link
            v-if="siteMap?.reconstruction?.pointCloud"
            :to="`/site-maps/${siteMapId}/view-3d`"
            class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            View in 3D
          </router-link>

          <router-link
            to="/site-maps"
            class="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            Back to Library
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { EnhancedSiteMap, SiteMapSource } from '@/types/sitemap'

const route = useRoute()
const siteMapId = ref(route.params.id as string)

// Mock site map data - in production, load from store or API
const siteMap = ref<EnhancedSiteMap>({
  id: siteMapId.value,
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
})

function getSourceLabel(source: SiteMapSource): string {
  switch (source) {
    case 'generated-sfm': return 'Structure from Motion'
    case 'generated-geometric': return 'GPS-Based Geometric'
    case 'manual': return 'Manually Created'
    default: return 'Unknown'
  }
}

function getAreaInMeters(map: EnhancedSiteMap): number {
  const widthM = map.width / map.scale
  const heightM = map.height / map.scale
  return Math.round(widthM * heightM)
}

onMounted(() => {
  // In production, load the site map from store or API based on siteMapId
  console.log('Loading site map:', siteMapId.value)
})
</script>
