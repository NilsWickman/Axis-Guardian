/**
 * Tests for K/R/T Camera Calibration Projection
 *
 * Validates the implementation against the formula from the Auditorium dataset:
 *   A = K * R
 *   A = [A(:, 1:2), [cx - x; cy - y; -1]]
 *   KRT = K * R * T
 *   p = A \ KRT
 *
 * Note: The projection formula solves for [X, Y, lambda] where:
 *   - X, Y are world coordinates on the ground plane (Z=0)
 *   - lambda is the depth scale factor (should be positive for valid projections)
 */

import { describe, it, expect } from 'vitest'
import { projectWithKRT, projectDetectionWithKRT } from './ground-plane.js'
import type { CameraCalibration } from '../types.js'

// HC3 calibration from cam_param.mat
const HC3_CALIBRATION: CameraCalibration = {
  K: [
    [1480, 0, 0],
    [0, 1480, 0],
    [0, 0, 1],
  ],
  R: [
    [0.26415998, 0.96365108, -0.0399512],
    [0.01284627, -0.04493433, -0.99890734],
    [-0.96439332, 0.26335812, -0.02424917],
  ],
  T: [8.319724452629636, 13.445955713668864, 1.5930329257377853],
  center: [960, 540],
  scale: 1,
}

// HC4 calibration from cam_param.mat
const HC4_CALIBRATION: CameraCalibration = {
  K: [
    [2350, 0, 0],
    [0, 2350, 0],
    [0, 0, 1],
  ],
  R: [
    [1, 0, 0],
    [0, -0.08715574274765801, -0.9961946980917455],
    [0, 0.9961946980917455, -0.08715574274765801],
  ],
  T: [0, 0, 1.5],
  center: [960, 540],
  scale: 1,
}

describe('projectWithKRT', () => {
  describe('HC3 camera (angled view)', () => {
    it('should project image center to a valid world point', () => {
      // Image center (960, 540) - looking far into the scene
      const result = projectWithKRT(960, 540, HC3_CALIBRATION)

      expect(result.isValid).toBe(true)
      // Verified with Python: center projects to approx (-55.04, 30.75)
      // This is far from camera because the view angle intersects ground far away
      expect(result.worldPoint.x).toBeCloseTo(-55.04, 0)
      expect(result.worldPoint.y).toBeCloseTo(30.75, 0)
    })

    it('should project bottom of image to points near the camera', () => {
      // Bottom center of image (960, 1080) - closest visible ground
      const result = projectWithKRT(960, 1080, HC3_CALIBRATION)

      expect(result.isValid).toBe(true)
      // Verified with Python: (4.39, 14.46)
      expect(result.worldPoint.x).toBeCloseTo(4.39, 0)
      expect(result.worldPoint.y).toBeCloseTo(14.46, 0)
    })

    it('should project typical detection positions to reasonable scene locations', () => {
      // Typical person detection at y=864 (bottom of bbox at 80% of image height)
      const result = projectWithKRT(960, 864, HC3_CALIBRATION)

      expect(result.isValid).toBe(true)
      // Should be in the visible scene region: X around 0-5, Y around 12-17
      expect(result.worldPoint.x).toBeGreaterThan(-3)
      expect(result.worldPoint.x).toBeLessThan(10)
      expect(result.worldPoint.y).toBeGreaterThan(10)
      expect(result.worldPoint.y).toBeLessThan(20)
    })

    it('should handle edge cases at image corners', () => {
      // Bottom-left corner (0, 1080)
      const bottomLeft = projectWithKRT(0, 1080, HC3_CALIBRATION)
      expect(bottomLeft.isValid).toBe(true)
      expect(bottomLeft.worldPoint.x).toBeCloseTo(3.35, 0)
      expect(bottomLeft.worldPoint.y).toBeCloseTo(11.79, 0)

      // Bottom-right corner (1920, 1080)
      const bottomRight = projectWithKRT(1920, 1080, HC3_CALIBRATION)
      expect(bottomRight.isValid).toBe(true)
      expect(bottomRight.worldPoint.x).toBeCloseTo(5.29, 0)
      expect(bottomRight.worldPoint.y).toBeCloseTo(16.80, 0)
    })
  })

  describe('HC4 camera (overhead view)', () => {
    it('should project image center correctly', () => {
      // HC4 is at (0, 0, 1.5) looking nearly straight down (85° elevation)
      const result = projectWithKRT(960, 540, HC4_CALIBRATION)

      expect(result.isValid).toBe(true)
      // Verified with Python: center projects to (0, 17.15)
      // X is 0 because camera is aligned with Y axis
      expect(result.worldPoint.x).toBeCloseTo(0, 0)
      expect(result.worldPoint.y).toBeCloseTo(17.15, 0)
    })

    it('should project symmetrically for overhead camera', () => {
      // Left of center
      const left = projectWithKRT(460, 540, HC4_CALIBRATION)
      // Right of center
      const right = projectWithKRT(1460, 540, HC4_CALIBRATION)

      expect(left.isValid).toBe(true)
      expect(right.isValid).toBe(true)

      // X coordinates should be opposite signs (symmetric about center)
      expect(left.worldPoint.x).toBeLessThan(0)
      expect(right.worldPoint.x).toBeGreaterThan(0)
      // Y coordinates should be similar (same row in image)
      expect(left.worldPoint.y).toBeCloseTo(right.worldPoint.y, 0)
    })

    it('should project bottom of image to closer positions', () => {
      const bottom = projectWithKRT(960, 1080, HC4_CALIBRATION)
      const center = projectWithKRT(960, 540, HC4_CALIBRATION)

      expect(bottom.isValid).toBe(true)
      // Bottom of image is closer to camera
      expect(bottom.worldPoint.y).toBeLessThan(center.worldPoint.y)
    })
  })
})

