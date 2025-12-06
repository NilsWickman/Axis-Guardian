<template>
  <div
    class="person-position-overlay"
    :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
  >
    <!-- Global track markers (cross-camera tracking) -->
    <svg
      v-if="globalTracks.length > 0"
      :width="canvasWidth"
      :height="canvasHeight"
      class="absolute inset-0 pointer-events-none"
      style="z-index: 10"
    >
      <!-- Trails (if enabled) - individual segments with fading opacity -->
      <g v-if="showTrails">
        <g v-for="track in visibleGlobalTracks" :key="`trail-${track.globalTrackId}`">
          <line
            v-for="segment in getTrailSegments(track)"
            :key="segment.key"
            :x1="segment.x1"
            :y1="segment.y1"
            :x2="segment.x2"
            :y2="segment.y2"
            :stroke="track.color"
            stroke-width="2"
            :opacity="segment.opacity"
            stroke-linecap="round"
          />
        </g>
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

        <!-- Track ID label -->
        <text
          :x="worldToCanvasX(track.currentPosition.x)"
          :y="worldToCanvasY(track.currentPosition.y) - markerRadius - 6"
          text-anchor="middle"
          font-size="11"
          font-weight="600"
          :fill="track.color"
          stroke="#000"
          stroke-width="0.5"
          class="track-label"
        >
          {{ formatTrackId(track.globalTrackId) }}
        </text>
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
  showDebugMode?: boolean // Show unconfirmed tracks and FOV cones
  markerRadius?: number
  maxTrailLength?: number
}

const props = withDefaults(defineProps<PersonPositionOverlayProps>(), {
  showTrails: true,
  showConfidence: true,
  showPersonIcon: false,
  showStats: true,
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

/**
 * Convert world coordinates (meters) to canvas coordinates (pixels)
 *
 * World coordinates: X=East, Y=North (meters)
 * Canvas coordinates: pixels at RENDER_SCALE (100 px/m)
 */
function worldToCanvasX(worldX: number): number {
  const origin = props.siteMap.origin ?? { x: 0, y: 0 }
  return (worldX - origin.x) * props.siteMap.renderScale
}

function worldToCanvasY(worldY: number): number {
  const origin = props.siteMap.origin ?? { x: 0, y: 0 }
  return (worldY - origin.y) * props.siteMap.renderScale
}

/**
 * Get global track marker opacity based on age
 */
function getGlobalTrackOpacity(track: GlobalTrack): number {
  const now = Date.now()
  const ageMs = now - track.lastSeen

  // Fade out over 3 seconds
  const fadeMs = 3000
  const opacity = Math.max(0.3, 1 - (ageMs / fadeMs))
  return Math.min(1, opacity)
}

/**
 * Trail segment with opacity for fading effect
 */
interface TrailSegment {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

/**
 * Generate trail segments with fading opacity based on age
 * Segments fade out over 3 seconds
 */
function getTrailSegments(track: GlobalTrack): TrailSegment[] {
  const trailPositions = track.trail.slice(0, props.maxTrailLength)
  if (trailPositions.length < 2) return []

  const now = Date.now()
  const fadeMs = 3000 // Fade over 3 seconds
  const segments: TrailSegment[] = []

  for (let i = 0; i < trailPositions.length - 1; i++) {
    const from = trailPositions[i]
    const to = trailPositions[i + 1]

    // Use the older point's timestamp to determine opacity
    const ageMs = now - to.timestamp
    const opacity = Math.max(0, 0.6 * (1 - ageMs / fadeMs))

    // Skip segments that have fully faded
    if (opacity <= 0) continue

    segments.push({
      key: `${track.globalTrackId}-seg-${i}`,
      x1: worldToCanvasX(from.x),
      y1: worldToCanvasY(from.y),
      x2: worldToCanvasX(to.x),
      y2: worldToCanvasY(to.y),
      opacity,
    })
  }

  return segments
}

/**
 * Format track ID for display (e.g., "global-5" -> "#5")
 */
function formatTrackId(trackId: string): string {
  return trackId.replace('global-', '#')
}
</script>

<style scoped>
.person-position-overlay {
  /* Position controlled by parent via inline styles */
  pointer-events: none;
}

.person-marker {
  transition: opacity 0.3s ease;
}

.track-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
