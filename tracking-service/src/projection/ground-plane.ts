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

import type {
  Point2D,
  Point3D,
  CameraParams,
  ImageParams,
  ProjectionResult,
  DebugInfo,
  DetectionBBox,
  SiteMapCameraConfig,
  CameraCalibration,
  WorldTransform,
} from '../types.js'
import { undistortPoint } from './lens-distortion.js'
import { findOccludingTables, type Point3D as ObstaclePoint3D } from '../geometry/obstacles.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'

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
 */
export function createCameraRay(normalizedX: number, normalizedY: number): Point3D {
  return normalize3D({
    x: normalizedX,
    y: normalizedY,
    z: 1.0,
  })
}

/**
 * Rotate a vector around the X-axis (pitch/elevation)
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
 * Elevation convention:
 * - The sitemap uses: negative = looking down, positive = looking up
 * - In our rotation math: positive angle = pitch down (ray direction tilts toward -Y in camera space)
 * - We negate the elevation to convert: sitemap -5° becomes internal +5° = looking down
 */
export function transformRayToWorld(
  rayCamera: Point3D,
  azimuthDeg: number,
  elevationDeg: number
): Point3D {
  // Step 1: Apply elevation rotation (pitch around X-axis)
  // Positive elevation = camera looking down toward ground
  // Negate because rotateAroundX rotates Y toward Z (up in camera space)
  // but we want positive elevation to rotate toward -Y (down in camera space)
  const elevationRad = degToRad(-elevationDeg)
  const rayElevated = rotateAroundX(rayCamera, elevationRad)

  // Step 2: Convert from camera coordinates to world coordinates
  // Camera space: X=right, Y=down, Z=forward
  // World space:  X=east, Y=north, Z=up
  // Mapping: camera Z (forward) → world Y (north when azimuth=0)
  //          camera X (right) → world X (east when azimuth=0), negated for handedness
  //          camera Y (down) → world Z: negate because looking down in camera = negative Z in world
  const rayIntermediate: Point3D = {
    x: -rayElevated.x,
    y: rayElevated.z,
    z: -rayElevated.y,
  }

  // Step 3: Apply azimuth rotation around world Z-axis
  // Azimuth convention: 0° = North (+Y), 90° = East (+X), clockwise
  // Negate because rotateAroundZ is counter-clockwise positive
  const azimuthRad = degToRad(-azimuthDeg)
  const rayWorld = rotateAroundZ(rayIntermediate, azimuthRad)

  return rayWorld
}

/**
 * Find intersection of a ray with the ground plane (z=0)
 */
export function intersectGroundPlane(
  origin: Point3D,
  direction: Point3D
): number | null {
  // Use a much smaller threshold to handle shallow elevation angles
  if (Math.abs(direction.z) < 1e-10) {
    return null
  }

  const t = -origin.z / direction.z

  // Reject if intersection is behind the camera or unreasonably far (>1000m)
  if (t < 0 || t > 1000) {
    return null
  }

  return t
}

/**
 * Project an image point to world coordinates on the ground plane
 */
