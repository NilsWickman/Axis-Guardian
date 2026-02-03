/**
 * Sitemap Calibration - Derive K/R/T matrices from sitemap camera geometry
 *
 * Computes camera calibration matrices mathematically from sitemap parameters
 * (position, azimuth, elevation, FOV, height) without requiring ground truth
 * annotations or external calibration files.
 *
 * The sitemap becomes the single source of truth for both display AND projection.
 */

import type { SiteMapCameraConfig, CameraCalibration } from '../types/camera.js'
import { degToRad } from '../projection/ground-plane.js'

// ============================================================================
// Intrinsic Matrix K
// ============================================================================

/**
 * Compute the intrinsic camera matrix K from FOV and resolution
 *
 * K = [ fx   0   cx ]
 *     [  0  fy   cy ]
 *     [  0   0    1 ]
 *
 * Where:
 * - fx, fy = focal length in pixels (assuming square pixels)
 * - cx, cy = principal point (image center)
 *
 * @param fovDeg - Horizontal field of view in degrees
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns 3x3 intrinsic matrix K
 */
export function computeIntrinsicMatrix(
  fovDeg: number,
  width: number,
  height: number
): number[][] {
  // Focal length from horizontal FOV: fx = (width/2) / tan(fov/2)
  const fx = (width / 2) / Math.tan(degToRad(fovDeg / 2))
  const fy = fx  // Assume square pixels

  // Principal point at image center
  const cx = width / 2
  const cy = height / 2

  return [
    [fx,  0, cx],
    [ 0, fy, cy],
    [ 0,  0,  1],
  ]
}

// ============================================================================
// Rotation Matrix R
// ============================================================================

/**
 * Compute the rotation matrix R that transforms from CAMERA space to WORLD space
 *
 * This matches the logic in transformRayToWorld() from ground-plane.ts:
 * 1. Apply elevation rotation (pitch around camera X-axis)
 * 2. Apply coordinate system swap (camera → intermediate world axes)
 * 3. Apply azimuth rotation (yaw around world Z-axis)
 *
 * Coordinate Systems:
 * - Camera space: X-right, Y-down, Z-forward (looking out from camera)
 * - World space:  X-east, Y-north, Z-up (sitemap coordinates)
 *
 * Azimuth: 0° = North (+Y), 90° = East (+X), clockwise positive
 * Elevation: positive = looking down from horizontal
 *
 * @param azimuthDeg - Azimuth angle in degrees (compass bearing)
 * @param elevationDeg - Elevation angle in degrees (positive = looking down)
 * @returns 3x3 rotation matrix R (camera → world)
 */
export function computeRotationMatrix(
  azimuthDeg: number,
  elevationDeg: number
): number[][] {
  // Use actual angles (transformRayToWorld applies negation internally
  // in the rotation functions, which we've already accounted for in the derivation)
  const az = degToRad(azimuthDeg)
  const el = degToRad(elevationDeg)

  const ca = Math.cos(az)
  const sa = Math.sin(az)
  const ce = Math.cos(el)
  const se = Math.sin(el)

  // The combined rotation R = Rz(-azimuth) * P * Rx(-elevation)
  //
  // Where P is the coordinate swap matrix:
  //   camera X (right)   → -world X
  //   camera Y (down)    → -world Z
  //   camera Z (forward) → +world Y (at azimuth=0)
  //
  // The transformRayToWorld function applies:
  //   1. Rx(-elevation) - rotates around X, negated so positive elevation = down
  //   2. P - coordinate system swap
  //   3. Rz(-azimuth) - rotates around Z, negated so clockwise = positive
  //
  // After full matrix multiplication of Rz(-az) * P * Rx(-el):
  //
  // R_c2w = [-cos(az),  -sin(el)*sin(az),   cos(el)*sin(az)]
  //         [ sin(az),  -sin(el)*cos(az),   cos(el)*cos(az)]
  //         [    0,         -cos(el),          -sin(el)    ]
  //
  return [
    [-ca,  -se * sa,   ce * sa],
    [ sa,  -se * ca,   ce * ca],
    [  0,       -ce,       -se],
  ]
}

/**
 * Compute the rotation matrix R for KRT projection (world → camera convention)
 *
 * The standard KRT projection formula `p = K * R * (P_world - T)` expects R to
 * transform from WORLD space to CAMERA space. This is the transpose of the
 * camera-to-world R computed by computeRotationMatrix().
 *
 * @param azimuthDeg - Azimuth angle in degrees (compass bearing)
 * @param elevationDeg - Elevation angle in degrees (positive = looking down)
 * @returns 3x3 rotation matrix R (world → camera) for KRT projection
 */
