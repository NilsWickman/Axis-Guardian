/**
 * Hungarian Algorithm Assignment Module
 *
 * Implements optimal detection-to-track assignment using the Munkres (Hungarian)
 * algorithm. This provides globally optimal matching compared to greedy approaches.
 */

import { munkres } from 'munkres'
import type { Point2D, GlobalTrack, CameraDetection } from '../types.js'
import { calculateDistance } from './track-matcher.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'

/**
 * Result of detection-to-track assignment
 */
export interface AssignmentResult {
  /** Successfully matched detection-track pairs */
  matches: Array<{ detection: CameraDetection; track: GlobalTrack; cost: number }>
  /** Detections that couldn't be matched to any track */
  unmatchedDetections: CameraDetection[]
  /** Tracks that weren't matched to any detection */
  unmatchedTracks: GlobalTrack[]
  /** Total assignment cost */
  totalCost: number
}

/**
 * Configuration for assignment
 */
export interface AssignmentConfig {
  /** Maximum cost for valid assignment (meters) */
  maxCost: number
  /** Use Kalman prediction for track position */
  useKalmanPrediction: boolean
  /** Bonus multiplier for existing camera-track associations (0-1) */
  associationBonus: number
  /** Kalman filter for predictions */
  kalmanFilter?: KalmanTrackFilter
  /** Penalty multiplier when track already has different trackId from same camera */
  sameCameraPenalty: number
  /** Weight for velocity consistency cost component */
  velocityConsistencyWeight: number
  /** Proximity threshold for detecting crossing tracks */
  crossingProximityThreshold: number
  /** Cost multiplier for crossing tracks (tighter matching) */
  crossingMaxCostMultiplier: number
}

const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  maxCost: 1.0,             // Reduced from 2.0 for tighter gating
  useKalmanPrediction: true,
  associationBonus: 0.3,    // Reduced from 0.5 for stronger identity binding (70% reduction)
  sameCameraPenalty: 1.5,   // 50% penalty for stealing tracks from same camera
  velocityConsistencyWeight: 0.1,  // Weight for velocity consistency term
  crossingProximityThreshold: 1.5, // Detect crossing when tracks within 1.5m
  crossingMaxCostMultiplier: 0.5,  // Use 50% of maxCost for crossing tracks
}

/**
 * Build cost matrix for Hungarian algorithm
 *
 * @param detections - Array of detections to assign
 * @param tracks - Array of active tracks
 * @param config - Assignment configuration
 * @returns 2D cost matrix [detections x tracks]
 */
export function buildCostMatrix(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: AssignmentConfig = DEFAULT_ASSIGNMENT_CONFIG
): number[][] {
  const kalmanFilter = config.kalmanFilter ?? new KalmanTrackFilter()

  return detections.map(det => {
    const detPos: Point2D = { x: det.worldX, y: det.worldY }

    return tracks.map(track => {
      // Get target position for distance calculation
      let targetPos = track.currentPosition
      let predictedVelocity: Point2D | null = null

      // Use Kalman prediction if available and enabled
      if (config.useKalmanPrediction && track.kalmanState) {
        const timeDelta = det.timestamp - track.lastSeen
        if (timeDelta > 0) {
          const predicted = kalmanFilter.predict(track.kalmanState, timeDelta)
          targetPos = predicted
          predictedVelocity = kalmanFilter.getVelocity(track.kalmanState)
        }
      }

      // Calculate base distance cost
      let cost = calculateDistance(detPos, targetPos)

      // Apply association bonus for existing camera+trackId match
      const assoc = track.cameraAssociations.get(det.cameraId)
      if (assoc?.trackIds.includes(det.trackId)) {
        cost *= config.associationBonus
      } else if (assoc && assoc.trackIds.length > 0) {
        // Same-camera penalty: if track already has different trackId from same camera
        // This prevents "stealing" tracks from the same camera
        cost *= config.sameCameraPenalty
      }

      // Add motion consistency cost
      // Penalize assignments that would require implausible velocity changes
      if (predictedVelocity && config.velocityConsistencyWeight > 0) {
        const dt = (det.timestamp - track.lastSeen) / 1000  // seconds
        if (dt > 0.01) {
          const impliedVelocity = {
            x: (detPos.x - track.currentPosition.x) / dt,
            y: (detPos.y - track.currentPosition.y) / dt,
          }
          const velocityChange = Math.sqrt(
            Math.pow(impliedVelocity.x - predictedVelocity.x, 2) +
            Math.pow(impliedVelocity.y - predictedVelocity.y, 2)
          )
          // Add velocity consistency penalty (max 0.5m equivalent)
          cost += Math.min(0.5, velocityChange * config.velocityConsistencyWeight)
        }
      }

      // Cap cost at maximum
      return Math.min(cost, config.maxCost)
    })
  })
}

/**
 * Detect potential crossing events where multiple tracks are close together
 * Returns set of track IDs that are in crossing situations
 */
export function detectCrossingTracks(
  tracks: GlobalTrack[],
  proximityThreshold: number = 1.5
): Set<string> {
  const crossingTrackIds = new Set<string>()

  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      const dist = calculateDistance(
        tracks[i].currentPosition,
        tracks[j].currentPosition
      )
      if (dist < proximityThreshold) {
        crossingTrackIds.add(tracks[i].globalTrackId)
        crossingTrackIds.add(tracks[j].globalTrackId)
      }
    }
  }

  return crossingTrackIds
}

