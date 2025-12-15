#!/usr/bin/env node
/**
 * Unified Recalibration Pipeline
 *
 * Regenerates the polynomial world transform coefficients from ground truth data.
 * This is the tool to run when you need to recalibrate the projection system.
 *
 * The pipeline:
 * 1. Loads ground truth annotations
 * 2. Projects each annotation through K/R/T to get raw coordinates
 * 3. Fits a degree-5 polynomial using IRLS with Huber loss
 * 4. Outputs coefficients in format ready for camera-registry.ts
 *
 * Usage:
 *   pnpm cli:recalibrate --ground-truth ../GroundTruths.json --output calibration-new.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'

interface CalibrationResult {
  cameraId: string
  degree: number
  coeffsX: number[]
  coeffsY: number[]
  stats: {
    samples: number
    meanError: number
    medianError: number
    passRate: number
    p90Error: number
  }
}

interface PipelineResult {
  timestamp: string
  groundTruthFile: string
  cameras: CalibrationResult[]
}

interface Correspondence {
  rawX: number
  rawY: number
  gtX: number
  gtY: number
}

/**
 * Generate polynomial feature vector
 */
function polyFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1]
  if (degree >= 1) features.push(x, y)
  if (degree >= 2) features.push(x * x, y * y, x * y)
  if (degree >= 3) features.push(x * x * x, y * y * y, x * x * y, x * y * y)
  if (degree >= 4) features.push(x ** 4, y ** 4, x ** 3 * y, x * y ** 3, x ** 2 * y ** 2)
  if (degree >= 5) features.push(x ** 5, y ** 5, x ** 4 * y, x * y ** 4, x ** 3 * y ** 2, x ** 2 * y ** 3)
  return features
}

/**
 * Huber weight for robust regression
 */
function huberWeight(r: number, delta: number = 0.5): number {
  return Math.abs(r) <= delta ? 1.0 : delta / Math.abs(r)
}

/**
 * Solve weighted linear system via Cholesky
 */