export function computeRotationMatrixForKRT(
  azimuthDeg: number,
  elevationDeg: number
): number[][] {
  const R_c2w = computeRotationMatrix(azimuthDeg, elevationDeg)

  // Transpose: R_w2c = R_c2w^T
  return [
    [R_c2w[0][0], R_c2w[1][0], R_c2w[2][0]],
    [R_c2w[0][1], R_c2w[1][1], R_c2w[2][1]],
    [R_c2w[0][2], R_c2w[1][2], R_c2w[2][2]],
  ]
}

// ============================================================================
// Full Calibration Generation
// ============================================================================

/** Default image resolution if not specified in sitemap */
const DEFAULT_RESOLUTION = { width: 1920, height: 1080 }

/** Default elevation angle if not specified in sitemap */
const DEFAULT_ELEVATION = 45

/**
 * Generate complete K/R/T calibration from sitemap camera configuration
 *
 * This function derives all calibration matrices mathematically from the
 * camera's geometric parameters - no ground truth annotations needed.
 *
 * @param config - Sitemap camera configuration
 * @returns Complete CameraCalibration with K, R, T matrices
 */
export function generateCalibrationFromSitemap(
  config: SiteMapCameraConfig
): CameraCalibration {
  const resolution = config.resolution ?? DEFAULT_RESOLUTION
  const elevation = config.elevation ?? DEFAULT_ELEVATION

  // Compute intrinsic matrix K from FOV and resolution
  const K = computeIntrinsicMatrix(
    config.fieldOfView,
    resolution.width,
    resolution.height
  )

  // Compute rotation matrix R for KRT projection (world → camera convention)
  // The KRT formula expects R to transform world points to camera space
  const R = computeRotationMatrixForKRT(config.azimuth, elevation)

  // Translation vector T is camera position in world coordinates
  const T: number[] = [config.position.x, config.position.y, config.height]

  // Principal point (image center)
  const center: [number, number] = [resolution.width / 2, resolution.height / 2]

  return {
    K,
    R,
    T,
    center,
    scale: 1,
    distortion: config.distortion,
    // No worldTransform needed - K/R/T already produce sitemap coordinates
    // Enable ray-based projection for sitemap-derived calibrations
    useRayProjection: true,
    azimuthDeg: config.azimuth,
    elevationDeg: elevation,
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation result for sitemap camera configuration
 */
export interface ValidationResult {
  /** Whether the configuration is valid for projection */
  valid: boolean
  /** Non-fatal issues that may affect accuracy */
  warnings: string[]
  /** Fatal issues that prevent valid projection */
  errors: string[]
}

/**
 * Validate sitemap camera configuration for K/R/T generation
 *
 * Checks for:
 * - Height > 0 (needed for ground plane intersection)
 * - Elevation > 0 (camera must look down to see ground)
 * - FOV in reasonable range
 *
 * @param config - Sitemap camera configuration
 * @returns Validation result with any warnings or errors
 */
export function validateSitemapCamera(config: SiteMapCameraConfig): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Height validation
  if (config.height <= 0) {
    errors.push(`Camera ${config.id}: height must be positive (got ${config.height}m)`)
  } else if (config.height < 0.5) {
    warnings.push(`Camera ${config.id}: unusually low height ${config.height}m`)
  }

  // Elevation validation
  const elevation = config.elevation ?? DEFAULT_ELEVATION
  if (elevation <= 0) {
    errors.push(`Camera ${config.id}: elevation must be positive for ground projection (got ${elevation}°)`)
  } else if (elevation < 5) {
    warnings.push(`Camera ${config.id}: very shallow elevation ${elevation}° may cause poor accuracy`)
  } else if (elevation > 80) {
    warnings.push(`Camera ${config.id}: very steep elevation ${elevation}° has limited coverage area`)
  }

  // FOV validation
  if (config.fieldOfView <= 0 || config.fieldOfView >= 180) {
    errors.push(`Camera ${config.id}: invalid FOV ${config.fieldOfView}°`)
  } else if (config.fieldOfView > 120) {
    warnings.push(`Camera ${config.id}: wide FOV ${config.fieldOfView}° may have significant edge distortion`)
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Validate all cameras in a sitemap configuration
 *
 * @param configs - Array of sitemap camera configurations
 * @returns Combined validation result
 */
export function validateAllCameras(configs: SiteMapCameraConfig[]): ValidationResult {
  const allWarnings: string[] = []
  const allErrors: string[] = []

  for (const config of configs) {
    const result = validateSitemapCamera(config)
    allWarnings.push(...result.warnings)
    allErrors.push(...result.errors)
  }

  return {
    valid: allErrors.length === 0,
    warnings: allWarnings,
    errors: allErrors,
  }
}
