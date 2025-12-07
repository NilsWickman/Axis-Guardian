/**
 * Track Manager - Cross-camera person tracking
 *
 * This class manages global track IDs that persist as people move between cameras.
 * It correlates detections from multiple cameras using spatial proximity and
 * merges overlapping FOV detections into single positions.
 *
 * Converted from Pinia store to pure TypeScript class for backend use.
 */

import type {
  GlobalTrack,
  GlobalTrackJSON,
  CameraDetection,
  TrackingConfig,
  TrailPosition,
  CameraTrackAssociation,
} from '../types.js'
import { DEFAULT_TRACKING_CONFIG } from '../types.js'
import { calculateDistance, predictPosition, mergeWorldPositions } from '../correlation/track-matcher.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'
import { assignDetectionsToTracks } from '../correlation/hungarian-assignment.js'

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
 * Convert GlobalTrack to JSON-serializable format
 */
export function trackToJSON(track: GlobalTrack): GlobalTrackJSON {
  const associations: Record<string, CameraTrackAssociation> = {}
  track.cameraAssociations.forEach((value, key) => {
    associations[key] = value
  })

  return {
    globalTrackId: track.globalTrackId,
    cameraAssociations: associations,
    currentPosition: track.currentPosition,
    trail: track.trail,
    color: track.color,
    lastSeen: track.lastSeen,
    isActive: track.isActive,
    isConfirmed: track.isConfirmed,
    detectionCount: track.detectionCount,
    confidence: track.confidence,
    state: track.state,
  }
}

export interface TrackManagerOptions {
  config?: Partial<TrackingConfig>
  clock?: () => number
  idGenerator?: () => string
}

/**
 * TrackManager - Pure TypeScript class for managing global tracks
 */
export class TrackManager {
  private tracks: Map<string, GlobalTrack> = new Map()
  private nextTrackId: number = 1
  private usedColors: Set<string> = new Set()
  private config: TrackingConfig
  private clock: () => number
  private idGenerator: () => string
  private kalmanFilter: KalmanTrackFilter

  // Event callbacks for external integration (e.g., WebSocket broadcasting)
  onTrackCreated?: (track: GlobalTrack) => void
  onTrackUpdated?: (track: GlobalTrack) => void
  onTrackExpired?: (track: GlobalTrack) => void

