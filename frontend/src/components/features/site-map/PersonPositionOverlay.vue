<template>
  <div class="person-position-overlay">
    <!-- Person position markers -->
    <svg
      v-if="positions.length > 0"
      :width="canvasWidth"
      :height="canvasHeight"
      class="absolute inset-0 pointer-events-none"
      style="z-index: 10"
    >
      <!-- Trails (if enabled) -->
      <g v-if="showTrails">
        <path
          v-for="track in visibleTracks"
          :key="track.trackId"
          :d="getTrailPath(track)"
          stroke="#3b82f6"
          stroke-width="2"
          fill="none"
          opacity="0.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- Position markers -->
      <g v-for="position in visiblePositions" :key="position.detectionId">
        <!-- Outer glow -->
        <circle
          :cx="worldToCanvasX(position.worldX)"
          :cy="worldToCanvasY(position.worldY)"
          :r="markerRadius + 4"
          :fill="getMarkerColor(position)"
          opacity="0.2"
        />

        <!-- Main marker -->
        <circle
          :cx="worldToCanvasX(position.worldX)"
          :cy="worldToCanvasY(position.worldY)"
          :r="markerRadius"
          :fill="getMarkerColor(position)"
          :opacity="getMarkerOpacity(position)"
          stroke="white"
          stroke-width="2"
          class="person-marker"
        />

        <!-- Confidence indicator ring -->
        <circle
          v-if="showConfidence"
          :cx="worldToCanvasX(position.worldX)"
          :cy="worldToCanvasY(position.worldY)"
          :r="markerRadius + 6"
          fill="none"
          :stroke="getMarkerColor(position)"
          :stroke-width="2"
          :opacity="position.confidence"
          :stroke-dasharray="`${position.confidence * 40} 40`"
        />

        <!-- Person icon (optional) -->
        <g
          v-if="showPersonIcon"
          :transform="`translate(${worldToCanvasX(position.worldX) - 6}, ${worldToCanvasY(position.worldY) - 8})`"
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
    </svg>

    <!-- Position count overlay -->
    <div
      v-if="showStats"
      class="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
      style="z-index: 11"
    >
      <div class="flex items-center gap-2 mb-1">
        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
        <span class="font-semibold">Active Persons: {{ activePersonCount }}</span>
      </div>
      <div class="text-xs text-gray-300">
        <div>Total Positions: {{ positions.length }}</div>
        <div v-if="showTrails">Tracks: {{ tracks.length }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePersonPositionStore, type PersonPosition, type PersonTrack } from '../../../stores/personPositions'
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
  markerRadius?: number
  maxTrailLength?: number
}

const props = withDefaults(defineProps<PersonPositionOverlayProps>(), {
  showTrails: true,
  showConfidence: true,
  showPersonIcon: false,
  showStats: true,
  showHeatmap: false,
  markerRadius: 8,
  maxTrailLength: 20,
})

const positionStore = usePersonPositionStore()

// Computed data from store
const positions = computed(() => positionStore.activePositions)
const tracks = computed(() => positionStore.activeTracks)
const activePersonCount = computed(() => positionStore.activePersonCount)

// Filter positions that are within the canvas bounds
const visiblePositions = computed(() => {
  return positions.value.filter(pos => {
    const x = worldToCanvasX(pos.worldX)
    const y = worldToCanvasY(pos.worldY)
    return x >= 0 && x <= props.canvasWidth && y >= 0 && y <= props.canvasHeight
  })
})

// Filter tracks with visible positions
const visibleTracks = computed(() => {
  if (!props.showTrails) return []
  return tracks.value.filter(track => track.positions.length > 1)
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

  // Accumulate positions into grid cells
  positions.value.forEach(pos => {
    const cellX = Math.floor(worldToCanvasX(pos.worldX) / cellSize) * cellSize
    const cellY = Math.floor(worldToCanvasY(pos.worldY) / cellSize) * cellSize
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
  return worldX * props.siteMap.scale + 60 // Add offset
}

function worldToCanvasY(worldY: number): number {
  return worldY * props.siteMap.scale + 60 // Add offset
}

/**
 * Get marker color based on camera ID
 */
function getMarkerColor(position: PersonPosition): string {
  // Use a consistent color per camera
  const cameraColors: Record<string, string> = {
    'camera1': '#10b981', // emerald
    'camera2': '#3b82f6', // blue
    'camera3': '#ef4444', // red
    'camera4': '#f59e0b', // amber
  }
  return cameraColors[position.cameraId] || '#6366f1' // default indigo
}

/**
 * Get marker opacity based on age
 */
function getMarkerOpacity(position: PersonPosition): number {
  const now = Date.now()
  const posTime = new Date(position.timestamp).getTime()
  const ageMs = now - posTime

  // Fade out over 10 seconds
  const fadeMs = 10000
  const opacity = Math.max(0.3, 1 - (ageMs / fadeMs))
  return Math.min(1, opacity)
}

/**
 * Generate SVG path for a trail
 */
function getTrailPath(track: PersonTrack): string {
  const positions = track.positions.slice(0, props.maxTrailLength)
  if (positions.length < 2) return ''

  const pathSegments = positions.map((pos, index) => {
    const x = worldToCanvasX(pos.worldX)
    const y = worldToCanvasY(pos.worldY)
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
