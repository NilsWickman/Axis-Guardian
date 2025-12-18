#!/usr/bin/env node
/**
 * Polynomial Image-to-World Transform Fitter
 *
 * Fits a polynomial transformation from image coordinates (u, v) to
 * world coordinates (X, Y) using least squares regression.
 *
 * Polynomial model (degree 5):
 *   X = c0 + c1*u + c2*v + c3*u² + c4*v² + c5*u*v
 *       + c6*u³ + c7*v³ + c8*u²v + c9*uv²
 *       + c10*u⁴ + c11*v⁴ + c12*u³v + c13*uv³ + c14*u²v²
 *       + c15*u⁵ + c16*v⁵ + c17*u⁴v + c18*uv⁴ + c19*u³v² + c20*u²v³
 *
 * Same for Y with different coefficients.
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import {
  loadGroundTruths,
  filterAnnotations,
  type GroundTruthAnnotation,
} from './utils.js'

interface PolynomialResult {
  degree: number
  coeffsX: number[]
  coeffsY: number[]
  meanError: number
  passRate: number
  sampleErrors: number[]
}

interface Correspondence {
  u: number  // image x (pixels)
  v: number  // image y (pixels)
  x: number  // world x (meters)
  y: number  // world y (meters)
}

/**
 * Generate polynomial feature vector for given degree
 */
function polyFeatures(u: number, v: number, degree: number): number[] {
  // Normalize to avoid numerical issues
  const un = u / 1000  // Scale to ~1
  const vn = v / 1000

  const features: number[] = [1] // c0

  if (degree >= 1) {
    features.push(un, vn) // c1, c2
  }
  if (degree >= 2) {
    features.push(un * un, vn * vn, un * vn) // c3, c4, c5
  }
  if (degree >= 3) {
    features.push(un * un * un, vn * vn * vn, un * un * vn, un * vn * vn) // c6-c9
  }
  if (degree >= 4) {
    features.push(
      un * un * un * un,
      vn * vn * vn * vn,
      un * un * un * vn,
      un * vn * vn * vn,
      un * un * vn * vn
    ) // c10-c14
  }
  if (degree >= 5) {
    features.push(
      un * un * un * un * un,
      vn * vn * vn * vn * vn,
      un * un * un * un * vn,
      un * vn * vn * vn * vn,
      un * un * un * vn * vn,
      un * un * vn * vn * vn
    ) // c15-c20
  }

  return features
}

/**
 * Solve linear system A * x = b using normal equations with regularization
 * (Ridge regression: (A^T*A + lambda*I) * x = A^T * b)
 */
function solveLinearSystem(A: number[][], b: number[], lambda: number = 1e-6): number[] {
  const m = A.length      // Number of samples
  const n = A[0].length   // Number of features

  // Compute A^T * A
  const AtA: number[][] = []
  for (let i = 0; i < n; i++) {
    AtA[i] = []
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < m; k++) {
        sum += A[k][i] * A[k][j]
      }
      // Add regularization to diagonal
      AtA[i][j] = sum + (i === j ? lambda : 0)
    }
  }

  // Compute A^T * b
  const Atb: number[] = []
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let k = 0; k < m; k++) {
      sum += A[k][i] * b[k]
    }
    Atb[i] = sum
  }

  // Solve AtA * x = Atb using Cholesky decomposition
  // (AtA is symmetric positive definite with regularization)

  // Cholesky: AtA = L * L^T
  const L: number[][] = AtA.map((row) => row.map(() => 0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtA[i][j]
      for (let k = 0; k < j; k++) {
        sum -= L[i][k] * L[j][k]
      }
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(sum, 1e-12))
      } else {
        L[i][j] = sum / L[j][j]
      }
    }
  }

  // Solve L * y = Atb
  const y: number[] = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let sum = Atb[i]
    for (let j = 0; j < i; j++) {
      sum -= L[i][j] * y[j]
    }
    y[i] = sum / L[i][i]
  }

  // Solve L^T * x = y
  const x: number[] = new Array(n).fill(0)
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
 * Apply polynomial to project image to world
 */
function applyPolynomial(u: number, v: number, coeffsX: number[], coeffsY: number[], degree: number): { x: number; y: number } {
  const features = polyFeatures(u, v, degree)

  let x = 0, y = 0
  for (let i = 0; i < features.length; i++) {
    x += coeffsX[i] * features[i]
    y += coeffsY[i] * features[i]
  }

  return { x, y }
}

/**
 * Fit polynomial transform using least squares
 */
function fitPolynomial(correspondences: Correspondence[], degree: number, lambda: number = 1e-4): PolynomialResult {
  const n = correspondences.length

  // Build feature matrix
  const A: number[][] = []
  const bX: number[] = []
  const bY: number[] = []

  for (const { u, v, x, y } of correspondences) {
    A.push(polyFeatures(u, v, degree))
    bX.push(x)
    bY.push(y)
  }

  // Solve for X and Y coefficients
  const coeffsX = solveLinearSystem(A, bX, lambda)
  const coeffsY = solveLinearSystem(A, bY, lambda)

  // Evaluate
  const errors: number[] = []
  for (const { u, v, x, y } of correspondences) {
    const projected = applyPolynomial(u, v, coeffsX, coeffsY, degree)
    const error = Math.sqrt((projected.x - x) ** 2 + (projected.y - y) ** 2)
    errors.push(error)
  }

  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length
  const passRate = errors.filter((e) => e < 0.5).length / errors.length

  return {
    degree,
    coeffsX,
    coeffsY,
    meanError,
    passRate,
    sampleErrors: errors,
  }
}

