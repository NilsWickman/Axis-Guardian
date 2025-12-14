/**
 * Exit Detection Module
 *
 * Classifies WHY a track disappeared to enable different timeout behaviors:
 * - FOV/Boundary exits → instant removal
 * - Pillar occlusion → ghost track with Kalman prediction
 */

import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import {
  type CameraConfig,
  type RoomBounds,
  type Point2D,
  calculateCombinedFOVPolygons,
  isPointInAnyFOV,
  isPointInRoom,
  distance,
} from './fov-geometry.js'

export type ExitReason = 'fov_exit' | 'boundary_exit' | 'pillar_occlusion' | 'partial_occlusion' | 'timeout' | null

export interface ExitClassificationResult {
  reason: ExitReason
  /** For pillar_occlusion/partial_occlusion: the pillar that is blocking the view */
  occludingPillar?: SiteMapObstacle
  /** For pillar_occlusion: predicted exit point on far side of pillar */
  predictedExitPoint?: Point2D
  /** For pillar_occlusion: estimated time to re-emerge (ms) */
  estimatedReemergenceMs?: number
  /** For partial_occlusion: ratio of cameras blocked (0-1) */
  blockageRatio?: number
}

/**
 * Check if a ray from camera to point is blocked by a pillar
 */
function isRayBlockedByPillar(
  cameraPos: Point2D,
  targetPoint: Point2D,
  pillar: SiteMapObstacle
): boolean {
  if (pillar.type !== 'circle' || pillar.radius === undefined) {
    return false
  }

  // Ray from camera to target point
  const dx = targetPoint.x - cameraPos.x
  const dy = targetPoint.y - cameraPos.y
  const rayLength = Math.sqrt(dx * dx + dy * dy)

  if (rayLength < 0.001) return false

  // Normalized direction
  const dirX = dx / rayLength
  const dirY = dy / rayLength

  // Vector from camera to pillar center
  const toPillarX = pillar.position.x - cameraPos.x
  const toPillarY = pillar.position.y - cameraPos.y

  // Project pillar center onto ray
  const projection = toPillarX * dirX + toPillarY * dirY

  // If projection is negative or beyond target, pillar is not between camera and target
  if (projection < 0 || projection > rayLength) {
    return false
  }

  // Find closest point on ray to pillar center
  const closestX = cameraPos.x + dirX * projection
  const closestY = cameraPos.y + dirY * projection

  // Distance from closest point to pillar center
  const distToPillar = distance(
    { x: closestX, y: closestY },
    pillar.position
  )

  // If distance is less than pillar radius, ray is blocked
  return distToPillar <= pillar.radius
}

/**
 * Result of partial occlusion check
 */
interface PartialOcclusionResult {
  pillar: SiteMapObstacle | null
  /** True if ALL cameras are blocked */
  isFullOcclusion: boolean
  /** True if 50%+ cameras are blocked (but not all) */
  isPartialOcclusion: boolean
  /** Ratio of cameras blocked (0-1) */
  blockageRatio: number
}

/**
 * Find which pillar (if any) is blocking the view from cameras to the point
 * Returns both full occlusion (all cameras blocked) and partial occlusion (50%+ blocked)
 */
function findOccludingPillarWithPartial(
  point: Point2D,
  cameras: CameraConfig[],
  pillars: SiteMapObstacle[]
): PartialOcclusionResult {
  if (cameras.length === 0) {
    return { pillar: null, isFullOcclusion: false, isPartialOcclusion: false, blockageRatio: 0 }
  }

  let bestPillar: SiteMapObstacle | null = null
  let bestBlockageRatio = 0

  for (const pillar of pillars) {
    let blockedCount = 0

    for (const camera of cameras) {
      if (isRayBlockedByPillar(camera.position, point, pillar)) {
        blockedCount++
      }
    }

    const blockageRatio = blockedCount / cameras.length

    // Track the pillar with highest blockage ratio
    if (blockageRatio > bestBlockageRatio) {
      bestBlockageRatio = blockageRatio
      bestPillar = pillar
    }
  }

  return {
    pillar: bestPillar,
    isFullOcclusion: bestBlockageRatio >= 1.0,
    isPartialOcclusion: bestBlockageRatio >= 0.5 && bestBlockageRatio < 1.0,
    blockageRatio: bestBlockageRatio,
  }
}

/**
 * Predict where a track will exit from behind a pillar
 * Based on current velocity and pillar geometry
 */
