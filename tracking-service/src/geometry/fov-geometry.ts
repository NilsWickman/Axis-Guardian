/**
 * FOV Geometry Utilities
 *
 * Provides field-of-view polygon calculations and point-in-polygon checks
 * for track exit detection and spawn/disappear validation.
 */

import {
  type Point2D,
  type LineSegment,
  distance,
  normalizeAngle,
} from './primitives.js'
import { isPointInPolygon, isPointNearPolygonEdge } from './polygon.js'

// Re-export for backward compatibility
export type { Point2D, LineSegment }
export { distance, isPointInPolygon }

export interface CameraConfig {
  id: string
  position: Point2D
  azimuth: number // degrees, 0 = North (+Y), clockwise
  fieldOfView: number // degrees
  maxDistance?: number // meters, defaults to room diagonal
}

export interface RoomBounds {
  width: number
  height: number
}

export interface DoorZone {
  id: string
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  tolerance: number // meters
}

/**
 * Default door zone in the top-right area of the room
 */
export const DOOR_ZONES: DoorZone[] = [
  {
    id: 'door-top-right',
    bounds: { minX: 15, maxX: 18, minY: 11, maxY: 12 },
    tolerance: 1.0, // 1m tolerance for entry/exit
  },
]

/**
 * Get intersection of two line segments
 * Returns null if they don't intersect
 */
export function getLineIntersection(line1: LineSegment, line2: LineSegment): Point2D | null {
  const x1 = line1.start.x
  const y1 = line1.start.y
  const x2 = line1.end.x
  const y2 = line1.end.y
  const x3 = line2.start.x
  const y3 = line2.start.y
  const x4 = line2.end.x
  const y4 = line2.end.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  // Lines are parallel
  if (Math.abs(denom) < 1e-10) {
    return null
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    }
  }

  return null
}

/**
 * Cast a ray from origin in given direction and find closest wall intersection
 */
export function castRay(
  origin: Point2D,
  direction: { x: number; y: number },
  maxDistance: number,
  walls: LineSegment[]
): Point2D {
  const rayEnd: Point2D = {
    x: origin.x + direction.x * maxDistance,
    y: origin.y + direction.y * maxDistance,
  }

  const ray: LineSegment = { start: origin, end: rayEnd }

  let closestIntersection: Point2D | null = null
  let closestDistance = Infinity

  for (const wall of walls) {
    const intersection = getLineIntersection(ray, wall)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < closestDistance) {
        closestDistance = dist
        closestIntersection = intersection
      }
    }
  }

  return closestIntersection || rayEnd
}

/**
 * Check if angle is within FOV bounds (handling wrap-around)
 */
function isAngleInFOV(angle: number, leftAngle: number, rightAngle: number): boolean {
  const a = normalizeAngle(angle)
  const left = normalizeAngle(leftAngle)
  const right = normalizeAngle(rightAngle)

  if (right >= left) {
    // Normal case: FOV doesn't wrap around
    return a >= left && a <= right
  } else {
    // FOV wraps around 0/2π
    return a >= left || a <= right
  }
}

/**
 * Create walls from room bounds
 */
export function createRoomWalls(room: RoomBounds): LineSegment[] {
  return [
    { start: { x: 0, y: 0 }, end: { x: room.width, y: 0 } }, // bottom
    { start: { x: room.width, y: 0 }, end: { x: room.width, y: room.height } }, // right
    { start: { x: room.width, y: room.height }, end: { x: 0, y: room.height } }, // top
    { start: { x: 0, y: room.height }, end: { x: 0, y: 0 } }, // left
  ]
}

/**
 * Calculate FOV polygon for a single camera
 * Returns an array of points forming the visible area polygon
 */
export function calculateCameraFOVPolygon(camera: CameraConfig, room: RoomBounds): Point2D[] {
  const walls = createRoomWalls(room)
  const maxDistance = camera.maxDistance || Math.sqrt(room.width ** 2 + room.height ** 2)

  // Convert from azimuth (0° = North/+Y, clockwise) to math angle (0° = East/+X, counter-clockwise)
  // Azimuth 0° = North = +Y = math 90°
  // Azimuth 90° = East = +X = math 0°
  // So: mathAngle = 90° - azimuth (in degrees)
  const canvasAngle = 90 - camera.azimuth
  const rotationRad = (canvasAngle * Math.PI) / 180
  const halfFovRad = (camera.fieldOfView / 2) * (Math.PI / 180)

  // Calculate the two edge angles of the FOV
  const leftAngle = rotationRad - halfFovRad
  const rightAngle = rotationRad + halfFovRad

  // Collect angles to cast rays at
  const angles: number[] = []

  // Add regular sweep angles for smooth FOV edges
  const numRays = Math.max(Math.floor(camera.fieldOfView / 2), 20)
  const angleStep = (camera.fieldOfView * Math.PI / 180) / numRays
  for (let i = 0; i <= numRays; i++) {
    angles.push(rightAngle - i * angleStep)
  }

  // Add angles to wall endpoints (corners)
  const corners = [
    { x: 0, y: 0 },
    { x: room.width, y: 0 },
    { x: room.width, y: room.height },
    { x: 0, y: room.height },
  ]

  for (const corner of corners) {
    const dx = corner.x - camera.position.x
    const dy = corner.y - camera.position.y
    const angle = Math.atan2(dy, dx)
    if (isAngleInFOV(angle, leftAngle, rightAngle)) {
      angles.push(angle)
      angles.push(angle + 0.0001)
      angles.push(angle - 0.0001)
    }
  }

  // Sort angles (right to left for clockwise sweep)
  angles.sort((a, b) => b - a)

  // Remove duplicate angles
  const uniqueAngles: number[] = []
  for (const angle of angles) {
    if (uniqueAngles.length === 0 || Math.abs(angle - uniqueAngles[uniqueAngles.length - 1]) > 0.00005) {
      uniqueAngles.push(angle)
    }
  }

  // Cast rays and collect hit points
  const points: Point2D[] = [camera.position]

  for (const angle of uniqueAngles) {
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    }
    const hitPoint = castRay(camera.position, direction, maxDistance, walls)
    points.push(hitPoint)
  }

  return points
}

