/**
 * Sitemap Calibration Tests
 *
 * Tests for K/R/T matrix generation from sitemap camera geometry.
 */

import { describe, it, expect } from 'vitest'
import {
  computeIntrinsicMatrix,
  computeRotationMatrix,
  generateCalibrationFromSitemap,
  validateSitemapCamera,
  validateAllCameras,
} from '../../src/calibration/sitemap-calibration.js'
import { transformRayToWorld, degToRad } from '../../src/projection/ground-plane.js'
import type { SiteMapCameraConfig } from '../../src/types/camera.js'

describe('computeIntrinsicMatrix', () => {
  it('computes correct K matrix for 60 degree FOV at 1920x1080', () => {
    const K = computeIntrinsicMatrix(60, 1920, 1080)

    // tan(30) ≈ 0.577, so fx = 960 / 0.577 ≈ 1662.77
    expect(K[0][0]).toBeCloseTo(1662.77, 0)  // fx
    expect(K[1][1]).toBeCloseTo(1662.77, 0)  // fy = fx (square pixels)
    expect(K[0][2]).toBe(960)  // cx = width/2
    expect(K[1][2]).toBe(540)  // cy = height/2
    expect(K[2][2]).toBe(1)
  })

  it('computes correct K matrix for 90 degree FOV', () => {
    const K = computeIntrinsicMatrix(90, 1920, 1080)

    // tan(45) = 1, so fx = 960 / 1 = 960
    expect(K[0][0]).toBeCloseTo(960, 0)
    expect(K[1][1]).toBeCloseTo(960, 0)
  })

  it('computes correct K matrix for 75 degree FOV', () => {
    const K = computeIntrinsicMatrix(75, 1920, 1080)

    // tan(37.5) ≈ 0.767, so fx = 960 / 0.767 ≈ 1251.5
    expect(K[0][0]).toBeCloseTo(1251.5, 0)
  })
})

describe('computeRotationMatrix', () => {
  it('produces identity-like matrix for azimuth=90, elevation=0', () => {
    // At azimuth=90 (East), elevation=0 (horizontal):
    // Camera looking East means camera Z (forward) maps to world +X
    const R = computeRotationMatrix(90, 0)

    // Camera forward (0,0,1) should map to world East (+X direction)
    // R * [0,0,1]^T = R[:,2]
    const forward = { x: R[0][2], y: R[1][2], z: R[2][2] }

    // At az=90 (East), forward should be close to (1, 0, 0)
    expect(forward.x).toBeCloseTo(1, 5)
    expect(forward.y).toBeCloseTo(0, 5)
    expect(forward.z).toBeCloseTo(0, 5)
  })

  it('matches transformRayToWorld for forward ray', () => {
    const testCases = [
      { azimuth: 0, elevation: 45 },      // North, 45 down
      { azimuth: 90, elevation: 30 },     // East, 30 down
      { azimuth: 180, elevation: 60 },    // South, 60 down
      { azimuth: 270, elevation: 15 },    // West, 15 down
      { azimuth: 340, elevation: 35 },    // Camera1 actual values
      { azimuth: 52, elevation: 40 },     // Camera2 actual values
    ]

    for (const { azimuth, elevation } of testCases) {
      const R = computeRotationMatrix(azimuth, elevation)

      // Camera forward ray (0, 0, 1) transformed by R matrix
      const forwardFromR = {
        x: R[0][2],
        y: R[1][2],
        z: R[2][2],
      }

      // Same ray using existing transformRayToWorld function
      const forwardFromFunc = transformRayToWorld({ x: 0, y: 0, z: 1 }, azimuth, elevation)

      expect(forwardFromR.x).toBeCloseTo(forwardFromFunc.x, 5,
        `azimuth=${azimuth}, elevation=${elevation}: X mismatch`)
      expect(forwardFromR.y).toBeCloseTo(forwardFromFunc.y, 5,
        `azimuth=${azimuth}, elevation=${elevation}: Y mismatch`)
      expect(forwardFromR.z).toBeCloseTo(forwardFromFunc.z, 5,
        `azimuth=${azimuth}, elevation=${elevation}: Z mismatch`)
    }
  })

  it('matches transformRayToWorld for right ray', () => {
    const azimuth = 45
    const elevation = 30

    const R = computeRotationMatrix(azimuth, elevation)

    // Camera right ray (1, 0, 0) transformed by R matrix
    const rightFromR = {
      x: R[0][0],
      y: R[1][0],
      z: R[2][0],
    }

    // Same ray using existing function
    const rightFromFunc = transformRayToWorld({ x: 1, y: 0, z: 0 }, azimuth, elevation)

    expect(rightFromR.x).toBeCloseTo(rightFromFunc.x, 5)
    expect(rightFromR.y).toBeCloseTo(rightFromFunc.y, 5)
    expect(rightFromR.z).toBeCloseTo(rightFromFunc.z, 5)
  })

  it('produces downward-pointing ray for positive elevation', () => {
    // At azimuth=0 (North), elevation=45 (looking down)
    const R = computeRotationMatrix(0, 45)

    // Forward ray should point down (negative Z in world)
    const forward = { x: R[0][2], y: R[1][2], z: R[2][2] }

    expect(forward.z).toBeLessThan(0)  // Should be pointing down
  })
})