function predictPillarExit(
  entryPoint: Point2D,
  velocity: Point2D,
  pillar: SiteMapObstacle
): { exitPoint: Point2D; timeMs: number } | null {
  if (pillar.type !== 'circle' || pillar.radius === undefined) {
    return null
  }

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  if (speed < 0.1) {
    // Too slow to predict meaningful exit
    return null
  }

  // Normalize velocity
  const dirX = velocity.x / speed
  const dirY = velocity.y / speed

  // Cast ray from entry point in direction of velocity
  // Find intersection with far side of pillar

  // Vector from entry point to pillar center
  const toCenterX = pillar.position.x - entryPoint.x
  const toCenterY = pillar.position.y - entryPoint.y

  // Project onto velocity direction
  const projection = toCenterX * dirX + toCenterY * dirY

  // Distance from ray to pillar center (perpendicular)
  const perpX = toCenterX - projection * dirX
  const perpY = toCenterY - projection * dirY
  const perpDist = Math.sqrt(perpX * perpX + perpY * perpY)

  if (perpDist > pillar.radius) {
    // Ray doesn't actually pass through pillar
    return null
  }

  // Calculate exit distance using geometry
  // Half-chord length = sqrt(r² - d²) where d is perpendicular distance
  const halfChord = Math.sqrt(pillar.radius * pillar.radius - perpDist * perpDist)

  // Exit point is projection + halfChord along the ray from entry
  const exitDistance = projection + halfChord
  const exitPoint: Point2D = {
    x: entryPoint.x + dirX * exitDistance,
    y: entryPoint.y + dirY * exitDistance,
  }

  // Time to reach exit point
  const timeMs = (exitDistance / speed) * 1000

  return { exitPoint, timeMs }
}

/**
 * Classify why a track has stopped being detected
 *
 * Uses velocity-based prediction to detect when tracks are moving toward
 * FOV/room boundaries, enabling faster cleanup for edge exits.
 *
 * @param position - Last known position of the track
 * @param velocity - Current velocity estimate (from Kalman filter)
 * @param cameras - All camera configurations
 * @param obstacles - All obstacles (pillars, tables, etc.)
 * @param roomBounds - Room dimensions
 * @param fovTolerance - Tolerance for FOV boundary checks (default 0.3m)
 */
export function classifyExitReason(
  position: Point2D,
  velocity: Point2D,
  cameras: CameraConfig[],
  obstacles: SiteMapObstacle[],
  roomBounds: RoomBounds,
  fovTolerance: number = 0.3
): ExitClassificationResult {
  // 1. Check if outside room boundaries (highest priority - person left the area)
  if (!isPointInRoom(position, roomBounds, fovTolerance)) {
    return { reason: 'boundary_exit' }
  }

  // 2. Check if behind a pillar (blocksTracking obstacles)
  const pillars = obstacles.filter(
    (o) => o.blocksTracking && o.type === 'circle'
  )

  const occlusionResult = findOccludingPillarWithPartial(position, cameras, pillars)

  // Full occlusion - all cameras blocked by pillar
  if (occlusionResult.isFullOcclusion && occlusionResult.pillar) {
    const exitPrediction = predictPillarExit(position, velocity, occlusionResult.pillar)

    return {
      reason: 'pillar_occlusion',
      occludingPillar: occlusionResult.pillar,
      predictedExitPoint: exitPrediction?.exitPoint,
      estimatedReemergenceMs: exitPrediction?.timeMs,
      blockageRatio: occlusionResult.blockageRatio,
    }
  }

  // Partial occlusion - 50%+ cameras blocked but not all
  // This catches cases where track is near pillar edge and intermittently visible
  if (occlusionResult.isPartialOcclusion && occlusionResult.pillar) {
    return {
      reason: 'partial_occlusion',
      occludingPillar: occlusionResult.pillar,
      blockageRatio: occlusionResult.blockageRatio,
    }
  }

  // 3. Check if outside combined camera FOV
  const fovPolygons = calculateCombinedFOVPolygons(cameras, roomBounds)
  if (!isPointInAnyFOV(position, fovPolygons, fovTolerance)) {
    return { reason: 'fov_exit' }
  }

  // 4. Use velocity prediction to detect edge exits
  // If the track is moving toward an edge, predict where it will be shortly
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  if (speed > 0.3) { // Only predict if moving at reasonable speed (0.3 m/s)
    // Predict position 300ms into the future
    const lookaheadMs = 300
    const predictedPos: Point2D = {
      x: position.x + velocity.x * (lookaheadMs / 1000),
      y: position.y + velocity.y * (lookaheadMs / 1000),
    }

    // If predicted position is outside room bounds, classify as boundary exit
    if (!isPointInRoom(predictedPos, roomBounds, 0)) {
      return { reason: 'boundary_exit' }
    }

    // If predicted position is outside all FOVs, classify as FOV exit
    if (!isPointInAnyFOV(predictedPos, fovPolygons, 0)) {
      return { reason: 'fov_exit' }
    }
  }

  // 5. Default - standard timeout (track just stopped being detected for unknown reason)
  return { reason: 'timeout' }
}

