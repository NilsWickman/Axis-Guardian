/**
 * Visual Verification Tests for Ground Plane Projection
 *
 * These tests produce detailed output to help verify the projection is working correctly.
 * Run with: pnpm vitest run src/utils/__tests__/groundPlaneProjection.visual.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  projectDetectionToGround,
  siteMapConfigToCamera,
  type CameraParams,
} from '../groundPlaneProjection'

// Room dimensions from sitemap-rectangular-room.json
const ROOM = {
  width: 18, // meters
  height: 12, // meters
}

// Camera configurations from sitemap-rectangular-room.json
const CAMERA1_CONFIG = {
  id: 'camera1',
  name: 'Front Entrance',
  position: { x: 1.3, y: 10.9 },
  rotation: 321, // Facing roughly NW
  height: 1.5,
  fieldOfView: 60,
  viewDistance: 100,
}

const CAMERA2_CONFIG = {
  id: 'camera2',
  name: 'Back Corner',
  position: { x: 15.75, y: 10.9 },
  rotation: 253, // Facing roughly SW
  height: 1.5,
  fieldOfView: 60,
  viewDistance: 100,
}

// Test with multiple elevation angles
const ELEVATIONS_TO_TEST = [30, 45, 60]

function formatPoint(x: number, y: number): string {
  return `(${x.toFixed(2)}, ${y.toFixed(2)})`
}

describe('Visual Verification - Camera Projection', () => {
  describe('Camera 1 - Front Entrance', () => {
    ELEVATIONS_TO_TEST.forEach((elevation) => {
      it(`should project grid of detections at ${elevation}° elevation`, () => {
        const camera = siteMapConfigToCamera(CAMERA1_CONFIG)
        camera.elevation = elevation

        console.log('\n' + '='.repeat(70))
        console.log(`CAMERA 1: ${CAMERA1_CONFIG.name}`)
        console.log('='.repeat(70))
        console.log(`Position: ${formatPoint(camera.position.x, camera.position.y)}`)
        console.log(`Azimuth: ${camera.azimuth}° (321° = roughly NW)`)
        console.log(`Elevation: ${elevation}°`)
        console.log(`FOV: ${camera.fov}°`)
        console.log(`Height: ${camera.position.z}m`)
        console.log('')

        // Test grid of positions in normalized image space
        const positions = [
          { label: 'Top-Left', bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Top-Center', bbox: { x: 0.45, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Top-Right', bbox: { x: 0.8, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Mid-Left', bbox: { x: 0.1, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Center', bbox: { x: 0.45, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Mid-Right', bbox: { x: 0.8, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Left', bbox: { x: 0.1, y: 0.6, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Center', bbox: { x: 0.45, y: 0.6, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Right', bbox: { x: 0.8, y: 0.6, width: 0.1, height: 0.3 } },
        ]

        console.log('Detection Position Grid (normalized bbox → world coords):')
        console.log('-'.repeat(70))
        console.log('Image Position      | World Position (m)  | Distance | Valid')
        console.log('-'.repeat(70))

        let allValid = true
        const worldPoints: Array<{ label: string; x: number; y: number; valid: boolean }> = []

        positions.forEach(({ label, bbox }) => {
          const result = projectDetectionToGround(bbox, camera, true)
          const status = result.isValid ? '✓' : `✗ (${result.reason})`
          console.log(
            `${label.padEnd(18)} | ${formatPoint(result.worldPoint.x, result.worldPoint.y).padEnd(18)} | ${result.distance.toFixed(2).padStart(7)}m | ${status}`
          )

          worldPoints.push({
            label,
            x: result.worldPoint.x,
            y: result.worldPoint.y,
            valid: result.isValid,
          })

          if (!result.isValid) allValid = false
        })

        console.log('-'.repeat(70))

        // Check that projected points are within room bounds (with some tolerance)
        const validPoints = worldPoints.filter((p) => p.valid)
        console.log(`\nValid projections: ${validPoints.length}/${worldPoints.length}`)

        // Check room bounds
        const outOfBounds = validPoints.filter(
          (p) => p.x < -1 || p.x > ROOM.width + 1 || p.y < -1 || p.y > ROOM.height + 1
        )
        if (outOfBounds.length > 0) {
          console.log('⚠ Points outside room bounds:')
          outOfBounds.forEach((p) => console.log(`  - ${p.label}: ${formatPoint(p.x, p.y)}`))
        }

        // At least some projections should be valid
        expect(validPoints.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Camera 2 - Back Corner', () => {
    ELEVATIONS_TO_TEST.forEach((elevation) => {
      it(`should project grid of detections at ${elevation}° elevation`, () => {
        const camera = siteMapConfigToCamera(CAMERA2_CONFIG)
        camera.elevation = elevation

        console.log('\n' + '='.repeat(70))
        console.log(`CAMERA 2: ${CAMERA2_CONFIG.name}`)
        console.log('='.repeat(70))
        console.log(`Position: ${formatPoint(camera.position.x, camera.position.y)}`)
        console.log(`Azimuth: ${camera.azimuth}° (253° = roughly SW)`)
        console.log(`Elevation: ${elevation}°`)
        console.log(`FOV: ${camera.fov}°`)
        console.log(`Height: ${camera.position.z}m`)
        console.log('')

        const positions = [
          { label: 'Top-Left', bbox: { x: 0.1, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Top-Center', bbox: { x: 0.45, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Top-Right', bbox: { x: 0.8, y: 0.1, width: 0.1, height: 0.3 } },
          { label: 'Mid-Left', bbox: { x: 0.1, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Center', bbox: { x: 0.45, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Mid-Right', bbox: { x: 0.8, y: 0.35, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Left', bbox: { x: 0.1, y: 0.6, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Center', bbox: { x: 0.45, y: 0.6, width: 0.1, height: 0.3 } },
          { label: 'Bottom-Right', bbox: { x: 0.8, y: 0.6, width: 0.1, height: 0.3 } },
        ]

        console.log('Detection Position Grid (normalized bbox → world coords):')
        console.log('-'.repeat(70))
        console.log('Image Position      | World Position (m)  | Distance | Valid')
        console.log('-'.repeat(70))

        const worldPoints: Array<{ label: string; x: number; y: number; valid: boolean }> = []

        positions.forEach(({ label, bbox }) => {
          const result = projectDetectionToGround(bbox, camera, true)
          const status = result.isValid ? '✓' : `✗ (${result.reason})`
          console.log(
            `${label.padEnd(18)} | ${formatPoint(result.worldPoint.x, result.worldPoint.y).padEnd(18)} | ${result.distance.toFixed(2).padStart(7)}m | ${status}`
          )

          worldPoints.push({
            label,
            x: result.worldPoint.x,
            y: result.worldPoint.y,
            valid: result.isValid,
          })
        })

        console.log('-'.repeat(70))

        const validPoints = worldPoints.filter((p) => p.valid)
        console.log(`\nValid projections: ${validPoints.length}/${worldPoints.length}`)

        expect(validPoints.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Directional Verification', () => {
    it('should verify camera 1 projects in correct direction (NW)', () => {
      const camera = siteMapConfigToCamera(CAMERA1_CONFIG)
      camera.elevation = 45

      // Project center of image
      const centerResult = projectDetectionToGround(
        { x: 0.45, y: 0.35, width: 0.1, height: 0.3 },
        camera,
        true
      )

      console.log('\n' + '='.repeat(70))
      console.log('Direction Verification - Camera 1')
      console.log('='.repeat(70))
      console.log(`Camera position: ${formatPoint(camera.position.x, camera.position.y)}`)
      console.log(`Camera azimuth: ${camera.azimuth}° (321° = NW)`)
      console.log(`Center projection: ${formatPoint(centerResult.worldPoint.x, centerResult.worldPoint.y)}`)

      // For azimuth 321° (NW direction):
      // - sin(321°) ≈ -0.63 (negative X direction)
      // - cos(321°) ≈ +0.78 (positive Y direction)
      // So projected point should be:
      // - West of camera (smaller X)
      // - North of camera (larger Y)

      const dx = centerResult.worldPoint.x - camera.position.x
      const dy = centerResult.worldPoint.y - camera.position.y
      console.log(`Delta from camera: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}`)

      // Wait - at azimuth 321° from position (1.3, 10.9) looking NW...
      // The room is 18m wide, 12m tall
      // Camera is near top-left corner
      // Looking NW means looking toward top-left corner
      // But the room boundary is at y=12 (top) and x=0 (left)
      // So projections might go outside room bounds!

      // The projection direction should be roughly NW
      const projectedAngle = Math.atan2(dx, dy) * (180 / Math.PI)
      const normalizedAngle = ((projectedAngle % 360) + 360) % 360
      console.log(`Projected angle: ${normalizedAngle.toFixed(1)}° (expected ~321°)`)

      // Allow some tolerance due to elevation effects
      const angleDiff = Math.abs(normalizedAngle - camera.azimuth)
      const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff
      console.log(`Angle difference from azimuth: ${normalizedDiff.toFixed(1)}°`)

      expect(normalizedDiff).toBeLessThan(30) // Within 30° of expected direction
    })

    it('should verify camera 2 projects in correct direction (SW)', () => {
      const camera = siteMapConfigToCamera(CAMERA2_CONFIG)
      camera.elevation = 45

      const centerResult = projectDetectionToGround(
        { x: 0.45, y: 0.35, width: 0.1, height: 0.3 },
        camera,
        true
      )

      console.log('\n' + '='.repeat(70))
      console.log('Direction Verification - Camera 2')
      console.log('='.repeat(70))
      console.log(`Camera position: ${formatPoint(camera.position.x, camera.position.y)}`)
      console.log(`Camera azimuth: ${camera.azimuth}° (253° = SW)`)
      console.log(`Center projection: ${formatPoint(centerResult.worldPoint.x, centerResult.worldPoint.y)}`)

      const dx = centerResult.worldPoint.x - camera.position.x
      const dy = centerResult.worldPoint.y - camera.position.y
      console.log(`Delta from camera: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}`)

      const projectedAngle = Math.atan2(dx, dy) * (180 / Math.PI)
      const normalizedAngle = ((projectedAngle % 360) + 360) % 360
      console.log(`Projected angle: ${normalizedAngle.toFixed(1)}° (expected ~253°)`)

      const angleDiff = Math.abs(normalizedAngle - camera.azimuth)
      const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff
      console.log(`Angle difference from azimuth: ${normalizedDiff.toFixed(1)}°`)

      expect(normalizedDiff).toBeLessThan(30)
    })
  })

  describe('Left-Right Ordering', () => {
    it('should maintain left-right ordering when looking North', () => {
      // Simple camera looking North (azimuth=0)
      const camera: CameraParams = {
        position: { x: 9, y: 6, z: 2 },
        azimuth: 0, // North
        elevation: 45,
        fov: 60,
        maxDistance: 20,
      }

      const leftResult = projectDetectionToGround(
        { x: 0.1, y: 0.5, width: 0.1, height: 0.3 },
        camera,
        true
      )
      const rightResult = projectDetectionToGround(
        { x: 0.8, y: 0.5, width: 0.1, height: 0.3 },
        camera,
        true
      )

      console.log('\n' + '='.repeat(70))
      console.log('Left-Right Ordering Test (Camera facing North)')
      console.log('='.repeat(70))
      console.log(`Camera position: ${formatPoint(camera.position.x, camera.position.y)}`)
      console.log(`Left detection → ${formatPoint(leftResult.worldPoint.x, leftResult.worldPoint.y)}`)
      console.log(`Right detection → ${formatPoint(rightResult.worldPoint.x, rightResult.worldPoint.y)}`)

      // When facing North, left in image should map to West (-X), right to East (+X)
      expect(leftResult.worldPoint.x).toBeLessThan(rightResult.worldPoint.x)
      console.log('✓ Left in image → West, Right in image → East')
    })

    it('should maintain left-right ordering when looking East', () => {
      const camera: CameraParams = {
        position: { x: 9, y: 6, z: 2 },
        azimuth: 90, // East
        elevation: 45,
        fov: 60,
        maxDistance: 20,
      }

      const leftResult = projectDetectionToGround(
        { x: 0.1, y: 0.5, width: 0.1, height: 0.3 },
        camera,
        true
      )
      const rightResult = projectDetectionToGround(
        { x: 0.8, y: 0.5, width: 0.1, height: 0.3 },
        camera,
        true
      )

      console.log('\n' + '='.repeat(70))
      console.log('Left-Right Ordering Test (Camera facing East)')
      console.log('='.repeat(70))
      console.log(`Camera position: ${formatPoint(camera.position.x, camera.position.y)}`)
      console.log(`Left detection → ${formatPoint(leftResult.worldPoint.x, leftResult.worldPoint.y)}`)
      console.log(`Right detection → ${formatPoint(rightResult.worldPoint.x, rightResult.worldPoint.y)}`)

      // When facing East, left in image should map to North (+Y), right to South (-Y)
      expect(leftResult.worldPoint.y).toBeGreaterThan(rightResult.worldPoint.y)
      console.log('✓ Left in image → North, Right in image → South')
    })
  })
})
