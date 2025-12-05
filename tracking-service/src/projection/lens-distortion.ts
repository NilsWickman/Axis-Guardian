/**
 * Lens Distortion Correction Module
 *
 * Implements Brown-Conrady distortion model for correcting radial and
 * tangential lens distortion before projection.
 *
 * Distortion Model:
 *   x_corrected = x * (1 + k1*r² + k2*r⁴ + k3*r⁶) + 2*p1*x*y + p2*(r² + 2*x²)
 *   y_corrected = y * (1 + k1*r² + k2*r⁴ + k3*r⁶) + p1*(r² + 2*y²) + 2*p2*x*y
 *
 * Where:
 *   - k1, k2, k3: Radial distortion coefficients
 *   - p1, p2: Tangential distortion coefficients
 *   - r² = x² + y² (in normalized camera coordinates)
 */

import type { DistortionCoeffs } from '../types.js'

/**
 * Default distortion coefficients (no distortion)
 */
export const ZERO_DISTORTION: DistortionCoeffs = {
  k1: 0,
  k2: 0,
  k3: 0,
  p1: 0,
  p2: 0,
}

/**
 * Typical barrel distortion for wide-angle surveillance cameras
 * These are rough estimates - actual values should come from calibration
 */
export const TYPICAL_SURVEILLANCE_DISTORTION: DistortionCoeffs = {
  k1: -0.1,   // Slight barrel distortion
  k2: 0.01,   // Minor correction
  k3: 0,      // Usually negligible
  p1: 0,      // Minimal tangential
  p2: 0,
}

/**
 * Undistort a point from distorted image coordinates to corrected coordinates
 *
 * @param pixelX - X coordinate in pixels
 * @param pixelY - Y coordinate in pixels
 * @param fx - Focal length X (from K matrix)
 * @param fy - Focal length Y (from K matrix)
 * @param cx - Principal point X (from K matrix or image center)
 * @param cy - Principal point Y (from K matrix or image center)
 * @param coeffs - Distortion coefficients
 * @returns Corrected pixel coordinates
 */
export function undistortPoint(
  pixelX: number,
  pixelY: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number,
  coeffs: DistortionCoeffs
): { x: number; y: number } {
  // Normalize to camera coordinates (centered at principal point)
  const x = (pixelX - cx) / fx
  const y = (pixelY - cy) / fy

  // Calculate radial distance squared
  const r2 = x * x + y * y
  const r4 = r2 * r2
  const r6 = r4 * r2

  // Radial distortion factor
  const radialFactor = 1 + coeffs.k1 * r2 + coeffs.k2 * r4 + coeffs.k3 * r6

  // Apply radial distortion correction
  let xCorrected = x * radialFactor
  let yCorrected = y * radialFactor

  // Apply tangential distortion correction
  xCorrected += 2 * coeffs.p1 * x * y + coeffs.p2 * (r2 + 2 * x * x)
  yCorrected += coeffs.p1 * (r2 + 2 * y * y) + 2 * coeffs.p2 * x * y

  // Convert back to pixel coordinates
  return {
    x: xCorrected * fx + cx,
    y: yCorrected * fy + cy,
  }
}

/**
 * Apply distortion to a point (inverse of undistort, for testing)
 * Uses iterative Newton-Raphson method to find distorted coordinates
 *
 * @param pixelX - Corrected X coordinate in pixels
 * @param pixelY - Corrected Y coordinate in pixels
 * @param fx - Focal length X
 * @param fy - Focal length Y
 * @param cx - Principal point X
 * @param cy - Principal point Y
 * @param coeffs - Distortion coefficients
 * @param iterations - Number of refinement iterations (default: 5)
 * @returns Distorted pixel coordinates
 */
export function distortPoint(
  pixelX: number,
  pixelY: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number,
  coeffs: DistortionCoeffs,
  iterations: number = 5
): { x: number; y: number } {
  // Start with the undistorted point as initial guess
  let xDist = pixelX
  let yDist = pixelY

  // Iteratively refine to find the distorted point that undistorts to our target
  for (let i = 0; i < iterations; i++) {
    const undist = undistortPoint(xDist, yDist, fx, fy, cx, cy, coeffs)
    const dx = pixelX - undist.x
    const dy = pixelY - undist.y
    xDist += dx
    yDist += dy

    // Check convergence
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      break
    }
  }

  return { x: xDist, y: yDist }
}

/**
 * Calculate the magnitude of distortion at a given image position
 * Useful for understanding distortion severity at different image regions
 *
 * @param pixelX - X coordinate in pixels
 * @param pixelY - Y coordinate in pixels
 * @param fx - Focal length X
 * @param fy - Focal length Y
 * @param cx - Principal point X
 * @param cy - Principal point Y
 * @param coeffs - Distortion coefficients
 * @returns Distortion magnitude in pixels
 */
export function getDistortionMagnitude(
  pixelX: number,
  pixelY: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number,
  coeffs: DistortionCoeffs
): number {
  const corrected = undistortPoint(pixelX, pixelY, fx, fy, cx, cy, coeffs)
  const dx = corrected.x - pixelX
  const dy = corrected.y - pixelY
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if distortion coefficients indicate significant distortion
 */
export function hasSignificantDistortion(coeffs: DistortionCoeffs, threshold: number = 0.001): boolean {
  return (
    Math.abs(coeffs.k1) > threshold ||
    Math.abs(coeffs.k2) > threshold ||
    Math.abs(coeffs.k3) > threshold ||
    Math.abs(coeffs.p1) > threshold ||
    Math.abs(coeffs.p2) > threshold
  )
}
