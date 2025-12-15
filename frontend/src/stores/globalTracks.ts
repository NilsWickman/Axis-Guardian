/**
 * Global Track Store - Cross-camera person tracking
 *
 * This store manages global track IDs that persist as people move between cameras.
 * It correlates detections from multiple cameras using spatial proximity and
 * merges overlapping FOV detections into single positions.
 *
 * NOTE: Core track types are imported from @axis-guardian/types (shared/types)
 * to ensure consistency with the tracking-service.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { predictPosition } from '../utils/trackCorrelation'

// Import shared types from canonical source
import type {
  TrackState,
  ExitReason,
  CameraTrackAssociation,
  TrailPosition,
  VideoTimingInfo,
  ColorScore,
  ClothingTypeScore,
  AggregatedClothingAttributes,
  TrackAttributes,
  GlobalTrackJSON,
  CameraFrameInfo,
  TrackingConfigBase,
} from '@axis-guardian/types'

// Re-export shared types for consumers of this module
export type {
  TrackState,
  ExitReason,
  CameraTrackAssociation,
  TrailPosition,
  VideoTimingInfo,
  ColorScore,
  ClothingTypeScore,
  AggregatedClothingAttributes,
  TrackAttributes,
  GlobalTrackJSON,
  CameraFrameInfo,
  TrackingConfigBase,
}

/**
 * Default tracking configuration values.
 *
 * IMPORTANT: These values MUST match ALGORITHM_CONSTANTS.trackLifecycle in
 * tracking-service/src/config/algorithm-constants.ts
 *
 * The tracking-service is the source of truth. These defaults are provided for:
 * 1. Frontend display when server is unavailable
 * 2. Local tracking mode fallback (deprecated)
 * 3. Type safety and consistency checks
 */
export const DEFAULT_TRACKING_CONFIG_BASE: TrackingConfigBase = {
  correlationDistanceM: 1.0,  // ALGORITHM_CONSTANTS.trackLifecycle.correlationDistanceM
  mergeWindowMs: 200,         // ALGORITHM_CONSTANTS.trackLifecycle.mergeWindowMs
  trackExpiryMs: 5000,        // ALGORITHM_CONSTANTS.trackLifecycle.trackExpiryMs
  maxTrailLength: 20,         // ALGORITHM_CONSTANTS.trackLifecycle.maxTrailLength
  minDetectionsToConfirm: 3,  // ALGORITHM_CONSTANTS.trackLifecycle.minDetectionsToConfirm
  maxVelocityMs: 8,           // ALGORITHM_CONSTANTS.trackLifecycle.maxVelocityMs
}

// Legacy constant exports for backwards compatibility
export const DEFAULT_CORRELATION_DISTANCE_M = DEFAULT_TRACKING_CONFIG_BASE.correlationDistanceM
export const DEFAULT_MERGE_WINDOW_MS = DEFAULT_TRACKING_CONFIG_BASE.mergeWindowMs
export const DEFAULT_TRACK_EXPIRY_MS = DEFAULT_TRACKING_CONFIG_BASE.trackExpiryMs
export const DEFAULT_MAX_TRAIL_LENGTH = DEFAULT_TRACKING_CONFIG_BASE.maxTrailLength
export const DEFAULT_MIN_DETECTIONS_TO_CONFIRM = DEFAULT_TRACKING_CONFIG_BASE.minDetectionsToConfirm
export const DEFAULT_MAX_VELOCITY_MS = DEFAULT_TRACKING_CONFIG_BASE.maxVelocityMs

/**
 * Local tracking configuration parameters.
 *
 * Extends TrackingConfigBase from @axis-guardian/types to ensure type consistency
 * with the tracking-service.
 *
 * @deprecated This configuration is only used for legacy local tracking mode
 * (usePersonPositionTracking composable). When using tracking-service WebSocket sync,
 * all tracking logic is handled server-side. The server's ALGORITHM_CONSTANTS is
 * the source of truth for active tracking.
 *
 * For server-synced mode, use the tracking-service REST API to query/modify config.
 */
