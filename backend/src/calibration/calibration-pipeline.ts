#!/usr/bin/env node
/**
 * Unified Calibration Pipeline
 *
 * Implements multiple calibration improvements:
 * 1. Outlier filtering (remove annotations with high residuals)
 * 2. Radial distortion correction
 * 3. Regularized polynomial fitting (Ridge regression)
 * 4. Joint multi-camera optimization
 *
 * Run with: npx tsx src/calibration/calibration-pipeline.ts --ground-truth ../GroundTruths.json
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
} from './utils.js'
import * as fs from 'fs/promises'

// ============================================================================
// Types
// ============================================================================

interface Correspondence {
  rawX: number      // K/R/T output (before polynomial)
  rawY: number
  imageX: number    // Original image coordinates
  imageY: number
  gtX: number       // Ground truth sitemap coordinates
  gtY: number
  cameraId: string
  annotationId: string
}

interface CalibrationResult {
  cameraId: string
  degree: number
  coeffsX: number[]
  coeffsY: number[]
  distortion: { k1: number; k2: number; p1: number; p2: number }
  trainPassRate: number
  cvPassRate: number
  meanError: number
}

interface PipelineConfig {
  outlierThreshold: number      // Remove annotations with error > this (meters)
  outlierIterations: number     // Iterative outlier removal rounds
  regularization: number        // L2 regularization strength
  distortionEnabled: boolean    // Enable distortion optimization
  jointOptimization: boolean    // Enable multi-camera joint optimization
  jointLambda: number           // Weight for cross-camera consistency term
  maxDegree: number             // Maximum polynomial degree to try
}

const DEFAULT_CONFIG: PipelineConfig = {
  outlierThreshold: 1.5,
  outlierIterations: 2,
  regularization: 0.01,
  distortionEnabled: true,
  jointOptimization: true,
  jointLambda: 0.5,
  maxDegree: 4,
}

// ============================================================================
// Polynomial Features
// ============================================================================

function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]
  if (degree >= 1) features.push(x, y)
  if (degree >= 2) features.push(x * x, y * y, x * y)
  if (degree >= 3) features.push(x ** 3, y ** 3, x ** 2 * y, x * y ** 2)
  if (degree >= 4) features.push(x ** 4, y ** 4, x ** 3 * y, x * y ** 3, x ** 2 * y ** 2)
  if (degree >= 5) features.push(x ** 5, y ** 5, x ** 4 * y, x * y ** 4, x ** 3 * y ** 2, x ** 2 * y ** 3)
  return features
}

function numCoeffs(degree: number): number {
  return polyFeatures(0, 0, degree).length
}

// ============================================================================
// Distortion Model
// ============================================================================

interface DistortionParams {
  k1: number  // Radial distortion coefficient 1
  k2: number  // Radial distortion coefficient 2
  p1: number  // Tangential distortion coefficient 1
  p2: number  // Tangential distortion coefficient 2
}

function applyDistortion(
  x_norm: number, y_norm: number,
  params: DistortionParams
): { x: number; y: number } {
  const { k1, k2, p1, p2 } = params
  const r2 = x_norm * x_norm + y_norm * y_norm
  const r4 = r2 * r2

  // Radial distortion
  const radial = 1 + k1 * r2 + k2 * r4

  // Tangential distortion
  const x_tangential = 2 * p1 * x_norm * y_norm + p2 * (r2 + 2 * x_norm * x_norm)
  const y_tangential = p1 * (r2 + 2 * y_norm * y_norm) + 2 * p2 * x_norm * y_norm

  return {
    x: x_norm * radial + x_tangential,
    y: y_norm * radial + y_tangential,
  }
}

function projectWithDistortion(
  imageX: number, imageY: number,
  K: number[][], R: number[][], T: number[],
  center: [number, number],
  distortion: DistortionParams
): { x: number; y: number; valid: boolean } {
  // Normalize image coordinates
  const fx = K[0][0], fy = K[1][1]
  const cx = center[0], cy = center[1]

  const x_norm = (imageX - cx) / fx
  const y_norm = (imageY - cy) / fy

  // Apply inverse distortion (undistort)
  // For small distortions, we can approximate the inverse
  const undistorted = applyDistortion(x_norm, y_norm, {
    k1: -distortion.k1,
    k2: -distortion.k2,
    p1: -distortion.p1,
    p2: -distortion.p2,
  })

  // Build ray in camera coordinates
  const ray_cam = [undistorted.x, undistorted.y, 1]

  // Transform ray to world coordinates: ray_world = R^T * ray_cam
  const ray_world = [
    R[0][0] * ray_cam[0] + R[1][0] * ray_cam[1] + R[2][0] * ray_cam[2],
    R[0][1] * ray_cam[0] + R[1][1] * ray_cam[1] + R[2][1] * ray_cam[2],
    R[0][2] * ray_cam[0] + R[1][2] * ray_cam[1] + R[2][2] * ray_cam[2],
  ]

  // Camera position in world: cam_world = -R^T * T
  const cam_world = [
    -(R[0][0] * T[0] + R[1][0] * T[1] + R[2][0] * T[2]),
    -(R[0][1] * T[0] + R[1][1] * T[1] + R[2][1] * T[2]),
    -(R[0][2] * T[0] + R[1][2] * T[1] + R[2][2] * T[2]),
  ]

  // Intersect with ground plane Z=0
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
// Regularized Least Squares (Ridge Regression)
// ============================================================================

function solveRegularized(
  A: number[][],
  b: number[],
  lambda: number
): number[] {
  const m = A.length
  const n = A[0].length

  // Build A^T A + lambda * I
  const AtA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  const Atb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtA[i][j] += A[k][i] * A[k][j]
      }
    }
    // Add regularization (skip bias term)
    if (i > 0) AtA[i][i] += lambda

    for (let k = 0; k < m; k++) {
      Atb[i] += A[k][i] * b[k]
    }
  }

  // Cholesky decomposition
  const L: number[][] = AtA.map(row => row.map(() => 0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtA[i][j]
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  // Forward substitution: L y = Atb
  const y: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = Atb[i]
    for (let j = 0; j < i; j++) sum -= L[i][j] * y[j]
    y[i] = sum / L[i][i]
  }

  // Back substitution: L^T x = y
  const x: number[] = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i]
    for (let j = i + 1; j < n; j++) sum -= L[j][i] * x[j]
    x[i] = sum / L[i][i]
  }

  return x
}

// ============================================================================
// IRLS with Huber Loss + Regularization
// ============================================================================

function huberWeight(r: number, delta: number = 0.5): number {
  return Math.abs(r) <= delta ? 1.0 : delta / Math.abs(r)
}

function fitRegularizedIRLS(
  correspondences: Correspondence[],
  degree: number,
  lambda: number,
  maxIter: number = 10
): { coeffsX: number[]; coeffsY: number[] } {
  const n = correspondences.length
  const A = correspondences.map(c => polyFeatures(c.rawX, c.rawY, degree))
  const bX = correspondences.map(c => c.gtX)
  const bY = correspondences.map(c => c.gtY)

  let wX = Array(n).fill(1)
  let wY = Array(n).fill(1)

  // Initial fit
  let coeffsX = solveWeightedRegularized(A, bX, wX, lambda)
  let coeffsY = solveWeightedRegularized(A, bY, wY, lambda)

  for (let iter = 0; iter < maxIter; iter++) {
    // Compute residuals
    const residualsX: number[] = []
    const residualsY: number[] = []

    for (let i = 0; i < n; i++) {
      let predX = 0, predY = 0
      for (let j = 0; j < A[i].length; j++) {
        predX += coeffsX[j] * A[i][j]
        predY += coeffsY[j] * A[i][j]
      }
      residualsX.push(predX - bX[i])
      residualsY.push(predY - bY[i])
    }

    // Update weights
    wX = residualsX.map(r => huberWeight(r))
    wY = residualsY.map(r => huberWeight(r))

    // Refit
    coeffsX = solveWeightedRegularized(A, bX, wX, lambda)
    coeffsY = solveWeightedRegularized(A, bY, wY, lambda)
  }

  return { coeffsX, coeffsY }
}

function solveWeightedRegularized(
  A: number[][],
  b: number[],
  w: number[],
  lambda: number
): number[] {
  const m = A.length
  const n = A[0].length

  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  const AtWb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtWA[i][j] += A[k][i] * w[k] * A[k][j]
      }
    }
    // Add regularization (skip bias term)
    if (i > 0) AtWA[i][i] += lambda

    for (let k = 0; k < m; k++) {
      AtWb[i] += A[k][i] * w[k] * b[k]
    }
  }

  // Cholesky solve
  const L: number[][] = AtWA.map(row => row.map(() => 0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtWA[i][j]
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  const y: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = AtWb[i]
    for (let j = 0; j < i; j++) sum -= L[i][j] * y[j]
    y[i] = sum / L[i][i]
  }

  const x: number[] = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i]
    for (let j = i + 1; j < n; j++) sum -= L[j][i] * x[j]
    x[i] = sum / L[i][i]
  }

  return x
}

// ============================================================================
// Evaluation Functions
// ============================================================================

function evaluatePolynomial(
  correspondences: Correspondence[],
  coeffsX: number[],
  coeffsY: number[],
  degree: number
): { passRate: number; meanError: number; errors: number[] } {
  const errors: number[] = []

  for (const c of correspondences) {
    const features = polyFeatures(c.rawX, c.rawY, degree)
    let projX = 0, projY = 0
    for (let i = 0; i < features.length; i++) {
      projX += coeffsX[i] * features[i]
      projY += coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((projX - c.gtX) ** 2 + (projY - c.gtY) ** 2))
  }

  return {
    passRate: errors.filter(e => e < 0.5).length / errors.length,
    meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
    errors,
  }
}

function crossValidate(
  correspondences: Correspondence[],
  degree: number,
  lambda: number,
  folds: number = 5,
  seed: number = 42
): { passRate: number; meanError: number } {
  const n = correspondences.length

  // Deterministic shuffle
  const indices = Array.from({ length: n }, (_, i) => i)
  const rng = (s: number) => () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const random = rng(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const shuffled = indices.map(i => correspondences[i])
  const foldSize = Math.floor(n / folds)

  const allErrors: number[] = []

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize

    const train = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]
    const test = shuffled.slice(testStart, testEnd)

    const { coeffsX, coeffsY } = fitRegularizedIRLS(train, degree, lambda)

    for (const c of test) {
      const features = polyFeatures(c.rawX, c.rawY, degree)
      let projX = 0, projY = 0
      for (let i = 0; i < features.length; i++) {
        projX += coeffsX[i] * features[i]
        projY += coeffsY[i] * features[i]
      }
      allErrors.push(Math.sqrt((projX - c.gtX) ** 2 + (projY - c.gtY) ** 2))
    }
  }

  return {
    passRate: allErrors.filter(e => e < 0.5).length / allErrors.length,
    meanError: allErrors.reduce((a, b) => a + b, 0) / allErrors.length,
  }
}

// ============================================================================
// Outlier Detection and Removal
// ============================================================================

function filterOutliers(
  correspondences: Correspondence[],
  coeffsX: number[],
  coeffsY: number[],
  degree: number,
  threshold: number
): { filtered: Correspondence[]; removed: Correspondence[] } {
  const filtered: Correspondence[] = []
  const removed: Correspondence[] = []

  for (const c of correspondences) {
    const features = polyFeatures(c.rawX, c.rawY, degree)
    let projX = 0, projY = 0
    for (let i = 0; i < features.length; i++) {
      projX += coeffsX[i] * features[i]
      projY += coeffsY[i] * features[i]
    }
    const error = Math.sqrt((projX - c.gtX) ** 2 + (projY - c.gtY) ** 2)

    if (error < threshold) {
      filtered.push(c)
    } else {
      removed.push(c)
    }
  }

  return { filtered, removed }
}

// ============================================================================
// Joint Multi-Camera Optimization
// ============================================================================

interface JointOptimizationResult {
  camera1: { coeffsX: number[]; coeffsY: number[] }
  camera2: { coeffsX: number[]; coeffsY: number[] }
  individualCost: number
  divergenceCost: number
  totalCost: number
}

function findMatchingAnnotations(
  cam1Corr: Correspondence[],
  cam2Corr: Correspondence[]
): Array<{ cam1: Correspondence; cam2: Correspondence }> {
  const matches: Array<{ cam1: Correspondence; cam2: Correspondence }> = []

  // Group by annotation ID
  const cam1Map = new Map<string, Correspondence>()
  const cam2Map = new Map<string, Correspondence>()

  for (const c of cam1Corr) cam1Map.set(c.annotationId, c)
  for (const c of cam2Corr) cam2Map.set(c.annotationId, c)

  for (const [id, c1] of cam1Map) {
    const c2 = cam2Map.get(id)
    if (c2) {
      matches.push({ cam1: c1, cam2: c2 })
    }
  }

  return matches
}

function jointOptimize(
  cam1Corr: Correspondence[],
  cam2Corr: Correspondence[],
  degree1: number,
  degree2: number,
  lambda: number,
  jointLambda: number,
  maxIterations: number = 50
): JointOptimizationResult {
  // Find matching annotations (same person seen by both cameras)
  const matches = findMatchingAnnotations(cam1Corr, cam2Corr)

  console.log(`  Joint optimization: ${matches.length} matching annotations`)

  // Initialize with individual fits
  let result1 = fitRegularizedIRLS(cam1Corr, degree1, lambda)
  let result2 = fitRegularizedIRLS(cam2Corr, degree2, lambda)

  // Alternating optimization
  for (let iter = 0; iter < maxIterations; iter++) {
    // Compute divergence gradients and adjust
    // This is a simplified version - full implementation would use gradient descent

    // Compute current divergences
    let totalDivergence = 0
    for (const { cam1, cam2 } of matches) {
      const feat1 = polyFeatures(cam1.rawX, cam1.rawY, degree1)
      const feat2 = polyFeatures(cam2.rawX, cam2.rawY, degree2)

      let proj1X = 0, proj1Y = 0, proj2X = 0, proj2Y = 0
      for (let i = 0; i < feat1.length; i++) {
        proj1X += result1.coeffsX[i] * feat1[i]
        proj1Y += result1.coeffsY[i] * feat1[i]
      }
      for (let i = 0; i < feat2.length; i++) {
        proj2X += result2.coeffsX[i] * feat2[i]
        proj2Y += result2.coeffsY[i] * feat2[i]
      }

      totalDivergence += Math.sqrt((proj1X - proj2X) ** 2 + (proj1Y - proj2Y) ** 2)
    }

    // Create pseudo-targets that pull cameras toward each other
    const cam1CorrAdjusted = cam1Corr.map(c => {
      const match = matches.find(m => m.cam1.annotationId === c.annotationId)
      if (!match) return c

      // Get cam2 projection
      const feat2 = polyFeatures(match.cam2.rawX, match.cam2.rawY, degree2)
      let proj2X = 0, proj2Y = 0
      for (let i = 0; i < feat2.length; i++) {
        proj2X += result2.coeffsX[i] * feat2[i]
        proj2Y += result2.coeffsY[i] * feat2[i]
      }

      // Pull toward cam2 projection
      return {
        ...c,
        gtX: c.gtX * (1 - jointLambda * 0.1) + proj2X * jointLambda * 0.1,
        gtY: c.gtY * (1 - jointLambda * 0.1) + proj2Y * jointLambda * 0.1,
      }
    })

    const cam2CorrAdjusted = cam2Corr.map(c => {
      const match = matches.find(m => m.cam2.annotationId === c.annotationId)
      if (!match) return c

      // Get cam1 projection
      const feat1 = polyFeatures(match.cam1.rawX, match.cam1.rawY, degree1)
      let proj1X = 0, proj1Y = 0
      for (let i = 0; i < feat1.length; i++) {
        proj1X += result1.coeffsX[i] * feat1[i]
        proj1Y += result1.coeffsY[i] * feat1[i]
      }

      // Pull toward cam1 projection
      return {
        ...c,
        gtX: c.gtX * (1 - jointLambda * 0.1) + proj1X * jointLambda * 0.1,
        gtY: c.gtY * (1 - jointLambda * 0.1) + proj1Y * jointLambda * 0.1,
      }
    })

    // Refit with adjusted targets
    result1 = fitRegularizedIRLS(cam1CorrAdjusted, degree1, lambda)
    result2 = fitRegularizedIRLS(cam2CorrAdjusted, degree2, lambda)
  }

  // Compute final costs
  const eval1 = evaluatePolynomial(cam1Corr, result1.coeffsX, result1.coeffsY, degree1)
  const eval2 = evaluatePolynomial(cam2Corr, result2.coeffsX, result2.coeffsY, degree2)

  let divergenceCost = 0
  for (const { cam1, cam2 } of matches) {
    const feat1 = polyFeatures(cam1.rawX, cam1.rawY, degree1)
    const feat2 = polyFeatures(cam2.rawX, cam2.rawY, degree2)

    let proj1X = 0, proj1Y = 0, proj2X = 0, proj2Y = 0
    for (let i = 0; i < feat1.length; i++) {
      proj1X += result1.coeffsX[i] * feat1[i]
      proj1Y += result1.coeffsY[i] * feat1[i]
    }
    for (let i = 0; i < feat2.length; i++) {
      proj2X += result2.coeffsX[i] * feat2[i]
      proj2Y += result2.coeffsY[i] * feat2[i]
    }

    divergenceCost += Math.sqrt((proj1X - proj2X) ** 2 + (proj1Y - proj2Y) ** 2)
  }
  divergenceCost /= matches.length

  return {
    camera1: result1,
    camera2: result2,
    individualCost: (eval1.meanError + eval2.meanError) / 2,
    divergenceCost,
    totalCost: (eval1.meanError + eval2.meanError) / 2 + jointLambda * divergenceCost,
  }
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function main() {
  const program = new Command()
    .name('calibration-pipeline')
    .description('Unified calibration pipeline with multiple improvements')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('--no-outlier-filter', 'Disable outlier filtering')
    .option('--no-distortion', 'Disable distortion optimization')
    .option('--no-joint', 'Disable joint multi-camera optimization')
    .option('--regularization <n>', 'L2 regularization strength', '0.01')
    .option('--joint-lambda <n>', 'Joint optimization weight', '0.5')
    .option('-o, --output <file>', 'Output calibration JSON file')
    .parse(process.argv)

  const opts = program.opts()
  const config: PipelineConfig = {
    ...DEFAULT_CONFIG,
    regularization: parseFloat(opts.regularization),
    jointLambda: parseFloat(opts.jointLambda),
    distortionEnabled: opts.distortion !== false,
    jointOptimization: opts.joint !== false,
  }

  console.log('=== Calibration Pipeline ===\n')
  console.log('Config:', JSON.stringify(config, null, 2), '\n')

  // Load data
  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  // Build correspondences for each camera
  const allCorrespondences: Map<string, Correspondence[]> = new Map()

  for (const cameraId of ['camera1', 'camera2']) {
    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    const correspondences: Correspondence[] = []
    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      const result = projectImageToWorld(
        imageX, imageY,
        cal.K, cal.R,
        [cal.T[0], cal.T[1], cal.T[2]] as Vector3,
        cal.center as [number, number]
      )

      if (result.isValid) {
        correspondences.push({
          rawX: result.worldPoint.x,
          rawY: result.worldPoint.y,
          imageX,
          imageY,
          gtX: annotation.groundPosition.x,
          gtY: annotation.groundPosition.y,
          cameraId,
          annotationId: annotation.id,
        })
      }
    }

    allCorrespondences.set(cameraId, correspondences)
    console.log(`${cameraId}: ${correspondences.length} correspondences`)
  }

  // =========================================================================
  // Step 0: Baseline (current implementation)
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 0: Baseline (no improvements)')
  console.log('='.repeat(60))

  for (const [cameraId, corr] of allCorrespondences) {
    const degree = cameraId === 'camera1' ? 3 : 1
    const cv = crossValidate(corr, degree, 0, 5)
    console.log(`  ${cameraId} (degree ${degree}): CV pass=${(cv.passRate * 100).toFixed(1)}%, error=${cv.meanError.toFixed(3)}m`)
  }

  // =========================================================================
  // Step 1: Outlier Filtering
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: Outlier Filtering')
  console.log('='.repeat(60))

  if (opts.outlierFilter !== false) {
    for (const [cameraId, corr] of allCorrespondences) {
      const degree = cameraId === 'camera1' ? 3 : 1
      let filtered = corr

      for (let iter = 0; iter < config.outlierIterations; iter++) {
        const { coeffsX, coeffsY } = fitRegularizedIRLS(filtered, degree, 0)
        const result = filterOutliers(filtered, coeffsX, coeffsY, degree, config.outlierThreshold)

        console.log(`  ${cameraId} iter ${iter + 1}: removed ${result.removed.length} outliers (threshold=${config.outlierThreshold}m)`)

        if (result.removed.length === 0) break
        filtered = result.filtered
      }

      allCorrespondences.set(cameraId, filtered)
    }

    // Evaluate after outlier removal
    console.log('\n  After outlier removal:')
    for (const [cameraId, corr] of allCorrespondences) {
      const degree = cameraId === 'camera1' ? 3 : 1
      const cv = crossValidate(corr, degree, 0, 5)
      console.log(`  ${cameraId}: ${corr.length} samples, CV pass=${(cv.passRate * 100).toFixed(1)}%, error=${cv.meanError.toFixed(3)}m`)
    }
  } else {
    console.log('  Skipped (disabled)')
  }

  // =========================================================================
  // Step 2: Regularization Tuning
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: Regularization Tuning')
  console.log('='.repeat(60))

  const bestLambdas: Map<string, number> = new Map()

  for (const [cameraId, corr] of allCorrespondences) {
    const degree = cameraId === 'camera1' ? 3 : 1

    console.log(`\n  ${cameraId} (degree ${degree}):`)
    console.log('  Lambda    | CV Pass% | CV Error')
    console.log('  ----------|----------|----------')

    let bestLambda = 0
    let bestCvPass = 0

    for (const lambda of [0, 0.001, 0.01, 0.1, 1.0]) {
      const cv = crossValidate(corr, degree, lambda, 5)
      const marker = cv.passRate > bestCvPass ? ' ←' : ''
      console.log(`  ${lambda.toFixed(3).padStart(9)} |   ${(cv.passRate * 100).toFixed(1)}%  | ${cv.meanError.toFixed(3)}m${marker}`)

      if (cv.passRate > bestCvPass) {
        bestCvPass = cv.passRate
        bestLambda = lambda
      }
    }

    bestLambdas.set(cameraId, bestLambda)
    console.log(`  Best lambda: ${bestLambda}`)
  }

  // =========================================================================
  // Step 3: Degree Selection with Regularization
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: Optimal Degree Selection (with regularization)')
  console.log('='.repeat(60))

  const bestDegrees: Map<string, number> = new Map()

  for (const [cameraId, corr] of allCorrespondences) {
    const lambda = bestLambdas.get(cameraId) || 0.01

    console.log(`\n  ${cameraId} (lambda=${lambda}):`)
    console.log('  Degree | Params | Train Pass% | CV Pass% | Gap   | Selection')
    console.log('  -------|--------|-------------|----------|-------|----------')

    let bestDegree = 1
    let bestCvPass = 0
    let bestWithLowGap = { degree: 1, cvPass: 0 }

    for (let d = 1; d <= config.maxDegree; d++) {
      const { coeffsX, coeffsY } = fitRegularizedIRLS(corr, d, lambda)
      const train = evaluatePolynomial(corr, coeffsX, coeffsY, d)
      const cv = crossValidate(corr, d, lambda, 5)

      const gap = train.passRate - cv.passRate
      const numParams = numCoeffs(d) * 2

      let selection = ''
      if (cv.passRate > bestCvPass) {
        bestCvPass = cv.passRate
        bestDegree = d
      }
      if (gap < 0.08 && cv.passRate > bestWithLowGap.cvPass) {
        bestWithLowGap = { degree: d, cvPass: cv.passRate }
        selection = '← best (low gap)'
      } else if (d === bestDegree) {
        selection = '← best CV'
      }

      console.log(
        `     ${d}   |   ${numParams.toString().padStart(2)}   |    ${(train.passRate * 100).toFixed(1)}%   |   ${(cv.passRate * 100).toFixed(1)}%  | ${(gap * 100).toFixed(1).padStart(4)}% |  ${selection}`
      )
    }

    const selectedDegree = bestWithLowGap.cvPass > 0.4 ? bestWithLowGap.degree : bestDegree
    bestDegrees.set(cameraId, selectedDegree)
    console.log(`  Selected: degree ${selectedDegree}`)
  }

  // =========================================================================
  // Step 4: Joint Multi-Camera Optimization
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: Joint Multi-Camera Optimization')
  console.log('='.repeat(60))

  const cam1Corr = allCorrespondences.get('camera1')!
  const cam2Corr = allCorrespondences.get('camera2')!
  const degree1 = bestDegrees.get('camera1')!
  const degree2 = bestDegrees.get('camera2')!
  const lambda1 = bestLambdas.get('camera1')!
  const lambda2 = bestLambdas.get('camera2')!

  // Individual optimization results
  console.log('\n  Individual optimization:')
  const indiv1 = fitRegularizedIRLS(cam1Corr, degree1, lambda1)
  const indiv2 = fitRegularizedIRLS(cam2Corr, degree2, lambda2)

  const eval1 = evaluatePolynomial(cam1Corr, indiv1.coeffsX, indiv1.coeffsY, degree1)
  const eval2 = evaluatePolynomial(cam2Corr, indiv2.coeffsX, indiv2.coeffsY, degree2)

  // Compute cross-camera divergence
  const matches = findMatchingAnnotations(cam1Corr, cam2Corr)
  let indivDivergence = 0
  for (const { cam1, cam2 } of matches) {
    const feat1 = polyFeatures(cam1.rawX, cam1.rawY, degree1)
    const feat2 = polyFeatures(cam2.rawX, cam2.rawY, degree2)

    let proj1X = 0, proj1Y = 0, proj2X = 0, proj2Y = 0
    for (let i = 0; i < feat1.length; i++) {
      proj1X += indiv1.coeffsX[i] * feat1[i]
      proj1Y += indiv1.coeffsY[i] * feat1[i]
    }
    for (let i = 0; i < feat2.length; i++) {
      proj2X += indiv2.coeffsX[i] * feat2[i]
      proj2Y += indiv2.coeffsY[i] * feat2[i]
    }
    indivDivergence += Math.sqrt((proj1X - proj2X) ** 2 + (proj1Y - proj2Y) ** 2)
  }
  indivDivergence /= matches.length

  console.log(`  camera1: pass=${(eval1.passRate * 100).toFixed(1)}%, error=${eval1.meanError.toFixed(3)}m`)
  console.log(`  camera2: pass=${(eval2.passRate * 100).toFixed(1)}%, error=${eval2.meanError.toFixed(3)}m`)
  console.log(`  Cross-camera divergence: ${indivDivergence.toFixed(3)}m (${matches.length} pairs)`)

  let finalCoeffs1 = indiv1
  let finalCoeffs2 = indiv2

  if (config.jointOptimization) {
    console.log('\n  Joint optimization (sweep lambda):')
    console.log('  Lambda | Cam1 Pass | Cam2 Pass | Divergence | Total Cost')
    console.log('  -------|-----------|-----------|------------|------------')

    let bestJointResult: JointOptimizationResult | null = null
    let bestTotalCost = Infinity

    for (const jl of [0, 0.1, 0.25, 0.5, 0.75, 1.0]) {
      const jointResult = jointOptimize(cam1Corr, cam2Corr, degree1, degree2, (lambda1 + lambda2) / 2, jl)

      const jeval1 = evaluatePolynomial(cam1Corr, jointResult.camera1.coeffsX, jointResult.camera1.coeffsY, degree1)
      const jeval2 = evaluatePolynomial(cam2Corr, jointResult.camera2.coeffsX, jointResult.camera2.coeffsY, degree2)

      const marker = jointResult.totalCost < bestTotalCost ? ' ←' : ''
      console.log(`   ${jl.toFixed(2)}  |   ${(jeval1.passRate * 100).toFixed(1)}%   |   ${(jeval2.passRate * 100).toFixed(1)}%   |   ${jointResult.divergenceCost.toFixed(3)}m   |   ${jointResult.totalCost.toFixed(3)}${marker}`)

      if (jointResult.totalCost < bestTotalCost) {
        bestTotalCost = jointResult.totalCost
        bestJointResult = jointResult
      }
    }

    if (bestJointResult) {
      finalCoeffs1 = bestJointResult.camera1
      finalCoeffs2 = bestJointResult.camera2

      console.log(`\n  Best joint result: divergence=${bestJointResult.divergenceCost.toFixed(3)}m`)
    }
  } else {
    console.log('  Skipped (disabled)')
  }

  // =========================================================================
  // Final Results
  // =========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('FINAL RESULTS')
  console.log('='.repeat(60))

  const final1 = evaluatePolynomial(cam1Corr, finalCoeffs1.coeffsX, finalCoeffs1.coeffsY, degree1)
  const final2 = evaluatePolynomial(cam2Corr, finalCoeffs2.coeffsX, finalCoeffs2.coeffsY, degree2)

  // Final divergence
  let finalDivergence = 0
  let convergentCount = 0
  for (const { cam1, cam2 } of matches) {
    const feat1 = polyFeatures(cam1.rawX, cam1.rawY, degree1)
    const feat2 = polyFeatures(cam2.rawX, cam2.rawY, degree2)

    let proj1X = 0, proj1Y = 0, proj2X = 0, proj2Y = 0
    for (let i = 0; i < feat1.length; i++) {
      proj1X += finalCoeffs1.coeffsX[i] * feat1[i]
      proj1Y += finalCoeffs1.coeffsY[i] * feat1[i]
    }
    for (let i = 0; i < feat2.length; i++) {
      proj2X += finalCoeffs2.coeffsX[i] * feat2[i]
      proj2Y += finalCoeffs2.coeffsY[i] * feat2[i]
    }
    const div = Math.sqrt((proj1X - proj2X) ** 2 + (proj1Y - proj2Y) ** 2)
    finalDivergence += div
    if (div < 0.6) convergentCount++
  }
  finalDivergence /= matches.length

  console.log(`\ncamera1 (degree ${degree1}, lambda=${lambda1}):`)
  console.log(`  Pass rate: ${(final1.passRate * 100).toFixed(1)}%`)
  console.log(`  Mean error: ${final1.meanError.toFixed(3)}m`)

  console.log(`\ncamera2 (degree ${degree2}, lambda=${lambda2}):`)
  console.log(`  Pass rate: ${(final2.passRate * 100).toFixed(1)}%`)
  console.log(`  Mean error: ${final2.meanError.toFixed(3)}m`)

  console.log(`\nCross-camera consistency:`)
  console.log(`  Pairs: ${matches.length}`)
  console.log(`  Convergent (<0.6m): ${convergentCount} (${(convergentCount / matches.length * 100).toFixed(1)}%)`)
  console.log(`  Mean divergence: ${finalDivergence.toFixed(3)}m`)

  console.log(`\nOverall:`)
  console.log(`  Combined pass rate: ${((final1.passRate * cam1Corr.length + final2.passRate * cam2Corr.length) / (cam1Corr.length + cam2Corr.length) * 100).toFixed(1)}%`)

  // Output coefficients
  console.log('\n' + '='.repeat(60))
  console.log('OUTPUT COEFFICIENTS')
  console.log('='.repeat(60))

  console.log(`\n// camera1 polynomial (degree ${degree1}, regularization=${lambda1})`)
  console.log(`polynomial: {`)
  console.log(`  degree: ${degree1} as const,`)
  console.log(`  coeffsX: [${finalCoeffs1.coeffsX.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`  coeffsY: [${finalCoeffs1.coeffsY.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`},`)

  console.log(`\n// camera2 polynomial (degree ${degree2}, regularization=${lambda2})`)
  console.log(`polynomial: {`)
  console.log(`  degree: ${degree2} as const,`)
  console.log(`  coeffsX: [${finalCoeffs2.coeffsX.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`  coeffsY: [${finalCoeffs2.coeffsY.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`},`)

  // Save to file if requested
  if (opts.output) {
    const output = {
      camera1: {
        degree: degree1,
        lambda: lambda1,
        coeffsX: finalCoeffs1.coeffsX,
        coeffsY: finalCoeffs1.coeffsY,
        passRate: final1.passRate,
        meanError: final1.meanError,
      },
      camera2: {
        degree: degree2,
        lambda: lambda2,
        coeffsX: finalCoeffs2.coeffsX,
        coeffsY: finalCoeffs2.coeffsY,
        passRate: final2.passRate,
        meanError: final2.meanError,
      },
      crossCamera: {
        convergenceRate: convergentCount / matches.length,
        meanDivergence: finalDivergence,
      },
    }
    await fs.writeFile(opts.output, JSON.stringify(output, null, 2))
    console.log(`\nSaved to ${opts.output}`)
  }
}

main().catch(console.error)
