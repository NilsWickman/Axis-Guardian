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
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { cosineSimilarity } from './attribute-aggregator.js'

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
  /** Speed below which tracks are considered "slow" for adaptive merging (m/s) */
  slowSpeedThreshold: number
  /** Speed above which tracks are considered "fast" for adaptive merging (m/s) */
  fastSpeedThreshold: number
  /** Distance multiplier for slow-moving tracks (expands merge radius) */
  slowSpeedDistanceMultiplier: number
  /** Distance multiplier for fast-moving tracks (contracts merge radius) */
  fastSpeedDistanceMultiplier: number
  /** Confidence threshold reduction for slow-moving tracks */
  slowSpeedThresholdReduction: number
}

const DEFAULT_MERGER_CONFIG: TrackMergerConfig = {
  mergeDistanceM: ALGORITHM_CONSTANTS.trackMerger.mergeDistanceM,
  mergeConfidenceThreshold: ALGORITHM_CONSTANTS.trackMerger.mergeConfidenceThreshold,
  mergeVelocityThreshold: ALGORITHM_CONSTANTS.trackMerger.mergeVelocityThreshold,
  unconfirmedMergeDistanceM: ALGORITHM_CONSTANTS.trackMerger.unconfirmedMergeDistanceM,
  unconfirmedMergeConfidenceThreshold: ALGORITHM_CONSTANTS.trackMerger.unconfirmedMergeConfidenceThreshold,
  crossCameraMergeDistanceM: ALGORITHM_CONSTANTS.trackMerger.crossCameraMergeDistanceM,
  minDetectionsForVelocity: ALGORITHM_CONSTANTS.trackMerger.minDetectionsForVelocity,
  simultaneousDetectionBonus: ALGORITHM_CONSTANTS.trackMerger.simultaneousDetectionBonus,
  simultaneousWindowMs: ALGORITHM_CONSTANTS.trackMerger.simultaneousWindowMs,
  slowSpeedThreshold: ALGORITHM_CONSTANTS.trackMerger.slowSpeedThreshold,
  fastSpeedThreshold: ALGORITHM_CONSTANTS.trackMerger.fastSpeedThreshold,
  slowSpeedDistanceMultiplier: ALGORITHM_CONSTANTS.trackMerger.slowSpeedDistanceMultiplier,
  fastSpeedDistanceMultiplier: ALGORITHM_CONSTANTS.trackMerger.fastSpeedDistanceMultiplier,
  slowSpeedThresholdReduction: ALGORITHM_CONSTANTS.trackMerger.slowSpeedThresholdReduction,
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

        // Allow same-camera merges for local fragmentation recovery:
        // Either: one confirmed + one unconfirmed with frame gap
        // Or: both from same camera with different local track IDs and close proximity
        let allowSameCameraFragmentMerge = false
        if (sharedCameras.length > 0) {
          const oneConfirmedOneUnconfirmed = track1.isConfirmed !== track2.isConfirmed
          if (sharedCameras.length === 1) {
            const camId = sharedCameras[0]
            const assoc1 = track1.cameraAssociations.get(camId)
            const assoc2 = track2.cameraAssociations.get(camId)
            const f1 = assoc1?.lastFrameNumber
            const f2 = assoc2?.lastFrameNumber

            // Case 1: One confirmed, one unconfirmed with frame gap
            if (oneConfirmedOneUnconfirmed) {
              if (f1 !== undefined && f2 !== undefined && Math.abs(f1 - f2) >= 2) {
                allowSameCameraFragmentMerge = true
              }
            }

            // Case 2: Different local track IDs on same camera - likely fragmentation
            // Check if track IDs don't overlap (fragmentation creates new ID)
            if (assoc1 && assoc2) {
              const trackIds1 = assoc1.trackIds
              const trackIds2 = assoc2.trackIds
              const hasOverlap = trackIds1.some(id => trackIds2.includes(id))
              if (!hasOverlap) {
                // Different track IDs, check time proximity (one stopped, other started)
                const timeDiff = Math.abs(assoc1.lastSeen - assoc2.lastSeen)
                if (timeDiff < 2000) {  // Within 2 seconds
                  allowSameCameraFragmentMerge = true
                }
              }
            }
          }
        }

        // Use expanded distance for cross-camera unconfirmed merges (projection variance)
        // Use tighter distance for same-camera unconfirmed merges
        let baseMergeDistance: number
        if (isUnconfirmedMerge && isCrossCameraMerge) {
          baseMergeDistance = this.config.crossCameraMergeDistanceM  // 0.9m for cross-camera
        } else if (isUnconfirmedMerge) {
          baseMergeDistance = allowSameCameraFragmentMerge
            ? this.config.mergeDistanceM
            : this.config.unconfirmedMergeDistanceM
        } else {
          baseMergeDistance = this.config.mergeDistanceM
        }

        // Apply velocity-adaptive scaling to merge distance:
        // - Slow tracks: expand radius (projection uncertainty dominates)
        // - Fast tracks: contract radius (velocity is reliable discriminator)
        const avgSpeed = this.getAverageSpeed(track1, track2)
        const velocityMultiplier = this.getVelocityDistanceMultiplier(avgSpeed)
        const effectiveMergeDistance = baseMergeDistance * velocityMultiplier

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
        let baseThreshold: number
        if (isUnconfirmedMerge && isCrossCameraMerge) {
          baseThreshold = 0.55  // Raised threshold to reduce false merges
        } else if (isUnconfirmedMerge) {
          baseThreshold = this.config.unconfirmedMergeConfidenceThreshold
        } else {
          baseThreshold = this.config.mergeConfidenceThreshold
        }

        // Apply velocity-adaptive threshold reduction:
        // - Slow tracks: lower threshold (easier to merge when projection uncertainty dominates)
        // - Fast tracks: no reduction (velocity is reliable discriminator)
        const thresholdReduction = this.getVelocityThresholdReduction(avgSpeed)
        const effectiveThreshold = Math.max(0.3, baseThreshold - thresholdReduction)

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
   * Calculate embedding similarity between two tracks.
   * Returns similarity value (0-1) or -1 if embeddings not available.
   */
  private calculateEmbeddingSimilarity(track1: GlobalTrack, track2: GlobalTrack): number {
    const emb1 = track1.attributes?.embedding
    const emb2 = track2.attributes?.embedding

    if (!emb1 || !emb2 || emb1.length === 0 || emb2.length === 0 || emb1.length !== emb2.length) {
      return -1
    }

    return cosineSimilarity(emb1, emb2)
  }

  /**
   * Calculate confidence that two tracks represent the same person
   *
   * Scoring:
   * - Spatial proximity: 0-0.4 points (closer = higher)
   * - Velocity alignment: 0-0.3 points (similar velocity = higher)
   * - Temporal correlation: 0-0.2 points (seen at same time = higher)
   * - Camera exclusivity: 0.1 bonus (different cameras = good)
   * - ReID embedding similarity: 0-0.35 points (for cross-camera merges)
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

    // Check if this is a cross-camera merge (tracks from different cameras)
    const cameras1 = Array.from(track1.cameraAssociations.keys())
    const cameras2 = Array.from(track2.cameraAssociations.keys())
    const isCrossCameraMerge = !cameras1.some(c => cameras2.includes(c))

    // 1. Spatial proximity (0-0.4 points, reduced for cross-camera)
    // Use effectiveMergeDistance when provided (e.g., 0.9m for cross-camera merges)
    // to properly score tracks that are within the allowed merge range
    const distanceThreshold = effectiveMergeDistance ?? this.config.mergeDistanceM

    // For cross-camera merges with ReID, use position as a gate but not primary signal
    const embeddingSimilarity = this.calculateEmbeddingSimilarity(track1, track2)

    if (isCrossCameraMerge && embeddingSimilarity > 0.5) {
      // Cross-camera with good embedding match: relax position requirement
      // Strong embedding match can override position uncertainty
      if (distance < distanceThreshold) {
        confidence += 0.25 * (1 - distance / distanceThreshold)  // Reduced spatial weight
      } else if (distance < distanceThreshold * 2 && embeddingSimilarity > 0.65) {
        // Extended range for very good embedding matches
        confidence += 0.15 * (1 - distance / (distanceThreshold * 2))
      } else if (embeddingSimilarity < 0.75) {
        return 0 // Too far apart and not excellent embedding match
      }
      // If similarity > 0.75, allow even larger distances (calibration uncertainty)
    } else {
      // Same-camera or no embeddings: use original logic
      if (distance < distanceThreshold) {
        confidence += 0.4 * (1 - distance / distanceThreshold)
      } else {
        return 0 // Too far apart
      }
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
        // Velocities too different and reliable - stronger penalty
        confidence -= 0.25  // Increased from 0.1
      } else if (!velocityReliable) {
        // Velocity not reliable yet - give neutral score (don't penalize early tracks)
        confidence += 0.1  // Reduced from 0.15 to be more conservative
      } else if (speed1 > 0.15 && speed2 > 0.15) {
        // Both moving with reliable velocity - check direction alignment
        const cosineSim = (v1.x * v2.x + v1.y * v2.y) / (speed1 * speed2)

        // CRITICAL: Reject merges of tracks moving in opposite directions
        if (cosineSim < -0.3) {
          return 0  // Opposite directions - cannot be same person
        }

        // Map [-0.3, 1] to [0, 0.35] for direction bonus
        const normalizedSim = (cosineSim + 0.3) / 1.3
        confidence += 0.35 * normalizedSim
      } else {
        // One or both stationary - neutral
        confidence += 0.1
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
    const hasOverlap = cameras1.some(c => cameras2.includes(c))

    if (!hasOverlap) {
      confidence += 0.1 // Different camera sets - good indicator
    }

    // 7. ReID embedding similarity bonus/penalty
    // This is the PRIMARY signal for preventing false merges
    if (embeddingSimilarity > 0) {
      if (isCrossCameraMerge) {
        // Cross-camera merge: use embedding as strong signal
        if (embeddingSimilarity > 0.80) {
          // Excellent match - strong bonus
          confidence += 0.35
        } else if (embeddingSimilarity > 0.70) {
          // Good match - moderate bonus
          confidence += 0.20
        } else if (embeddingSimilarity > 0.60) {
          // Acceptable match - small bonus
          confidence += 0.10
        } else if (embeddingSimilarity < 0.45) {
          // Poor match - heavy penalty to prevent false merges
          confidence -= 0.4
        }
        // Between 0.45-0.60: neutral, let other factors decide
      } else {
        // Same-camera merge (fragmentation recovery): be MORE strict
        // Fragmentation should only merge tracks of the SAME person
        // Require high embedding similarity to prevent merging different people
        if (embeddingSimilarity > 0.75) {
          // High similarity - likely same person, allow merge
          confidence += 0.15
        } else if (embeddingSimilarity < 0.65) {
          // Low similarity - likely different people, heavy penalty
          confidence -= 0.5
        }
        // Between 0.65-0.75: neutral for same-camera
      }
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
   * Calculate average speed of two tracks.
   * Returns the mean of both track speeds, or 0 if velocity data unavailable.
   */
  private getAverageSpeed(track1: GlobalTrack, track2: GlobalTrack): number {
    let totalSpeed = 0
    let count = 0

    if (track1.kalmanState) {
      const v1 = this.kalmanFilter.getVelocity(track1.kalmanState)
      totalSpeed += Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      count++
    }

    if (track2.kalmanState) {
      const v2 = this.kalmanFilter.getVelocity(track2.kalmanState)
      totalSpeed += Math.sqrt(v2.x * v2.x + v2.y * v2.y)
      count++
    }

    return count > 0 ? totalSpeed / count : 0
  }

  /**
   * Calculate velocity-adaptive distance multiplier.
   * - Slow tracks get expanded merge radius (projection uncertainty dominates)
   * - Fast tracks get contracted merge radius (velocity is a reliable discriminator)
   */
  private getVelocityDistanceMultiplier(avgSpeed: number): number {
    if (avgSpeed <= this.config.slowSpeedThreshold) {
      return this.config.slowSpeedDistanceMultiplier  // Expand for slow
    } else if (avgSpeed >= this.config.fastSpeedThreshold) {
      return this.config.fastSpeedDistanceMultiplier  // Contract for fast
    } else {
      // Linear interpolation between slow and fast
      const t = (avgSpeed - this.config.slowSpeedThreshold) /
                (this.config.fastSpeedThreshold - this.config.slowSpeedThreshold)
      return this.config.slowSpeedDistanceMultiplier +
             t * (this.config.fastSpeedDistanceMultiplier - this.config.slowSpeedDistanceMultiplier)
    }
  }

  /**
   * Calculate velocity-adaptive threshold reduction.
   * Slow tracks get lower confidence threshold (easier to merge).
   */
  private getVelocityThresholdReduction(avgSpeed: number): number {
    if (avgSpeed <= this.config.slowSpeedThreshold) {
      return this.config.slowSpeedThresholdReduction  // Full reduction for slow
    } else if (avgSpeed >= this.config.fastSpeedThreshold) {
      return 0  // No reduction for fast
    } else {
      // Linear interpolation
      const t = (avgSpeed - this.config.slowSpeedThreshold) /
                (this.config.fastSpeedThreshold - this.config.slowSpeedThreshold)
      return this.config.slowSpeedThresholdReduction * (1 - t)
    }
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
