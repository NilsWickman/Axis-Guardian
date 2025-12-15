#!/usr/bin/env node
/**
 * Intrinsic Calibration Optimizer
 *
 * Optimizes camera intrinsic matrix K:
 * - Focal length (f)
 * - Principal point (cx, cy)
 *
 * Uses ground truth data and Nelder-Mead optimization.
 *
 * Usage:
 *   pnpm cli:optimize-intrinsics --camera camera1 --ground-truth ../GroundTruths.json --output result.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import {
  computeReprojectionError,
  loadGroundTruths,
  filterAnnotations,
  computeErrorStats,
  formatErrorStats,
  createK,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'
import { boundedNelderMead, multiStartNelderMead } from './nelder-mead.js'

// ============================================================================
// Types
// ============================================================================

interface IntrinsicParams {
  focalLength: number
  principalPointX: number
  principalPointY: number
}

interface IntrinsicOptimizationResult {
  timestamp: string
  cameraId: string
  groundTruthFile: string
  annotationsUsed: number

  initial: IntrinsicParams
  initialK: number[][]
  initialError: number

  optimized: IntrinsicParams
  optimizedK: number[][]
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
 * Create cost function for intrinsic optimization
 *
 * @param annotations - Ground truth annotations for this camera
 * @param R - Fixed rotation matrix
 * @param T - Fixed translation vector
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 */
function createIntrinsicCostFunction(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  R: number[][],
  T: Vector3,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): (params: number[]) => number {
  return (params: number[]): number => {
    // Unpack parameters: [f, cx, cy]
    const [focalLength, cx, cy] = params

    // Create K matrix
    const K = createK(focalLength, cx, cy)

    // Compute total reprojection error
    let totalError = 0
    let validCount = 0

    for (const { annotation, detection } of annotations) {
      const result = computeReprojectionError(
        annotation.groundPosition,
        detection.bbox,
        K,
        R,
        T,
        imageWidth,
        imageHeight
      )

      if (result.isValid) {
        totalError += result.error
        validCount++
      } else {
        totalError += 1e6
      }
    }

    return validCount > 0 ? totalError / validCount : 1e9
  }
}

/**
 * Evaluate calibration with world-space error metrics
 */
function evaluateIntrinsics(
  params: IntrinsicParams,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  R: number[][],
  T: Vector3,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): { errors: number[]; stats: ReturnType<typeof computeErrorStats> } {
  const K = createK(params.focalLength, params.principalPointX, params.principalPointY)
  const errors: number[] = []

  for (const { annotation, detection } of annotations) {
    const result = computeReprojectionError(
      annotation.groundPosition,
      detection.bbox,
      K,
      R,
      T,
      imageWidth,
      imageHeight
    )

    if (result.isValid) {
      // Convert pixel error to approximate world error
      const avgDepth = 5 // meters (rough estimate)
      const pixelError = Math.sqrt(result.error)
      const worldError = (pixelError * avgDepth) / params.focalLength
      errors.push(worldError)
    }
  }

  return { errors, stats: computeErrorStats(errors) }
}

/**
 * Cross-validation for overfitting detection
 */