/**
 * Cross-validate polynomial fit
 */
function crossValidate(correspondences: Correspondence[], degree: number, folds: number = 5): { meanError: number; passRate: number } {
  const n = correspondences.length
  const shuffled = [...correspondences].sort(() => Math.random() - 0.5)
  const foldSize = Math.floor(n / folds)

  const allErrors: number[] = []

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize

    const train = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]
    const test = shuffled.slice(testStart, testEnd)

    const result = fitPolynomial(train, degree)

    for (const { u, v, x, y } of test) {
      const projected = applyPolynomial(u, v, result.coeffsX, result.coeffsY, degree)
      const error = Math.sqrt((projected.x - x) ** 2 + (projected.y - y) ** 2)
      allErrors.push(error)
    }
  }

  return {
    meanError: allErrors.reduce((a, b) => a + b, 0) / allErrors.length,
    passRate: allErrors.filter((e) => e < 0.5).length / allErrors.length,
  }
}

async function main() {
  const program = new Command()
    .name('fit-polynomial')
    .description('Fit polynomial image-to-world transform')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-c, --camera <id>', 'Camera ID', 'camera1')
    .option('-d, --degree <n>', 'Polynomial degree (1-5)', '5')
    .option('--lambda <n>', 'Regularization strength', '0.0001')
    .option('-o, --output <file>', 'Output JSON file')
    .option('--cross-validate', 'Run cross-validation')
    .parse(process.argv)

  const opts = program.opts()
  const degree = parseInt(opts.degree)
  const lambda = parseFloat(opts.lambda)

  console.log('=== Polynomial Image-to-World Fitter ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)

  const annotations = filterAnnotations(groundTruths.annotations, opts.camera, ['certain'])
  console.log(`${opts.camera}: ${annotations.length} 'certain' annotations\n`)

  // Create correspondences
  const correspondences: Correspondence[] = annotations.map(({ annotation, detection }) => ({
    u: ((detection.bbox.left + detection.bbox.right) / 2) * 1920,
    v: detection.bbox.bottom * 1080,
    x: annotation.groundPosition.x,
    y: annotation.groundPosition.y,
  }))

  // Test different degrees
  console.log('--- Polynomial Degree Comparison ---')
  console.log('Degree | Coeffs | Train Error | Train Pass% | CV Error | CV Pass%')
  console.log('-------|--------|-------------|-------------|----------|----------')

  for (let d = 1; d <= 5; d++) {
    const result = fitPolynomial(correspondences, d, lambda)
    const cv = crossValidate(correspondences, d)
    const numCoeffs = result.coeffsX.length

    console.log(
      `   ${d}   |   ${numCoeffs.toString().padStart(2)}   |   ${result.meanError.toFixed(3)}m   |    ${(result.passRate * 100).toFixed(1)}%   |  ${cv.meanError.toFixed(3)}m  |   ${(cv.passRate * 100).toFixed(1)}%`
    )
  }

  // Fit final model
  console.log(`\n--- Fitting Degree ${degree} Polynomial ---`)
  const result = fitPolynomial(correspondences, degree, lambda)

  console.log(`Mean error: ${result.meanError.toFixed(3)}m`)
  console.log(`Pass rate: ${(result.passRate * 100).toFixed(1)}%`)
  console.log(`Coefficients: ${result.coeffsX.length} per dimension`)

  // Print coefficients
  console.log('\n--- Coefficients ---')
  console.log('coeffsX:', result.coeffsX.map((c) => c.toFixed(6)).join(', '))
  console.log('coeffsY:', result.coeffsY.map((c) => c.toFixed(6)).join(', '))

  // Sample projections
  console.log('\n--- Sample Projections ---')
  console.log('Image Point | Projected | Ground Truth | Error')
  for (let i = 0; i < Math.min(10, correspondences.length); i++) {
    const { u, v, x, y } = correspondences[i]
    const projected = applyPolynomial(u, v, result.coeffsX, result.coeffsY, degree)
    const error = Math.sqrt((projected.x - x) ** 2 + (projected.y - y) ** 2)
    console.log(
      `(${u.toFixed(0)}, ${v.toFixed(0)}) | (${projected.x.toFixed(2)}, ${projected.y.toFixed(2)}) | (${x.toFixed(2)}, ${y.toFixed(2)}) | ${error.toFixed(3)}m`
    )
  }

  // Error distribution
  console.log('\n--- Error Distribution ---')
  const sorted = [...result.sampleErrors].sort((a, b) => a - b)
  console.log(`  Min: ${sorted[0].toFixed(3)}m`)
  console.log(`  Median: ${sorted[Math.floor(sorted.length * 0.5)].toFixed(3)}m`)
  console.log(`  90th percentile: ${sorted[Math.floor(sorted.length * 0.9)].toFixed(3)}m`)
  console.log(`  Max: ${sorted[sorted.length - 1].toFixed(3)}m`)

  // Save output
  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify(result, null, 2))
    console.log(`\nSaved to ${opts.output}`)
  }
}

main().catch(console.error)
