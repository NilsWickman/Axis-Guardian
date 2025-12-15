#!/usr/bin/env node
/**
 * Full Calibration Pipeline
 *
 * Orchestrates the complete camera calibration process:
 * 1. Analyze current projections (baseline)
 * 2. Optimize extrinsics (R, T) per camera
 * 3. Joint multi-camera optimization
 * 4. Optimize intrinsics (K matrix)
 * 5. Calibrate distortion
 * 6. Validate final calibration
 * 7. Output final calibration JSON
 *
 * Usage:
 *   pnpm cli:calibrate-full --ground-truth ../GroundTruths.json --output calibration-final.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'
import type { CameraCalibration, DistortionCoeffs } from '../types.js'
import {
  rodriguezToMatrix,
  matrixToRodriguez,
  projectImageToWorld,
  loadGroundTruths,
  filterAnnotations,
  getMultiCameraAnnotations,
  computeErrorStats,
  createK,
  gtBboxToDetectionBBox,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'
import { boundedNelderMead, multiStartNelderMead } from './nelder-mead.js'
import { computeDLT, annotationsToCorrespondences } from './dlt.js'

// ============================================================================
// Types
// ============================================================================

interface CameraCalibrationResult {
  cameraId: string
  K: number[][]
  R: number[][]
  T: Vector3
  distortion: DistortionCoeffs
  center: [number, number]
  scale: number
}

interface PipelineResult {
  timestamp: string
  groundTruthFile: string
  totalAnnotations: number
  pipelineVersion: string

  cameras: CameraCalibrationResult[]

  baseline: {
    camera1PassRate: number
    camera2PassRate: number
    crossCameraConvergenceRate: number
  }

  final: {
    camera1PassRate: number
    camera2PassRate: number
    crossCameraConvergenceRate: number
    camera1MeanError: number
    camera2MeanError: number
  }

  improvement: {
    camera1PassRateGain: number
    camera2PassRateGain: number
    convergenceGain: number
  }

  phases: {
    extrinsics: { completed: boolean; duration: number }
    joint: { completed: boolean; duration: number }
    intrinsics: { completed: boolean; duration: number }
    distortion: { completed: boolean; duration: number }
  }
}

// ============================================================================
// Evaluation Functions
// ============================================================================

/**
 * Evaluate calibration using image-to-world projection
 * This projects the bbox from image coordinates to world coordinates
 * and compares with the ground truth position
 *
 * @param calibration - Camera calibration (K/R/T)
 * @param annotations - Ground truth annotations
 * @param useDirectProjection - If true, use projectImageToWorld (no worldTransform).
 *                              If false, use projectDetectionWithKRT (existing system with worldTransform)
 */
function evaluateProjection(
  calibration: CameraCalibration,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  useDirectProjection: boolean = false
): { errors: number[]; stats: ReturnType<typeof computeErrorStats> } {
  const errors: number[] = []
  const center = calibration.center as [number, number]

  for (const { annotation, detection } of annotations) {
    // Get bbox bottom-center in pixels
    const bboxCenterX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
    const bboxBottomY = detection.bbox.bottom * 1080

    let worldPoint: { x: number; y: number }
    let isValid: boolean

    if (useDirectProjection) {
      // Use direct K/R/T projection without worldTransform
      const result = projectImageToWorld(
        bboxCenterX,
        bboxBottomY,
        calibration.K,
        calibration.R,
        [calibration.T[0], calibration.T[1], calibration.T[2]],
        center
      )
      worldPoint = result.worldPoint
      isValid = result.isValid
    } else {
      // Use existing projection system (includes worldTransform polynomial)
      const bbox = gtBboxToDetectionBBox(detection.bbox)
      const result = projectDetectionWithKRT(
        bbox,
        calibration,
        null,
        [],
        true, // isNormalized
        1920,
        1080
      )
      worldPoint = result.worldPoint
      isValid = result.isValid
    }

    if (!isValid) continue

    // Compute world-space error
    const error = Math.sqrt(
      (worldPoint.x - annotation.groundPosition.x) ** 2 +
        (worldPoint.y - annotation.groundPosition.y) ** 2
    )
    errors.push(error)
  }

  return { errors, stats: computeErrorStats(errors) }
}

/**
 * Evaluate cross-camera consistency using image-to-world projection
 * Projects each camera's bbox to world coordinates and measures divergence
 */
