/**
 * Bridge between the new groundPlaneProjection module and existing types
 *
 * This module provides functions to convert existing CameraPlacement and Detection
 * types to work with the pure projection functions.
 */

import type { Detection, BoundingBox } from '../types/generated'
import type { CameraPlacement } from '../stores/siteMaps'
import { extractValue } from './siteMapConversion'
import {
  projectDetectionToGround as projectBboxToGround,
  isInHorizontalFOV,
  type CameraParams,
  type DetectionBBox,
  type ProjectionResult,
  type Point2D,
} from './groundPlaneProjection'

// Default elevation angle for cameras (configurable)
const DEFAULT_ELEVATION_DEG = 45

/**
 * Convert a CameraPlacement to CameraParams for projection
 *
 * @param placement - Camera placement from siteMaps store
 * @param elevationOverride - Optional override for elevation angle
 */
export function cameraPlacementToParams(
  placement: CameraPlacement,
  elevationOverride?: number
): CameraParams {
  return {
    position: {
      x: extractValue(placement.position.x),
      y: extractValue(placement.position.y),
      z: extractValue(placement.height),
    },
    azimuth: extractValue(placement.rotation),
    // The 'angle' field in CameraPlacement is the tilt/elevation
    elevation: elevationOverride ?? (extractValue(placement.angle) || DEFAULT_ELEVATION_DEG),
    fov: extractValue(placement.fov),
    maxDistance: extractValue(placement.viewDistance),
  }
}

/**
 * Convert a Detection bbox to DetectionBBox
 */
export function detectionBboxToProjectionBbox(bbox: BoundingBox): DetectionBBox {
  return {
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
  }
}

/**
 * Result of projecting a detection to world coordinates
 */
export interface DetectionProjectionResult {
  /** World coordinates in meters */
  worldX: number
  worldY: number
  /** Distance from camera in meters */
  distance: number
  /** Whether projection is valid */
  isValid: boolean
  /** Reason if invalid */
  reason?: string
  /** Original detection */
  detection: Detection
}

/**
 * Project a detection to world coordinates using a camera placement
 *
 * @param detection - Detection with bbox (can be pixel or normalized coords)
 * @param placement - Camera placement from siteMaps store
 * @param isNormalized - Whether bbox coords are normalized (0-1). Default: false (pixel coords)
 * @param imageWidth - Image width in pixels. Default: 1920
 * @param imageHeight - Image height in pixels. Default: 1080
 */
export function projectDetectionToWorld(
  detection: Detection,
  placement: CameraPlacement,
  isNormalized: boolean = false,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): DetectionProjectionResult {
  const camera = cameraPlacementToParams(placement)
  const bbox = detectionBboxToProjectionBbox(detection.bbox)

  const result = projectBboxToGround(bbox, camera, isNormalized, imageWidth, imageHeight)

  return {
    worldX: result.worldPoint.x,
    worldY: result.worldPoint.y,
    distance: result.distance,
    isValid: result.isValid,
    reason: result.reason,
    detection,
  }
}

/**
 * Check if a world point is within a camera's FOV
 *
 * @param worldPoint - Point in world coordinates (meters)
 * @param placement - Camera placement from siteMaps store
 */
export function isPointInCameraView(
  worldPoint: Point2D,
  placement: CameraPlacement
): boolean {
  const camera = cameraPlacementToParams(placement)
  return isInHorizontalFOV(worldPoint, camera)
}

/**
 * Project multiple detections from a single camera
 *
 * @param detections - Array of detections
 * @param placement - Camera placement
 * @param options - Projection options
 * @returns Array of projection results (only valid ones by default)
 */
export function projectDetectionsFromCamera(
  detections: Detection[],
  placement: CameraPlacement,
  options: {
    isNormalized?: boolean
    imageWidth?: number
    imageHeight?: number
    includeInvalid?: boolean
  } = {}
): DetectionProjectionResult[] {
  const {
    isNormalized = false,
    imageWidth = 1920,
    imageHeight = 1080,
    includeInvalid = false,
  } = options

  const results = detections.map((det) =>
    projectDetectionToWorld(det, placement, isNormalized, imageWidth, imageHeight)
  )

  return includeInvalid ? results : results.filter((r) => r.isValid)
}

/**
 * Convert world coordinates to site map pixel coordinates
 *
 * @param worldX - X coordinate in meters
 * @param worldY - Y coordinate in meters
 * @param scale - Pixels per meter (default: 100)
 * @param offsetX - X offset in pixels (default: 60)
 * @param offsetY - Y offset in pixels (default: 60)
 */
export function worldToSiteMapPixels(
  worldX: number,
  worldY: number,
  scale: number = 100,
  offsetX: number = 60,
  offsetY: number = 60
): Point2D {
  return {
    x: worldX * scale + offsetX,
    y: worldY * scale + offsetY,
  }
}

/**
 * Convert site map pixel coordinates to world coordinates
 *
 * @param pixelX - X coordinate in pixels
 * @param pixelY - Y coordinate in pixels
 * @param scale - Pixels per meter (default: 100)
 * @param offsetX - X offset in pixels (default: 60)
 * @param offsetY - Y offset in pixels (default: 60)
 */
export function siteMapPixelsToWorld(
  pixelX: number,
  pixelY: number,
  scale: number = 100,
  offsetX: number = 60,
  offsetY: number = 60
): Point2D {
  return {
    x: (pixelX - offsetX) / scale,
    y: (pixelY - offsetY) / scale,
  }
}

/**
 * Project a detection and return site map pixel coordinates
 *
 * @param detection - Detection with bbox
 * @param placement - Camera placement
 * @param options - Projection and conversion options
 */
export function projectDetectionToSiteMapPixels(
  detection: Detection,
  placement: CameraPlacement,
  options: {
    isNormalized?: boolean
    imageWidth?: number
    imageHeight?: number
    scale?: number
    offsetX?: number
    offsetY?: number
  } = {}
): {
  pixelX: number
  pixelY: number
  worldX: number
  worldY: number
  distance: number
  isValid: boolean
  reason?: string
} {
  const {
    isNormalized = false,
    imageWidth = 1920,
    imageHeight = 1080,
    scale = 100,
    offsetX = 60,
    offsetY = 60,
  } = options

  const worldResult = projectDetectionToWorld(
    detection,
    placement,
    isNormalized,
    imageWidth,
    imageHeight
  )

  const pixels = worldToSiteMapPixels(worldResult.worldX, worldResult.worldY, scale, offsetX, offsetY)

  return {
    pixelX: pixels.x,
    pixelY: pixels.y,
    worldX: worldResult.worldX,
    worldY: worldResult.worldY,
    distance: worldResult.distance,
    isValid: worldResult.isValid,
    reason: worldResult.reason,
  }
}