/**
 * Get the appropriate timeout for an exit reason
 */
export function getTimeoutForExitReason(
  reason: ExitReason,
  config: {
    fovExitTimeoutMs?: number
    boundaryExitTimeoutMs?: number
    maxPillarOcclusionMs?: number
    partialPillarOcclusionMs?: number
    occlusionCoastTimeMs?: number
  }
): number {
  switch (reason) {
    case 'fov_exit':
      return config.fovExitTimeoutMs ?? 500
    case 'boundary_exit':
      return config.boundaryExitTimeoutMs ?? 500
    case 'pillar_occlusion':
      return config.maxPillarOcclusionMs ?? 5000
    case 'partial_occlusion':
      // Shorter timeout than full occlusion since track is still partially visible
      return config.partialPillarOcclusionMs ?? 3000
    case 'timeout':
    default:
      return config.occlusionCoastTimeMs ?? 7000
  }
}

/**
 * Get timeout adjusted for track's embedding quality
 *
 * Higher quality embeddings are more likely to successfully re-identify the track,
 * so we extend the timeout proportionally. This is a principled approach based on
 * the observation that embedding quality correlates with re-ID success rate.
 *
 * Formula: baseTimeout * (1 + qualityBonus * normalizedQuality)
 * - normalizedQuality is scaled to 0-1 above the minQuality threshold
 * - Only applied to pillar/partial/timeout exits where re-ID might succeed
 * - FOV/boundary exits get no bonus (person left the monitored space)
 *
 * @param reason - Why the track disappeared
 * @param embeddingQuality - Track's embedding quality (0-1)
 * @param config - Timeout configuration with quality-adaptive parameters
 */
export function getQualityAdaptiveTimeout(
  reason: ExitReason,
  embeddingQuality: number,
  config: {
    fovExitTimeoutMs?: number
    boundaryExitTimeoutMs?: number
    maxPillarOcclusionMs?: number
    partialPillarOcclusionMs?: number
    occlusionCoastTimeMs?: number
    qualityRetentionBonus?: number
    maxRetentionMultiplier?: number
    minQualityForRetention?: number
  }
): number {
  const baseTimeout = getTimeoutForExitReason(reason, config)

  // Quality-adaptive parameters with defaults
  const qualityBonus = config.qualityRetentionBonus ?? 0.5
  const maxMultiplier = config.maxRetentionMultiplier ?? 1.8
  const minQuality = config.minQualityForRetention ?? 0.3

  // Don't extend for FOV/boundary exits - person left the monitored space
  // Re-ID won't help if they're gone
  if (reason === 'fov_exit' || reason === 'boundary_exit') {
    return baseTimeout
  }

  // Don't extend for low-quality embeddings
  if (embeddingQuality < minQuality) {
    return baseTimeout
  }

  // Scale quality to 0-1 range above threshold
  // This normalizes so minQuality maps to 0 and 1.0 maps to 1
  const normalizedQuality = (embeddingQuality - minQuality) / (1 - minQuality)

  // Calculate multiplier: 1 + (bonus * normalizedQuality), capped at maxMultiplier
  // Examples with default values (bonus=0.5, maxMultiplier=1.8, minQuality=0.3):
  //   quality=0.3 -> normalizedQuality=0 -> multiplier=1.0
  //   quality=0.5 -> normalizedQuality=0.286 -> multiplier=1.143
  //   quality=0.7 -> normalizedQuality=0.571 -> multiplier=1.286
  //   quality=1.0 -> normalizedQuality=1.0 -> multiplier=1.5
  const multiplier = Math.min(1 + qualityBonus * normalizedQuality, maxMultiplier)

  return baseTimeout * multiplier
}

/**
 * Check if a track should be shown as a ghost track
 * (pillar-occluded tracks with predicted positions)
 */
export function shouldShowAsGhostTrack(exitReason: ExitReason): boolean {
  return exitReason === 'pillar_occlusion' || exitReason === 'partial_occlusion'
}
