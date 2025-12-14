import type { CameraPlacement, Wall } from '../types/site-map-types'
import { extractValue } from '../utils/siteMapConversion'

export interface ValidationWarning {
  type: 'blocked' | 'too-close' | 'no-coverage'
  message: string
  severity: 'warning' | 'error'
}

export function useCameraValidation() {
  const validateCamera = (camera: CameraPlacement, walls: Wall[]): ValidationWarning[] => {
    const warnings: ValidationWarning[] = []

    const elevation = extractValue(camera.elevation)
    const height = extractValue(camera.height)
    const fov = extractValue(camera.fov)

    // Calculate effective view distance from height and elevation
    const viewDistance = elevation > 0 ? height / Math.tan(elevation * Math.PI / 180) : 20

    // Check if camera has very low view distance
    if (viewDistance < 0.5) {  // Less than 0.5 meters
      warnings.push({
        type: 'no-coverage',
        message: 'View distance is very low (< 0.5m)',
        severity: 'warning'
      })
    }

    // Check if camera angle is pointing straight down
    if (elevation > 80) {
      warnings.push({
        type: 'no-coverage',
        message: 'Camera elevation is too steep (> 80°), may only see floor',
        severity: 'warning'
      })
    }

    // Check if camera is too close to a wall in its viewing direction
    const distanceToWall = getDistanceToNearestWallInDirection(camera, walls)
    if (distanceToWall !== null && distanceToWall < 0.3) {  // Less than 0.3 meters
      warnings.push({
        type: 'too-close',
        message: `Camera is very close to a wall (${(distanceToWall * 100).toFixed(0)}cm)`,
        severity: 'warning'
      })
    }

    // Check if FOV is unusually narrow
    if (fov < 45) {
      warnings.push({
        type: 'no-coverage',
        message: 'Field of view is very narrow (< 45°)',
        severity: 'warning'
      })
    }

    return warnings
  }

  const getDistanceToNearestWallInDirection = (camera: CameraPlacement, walls: Wall[]): number | null => {
    const azimuth = extractValue(camera.azimuth)
    const angleRad = (azimuth * Math.PI) / 180
    const dirX = Math.cos(angleRad)
    const dirY = Math.sin(angleRad)
    const cameraX = extractValue(camera.position.x)
    const cameraY = extractValue(camera.position.y)

    let minDistance: number | null = null

    for (const wall of walls) {
      // Ray-line intersection
      const distance = rayLineIntersection(
        cameraX,
        cameraY,
        dirX,
        dirY,
        extractValue(wall.start.x),
        extractValue(wall.start.y),
        extractValue(wall.end.x),
        extractValue(wall.end.y)
      )

      if (distance !== null && (minDistance === null || distance < minDistance)) {
        minDistance = distance
      }
    }

    return minDistance
  }

  return {
    validateCamera
  }
}

// Helper: Ray-line segment intersection
function rayLineIntersection(
  rayX: number,
  rayY: number,
  rayDirX: number,
  rayDirY: number,
  lineX1: number,
  lineY1: number,
  lineX2: number,
  lineY2: number
): number | null {
  const v1x = rayX - lineX1
  const v1y = rayY - lineY1
  const v2x = lineX2 - lineX1
  const v2y = lineY2 - lineY1
  const v3x = -rayDirY
  const v3y = rayDirX

  const dot = v2x * v3x + v2y * v3y

  if (Math.abs(dot) < 0.000001) {
    return null
  }

  const t1 = (v2x * v1y - v2y * v1x) / dot
  const t2 = (v1x * v3x + v1y * v3y) / dot

  if (t1 >= 0.0 && t2 >= 0.0 && t2 <= 1.0) {
    return t1
  }

  return null
}