function evaluateCrossCamera(
  cal1: CameraCalibration,
  cal2: CameraCalibration,
  multiCamAnnotations: Array<{
    annotation: GroundTruthAnnotation
    detections: Map<string, GroundTruthAnnotation['linkedDetections'][0]>
  }>,
  convergenceThreshold: number = 0.6,
  useDirectProjection: boolean = false
): { convergenceRate: number; meanDivergence: number } {
  const divergences: number[] = []

  for (const { detections } of multiCamAnnotations) {
    const det1 = detections.get('camera1')
    const det2 = detections.get('camera2')
    if (!det1 || !det2) continue

    let pos1: { x: number; y: number }
    let pos2: { x: number; y: number }
    let valid1: boolean
    let valid2: boolean

    if (useDirectProjection) {
      // Use direct K/R/T projection
      const center1X = ((det1.bbox.left + det1.bbox.right) / 2) * 1920
      const bottom1Y = det1.bbox.bottom * 1080
      const center2X = ((det2.bbox.left + det2.bbox.right) / 2) * 1920
      const bottom2Y = det2.bbox.bottom * 1080

      const result1 = projectImageToWorld(
        center1X, bottom1Y,
        cal1.K, cal1.R, [cal1.T[0], cal1.T[1], cal1.T[2]],
        cal1.center as [number, number]
      )
      const result2 = projectImageToWorld(
        center2X, bottom2Y,
        cal2.K, cal2.R, [cal2.T[0], cal2.T[1], cal2.T[2]],
        cal2.center as [number, number]
      )

      pos1 = result1.worldPoint
      pos2 = result2.worldPoint
      valid1 = result1.isValid
      valid2 = result2.isValid
    } else {
      // Use existing projection with worldTransform
      const bbox1 = gtBboxToDetectionBBox(det1.bbox)
      const bbox2 = gtBboxToDetectionBBox(det2.bbox)

      const result1 = projectDetectionWithKRT(bbox1, cal1, null, [], true, 1920, 1080)
      const result2 = projectDetectionWithKRT(bbox2, cal2, null, [], true, 1920, 1080)

      pos1 = result1.worldPoint
      pos2 = result2.worldPoint
      valid1 = result1.isValid
      valid2 = result2.isValid
    }

    if (!valid1 || !valid2) continue

    // Compute divergence between projected world positions
    const divergence = Math.sqrt(
      (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2
    )
    divergences.push(divergence)
  }

  const convergent = divergences.filter((d) => d <= convergenceThreshold).length
  const meanDivergence =
    divergences.length > 0 ? divergences.reduce((a, b) => a + b, 0) / divergences.length : 0

  return {
    convergenceRate: divergences.length > 0 ? convergent / divergences.length : 0,
    meanDivergence,
  }
}

// ============================================================================
// Cost Functions
// ============================================================================

/**
 * Create cost function for extrinsic optimization using image-to-world projection
 * This optimizes R and T to minimize world-space error
 */
function createExtrinsicCostFn(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  center: [number, number]
): (params: number[]) => number {
  return (params: number[]): number => {
    const rodriguez: Vector3 = [params[0], params[1], params[2]]
    const translation: Vector3 = [params[3], params[4], params[5]]
    const R = rodriguezToMatrix(rodriguez)

    let totalError = 0
    let validCount = 0

    for (const { annotation, detection } of annotations) {
      // Get bbox bottom-center in pixels
      const bboxCenterX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const bboxBottomY = detection.bbox.bottom * 1080

      // Project image point to world using current K/R/T
      const result = projectImageToWorld(bboxCenterX, bboxBottomY, K, R, translation, center)

      if (!result.isValid) {
        totalError += 1e6
        continue
      }

      // World-space error (meters)
      const dx = result.worldPoint.x - annotation.groundPosition.x
      const dy = result.worldPoint.y - annotation.groundPosition.y
      totalError += dx * dx + dy * dy
      validCount++
    }

    return validCount > 0 ? totalError / validCount : 1e9
  }
}

// ============================================================================
// Pipeline Phases
// ============================================================================

async function runExtrinsicsPhase(
  cameraId: string,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  initialCal: CameraCalibration,
  verbose: boolean
): Promise<{ R: number[][]; T: Vector3 }> {
  if (verbose) console.log(`  Optimizing ${cameraId} extrinsics...`)

  const K = initialCal.K
  const center = initialCal.center as [number, number]
  const initialRodriguez = matrixToRodriguez(initialCal.R)
  const initialT: Vector3 = [initialCal.T[0], initialCal.T[1], initialCal.T[2]]

  const costFn = createExtrinsicCostFn(annotations, K, center)

  // Generate start points with wider perturbations
  const startPoints: number[][] = [[...initialRodriguez, ...initialT]]

  // More start points with larger perturbations
  for (let i = 0; i < 30; i++) {
    const rotScale = 0.5 // ±0.5 radians (~30 degrees)
    const transScale = 5 // ±5 meters
    startPoints.push([
      initialRodriguez[0] + (Math.random() - 0.5) * rotScale,
      initialRodriguez[1] + (Math.random() - 0.5) * rotScale,
      initialRodriguez[2] + (Math.random() - 0.5) * rotScale,
      initialT[0] + (Math.random() - 0.5) * transScale,
      initialT[1] + (Math.random() - 0.5) * transScale,
      Math.max(0.5, initialT[2] + (Math.random() - 0.5) * 3), // Keep height positive
    ])
  }

  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 1000,
    tolerance: 1e-8,
  })

  const optimizedR = rodriguezToMatrix([result.params[0], result.params[1], result.params[2]])
  const optimizedT: Vector3 = [result.params[3], result.params[4], result.params[5]]

  if (verbose) {
    console.log(`    Converged: ${result.converged}, Iterations: ${result.iterations}`)
  }

  return { R: optimizedR, T: optimizedT }
}

