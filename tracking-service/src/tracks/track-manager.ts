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
import { TrackMerger } from './track-merger.js'

/**
 * Cluster of detections from different cameras that likely represent same person
 */
interface DetectionCluster {
  detections: CameraDetection[]
  centroid: { x: number; y: number }
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
 * Per-camera frame tracking for accurate missed frame detection
 */
interface CameraFrameTracker {
  lastFrameNumber: number
  lastFrameTimestamp: number
  estimatedFps: number
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
  private trackMerger: TrackMerger
  /** Per-camera frame tracking for frame-based missed detection */
  private cameraFrameTrackers: Map<string, CameraFrameTracker> = new Map()

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
    // Create track merger with same Kalman filter
    this.trackMerger = new TrackMerger(this.kalmanFilter, {
      mergeDistanceM: this.config.mergeDistanceM,
      mergeConfidenceThreshold: this.config.mergeConfidenceThreshold,
    })
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

      // Handle confirmed tracks - transition to occluded state after missing multiple frames
      if (track.state === 'confirmed') {
        const missedFrameThreshold = this.config.missedFramesBeforeOcclusion ?? 5

        // Calculate missed frames based on actual camera frame numbers
        let totalMissedFrames = 0
        for (const [cameraId, assoc] of track.cameraAssociations) {
          const cameraTracker = this.cameraFrameTrackers.get(cameraId)
          if (cameraTracker && assoc.lastFrameNumber !== undefined) {
            // Count frames missed since last detection from this camera
            const framesMissed = cameraTracker.lastFrameNumber - assoc.lastFrameNumber
            if (framesMissed > 0) {
              totalMissedFrames = Math.max(totalMissedFrames, framesMissed)
            }
          }
        }

        // Fall back to time-based detection if no frame info available
        if (totalMissedFrames === 0 && timeSinceLastSeen > 100) {
          totalMissedFrames = Math.floor(timeSinceLastSeen / 100)  // Assume ~10fps
        }

        track.missedFrames = totalMissedFrames

        // Only transition to occluded after missing multiple consecutive frames
        if (track.missedFrames >= missedFrameThreshold) {
          track.state = 'occluded'
          track.occludedSince = track.lastSeen
          track.consecutiveDetections = 0  // Reset for hysteresis on recovery
        }
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
   * Update camera frame tracker for frame-based missed detection
   */
  private updateCameraFrameTracker(cameraId: string, frameNumber: number, timestamp: number): void {
    const existing = this.cameraFrameTrackers.get(cameraId)
    if (existing) {
      // Estimate FPS from frame delta
      const frameDelta = frameNumber - existing.lastFrameNumber
      const timeDelta = (timestamp - existing.lastFrameTimestamp) / 1000  // seconds
      if (frameDelta > 0 && timeDelta > 0) {
        const instantFps = frameDelta / timeDelta
        // Exponential moving average for FPS estimation
        existing.estimatedFps = existing.estimatedFps * 0.9 + instantFps * 0.1
      }
      existing.lastFrameNumber = frameNumber
      existing.lastFrameTimestamp = timestamp
    } else {
      this.cameraFrameTrackers.set(cameraId, {
        lastFrameNumber: frameNumber,
        lastFrameTimestamp: timestamp,
        estimatedFps: 10,  // Default assumption
      })
    }
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

  /**
   * Cluster unmatched detections from different cameras that likely represent the same person.
   * This prevents duplicate tracks when multiple cameras see the same person simultaneously.
   */
  private clusterUnmatchedDetections(detections: CameraDetection[]): DetectionCluster[] {
    if (detections.length === 0) return []
    if (detections.length === 1) {
      return [{
        detections: [detections[0]],
        centroid: { x: detections[0].worldX, y: detections[0].worldY },
      }]
    }

    const clusteringDistance = this.config.clusteringDistanceM ?? 0.6
    const clusters: DetectionCluster[] = []
    const used = new Set<number>()

    for (let i = 0; i < detections.length; i++) {
      if (used.has(i)) continue

      const cluster: CameraDetection[] = [detections[i]]
      used.add(i)

      // Find spatially close detections from DIFFERENT cameras
      for (let j = i + 1; j < detections.length; j++) {
        if (used.has(j)) continue

        // Only cluster detections from different cameras
        if (detections[j].cameraId === detections[i].cameraId) continue

        const dist = calculateDistance(
          { x: detections[i].worldX, y: detections[i].worldY },
          { x: detections[j].worldX, y: detections[j].worldY }
        )

        if (dist < clusteringDistance) {
          cluster.push(detections[j])
          used.add(j)
        }
      }

      // Calculate centroid
      const merged = mergeWorldPositions(cluster)
      clusters.push({
        detections: cluster,
        centroid: merged.position,
      })
    }

    return clusters
  }

  /**
   * Create a global track from a cluster of detections (potentially from multiple cameras)
   */
  private createGlobalTrackFromCluster(cluster: DetectionCluster): GlobalTrack {
    // Use the first detection as the primary, but merged position
    const primaryDetection = cluster.detections[0]
    const merged = mergeWorldPositions(cluster.detections)

    const globalTrackId = this.idGenerator()
    const color = this.assignColor()

    // Initialize Kalman filter state with merged position
    const kalmanState = this.kalmanFilter.initialize(
      merged.position,
      primaryDetection.timestamp
    )

    const track: GlobalTrack = {
      globalTrackId,
      cameraAssociations: new Map(),
      currentPosition: merged.position,
      trail: [{ x: merged.position.x, y: merged.position.y, timestamp: primaryDetection.timestamp }],
      color,
      lastSeen: primaryDetection.timestamp,
      isActive: true,
      isConfirmed: false,
      detectionCount: cluster.detections.length,
      confidence: merged.confidence,
      pendingDetections: [...cluster.detections],
      kalmanState,
      state: 'unconfirmed',
      missedFrames: 0,
      consecutiveDetections: 0,
    }

    // Associate with ALL cameras in the cluster
    for (const det of cluster.detections) {
      const existingAssoc = track.cameraAssociations.get(det.cameraId)
      if (existingAssoc) {
        if (!existingAssoc.trackIds.includes(det.trackId)) {
          existingAssoc.trackIds.push(det.trackId)
        }
      } else {
        track.cameraAssociations.set(det.cameraId, {
          cameraId: det.cameraId,
          trackIds: [det.trackId],
          lastSeen: det.timestamp,
          lastFrameNumber: det.frameNumber,
        })
      }

      // Update camera frame tracker
      if (det.frameNumber !== undefined) {
        this.updateCameraFrameTracker(det.cameraId, det.frameNumber, det.timestamp)
      }
    }

    // Confirm immediately if seen by multiple cameras
    if (cluster.detections.length >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
    }

    this.tracks.set(globalTrackId, track)
    return track
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
      consecutiveDetections: 0,
    }

    track.cameraAssociations.set(detection.cameraId, {
      cameraId: detection.cameraId,
      trackIds: [detection.trackId],
      lastSeen: detection.timestamp,
      lastFrameNumber: detection.frameNumber,
    })

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.updateCameraFrameTracker(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

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
      if (detection.frameNumber !== undefined) {
        assoc.lastFrameNumber = detection.frameNumber
      }
    } else {
      track.cameraAssociations.set(detection.cameraId, {
        cameraId: detection.cameraId,
        trackIds: [detection.trackId],
        lastSeen: detection.timestamp,
        lastFrameNumber: detection.frameNumber,
      })
    }

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.updateCameraFrameTracker(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

    track.detectionCount++
    track.missedFrames = 0  // Reset missed frames on detection

    // Transition state on confirmation
    if (!track.isConfirmed && track.detectionCount >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
    }

    // Recover from occlusion with hysteresis (require multiple detections)
    if (track.state === 'occluded') {
      const detectionsRequired = this.config.detectionsToExitOcclusion ?? 2
      track.consecutiveDetections++

      // Only exit occlusion after multiple consecutive detections
      if (track.consecutiveDetections >= detectionsRequired) {
        track.state = 'confirmed'
        track.occludedSince = undefined
        track.consecutiveDetections = 0
      }
    } else {
      // Reset consecutive detection counter for non-occluded tracks
      track.consecutiveDetections = 0
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
    // IMPORTANT: Cluster detections from different cameras to prevent duplicates
    // when same person is seen by multiple cameras simultaneously
    const validUnmatched = finalUnmatched.filter(det => {
      // Skip if within exclusion zone of confirmed track
      if (this.isInExclusionZone(det.worldX, det.worldY)) {
        return false
      }
      // Skip if confidence is too low
      if (!this.meetsCreationConfidence(det)) {
        return false
      }
      return true
    })

    // Cluster detections from different cameras that are spatially close
    const clusters = this.clusterUnmatchedDetections(validUnmatched)

    // Create one track per cluster (not per detection)
    for (const cluster of clusters) {
      // Use centroid for exclusion zone check (in case filtering missed edge cases)
      if (this.isInExclusionZone(cluster.centroid.x, cluster.centroid.y)) {
        continue
      }

      const newTrack = this.createGlobalTrackFromCluster(cluster)
      this.onTrackCreated?.(newTrack)
      results.push(newTrack)
    }

    // Post-batch merge detection: Find and merge duplicate tracks
    // This catches duplicates that slipped through initial clustering
    this.detectAndMergeDuplicates()

    return results
  }

  /**
   * Detect and merge duplicate tracks that represent the same person
   */
  private detectAndMergeDuplicates(): void {
    const activeTracks = this.getActiveTracks()
    const candidates = this.trackMerger.findMergeCandidates(activeTracks)

    // Process merges (one at a time to avoid conflicts)
    const mergedTrackIds = new Set<string>()

    for (const candidate of candidates) {
      // Skip if either track was already merged in this batch
      if (mergedTrackIds.has(candidate.track1.globalTrackId) ||
          mergedTrackIds.has(candidate.track2.globalTrackId)) {
        continue
      }

      // Perform the merge
      const { primary, merged } = this.trackMerger.mergeTracks(
        candidate.track1,
        candidate.track2
      )

      mergedTrackIds.add(merged.globalTrackId)

      // Release color from merged track
      this.releaseColor(merged.color)

      // Fire events
      this.onTrackUpdated?.(primary)
      this.onTrackExpired?.(merged)
    }
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
