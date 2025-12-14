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
import {
  calculateAssociationMultiplier,
  calculateMotionConsistencyCost,
  calculateEmbeddingSimilarityMultiplier,
  calculateCrossingGateMultiplier,
  calculateAdaptiveGateFactor,
} from './cost-components.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import {
  calculateTimeToBoundary,
  type RoomBounds,
} from '../geometry/fov-geometry.js'

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
  /** Weight for direction-of-travel consistency (0-1) */
  directionConsistencyWeight: number
  /** Minimum speed (m/s) to consider direction constraint */
  minSpeedForDirection: number
  /** Cost multiplier for cross-camera handoff (0-1, lower = more bonus) */
  crossCameraBonus: number
  /** Time window for cross-camera bonus (ms) - track must be seen by other camera within this time */
  crossCameraBonusWindowMs: number
  /** Maximum plausible acceleration (m/s²) before penalty */
  maxAccelerationMs2: number
  /** Weight for acceleration consistency cost component */
  accelerationConsistencyWeight: number
  /** Weight for embedding similarity in cost (0-1, default 0.1) */
  embeddingWeight: number
  /** Minimum embedding similarity to apply bonus (0-1, default 0.7) */
  embeddingMinSimilarity: number
  /** Minimum embedding quality to use in matching (0-1, default 0.3) */
  embeddingMinQuality: number
  /** Minimum embedding similarity required during crossing (appearance gate) */
  crossingMinSimilarity: number
  /** Penalty multiplier for poor embedding match during crossing */
  crossingMismatchPenalty: number
  /** Minimum embedding quality to apply crossing gate */
  crossingMinQuality: number
  /** Minimum detection count for tight adaptive gating */
  minConfidenceForTightGate: number
  /** Gate reduction factor for confident tracks (0-1) */
  confidentTrackGateFactor: number
  /** Minimum embedding quality for adaptive gating */
  adaptiveMinQuality: number
}

const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  maxCost: ALGORITHM_CONSTANTS.assignment.maxCost,
  useKalmanPrediction: true,
  associationBonus: ALGORITHM_CONSTANTS.assignment.associationBonus,
  sameCameraPenalty: ALGORITHM_CONSTANTS.assignment.sameCameraPenalty,
  velocityConsistencyWeight: ALGORITHM_CONSTANTS.assignment.velocityConsistencyWeight,
  crossingProximityThreshold: ALGORITHM_CONSTANTS.assignment.crossingProximityThreshold,
  crossingMaxCostMultiplier: ALGORITHM_CONSTANTS.assignment.crossingMaxCostMultiplier,
  directionConsistencyWeight: ALGORITHM_CONSTANTS.assignment.directionConsistencyWeight,
  minSpeedForDirection: ALGORITHM_CONSTANTS.assignment.minSpeedForDirection,
  crossCameraBonus: ALGORITHM_CONSTANTS.assignment.crossCameraBonus,
  crossCameraBonusWindowMs: ALGORITHM_CONSTANTS.assignment.crossCameraBonusWindowMs,
  maxAccelerationMs2: ALGORITHM_CONSTANTS.assignment.maxAccelerationMs2,
  accelerationConsistencyWeight: ALGORITHM_CONSTANTS.assignment.accelerationConsistencyWeight,
  embeddingWeight: ALGORITHM_CONSTANTS.assignment.embeddingWeight,
  embeddingMinSimilarity: ALGORITHM_CONSTANTS.assignment.embeddingMinSimilarity,
  embeddingMinQuality: ALGORITHM_CONSTANTS.assignment.embeddingMinQuality,
  // Crossing gate - appearance-gated association
  crossingMinSimilarity: 0.70,
  crossingMismatchPenalty: 3.0,
  crossingMinQuality: 0.35,
  // Adaptive gate for confident tracks
  minConfidenceForTightGate: 5,
  confidentTrackGateFactor: 0.7,
  adaptiveMinQuality: 0.4,
}

/**
 * Build cost matrix for Hungarian algorithm
 *
 * @param detections - Array of detections to assign
 * @param tracks - Array of active tracks
 * @param config - Assignment configuration
 * @param crossingTrackIds - Optional set of track IDs in crossing situations
 * @param handoffTrackIds - Optional set of track IDs in predictive handoff zones
 * @returns Object with cost matrix and per-track adaptive gates
 */