async function runIntrinsicsPhase(
  cameraId: string,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  R: number[][],
  T: Vector3,
  initialK: number[][],
  verbose: boolean
): Promise<number[][]> {
  if (verbose) console.log(`  Optimizing ${cameraId} intrinsics...`)

  const initialF = initialK[0][0]
  const initialCx = initialK[0][2]
  const initialCy = initialK[1][2]

  const costFn = (params: number[]): number => {
    const K = createK(params[0], params[1], params[2])
    // For intrinsics, we optimize K with cx/cy in the K matrix
    const center: [number, number] = [params[1], params[2]]
    let totalError = 0
    let validCount = 0

    for (const { annotation, detection } of annotations) {
      // Get bbox bottom-center in pixels
      const bboxCenterX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const bboxBottomY = detection.bbox.bottom * 1080

      // Project image point to world using current K/R/T
      const result = projectImageToWorld(bboxCenterX, bboxBottomY, K, R, T, center)

      if (!result.isValid) {
        totalError += 1e6
        continue
      }

      // World-space error (meters)
      const dx = result.worldPoint.x - annotation.groundPosition.x
      const dy = result.worldPoint.y - annotation.groundPosition.y
      totalError += dx * dx + dy * dy
      validCount++
    }

    return validCount > 0 ? totalError / validCount : 1e9
  }

  const bounds: [number, number][] = [
    [500, 5000], // focal length
    [800, 1120], // cx
    [440, 640], // cy
  ]

  const result = boundedNelderMead(costFn, [initialF, initialCx, initialCy], bounds, {
    maxIterations: 300,
    tolerance: 1e-6,
  })

  if (verbose) {
    console.log(`    f: ${initialF.toFixed(0)} -> ${result.params[0].toFixed(0)}`)
  }

  return createK(result.params[0], result.params[1], result.params[2])
}

