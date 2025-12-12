/**
 * Tests for the projection bridge module
 */

import { describe, it, expect } from 'vitest'
import {
  cameraPlacementToParams,
  projectDetectionToWorld,
  projectDetectionToSiteMapPixels,
  worldToSiteMapPixels,
  siteMapPixelsToWorld,
  projectDetectionsFromCamera,
} from '../projectionBridge'
import type { CameraPlacement } from '../../types/site-map-types'
import type { Detection, BoundingBox } from '../../types/generated'
import { createMeterUnit, createDegreeUnit } from '../siteMapConversion'

// Helper to create a test camera placement
function createTestPlacement(overrides: Partial<{
  x: number
  y: number
  rotation: number
  angle: number
  height: number
  fov: number
  viewDistance: number
}> = {}): CameraPlacement {
  return {
    cameraId: 'test-camera',
    position: {
      x: createMeterUnit(overrides.x ?? 5),
      y: createMeterUnit(overrides.y ?? 5),
    },
    rotation: createDegreeUnit(overrides.rotation ?? 0),
    angle: createDegreeUnit(overrides.angle ?? 45),
    height: createMeterUnit(overrides.height ?? 3),
    fov: createDegreeUnit(overrides.fov ?? 60),
    viewDistance: createMeterUnit(overrides.viewDistance ?? 20),
    autoCalculateDistance: false,
    color: 'cyan-500',
  }
}

// Helper to create a test detection
function createTestDetection(bbox: BoundingBox, cameraId: string = 'test-camera'): Detection {
  return {
    id: 'det-1',
    cameraId,
    trackId: 1,
    className: 'person',
    confidence: 0.9,
    bbox,
    timestamp: new Date().toISOString(),
  }
}

