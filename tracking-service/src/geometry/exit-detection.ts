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

export type ExitReason = 'fov_exit' | 'boundary_exit' | 'pillar_occlusion' | 'timeout' | null

export interface ExitClassificationResult {
  reason: ExitReason
  /** For pillar_occlusion: the pillar that is blocking the view */
  occludingPillar?: SiteMapObstacle
  /** For pillar_occlusion: predicted exit point on far side of pillar */
  predictedExitPoint?: Point2D
  /** For pillar_occlusion: estimated time to re-emerge (ms) */
  estimatedReemergenceMs?: number
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
 * Find which pillar (if any) is blocking the view from all cameras to the point
 */
function findOccludingPillar(
  point: Point2D,
  cameras: CameraConfig[],
  pillars: SiteMapObstacle[]
): SiteMapObstacle | null {
  // For each pillar, check if it blocks ALL cameras
  for (const pillar of pillars) {
    let blocksAllCameras = true

    for (const camera of cameras) {
      if (!isRayBlockedByPillar(camera.position, point, pillar)) {
        blocksAllCameras = false
        break
      }
    }

    if (blocksAllCameras) {
      return pillar
    }
  }

  return null
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

  const occludingPillar = findOccludingPillar(position, cameras, pillars)
  if (occludingPillar) {
    const exitPrediction = predictPillarExit(position, velocity, occludingPillar)

    return {
      reason: 'pillar_occlusion',
      occludingPillar,
      predictedExitPoint: exitPrediction?.exitPoint,
      estimatedReemergenceMs: exitPrediction?.timeMs,
    }
  }

  // 3. Check if outside combined camera FOV
  const fovPolygons = calculateCombinedFOVPolygons(cameras, roomBounds)
  if (!isPointInAnyFOV(position, fovPolygons, fovTolerance)) {
    return { reason: 'fov_exit' }
  }

  // 4. Default - standard timeout (track just stopped being detected for unknown reason)
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
    case 'timeout':
    default:
      return config.occlusionCoastTimeMs ?? 7000
  }
}

/**
 * Check if a track should be shown as a ghost track
 * (pillar-occluded tracks with predicted positions)
 */
export function shouldShowAsGhostTrack(exitReason: ExitReason): boolean {
  return exitReason === 'pillar_occlusion'
}
