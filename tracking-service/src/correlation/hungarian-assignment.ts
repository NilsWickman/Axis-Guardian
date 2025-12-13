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
import { cosineSimilarity } from '../tracks/attribute-aggregator.js'

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
  /** Weight for embedding similarity in cost (0-1, default 0.3) */
  embeddingWeight: number
  /** Minimum embedding similarity to apply bonus (0-1, default 0.5) */
  embeddingMinSimilarity: number
  /** Minimum embedding quality to use in matching (0-1, default 0.3) */
  embeddingMinQuality: number
}

const DEFAULT_ASSIGNMENT_CONFIG: AssignmentConfig = {
  maxCost: 1.0,             // Relaxed to allow better same-camera re-id
  useKalmanPrediction: true,
  associationBonus: 0.1,    // Strong binding for same local trackId (90% cost reduction)
  sameCameraPenalty: 1.5,   // Reduced penalty - allow same-camera re-id
  velocityConsistencyWeight: 0.15, // Reduced - don't over-penalize velocity changes
  crossingProximityThreshold: 1.5, // Detect crossing when tracks within 1.5m
  crossingMaxCostMultiplier: 0.5,  // Use 50% of maxCost for crossing tracks
  directionConsistencyWeight: 0.2, // Reduced - allow direction changes
  minSpeedForDirection: 0.2,       // Moderate threshold
  crossCameraBonus: 0.6,           // 40% cost reduction for cross-camera handoff
  crossCameraBonusWindowMs: 2000,  // Allow 2s window for handoff gaps
  maxAccelerationMs2: 3.0,         // Relaxed - walking acceleration can vary
  accelerationConsistencyWeight: 0.1,  // Reduced penalty weight
  embeddingWeight: 0.3,            // Embedding similarity contributes 30% to cost
  embeddingMinSimilarity: 0.5,     // Only apply embedding bonus if similarity > 0.5
  embeddingMinQuality: 0.3,        // Minimum embedding quality to use
}

/**
 * Build cost matrix for Hungarian algorithm
 *
 * @param detections - Array of detections to assign
 * @param tracks - Array of active tracks
 * @param config - Assignment configuration
 * @returns Object with cost matrix and per-track adaptive gates
 */
