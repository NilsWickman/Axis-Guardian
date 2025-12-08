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
}

const DEFAULT_MERGER_CONFIG: TrackMergerConfig = {
  mergeDistanceM: 0.6,
  mergeConfidenceThreshold: 0.7,
  mergeVelocityThreshold: 2.0,
  unconfirmedMergeDistanceM: 0.4,
  unconfirmedMergeConfidenceThreshold: 0.5,
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

        // Use tighter distance for unconfirmed tracks
        const effectiveMergeDistance = isUnconfirmedMerge
          ? this.config.unconfirmedMergeDistanceM
          : this.config.mergeDistanceM

        const distance = calculateDistance(
          track1.currentPosition,
          track2.currentPosition
        )

        // Quick reject if too far apart
        if (distance > effectiveMergeDistance) continue

        // For unconfirmed tracks, require different cameras (same camera = different people)
        if (isUnconfirmedMerge) {
          const cameras1 = Array.from(track1.cameraAssociations.keys())
          const cameras2 = Array.from(track2.cameraAssociations.keys())
          const hasOverlap = cameras1.some(c => cameras2.includes(c))
          if (hasOverlap) continue  // Same camera sees both - different people
        }

        const confidence = this.calculateMergeConfidence(track1, track2, distance)

        // Use lower threshold for unconfirmed tracks
        const effectiveThreshold = isUnconfirmedMerge
          ? this.config.unconfirmedMergeConfidenceThreshold
          : this.config.mergeConfidenceThreshold

        if (confidence > effectiveThreshold) {
          candidates.push({
            track1,
            track2,
            distance,
            confidence,
          })
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
    distance: number
  ): number {
    let confidence = 0

    // 1. Spatial proximity (0-0.4 points)
    if (distance < this.config.mergeDistanceM) {
      confidence += 0.4 * (1 - distance / this.config.mergeDistanceM)
    } else {
      return 0 // Too far apart
    }

    // 2. Velocity alignment (0-0.3 points)
    if (track1.kalmanState && track2.kalmanState) {
      const v1 = this.kalmanFilter.getVelocity(track1.kalmanState)
      const v2 = this.kalmanFilter.getVelocity(track2.kalmanState)

      const speed1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const speed2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      // Check velocity difference
      const velocityDiff = Math.sqrt(
        Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)
      )

      if (velocityDiff > this.config.mergeVelocityThreshold) {
        // Velocities too different - penalize but don't reject
        confidence -= 0.1
      } else if (speed1 > 0.2 && speed2 > 0.2) {
        // Both moving - check direction alignment
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

    // 4. Camera exclusivity check (CRITICAL)
    const sharedCameras = this.getSharedCameras(track1, track2)
    if (sharedCameras.length > 0) {
      // Same camera sees both tracks at similar times
      // This means they CANNOT be the same person
      // Check if the camera saw them both recently
      for (const cameraId of sharedCameras) {
        const assoc1 = track1.cameraAssociations.get(cameraId)
        const assoc2 = track2.cameraAssociations.get(cameraId)

        if (assoc1 && assoc2) {
          // If both were seen by same camera within 1 second, definitely different people
          const cameraTimeDiff = Math.abs(assoc1.lastSeen - assoc2.lastSeen)
          if (cameraTimeDiff < 1000) {
            return 0 // REJECT merge - same camera sees both
          }
        }
      }
    }

    // Bonus for being tracked by different cameras (supports hypothesis of same person)
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

    return { primary, merged: secondary }
  }
}
