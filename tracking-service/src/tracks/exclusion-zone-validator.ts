/**
 * Exclusion Zone Validator - Prevents duplicate track creation in overlap zones
 *
 * Extracted from TrackManager to provide focused responsibility for
 * detecting and preventing duplicate track creation when cameras overlap.
 */

import type { GlobalTrack, Point2D } from '../types.js'
import { calculateDistance } from '../correlation/track-matcher.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { cosineSimilarity } from './attribute-aggregator.js'

export interface ExclusionZoneConfig {
  /** Exclusion radius for confirmed tracks (meters) */
  confirmedExclusionRadius: number
  /** Embedding similarity threshold below which exclusion is overridden (different people) */
  embeddingDissimilarityThreshold: number
  /** Exclusion radius for unconfirmed tracks from different cameras (meters) */
  unconfirmedExclusionRadius: number
  /** Exclusion radius for very recent cross-camera detections (meters) */
  crossCameraExclusionRadius: number
  /** Time window for cross-camera exclusion (ms) */
  crossCameraExclusionTimeMs: number
}

const DEFAULT_CONFIG: ExclusionZoneConfig = {
  confirmedExclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.confirmedExclusionRadius,
  unconfirmedExclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.unconfirmedExclusionRadius,
  crossCameraExclusionRadius: ALGORITHM_CONSTANTS.exclusionZone.crossCameraExclusionRadius,
  crossCameraExclusionTimeMs: ALGORITHM_CONSTANTS.exclusionZone.crossCameraExclusionTimeMs,
  embeddingDissimilarityThreshold: 0.5, // Below 0.5 similarity = clearly different people
}

export interface ExclusionCheckResult {
  /** Whether the position is in an exclusion zone */
  excluded: boolean
  /** Reason for exclusion if excluded */
  reason?: 'confirmed_track' | 'unconfirmed_track' | 'cross_camera'
  /** The blocking track if excluded */
  blockingTrack?: GlobalTrack
  /** Distance to the blocking track */
  distance?: number
}

/**
 * Callback type for recording exclusion metrics
 */
export interface ExclusionMetricsRecorder {
  recordExclusionZoneBlock(): void
  recordCrossCameraExclusionBlock(): void
}

/**
 * ExclusionZoneValidator - Prevents duplicate track creation in camera overlap zones
 *
 * Responsibilities:
 * - Checking if a position is too close to existing tracks
 * - Applying different exclusion radii for confirmed vs unconfirmed tracks
 * - Handling cross-camera detection within short time windows
 * - Allowing same-camera detections at close positions (different people)
 */
export class ExclusionZoneValidator {
  private config: ExclusionZoneConfig
  private metricsRecorder?: ExclusionMetricsRecorder

  constructor(
    config: Partial<ExclusionZoneConfig> = {},
    metricsRecorder?: ExclusionMetricsRecorder
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metricsRecorder = metricsRecorder
  }

  /**
   * Check if a position is in an exclusion zone (too close to existing tracks)
   *
   * @param position - Position to check
   * @param activeTracks - Iterator of active tracks to check against
   * @param cameraId - Optional camera ID of the detection (for same-camera check)
   * @param timestamp - Optional timestamp for cross-camera exclusion timing
   * @param embedding - Optional embedding for appearance-based exclusion override
   * @returns ExclusionCheckResult with exclusion status and details
   */
  checkExclusion(
    position: Point2D,
    activeTracks: Iterable<GlobalTrack>,
    cameraId?: string,
    timestamp?: number,
    embedding?: number[]
  ): ExclusionCheckResult {
    for (const track of activeTracks) {
      if (!track.isActive) continue

      const distance = calculateDistance(position, track.currentPosition)

      // Check if embeddings indicate different people - if so, skip exclusion for this track
      if (embedding && embedding.length > 0 && track.attributes?.embedding) {
        const similarity = cosineSimilarity(embedding, track.attributes.embedding)
        if (similarity < this.config.embeddingDissimilarityThreshold) {
          // Low similarity = clearly different people, don't exclude
          continue
        }
      }

      // For confirmed tracks, use standard exclusion radius
      if (track.isConfirmed) {
        if (distance < this.config.confirmedExclusionRadius) {
          this.metricsRecorder?.recordExclusionZoneBlock()
          return {
            excluded: true,
            reason: 'confirmed_track',
            blockingTrack: track,
            distance,
          }
        }
        continue
      }

      // For unconfirmed tracks, apply different logic based on camera relationship
      const trackCameras = Array.from(track.cameraAssociations.keys())
      const sameCamera = cameraId ? trackCameras.includes(cameraId) : false

      if (sameCamera) {
        // Same camera seeing two things close together = two different people
        // Don't block (they're different people)
        continue
      }

      // Cross-camera exclusion: Block duplicate creation when there's a very recent
      // unconfirmed track from a DIFFERENT camera within a tighter radius.
      // This catches the case where camera A just created an unconfirmed track
      // and camera B is about to create a duplicate for the same person.
      if (timestamp && cameraId) {
        const timeSinceUpdate = timestamp - track.lastSeen
        if (
          timeSinceUpdate < this.config.crossCameraExclusionTimeMs &&
          distance < this.config.crossCameraExclusionRadius
        ) {
          // Very recent track from different camera, very close - likely duplicate
          this.metricsRecorder?.recordCrossCameraExclusionBlock()
          return {
            excluded: true,
            reason: 'cross_camera',
            blockingTrack: track,
            distance,
          }
        }
      }

      // Standard unconfirmed exclusion radius for different cameras
      if (distance < this.config.unconfirmedExclusionRadius) {
        this.metricsRecorder?.recordExclusionZoneBlock()
        return {
          excluded: true,
          reason: 'unconfirmed_track',
          blockingTrack: track,
          distance,
        }
      }
    }

    return { excluded: false }
  }

  /**
   * Simple boolean check for exclusion (backward compatible)
   */
  isInExclusionZone(
    position: Point2D,
    activeTracks: Iterable<GlobalTrack>,
    cameraId?: string,
    timestamp?: number,
    embedding?: number[]
  ): boolean {
    return this.checkExclusion(position, activeTracks, cameraId, timestamp, embedding).excluded
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ExclusionZoneConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): ExclusionZoneConfig {
    return { ...this.config }
  }

  /**
   * Set the metrics recorder
   */
  setMetricsRecorder(recorder: ExclusionMetricsRecorder): void {
    this.metricsRecorder = recorder
  }
}
