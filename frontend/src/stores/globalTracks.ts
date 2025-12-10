/**
 * Global Track Store - Cross-camera person tracking
 *
 * This store manages global track IDs that persist as people move between cameras.
 * It correlates detections from multiple cameras using spatial proximity and
 * merges overlapping FOV detections into single positions.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { predictPosition } from '../utils/trackCorrelation'

// Default configuration constants
export const DEFAULT_CORRELATION_DISTANCE_M = 1.5 // Max distance (meters) to associate detection with existing track
export const DEFAULT_MERGE_WINDOW_MS = 200 // Time window for multi-camera merging
export const DEFAULT_TRACK_EXPIRY_MS = 5000 // Remove tracks not seen for 5 seconds
export const DEFAULT_MAX_TRAIL_LENGTH = 20 // Position history for trails
export const DEFAULT_MIN_DETECTIONS_TO_CONFIRM = 3 // Minimum detections before track is considered confirmed
export const DEFAULT_MAX_VELOCITY_MS = 10 // Max reasonable walking speed in m/s (reject teleporting tracks)

// Configurable tracking parameters interface
export interface TrackingConfig {
  correlationDistanceM: number
  mergeWindowMs: number
  trackExpiryMs: number
  maxTrailLength: number
  minDetectionsToConfirm: number
  maxVelocityMs: number
}

// Frame info for timing diagnostics
export interface CameraFrameInfo {
  cameraId: string
  frameNumber: number
  timestamp: number
}

// Color palette for global tracks (12 distinct colors)
const TRACK_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#84cc16', // lime
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f43f5e', // rose
]

/**
 * Position data from a single camera detection
 */
export interface CameraDetection {
  cameraId: string
  trackId: number // Per-camera track ID from ByteTrack
  worldX: number // World position X (meters)
  worldY: number // World position Y (meters)
  confidence: number
  timestamp: number // Unix timestamp in ms
}

/**
 * Camera-specific track association
 */
export interface CameraTrackAssociation {
  cameraId: string
  trackIds: number[] // List of track IDs from this camera associated with this global track
  lastSeen: number
}

/**
 * Trail position for history visualization
 */
export interface TrailPosition {
  x: number
  y: number
  timestamp: number
}

/**
 * Reason why a track stopped being detected
 * Used to determine timeout behavior and display mode
 */
export type ExitReason = 'fov_exit' | 'boundary_exit' | 'pillar_occlusion' | 'timeout' | null

/**
 * Global track that spans multiple cameras
 */
export interface GlobalTrack {
  globalTrackId: string
  cameraAssociations: Map<string, CameraTrackAssociation>
  currentPosition: { x: number; y: number }
  trail: TrailPosition[]
  color: string
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean // True after MIN_DETECTIONS_TO_CONFIRM detections
  detectionCount: number // Total number of detections for this track
  confidence: number // Latest confidence value
  state: 'unconfirmed' | 'confirmed' | 'occluded' // Track lifecycle state
  // Pending detections for multi-camera merge within time window
  pendingDetections: CameraDetection[]
  /** Reason why track stopped being detected (for smart timeout behavior) */
  exitReason?: ExitReason
  /** Predicted position during pillar occlusion (ghost track) */
  predictedPosition?: { x: number; y: number }
}

/**
 * Calculate Euclidean distance between two points
 */
function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * Merge multiple positions into a confidence-weighted centroid
 */
function mergePositions(detections: CameraDetection[]): { x: number; y: number; confidence: number } {
  if (detections.length === 0) {
    return { x: 0, y: 0, confidence: 0 }
  }

  if (detections.length === 1) {
    return {
      x: detections[0].worldX,
      y: detections[0].worldY,
      confidence: detections[0].confidence,
    }
  }

  // Confidence-weighted average
  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maxConfidence = 0

  detections.forEach(det => {
    const weight = det.confidence
    totalWeight += weight
    weightedX += det.worldX * weight
    weightedY += det.worldY * weight
    maxConfidence = Math.max(maxConfidence, det.confidence)
  })

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
    confidence: maxConfidence,
  }
}

