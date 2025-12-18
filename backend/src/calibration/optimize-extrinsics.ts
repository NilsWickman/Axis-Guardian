#!/usr/bin/env node
/**
 * Extrinsic Calibration Optimizer
 *
 * Optimizes camera rotation (R) and translation (T) matrices directly in
 * sitemap coordinates, using ground truth data and Nelder-Mead optimization.
 *
 * Usage:
 *   pnpm cli:optimize-extrinsics --camera camera1 --ground-truth ../GroundTruths.json --output result.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import type { CameraCalibration } from '../types.js'
import {
  rodriguezToMatrix,
  matrixToRodriguez,
  computeReprojectionError,
  loadGroundTruths,
  filterAnnotations,
  computeErrorStats,
  formatErrorStats,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'
import { multiStartNelderMead } from './nelder-mead.js'

// ============================================================================
// Types
// ============================================================================

interface ExtrinsicParams {
  /** Rodriguez rotation vector */
  rodriguez: Vector3
  /** Translation vector (camera position in world coords) */
  translation: Vector3
}

interface OptimizationResult {
  timestamp: string
  cameraId: string
  groundTruthFile: string
  annotationsUsed: number

  initialParams: ExtrinsicParams
  initialError: number

  optimizedParams: ExtrinsicParams
  optimizedR: number[][]
  optimizedT: Vector3
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

  optimization: {
    iterations: number
    evaluations: number
    converged: boolean
    reason: string
    multiStartResults?: number
  }
}

// ============================================================================
// Cost Function
// ============================================================================

/**
 * Create cost function for extrinsic optimization
 *
 * @param annotations - Ground truth annotations for this camera
 * @param K - Fixed intrinsic matrix
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 */
function createExtrinsicCostFunction(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  imageWidth: number = 1920,
  imageHeight: number = 1080
): (params: number[]) => number {
  return (params: number[]): number => {
    // Unpack parameters: [rx, ry, rz, tx, ty, tz]
    const rodriguez: Vector3 = [params[0], params[1], params[2]]
    const translation: Vector3 = [params[3], params[4], params[5]]

    // Convert Rodriguez to rotation matrix
    const R = rodriguezToMatrix(rodriguez)

    // Compute total reprojection error
    let totalError = 0
    let validCount = 0

    for (const { annotation, detection } of annotations) {
      const result = computeReprojectionError(
        annotation.groundPosition,
        detection.bbox,
        K,
        R,
        translation,
        imageWidth,
        imageHeight
      )

      if (result.isValid) {
        totalError += result.error
        validCount++
      } else {
        // Penalize invalid projections heavily
        totalError += 1e6
      }
    }

    // Return mean squared error (in pixels)
    return validCount > 0 ? totalError / validCount : 1e9
  }
}

/**
 * Evaluate calibration with world-space error metrics
 */
function evaluateCalibration(
  params: ExtrinsicParams,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  imageWidth: number = 1920,
  imageHeight: number = 1080
): { errors: number[]; stats: ReturnType<typeof computeErrorStats> } {
  const R = rodriguezToMatrix(params.rodriguez)
  const errors: number[] = []

  // We need to project from image to world to compute world-space error
  // For now, we'll use the reprojection error as a proxy
  // TODO: Implement proper image-to-world projection

  for (const { annotation, detection } of annotations) {
    const result = computeReprojectionError(
      annotation.groundPosition,
      detection.bbox,
      K,
      R,
      params.translation,
      imageWidth,
      imageHeight
    )

    if (result.isValid) {
      // Convert pixel error to approximate world error
      // This is a rough approximation based on typical camera setup
      const focalLength = K[0][0]
      const avgDepth = 5 // meters (rough estimate)
      const pixelError = Math.sqrt(result.error)
      const worldError = (pixelError * avgDepth) / focalLength
      errors.push(worldError)
    }
  }

  return { errors, stats: computeErrorStats(errors) }
}

// ============================================================================
// Optimization
// ============================================================================

/**
 * Generate coarse grid of initial points for multi-start optimization
 */
function generateCoarseStartPoints(
  initialRodriguez: Vector3,
  initialTranslation: Vector3,
  roomBounds: { width: number; height: number }
): number[][] {
  const points: number[][] = []

  // Start from initial point
  points.push([...initialRodriguez, ...initialTranslation])

  // Perturb rotation (±0.1 radians ≈ ±6 degrees)
  const rotPerturbations = [-0.1, 0, 0.1]
  for (const drx of rotPerturbations) {
    for (const dry of rotPerturbations) {
      for (const drz of rotPerturbations) {
        if (drx === 0 && dry === 0 && drz === 0) continue
        points.push([
          initialRodriguez[0] + drx,
          initialRodriguez[1] + dry,
          initialRodriguez[2] + drz,
          ...initialTranslation,
        ])
      }
    }
  }

  // Perturb translation (±1m)
  const transPerturbations = [-1, 0, 1]
  for (const dtx of transPerturbations) {
    for (const dty of transPerturbations) {
      for (const dtz of [-0.5, 0, 0.5]) {
        if (dtx === 0 && dty === 0 && dtz === 0) continue
        const tx = Math.max(0, Math.min(roomBounds.width, initialTranslation[0] + dtx))
        const ty = Math.max(0, Math.min(roomBounds.height, initialTranslation[1] + dty))
        const tz = Math.max(0.5, initialTranslation[2] + dtz)
        points.push([...initialRodriguez, tx, ty, tz])
      }
    }
  }

  return points
}