export function projectToGround(
  imagePoint: Point2D,
  camera: CameraParams,
  image: ImageParams
): ProjectionResult & { debug: DebugInfo } {
  const focalLength = calculateFocalLength(camera.fov, image.width)

  const cx = image.width / 2
  const cy = image.height / 2

  // Standard pinhole camera model: positive X in image = right side of frame
  const normalizedX = (imagePoint.x - cx) / focalLength
  const normalizedY = (imagePoint.y - cy) / focalLength

  const rayCamera = createCameraRay(normalizedX, normalizedY)
  const rayWorld = transformRayToWorld(rayCamera, camera.azimuth, camera.elevation)

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

  if (t === null) {
    return {
      worldPoint: { x: 0, y: 0 },
      distance: 0,
      isValid: false,
      reason: 'no_ground_intersection',
      debug,
    }
  }

  const worldPoint: Point2D = {
    x: cameraOrigin.x + rayWorld.x * t,
    y: cameraOrigin.y + rayWorld.y * t,
  }

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
 */
export function isInHorizontalFOV(worldPoint: Point2D, camera: CameraParams): boolean {
  const dx = worldPoint.x - camera.position.x
  const dy = worldPoint.y - camera.position.y

  const angleToPoint = radToDeg(Math.atan2(dx, dy))
  const diff = Math.abs(angleDifference(angleToPoint, camera.azimuth))

  return diff <= camera.fov / 2
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Estimate bbox height extension based on aspect ratio (FALLBACK method).
 * Returns an extension factor to apply to bbox height (1.0 = no extension).
 *
 * Standing person: height >> width (aspect ratio > 1.5)
 * Seated person: height ≈ width (aspect ratio < 1.2)
 *
 * For seated people, we extend the bbox downward to estimate where
 * their feet would be on the ground plane.
 */
function estimateBBoxHeightExtensionFromAspectRatio(
  bbox: DetectionBBox,
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): number {
  // Get dimensions in pixels for aspect ratio calculation
  let bboxHeight: number
  let bboxWidth: number

  if (isNormalized) {
    bboxHeight = bbox.height * imageHeight
    bboxWidth = bbox.width * imageWidth
  } else {
    bboxHeight = bbox.height
    bboxWidth = bbox.width
  }

  // Avoid division by zero
  if (bboxWidth < 1) return 1.0

  const aspectRatio = bboxHeight / bboxWidth

  // Standing person typically has aspect ratio > 1.5
  // Seated person typically has aspect ratio between 0.8 and 1.3
  // We interpolate the extension factor based on aspect ratio

  if (aspectRatio >= 1.5) {
    // Standing - no extension needed
    return 1.0
  } else if (aspectRatio <= 0.8) {
    // Very short bbox (likely heavily cropped or lying down)
    // Apply maximum extension (extend bbox by 80%)
    return 1.8
  } else {
    // Interpolate between 1.0 and 1.6 for aspect ratios between 1.5 and 0.8
    // Lower aspect ratio = more extension
    const t = (1.5 - aspectRatio) / (1.5 - 0.8)  // 0 to 1
    return 1.0 + t * 0.6  // 1.0 to 1.6
  }
}

/**
 * Detect if a table occludes the view of a person's feet.
 * Uses 3D ray-tracing from camera through bbox bottom to detect table occlusion.
 *
 * Returns extension factor based on geometric distance ratios:
 * extensionFactor = distanceToGround / distanceToTable
 */
function detectTableOcclusion(
  bbox: DetectionBBox,
  camera: CameraParams,
  tables: SiteMapObstacle[],
  isNormalized: boolean,
  imageWidth: number,
  imageHeight: number
): {
  isOccluded: boolean
  occludingTable: SiteMapObstacle | null
  extensionFactor: number
} {
  if (tables.length === 0) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  // 1. Get bbox bottom center in image coordinates (without extension)
  const bboxBottom = getBBoxBottomCenterRaw(bbox, isNormalized, imageWidth, imageHeight)

  // 2. Create ray from camera through this point
  const focalLength = calculateFocalLength(camera.fov, imageWidth)
  const cx = imageWidth / 2
  const cy = imageHeight / 2
  const normalizedX = (bboxBottom.x - cx) / focalLength
  const normalizedY = (bboxBottom.y - cy) / focalLength

  const rayCamera = createCameraRay(normalizedX, normalizedY)
  const rayWorld = transformRayToWorld(rayCamera, camera.azimuth, camera.elevation)

  // 3. Convert to obstacles module Point3D type
  const cameraPos: ObstaclePoint3D = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  }

  // 4. Find occluding tables
  const occludingTableIntersections = findOccludingTables(cameraPos, rayWorld, tables)

  if (occludingTableIntersections.length === 0) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  // 5. Use closest table
  const closestIntersection = occludingTableIntersections[0]

  // 6. Calculate extension factor
  // Find where ray hits ground plane (z=0)
  const tGround = intersectGroundPlane(camera.position, rayWorld)

  if (tGround === null) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  // The bbox bottom shows where the table edge is (at table height)
  // We need to extend to where the ground would be
  // Extension = (distance to ground) / (distance to table)
  const tTable = closestIntersection.distance

  // Safety check: avoid division issues
  if (tTable <= 0 || !isFinite(tTable) || !isFinite(tGround)) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  const extensionRatio = tGround / tTable

  // Safety check: ensure valid ratio
  if (!isFinite(extensionRatio) || extensionRatio <= 0) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  // Cap at 2.5x for safety (person can't be infinitely extended)
  const extensionFactor = Math.min(extensionRatio, 2.5)

  // Only apply if extension is meaningful (>1.05x)
  if (extensionFactor < 1.05) {
    return { isOccluded: false, occludingTable: null, extensionFactor: 1.0 }
  }

  return {
    isOccluded: true,
    occludingTable: closestIntersection.table,
    extensionFactor,
  }
}

/**
 * Get raw bbox bottom center without any extensions (internal helper)
 */
function getBBoxBottomCenterRaw(
  bbox: DetectionBBox,
  isNormalized: boolean,
  imageWidth: number,
  imageHeight: number
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
 * Estimate bbox height extension using table occlusion detection.
 * Falls back to aspect ratio method when no tables are provided or no occlusion detected.
 *
 * @param bbox - Detection bounding box
 * @param camera - Camera parameters (null to use aspect ratio fallback only)
 * @param tables - View-blocking obstacles (tables with blocksView=true)
 * @param isNormalized - Whether bbox coordinates are normalized [0,1]
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 */
export function estimateBBoxHeightExtension(
  bbox: DetectionBBox,
  camera: CameraParams | null = null,
  tables: SiteMapObstacle[] = [],
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): number {
  // Try table-based occlusion detection if we have camera and tables
  if (camera && tables.length > 0) {
    const occlusion = detectTableOcclusion(
      bbox,
      camera,
      tables,
      isNormalized,
      imageWidth,
      imageHeight
    )
    if (occlusion.isOccluded) {
      return occlusion.extensionFactor
    }
  }

  // Fall back to aspect ratio method
  return estimateBBoxHeightExtensionFromAspectRatio(bbox, isNormalized, imageWidth, imageHeight)
}

/**
 * Get the bottom-center of a bounding box (person's feet position)
 * Optionally applies height extension for seated/occluded people
 *
 * @param bbox - Detection bounding box
 * @param camera - Camera parameters (required for table occlusion detection)
 * @param tables - View-blocking obstacles (tables with blocksView=true)
 * @param isNormalized - Whether bbox coordinates are normalized [0,1]
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param applySeatedExtension - Whether to apply seated/occlusion extension
 */
export function getBBoxBottomCenter(
  bbox: DetectionBBox,
  camera: CameraParams | null = null,
  tables: SiteMapObstacle[] = [],
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080,
  applySeatedExtension: boolean = false
): Point2D {
  let effectiveHeight = bbox.height

  // Apply seated person / table occlusion extension if enabled
  if (applySeatedExtension) {
    const extension = estimateBBoxHeightExtension(
      bbox,
      camera,
      tables,
      isNormalized,
      imageWidth,
      imageHeight
    )
    effectiveHeight = bbox.height * extension
  }

  if (isNormalized) {
    // Clamp to image bounds
    const bottomY = Math.min(bbox.y + effectiveHeight, 1.0)
    return {
      x: (bbox.x + bbox.width / 2) * imageWidth,
      y: bottomY * imageHeight,
    }
  }

  // Clamp to image bounds
  const bottomY = Math.min(bbox.y + effectiveHeight, imageHeight)
  return {
    x: bbox.x + bbox.width / 2,
    y: bottomY,
  }
}

/**
 * Project a detection bounding box to world coordinates
 * Automatically applies height extension for seated/occluded people
 *
 * @param bbox - Detection bounding box
 * @param camera - Camera parameters
 * @param tables - View-blocking obstacles (tables with blocksView=true)
 * @param isNormalized - Whether bbox coordinates are normalized [0,1]
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 */
export function projectDetectionToGround(
  bbox: DetectionBBox,
  camera: CameraParams,
  tables: SiteMapObstacle[] = [],
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): ProjectionResult & { debug: DebugInfo } {
  // Enable seated/occlusion extension by default - this helps with seated/partial people
  const imagePoint = getBBoxBottomCenter(
    bbox,
    camera,
    tables,
    isNormalized,
    imageWidth,
    imageHeight,
    true
  )
  return projectToGround(imagePoint, camera, { width: imageWidth, height: imageHeight })
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

// ============================================================================
// K/R/T Matrix Projection (from dataset calibration)
// ============================================================================

/**
 * Multiply 3x3 matrix by 3x3 matrix
 */
function matMul3x3(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

/**
 * Multiply 3x3 matrix by 3x1 vector
 */
function matMulVec(A: number[][], v: number[]): number[] {
  return [
    A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
    A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
    A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2],
  ]
}

/**
 * Solve 3x3 linear system Ax = b using Cramer's rule
 */
function solve3x3(A: number[][], b: number[]): number[] | null {
  // Calculate determinant of A
  const det =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

  if (Math.abs(det) < 1e-10) {
    return null // Singular matrix
  }

  // Cramer's rule
  const x: number[] = []
  for (let i = 0; i < 3; i++) {
    // Create matrix with column i replaced by b
    const Ai: number[][] = A.map((row, ri) =>
      row.map((val, ci) => ci === i ? b[ri] : val)
    )

    const detAi =
      Ai[0][0] * (Ai[1][1] * Ai[2][2] - Ai[1][2] * Ai[2][1]) -
      Ai[0][1] * (Ai[1][0] * Ai[2][2] - Ai[1][2] * Ai[2][0]) +
      Ai[0][2] * (Ai[1][0] * Ai[2][1] - Ai[1][1] * Ai[2][0])

    x.push(detAi / det)
  }

  return x
}

/**
 * Apply 2D world coordinate transformation
 * Transforms point from dataset coordinates to sitemap coordinates
 *
 * Formula: P_sitemap = scale * R * P_dataset + translation
 */
export function applyWorldTransform(point: Point2D, transform: WorldTransform): Point2D {
  const { rotation: R, translation: t, scale: s = 1.0 } = transform

  // Apply rotation and scale, then translation
  return {
    x: s * (R[0][0] * point.x + R[0][1] * point.y) + t[0],
    y: s * (R[1][0] * point.x + R[1][1] * point.y) + t[1],
  }
}

/**
 * Project image point to ground plane using K/R/T calibration matrices
 *
 * Formula from dataset README:
 *   A = K * R
 *   A = [A(:, 1:2), [cx - x; cy - y; -1]]
 *   KRT = K * R * T
 *   p = A \ KRT
 *   p = [world_x, world_y, 0]
 *
 * If a worldTransform is provided in calibration, the result is transformed
 * from dataset coordinates to sitemap coordinates.
 */
export function projectWithKRT(
  imageX: number,
  imageY: number,
  calibration: CameraCalibration
): { worldPoint: Point2D; isValid: boolean; reason?: string } {
  const { K, R, T, center, scale, worldTransform } = calibration

  // Apply scale
  const x = imageX * scale
  const y = imageY * scale

  // A = K * R
  const KR = matMul3x3(K, R)

  // Build modified A matrix: [KR(:,1:2), [cx-x; cy-y; -1]]
  const A: number[][] = [
    [KR[0][0], KR[0][1], center[0] - x],
    [KR[1][0], KR[1][1], center[1] - y],
    [KR[2][0], KR[2][1], -1],
  ]

  // KRT = K * R * T
  const KRT = matMulVec(KR, T)

  // Solve A * p = KRT for p
  const p = solve3x3(A, KRT)

  if (!p) {
    return {
      worldPoint: { x: 0, y: 0 },
      isValid: false,
      reason: 'singular_matrix',
    }
  }

  // p[0] = world_x, p[1] = world_y (p[2] should be ~0 for ground plane)
  let worldPoint: Point2D = { x: p[0], y: p[1] }

  // Apply world coordinate transformation if provided
  if (worldTransform) {
    worldPoint = applyWorldTransform(worldPoint, worldTransform)
  }

  return {
    worldPoint,
    isValid: true,
  }
}

/**
 * Project detection bbox to ground using K/R/T calibration
 * Automatically applies height extension for seated/occluded people
 *
 * @param bbox - Detection bounding box
 * @param calibration - K/R/T camera calibration
 * @param camera - Camera parameters (for table occlusion detection)
 * @param tables - View-blocking obstacles (tables with blocksView=true)
 * @param isNormalized - Whether bbox coordinates are normalized [0,1]
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 */
export function projectDetectionWithKRT(
  bbox: DetectionBBox,
  calibration: CameraCalibration,
  camera: CameraParams | null = null,
  tables: SiteMapObstacle[] = [],
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): { worldPoint: Point2D; isValid: boolean; reason?: string } {
  // Get bottom-center of bbox (feet position) with seated/occlusion extension
  const feetPos = getBBoxBottomCenter(
    bbox,
    camera,
    tables,
    isNormalized,
    imageWidth,
    imageHeight,
    true
  )
  let footX = feetPos.x
  let footY = feetPos.y

  // Apply lens distortion correction if distortion coefficients are available
  if (calibration.distortion) {
    const fx = calibration.K[0][0]
    const fy = calibration.K[1][1]
    const cx = calibration.center[0]
    const cy = calibration.center[1]

    const corrected = undistortPoint(footX, footY, fx, fy, cx, cy, calibration.distortion)
    footX = corrected.x
    footY = corrected.y
  }

  return projectWithKRT(footX, footY, calibration)
}
