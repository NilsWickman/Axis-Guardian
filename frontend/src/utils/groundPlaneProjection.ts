/**
 * Ground Plane Projection Module
 *
 * A pure, testable implementation for projecting 2D image detections
 * to world coordinates on the ground plane.
 *
 * Coordinate Systems:
 * - Image: Origin at top-left, X-right, Y-down (pixels)
 * - Camera: Origin at camera, X-right, Y-down, Z-forward
 * - World: Origin at site map origin, X-right (East), Y-up (North), Z-up
 *
 * Assumptions:
 * - Camera azimuth: 0° = North (+Y), 90° = East (+X), increases clockwise
 * - Camera elevation: positive = looking down
 * - Detections are on the ground plane (z = 0)
 */

// ============================================================================
// Types
// ============================================================================

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface CameraParams {
  /** Camera position in world coordinates (meters) */
  position: Point3D
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down from horizontal) */
  elevation: number
  /** Horizontal field of view in degrees */
  fov: number
}

export interface ImageParams {
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

export interface ProjectionResult {
  /** Projected point in world coordinates (meters) */
  worldPoint: Point2D
  /** Distance from camera to projected point (meters) */
  distance: number
  /** Whether the projection is valid */
  isValid: boolean
  /** Reason for invalidity if applicable */
  reason?: string
}

export interface DebugInfo {
  normalizedImagePoint: Point2D
  focalLength: number
  rayCamera: Point3D
  rayWorld: Point3D
  groundIntersectionT: number
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate focal length in pixels from horizontal FOV
 */
export function calculateFocalLength(fovDegrees: number, imageWidth: number): number {
  const fovRadians = (fovDegrees * Math.PI) / 180
  return (imageWidth / 2) / Math.tan(fovRadians / 2)
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Normalize angle to [0, 360) range
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

/**
 * Calculate angular difference between two angles, result in [-180, 180]
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = normalizeAngle(angle1) - normalizeAngle(angle2)
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return diff
}

/**
 * Normalize a 3D vector
 */
export function normalize3D(v: Point3D): Point3D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  if (len === 0) return { x: 0, y: 0, z: 0 }
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

/**
 * Create a ray direction in camera space from a normalized image point
 *
 * @param normalizedX - X coordinate in normalized image space (0 at center, + right)
 * @param normalizedY - Y coordinate in normalized image space (0 at center, + down)
 */
export function createCameraRay(normalizedX: number, normalizedY: number): Point3D {
  // Camera convention: X-right, Y-down, Z-forward
  return normalize3D({
    x: normalizedX,
    y: normalizedY,
    z: 1.0,
  })
}

/**
 * Rotate a vector around the X-axis (pitch/elevation)
 *
 * @param v - Input vector
 * @param angleRad - Rotation angle in radians (positive = rotate Y toward Z)
 */
export function rotateAroundX(v: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: v.x,
    y: v.y * cos - v.z * sin,
    z: v.y * sin + v.z * cos,
  }
}

/**
 * Rotate a vector around the Z-axis (yaw/azimuth)
 *
 * @param v - Input vector
 * @param angleRad - Rotation angle in radians (positive = rotate X toward Y)
 */
export function rotateAroundZ(v: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  }
}

/**
 * Transform a ray from camera space to world space
 *
 * This applies:
 * 1. Elevation rotation (pitch around camera's local X-axis)
 * 2. Coordinate system conversion (camera Y-down to world Z-up)
 * 3. Azimuth rotation (yaw around world Z-axis)
 *
 * Camera space: X-right, Y-down, Z-forward (looking at image from behind camera)
 * World space: X-East, Y-North, Z-up
 *
 * @param rayCamera - Ray direction in camera space
 * @param azimuthDeg - Camera azimuth in degrees (0=North, 90=East, clockwise)
 * @param elevationDeg - Camera elevation in degrees (positive=looking down from horizontal)
 */
export function transformRayToWorld(
  rayCamera: Point3D,
  azimuthDeg: number,
  elevationDeg: number
): Point3D {
  // Step 1: Apply elevation rotation (pitch around X-axis)
  // Positive elevation = camera tilted down = ray points more downward
  // In camera space, "down" is +Y. After rotation, forward (Z) should get some +Y component
  // This means we rotate with negative angle (opposite direction)
  const elevationRad = degToRad(-elevationDeg)
  const rayElevated = rotateAroundX(rayCamera, elevationRad)

  // Step 2: Convert from camera coordinates to world coordinates
  // Camera: X-right, Y-down, Z-forward
  // World: X-East, Y-North, Z-up
  //
  // When azimuth=0 (facing North), we want:
  // - Camera forward (Z+) → World North (Y+)
  // - Camera right (X+) → World East (X+)
  // - Camera down (Y+) → World down (Z-)
  const rayIntermediate: Point3D = {
    x: rayElevated.x,      // Camera right → World East (before azimuth)
    y: rayElevated.z,      // Camera forward → World North (before azimuth)
    z: -rayElevated.y,     // Camera down → World down (negative Z)
  }

  // Step 3: Apply azimuth rotation around world Z-axis
  // Azimuth 0 = North (+Y), 90 = East (+X), 180 = South (-Y), 270 = West (-X)
  // This is clockwise when viewed from above (from +Z)
  // Standard rotateAroundZ is counter-clockwise, so we negate the angle
  const azimuthRad = degToRad(-azimuthDeg)
  const rayWorld = rotateAroundZ(rayIntermediate, azimuthRad)

  return rayWorld
}

/**
 * Find intersection of a ray with the ground plane (z=0)
 *
 * @param origin - Ray origin point
 * @param direction - Ray direction (normalized)
 * @returns Parameter t where intersection occurs, or null if no intersection
 */
export function intersectGroundPlane(
  origin: Point3D,
  direction: Point3D
): number | null {
  // Ground plane: z = 0
  // Ray: P = origin + t * direction
  // Solve: origin.z + t * direction.z = 0
  // t = -origin.z / direction.z

  if (Math.abs(direction.z) < 0.0001) {
    // Ray is nearly parallel to ground
    return null
  }

  const t = -origin.z / direction.z

  // Only valid if intersection is in front of camera
  if (t < 0) {
    return null
  }

  return t
}

/**
 * Project an image point to world coordinates on the ground plane
 *
 * @param imagePoint - Point in image coordinates (pixels from top-left)
 * @param camera - Camera parameters
 * @param image - Image dimensions
 * @returns Projection result with world coordinates
 */
export function projectToGround(
  imagePoint: Point2D,
  camera: CameraParams,
  image: ImageParams
): ProjectionResult & { debug: DebugInfo } {
  // Calculate focal length
  const focalLength = calculateFocalLength(camera.fov, image.width)

  // Principal point (image center)
  const cx = image.width / 2
  const cy = image.height / 2

  // Normalize image coordinates relative to principal point and focal length
  const normalizedX = (imagePoint.x - cx) / focalLength
  const normalizedY = (imagePoint.y - cy) / focalLength

  // Create ray in camera space
  const rayCamera = createCameraRay(normalizedX, normalizedY)

  // Transform ray to world space
  const rayWorld = transformRayToWorld(rayCamera, camera.azimuth, camera.elevation)

  // Find ground intersection
  const cameraOrigin: Point3D = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  }
  const t = intersectGroundPlane(cameraOrigin, rayWorld)

