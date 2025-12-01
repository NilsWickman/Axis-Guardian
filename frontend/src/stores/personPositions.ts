// Person position tracking store
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { Detection } from '../types/generated'

// Cleanup interval ID (module level for singleton behavior)
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null
const CLEANUP_INTERVAL_MS = 10000 // Run cleanup every 10 seconds

export interface PersonPosition {
  detectionId: string
  cameraId: string
  worldX: number // Site map X coordinate (meters)
  worldY: number // Site map Y coordinate (meters)
  confidence: number
  timestamp: string
  imageX: number // Original bounding box center X in image
  imageY: number // Original bounding box center Y in image
}

export interface PersonTrack {
  trackId: string
  positions: PersonPosition[]
  lastSeen: string
  cameraId: string
  isActive: boolean
}

export const usePersonPositionStore = defineStore('personPositions', () => {
  // State
  const positions = ref<PersonPosition[]>([])
  const tracks = ref<PersonTrack[]>([])

  // Configuration
  const maxPositionHistory = ref(100) // Keep last 100 positions per person
  const positionExpiryMs = ref(30000) // Expire positions after 30 seconds
  const showTrails = ref(true)
  const showHeatmap = ref(false)

  // Getters
  const activePositions = computed(() => {
    const now = Date.now()
    return positions.value.filter(pos => {
      const posTime = new Date(pos.timestamp).getTime()
      return (now - posTime) < positionExpiryMs.value
    })
  })

  const activeTracks = computed(() =>
    tracks.value.filter(track => track.isActive)
  )

  const positionsByCameraId = computed(() => {
    const grouped = new Map<string, PersonPosition[]>()
    activePositions.value.forEach(pos => {
      if (!grouped.has(pos.cameraId)) {
        grouped.set(pos.cameraId, [])
      }
      grouped.get(pos.cameraId)!.push(pos)
    })
    return grouped
  })

  const activePersonCount = computed(() => {
    // Count unique active tracks
    return activeTracks.value.length
  })

  // Actions
  function addPosition(position: PersonPosition) {
    // Add new position
    positions.value.unshift(position)

    // Keep only recent positions
    if (positions.value.length > maxPositionHistory.value * 10) {
      positions.value = positions.value.slice(0, maxPositionHistory.value * 10)
    }

    // Update or create track
    updateTrackForPosition(position)
  }

  function addPositions(newPositions: PersonPosition[]) {
    newPositions.forEach(pos => addPosition(pos))
  }

  function updateTrackForPosition(position: PersonPosition) {
    // Find existing track for this camera (simple approach: one track per camera)
    // In a real implementation, you'd use track IDs from the detection service
    let track = tracks.value.find(t =>
      t.cameraId === position.cameraId && t.isActive
    )

    if (!track) {
      // Create new track
      track = {
        trackId: `track-${position.cameraId}-${Date.now()}`,
        positions: [],
        lastSeen: position.timestamp,
        cameraId: position.cameraId,
        isActive: true
      }
      tracks.value.push(track)
    }

    // Add position to track
    track.positions.unshift(position)
    track.lastSeen = position.timestamp

    // Keep only recent positions in track
    if (track.positions.length > maxPositionHistory.value) {
      track.positions = track.positions.slice(0, maxPositionHistory.value)
    }
  }

  function cleanupExpiredPositions() {
    const now = Date.now()

    // Clean positions
    positions.value = positions.value.filter(pos => {
      const posTime = new Date(pos.timestamp).getTime()
      return (now - posTime) < positionExpiryMs.value
    })

    // Clean and deactivate old tracks
    tracks.value.forEach(track => {
      const lastSeenTime = new Date(track.lastSeen).getTime()
      if ((now - lastSeenTime) > positionExpiryMs.value) {
        track.isActive = false
      }

      // Clean old positions from track
      track.positions = track.positions.filter(pos => {
        const posTime = new Date(pos.timestamp).getTime()
        return (now - posTime) < positionExpiryMs.value
      })
    })

    // Remove very old inactive tracks
    tracks.value = tracks.value.filter(track => {
      if (!track.isActive) {
        const lastSeenTime = new Date(track.lastSeen).getTime()
        return (now - lastSeenTime) < positionExpiryMs.value * 2
      }
      return true
    })
  }

  /**
   * Start automatic cleanup of expired positions
   */
  function startCleanupInterval() {
    // Clear existing interval to prevent duplicates
    if (cleanupIntervalId !== null) {
      clearInterval(cleanupIntervalId)
    }

    cleanupIntervalId = setInterval(() => {
      cleanupExpiredPositions()
    }, CLEANUP_INTERVAL_MS)
  }

  /**
   * Stop automatic cleanup
   */
  function stopCleanupInterval() {
    if (cleanupIntervalId !== null) {
      clearInterval(cleanupIntervalId)
      cleanupIntervalId = null
    }
  }

  // Start cleanup interval when store is created
  startCleanupInterval()

  function clearAllPositions() {
    positions.value = []
    tracks.value = []
  }

  function clearPositionsForCamera(cameraId: string) {
    positions.value = positions.value.filter(pos => pos.cameraId !== cameraId)
    tracks.value = tracks.value.filter(track => track.cameraId !== cameraId)
  }

  function getTrailForTrack(trackId: string): PersonPosition[] {
    const track = tracks.value.find(t => t.trackId === trackId)
    return track?.positions || []
  }

  function setShowTrails(value: boolean) {
    showTrails.value = value
  }

  function setShowHeatmap(value: boolean) {
    showHeatmap.value = value
  }

  function setPositionExpiryMs(ms: number) {
    positionExpiryMs.value = ms
  }

  function setMaxPositionHistory(count: number) {
    maxPositionHistory.value = count
  }

  return {
    // State
    positions,
    tracks,
    maxPositionHistory,
    positionExpiryMs,
    showTrails,
    showHeatmap,
    // Getters
    activePositions,
    activeTracks,
    positionsByCameraId,
    activePersonCount,
    // Actions
    addPosition,
    addPositions,
    cleanupExpiredPositions,
    clearAllPositions,
    clearPositionsForCamera,
    getTrailForTrack,
    setShowTrails,
    setShowHeatmap,
    setPositionExpiryMs,
    setMaxPositionHistory,
  }
})