describe('projectionBridge', () => {
  describe('cameraPlacementToParams', () => {
    it('should convert CameraPlacement to CameraParams', () => {
      const placement = createTestPlacement({
        x: 10,
        y: 8,
        rotation: 90,
        angle: 30,
        height: 2.5,
        fov: 75,
        viewDistance: 15,
      })

      const params = cameraPlacementToParams(placement)

      expect(params.position.x).toBe(10)
      expect(params.position.y).toBe(8)
      expect(params.position.z).toBe(2.5)
      expect(params.azimuth).toBe(90)
      expect(params.elevation).toBe(30)
      expect(params.fov).toBe(75)
      expect(params.maxDistance).toBe(15)
    })

    it('should use default elevation when angle is 0', () => {
      const placement = createTestPlacement({ angle: 0 })
      const params = cameraPlacementToParams(placement)

      // When angle is 0, should use default elevation (45)
      expect(params.elevation).toBe(45)
    })

    it('should allow elevation override', () => {
      const placement = createTestPlacement({ angle: 30 })
      const params = cameraPlacementToParams(placement, 60)

      expect(params.elevation).toBe(60)
    })
  })

  describe('projectDetectionToWorld', () => {
    it('should project detection to world coordinates', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0, // North
        angle: 45,
        height: 3,
      })

      // Detection in center of image
      const detection = createTestDetection({
        x: 768, // Center-ish
        y: 324,
        width: 384,
        height: 432,
      })

      const result = projectDetectionToWorld(detection, placement, false)

      expect(result.isValid).toBe(true)
      // Should project forward (north = +Y)
      expect(result.worldY).toBeGreaterThan(5)
      // Should be roughly centered (X close to 5)
      expect(result.worldX).toBeCloseTo(5, 0)
      expect(result.distance).toBeGreaterThan(0)
    })

    it('should handle normalized coordinates', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 45,
        height: 3,
      })

      // Normalized detection in center
      const detection = createTestDetection({
        x: 0.4,
        y: 0.3,
        width: 0.2,
        height: 0.4,
      })

      const result = projectDetectionToWorld(detection, placement, true)

      expect(result.isValid).toBe(true)
      expect(result.worldY).toBeGreaterThan(5)
    })

    it('should return invalid for out-of-range projections', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 10, // Very shallow angle
        height: 3,
        viewDistance: 3, // Very short distance
      })

      // Detection at top of image (far away)
      const detection = createTestDetection({
        x: 0.4,
        y: 0.05,
        width: 0.2,
        height: 0.2,
      })

      const result = projectDetectionToWorld(detection, placement, true)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('beyond_max_distance')
    })
  })

  describe('worldToSiteMapPixels and siteMapPixelsToWorld', () => {
    it('should convert world to pixels correctly', () => {
      const pixels = worldToSiteMapPixels(5, 10, 100, 60, 60)

      expect(pixels.x).toBe(560) // 5 * 100 + 60
      expect(pixels.y).toBe(1060) // 10 * 100 + 60
    })

    it('should convert pixels to world correctly', () => {
      const world = siteMapPixelsToWorld(560, 1060, 100, 60, 60)

      expect(world.x).toBe(5)
      expect(world.y).toBe(10)
    })

    it('should be invertible', () => {
      const originalWorld = { x: 7.5, y: 3.2 }
      const pixels = worldToSiteMapPixels(originalWorld.x, originalWorld.y)
      const backToWorld = siteMapPixelsToWorld(pixels.x, pixels.y)

      expect(backToWorld.x).toBeCloseTo(originalWorld.x, 10)
      expect(backToWorld.y).toBeCloseTo(originalWorld.y, 10)
    })
  })

  describe('projectDetectionToSiteMapPixels', () => {
    it('should return both world and pixel coordinates', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 45,
        height: 3,
      })

      const detection = createTestDetection({
        x: 0.45,
        y: 0.35,
        width: 0.1,
        height: 0.3,
      })

      const result = projectDetectionToSiteMapPixels(detection, placement, {
        isNormalized: true,
        scale: 100,
        offsetX: 60,
        offsetY: 60,
      })

      expect(result.isValid).toBe(true)

      // Pixel coordinates should match world * scale + offset
      expect(result.pixelX).toBeCloseTo(result.worldX * 100 + 60, 5)
      expect(result.pixelY).toBeCloseTo(result.worldY * 100 + 60, 5)
    })
  })

  describe('projectDetectionsFromCamera', () => {
    it('should project multiple detections', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 45,
        height: 3,
      })

      const detections = [
        createTestDetection({ x: 0.2, y: 0.4, width: 0.1, height: 0.3 }),
        createTestDetection({ x: 0.5, y: 0.4, width: 0.1, height: 0.3 }),
        createTestDetection({ x: 0.8, y: 0.4, width: 0.1, height: 0.3 }),
      ]

      const results = projectDetectionsFromCamera(detections, placement, {
        isNormalized: true,
      })

      expect(results.length).toBe(3)
      results.forEach((r) => expect(r.isValid).toBe(true))

      // Left-to-right in image should map to consistent X spread
      expect(results[0].worldX).toBeLessThan(results[1].worldX)
      expect(results[1].worldX).toBeLessThan(results[2].worldX)
    })

    it('should filter invalid detections by default', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 5, // Very shallow
        height: 3,
        viewDistance: 2, // Very short
      })

      const detections = [
        createTestDetection({ x: 0.5, y: 0.1, width: 0.1, height: 0.2 }), // Far - invalid
        createTestDetection({ x: 0.5, y: 0.7, width: 0.1, height: 0.2 }), // Close - might be valid
      ]

      const results = projectDetectionsFromCamera(detections, placement, {
        isNormalized: true,
        includeInvalid: false,
      })

      // Should only return valid ones
      results.forEach((r) => expect(r.isValid).toBe(true))
    })

    it('should include invalid detections when requested', () => {
      const placement = createTestPlacement({
        x: 5,
        y: 5,
        rotation: 0,
        angle: 5,
        height: 3,
        viewDistance: 2,
      })

      const detections = [
        createTestDetection({ x: 0.5, y: 0.1, width: 0.1, height: 0.2 }),
        createTestDetection({ x: 0.5, y: 0.7, width: 0.1, height: 0.2 }),
      ]

      const results = projectDetectionsFromCamera(detections, placement, {
        isNormalized: true,
        includeInvalid: true,
      })

      // Should return all detections
      expect(results.length).toBe(2)
    })
  })

  describe('Integration with real camera configs', () => {
    it('should work with camera1 config from sitemap-rectangular-room.json', () => {
      // Camera1 config from the JSON file
      const placement = createTestPlacement({
        x: 1.3,
        y: 10.9,
        rotation: 321, // NW direction
        angle: 45,
        height: 1.5,
        fov: 60,
        viewDistance: 100,
      })

      // Person detection in center of frame
      const detection = createTestDetection({
        x: 0.4,
        y: 0.3,
        width: 0.2,
        height: 0.4,
      })

      const result = projectDetectionToWorld(detection, placement, true)

      expect(result.isValid).toBe(true)

      // Direction should be NW from camera
      // At 321°: dx should be negative, dy should be positive
      const dx = result.worldX - 1.3
      const dy = result.worldY - 10.9

      // Check general direction (NW quadrant)
      expect(dx).toBeLessThan(0) // West
      expect(dy).toBeGreaterThan(0) // North
    })

    it('should work with camera2 config from sitemap-rectangular-room.json', () => {
      // Camera2 config from the JSON file
      const placement = createTestPlacement({
        x: 15.75,
        y: 10.9,
        rotation: 253, // SW direction
        angle: 45,
        height: 1.5,
        fov: 60,
        viewDistance: 100,
      })

      const detection = createTestDetection({
        x: 0.4,
        y: 0.3,
        width: 0.2,
        height: 0.4,
      })

      const result = projectDetectionToWorld(detection, placement, true)

      expect(result.isValid).toBe(true)

      // Direction should be SW from camera
      // At 253°: dx should be negative, dy should be negative
      const dx = result.worldX - 15.75
      const dy = result.worldY - 10.9

      // Check general direction (SW quadrant)
      expect(dx).toBeLessThan(0) // West
      expect(dy).toBeLessThan(0) // South
    })
  })
})