/**
 * Calculate combined FOV from multiple cameras
 * Returns array of polygons (one per camera) since union is complex
 */
export function calculateCombinedFOVPolygons(cameras: CameraConfig[], room: RoomBounds): Point2D[][] {
  return cameras.map((camera) => calculateCameraFOVPolygon(camera, room))
}

/**
 * Check if a point is inside ANY of the camera FOVs
 */
export function isPointInAnyFOV(point: Point2D, fovPolygons: Point2D[][], tolerance: number = 0.5): boolean {
  for (const polygon of fovPolygons) {
    if (isPointInPolygon(point, polygon)) {
      return true
    }
    // Also check if point is within tolerance distance of the polygon
    // This handles edge cases near FOV boundaries
    if (isPointNearPolygonEdge(point, polygon, tolerance)) {
      return true
    }
  }
  return false
}

/**
 * Check if a point is near any door zone
 */
export function isPointNearDoor(
  point: Point2D,
  doorZones: DoorZone[] = DOOR_ZONES
): { nearDoor: boolean; doorId?: string } {
  for (const door of doorZones) {
    const expandedBounds = {
      minX: door.bounds.minX - door.tolerance,
      maxX: door.bounds.maxX + door.tolerance,
      minY: door.bounds.minY - door.tolerance,
      maxY: door.bounds.maxY + door.tolerance,
    }

    if (
      point.x >= expandedBounds.minX &&
      point.x <= expandedBounds.maxX &&
      point.y >= expandedBounds.minY &&
      point.y <= expandedBounds.maxY
    ) {
      return { nearDoor: true, doorId: door.id }
    }
  }
  return { nearDoor: false }
}

/**
 * Check if a point is within room bounds
 */
export function isPointInRoom(point: Point2D, room: RoomBounds, tolerance: number = 0.1): boolean {
  return (
    point.x >= -tolerance &&
    point.x <= room.width + tolerance &&
    point.y >= -tolerance &&
    point.y <= room.height + tolerance
  )
}

/**
 * Validate spawn location
 * Returns validation result with reason
 */
export interface ValidationResult {
  valid: boolean
  reason: 'first_frame' | 'outside_fov' | 'door_entry' | 'physics_violation'
  details?: string
}

export function validateSpawnLocation(
  point: Point2D,
  isFirstFrame: boolean,
  fovPolygons: Point2D[][],
  doorZones: DoorZone[] = DOOR_ZONES,
  fovTolerance: number = 0.5
): ValidationResult {
  // Valid if first frame
  if (isFirstFrame) {
    return { valid: true, reason: 'first_frame' }
  }

  // Valid if near door
  const doorCheck = isPointNearDoor(point, doorZones)
  if (doorCheck.nearDoor) {
    return { valid: true, reason: 'door_entry', details: doorCheck.doorId }
  }

  // Valid if outside all FOVs
  const inFOV = isPointInAnyFOV(point, fovPolygons, fovTolerance)
  if (!inFOV) {
    return { valid: true, reason: 'outside_fov' }
  }

  // Invalid - spawned inside FOV after first frame
  return {
    valid: false,
    reason: 'physics_violation',
    details: `Track spawned at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) inside FOV after first frame`,
  }
}

/**
 * Validate disappearance location
 */
export function validateDisappearanceLocation(
  point: Point2D,
  _isLastFrame: boolean,
  fovPolygons: Point2D[][],
  doorZones: DoorZone[] = DOOR_ZONES,
  fovTolerance: number = 0.5
): ValidationResult {
  // Valid if near door
  const doorCheck = isPointNearDoor(point, doorZones)
  if (doorCheck.nearDoor) {
    return { valid: true, reason: 'door_entry', details: doorCheck.doorId }
  }

  // Valid if outside all FOVs
  const inFOV = isPointInAnyFOV(point, fovPolygons, fovTolerance)
  if (!inFOV) {
    return { valid: true, reason: 'outside_fov' }
  }

  // Invalid - disappeared inside FOV
  return {
    valid: false,
    reason: 'physics_violation',
    details: `Track disappeared at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) inside FOV`,
  }
}
