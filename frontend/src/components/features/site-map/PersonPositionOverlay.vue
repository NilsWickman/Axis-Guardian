<template>
  <div
    class="person-position-overlay"
    :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
  >
    <!-- Canvas for person tracking visualization -->
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="absolute inset-0 pointer-events-none"
      style="z-index: 10"
    />

    <!-- Position count overlay -->
    <div
      v-if="showStats"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded-lg text-sm pointer-events-none"
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
      <!-- Tracking frame numbers for timing diagnostics -->
      <div v-if="trackingFrameNumbers.length > 0" class="mt-2 pt-2 border-t border-gray-600">
        <div class="text-xs text-cyan-400 font-semibold mb-1">Tracking Frame:</div>
        <div v-for="frame in trackingFrameNumbers" :key="frame.cameraId" class="text-xs text-cyan-300">
          {{ frame.cameraId }}: #{{ frame.frameNumber }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGlobalTrackStore, type GlobalTrack } from '../../../stores/globalTracks'
import type { SiteMap } from '../../../composables/useSiteMapConfig'
import { calculateVelocity } from '../../../utils/trackCorrelation'
import { extractValue } from '../../../utils/siteMapConversion'

export interface PersonPositionOverlayProps {
  siteMap: SiteMap
  canvasWidth: number
  canvasHeight: number
  showTrails?: boolean
  showConfidence?: boolean
  showPersonIcon?: boolean
  showStats?: boolean
  showDebugMode?: boolean
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

// Canvas ref
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Tracking frame numbers for timing diagnostics
const trackingFrameNumbers = computed(() => globalTrackStore.getAllFrameInfo())
let animationFrameId: number | null = null
let isAnimating = false

// Interpolation state for smooth animation
interface InterpolationState {
  position: { x: number; y: number }       // Current rendered position
  targetPosition: { x: number; y: number } // Target position to interpolate toward
  lastUpdateTime: number
  // Ghost track extrapolation fields
  velocity?: { x: number; y: number }              // Velocity in m/s for ghost extrapolation
  ghostStartTime?: number                          // When ghost mode started
  ghostStartPosition?: { x: number; y: number }    // Position when ghost started
  wasGhost?: boolean                               // Track if previous state was ghost
}
const interpolationStates = new Map<string, InterpolationState>()

// Time-based smoothing constant (seconds to reach ~63% of target)
// Lower = snappier, higher = smoother
const SMOOTH_TIME = 0.2
let lastFrameTime = 0

// Computed data from global track store
const globalTracks = computed(() => globalTrackStore.activeTracks)
const globalTrackCount = computed(() => globalTrackStore.activeTrackCount)
const pendingTrackCount = computed(() => globalTrackStore.pendingTrackCount)
const allActiveTracks = computed(() => globalTrackStore.allActiveTracks)

// Filter global tracks that are within the canvas bounds
const visibleGlobalTracks = computed(() => {
  return globalTracks.value.filter(track => {
    // Skip tracks with invalid positions
    if (!isFinite(track.currentPosition.x) || !isFinite(track.currentPosition.y)) {
      console.warn(`[PersonPositionOverlay] Track ${track.globalTrackId} has invalid position:`, track.currentPosition)
      return false
    }
    const x = worldToCanvasX(track.currentPosition.x)
    const y = worldToCanvasY(track.currentPosition.y)
    return x >= -50 && x <= props.canvasWidth + 50 && y >= -50 && y <= props.canvasHeight + 50
  })
})

// Unconfirmed tracks for debug mode
const unconfirmedTracks = computed(() => {
  if (!props.showDebugMode) return []
  return allActiveTracks.value.filter(track => {
    if (track.isConfirmed) return false
    const x = worldToCanvasX(track.currentPosition.x)
    const y = worldToCanvasY(track.currentPosition.y)
    return x >= -50 && x <= props.canvasWidth + 50 && y >= -50 && y <= props.canvasHeight + 50
  })
})

/**
 * Convert world coordinates (meters) to canvas coordinates (pixels)
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
 * Format track label with ID and detection count
 */
function formatTrackLabel(track: GlobalTrack): string {
  const id = track.globalTrackId.replace('global-', '#')
  return `${id} (${track.detectionCount})`
}

/**
 * Get interpolated position for a track
 * Uses time-based exponential smoothing for frame-rate-independent animation
 */
function getInterpolatedPosition(track: GlobalTrack, now: number): { x: number; y: number } {
  const state = interpolationStates.get(track.globalTrackId)

  if (!state) {
    // First time seeing this track, initialize state
    interpolationStates.set(track.globalTrackId, {
      position: { ...track.currentPosition },
      targetPosition: { ...track.currentPosition },
      lastUpdateTime: now,
    })
    return track.currentPosition
  }

  // Calculate delta time in seconds, capped to avoid huge jumps after tab switching
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1)

