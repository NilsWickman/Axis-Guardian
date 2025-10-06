import type { CameraPlacement, Wall } from '../stores/siteMaps'

export interface ValidationWarning {
  type: 'blocked' | 'too-close' | 'no-coverage'
  message: string
  severity: 'warning' | 'error'
}

export function useCameraValidation() {
  const validateCamera = (camera: CameraPlacement, walls: Wall[]): ValidationWarning[] => {
    const warnings: ValidationWarning[] = []

    // Check if camera has very low view distance
    if (camera.viewDistance < 50) {
      warnings.push({
        type: 'no-coverage',
        message: 'View distance is very low (< 50px)',
        severity: 'warning'
      })
    }

    // Check if camera angle is pointing straight down
    if (camera.angle > 80) {
      warnings.push({
        type: 'no-coverage',
        message: 'Camera angle is too steep (> 80°), may only see floor',
        severity: 'warning'
      })
    }

    // Check if camera is too close to a wall in its viewing direction
    const distanceToWall = getDistanceToNearestWallInDirection(camera, walls)
    if (distanceToWall !== null && distanceToWall < 30) {
      warnings.push({
        type: 'too-close',
        message: `Camera is very close to a wall (${Math.round(distanceToWall)}px)`,
        severity: 'warning'
      })
    }

    // Check if FOV is unusually narrow
    if (camera.fov < 45) {
      warnings.push({
        type: 'no-coverage',
        message: 'Field of view is very narrow (< 45°)',
        severity: 'warning'
      })
    }

    return warnings
  }

  const getDistanceToNearestWallInDirection = (camera: CameraPlacement, walls: Wall[]): number | null => {
    const angleRad = (camera.rotation * Math.PI) / 180
    const dirX = Math.cos(angleRad)
    const dirY = Math.sin(angleRad)

    let minDistance: number | null = null

    for (const wall of walls) {
      // Ray-line intersection
      const distance = rayLineIntersection(
        camera.x,
        camera.y,
        dirX,
        dirY,
        wall.start.x,
        wall.start.y,
        wall.end.x,
        wall.end.y
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
