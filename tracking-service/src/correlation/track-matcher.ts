/**
 * Track Correlation Utilities
 *
 * Utilities for correlating person tracks across multiple cameras using
 * spatial proximity analysis.
 */

import type {
  Point2D,
  GlobalTrack,
  CameraDetection,
  TrackingConfig,
} from '../types.js'
import { DEFAULT_TRACKING_CONFIG } from '../types.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Calculate squared distance (faster, avoids sqrt for comparisons)
 */
export function calculateDistanceSquared(p1: Point2D, p2: Point2D): number {
  return Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
}

/**
 * Match result with distance information
 */
export interface TrackMatch {
  track: GlobalTrack
  distance: number
}

/**
 * Find the best matching track within correlation distance
 */
export function findBestMatch(
  position: Point2D,
  tracks: GlobalTrack[],
  threshold: number = DEFAULT_TRACKING_CONFIG.correlationDistanceM
): TrackMatch | null {
  let bestMatch: TrackMatch | null = null

  for (const track of tracks) {
    if (!track.isActive) continue

    const distance = calculateDistance(position, track.currentPosition)

    if (distance < threshold) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { track, distance }
      }
    }
  }

  return bestMatch
}

/**
 * Find all tracks within a given radius
 */
export function findTracksInRadius(
  position: Point2D,
  tracks: GlobalTrack[],
  radius: number
): TrackMatch[] {
  const matches: TrackMatch[] = []

  for (const track of tracks) {
    if (!track.isActive) continue

    const distance = calculateDistance(position, track.currentPosition)

    if (distance <= radius) {
      matches.push({ track, distance })
    }
  }

  return matches.sort((a, b) => a.distance - b.distance)
}

/**
 * Calculate inverse-distance weight for a camera based on distance to a reference point.
 * Cameras closer to the reference point get higher weights.
 *
 * Uses inverse square distance: weight = 1 / (distance^2 + epsilon)
 * The epsilon prevents division by zero and reduces extreme weights for very close objects.
 *
 * @param referencePoint - The point to measure distance from (typically the centroid)
 * @param cameraPosition - Camera position in world coordinates
 * @returns Weight (higher = camera closer to reference point)
 */
function calculateCameraDistanceWeight(
  referencePoint: Point2D,
  cameraPosition: Point2D | undefined
): number {
  if (!cameraPosition) {
    // Fallback if camera position not available
    return 1.0
  }

  const distance = calculateDistance(referencePoint, cameraPosition)

  // Inverse square weighting with minimum distance to prevent extreme weights
  // epsilon = 1.0 means at 1m distance, weight = 0.5; at 2m, weight = 0.2
  const epsilon = ALGORITHM_CONSTANTS.positionMerging.distanceWeightEpsilon
  return 1.0 / (distance * distance + epsilon)
}

/**
 * Merge multiple world positions using distance-based camera weighting
 *
 * Strategy:
 * - Calculate centroid of all projections first (rough estimate of true position)
 * - Weight cameras by their distance to the CENTROID (not their own projection)
 * - This avoids the problem of using wrong projections to determine weights
 * - For divergent projections: use closest camera to centroid
 * - For convergent projections: use distance-weighted average
 */
export function mergeWorldPositions(
  detections: CameraDetection[]
): { position: Point2D; confidence: number } {
  if (detections.length === 0) {
    return { position: { x: 0, y: 0 }, confidence: 0 }
  }

  if (detections.length === 1) {
    return {
      position: { x: detections[0].worldX, y: detections[0].worldY },
      confidence: detections[0].confidence,
    }
  }

  // Calculate centroid - our best estimate of true position
  let centroidX = 0, centroidY = 0
  for (const det of detections) {
    centroidX += det.worldX
    centroidY += det.worldY
  }
  centroidX /= detections.length
  centroidY /= detections.length
  const centroid: Point2D = { x: centroidX, y: centroidY }

  // Calculate distance between camera projections to detect divergence
  const DIVERGENCE_THRESHOLD = ALGORITHM_CONSTANTS.positionMerging.divergenceThreshold
  let maxDistance = 0
  for (let i = 0; i < detections.length; i++) {
    for (let j = i + 1; j < detections.length; j++) {
      const dist = calculateDistance(
        { x: detections[i].worldX, y: detections[i].worldY },
        { x: detections[j].worldX, y: detections[j].worldY }
      )
      maxDistance = Math.max(maxDistance, dist)
    }
  }

  // If cameras diverge significantly, use the detection from the camera closest to centroid
  if (maxDistance > DIVERGENCE_THRESHOLD) {
    // Find detection with highest distance weight (camera closest to centroid)
    let bestDet = detections[0]
    let bestWeight = calculateCameraDistanceWeight(centroid, bestDet.cameraPosition)

    for (let i = 1; i < detections.length; i++) {
      const weight = calculateCameraDistanceWeight(centroid, detections[i].cameraPosition)
      if (weight > bestWeight) {
        bestWeight = weight
        bestDet = detections[i]
      }
    }

    return {
      position: { x: bestDet.worldX, y: bestDet.worldY },
      confidence: bestDet.confidence,
    }
  }

  // Convergent case: use distance-weighted average (weights based on distance to centroid)
  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maxConfidence = 0

  for (const det of detections) {
    const distanceWeight = calculateCameraDistanceWeight(centroid, det.cameraPosition)
    const weight = det.confidence * distanceWeight
    totalWeight += weight
    weightedX += det.worldX * weight
    weightedY += det.worldY * weight
    maxConfidence = Math.max(maxConfidence, det.confidence)
  }

  // Guard against division by zero or NaN
  if (totalWeight <= 0 || !Number.isFinite(totalWeight)) {
    // Fallback to centroid
    return {
      position: centroid,
      confidence: maxConfidence > 0 ? maxConfidence : detections[0].confidence,
    }
  }

  const resultX = weightedX / totalWeight
  const resultY = weightedY / totalWeight

  // Validate result is finite
  if (!Number.isFinite(resultX) || !Number.isFinite(resultY)) {
    return {
      position: centroid,
      confidence: maxConfidence > 0 ? maxConfidence : detections[0].confidence,
    }
  }

  return {
    position: {
      x: resultX,
      y: resultY,
    },
    confidence: maxConfidence,
  }
}

