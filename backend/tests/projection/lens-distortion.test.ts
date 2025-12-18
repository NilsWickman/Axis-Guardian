/**
 * Lens Distortion Tests
 */

import { describe, it, expect } from 'vitest'
import {
  undistortPoint,
  distortPoint,
  getDistortionMagnitude,
  hasSignificantDistortion,
  ZERO_DISTORTION,
  TYPICAL_SURVEILLANCE_DISTORTION,
} from '../../src/projection/lens-distortion.js'
import type { DistortionCoeffs } from '../../src/types.js'

describe('Lens Distortion', () => {
  // Typical camera parameters
  const fx = 1662.7687752661222  // Focal length x
  const fy = 1662.7687752661222  // Focal length y
  const cx = 960  // Principal point x (center of 1920x1080)
  const cy = 540  // Principal point y

  describe('undistortPoint', () => {
    it('returns same point for zero distortion', () => {
      const result = undistortPoint(100, 200, fx, fy, cx, cy, ZERO_DISTORTION)

      // With zero distortion, output should match input
      expect(result.x).toBeCloseTo(100, 5)
      expect(result.y).toBeCloseTo(200, 5)
    })

    it('modifies edge points with barrel distortion', () => {
      const coeffs: DistortionCoeffs = { k1: -0.1, k2: 0, k3: 0, p1: 0, p2: 0 }

      // Point at edge of image (high radius)
      const edgeX = 1800
      const edgeY = 1000
      const result = undistortPoint(edgeX, edgeY, fx, fy, cx, cy, coeffs)

      // The point should be moved from its original position
      expect(result.x).not.toBe(edgeX)
      expect(result.y).not.toBe(edgeY)
    })

    it('modifies edge points with pincushion distortion', () => {
      const coeffs: DistortionCoeffs = { k1: 0.1, k2: 0, k3: 0, p1: 0, p2: 0 }

      // Point at edge of image
      const edgeX = 1800
      const edgeY = 1000
      const result = undistortPoint(edgeX, edgeY, fx, fy, cx, cy, coeffs)

      // The point should be moved
      expect(result.x).not.toBe(edgeX)
    })

    it('has minimal effect at image center', () => {
      const coeffs: DistortionCoeffs = { k1: -0.2, k2: 0.05, k3: 0, p1: 0.001, p2: 0.001 }

      // Point at center of image
      const centerResult = undistortPoint(cx, cy, fx, fy, cx, cy, coeffs)

      // At the optical center, there should be minimal distortion
      expect(centerResult.x).toBeCloseTo(cx, 0)
      expect(centerResult.y).toBeCloseTo(cy, 0)
    })

    it('applies tangential distortion correction', () => {
      const coeffs: DistortionCoeffs = { k1: 0, k2: 0, k3: 0, p1: 0.01, p2: 0.01 }

      // Point away from center
      const result = undistortPoint(1200, 700, fx, fy, cx, cy, coeffs)

      // With tangential distortion, result should differ from input
      expect(result.x).not.toBe(1200)
      expect(result.y).not.toBe(700)
    })
  })

  describe('distortPoint', () => {
    it('is the inverse of undistortPoint', () => {
      const coeffs: DistortionCoeffs = { k1: -0.1, k2: 0.02, k3: 0, p1: 0.001, p2: 0.001 }

      const originalX = 1500
      const originalY = 800

      // Apply undistort then distort - should get back to original
      const undistorted = undistortPoint(originalX, originalY, fx, fy, cx, cy, coeffs)
      const reDistorted = distortPoint(undistorted.x, undistorted.y, fx, fy, cx, cy, coeffs)

      // Should be close to original
      expect(reDistorted.x).toBeCloseTo(originalX, 0)
      expect(reDistorted.y).toBeCloseTo(originalY, 0)
    })
  })

  describe('getDistortionMagnitude', () => {
    it('returns zero at image center', () => {
      const coeffs: DistortionCoeffs = { k1: -0.2, k2: 0.05, k3: 0, p1: 0, p2: 0 }

      const magnitude = getDistortionMagnitude(cx, cy, fx, fy, cx, cy, coeffs)

      expect(magnitude).toBeCloseTo(0, 0)
    })

    it('increases toward image edges', () => {
      const coeffs: DistortionCoeffs = { k1: -0.1, k2: 0, k3: 0, p1: 0, p2: 0 }

      const centerMag = getDistortionMagnitude(cx + 100, cy, fx, fy, cx, cy, coeffs)
      const edgeMag = getDistortionMagnitude(cx + 400, cy, fx, fy, cx, cy, coeffs)

      expect(edgeMag).toBeGreaterThan(centerMag)
    })

    it('returns zero for zero distortion', () => {
      const magnitude = getDistortionMagnitude(1500, 800, fx, fy, cx, cy, ZERO_DISTORTION)

      expect(magnitude).toBe(0)
    })
  })

  describe('hasSignificantDistortion', () => {
    it('returns false for zero distortion', () => {
      expect(hasSignificantDistortion(ZERO_DISTORTION)).toBe(false)
    })

    it('returns true for typical surveillance distortion', () => {
      expect(hasSignificantDistortion(TYPICAL_SURVEILLANCE_DISTORTION)).toBe(true)
    })

    it('returns true when any coefficient exceeds threshold', () => {
      const k1Only: DistortionCoeffs = { k1: 0.1, k2: 0, k3: 0, p1: 0, p2: 0 }
      const p1Only: DistortionCoeffs = { k1: 0, k2: 0, k3: 0, p1: 0.01, p2: 0 }

      expect(hasSignificantDistortion(k1Only)).toBe(true)
      expect(hasSignificantDistortion(p1Only)).toBe(true)
    })

    it('respects custom threshold', () => {
      const smallDistortion: DistortionCoeffs = { k1: 0.0005, k2: 0, k3: 0, p1: 0, p2: 0 }

      expect(hasSignificantDistortion(smallDistortion, 0.001)).toBe(false)
      expect(hasSignificantDistortion(smallDistortion, 0.0001)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles points at image boundaries', () => {
      const coeffs: DistortionCoeffs = { k1: -0.2, k2: 0.05, k3: 0, p1: 0, p2: 0 }

      // Corner of a 1920x1080 image
      const result = undistortPoint(1919, 1079, fx, fy, cx, cy, coeffs)

      expect(isFinite(result.x)).toBe(true)
      expect(isFinite(result.y)).toBe(true)
    })

    it('handles points outside image boundaries', () => {
      const coeffs: DistortionCoeffs = { k1: -0.2, k2: 0.05, k3: 0, p1: 0, p2: 0 }

      // Point outside typical image area
      const result = undistortPoint(2500, -100, fx, fy, cx, cy, coeffs)

      expect(isFinite(result.x)).toBe(true)
      expect(isFinite(result.y)).toBe(true)
    })

    it('handles extreme distortion values gracefully', () => {
      const coeffs: DistortionCoeffs = { k1: -0.5, k2: 0.3, k3: -0.1, p1: 0.01, p2: 0.01 }

      // This should not crash
      const result = undistortPoint(1500, 800, fx, fy, cx, cy, coeffs)

      expect(isFinite(result.x)).toBe(true)
      expect(isFinite(result.y)).toBe(true)
    })
  })
})
