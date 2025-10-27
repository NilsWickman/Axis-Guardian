/**
 * Camera-to-World Coordinate Transformation Utilities
 *
 * This module provides functions to transform detection coordinates from camera image space
 * to world coordinates on a site map.
 */

import type { BoundingBox, Detection } from '../types/generated'
import type { CameraPlacement } from '../stores/siteMaps'

export interface Point2D {
  x: number
  y: number
}

export interface CameraIntrinsics {
  focalLengthPixels: number // Focal length in pixels
  principalPointX: number // Image center X
  principalPointY: number // Image center Y
  imageWidth: number // Image width in pixels
  imageHeight: number // Image height in pixels
}

export interface TransformOptions {
  scale: number // Site map scale (pixels per meter)
  assumeGroundPlane?: boolean // Assume person is on ground (z=0)
  personHeightMeters?: number // Average person height for better estimation
}

/**
 * Calculate camera intrinsics from FOV and image dimensions
 */
export function calculateCameraIntrinsics(
  fovDegrees: number,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): CameraIntrinsics {
  const fovRadians = (fovDegrees * Math.PI) / 180
  const focalLengthPixels = (imageWidth / 2) / Math.tan(fovRadians / 2)

  return {
    focalLengthPixels,
    principalPointX: imageWidth / 2,
    principalPointY: imageHeight / 2,
    imageWidth,
    imageHeight,
  }
}

/**
 * Get the center point of a bounding box in image coordinates
 */
export function getBBoxCenter(bbox: BoundingBox): Point2D {
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  }
}

/**
 * Get the bottom-center point of a bounding box (person's feet position)
 */
export function getBBoxBottomCenter(bbox: BoundingBox): Point2D {
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height, // Bottom of bounding box
  }
}

/**
 * Convert degrees to radians
 */
function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Transform a point from image coordinates to world coordinates
 *
 * This uses a simplified pinhole camera model with the following assumptions:
 * 1. The person is standing on the ground plane (z=0 in world coords)
 * 2. Camera elevation angle affects the projection
 * 3. Camera azimuth (rotation) determines the viewing direction
 *
 * @param imagePoint - Point in image coordinates (pixels from top-left)
 * @param camera - Camera placement on site map
 * @param intrinsics - Camera intrinsic parameters
 * @param options - Transformation options
 * @returns World coordinates on the site map
 */
export function imageToWorldCoordinates(
  imagePoint: Point2D,
  camera: CameraPlacement,
  intrinsics: CameraIntrinsics,
  options: TransformOptions
): Point2D {
  const { scale, assumeGroundPlane = true, personHeightMeters = 1.7 } = options

  // Convert camera position from pixels to meters
  const cameraPosMeters = {
    x: (camera.x - 60) / scale, // Remove offset and convert to meters
    y: (camera.y - 60) / scale,
    z: camera.height,
  }

  // Normalize image coordinates to [-1, 1] range
  const normalizedX = (imagePoint.x - intrinsics.principalPointX) / intrinsics.focalLengthPixels
  const normalizedY = (imagePoint.y - intrinsics.principalPointY) / intrinsics.focalLengthPixels

  // Camera angles in radians
  const azimuthRad = degToRad(camera.rotation)
  const elevationRad = degToRad(camera.angle)

  // Create ray direction in camera space
  // X-right, Y-down, Z-forward (camera convention)
  const rayCamera = {
    x: normalizedX,
    y: normalizedY,
    z: 1.0,
  }

  // Normalize ray
  const rayLength = Math.sqrt(rayCamera.x ** 2 + rayCamera.y ** 2 + rayCamera.z ** 2)
  rayCamera.x /= rayLength
  rayCamera.y /= rayLength
  rayCamera.z /= rayLength

  // Rotate ray by elevation (pitch) - rotation around X-axis
  const rayElevated = {
    x: rayCamera.x,
    y: rayCamera.y * Math.cos(elevationRad) - rayCamera.z * Math.sin(elevationRad),
    z: rayCamera.y * Math.sin(elevationRad) + rayCamera.z * Math.cos(elevationRad),
  }

  // Rotate ray by azimuth (yaw) - rotation around Z-axis (vertical)
  // Note: Azimuth 0 = North (+Y), 90 = East (+X), 180 = South (-Y), 270 = West (-X)
  const azimuthAdjusted = azimuthRad - Math.PI / 2 // Adjust for coordinate system
  const rayWorld = {
    x: rayElevated.z * Math.cos(azimuthAdjusted) - rayElevated.x * Math.sin(azimuthAdjusted),
    y: rayElevated.z * Math.sin(azimuthAdjusted) + rayElevated.x * Math.cos(azimuthAdjusted),
    z: -rayElevated.y, // Flip Y to match world Z-up convention
  }

  // Intersect ray with ground plane (z=0)
  let distance: number
  if (assumeGroundPlane) {
    // Ray from camera intersects ground at z=0
    // camera.z + t * ray.z = 0
    // t = -camera.z / ray.z
    if (Math.abs(rayWorld.z) < 0.001) {
      // Ray is parallel to ground, use default distance
      distance = camera.viewDistance / scale
    } else {
      distance = -cameraPosMeters.z / rayWorld.z
    }
  } else {
    // Use a fixed distance based on camera view distance
    distance = camera.viewDistance / scale
  }

  // Ensure distance is positive and reasonable
  if (distance < 0 || distance > 50) {
    // Clamp to reasonable range (0-50 meters)
    distance = Math.max(0, Math.min(50, distance))
  }

  // Calculate world position
  const worldPosMeters = {
    x: cameraPosMeters.x + rayWorld.x * distance,
    y: cameraPosMeters.y + rayWorld.y * distance,
  }

  // Convert back to site map pixel coordinates
  const worldPosPixels = {
    x: worldPosMeters.x * scale + 60, // Add back offset
    y: worldPosMeters.y * scale + 60,
  }

  return worldPosPixels
}

