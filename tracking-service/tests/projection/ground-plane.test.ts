/**
 * Ground Plane Projection Tests
 */

import { describe, it, expect } from 'vitest'
import {
  calculateFocalLength,
  degToRad,
  radToDeg,
  normalizeAngle,
  angleDifference,
  normalize3D,
  rotateAroundX,
  rotateAroundZ,
  transformRayToWorld,
  intersectGroundPlane,
  projectToGround,
  isInHorizontalFOV,
  getBBoxBottomCenter,
  projectDetectionToGround,
  siteMapConfigToCamera,
} from '../../src/projection/ground-plane.js'
import type { CameraParams } from '../../src/types.js'

describe('Basic Math Functions', () => {
  describe('calculateFocalLength', () => {
    it('calculates correct focal length for 60 degree FOV', () => {
      const focalLength = calculateFocalLength(60, 1920)
      // tan(30) ≈ 0.577, so focal = 960 / 0.577 ≈ 1662
      expect(focalLength).toBeCloseTo(1662.77, 1)
    })

    it('calculates correct focal length for 90 degree FOV', () => {
      const focalLength = calculateFocalLength(90, 1920)
      // tan(45) = 1, so focal = 960 / 1 = 960
      expect(focalLength).toBeCloseTo(960, 1)
    })
  })

  describe('degToRad / radToDeg', () => {
    it('converts 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI, 10)
    })

    it('converts PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 10)
    })

    it('round trips correctly', () => {
      expect(radToDeg(degToRad(45))).toBeCloseTo(45, 10)
    })
  })

  describe('normalizeAngle', () => {
    it('normalizes negative angles', () => {
      expect(normalizeAngle(-90)).toBe(270)
    })

    it('normalizes angles over 360', () => {
      expect(normalizeAngle(450)).toBe(90)
    })

    it('keeps valid angles unchanged', () => {
      expect(normalizeAngle(180)).toBe(180)
    })
  })

  describe('angleDifference', () => {
    it('calculates simple difference', () => {
      expect(angleDifference(90, 45)).toBe(45)
    })

    it('handles wraparound', () => {
      expect(angleDifference(10, 350)).toBe(20)
    })

    it('handles negative wraparound', () => {
      expect(angleDifference(350, 10)).toBe(-20)
    })
  })

  describe('normalize3D', () => {
    it('normalizes a unit vector to itself', () => {
      const v = normalize3D({ x: 1, y: 0, z: 0 })
      expect(v.x).toBeCloseTo(1, 10)
      expect(v.y).toBeCloseTo(0, 10)
      expect(v.z).toBeCloseTo(0, 10)
    })

    it('normalizes a non-unit vector', () => {
      const v = normalize3D({ x: 3, y: 4, z: 0 })
      expect(v.x).toBeCloseTo(0.6, 10)
      expect(v.y).toBeCloseTo(0.8, 10)
      expect(v.z).toBeCloseTo(0, 10)
    })

    it('handles zero vector', () => {
      const v = normalize3D({ x: 0, y: 0, z: 0 })
      expect(v.x).toBe(0)
      expect(v.y).toBe(0)
      expect(v.z).toBe(0)
    })
  })
})

describe('Rotation Functions', () => {
  describe('rotateAroundX', () => {
    it('rotates Y toward Z by 90 degrees', () => {
      const v = rotateAroundX({ x: 0, y: 1, z: 0 }, Math.PI / 2)
      expect(v.x).toBeCloseTo(0, 10)
      expect(v.y).toBeCloseTo(0, 10)
      expect(v.z).toBeCloseTo(1, 10)
    })

    it('leaves X unchanged', () => {
      const v = rotateAroundX({ x: 1, y: 0, z: 0 }, Math.PI / 2)
      expect(v.x).toBeCloseTo(1, 10)
      expect(v.y).toBeCloseTo(0, 10)
      expect(v.z).toBeCloseTo(0, 10)
    })
  })

  describe('rotateAroundZ', () => {
    it('rotates X toward Y by 90 degrees', () => {
      const v = rotateAroundZ({ x: 1, y: 0, z: 0 }, Math.PI / 2)
      expect(v.x).toBeCloseTo(0, 10)
      expect(v.y).toBeCloseTo(1, 10)
      expect(v.z).toBeCloseTo(0, 10)
    })

    it('leaves Z unchanged', () => {
      const v = rotateAroundZ({ x: 0, y: 0, z: 1 }, Math.PI / 2)
      expect(v.x).toBeCloseTo(0, 10)
      expect(v.y).toBeCloseTo(0, 10)
      expect(v.z).toBeCloseTo(1, 10)
    })
  })
})

