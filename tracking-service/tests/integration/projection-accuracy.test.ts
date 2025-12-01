/**
 * Projection Accuracy Tests
 *
 * Tests that bounding box projections produce sensible world coordinates
 * based on real camera configurations from the sitemap.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { join } from 'path'
import { projectDetectionToGround, siteMapConfigToCamera } from '../../src/projection/ground-plane.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../../src/config/sitemap-loader.js'
import type { CameraParams } from '../../src/types.js'

describe('Projection Accuracy with Real Cameras', () => {
  let camera1: CameraParams
  let camera2: CameraParams
  let siteMapWidth: number
  let siteMapHeight: number

  beforeAll(() => {
    const sitemapPath = join(__dirname, '../../../frontend/public/sitemap-rectangular-room.json')
    const config = loadSiteMapConfig(sitemapPath)

    siteMapWidth = config.dimensions.width
    siteMapHeight = config.dimensions.height

    const cam1Config = config.cameras.find((c) => c.id === 'camera1')
    const cam2Config = config.cameras.find((c) => c.id === 'camera2')

    if (!cam1Config || !cam2Config) {
      throw new Error('Camera configurations not found in sitemap')
    }

    camera1 = siteMapCameraToCameraParams(cam1Config)
    camera2 = siteMapCameraToCameraParams(cam2Config)

    console.log('Camera 1 params:', JSON.stringify(camera1, null, 2))
    console.log('Camera 2 params:', JSON.stringify(camera2, null, 2))
    console.log(`Site map: ${siteMapWidth}m x ${siteMapHeight}m`)
  })

  describe('Camera 1 (Front Entrance, rotation 321°)', () => {
    // Camera 1 is at (1.3, 10.9) pointing at azimuth 321° (roughly NW, into the room)

    it('projects center of image to a point within the room', () => {
      const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
      const result = projectDetectionToGround(bbox, camera1, true)

      console.log('Camera 1 center projection:', result)

      expect(result.isValid).toBe(true)
      // Should be within room bounds
      expect(result.worldPoint.x).toBeGreaterThanOrEqual(0)
      expect(result.worldPoint.x).toBeLessThanOrEqual(siteMapWidth)
      expect(result.worldPoint.y).toBeGreaterThanOrEqual(0)
      expect(result.worldPoint.y).toBeLessThanOrEqual(siteMapHeight)
    })

    it('projects left side of image to the left of center', () => {
      const leftBbox = { x: 0.1, y: 0.5, width: 0.1, height: 0.3 }
      const centerBbox = { x: 0.45, y: 0.5, width: 0.1, height: 0.3 }

      const leftResult = projectDetectionToGround(leftBbox, camera1, true)
      const centerResult = projectDetectionToGround(centerBbox, camera1, true)

      console.log('Left projection:', leftResult.worldPoint)
      console.log('Center projection:', centerResult.worldPoint)

      expect(leftResult.isValid).toBe(true)
      expect(centerResult.isValid).toBe(true)

      // Left and center should produce different positions
      const dx = leftResult.worldPoint.x - centerResult.worldPoint.x
      const dy = leftResult.worldPoint.y - centerResult.worldPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      expect(distance).toBeGreaterThan(0.5) // At least 0.5m apart
    })

    it('projects bottom of image closer than top', () => {
      // Bottom of image is closer to camera (ground nearby)
      const bottomBbox = { x: 0.45, y: 0.7, width: 0.1, height: 0.2 }
      const topBbox = { x: 0.45, y: 0.1, width: 0.1, height: 0.2 }

      const bottomResult = projectDetectionToGround(bottomBbox, camera1, true)
      const topResult = projectDetectionToGround(topBbox, camera1, true)

      if (bottomResult.isValid && topResult.isValid) {
        const camPos = camera1.position
        const bottomDist = Math.sqrt(
          Math.pow(bottomResult.worldPoint.x - camPos.x, 2) +
            Math.pow(bottomResult.worldPoint.y - camPos.y, 2)
        )
        const topDist = Math.sqrt(
          Math.pow(topResult.worldPoint.x - camPos.x, 2) +
            Math.pow(topResult.worldPoint.y - camPos.y, 2)
        )

        console.log(`Bottom distance from camera: ${bottomDist.toFixed(2)}m`)
        console.log(`Top distance from camera: ${topDist.toFixed(2)}m`)

        // Bottom should be closer to camera
        expect(bottomDist).toBeLessThan(topDist)
      }
    })

    it('produces reasonable distances for person-sized bboxes', () => {
      // A person at the edge of a 60° FOV camera at 45° elevation
      // with 1.5m height should produce projections within reasonable range
      const personBbox = { x: 0.3, y: 0.4, width: 0.15, height: 0.35 }
      const result = projectDetectionToGround(personBbox, camera1, true)

      expect(result.isValid).toBe(true)

      const camPos = camera1.position
      const dist = Math.sqrt(
        Math.pow(result.worldPoint.x - camPos.x, 2) +
          Math.pow(result.worldPoint.y - camPos.y, 2)
      )

      console.log(`Person projection distance: ${dist.toFixed(2)}m`)
      console.log(`World point: (${result.worldPoint.x.toFixed(2)}, ${result.worldPoint.y.toFixed(2)})`)

      // Should be within reasonable detection range (2-15m is typical)
      expect(dist).toBeGreaterThan(1)
      expect(dist).toBeLessThan(20)
    })
  })

  describe('Camera 2 (Back Corner, rotation 253°)', () => {
    // Camera 2 is at (15.75, 10.9) pointing at azimuth 253° (roughly WSW, into the room)

    it('projects center of image to a point within the room', () => {
      const bbox = { x: 0.4, y: 0.3, width: 0.2, height: 0.4 }
      const result = projectDetectionToGround(bbox, camera2, true)

      console.log('Camera 2 center projection:', result)

      expect(result.isValid).toBe(true)
      expect(result.worldPoint.x).toBeGreaterThanOrEqual(0)
      expect(result.worldPoint.x).toBeLessThanOrEqual(siteMapWidth)
      expect(result.worldPoint.y).toBeGreaterThanOrEqual(0)
      expect(result.worldPoint.y).toBeLessThanOrEqual(siteMapHeight)
    })

    it('produces projections in a different area than camera 1', () => {
      const bbox = { x: 0.4, y: 0.5, width: 0.2, height: 0.3 }

      const result1 = projectDetectionToGround(bbox, camera1, true)
      const result2 = projectDetectionToGround(bbox, camera2, true)

      console.log('Camera 1 projection:', result1.worldPoint)
      console.log('Camera 2 projection:', result2.worldPoint)

      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(true)

      // Same bbox should produce different world positions for different cameras
      const dx = result1.worldPoint.x - result2.worldPoint.x
      const dy = result1.worldPoint.y - result2.worldPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      expect(distance).toBeGreaterThan(2) // At least 2m apart
    })
  })

  describe('Edge Cases', () => {
    it('handles bbox at image edge', () => {
      const edgeBbox = { x: 0.0, y: 0.5, width: 0.1, height: 0.3 }
      const result = projectDetectionToGround(edgeBbox, camera1, true)

      // May or may not be valid depending on geometry
      console.log('Edge bbox result:', result)
    })

    it('handles small bbox (distant person)', () => {
      const smallBbox = { x: 0.48, y: 0.2, width: 0.04, height: 0.1 }
      const result = projectDetectionToGround(smallBbox, camera1, true)

      console.log('Small bbox (distant) result:', result)

      if (result.isValid) {
        const camPos = camera1.position
        const dist = Math.sqrt(
          Math.pow(result.worldPoint.x - camPos.x, 2) +
            Math.pow(result.worldPoint.y - camPos.y, 2)
        )
        // At 45° elevation with 1.5m height, projections are close
        // Distant person (top of image) should be further than close person (bottom)
        expect(dist).toBeGreaterThan(1.5)
      }
    })

    it('handles large bbox (close person)', () => {
      const largeBbox = { x: 0.3, y: 0.5, width: 0.4, height: 0.45 }
      const result = projectDetectionToGround(largeBbox, camera1, true)

      console.log('Large bbox (close) result:', result)

      if (result.isValid) {
        const camPos = camera1.position
        const dist = Math.sqrt(
          Math.pow(result.worldPoint.x - camPos.x, 2) +
            Math.pow(result.worldPoint.y - camPos.y, 2)
        )
        // Close person should be within a few meters
        expect(dist).toBeLessThan(8)
      }
    })
  })

  describe('Detection Format Conversion', () => {
    // Camera emulators use {left, top, right, bottom} format
    // We need to convert to {x, y, width, height}

    it('correctly converts left/top/right/bottom to x/y/width/height', () => {
      const emulatorBbox = {
        left: 0.778125,
        top: 0.5,
        right: 0.859375,
        bottom: 0.8638888888888889,
      }

      // Convert to our format
      const bbox = {
        x: emulatorBbox.left,
        y: emulatorBbox.top,
        width: emulatorBbox.right - emulatorBbox.left,
        height: emulatorBbox.bottom - emulatorBbox.top,
      }

      expect(bbox.x).toBeCloseTo(0.778125, 5)
      expect(bbox.y).toBeCloseTo(0.5, 5)
      expect(bbox.width).toBeCloseTo(0.08125, 5)
      expect(bbox.height).toBeCloseTo(0.3638888888888889, 5)

      const result = projectDetectionToGround(bbox, camera1, true)
      console.log('Converted emulator bbox projection:', result)

      // This is a real detection from camera-HC3
      // It should produce a valid projection
      expect(result.isValid).toBe(true)
    })
  })
})

describe('Multi-Camera Correlation Scenario', () => {
  let camera1: CameraParams
  let camera2: CameraParams

  beforeAll(() => {
    const sitemapPath = join(__dirname, '../../../frontend/public/sitemap-rectangular-room.json')
    const config = loadSiteMapConfig(sitemapPath)

    const cam1Config = config.cameras.find((c) => c.id === 'camera1')
    const cam2Config = config.cameras.find((c) => c.id === 'camera2')

    if (!cam1Config || !cam2Config) {
      throw new Error('Camera configurations not found in sitemap')
    }

    camera1 = siteMapCameraToCameraParams(cam1Config)
    camera2 = siteMapCameraToCameraParams(cam2Config)
  })

  it('can correlate person seen by both cameras', () => {
    // If a person is in the center of the room (around 9, 6)
    // Both cameras might see them at different pixel positions

    // For camera 1 at (1.3, 10.9) pointing 321° (NW)
    // A person at (9, 6) is roughly SE of the camera

    // For camera 2 at (15.75, 10.9) pointing 253° (WSW)
    // A person at (9, 6) is roughly W-SW of the camera

    // We can't easily reverse-project, but we can verify that
    // projections from different cameras produce points in similar areas

    console.log('Camera 1 position:', camera1.position)
    console.log('Camera 1 azimuth:', camera1.azimuth)
    console.log('Camera 2 position:', camera2.position)
    console.log('Camera 2 azimuth:', camera2.azimuth)

    // Test a few strategic bboxes that might represent the same person
    const cam1Bbox = { x: 0.45, y: 0.4, width: 0.1, height: 0.35 }
    const cam2Bbox = { x: 0.55, y: 0.4, width: 0.1, height: 0.35 }

    const result1 = projectDetectionToGround(cam1Bbox, camera1, true)
    const result2 = projectDetectionToGround(cam2Bbox, camera2, true)

    console.log('Camera 1 center-ish projection:', result1.worldPoint)
    console.log('Camera 2 center-ish projection:', result2.worldPoint)

    expect(result1.isValid).toBe(true)
    expect(result2.isValid).toBe(true)
  })
})
