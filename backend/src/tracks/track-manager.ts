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
  CameraImageDetection,
  TrackingConfig,
  TrailPosition,
  CameraTrackAssociation,
  Point2D,
  VideoTimingInfo,
  DetectionAttributes,
} from '../types.js'
import type { ZoneManager } from '../zones/zone-manager.js'
import { DEFAULT_TRACKING_CONFIG } from '../types.js'
import { AttributeAggregator, cosineSimilarity } from './attribute-aggregator.js'
import { calculateDistance, predictPosition, mergeWorldPositions } from '../correlation/track-matcher.js'
import {
  KalmanTrackFilter,
  estimateTrailCurvature,
  predictAlongCurve,
  blendPredictions,
} from '../filters/kalman-track-filter.js'
import { assignDetectionsToTracks, detectCrossingTracks } from '../correlation/hungarian-assignment.js'
import { TrackMerger } from './track-merger.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import {
  classifyExitReason,
  getQualityAdaptiveTimeout,
} from '../geometry/exit-detection.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import {
  calculateCombinedFOVPolygons,
  isPointInAnyFOV,
  clampPointToRoom,
  type CameraConfig,
  type RoomBounds,
} from '../geometry/fov-geometry.js'
import { getMetrics } from '../metrics/index.js'
// Extracted components
import { TrailManager } from './trail-manager.js'
import { FrameTracker } from './frame-tracker.js'
import { ExclusionZoneValidator } from './exclusion-zone-validator.js'
import { LocalTrackStitcher } from './local-track-stitcher.js'
import { EmbeddingArchive } from '../correlation/embedding-archive.js'

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

  const cameraDetections: Record<string, CameraImageDetection> = {}
  track.cameraDetections.forEach((value, key) => {
    cameraDetections[key] = value
  })

  return {
    globalTrackId: track.globalTrackId,
    cameraAssociations: associations,
    cameraDetections: Object.keys(cameraDetections).length > 0 ? cameraDetections : undefined,
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
    attributes: track.attributes,  // Include re-ID attributes
  }
}

export interface TrackManagerOptions {
  config?: Partial<TrackingConfig>
  clock?: () => number
  idGenerator?: () => string
  /**
   * Weight for embedding similarity in Hungarian assignment (0-1).
   * Default is 0.3 for re-ID enabled tracking.
   */
  embeddingWeight?: number
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
  /** Last detection timestamp processed (used to keep a consistent time base) */
  private lastDetectionTimestamp: number | null = null
  /** Per-track attribute aggregators for re-ID */
  private attributeAggregators: Map<string, AttributeAggregator> = new Map()
  /** Embedding weight for Hungarian assignment (default 0.3 for re-ID) */
  private embeddingWeight: number

  // Extracted components
  private trailManager: TrailManager
  private frameTracker: FrameTracker
  private exclusionValidator: ExclusionZoneValidator
  private localStitcher: LocalTrackStitcher
  private embeddingArchive: EmbeddingArchive

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
    // Embedding weight for re-ID similarity in Hungarian cost (default 0.3)
    this.embeddingWeight = options.embeddingWeight ?? 0.3
    // Create a new KalmanTrackFilter instance for each TrackManager
    // to avoid state cache pollution between tests or different managers
    this.kalmanFilter = new KalmanTrackFilter()
    // Create track merger with same Kalman filter
    this.trackMerger = new TrackMerger(this.kalmanFilter, {
      mergeDistanceM: this.config.mergeDistanceM,
      mergeConfidenceThreshold: this.config.mergeConfidenceThreshold,
    })

