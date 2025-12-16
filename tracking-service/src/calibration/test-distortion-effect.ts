#!/usr/bin/env node
/**
 * Test Distortion Effect
 *
 * Tests whether applying distortion correction to image coordinates before
 * K/R/T projection improves accuracy.
 */

import { CameraRegistry } from '../detection/camera-registry.js'
import { loadGroundTruths, filterAnnotations } from './utils.js'
import { projectWithKRT } from '../projection/ground-plane.js'

interface DistortionParams {
  k1: number
  k2: number
  p1: number
  p2: number
}

function undistortPoint(
  imageX: number, imageY: number,
  cx: number, cy: number,
  fx: number, fy: number,
  distortion: DistortionParams
): { x: number; y: number } {
  const { k1, k2, p1, p2 } = distortion

  // Normalize
  const x_norm = (imageX - cx) / fx
  const y_norm = (imageY - cy) / fy

  const r2 = x_norm * x_norm + y_norm * y_norm
  const r4 = r2 * r2

  // Inverse radial distortion (approximate)
  const radialFactor = 1 / (1 + k1 * r2 + k2 * r4)

  // Inverse tangential (approximate for small values)
  const dx = 2 * p1 * x_norm * y_norm + p2 * (r2 + 2 * x_norm * x_norm)
  const dy = p1 * (r2 + 2 * y_norm * y_norm) + 2 * p2 * x_norm * y_norm

  // Undistorted normalized
  const x_undist = (x_norm - dx) * radialFactor
  const y_undist = (y_norm - dy) * radialFactor

  // Back to pixel coordinates
  return {
    x: x_undist * fx + cx,
    y: y_undist * fy + cy,
  }
}

async function main() {
  const groundTruths = await loadGroundTruths('../GroundTruths.json')
  const registry = new CameraRegistry()

  console.log('=== Testing Distortion Correction Effect ===\n')

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---\n`)

    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    const fx = cal.K[0][0]
    const fy = cal.K[1][1]
    const cx = cal.center[0]
    const cy = cal.center[1]

    // Baseline
    let baselinePassCount = 0
    let baselineTotalError = 0

    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      const result = projectWithKRT(imageX, imageY, cal)
      if (result.isValid) {
        const error = Math.sqrt(
          (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
          (result.worldPoint.y - annotation.groundPosition.y) ** 2
        )
        baselineTotalError += error
        if (error < 0.5) baselinePassCount++
      }
    }

    console.log(`Baseline: pass=${(baselinePassCount / annotations.length * 100).toFixed(1)}%, error=${(baselineTotalError / annotations.length).toFixed(3)}m`)

    // Test different k1 values
    console.log('\nTesting k1 values (radial distortion):')

    for (const k1 of [-0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2]) {
      let passCount = 0
      let totalError = 0

      for (const { annotation, detection } of annotations) {
        const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
        const imageY = detection.bbox.bottom * 1080

        // Undistort image coordinates
        const undist = undistortPoint(imageX, imageY, cx, cy, fx, fy, { k1, k2: 0, p1: 0, p2: 0 })

        const result = projectWithKRT(undist.x, undist.y, cal)
        if (result.isValid) {
          const error = Math.sqrt(
            (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
            (result.worldPoint.y - annotation.groundPosition.y) ** 2
          )
          totalError += error
          if (error < 0.5) passCount++
        }
      }

      const passRate = passCount / annotations.length
      const meanError = totalError / annotations.length
      const marker = passRate > baselinePassCount / annotations.length ? ' ←' : ''
      console.log(`  k1=${k1.toFixed(2).padStart(5)}: pass=${(passRate * 100).toFixed(1)}%, error=${meanError.toFixed(3)}m${marker}`)
    }

    console.log()
  }
}

main().catch(console.error)
