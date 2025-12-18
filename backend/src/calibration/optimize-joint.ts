#!/usr/bin/env node
/**
 * Joint Multi-Camera Calibration Optimizer
 *
 * Optimizes multiple cameras simultaneously to minimize:
 * 1. Individual reprojection errors
 * 2. Cross-camera projection divergence
 *
 * This ensures cameras produce consistent projections for the same person.
 *
 * Usage:
 *   pnpm cli:optimize-joint --ground-truth ../GroundTruths.json --output joint-result.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import {
  rodriguezToMatrix,
  matrixToRodriguez,
  projectWorldToImage,
  loadGroundTruths,
  getMultiCameraAnnotations,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'
import { multiStartNelderMead } from './nelder-mead.js'

// ============================================================================
// Types
// ============================================================================

interface CameraExtrinsics {
  cameraId: string
  rodriguez: Vector3
  translation: Vector3
}

interface JointOptimizationResult {
  timestamp: string
  groundTruthFile: string
  annotationsUsed: number
  lambda: number

  cameras: Array<{
    cameraId: string
    initialR: number[][]
    initialT: Vector3
    optimizedR: number[][]
    optimizedT: Vector3
  }>

  metrics: {
    initial: {
      cam1PassRate: number
      cam2PassRate: number
      convergenceRate: number
      meanDivergence: number
    }
    optimized: {
      cam1PassRate: number
      cam2PassRate: number
      convergenceRate: number
      meanDivergence: number
    }
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
 * Create joint cost function that optimizes both cameras simultaneously
 *
 * Cost = E_cam1 + E_cam2 + lambda * E_divergence
 *
 * @param annotations - Multi-camera annotations
 * @param K1 - Camera 1 intrinsic matrix
 * @param K2 - Camera 2 intrinsic matrix
 * @param lambda - Weight for divergence term
 */
function createJointCostFunction(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detections: Map<string, GroundTruthAnnotation['linkedDetections'][0]>
  }>,
  K1: number[][],
  K2: number[][],
  lambda: number = 0.5,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): (params: number[]) => number {
  return (params: number[]): number => {
    // Unpack parameters: [rx1, ry1, rz1, tx1, ty1, tz1, rx2, ry2, rz2, tx2, ty2, tz2]
    const rodriguez1: Vector3 = [params[0], params[1], params[2]]
    const translation1: Vector3 = [params[3], params[4], params[5]]
    const rodriguez2: Vector3 = [params[6], params[7], params[8]]
    const translation2: Vector3 = [params[9], params[10], params[11]]

    const R1 = rodriguezToMatrix(rodriguez1)
    const R2 = rodriguezToMatrix(rodriguez2)

    let totalReprojError = 0
    let totalDivergence = 0
    let validCount = 0

    for (const { annotation, detections } of annotations) {
      const det1 = detections.get('camera1')
      const det2 = detections.get('camera2')
      if (!det1 || !det2) continue

      // Ground truth world point
      const worldPoint = { x: annotation.groundPosition.x, y: annotation.groundPosition.y, z: 0 }

      // Project world to image for camera 1
      const proj1 = projectWorldToImage(worldPoint, K1, R1, translation1)
      // Project world to image for camera 2
      const proj2 = projectWorldToImage(worldPoint, K2, R2, translation2)

      if (!proj1.isValid || !proj2.isValid) {
        totalReprojError += 1e6
        continue
      }

      // Bbox bottom-center targets
      const target1u = ((det1.bbox.left + det1.bbox.right) / 2) * imageWidth
      const target1v = det1.bbox.bottom * imageHeight
      const target2u = ((det2.bbox.left + det2.bbox.right) / 2) * imageWidth
      const target2v = det2.bbox.bottom * imageHeight

      // Reprojection errors (squared pixel error)
      const reproj1 = (proj1.u - target1u) ** 2 + (proj1.v - target1v) ** 2
      const reproj2 = (proj2.u - target2u) ** 2 + (proj2.v - target2v) ** 2

      totalReprojError += reproj1 + reproj2

      // Cross-camera divergence: project from each camera to world and compare
      // For now, we use a proxy: difference in projected positions
      // This encourages both cameras to agree on where the person is
      totalDivergence += Math.abs(proj1.u - target1u - (proj2.u - target2u)) +
                        Math.abs(proj1.v - target1v - (proj2.v - target2v))

      validCount++
    }

    if (validCount === 0) return 1e9

    // Combined cost
    const meanReproj = totalReprojError / validCount
    const meanDivergence = totalDivergence / validCount

    return meanReproj + lambda * meanDivergence
  }
}

/**
 * Evaluate cross-camera consistency
 */