export interface LocalTrackingConfig extends TrackingConfigBase {}

/**
 * @deprecated Use LocalTrackingConfig instead. This alias is kept for backwards compatibility.
 */
export type TrackingConfig = LocalTrackingConfig

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
 * Position data from a single camera detection (local tracking only)
 * Note: Server-synced tracks use the GlobalTrackJSON format from shared types
 */
export interface CameraDetection {
  cameraId: string
  trackId: number // Per-camera track ID from ByteTrack
  worldX: number // World position X (meters)
  worldY: number // World position Y (meters)
  confidence: number
  timestamp: number // Unix timestamp in ms
}

// Note: CameraTrackAssociation, TrailPosition, ExitReason, ColorScore,
// ClothingTypeScore, AggregatedClothingAttributes, and TrackAttributes
// are now imported from @axis-guardian/types (see imports above)

/**
 * Global track that spans multiple cameras
 *
 * NOTE: When using server sync (WebSocket), tracks come from the tracking-service
 * in GlobalTrackJSON format. The `pendingDetections` field is only used for
 * legacy local tracking mode (usePersonPositionTracking composable).
 *
 * For server-synced tracks, `pendingDetections` is undefined (not present) as
 * all detection merging is handled by the tracking-service.
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
  state: TrackState // Track lifecycle state
  /**
   * Pending detections for multi-camera merge within time window.
   *
   * @deprecated Only used for legacy local tracking mode. Server-synced tracks
   * do not have this field as merging is handled by the tracking-service.
   * This field is optional - undefined for server tracks, array for local tracks.
   */
  pendingDetections?: CameraDetection[]
  /** Reason why track stopped being detected (for smart timeout behavior) */
  exitReason?: ExitReason
  /** Predicted position during pillar occlusion (ghost track) */
  predictedPosition?: { x: number; y: number }
  /** Video timing from the most recent detection (for frontend sync) */
  videoTiming?: VideoTimingInfo
  /** Aggregated person attributes for re-ID and display (optional) */
  attributes?: TrackAttributes
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

  // Track recently expired track IDs to prevent zombie tracks from late updates
  // Maps trackId -> expiry timestamp (for cleanup)
  const recentlyExpiredTracks = ref<Map<string, number>>(new Map())
  const EXPIRED_TRACK_RETENTION_MS = 5000 // Keep expired IDs for 5 seconds

  // Tracking frame info for timing diagnostics (per camera)
  const trackingFrameInfo = ref<Map<string, CameraFrameInfo>>(new Map())

  // Configurable tracking parameters - initialized from shared defaults
  // @deprecated Local config is only used for legacy local tracking mode
  const config = ref<TrackingConfig>({ ...DEFAULT_TRACKING_CONFIG_BASE })

  // UI settings
  const showTrails = ref(true)

  // Getters
  const activeTracks = computed(() => {
    const now = Date.now()
    const occlusionGraceMs = 2000
    // Return confirmed tracks that are:
    // 1. Within normal expiry (brief dropouts stay visible), OR
    // 2. In ghost/occluded mode with a predicted position (server coasting), OR
    // 3. Recently occluded (short grace window).
    // For server-synced ghost tracks, lastSeen may not advance during coasting,
    // so predicted tracks bypass the normal expiry and rely on server expiry events.
    return Array.from(tracks.value.values()).filter(track => {
      if (!track.isActive || !track.isConfirmed) return false

      const timeSinceLastSeen = now - track.lastSeen
      const withinNormalExpiry = timeSinceLastSeen <= config.value.trackExpiryMs
      const hasPrediction = track.predictedPosition !== undefined
      const isPillarGhost = track.state === 'occluded' && track.exitReason === 'pillar_occlusion'
      const withinOcclusionGrace = timeSinceLastSeen <= occlusionGraceMs

      if (track.state !== 'occluded') {
        return withinNormalExpiry
      }

      return isPillarGhost || hasPrediction || withinOcclusionGrace || withinNormalExpiry
    })
  })

  // Include unconfirmed tracks for debugging
  const allActiveTracks = computed(() => {
    const now = Date.now()
    return Array.from(tracks.value.values()).filter(
      track => track.isActive && (now - track.lastSeen <= config.value.trackExpiryMs)
    )
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
    // Initialize array if undefined (handles mixed local/server tracks)
    if (!track.pendingDetections) {
      track.pendingDetections = []
    }
    track.pendingDetections.push(detection)
    if (track.pendingDetections.length > 50) {
      track.pendingDetections = track.pendingDetections.slice(-20)
    }
    track.lastSeen = detection.timestamp
    return true
  }

  /**
   * Process pending detections and merge positions
   * @deprecated Only used for legacy local tracking mode
   */
  function processPendingMerge(track: GlobalTrack, now: number) {
    // Skip if no pending detections (server-synced tracks)
    if (!track.pendingDetections) {
      return
    }

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
   * @deprecated Use server sync (WebSocket) instead. This local tracking method
   * is retained for legacy usePersonPositionTracking composable compatibility.
   * When using tracking-service WebSocket, use upsertTrackFromServer() instead.
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

      // Also clear pending detections on inactive tracks (local tracking only)
      if (!track.isActive && track.pendingDetections) {
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
    recentlyExpiredTracks.value.clear()
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
   * Uses DEFAULT_TRACKING_CONFIG_BASE from shared types as source of truth
   */
  function resetConfig() {
    config.value = { ...DEFAULT_TRACKING_CONFIG_BASE }
  }

  // ============================================
  // Server Sync Methods (for tracking-service WebSocket)
  // ============================================

  // Note: GlobalTrackJSON is imported from @axis-guardian/types (see imports above)

  /**
   * Convert server JSON to frontend GlobalTrack (Map conversion)
   *
   * NOTE: Server-synced tracks do not include `pendingDetections` as all
   * detection merging is handled by the tracking-service. The field is
   * intentionally omitted (undefined) to distinguish from local tracks.
   */
  function convertServerTrack(json: GlobalTrackJSON): GlobalTrack {
    return {
      ...json,
      cameraAssociations: new Map(Object.entries(json.cameraAssociations)),
      // pendingDetections intentionally omitted for server-synced tracks
      videoTiming: json.videoTiming,
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
   * Prevents zombie tracks by checking if track was recently expired
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
      existing.exitReason = converted.exitReason
      existing.predictedPosition = converted.predictedPosition
      existing.videoTiming = converted.videoTiming
      existing.attributes = converted.attributes
    } else {
      // Check if this track was recently expired (prevents zombie tracks from late updates)
      if (recentlyExpiredTracks.value.has(converted.globalTrackId)) {
        // Skip inserting - this is a late update for an expired track
        return
      }

      // Insert new track
      tracks.value.set(converted.globalTrackId, converted)
      usedColors.value.add(converted.color)
    }
  }

  /**
   * Remove a track by ID (when server reports expiry)
   * Also adds to recently expired set to prevent zombie track resurrection
   */
  function removeTrack(trackId: string): void {
    const track = tracks.value.get(trackId)
    if (track) {
      releaseColor(track.color)
      tracks.value.delete(trackId)
    }

    // Add to recently expired set to prevent late updates from resurrecting this track
    const now = Date.now()
    recentlyExpiredTracks.value.set(trackId, now)

    // Cleanup old expired track IDs
    for (const [expiredId, timestamp] of recentlyExpiredTracks.value) {
      if (now - timestamp > EXPIRED_TRACK_RETENTION_MS) {
        recentlyExpiredTracks.value.delete(expiredId)
      }
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