/**
 * Transform a detection to world coordinates
 *
 * @param detection - Detection from camera
 * @param camera - Camera placement
 * @param options - Transformation options
 * @returns World coordinates
 */
export function detectionToWorldCoordinates(
  detection: Detection,
  camera: CameraPlacement,
  options: TransformOptions
): Point2D {
  // Use bottom-center of bounding box for better ground plane estimation
  const imagePoint = getBBoxBottomCenter(detection.bbox)

  // Calculate camera intrinsics
  const intrinsics = calculateCameraIntrinsics(
    camera.fov,
    1920, // Assume 1080p camera
    1080
  )

  // Transform to world coordinates
  return imageToWorldCoordinates(imagePoint, camera, intrinsics, options)
}

/**
 * Simple distance-based approximation for quick calculations
 * This is a simplified version that estimates position based on camera view cone
 *
 * @param imagePoint - Point in image (normalized 0-1)
 * @param camera - Camera placement
 * @param options - Transform options
 * @returns Approximate world coordinates
 */
export function simpleImageToWorldApproximation(
  imagePoint: Point2D,
  camera: CameraPlacement,
  imageWidth: number,
  imageHeight: number,
  options: TransformOptions
): Point2D {
  const { scale } = options

  // Normalize image coordinates to -1 to 1
  const normX = (imagePoint.x / imageWidth) * 2 - 1
  const normY = (imagePoint.y / imageHeight) * 2 - 1

  // Estimate distance based on camera height and elevation
  const elevationRad = degToRad(camera.angle)
  const baseDistance = camera.height / Math.tan(Math.max(0.1, Math.abs(elevationRad)))
  const distance = Math.min(camera.viewDistance / scale, baseDistance)

  // Calculate angle offset based on horizontal position
  const fovRad = degToRad(camera.fov)
  const horizontalAngle = normX * (fovRad / 2)

  // Camera azimuth in radians
  const azimuthRad = degToRad(camera.rotation)

  // Calculate world position
  const totalAngle = azimuthRad + horizontalAngle
  const cameraPosMeters = {
    x: (camera.x - 60) / scale,
    y: (camera.y - 60) / scale,
  }

  const worldPosMeters = {
    x: cameraPosMeters.x + distance * Math.sin(totalAngle),
    y: cameraPosMeters.y + distance * Math.cos(totalAngle),
  }

  return {
    x: worldPosMeters.x * scale + 60,
    y: worldPosMeters.y * scale + 60,
  }
}

/**
 * Batch transform multiple detections
 */
export function transformDetections(
  detections: Detection[],
  camera: CameraPlacement,
  options: TransformOptions
): Point2D[] {
  return detections.map(det => detectionToWorldCoordinates(det, camera, options))
}