function evaluateCrossCamera(
  cam1Params: CameraExtrinsics,
  cam2Params: CameraExtrinsics,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detections: Map<string, GroundTruthAnnotation['linkedDetections'][0]>
  }>,
  K1: number[][],
  K2: number[][],
  convergenceThreshold: number = 0.6
): {
  convergenceRate: number
  meanDivergence: number
  divergences: number[]
} {
  const R1 = rodriguezToMatrix(cam1Params.rodriguez)
  const R2 = rodriguezToMatrix(cam2Params.rodriguez)
  const divergences: number[] = []

  for (const { annotation, detections } of annotations) {
    const det1 = detections.get('camera1')
    const det2 = detections.get('camera2')
    if (!det1 || !det2) continue

    const worldPoint = { x: annotation.groundPosition.x, y: annotation.groundPosition.y, z: 0 }

    const proj1 = projectWorldToImage(worldPoint, K1, R1, cam1Params.translation)
    const proj2 = projectWorldToImage(worldPoint, K2, R2, cam2Params.translation)

    if (!proj1.isValid || !proj2.isValid) continue

    // Compute divergence in world space (approximation)
    const focalLength = (K1[0][0] + K2[0][0]) / 2
    const avgDepth = (proj1.depth + proj2.depth) / 2

    const target1u = ((det1.bbox.left + det1.bbox.right) / 2) * 1920
    const target1v = det1.bbox.bottom * 1080
    const target2u = ((det2.bbox.left + det2.bbox.right) / 2) * 1920
    const target2v = det2.bbox.bottom * 1080

    const error1 = Math.sqrt((proj1.u - target1u) ** 2 + (proj1.v - target1v) ** 2)
    const error2 = Math.sqrt((proj2.u - target2u) ** 2 + (proj2.v - target2v) ** 2)

    // Approximate world-space error
    const worldError1 = (error1 * avgDepth) / focalLength
    const worldError2 = (error2 * avgDepth) / focalLength
    const divergence = Math.abs(worldError1 - worldError2)
    divergences.push(divergence)
  }

  const convergent = divergences.filter((d) => d <= convergenceThreshold).length
  const meanDivergence =
    divergences.length > 0 ? divergences.reduce((a, b) => a + b, 0) / divergences.length : 0

  return {
    convergenceRate: divergences.length > 0 ? convergent / divergences.length : 0,
    meanDivergence,
    divergences,
  }
}

// ============================================================================
// Optimization
// ============================================================================

/**
 * Generate start points for joint optimization
 */