  const debug: DebugInfo = {
    normalizedImagePoint: { x: normalizedX, y: normalizedY },
    focalLength,
    rayCamera,
    rayWorld,
    groundIntersectionT: t ?? -1,
  }

  // Handle no intersection
  if (t === null) {
    return {
      worldPoint: { x: 0, y: 0 },
      distance: 0,
      isValid: false,
      reason: 'no_ground_intersection',
      debug,
    }
  }

  // Calculate world point
  const worldPoint: Point2D = {
    x: cameraOrigin.x + rayWorld.x * t,
    y: cameraOrigin.y + rayWorld.y * t,
  }

  // Calculate distance from camera
  const distance = Math.sqrt(
    Math.pow(worldPoint.x - camera.position.x, 2) +
    Math.pow(worldPoint.y - camera.position.y, 2)
  )

  if (distance < 0.1) {
    return {
      worldPoint,
      distance,
      isValid: false,
      reason: 'too_close',
      debug,
    }
  }

  return {
    worldPoint,
    distance,
    isValid: true,
    debug,
  }
}

/**
 * Check if a world point is within the camera's horizontal FOV
 *
 * @param worldPoint - Point in world coordinates (meters)
 * @param camera - Camera parameters
 */
export function isInHorizontalFOV(worldPoint: Point2D, camera: CameraParams): boolean {
  // Vector from camera to point
  const dx = worldPoint.x - camera.position.x
  const dy = worldPoint.y - camera.position.y

  // Angle from camera to point
  // atan2(dx, dy) gives angle from +Y axis (North), positive clockwise
  const angleToPoint = radToDeg(Math.atan2(dx, dy))

  // Calculate angular difference
  const diff = Math.abs(angleDifference(angleToPoint, camera.azimuth))

  return diff <= camera.fov / 2
}

