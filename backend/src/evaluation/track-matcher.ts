/**
 * Track-to-Ground-Truth Matcher
 *
 * Matches system tracks to ground truth annotations using spatial proximity
 * and maintains identity mapping for ID switch detection.
 */

import { munkres } from 'munkres'
import type { Point2D } from '../types/geometry.js'
import type { GlobalTrackJSON } from '../types/track.js'
import type {
  GroundTruthAnnotation,
  GTMatchResult,
  FrameMatchResult,
} from '../types/ground-truth.js'

// ============================================================================
// Match State Tracking
// ============================================================================

/**
 * ID switch record
 */
export interface IDSwitchRecord {
  timestamp: number
  personId: number
  fromTrackId: string
  toTrackId: string
}

/**
 * Persistent state for ID switch tracking across frames
 */
export class TrackMatcherState {
  /** Maps personId -> last assigned trackId */
  private personToTrack: Map<number, string> = new Map()

  /** Maps trackId -> personId for reverse lookup */
  private trackToPerson: Map<string, number> = new Map()

  /** ID switch history */
  private idSwitches: IDSwitchRecord[] = []

  /** Frame-by-frame track presence per person (for fragmentation) */
  private personPresence: Map<number, { timestamp: number; trackId: string }[]> = new Map()

  /**
   * Reset state for new evaluation
   */
  reset(): void {
    this.personToTrack.clear()
    this.trackToPerson.clear()
    this.idSwitches = []
    this.personPresence.clear()
  }

  /**
   * Update person-track assignment and detect ID switch
   */
  updateAssignment(personId: number, trackId: string, timestamp: number): boolean {
    const previousTrackId = this.personToTrack.get(personId)
    const isSwitch = previousTrackId !== undefined && previousTrackId !== trackId

    if (isSwitch) {
      this.idSwitches.push({
        timestamp,
        personId,
        fromTrackId: previousTrackId!,
        toTrackId: trackId,
      })
    }

    this.personToTrack.set(personId, trackId)
    this.trackToPerson.set(trackId, personId)

    // Track presence for fragmentation analysis
    if (!this.personPresence.has(personId)) {
      this.personPresence.set(personId, [])
    }
    this.personPresence.get(personId)!.push({ timestamp, trackId })

    return isSwitch
  }

  /**
   * Record a miss (person not detected at this frame)
   */
  recordMiss(personId: number, _timestamp: number): void {
    // Mark gap in presence
    if (!this.personPresence.has(personId)) {
      this.personPresence.set(personId, [])
    }
    // Don't add entry for miss - gap in array indicates fragmentation
  }

  /**
   * Get the previous track ID for a person
   */
  getPreviousTrackId(personId: number): string | null {
    return this.personToTrack.get(personId) ?? null
  }

  /**
   * Get all ID switches
   */
  getIdSwitches(): IDSwitchRecord[] {
    return [...this.idSwitches]
  }

  /**
   * Get person to track mapping
   */
  getPersonToTrackMap(): Map<number, string> {
    return new Map(this.personToTrack)
  }

  /**
   * Get all unique track IDs assigned to a person
   */
  getTrackIdsForPerson(personId: number): string[] {
    const presence = this.personPresence.get(personId) ?? []
    const trackIds = new Set(presence.map((p) => p.trackId))
    return Array.from(trackIds)
  }

  /**
   * Count fragmentations for a person (number of track segments - 1)
   */
  countFragmentations(personId: number): number {
    const trackIds = this.getTrackIdsForPerson(personId)
    return Math.max(0, trackIds.length - 1)
  }

  /**
   * Get total fragmentation count across all persons
   */
  getTotalFragmentations(): number {
    let total = 0
    for (const personId of this.personPresence.keys()) {
      total += this.countFragmentations(personId)
    }
    return total
  }
}

// ============================================================================
// Matching Algorithm
// ============================================================================

/**
 * Configuration for GT matching
 */