/**
 * Check if a track is already associated with a specific camera and track ID
 */
export function isTrackAssociatedWith(
  track: GlobalTrack,
  cameraId: string,
  trackId: number
): boolean {
  const assoc = track.cameraAssociations.get(cameraId)
  return assoc !== undefined && assoc.trackIds.includes(trackId)
}

/**
 * Find existing global track by camera and track ID association
 */
export function findTrackByAssociation(
  tracks: GlobalTrack[],
  cameraId: string,
  trackId: number
): GlobalTrack | null {
  for (const track of tracks) {
    if (!track.isActive) continue
    if (isTrackAssociatedWith(track, cameraId, trackId)) {
      return track
    }
  }
  return null
}

/**
 * Predict position based on velocity (simple linear prediction)
 */
export function predictPosition(
  trail: { x: number; y: number; timestamp: number }[],
  deltaMs: number
): Point2D | null {
  if (trail.length < 2) return null

  const latest = trail[0]
  const previous = trail[1]

  const timeDiff = latest.timestamp - previous.timestamp
  if (timeDiff <= 0) return null

  const vx = (latest.x - previous.x) / timeDiff
  const vy = (latest.y - previous.y) / timeDiff

  return {
    x: latest.x + vx * deltaMs,
    y: latest.y + vy * deltaMs,
  }
}

/**
 * Calculate the correlation score between a detection and a track
 */
export function calculateCorrelationScore(
  detection: CameraDetection,
  track: GlobalTrack,
  config: TrackingConfig = DEFAULT_TRACKING_CONFIG
): number {
  const position: Point2D = { x: detection.worldX, y: detection.worldY }
  const distance = calculateDistance(position, track.currentPosition)

  if (distance > config.correlationDistanceM) return -1

  const distanceScore = 1 - distance / config.correlationDistanceM
  const confidenceBoost = detection.confidence * 0.2

  let associationBoost = 0
  if (isTrackAssociatedWith(track, detection.cameraId, detection.trackId)) {
    associationBoost = 0.5
  }

  return Math.min(1, distanceScore + confidenceBoost + associationBoost)
}

/**
 * Validate velocity between two positions
 */
export function validateVelocity(
  oldPosition: Point2D,
  newPosition: Point2D,
  timeDeltaMs: number,
  maxVelocityMs: number = DEFAULT_TRACKING_CONFIG.maxVelocityMs
): { isValid: boolean; velocity: number; reason?: string } {
  if (timeDeltaMs <= 10) {
    return { isValid: true, velocity: 0 }
  }

  const distance = calculateDistance(oldPosition, newPosition)
  const timeDeltaSeconds = timeDeltaMs / 1000
  const velocity = distance / timeDeltaSeconds

  if (velocity > maxVelocityMs) {
    return {
      isValid: false,
      velocity,
      reason: `velocity ${velocity.toFixed(2)} m/s exceeds max ${maxVelocityMs} m/s`,
    }
  }

  return { isValid: true, velocity }
}

/**
 * Check if two positions are within handoff range
 */
export function isWithinHandoffRange(
  position1: Point2D,
  position2: Point2D,
  handoffRange: number = DEFAULT_TRACKING_CONFIG.correlationDistanceM * 1.5
): boolean {
  return calculateDistance(position1, position2) <= handoffRange
}
