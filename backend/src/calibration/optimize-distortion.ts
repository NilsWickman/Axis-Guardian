#!/usr/bin/env node
/**
 * Distortion Calibration Optimizer
 *
 * Optimizes Brown-Conrady lens distortion coefficients:
 * - k1, k2, k3: Radial distortion
 * - p1, p2: Tangential distortion
 *
 * Uses grid search followed by fine optimization with cross-validation.
 *
 * Usage:
 *   pnpm cli:optimize-distortion --camera camera1 --ground-truth ../GroundTruths.json --output result.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import type { DistortionCoeffs } from '../types.js'
import {
  projectWorldToImageWithDistortion,
  loadGroundTruths,
  filterAnnotations,
  computeErrorStats,
  formatErrorStats,
  type Vector3,
  type GroundTruthAnnotation,
  type Point3D,
} from './utils.js'
import { boundedNelderMead } from './nelder-mead.js'

// ============================================================================
// Types
// ============================================================================

interface DistortionOptimizationResult {
  timestamp: string
  cameraId: string
  groundTruthFile: string
  annotationsUsed: number

  initial: DistortionCoeffs
  initialError: number

  optimized: DistortionCoeffs
  optimizedError: number

  improvement: {
    errorReduction: number
    percentImprovement: number
  }

  validation: {
    passRate: number
    meanError: number
    medianError: number
    maxError: number
  }

  crossValidation?: {
    trainError: number
    testError: number
    overfitRatio: number
  }

  gridSearch: {
    combinationsSearched: number
    bestGridResult: DistortionCoeffs
    bestGridError: number
  }

  optimization: {
    iterations: number
    evaluations: number
    converged: boolean
    reason: string
  }
}

// ============================================================================
// Cost Function
// ============================================================================

/**
 * Create cost function for distortion optimization
 */
function createDistortionCostFunction(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  R: number[][],
  T: Vector3,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): (params: number[]) => number {
  return (params: number[]): number => {
    // Unpack distortion parameters: [k1, k2, k3, p1, p2]
    const distortion: DistortionCoeffs = {
      k1: params[0],
      k2: params[1],
      k3: params[2],
      p1: params[3],
      p2: params[4],
    }

    let totalError = 0
    let validCount = 0

    for (const { annotation, detection } of annotations) {
      const worldPoint: Point3D = {
        x: annotation.groundPosition.x,
        y: annotation.groundPosition.y,
        z: 0,
      }

      const projection = projectWorldToImageWithDistortion(worldPoint, K, R, T, distortion)

      if (!projection.isValid) {
        totalError += 1e6
        continue
      }

      // Target bbox bottom-center
      const targetU = ((detection.bbox.left + detection.bbox.right) / 2) * imageWidth
      const targetV = detection.bbox.bottom * imageHeight

      const error = (projection.u - targetU) ** 2 + (projection.v - targetV) ** 2
      totalError += error
      validCount++
    }

    return validCount > 0 ? totalError / validCount : 1e9
  }
}

/**
 * Evaluate distortion calibration
 */
function evaluateDistortion(
  distortion: DistortionCoeffs,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  R: number[][],
  T: Vector3,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): { errors: number[]; stats: ReturnType<typeof computeErrorStats> } {
  const errors: number[] = []
  const focalLength = K[0][0]

  for (const { annotation, detection } of annotations) {
    const worldPoint: Point3D = {
      x: annotation.groundPosition.x,
      y: annotation.groundPosition.y,
      z: 0,
    }

    const projection = projectWorldToImageWithDistortion(worldPoint, K, R, T, distortion)

    if (!projection.isValid) continue

    const targetU = ((detection.bbox.left + detection.bbox.right) / 2) * imageWidth
    const targetV = detection.bbox.bottom * imageHeight

    const pixelError = Math.sqrt((projection.u - targetU) ** 2 + (projection.v - targetV) ** 2)
    const worldError = (pixelError * projection.depth) / focalLength
    errors.push(worldError)
  }

  return { errors, stats: computeErrorStats(errors) }
}

// ============================================================================
// Grid Search
// ============================================================================

interface GridSearchResult {
  bestParams: DistortionCoeffs
  bestError: number
  combinationsSearched: number
}

/**
 * Run coarse grid search for distortion parameters
 */
