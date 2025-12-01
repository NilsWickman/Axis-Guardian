<template>
  <div class="person-position-overlay">
    <!-- Global track markers (cross-camera tracking) -->
    <svg
      v-if="globalTracks.length > 0"
      :width="canvasWidth"
      :height="canvasHeight"
      class="absolute inset-0 pointer-events-none"
      style="z-index: 10"
    >
      <!-- Trails (if enabled) -->
      <g v-if="showTrails">
        <path
          v-for="track in visibleGlobalTracks"
          :key="`trail-${track.globalTrackId}`"
          :d="getGlobalTrailPath(track)"
          :stroke="track.color"
          stroke-width="2"
          fill="none"
          opacity="0.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- Global track position markers -->
      <g v-for="track in visibleGlobalTracks" :key="track.globalTrackId">
        <!-- Outer glow -->
        <circle
          :cx="worldToCanvasX(track.currentPosition.x)"
          :cy="worldToCanvasY(track.currentPosition.y)"
          :r="markerRadius + 4"
          :fill="track.color"
          opacity="0.2"
        />

        <!-- Main marker -->
        <circle
          :cx="worldToCanvasX(track.currentPosition.x)"
          :cy="worldToCanvasY(track.currentPosition.y)"
          :r="markerRadius"
          :fill="track.color"
          :opacity="getGlobalTrackOpacity(track)"
          stroke="white"
          stroke-width="2"
          class="person-marker"
        />

        <!-- Confidence indicator ring -->
        <circle
          v-if="showConfidence"
          :cx="worldToCanvasX(track.currentPosition.x)"
          :cy="worldToCanvasY(track.currentPosition.y)"
          :r="markerRadius + 6"
          fill="none"
          :stroke="track.color"
          :stroke-width="2"
          :opacity="track.confidence"
          :stroke-dasharray="`${track.confidence * 40} 40`"
        />

        <!-- Person icon (optional) -->
        <g
          v-if="showPersonIcon"
          :transform="`translate(${worldToCanvasX(track.currentPosition.x) - 6}, ${worldToCanvasY(track.currentPosition.y) - 8})`"
        >
          <path
            d="M6 2a2 2 0 100 4 2 2 0 000-4zm0 6c-2 0-4 1-4 2v2h8v-2c0-1-2-2-4-2z"
            fill="white"
            opacity="0.9"
          />
        </g>
      </g>

      <!-- Heatmap overlay (if enabled) -->
      <g v-if="showHeatmap && heatmapData.length > 0">
        <rect
          v-for="(cell, index) in heatmapData"
          :key="`heatmap-${index}`"
          :x="cell.x"
          :y="cell.y"
          :width="cell.size"
          :height="cell.size"
          :fill="cell.color"
          :opacity="cell.opacity"
          class="heatmap-cell"
        />
      </g>

      <!-- Debug: Unconfirmed tracks (dashed outline) -->
      <g v-if="showDebugMode && unconfirmedTracks.length > 0">
        <g v-for="track in unconfirmedTracks" :key="`unconfirmed-${track.globalTrackId}`">
          <!-- Dashed circle for unconfirmed -->
          <circle
            :cx="worldToCanvasX(track.currentPosition.x)"
            :cy="worldToCanvasY(track.currentPosition.y)"
            :r="markerRadius"
            fill="none"
            stroke="#fbbf24"
            stroke-width="2"
            stroke-dasharray="4 2"
            opacity="0.6"
          />
          <!-- Detection count label -->
          <text
            :x="worldToCanvasX(track.currentPosition.x)"
            :y="worldToCanvasY(track.currentPosition.y) + markerRadius + 12"
            text-anchor="middle"
            font-size="10"
            fill="#fbbf24"
            opacity="0.8"
          >
            {{ track.detectionCount }}/3
          </text>
        </g>
      </g>
    </svg>

    <!-- Position count overlay -->
    <div
      v-if="showStats"
      class="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
      style="z-index: 11"
    >
      <div class="flex items-center gap-2 mb-1">
        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
        <span class="font-semibold">Tracked Persons: {{ globalTrackCount }}</span>
      </div>
      <div class="text-xs text-gray-300">
        <div>Active Tracks: {{ globalTracks.length }}</div>
        <div v-if="showDebugMode && pendingTrackCount > 0" class="text-amber-400">
          Pending: {{ pendingTrackCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalTrackStore, type GlobalTrack } from '../../../stores/globalTracks'
import type { SiteMap } from '../../../stores/siteMaps'

export interface PersonPositionOverlayProps {
  siteMap: SiteMap
  canvasWidth: number
  canvasHeight: number
  showTrails?: boolean
  showConfidence?: boolean
  showPersonIcon?: boolean
  showStats?: boolean
  showHeatmap?: boolean
  showDebugMode?: boolean // Show unconfirmed tracks and FOV cones
  markerRadius?: number
  maxTrailLength?: number
}

const props = withDefaults(defineProps<PersonPositionOverlayProps>(), {
  showTrails: true,
  showConfidence: true,
  showPersonIcon: false,
  showStats: true,
  showHeatmap: false,
  showDebugMode: false,
  markerRadius: 8,
  maxTrailLength: 20,
})

const globalTrackStore = useGlobalTrackStore()

// Computed data from global track store
const globalTracks = computed(() => globalTrackStore.activeTracks)
const globalTrackCount = computed(() => globalTrackStore.activeTrackCount)
const pendingTrackCount = computed(() => globalTrackStore.pendingTrackCount)

// Get all active tracks including unconfirmed (for debug mode)
const allActiveTracks = computed(() => globalTrackStore.allActiveTracks)

// Filter global tracks that are within the canvas bounds
const visibleGlobalTracks = computed(() => {
  return globalTracks.value.filter(track => {
    const x = worldToCanvasX(track.currentPosition.x)
    const y = worldToCanvasY(track.currentPosition.y)
    return x >= 0 && x <= props.canvasWidth && y >= 0 && y <= props.canvasHeight
  })
})

// Unconfirmed tracks for debug mode (visible but not confirmed yet)
const unconfirmedTracks = computed(() => {
  if (!props.showDebugMode) return []
  return allActiveTracks.value.filter(track => {
    if (track.isConfirmed) return false // Skip confirmed
    const x = worldToCanvasX(track.currentPosition.x)
    const y = worldToCanvasY(track.currentPosition.y)
    return x >= 0 && x <= props.canvasWidth && y >= 0 && y <= props.canvasHeight
  })
})

// Heatmap data (simplified grid-based heatmap)
interface HeatmapCell {
  x: number
  y: number
  size: number
  count: number
  color: string
  opacity: number
}

const heatmapData = computed<HeatmapCell[]>(() => {
  if (!props.showHeatmap) return []

  const cellSize = 30 // 30 pixels per cell
  const grid = new Map<string, number>()

  // Accumulate global track positions into grid cells
  globalTracks.value.forEach(track => {
    const cellX = Math.floor(worldToCanvasX(track.currentPosition.x) / cellSize) * cellSize
    const cellY = Math.floor(worldToCanvasY(track.currentPosition.y) / cellSize) * cellSize
    const key = `${cellX},${cellY}`
    grid.set(key, (grid.get(key) || 0) + 1)
  })

  // Convert to array and calculate colors
  const maxCount = Math.max(...Array.from(grid.values()), 1)
  const cells: HeatmapCell[] = []

  grid.forEach((count, key) => {
    const [x, y] = key.split(',').map(Number)
    const intensity = count / maxCount

    // Color gradient from blue to red
    const color = intensity < 0.5
      ? `rgb(${Math.round(intensity * 510)}, ${Math.round(intensity * 510)}, 255)`
      : `rgb(255, ${Math.round((1 - intensity) * 510)}, 0)`

    cells.push({
      x,
      y,
      size: cellSize,
      count,
      color,
      opacity: 0.3 + intensity * 0.4,
    })
  })

  return cells
})

/**
 * Convert world coordinates (meters) to canvas coordinates (pixels)
 */
function worldToCanvasX(worldX: number): number {
  return worldX * props.siteMap.renderScale + 60 // Add offset
}

function worldToCanvasY(worldY: number): number {
  return worldY * props.siteMap.renderScale + 60 // Add offset
}

/**
 * Get global track marker opacity based on age
 */
function getGlobalTrackOpacity(track: GlobalTrack): number {
  const now = Date.now()
  const ageMs = now - track.lastSeen

  // Fade out over 10 seconds
  const fadeMs = 10000
  const opacity = Math.max(0.3, 1 - (ageMs / fadeMs))
  return Math.min(1, opacity)
}

/**
 * Generate SVG path for a global track trail
 */
function getGlobalTrailPath(track: GlobalTrack): string {
  const trailPositions = track.trail.slice(0, props.maxTrailLength)
  if (trailPositions.length < 2) return ''

  const pathSegments = trailPositions.map((pos, index) => {
    const x = worldToCanvasX(pos.x)
    const y = worldToCanvasY(pos.y)
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  })

  return pathSegments.join(' ')
}
</script>

<style scoped>
.person-position-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.person-marker {
  transition: opacity 0.3s ease;
}

.heatmap-cell {
  transition: opacity 0.5s ease;
}
</style>
