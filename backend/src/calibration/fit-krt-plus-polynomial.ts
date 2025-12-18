#!/usr/bin/env node
/**
 * K/R/T + Polynomial Fitter
 *
 * This matches the current system's approach:
 * 1. First project image to world using K/R/T (raw coordinates)
 * 2. Then apply polynomial transform to map to sitemap coordinates
 *
 * This tests whether the K/R/T pre-transform helps the polynomial.
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
} from './utils.js'

interface PolynomialResult {
  degree: number
  coeffsX: number[]
  coeffsY: number[]
  meanError: number
  passRate: number
}

interface Correspondence {
  rawX: number  // K/R/T projected x
  rawY: number  // K/R/T projected y
  gtX: number   // ground truth x
  gtY: number   // ground truth y
}

/**
 * Generate polynomial feature vector (same as existing polynomial transform)
 */
function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]

  if (degree >= 1) {
    features.push(x, y)
  }
  if (degree >= 2) {
    features.push(x * x, y * y, x * y)
  }
  if (degree >= 3) {
    features.push(x * x * x, y * y * y, x * x * y, x * y * y)
  }
  if (degree >= 4) {
    features.push(x * x * x * x, y * y * y * y, x * x * x * y, x * y * y * y, x * x * y * y)
  }
  if (degree >= 5) {
    features.push(
      x * x * x * x * x,
      y * y * y * y * y,
      x * x * x * x * y,
      x * y * y * y * y,
      x * x * x * y * y,
      x * x * y * y * y
    )
  }

  return features
}

/**
 * Huber weight function for robust regression
 */
function huberWeight(residual: number, delta: number = 1.0): number {
  const absR = Math.abs(residual)
  if (absR <= delta) {
    return 1.0
  }
  return delta / absR
}

/**
 * Solve linear system using Cholesky decomposition
 */
function solveLinearSystem(A: number[][], b: number[], lambda: number = 1e-6): number[] {
  const m = A.length
  const n = A[0].length

  // A^T * A + lambda*I
  const AtA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtA[i][j] += A[k][i] * A[k][j]
      }
      if (i === j) AtA[i][j] += lambda
    }
  }

  // A^T * b
  const Atb: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) {
      Atb[i] += A[k][i] * b[k]
    }
  }

  // Cholesky decomposition
  const L: number[][] = AtA.map((row) => row.map(() => 0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtA[i][j]
      for (let k = 0; k < j; k++) {
        sum -= L[i][k] * L[j][k]
      }
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  // Forward substitution: L * y = Atb
  const y: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = Atb[i]
    for (let j = 0; j < i; j++) {
      sum -= L[i][j] * y[j]
    }
    y[i] = sum / L[i][i]
  }

  // Back substitution: L^T * x = y
  const x: number[] = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i]
    for (let j = i + 1; j < n; j++) {
      sum -= L[j][i] * x[j]
    }
    x[i] = sum / L[i][i]
  }

  return x
}

/**
 * Solve weighted linear system (for IRLS)
 */
function solveWeightedLinearSystem(A: number[][], b: number[], weights: number[], lambda: number = 1e-6): number[] {
  const m = A.length
  const n = A[0].length

  // A^T * W * A + lambda*I
  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtWA[i][j] += A[k][i] * weights[k] * A[k][j]
      }
      if (i === j) AtWA[i][j] += lambda
    }
  }

  // A^T * W * b
  const AtWb: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) {
      AtWb[i] += A[k][i] * weights[k] * b[k]
    }
  }

  // Cholesky decomposition
  const L: number[][] = AtWA.map((row) => row.map(() => 0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtWA[i][j]
      for (let k = 0; k < j; k++) {
        sum -= L[i][k] * L[j][k]
      }
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  // Forward substitution
  const y: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = AtWb[i]
    for (let j = 0; j < i; j++) {
      sum -= L[i][j] * y[j]
    }
    y[i] = sum / L[i][i]
  }

  // Back substitution
  const x: number[] = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = y[i]
    for (let j = i + 1; j < n; j++) {
      sum -= L[j][i] * x[j]
    }
    x[i] = sum / L[i][i]
  }

  return x
}

/**
 * Fit polynomial transform using IRLS (Iteratively Reweighted Least Squares) with Huber loss
 */
function fitPolynomialIRLS(correspondences: Correspondence[], degree: number, maxIter: number = 10): PolynomialResult {
  const n = correspondences.length
  const A: number[][] = []
  const bX: number[] = []
  const bY: number[] = []

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    A.push(polyFeatures(rawX, rawY, degree))
    bX.push(gtX)
    bY.push(gtY)
  }

  // Initial fit with uniform weights
  let weightsX = Array(n).fill(1)
  let weightsY = Array(n).fill(1)
  let coeffsX = solveWeightedLinearSystem(A, bX, weightsX)
  let coeffsY = solveWeightedLinearSystem(A, bY, weightsY)

  // IRLS iterations
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

    // Update weights using Huber
    weightsX = residualsX.map((r) => huberWeight(r, 0.5))
    weightsY = residualsY.map((r) => huberWeight(r, 0.5))

    // Re-fit with new weights
    coeffsX = solveWeightedLinearSystem(A, bX, weightsX)
    coeffsY = solveWeightedLinearSystem(A, bY, weightsY)
  }

  // Evaluate
  let totalError = 0
  let passCount = 0

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    const features = polyFeatures(rawX, rawY, degree)
    let projX = 0, projY = 0
    for (let i = 0; i < features.length; i++) {
      projX += coeffsX[i] * features[i]
      projY += coeffsY[i] * features[i]
    }
    const error = Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2)
    totalError += error
    if (error < 0.5) passCount++
  }

  return {
    degree,
    coeffsX,
    coeffsY,
    meanError: totalError / correspondences.length,
    passRate: passCount / correspondences.length,
  }
}