describe('projectDetectionWithKRT', () => {
  it('should project normalized bbox correctly', () => {
    // Person detection (normalized coords)
    // Foot position = bottom center of bbox
    const bbox = {
      x: 0.4,  // Left edge at 40% of image
      y: 0.3,  // Top edge at 30% of image
      width: 0.1,  // 10% of image width
      height: 0.4, // 40% of image height
    }

    const result = projectDetectionWithKRT(bbox, HC3_CALIBRATION, true, 1920, 1080)

    expect(result.isValid).toBe(true)
    // Foot position: x = (0.4 + 0.05) * 1920 = 864, y = (0.3 + 0.4) * 1080 = 756
    // Should project to valid scene coordinates
    expect(result.worldPoint.x).toBeGreaterThan(-10)
    expect(result.worldPoint.x).toBeLessThan(15)
    expect(result.worldPoint.y).toBeGreaterThan(10)
    expect(result.worldPoint.y).toBeLessThan(25)
  })

  it('should project pixel bbox correctly', () => {
    // Person detection at center of image (pixel coords)
    const bbox = {
      x: 800,
      y: 400,
      width: 200,
      height: 400,
    }

    const result = projectDetectionWithKRT(bbox, HC3_CALIBRATION, false, 1920, 1080)

    expect(result.isValid).toBe(true)
    // Foot position at (900, 800) - lower half of image
    expect(result.worldPoint.x).toBeGreaterThan(-5)
    expect(result.worldPoint.x).toBeLessThan(10)
  })

  it('should project detections to reasonable scene positions', () => {
    // Detection of a person in the lower portion of image (realistic detection)
    const bbox = {
      x: 0.3,
      y: 0.4,
      width: 0.15,
      height: 0.5, // Bottom at 90% of image height
    }

    const result = projectDetectionWithKRT(bbox, HC3_CALIBRATION, true, 1920, 1080)

    expect(result.isValid).toBe(true)
    // For HC3, visible detection area is roughly X: [-2, 5], Y: [12, 17]
    expect(result.worldPoint.x).toBeGreaterThan(-5)
    expect(result.worldPoint.x).toBeLessThan(15)
    expect(result.worldPoint.y).toBeGreaterThan(10)
    expect(result.worldPoint.y).toBeLessThan(25)
  })
})

describe('K/R/T matrix math', () => {
  it('should handle identity rotation correctly', () => {
    // Create a simple calibration with identity rotation
    const simpleCalibration: CameraCalibration = {
      K: [
        [1000, 0, 0],
        [0, 1000, 0],
        [0, 0, 1],
      ],
      R: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      T: [0, 0, 2], // Camera 2m above origin
      center: [500, 500],
      scale: 1,
    }

    const result = projectWithKRT(500, 500, simpleCalibration)
    expect(result.isValid).toBe(true)
  })

  it('should reject singular matrix cases gracefully', () => {
    // Degenerate calibration (should still not crash)
    const badCalibration: CameraCalibration = {
      K: [
        [1000, 0, 0],
        [0, 1000, 0],
        [0, 0, 1],
      ],
      R: [
        [0, 0, 0],  // Zero rotation = singular
        [0, 0, 0],
        [0, 0, 0],
      ],
      T: [0, 0, 1],
      center: [500, 500],
      scale: 1,
    }

    const result = projectWithKRT(500, 500, badCalibration)
    // Should return invalid (singular matrix)
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('singular_matrix')
  })
})

describe('Scene coverage tests', () => {
  it('should produce valid projections for detection region (lower half of image)', () => {
    // Test detection positions in the lower half of image where people appear
    // Upper half projects too far away for realistic tracking
    const testPoints = [
      { x: 480, y: 800 },  // Left, lower
      { x: 960, y: 800 },  // Center, lower
      { x: 1440, y: 800 }, // Right, lower
      { x: 960, y: 900 },  // Center, very low
      { x: 960, y: 1000 }, // Center, bottom
    ]

    for (const point of testPoints) {
      const result = projectWithKRT(point.x, point.y, HC3_CALIBRATION)
      expect(result.isValid).toBe(true)

      // Projections from lower image region should be within usable scene bounds
      expect(result.worldPoint.x).toBeGreaterThan(-5)
      expect(result.worldPoint.x).toBeLessThan(10)
      expect(result.worldPoint.y).toBeGreaterThan(10)
      expect(result.worldPoint.y).toBeLessThan(25)
    }
  })

  it('should handle projections from upper image regions (far from camera)', () => {
    // Upper regions project to far distances - still valid but outside tracking area
    const result = projectWithKRT(960, 300, HC3_CALIBRATION)
    expect(result.isValid).toBe(true)
    // These will be far from camera, but mathematically valid
  })
})