export function buildCostMatrix(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: AssignmentConfig = DEFAULT_ASSIGNMENT_CONFIG,
  crossingTrackIds: Set<string> = new Set(),
  handoffTrackIds: Set<string> = new Set()
): { matrix: number[][]; adaptiveGates: number[] } {

  const kalmanFilter = config.kalmanFilter ?? new KalmanTrackFilter()

  // Calculate adaptive gate for each track based on:
  // 1. Kalman uncertainty
  // 2. Track confidence (adaptive gating for confident tracks)
  const adaptiveGates = tracks.map(track => {
    let baseGate = config.maxCost

    // Kalman-based uncertainty expansion
    if (track.kalmanState) {
      const uncertainty = kalmanFilter.getPositionUncertainty(track.kalmanState)
      // Expand gate based on uncertainty: baseGate + 2*sigma
      baseGate = config.maxCost + 2 * uncertainty
      baseGate = Math.max(config.maxCost * 0.5, Math.min(config.maxCost * 1.5, baseGate))
    }

    // Apply adaptive gate factor for confident tracks (tighter matching)
    const adaptiveFactor = calculateAdaptiveGateFactor(track, {
      minConfidenceForTightGate: config.minConfidenceForTightGate,
      confidentTrackGateFactor: config.confidentTrackGateFactor,
      adaptiveMinQuality: config.adaptiveMinQuality,
    })

    let gate = baseGate * adaptiveFactor

    // Apply predictive handoff gate expansion for tracks approaching FOV boundary
    // This gives them a wider gate to catch cross-camera detections
    if (handoffTrackIds.has(track.globalTrackId)) {
      gate *= ALGORITHM_CONSTANTS.handoff.predictiveGateExpansion
    }

    return gate
  })

  const matrix = detections.map(det => {
    const detPos: Point2D = { x: det.worldX, y: det.worldY }

    return tracks.map((track, trackIdx) => {
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
      const baseDistance = calculateDistance(detPos, targetPos)
      let cost = baseDistance

      // 1. Apply association cost multiplier
      const associationMultiplier = calculateAssociationMultiplier(det, track, baseDistance, {
        associationBonus: config.associationBonus,
        sameCameraPenalty: config.sameCameraPenalty,
        crossCameraBonus: config.crossCameraBonus,
        crossCameraBonusWindowMs: config.crossCameraBonusWindowMs,
        maxCost: config.maxCost,
      })
      cost *= associationMultiplier

      // 2. Add motion consistency cost (velocity, direction, acceleration)
      const timeDeltaMs = det.timestamp - track.lastSeen
      cost += calculateMotionConsistencyCost(detPos, track, predictedVelocity, timeDeltaMs, {
        velocityConsistencyWeight: config.velocityConsistencyWeight,
        directionConsistencyWeight: config.directionConsistencyWeight,
        minSpeedForDirection: config.minSpeedForDirection,
        accelerationConsistencyWeight: config.accelerationConsistencyWeight,
        maxAccelerationMs2: config.maxAccelerationMs2,
      })

      // 3. Check if track is in crossing situation (needed for embedding and crossing gate)
      const isCrossing = crossingTrackIds.has(track.globalTrackId)

      // 4. Apply embedding similarity multiplier
      // During crossings, bypass temporal gating to use full embedding weight
      const embeddingResult = calculateEmbeddingSimilarityMultiplier(det, track, timeDeltaMs, {
        embeddingWeight: config.embeddingWeight,
        embeddingMinSimilarity: config.embeddingMinSimilarity,
        embeddingMinQuality: config.embeddingMinQuality,
      }, true, isCrossing)
      cost *= embeddingResult.multiplier

      // 5. Apply appearance-gated crossing penalty
      // When tracks are crossing, require embedding match to prevent ID switches
      const crossingGate = calculateCrossingGateMultiplier(det, track, isCrossing, {
        crossingMinSimilarity: config.crossingMinSimilarity,
        crossingMismatchPenalty: config.crossingMismatchPenalty,
        crossingMinQuality: config.crossingMinQuality,
      })
      cost *= crossingGate.multiplier

      // 5. Apply predictive handoff bonus for tracks approaching FOV boundary
      // This improves cross-camera association for tracks about to exit one camera's view
      if (handoffTrackIds.has(track.globalTrackId)) {
        // Bonus is applied as multiplier (0.7 = 30% cost reduction)
        cost *= ALGORITHM_CONSTANTS.handoff.predictiveHandoffBonus
      }

      // Cap cost at adaptive gate for this track
      return Math.min(cost, adaptiveGates[trackIdx])
    })
  })

  return { matrix, adaptiveGates }
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
 * Predict future positions of tracks to detect imminent crossings
 * Returns set of track IDs that will cross within the prediction window
 */
export function predictTrajectoryIntersections(
  tracks: GlobalTrack[],
  kalmanFilter: KalmanTrackFilter,
  predictionWindowMs: number = 1000,
  intersectionThresholdM: number = 0.8
): Set<string> {
  const crossingTrackIds = new Set<string>()

  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      const track1 = tracks[i]
      const track2 = tracks[j]

      if (!track1.kalmanState || !track2.kalmanState) continue

      // Predict positions at multiple time steps to detect intersection
      const timeSteps = [200, 500, 800, 1000]  // ms

      for (const dt of timeSteps) {
        if (dt > predictionWindowMs) break

        const pos1 = kalmanFilter.predict(track1.kalmanState, dt)
        const pos2 = kalmanFilter.predict(track2.kalmanState, dt)

        const futureDistance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )

        if (futureDistance < intersectionThresholdM) {
          // Mark both tracks as having imminent crossing
          crossingTrackIds.add(track1.globalTrackId)
          crossingTrackIds.add(track2.globalTrackId)
          break  // Found crossing, no need to check further time steps
        }
      }
    }
  }

  return crossingTrackIds
}