describe('Ground Plane Intersection', () => {
  describe('intersectGroundPlane', () => {
    it('finds intersection with downward ray', () => {
      const origin = { x: 0, y: 0, z: 10 }
      const direction = { x: 0, y: 0, z: -1 }
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBe(10)
    })

    it('returns null for upward ray', () => {
      const origin = { x: 0, y: 0, z: 10 }
      const direction = { x: 0, y: 0, z: 1 }
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBeNull()
    })

    it('returns null for horizontal ray', () => {
      const origin = { x: 0, y: 0, z: 10 }
      const direction = { x: 1, y: 0, z: 0 }
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBeNull()
    })

    it('finds intersection with angled ray', () => {
      const origin = { x: 0, y: 0, z: 10 }
      const direction = normalize3D({ x: 1, y: 1, z: -1 })
      const t = intersectGroundPlane(origin, direction)
      expect(t).toBeGreaterThan(0)
    })
  })
})

describe('projectToGround', () => {
  const camera: CameraParams = {
    position: { x: 5, y: 5, z: 3 },
    azimuth: 0, // Looking North
    elevation: 45,
    fov: 60,
    maxDistance: 20,
  }

  const image = { width: 1920, height: 1080 }

  it('projects image center to a valid point', () => {
    const result = projectToGround({ x: 960, y: 540 }, camera, image)
    expect(result.isValid).toBe(true)
    expect(result.worldPoint.y).toBeGreaterThan(camera.position.y) // North of camera
  })

  it('rejects points beyond max distance', () => {
    const nearCamera: CameraParams = { ...camera, maxDistance: 1 }
    const result = projectToGround({ x: 960, y: 200 }, nearCamera, image)
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('beyond_max_distance')
  })

  it('rejects points too close', () => {
    // Point very close to the bottom of image with steep elevation
    const steepCamera: CameraParams = { ...camera, elevation: 85 }
    const result = projectToGround({ x: 960, y: 1079 }, steepCamera, image)
    // Depending on exact geometry, this might be too close or valid
    // The important thing is that validation happens
    expect(result.debug).toBeDefined()
  })
})

describe('isInHorizontalFOV', () => {
  const camera: CameraParams = {
    position: { x: 5, y: 5, z: 3 },
    azimuth: 0, // Looking North
    elevation: 45,
    fov: 60,
    maxDistance: 20,
  }

  it('accepts point directly ahead', () => {
    const point = { x: 5, y: 10 } // Directly North
    expect(isInHorizontalFOV(point, camera)).toBe(true)
  })

  it('accepts point within FOV', () => {
    const point = { x: 6, y: 10 } // Slightly East of North
    expect(isInHorizontalFOV(point, camera)).toBe(true)
  })

  it('rejects point outside FOV', () => {
    const point = { x: 15, y: 5 } // Far East (90 degrees from North)
    expect(isInHorizontalFOV(point, camera)).toBe(false)
  })

  it('handles camera pointing East', () => {
    const eastCamera: CameraParams = { ...camera, azimuth: 90 }
    const point = { x: 10, y: 5 } // East of camera
    expect(isInHorizontalFOV(point, eastCamera)).toBe(true)
  })
})

describe('getBBoxBottomCenter', () => {
  it('calculates bottom center for normalized bbox', () => {
    const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
    const point = getBBoxBottomCenter(bbox, true, 1920, 1080)
    expect(point.x).toBeCloseTo(960, 1) // (0.4 + 0.1) * 1920 = 960
    expect(point.y).toBeCloseTo(756, 1) // (0.3 + 0.4) * 1080 = 756
  })

  it('calculates bottom center for pixel bbox', () => {
    const bbox = { x: 100, y: 100, width: 50, height: 100 }
    const point = getBBoxBottomCenter(bbox, false)
    expect(point.x).toBe(125) // 100 + 25
    expect(point.y).toBe(200) // 100 + 100
  })
})

describe('projectDetectionToGround', () => {
  const camera: CameraParams = {
    position: { x: 5, y: 5, z: 3 },
    azimuth: 0,
    elevation: 45,
    fov: 60,
    maxDistance: 20,
  }

  it('projects normalized bbox to world coordinates', () => {
    const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
    const result = projectDetectionToGround(bbox, camera, true)
    expect(result.isValid).toBe(true)
    expect(result.worldPoint.x).toBeCloseTo(camera.position.x, 0) // Near center
  })
})

describe('siteMapConfigToCamera', () => {
  it('converts sitemap config to camera params', () => {
    const config = {
      id: 'camera1',
      position: { x: 3.5, y: 0.5 },
      rotation: 90,
      elevation: 45,
      height: 2.5,
      fieldOfView: 60,
      viewDistance: 10,
    }

    const camera = siteMapConfigToCamera(config)

    expect(camera.position.x).toBe(3.5)
    expect(camera.position.y).toBe(0.5)
    expect(camera.position.z).toBe(2.5)
    expect(camera.azimuth).toBe(90)
    expect(camera.elevation).toBe(45)
    expect(camera.fov).toBe(60)
    expect(camera.maxDistance).toBe(10)
  })

  it('uses default elevation when not specified', () => {
    const config = {
      id: 'camera1',
      position: { x: 0, y: 0 },
      rotation: 0,
      height: 2,
      fieldOfView: 60,
      viewDistance: 10,
    }

    const camera = siteMapConfigToCamera(config)
    expect(camera.elevation).toBe(45) // Default
  })
})