function solveWeighted(A: number[][], b: number[], w: number[]): number[] {
  const m = A.length
  const n = A[0].length

  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  const AtWb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtWA[i][j] += A[k][i] * w[k] * A[k][j]
      }
      if (i === j) AtWA[i][j] += 1e-6 // Regularization
    }
    for (let k = 0; k < m; k++) {
      AtWb[i] += A[k][i] * w[k] * b[k]
    }
  }

  // Cholesky decomposition
  const L: number[][] = AtWA.map((row) => row.map(() => 0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = AtWA[i][j]
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  // Forward/back substitution
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

/**
 * Fit polynomial using IRLS with Huber loss
 */
function fitPolynomialIRLS(
  correspondences: Correspondence[],
  degree: number,
  maxIter: number = 10
): { coeffsX: number[]; coeffsY: number[] } {
  const n = correspondences.length
  const A: number[][] = correspondences.map(({ rawX, rawY }) => polyFeatures(rawX, rawY, degree))
  const bX = correspondences.map(({ gtX }) => gtX)
  const bY = correspondences.map(({ gtY }) => gtY)

  let wX = Array(n).fill(1)
  let wY = Array(n).fill(1)
  let coeffsX = solveWeighted(A, bX, wX)
  let coeffsY = solveWeighted(A, bY, wY)

  for (let iter = 0; iter < maxIter; iter++) {
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

    wX = residualsX.map((r) => huberWeight(r))
    wY = residualsY.map((r) => huberWeight(r))

    coeffsX = solveWeighted(A, bX, wX)
    coeffsY = solveWeighted(A, bY, wY)
  }

  return { coeffsX, coeffsY }
}

/**
 * Evaluate polynomial projection
 */
function evaluate(
  correspondences: Correspondence[],
  coeffsX: number[],
  coeffsY: number[],
  degree: number
): { errors: number[]; passRate: number; meanError: number; medianError: number; p90Error: number } {
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

  const sorted = [...errors].sort((a, b) => a - b)
  return {
    errors,
    passRate: errors.filter((e) => e < 0.5).length / errors.length,
    meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
    medianError: sorted[Math.floor(sorted.length / 2)],
    p90Error: sorted[Math.floor(sorted.length * 0.9)],
  }
}

/**
 * Calibrate a single camera
 */
function calibrateCamera(
  cameraId: string,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  registry: CameraRegistry,
  degree: number = 5
): CalibrationResult {
  const cal = registry.getCalibration(cameraId)!
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

  const { coeffsX, coeffsY } = fitPolynomialIRLS(correspondences, degree)
  const stats = evaluate(correspondences, coeffsX, coeffsY, degree)

  return {
    cameraId,
    degree,
    coeffsX,
    coeffsY,
    stats: {
      samples: correspondences.length,
      meanError: stats.meanError,
      medianError: stats.medianError,
      passRate: stats.passRate,
      p90Error: stats.p90Error,
    },
  }
}

function formatCoeffs(coeffs: number[]): string {
  return '[' + coeffs.map((c) => c.toFixed(8)).join(', ') + ']'
}

async function main() {
  const program = new Command()
    .name('recalibrate')
    .description('Regenerate polynomial world transform coefficients')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file')
    .option('-d, --degree <n>', 'Polynomial degree (1-5)', '5')
    .option('--code', 'Print code snippet for camera-registry.ts')
    .parse(process.argv)

  const opts = program.opts()
  const degree = parseInt(opts.degree)

  console.log('=== Recalibration Pipeline ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)
  console.log(`Room: ${groundTruths.room.width}m x ${groundTruths.room.height}m\n`)

  const registry = new CameraRegistry()
  const results: CalibrationResult[] = []

  for (const camId of ['camera1', 'camera2']) {
    console.log(`--- ${camId} ---`)
    const annotations = filterAnnotations(groundTruths.annotations, camId, ['certain'])
    console.log(`  Annotations: ${annotations.length}`)

    const result = calibrateCamera(camId, annotations, registry, degree)
    results.push(result)

    console.log(`  Pass rate: ${(result.stats.passRate * 100).toFixed(1)}%`)
    console.log(`  Mean error: ${result.stats.meanError.toFixed(3)}m`)
    console.log(`  Median error: ${result.stats.medianError.toFixed(3)}m`)
    console.log(`  90th percentile: ${result.stats.p90Error.toFixed(3)}m`)
    console.log()
  }

  // Print code snippet
  if (opts.code) {
    console.log('=== Code for camera-registry.ts ===\n')
    for (const result of results) {
      const varName = result.cameraId.toUpperCase().replace('-', '_') + '_WORLD_TRANSFORM'
      console.log(`const ${varName} = {`)
      console.log(`  // Polynomial transform (Degree ${result.degree}, IRLS Huber, ${(result.stats.passRate * 100).toFixed(1)}% accuracy, ${result.stats.meanError.toFixed(3)}m avg error)`)
      console.log(`  polynomial: {`)
      console.log(`    degree: ${result.degree} as const,`)
      console.log(`    coeffsX: ${formatCoeffs(result.coeffsX)},`)
      console.log(`    coeffsY: ${formatCoeffs(result.coeffsY)},`)
      console.log(`  },`)
      console.log(`}`)
      console.log()
    }
  }

  // Save output
  if (opts.output) {
    const output: PipelineResult = {
      timestamp: new Date().toISOString(),
      groundTruthFile: opts.groundTruth,
      cameras: results,
    }
    writeFileSync(opts.output, JSON.stringify(output, null, 2))
    console.log(`Saved to ${opts.output}`)
  }

  // Summary
  console.log('=== Summary ===')
  const avgPassRate = results.reduce((a, r) => a + r.stats.passRate, 0) / results.length
  const avgError = results.reduce((a, r) => a + r.stats.meanError, 0) / results.length
  console.log(`Average pass rate: ${(avgPassRate * 100).toFixed(1)}%`)
  console.log(`Average mean error: ${avgError.toFixed(3)}m`)
}

main().catch(console.error)
