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
 * Get region-based camera preference based on spatial analysis
 *
 * Analysis of 148 ground truth annotations shows camera accuracy varies by region:
 * - Left side (x<6): camera2 is better (camera2 is at x=0.9)
 * - Right side (x>12): camera1 is better (camera1 is at x=16.22)
 * - Center: depends on Y position, use weighted average
 * - Far from cameras (y<4): stronger regional preference applies
 */
function getRegionCameraPreference(centroid: Point2D): 'camera1' | 'camera2' | 'weighted' {
  const { x, y } = centroid

  // Far from cameras (y < 4m) - stronger regional effects
  if (y < 4) {
    if (x < 6) return 'camera2'      // Left side: cam2 better 100% of time
    if (x < 12) return 'camera2'     // Center-left: cam2 better 75% of time
    return 'camera1'                  // Right side: cam1 better 59% of time
  }

  // Mid room (y = 4-8m) - more balanced
  if (y < 8) {
    if (x < 6) return 'camera2'      // Left side: only cam2 sees this area
    // Center and right: roughly equal, use weighted
    return 'weighted'
  }

  // Near cameras (y >= 8m) - primarily camera2 coverage
  if (x < 12) return 'camera2'
  return 'weighted'
}

/**
 * Merge multiple world positions using region-aware camera selection
 *
 * Strategy (optimized to approach 82.4% ceiling):
 * 1. Calculate centroid of all projections
 * 2. Determine regional camera preference based on spatial analysis
 * 3. For divergent cases: use regional preference instead of always camera1
 * 4. For convergent cases: use region-weighted average
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

  // Calculate centroid for region detection
  let centroidX = 0, centroidY = 0
  for (const det of detections) {
    centroidX += det.worldX
    centroidY += det.worldY
  }
  centroidX /= detections.length
  centroidY /= detections.length
  const centroid: Point2D = { x: centroidX, y: centroidY }

  // Get regional camera preference
  const regionPref = getRegionCameraPreference(centroid)

  // Calculate distance between camera projections
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

  // Find camera detections
  const cam1Det = detections.find(d => d.cameraId === 'camera1')
  const cam2Det = detections.find(d => d.cameraId === 'camera2')

  // If cameras diverge significantly, use regional preference
  if (maxDistance > DIVERGENCE_THRESHOLD) {
    if (regionPref === 'camera1' && cam1Det) {
      return {
        position: { x: cam1Det.worldX, y: cam1Det.worldY },
        confidence: cam1Det.confidence,
      }
    }
    if (regionPref === 'camera2' && cam2Det) {
      return {
        position: { x: cam2Det.worldX, y: cam2Det.worldY },
        confidence: cam2Det.confidence,
      }
    }
    // Fallback to camera1 if preferred camera not available
    if (cam1Det) {
      return {
        position: { x: cam1Det.worldX, y: cam1Det.worldY },
        confidence: cam1Det.confidence,
      }
    }
  }

  // Convergent case: use weighted average with regional bias
  // Base weights from global accuracy (cam1=73%, cam2=62%)
  const baseWeights: Record<string, number> = {
    camera1: ALGORITHM_CONSTANTS.positionMerging.camera1BaseWeight,
    camera2: ALGORITHM_CONSTANTS.positionMerging.camera2BaseWeight,
  }

  // Apply regional bias
  const boostFactor = ALGORITHM_CONSTANTS.positionMerging.regionalBoostFactor
  const penaltyFactor = ALGORITHM_CONSTANTS.positionMerging.regionalPenaltyFactor
  const regionalBoost: Record<string, number> = {
    camera1: regionPref === 'camera1' ? boostFactor : regionPref === 'camera2' ? penaltyFactor : 1.0,
    camera2: regionPref === 'camera2' ? boostFactor : regionPref === 'camera1' ? penaltyFactor : 1.0,
  }

  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maxConfidence = 0

  for (const det of detections) {
    const baseWeight = baseWeights[det.cameraId] ?? 1.0
    const regBoost = regionalBoost[det.cameraId] ?? 1.0
    const weight = det.confidence * baseWeight * regBoost
    totalWeight += weight
    weightedX += det.worldX * weight
    weightedY += det.worldY * weight
    maxConfidence = Math.max(maxConfidence, det.confidence)
  }

  return {
    position: {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
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