function crossValidate(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  R: number[][],
  T: Vector3,
  initialParams: IntrinsicParams,
  folds: number = 5
): { trainError: number; testError: number; overfitRatio: number } {
  const n = annotations.length
  const foldSize = Math.floor(n / folds)
  const trainErrors: number[] = []
  const testErrors: number[] = []

  // Shuffle annotations
  const shuffled = [...annotations].sort(() => Math.random() - 0.5)

  for (let fold = 0; fold < folds; fold++) {
    // Split into train and test
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize
    const testSet = shuffled.slice(testStart, testEnd)
    const trainSet = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]

    // Optimize on train set
    const costFn = createIntrinsicCostFunction(trainSet, R, T)
    const bounds: [number, number][] = [
      [500, 5000], // focal length
      [800, 1120], // cx (around 960)
      [440, 640], // cy (around 540)
    ]

    const result = boundedNelderMead(
      costFn,
      [initialParams.focalLength, initialParams.principalPointX, initialParams.principalPointY],
      bounds,
      { maxIterations: 200, tolerance: 1e-6 }
    )

    // Evaluate on train and test
    const trainEval = createIntrinsicCostFunction(trainSet, R, T)(result.params)
    const testEval = createIntrinsicCostFunction(testSet, R, T)(result.params)

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
// Optimization
// ============================================================================

/**
 * Generate start points for intrinsic optimization
 */
function generateIntrinsicStartPoints(initial: IntrinsicParams): number[][] {
  const points: number[][] = []

  // Initial point
  points.push([initial.focalLength, initial.principalPointX, initial.principalPointY])

  // Focal length variations
  for (const fScale of [0.8, 0.9, 1.1, 1.2]) {
    points.push([initial.focalLength * fScale, initial.principalPointX, initial.principalPointY])
  }

  // Principal point variations
  for (const dx of [-30, 30]) {
    for (const dy of [-30, 30]) {
      points.push([initial.focalLength, initial.principalPointX + dx, initial.principalPointY + dy])
    }
  }

  return points
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('optimize-intrinsics')
    .description('Optimize camera K matrix (focal length, principal point)')
    .requiredOption('-c, --camera <id>', 'Camera ID to optimize')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for optimization results')
    .option('--cross-validate', 'Run k-fold cross-validation to detect overfitting')
    .option('-v, --verbose', 'Show detailed optimization progress')
    .parse(process.argv)

  const opts = program.opts()
  const cameraId = opts.camera

  // Load ground truth
  console.log(`Loading ground truth from ${opts.groundTruth}...`)
  const groundTruths = await loadGroundTruths(opts.groundTruth)

  // Filter annotations for this camera
  const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])
  console.log(`Found ${annotations.length} certain annotations for ${cameraId}`)

  if (annotations.length < 10) {
    console.error('Not enough annotations for optimization (need at least 10)')
    process.exit(1)
  }

  // Get initial calibration
  const registry = new CameraRegistry()
  const calibration = registry.getCalibration(cameraId)

  if (!calibration) {
    console.error(`No calibration found for ${cameraId}`)
    process.exit(1)
  }

  // Extract R, T (fixed for intrinsic optimization)
  const R = calibration.R
  const T: Vector3 = [calibration.T[0], calibration.T[1], calibration.T[2]]

  // Initial intrinsic parameters
  const initialParams: IntrinsicParams = {
    focalLength: calibration.K[0][0],
    principalPointX: calibration.K[0][2],
    principalPointY: calibration.K[1][2],
  }

  console.log('\nInitial intrinsics:')
  console.log(`  Focal length: ${initialParams.focalLength}`)
  console.log(`  Principal point: (${initialParams.principalPointX}, ${initialParams.principalPointY})`)

  // Initial evaluation
  const initialEval = evaluateIntrinsics(initialParams, annotations, R, T)
  console.log(`  ${formatErrorStats(initialEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Create cost function
  const costFn = createIntrinsicCostFunction(annotations, R, T)

  // Generate start points
  const startPoints = generateIntrinsicStartPoints(initialParams)
  console.log(`\nOptimizing with ${startPoints.length} start points...`)

  // Run optimization
  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 500,
    tolerance: 1e-6,
    onProgress: opts.verbose
      ? (iter, value) => {
          if (iter % 100 === 0) {
            console.log(`  Iteration ${iter}: error=${value.toFixed(2)}`)
          }
        }
      : undefined,
  })

  // Extract optimized parameters
  const optimizedParams: IntrinsicParams = {
    focalLength: result.params[0],
    principalPointX: result.params[1],
    principalPointY: result.params[2],
  }

  // Final evaluation
  console.log('\nOptimized intrinsics:')
  console.log(`  Focal length: ${optimizedParams.focalLength.toFixed(2)}`)
  console.log(`  Principal point: (${optimizedParams.principalPointX.toFixed(2)}, ${optimizedParams.principalPointY.toFixed(2)})`)

  const optimizedEval = evaluateIntrinsics(optimizedParams, annotations, R, T)
  console.log(`  ${formatErrorStats(optimizedEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Cross-validation
  let crossValidationResult: { trainError: number; testError: number; overfitRatio: number } | undefined
  if (opts.crossValidate) {
    console.log('\nRunning 5-fold cross-validation...')
    crossValidationResult = crossValidate(annotations, R, T, initialParams)
    console.log(`  Train error: ${crossValidationResult.trainError.toFixed(2)}`)
    console.log(`  Test error: ${crossValidationResult.testError.toFixed(2)}`)
    console.log(`  Overfit ratio: ${crossValidationResult.overfitRatio.toFixed(2)}`)
    if (crossValidationResult.overfitRatio > 1.5) {
      console.log('  WARNING: Potential overfitting detected (ratio > 1.5)')
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

  // Build K matrix
  const optimizedK = createK(
    optimizedParams.focalLength,
    optimizedParams.principalPointX,
    optimizedParams.principalPointY
  )

  console.log('\nOptimized K matrix:')
  for (const row of optimizedK) {
    console.log(`  [${row.map((v) => v.toFixed(2)).join(', ')}]`)
  }

  // Build result
  const outputResult: IntrinsicOptimizationResult = {
    timestamp: new Date().toISOString(),
    cameraId,
    groundTruthFile: opts.groundTruth,
    annotationsUsed: annotations.length,
    initial: initialParams,
    initialK: calibration.K,
    initialError: initialEval.stats.mean,
    optimized: optimizedParams,
    optimizedK,
    optimizedError: optimizedEval.stats.mean,
    improvement,
    validation: {
      passRate: optimizedEval.stats.passRate,
      meanError: optimizedEval.stats.mean,
      medianError: optimizedEval.stats.median,
      maxError: optimizedEval.stats.max,
    },
    crossValidation: crossValidationResult,
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
