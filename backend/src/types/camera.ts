/**
 * Camera Types
 *
 * Camera configuration, calibration, and projection parameters.
 */

import type { Point3D } from './geometry.js'

// ============================================================================
// Camera Configuration
// ============================================================================

/**
 * Camera parameters for projection
 */
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

/**
 * Camera configuration for registry
 */
export interface CameraConfig {
  cameraId: string
  position: { x: number; y: number; z: number }
  azimuth: number
  elevation: number
  fov: number
}

/**
 * Image resolution
 */
export interface ImageResolution {
  width: number
  height: number
}

/**
 * Lens distortion coefficients (Brown-Conrady model)
 */
export interface DistortionCoeffs {
  /** Radial distortion coefficient 1 */
  k1: number
  /** Radial distortion coefficient 2 */
  k2: number
  /** Radial distortion coefficient 3 */
  k3: number
  /** Tangential distortion coefficient 1 */
  p1: number
  /** Tangential distortion coefficient 2 */
  p2: number
}

/**
 * Sitemap camera config format (for loading from JSON)
 */
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
  /** Image resolution in pixels */
  resolution?: ImageResolution
  /** Lens distortion coefficients */
  distortion?: DistortionCoeffs
  /** ACAP device ID for mapping live camera MQTT topics to this camera */
  acapDeviceId?: string
}

// ============================================================================
// World Coordinate Transform
// ============================================================================

/**
 * 2D rigid transformation for converting between coordinate systems
 * Used to transform dataset coordinates to sitemap coordinates
 */
export interface WorldTransform {
  /** 2x2 rotation matrix (for affine transform) */
  rotation: number[][]
  /** [tx, ty] translation offset (for affine transform) */
  translation: number[]
  /** Scale factor (default 1.0) */
  scale?: number
  /**
   * Polynomial transform coefficients (if provided, overrides affine transform)
   * Quadratic (6 coeffs): c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y
   * Cubic (10 coeffs): + c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2
   * Quartic (15 coeffs): + c10*x^4 + c11*y^4 + c12*x^3*y + c13*x*y^3 + c14*x^2*y^2
   * Quintic (21 coeffs): + c15*x^5 + c16*y^5 + c17*x^4*y + c18*x*y^4 + c19*x^3*y^2 + c20*x^2*y^3
   */
  polynomial?: {
    /** Polynomial degree: 2 (quadratic), 3 (cubic), 4 (quartic), or 5 (quintic) */
    degree: 2 | 3 | 4 | 5
    /** Coefficients for X output */
    coeffsX: number[]
    /** Coefficients for Y output */
    coeffsY: number[]
  }
  /**
   * @deprecated Use polynomial with degree=2 instead
   * Quadratic transform coefficients (if provided, overrides affine transform)
   * Model: result = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y
   */
  quadratic?: {
    /** Coefficients for X output: [c0, c1, c2, c3, c4, c5] */
    coeffsX: number[]
    /** Coefficients for Y output: [c0, c1, c2, c3, c4, c5] */
    coeffsY: number[]
  }
}

// ============================================================================
// Camera Calibration (K/R/T matrices)
// ============================================================================

/**
 * Camera calibration matrices (K/R/T) for accurate projection
 * From dataset cam_param.mat file
 */
export interface CameraCalibration {
  /** 3x3 intrinsic matrix (focal length, principal point) */
  K: number[][]
  /** 3x3 rotation matrix (camera orientation) */
  R: number[][]
  /** 3x1 translation vector (camera position in world coords) */
  T: number[]
  /** Image center [cx, cy] in pixels */
  center: [number, number]
  /** Scale factor (usually 1) */
  scale: number
  /** Optional lens distortion coefficients */
  distortion?: DistortionCoeffs
  /** Optional world coordinate transformation (dataset to sitemap coords) */
  worldTransform?: WorldTransform
}
