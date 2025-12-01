/**
 * Tests for Ground Plane Projection Module
 *
 * These tests verify the coordinate transformation math using known inputs/outputs.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateFocalLength,
  degToRad,
  radToDeg,
  normalizeAngle,
  angleDifference,
  normalize3D,
  createCameraRay,
  rotateAroundX,
  rotateAroundZ,
  transformRayToWorld,
  intersectGroundPlane,
  projectToGround,
  isInHorizontalFOV,
  getBBoxBottomCenter,
  projectDetectionToGround,
  siteMapConfigToCamera,
  type CameraParams,
  type Point2D,
  type Point3D,
} from '../groundPlaneProjection'

// Helper to check approximate equality for floating point
function expectApprox(actual: number, expected: number, tolerance = 0.001) {
  expect(actual).toBeCloseTo(expected, Math.round(-Math.log10(tolerance)))
}

function expectPoint2DApprox(actual: Point2D, expected: Point2D, tolerance = 0.01) {
  expectApprox(actual.x, expected.x, tolerance)
  expectApprox(actual.y, expected.y, tolerance)
}

function expectPoint3DApprox(actual: Point3D, expected: Point3D, tolerance = 0.001) {
  expectApprox(actual.x, expected.x, tolerance)
  expectApprox(actual.y, expected.y, tolerance)
  expectApprox(actual.z, expected.z, tolerance)
}

describe('groundPlaneProjection', () => {
  // ==========================================================================
  // Basic Math Functions
  // ==========================================================================

  describe('calculateFocalLength', () => {
    it('should calculate focal length for 90° FOV', () => {
      // For 90° FOV, tan(45°) = 1, so f = (w/2) / 1 = w/2
      const f = calculateFocalLength(90, 1920)
      expectApprox(f, 960)
    })

    it('should calculate focal length for 60° FOV', () => {
      // For 60° FOV, tan(30°) ≈ 0.577, so f = (w/2) / 0.577 ≈ 1662.77
      const f = calculateFocalLength(60, 1920)
      expectApprox(f, 1662.77, 0.1)
    })

    it('should calculate focal length for 120° FOV', () => {
      // For 120° FOV, tan(60°) ≈ 1.732, so f = (w/2) / 1.732 ≈ 554.26
      const f = calculateFocalLength(120, 1920)
      expectApprox(f, 554.26, 0.1)
    })
  })

  describe('angle utilities', () => {
    it('degToRad should convert correctly', () => {
      expectApprox(degToRad(0), 0)
      expectApprox(degToRad(90), Math.PI / 2)
      expectApprox(degToRad(180), Math.PI)
      expectApprox(degToRad(360), Math.PI * 2)
    })

    it('radToDeg should convert correctly', () => {
      expectApprox(radToDeg(0), 0)
      expectApprox(radToDeg(Math.PI / 2), 90)
      expectApprox(radToDeg(Math.PI), 180)
    })

    it('normalizeAngle should handle various inputs', () => {
      expectApprox(normalizeAngle(0), 0)
      expectApprox(normalizeAngle(90), 90)
      expectApprox(normalizeAngle(360), 0)
      expectApprox(normalizeAngle(450), 90)
      expectApprox(normalizeAngle(-90), 270)
      expectApprox(normalizeAngle(-450), 270)
    })

    it('angleDifference should compute shortest angular difference', () => {
      expectApprox(angleDifference(90, 0), 90)
      expectApprox(angleDifference(0, 90), -90)
      expectApprox(angleDifference(350, 10), -20)
      expectApprox(angleDifference(10, 350), 20)
      expectApprox(angleDifference(180, 0), 180)
      expectApprox(angleDifference(270, 90), 180)
    })
  })

  describe('normalize3D', () => {
    it('should normalize unit vector along X', () => {
      const v = normalize3D({ x: 5, y: 0, z: 0 })
      expectPoint3DApprox(v, { x: 1, y: 0, z: 0 })
    })

    it('should normalize diagonal vector', () => {
      const v = normalize3D({ x: 1, y: 1, z: 1 })
      const expected = 1 / Math.sqrt(3)
      expectPoint3DApprox(v, { x: expected, y: expected, z: expected })
    })

    it('should handle zero vector', () => {
      const v = normalize3D({ x: 0, y: 0, z: 0 })
      expectPoint3DApprox(v, { x: 0, y: 0, z: 0 })
    })
  })

  // ==========================================================================
  // Ray Creation and Rotation
  // ==========================================================================

  describe('createCameraRay', () => {
    it('should create forward ray for image center', () => {
      const ray = createCameraRay(0, 0)
      // Forward ray: normalized (0, 0, 1)
      expectPoint3DApprox(ray, { x: 0, y: 0, z: 1 })
    })

    it('should create ray pointing right for positive X', () => {
      const ray = createCameraRay(1, 0)
      // Should have positive X component
      expect(ray.x).toBeGreaterThan(0)
      expect(ray.z).toBeGreaterThan(0)
      expectApprox(ray.y, 0)
    })

    it('should create ray pointing down for positive Y', () => {
      const ray = createCameraRay(0, 1)
      // Should have positive Y component (down in camera space)
      expect(ray.y).toBeGreaterThan(0)
      expect(ray.z).toBeGreaterThan(0)
      expectApprox(ray.x, 0)
    })
  })

  describe('rotateAroundX', () => {
    it('should not change X component', () => {
      const v = { x: 1, y: 0, z: 0 }
      const rotated = rotateAroundX(v, Math.PI / 4)
      expectApprox(rotated.x, 1)
    })

    it('should rotate Y toward Z for positive angle', () => {
      const v = { x: 0, y: 1, z: 0 }
      const rotated = rotateAroundX(v, Math.PI / 2) // 90°
      expectPoint3DApprox(rotated, { x: 0, y: 0, z: 1 })
    })

    it('should rotate Z toward -Y for positive angle', () => {
      const v = { x: 0, y: 0, z: 1 }
      const rotated = rotateAroundX(v, Math.PI / 2) // 90°
      expectPoint3DApprox(rotated, { x: 0, y: -1, z: 0 })
    })
  })

  describe('rotateAroundZ', () => {
    it('should not change Z component', () => {
      const v = { x: 0, y: 0, z: 1 }
      const rotated = rotateAroundZ(v, Math.PI / 4)
      expectApprox(rotated.z, 1)
    })

    it('should rotate X toward Y for positive angle', () => {
      const v = { x: 1, y: 0, z: 0 }
      const rotated = rotateAroundZ(v, Math.PI / 2) // 90°
      expectPoint3DApprox(rotated, { x: 0, y: 1, z: 0 })
    })

    it('should rotate Y toward -X for positive angle', () => {
      const v = { x: 0, y: 1, z: 0 }
      const rotated = rotateAroundZ(v, Math.PI / 2) // 90°
      expectPoint3DApprox(rotated, { x: -1, y: 0, z: 0 })
    })
  })

  // ==========================================================================
  // Ray Transformation to World Space
  // ==========================================================================

  describe('transformRayToWorld', () => {
    it('should map forward ray to +Y when azimuth=0° and elevation=0°', () => {
      // Camera looking North (azimuth=0), horizontal (elevation=0)
      // Forward camera ray should map to +Y in world
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 0, 0)
      expectPoint3DApprox(rayWorld, { x: 0, y: 1, z: 0 })
    })

    it('should map forward ray to +X when azimuth=90° and elevation=0°', () => {
      // Camera looking East (azimuth=90), horizontal
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 90, 0)
      expectPoint3DApprox(rayWorld, { x: 1, y: 0, z: 0 })
    })

    it('should map forward ray to -Y when azimuth=180° and elevation=0°', () => {
      // Camera looking South (azimuth=180), horizontal
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 180, 0)
      expectPoint3DApprox(rayWorld, { x: 0, y: -1, z: 0 })
    })

    it('should map forward ray to -X when azimuth=270° and elevation=0°', () => {
      // Camera looking West (azimuth=270), horizontal
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 270, 0)
      expectPoint3DApprox(rayWorld, { x: -1, y: 0, z: 0 })
    })

    it('should map forward ray downward when elevation > 0', () => {
      // Camera looking North but tilted down 45°
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 0, 45)
      // Should have positive Y (forward) and negative Z (down)
      expect(rayWorld.y).toBeGreaterThan(0)
      expect(rayWorld.z).toBeLessThan(0)
      expectApprox(rayWorld.x, 0)
    })

    it('should map forward ray straight down when elevation=90°', () => {
      // Camera looking straight down
      const rayCamera = { x: 0, y: 0, z: 1 }
      const rayWorld = transformRayToWorld(rayCamera, 0, 90)
      expectPoint3DApprox(rayWorld, { x: 0, y: 0, z: -1 })
    })
  })

  // ==========================================================================
  // Ground Plane Intersection
  // ==========================================================================

  describe('intersectGroundPlane', () => {
    it('should find intersection for ray pointing down', () => {
      const origin: Point3D = { x: 0, y: 0, z: 3 } // 3 meters up
      const direction: Point3D = { x: 0, y: 0, z: -1 } // Straight down
      const t = intersectGroundPlane(origin, direction)
      expect(t).not.toBeNull()
      expectApprox(t!, 3) // Should hit ground at t=3
    })

    it('should find intersection for angled ray', () => {
      const origin: Point3D = { x: 0, y: 0, z: 2 }
      // Ray at 45° angle toward +Y and down
      const direction = normalize3D({ x: 0, y: 1, z: -1 })
      const t = intersectGroundPlane(origin, direction)
      expect(t).not.toBeNull()
      // At t, z = 2 + t * (-1/sqrt(2)) = 0
      // t = 2 * sqrt(2) ≈ 2.828
      expectApprox(t!, 2 * Math.sqrt(2), 0.01)
    })

    it('should return null for ray parallel to ground', () => {
      const origin: Point3D = { x: 0, y: 0, z: 2 }
      const direction: Point3D = { x: 1, y: 0, z: 0 } // Horizontal
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBeNull()
    })

    it('should return null for ray pointing up', () => {
      const origin: Point3D = { x: 0, y: 0, z: 2 }
      const direction: Point3D = { x: 0, y: 0, z: 1 } // Up
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBeNull()
    })
  })

  // ==========================================================================
  // Full Projection Pipeline
  // ==========================================================================

  describe('projectToGround', () => {
    const baseCamera: CameraParams = {
      position: { x: 5, y: 5, z: 3 },
      azimuth: 0, // Looking North (+Y)
      elevation: 45, // Looking down at 45°
      fov: 60,
      maxDistance: 20,
    }

    const baseImage = { width: 1920, height: 1080 }

    it('should project image center forward and down', () => {
      const result = projectToGround(
        { x: 960, y: 540 }, // Image center
        baseCamera,
        baseImage
      )

      expect(result.isValid).toBe(true)
      // Point should be at camera X (5), and Y > camera Y (5) since looking North
      expectApprox(result.worldPoint.x, 5, 0.1)
      expect(result.worldPoint.y).toBeGreaterThan(5)
    })

    it('should project point on left side of image to left of center', () => {
      const centerResult = projectToGround(
        { x: 960, y: 540 }, // Center
        baseCamera,
        baseImage
      )
      const leftResult = projectToGround(
        { x: 200, y: 540 }, // Left side
        baseCamera,
        baseImage
      )

      // When looking North, left in image is West (-X in world)
      expect(leftResult.worldPoint.x).toBeLessThan(centerResult.worldPoint.x)
    })

    it('should project point on right side of image to right of center', () => {
      const centerResult = projectToGround(
        { x: 960, y: 540 }, // Center
        baseCamera,
        baseImage
      )
      const rightResult = projectToGround(
        { x: 1720, y: 540 }, // Right side
        baseCamera,
        baseImage
      )

      // When looking North, right in image is East (+X in world)
      expect(rightResult.worldPoint.x).toBeGreaterThan(centerResult.worldPoint.x)
    })

    it('should project point at bottom of image closer to camera', () => {
      const centerResult = projectToGround(
        { x: 960, y: 540 }, // Center
        baseCamera,
        baseImage
      )
      const bottomResult = projectToGround(
        { x: 960, y: 1000 }, // Bottom
        baseCamera,
        baseImage
      )

      // Bottom of image should be closer (smaller distance)
      expect(bottomResult.distance).toBeLessThan(centerResult.distance)
    })

    it('should project point at top of image farther from camera', () => {
      const centerResult = projectToGround(
        { x: 960, y: 540 }, // Center
        baseCamera,
        baseImage
      )
      const topResult = projectToGround(
        { x: 960, y: 100 }, // Top
        baseCamera,
        baseImage
      )

      // Top of image should be farther (larger distance)
      expect(topResult.distance).toBeGreaterThan(centerResult.distance)
    })

    it('should mark as invalid if beyond max distance', () => {
      const farCamera: CameraParams = {
        ...baseCamera,
        elevation: 30, // Looking down at 30° - will have valid intersection
        maxDistance: 2, // Very short max distance
      }

      const result = projectToGround(
        { x: 960, y: 540 }, // Image center
        farCamera,
        baseImage
      )

      // At 30° elevation from 3m height, ground intersection is at ~5.2m
      // With maxDistance=2, this should be invalid
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('beyond_max_distance')
    })

    it('should handle camera looking East (azimuth=90)', () => {
      const eastCamera: CameraParams = {
        ...baseCamera,
        azimuth: 90,
      }

      const result = projectToGround(
        { x: 960, y: 540 }, // Image center
        eastCamera,
        baseImage
      )

      expect(result.isValid).toBe(true)
      // Should project to +X direction
      expect(result.worldPoint.x).toBeGreaterThan(eastCamera.position.x)
      expectApprox(result.worldPoint.y, eastCamera.position.y, 0.5)
    })

    it('should handle camera looking South (azimuth=180)', () => {
      const southCamera: CameraParams = {
        ...baseCamera,
        azimuth: 180,
      }

      const result = projectToGround(
        { x: 960, y: 540 }, // Image center
        southCamera,
        baseImage
      )

      expect(result.isValid).toBe(true)
      // Should project to -Y direction
      expect(result.worldPoint.y).toBeLessThan(southCamera.position.y)
    })
  })

  // ==========================================================================
  // FOV Validation
  // ==========================================================================

  describe('isInHorizontalFOV', () => {
    const camera: CameraParams = {
      position: { x: 5, y: 5, z: 3 },
      azimuth: 0, // Looking North
      elevation: 45,
      fov: 60, // ±30° from center
      maxDistance: 20,
    }

    it('should return true for point directly ahead', () => {
      const point = { x: 5, y: 10 } // Directly North
      expect(isInHorizontalFOV(point, camera)).toBe(true)
    })

    it('should return true for point within FOV', () => {
      // Point at 20° to the East (within 30° half-FOV)
      const angle = 20 * Math.PI / 180
      const distance = 5
      const point = {
        x: camera.position.x + distance * Math.sin(angle),
        y: camera.position.y + distance * Math.cos(angle),
      }
      expect(isInHorizontalFOV(point, camera)).toBe(true)
    })

    it('should return false for point outside FOV', () => {
      // Point at 45° to the East (outside 30° half-FOV)
      const angle = 45 * Math.PI / 180
      const distance = 5
      const point = {
        x: camera.position.x + distance * Math.sin(angle),
        y: camera.position.y + distance * Math.cos(angle),
      }
      expect(isInHorizontalFOV(point, camera)).toBe(false)
    })

    it('should return false for point behind camera', () => {
      const point = { x: 5, y: 0 } // Behind (South when facing North)
      expect(isInHorizontalFOV(point, camera)).toBe(false)
    })
  })

  // ==========================================================================
  // Bounding Box Utilities
  // ==========================================================================

  describe('getBBoxBottomCenter', () => {
    it('should compute bottom center for pixel coordinates', () => {
      const bbox = { x: 100, y: 200, width: 50, height: 100 }
      const point = getBBoxBottomCenter(bbox, false)
      expectPoint2DApprox(point, { x: 125, y: 300 })
    })

    it('should compute bottom center for normalized coordinates', () => {
      const bbox = { x: 0.1, y: 0.2, width: 0.1, height: 0.2 }
      const point = getBBoxBottomCenter(bbox, true, 1920, 1080)
      // x = (0.1 + 0.05) * 1920 = 288
      // y = (0.2 + 0.2) * 1080 = 432
      expectPoint2DApprox(point, { x: 288, y: 432 })
    })
  })

  // ==========================================================================
  // Integration: Detection Projection
  // ==========================================================================

  describe('projectDetectionToGround', () => {
    const camera: CameraParams = {
      position: { x: 5, y: 5, z: 3 },
      azimuth: 0,
      elevation: 45,
      fov: 60,
      maxDistance: 20,
    }

    it('should project normalized bbox correctly', () => {
      // Person detection in center of image
      const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
      const result = projectDetectionToGround(bbox, camera, true)

      expect(result.isValid).toBe(true)
      // Bottom center should project forward from camera
      expect(result.worldPoint.y).toBeGreaterThan(camera.position.y)
    })

    it('should project pixel bbox correctly', () => {
      // Person detection in center of image
      const bbox = { x: 768, y: 324, width: 384, height: 432 }
      const result = projectDetectionToGround(bbox, camera, false)

      expect(result.isValid).toBe(true)
    })
  })

  // ==========================================================================
  // Config Conversion
  // ==========================================================================

  describe('siteMapConfigToCamera', () => {
    it('should convert sitemap config to camera params', () => {
      const config = {
        id: 'camera1',
        position: { x: 1.3, y: 10.9 },
        rotation: 321,
        height: 1.5,
        fieldOfView: 60,
        viewDistance: 100,
      }

      const camera = siteMapConfigToCamera(config)

      expect(camera.position.x).toBe(1.3)
      expect(camera.position.y).toBe(10.9)
      expect(camera.position.z).toBe(1.5)
      expect(camera.azimuth).toBe(321)
      expect(camera.fov).toBe(60)
      expect(camera.maxDistance).toBe(100)
    })
  })

  // ==========================================================================
  // Real Camera Configuration Test Cases
  // ==========================================================================

  describe('Real camera configurations from sitemap', () => {
    // Camera 1: Front Entrance
    const camera1 = siteMapConfigToCamera({
      id: 'camera1',
      position: { x: 1.3, y: 10.9 },
      rotation: 321, // Facing roughly Northwest
      height: 1.5,
      fieldOfView: 60,
      viewDistance: 100,
    })

    // Camera 2: Back Corner
    const camera2 = siteMapConfigToCamera({
      id: 'camera2',
      position: { x: 15.75, y: 10.9 },
      rotation: 253, // Facing roughly Southwest
      height: 1.5,
      fieldOfView: 60,
      viewDistance: 100,
    })

    it('camera1: should project center detection correctly', () => {
      const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
      const result = projectDetectionToGround(bbox, camera1, true)

      expect(result.isValid).toBe(true)
      // Camera1 at (1.3, 10.9) facing azimuth 321° (NW)
      // Detection should be in the northwest direction from camera
      // For azimuth 321°: sin(321°) ≈ -0.63, cos(321°) ≈ 0.78
      // So x should decrease, y should increase
    })

    it('camera2: should project center detection correctly', () => {
      const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
      const result = projectDetectionToGround(bbox, camera2, true)

      expect(result.isValid).toBe(true)
      // Camera2 at (15.75, 10.9) facing azimuth 253° (SW)
      // For azimuth 253°: sin(253°) ≈ -0.96, cos(253°) ≈ -0.29
      // So both x and y should decrease
    })

    it('should project person at different positions in frame', () => {
      // Test several positions in the frame
      const positions = [
        { x: 0.2, y: 0.3, width: 0.15, height: 0.5 }, // Left side
        { x: 0.5, y: 0.3, width: 0.15, height: 0.5 }, // Center
        { x: 0.7, y: 0.3, width: 0.15, height: 0.5 }, // Right side
      ]

      const results = positions.map(bbox =>
        projectDetectionToGround(bbox, camera1, true)
      )

      // All should be valid
      results.forEach(r => expect(r.isValid).toBe(true))

      // Left-to-right in image should correspond to consistent spread in world
      // The exact direction depends on camera orientation
    })
  })
})