function gridSearchDistortion(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  R: number[][],
  T: Vector3,
  verbose: boolean = false
): GridSearchResult {
  const costFn = createDistortionCostFunction(annotations, K, R, T)

  // Grid search ranges (based on typical camera distortions)
  const k1Values = [-0.3, -0.2, -0.1, -0.05, 0, 0.05, 0.1]
  const k2Values = [-0.1, -0.05, 0, 0.05, 0.1]
  // k3, p1, p2 are typically small - start with 0

  let bestError = Infinity
  let bestParams: DistortionCoeffs = { k1: 0, k2: 0, k3: 0, p1: 0, p2: 0 }
  let combinationsSearched = 0

  for (const k1 of k1Values) {
    for (const k2 of k2Values) {
      const params = [k1, k2, 0, 0, 0]
      const error = costFn(params)
      combinationsSearched++

      if (error < bestError) {
        bestError = error
        bestParams = { k1, k2, k3: 0, p1: 0, p2: 0 }

        if (verbose) {
          console.log(`  Found better: k1=${k1}, k2=${k2}, error=${error.toFixed(2)}`)
        }
      }
    }
  }

  return { bestParams, bestError, combinationsSearched }
}

/**
 * Cross-validation for overfitting detection
 */
function crossValidateDistortion(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  R: number[][],
  T: Vector3,
  initialDistortion: DistortionCoeffs,
  folds: number = 5
): { trainError: number; testError: number; overfitRatio: number } {
  const n = annotations.length
  const foldSize = Math.floor(n / folds)
  const trainErrors: number[] = []
  const testErrors: number[] = []

  const shuffled = [...annotations].sort(() => Math.random() - 0.5)

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize
    const testSet = shuffled.slice(testStart, testEnd)
    const trainSet = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]

    const costFn = createDistortionCostFunction(trainSet, K, R, T)
    const bounds: [number, number][] = [
      [-0.5, 0.5], // k1
      [-0.3, 0.3], // k2
      [-0.1, 0.1], // k3
      [-0.05, 0.05], // p1
      [-0.05, 0.05], // p2
    ]

    const result = boundedNelderMead(
      costFn,
      [initialDistortion.k1, initialDistortion.k2, initialDistortion.k3, initialDistortion.p1, initialDistortion.p2],
      bounds,
      { maxIterations: 200, tolerance: 1e-6 }
    )

    const trainEval = createDistortionCostFunction(trainSet, K, R, T)(result.params)
    const testEval = createDistortionCostFunction(testSet, K, R, T)(result.params)

    trainErrors.push(trainEval)
    testErrors.push(testEval)
  }

  const avgTrain = trainErrors.reduce((a, b) => a + b, 0) / trainErrors.length
  const avgTest = testErrors.reduce((a, b) => a + b, 0) / testErrors.length

  return {
    trainError: avgTrain,
    testError: avgTest,
    overfitRatio: avgTest / avgTrain,
  }
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('optimize-distortion')
    .description('Optimize Brown-Conrady lens distortion coefficients')
    .requiredOption('-c, --camera <id>', 'Camera ID to optimize')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for optimization results')
    .option('--cross-validate', 'Run k-fold cross-validation to detect overfitting')
    .option('--skip-grid', 'Skip grid search and start from current distortion')
    .option('-v, --verbose', 'Show detailed optimization progress')
    .parse(process.argv)

  const opts = program.opts()
  const cameraId = opts.camera

  // Load ground truth
  console.log(`Loading ground truth from ${opts.groundTruth}...`)
  const groundTruths = await loadGroundTruths(opts.groundTruth)

  // Filter annotations
  const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])
  console.log(`Found ${annotations.length} certain annotations for ${cameraId}`)

  if (annotations.length < 10) {
    console.error('Not enough annotations for optimization (need at least 10)')
    process.exit(1)
  }

  // Get calibration
  const registry = new CameraRegistry()
  const calibration = registry.getCalibration(cameraId)

  if (!calibration) {
    console.error(`No calibration found for ${cameraId}`)
    process.exit(1)
  }

  const K = calibration.K
  const R = calibration.R
  const T: Vector3 = [calibration.T[0], calibration.T[1], calibration.T[2]]

  // Initial distortion (default to zero)
  const initialDistortion: DistortionCoeffs = calibration.distortion || {
    k1: 0, k2: 0, k3: 0, p1: 0, p2: 0,
  }

  console.log('\nInitial distortion:')
  console.log(`  k1=${initialDistortion.k1}, k2=${initialDistortion.k2}, k3=${initialDistortion.k3}`)
  console.log(`  p1=${initialDistortion.p1}, p2=${initialDistortion.p2}`)

  // Initial evaluation
  const initialEval = evaluateDistortion(initialDistortion, annotations, K, R, T)
  console.log(`  ${formatErrorStats(initialEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Grid search
  let gridResult: GridSearchResult
  if (opts.skipGrid) {
    console.log('\nSkipping grid search...')
    gridResult = {
      bestParams: initialDistortion,
      bestError: Infinity,
      combinationsSearched: 0,
    }
  } else {
    console.log('\nRunning coarse grid search...')
    gridResult = gridSearchDistortion(annotations, K, R, T, opts.verbose)
    console.log(`  Searched ${gridResult.combinationsSearched} combinations`)
    console.log(`  Best grid result: k1=${gridResult.bestParams.k1}, k2=${gridResult.bestParams.k2}`)
  }

  // Fine optimization with Nelder-Mead
  console.log('\nFine optimization with Nelder-Mead...')
  const costFn = createDistortionCostFunction(annotations, K, R, T)
  const bounds: [number, number][] = [
    [-0.5, 0.5], // k1
    [-0.3, 0.3], // k2
    [-0.1, 0.1], // k3
    [-0.05, 0.05], // p1
    [-0.05, 0.05], // p2
  ]

  const startPoint = [
    gridResult.bestParams.k1,
    gridResult.bestParams.k2,
    gridResult.bestParams.k3,
    gridResult.bestParams.p1,
    gridResult.bestParams.p2,
  ]

  const result = boundedNelderMead(costFn, startPoint, bounds, {
    maxIterations: 500,
    tolerance: 1e-8,
    onProgress: opts.verbose
      ? (iter, value) => {
          if (iter % 100 === 0) {
            console.log(`  Iteration ${iter}: error=${value.toFixed(2)}`)
          }
        }
      : undefined,
  })

  // Extract optimized distortion
  const optimizedDistortion: DistortionCoeffs = {
    k1: result.params[0],
    k2: result.params[1],
    k3: result.params[2],
    p1: result.params[3],
    p2: result.params[4],
  }

  // Final evaluation
  console.log('\nOptimized distortion:')
  console.log(`  k1=${optimizedDistortion.k1.toFixed(6)}, k2=${optimizedDistortion.k2.toFixed(6)}, k3=${optimizedDistortion.k3.toFixed(6)}`)
  console.log(`  p1=${optimizedDistortion.p1.toFixed(6)}, p2=${optimizedDistortion.p2.toFixed(6)}`)

  const optimizedEval = evaluateDistortion(optimizedDistortion, annotations, K, R, T)
  console.log(`  ${formatErrorStats(optimizedEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Cross-validation
  let crossValidationResult: { trainError: number; testError: number; overfitRatio: number } | undefined
  if (opts.crossValidate) {
    console.log('\nRunning 5-fold cross-validation...')
    crossValidationResult = crossValidateDistortion(annotations, K, R, T, gridResult.bestParams)
    console.log(`  Train error: ${crossValidationResult.trainError.toFixed(2)}`)
    console.log(`  Test error: ${crossValidationResult.testError.toFixed(2)}`)
    console.log(`  Overfit ratio: ${crossValidationResult.overfitRatio.toFixed(2)}`)
    if (crossValidationResult.overfitRatio > 1.5) {
      console.log('  WARNING: Potential overfitting detected')
    }
  }

  // Summary
  const improvement = {
    errorReduction: initialEval.stats.mean - optimizedEval.stats.mean,
    percentImprovement:
      ((initialEval.stats.mean - optimizedEval.stats.mean) / initialEval.stats.mean) * 100,
  }

  console.log('\n=== Summary ===')
  console.log(`Optimization ${result.converged ? 'converged' : 'did not converge'} (${result.reason})`)
  console.log(`Error reduction: ${improvement.errorReduction.toFixed(4)}m (${improvement.percentImprovement.toFixed(1)}%)`)
  console.log(`Pass rate: ${(initialEval.stats.passRate * 100).toFixed(1)}% -> ${(optimizedEval.stats.passRate * 100).toFixed(1)}%`)

  // Build result
  const outputResult: DistortionOptimizationResult = {
    timestamp: new Date().toISOString(),
    cameraId,
    groundTruthFile: opts.groundTruth,
    annotationsUsed: annotations.length,
    initial: initialDistortion,
    initialError: initialEval.stats.mean,
    optimized: optimizedDistortion,
    optimizedError: optimizedEval.stats.mean,
    improvement,
    validation: {
      passRate: optimizedEval.stats.passRate,
      meanError: optimizedEval.stats.mean,
      medianError: optimizedEval.stats.median,
      maxError: optimizedEval.stats.max,
    },
    crossValidation: crossValidationResult,
    gridSearch: {
      combinationsSearched: gridResult.combinationsSearched,
      bestGridResult: gridResult.bestParams,
      bestGridError: gridResult.bestError,
    },
    optimization: {
      iterations: result.iterations,
      evaluations: result.evaluations,
      converged: result.converged,
      reason: result.reason,
    },
  }

  // Save output
  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify(outputResult, null, 2))
    console.log(`\nResults saved to ${opts.output}`)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