    // Initialize extracted components
    this.trailManager = new TrailManager({
      maxTrailLength: this.config.maxTrailLength,
      minMovementThreshold: 0.1,
    })
    this.frameTracker = new FrameTracker()
    this.exclusionValidator = new ExclusionZoneValidator(
      {
        confirmedExclusionRadius: this.config.exclusionRadius ?? 0.5,
        unconfirmedExclusionRadius: this.config.unconfirmedExclusionRadius ?? 0.7,
        crossCameraExclusionRadius: this.config.crossCameraExclusionRadius ?? 0.5,
        crossCameraExclusionTimeMs: this.config.crossCameraExclusionTimeMs ?? 200,
      },
      {
        recordExclusionZoneBlock: () => getMetrics().recordExclusionZoneBlock(),
        recordCrossCameraExclusionBlock: () => getMetrics().recordCrossCameraExclusionBlock(),
      }
    )
    this.localStitcher = new LocalTrackStitcher({
      maxGapMs: ALGORITHM_CONSTANTS.stitching.maxGapMs,  // Use algorithm constant (30s) for long-gap stitching
      maxDistanceMultiplier: ALGORITHM_CONSTANTS.stitching.maxDistanceMultiplier,
      correlationDistanceM: this.config.correlationDistanceM,
    })
    // Embedding archive for long-term re-identification across gaps of minutes
    this.embeddingArchive = new EmbeddingArchive({
      maxArchiveAgeMs: 10 * 60 * 1000, // 10 minutes
      minSimilarity: 0.80,
      minSampleCount: 1, // Archive even with single sample - we need all embeddings for long gaps
      minQualityToArchive: 0.01, // Match the threshold in findNearbyTrack
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
    confidence: number,
    attributes?: DetectionAttributes
  ): GlobalTrack {
    // For single detection processing, always use current clock time
    // (batch processing uses detection timestamps directly)
    const now = this.clock()
    this.lastDetectionTimestamp = now
    const detection: CameraDetection = {
      cameraId,
      trackId,
      worldX,
      worldY,
      confidence,
      timestamp: now,
      attributes,
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
      // IMPORTANT: For same camera+trackId, trust the local tracker's identity
      // Only reject if motion is truly impossible (catches tracker bugs/ID swaps)
      if (this.forceAssociateWithTrack(existingTrack, detection)) {
        this.processPendingMerge(existingTrack, now)
        this.onTrackUpdated?.(existingTrack)
        return existingTrack
      }
      // If forceAssociate failed (impossible motion), fall through to find nearby or create new
    }

    // Look for nearby track to correlate with
    const nearbyTrack = this.findNearbyTrack(worldX, worldY, cameraId, trackId, detection.attributes)
    if (nearbyTrack) {
      if (this.associateWithTrack(nearbyTrack, detection)) {
        this.processPendingMerge(nearbyTrack, now)
        this.onTrackUpdated?.(nearbyTrack)
        return nearbyTrack
      }
    }

    // Check embedding archive for long-term re-identification
    // This enables re-ID across gaps of minutes when tracks have been deleted
    if (detection.attributes?.embedding && detection.attributes.embedding.length > 0) {
      const activeTrackIds = new Set(
        Array.from(this.tracks.values())
          .filter(t => t.isActive)
          .map(t => t.globalTrackId)
      )
      const archiveMatch = this.embeddingArchive.findMatch(detection, now, activeTrackIds)
      if (archiveMatch.entry) {
        const detPos = { x: worldX, y: worldY }
        const archivePos = archiveMatch.entry.lastPosition
        const distanceToArchived = calculateDistance(detPos, archivePos)

        // Apply same-camera bonus: if the archived track was seen on this camera,
        // it's more likely to be the same person (local tracker fragmentation)
        const sameCameraMatch = archiveMatch.entry.cameraIds.includes(cameraId)

        // Adaptive threshold based on same-camera match
        // Same camera: lower threshold (0.68) since local tracker has continuity info
        // Cross camera: higher threshold (0.90) to avoid false positives
        const similarityThreshold = sameCameraMatch ? 0.68 : 0.90
        const maxDistance = sameCameraMatch ? 15.0 : 10.0 // More lenient for same camera

        if (archiveMatch.similarity >= similarityThreshold && distanceToArchived < maxDistance) {
          // Found a match in the archive - revive the old track identity
          const revivedTrack = this.reviveArchivedTrack(archiveMatch.entry, detection, now)
          if (revivedTrack) {
            // Remove from archive since it's now active again
            this.embeddingArchive.remove(archiveMatch.entry.globalTrackId)
            this.onTrackCreated?.(revivedTrack)
            return revivedTrack
          }
        }
      }
    }

    // No match found or velocity check failed, create new global track
    const newTrack = this.createGlobalTrack(detection)
    this.onTrackCreated?.(newTrack)
    return newTrack
  }

  /**
   * Revive an archived track with a new detection
   * This restores the original global track ID for consistent identity
   */
  private reviveArchivedTrack(
    archived: import('../correlation/embedding-archive.js').ArchivedEmbedding,
    detection: CameraDetection,
    _now: number // Wall clock time, detection.timestamp used for track timing
  ): GlobalTrack | null {
    // Re-use the original global track ID for consistent identity
    const globalTrackId = archived.globalTrackId
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
      cameraDetections: new Map(),
      currentPosition: { x: detection.worldX, y: detection.worldY },
      trail: [{ x: detection.worldX, y: detection.worldY, timestamp: detection.timestamp }],
      color,
      lastSeen: detection.timestamp,
      isActive: true,
      isConfirmed: false, // Start as unconfirmed until we get more detections
      detectionCount: 1,
      confidence: detection.confidence,
      pendingDetections: [detection],
      kalmanState,
      state: 'unconfirmed',
      missedFrames: 0,
      consecutiveDetections: 0,
      videoTiming,
      // Preserve archived embedding information
      attributes: {
        upper_clothing: { dominant_colors: [] },
        lower_clothing: { dominant_colors: [] },
        embedding: archived.embedding,
        embedding_quality: archived.quality,
        sample_count: archived.sampleCount,
      },
    }

    track.cameraAssociations.set(detection.cameraId, {
      cameraId: detection.cameraId,
      trackIds: [detection.trackId],
      lastSeen: detection.timestamp,
      lastFrameNumber: detection.frameNumber,
    })

    if (detection.bbox) {
      track.cameraDetections.set(detection.cameraId, {
        cameraId: detection.cameraId,
        bbox: detection.bbox,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        frameNumber: detection.frameNumber,
        videoTimeMs: detection.videoTimeMs,
      })
    }

    // Store track first so ensureCameraTrackExclusivity can find it
    this.tracks.set(globalTrackId, track)

    // Ensure exclusivity - remove this local ID from any other global track
    this.ensureCameraTrackExclusivity(track, detection.cameraId, detection.trackId)

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.frameTracker.updateFrame(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

    // Re-initialize attribute aggregator with archived embedding
    const aggregator = new AttributeAggregator()
    // Prime with archived embedding so new detections blend with it
    if (archived.embedding.length > 0) {
      aggregator.primeWithEmbedding(archived.embedding, archived.quality, archived.sampleCount)
    }
    this.attributeAggregators.set(globalTrackId, aggregator)

    // Aggregate current detection attributes
    if (detection.attributes) {
      this.aggregateDetectionAttributes(track, detection.attributes)
    }

    // Record metrics
    getMetrics().recordTrackCreated()

    return track
  }

  /**
   * Cleanup expired tracks with occlusion state handling
   */
  cleanupExpiredTracks(): void {
    // Use current clock time for expiry calculations
    const now = this.clock()
    const maxTracks = 200
    const unconfirmedExpiryMs = this.config.unconfirmedTrackExpiryMs ?? 2000
    const occlusionCoastTimeMs = this.config.occlusionCoastTimeMs ?? 2000
    // Early occlusion check window for unconfirmed tracks.
    // Purpose: if someone appears briefly and then immediately goes behind a pillar at video start,
    // we should transition to occluded/coast mode instead of waiting until unconfirmed expiry.
    const earlyUnconfirmedOcclusionMs = Math.min(800, Math.floor(unconfirmedExpiryMs * 0.5))

    // Clean up old ended local track entries
    this.localStitcher.cleanup(now)
    // Clean up old archived embeddings
    this.embeddingArchive.cleanup(now)

    for (const [trackId, track] of this.tracks.entries()) {
      const timeSinceLastSeen = now - track.lastSeen

      // Handle unconfirmed tracks - check for pillar occlusion before expiring
      if (track.state === 'unconfirmed') {
        // Early transition to occluded for likely pillar/partial occlusions.
        // This prevents "new track created after pillar" when the initial track is still unconfirmed.
        if (
          this.siteMapGeometry &&
          track.detectionCount >= 1 &&
          timeSinceLastSeen > earlyUnconfirmedOcclusionMs
        ) {
          const velocity = this.getTrackVelocity(track)
          const exitResult = classifyExitReason(
            track.currentPosition,
            velocity,
            this.siteMapGeometry.cameras,
            this.siteMapGeometry.obstacles,
            this.siteMapGeometry.roomBounds
          )

          if (exitResult.reason === 'pillar_occlusion' || exitResult.reason === 'partial_occlusion') {
            track.state = 'occluded'
            track.occludedSince = track.lastSeen
            track.exitReason = exitResult.reason
            if (exitResult.predictedExitPoint) {
              track.predictedPosition = exitResult.predictedExitPoint
            }
            getMetrics().recordOcclusionStart()
            continue
          }
        }

        if (timeSinceLastSeen > unconfirmedExpiryMs) {
          // Before deleting, check if track might be behind a pillar
          // This prevents losing tracks of people who enter and quickly go behind obstacles
          if (this.siteMapGeometry && track.detectionCount >= 1) {
            const velocity = this.getTrackVelocity(track)
            const exitResult = classifyExitReason(
              track.currentPosition,
              velocity,
              this.siteMapGeometry.cameras,
              this.siteMapGeometry.obstacles,
              this.siteMapGeometry.roomBounds
            )

            // If track disappeared near a pillar, transition to occluded instead of deleting
            // Also handle 'timeout' and 'partial_occlusion' reasons
            if (exitResult.reason === 'pillar_occlusion' ||
                exitResult.reason === 'partial_occlusion' ||
                exitResult.reason === 'timeout') {
              track.state = 'occluded'
              track.occludedSince = track.lastSeen
              track.exitReason = exitResult.reason

              // Set predicted position for pillar/partial occlusions
              if ((exitResult.reason === 'pillar_occlusion' || exitResult.reason === 'partial_occlusion')
                  && exitResult.predictedExitPoint) {
                track.predictedPosition = exitResult.predictedExitPoint
              }

              getMetrics().recordOcclusionStart()
              // Don't delete - let it coast and potentially be re-identified
              continue
            }
          }

          // Not near a pillar or no geometry - expire normally
          track.isActive = false
          this.releaseColor(track.color)
          // Archive embedding for long-term re-ID before expiring
          this.embeddingArchive.archiveTrack(track, now)
          this.onTrackExpired?.(track)  // Notify before deletion
          this.tracks.delete(trackId)
          this.kalmanFilter.removeTrackState(trackId)
          this.zoneManager?.clearTrackState(trackId)
          this.attributeAggregators.delete(trackId)
          continue
        }
      }

      // Handle confirmed tracks - transition to occluded state after missing multiple frames
      if (track.state === 'confirmed') {
        const missedFrameThreshold = this.config.missedFramesBeforeOcclusion ?? 5

        // Calculate missed frames based on actual camera frame numbers.
        // Use the *minimum* missed frames across cameras so a multi-camera track
        // does not become occluded while at least one camera still sees it.
        const cameraFrames = new Map<string, number | undefined>()
        for (const [cameraId, assoc] of track.cameraAssociations) {
          cameraFrames.set(cameraId, assoc.lastFrameNumber)
        }

        let totalMissedFrames = this.frameTracker.getMinMissedFramesAcrossCameras(cameraFrames) ?? 0

        // Fall back to time-based detection if no frame info available
        if (totalMissedFrames === 0 && timeSinceLastSeen > 100) {
          totalMissedFrames = this.frameTracker.estimateMissedFramesFromTime(timeSinceLastSeen)
        }

        track.missedFrames = totalMissedFrames

        // Only transition to occluded after missing multiple consecutive frames
        if (track.missedFrames >= missedFrameThreshold) {
          track.state = 'occluded'
          track.occludedSince = track.lastSeen
          track.consecutiveDetections = 0  // Reset for hysteresis on recovery
          getMetrics().recordOcclusionStart()

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

            // Aggressively dampen velocity on occlusion entry to prevent drift/bouncing
            // FOV/boundary exits: zero velocity (person left monitored area)
            // Pillar occlusion: 50% reduction (person still in area but hidden)
            if (track.kalmanState) {
              if (exitResult.reason === 'fov_exit' || exitResult.reason === 'boundary_exit') {
                // Zero velocity - person left the area, no coasting needed
                track.kalmanState.mean[2][0] = 0
                track.kalmanState.mean[3][0] = 0
              } else if (exitResult.reason === 'pillar_occlusion' || exitResult.reason === 'partial_occlusion') {
                // Reduce velocity by 50% upfront - person hidden but still moving
                track.kalmanState.mean[2][0] *= 0.5
                track.kalmanState.mean[3][0] *= 0.5
              }
            }
          }
        }
      }

      // Handle occluded tracks - check if they should expire
      if (track.state === 'occluded') {
        const timeSinceOcclusion = now - (track.occludedSince ?? track.lastSeen)

        // Get the appropriate timeout based on exit reason AND embedding quality
        // Higher quality embeddings get longer timeouts since they're more likely to re-ID
        const embeddingQuality = track.attributes?.embedding_quality ?? 0
        const effectiveTimeout = this.siteMapGeometry
          ? getQualityAdaptiveTimeout(track.exitReason ?? 'timeout', embeddingQuality, this.config)
          : occlusionCoastTimeMs

        // Update predicted position for pillar/partial occlusions (ghost tracks).
        // For FOV/boundary exits, don't update position - track should freeze at last known location.
        // This prevents "bouncing" at edges when Kalman prediction drifts beyond boundaries.
        if (track.isActive && (track.exitReason === 'pillar_occlusion' || track.exitReason === 'partial_occlusion')) {
          const predicted = this.getPredictedPosition(track, timeSinceOcclusion)
          if (predicted) {
            let clampedPos = predicted

            // CRITICAL: Clamp pillar coasting to room bounds - prevents wall sliding
            const roomBounds = this.siteMapGeometry?.roomBounds
            if (roomBounds) {
              const clampResult = clampPointToRoom(predicted, roomBounds, 0.1)
              clampedPos = clampResult.point

              // IMPORTANT: Do NOT convert pillar occlusions into boundary_exit on clamp.
              // Near-edge noise can temporarily clamp positions; converting would shorten the
              // timeout dramatically and cause premature disappearance near the top-right.
              if (track.kalmanState) {
                track.kalmanState.mean[0][0] = clampResult.point.x
                track.kalmanState.mean[1][0] = clampResult.point.y
                // Also zero velocity into clamped axes to prevent edge “bounce”.
                if (clampResult.clampedX) track.kalmanState.mean[2][0] = 0
                if (clampResult.clampedY) track.kalmanState.mean[3][0] = 0
              }
            }

            track.predictedPosition = clampedPos
            track.currentPosition = clampedPos
            // Notify listeners so frontend can update ghost track
            this.onTrackUpdated?.(track)
          }
        }

        if (timeSinceOcclusion > effectiveTimeout) {
          // Occlusion timeout exceeded, expire the track
          if (track.isActive) {
            // Record ended local tracks for potential stitching
            this.localStitcher.recordEndedTracksFromGlobalTrack(track, now)

            track.isActive = false
            this.releaseColor(track.color)
            // Archive embedding for long-term re-ID before expiring
            this.embeddingArchive.archiveTrack(track, now)
            // Record expiry metrics
            const creationTime = track.trail[0]?.timestamp ?? track.lastSeen
            getMetrics().recordTrackExpired(now - creationTime, track.isConfirmed)
            getMetrics().recordOcclusionEnd(timeSinceOcclusion, false)
            this.onTrackExpired?.(track)
          }
        }
      }

      // Full track expiry
      if (timeSinceLastSeen > this.config.trackExpiryMs) {
        if (track.isActive) {
          // Record ended local tracks for potential stitching
          this.localStitcher.recordEndedTracksFromGlobalTrack(track, now)

          track.isActive = false
          this.releaseColor(track.color)
          // Archive embedding for long-term re-ID before expiring
          this.embeddingArchive.archiveTrack(track, now)
          // Record expiry metrics
          const creationTime = track.trail[0]?.timestamp ?? track.lastSeen
          getMetrics().recordTrackExpired(now - creationTime, track.isConfirmed)
          this.onTrackExpired?.(track)
        }

        // Remove completely after 5x expiry time (keep for re-ID longer)
        if (timeSinceLastSeen > this.config.trackExpiryMs * 5) {
          this.tracks.delete(trackId)
          this.kalmanFilter.removeTrackState(trackId)
          this.zoneManager?.clearTrackState(trackId)
          this.attributeAggregators.delete(trackId)
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
        this.attributeAggregators.delete(trackId)
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
    this.attributeAggregators.clear()
    // Clear extracted component states
    this.trailManager.clearAllTrails()
    this.frameTracker.clearAll()
    this.localStitcher.clearAll()
    this.embeddingArchive.clear()
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
   * Aggregate detection attributes into track-level attributes
   * Called when a detection with attributes is associated with a track
   */
  private aggregateDetectionAttributes(track: GlobalTrack, attributes: DetectionAttributes): void {
    // Get or create aggregator for this track
    let aggregator = this.attributeAggregators.get(track.globalTrackId)
    if (!aggregator) {
      aggregator = new AttributeAggregator()
      this.attributeAggregators.set(track.globalTrackId, aggregator)
    }

    // Record metrics for detections with embeddings
    if (attributes.embedding && attributes.embedding.length > 0) {
      const quality = attributes.embedding_quality ?? 0.5
      getMetrics().recordDetectionWithEmbedding(quality)
    }

    // Add detection attributes to aggregator
    aggregator.addDetection(attributes)

    // Update track with aggregated attributes
    if (aggregator.hasData()) {
      track.attributes = aggregator.getAggregatedAttributes()
    }
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
   * Ensure a camera-local track ID is only associated with ONE global track.
   * If another global track has this camera-local ID in its associations,
   * remove it from that track to prevent FP from duplicate associations.
   *
   * This is critical for reducing FP in MOT metrics - when the same person
   * is tracked by multiple global tracks, each extra track counts as FP.
   */
  private ensureCameraTrackExclusivity(
    targetTrack: GlobalTrack,
    cameraId: string,
    localTrackId: number
  ): void {
    for (const track of this.tracks.values()) {
      if (track.globalTrackId === targetTrack.globalTrackId) continue
      if (!track.isActive) continue

      const assoc = track.cameraAssociations.get(cameraId)
      if (assoc && assoc.trackIds.includes(localTrackId)) {
        // Remove this local ID from the other track
        assoc.trackIds = assoc.trackIds.filter(id => id !== localTrackId)

        // If no more track IDs for this camera, remove the camera association
        if (assoc.trackIds.length === 0) {
          track.cameraAssociations.delete(cameraId)
        }
      }
    }
  }

  /**
   * Find a nearby active track within correlation distance
   * Uses Kalman filter prediction for better accuracy
   *
   * Same-camera re-identification: When a new local track ID appears from the
   * same camera, we should strongly prefer re-associating with existing tracks
   * from that camera (local tracker fragmentation is common).
   */
  findNearbyTrack(
    worldX: number,
    worldY: number,
    excludeCameraId?: string,
    excludeTrackId?: number,
    attributes?: DetectionAttributes
  ): GlobalTrack | null {
    let bestMatch: GlobalTrack | null = null
    let bestScore = Infinity  // Lower is better (distance-based)
    const now = this.lastDetectionTimestamp ?? this.clock()

    // Get detection embedding and quality for similarity checking
    const detectionEmbedding = attributes?.embedding
    const detectionEmbeddingQuality = attributes?.embedding_quality ?? 0

    // Maximum time to consider reviving an inactive track (for re-ID)
    // Use a longer window for same-camera detections at very close positions
    const maxRevivalTimeMs = 5000  // 5 seconds (base)
    const extendedRevivalTimeMs = 60000  // 60 seconds for same-camera + close position

    for (const track of this.tracks.values()) {
      // Allow recently-inactive tracks to be considered for revival
      const timeSinceLastSeen = now - track.lastSeen

      // Check if this is a same-camera detection - extend revival window for same-camera matches
      // Local tracker fragmentation is common, so be more lenient about reviving tracks from same camera
      let useExtendedWindow = false
      if (excludeCameraId && !track.isActive && timeSinceLastSeen >= maxRevivalTimeMs) {
        const assoc = track.cameraAssociations.get(excludeCameraId)
        if (assoc) {
          // Same camera - extend window more generously
          const detPos = { x: worldX, y: worldY }
          const distance = calculateDistance(detPos, track.currentPosition)
          if (distance < 0.5) {  // Very close position
            useExtendedWindow = true
          }
          // Also extend window for tracks with fragmentation pattern (multiple IDs from same camera)
          if (assoc.trackIds.length >= 2 && distance < 2.0) {
            useExtendedWindow = true
          }
          // Extend window for any same-camera association if within reasonable distance
          // This catches the case where global-4 has camera1:[6] and camera1-18 appears
          if (distance < 4.0 && timeSinceLastSeen < 10000) {
            useExtendedWindow = true
          }
        }
      }

      const effectiveMaxRevival = useExtendedWindow ? extendedRevivalTimeMs : maxRevivalTimeMs
      const canRevive = !track.isActive && timeSinceLastSeen < effectiveMaxRevival

      if (!track.isActive && !canRevive) continue

      // Check if this track is already associated with this camera+trackId
      if (excludeCameraId && excludeTrackId !== undefined) {
        const assoc = track.cameraAssociations.get(excludeCameraId)
        if (assoc && assoc.trackIds.includes(excludeTrackId)) {
          return track
        }
      }

      const timeSinceUpdate = now - track.lastSeen

      // Use Kalman filter prediction if available, fall back to linear prediction
      // Cap prediction time to avoid unreliable long-term extrapolation
      const maxPredictionTimeMs = 2000  // Don't trust predictions beyond 2 seconds
      const effectivePredictionTime = Math.min(timeSinceUpdate, maxPredictionTimeMs)
      let predictedPosition = track.currentPosition
      if (track.kalmanState && timeSinceUpdate > 50) {
        // Use Kalman prediction with capped time
        predictedPosition = this.kalmanFilter.predict(track.kalmanState, effectivePredictionTime)
      } else if (track.trail.length >= 2 && timeSinceUpdate > 50) {
        // Fall back to legacy linear prediction with capped time
        const predicted = predictPosition(track.trail, effectivePredictionTime)
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

      // Same-camera re-identification bonus: When a detection comes from a camera
      // that already has an association with this track (but with a different local ID),
      // it's likely local tracker fragmentation. Give moderate preference.
      // But be more conservative for occluded tracks to avoid stealing another person's identity.
      let sameCameraBonus = 0
      if (excludeCameraId) {
        const assoc = track.cameraAssociations.get(excludeCameraId)
        // For confirmed (non-occluded) tracks, use a short window
        // For occluded tracks, be MORE conservative - require very close proximity
        // This prevents detecting a different person at a similar position
        if (assoc && track.state !== 'occluded' && timeSinceUpdate < 1000) {
          // Active track - likely fragmentation
          threshold = Math.max(threshold * 1.3, 1.0)
          sameCameraBonus = 0.3
        } else if (assoc && track.state === 'occluded' && timeSinceUpdate < 5000) {
          // For occluded tracks, check if Kalman prediction has drifted too far
          // from the last known position. Excessive drift means the prediction is
          // unreliable and we should NOT give same-camera bonus.
          const kalmanDrift = distanceToPredicted < distanceToCurrent
            ? distanceToCurrent - distanceToPredicted
            : 0
          const maxReliableDrift = 1.5  // More than 1.5m drift = unreliable prediction

          if (kalmanDrift < maxReliableDrift && distance < 0.8) {
            // Kalman prediction is reasonable and detection is close
            threshold = Math.max(threshold * 1.3, 1.0)
            sameCameraBonus = 0.2  // Smaller bonus for occluded
          }
          // else: excessive drift - no bonus, let distance alone decide
        }
      }

      // Expand gating for occluded tracks to allow re-association
      if (track.state === 'occluded') {
        const occlusionCoastTimeMs = this.config.occlusionCoastTimeMs ?? 2000
        const timeSinceOcclusion = now - (track.occludedSince ?? now)
        // Gradually expand gate up to 2x based on occlusion duration
        // For same-camera re-acquisition, allow even wider gate (up to 2.5x)
        const isSameCamera = excludeCameraId && track.cameraAssociations.has(excludeCameraId)
        const maxExpansion = isSameCamera ? 2.5 : 2.0
        const expansionFactor = Math.min(maxExpansion, 1.0 + timeSinceOcclusion / occlusionCoastTimeMs)
        threshold *= expansionFactor
      }

      if (distance < threshold) {
        // Calculate embedding similarity if available AND quality is sufficient
        // Low-quality embeddings (< 0.1) are unreliable and shouldn't be used for matching decisions
        let embeddingSimilarity = -1  // -1 means no embedding comparison possible
        const trackEmbedding = track.attributes?.embedding
        const trackEmbeddingQuality = track.attributes?.embedding_quality ?? 0
        // Use very low quality threshold since preprocessor outputs 0.02 for all detections
        const minQualityForMatching = 0.01
        if (detectionEmbedding && trackEmbedding &&
            detectionEmbedding.length > 0 && trackEmbedding.length === detectionEmbedding.length &&
            detectionEmbeddingQuality >= minQualityForMatching && trackEmbeddingQuality >= minQualityForMatching) {
          embeddingSimilarity = cosineSimilarity(detectionEmbedding, trackEmbedding)
        }

        // If embeddings are available and clearly mismatch, skip this track entirely
        // This prevents stealing another person's identity based on spatial proximity alone
        // Use moderate threshold (0.65) - balance between preventing false merges and
        // allowing same-person matching during appearance changes
        if (embeddingSimilarity >= 0 && embeddingSimilarity < 0.65) {
          continue  // Embedding mismatch - don't consider this track
        }

        // When track already has associations from this camera AND detection has an embedding,
        // but the track doesn't have an embedding yet, be more conservative.
        // This prevents a new person from being absorbed by a track that just started.
        if (excludeCameraId && detectionEmbedding && detectionEmbedding.length > 0) {
          const assoc = track.cameraAssociations.get(excludeCameraId)
          if (assoc && embeddingSimilarity < 0) {
            // Track has association from this camera but no embedding comparison possible
            // Require very close spatial proximity (0.5m) to allow association
            if (distance > 0.5) {
              continue  // Too far without embedding confirmation
            }
          }
        }

        // Check for same-camera association
        // When a track already has an association from this camera, it's a strong
        // candidate for absorbing new trackIds from the same camera (fragmentation)
        // BUT only if embeddings are similar enough - otherwise it might be a different person
        let sameCameraAssocBonus = 1.0
        if (excludeCameraId) {
          const assoc = track.cameraAssociations.get(excludeCameraId)
          if (assoc) {
            // Track has at least one ID from this camera
            // Only apply fragmentation bonus if embeddings match well
            const embeddingsCompatible = embeddingSimilarity >= 0.65
            // If no embeddings to compare, don't apply bonus (be conservative)
            if (embeddingsCompatible) {
              // This is a strong signal for fragmentation - apply significant bonus
              sameCameraAssocBonus = 0.3
              if (assoc.trackIds.length >= 2) {
                // Track has 2+ IDs from this camera - even stronger fragmentation pattern
                sameCameraAssocBonus = 0.15
              }
            }
            // else: embeddings clearly different - no same-camera bonus
          }
        }

        // Calculate score (lower is better)
        // Apply embedding bonus more conservatively - embeddings can be noisy
        let effectiveDistance = distance * (1 - sameCameraBonus)
        if (embeddingSimilarity >= 0.85) {
          // Very high embedding similarity - moderate preference
          effectiveDistance *= 0.7
        } else if (embeddingSimilarity >= 0.7) {
          // Good embedding similarity - slight preference
          effectiveDistance *= 0.85
        }
        // Below 0.7: no embedding bonus (but not penalized unless <0.5)

        // Apply same-camera association bonus (strong when applicable)
        effectiveDistance *= sameCameraAssocBonus

        if (effectiveDistance < bestScore) {
          bestScore = effectiveDistance
          bestMatch = track
        }
      }
    }

    return bestMatch
  }

  /**
   * Check if a detection meets minimum confidence for track creation
   */
  private meetsCreationConfidence(detection: CameraDetection): boolean {
    const minConfidence = this.config.minCreationConfidence ?? 0.7
    if (detection.confidence >= minConfidence) return true

    // Table-occluded people are often legitimately detected at slightly lower confidence
    // (only upper body visible). If the local tracker has assigned a real ID, allow a
    // small relaxation so the second person behind a table can spawn a track at startup.
    if (detection.isTableOccluded && detection.trackId !== 0) {
      const relaxed = Math.max(0.55, minConfidence - 0.15)
      return detection.confidence >= relaxed
    }

    return false
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
  private preClusterCrossCameraDetections(
    detections: CameraDetection[],
    hasAnyCrossings: boolean = false
  ): DetectionCluster[] {
    if (detections.length === 0) return []
    if (detections.length === 1) {
      return [{
        detections: [detections[0]],
        centroid: { x: detections[0].worldX, y: detections[0].worldY },
      }]
    }

    // Use clustering distance from ALGORITHM_CONSTANTS for pre-clustering
    // This allows same-person detections from different cameras to be clustered
    // accounting for projection error between cameras (0.3-0.4m per camera)
    // During crossings: use tighter 0.5m to avoid merging different people's detections
    const baseClusteringDistance = ALGORITHM_CONSTANTS.clustering.clusteringDistanceM  // 1.2m
    const clusteringDistance = hasAnyCrossings ? 0.5 : baseClusteringDistance

    // Build candidate cross-camera pairs under distance threshold
    // ALSO require embedding similarity for cross-camera clustering
    const pairs: Array<{ i: number; j: number; dist: number; similarity: number }> = []
    for (let i = 0; i < detections.length; i++) {
      for (let j = i + 1; j < detections.length; j++) {
        if (detections[i].cameraId === detections[j].cameraId) continue
        const dist = calculateDistance(
          { x: detections[i].worldX, y: detections[i].worldY },
          { x: detections[j].worldX, y: detections[j].worldY }
        )
        if (dist < clusteringDistance) {
          // Check embedding similarity before clustering
          const emb1 = detections[i].attributes?.embedding
          const emb2 = detections[j].attributes?.embedding
          let similarity = 0.5 // Default neutral if no embeddings

          if (emb1 && emb2 && emb1.length > 0 && emb1.length === emb2.length) {
            // Compute cosine similarity inline
            let dot = 0, norm1 = 0, norm2 = 0
            for (let k = 0; k < emb1.length; k++) {
              dot += emb1[k] * emb2[k]
              norm1 += emb1[k] * emb1[k]
              norm2 += emb2[k] * emb2[k]
            }
            similarity = norm1 > 0 && norm2 > 0 ? dot / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0
          }

          // Only cluster if embedding similarity is good enough
          // This prevents different people from being pre-clustered together
          if (similarity > 0.45) {
            pairs.push({ i, j, dist, similarity })
          }
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

    // Record clustering metrics
    for (const cluster of finalized) {
      // Calculate max internal distance for multi-detection clusters
      let maxInternalDistance = 0
      if (cluster.detections.length > 1) {
        for (let i = 0; i < cluster.detections.length; i++) {
          for (let j = i + 1; j < cluster.detections.length; j++) {
            const dist = calculateDistance(
              { x: cluster.detections[i].worldX, y: cluster.detections[i].worldY },
              { x: cluster.detections[j].worldX, y: cluster.detections[j].worldY }
            )
            maxInternalDistance = Math.max(maxInternalDistance, dist)
          }
        }
      }
      getMetrics().recordCluster(cluster.detections.length, maxInternalDistance)
    }

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
      cameraDetections: new Map(),
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
      // Ensure exclusivity - remove this local ID from any other global track
      this.ensureCameraTrackExclusivity(track, det.cameraId, det.trackId)

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
        this.frameTracker.updateFrame(det.cameraId, det.frameNumber, det.timestamp)
      }

      if (det.bbox) {
        track.cameraDetections.set(det.cameraId, {
          cameraId: det.cameraId,
          bbox: det.bbox,
          confidence: det.confidence,
          timestamp: det.timestamp,
          frameNumber: det.frameNumber,
          videoTimeMs: det.videoTimeMs,
        })
      }
    }

    // Confirm immediately if seen by multiple cameras
    if (cluster.detections.length >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
    }

    this.tracks.set(globalTrackId, track)

    // Aggregate attributes from all detections in cluster
    for (const det of cluster.detections) {
      if (det.attributes) {
        this.aggregateDetectionAttributes(track, det.attributes)
      }
    }

    // Record metrics
    getMetrics().recordTrackCreated()

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
      cameraDetections: new Map(),
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

    if (detection.bbox) {
      track.cameraDetections.set(detection.cameraId, {
        cameraId: detection.cameraId,
        bbox: detection.bbox,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        frameNumber: detection.frameNumber,
        videoTimeMs: detection.videoTimeMs,
      })
    }

    // Store track first so ensureCameraTrackExclusivity can find it
    this.tracks.set(globalTrackId, track)

    // Ensure exclusivity - remove this local ID from any other global track
    this.ensureCameraTrackExclusivity(track, detection.cameraId, detection.trackId)

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.frameTracker.updateFrame(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

    // Aggregate attributes if present
    if (detection.attributes) {
      this.aggregateDetectionAttributes(track, detection.attributes)
    }

    // Record metrics
    getMetrics().recordTrackCreated()

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

  /**
   * Force association with track, trusting local tracker identity.
   * For same camera+trackId, we trust the local tracker with a very generous
   * velocity threshold. Only reject truly impossible motions (>50 m/s).
   *
   * Note: We use a very high threshold because:
   * 1. Kalman-filtered positions can lag significantly behind actual positions
   * 2. The local tracker (YOLOv8) has better continuity information
   * 3. Position jumps are usually projection errors, not different people
   * 4. Only reject motions that are clearly impossible (>50 m/s = 180 km/h)
   */
  private forceAssociateWithTrack(track: GlobalTrack, detection: CameraDetection): boolean {
    // Only reject truly impossible motions (>50 m/s = 180 km/h)
    // This catches tracker bugs/ID swaps while allowing projection jitter
    const timeDelta = (detection.timestamp - track.lastSeen) / 1000
    if (timeDelta > 0.05) {  // Only check if time delta is meaningful (>50ms)
      const detPos = { x: detection.worldX, y: detection.worldY }
      const distance = calculateDistance(detPos, track.currentPosition)
      const velocity = distance / timeDelta
      if (velocity > 50) {  // 50 m/s = 180 km/h - clearly impossible for humans
        return false
      }
    }

    // Ensure exclusivity - remove this local ID from any other global track
    this.ensureCameraTrackExclusivity(track, detection.cameraId, detection.trackId)

    // Update camera association
    let assoc = track.cameraAssociations.get(detection.cameraId)
    if (assoc) {
      if (!assoc.trackIds.includes(detection.trackId)) {
        assoc.trackIds.push(detection.trackId)
      }
      assoc.lastSeen = detection.timestamp
      if (detection.frameNumber !== undefined) {
        assoc.lastFrameNumber = detection.frameNumber
      }
    }

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.frameTracker.updateFrame(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

    // Update video timing
    const videoTiming = this.extractVideoTiming(detection)
    if (videoTiming) {
      track.videoTiming = videoTiming
    }

    // Aggregate detection attributes for re-ID
    if (detection.attributes) {
      this.aggregateDetectionAttributes(track, detection.attributes)
    }

    track.detectionCount++
    track.missedFrames = 0

    // Transition state on confirmation
    if (!track.isConfirmed && track.detectionCount >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
      const creationTime = track.trail[0]?.timestamp ?? track.lastSeen
      getMetrics().recordTrackConfirmed(detection.timestamp - creationTime)
    }

    // Recover from occlusion with hysteresis (flicker protection)
    if (track.state === 'occluded') {
      let detectionsRequired = this.config.detectionsToExitOcclusion ?? 2
      let minRecoveryTimeMs = this.config.minRecoveryTimeMs ?? 300
      const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? detection.timestamp)

      // Fast recovery for pillar/partial occlusions when reacquisition is high-confidence.
      // This prevents tracks staying as ghosts for ~1s after the person is clearly visible again.
      const isPillarOrPartial =
        track.exitReason === 'pillar_occlusion' || track.exitReason === 'partial_occlusion'
      const assoc = track.cameraAssociations.get(detection.cameraId)
      const isExactLocal = assoc?.trackIds.includes(detection.trackId) ?? false
      let isStrongEmbeddingMatch = false
      const detEmb = detection.attributes?.embedding
      const trEmb = track.attributes?.embedding
      const detQ = detection.attributes?.embedding_quality ?? 0
      const trQ = track.attributes?.embedding_quality ?? 0
      if (detEmb && trEmb && detEmb.length > 0 && trEmb.length === detEmb.length && detQ >= 0.15 && trQ >= 0.15) {
        isStrongEmbeddingMatch = cosineSimilarity(detEmb, trEmb) >= 0.7
      }
      if (isPillarOrPartial && (isExactLocal || isStrongEmbeddingMatch)) {
        detectionsRequired = 1
        minRecoveryTimeMs = 0
      }

      track.consecutiveDetections++

      // Only exit occlusion after multiple detections AND minimum time has passed
      // This prevents flicker when person briefly visible between pillars
      if (track.consecutiveDetections >= detectionsRequired && timeSinceOcclusion >= minRecoveryTimeMs) {
        track.state = 'confirmed'
        const occlusionDuration = track.occludedSince ? detection.timestamp - track.occludedSince : 0
        getMetrics().recordOcclusionEnd(occlusionDuration, true)
        track.occludedSince = undefined
        track.consecutiveDetections = 0
      }
    } else {
      track.consecutiveDetections = 0
    }

    track.pendingDetections.push(detection)
    if (track.pendingDetections.length > 50) {
      track.pendingDetections = track.pendingDetections.slice(-20)
    }
    if (detection.bbox) {
      track.cameraDetections.set(detection.cameraId, {
        cameraId: detection.cameraId,
        bbox: detection.bbox,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        frameNumber: detection.frameNumber,
        videoTimeMs: detection.videoTimeMs,
      })
    }
    track.lastSeen = detection.timestamp
    return true
  }

  private associateWithTrack(track: GlobalTrack, detection: CameraDetection): boolean {
    // Revive inactive tracks if they are being re-identified
    if (!track.isActive) {
      // Check if this is a valid revival (same-camera re-ID with close position)
      const assoc = track.cameraAssociations.get(detection.cameraId)
      if (assoc) {
        // Same camera had this track before - likely local tracker fragmentation
        track.isActive = true
        track.state = 'confirmed'  // Revive as confirmed since it was previously confirmed
        track.color = this.assignColor()  // Reassign a color
        getMetrics().recordTrackCreated()  // Count as a revival
      } else {
        // Cross-camera revival requires stricter matching - only revive if very close
        const detPos = { x: detection.worldX, y: detection.worldY }
        const distance = calculateDistance(detPos, track.currentPosition)
        if (distance > 1.0) {
          return false  // Too far for cross-camera revival
        }
        track.isActive = true
        track.state = 'confirmed'
        track.color = this.assignColor()
        getMetrics().recordTrackCreated()
      }
    }

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

      // Mahalanobis distance validation for established tracks
      // Reject detections that are kinematically implausible even if geometrically close
      if (track.kalmanState && track.isConfirmed && track.detectionCount >= 3) {
        const detPos = { x: detection.worldX, y: detection.worldY }
        const mahalanobis = this.kalmanFilter.getMahalanobisDistance(track.kalmanState, detPos)

        // Relax threshold for same-camera re-identification (likely fragmentation)
        // Extended window for occluded tracks since they may have been invisible for longer
        const assoc = track.cameraAssociations.get(detection.cameraId)
        const sameCameraWindow = track.state === 'occluded' ? 6.0 : 2.0
        const isSameCameraReId = assoc && !assoc.trackIds.includes(detection.trackId) &&
          timeDelta < sameCameraWindow
        const mahalanobisThreshold = isSameCameraReId ? 8.0 : 4.0  // Increased threshold for same-camera

        if (mahalanobis > mahalanobisThreshold) {
          return false
        }
      }
    }

    // Ensure exclusivity - remove this local ID from any other global track
    this.ensureCameraTrackExclusivity(track, detection.cameraId, detection.trackId)

    // Update or add camera association
    let assoc = track.cameraAssociations.get(detection.cameraId)
    if (assoc) {
      if (!assoc.trackIds.includes(detection.trackId)) {
        // Adding a NEW trackId from same camera - this is HIGH RISK for false merges
        // Different people often walk through the same area sequentially
        // Require VERY high embedding similarity (0.80) to allow this
        const detEmbedding = detection.attributes?.embedding
        const trackEmbedding = track.attributes?.embedding
        if (detEmbedding && trackEmbedding &&
            detEmbedding.length > 0 && detEmbedding.length === trackEmbedding.length) {
          const similarity = cosineSimilarity(detEmbedding, trackEmbedding)
          if (similarity < 0.80) {
            // Not clearly the same person - reject this association
            // This prevents tracks from absorbing different people over time
            return false
          }
        } else {
          // No embeddings to compare - don't allow absorbing new trackId
          // This prevents false merges when embeddings aren't available
          return false
        }
        assoc.trackIds.push(detection.trackId)
      }
      assoc.lastSeen = detection.timestamp
      if (detection.frameNumber !== undefined) {
        assoc.lastFrameNumber = detection.frameNumber
      }
    } else {
      // This is a cross-camera handoff - track is being seen by a new camera
      // Validate with embedding similarity to prevent cross-camera false merges
      const detEmbedding = detection.attributes?.embedding
      const trackEmbedding = track.attributes?.embedding
      if (detEmbedding && trackEmbedding &&
          detEmbedding.length > 0 && detEmbedding.length === trackEmbedding.length) {
        const similarity = cosineSimilarity(detEmbedding, trackEmbedding)
        // For cross-camera, use moderate threshold (0.60)
        // This is lower than same-camera (0.80) because calibration differences
        // can affect appearance, but still blocks clearly different people
        if (similarity < 0.60) {
          // Not the same person - reject cross-camera association
          return false
        }
      }
      // If no embeddings available, let spatial proximity decide (already validated in findNearbyTrack)

      track.cameraAssociations.set(detection.cameraId, {
        cameraId: detection.cameraId,
        trackIds: [detection.trackId],
        lastSeen: detection.timestamp,
        lastFrameNumber: detection.frameNumber,
      })

      // Record successful handoff metrics
      const handoffLatency = detection.timestamp - track.lastSeen
      const handoffDistance = calculateDistance(
        { x: detection.worldX, y: detection.worldY },
        track.currentPosition
      )
      getMetrics().recordHandoffAttempt()
      getMetrics().recordSuccessfulHandoff(handoffLatency, handoffDistance)
    }

    // Update camera frame tracker
    if (detection.frameNumber !== undefined) {
      this.frameTracker.updateFrame(detection.cameraId, detection.frameNumber, detection.timestamp)
    }

    // Update video timing for frontend sync
    const videoTiming = this.extractVideoTiming(detection)
    if (videoTiming) {
      track.videoTiming = videoTiming
    }

    // Aggregate detection attributes for re-ID
    if (detection.attributes) {
      this.aggregateDetectionAttributes(track, detection.attributes)
    }

    track.detectionCount++
    track.missedFrames = 0  // Reset missed frames on detection

    // Transition state on confirmation
    if (!track.isConfirmed && track.detectionCount >= this.config.minDetectionsToConfirm) {
      track.isConfirmed = true
      track.state = 'confirmed'
      // Record confirmation metrics - time since track creation
      const creationTime = track.trail[0]?.timestamp ?? track.lastSeen
      getMetrics().recordTrackConfirmed(detection.timestamp - creationTime)
    }

    // Recover from occlusion with hysteresis (flicker protection)
    if (track.state === 'occluded') {
      let detectionsRequired = this.config.detectionsToExitOcclusion ?? 2
      let minRecoveryTimeMs = this.config.minRecoveryTimeMs ?? 300
      const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? detection.timestamp)

      // Fast recovery for pillar/partial occlusions when reacquisition is high-confidence.
      const isPillarOrPartial =
        track.exitReason === 'pillar_occlusion' || track.exitReason === 'partial_occlusion'
      const assoc = track.cameraAssociations.get(detection.cameraId)
      const isExactLocal = assoc?.trackIds.includes(detection.trackId) ?? false
      let isStrongEmbeddingMatch = false
      const detEmb = detection.attributes?.embedding
      const trEmb = track.attributes?.embedding
      const detQ = detection.attributes?.embedding_quality ?? 0
      const trQ = track.attributes?.embedding_quality ?? 0
      if (detEmb && trEmb && detEmb.length > 0 && trEmb.length === detEmb.length && detQ >= 0.15 && trQ >= 0.15) {
        isStrongEmbeddingMatch = cosineSimilarity(detEmb, trEmb) >= 0.7
      }
      if (isPillarOrPartial && (isExactLocal || isStrongEmbeddingMatch)) {
        detectionsRequired = 1
        minRecoveryTimeMs = 0
      }

      track.consecutiveDetections++

      // Only exit occlusion after multiple detections AND minimum time has passed
      // This prevents flicker when person briefly visible between pillars
      if (track.consecutiveDetections >= detectionsRequired && timeSinceOcclusion >= minRecoveryTimeMs) {
        track.state = 'confirmed'
        // Record occlusion recovery metrics
        const occlusionDuration = track.occludedSince ? detection.timestamp - track.occludedSince : 0
        getMetrics().recordOcclusionEnd(occlusionDuration, true)

        // Reset Kalman velocity for boundary/FOV exits to prevent bouncing.
        // When a track exits via boundary/FOV, the velocity still points toward the edge.
        // If we don't reset it, the filter will produce erratic predictions when
        // reconciling the stale edge-pointing velocity with new observations.
        if (track.kalmanState && (track.exitReason === 'fov_exit' || track.exitReason === 'boundary_exit')) {
          track.kalmanState.mean[2][0] = 0  // Reset vx
          track.kalmanState.mean[3][0] = 0  // Reset vy
          // Also update the Kalman position to the new detection to prevent jump
          track.kalmanState.mean[0][0] = detection.worldX
          track.kalmanState.mean[1][0] = detection.worldY
          track.kalmanState.lastTimestamp = detection.timestamp
          // Clear the cached library state so it gets recreated with fresh values
          this.kalmanFilter.removeTrackState(track.globalTrackId)
        }

        track.occludedSince = undefined
        track.exitReason = null  // Clear exit reason after recovery
        track.consecutiveDetections = 0
        track.predictedPosition = undefined  // Clear predicted position
      }
    } else {
      // Reset consecutive detection counter for non-occluded tracks
      track.consecutiveDetections = 0
    }

    track.pendingDetections.push(detection)
    if (track.pendingDetections.length > 50) {
      track.pendingDetections = track.pendingDetections.slice(-20)
    }
    if (detection.bbox) {
      track.cameraDetections.set(detection.cameraId, {
        cameraId: detection.cameraId,
        bbox: detection.bbox,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        frameNumber: detection.frameNumber,
        videoTimeMs: detection.videoTimeMs,
      })
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

    // Outlier-robust multi-camera fusion:
    // When cameras disagree (common in the back of the room), use Kalman prediction as a reference
    // and ignore clear outlier projections for POSITION UPDATE (association bookkeeping already happened).
    let positionDetections = recentDetections
    if (recentDetections.length > 1 && track.kalmanState) {
      const dtMs = now - track.kalmanState.lastTimestamp
      if (dtMs > 0) {
        const predicted = this.kalmanFilter.predict(track.kalmanState, dtMs)
        const scored = recentDetections.map((d) => {
          const dpos = { x: d.worldX, y: d.worldY }
          return { det: d, dist: calculateDistance(dpos, predicted) }
        }).sort((a, b) => a.dist - b.dist)

        // Keep at least the closest detection; optionally keep more if they're consistent.
        const medianDist = scored.length % 2 === 1
          ? scored[(scored.length - 1) / 2].dist
          : (scored[scored.length / 2 - 1].dist + scored[scored.length / 2].dist) / 2

        const baseGate = this.config.correlationDistanceM ?? 1.0
        const maxAllowed = Math.max(baseGate * 1.8, medianDist * 2.0)
        const kept = scored.filter((s) => s.dist <= maxAllowed)

        positionDetections = (kept.length > 0 ? kept : scored.slice(0, 1)).map((s) => s.det)
      }
    }

    const merged = mergeWorldPositions(positionDetections)

    // Validate merged position before Kalman update
    if (!Number.isFinite(merged.position.x) || !Number.isFinite(merged.position.y)) {
      // Skip this update if position is invalid
      track.pendingDetections = []
      return
    }

    // Clamp measurements to room bounds to prevent visible out-of-bounds jumps
    // (edge projection noise is common near the top-right / door area).
    const roomBounds = this.siteMapGeometry?.roomBounds
    let measurementClampedX = false
    let measurementClampedY = false
    if (roomBounds) {
      const clampResult = clampPointToRoom(merged.position, roomBounds, 0.05)
      merged.position = clampResult.point
      measurementClampedX = clampResult.clampedX
      measurementClampedY = clampResult.clampedY
    }

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

      // Validate Kalman output
      if (Number.isFinite(filteredPosition.x) && Number.isFinite(filteredPosition.y)) {
        // Clamp filtered output as well (Kalman can overshoot slightly near boundaries)
        if (roomBounds) {
          const clampResult = clampPointToRoom(filteredPosition, roomBounds, 0.05)
          merged.position = clampResult.point
          // Keep Kalman internal state consistent with clamped output
          track.kalmanState.mean[0][0] = merged.position.x
          track.kalmanState.mean[1][0] = merged.position.y
          // If we had to clamp, zero velocity into the boundary to prevent “wall bounce”.
          if (clampResult.clampedX) track.kalmanState.mean[2][0] = 0
          if (clampResult.clampedY) track.kalmanState.mean[3][0] = 0
        } else {
          merged.position = filteredPosition
        }
      }
    }

    // If the measurement itself was clamped, also damp velocity on that axis to avoid oscillation.
    if (track.kalmanState) {
      if (measurementClampedX) track.kalmanState.mean[2][0] = 0
      if (measurementClampedY) track.kalmanState.mean[3][0] = 0
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

    // Startup stabilization (first ~1s after creation):
    // In the first seconds of the video, a couple tracks can still wobble due to
    // projection noise and incomplete motion estimates. Apply a light low-pass
    // filter only during this short window.
    const creationTime = track.trail[track.trail.length - 1]?.timestamp ?? track.lastSeen
    const ageMs = now - creationTime
    if (ageMs >= 0 && ageMs < 1200 && track.detectionCount < 10) {
      const alpha = 0.35 // 35% new, 65% previous (strong damping, short duration)
      merged.position = {
        x: previousPosition.x + (merged.position.x - previousPosition.x) * alpha,
        y: previousPosition.y + (merged.position.y - previousPosition.y) * alpha,
      }
      // Keep Kalman state consistent with the stabilized output to avoid “snap back”.
      if (track.kalmanState) {
        track.kalmanState.mean[0][0] = merged.position.x
        track.kalmanState.mean[1][0] = merged.position.y
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
    const batchStartTime = performance.now()

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

    // Build camera-local (cameraId, trackId) -> global track map.
    // Used to anchor clusters to an existing track when the local tracker identity is known.
    const localIdToTrack = new Map<string, GlobalTrack>()
    for (const t of activeTracks) {
      for (const [camId, assoc] of t.cameraAssociations) {
        for (const localId of assoc.trackIds) {
          localIdToTrack.set(`${camId}:${localId}`, t)
        }
      }
    }

    // === CROSSING DETECTION ===
    // Detect tracks that are close to each other (crossing situation)
    // This affects pre-clustering and embedding weight
    const crossingTrackIds = detectCrossingTracks(activeTracks, 1.5)
    const hasAnyCrossings = crossingTrackIds.size > 0

    // === PRE-HUNGARIAN CLUSTERING ===
    // Cluster detections from different cameras that likely represent the same person.
    // Use cluster centroid for Hungarian assignment to ensure both cameras' detections
    // match to the SAME track instead of competing for different tracks.
    // When tracks are crossing, use tighter clustering to avoid merging different people
    const preClusters = this.preClusterCrossCameraDetections(detections, hasAnyCrossings)

    // Create virtual detections from clusters (use centroid position)
    // Track mapping from virtual detection back to original cluster
    const virtualDetections: CameraDetection[] = []
    const clusterMap = new Map<number, DetectionCluster>()  // virtual index -> cluster
    const anchoredTrackIds = new Set<string>()

    for (let i = 0; i < preClusters.length; i++) {
      const cluster = preClusters[i]

      // === CLUSTER ANCHORING (STABILITY FIRST) ===
      // If any detection in this cluster has a camera-local ID that already belongs to a global track,
      // bind the entire cluster to that track and skip Hungarian assignment.
      const anchors = new Map<string, GlobalTrack>()
      for (const det of cluster.detections) {
        if (det.trackId === 0) continue
        const t = localIdToTrack.get(`${det.cameraId}:${det.trackId}`)
        if (t && t.isActive) {
          anchors.set(t.globalTrackId, t)
        }
      }

      // If no exact local-ID anchor exists, try SAME-CAMERA re-acquire for occluded tracks:
      // When a person re-emerges after a pillar, the per-camera tracker can reset trackId.
      // If the track was occluded and recently seen by this same camera, prefer reattaching
      // rather than creating a new global track.
      if (anchors.size === 0) {
        const candidates = new Map<string, { track: GlobalTrack; bestDist: number; similarity: number }>()
        for (const det of cluster.detections) {
          if (!det.cameraId) continue
          const detPos = { x: det.worldX, y: det.worldY }
          for (const t of activeTracks) {
            if (!t.isActive) continue
            if (t.state !== 'occluded') continue
            if (t.exitReason !== 'pillar_occlusion' && t.exitReason !== 'partial_occlusion') continue
            const assoc = t.cameraAssociations.get(det.cameraId)
            if (!assoc) continue
            // Only for the "local ID changed" case
            if (assoc.trackIds.includes(det.trackId)) continue
            const timeSinceSeenOnThisCam = det.timestamp - assoc.lastSeen
            if (timeSinceSeenOnThisCam < 0 || timeSinceSeenOnThisCam > 2500) continue

            // Compare against Kalman-predicted position if possible; otherwise currentPosition.
            const predicted = t.kalmanState
              ? this.kalmanFilter.predict(t.kalmanState, det.timestamp - t.lastSeen)
              : t.currentPosition
            const dist = calculateDistance(detPos, predicted)
            const maxDist = Math.max(0.8, (this.config.correlationDistanceM ?? 1.0) * 0.9)
            if (dist > maxDist) continue

            // Validate with embeddings if available - prevents wrong person from being anchored
            // This is critical for preventing ID switches when different people are spatially close
            const detEmb = det.attributes?.embedding
            const trackEmb = t.attributes?.embedding
            let similarity = 1.0  // Default to full similarity if no embeddings
            if (detEmb && trackEmb && detEmb.length > 0 && trackEmb.length === detEmb.length) {
              similarity = cosineSimilarity(detEmb, trackEmb)
              // If embedding similarity is too low, this is likely a different person
              // Don't anchor to this track
              if (similarity < 0.5) continue
            }

            const existing = candidates.get(t.globalTrackId)
            if (!existing || dist < existing.bestDist) {
              candidates.set(t.globalTrackId, { track: t, bestDist: dist, similarity })
            }
          }
        }

        if (candidates.size === 1) {
          const anchor = Array.from(candidates.values())[0].track
          anchors.set(anchor.globalTrackId, anchor)
        }
      }

      if (anchors.size === 1) {
        const anchor = Array.from(anchors.values())[0]
        let ok = false
        for (const det of cluster.detections) {
          const assoc = anchor.cameraAssociations.get(det.cameraId)
          const isExactLocal = det.trackId !== 0 && (assoc?.trackIds.includes(det.trackId) ?? false)
          ok = (isExactLocal ? this.forceAssociateWithTrack(anchor, det) : this.associateWithTrack(anchor, det)) || ok
        }
        if (ok) {
          anchoredTrackIds.add(anchor.globalTrackId)
        }
        continue
      }

      // Use the highest-confidence detection's metadata, but centroid position
      const primary = cluster.detections.reduce((a, b) =>
        a.confidence > b.confidence ? a : b
      )
      // Find the best attributes from cluster (prefer detection with embedding)
      const bestAttributes = cluster.detections.find(d => d.attributes?.embedding)?.attributes
        ?? primary.attributes
      virtualDetections.push({
        cameraId: primary.cameraId,
        trackId: primary.trackId,
        worldX: cluster.centroid.x,
        worldY: cluster.centroid.y,
        confidence: Math.max(...cluster.detections.map(d => d.confidence)),
        timestamp: primary.timestamp,
        frameNumber: primary.frameNumber,
        attributes: bestAttributes,  // Pass through re-ID attributes for Hungarian assignment
      })
      clusterMap.set(virtualDetections.length - 1, cluster)
    }

    // Use Hungarian algorithm for optimal assignment with virtual detections
    const { matches, unmatchedDetections, unmatchedTracks } = assignDetectionsToTracks(
      virtualDetections,
      activeTracks,
      {
        // Use tighter gating to reduce false merges
        maxCost: this.config.correlationDistanceM,  // Removed 1.2x multiplier for stricter gating
        useKalmanPrediction: true,
        associationBonus: 0.15,  // Stronger identity binding (85% cost reduction)
        kalmanFilter: this.kalmanFilter,
        // Embedding weight for re-ID similarity (default 0.3)
        embeddingWeight: this.embeddingWeight,
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

    // Try re-identification for unmatched virtual detections with occluded or recently inactive tracks
    // Include both confirmed and unconfirmed occluded tracks - unconfirmed tracks
    // may have transitioned to occluded when disappearing near pillars
    // Also include recently inactive tracks (not yet deleted) to enable re-ID after expiry
    const maxReidAgeMs = ALGORITHM_CONSTANTS.reid.adaptiveMaxReidAgeMs
    const occludedTracks = this.getAllTracks().filter(t => {
      // Include occluded active tracks
      if (t.state === 'occluded' && t.isActive) return true

      // Include recently inactive tracks with valid embeddings (for re-ID after expiry)
      if (!t.isActive && t.attributes?.embedding) {
        const timeSinceLastSeen = now - t.lastSeen
        if (timeSinceLastSeen < maxReidAgeMs) return true
      }

      return false
    })

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
      getMetrics().recordReIDMatchAttempt()
      const reidentified = this.attemptReidentification(virtualDet, occludedTracks)
      if (reidentified) {
        // Record successful re-ID with similarity (compute if embeddings available)
        let similarity = 0
        const detEmb = virtualDet.attributes?.embedding
        const trackEmb = reidentified.attributes?.embedding
        if (detEmb && trackEmb && detEmb.length === trackEmb.length) {
          similarity = cosineSimilarity(detEmb, trackEmb)
        }
        getMetrics().recordReIDMatchSuccess(similarity)

        // Reactivate track if it was inactive (re-ID from expired track)
        if (!reidentified.isActive) {
          reidentified.isActive = true
          // Assign a new color since the old one was released
          if (!this.usedColors.has(reidentified.color)) {
            this.usedColors.add(reidentified.color)
          } else {
            reidentified.color = this.assignColor()
          }
        }

        // Restore track from occlusion - preserve confirmation status
        reidentified.state = reidentified.isConfirmed ? 'confirmed' : 'unconfirmed'
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

      // Try stitching with recently-ended tracks (local tracker fragmentation fix)
      // Check each detection in the cluster for a stitch candidate
      let stitchedTrack: GlobalTrack | null = null
      for (const det of validDetections) {
        const stitchResult = this.localStitcher.findStitchCandidate(
          det.cameraId,
          det.trackId,
          { x: det.worldX, y: det.worldY },
          det.timestamp,
          (id) => this.tracks.get(id)
        )
        if (stitchResult.track) {
          stitchedTrack = stitchResult.track
          // Reactivate track if needed
          if (stitchResult.needsReactivation) {
            stitchedTrack.isActive = true
            stitchedTrack.state = stitchedTrack.isConfirmed ? 'confirmed' : 'unconfirmed'
            if (!this.usedColors.has(stitchedTrack.color)) {
              this.usedColors.add(stitchedTrack.color)
            }
          }
          break
        }
      }

      if (stitchedTrack) {
        // Associate all detections with the stitched track
        for (const det of validDetections) {
          this.forceAssociateWithTrack(stitchedTrack, det)
        }
        this.processPendingMerge(stitchedTrack, now)
        this.onTrackUpdated?.(stitchedTrack)
        if (!results.includes(stitchedTrack)) {
          results.push(stitchedTrack)
        }
        continue
      }

      // Use centroid for exclusion zone check
      // For multi-camera clusters, don't pass cameraId (all cameras in cluster are relevant)
      const clusterCameraId = validCluster.detections.length === 1
        ? validCluster.detections[0].cameraId
        : undefined
      // Get latest timestamp from cluster detections for cross-camera exclusion check
      const clusterTimestamp = Math.max(...validCluster.detections.map(d => d.timestamp))
      // Get embedding from cluster for appearance-based exclusion override
      const clusterEmbedding = validCluster.detections.find(d => d.attributes?.embedding)?.attributes?.embedding
      if (this.exclusionValidator.isInExclusionZone(
        validCluster.centroid,
        this.tracks.values(),
        clusterCameraId,
        clusterTimestamp,
        clusterEmbedding
      )) {
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

    // Finalize anchored tracks (position update + trail).
    for (const id of anchoredTrackIds) {
      const t = this.tracks.get(id)
      if (!t || !t.isActive) continue
      this.processPendingMerge(t, now)
      this.onTrackUpdated?.(t)
      if (!results.includes(t)) {
        results.push(t)
      }
    }

    // Record batch processing metrics
    const batchEndTime = performance.now()
    getMetrics().recordBatchProcessing(batchEndTime - batchStartTime, detections.length)

    // Update tracks per camera metric
    const tracksPerCamera: Record<string, number> = {}
    let tracksWithEmbeddings = 0
    for (const track of this.getAllActiveTracks()) {
      for (const cameraId of track.cameraAssociations.keys()) {
        tracksPerCamera[cameraId] = (tracksPerCamera[cameraId] ?? 0) + 1
      }
      // Count tracks with valid embeddings
      if (track.attributes?.embedding && track.attributes.embedding.length > 0) {
        tracksWithEmbeddings++
      }
    }
    getMetrics().updateTracksPerCamera(tracksPerCamera)
    getMetrics().updateTracksWithEmbeddings(tracksWithEmbeddings)

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
    // NOTE: We intentionally do NOT advance positions for merely "unmatched" confirmed tracks anymore.
    // Mutating track.currentPosition based on prediction during early-frame sync jitter can cause
    // visible jumping and can also shift the association cost surface enough to induce ID swaps.
    // We only coast tracks that are explicitly in occlusion state (ghost/coast behavior).

    const geometry = this.siteMapGeometry
    const roomBounds = geometry?.roomBounds
    const fovPolygons = geometry
      ? calculateCombinedFOVPolygons(geometry.cameras, geometry.roomBounds)
      : null

    for (const track of unmatchedTracks) {
      if (!track.isActive || !track.isConfirmed) continue

      const dtMs = now - track.lastSeen
      if (dtMs <= 50 || dtMs > maxCoastMs) continue

      const isPillarGhost = track.state === 'occluded' &&
        (track.exitReason === 'pillar_occlusion' || track.exitReason === 'partial_occlusion')
      const isFovOrBoundaryExit = track.exitReason === 'fov_exit' || track.exitReason === 'boundary_exit'
      const isOccluded = track.state === 'occluded'
      const timeSinceOcclusion = isOccluded ? now - (track.occludedSince ?? now) : 0
      const maxNonPillarCoastMs = 1500  // Coast non-pillar occlusions for up to 1.5s

      // Only coast when the track is explicitly occluded.
      // For confirmed-but-unmatched tracks, rely on Kalman prediction at association time
      // rather than mutating the published position every missed frame.
      if (!isOccluded) {
        if (track.predictedPosition) {
          track.predictedPosition = undefined
        }
        continue
      }

      // Don't coast tracks that have exited via FOV or boundary - they've left the monitored area
      // Freeze them at their last known position instead of predicting further movement
      // IMPORTANT: Apply to ALL track states, not just occluded - fixes wall sliding bug
      if (isFovOrBoundaryExit) {
        if (track.predictedPosition) {
          track.predictedPosition = undefined
        }
        continue
      }

      // Coast other occlusions for a short duration, but longer for pillar occlusions
      if (isOccluded && !isPillarGhost && timeSinceOcclusion > maxNonPillarCoastMs) {
        // Stop coasting after 1.5s for non-pillar occlusions
        if (track.predictedPosition) {
          track.predictedPosition = undefined
        }
        continue
      }

      let predictedPos: Point2D | null = null

      // Try curve-aware prediction first if we have enough trail points
      // This uses geometry (Kåsa circle fit) rather than tuned parameters
      const { trajectory } = ALGORITHM_CONSTANTS
      let usedCurvePrediction = false

      if (track.trail.length >= trajectory.minTrailPointsForCurve && dtMs <= trajectory.maxCurveExtrapolationMs) {
        const curvature = estimateTrailCurvature(
          track.trail,
          trajectory.maxTrailAgeForCurveMs,
          now
        )

        // Only use curve if curvature is significant (radius < 10m = curvature > 0.1)
        if (curvature && curvature.curvature > trajectory.minCurvatureThreshold && track.kalmanState) {
          const velocity = this.kalmanFilter.getVelocity(track.kalmanState)
          const curvePos = predictAlongCurve(track.currentPosition, velocity, curvature, dtMs)
          const linearPos = this.kalmanFilter.predict(track.kalmanState, dtMs)

          // Blend curve and linear predictions for stability
          // fitQuality affects the blend - poor fits get less curve weight
          predictedPos = blendPredictions(linearPos, curvePos, curvature, trajectory.curveBlendWeight)
          usedCurvePrediction = true
        }
      }

      // Fall back to linear Kalman prediction if curve prediction wasn't used
      if (!predictedPos && track.kalmanState) {
        predictedPos = this.kalmanFilter.predict(track.kalmanState, dtMs)
      }

      // Final fallback to simple linear extrapolation from trail
      if (!predictedPos && track.trail.length >= 2) {
        predictedPos = predictPosition(track.trail, dtMs)
      }

      // Apply velocity damping for non-pillar occlusions to prevent drift/bouncing
      // Only for linear predictions - curve predictions have built-in arc constraints
      if (track.kalmanState && isOccluded && !isPillarGhost && !usedCurvePrediction) {
        const dampingFactor = ALGORITHM_CONSTANTS.occlusion.coastingDampingFactor
        track.kalmanState.mean[2][0] *= dampingFactor  // vx
        track.kalmanState.mean[3][0] *= dampingFactor  // vy
      }

      if (!predictedPos) continue

      // Boundary-aware prediction clamping: instead of abruptly freezing,
      // clamp predictions to room bounds and ZERO velocity on clamped axes to prevent bouncing
      if (roomBounds) {
        const clampResult = clampPointToRoom(predictedPos, roomBounds, 0.1)  // Reduced margin from 0.15

        // If clamping was applied, ZERO velocity on that axis to prevent bouncing
        // Also update Kalman position state to match clamped position
        if ((clampResult.clampedX || clampResult.clampedY) && track.kalmanState) {
          if (clampResult.clampedX) {
            track.kalmanState.mean[2][0] = 0  // Zero X velocity (was 0.3 damping)
            track.kalmanState.mean[0][0] = clampResult.point.x  // Update Kalman X position
          }
          if (clampResult.clampedY) {
            track.kalmanState.mean[3][0] = 0  // Zero Y velocity (was 0.3 damping)
            track.kalmanState.mean[1][0] = clampResult.point.y  // Update Kalman Y position
          }
        }

        // Use clamped position instead of original prediction
        predictedPos = clampResult.point

        // IMPORTANT: Do NOT convert to boundary_exit just because a prediction hit the edge.
        // Near-boundary projection noise can cause brief clamping and would otherwise expire
        // tracks early (especially in the top-right area). We simply clamp and keep coasting.
      }

      // If prediction exits all FOVs, stop coasting for this tick.
      // IMPORTANT: Do NOT set exitReason here; exitReason is decided at occlusion entry by geometry.
      if (fovPolygons && !isPointInAnyFOV(predictedPos, fovPolygons, 0)) {
        track.predictedPosition = undefined
        this.onTrackUpdated?.(track)
        continue
      }

      track.predictedPosition = predictedPos
      // Advance position only for occlusion coasting.
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
   * Get the adaptive re-ID window for a track based on its embedding quality.
   *
   * Higher quality embeddings are more discriminative and can be reliably matched
   * over longer time periods. This is a principled observation from computer vision
   * research, not tuned to specific test data.
   *
   * Formula: baseAge * (1 + boostFactor * quality), capped at adaptiveMaxReidAgeMs
   */
  private getAdaptiveReidWindow(track: GlobalTrack): number {
    const { baseReidAgeMs, qualityBoostFactor, adaptiveMaxReidAgeMs } = ALGORITHM_CONSTANTS.reid
    const embeddingQuality = track.attributes?.embedding_quality ?? 0

    // Formula: baseAge * (1 + boostFactor * quality)
    // Quality 0 -> baseAge (5000ms)
    // Quality 0.5 -> baseAge * 1.75 (8750ms)
    // Quality 1.0 -> baseAge * 2.5 (12500ms, capped at adaptiveMaxReidAgeMs)
    const adaptiveAge = baseReidAgeMs * (1 + qualityBoostFactor * embeddingQuality)

    return Math.min(adaptiveAge, adaptiveMaxReidAgeMs)
  }

  /**
   * Attempt to re-identify a detection with a recently occluded track
   * Uses embedding similarity FIRST, then falls back to spatial proximity
   */
  private attemptReidentification(
    detection: CameraDetection,
    occludedTracks: GlobalTrack[]
  ): GlobalTrack | null {
    const gateMultiplier = this.config.reidentificationGateMultiplier ?? 3.0
    const detPos = { x: detection.worldX, y: detection.worldY }

    // Phase 1: Try embedding-based re-ID first (more robust to ghost drift)
    const detEmbedding = detection.attributes?.embedding
    const detQuality = detection.attributes?.embedding_quality ?? 0

    // Use low quality threshold (0.01) to match algorithm-constants.ts minEmbeddingQuality
    // Preprocessor outputs quality around 0.02, so 0.25 was filtering out valid embeddings
    if (detEmbedding && detEmbedding.length > 0 && detQuality >= 0.01) {
      let bestEmbeddingTrack: GlobalTrack | null = null
      let bestSimilarity = 0.45  // Lowered to 0.45 - more permissive for same-camera re-ID

      for (const track of occludedTracks) {
        const trackEmbedding = track.attributes?.embedding
        const trackQuality = track.attributes?.embedding_quality ?? 0

        if (!trackEmbedding || trackEmbedding.length === 0 || trackQuality < 0.01) continue

        // Use quality-adaptive re-ID window per track
        const maxReidAgeMs = this.getAdaptiveReidWindow(track)
        const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? track.lastSeen)
        if (timeSinceOcclusion < 0 || timeSinceOcclusion > maxReidAgeMs) continue

        const similarity = cosineSimilarity(detEmbedding, trackEmbedding)

        if (similarity > bestSimilarity) {
          // Validate with very wide spatial gate (5x) for embedding matches
          // This allows re-ID even when ghost drifted significantly
          const predicted = track.kalmanState
            ? this.kalmanFilter.predict(track.kalmanState, timeSinceOcclusion)
            : track.currentPosition
          const distance = calculateDistance(detPos, predicted)
          const wideGate = this.config.correlationDistanceM * 5.0

          if (distance < wideGate) {
            bestSimilarity = similarity
            bestEmbeddingTrack = track
          }
        }
      }

      if (bestEmbeddingTrack) {
        // Record successful embedding-based re-ID
        getMetrics().recordReIDMatchSuccess(bestSimilarity)
        getMetrics().recordSuccessfulReacquisition(
          detection.timestamp - (bestEmbeddingTrack.occludedSince ?? bestEmbeddingTrack.lastSeen)
        )
        return bestEmbeddingTrack
      }
    }

    // Phase 2: Fall back to spatial-only matching (existing logic)
    let bestTrack: GlobalTrack | null = null
    let bestDistance = Infinity

    for (const track of occludedTracks) {
      if (!track.kalmanState) continue

      // Use quality-adaptive re-ID window per track
      const maxReidAgeMs = this.getAdaptiveReidWindow(track)
      const timeSinceOcclusion = detection.timestamp - (track.occludedSince ?? track.lastSeen)
      if (timeSinceOcclusion < 0 || timeSinceOcclusion > maxReidAgeMs) continue

      const predicted = this.kalmanFilter.predict(track.kalmanState, timeSinceOcclusion)
      const distance = calculateDistance(detPos, predicted)

      const assoc = track.cameraAssociations.get(detection.cameraId)
      const hasExactSameCameraId = assoc?.trackIds.includes(detection.trackId) ?? false

      // Gate multiplier logic:
      // - Pillar/partial occlusions: use full gateMultiplier (ghost may have drifted)
      // - Exact same-camera trackId match: full gateMultiplier
      // - Same camera but different local trackId: smaller gate (local fragmentation case)
      // - Cross-camera re-id: medium gate (handoff case)
      const isPillarOcclusion = track.exitReason === 'pillar_occlusion' ||
                                track.exitReason === 'partial_occlusion'

      let effectiveMultiplier = gateMultiplier
      if (isPillarOcclusion) {
        // Pillar occlusions get full gate - ghost may have drifted significantly
        effectiveMultiplier = gateMultiplier
      } else if (assoc && !hasExactSameCameraId) {
        const exitReason = track.exitReason
        const safeForSameCameraReid =
          exitReason === undefined ||
          exitReason === null ||
          exitReason === 'timeout'

        // Allow a wider gate for same-camera re-ID when the track likely dropped out
        // rather than exited the FOV/room.
        effectiveMultiplier = Math.min(gateMultiplier, safeForSameCameraReid ? 3.0 : 2.0)
      } else if (!assoc) {
        effectiveMultiplier = Math.min(gateMultiplier, 3.0)
      }

      const maxDistance = this.config.correlationDistanceM * effectiveMultiplier
      if (distance < maxDistance && distance < bestDistance) {
        bestDistance = distance
        bestTrack = track
      }
    }

    if (bestTrack) {
      // Record successful spatial re-acquisition
      getMetrics().recordReacquisitionAttempt()
      getMetrics().recordSuccessfulReacquisition(
        detection.timestamp - (bestTrack.occludedSince ?? bestTrack.lastSeen)
      )
    }

    return bestTrack
  }
}
