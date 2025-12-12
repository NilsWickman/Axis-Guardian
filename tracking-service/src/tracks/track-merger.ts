/**
 * Track Merger - Detects and merges duplicate tracks
 *
 * When the same person is tracked by multiple cameras but ends up with
 * separate global tracks (due to timing, calibration error, etc.),
 * this module detects and merges them.
 */

import type { GlobalTrack } from '../types.js'
import { calculateDistance } from '../correlation/track-matcher.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'
import { getMetrics } from '../metrics/index.js'

/**
 * Candidate pair for merging
 */
export interface MergeCandidate {
  track1: GlobalTrack
  track2: GlobalTrack
  distance: number
  confidence: number
}

/**
 * Configuration for track merging
 */
export interface TrackMergerConfig {
  /** Max distance between tracks to consider merging (meters) */
  mergeDistanceM: number
  /** Min confidence score (0-1) required to merge tracks */
  mergeConfidenceThreshold: number
  /** Max velocity difference (m/s) to allow merge */
  mergeVelocityThreshold: number
  /** Max distance between unconfirmed tracks to consider merging (tighter) */
  unconfirmedMergeDistanceM: number
  /** Min confidence for unconfirmed track merges (lower threshold) */
  unconfirmedMergeConfidenceThreshold: number
  /** Max distance for cross-camera unconfirmed track merges (expanded for projection variance) */
  crossCameraMergeDistanceM: number
  /** Minimum detections for reliable velocity estimate in merge scoring */
  minDetectionsForVelocity: number
  /** Bonus for simultaneous detections from different cameras */
  simultaneousDetectionBonus: number
  /** Time window (ms) to consider detections simultaneous */
  simultaneousWindowMs: number
}

const DEFAULT_MERGER_CONFIG: TrackMergerConfig = {
  mergeDistanceM: 0.6,
  mergeConfidenceThreshold: 0.7,
  mergeVelocityThreshold: 2.0,
  unconfirmedMergeDistanceM: 0.4,
  unconfirmedMergeConfidenceThreshold: 0.5,
  crossCameraMergeDistanceM: 0.9,
  minDetectionsForVelocity: 3,
  simultaneousDetectionBonus: 0.15,
  simultaneousWindowMs: 150,
}

/**
 * TrackMerger - Detects and merges duplicate global tracks
 */
export class TrackMerger {
  private config: TrackMergerConfig
  private kalmanFilter: KalmanTrackFilter

