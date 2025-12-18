/**
 * Temporal Multi-Frame Assignment
 *
 * Implements block coordinate descent for optimizing detection-to-track assignment
 * across multiple frames simultaneously. This provides better global optimization
 * than greedy frame-by-frame assignment.
 *
 * Algorithm:
 * 1. Initialize with greedy frame-by-frame assignment
 * 2. Iterate: for each frame, re-optimize assignment given fixed neighbors
 * 3. Apply temporal continuity bonuses for consistent assignments
 * 4. Stop when converged or max iterations reached
 */

import { munkres } from 'munkres'
import type { Point2D, GlobalTrack, CameraDetection } from '../types/index.js'
import { buildCostMatrix, detectCrossingTracks } from '../correlation/hungarian-assignment.js'
import { ALGORITHM_CONSTANTS, type BatchOptimizationConstants } from '../config/algorithm-constants.js'

/**
 * Assignment for a single detection in a frame
 */
export interface TemporalAssignment {
  frameIndex: number
  detection: CameraDetection
  trackId: string | null  // null if unmatched (new track)
  cost: number
}

/**
 * Frame batch for temporal optimization
 */
export interface FrameBatchInput {
  frameNumber: number
  timestamp: number
  detections: CameraDetection[]
}

/**
 * Build cost matrix with temporal continuity bonuses from adjacent frames
 *
 * Extends the base cost matrix by applying bonuses for assignments that
 * maintain track identity across frames. Handles both same-camera continuity
 * and cross-camera handoffs.
 *
 * @param frame - Current frame detections
 * @param tracks - Active tracks
 * @param prevAssignments - Assignments from previous frame (frozen)
 * @param nextAssignments - Assignments from next frame (frozen)
 * @param config - Batch optimization configuration
 * @returns Augmented cost matrix with temporal bonuses applied
 */
export function buildTemporalCostMatrix(
  frame: FrameBatchInput,
  tracks: GlobalTrack[],
  prevAssignments: TemporalAssignment[] | null,
  nextAssignments: TemporalAssignment[] | null,
  config: BatchOptimizationConstants
): { matrix: number[][]; trackIds: string[] } {
  // Get crossing tracks for this frame's timestamp
  const crossingTrackIds = detectCrossingTracks(tracks, ALGORITHM_CONSTANTS.assignment.crossingProximityThreshold)

  // Build base cost matrix using existing logic
  const { matrix } = buildCostMatrix(
    frame.detections,
    tracks,
    undefined, // Use default config
    crossingTrackIds
  )

  const trackIds = tracks.map(t => t.globalTrackId)

  // Apply temporal continuity bonuses
  const temporalBonus = config.temporalContinuityBonus
  // Cross-camera handoff bonus (slightly weaker than same-camera, but still significant)
  const crossCameraBonus = temporalBonus + (1 - temporalBonus) * 0.3 // e.g., 0.8 -> 0.86

  for (let d = 0; d < frame.detections.length; d++) {
    const det = frame.detections[d]

    for (let k = 0; k < tracks.length; k++) {
      const track = tracks[k]
      const trackId = track.globalTrackId

      // Check if same track was matched in previous frame
      if (prevAssignments) {
        const prevMatch = prevAssignments.find(a => a.trackId === trackId)
        if (prevMatch) {
          if (prevMatch.detection.cameraId === det.cameraId) {
            // Same camera, same track in previous frame - apply full bonus
            matrix[d][k] *= temporalBonus
          } else {
            // Cross-camera handoff: track seen by different camera in prev frame
            // This is a legitimate handoff scenario - apply cross-camera bonus
            matrix[d][k] *= crossCameraBonus
          }
        }
      }

      // Check if same track was matched in next frame
      if (nextAssignments) {
        const nextMatch = nextAssignments.find(a => a.trackId === trackId)
        if (nextMatch) {
          if (nextMatch.detection.cameraId === det.cameraId) {
            // Same camera, same track in next frame - apply full bonus
            matrix[d][k] *= temporalBonus
          } else {
            // Cross-camera handoff: track will be seen by different camera in next frame
            // This is a legitimate handoff scenario - apply cross-camera bonus
            matrix[d][k] *= crossCameraBonus
          }
        }
      }

      // Additional bonus: if track has recent visibility from multiple cameras,
      // it's likely in an overlap zone - encourage maintaining the same ID
      if (track.cameraAssociations.size > 1) {
        const recentThresholdMs = 2000 // 2 seconds
        const now = frame.timestamp
        let recentCameras = 0
        for (const [, assoc] of track.cameraAssociations) {
          if (now - assoc.lastSeen < recentThresholdMs) {
            recentCameras++
          }
        }
        if (recentCameras > 1) {
          // Track is in multi-camera overlap zone - apply additional bonus
          matrix[d][k] *= 0.95 // 5% bonus for overlap zone tracks
        }
      }
    }
  }

  return { matrix, trackIds }
}

