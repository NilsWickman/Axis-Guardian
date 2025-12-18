#!/usr/bin/env node
/**
 * Verify Calibration
 *
 * Tests the current camera-registry calibration against ground truth,
 * showing both filtered and unfiltered results.
 */

import { CameraRegistry } from '../detection/camera-registry.js'
import { loadGroundTruths, filterAnnotations } from './utils.js'
import { projectWithKRT } from '../projection/ground-plane.js'

async function main() {
  const groundTruths = await loadGroundTruths('../GroundTruths.json')
  const registry = new CameraRegistry()

  console.log('=== Calibration Verification ===\n')

  for (const cameraId of ['camera1', 'camera2']) {
    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    const errors: Array<{ error: number; annotationId: string }> = []

    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      const result = projectWithKRT(imageX, imageY, cal)

      if (result.isValid) {
        const error = Math.sqrt(
          (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
          (result.worldPoint.y - annotation.groundPosition.y) ** 2
        )
        errors.push({ error, annotationId: annotation.id })
      }
    }

    // Sort by error
    errors.sort((a, b) => a.error - b.error)

    // Statistics
    const passCount = errors.filter(e => e.error < 0.5).length
    const meanError = errors.reduce((a, b) => a + b.error, 0) / errors.length
    const medianError = errors[Math.floor(errors.length / 2)].error

    console.log(`${cameraId}:`)
    console.log(`  Total: ${errors.length}`)
    console.log(`  Pass (<0.5m): ${passCount} (${(passCount / errors.length * 100).toFixed(1)}%)`)
    console.log(`  Mean error: ${meanError.toFixed(3)}m`)
    console.log(`  Median error: ${medianError.toFixed(3)}m`)

    // Show outliers (>1.5m)
    const outliers = errors.filter(e => e.error > 1.5)
    if (outliers.length > 0) {
      console.log(`  Outliers (>1.5m): ${outliers.length}`)
      for (const o of outliers.slice(0, 5)) {
        console.log(`    ${o.annotationId}: ${o.error.toFixed(3)}m`)
      }
    }

    // Without outliers
    const filtered = errors.filter(e => e.error <= 1.5)
    const filteredPassCount = filtered.filter(e => e.error < 0.5).length
    const filteredMean = filtered.reduce((a, b) => a + b.error, 0) / filtered.length

    console.log(`  Without outliers (n=${filtered.length}):`)
    console.log(`    Pass: ${filteredPassCount} (${(filteredPassCount / filtered.length * 100).toFixed(1)}%)`)
    console.log(`    Mean: ${filteredMean.toFixed(3)}m`)
    console.log()
  }

  // Cross-camera
  console.log('Cross-camera consistency:')
  const cam1Annotations = filterAnnotations(groundTruths.annotations, 'camera1', ['certain'])
  const cam2Annotations = filterAnnotations(groundTruths.annotations, 'camera2', ['certain'])

  const cam1Cal = registry.getCalibration('camera1')!
  const cam2Cal = registry.getCalibration('camera2')!

  // Find matching annotations
  const cam1Map = new Map<string, typeof cam1Annotations[0]>()
  const cam2Map = new Map<string, typeof cam2Annotations[0]>()

  for (const a of cam1Annotations) cam1Map.set(a.annotation.id, a)
  for (const a of cam2Annotations) cam2Map.set(a.annotation.id, a)

  const divergences: number[] = []
  for (const [id, a1] of cam1Map) {
    const a2 = cam2Map.get(id)
    if (!a2) continue

    const img1X = ((a1.detection.bbox.left + a1.detection.bbox.right) / 2) * 1920
    const img1Y = a1.detection.bbox.bottom * 1080
    const img2X = ((a2.detection.bbox.left + a2.detection.bbox.right) / 2) * 1920
    const img2Y = a2.detection.bbox.bottom * 1080

    const proj1 = projectWithKRT(img1X, img1Y, cam1Cal)
    const proj2 = projectWithKRT(img2X, img2Y, cam2Cal)

    if (proj1.isValid && proj2.isValid) {
      const div = Math.sqrt(
        (proj1.worldPoint.x - proj2.worldPoint.x) ** 2 +
        (proj1.worldPoint.y - proj2.worldPoint.y) ** 2
      )
      divergences.push(div)
    }
  }

  const convergentCount = divergences.filter(d => d < 0.6).length
  const meanDiv = divergences.reduce((a, b) => a + b, 0) / divergences.length

  console.log(`  Pairs: ${divergences.length}`)
  console.log(`  Convergent (<0.6m): ${convergentCount} (${(convergentCount / divergences.length * 100).toFixed(1)}%)`)
  console.log(`  Mean divergence: ${meanDiv.toFixed(3)}m`)
}

main().catch(console.error)