export function buildCostMatrix(
  detections: CameraDetection[],
  tracks: GlobalTrack[],
  config: AssignmentConfig = DEFAULT_ASSIGNMENT_CONFIG
): { matrix: number[][]; adaptiveGates: number[] } {

  const kalmanFilter = config.kalmanFilter ?? new KalmanTrackFilter()

  // Calculate adaptive gate for each track based on Kalman uncertainty
  const adaptiveGates = tracks.map(track => {
    if (track.kalmanState) {
      const uncertainty = kalmanFilter.getPositionUncertainty(track.kalmanState)
      // Expand gate based on uncertainty: baseGate + 2*sigma
      // Clamp between 0.5x and 2x of maxCost
      const adaptiveGate = config.maxCost + 2 * uncertainty
      return Math.max(config.maxCost * 0.5, Math.min(config.maxCost * 2, adaptiveGate))
    }
    return config.maxCost
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
      let cost = calculateDistance(detPos, targetPos)
      const baseDistance = cost

      // Apply association bonus for existing camera+trackId match
      const assoc = track.cameraAssociations.get(det.cameraId)
      if (assoc?.trackIds.includes(det.trackId)) {
        cost *= config.associationBonus
      } else if (assoc && assoc.trackIds.length > 0) {
        // Same-camera with different trackId: could be fragmentation or different person
        const timeSinceSameCam = det.timestamp - assoc.lastSeen
        const isRecentAndClose = baseDistance < config.maxCost * 0.5 &&
          timeSinceSameCam < 500  // Very recent (500ms) and reasonably close
        const isVeryClose = baseDistance < config.maxCost * 0.25  // Within ~0.175m

        if (isRecentAndClose || isVeryClose) {
          // Likely local tracker fragmentation - give BONUS instead of penalty
          // Strong bonus (50% cost reduction) for probable re-identification
          cost *= 0.5
        } else {
          // Older or farther - probably different person, apply penalty
          cost *= config.sameCameraPenalty
        }
      } else if (!assoc) {
        // Cross-camera bonus: if track is seen by OTHER cameras but not this one yet
        // This encourages cross-camera handoff in overlap zones
        const now = det.timestamp
        const hasRecentCrossCamera = Array.from(track.cameraAssociations.entries()).some(
          ([camId, camAssoc]) =>
            camId !== det.cameraId &&
            (now - camAssoc.lastSeen) < config.crossCameraBonusWindowMs
        )
        if (hasRecentCrossCamera) {
          cost *= config.crossCameraBonus
        }
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

          // Add direction-of-travel consistency penalty
          // Penalize assignments that would require reversal of direction
          if (config.directionConsistencyWeight > 0) {
            const currentSpeed = Math.sqrt(
              predictedVelocity.x * predictedVelocity.x +
              predictedVelocity.y * predictedVelocity.y
            )
            const impliedSpeed = Math.sqrt(
              impliedVelocity.x * impliedVelocity.x +
              impliedVelocity.y * impliedVelocity.y
            )

            // Only apply direction constraint if track has meaningful velocity
            if (currentSpeed > config.minSpeedForDirection && impliedSpeed > config.minSpeedForDirection) {
              // Calculate direction consistency using dot product (cosine similarity)
              const dotProduct = (
                predictedVelocity.x * impliedVelocity.x +
                predictedVelocity.y * impliedVelocity.y
              )
              const cosineSimilarity = dotProduct / (currentSpeed * impliedSpeed)

              // cosineSimilarity: 1 = same direction, -1 = opposite direction
              // Convert to penalty: 0 for same direction, 1 for opposite
              const directionPenalty = (1 - cosineSimilarity) / 2

              // Apply weighted penalty (max 0.5m equivalent)
              cost += Math.min(0.5, directionPenalty * config.directionConsistencyWeight)
            }
          }

          // Add acceleration consistency penalty
          // Penalize assignments that require unrealistic acceleration
          if (config.accelerationConsistencyWeight > 0 && dt > 0.05) {
            // Calculate acceleration (change in velocity per second)
            const accelerationX = (impliedVelocity.x - predictedVelocity.x) / dt
            const accelerationY = (impliedVelocity.y - predictedVelocity.y) / dt
            const acceleration = Math.sqrt(accelerationX * accelerationX + accelerationY * accelerationY)

            // Penalty increases for acceleration above max threshold
            if (acceleration > config.maxAccelerationMs2) {
              const excessAccel = acceleration - config.maxAccelerationMs2
              const accelPenalty = Math.min(0.4, excessAccel * config.accelerationConsistencyWeight)
              cost += accelPenalty
            }
          }
        }
      }

      // Add embedding similarity bonus/penalty
      // This helps with re-identification and reduces ID switches
      if (config.embeddingWeight > 0) {
        const detEmbedding = det.attributes?.embedding
        const detQuality = det.attributes?.embedding_quality ?? 0
        const trackEmbedding = track.attributes?.embedding
        const trackQuality = track.attributes?.embedding_quality ?? 0


        // Only use embeddings if both have sufficient quality
        if (
          detEmbedding &&
          trackEmbedding &&
          detEmbedding.length > 0 &&
          trackEmbedding.length === detEmbedding.length &&
          detQuality >= config.embeddingMinQuality &&
          trackQuality >= config.embeddingMinQuality
        ) {
          const similarity = cosineSimilarity(detEmbedding, trackEmbedding)

          if (similarity > config.embeddingMinSimilarity) {
            // High similarity = bonus (reduce cost)
            // Scale: similarity 0.5->1.0 maps to cost multiplier 1.0->0.7
            const embeddingBonus = 1 - (config.embeddingWeight * (similarity - config.embeddingMinSimilarity) /
              (1 - config.embeddingMinSimilarity))
            cost *= embeddingBonus
          } else if (similarity < 0.3) {
            // Very low similarity = penalty (increase cost for likely different person)
            // Only apply penalty for well-established tracks with high-quality embeddings
            if (trackQuality > 0.6 && track.attributes?.sample_count && track.attributes.sample_count >= 5) {
              const embeddingPenalty = 1 + (config.embeddingWeight * (0.3 - similarity))
              cost *= embeddingPenalty
            }
          }
        }
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
  const crossingTracks = new Set([...currentCrossings, ...predictedCrossings])

  // Build cost matrix with adaptive gates
  const { matrix: costMatrix, adaptiveGates } = buildCostMatrix(detections, tracks, fullConfig)

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