/**
 * Initialize assignments using greedy frame-by-frame Hungarian
 *
 * @param frames - All frames in the batch window
 * @param tracks - Active tracks at window start
 * @returns Initial assignments for all frames
 */
function initializeGreedy(
  frames: FrameBatchInput[],
  tracks: GlobalTrack[]
): TemporalAssignment[][] {
  const assignments: TemporalAssignment[][] = []

  // Simulate track state forward through frames
  const trackStates = new Map<string, { position: Point2D; lastSeen: number }>()
  for (const track of tracks) {
    trackStates.set(track.globalTrackId, {
      position: { ...track.currentPosition },
      lastSeen: track.lastSeen,
    })
  }

  for (let f = 0; f < frames.length; f++) {
    const frame = frames[f]
    const crossingTrackIds = detectCrossingTracks(tracks, ALGORITHM_CONSTANTS.assignment.crossingProximityThreshold)

    // Build cost matrix using current track states
    const virtualTracks: GlobalTrack[] = tracks.map(t => {
      const state = trackStates.get(t.globalTrackId)!
      return {
        ...t,
        currentPosition: state.position,
        lastSeen: state.lastSeen,
      }
    })

    const { matrix } = buildCostMatrix(frame.detections, virtualTracks, undefined, crossingTrackIds)

    // Add columns for "new track" option
    const numDets = frame.detections.length
    const numTracks = tracks.length
    const extendedMatrix: number[][] = matrix.map(row => [
      ...row,
      ALGORITHM_CONSTANTS.batch.trackBirthCost, // Cost to create new track
    ])

    // Run Hungarian
    const munkresResult = munkres(extendedMatrix)

    // Convert munkres result to assignments
    const frameAssignments: TemporalAssignment[] = []
    const matchedTracks = new Set<number>()

    for (const [detIdx, assignIdx] of munkresResult) {
      if (detIdx >= numDets) continue // Skip dummy rows

      const detection = frame.detections[detIdx]

      if (assignIdx < numTracks) {
        // Matched to existing track
        const track = tracks[assignIdx]
        const cost = matrix[detIdx][assignIdx]

        // Only accept if within max cost
        if (cost <= ALGORITHM_CONSTANTS.assignment.maxCost * 1.5) {
          frameAssignments.push({
            frameIndex: f,
            detection,
            trackId: track.globalTrackId,
            cost,
          })
          matchedTracks.add(assignIdx)

          // Update track state
          trackStates.set(track.globalTrackId, {
            position: { x: detection.worldX, y: detection.worldY },
            lastSeen: frame.timestamp,
          })
        } else {
          // Cost too high - treat as new track
          frameAssignments.push({
            frameIndex: f,
            detection,
            trackId: null,
            cost: ALGORITHM_CONSTANTS.batch.trackBirthCost,
          })
        }
      } else {
        // Assigned to "new track" column
        frameAssignments.push({
          frameIndex: f,
          detection,
          trackId: null,
          cost: ALGORITHM_CONSTANTS.batch.trackBirthCost,
        })
      }
    }

    // Add unmatched detections (shouldn't happen with proper Hungarian setup)
    const assignedDets = new Set(frameAssignments.map(a => frame.detections.indexOf(a.detection)))
    for (let d = 0; d < numDets; d++) {
      if (!assignedDets.has(d)) {
        frameAssignments.push({
          frameIndex: f,
          detection: frame.detections[d],
          trackId: null,
          cost: ALGORITHM_CONSTANTS.batch.trackBirthCost,
        })
      }
    }

    assignments.push(frameAssignments)
  }

  return assignments
}

/**
 * Evaluate total cost of assignment including temporal penalties
 *
 * @param assignments - Assignments for all frames
 * @param config - Batch optimization configuration
 * @returns Total cost
 */
export function evaluateTotalCost(
  assignments: TemporalAssignment[][],
  config: BatchOptimizationConstants
): number {
  let totalCost = 0

  // Sum base assignment costs
  for (const frameAssignments of assignments) {
    for (const assign of frameAssignments) {
      totalCost += assign.cost
    }
  }

  // Add ID switch penalty
  // Group assignments by track and check for camera-local ID switches
  const trackAssignments = new Map<string, TemporalAssignment[]>()
  for (const frameAssignments of assignments) {
    for (const assign of frameAssignments) {
      if (assign.trackId) {
        if (!trackAssignments.has(assign.trackId)) {
          trackAssignments.set(assign.trackId, [])
        }
        trackAssignments.get(assign.trackId)!.push(assign)
      }
    }
  }

  for (const [_trackId, assigns] of trackAssignments) {
    // Check for camera-local ID switches
    const byCamera = new Map<string, number[]>()
    for (const assign of assigns) {
      const camId = assign.detection.cameraId
      if (!byCamera.has(camId)) {
        byCamera.set(camId, [])
      }
      byCamera.get(camId)!.push(assign.detection.trackId)
    }

    for (const [_camId, localIds] of byCamera) {
      for (let i = 1; i < localIds.length; i++) {
        if (localIds[i] !== localIds[i - 1]) {
          // ID switch detected
          totalCost += config.idSwitchPenalty
        }
      }
    }
  }

  // Add smoothness penalty (Kalman residual-based)
  // This is computed in smoothTrajectories, skip for now
  // totalCost += smoothnessPenalty * config.smoothnessWeight

  return totalCost
}

