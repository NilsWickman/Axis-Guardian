/**
 * Local Track Stitcher - Re-stitches fragmented local tracker IDs
 *
 * Extracted from TrackManager to provide focused responsibility for
 * handling local tracker fragmentation (when YOLOv8 assigns new IDs
 * to the same person).
 */

import type { GlobalTrack, Point2D } from '../types.js'
import { calculateDistance } from '../correlation/track-matcher.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Tracks a recently-ended local track ID for same-camera stitching
 */
export interface EndedLocalTrack {
  localTrackId: number
  globalTrackId: string
  lastPosition: Point2D
  endedAt: number // timestamp
}

export interface LocalTrackStitcherConfig {
  /** Maximum gap in milliseconds for stitching (how long to remember ended tracks) */
  maxGapMs: number
  /** Maximum spatial distance for stitching (meters) */
  maxDistanceMultiplier: number
  /** Maximum number of ended tracks to keep per camera */
  maxEntriesPerCamera: number
  /** Base correlation distance (used with multiplier) */
  correlationDistanceM: number
}

const DEFAULT_CONFIG: LocalTrackStitcherConfig = {
  maxGapMs: ALGORITHM_CONSTANTS.stitching.maxGapMs,
  maxDistanceMultiplier: ALGORITHM_CONSTANTS.stitching.maxDistanceMultiplier,
  maxEntriesPerCamera: ALGORITHM_CONSTANTS.stitching.maxEntriesPerCamera,
  correlationDistanceM: ALGORITHM_CONSTANTS.trackLifecycle.correlationDistanceM,
}

export interface StitchResult {
  /** The global track to stitch with, if found */
  track: GlobalTrack | null
  /** Whether the track needs reactivation */
  needsReactivation: boolean
}

/**
 * LocalTrackStitcher - Handles re-stitching when local trackers fragment IDs
 *
 * When YOLOv8 (or other local trackers) lose track of a person and then
 * re-detect them with a new track ID, this class helps reconnect the
 * detections to the correct global track.
 *
 * Responsibilities:
 * - Recording recently-ended local track IDs per camera
 * - Finding candidates for re-stitching when a new local ID appears
 * - Cleaning up stale ended track entries
 */
export class LocalTrackStitcher {
  /** Recently-ended local track IDs per camera */
  private endedLocalTracks: Map<string, EndedLocalTrack[]> = new Map()
  private config: LocalTrackStitcherConfig

  constructor(config: Partial<LocalTrackStitcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Record that a local track ID has ended (for potential future stitching)
   */
  recordEndedTrack(
    cameraId: string,
    localTrackId: number,
    globalTrackId: string,
    position: Point2D,
    timestamp: number
  ): void {
    let cameraEnded = this.endedLocalTracks.get(cameraId)
    if (!cameraEnded) {
      cameraEnded = []
      this.endedLocalTracks.set(cameraId, cameraEnded)
    }

    // Remove any existing entry for this local track ID
    const existingIdx = cameraEnded.findIndex(e => e.localTrackId === localTrackId)
    if (existingIdx >= 0) {
      cameraEnded.splice(existingIdx, 1)
    }

    cameraEnded.push({
      localTrackId,
      globalTrackId,
      lastPosition: { x: position.x, y: position.y },
      endedAt: timestamp,
    })

    // Keep only recent entries
    if (cameraEnded.length > this.config.maxEntriesPerCamera) {
      cameraEnded.shift()
    }
  }

  /**
   * Record all local track IDs from an expiring global track
   * This should be called when a track expires to enable future stitching
   */
  recordEndedTracksFromGlobalTrack(
    track: GlobalTrack,
    timestamp: number
  ): void {
    for (const [cameraId, assoc] of track.cameraAssociations) {
      // Only record if the camera was recently seeing this track
      const timeSinceLastSeen = timestamp - assoc.lastSeen
      if (timeSinceLastSeen > this.config.maxGapMs) continue

      // Record each local track ID from this camera
      for (const localTrackId of assoc.trackIds) {
        this.recordEndedTrack(
          cameraId,
          localTrackId,
          track.globalTrackId,
          track.currentPosition,
          timestamp
        )
      }
    }
  }

  /**
   * Find a stitch candidate for a new local track ID
   *
   * @param cameraId - Camera the detection came from
   * @param localTrackId - New local track ID
   * @param position - World position of the detection
   * @param timestamp - Detection timestamp
   * @param trackLookup - Function to look up global track by ID
   * @returns The global track to stitch with, or null
   */
  findStitchCandidate(
    cameraId: string,
    _localTrackId: number,
    position: Point2D,
    timestamp: number,
    trackLookup: (globalTrackId: string) => GlobalTrack | undefined
  ): StitchResult {
    const cameraEnded = this.endedLocalTracks.get(cameraId)
    if (!cameraEnded || cameraEnded.length === 0) {
      return { track: null, needsReactivation: false }
    }

    const maxDistance = this.config.correlationDistanceM * this.config.maxDistanceMultiplier

    let bestMatch: EndedLocalTrack | null = null
    let bestDistance = Infinity

    for (const ended of cameraEnded) {
      // Skip if too old
      const gapMs = timestamp - ended.endedAt
      if (gapMs <= 0 || gapMs > this.config.maxGapMs) continue

      // Check spatial distance
      const dist = calculateDistance(position, ended.lastPosition)
      if (dist < maxDistance && dist < bestDistance) {
        bestDistance = dist
        bestMatch = ended
      }
    }

    if (bestMatch) {
      const globalTrack = trackLookup(bestMatch.globalTrackId)
      if (globalTrack) {
        // Remove the matched entry
        const idx = cameraEnded.indexOf(bestMatch)
        if (idx >= 0) cameraEnded.splice(idx, 1)

        // Check if track needs reactivation
        let needsReactivation = false
        if (!globalTrack.isActive) {
          const timeSinceExpiry = timestamp - globalTrack.lastSeen
          if (timeSinceExpiry < this.config.maxGapMs) {
            needsReactivation = true
          } else {
            // Too old to reactivate
            return { track: null, needsReactivation: false }
          }
        }

        return { track: globalTrack, needsReactivation }
      }
    }

    return { track: null, needsReactivation: false }
  }

  /**
   * Clean up old ended local track entries
   */
  cleanup(now: number): void {
    for (const [cameraId, entries] of this.endedLocalTracks) {
      const filtered = entries.filter(e => now - e.endedAt < this.config.maxGapMs)
      if (filtered.length !== entries.length) {
        if (filtered.length === 0) {
          this.endedLocalTracks.delete(cameraId)
        } else {
          this.endedLocalTracks.set(cameraId, filtered)
        }
      }
    }
  }

  /**
   * Clear all ended track entries for a camera
   */
  clearCamera(cameraId: string): void {
    this.endedLocalTracks.delete(cameraId)
  }

  /**
   * Clear all ended track entries
   */
  clearAll(): void {
    this.endedLocalTracks.clear()
  }

  /**
   * Get the number of ended track entries for a camera
   */
  getEntryCount(cameraId: string): number {
    return this.endedLocalTracks.get(cameraId)?.length ?? 0
  }

  /**
   * Get all camera IDs with ended track entries
   */
  getCameraIds(): string[] {
    return Array.from(this.endedLocalTracks.keys())
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LocalTrackStitcherConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): LocalTrackStitcherConfig {
    return { ...this.config }
  }
}
