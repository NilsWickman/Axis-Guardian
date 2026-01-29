/**
 * Polynomial Fitting for Direct Image→World Calibration
 *
 * Fits polynomial coefficients to map normalized image coordinates
 * directly to sitemap world coordinates using ground truth data.
 *
 * Uses least-squares regression to find optimal coefficients.
 */

import { Matrix, solve } from 'ml-matrix'
import type { GroundTruthAnnotation } from '../types/ground-truth.js'
import type { DirectPolynomial } from '../types/camera.js'
import type { Point2D } from '../types/geometry.js'

// ============================================================================
// Polynomial Term Generation (must match ground-plane.ts)
// ============================================================================

/**
 * Generate polynomial feature terms for a given (u, v) point
 *
 * Term ordering matches ground-plane.ts directPolyTerms():
 * - degree 1: [1, u, v]
 * - degree 2: [1, u, v, u², v², uv]
 * - degree 3: [1, u, v, u², v², uv, u³, v³, u²v, uv²]
 * - degree 4: [1, ..., u⁴, v⁴, u³v, uv³, u²v²]
 * - degree 5: [1, ..., u⁵, v⁵, u⁴v, uv⁴, u³v², u²v³]
 */
export function generatePolyTerms(u: number, v: number, degree: number): number[] {
  const terms: number[] = [1]

  if (degree >= 1) {
    terms.push(u, v)
  }

  if (degree >= 2) {
    terms.push(u * u, v * v, u * v)
  }

  if (degree >= 3) {
    terms.push(u * u * u, v * v * v, u * u * v, u * v * v)
  }

  if (degree >= 4) {
    terms.push(u ** 4, v ** 4, u ** 3 * v, u * v ** 3, u ** 2 * v ** 2)
  }

  if (degree >= 5) {
    terms.push(u ** 5, v ** 5, u ** 4 * v, u * v ** 4, u ** 3 * v ** 2, u ** 2 * v ** 3)
  }

  return terms
}

/**
 * Get number of terms for a given polynomial degree
 */
export function getTermCount(degree: number): number {
  const counts: Record<number, number> = {
    1: 3,
    2: 6,
    3: 10,
    4: 15,
    5: 21,
  }
  return counts[degree] ?? 3
}

// ============================================================================
// Correspondence Point Extraction
// ============================================================================

/**
 * A single correspondence point for fitting
 */
export interface CorrespondencePoint {
  /** Normalized image X (0-1), typically bbox bottom-center */
  imageX: number
  /** Normalized image Y (0-1) */
  imageY: number
  /** World X coordinate (meters) */
  worldX: number
  /** World Y coordinate (meters) */
  worldY: number
  /** Original annotation ID for debugging */
  annotationId: string
}

/**
 * Extract correspondence points from ground truth annotations
 *
 * Uses bbox bottom-center as the image point (feet position)
 */
export function extractCorrespondencePoints(
  annotations: GroundTruthAnnotation[]
): CorrespondencePoint[] {
  const points: CorrespondencePoint[] = []

  for (const ann of annotations) {
    if (!ann.worldPosition) continue

    // Get bbox bottom-center (feet position)
    const [x, y, w, h] = ann.bbox
    const imageX = x + w / 2 // Center X
    const imageY = y + h // Bottom Y (feet)

    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, imageX))
    const clampedY = Math.max(0, Math.min(1, imageY))

    points.push({
      imageX: clampedX,
      imageY: clampedY,
      worldX: ann.worldPosition.x,
      worldY: ann.worldPosition.y,
      annotationId: ann.id,
    })
  }

  return points
}

// ============================================================================
// Least Squares Polynomial Fitting
// ============================================================================

/**
 * Fit result with diagnostics
 */
export interface PolynomialFitResult {
  /** The fitted polynomial */
  polynomial: DirectPolynomial
  /** Number of correspondence points used */
  pointCount: number
  /** Root mean square error on training data */
  rmse: number
  /** Maximum error on training data */
  maxError: number
  /** Per-point errors for analysis */
  errors: { annotationId: string; error: number; predicted: Point2D; actual: Point2D }[]
  /** Condition number of the design matrix (high = ill-conditioned) */
  conditionNumber: number
}

