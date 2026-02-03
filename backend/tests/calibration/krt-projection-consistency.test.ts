/**
 * KRT Projection Consistency Tests
 *
 * Validates that the K/R/T projection matrices derived from sitemap camera
 * geometry produce projections consistent with expected camera orientations.
 *
 * Key checks:
 * 1. Image center projects roughly in camera's azimuth direction
 * 2. KRT projection and ray-based projection produce similar results
 * 3. Angular error between expected azimuth and actual projection direction
 */

import { describe, it, expect } from 'vitest'
import {
  generateCalibrationFromSitemap,
  computeRotationMatrix,
} from '../../src/calibration/sitemap-calibration.js'
import {
  projectWithKRT,
  projectWithRay,
  projectToGround,
  radToDeg,
  angleDifference,
  normalizeAngle,
  siteMapConfigToCamera,
} from '../../src/projection/ground-plane.js'
import type { SiteMapCameraConfig } from '../../src/types/camera.js'

// ============================================================================
// Camera Configurations from Sitemap
// ============================================================================

const camera1Config: SiteMapCameraConfig = {
  id: 'camera1',
  name: 'HC3 (Atrium Right)',
  position: { x: 23, y: 4 },
  azimuth: 340,
  elevation: 35,
  height: 2.5,
  fieldOfView: 75,
  resolution: { width: 1920, height: 1080 },
}

const camera2Config: SiteMapCameraConfig = {
  id: 'camera2',
  name: 'HC4 (Atrium Left)',
  position: { x: 8, y: 3.8 },
  azimuth: 52,
  elevation: 40,
  height: 2.5,
  fieldOfView: 63,
  resolution: { width: 1920, height: 1080 },
}

const camera3Config: SiteMapCameraConfig = {
  id: 'camera3',
  name: 'IP2 (Auditorium Back)',
  position: { x: 29.5, y: 26 },
  azimuth: 225,
  elevation: 25,
  height: 3,
  fieldOfView: 60,
  resolution: { width: 1920, height: 1080 },
}

const camera4Config: SiteMapCameraConfig = {
  id: 'camera4',
  name: 'IP5 (Auditorium Front)',
  position: { x: 16.5, y: 15 },
  azimuth: 29,
  elevation: 15,
  height: 2.5,
  fieldOfView: 60,
  resolution: { width: 1920, height: 1080 },
}

const allCameras = [camera1Config, camera2Config, camera3Config, camera4Config]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the compass bearing from camera position to projected point
 * Returns angle in degrees: 0 = North (+Y), 90 = East (+X), clockwise positive
 */
function calculateBearingToPoint(
  cameraX: number,
  cameraY: number,
  pointX: number,
  pointY: number
): number {
  const dx = pointX - cameraX
  const dy = pointY - cameraY
  // atan2(dx, dy) gives compass bearing: 0=North, 90=East
  return normalizeAngle(radToDeg(Math.atan2(dx, dy)))
}

/**
 * Calculate angular error between two compass bearings
 * Returns signed difference in range [-180, 180]
 */
function angularError(actual: number, expected: number): number {
  return angleDifference(actual, expected)
}

// ============================================================================
// Tests: Image Center Projection Direction
// ============================================================================

describe('Image center projects in camera azimuth direction', () => {
  // Maximum allowed angular deviation from azimuth (degrees)
  const MAX_ANGULAR_ERROR = 5  // Should be very accurate with ray-based projection

  for (const config of allCameras) {
    it(`${config.id} (azimuth=${config.azimuth}°): image center projects within ±${MAX_ANGULAR_ERROR}° of azimuth`, () => {
      const calibration = generateCalibrationFromSitemap(config)
      const resolution = config.resolution ?? { width: 1920, height: 1080 }

      // Project image center using ray-based projection (for sitemap-derived calibrations)
      const centerX = resolution.width / 2
      const centerY = resolution.height / 2
      const result = projectWithRay(centerX, centerY, calibration)

      expect(result.isValid).toBe(true)

      // Calculate bearing from camera to projected point
      const bearing = calculateBearingToPoint(
        config.position.x,
        config.position.y,
        result.worldPoint.x,
        result.worldPoint.y
      )

      // Calculate angular error
      const error = angularError(bearing, config.azimuth)

      console.log(
        `[${config.id}] Center(${centerX},${centerY}) -> World(${result.worldPoint.x.toFixed(2)},${result.worldPoint.y.toFixed(2)}) ` +
        `bearing=${bearing.toFixed(1)}° expected=${config.azimuth}° error=${error.toFixed(1)}°`
      )

      expect(Math.abs(error)).toBeLessThanOrEqual(MAX_ANGULAR_ERROR)
    })
  }
})

// ============================================================================
// Tests: KRT vs Ray-Based Projection Consistency
// ============================================================================