export interface MatchConfig {
  /** Maximum distance for valid match (meters) */
  maxMatchDistance: number
  /** Current timestamp (seconds) */
  timestamp: number
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Hungarian algorithm-based matcher for optimal GT-to-track assignment
 *
 * Algorithm:
 * 1. Build cost matrix: distance between each GT position and each track position
 * 2. Apply distance threshold as large cost
 * 3. Run Hungarian algorithm for optimal assignment
 * 4. Track ID switches using persistent state
 */
export function matchTracksToGT(
  annotations: GroundTruthAnnotation[],
  tracks: GlobalTrackJSON[],
  state: TrackMatcherState,
  config: MatchConfig
): FrameMatchResult {
  const { maxMatchDistance, timestamp } = config

  // Filter annotations with world position
  const annotationsWithPos = annotations.filter((ann) => ann.worldPosition !== undefined)

  // Handle empty cases
  if (annotationsWithPos.length === 0) {
    return {
      timestamp,
      matches: [],
      unmatchedTrackIds: tracks.map((t) => t.globalTrackId),
      stats: {
        gtCount: 0,
        matchCount: 0,
        fnCount: 0,
        fpCount: tracks.length,
        idSwitchCount: 0,
        avgMatchDistance: 0,
      },
    }
  }

  if (tracks.length === 0) {
    // All GT are false negatives
    const matches: GTMatchResult[] = annotationsWithPos.map((ann) => {
      state.recordMiss(ann.personId, timestamp)
      return {
        annotation: ann,
        matchedTrackId: null,
        matchedPosition: null,
        matchDistance: null,
        isIdSwitch: false,
        previousTrackId: state.getPreviousTrackId(ann.personId),
      }
    })

    return {
      timestamp,
      matches,
      unmatchedTrackIds: [],
      stats: {
        gtCount: annotationsWithPos.length,
        matchCount: 0,
        fnCount: annotationsWithPos.length,
        fpCount: 0,
        idSwitchCount: 0,
        avgMatchDistance: 0,
      },
    }
  }

  // Build cost matrix [GT x Track]
  const LARGE_COST = 1e9
  const n = annotationsWithPos.length
  const m = tracks.length
  const size = Math.max(n, m)

  // Create square padded matrix
  const costMatrix: number[][] = []
  for (let i = 0; i < size; i++) {
    const row: number[] = []
    for (let j = 0; j < size; j++) {
      if (i < n && j < m) {
        const ann = annotationsWithPos[i]
        const track = tracks[j]
        const dist = distance(ann.worldPosition!, track.currentPosition)
        // Use large cost for distances exceeding threshold
        row.push(dist <= maxMatchDistance ? dist : LARGE_COST)
      } else {
        // Padding
        row.push(LARGE_COST)
      }
    }
    costMatrix.push(row)
  }

  // Run Hungarian algorithm
  const assignments = munkres(costMatrix)

  // Process assignments
  const matches: GTMatchResult[] = []
  const matchedTrackIndices = new Set<number>()

  for (const [gtIdx, trackIdx] of assignments) {
    if (gtIdx >= n) continue // Skip padding rows

    const ann = annotationsWithPos[gtIdx]
    const cost = costMatrix[gtIdx][trackIdx]

    if (trackIdx < m && cost < LARGE_COST) {
      // Valid match
      const track = tracks[trackIdx]
      matchedTrackIndices.add(trackIdx)

      const previousTrackId = state.getPreviousTrackId(ann.personId)
      const isIdSwitch = state.updateAssignment(ann.personId, track.globalTrackId, timestamp)

      matches.push({
        annotation: ann,
        matchedTrackId: track.globalTrackId,
        matchedPosition: track.currentPosition,
        matchDistance: cost,
        isIdSwitch,
        previousTrackId,
      })
    } else {
      // No valid match - false negative
      state.recordMiss(ann.personId, timestamp)
      matches.push({
        annotation: ann,
        matchedTrackId: null,
        matchedPosition: null,
        matchDistance: null,
        isIdSwitch: false,
        previousTrackId: state.getPreviousTrackId(ann.personId),
      })
    }
  }

  // Identify unmatched tracks (false positives)
  const unmatchedTrackIds: string[] = []
  for (let j = 0; j < m; j++) {
    if (!matchedTrackIndices.has(j)) {
      unmatchedTrackIds.push(tracks[j].globalTrackId)
    }
  }

  // Compute statistics
  const matchedResults = matches.filter((m) => m.matchedTrackId !== null)
  const avgMatchDistance =
    matchedResults.length > 0
      ? matchedResults.reduce((sum, m) => sum + m.matchDistance!, 0) / matchedResults.length
      : 0

  return {
    timestamp,
    matches,
    unmatchedTrackIds,
    stats: {
      gtCount: annotationsWithPos.length,
      matchCount: matchedResults.length,
      fnCount: matches.filter((m) => m.matchedTrackId === null).length,
      fpCount: unmatchedTrackIds.length,
      idSwitchCount: matches.filter((m) => m.isIdSwitch).length,
      avgMatchDistance,
    },
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Find closest track to a world position
 */
export function findClosestTrack(
  position: Point2D,
  tracks: GlobalTrackJSON[],
  maxDistance: number = Infinity
): { track: GlobalTrackJSON; distance: number } | null {
  let closest: { track: GlobalTrackJSON; distance: number } | null = null

  for (const track of tracks) {
    const dist = distance(position, track.currentPosition)
    if (dist <= maxDistance && (closest === null || dist < closest.distance)) {
      closest = { track, distance: dist }
    }
  }

  return closest
}

/**
 * Print match result summary
 */
export function printMatchSummary(result: FrameMatchResult): void {
  console.log(`\nFrame @ ${result.timestamp}s:`)
  console.log(`  GT: ${result.stats.gtCount}, Matched: ${result.stats.matchCount}`)
  console.log(`  FN: ${result.stats.fnCount}, FP: ${result.stats.fpCount}`)
  console.log(`  ID Switches: ${result.stats.idSwitchCount}`)
  console.log(`  Avg Match Dist: ${result.stats.avgMatchDistance.toFixed(2)}m`)
}
