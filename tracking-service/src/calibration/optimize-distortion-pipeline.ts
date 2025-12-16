#!/usr/bin/env node
/**
 * Distortion Optimization Pipeline
 *
 * Optimizes Brown-Conrady distortion parameters (k1, k2, p1, p2) to improve
 * projection accuracy. Uses grid search followed by Nelder-Mead refinement.
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
} from './utils.js'
import { nelderMead } from './nelder-mead.js'

interface Correspondence {
  imageX: number
  imageY: number
  rawX: number  // K/R/T output without distortion
  rawY: number
  gtX: number
  gtY: number
}

interface DistortionParams {
  k1: number
  k2: number
  p1: number
  p2: number
}

// ============================================================================
// Projection with Distortion
// ============================================================================

function projectWithDistortion(
  imageX: number, imageY: number,
  K: number[][], R: number[][], T: number[],
  center: [number, number],
  distortion: DistortionParams
): { x: number; y: number; valid: boolean } {
  const fx = K[0][0], fy = K[1][1]
  const cx = center[0], cy = center[1]

  // Normalize
  const x_norm = (imageX - cx) / fx
  const y_norm = (imageY - cy) / fy

  // Apply inverse distortion (undistort the normalized coordinates)
  // For small distortions, inverse ≈ negative of forward
  const { k1, k2, p1, p2 } = distortion
  const r2 = x_norm * x_norm + y_norm * y_norm
  const r4 = r2 * r2

  // Radial
  const radialFactor = 1 + k1 * r2 + k2 * r4

  // Tangential
  const dx = 2 * p1 * x_norm * y_norm + p2 * (r2 + 2 * x_norm * x_norm)
  const dy = p1 * (r2 + 2 * y_norm * y_norm) + 2 * p2 * x_norm * y_norm

  // Undistorted normalized coords
  const x_undist = x_norm * radialFactor + dx
  const y_undist = y_norm * radialFactor + dy

  // Ray in camera coords
  const ray_cam = [x_undist, y_undist, 1]

  // Transform to world: ray_world = R^T * ray_cam
  const ray_world = [
    R[0][0] * ray_cam[0] + R[1][0] * ray_cam[1] + R[2][0] * ray_cam[2],
    R[0][1] * ray_cam[0] + R[1][1] * ray_cam[1] + R[2][1] * ray_cam[2],
    R[0][2] * ray_cam[0] + R[1][2] * ray_cam[1] + R[2][2] * ray_cam[2],
  ]

  // Camera position: cam_world = -R^T * T
  const cam_world = [
    -(R[0][0] * T[0] + R[1][0] * T[1] + R[2][0] * T[2]),
    -(R[0][1] * T[0] + R[1][1] * T[1] + R[2][1] * T[2]),
    -(R[0][2] * T[0] + R[1][2] * T[1] + R[2][2] * T[2]),
  ]

  // Intersect with Z=0
  if (Math.abs(ray_world[2]) < 1e-6) return { x: 0, y: 0, valid: false }
  const t = -cam_world[2] / ray_world[2]
  if (t < 0) return { x: 0, y: 0, valid: false }

  return {
    x: cam_world[0] + t * ray_world[0],
    y: cam_world[1] + t * ray_world[1],
    valid: true,
  }
}

// ============================================================================
// Polynomial Functions
// ============================================================================

function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]
  if (degree >= 1) features.push(x, y)
  if (degree >= 2) features.push(x * x, y * y, x * y)
  if (degree >= 3) features.push(x ** 3, y ** 3, x ** 2 * y, x * y ** 2)
  if (degree >= 4) features.push(x ** 4, y ** 4, x ** 3 * y, x * y ** 3, x ** 2 * y ** 2)
  return features
}

function applyPolynomial(x: number, y: number, coeffsX: number[], coeffsY: number[], degree: number): { x: number; y: number } {
  const features = polyFeatures(x, y, degree)
  let px = 0, py = 0
  for (let i = 0; i < features.length && i < coeffsX.length; i++) {
    px += coeffsX[i] * features[i]
    py += coeffsY[i] * features[i]
  }
  return { x: px, y: py }
}

// ============================================================================
// Evaluation
// ============================================================================

function evaluateDistortion(
  correspondences: Correspondence[],
  K: number[][], R: number[][], T: number[],
  center: [number, number],
  distortion: DistortionParams,
  coeffsX: number[], coeffsY: number[], degree: number
): { passRate: number; meanError: number } {
  let passCount = 0
  let totalError = 0
  let validCount = 0

  for (const c of correspondences) {
    // Project with distortion
    const proj = projectWithDistortion(c.imageX, c.imageY, K, R, T, center, distortion)
    if (!proj.valid) continue

    // Apply polynomial transform
    const final = applyPolynomial(proj.x, proj.y, coeffsX, coeffsY, degree)

    const error = Math.sqrt((final.x - c.gtX) ** 2 + (final.y - c.gtY) ** 2)
    totalError += error
    if (error < 0.5) passCount++
    validCount++
  }

  return {
    passRate: validCount > 0 ? passCount / validCount : 0,
    meanError: validCount > 0 ? totalError / validCount : Infinity,
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const program = new Command()
    .name('optimize-distortion-pipeline')
    .description('Optimize distortion parameters for each camera')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Distortion Optimization ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---\n`)

    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    // Build correspondences
    const correspondences: Correspondence[] = []
    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      correspondences.push({
        imageX,
        imageY,
        rawX: 0,  // Not used in this pipeline
        rawY: 0,
        gtX: annotation.groundPosition.x,
        gtY: annotation.groundPosition.y,
      })
    }

    // Get current polynomial from worldTransform
    const poly = cal.worldTransform?.polynomial
    if (!poly) {
      console.log('  No polynomial transform found, skipping\n')
      continue
    }

    const { coeffsX, coeffsY, degree } = poly

    // Baseline (no distortion)
    const baseline = evaluateDistortion(
      correspondences,
      cal.K, cal.R, cal.T as [number, number, number],
      cal.center as [number, number],
      { k1: 0, k2: 0, p1: 0, p2: 0 },
      coeffsX, coeffsY, degree
    )
    console.log(`Baseline (no distortion): pass=${(baseline.passRate * 100).toFixed(1)}%, error=${baseline.meanError.toFixed(3)}m`)

    // Grid search over k1
    console.log('\nGrid search over k1:')
    let bestK1 = 0
    let bestPassRate = baseline.passRate

    for (const k1 of [-0.3, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.3]) {
      const result = evaluateDistortion(
        correspondences,
        cal.K, cal.R, cal.T as [number, number, number],
        cal.center as [number, number],
        { k1, k2: 0, p1: 0, p2: 0 },
        coeffsX, coeffsY, degree
      )
      const marker = result.passRate > bestPassRate ? ' ←' : ''
      console.log(`  k1=${k1.toFixed(2).padStart(5)}: pass=${(result.passRate * 100).toFixed(1)}%, error=${result.meanError.toFixed(3)}m${marker}`)

      if (result.passRate > bestPassRate) {
        bestPassRate = result.passRate
        bestK1 = k1
      }
    }

    console.log(`\nBest k1 from grid: ${bestK1}`)

    // Fine-tune with Nelder-Mead
    console.log('\nNelder-Mead refinement (k1, k2, p1, p2):')

    const costFn = (params: number[]): number => {
      const [k1, k2, p1, p2] = params
      const result = evaluateDistortion(
        correspondences,
        cal.K, cal.R, cal.T as [number, number, number],
        cal.center as [number, number],
        { k1, k2, p1, p2 },
        coeffsX, coeffsY, degree
      )
      // Minimize error, maximize pass rate
      return result.meanError + (1 - result.passRate)
    }

    const nmResult = nelderMead(costFn, [bestK1, 0, 0, 0], {
      maxIterations: 200,
      tolerance: 1e-6,
    })

    const [optK1, optK2, optP1, optP2] = nmResult.params

    const optimized = evaluateDistortion(
      correspondences,
      cal.K, cal.R, cal.T as [number, number, number],
      cal.center as [number, number],
      { k1: optK1, k2: optK2, p1: optP1, p2: optP2 },
      coeffsX, coeffsY, degree
    )

    console.log(`Optimized distortion: k1=${optK1.toFixed(6)}, k2=${optK2.toFixed(6)}, p1=${optP1.toFixed(6)}, p2=${optP2.toFixed(6)}`)
    console.log(`Result: pass=${(optimized.passRate * 100).toFixed(1)}%, error=${optimized.meanError.toFixed(3)}m`)

    const improvement = optimized.passRate - baseline.passRate
    console.log(`Improvement: ${improvement >= 0 ? '+' : ''}${(improvement * 100).toFixed(1)}% pass rate`)

    // Output code snippet
    if (improvement > 0.01) {
      console.log(`\n// Optimized distortion for ${cameraId}`)
      console.log(`distortion: {`)
      console.log(`  k1: ${optK1.toFixed(8)},`)
      console.log(`  k2: ${optK2.toFixed(8)},`)
      console.log(`  p1: ${optP1.toFixed(8)},`)
      console.log(`  p2: ${optP2.toFixed(8)},`)
      console.log(`},`)
    } else {
      console.log('\nNo significant improvement from distortion correction.')
    }

    console.log()
  }
}

main().catch(console.error)