/**
 * Replace assignments for a single frame
 */
function replaceFrame(
  assignments: TemporalAssignment[][],
  frameIdx: number,
  newAssignments: TemporalAssignment[]
): TemporalAssignment[][] {
  const result = [...assignments]
  result[frameIdx] = newAssignments
  return result
}

/**
 * Solve multi-frame assignment using block coordinate descent
 *
 * Iteratively optimizes each frame's assignment while holding neighbors fixed.
 * Converges to a local optimum that respects temporal coherence.
 *
 * @param frames - All frames in the batch window
 * @param activeTracks - Active tracks at window start
 * @param config - Batch optimization configuration
 * @returns Optimized assignments for all frames
 */
export function solveBlockCoordinateDescent(
  frames: FrameBatchInput[],
  activeTracks: GlobalTrack[],
  config: BatchOptimizationConstants
): { assignments: TemporalAssignment[][]; totalCost: number; iterations: number } {
  const W = frames.length
  if (W === 0) {
    return { assignments: [], totalCost: 0, iterations: 0 }
  }

  // Step 1: Initialize with greedy frame-by-frame
  let assignments = initializeGreedy(frames, activeTracks)
  let bestCost = evaluateTotalCost(assignments, config)

  // Step 2: Iterative refinement
  let iterations = 0
  for (let iter = 0; iter < config.maxIterations; iter++) {
    let improved = false
    iterations++

    // For each frame, re-optimize given fixed neighbors
    for (let f = 0; f < W; f++) {
      const frame = frames[f]
      const prevAssigns = f > 0 ? assignments[f - 1] : null
      const nextAssigns = f < W - 1 ? assignments[f + 1] : null

      // Build temporal cost matrix
      const { matrix, trackIds } = buildTemporalCostMatrix(
        frame,
        activeTracks,
        prevAssigns,
        nextAssigns,
        config
      )

      // Extend matrix with "new track" option
      const numDets = frame.detections.length
      const numTracks = trackIds.length

      if (numDets === 0) continue

      const extendedMatrix: number[][] = matrix.map(row => [
        ...row,
        config.trackBirthCost,
      ])

      // Pad to square if needed (munkres requires square matrix)
      const size = Math.max(numDets, numTracks + 1)
      while (extendedMatrix.length < size) {
        extendedMatrix.push(Array(size).fill(config.trackDeathCost))
      }
      for (const row of extendedMatrix) {
        while (row.length < size) {
          row.push(config.trackDeathCost)
        }
      }

      // Run Hungarian
      const munkresResult = munkres(extendedMatrix)

      // Convert to assignments
      const newFrameAssignments: TemporalAssignment[] = []

      for (const [detIdx, assignIdx] of munkresResult) {
        if (detIdx >= numDets) continue // Skip dummy rows

        const detection = frame.detections[detIdx]

        if (assignIdx < numTracks) {
          // Matched to existing track
          const trackId = trackIds[assignIdx]
          const cost = matrix[detIdx][assignIdx]

          if (cost <= ALGORITHM_CONSTANTS.assignment.maxCost * 1.5) {
            newFrameAssignments.push({
              frameIndex: f,
              detection,
              trackId,
              cost,
            })
          } else {
            newFrameAssignments.push({
              frameIndex: f,
              detection,
              trackId: null,
              cost: config.trackBirthCost,
            })
          }
        } else {
          // New track
          newFrameAssignments.push({
            frameIndex: f,
            detection,
            trackId: null,
            cost: config.trackBirthCost,
          })
        }
      }

      // Add any unmatched detections
      const assignedDets = new Set(newFrameAssignments.map(a => frame.detections.indexOf(a.detection)))
      for (let d = 0; d < numDets; d++) {
        if (!assignedDets.has(d)) {
          newFrameAssignments.push({
            frameIndex: f,
            detection: frame.detections[d],
            trackId: null,
            cost: config.trackBirthCost,
          })
        }
      }

      // Check if improvement
      const candidateAssignments = replaceFrame(assignments, f, newFrameAssignments)
      const newCost = evaluateTotalCost(candidateAssignments, config)

      if (newCost < bestCost - config.convergenceThreshold) {
        assignments = candidateAssignments
        bestCost = newCost
        improved = true
      }
    }

    // Converged if no frame improved
    if (!improved) {
      break
    }
  }

  return { assignments, totalCost: bestCost, iterations }
}