/**
 * Identify tracks that are in predictive handoff zones.
 *
 * A track is in a predictive handoff zone when:
 * 1. It's within handoffZoneDistanceM of the FOV boundary
 * 2. It's moving toward the boundary (velocity component > minVelocityTowardBoundary)
 * 3. It will reach the boundary within timeToBoundaryThresholdMs
 *
 * These tracks get a cost bonus in the assignment to improve handoff continuity.
 * This uses existing velocity from Kalman filter - geometry-based, not tuned parameters.
 *
 * @param tracks - Array of active tracks
 * @param kalmanFilter - Kalman filter for velocity extraction
 * @param fovPolygons - FOV polygons for all cameras (optional, skipped if not provided)
 * @param roomBounds - Room dimensions (optional, skipped if not provided)
 * @returns Set of track IDs in predictive handoff zones
 */
export function identifyPredictiveHandoffTracks(
  tracks: GlobalTrack[],
  kalmanFilter: KalmanTrackFilter,
  fovPolygons?: Point2D[][],
  roomBounds?: RoomBounds
): Set<string> {
  const handoffTrackIds = new Set<string>()

  // Skip if geometry not provided
  if (!fovPolygons || !roomBounds) {
    return handoffTrackIds
  }

  const { handoff } = ALGORITHM_CONSTANTS

  for (const track of tracks) {
    if (!track.kalmanState || !track.isActive || !track.isConfirmed) continue

    const velocity = kalmanFilter.getVelocity(track.kalmanState)
    const boundaryInfo = calculateTimeToBoundary(
      track.currentPosition,
      velocity,
      fovPolygons,
      roomBounds
    )

    // Check all three conditions for predictive handoff zone
    const isInZone =
      boundaryInfo.distanceM < handoff.handoffZoneDistanceM &&
      boundaryInfo.isHeadingOut &&
      boundaryInfo.timeToExitMs !== null &&
      boundaryInfo.timeToExitMs < handoff.timeToBoundaryThresholdMs

    // Also check minimum velocity toward boundary
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    const hasMinVelocity = speed > handoff.minVelocityTowardBoundary

    if (isInZone && hasMinVelocity) {
      handoffTrackIds.add(track.globalTrackId)
    }
  }

  return handoffTrackIds
}

/**
 * Options for predictive handoff detection
 */
export interface HandoffGeometry {
  fovPolygons: Point2D[][]
  roomBounds: RoomBounds
}

/**
 * Assign detections to tracks using Hungarian algorithm
 *
 * @param detections - Array of detections to assign
 * @param tracks - Array of active tracks
 * @param config - Assignment configuration
 * @param handoffGeometry - Optional FOV/room geometry for predictive handoff zones
 * @returns Assignment result with matches and unmatched items
 */
export function assignDetectionsToTracks(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: Partial<AssignmentConfig> = {},
  handoffGeometry?: HandoffGeometry
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
  // Includes both current crossings and predicted future crossings
  const currentCrossings = detectCrossingTracks(
    tracks,
    fullConfig.crossingProximityThreshold
  )

  // Predict imminent crossings using trajectory extrapolation
  const kalmanFilter = fullConfig.kalmanFilter ?? new KalmanTrackFilter()
  const predictedCrossings = predictTrajectoryIntersections(
    tracks,
    kalmanFilter,
    1000,  // 1 second prediction window
    fullConfig.crossingProximityThreshold * 0.6  // Tighter threshold for predictions
  )

  // Combine current and predicted crossings
  const crossingTracks = new Set<string>()
  currentCrossings.forEach(id => crossingTracks.add(id))
  predictedCrossings.forEach(id => crossingTracks.add(id))

  // Identify tracks in predictive handoff zones (approaching FOV boundaries)
  const handoffTracks = handoffGeometry
    ? identifyPredictiveHandoffTracks(
        tracks,
        kalmanFilter,
        handoffGeometry.fovPolygons,
        handoffGeometry.roomBounds
      )
    : new Set<string>()

  // Build cost matrix with adaptive gates, crossing track IDs, and handoff track IDs
  const { matrix: costMatrix, adaptiveGates } = buildCostMatrix(
    detections,
    tracks,
    fullConfig,
    crossingTracks,
    handoffTracks
  )

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

    // Use adaptive gate, tightened for crossing tracks
    let effectiveMaxCost = adaptiveGates[trackIdx]
    if (crossingTracks.has(track.globalTrackId)) {
      effectiveMaxCost *= fullConfig.crossingMaxCostMultiplier
    }

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
