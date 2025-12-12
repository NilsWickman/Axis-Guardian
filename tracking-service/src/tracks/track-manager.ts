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
  Point2D,
  VideoTimingInfo,
} from '../types.js'
import type { ZoneManager } from '../zones/zone-manager.js'
import { DEFAULT_TRACKING_CONFIG } from '../types.js'
import { calculateDistance, predictPosition, mergeWorldPositions } from '../correlation/track-matcher.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'
import { assignDetectionsToTracks } from '../correlation/hungarian-assignment.js'
import { TrackMerger } from './track-merger.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import {
  classifyExitReason,
  getTimeoutForExitReason,
} from '../geometry/exit-detection.js'
import type { CameraConfig, RoomBounds } from '../geometry/fov-geometry.js'

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
    exitReason: track.exitReason,
    predictedPosition: track.predictedPosition,
    videoTiming: track.videoTiming,
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
  /** Last detection timestamp processed (used to keep a consistent time base) */
  private lastDetectionTimestamp: number | null = null

  /** Sitemap geometry for exit detection */
  private siteMapGeometry?: {
    cameras: CameraConfig[]
    obstacles: SiteMapObstacle[]
    roomBounds: RoomBounds
  }

  /** Zone manager for restricted zone violation detection */
  private zoneManager?: ZoneManager

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

    const now = this.lastDetectionTimestamp ?? this.clock()
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
    const now = this.lastDetectionTimestamp ?? this.clock()
    this.lastDetectionTimestamp = now
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
    const now = this.lastDetectionTimestamp ?? this.clock()
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
          this.zoneManager?.clearTrackState(trackId)
          continue
        }
      }

      // Handle confirmed tracks - transition to occluded state after missing multiple frames
      if (track.state === 'confirmed') {
        const missedFrameThreshold = this.config.missedFramesBeforeOcclusion ?? 5

        // Calculate missed frames based on actual camera frame numbers.
        // Use the *minimum* missed frames across cameras so a multi-camera track
        // does not become occluded while at least one camera still sees it.
        const perCameraMissed: number[] = []
        for (const [cameraId, assoc] of track.cameraAssociations) {
          const cameraTracker = this.cameraFrameTrackers.get(cameraId)
          if (cameraTracker && assoc.lastFrameNumber !== undefined) {
            const framesMissed = cameraTracker.lastFrameNumber - assoc.lastFrameNumber
            perCameraMissed.push(Math.max(0, framesMissed))
          }
        }

        let totalMissedFrames = perCameraMissed.length > 0
          ? Math.min(...perCameraMissed)
          : 0

        // Fall back to time-based detection if no frame info available
        if (perCameraMissed.length === 0 && timeSinceLastSeen > 100) {
          totalMissedFrames = Math.floor(timeSinceLastSeen / 100)  // Assume ~10fps
        }

        track.missedFrames = totalMissedFrames

        // Only transition to occluded after missing multiple consecutive frames
        if (track.missedFrames >= missedFrameThreshold) {
          track.state = 'occluded'
          track.occludedSince = track.lastSeen
          track.consecutiveDetections = 0  // Reset for hysteresis on recovery

          // Classify WHY the track disappeared (if geometry is available)
          if (this.siteMapGeometry) {
            const velocity = this.getTrackVelocity(track)
            const exitResult = classifyExitReason(
              track.currentPosition,
              velocity,
              this.siteMapGeometry.cameras,
              this.siteMapGeometry.obstacles,
              this.siteMapGeometry.roomBounds
            )
            track.exitReason = exitResult.reason

            // For pillar occlusions, set initial predicted position
            if (exitResult.reason === 'pillar_occlusion') {
              track.predictedPosition = exitResult.predictedExitPoint ?? track.currentPosition
            }
          }
        }
      }

      // Handle occluded tracks - check if they should expire
      if (track.state === 'occluded') {
        const timeSinceOcclusion = now - (track.occludedSince ?? track.lastSeen)

        // Get the appropriate timeout based on exit reason
        const effectiveTimeout = this.siteMapGeometry
          ? getTimeoutForExitReason(track.exitReason ?? 'timeout', this.config)
          : occlusionCoastTimeMs

        // Update predicted position for all occluded tracks (ghost track)
        if (track.isActive) {
          const predicted = this.getPredictedPosition(track, timeSinceOcclusion)
          if (predicted) {
            track.predictedPosition = predicted
            track.currentPosition = predicted
            // Notify listeners so frontend can update ghost track
            this.onTrackUpdated?.(track)
          }
        }

        if (timeSinceOcclusion > effectiveTimeout) {
          // Occlusion timeout exceeded, expire the track
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
          this.zoneManager?.clearTrackState(trackId)
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
        this.zoneManager?.clearTrackState(trackId)
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
    this.zoneManager?.resetAllStates()
    this.lastDetectionTimestamp = null
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

  /**
   * Set sitemap geometry for smart exit detection
   * This enables different timeout behaviors for FOV exits vs pillar occlusions
   */
  setSiteMapGeometry(
    cameras: CameraConfig[],
    obstacles: SiteMapObstacle[],
    roomBounds: RoomBounds
  ): void {
    this.siteMapGeometry = { cameras, obstacles, roomBounds }
    console.log(`[TrackManager] Exit detection enabled: ${cameras.length} cameras, ${obstacles.filter(o => o.blocksTracking).length} blocking obstacles, room ${roomBounds.width}x${roomBounds.height}m`)
  }

  /**
   * Set zone manager for restricted zone violation detection
   */
  setZoneManager(zoneManager: ZoneManager): void {
    this.zoneManager = zoneManager
    console.log(`[TrackManager] Zone manager connected`)
  }

  /**
   * Get velocity from Kalman filter state for a track
   */
  private getTrackVelocity(track: GlobalTrack): Point2D {
    const kalmanState = track.kalmanState
    if (kalmanState && kalmanState.mean.length >= 4) {
      return {
        x: kalmanState.mean[2][0],
        y: kalmanState.mean[3][0],
      }
    }
    return { x: 0, y: 0 }
  }

  /**
   * Get predicted position from Kalman filter
   */
  private getPredictedPosition(track: GlobalTrack, deltaMs: number): Point2D | undefined {
    const kalmanState = track.kalmanState
    if (!kalmanState) return undefined

    const predicted = this.kalmanFilter.predict(kalmanState, deltaMs)
    return predicted
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
    const now = this.lastDetectionTimestamp ?? this.clock()

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
   * Check if a position is too close to existing tracks to create a new track
   * (likely a duplicate detection in camera overlap zone)
   *
   * Uses different exclusion radii for confirmed vs unconfirmed tracks:
   * - Confirmed tracks: smaller radius (config.exclusionRadius)
   * - Unconfirmed tracks: larger radius (config.unconfirmedExclusionRadius)
   *
   * For unconfirmed tracks, only blocks if the detection is from a DIFFERENT camera.
   * Same-camera detections at close positions are different people (camera can't see same person twice).
   *
   * @param worldX - X coordinate to check
   * @param worldY - Y coordinate to check
   * @param cameraId - Optional camera ID of the detection (for same-camera check)
   */
  private isInExclusionZone(worldX: number, worldY: number, cameraId?: string): boolean {
    const confirmedExclusionRadius = this.config.exclusionRadius ?? 0.5
    const unconfirmedExclusionRadius = this.config.unconfirmedExclusionRadius ?? 0.7

    for (const track of this.tracks.values()) {
      if (!track.isActive) continue

      // For unconfirmed tracks, only apply exclusion for DIFFERENT cameras
      // Same camera seeing two things close together = two different people
      if (!track.isConfirmed && cameraId) {
        const trackCameras = Array.from(track.cameraAssociations.keys())
        const sameCamera = trackCameras.includes(cameraId)
        if (sameCamera) {
          // Same camera - don't block (they're different people)
          continue
        }
      }

      // Use appropriate radius based on track confirmation status
      const effectiveRadius = track.isConfirmed
        ? confirmedExclusionRadius
        : unconfirmedExclusionRadius

      const distance = calculateDistance(
        { x: worldX, y: worldY },
        track.currentPosition
      )
      if (distance < effectiveRadius) {
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
   * Pre-cluster cross-camera detections BEFORE Hungarian assignment.
   * This is the key to cross-camera correlation in overlap zones.
   *
   * When two cameras see the same person at the same timestamp, their
   * world-projected positions should be close. By clustering them first
   * and using the centroid for Hungarian assignment, we ensure BOTH
   * cameras' detections get assigned to the SAME track.
   *
   * Without this: camera1's detection matches track-A, camera2's matches track-B
   * With this: cluster centroid matches track-A, both cameras associate with track-A
   */
  private preClusterCrossCameraDetections(detections: CameraDetection[]): DetectionCluster[] {
    if (detections.length === 0) return []
    if (detections.length === 1) {
      return [{
        detections: [detections[0]],
        centroid: { x: detections[0].worldX, y: detections[0].worldY },
      }]
    }

    // Use moderate clustering distance for pre-clustering
    // Analysis: 0.5m = no clustering (same person can be 0.3-0.5m apart across cameras)
    //           0.9m = too aggressive (different people can be 0.51m apart)
    //           0.7m = compromise
    const clusteringDistance = this.config.clusteringDistanceM ?? 0.7

    // Build candidate cross-camera pairs under distance threshold
    const pairs: Array<{ i: number; j: number; dist: number }> = []
    for (let i = 0; i < detections.length; i++) {
      for (let j = i + 1; j < detections.length; j++) {
        if (detections[i].cameraId === detections[j].cameraId) continue
        const dist = calculateDistance(
          { x: detections[i].worldX, y: detections[i].worldY },
          { x: detections[j].worldX, y: detections[j].worldY }
        )
        if (dist < clusteringDistance) {
          pairs.push({ i, j, dist })
        }
      }
    }

    // Greedy matching on closest pairs, enforcing at most one detection per camera per cluster
    pairs.sort((a, b) => a.dist - b.dist || a.i - b.i || a.j - b.j)

    const clusters: DetectionCluster[] = []
    const detToCluster = new Map<number, number>() // detection index -> cluster index

    const clusterHasCamera = (cluster: DetectionCluster, cameraId: string): boolean =>
      cluster.detections.some(d => d.cameraId === cameraId)

    for (const { i, j } of pairs) {
      const ci = detToCluster.get(i)
      const cj = detToCluster.get(j)

      if (ci === undefined && cj === undefined) {
        const newClusterIdx = clusters.length
        clusters.push({
          detections: [detections[i], detections[j]],
          centroid: { x: 0, y: 0 },
        })
        detToCluster.set(i, newClusterIdx)
        detToCluster.set(j, newClusterIdx)
        continue
      }

      // Add unassigned detection to existing cluster if camera isn't already represented
      if (ci !== undefined && cj === undefined) {
        const cluster = clusters[ci]
        if (!clusterHasCamera(cluster, detections[j].cameraId)) {
          const centroid = mergeWorldPositions(cluster.detections).position
          const distToCentroid = calculateDistance(
            { x: detections[j].worldX, y: detections[j].worldY },
            centroid
          )
          if (distToCentroid < clusteringDistance) {
            cluster.detections.push(detections[j])
            detToCluster.set(j, ci)
          }
        }
        continue
      }

      if (ci === undefined && cj !== undefined) {
        const cluster = clusters[cj]
        if (!clusterHasCamera(cluster, detections[i].cameraId)) {
          const centroid = mergeWorldPositions(cluster.detections).position
          const distToCentroid = calculateDistance(
            { x: detections[i].worldX, y: detections[i].worldY },
            centroid
          )
          if (distToCentroid < clusteringDistance) {
            cluster.detections.push(detections[i])
            detToCluster.set(i, cj)
          }
        }
        continue
      }

      // Merge two clusters if they are disjoint in cameras and close
      if (ci !== undefined && cj !== undefined && ci !== cj) {
        const clusterA = clusters[ci]
        const clusterB = clusters[cj]
        if (clusterA.detections.length === 0 || clusterB.detections.length === 0) continue

        const camerasA = new Set(clusterA.detections.map(d => d.cameraId))
        const camerasB = new Set(clusterB.detections.map(d => d.cameraId))
        const hasDuplicateCamera = Array.from(camerasA).some(c => camerasB.has(c))
        if (hasDuplicateCamera) continue

        const centroidA = mergeWorldPositions(clusterA.detections).position
        const centroidB = mergeWorldPositions(clusterB.detections).position
        const centroidDist = calculateDistance(centroidA, centroidB)
        if (centroidDist < clusteringDistance) {
          clusterA.detections.push(...clusterB.detections)
          clusterB.detections = []
          // Re-point mappings
          for (const [detIdx, cIdx] of detToCluster) {
            if (cIdx === cj) detToCluster.set(detIdx, ci)
          }
        }
      }
    }

    // Add any detections that never paired as solo clusters
    for (let i = 0; i < detections.length; i++) {
      if (!detToCluster.has(i)) {
        clusters.push({
          detections: [detections[i]],
          centroid: { x: detections[i].worldX, y: detections[i].worldY },
        })
      }
    }

    // Finalize centroids
    const finalized = clusters.filter(c => c.detections.length > 0).map(cluster => {
      const merged = mergeWorldPositions(cluster.detections)
      return { detections: cluster.detections, centroid: merged.position }
    })

    return finalized
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

    // Extract video timing from the first detection with valid timing
    let videoTiming: VideoTimingInfo | undefined
    for (const det of cluster.detections) {
      videoTiming = this.extractVideoTiming(det)
      if (videoTiming) break
    }

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
      videoTiming,
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

    // Extract video timing if available
    const videoTiming = this.extractVideoTiming(detection)

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
      videoTiming,
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

  /**
   * Extract video timing info from a detection (if available)
   */
  private extractVideoTiming(detection: CameraDetection): VideoTimingInfo | undefined {
    if (detection.videoTimeMs === undefined || detection.frameNumber === undefined) {
      return undefined
    }
    return {
      videoTimeMs: detection.videoTimeMs,
      rtpTimestamp: detection.rtpTimestamp,
      frameNumber: detection.frameNumber,
      cameraId: detection.cameraId,
    }
  }

  private associateWithTrack(track: GlobalTrack, detection: CameraDetection): boolean {
    // Velocity sanity check
    const timeDelta = (detection.timestamp - track.lastSeen) / 1000
    if (timeDelta > 0.01) {
      const detPos = { x: detection.worldX, y: detection.worldY }

      let distance = calculateDistance(detPos, track.currentPosition)

      // Use predicted position for a fairer velocity estimate when possible.
      if (track.kalmanState) {
        const predictedPos = this.kalmanFilter.predict(
          track.kalmanState,
          detection.timestamp - track.lastSeen
        )
        const predictedDistance = calculateDistance(detPos, predictedPos)
        distance = Math.min(distance, predictedDistance)
      }

      const velocity = distance / timeDelta
      const baseMaxVelocity = this.config.maxVelocityMs
      const effectiveMaxVelocity = track.state === 'occluded'
        ? baseMaxVelocity * 1.5
        : baseMaxVelocity
      if (velocity > effectiveMaxVelocity) {
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

    // Update video timing for frontend sync
    const videoTiming = this.extractVideoTiming(detection)
    if (videoTiming) {
      track.videoTiming = videoTiming
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
    const previousPosition = track.currentPosition
    const previousKalmanTimestamp = track.kalmanState?.lastTimestamp ?? track.lastSeen

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

    // Clamp unrealistically large position jumps to reduce visible teleporting.
    const dtSec = (now - previousKalmanTimestamp) / 1000
    if (dtSec > 0) {
      const movedDistance = calculateDistance(merged.position, previousPosition)
      const maxStep = (this.config.maxVelocityMs * dtSec * 1.5) + 0.3
      if (movedDistance > maxStep) {
        const scale = maxStep / movedDistance
        merged.position = {
          x: previousPosition.x + (merged.position.x - previousPosition.x) * scale,
          y: previousPosition.y + (merged.position.y - previousPosition.y) * scale,
        }
      }
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

    // Check for zone violations if track is confirmed and zone manager is set
    if (this.zoneManager && track.isConfirmed) {
      const cameraIds = Array.from(track.cameraAssociations.keys())
      this.zoneManager.checkTrackPosition(
        track.globalTrackId,
        track.currentPosition,
        cameraIds,
        now
      )
    }

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
   *
   * Key architecture for cross-camera correlation:
   * 1. Pre-cluster detections from different cameras that are spatially close
   * 2. Use cluster centroid as a single "virtual detection" for Hungarian assignment
   * 3. This ensures same-person detections from multiple cameras match to ONE track
   */
  processBatchDetections(detections: CameraDetection[]): GlobalTrack[] {
    if (detections.length === 0) return []

    // Use detection timestamps as the primary time base for filtering and Kalman updates.
    // This keeps behavior consistent for both live (epoch) and replay (relative) streams.
    const nowFromDetections = detections.reduce((max, d) =>
      d.timestamp > max ? d.timestamp : max
    , -Infinity)
    const now = Number.isFinite(nowFromDetections)
      ? nowFromDetections
      : (this.lastDetectionTimestamp ?? this.clock())
    this.lastDetectionTimestamp = now
    const activeTracks = this.getAllActiveTracks()

    // === PRE-HUNGARIAN CLUSTERING ===
    // Cluster detections from different cameras that likely represent the same person.
    // Use cluster centroid for Hungarian assignment to ensure both cameras' detections
    // match to the SAME track instead of competing for different tracks.
    const preClusters = this.preClusterCrossCameraDetections(detections)

    // Create virtual detections from clusters (use centroid position)
    // Track mapping from virtual detection back to original cluster
    const virtualDetections: CameraDetection[] = []
    const clusterMap = new Map<number, DetectionCluster>()  // virtual index -> cluster

    for (let i = 0; i < preClusters.length; i++) {
      const cluster = preClusters[i]
      // Use the highest-confidence detection's metadata, but centroid position
      const primary = cluster.detections.reduce((a, b) =>
        a.confidence > b.confidence ? a : b
      )
      virtualDetections.push({
        cameraId: primary.cameraId,
        trackId: primary.trackId,
        worldX: cluster.centroid.x,
        worldY: cluster.centroid.y,
        confidence: Math.max(...cluster.detections.map(d => d.confidence)),
        timestamp: primary.timestamp,
        frameNumber: primary.frameNumber,
      })
      clusterMap.set(i, cluster)
    }

    // Use Hungarian algorithm for optimal assignment with virtual detections
    const { matches, unmatchedDetections, unmatchedTracks } = assignDetectionsToTracks(
      virtualDetections,
      activeTracks,
      {
        // Use tighter gating; cross-camera re-id handles longer handoffs.
        maxCost: this.config.correlationDistanceM * 1.2,
        useKalmanPrediction: true,
        associationBonus: 0.2,  // Stronger identity binding
        kalmanFilter: this.kalmanFilter,
      }
    )

    const results: GlobalTrack[] = []

    // Process matched pairs - associate ALL detections in cluster with matched track
    for (let i = 0; i < matches.length; i++) {
      const { detection: virtualDet, track } = matches[i]

      // Find original cluster index by matching virtual detection
      const clusterIdx = virtualDetections.findIndex(vd =>
        vd.worldX === virtualDet.worldX &&
        vd.worldY === virtualDet.worldY &&
        vd.cameraId === virtualDet.cameraId
      )
      const cluster = clusterIdx >= 0 ? clusterMap.get(clusterIdx) : null

      // Associate ALL detections in cluster with the track (not just virtual)
      const detectionsToAssociate = cluster ? cluster.detections : [virtualDet]
      let associationSuccess = false

      for (const det of detectionsToAssociate) {
        if (this.associateWithTrack(track, det)) {
          associationSuccess = true
        }
      }

      if (associationSuccess) {
        this.processPendingMerge(track, now)
        this.onTrackUpdated?.(track)
        if (!results.includes(track)) {
          results.push(track)
        }
      }
    }

    // Try re-identification for unmatched virtual detections with occluded tracks
    const occludedTracks = this.getAllTracks().filter(
      t => t.state === 'occluded' && t.isConfirmed
    )

    const finalUnmatchedClusters: DetectionCluster[] = []
    for (let i = 0; i < unmatchedDetections.length; i++) {
      const virtualDet = unmatchedDetections[i]
      // Find cluster index
      const clusterIdx = virtualDetections.findIndex(vd =>
        vd.worldX === virtualDet.worldX &&
        vd.worldY === virtualDet.worldY &&
        vd.cameraId === virtualDet.cameraId
      )
      const cluster = clusterIdx >= 0 ? clusterMap.get(clusterIdx) : null

      // Try re-id with the virtual detection first
      const reidentified = this.attemptReidentification(virtualDet, occludedTracks)
      if (reidentified) {
        // Restore track from occlusion
        reidentified.state = 'confirmed'
        reidentified.missedFrames = 0
        reidentified.occludedSince = undefined

        // Associate ALL detections in cluster
        const detectionsToAssociate = cluster ? cluster.detections : [virtualDet]
        for (const det of detectionsToAssociate) {
          this.associateWithTrack(reidentified, det)
        }
        this.processPendingMerge(reidentified, now)
        this.onTrackUpdated?.(reidentified)
        if (!results.includes(reidentified)) {
          results.push(reidentified)
        }
      } else {
        // Couldn't re-id - add to unmatched
        if (cluster) {
          finalUnmatchedClusters.push(cluster)
        } else {
          finalUnmatchedClusters.push({
            detections: [virtualDet],
            centroid: { x: virtualDet.worldX, y: virtualDet.worldY },
          })
        }
      }
    }

    // Create new tracks for truly unmatched clusters
    // (already pre-clustered, so no need to re-cluster)
    for (const cluster of finalUnmatchedClusters) {
      // Filter cluster detections by confidence
      const validDetections = cluster.detections.filter(det =>
        this.meetsCreationConfidence(det)
      )
      if (validDetections.length === 0) continue

      // Recalculate centroid with valid detections
      const merged = mergeWorldPositions(validDetections)
      const validCluster: DetectionCluster = {
        detections: validDetections,
        centroid: merged.position,
      }

      // Use centroid for exclusion zone check
      // For multi-camera clusters, don't pass cameraId (all cameras in cluster are relevant)
      const clusterCameraId = validCluster.detections.length === 1
        ? validCluster.detections[0].cameraId
        : undefined
      if (this.isInExclusionZone(validCluster.centroid.x, validCluster.centroid.y, clusterCameraId)) {
        continue
      }

      const newTrack = this.createGlobalTrackFromCluster(validCluster)
      this.onTrackCreated?.(newTrack)
      results.push(newTrack)
    }

    // Coast unmatched confirmed tracks using Kalman prediction to avoid brief disappearances
    this.coastUnmatchedTracks(unmatchedTracks, now)

    // Post-batch merge detection: Find and merge duplicate tracks
    // This catches duplicates that slipped through initial clustering
    this.detectAndMergeDuplicates()

    return results
  }

  /**
   * Coast unmatched confirmed tracks forward using Kalman prediction.
   * This keeps tracks from freezing/disappearing during brief dropouts and
   * reduces visible teleporting when detections resume.
   */
  private coastUnmatchedTracks(unmatchedTracks: GlobalTrack[], now: number): void {
    if (!unmatchedTracks || unmatchedTracks.length === 0) return

    const maxCoastMs = this.config.occlusionCoastTimeMs ?? 7000

    for (const track of unmatchedTracks) {
      if (!track.isActive || !track.isConfirmed) continue

      const dtMs = now - track.lastSeen
      if (dtMs <= 50 || dtMs > maxCoastMs) continue

      let predictedPos: Point2D | null = null
      if (track.kalmanState) {
        predictedPos = this.kalmanFilter.predict(track.kalmanState, dtMs)
      } else if (track.trail.length >= 2) {
        predictedPos = predictPosition(track.trail, dtMs)
      }

      if (!predictedPos) continue

      track.predictedPosition = predictedPos
      // Advance position for occluded tracks, and for very short gaps on confirmed tracks
      // to avoid flicker/teleport on the next detection.
      const shortGapMs = 500
      if (track.state === 'occluded' || (track.state === 'confirmed' && dtMs <= shortGapMs)) {
        track.currentPosition = predictedPos

        const lastTrailPos = track.trail[0]
        const movedDistance = lastTrailPos
          ? calculateDistance(predictedPos, lastTrailPos)
          : Infinity

        if (movedDistance > 0.1 || track.trail.length === 0) {
          track.trail.unshift({ x: predictedPos.x, y: predictedPos.y, timestamp: now })
          if (track.trail.length > this.config.maxTrailLength) {
            track.trail = track.trail.slice(0, this.config.maxTrailLength)
          }
        }

        this.onTrackUpdated?.(track)
      }
    }
  }

  /**
   * Detect and merge duplicate tracks that represent the same person
   * Includes unconfirmed tracks to catch duplicates early (cross-camera overlap)
   */
  private detectAndMergeDuplicates(): void {
    const activeTracks = this.getAllActiveTracks()
    // Include unconfirmed tracks to catch duplicates early in cross-camera overlap zones
    const candidates = this.trackMerger.findMergeCandidates(activeTracks, true)

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
    const maxReidAgeMs = this.config.occlusionCoastTimeMs ?? 7000

    let bestTrack: GlobalTrack | null = null
    let bestDistance = Infinity

    for (const track of occludedTracks) {
      if (!track.kalmanState) continue

      const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? track.lastSeen)
      if (timeSinceOcclusion < 0 || timeSinceOcclusion > maxReidAgeMs) continue

      const predicted = this.kalmanFilter.predict(track.kalmanState, timeSinceOcclusion)
      const distance = calculateDistance(
        { x: detection.worldX, y: detection.worldY },
        predicted
      )

      const assoc = track.cameraAssociations.get(detection.cameraId)
      const hasExactSameCameraId = assoc?.trackIds.includes(detection.trackId) ?? false

      // Tighten gate for weaker evidence:
      // - Exact same-camera trackId match: full gateMultiplier
      // - Same camera but different local trackId: smaller gate (local fragmentation case)
      // - Cross-camera re-id: medium gate (handoff case)
      let effectiveMultiplier = gateMultiplier
      if (assoc && !hasExactSameCameraId) {
        effectiveMultiplier = Math.min(gateMultiplier, 2.0)
      } else if (!assoc) {
        effectiveMultiplier = Math.min(gateMultiplier, 3.0)
      }

      const maxDistance = this.config.correlationDistanceM * effectiveMultiplier
      if (distance < maxDistance && distance < bestDistance) {
        bestDistance = distance
        bestTrack = track
      }
    }

    return bestTrack
  }
}