/**
 * Assign detections to tracks using Hungarian algorithm
 *
 * @param detections - Array of detections to assign
 * @param tracks - Array of active tracks
 * @param config - Assignment configuration
 * @returns Assignment result with matches and unmatched items
 */
export function assignDetectionsToTracks(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: Partial<AssignmentConfig> = {}
): AssignmentResult {
  const fullConfig = { ...DEFAULT_ASSIGNMENT_CONFIG, ...config }

  // Handle empty cases
  if (detections.length === 0) {
    return {
      matches: [],
      unmatchedDetections: [],
      unmatchedTracks: [...tracks],
      totalCost: 0,
    }
  }

  if (tracks.length === 0) {
    return {
      matches: [],
      unmatchedDetections: [...detections],
      unmatchedTracks: [],
      totalCost: 0,
    }
  }

  // Detect crossing tracks for tighter matching
  const crossingTracks = detectCrossingTracks(
    tracks,
    fullConfig.crossingProximityThreshold
  )

  // Build cost matrix
  const costMatrix = buildCostMatrix(detections, tracks, fullConfig)

  // Run Hungarian algorithm
  // The munkres function returns array of [row, col] assignments
  const assignments = munkres(costMatrix)

  // Process assignments
  const matches: AssignmentResult['matches'] = []
  const matchedDetIdx = new Set<number>()
  const matchedTrackIdx = new Set<number>()
  let totalCost = 0

  for (const assignment of assignments) {
    const detIdx = assignment[0]
    const trackIdx = assignment[1]

    // Validate indices are within bounds
    if (detIdx >= detections.length || trackIdx >= tracks.length) {
      continue
    }

    const cost = costMatrix[detIdx][trackIdx]
    const track = tracks[trackIdx]

    // Use tighter threshold for crossing tracks
    const effectiveMaxCost = crossingTracks.has(track.globalTrackId)
      ? fullConfig.maxCost * fullConfig.crossingMaxCostMultiplier
      : fullConfig.maxCost

    // Only accept matches below cost threshold
    if (cost < effectiveMaxCost) {
      matches.push({
        detection: detections[detIdx],
        track: track,
        cost,
      })
      matchedDetIdx.add(detIdx)
      matchedTrackIdx.add(trackIdx)
      totalCost += cost
    }
  }

  // Collect unmatched items
  const unmatchedDetections = detections.filter((_, i) => !matchedDetIdx.has(i))
  const unmatchedTracks = tracks.filter((_, i) => !matchedTrackIdx.has(i))

  return {
    matches,
    unmatchedDetections,
    unmatchedTracks,
    totalCost,
  }
}

/**
 * Compare Hungarian assignment with greedy assignment (for debugging/metrics)
 *
 * @param detections - Array of detections
 * @param tracks - Array of tracks
 * @param config - Assignment configuration
 * @returns Object with both assignment results and comparison metrics
 */
export function compareAssignmentMethods(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: Partial<AssignmentConfig> = {}
): {
  hungarian: AssignmentResult
  greedy: AssignmentResult
  improvement: {
    costReduction: number
    matchDifference: number
  }
} {
  // Hungarian assignment
  const hungarian = assignDetectionsToTracks(detections, tracks, config)

  // Greedy assignment (for comparison)
  const greedy = greedyAssignment(detections, tracks, config)

  return {
    hungarian,
    greedy,
    improvement: {
      costReduction: greedy.totalCost - hungarian.totalCost,
      matchDifference: hungarian.matches.length - greedy.matches.length,
    },
  }
}

/**
 * Simple greedy assignment (for comparison with Hungarian)
 */
function greedyAssignment(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: Partial<AssignmentConfig> = {}
): AssignmentResult {
  const fullConfig = { ...DEFAULT_ASSIGNMENT_CONFIG, ...config }
  const kalmanFilter = fullConfig.kalmanFilter ?? new KalmanTrackFilter()

  const matches: AssignmentResult['matches'] = []
  const matchedTrackIds = new Set<string>()
  let totalCost = 0

  // For each detection, find the closest unmatched track
  const processedDetections: CameraDetection[] = []

  for (const det of detections) {
    const detPos: Point2D = { x: det.worldX, y: det.worldY }

    let bestTrack: GlobalTrack | null = null
    let bestCost = fullConfig.maxCost

    for (const track of tracks) {
      if (matchedTrackIds.has(track.globalTrackId)) continue

      let targetPos = track.currentPosition
      if (fullConfig.useKalmanPrediction && track.kalmanState) {
        const timeDelta = det.timestamp - track.lastSeen
        if (timeDelta > 0) {
          targetPos = kalmanFilter.predict(track.kalmanState, timeDelta)
        }
      }

      let cost = calculateDistance(detPos, targetPos)

      const assoc = track.cameraAssociations.get(det.cameraId)
      if (assoc?.trackIds.includes(det.trackId)) {
        cost *= fullConfig.associationBonus
      }

      if (cost < bestCost) {
        bestCost = cost
        bestTrack = track
      }
    }

    if (bestTrack) {
      matches.push({ detection: det, track: bestTrack, cost: bestCost })
      matchedTrackIds.add(bestTrack.globalTrackId)
      totalCost += bestCost
    } else {
      processedDetections.push(det)
    }
  }

  return {
    matches,
    unmatchedDetections: processedDetections,
    unmatchedTracks: tracks.filter(t => !matchedTrackIds.has(t.globalTrackId)),
    totalCost,
  }
}
