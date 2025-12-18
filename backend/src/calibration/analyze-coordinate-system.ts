#!/usr/bin/env node
/**
 * Coordinate System Analyzer
 *
 * Investigates the relationship between:
 * 1. Raw K/R/T projection output coordinates
 * 2. Ground truth sitemap coordinates
 * 3. Polynomial-transformed coordinates
 *
 * This helps understand what coordinate transformation is actually needed.
 */

import { CameraRegistry } from '../detection/camera-registry.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  gtBboxToDetectionBBox,
  type Vector3,
} from './utils.js'

async function main() {
  console.log('=== Coordinate System Analysis ===\n')

  const groundTruths = await loadGroundTruths('/home/nilwi971/projects/Axis-Guardian/GroundTruths.json')
  console.log(`Loaded ${groundTruths.annotations.length} annotations\n`)
  console.log(`Room dimensions: ${groundTruths.room.width}m x ${groundTruths.room.height}m\n`)

  const registry = new CameraRegistry()

  for (const camId of ['camera1', 'camera2']) {
    const cal = registry.getCalibration(camId)!
    const annotations = filterAnnotations(groundTruths.annotations, camId, ['certain'])

    console.log(`\n=== ${camId.toUpperCase()} ===`)
    console.log(`K (focal): ${cal.K[0][0]}`)
    console.log(`T: [${cal.T.join(', ')}]`)
    console.log(`Annotations: ${annotations.length}\n`)

    // Collect raw projections
    const rawProjections: { raw: { x: number; y: number }; gt: { x: number; y: number } }[] = []
    const polyProjections: { poly: { x: number; y: number }; gt: { x: number; y: number } }[] = []

    for (const { annotation, detection } of annotations.slice(0, 20)) {
      const bboxCenterX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const bboxBottomY = detection.bbox.bottom * 1080

      // Raw K/R/T projection (no polynomial)
      const rawResult = projectImageToWorld(
        bboxCenterX,
        bboxBottomY,
        cal.K,
        cal.R,
        [cal.T[0], cal.T[1], cal.T[2]] as Vector3,
        cal.center as [number, number]
      )

      // Polynomial projection
      const bbox = gtBboxToDetectionBBox(detection.bbox)
      const polyResult = projectDetectionWithKRT(bbox, cal, null, [], true, 1920, 1080)

      if (rawResult.isValid) {
        rawProjections.push({
          raw: rawResult.worldPoint,
          gt: annotation.groundPosition,
        })
      }
      if (polyResult.isValid) {
        polyProjections.push({
          poly: polyResult.worldPoint,
          gt: annotation.groundPosition,
        })
      }
    }

    // Analyze raw coordinate system
    console.log('--- Raw K/R/T Output Analysis ---')
    const rawXs = rawProjections.map((p) => p.raw.x)
    const rawYs = rawProjections.map((p) => p.raw.y)
    const gtXs = rawProjections.map((p) => p.gt.x)
    const gtYs = rawProjections.map((p) => p.gt.y)

    console.log(`  Raw X range: [${Math.min(...rawXs).toFixed(2)}, ${Math.max(...rawXs).toFixed(2)}]`)
    console.log(`  Raw Y range: [${Math.min(...rawYs).toFixed(2)}, ${Math.max(...rawYs).toFixed(2)}]`)
    console.log(`  GT X range: [${Math.min(...gtXs).toFixed(2)}, ${Math.max(...gtXs).toFixed(2)}]`)
    console.log(`  GT Y range: [${Math.min(...gtYs).toFixed(2)}, ${Math.max(...gtYs).toFixed(2)}]`)

    // Compute linear correlation between raw and GT
    const meanRawX = rawXs.reduce((a, b) => a + b, 0) / rawXs.length
    const meanRawY = rawYs.reduce((a, b) => a + b, 0) / rawYs.length
    const meanGtX = gtXs.reduce((a, b) => a + b, 0) / gtXs.length
    const meanGtY = gtYs.reduce((a, b) => a + b, 0) / gtYs.length

    console.log(`\n  Raw mean: (${meanRawX.toFixed(2)}, ${meanRawY.toFixed(2)})`)
    console.log(`  GT mean: (${meanGtX.toFixed(2)}, ${meanGtY.toFixed(2)})`)

    // Check if there's a simple linear relationship
    // Try to find best-fit linear transform: gt = A * raw + b
    console.log('\n--- Checking for Linear Relationship ---')

    // Compute correlation matrix
    let covRawX_GtX = 0, covRawX_GtY = 0, covRawY_GtX = 0, covRawY_GtY = 0
    let varRawX = 0, varRawY = 0
    for (let i = 0; i < rawProjections.length; i++) {
      const drx = rawXs[i] - meanRawX
      const dry = rawYs[i] - meanRawY
      const dgx = gtXs[i] - meanGtX
      const dgy = gtYs[i] - meanGtY
      covRawX_GtX += drx * dgx
      covRawX_GtY += drx * dgy
      covRawY_GtX += dry * dgx
      covRawY_GtY += dry * dgy
      varRawX += drx * drx
      varRawY += dry * dry
    }

    const corrX_GtX = Math.sqrt(varRawX) > 0 ? covRawX_GtX / Math.sqrt(varRawX * covRawX_GtX * covRawX_GtX / (varRawX || 1)) : 0
    const corrY_GtY = Math.sqrt(varRawY) > 0 ? covRawY_GtY / Math.sqrt(varRawY * covRawY_GtY * covRawY_GtY / (varRawY || 1)) : 0

    console.log(`  Correlation raw_X vs gt_X: ${(covRawX_GtX / Math.sqrt(varRawX * (gtXs.map((x) => (x - meanGtX) ** 2).reduce((a, b) => a + b, 0))) || 0).toFixed(3)}`)
    console.log(`  Correlation raw_Y vs gt_Y: ${(covRawY_GtY / Math.sqrt(varRawY * (gtYs.map((y) => (y - meanGtY) ** 2).reduce((a, b) => a + b, 0))) || 0).toFixed(3)}`)
    console.log(`  Correlation raw_X vs gt_Y: ${(covRawX_GtY / Math.sqrt(varRawX * (gtYs.map((y) => (y - meanGtY) ** 2).reduce((a, b) => a + b, 0))) || 0).toFixed(3)}`)
    console.log(`  Correlation raw_Y vs gt_X: ${(covRawY_GtX / Math.sqrt(varRawY * (gtXs.map((x) => (x - meanGtX) ** 2).reduce((a, b) => a + b, 0))) || 0).toFixed(3)}`)

    // Show samples
    console.log('\n--- Sample Projections ---')
    console.log('  Image Point | Raw K/R/T | Poly Transform | Ground Truth')
    for (let i = 0; i < Math.min(8, rawProjections.length); i++) {
      const raw = rawProjections[i].raw
      const poly = polyProjections[i].poly
      const gt = rawProjections[i].gt
      const rawErr = Math.sqrt((raw.x - gt.x) ** 2 + (raw.y - gt.y) ** 2)
      const polyErr = Math.sqrt((poly.x - gt.x) ** 2 + (poly.y - gt.y) ** 2)
      console.log(
        `  ${i + 1}: (${raw.x.toFixed(2)}, ${raw.y.toFixed(2)}) | (${poly.x.toFixed(2)}, ${poly.y.toFixed(2)}) | (${gt.x.toFixed(2)}, ${gt.y.toFixed(2)}) [raw_err=${rawErr.toFixed(2)}m, poly_err=${polyErr.toFixed(2)}m]`
      )
    }

    // Analyze the polynomial transform effect
    console.log('\n--- Polynomial Transform Effect ---')
    const polyErrors = polyProjections.map((p) =>
      Math.sqrt((p.poly.x - p.gt.x) ** 2 + (p.poly.y - p.gt.y) ** 2)
    )
    const rawErrors = rawProjections.map((p) =>
      Math.sqrt((p.raw.x - p.gt.x) ** 2 + (p.raw.y - p.gt.y) ** 2)
    )

    console.log(`  Raw K/R/T mean error: ${(rawErrors.reduce((a, b) => a + b, 0) / rawErrors.length).toFixed(3)}m`)
    console.log(`  With polynomial mean error: ${(polyErrors.reduce((a, b) => a + b, 0) / polyErrors.length).toFixed(3)}m`)
  }
}

main().catch(console.error)
