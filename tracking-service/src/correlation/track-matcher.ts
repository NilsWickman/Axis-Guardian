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
 * Merge multiple world positions into a weighted centroid
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

  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maxConfidence = 0

  for (const det of detections) {
    const weight = det.confidence
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
