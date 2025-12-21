/**
 * Pillar shadow / occlusion geometry helpers
 *
 * Used to suppress "impossible" detections where a camera reports a world position
 * that is geometrically behind a pillar from that same camera's viewpoint.
 *
 * This is intentionally similar to the logic in `exit-detection.ts` (shadow cone + ray block),
 * but extracted so the detection pipeline can apply it before track creation/association.
 */
import type { SiteMapObstacle } from '../config/sitemap-loader.js'
import type { Point2D } from './fov-geometry.js'
import { distance } from './fov-geometry.js'

function isRayBlockedByPillar(cameraPos: Point2D, targetPoint: Point2D, pillar: SiteMapObstacle): boolean {
  if (pillar.type !== 'circle' || pillar.radius === undefined || !pillar.position) return false

  const dx = targetPoint.x - cameraPos.x
  const dy = targetPoint.y - cameraPos.y
  const rayLength = Math.sqrt(dx * dx + dy * dy)
  if (rayLength < 0.001) return false

  const dirX = dx / rayLength
  const dirY = dy / rayLength

  const toPillarX = pillar.position.x - cameraPos.x
  const toPillarY = pillar.position.y - cameraPos.y
  const projection = toPillarX * dirX + toPillarY * dirY

  if (projection < 0 || projection > rayLength) return false

  const closestX = cameraPos.x + dirX * projection
  const closestY = cameraPos.y + dirY * projection
  const distToPillar = distance({ x: closestX, y: closestY }, pillar.position)

  return distToPillar <= pillar.radius
}

/**
 * Shadow cone behind a pillar from a camera.
 *
 * @param shadowExtension How far beyond the pillar center to consider "behind" (meters)
 * @param lateralTolerance Additional tolerance (meters) for person width / projection noise
 */
function isPointInPillarShadow(
  cameraPos: Point2D,
  targetPoint: Point2D,
  pillar: SiteMapObstacle,
  shadowExtension: number,
  lateralTolerance: number
): boolean {
  if (pillar.type !== 'circle' || pillar.radius === undefined || !pillar.position) return false

  const toPillarX = pillar.position.x - cameraPos.x
  const toPillarY = pillar.position.y - cameraPos.y
  const distToPillar = Math.sqrt(toPillarX * toPillarX + toPillarY * toPillarY)
  if (distToPillar < pillar.radius + 0.1) return false

  const toTargetX = targetPoint.x - cameraPos.x
  const toTargetY = targetPoint.y - cameraPos.y
  const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY)
  if (distToTarget < 0.001) return false

  // projection length of target onto camera->pillar axis
  const projectionLength = (toTargetX * toPillarX + toTargetY * toPillarY) / distToPillar
  if (projectionLength < distToPillar - pillar.radius) return false

  const shadowHalfAngle = Math.asin(Math.min(1, pillar.radius / distToPillar))

  const angleToTarget = Math.atan2(toTargetY, toTargetX)
  const angleToPillar = Math.atan2(toPillarY, toPillarX)
  let angleDiff = angleToTarget - angleToPillar
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

  if (Math.abs(angleDiff) > shadowHalfAngle) return false

  const distBeyondPillar = projectionLength - distToPillar
  if (distBeyondPillar > shadowExtension) return false

  const perpDist = distToTarget * Math.sin(Math.abs(angleDiff))
  const maxLateralDist =
    pillar.radius + (distBeyondPillar > 0 ? distBeyondPillar * Math.tan(shadowHalfAngle) : 0)

  return perpDist <= maxLateralDist + lateralTolerance
}

export interface PillarShadowCheckConfig {
  /** Only consider obstacles that block view AND tracking */
  requireBlocksView?: boolean
  /** Shadow extension beyond pillar center (meters) */
  shadowExtensionM?: number
  /** Lateral tolerance for projection noise (meters) */
  lateralToleranceM?: number
}

const DEFAULT_CONFIG: Required<PillarShadowCheckConfig> = {
  requireBlocksView: true,
  shadowExtensionM: 2.5,
  lateralToleranceM: 0.35,
}

/**
 * Returns true if the targetPoint is likely occluded by any pillar from the camera.
 */
export function isPointOccludedByAnyPillar(
  cameraPos: Point2D,
  targetPoint: Point2D,
  obstacles: SiteMapObstacle[],
  config: PillarShadowCheckConfig = {}
): boolean {
  const full = { ...DEFAULT_CONFIG, ...config }

  const pillars = obstacles.filter((o) => {
    if (o.type !== 'circle' || o.radius === undefined) return false
    if (o.blocksTracking === false) return false
    if (full.requireBlocksView && o.blocksView !== true) return false
    return true
  })

  for (const pillar of pillars) {
    // Use shadow check first (captures behind-pillar cases), then strict ray-block for close-to-pillar cases.
    if (
      isPointInPillarShadow(
        cameraPos,
        targetPoint,
        pillar,
        full.shadowExtensionM,
        full.lateralToleranceM
      ) ||
      isRayBlockedByPillar(cameraPos, targetPoint, pillar)
    ) {
      return true
    }
  }

  return false
}