describe('generateCalibrationFromSitemap', () => {
  const camera1Config: SiteMapCameraConfig = {
    id: 'camera1',
    position: { x: 23, y: 4 },
    azimuth: 340,
    elevation: 35,
    height: 2.5,
    fieldOfView: 75,
    resolution: { width: 1920, height: 1080 },
  }

  it('generates valid calibration with all required fields', () => {
    const calibration = generateCalibrationFromSitemap(camera1Config)

    expect(calibration.K).toBeDefined()
    expect(calibration.K).toHaveLength(3)
    expect(calibration.R).toBeDefined()
    expect(calibration.R).toHaveLength(3)
    expect(calibration.T).toBeDefined()
    expect(calibration.T).toHaveLength(3)
    expect(calibration.center).toEqual([960, 540])
    expect(calibration.scale).toBe(1)
  })

  it('sets T vector from camera position and height', () => {
    const calibration = generateCalibrationFromSitemap(camera1Config)

    expect(calibration.T[0]).toBe(23)   // x from position
    expect(calibration.T[1]).toBe(4)    // y from position
    expect(calibration.T[2]).toBe(2.5)  // z from height
  })

  it('uses default resolution when not specified', () => {
    const configNoRes: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      height: 3,
      fieldOfView: 60,
    }

    const calibration = generateCalibrationFromSitemap(configNoRes)

    expect(calibration.center).toEqual([960, 540])  // 1920x1080 default
  })

  it('uses default elevation when not specified', () => {
    const configNoEl: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      height: 3,
      fieldOfView: 60,
    }

    // Should use 45 degree default elevation
    const calibration = generateCalibrationFromSitemap(configNoEl)

    // Verify R matrix was computed (not identity)
    const R = calibration.R
    expect(R[0][0]).not.toBe(1)  // Not identity matrix
  })

  it('does not include worldTransform (already in sitemap coords)', () => {
    const calibration = generateCalibrationFromSitemap(camera1Config)

    expect(calibration.worldTransform).toBeUndefined()
  })
})

describe('validateSitemapCamera', () => {
  it('accepts valid camera configuration', () => {
    const config: SiteMapCameraConfig = {
      id: 'camera1',
      position: { x: 23, y: 4 },
      azimuth: 340,
      elevation: 35,
      height: 2.5,
      fieldOfView: 75,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects zero height', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      height: 0,
      fieldOfView: 60,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('height'))).toBe(true)
  })

  it('rejects negative elevation', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      elevation: -10,
      height: 2,
      fieldOfView: 60,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('elevation'))).toBe(true)
  })

  it('rejects zero elevation', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      elevation: 0,
      height: 2,
      fieldOfView: 60,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(false)
  })

  it('warns about shallow elevation', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      elevation: 3,
      height: 2,
      fieldOfView: 60,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('shallow'))).toBe(true)
  })

  it('warns about wide FOV', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      elevation: 45,
      height: 2,
      fieldOfView: 130,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes('wide FOV'))).toBe(true)
  })

  it('rejects invalid FOV', () => {
    const config: SiteMapCameraConfig = {
      id: 'test',
      position: { x: 10, y: 10 },
      azimuth: 0,
      elevation: 45,
      height: 2,
      fieldOfView: 180,
    }

    const result = validateSitemapCamera(config)

    expect(result.valid).toBe(false)
  })
})

describe('validateAllCameras', () => {
  it('aggregates results from multiple cameras', () => {
    const configs: SiteMapCameraConfig[] = [
      {
        id: 'cam1',
        position: { x: 10, y: 10 },
        azimuth: 0,
        elevation: 45,
        height: 2,
        fieldOfView: 60,
      },
      {
        id: 'cam2',
        position: { x: 20, y: 20 },
        azimuth: 90,
        elevation: 0,  // Invalid
        height: 2,
        fieldOfView: 60,
      },
    ]

    const result = validateAllCameras(configs)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