  constructor(options: TrackManagerOptions = {}) {
    this.config = { ...DEFAULT_TRACKING_CONFIG, ...options.config }
    this.clock = options.clock ?? (() => Date.now())
    this.idGenerator = options.idGenerator ?? (() => `global-${this.nextTrackId++}`)
    // Create a new KalmanTrackFilter instance for each TrackManager
    // to avoid state cache pollution between tests or different managers
    this.kalmanFilter = new KalmanTrackFilter()
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * Get confirmed active tracks (recommended for display)
   */
  getActiveTracks(): GlobalTrack[] {
    return Array.from(this.tracks.values()).filter(
      track => track.isActive && track.isConfirmed
    )
  }

  /**
   * Get all active tracks including unconfirmed (for debugging)
   */
  getAllActiveTracks(): GlobalTrack[] {
    return Array.from(this.tracks.values()).filter(track => track.isActive)
  }

  /**
   * Get all tracks (including inactive)
   */
  getAllTracks(): GlobalTrack[] {
    return Array.from(this.tracks.values())
  }

  /**
   * Get a specific track by ID
   */
  getTrackById(globalTrackId: string): GlobalTrack | undefined {
    return this.tracks.get(globalTrackId)
  }

  /**
   * Get count of confirmed active tracks
   */
  getActiveTrackCount(): number {
    return this.getActiveTracks().length
  }

  /**
   * Get count of pending (unconfirmed) tracks
   */
  getPendingTrackCount(): number {
    return this.getAllActiveTracks().length - this.getActiveTracks().length
  }

  /**
   * Get current configuration
   */
  getConfig(): TrackingConfig {
    return { ...this.config }
  }

  /**
   * Get trail for a specific track
   */
  getTrailForTrack(globalTrackId: string): TrailPosition[] {
    const track = this.tracks.get(globalTrackId)
    return track?.trail || []
  }

  /**
   * Get camera IDs currently seeing a track
   */
  getCamerasForTrack(globalTrackId: string): string[] {
    const track = this.tracks.get(globalTrackId)
    if (!track) return []

    const now = this.clock()
    const activeCameras: string[] = []

    track.cameraAssociations.forEach((assoc, cameraId) => {
      if (now - assoc.lastSeen < this.config.mergeWindowMs * 5) {
        activeCameras.push(cameraId)
      }
    })

    return activeCameras
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Main entry point - process a new detection
   */
  processDetection(
    cameraId: string,
    trackId: number,
    worldX: number,
    worldY: number,
    confidence: number
  ): GlobalTrack {
    const now = this.clock()
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
    for (const track of this.tracks.values()) {
      if (!track.isActive) continue
      const assoc = track.cameraAssociations.get(cameraId)
      if (assoc && assoc.trackIds.includes(trackId)) {
        existingTrack = track
        break
      }
    }

    if (existingTrack) {
      if (this.associateWithTrack(existingTrack, detection)) {
        this.processPendingMerge(existingTrack, now)
        this.onTrackUpdated?.(existingTrack)
        return existingTrack
      }
    }

    // Look for nearby track to correlate with
    const nearbyTrack = this.findNearbyTrack(worldX, worldY, cameraId, trackId)

    if (nearbyTrack) {
      if (this.associateWithTrack(nearbyTrack, detection)) {
        this.processPendingMerge(nearbyTrack, now)
        this.onTrackUpdated?.(nearbyTrack)
        return nearbyTrack
      }
    }

    // No match found or velocity check failed, create new global track
    const newTrack = this.createGlobalTrack(detection)
    this.onTrackCreated?.(newTrack)
    return newTrack
  }

  /**
   * Cleanup expired tracks with occlusion state handling
   */
  cleanupExpiredTracks(): void {
    const now = this.clock()
    const maxTracks = 200
    const unconfirmedExpiryMs = this.config.unconfirmedTrackExpiryMs ?? 2000
    const occlusionCoastTimeMs = this.config.occlusionCoastTimeMs ?? 2000

    for (const [trackId, track] of this.tracks.entries()) {
      const timeSinceLastSeen = now - track.lastSeen

      // Handle unconfirmed tracks - expire faster
      if (track.state === 'unconfirmed') {
        if (timeSinceLastSeen > unconfirmedExpiryMs) {
          track.isActive = false
          this.releaseColor(track.color)
          this.tracks.delete(trackId)
          this.kalmanFilter.removeTrackState(trackId)
          continue
        }
      }

      // Handle confirmed tracks - transition to occluded state
      if (track.state === 'confirmed' && timeSinceLastSeen > 100) {
        // Track hasn't been seen recently, transition to occluded
        track.state = 'occluded'
        track.occludedSince = track.lastSeen
        track.missedFrames++
      }

      // Handle occluded tracks - check if they should expire
      if (track.state === 'occluded') {
        const timeSinceOcclusion = now - (track.occludedSince ?? track.lastSeen)

        if (timeSinceOcclusion > occlusionCoastTimeMs) {
          // Occlusion coast time exceeded, expire the track
          if (track.isActive) {
            track.isActive = false
            this.releaseColor(track.color)
            this.onTrackExpired?.(track)
          }
        }
      }

      // Full track expiry
      if (timeSinceLastSeen > this.config.trackExpiryMs) {
        if (track.isActive) {
          track.isActive = false
          this.releaseColor(track.color)
          this.onTrackExpired?.(track)
        }

        // Remove completely after double expiry time
        if (timeSinceLastSeen > this.config.trackExpiryMs * 2) {
          this.tracks.delete(trackId)
          this.kalmanFilter.removeTrackState(trackId)
        }
      }

      if (!track.isActive) {
        track.pendingDetections = []
      }
    }

    // Emergency cleanup if too many tracks accumulated
    if (this.tracks.size > maxTracks) {
      const sortedTracks = Array.from(this.tracks.entries())
        .sort((a, b) => a[1].lastSeen - b[1].lastSeen)

      const toRemove = sortedTracks
        .filter(([, t]) => !t.isActive)
        .slice(0, this.tracks.size - maxTracks)

      for (const [trackId, track] of toRemove) {
        this.releaseColor(track.color)
        this.tracks.delete(trackId)
        this.kalmanFilter.removeTrackState(trackId)
      }
    }
  }

  /**
   * Clear all tracks
   */
  clearAllTracks(): void {
    this.tracks.clear()
    this.usedColors.clear()
    this.nextTrackId = 1
    this.kalmanFilter.clearCache()
  }

  /**
   * Update tracking configuration
   */
  updateConfig(updates: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_TRACKING_CONFIG }
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  private assignColor(): string {
    for (const color of TRACK_COLORS) {
      if (!this.usedColors.has(color)) {
        this.usedColors.add(color)
        return color
      }
    }
    const color = TRACK_COLORS[this.nextTrackId % TRACK_COLORS.length]
    return color
  }

  private releaseColor(color: string): void {
    this.usedColors.delete(color)
  }

  /**
   * Find a nearby active track within correlation distance
   * Uses Kalman filter prediction for better accuracy
   */
  findNearbyTrack(
    worldX: number,
    worldY: number,
    excludeCameraId?: string,
    excludeTrackId?: number
  ): GlobalTrack | null {
    let bestMatch: GlobalTrack | null = null
    let bestDistance = this.config.correlationDistanceM
    const now = this.clock()

    for (const track of this.tracks.values()) {
      if (!track.isActive) continue

      // Check if this track is already associated with this camera+trackId
      if (excludeCameraId && excludeTrackId !== undefined) {
        const assoc = track.cameraAssociations.get(excludeCameraId)
        if (assoc && assoc.trackIds.includes(excludeTrackId)) {
          return track
        }
      }

      const timeSinceUpdate = now - track.lastSeen

      // Use Kalman filter prediction if available, fall back to linear prediction
      let predictedPosition = track.currentPosition
      if (track.kalmanState && timeSinceUpdate > 50) {
        // Use Kalman prediction
        predictedPosition = this.kalmanFilter.predict(track.kalmanState, timeSinceUpdate)
      } else if (track.trail.length >= 2 && timeSinceUpdate > 50) {
        // Fall back to legacy linear prediction
        const predicted = predictPosition(track.trail, timeSinceUpdate)
        if (predicted) {
          predictedPosition = predicted
        }
      }

      const distanceToCurrent = calculateDistance(
        { x: worldX, y: worldY },
        track.currentPosition
      )

      const distanceToPredicted = calculateDistance(
        { x: worldX, y: worldY },
        predictedPosition
      )

      const distance = Math.min(distanceToCurrent, distanceToPredicted)

      // Use adaptive gating if Kalman state available
      let threshold = this.config.correlationDistanceM
      if (track.kalmanState) {
        threshold = this.kalmanFilter.getGatingDistance(
          track.kalmanState,
          this.config.correlationDistanceM
        )
      } else if (distanceToPredicted < distanceToCurrent) {
        threshold = this.config.correlationDistanceM * 1.5
      }

      // Expand gating for occluded tracks to allow re-association
      if (track.state === 'occluded') {
        const occlusionCoastTimeMs = this.config.occlusionCoastTimeMs ?? 2000
        const timeSinceOcclusion = now - (track.occludedSince ?? now)
        // Gradually expand gate up to 2x based on occlusion duration
        const expansionFactor = Math.min(2.0, 1.0 + timeSinceOcclusion / occlusionCoastTimeMs)
        threshold *= expansionFactor
      }

      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance
        bestMatch = track
      }
    }

    return bestMatch
  }

  /**
   * Check if a position is too close to existing confirmed tracks
   * to create a new track (likely a duplicate detection)
   */
  private isInExclusionZone(worldX: number, worldY: number): boolean {
    const exclusionRadius = this.config.exclusionRadius ?? 0.3

    for (const track of this.tracks.values()) {
      if (!track.isActive || !track.isConfirmed) continue

      const distance = calculateDistance(
        { x: worldX, y: worldY },
        track.currentPosition
      )
      if (distance < exclusionRadius) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a detection meets minimum confidence for track creation
   */
  private meetsCreationConfidence(detection: CameraDetection): boolean {
    const minConfidence = this.config.minCreationConfidence ?? 0.7
    return detection.confidence >= minConfidence
  }

  private createGlobalTrack(detection: CameraDetection): GlobalTrack {
    const globalTrackId = this.idGenerator()
    const color = this.assignColor()

    // Initialize Kalman filter state for this track
    const kalmanState = this.kalmanFilter.initialize(
      { x: detection.worldX, y: detection.worldY },
      detection.timestamp
    )

    const track: GlobalTrack = {
      globalTrackId,
      cameraAssociations: new Map(),
      currentPosition: { x: detection.worldX, y: detection.worldY },
      trail: [{ x: detection.worldX, y: detection.worldY, timestamp: detection.timestamp }],
      color,
      lastSeen: detection.timestamp,
      isActive: true,
      isConfirmed: false,
      detectionCount: 1,
      confidence: detection.confidence,
      pendingDetections: [detection],
      kalmanState,
      state: 'unconfirmed',
      missedFrames: 0,
    }

    track.cameraAssociations.set(detection.cameraId, {
      cameraId: detection.cameraId,
      trackIds: [detection.trackId],
      lastSeen: detection.timestamp,
    })

    this.tracks.set(globalTrackId, track)
    return track
  }

  private associateWithTrack(track: GlobalTrack, detection: CameraDetection): boolean {
    // Velocity sanity check
    const timeDelta = (detection.timestamp - track.lastSeen) / 1000
    if (timeDelta > 0.01) {
      const distance = calculateDistance(
        { x: detection.worldX, y: detection.worldY },
        track.currentPosition
      )
      const velocity = distance / timeDelta
      if (velocity > this.config.maxVelocityMs) {
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

    track.detectionCount++
    track.missedFrames = 0  // Reset missed frames on detection

    // Transition state on confirmation
    if (!track.isConfirmed && track.detectionCount >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
    }

    // Recover from occlusion on detection
    if (track.state === 'occluded') {
      track.state = 'confirmed'
      track.occludedSince = undefined
    }

    track.pendingDetections.push(detection)
    if (track.pendingDetections.length > 50) {
      track.pendingDetections = track.pendingDetections.slice(-20)
    }
    track.lastSeen = detection.timestamp
    return true
  }

  private processPendingMerge(track: GlobalTrack, now: number): void {
    const recentDetections = track.pendingDetections.filter(
      det => now - det.timestamp < this.config.mergeWindowMs
    )

    if (recentDetections.length === 0) {
      track.pendingDetections = []
      return
    }

    const merged = mergeWorldPositions(recentDetections)

    // Update Kalman filter state with merged position
    if (track.kalmanState) {
      track.kalmanState = this.kalmanFilter.update(
        track.kalmanState,
        merged.position,
        now,
        track.globalTrackId  // Pass track ID for state caching
      )
      // Use Kalman-filtered position for smoother tracking
      const filteredPosition = this.kalmanFilter.getPosition(track.kalmanState)
      merged.position = filteredPosition
    }

    const lastTrailPos = track.trail[0]
    const movedDistance = lastTrailPos
      ? calculateDistance(merged.position, lastTrailPos)
      : Infinity

    if (movedDistance > 0.1 || track.trail.length === 0) {
      track.trail.unshift({ x: merged.position.x, y: merged.position.y, timestamp: now })

      if (track.trail.length > this.config.maxTrailLength) {
        track.trail = track.trail.slice(0, this.config.maxTrailLength)
      }
    }

    track.currentPosition = merged.position
    track.confidence = merged.confidence

    track.pendingDetections = recentDetections.filter(
      det => now - det.timestamp < this.config.mergeWindowMs / 2
    )
  }

  // ============================================================================
  // Batch Processing with Hungarian Algorithm
  // ============================================================================

  /**
   * Process a batch of detections using Hungarian algorithm for optimal assignment
   * This is more efficient for multi-detection frames
   */
  processBatchDetections(detections: CameraDetection[]): GlobalTrack[] {
    if (detections.length === 0) return []

    const now = this.clock()
    const activeTracks = this.getAllActiveTracks()

    // Use Hungarian algorithm for optimal assignment
    const { matches, unmatchedDetections } = assignDetectionsToTracks(
      detections,
      activeTracks,
      {
        maxCost: this.config.correlationDistanceM * 2,
        useKalmanPrediction: true,
        associationBonus: 0.3,  // Use tighter association bonus
        kalmanFilter: this.kalmanFilter,
      }
    )

    const results: GlobalTrack[] = []

    // Process matched pairs
    for (const { detection, track } of matches) {
      if (this.associateWithTrack(track, detection)) {
        this.processPendingMerge(track, now)
        this.onTrackUpdated?.(track)
        results.push(track)
      }
    }

    // Try re-identification for unmatched detections with occluded tracks
    const occludedTracks = this.getAllTracks().filter(
      t => t.state === 'occluded' && t.isConfirmed
    )

    const finalUnmatched: CameraDetection[] = []
    for (const detection of unmatchedDetections) {
      const reidentified = this.attemptReidentification(detection, occludedTracks)
      if (reidentified) {
        // Restore track from occlusion
        reidentified.state = 'confirmed'
        reidentified.missedFrames = 0
        reidentified.occludedSince = undefined
        if (this.associateWithTrack(reidentified, detection)) {
          this.processPendingMerge(reidentified, now)
          this.onTrackUpdated?.(reidentified)
          results.push(reidentified)
        }
      } else {
        finalUnmatched.push(detection)
      }
    }

    // Create new tracks for truly unmatched detections
    // Apply ghost track prevention: check exclusion zone and confidence
    for (const detection of finalUnmatched) {
      // Skip if within exclusion zone of confirmed track
      if (this.isInExclusionZone(detection.worldX, detection.worldY)) {
        continue
      }

      // Skip if confidence is too low
      if (!this.meetsCreationConfidence(detection)) {
        continue
      }

      const newTrack = this.createGlobalTrack(detection)
      this.onTrackCreated?.(newTrack)
      results.push(newTrack)
    }

    return results
  }

  /**
   * Attempt to re-identify a detection with a recently occluded track
   * Uses camera trackId matching and spatial proximity
   */
  private attemptReidentification(
    detection: CameraDetection,
    occludedTracks: GlobalTrack[]
  ): GlobalTrack | null {
    const gateMultiplier = this.config.reidentificationGateMultiplier ?? 3.0

    for (const track of occludedTracks) {
      const assoc = track.cameraAssociations.get(detection.cameraId)

      // Check if camera trackId matches
      if (assoc?.trackIds.includes(detection.trackId)) {
        // Verify spatial plausibility using Kalman prediction
        if (track.kalmanState) {
          const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? track.lastSeen)
          const predicted = this.kalmanFilter.predict(track.kalmanState, timeSinceOcclusion)
          const distance = calculateDistance(
            { x: detection.worldX, y: detection.worldY },
            predicted
          )

          // Use expanded gate for re-identification
          const maxDistance = this.config.correlationDistanceM * gateMultiplier
          if (distance < maxDistance) {
            return track
          }
        }
      }
    }

    return null
  }
}