/**
 * Fit polynomial coefficients using least-squares regression
 *
 * Solves: A * coeffs = b
 * Where A is the design matrix of polynomial terms
 * and b is the target world coordinates
 *
 * Uses normal equations: coeffs = (A^T * A)^-1 * A^T * b
 */
export function fitPolynomial(
  points: CorrespondencePoint[],
  degree: 3 | 4 | 5 = 3
): PolynomialFitResult {
  const n = points.length
  const numTerms = getTermCount(degree)

  if (n < numTerms) {
    throw new Error(
      `Not enough points for degree ${degree} polynomial. ` +
        `Need at least ${numTerms} points, got ${n}`
    )
  }

  // Build design matrix A (n x numTerms)
  const A: number[][] = []
  const bX: number[] = []
  const bY: number[] = []

  for (const point of points) {
    const terms = generatePolyTerms(point.imageX, point.imageY, degree)
    A.push(terms)
    bX.push(point.worldX)
    bY.push(point.worldY)
  }

  // Convert to Matrix objects
  const matA = new Matrix(A)
  const vecBx = Matrix.columnVector(bX)
  const vecBy = Matrix.columnVector(bY)

  // Compute condition number for diagnostics
  // (approximation using ratio of max/min singular values would be better,
  // but for now use norm-based approximation)
  const AtA = matA.transpose().mmul(matA)
  const conditionNumber = AtA.norm('frobenius')

  // Solve using least squares: coeffs = (A^T * A)^-1 * A^T * b
  // ml-matrix's solve() handles this
  const coeffsX = solve(matA, vecBx).to1DArray()
  const coeffsY = solve(matA, vecBy).to1DArray()

  // Compute errors on training data
  const errors: PolynomialFitResult['errors'] = []
  let sumSquaredError = 0
  let maxError = 0

  for (let i = 0; i < n; i++) {
    const point = points[i]
    const terms = generatePolyTerms(point.imageX, point.imageY, degree)

    // Predict
    let predX = 0
    let predY = 0
    for (let j = 0; j < terms.length; j++) {
      predX += coeffsX[j] * terms[j]
      predY += coeffsY[j] * terms[j]
    }

    // Error
    const dx = predX - point.worldX
    const dy = predY - point.worldY
    const error = Math.sqrt(dx * dx + dy * dy)

    sumSquaredError += error * error
    maxError = Math.max(maxError, error)

    errors.push({
      annotationId: point.annotationId,
      error,
      predicted: { x: predX, y: predY },
      actual: { x: point.worldX, y: point.worldY },
    })
  }

  const rmse = Math.sqrt(sumSquaredError / n)

  return {
    polynomial: {
      degree,
      coeffsX,
      coeffsY,
    },
    pointCount: n,
    rmse,
    maxError,
    errors: errors.sort((a, b) => b.error - a.error), // Sort by error descending
    conditionNumber,
  }
}

// ============================================================================
// Polynomial Evaluation
// ============================================================================

/**
 * Evaluate a fitted polynomial at given image coordinates
 */
export function evaluatePolynomial(
  polynomial: { degree: number; coeffsX: number[]; coeffsY: number[] },
  imageX: number,
  imageY: number
): { x: number; y: number } {
  const terms = generatePolyTerms(imageX, imageY, polynomial.degree)

  let predX = 0
  let predY = 0
  for (let j = 0; j < terms.length; j++) {
    predX += polynomial.coeffsX[j] * terms[j]
    predY += polynomial.coeffsY[j] * terms[j]
  }

  return { x: predX, y: predY }
}

// ============================================================================
// Cross-Validation
// ============================================================================

/**
 * K-fold cross-validation result
 */
export interface CrossValidationResult {
  /** Average RMSE across folds */
  avgRmse: number
  /** Standard deviation of RMSE */
  stdRmse: number
  /** Per-fold results */
  folds: { trainRmse: number; testRmse: number }[]
  /** Recommended degree based on test error */
  recommendedDegree: number
}

/**
 * Perform k-fold cross-validation to select optimal polynomial degree
 */