function generateJointStartPoints(
  initial1: CameraExtrinsics,
  initial2: CameraExtrinsics,
  numPoints: number = 10
): number[][] {
  const points: number[][] = []

  // Initial point
  points.push([
    ...initial1.rodriguez,
    ...initial1.translation,
    ...initial2.rodriguez,
    ...initial2.translation,
  ])

  // Perturbed points
  for (let i = 0; i < numPoints - 1; i++) {
    const perturbScale = 0.1 * (1 + i * 0.1) // Increasing perturbation

    points.push([
      initial1.rodriguez[0] + (Math.random() - 0.5) * perturbScale,
      initial1.rodriguez[1] + (Math.random() - 0.5) * perturbScale,
      initial1.rodriguez[2] + (Math.random() - 0.5) * perturbScale,
      initial1.translation[0] + (Math.random() - 0.5) * 2,
      initial1.translation[1] + (Math.random() - 0.5) * 2,
      initial1.translation[2] + (Math.random() - 0.5) * 0.5,
      initial2.rodriguez[0] + (Math.random() - 0.5) * perturbScale,
      initial2.rodriguez[1] + (Math.random() - 0.5) * perturbScale,
      initial2.rodriguez[2] + (Math.random() - 0.5) * perturbScale,
      initial2.translation[0] + (Math.random() - 0.5) * 2,
      initial2.translation[1] + (Math.random() - 0.5) * 2,
      initial2.translation[2] + (Math.random() - 0.5) * 0.5,
    ])
  }

  return points
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('optimize-joint')
    .description('Joint multi-camera calibration optimization')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for optimization results')
    .option('--lambda <value>', 'Weight for divergence term (default: 0.5)', '0.5')
    .option('--convergence-threshold <meters>', 'Cross-camera convergence threshold', '0.6')
    .option('-v, --verbose', 'Show detailed optimization progress')
    .parse(process.argv)

  const opts = program.opts()
  const lambda = parseFloat(opts.lambda)
  const convergenceThreshold = parseFloat(opts.convergenceThreshold)

  // Load ground truth
  console.log(`Loading ground truth from ${opts.groundTruth}...`)
  const groundTruths = await loadGroundTruths(opts.groundTruth)

  // Get multi-camera annotations
  const cameraIds = ['camera1', 'camera2']
  const multiCamAnnotations = getMultiCameraAnnotations(groundTruths.annotations, cameraIds, ['certain'])
  console.log(`Found ${multiCamAnnotations.length} annotations with both cameras`)

  if (multiCamAnnotations.length < 20) {
    console.error('Not enough multi-camera annotations for joint optimization (need at least 20)')
    process.exit(1)
  }

  // Get initial calibrations
  const registry = new CameraRegistry()
  const cal1 = registry.getCalibration('camera1')
  const cal2 = registry.getCalibration('camera2')

  if (!cal1 || !cal2) {
    console.error('Missing calibration for one or both cameras')
    process.exit(1)
  }

  // Initial parameters
  const initial1: CameraExtrinsics = {
    cameraId: 'camera1',
    rodriguez: matrixToRodriguez(cal1.R),
    translation: [cal1.T[0], cal1.T[1], cal1.T[2]],
  }
  const initial2: CameraExtrinsics = {
    cameraId: 'camera2',
    rodriguez: matrixToRodriguez(cal2.R),
    translation: [cal2.T[0], cal2.T[1], cal2.T[2]],
  }

  // Initial evaluation
  console.log('\nInitial cross-camera metrics:')
  const initialMetrics = evaluateCrossCamera(
    initial1,
    initial2,
    multiCamAnnotations,
    cal1.K,
    cal2.K,
    convergenceThreshold
  )
  console.log(`  Convergence rate: ${(initialMetrics.convergenceRate * 100).toFixed(1)}%`)
  console.log(`  Mean divergence: ${initialMetrics.meanDivergence.toFixed(3)}m`)

  // Create cost function
  const costFn = createJointCostFunction(multiCamAnnotations, cal1.K, cal2.K, lambda)

  // Generate start points
  const startPoints = generateJointStartPoints(initial1, initial2, 15)
  console.log(`\nOptimizing with ${startPoints.length} start points (lambda=${lambda})...`)

  // Run optimization
  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 800,
    tolerance: 1e-6,
    onProgress: opts.verbose
      ? (iter, value) => {
          if (iter % 100 === 0) {
            console.log(`  Iteration ${iter}: cost=${value.toFixed(2)}`)
          }
        }
      : undefined,
  })

  // Extract optimized parameters
  const optimized1: CameraExtrinsics = {
    cameraId: 'camera1',
    rodriguez: [result.params[0], result.params[1], result.params[2]],
    translation: [result.params[3], result.params[4], result.params[5]],
  }
  const optimized2: CameraExtrinsics = {
    cameraId: 'camera2',
    rodriguez: [result.params[6], result.params[7], result.params[8]],
    translation: [result.params[9], result.params[10], result.params[11]],
  }

  // Final evaluation
  console.log('\nOptimized cross-camera metrics:')
  const optimizedMetrics = evaluateCrossCamera(
    optimized1,
    optimized2,
    multiCamAnnotations,
    cal1.K,
    cal2.K,
    convergenceThreshold
  )
  console.log(`  Convergence rate: ${(optimizedMetrics.convergenceRate * 100).toFixed(1)}%`)
  console.log(`  Mean divergence: ${optimizedMetrics.meanDivergence.toFixed(3)}m`)

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Optimization ${result.converged ? 'converged' : 'did not converge'} (${result.reason})`)
  console.log(`Convergence rate: ${(initialMetrics.convergenceRate * 100).toFixed(1)}% -> ${(optimizedMetrics.convergenceRate * 100).toFixed(1)}%`)
  console.log(`Mean divergence: ${initialMetrics.meanDivergence.toFixed(3)}m -> ${optimizedMetrics.meanDivergence.toFixed(3)}m`)

  // Output matrices
  const optimizedR1 = rodriguezToMatrix(optimized1.rodriguez)
  const optimizedR2 = rodriguezToMatrix(optimized2.rodriguez)

  console.log('\nCamera 1 Optimized R:')
  for (const row of optimizedR1) {
    console.log(`  [${row.map((v) => v.toFixed(6)).join(', ')}]`)
  }
  console.log(`Camera 1 Optimized T: [${optimized1.translation.map((v) => v.toFixed(6)).join(', ')}]`)

  console.log('\nCamera 2 Optimized R:')
  for (const row of optimizedR2) {
    console.log(`  [${row.map((v) => v.toFixed(6)).join(', ')}]`)
  }
  console.log(`Camera 2 Optimized T: [${optimized2.translation.map((v) => v.toFixed(6)).join(', ')}]`)

  // Build result
  const outputResult: JointOptimizationResult = {
    timestamp: new Date().toISOString(),
    groundTruthFile: opts.groundTruth,
    annotationsUsed: multiCamAnnotations.length,
    lambda,
    cameras: [
      {
        cameraId: 'camera1',
        initialR: cal1.R,
        initialT: [cal1.T[0], cal1.T[1], cal1.T[2]],
        optimizedR: optimizedR1,
        optimizedT: optimized1.translation,
      },
      {
        cameraId: 'camera2',
        initialR: cal2.R,
        initialT: [cal2.T[0], cal2.T[1], cal2.T[2]],
        optimizedR: optimizedR2,
        optimizedT: optimized2.translation,
      },
    ],
    metrics: {
      initial: {
        cam1PassRate: 0, // TODO: compute individual pass rates
        cam2PassRate: 0,
        convergenceRate: initialMetrics.convergenceRate,
        meanDivergence: initialMetrics.meanDivergence,
      },
      optimized: {
        cam1PassRate: 0,
        cam2PassRate: 0,
        convergenceRate: optimizedMetrics.convergenceRate,
        meanDivergence: optimizedMetrics.meanDivergence,
      },
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