/**
 * Fit polynomial transform from raw K/R/T output to ground truth
 */
function fitPolynomial(correspondences: Correspondence[], degree: number, useIRLS: boolean = true): PolynomialResult {
  if (useIRLS) {
    return fitPolynomialIRLS(correspondences, degree)
  }

  const A: number[][] = []
  const bX: number[] = []
  const bY: number[] = []

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    A.push(polyFeatures(rawX, rawY, degree))
    bX.push(gtX)
    bY.push(gtY)
  }

  const coeffsX = solveLinearSystem(A, bX)
  const coeffsY = solveLinearSystem(A, bY)

  // Evaluate
  let totalError = 0
  let passCount = 0

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    const features = polyFeatures(rawX, rawY, degree)
    let projX = 0, projY = 0
    for (let i = 0; i < features.length; i++) {
      projX += coeffsX[i] * features[i]
      projY += coeffsY[i] * features[i]
    }
    const error = Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2)
    totalError += error
    if (error < 0.5) passCount++
  }

  return {
    degree,
    coeffsX,
    coeffsY,
    meanError: totalError / correspondences.length,
    passRate: passCount / correspondences.length,
  }
}

async function main() {
  const program = new Command()
    .name('fit-krt-plus-polynomial')
    .description('Fit polynomial on top of K/R/T projection')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-c, --camera <id>', 'Camera ID', 'camera1')
    .option('-o, --output <file>', 'Output JSON file')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== K/R/T + Polynomial Fitter ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)

  const registry = new CameraRegistry()
  const cal = registry.getCalibration(opts.camera)!

  const annotations = filterAnnotations(groundTruths.annotations, opts.camera, ['certain'])
  console.log(`${opts.camera}: ${annotations.length} 'certain' annotations\n`)

  // Create correspondences: project through K/R/T first
  const correspondences: Correspondence[] = []

  for (const { annotation, detection } of annotations) {
    const bboxCenterX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
    const bboxBottomY = detection.bbox.bottom * 1080

    const result = projectImageToWorld(
      bboxCenterX,
      bboxBottomY,
      cal.K,
      cal.R,
      [cal.T[0], cal.T[1], cal.T[2]] as Vector3,
      cal.center as [number, number]
    )

    if (result.isValid) {
      correspondences.push({
        rawX: result.worldPoint.x,
        rawY: result.worldPoint.y,
        gtX: annotation.groundPosition.x,
        gtY: annotation.groundPosition.y,
      })
    }
  }

  console.log(`Valid correspondences: ${correspondences.length}\n`)

  // Show raw K/R/T coordinate range
  const rawXs = correspondences.map((c) => c.rawX)
  const rawYs = correspondences.map((c) => c.rawY)
  console.log('--- Raw K/R/T Output Range ---')
  console.log(`  X: [${Math.min(...rawXs).toFixed(2)}, ${Math.max(...rawXs).toFixed(2)}]`)
  console.log(`  Y: [${Math.min(...rawYs).toFixed(2)}, ${Math.max(...rawYs).toFixed(2)}]`)

  // Test different degrees
  console.log('\n--- Polynomial Degree Comparison ---')
  console.log('Degree | Coeffs | Mean Error | Pass Rate')
  console.log('-------|--------|------------|----------')

  for (let d = 1; d <= 5; d++) {
    const result = fitPolynomial(correspondences, d)
    console.log(
      `   ${d}   |   ${result.coeffsX.length.toString().padStart(2)}   |   ${result.meanError.toFixed(3)}m   |   ${(result.passRate * 100).toFixed(1)}%`
    )
  }

  // Fit degree 5
  const result = fitPolynomial(correspondences, 5)

  console.log('\n--- Degree 5 Coefficients ---')
  console.log('coeffsX:', result.coeffsX.map((c) => c.toFixed(8)).join(', '))
  console.log('coeffsY:', result.coeffsY.map((c) => c.toFixed(8)).join(', '))

  // Sample projections
  console.log('\n--- Sample Projections ---')
  console.log('Raw K/R/T | Polynomial | Ground Truth | Error')
  for (let i = 0; i < Math.min(8, correspondences.length); i++) {
    const { rawX, rawY, gtX, gtY } = correspondences[i]
    const features = polyFeatures(rawX, rawY, 5)
    let projX = 0, projY = 0
    for (let j = 0; j < features.length; j++) {
      projX += result.coeffsX[j] * features[j]
      projY += result.coeffsY[j] * features[j]
    }
    const error = Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2)
    console.log(
      `(${rawX.toFixed(2)}, ${rawY.toFixed(2)}) | (${projX.toFixed(2)}, ${projY.toFixed(2)}) | (${gtX.toFixed(2)}, ${gtY.toFixed(2)}) | ${error.toFixed(3)}m`
    )
  }

  // Save output
  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify(result, null, 2))
    console.log(`\nSaved to ${opts.output}`)
  }
}

main().catch(console.error)