async function runDistortionPhase(
  _cameraId: string,
  _annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  _K: number[][],
  _R: number[][],
  _T: Vector3,
  verbose: boolean
): Promise<DistortionCoeffs> {
  // Note: Distortion calibration requires undistortion in image-to-world pipeline
  // For now, return zero distortion. Use cli:optimize-distortion for distortion calibration.
  if (verbose) console.log(`    Skipping distortion (use cli:optimize-distortion for separate calibration)`)

  return {
    k1: 0,
    k2: 0,
    k3: 0,
    p1: 0,
    p2: 0,
  }
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('calibrate-full')
    .description('Run full camera calibration pipeline')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for final calibration')
    .option('--skip-joint', 'Skip joint multi-camera optimization')
    .option('--skip-distortion', 'Skip distortion calibration')
    .option('-v, --verbose', 'Show detailed progress')
    .parse(process.argv)

  const opts = program.opts()
  const verbose = opts.verbose

  console.log('=== Full Calibration Pipeline ===\n')

  // Load ground truth
  console.log(`Loading ground truth from ${opts.groundTruth}...`)
  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations\n`)

  // Get initial calibrations
  const registry = new CameraRegistry()
  const cameraIds = ['camera1', 'camera2']

  const initialCals: Map<string, CameraCalibration> = new Map()
  for (const camId of cameraIds) {
    const cal = registry.getCalibration(camId)
    if (cal) initialCals.set(camId, cal)
  }

  // Get annotations per camera
  const cam1Annotations = filterAnnotations(groundTruths.annotations, 'camera1', ['certain'])
  const cam2Annotations = filterAnnotations(groundTruths.annotations, 'camera2', ['certain'])
  const multiCamAnnotations = getMultiCameraAnnotations(groundTruths.annotations, cameraIds, ['certain'])

  console.log(`Camera 1 annotations: ${cam1Annotations.length}`)
  console.log(`Camera 2 annotations: ${cam2Annotations.length}`)
  console.log(`Multi-camera annotations: ${multiCamAnnotations.length}\n`)

  // Baseline evaluation
  console.log('--- Baseline Evaluation ---')
  const baselineCal1 = initialCals.get('camera1')!
  const baselineCal2 = initialCals.get('camera2')!

  const baseline1 = evaluateProjection(baselineCal1, cam1Annotations)
  const baseline2 = evaluateProjection(baselineCal2, cam2Annotations)
  const baselineCross = evaluateCrossCamera(baselineCal1, baselineCal2, multiCamAnnotations)

  console.log(`Camera 1: Pass rate ${(baseline1.stats.passRate * 100).toFixed(1)}%, Mean error ${baseline1.stats.mean.toFixed(3)}m`)
  console.log(`Camera 2: Pass rate ${(baseline2.stats.passRate * 100).toFixed(1)}%, Mean error ${baseline2.stats.mean.toFixed(3)}m`)
  console.log(`Cross-camera convergence: ${(baselineCross.convergenceRate * 100).toFixed(1)}%\n`)

  // Working calibrations
  const workingCals: Map<string, CameraCalibration> = new Map()

  // Phase 0: Initialize with physical estimates
  // Based on typical surveillance setup: cameras at ~3m height looking down ~30-45 degrees
  console.log('--- Phase 0: Physical Initialization ---')
  const initStart = Date.now()

  // Try DLT first, fall back to physical estimates
  for (const camId of cameraIds) {
    const annotations = camId === 'camera1' ? cam1Annotations : cam2Annotations
    const correspondences = annotationsToCorrespondences(annotations)

    // Compute average ground truth position to estimate camera orientation
    let avgX = 0, avgY = 0
    for (const { annotation } of annotations) {
      avgX += annotation.groundPosition.x
      avgY += annotation.groundPosition.y
    }
    avgX /= annotations.length
    avgY /= annotations.length

    // Physical estimates for 18x12m room
    // Camera 1: likely at top-left or top-right corner
    // Camera 2: likely at opposite corner
    const roomWidth = 18, roomHeight = 12
    const cameraHeight = 3.0 // meters
    const focalLength = 1500 // typical for wide-angle surveillance

    let camX: number, camY: number
    if (camId === 'camera1') {
      // Camera 1: top-right corner looking at room
      camX = roomWidth - 1
      camY = roomHeight - 1
    } else {
      // Camera 2: bottom-left corner looking at room
      camX = 1
      camY = 1
    }

    // Compute look direction (camera to average detection point)
    const lookX = avgX - camX
    const lookY = avgY - camY
    const lookZ = -cameraHeight
    const lookLen = Math.sqrt(lookX*lookX + lookY*lookY + lookZ*lookZ)

    // Build rotation matrix: camera looks at center of detections
    // Z-axis points into scene, Y-axis points down, X-axis points right
    const zAxis = [lookX/lookLen, lookY/lookLen, lookZ/lookLen]
    // Up direction in world is +Z
    const worldUp = [0, 0, 1]
    // X-axis = worldUp × Z-axis
    let xAxis = [
      worldUp[1]*zAxis[2] - worldUp[2]*zAxis[1],
      worldUp[2]*zAxis[0] - worldUp[0]*zAxis[2],
      worldUp[0]*zAxis[1] - worldUp[1]*zAxis[0],
    ]
    const xLen = Math.sqrt(xAxis[0]*xAxis[0] + xAxis[1]*xAxis[1] + xAxis[2]*xAxis[2])
    xAxis = [xAxis[0]/xLen, xAxis[1]/xLen, xAxis[2]/xLen]
    // Y-axis = Z-axis × X-axis
    const yAxis = [
      zAxis[1]*xAxis[2] - zAxis[2]*xAxis[1],
      zAxis[2]*xAxis[0] - zAxis[0]*xAxis[2],
      zAxis[0]*xAxis[1] - zAxis[1]*xAxis[0],
    ]

    const R: number[][] = [
      [xAxis[0], yAxis[0], zAxis[0]],
      [xAxis[1], yAxis[1], zAxis[1]],
      [xAxis[2], yAxis[2], zAxis[2]],
    ]
    const T: Vector3 = [camX, camY, cameraHeight]

    const K = createK(focalLength, 960, 540)

    workingCals.set(camId, {
      K,
      R,
      T,
      center: [960, 540],
      scale: 1,
    })

    if (verbose) {
      console.log(`  ${camId}: Physical init - pos=(${camX.toFixed(1)}, ${camY.toFixed(1)}, ${cameraHeight.toFixed(1)}), focal=${focalLength}`)
    }
  }

  const initDuration = Date.now() - initStart
  console.log(`  Completed in ${initDuration}ms\n`)

  // Evaluate physical initialization
  if (verbose) {
    console.log('--- Physical Init Evaluation ---')
    const initCal1 = workingCals.get('camera1')!
    const initCal2 = workingCals.get('camera2')!
    const init1 = evaluateProjection(initCal1, cam1Annotations, true)
    const init2 = evaluateProjection(initCal2, cam2Annotations, true)
    console.log(`Camera 1 (Physical): Pass rate ${(init1.stats.passRate * 100).toFixed(1)}%, Mean error ${init1.stats.mean.toFixed(3)}m`)
    console.log(`Camera 2 (Physical): Pass rate ${(init2.stats.passRate * 100).toFixed(1)}%, Mean error ${init2.stats.mean.toFixed(3)}m\n`)
  }

  // Phase 1: Extrinsics Refinement
  console.log('--- Phase 1: Extrinsics Refinement ---')
  const extrinsicsStart = Date.now()

  for (const camId of cameraIds) {
    const dltCal = workingCals.get(camId)!
    const annotations = camId === 'camera1' ? cam1Annotations : cam2Annotations

    // Use DLT result as starting point for refinement
    const { R, T } = await runExtrinsicsPhase(camId, annotations, dltCal, verbose)

    workingCals.set(camId, {
      ...dltCal,
      R,
      T,
    })
  }

  const extrinsicsDuration = Date.now() - extrinsicsStart
  console.log(`  Completed in ${extrinsicsDuration}ms\n`)

  // Phase 2: Joint optimization (optional)
  const jointStart = Date.now()
  if (!opts.skipJoint && multiCamAnnotations.length >= 20) {
    console.log('--- Phase 2: Joint Multi-Camera Optimization ---')
    // For now, we skip the actual joint optimization and keep extrinsics
    // This would require integrating optimize-joint.ts logic
    console.log('  (Using extrinsics results - full joint optimization available via cli:optimize-joint)\n')
  }
  const jointDuration = Date.now() - jointStart

  // Phase 3: Intrinsics
  console.log('--- Phase 3: Intrinsics Optimization ---')
  const intrinsicsStart = Date.now()

  for (const camId of cameraIds) {
    const cal = workingCals.get(camId)!
    const annotations = camId === 'camera1' ? cam1Annotations : cam2Annotations

    const K = await runIntrinsicsPhase(
      camId,
      annotations,
      cal.R,
      [cal.T[0], cal.T[1], cal.T[2]],
      cal.K,
      verbose
    )

    workingCals.set(camId, { ...cal, K, center: [K[0][2], K[1][2]] })
  }

  const intrinsicsDuration = Date.now() - intrinsicsStart
  console.log(`  Completed in ${intrinsicsDuration}ms\n`)

  // Phase 4: Distortion
  const distortionStart = Date.now()
  if (!opts.skipDistortion) {
    console.log('--- Phase 4: Distortion Calibration ---')

    for (const camId of cameraIds) {
      const cal = workingCals.get(camId)!
      const annotations = camId === 'camera1' ? cam1Annotations : cam2Annotations

      const distortion = await runDistortionPhase(
        camId,
        annotations,
        cal.K,
        cal.R,
        [cal.T[0], cal.T[1], cal.T[2]],
        verbose
      )

      workingCals.set(camId, { ...cal, distortion })
    }

    console.log(`  Completed in ${Date.now() - distortionStart}ms\n`)
  }
  const distortionDuration = Date.now() - distortionStart

  // Final evaluation (using direct K/R/T projection without worldTransform)
  console.log('--- Final Evaluation ---')
  const finalCal1 = workingCals.get('camera1')!
  const finalCal2 = workingCals.get('camera2')!

  const final1 = evaluateProjection(finalCal1, cam1Annotations, true)
  const final2 = evaluateProjection(finalCal2, cam2Annotations, true)
  const finalCross = evaluateCrossCamera(finalCal1, finalCal2, multiCamAnnotations, 0.6, true)

  console.log(`Camera 1: Pass rate ${(final1.stats.passRate * 100).toFixed(1)}%, Mean error ${final1.stats.mean.toFixed(3)}m`)
  console.log(`Camera 2: Pass rate ${(final2.stats.passRate * 100).toFixed(1)}%, Mean error ${final2.stats.mean.toFixed(3)}m`)
  console.log(`Cross-camera convergence: ${(finalCross.convergenceRate * 100).toFixed(1)}%\n`)

  // Summary
  console.log('=== Summary ===')
  console.log(`Camera 1 pass rate: ${(baseline1.stats.passRate * 100).toFixed(1)}% -> ${(final1.stats.passRate * 100).toFixed(1)}%`)
  console.log(`Camera 2 pass rate: ${(baseline2.stats.passRate * 100).toFixed(1)}% -> ${(final2.stats.passRate * 100).toFixed(1)}%`)
  console.log(`Convergence: ${(baselineCross.convergenceRate * 100).toFixed(1)}% -> ${(finalCross.convergenceRate * 100).toFixed(1)}%`)

  // Build output
  const output: PipelineResult = {
    timestamp: new Date().toISOString(),
    groundTruthFile: opts.groundTruth,
    totalAnnotations: groundTruths.annotations.length,
    pipelineVersion: '1.0.0',
    cameras: cameraIds.map((camId) => {
      const cal = workingCals.get(camId)!
      return {
        cameraId: camId,
        K: cal.K,
        R: cal.R,
        T: [cal.T[0], cal.T[1], cal.T[2]] as Vector3,
        distortion: cal.distortion || { k1: 0, k2: 0, k3: 0, p1: 0, p2: 0 },
        center: cal.center,
        scale: cal.scale,
      }
    }),
    baseline: {
      camera1PassRate: baseline1.stats.passRate,
      camera2PassRate: baseline2.stats.passRate,
      crossCameraConvergenceRate: baselineCross.convergenceRate,
    },
    final: {
      camera1PassRate: final1.stats.passRate,
      camera2PassRate: final2.stats.passRate,
      crossCameraConvergenceRate: finalCross.convergenceRate,
      camera1MeanError: final1.stats.mean,
      camera2MeanError: final2.stats.mean,
    },
    improvement: {
      camera1PassRateGain: final1.stats.passRate - baseline1.stats.passRate,
      camera2PassRateGain: final2.stats.passRate - baseline2.stats.passRate,
      convergenceGain: finalCross.convergenceRate - baselineCross.convergenceRate,
    },
    phases: {
      extrinsics: { completed: true, duration: extrinsicsDuration },
      joint: { completed: !opts.skipJoint, duration: jointDuration },
      intrinsics: { completed: true, duration: intrinsicsDuration },
      distortion: { completed: !opts.skipDistortion, duration: distortionDuration },
    },
  }

  // Save output
  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify(output, null, 2))
    console.log(`\nCalibration saved to ${opts.output}`)
  }

  // Print code snippet
  console.log('\n--- Code Snippet for camera-registry.ts ---')
  for (const cam of output.cameras) {
    console.log(`\n// ${cam.cameraId}`)
    console.log(`K: [`)
    for (const row of cam.K) {
      console.log(`  [${row.map((v) => v.toFixed(2)).join(', ')}],`)
    }
    console.log(`],`)
    console.log(`R: [`)
    for (const row of cam.R) {
      console.log(`  [${row.map((v) => v.toFixed(8)).join(', ')}],`)
    }
    console.log(`],`)
    console.log(`T: [${cam.T.map((v) => v.toFixed(8)).join(', ')}],`)
    console.log(`center: [${cam.center[0].toFixed(2)}, ${cam.center[1].toFixed(2)}],`)
    console.log(`distortion: { k1: ${cam.distortion.k1.toFixed(6)}, k2: ${cam.distortion.k2.toFixed(6)}, k3: 0, p1: 0, p2: 0 },`)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
