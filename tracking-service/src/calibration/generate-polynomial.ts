#!/usr/bin/env node
/**
 * Generate Polynomial Coefficients
 *
 * Generates polynomial coefficients for a specific degree and outputs
 * in format ready to paste into camera-registry.ts
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
  }
}

async function main() {
  const program = new Command()
    .name('generate-polynomial')
    .description('Generate polynomial coefficients for a specific camera and degree')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .requiredOption('-c, --camera <id>', 'Camera ID')
    .requiredOption('-d, --degree <n>', 'Polynomial degree')
    .parse(process.argv)

  const opts = program.opts()
  const degree = parseInt(opts.degree, 10)

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()
  const cal = registry.getCalibration(opts.camera)!

  const annotations = filterAnnotations(groundTruths.annotations, opts.camera, ['certain'])

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

  console.log(`Camera: ${opts.camera}, Degree: ${degree}, Samples: ${correspondences.length}`)

  const { coeffsX, coeffsY } = fitIRLS(correspondences, degree)
  const stats = evaluate(correspondences, coeffsX, coeffsY, degree)

  console.log(`Train pass rate: ${(stats.passRate * 100).toFixed(1)}%`)
  console.log(`Mean error: ${stats.mean.toFixed(3)}m`)
  console.log()
  console.log(`// ${opts.camera} polynomial (degree ${degree}, ${(stats.passRate * 100).toFixed(1)}% train pass rate)`)
  console.log(`polynomial: {`)
  console.log(`  degree: ${degree} as const,`)
  console.log(`  coeffsX: [${coeffsX.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`  coeffsY: [${coeffsY.map(c => c.toFixed(8)).join(', ')}],`)
  console.log(`},`)
}

main().catch(console.error)
