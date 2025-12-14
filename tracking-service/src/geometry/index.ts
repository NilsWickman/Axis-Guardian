/**
 * Geometry Module - Barrel export for all geometry utilities
 *
 * This module provides geometric operations for:
 * - Point/line primitives and distance calculations
 * - Polygon operations (point-in-polygon, edge distance)
 * - Camera FOV calculations
 * - Obstacle collision detection
 * - Track exit detection
 */

// Core primitives
export {
  type Point2D,
  type Point3D,
  type LineSegment,
  distance,
  distanceSquared,
  normalizeAngle,
  angleDifference,
  degreesToRadians,
  radiansToDegrees,
  clamp,
  lerp,
  lerpPoint2D,
} from './primitives.js'

// Polygon utilities
export {
  isPointInPolygon,
  distanceToLineSegment,
  getPolygonEdges,
  isPointNearPolygonEdge,
  distanceToPolygon,
  polygonCentroid,
} from './polygon.js'

// FOV geometry
export {
  type CameraConfig,
  type RoomBounds,
  type DoorZone,
  DOOR_ZONES,
  getLineIntersection,
  castRay,
  createRoomWalls,
  calculateCameraFOVPolygon,
  calculateCombinedFOVPolygons,
  isPointInAnyFOV,
  isPointNearDoor,
  isPointInRoom,
  validateSpawnLocation,
  validateDisappearanceLocation,
} from './fov-geometry.js'

// Obstacle geometry
export {
  isPointInsideObstacle,
  isPointInsideAnyObstacle,
  findObstacleContainingPoint,
  distanceToObstacle,
  doesPathIntersectObstacle,
  doesPathIntersectAnyObstacle,
  getObstacleBufferRadius,
  findRayTableIntersection,
  findOccludingTables,
} from './obstacles.js'

// Exit detection
export {
  type ExitReason,
  type ExitClassificationResult,
  classifyExitReason,
  getTimeoutForExitReason,
  shouldShowAsGhostTrack,
} from './exit-detection.js'