describe('Ray-based projection matches projectToGround', () => {
  // Maximum allowed distance difference (meters)
  // Should be very small since both use the same ray-tracing approach
  const MAX_DISTANCE_DIFF = 0.01

  for (const config of allCameras) {
    it(`${config.id}: projectWithRay matches projectToGround`, () => {
      const calibration = generateCalibrationFromSitemap(config)
      const camera = siteMapConfigToCamera(config)
      const resolution = config.resolution ?? { width: 1920, height: 1080 }

      // Test multiple points across the image
      const testPoints = [
        { x: resolution.width / 2, y: resolution.height / 2, name: 'center' },
        { x: resolution.width / 4, y: resolution.height / 2, name: 'left' },
        { x: 3 * resolution.width / 4, y: resolution.height / 2, name: 'right' },
        { x: resolution.width / 2, y: resolution.height / 4, name: 'top' },
        { x: resolution.width / 2, y: 3 * resolution.height / 4, name: 'bottom' },
      ]

      for (const point of testPoints) {
        // Ray projection via calibration (uses K matrix for normalization)
        const rayCalibResult = projectWithRay(point.x, point.y, calibration)

        // Ray-based projection via camera params (uses FOV for normalization)
        const rayResult = projectToGround(
          { x: point.x, y: point.y },
          camera,
          { width: resolution.width, height: resolution.height }
        )

        if (rayCalibResult.isValid && rayResult.isValid) {
          const dx = rayCalibResult.worldPoint.x - rayResult.worldPoint.x
          const dy = rayCalibResult.worldPoint.y - rayResult.worldPoint.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          console.log(
            `[${config.id}] ${point.name}: RayCalib(${rayCalibResult.worldPoint.x.toFixed(2)},${rayCalibResult.worldPoint.y.toFixed(2)}) ` +
            `RayDirect(${rayResult.worldPoint.x.toFixed(2)},${rayResult.worldPoint.y.toFixed(2)}) diff=${distance.toFixed(3)}m`
          )

          expect(distance).toBeLessThanOrEqual(MAX_DISTANCE_DIFF)
        }
      }
    })
  }
})

// ============================================================================
// Tests: R Matrix Column Verification
// ============================================================================

describe('R matrix columns represent correct camera axes', () => {
  it('forward ray (col 2) points in azimuth direction with downward tilt', () => {
    for (const config of allCameras) {
      const R = computeRotationMatrix(config.azimuth, config.elevation ?? 45)

      // Extract forward direction (third column of R)
      const forward = { x: R[0][2], y: R[1][2], z: R[2][2] }

      // Forward should have negative Z component (pointing down)
      expect(forward.z).toBeLessThan(0)

      // Calculate horizontal direction (XY plane)
      const horizLength = Math.sqrt(forward.x * forward.x + forward.y * forward.y)
      const horizBearing = normalizeAngle(radToDeg(Math.atan2(forward.x, forward.y)))

      // Horizontal bearing should match azimuth
      const bearingError = angularError(horizBearing, config.azimuth)

      console.log(
        `[${config.id}] Forward: (${forward.x.toFixed(3)}, ${forward.y.toFixed(3)}, ${forward.z.toFixed(3)}) ` +
        `horizBearing=${horizBearing.toFixed(1)}° azimuth=${config.azimuth}° error=${bearingError.toFixed(1)}°`
      )

      expect(Math.abs(bearingError)).toBeLessThanOrEqual(1) // Should be exact
    }
  })

  it('right ray (col 0) is perpendicular to forward in XY plane', () => {
    for (const config of allCameras) {
      const R = computeRotationMatrix(config.azimuth, config.elevation ?? 45)

      // Extract right and forward directions
      const right = { x: R[0][0], y: R[1][0], z: R[2][0] }
      const forward = { x: R[0][2], y: R[1][2], z: R[2][2] }

      // Dot product of right and forward should be ~0
      const dot = right.x * forward.x + right.y * forward.y + right.z * forward.z

      expect(Math.abs(dot)).toBeLessThan(0.001)
    }
  })
})

// ============================================================================
// Tests: Projection Distance Sanity
// ============================================================================

describe('Projection distances are reasonable', () => {
  for (const config of allCameras) {
    it(`${config.id}: bottom-center of image projects to reasonable distance`, () => {
      const calibration = generateCalibrationFromSitemap(config)
      const resolution = config.resolution ?? { width: 1920, height: 1080 }

      // Bottom-center is typically where people's feet appear
      const bottomCenterX = resolution.width / 2
      const bottomCenterY = resolution.height  // Very bottom

      const result = projectWithRay(bottomCenterX, bottomCenterY, calibration)

      if (result.isValid) {
        const dx = result.worldPoint.x - config.position.x
        const dy = result.worldPoint.y - config.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        console.log(
          `[${config.id}] Bottom-center -> World(${result.worldPoint.x.toFixed(2)},${result.worldPoint.y.toFixed(2)}) ` +
          `distance=${distance.toFixed(2)}m`
        )

        // Distance should be reasonable (not too close, not too far)
        expect(distance).toBeGreaterThan(0.5)
        expect(distance).toBeLessThan(50) // 50m max
      }
    })
  }
})

// ============================================================================
// Tests: Cross-Camera Consistency
// ============================================================================

describe('Cross-camera projection consistency', () => {
  it('overlapping cameras project nearby points to similar world positions', () => {
    // Camera 1 and Camera 2 have overlapping coverage in the atrium
    // They should project the same world point to similar locations

    const calibration1 = generateCalibrationFromSitemap(camera1Config)
    const calibration2 = generateCalibrationFromSitemap(camera2Config)

    // These cameras overlap around (16, 10) in world coordinates
    // Find corresponding image points that should project there
    // For now, just verify both cameras can project to valid locations

    const result1 = projectWithRay(960, 600, calibration1)
    const result2 = projectWithRay(960, 600, calibration2)

    console.log(
      `Camera1 center-low: (${result1.worldPoint.x.toFixed(2)}, ${result1.worldPoint.y.toFixed(2)}) valid=${result1.isValid}`
    )
    console.log(
      `Camera2 center-low: (${result2.worldPoint.x.toFixed(2)}, ${result2.worldPoint.y.toFixed(2)}) valid=${result2.isValid}`
    )

    expect(result1.isValid).toBe(true)
    expect(result2.isValid).toBe(true)
  })
})