export const useGlobalTrackStore = defineStore('globalTracks', () => {
  // State
  const tracks = ref<Map<string, GlobalTrack>>(new Map())
  const nextTrackId = ref(1)
  const usedColors = ref<Set<string>>(new Set())

  // Tracking frame info for timing diagnostics (per camera)
  const trackingFrameInfo = ref<Map<string, CameraFrameInfo>>(new Map())

  // Configurable tracking parameters
  const config = ref<TrackingConfig>({
    correlationDistanceM: DEFAULT_CORRELATION_DISTANCE_M,
    mergeWindowMs: DEFAULT_MERGE_WINDOW_MS,
    trackExpiryMs: DEFAULT_TRACK_EXPIRY_MS,
    maxTrailLength: DEFAULT_MAX_TRAIL_LENGTH,
    minDetectionsToConfirm: DEFAULT_MIN_DETECTIONS_TO_CONFIRM,
    maxVelocityMs: DEFAULT_MAX_VELOCITY_MS,
  })

  // UI settings
  const showTrails = ref(true)

  // Getters
  const activeTracks = computed(() => {
    // Return confirmed tracks that are:
    // 1. Actively being detected (not occluded), OR
    // 2. Pillar-occluded with a predicted position (ghost tracks)
    return Array.from(tracks.value.values()).filter(
      track => track.isActive && track.isConfirmed &&
        (track.state !== 'occluded' || track.exitReason === 'pillar_occlusion')
    )
  })

  // Include unconfirmed tracks for debugging
  const allActiveTracks = computed(() => {
    return Array.from(tracks.value.values()).filter(track => track.isActive)
  })

  const activeTrackCount = computed(() => activeTracks.value.length)
  const pendingTrackCount = computed(() => allActiveTracks.value.length - activeTracks.value.length)

  const allTracks = computed(() => Array.from(tracks.value.values()))

  // Actions

  /**
   * Assign a unique color to a new track
   */
  function assignColor(): string {
    // Find first unused color
    for (const color of TRACK_COLORS) {
      if (!usedColors.value.has(color)) {
        usedColors.value.add(color)
        return color
      }
    }
    // All colors used, recycle from beginning
    const color = TRACK_COLORS[nextTrackId.value % TRACK_COLORS.length]
    return color
  }

  /**
   * Release a color when track expires
   */
  function releaseColor(color: string) {
    usedColors.value.delete(color)
  }

  /**
   * Find a nearby active track within correlation distance
   * Uses velocity prediction for fast-moving targets
   */
  function findNearbyTrack(
    worldX: number,
    worldY: number,
    excludeCameraId?: string,
    excludeTrackId?: number
  ): GlobalTrack | null {
    let bestMatch: GlobalTrack | null = null
    let bestDistance = config.value.correlationDistanceM
    const now = Date.now()

    for (const track of tracks.value.values()) {
      if (!track.isActive) continue

      // Check if this track is already associated with this camera+trackId
      if (excludeCameraId && excludeTrackId !== undefined) {
        const assoc = track.cameraAssociations.get(excludeCameraId)
        if (assoc && assoc.trackIds.includes(excludeTrackId)) {
          // This is an existing association, return it directly
          return track
        }
      }

      // Calculate time since last update
      const timeSinceUpdate = now - track.lastSeen

      // Try to predict position for fast-moving targets
      let predictedPosition = track.currentPosition
      if (track.trail.length >= 2 && timeSinceUpdate > 50) {
        const predicted = predictPosition(track.trail, timeSinceUpdate)
        if (predicted) {
          predictedPosition = predicted
        }
      }

      // Calculate distance to both current and predicted positions
      const distanceToCurrent = calculateDistance(
        worldX,
        worldY,
        track.currentPosition.x,
        track.currentPosition.y
      )

      const distanceToPredicted = calculateDistance(
        worldX,
        worldY,
        predictedPosition.x,
        predictedPosition.y
      )

      // Use the smaller distance (better match)
      const distance = Math.min(distanceToCurrent, distanceToPredicted)

      // Use expanded threshold for predicted positions (1.5x correlation distance)
      const threshold = distanceToPredicted < distanceToCurrent
        ? config.value.correlationDistanceM * 1.5
        : config.value.correlationDistanceM

      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance
        bestMatch = track
      }
    }

    return bestMatch
  }

  /**
   * Create a new global track
   */
  function createGlobalTrack(detection: CameraDetection): GlobalTrack {
    const globalTrackId = `global-${nextTrackId.value++}`
    const color = assignColor()

    const track: GlobalTrack = {
      globalTrackId,
      cameraAssociations: new Map(),
      currentPosition: { x: detection.worldX, y: detection.worldY },
      trail: [{ x: detection.worldX, y: detection.worldY, timestamp: detection.timestamp }],
      color,
      lastSeen: detection.timestamp,
      isActive: true,
      isConfirmed: false, // Not confirmed until MIN_DETECTIONS_TO_CONFIRM
      detectionCount: 1,
      confidence: detection.confidence,
      state: 'unconfirmed',
      pendingDetections: [detection],
    }

    // Add camera association
    track.cameraAssociations.set(detection.cameraId, {
      cameraId: detection.cameraId,
      trackIds: [detection.trackId],
      lastSeen: detection.timestamp,
    })

    tracks.value.set(globalTrackId, track)
    return track
  }

  /**
   * Associate a camera track with an existing global track
   */
  function associateWithTrack(
    track: GlobalTrack,
    detection: CameraDetection
  ): boolean {
    // Velocity sanity check - reject teleporting tracks
    const timeDelta = (detection.timestamp - track.lastSeen) / 1000 // seconds
    if (timeDelta > 0.01) { // Only check if meaningful time passed
      const distance = calculateDistance(
        detection.worldX,
        detection.worldY,
        track.currentPosition.x,
        track.currentPosition.y
      )
      const velocity = distance / timeDelta
      if (velocity > config.value.maxVelocityMs) {
        // This detection would imply impossible movement speed - reject it
        return false
      }
    }

    // Update or add camera association
    let assoc = track.cameraAssociations.get(detection.cameraId)
    if (assoc) {
      if (!assoc.trackIds.includes(detection.trackId)) {
        assoc.trackIds.push(detection.trackId)
      }
      assoc.lastSeen = detection.timestamp
    } else {
      track.cameraAssociations.set(detection.cameraId, {
        cameraId: detection.cameraId,
        trackIds: [detection.trackId],
        lastSeen: detection.timestamp,
      })
    }

    // Increment detection count and update confirmed status
    track.detectionCount++
    if (!track.isConfirmed && track.detectionCount >= config.value.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
    }

    // Add to pending detections for merge (limit to prevent memory growth)
    track.pendingDetections.push(detection)
    if (track.pendingDetections.length > 50) {
      track.pendingDetections = track.pendingDetections.slice(-20)
    }
    track.lastSeen = detection.timestamp
    return true
  }

  /**
   * Process pending detections and merge positions
   */
  function processPendingMerge(track: GlobalTrack, now: number) {
    // Filter detections within merge window
    const recentDetections = track.pendingDetections.filter(
      det => now - det.timestamp < config.value.mergeWindowMs
    )

    if (recentDetections.length === 0) {
      track.pendingDetections = []
      return
    }

    // Merge positions
    const merged = mergePositions(recentDetections)

    // Check if position moved significantly (more than 0.1m) to add to trail
    const lastTrailPos = track.trail[0]
    const movedDistance = lastTrailPos
      ? calculateDistance(merged.x, merged.y, lastTrailPos.x, lastTrailPos.y)
      : Infinity

    if (movedDistance > 0.1 || track.trail.length === 0) {
      track.trail.unshift({ x: merged.x, y: merged.y, timestamp: now })

      // Trim trail to max length
      if (track.trail.length > config.value.maxTrailLength) {
        track.trail = track.trail.slice(0, config.value.maxTrailLength)
      }
    }

    // Update current position
    track.currentPosition = { x: merged.x, y: merged.y }
    track.confidence = merged.confidence

    // Keep only very recent pending detections for next merge cycle
    track.pendingDetections = recentDetections.filter(
      det => now - det.timestamp < config.value.mergeWindowMs / 2
    )
  }

  /**
   * Main entry point - process a new detection
   */
  function processDetection(
    cameraId: string,
    trackId: number,
    worldX: number,
    worldY: number,
    confidence: number
  ) {
    const now = Date.now()
    const detection: CameraDetection = {
      cameraId,
      trackId,
      worldX,
      worldY,
      confidence,
      timestamp: now,
    }

    // First check if this camera+trackId is already associated with a global track
    let existingTrack: GlobalTrack | null = null
    for (const track of tracks.value.values()) {
      if (!track.isActive) continue
      const assoc = track.cameraAssociations.get(cameraId)
      if (assoc && assoc.trackIds.includes(trackId)) {
        existingTrack = track
        break
      }
    }

    if (existingTrack) {
      // Update existing association (returns false if velocity check fails)
      if (associateWithTrack(existingTrack, detection)) {
        processPendingMerge(existingTrack, now)
        return existingTrack
      }
      // Velocity check failed - create a new track instead
    }

    // Look for nearby track to correlate with
    const nearbyTrack = findNearbyTrack(worldX, worldY, cameraId, trackId)

    if (nearbyTrack) {
      // Correlate with nearby track (returns false if velocity check fails)
      if (associateWithTrack(nearbyTrack, detection)) {
        processPendingMerge(nearbyTrack, now)
        return nearbyTrack
      }
      // Velocity check failed - create a new track instead
    }

    // No match found or velocity check failed, create new global track
    const newTrack = createGlobalTrack(detection)
    return newTrack
  }

  /**
   * Cleanup expired tracks
   */
  function cleanupExpiredTracks() {
    const now = Date.now()
    const maxTracks = 200 // Hard limit on total tracks to prevent memory issues

    for (const [trackId, track] of tracks.value.entries()) {
      if (now - track.lastSeen > config.value.trackExpiryMs) {
        track.isActive = false
        releaseColor(track.color)

        // Remove completely after double expiry time
        if (now - track.lastSeen > config.value.trackExpiryMs * 2) {
          tracks.value.delete(trackId)
        }
      }

      // Also clear pending detections on inactive tracks
      if (!track.isActive) {
        track.pendingDetections = []
      }
    }

    // Emergency cleanup if too many tracks accumulated
    if (tracks.value.size > maxTracks) {
      const sortedTracks = Array.from(tracks.value.entries())
        .sort((a, b) => a[1].lastSeen - b[1].lastSeen)

      // Remove oldest inactive tracks first
      const toRemove = sortedTracks
        .filter(([, t]) => !t.isActive)
        .slice(0, tracks.value.size - maxTracks)

      for (const [trackId, track] of toRemove) {
        releaseColor(track.color)
        tracks.value.delete(trackId)
      }
    }
  }

  /**
   * Clear all tracks
   */
  function clearAllTracks() {
    tracks.value.clear()
    usedColors.value.clear()
    nextTrackId.value = 1
  }

  /**
   * Get trail positions for a track
   */
  function getTrailForTrack(globalTrackId: string): TrailPosition[] {
    const track = tracks.value.get(globalTrackId)
    return track?.trail || []
  }

  /**
   * Get camera IDs currently seeing a track
   */
  function getCamerasForTrack(globalTrackId: string): string[] {
    const track = tracks.value.get(globalTrackId)
    if (!track) return []

    const now = Date.now()
    const activeCameras: string[] = []

    track.cameraAssociations.forEach((assoc, cameraId) => {
      // Consider camera "active" if seen within merge window
      if (now - assoc.lastSeen < config.value.mergeWindowMs * 5) {
        activeCameras.push(cameraId)
      }
    })

    return activeCameras
  }

  /**
   * Toggle trail visibility
   */
  function setShowTrails(value: boolean) {
    showTrails.value = value
  }

  /**
   * Update tracking configuration
   */
  function updateConfig(updates: Partial<TrackingConfig>) {
    config.value = { ...config.value, ...updates }
  }

  /**
   * Reset configuration to defaults
   */
  function resetConfig() {
    config.value = {
      correlationDistanceM: DEFAULT_CORRELATION_DISTANCE_M,
      mergeWindowMs: DEFAULT_MERGE_WINDOW_MS,
      trackExpiryMs: DEFAULT_TRACK_EXPIRY_MS,
      maxTrailLength: DEFAULT_MAX_TRAIL_LENGTH,
      minDetectionsToConfirm: DEFAULT_MIN_DETECTIONS_TO_CONFIRM,
      maxVelocityMs: DEFAULT_MAX_VELOCITY_MS,
    }
  }

  // ============================================
  // Server Sync Methods (for tracking-service WebSocket)
  // ============================================

  /**
   * JSON format received from tracking-service
   */
  interface GlobalTrackJSON {
    globalTrackId: string
    cameraAssociations: Record<string, CameraTrackAssociation>
    currentPosition: { x: number; y: number }
    trail: TrailPosition[]
    color: string
    lastSeen: number
    isActive: boolean
    isConfirmed: boolean
    detectionCount: number
    confidence: number
    state: 'unconfirmed' | 'confirmed' | 'occluded'
    exitReason?: ExitReason
    predictedPosition?: { x: number; y: number }
  }

  /**
   * Convert server JSON to frontend GlobalTrack (Map conversion)
   */
  function convertServerTrack(json: GlobalTrackJSON): GlobalTrack {
    return {
      ...json,
      cameraAssociations: new Map(Object.entries(json.cameraAssociations)),
      pendingDetections: [], // Server handles merging, no pending needed
    }
  }

  /**
   * Replace all tracks with server-provided snapshot
   */
  function setTracksFromServer(serverTracks: unknown[]): void {
    tracks.value.clear()
    usedColors.value.clear()

    for (const track of serverTracks as GlobalTrackJSON[]) {
      const converted = convertServerTrack(track)
      tracks.value.set(converted.globalTrackId, converted)
      usedColors.value.add(converted.color)
    }

    // Update nextTrackId based on highest received ID
    let maxId = 0
    for (const trackId of tracks.value.keys()) {
      const match = trackId.match(/global-(\d+)/)
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1], 10))
      }
    }
    nextTrackId.value = maxId + 1
  }

  /**
   * Update or insert a single track from server
   */
  function upsertTrackFromServer(serverTrack: unknown): void {
    const json = serverTrack as GlobalTrackJSON
    const converted = convertServerTrack(json)

    // Check if track exists
    const existing = tracks.value.get(converted.globalTrackId)
    if (existing) {
      // Update existing track
      existing.currentPosition = converted.currentPosition
      existing.trail = converted.trail
      existing.lastSeen = converted.lastSeen
      existing.isActive = converted.isActive
      existing.isConfirmed = converted.isConfirmed
      existing.detectionCount = converted.detectionCount
      existing.confidence = converted.confidence
      existing.cameraAssociations = converted.cameraAssociations
      existing.state = converted.state
    } else {
      // Insert new track
      tracks.value.set(converted.globalTrackId, converted)
      usedColors.value.add(converted.color)
    }
  }

  /**
   * Remove a track by ID (when server reports expiry)
   */
  function removeTrack(trackId: string): void {
    const track = tracks.value.get(trackId)
    if (track) {
      releaseColor(track.color)
      tracks.value.delete(trackId)
    }
  }

  /**
   * Update frame info from server (for timing diagnostics)
   */
  function updateFrameInfo(frames: CameraFrameInfo[] | undefined): void {
    if (!frames) return
    for (const frame of frames) {
      trackingFrameInfo.value.set(frame.cameraId, frame)
    }
  }

  /**
   * Get frame info for a specific camera
   */
  function getFrameInfoForCamera(cameraId: string): CameraFrameInfo | undefined {
    return trackingFrameInfo.value.get(cameraId)
  }

  /**
   * Get all tracking frame info
   */
  function getAllFrameInfo(): CameraFrameInfo[] {
    return Array.from(trackingFrameInfo.value.values())
  }

  return {
    // State
    tracks,
    showTrails,
    config, // Configurable tracking parameters
    trackingFrameInfo, // Frame info for timing diagnostics
    // Getters
    activeTracks,
    allActiveTracks, // Includes unconfirmed tracks (for debugging)
    activeTrackCount,
    pendingTrackCount, // Tracks waiting for confirmation
    allTracks,
    // Actions
    processDetection,
    cleanupExpiredTracks,
    clearAllTracks,
    getTrailForTrack,
    getCamerasForTrack,
    setShowTrails,
    updateConfig,
    resetConfig,
    // Server sync methods
    setTracksFromServer,
    upsertTrackFromServer,
    removeTrack,
    updateFrameInfo,
    getFrameInfoForCamera,
    getAllFrameInfo,
    // For testing/debugging
    findNearbyTrack,
  }
})
