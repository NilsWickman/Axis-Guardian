#!/usr/bin/env node
/**
 * Affine Plus Low-Degree Polynomial
 *
 * Tests whether applying affine transform first (to fix the coordinate rotation)
 * followed by a low-degree polynomial (to fix residual non-linearity) can
 * achieve good accuracy without overfitting.
 *
 * Hypothesis: If the 90° rotation is handled by affine, a degree 2-3 polynomial
 * might be sufficient for the residual correction.
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
} from './utils.js'

interface Correspondence {
  rawX: number   // K/R/T output
  rawY: number
  gtX: number    // Sitemap ground truth
  gtY: number
}

// Same affine fitting from compute-coordinate-transform.ts
function fitAffine(correspondences: Correspondence[]): {
  A: number[][]
  error: number
} {
  const n = correspondences.length
  const M: number[][] = []
  const bX: number[] = []
  const bY: number[] = []

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    M.push([rawX, rawY, 1])
    bX.push(gtX)
    bY.push(gtY)
  }

  const MtM: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const MtbX: number[] = [0, 0, 0]
  const MtbY: number[] = [0, 0, 0]

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        MtM[j][k] += M[i][j] * M[i][k]
      }
      MtbX[j] += M[i][j] * bX[i]
      MtbY[j] += M[i][j] * bY[i]
    }
  }

  const L: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = MtM[i][j]
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  function solveCholesky(L: number[][], b: number[]): number[] {
    const y = [0, 0, 0]
    for (let i = 0; i < 3; i++) {
      let sum = b[i]
      for (let j = 0; j < i; j++) sum -= L[i][j] * y[j]
      y[i] = sum / L[i][i]
    }
    const x = [0, 0, 0]
    for (let i = 2; i >= 0; i--) {
      let sum = y[i]
      for (let j = i + 1; j < 3; j++) sum -= L[j][i] * x[j]
      x[i] = sum / L[i][i]
    }
    return x
  }

  const aX = solveCholesky(L, MtbX)
  const aY = solveCholesky(L, MtbY)
  const A = [aX, aY]

  let totalError = 0
  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    const predX = A[0][0] * rawX + A[0][1] * rawY + A[0][2]
    const predY = A[1][0] * rawX + A[1][1] * rawY + A[1][2]
    totalError += Math.sqrt((predX - gtX) ** 2 + (predY - gtY) ** 2)
  }

  return { A, error: totalError / n }
}

// Apply affine transform
function applyAffine(A: number[][], x: number, y: number): { x: number; y: number } {
  return {
    x: A[0][0] * x + A[0][1] * y + A[0][2],
    y: A[1][0] * x + A[1][1] * y + A[1][2],
  }
}

// Polynomial features for residual correction
function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]
  if (degree >= 1) features.push(x, y)
  if (degree >= 2) features.push(x * x, y * y, x * y)
  if (degree >= 3) features.push(x ** 3, y ** 3, x ** 2 * y, x * y ** 2)
  if (degree >= 4) features.push(x ** 4, y ** 4, x ** 3 * y, x * y ** 3, x ** 2 * y ** 2)
  return features
}

// Huber weight for IRLS
function huberWeight(r: number, delta: number = 0.5): number {
  return Math.abs(r) <= delta ? 1.0 : delta / Math.abs(r)
}

// Weighted least squares solver
function solveWeighted(A: number[][], b: number[], w: number[]): number[] {
  const m = A.length, n = A[0].length
  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  const AtWb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) AtWA[i][j] += A[k][i] * w[k] * A[k][j]
      if (i === j) AtWA[i][j] += 1e-6 // Regularization
    }
    for (let k = 0; k < m; k++) AtWb[i] += A[k][i] * w[k] * b[k]
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

// Fit polynomial with IRLS
function fitPolyIRLS(
  correspondences: Array<{ affineX: number; affineY: number; gtX: number; gtY: number }>,
  degree: number,
  maxIter: number = 10
) {
  const n = correspondences.length
  const A = correspondences.map(({ affineX, affineY }) => polyFeatures(affineX, affineY, degree))
  const bX = correspondences.map(c => c.gtX)
  const bY = correspondences.map(c => c.gtY)

  let wX = Array(n).fill(1), wY = Array(n).fill(1)
  let coeffsX = solveWeighted(A, bX, wX)
  let coeffsY = solveWeighted(A, bY, wY)

  for (let iter = 0; iter < maxIter; iter++) {
    const residualsX: number[] = [], residualsY: number[] = []
    for (let i = 0; i < n; i++) {
      let predX = 0, predY = 0
      for (let j = 0; j < A[i].length; j++) {
        predX += coeffsX[j] * A[i][j]
        predY += coeffsY[j] * A[i][j]
      }
      residualsX.push(predX - bX[i])
      residualsY.push(predY - bY[i])
    }
    wX = residualsX.map(r => huberWeight(r))
    wY = residualsY.map(r => huberWeight(r))
    coeffsX = solveWeighted(A, bX, wX)
    coeffsY = solveWeighted(A, bY, wY)
  }

  return { coeffsX, coeffsY }
}

// Cross-validation
function crossValidate(
  correspondences: Array<{ affineX: number; affineY: number; gtX: number; gtY: number }>,
  degree: number,
  folds: number = 5
) {
  const n = correspondences.length
  const shuffled = [...correspondences].sort(() => Math.random() - 0.5)
  const foldSize = Math.floor(n / folds)

  const allTestErrors: number[] = []

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize

    const train = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]
    const test = shuffled.slice(testStart, testEnd)

    const { coeffsX, coeffsY } = fitPolyIRLS(train, degree)

    for (const { affineX, affineY, gtX, gtY } of test) {
      const features = polyFeatures(affineX, affineY, degree)
      let projX = 0, projY = 0
      for (let i = 0; i < features.length; i++) {
        projX += coeffsX[i] * features[i]
        projY += coeffsY[i] * features[i]
      }
      allTestErrors.push(Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2))
    }
  }

  return {
    mean: allTestErrors.reduce((a, b) => a + b, 0) / allTestErrors.length,
    passRate: allTestErrors.filter(e => e < 0.5).length / allTestErrors.length
  }
}

async function main() {
  const program = new Command()
    .name('affine-plus-polynomial')
    .description('Test affine + low-degree polynomial vs pure polynomial')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Affine + Polynomial Analysis ===\n')
  console.log('Comparing: Affine first (handles rotation) + low-degree polynomial')
  console.log('vs: Direct polynomial from raw K/R/T coords\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---\n`)

    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    // Get raw K/R/T projections
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
          gtX: annotation.groundPosition.x,
          gtY: annotation.groundPosition.y,
        })
      }
    }

    console.log(`Correspondences: ${correspondences.length}`)

    // Fit affine transform
    const { A, error: affineError } = fitAffine(correspondences)
    console.log(`\nAffine-only mean error: ${affineError.toFixed(3)}m`)

    // Transform to affine space
    const affineCorrespondences = correspondences.map(c => {
      const affine = applyAffine(A, c.rawX, c.rawY)
      return {
        affineX: affine.x,
        affineY: affine.y,
        gtX: c.gtX,
        gtY: c.gtY,
      }
    })

    console.log('\n--- Affine + Polynomial (on affine-transformed coords) ---')
    console.log('Degree | Params | Train Pass% | CV Pass% | Gap  | Recommended?')
    console.log('-------|--------|-------------|----------|------|-------------')

    for (let d = 0; d <= 4; d++) {
      const { coeffsX, coeffsY } = fitPolyIRLS(affineCorrespondences, d)

      // Train error
      let passCount = 0
      for (const { affineX, affineY, gtX, gtY } of affineCorrespondences) {
        const features = polyFeatures(affineX, affineY, d)
        let projX = 0, projY = 0
        for (let i = 0; i < features.length; i++) {
          projX += coeffsX[i] * features[i]
          projY += coeffsY[i] * features[i]
        }
        const err = Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2)
        if (err < 0.5) passCount++
      }
      const trainPass = passCount / affineCorrespondences.length

      // CV error
      const cvStats = crossValidate(affineCorrespondences, d)

      const gap = trainPass - cvStats.passRate
      const numParams = coeffsX.length * 2
      const recommended = gap < 0.1 && cvStats.passRate > 0.6 ? '✓' : ''

      console.log(
        `   ${d}   |   ${numParams.toString().padStart(2)}   |    ${(trainPass * 100).toFixed(1)}%   |   ${(cvStats.passRate * 100).toFixed(1)}%  | ${(gap * 100).toFixed(1).padStart(4)}% |     ${recommended}`
      )
    }

    // Compare with direct polynomial from raw coords
    console.log('\n--- Direct Polynomial (on raw K/R/T coords) ---')
    console.log('Degree | Params | Train Pass% | CV Pass% | Gap  | Recommended?')
    console.log('-------|--------|-------------|----------|------|-------------')

    const rawCorrespondences = correspondences.map(c => ({
      affineX: c.rawX,
      affineY: c.rawY,
      gtX: c.gtX,
      gtY: c.gtY,
    }))

    for (let d = 1; d <= 5; d++) {
      const { coeffsX, coeffsY } = fitPolyIRLS(rawCorrespondences, d)

      // Train error
      let passCount = 0
      for (const { affineX: x, affineY: y, gtX, gtY } of rawCorrespondences) {
        const features = polyFeatures(x, y, d)
        let projX = 0, projY = 0
        for (let i = 0; i < features.length; i++) {
          projX += coeffsX[i] * features[i]
          projY += coeffsY[i] * features[i]
        }
        const err = Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2)
        if (err < 0.5) passCount++
      }
      const trainPass = passCount / rawCorrespondences.length

      // CV error
      const cvStats = crossValidate(rawCorrespondences, d)

      const gap = trainPass - cvStats.passRate
      const numParams = coeffsX.length * 2
      const recommended = gap < 0.1 && cvStats.passRate > 0.6 ? '✓' : ''

      console.log(
        `   ${d}   |   ${numParams.toString().padStart(2)}   |    ${(trainPass * 100).toFixed(1)}%   |   ${(cvStats.passRate * 100).toFixed(1)}%  | ${(gap * 100).toFixed(1).padStart(4)}% |     ${recommended}`
      )
    }

    console.log()
  }

  console.log('=== Summary ===')
  console.log('Compare the CV Pass% between approaches.')
  console.log('The affine+polynomial approach should have better CV performance')
  console.log('at lower degrees because the affine handles the coordinate rotation.')
}

main().catch(console.error)