/**
 * Run extrinsic optimization
 */
function optimizeExtrinsics(
  _cameraId: string,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  initialCalibration: CameraCalibration,
  roomBounds: { width: number; height: number },
  verbose: boolean = false
): { result: ReturnType<typeof multiStartNelderMead>; optimizedParams: ExtrinsicParams } {
  const K = initialCalibration.K

  // Extract initial Rodriguez from R matrix
  const initialRodriguez = matrixToRodriguez(initialCalibration.R)
  const initialTranslation: Vector3 = [
    initialCalibration.T[0],
    initialCalibration.T[1],
    initialCalibration.T[2],
  ]

  if (verbose) {
    console.log(`  Initial Rodriguez: [${initialRodriguez.map((v) => v.toFixed(4)).join(', ')}]`)
    console.log(`  Initial Translation: [${initialTranslation.map((v) => v.toFixed(4)).join(', ')}]`)
  }

  // Create cost function
  const costFn = createExtrinsicCostFunction(annotations, K)

  // Generate start points
  const startPoints = generateCoarseStartPoints(initialRodriguez, initialTranslation, roomBounds)

  if (verbose) {
    console.log(`  Generated ${startPoints.length} start points for multi-start optimization`)
  }

  // Run multi-start optimization
  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 500,
    tolerance: 1e-6,
    onProgress: verbose
      ? (iter, value, _params) => {
          if (iter % 100 === 0) {
            console.log(`    Iteration ${iter}: error=${value.toFixed(2)}`)
          }
        }
      : undefined,
  })

  const optimizedParams: ExtrinsicParams = {
    rodriguez: [result.params[0], result.params[1], result.params[2]],
    translation: [result.params[3], result.params[4], result.params[5]],
  }

  return { result, optimizedParams }
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('optimize-extrinsics')
    .description('Optimize camera R/T matrices using ground truth data')
    .requiredOption('-c, --camera <id>', 'Camera ID to optimize')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for optimization results')
    .option('--room-width <meters>', 'Room width in meters', '18')
    .option('--room-height <meters>', 'Room height in meters', '12')
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
  const initialCalibration = registry.getCalibration(cameraId)

  if (!initialCalibration) {
    console.error(`No calibration found for ${cameraId}`)
    process.exit(1)
  }

  // Room bounds
  const roomBounds = {
    width: parseFloat(opts.roomWidth),
    height: parseFloat(opts.roomHeight),
  }

  // Initial evaluation
  const initialRodriguez = matrixToRodriguez(initialCalibration.R)
  const initialTranslation: Vector3 = [
    initialCalibration.T[0],
    initialCalibration.T[1],
    initialCalibration.T[2],
  ]
  const initialParams: ExtrinsicParams = {
    rodriguez: initialRodriguez,
    translation: initialTranslation,
  }

  console.log('\nInitial calibration:')
  const initialEval = evaluateCalibration(initialParams, annotations, initialCalibration.K)
  console.log(`  ${formatErrorStats(initialEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Run optimization
  console.log('\nOptimizing extrinsics...')
  const { result, optimizedParams } = optimizeExtrinsics(
    cameraId,
    annotations,
    initialCalibration,
    roomBounds,
    opts.verbose
  )

  // Final evaluation
  console.log('\nOptimized calibration:')
  const optimizedEval = evaluateCalibration(optimizedParams, annotations, initialCalibration.K)
  console.log(`  ${formatErrorStats(optimizedEval.stats).split('\n').map((l) => '  ' + l).join('\n')}`)

  // Convert optimized Rodriguez to matrix
  const optimizedR = rodriguezToMatrix(optimizedParams.rodriguez)

  // Results
  const improvement = {
    errorReduction: initialEval.stats.mean - optimizedEval.stats.mean,
    percentImprovement:
      ((initialEval.stats.mean - optimizedEval.stats.mean) / initialEval.stats.mean) * 100,
  }

  console.log('\n=== Summary ===')
  console.log(`Optimization ${result.converged ? 'converged' : 'did not converge'} (${result.reason})`)
  console.log(`Iterations: ${result.iterations}, Evaluations: ${result.evaluations}`)
  console.log(`Error reduction: ${improvement.errorReduction.toFixed(4)}m (${improvement.percentImprovement.toFixed(1)}%)`)
  console.log(`Pass rate: ${(initialEval.stats.passRate * 100).toFixed(1)}% -> ${(optimizedEval.stats.passRate * 100).toFixed(1)}%`)

  console.log('\nOptimized R matrix:')
  for (const row of optimizedR) {
    console.log(`  [${row.map((v) => v.toFixed(6)).join(', ')}]`)
  }
  console.log(`\nOptimized T vector: [${optimizedParams.translation.map((v) => v.toFixed(6)).join(', ')}]`)

  // Build result
  const outputResult: OptimizationResult = {
    timestamp: new Date().toISOString(),
    cameraId,
    groundTruthFile: opts.groundTruth,
    annotationsUsed: annotations.length,
    initialParams,
    initialError: initialEval.stats.mean,
    optimizedParams,
    optimizedR,
    optimizedT: optimizedParams.translation,
    optimizedError: optimizedEval.stats.mean,
    improvement,
    validation: {
      passRate: optimizedEval.stats.passRate,
      meanError: optimizedEval.stats.mean,
      medianError: optimizedEval.stats.median,
      maxError: optimizedEval.stats.max,
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
