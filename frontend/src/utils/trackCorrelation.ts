/**
 * Track Correlation Utilities
 *
 * Utilities for correlating person tracks across multiple cameras using
 * spatial proximity analysis.
 */

import type { GlobalTrack, CameraDetection } from '../stores/globalTracks'
import { DEFAULT_CORRELATION_DISTANCE_M } from '../stores/globalTracks'

/**
 * Point in 2D space (meters)
 */
export interface Point2D {
  x: number
  y: number
}

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
 *
 * @param position - New detection world position
 * @param tracks - Array of active tracks to search
 * @param threshold - Maximum distance threshold (default: CORRELATION_DISTANCE_M)
 * @returns Best matching track or null if none within threshold
 */
export function findBestMatch(
  position: Point2D,
  tracks: GlobalTrack[],
  threshold: number = DEFAULT_CORRELATION_DISTANCE_M
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
 *
 * @param position - Center position
 * @param tracks - Array of tracks to search
 * @param radius - Search radius in meters
 * @returns Array of matches sorted by distance
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

  // Sort by distance (closest first)
  return matches.sort((a, b) => a.distance - b.distance)
}

/**
 * Merge multiple world positions into a weighted centroid
 *
 * @param detections - Array of camera detections with positions and confidence
 * @returns Merged position and combined confidence
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

  // Confidence-weighted average
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
 *
 * @param trail - Position history (most recent first)
 * @param deltaMs - Time delta to predict forward
 * @returns Predicted position or null if insufficient data
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

  // Calculate velocity (meters per millisecond)
  const vx = (latest.x - previous.x) / timeDiff
  const vy = (latest.y - previous.y) / timeDiff

  // Predict forward
  return {
    x: latest.x + vx * deltaMs,
    y: latest.y + vy * deltaMs,
  }
}

/**
 * Calculate the correlation score between a new detection and an existing track
 * Higher score = better match
 *
 * @param detection - New detection
 * @param track - Existing track
 * @param maxDistance - Maximum correlation distance
 * @returns Score between 0 and 1, or -1 if no correlation
 */
export function calculateCorrelationScore(
  detection: CameraDetection,
  track: GlobalTrack,
  maxDistance: number = DEFAULT_CORRELATION_DISTANCE_M
): number {
  const position: Point2D = { x: detection.worldX, y: detection.worldY }
  const distance = calculateDistance(position, track.currentPosition)

  // No correlation if beyond max distance
  if (distance > maxDistance) return -1

  // Distance score (1 at center, 0 at max distance)
  const distanceScore = 1 - distance / maxDistance

  // Confidence boost
  const confidenceBoost = detection.confidence * 0.2

  // Existing association boost
  let associationBoost = 0
  if (isTrackAssociatedWith(track, detection.cameraId, detection.trackId)) {
    associationBoost = 0.5 // Strong boost for existing associations
  }

  return Math.min(1, distanceScore + confidenceBoost + associationBoost)
}

/**
 * Check if two positions are within handoff range
 * (person leaving one camera FOV and entering another)
 */
export function isWithinHandoffRange(
  position1: Point2D,
  position2: Point2D,
  handoffRange: number = DEFAULT_CORRELATION_DISTANCE_M * 1.5
): boolean {
  return calculateDistance(position1, position2) <= handoffRange
}