  // Exponential smoothing factor based on delta time
  // This ensures consistent motion regardless of frame rate
  const factor = 1 - Math.exp(-dt / SMOOTH_TIME)

  state.position.x += (state.targetPosition.x - state.position.x) * factor
  state.position.y += (state.targetPosition.y - state.position.y) * factor

  return state.position
}

/**
 * Get interpolated position for a ghost track using velocity extrapolation
 * Continues moving at the last known velocity, clamped to room boundaries
 */
function getGhostInterpolatedPosition(track: GlobalTrack, now: number): { x: number; y: number } {
  const state = interpolationStates.get(track.globalTrackId)

  // Fall back to server position if no interpolation state or velocity
  if (!state?.velocity || !state.ghostStartPosition || !state.ghostStartTime) {
    return track.predictedPosition ?? track.currentPosition
  }

  // Calculate time since ghost mode started (in seconds)
  const elapsed = (now - state.ghostStartTime) / 1000

  // Cap extrapolation time to prevent ghost going too far (max 5 seconds)
  const cappedElapsed = Math.min(elapsed, 5)

  // Extrapolate position: startPosition + velocity * time
  let x = state.ghostStartPosition.x + state.velocity.x * cappedElapsed
  let y = state.ghostStartPosition.y + state.velocity.y * cappedElapsed

  // Clamp to room boundaries
  const origin = props.siteMap.origin ?? { x: 0, y: 0 }
  const mapWidth = extractValue(props.siteMap.width)
  const mapHeight = extractValue(props.siteMap.height)
  if (mapWidth && mapHeight) {
    const minX = origin.x
    const maxX = origin.x + mapWidth
    const minY = origin.y
    const maxY = origin.y + mapHeight

    x = Math.max(minX, Math.min(maxX, x))
    y = Math.max(minY, Math.min(maxY, y))
  }

  // Update the state's position for trail drawing continuity
  state.position = { x, y }

  return { x, y }
}

/**
 * Update interpolation state when track position changes
 * Updates the target position - the animation loop will smoothly lerp toward it
 * For ghost tracks, calculates velocity for smooth extrapolation
 */
function updateInterpolationState(track: GlobalTrack, now: number): void {
  const state = interpolationStates.get(track.globalTrackId)
  const isGhost = isGhostTrack(track)

  if (state) {
    // Check if track just became a ghost (transition from normal to ghost)
    if (isGhost && !state.wasGhost) {
      // Track just became a ghost - capture velocity and start position
      const velocity = calculateVelocity(track.trail)
      state.velocity = velocity ?? undefined
      state.ghostStartTime = now
      state.ghostStartPosition = { ...state.position } // Use current rendered position for smoothness
      state.wasGhost = true
    } else if (!isGhost && state.wasGhost) {
      // Track is no longer a ghost - clear ghost state
      state.velocity = undefined
      state.ghostStartTime = undefined
      state.ghostStartPosition = undefined
      state.wasGhost = false
      // Update target to actual position for smooth blend-back
      state.targetPosition = { ...track.currentPosition }
    } else if (!isGhost) {
      // Normal track update
      state.targetPosition = { ...track.currentPosition }
    }
    // For ongoing ghosts, we don't update targetPosition - extrapolation handles it
    state.lastUpdateTime = now
  } else {
    // New track - start at target position immediately
    interpolationStates.set(track.globalTrackId, {
      position: { ...track.currentPosition },
      targetPosition: { ...track.currentPosition },
      lastUpdateTime: now,
      wasGhost: isGhost,
      // If starting as ghost, capture velocity immediately
      ...(isGhost ? {
        velocity: calculateVelocity(track.trail) ?? undefined,
        ghostStartTime: now,
        ghostStartPosition: { ...track.currentPosition },
      } : {}),
    })
  }
}

/**
 * Clean up stale interpolation states
 */
function cleanupInterpolationStates(): void {
  const activeTrackIds = new Set(globalTracks.value.map(t => t.globalTrackId))
  for (const trackId of interpolationStates.keys()) {
    if (!activeTrackIds.has(trackId)) {
      interpolationStates.delete(trackId)
    }
  }
}

/**
 * Draw trail with fading opacity
 */