// ============================================================================
// High-Level API
// ============================================================================

export interface DetectionBBox {
  /** X coordinate of top-left corner (pixels or normalized 0-1) */
  x: number
  /** Y coordinate of top-left corner (pixels or normalized 0-1) */
  y: number
  /** Width (pixels or normalized 0-1) */
  width: number
  /** Height (pixels or normalized 0-1) */
  height: number
}

/**
 * Get the bottom-center of a bounding box (person's feet position)
 *
 * @param bbox - Bounding box
 * @param isNormalized - If true, bbox coordinates are in 0-1 range
 * @param imageWidth - Image width (required if normalized)
 * @param imageHeight - Image height (required if normalized)
 */
export function getBBoxBottomCenter(
  bbox: DetectionBBox,
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): Point2D {
  if (isNormalized) {
    return {
      x: (bbox.x + bbox.width / 2) * imageWidth,
      y: (bbox.y + bbox.height) * imageHeight,
    }
  }
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height,
  }
}

/**
 * Project a detection bounding box to world coordinates
 *
 * @param bbox - Detection bounding box
 * @param camera - Camera parameters
 * @param isNormalized - If true, bbox coordinates are in 0-1 range
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 */
export function projectDetectionToGround(
  bbox: DetectionBBox,
  camera: CameraParams,
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): ProjectionResult & { debug: DebugInfo } {
  const imagePoint = getBBoxBottomCenter(bbox, isNormalized, imageWidth, imageHeight)
  return projectToGround(imagePoint, camera, { width: imageWidth, height: imageHeight })
}

// ============================================================================
// Utility: Convert from sitemap config format
// ============================================================================

export interface SiteMapCameraConfig {
  id: string
  position: { x: number; y: number }
  /** Azimuth angle in degrees (0 = North/+Y, 90 = East/+X, clockwise) */
  azimuth: number
  /** Elevation angle in degrees (positive = looking down). Default: 45 */
  elevation?: number
  /** Camera mount height in meters */
  height: number
  /** Horizontal field of view in degrees */
  fieldOfView: number
}

// Default elevation angle when not specified
const DEFAULT_ELEVATION_DEG = 45

/**
 * Convert sitemap camera config to CameraParams
 */
export function siteMapConfigToCamera(config: SiteMapCameraConfig): CameraParams {
  return {
    position: {
      x: config.position.x,
      y: config.position.y,
      z: config.height,
    },
    azimuth: config.azimuth,
    elevation: config.elevation ?? DEFAULT_ELEVATION_DEG,
    fov: config.fieldOfView,
  }
}