export function crossValidate(
  points: CorrespondencePoint[],
  degrees: (3 | 4 | 5)[] = [3, 4, 5],
  k: number = 5
): Map<number, CrossValidationResult> {
  const results = new Map<number, CrossValidationResult>()

  // Shuffle points
  const shuffled = [...points].sort(() => Math.random() - 0.5)
  const foldSize = Math.floor(shuffled.length / k)

  for (const degree of degrees) {
    const numTerms = getTermCount(degree)
    if (shuffled.length < numTerms * 2) {
      // Skip if not enough data for this degree
      continue
    }

    const folds: { trainRmse: number; testRmse: number }[] = []

    for (let i = 0; i < k; i++) {
      // Split into train/test
      const testStart = i * foldSize
      const testEnd = i === k - 1 ? shuffled.length : (i + 1) * foldSize
      const testSet = shuffled.slice(testStart, testEnd)
      const trainSet = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]

      if (trainSet.length < numTerms) continue

      try {
        // Fit on train
        const fit = fitPolynomial(trainSet, degree)

        // Evaluate on test
        let testSse = 0
        for (const point of testSet) {
          const terms = generatePolyTerms(point.imageX, point.imageY, degree)
          let predX = 0
          let predY = 0
          for (let j = 0; j < terms.length; j++) {
            predX += fit.polynomial.coeffsX[j] * terms[j]
            predY += fit.polynomial.coeffsY[j] * terms[j]
          }
          const dx = predX - point.worldX
          const dy = predY - point.worldY
          testSse += dx * dx + dy * dy
        }
        const testRmse = Math.sqrt(testSse / testSet.length)

        folds.push({ trainRmse: fit.rmse, testRmse })
      } catch {
        // Skip fold if fitting fails
      }
    }

    if (folds.length === 0) continue

    const avgRmse = folds.reduce((s, f) => s + f.testRmse, 0) / folds.length
    const variance =
      folds.reduce((s, f) => s + (f.testRmse - avgRmse) ** 2, 0) / folds.length
    const stdRmse = Math.sqrt(variance)

    results.set(degree, {
      avgRmse,
      stdRmse,
      folds,
      recommendedDegree: degree,
    })
  }

  // Find best degree (lowest avgRmse)
  let bestDegree = 3
  let bestRmse = Infinity
  for (const [degree, result] of results) {
    if (result.avgRmse < bestRmse) {
      bestRmse = result.avgRmse
      bestDegree = degree
    }
  }

  // Update recommended degree in all results
  for (const result of results.values()) {
    result.recommendedDegree = bestDegree
  }

  return results
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format fit result for console output
 */
export function formatFitResult(result: PolynomialFitResult, cameraId: string): string {
  const lines: string[] = []

  lines.push(`=== Polynomial Fit: ${cameraId} ===`)
  lines.push(`Degree: ${result.polynomial.degree}`)
  lines.push(`Points: ${result.pointCount}`)
  lines.push(`RMSE: ${result.rmse.toFixed(3)}m`)
  lines.push(`Max Error: ${result.maxError.toFixed(3)}m`)
  lines.push(`Condition Number: ${result.conditionNumber.toFixed(1)}`)

  lines.push('')
  lines.push('Largest errors:')
  for (const e of result.errors.slice(0, 5)) {
    lines.push(
      `  ${e.error.toFixed(2)}m: ` +
        `predicted (${e.predicted.x.toFixed(1)}, ${e.predicted.y.toFixed(1)}) ` +
        `vs actual (${e.actual.x.toFixed(1)}, ${e.actual.y.toFixed(1)})`
    )
  }

  return lines.join('\n')
}

/**
 * Format cross-validation results
 */
export function formatCrossValidation(results: Map<number, CrossValidationResult>): string {
  const lines: string[] = []

  lines.push('=== Cross-Validation Results ===')
  lines.push('Degree | Avg RMSE | Std RMSE | Recommended')
  lines.push('-------|----------|----------|------------')

  for (const [degree, result] of results) {
    const rec = result.recommendedDegree === degree ? '  ***' : ''
    lines.push(
      `   ${degree}   | ${result.avgRmse.toFixed(3)}m   | ${result.stdRmse.toFixed(3)}m   |${rec}`
    )
  }

  return lines.join('\n')
}