  constructor(
    kalmanFilter: KalmanTrackFilter,
    config: Partial<TrackMergerConfig> = {}
  ) {
    this.kalmanFilter = kalmanFilter
    this.config = { ...DEFAULT_MERGER_CONFIG, ...config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TrackMergerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Find track pairs that might be duplicates
   *
   * @param tracks - Array of tracks to check
   * @param includeUnconfirmed - Whether to include unconfirmed tracks in merge detection
   */
  findMergeCandidates(tracks: GlobalTrack[], includeUnconfirmed: boolean = false): MergeCandidate[] {
    const candidates: MergeCandidate[] = []

    // Filter eligible tracks: active + (confirmed OR unconfirmed with at least 1 detection)
    const eligibleTracks = tracks.filter(t =>
      t.isActive && (t.isConfirmed || (includeUnconfirmed && t.detectionCount >= 1))
    )

    for (let i = 0; i < eligibleTracks.length; i++) {
      for (let j = i + 1; j < eligibleTracks.length; j++) {
        const track1 = eligibleTracks[i]
        const track2 = eligibleTracks[j]

        // Determine if this is an unconfirmed merge (at least one track unconfirmed)
        const isUnconfirmedMerge = !track1.isConfirmed || !track2.isConfirmed

        const cameras1 = Array.from(track1.cameraAssociations.keys())
        const cameras2 = Array.from(track2.cameraAssociations.keys())
        const sharedCameras = cameras1.filter(c => cameras2.includes(c))

        // Detect cross-camera merge candidate (tracks from different cameras)
        const isCrossCameraMerge = sharedCameras.length === 0

        // Allow same-camera merges only for local fragmentation recovery:
        // one confirmed + one unconfirmed, and the confirmed track is at least 2 frames behind.
        let allowSameCameraFragmentMerge = false
        if (sharedCameras.length > 0) {
          const oneConfirmedOneUnconfirmed = track1.isConfirmed !== track2.isConfirmed
          if (oneConfirmedOneUnconfirmed && sharedCameras.length === 1) {
            const camId = sharedCameras[0]
            const assoc1 = track1.cameraAssociations.get(camId)
            const assoc2 = track2.cameraAssociations.get(camId)
            const f1 = assoc1?.lastFrameNumber
            const f2 = assoc2?.lastFrameNumber
            if (f1 !== undefined && f2 !== undefined && Math.abs(f1 - f2) >= 2) {
              allowSameCameraFragmentMerge = true
            }
          }
        }

        // Use expanded distance for cross-camera unconfirmed merges (projection variance)
        // Use tighter distance for same-camera unconfirmed merges
        let effectiveMergeDistance: number
        if (isUnconfirmedMerge && isCrossCameraMerge) {
          effectiveMergeDistance = this.config.crossCameraMergeDistanceM  // 0.9m for cross-camera
        } else if (isUnconfirmedMerge) {
          effectiveMergeDistance = allowSameCameraFragmentMerge
            ? this.config.mergeDistanceM
            : this.config.unconfirmedMergeDistanceM
        } else {
          effectiveMergeDistance = this.config.mergeDistanceM
        }

        const distance = calculateDistance(
          track1.currentPosition,
          track2.currentPosition
        )

        // Quick reject if too far apart
        if (distance > effectiveMergeDistance) continue

        // For unconfirmed tracks, require different cameras unless this is a fragmentation recovery case.
        if (isUnconfirmedMerge && sharedCameras.length > 0 && !allowSameCameraFragmentMerge) {
          continue
        }

        const confidence = this.calculateMergeConfidence(track1, track2, distance, effectiveMergeDistance)

        // Use tiered threshold based on merge type:
        // - Cross-camera unconfirmed: lowest threshold (0.4) - projection variance expected
        // - Same-camera unconfirmed: medium threshold (0.5)
        // - Confirmed tracks: highest threshold (0.7)
        let effectiveThreshold: number
        if (isUnconfirmedMerge && isCrossCameraMerge) {
          effectiveThreshold = 0.4  // Lower threshold for cross-camera unconfirmed
        } else if (isUnconfirmedMerge) {
          effectiveThreshold = this.config.unconfirmedMergeConfidenceThreshold
        } else {
          effectiveThreshold = this.config.mergeConfidenceThreshold
        }

        if (confidence > effectiveThreshold) {
          candidates.push({
            track1,
            track2,
            distance,
            confidence,
          })
          // Record merge candidate metrics
          getMetrics().recordMergeCandidate(confidence)
        } else {
          // Record rejected merge (below threshold)
          getMetrics().recordMergeRejected()
        }
      }
    }

    // Sort by confidence (highest first)
    return candidates.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate confidence that two tracks represent the same person
   *
   * Scoring:
   * - Spatial proximity: 0-0.4 points (closer = higher)
   * - Velocity alignment: 0-0.3 points (similar velocity = higher)
   * - Temporal correlation: 0-0.2 points (seen at same time = higher)
   * - Camera exclusivity: 0.1 bonus (different cameras = good)
   *
   * Returns 0 if same camera sees both tracks (impossible for same person)
   */
  private calculateMergeConfidence(
    track1: GlobalTrack,
    track2: GlobalTrack,
    distance: number,
    effectiveMergeDistance?: number
  ): number {
    let confidence = 0

    // 1. Spatial proximity (0-0.4 points)
    // Use effectiveMergeDistance when provided (e.g., 0.9m for cross-camera merges)
    // to properly score tracks that are within the allowed merge range
    const distanceThreshold = effectiveMergeDistance ?? this.config.mergeDistanceM
    if (distance < distanceThreshold) {
      confidence += 0.4 * (1 - distance / distanceThreshold)
    } else {
      return 0 // Too far apart
    }

    // 2. Velocity alignment (0-0.3 points)
    // Only penalize velocity difference if both tracks have enough detections
    // for reliable Kalman velocity estimates
    if (track1.kalmanState && track2.kalmanState) {
      const v1 = this.kalmanFilter.getVelocity(track1.kalmanState)
      const v2 = this.kalmanFilter.getVelocity(track2.kalmanState)

      const speed1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const speed2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      // Check velocity difference
      const velocityDiff = Math.sqrt(
        Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)
      )

      // Check if velocity estimates are reliable (need minDetectionsForVelocity)
      const velocityReliable =
        track1.detectionCount >= this.config.minDetectionsForVelocity &&
        track2.detectionCount >= this.config.minDetectionsForVelocity

      if (velocityReliable && velocityDiff > this.config.mergeVelocityThreshold) {
        // Velocities too different and reliable - penalize but don't reject
        confidence -= 0.1
      } else if (!velocityReliable) {
        // Velocity not reliable yet - give neutral score (don't penalize early tracks)
        confidence += 0.15
      } else if (speed1 > 0.2 && speed2 > 0.2) {
        // Both moving with reliable velocity - check direction alignment
        const cosineSim = (v1.x * v2.x + v1.y * v2.y) / (speed1 * speed2)
        // Map [-1, 1] to [0, 0.3]
        confidence += 0.3 * (cosineSim + 1) / 2
      } else {
        // One or both stationary - neutral
        confidence += 0.15
      }
    } else {
      // No Kalman state - neutral
      confidence += 0.15
    }

    // 3. Temporal correlation (0-0.2 points)
    const timeDiff = Math.abs(track1.lastSeen - track2.lastSeen)
    if (timeDiff < 500) {
      // Seen within 500ms of each other
      confidence += 0.2 * (1 - timeDiff / 500)
    }

    // 4. Simultaneous detection bonus (0-0.15 points)
    // Strong merge signal when tracks have detections from same frame batch
    const simultaneousBonus = this.calculateSimultaneousBonus(track1, track2)
    confidence += simultaneousBonus

    // 5. Camera exclusivity check (CRITICAL)
    const sharedCameras = this.getSharedCameras(track1, track2)
    if (sharedCameras.length > 0) {
      const oneConfirmedOneUnconfirmed = track1.isConfirmed !== track2.isConfirmed

      if (!oneConfirmedOneUnconfirmed) {
        // Two confirmed tracks seen by same camera within 1s are different people.
        for (const cameraId of sharedCameras) {
          const assoc1 = track1.cameraAssociations.get(cameraId)
          const assoc2 = track2.cameraAssociations.get(cameraId)
          if (assoc1 && assoc2) {
            const cameraTimeDiff = Math.abs(assoc1.lastSeen - assoc2.lastSeen)
            if (cameraTimeDiff < 1000) {
              return 0
            }
          }
        }
      } else {
        // Local fragmentation recovery: allow same-camera merge only if frame gap >= 2.
        if (sharedCameras.length !== 1) return 0
        const camId = sharedCameras[0]
        const assoc1 = track1.cameraAssociations.get(camId)
        const assoc2 = track2.cameraAssociations.get(camId)
        const f1 = assoc1?.lastFrameNumber
        const f2 = assoc2?.lastFrameNumber
        if (f1 === undefined || f2 === undefined || Math.abs(f1 - f2) < 2) {
          return 0
        }
      }
    }

    // 6. Bonus for being tracked by different cameras (supports hypothesis of same person)
    const cameras1 = Array.from(track1.cameraAssociations.keys())
    const cameras2 = Array.from(track2.cameraAssociations.keys())
    const hasOverlap = cameras1.some(c => cameras2.includes(c))

    if (!hasOverlap) {
      confidence += 0.1 // Different camera sets - good indicator
    }

    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Get cameras that have seen both tracks
   */
  private getSharedCameras(track1: GlobalTrack, track2: GlobalTrack): string[] {
    const cameras1 = Array.from(track1.cameraAssociations.keys())
    const cameras2 = Array.from(track2.cameraAssociations.keys())
    return cameras1.filter(c => cameras2.includes(c))
  }

  /**
   * Calculate bonus for tracks with simultaneous detections from different cameras.
   * This is strong evidence that they represent the same person.
   */
  private calculateSimultaneousBonus(track1: GlobalTrack, track2: GlobalTrack): number {
    const windowMs = this.config.simultaneousWindowMs

    // Check camera associations for recent simultaneous activity
    for (const [cam1, assoc1] of track1.cameraAssociations) {
      for (const [cam2, assoc2] of track2.cameraAssociations) {
        // Must be from different cameras
        if (cam1 === cam2) continue

        const timeDiff = Math.abs(assoc1.lastSeen - assoc2.lastSeen)
        if (timeDiff < windowMs) {
          // Frame-based check for stronger signal
          if (assoc1.lastFrameNumber !== undefined && assoc2.lastFrameNumber !== undefined) {
            // Same or adjacent frame numbers = very strong signal
            if (Math.abs(assoc1.lastFrameNumber - assoc2.lastFrameNumber) <= 1) {
              return this.config.simultaneousDetectionBonus
            }
          }
          // Timestamp-only match - partial bonus
          return this.config.simultaneousDetectionBonus * 0.5
        }
      }
    }

    return 0
  }

  /**
   * Merge two tracks into one
   *
   * @param track1 First track
   * @param track2 Second track
   * @returns The primary track (with merged data), secondary is marked inactive
   */
  mergeTracks(track1: GlobalTrack, track2: GlobalTrack): {
    primary: GlobalTrack
    merged: GlobalTrack
  } {
    // Keep track with more detections (more established identity)
    const [primary, secondary] = track1.detectionCount >= track2.detectionCount
      ? [track1, track2]
      : [track2, track1]

    // Merge camera associations
    for (const [cameraId, assoc] of secondary.cameraAssociations) {
      const existing = primary.cameraAssociations.get(cameraId)
      if (existing) {
        // Merge track IDs
        for (const trackId of assoc.trackIds) {
          if (!existing.trackIds.includes(trackId)) {
            existing.trackIds.push(trackId)
          }
        }
        // Keep most recent lastSeen
        if (assoc.lastSeen > existing.lastSeen) {
          existing.lastSeen = assoc.lastSeen
          existing.lastFrameNumber = assoc.lastFrameNumber
        }
      } else {
        primary.cameraAssociations.set(cameraId, { ...assoc })
      }
    }

    // Merge Kalman states (weighted by detection count)
    if (primary.kalmanState && secondary.kalmanState) {
      const totalDetections = primary.detectionCount + secondary.detectionCount
      const w1 = primary.detectionCount / totalDetections
      const w2 = secondary.detectionCount / totalDetections

      primary.kalmanState.mean = [
        [primary.kalmanState.mean[0][0] * w1 + secondary.kalmanState.mean[0][0] * w2],
        [primary.kalmanState.mean[1][0] * w1 + secondary.kalmanState.mean[1][0] * w2],
        [primary.kalmanState.mean[2][0] * w1 + secondary.kalmanState.mean[2][0] * w2],
        [primary.kalmanState.mean[3][0] * w1 + secondary.kalmanState.mean[3][0] * w2],
      ]

      // Use position from merged Kalman state
      primary.currentPosition = {
        x: primary.kalmanState.mean[0][0],
        y: primary.kalmanState.mean[1][0],
      }
    }

    // Update detection count
    primary.detectionCount += secondary.detectionCount

    // Keep most recent timestamp
    if (secondary.lastSeen > primary.lastSeen) {
      primary.lastSeen = secondary.lastSeen
    }

    // Merge pending detections
    primary.pendingDetections.push(...secondary.pendingDetections)
    if (primary.pendingDetections.length > 50) {
      primary.pendingDetections = primary.pendingDetections.slice(-20)
    }

    // Mark secondary as inactive
    secondary.isActive = false

    // Record merge metrics
    const cameras1 = Array.from(track1.cameraAssociations.keys())
    const cameras2 = Array.from(track2.cameraAssociations.keys())
    const isCrossCameraMerge = !cameras1.some(c => cameras2.includes(c))
    // Time to merge is approximated as the difference between track creation times
    const track1Creation = track1.trail[0]?.timestamp ?? track1.lastSeen
    const track2Creation = track2.trail[0]?.timestamp ?? track2.lastSeen
    const timeToMerge = Math.abs(track1Creation - track2Creation)
    getMetrics().recordMergeExecuted(isCrossCameraMerge, timeToMerge)

    return { primary, merged: secondary }
  }
}
