#!/usr/bin/env node
/**
 * Optimize Polynomial Degree
 *
 * Uses cross-validation to select optimal polynomial degree that balances
 * accuracy and generalization. Outputs coefficients for the best degree.
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
  rawX: number
  rawY: number
  gtX: number
  gtY: number
}

// Polynomial features
function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]
  if (degree >= 1) features.push(x, y)
  if (degree >= 2) features.push(x * x, y * y, x * y)
  if (degree >= 3) features.push(x ** 3, y ** 3, x ** 2 * y, x * y ** 2)
  if (degree >= 4) features.push(x ** 4, y ** 4, x ** 3 * y, x * y ** 3, x ** 2 * y ** 2)
  if (degree >= 5) features.push(x ** 5, y ** 5, x ** 4 * y, x * y ** 4, x ** 3 * y ** 2, x ** 2 * y ** 3)
  return features
}

function huberWeight(r: number, delta: number = 0.5): number {
  return Math.abs(r) <= delta ? 1.0 : delta / Math.abs(r)
}

function solveWeighted(A: number[][], b: number[], w: number[]): number[] {
  const m = A.length, n = A[0].length
  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  const AtWb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) AtWA[i][j] += A[k][i] * w[k] * A[k][j]
      if (i === j) AtWA[i][j] += 1e-6
    }
    for (let k = 0; k < m; k++) AtWb[i] += A[k][i] * w[k] * b[k]
  }

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

function fitIRLS(correspondences: Correspondence[], degree: number, maxIter: number = 10) {
  const n = correspondences.length
  const A = correspondences.map(({ rawX, rawY }) => polyFeatures(rawX, rawY, degree))
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

function evaluate(correspondences: Correspondence[], coeffsX: number[], coeffsY: number[], degree: number) {
  const errors: number[] = []
  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    const features = polyFeatures(rawX, rawY, degree)
    let projX = 0, projY = 0
    for (let i = 0; i < features.length; i++) {
      projX += coeffsX[i] * features[i]
      projY += coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((projX - gtX) ** 2 + (projY - gtY) ** 2))
  }
  return {
    mean: errors.reduce((a, b) => a + b, 0) / errors.length,
    passRate: errors.filter(e => e < 0.5).length / errors.length,
    errors,
  }
}

function crossValidate(correspondences: Correspondence[], degree: number, folds: number = 5, seed: number = 42) {
  const n = correspondences.length
  // Deterministic shuffle using seed
  const indices = Array.from({ length: n }, (_, i) => i)
  const rng = (s: number) => () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const random = rng(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const shuffled = indices.map(i => correspondences[i])
  const foldSize = Math.floor(n / folds)

  const allTestErrors: number[] = []

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize

    const train = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]
    const test = shuffled.slice(testStart, testEnd)

    const { coeffsX, coeffsY } = fitIRLS(train, degree)

    for (const { rawX, rawY, gtX, gtY } of test) {
      const features = polyFeatures(rawX, rawY, degree)
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
    passRate: allTestErrors.filter(e => e < 0.5).length / allTestErrors.length,
  }
}

async function main() {
  const program = new Command()
    .name('optimize-polynomial-degree')
    .description('Find optimal polynomial degree using cross-validation')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output calibration JSON file')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Polynomial Degree Optimization ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  const results: Record<string, {
    bestDegree: number
    coeffsX: number[]
    coeffsY: number[]
    trainPassRate: number
    cvPassRate: number
  }> = {}

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---\n`)

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
          gtX: annotation.groundPosition.x,
          gtY: annotation.groundPosition.y,
        })
      }
    }

    console.log(`Correspondences: ${correspondences.length}`)
    console.log('\nDegree | Params | Train Pass% | CV Pass% | Gap   | Selection')
    console.log('-------|--------|-------------|----------|-------|----------')

    let bestDegree = 1
    let bestCvPassRate = 0
    let bestWithLowGap = { degree: 1, cvPassRate: 0 }

    for (let d = 1; d <= 5; d++) {
      const { coeffsX, coeffsY } = fitIRLS(correspondences, d)
      const trainStats = evaluate(correspondences, coeffsX, coeffsY, d)
      const cvStats = crossValidate(correspondences, d)

      const gap = trainStats.passRate - cvStats.passRate
      const numParams = coeffsX.length * 2

      // Select based on CV pass rate with preference for lower degree when gap is small
      let selection = ''
      if (cvStats.passRate > bestCvPassRate) {
        bestCvPassRate = cvStats.passRate
        bestDegree = d
      }
      // Also track best with low overfitting gap
      if (gap < 0.10 && cvStats.passRate > bestWithLowGap.cvPassRate) {
        bestWithLowGap = { degree: d, cvPassRate: cvStats.passRate }
        selection = '← best (low gap)'
      } else if (d === bestDegree) {
        selection = '← best CV'
      }

      console.log(
        `   ${d}   |   ${numParams.toString().padStart(2)}   |    ${(trainStats.passRate * 100).toFixed(1)}%   |   ${(cvStats.passRate * 100).toFixed(1)}%  | ${(gap * 100).toFixed(1).padStart(4)}% |  ${selection}`
      )
    }

    // Use the degree with best CV and low gap
    const selectedDegree = bestWithLowGap.cvPassRate > 0.5 ? bestWithLowGap.degree : bestDegree
    console.log(`\n✓ Selected degree: ${selectedDegree} (CV: ${(crossValidate(correspondences, selectedDegree).passRate * 100).toFixed(1)}%)`)

    // Fit final model on all data
    const { coeffsX, coeffsY } = fitIRLS(correspondences, selectedDegree)
    const trainStats = evaluate(correspondences, coeffsX, coeffsY, selectedDegree)
    const cvStats = crossValidate(correspondences, selectedDegree)

    results[cameraId] = {
      bestDegree: selectedDegree,
      coeffsX,
      coeffsY,
      trainPassRate: trainStats.passRate,
      cvPassRate: cvStats.passRate,
    }

    // Output coefficients in format for camera-registry.ts
    console.log(`\n// ${cameraId} polynomial (degree ${selectedDegree}, ${(cvStats.passRate * 100).toFixed(1)}% CV pass rate)`)
    console.log(`polynomial: {`)
    console.log(`  degree: ${selectedDegree} as const,`)
    console.log(`  coeffsX: [${coeffsX.map(c => c.toFixed(8)).join(', ')}],`)
    console.log(`  coeffsY: [${coeffsY.map(c => c.toFixed(8)).join(', ')}],`)
    console.log(`},`)
    console.log()
  }

  // Output summary
  console.log('=== Summary ===')
  for (const [camId, res] of Object.entries(results)) {
    console.log(`${camId}: Degree ${res.bestDegree}, Train: ${(res.trainPassRate * 100).toFixed(1)}%, CV: ${(res.cvPassRate * 100).toFixed(1)}%`)
  }

  // Save to file if requested
  if (opts.output) {
    const fs = await import('fs/promises')
    await fs.writeFile(opts.output, JSON.stringify(results, null, 2))
    console.log(`\nSaved results to ${opts.output}`)
  }
}

main().catch(console.error)