function drawTrail(ctx: CanvasRenderingContext2D, track: GlobalTrack, interpolatedPos: { x: number; y: number }) {
  if (!props.showTrails) return

  const trail = track.trail.slice(0, props.maxTrailLength)
  if (trail.length < 1) return

  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.strokeStyle = track.color

  // Draw line from interpolated position to first trail point
  if (trail.length >= 1) {
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(worldToCanvasX(interpolatedPos.x), worldToCanvasY(interpolatedPos.y))
    ctx.lineTo(worldToCanvasX(trail[0].x), worldToCanvasY(trail[0].y))
    ctx.stroke()
  }

  // Draw remaining trail segments
  for (let i = 0; i < trail.length - 1; i++) {
    const opacity = 0.6 * (1 - (i + 1) / trail.length)
    ctx.globalAlpha = opacity
    ctx.beginPath()
    ctx.moveTo(worldToCanvasX(trail[i].x), worldToCanvasY(trail[i].y))
    ctx.lineTo(worldToCanvasX(trail[i + 1].x), worldToCanvasY(trail[i + 1].y))
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

/**
 * Draw marker with glow, main circle, confidence ring, icon, and label
 */
function drawMarker(ctx: CanvasRenderingContext2D, track: GlobalTrack, interpolatedPos: { x: number; y: number }) {
  const x = worldToCanvasX(interpolatedPos.x)
  const y = worldToCanvasY(interpolatedPos.y)
  const radius = props.markerRadius

  // Outer glow
  ctx.beginPath()
  ctx.arc(x, y, radius + 4, 0, Math.PI * 2)
  ctx.fillStyle = track.color
  ctx.globalAlpha = 0.2
  ctx.fill()

  // Main marker
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = track.color
  ctx.globalAlpha = 1
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.stroke()

  // Confidence indicator ring
  if (props.showConfidence) {
    ctx.beginPath()
    const confidenceAngle = track.confidence * Math.PI * 2
    ctx.arc(x, y, radius + 6, -Math.PI / 2, -Math.PI / 2 + confidenceAngle)
    ctx.strokeStyle = track.color
    ctx.lineWidth = 2
    ctx.globalAlpha = track.confidence
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Person icon (simplified - draw a small person shape)
  if (props.showPersonIcon) {
    ctx.fillStyle = 'white'
    ctx.globalAlpha = 0.9
    // Head
    ctx.beginPath()
    ctx.arc(x, y - 3, 2, 0, Math.PI * 2)
    ctx.fill()
    // Body
    ctx.beginPath()
    ctx.moveTo(x - 3, y + 4)
    ctx.lineTo(x + 3, y + 4)
    ctx.lineTo(x + 3, y)
    ctx.lineTo(x - 3, y)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Track ID label with detection count
  const label = formatTrackLabel(track)
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  // Text shadow/outline
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.strokeText(label, x, y - radius - 6)

  // Text fill
  ctx.fillStyle = track.color
  ctx.fillText(label, x, y - radius - 6)
}

/**
 * Draw unconfirmed track marker (dashed outline)
 */
function drawUnconfirmedMarker(ctx: CanvasRenderingContext2D, track: GlobalTrack) {
  const x = worldToCanvasX(track.currentPosition.x)
  const y = worldToCanvasY(track.currentPosition.y)
  const radius = props.markerRadius

  // Dashed circle
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 2])
  ctx.globalAlpha = 0.6
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  // Detection count label
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#fbbf24'
  ctx.globalAlpha = 0.8
  ctx.fillText(`${track.detectionCount}/1`, x, y + radius + 4)
  ctx.globalAlpha = 1
}

/**
 * Check if a track is a ghost track (pillar-occluded with predicted position)
 */
function isGhostTrack(track: GlobalTrack): boolean {
  return track.state === 'occluded' && track.exitReason === 'pillar_occlusion'
}

/**
 * Get display position for a track (predicted for ghost tracks, current otherwise)
 */
function getDisplayPosition(track: GlobalTrack): { x: number; y: number } {
  if (isGhostTrack(track) && track.predictedPosition) {
    return track.predictedPosition
  }
  return track.currentPosition
}

/**
 * Draw ghost track marker (semi-transparent, dashed)
 * Used for pillar-occluded tracks showing predicted position
 */
function drawGhostMarker(ctx: CanvasRenderingContext2D, track: GlobalTrack, position: { x: number; y: number }) {
  const x = worldToCanvasX(position.x)
  const y = worldToCanvasY(position.y)
  const radius = props.markerRadius

  // Ghost outer glow (fainter)
  ctx.beginPath()
  ctx.arc(x, y, radius + 4, 0, Math.PI * 2)
  ctx.fillStyle = track.color
  ctx.globalAlpha = 0.1
  ctx.fill()

  // Ghost main marker (dashed outline, semi-transparent)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = track.color
  ctx.globalAlpha = 0.3
  ctx.fill()
  ctx.strokeStyle = track.color
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.globalAlpha = 0.5
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  // Ghost track label
  const label = formatTrackLabel(track)
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  // Text shadow/outline (fainter)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.3
  ctx.strokeText(label, x, y - radius - 6)

  // Text fill (fainter)
  ctx.fillStyle = track.color
  ctx.globalAlpha = 0.5
  ctx.fillText(label, x, y - radius - 6)
  ctx.globalAlpha = 1
}

/**
 * Draw ghost track trail (dashed, semi-transparent)
 */
function drawGhostTrail(ctx: CanvasRenderingContext2D, track: GlobalTrack, ghostPos: { x: number; y: number }) {
  if (!props.showTrails) return

  const trail = track.trail.slice(0, props.maxTrailLength)
  if (trail.length < 1) return

  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.strokeStyle = track.color
  ctx.setLineDash([4, 4])

  // Draw line from ghost position to first trail point
  if (trail.length >= 1) {
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.moveTo(worldToCanvasX(ghostPos.x), worldToCanvasY(ghostPos.y))
    ctx.lineTo(worldToCanvasX(trail[0].x), worldToCanvasY(trail[0].y))
    ctx.stroke()
  }

  // Draw remaining trail segments (fading)
  for (let i = 0; i < trail.length - 1; i++) {
    const opacity = 0.3 * (1 - (i + 1) / trail.length)
    ctx.globalAlpha = opacity
    ctx.beginPath()
    ctx.moveTo(worldToCanvasX(trail[i].x), worldToCanvasY(trail[i].y))
    ctx.lineTo(worldToCanvasX(trail[i + 1].x), worldToCanvasY(trail[i + 1].y))
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/**
 * Main animation loop - runs continuously for smooth interpolation
 */
function animate() {
  if (!isAnimating) return

  const canvas = canvasRef.value
  if (!canvas) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }

  const now = Date.now()

  // Clear canvas
  ctx.clearRect(0, 0, props.canvasWidth, props.canvasHeight)

  // Draw trails and markers with interpolated positions
  // Separate normal tracks from ghost tracks for different rendering
  for (const track of visibleGlobalTracks.value) {
    if (isGhostTrack(track)) {
      // Ghost track: use velocity extrapolation for smooth motion
      const ghostPos = getGhostInterpolatedPosition(track, now)
      drawGhostTrail(ctx, track, ghostPos)
    } else {
      // Normal track: use interpolated position
      const interpolatedPos = getInterpolatedPosition(track, now)
      drawTrail(ctx, track, interpolatedPos)
    }
  }

  for (const track of visibleGlobalTracks.value) {
    if (isGhostTrack(track)) {
      // Ghost track: render with ghost styling using velocity extrapolation
      const ghostPos = getGhostInterpolatedPosition(track, now)
      drawGhostMarker(ctx, track, ghostPos)
    } else {
      // Normal track: render with standard styling
      const interpolatedPos = getInterpolatedPosition(track, now)
      drawMarker(ctx, track, interpolatedPos)
    }
  }

  // Draw unconfirmed tracks in debug mode
  if (props.showDebugMode) {
    for (const track of unconfirmedTracks.value) {
      drawUnconfirmedMarker(ctx, track)
    }
  }

  // Update lastFrameTime for next frame's delta calculation
  lastFrameTime = now

  animationFrameId = requestAnimationFrame(animate)
}

/**
 * Start the animation loop
 */
function startAnimation() {
  if (isAnimating) return
  isAnimating = true
  lastFrameTime = Date.now()  // Initialize to avoid large delta on first frame
  animate()
}

/**
 * Stop the animation loop
 */
function stopAnimation() {
  isAnimating = false
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Watch for track changes and update interpolation states
watch(
  () => globalTracks.value,
  (newTracks) => {
    const now = Date.now()
    for (const track of newTracks) {
      updateInterpolationState(track, now)
    }
    cleanupInterpolationStates()
  },
  { deep: true }
)

// Start animation on mount
onMounted(() => {
  startAnimation()
})

// Cleanup on unmount
onUnmounted(() => {
  stopAnimation()
  interpolationStates.clear()
})
</script>

<style scoped>
.person-position-overlay {
  pointer-events: none;
}
</style>
