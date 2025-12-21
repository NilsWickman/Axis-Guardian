#!/usr/bin/env node
/**
 * Sitemap Parameter Sweep Optimization
 *
 * Exhaustive sweep test to find optimal sitemap parameters (camera positions,
 * angles, pillars, tables) against ground truth annotations.
 *
 * Three-phase optimization:
 * 1. Fine grid search across all parameter combinations
 * 2. Nelder-Mead refinement from top 10 candidates
 * 3. Cross-validation to avoid overfitting
 */

import { Command } from 'commander'
import * as fs from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { nelderMead } from './nelder-mead.js'
import {
  loadGroundTruths,
  filterAnnotations,
  computeErrorStats,
  type GroundTruthAnnotation,
} from './utils.js'
import { projectDetectionWithKRT, siteMapConfigToCamera } from '../projection/ground-plane.js'
import type { CameraParams as ProductionCameraParams, CameraCalibration } from '../types.js'
import { CameraRegistry } from '../detection/camera-registry.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================================================
// Types
// ============================================================================

interface SitemapCamera {
  id: string
  name: string
  position: { x: number; y: number }
  azimuth: number
  elevation: number
  height: number
  fieldOfView: number
  resolution: { width: number; height: number }
  distortion: { k1: number; k2: number; p1: number; p2: number }
  color: string
}

interface SitemapObstacle {
  id: string
  type: 'circle' | 'rectangle'
  label: string
  category: string
  position: { x: number; y: number }
  radius?: number
  dimensions?: { width: number; height: number }
  rotation?: number
  height: number
  blocksTracking: boolean
  blocksView: boolean
  color: string
}

interface SitemapConfig {
  dimensions: { width: number; height: number; unit: string }
  walls: any[]
  cameras: SitemapCamera[]
  obstacles: SitemapObstacle[]
}

interface EvaluationResult {
  passRate: number
  meanError: number
  maxError: number
  validCount: number
  totalCount: number
}

interface CameraParams {
  positionX: number
  positionY: number
  azimuth: number
  elevation: number
  height: number
  fieldOfView: number
}

interface SweepResult {
  params: CameraParams
  result: EvaluationResult
}

// ============================================================================
// Helper: Convert sweep params to production CameraParams
// ============================================================================

function toProductionCameraParams(params: CameraParams): ProductionCameraParams {
  return {
    position: {
      x: params.positionX,
      y: params.positionY,
      z: params.height,
    },
    azimuth: params.azimuth,
    elevation: params.elevation,
    fov: params.fieldOfView,
  }
}

// ============================================================================
// Evaluation Functions
// ============================================================================

interface Correspondence {
  imageX: number
  imageY: number
  gtX: number
  gtY: number
  bboxWidth: number
  bboxHeight: number
}

function extractCorrespondences(
  annotations: GroundTruthAnnotation[],
  cameraId: string
): Correspondence[] {
  const correspondences: Correspondence[] = []

  for (const ann of annotations) {
    if (ann.confidence !== 'certain') continue

    for (const det of ann.linkedDetections) {
      if (det.cameraId !== cameraId) continue

      // Bottom-center of bbox in pixels
      const imageX = ((det.bbox.left + det.bbox.right) / 2) * 1920
      const imageY = det.bbox.bottom * 1080
      const bboxWidth = det.bbox.right - det.bbox.left
      const bboxHeight = det.bbox.bottom - det.bbox.top

      correspondences.push({
        imageX,
        imageY,
        gtX: ann.groundPosition.x,
        gtY: ann.groundPosition.y,
        bboxWidth,
        bboxHeight,
      })
    }
  }

  return correspondences
}

/**
 * Evaluate camera parameters using production K/R/T projection
 * This uses the same projection path as the ground truth validation test
 */
function evaluateWithKRT(
  correspondences: Correspondence[],
  calibration: CameraCalibration,
  cameraParams: ProductionCameraParams | null = null
): EvaluationResult {
  let passCount = 0
  let totalError = 0
  let maxError = 0
  let validCount = 0

  for (const { imageX, imageY, gtX, gtY, bboxWidth, bboxHeight } of correspondences) {
    // Create bbox for projectDetectionWithKRT
    const bbox = {
      x: imageX / 1920 - bboxWidth / 2, // Convert center to top-left
      y: imageY / 1080 - bboxHeight,    // Approximate
      width: bboxWidth,
      height: bboxHeight,
    }

    const result = projectDetectionWithKRT(
      bbox,
      calibration,
      cameraParams,
      [],      // no tables for sweep
      true,    // normalized
      1920,
      1080
    )

    if (result.isValid) {
      const error = Math.sqrt(
        (result.worldPoint.x - gtX) ** 2 + (result.worldPoint.y - gtY) ** 2
      )
      totalError += error
      maxError = Math.max(maxError, error)
      if (error < 0.5) passCount++
      validCount++
    }
  }

  return {
    passRate: validCount > 0 ? passCount / validCount : 0,
    meanError: validCount > 0 ? totalError / validCount : Infinity,
    maxError,
    validCount,
    totalCount: correspondences.length,
  }
}

/**
 * Legacy evaluation using direct sitemap parameter projection
 * Kept for reference but not as accurate as K/R/T
 */
function evaluateCameraParams(
  correspondences: Correspondence[],
  params: CameraParams
): EvaluationResult {
  // Use K/R/T derived from sitemap params
  const K = deriveKFromFOV(params.fieldOfView)
  const R = deriveRFromAngles(params.azimuth, params.elevation)
  const T = deriveTFromPosition(R, { x: params.positionX, y: params.positionY }, params.height)

  let passCount = 0
  let totalError = 0
  let maxError = 0
  let validCount = 0

  for (const { imageX, imageY, gtX, gtY } of correspondences) {
    const projected = projectImageToGroundKRT(imageX, imageY, K, R, T)
    if (projected.valid) {
      const error = Math.sqrt(
        (projected.x - gtX) ** 2 + (projected.y - gtY) ** 2
      )
      totalError += error
      maxError = Math.max(maxError, error)
      if (error < 0.5) passCount++
      validCount++
    }
  }

  return {
    passRate: validCount > 0 ? passCount / validCount : 0,
    meanError: validCount > 0 ? totalError / validCount : Infinity,
    maxError,
    validCount,
    totalCount: correspondences.length,
  }
}

// K/R/T derivation functions for sitemap params
function deriveKFromFOV(fov: number, width: number = 1920, height: number = 1080): number[][] {
  const fovRad = (fov * Math.PI) / 180
  const f = width / 2 / Math.tan(fovRad / 2)
  return [
    [f, 0, width / 2],
    [0, f, height / 2],
    [0, 0, 1],
  ]
}

function deriveRFromAngles(azimuth: number, elevation: number): number[][] {
  const azRad = (azimuth * Math.PI) / 180
  const elRad = (elevation * Math.PI) / 180
  const cosEl = Math.cos(elRad)
  const sinEl = Math.sin(elRad)

  const lookDir = [Math.sin(azRad) * cosEl, Math.cos(azRad) * cosEl, -sinEl]
  const worldUp = [0, 0, 1]

  const right = [
    worldUp[1] * lookDir[2] - worldUp[2] * lookDir[1],
    worldUp[2] * lookDir[0] - worldUp[0] * lookDir[2],
    worldUp[0] * lookDir[1] - worldUp[1] * lookDir[0],
  ]
  const rightLen = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2)
  right[0] /= rightLen; right[1] /= rightLen; right[2] /= rightLen

  const down = [
    lookDir[1] * right[2] - lookDir[2] * right[1],
    lookDir[2] * right[0] - lookDir[0] * right[2],
    lookDir[0] * right[1] - lookDir[1] * right[0],
  ]
  const downLen = Math.sqrt(down[0] ** 2 + down[1] ** 2 + down[2] ** 2)
  down[0] /= downLen; down[1] /= downLen; down[2] /= downLen

  return [
    [right[0], right[1], right[2]],
    [down[0], down[1], down[2]],
    [lookDir[0], lookDir[1], lookDir[2]],
  ]
}

function deriveTFromPosition(R: number[][], position: { x: number; y: number }, height: number): number[] {
  const P = [position.x, position.y, height]
  return [
    -(R[0][0] * P[0] + R[0][1] * P[1] + R[0][2] * P[2]),
    -(R[1][0] * P[0] + R[1][1] * P[1] + R[1][2] * P[2]),
    -(R[2][0] * P[0] + R[2][1] * P[1] + R[2][2] * P[2]),
  ]
}

function projectImageToGroundKRT(u: number, v: number, K: number[][], R: number[][], T: number[]): { x: number; y: number; valid: boolean } {
  const fx = K[0][0], fy = K[1][1], cx = K[0][2], cy = K[1][2]
  const x_norm = (u - cx) / fx
  const y_norm = (v - cy) / fy
  const ray_cam = [x_norm, y_norm, 1]

  const ray_world = [
    R[0][0] * ray_cam[0] + R[1][0] * ray_cam[1] + R[2][0] * ray_cam[2],
    R[0][1] * ray_cam[0] + R[1][1] * ray_cam[1] + R[2][1] * ray_cam[2],
    R[0][2] * ray_cam[0] + R[1][2] * ray_cam[1] + R[2][2] * ray_cam[2],
  ]

  const cam_world = [
    -(R[0][0] * T[0] + R[1][0] * T[1] + R[2][0] * T[2]),
    -(R[0][1] * T[0] + R[1][1] * T[1] + R[2][1] * T[2]),
    -(R[0][2] * T[0] + R[1][2] * T[1] + R[2][2] * T[2]),
  ]

  if (Math.abs(ray_world[2]) < 1e-6) return { x: 0, y: 0, valid: false }
  const t = -cam_world[2] / ray_world[2]
  if (t < 0) return { x: 0, y: 0, valid: false }

  return { x: cam_world[0] + t * ray_world[0], y: cam_world[1] + t * ray_world[1], valid: true }
}

// ============================================================================
// Grid Search
// ============================================================================

function generateRange(center: number, range: number, step: number): number[] {
  const values: number[] = []
  for (let v = center - range; v <= center + range + step / 2; v += step) {
    values.push(v)
  }
  return values
}

function* gridSearchGenerator(
  baseParams: CameraParams,
  ranges: {
    positionX: { range: number; step: number }
    positionY: { range: number; step: number }
    azimuth: { range: number; step: number }
    elevation: { range: number; step: number }
    height: { range: number; step: number }
    fieldOfView: { range: number; step: number }
  }
): Generator<CameraParams> {
  // Generate value arrays
  const posXValues = generateRange(baseParams.positionX, ranges.positionX.range, ranges.positionX.step)
  const posYValues = generateRange(baseParams.positionY, ranges.positionY.range, ranges.positionY.step)
  const azValues = generateRange(baseParams.azimuth, ranges.azimuth.range, ranges.azimuth.step)
  const elValues = generateRange(baseParams.elevation, ranges.elevation.range, ranges.elevation.step)
  const heightValues = generateRange(baseParams.height, ranges.height.range, ranges.height.step)
  const fovValues = generateRange(baseParams.fieldOfView, ranges.fieldOfView.range, ranges.fieldOfView.step)

  // Prioritized sweep: azimuth and elevation first (most impact), then position, then height/FOV
  for (const azimuth of azValues) {
    for (const elevation of elValues) {
      for (const positionX of posXValues) {
        for (const positionY of posYValues) {
          for (const height of heightValues) {
            for (const fieldOfView of fovValues) {
              yield {
                positionX,
                positionY,
                azimuth,
                elevation,
                height,
                fieldOfView,
              }
            }
          }
        }
      }
    }
  }
}

async function sweepCameraGrid(
  correspondences: Correspondence[],
  baseParams: CameraParams,
  options: { quick?: boolean; verbose?: boolean } = {}
): Promise<SweepResult[]> {
  const ranges = options.quick
    ? {
        positionX: { range: 1.0, step: 0.5 },
        positionY: { range: 1.0, step: 0.5 },
        azimuth: { range: 10, step: 5 },
        elevation: { range: 10, step: 5 },
        height: { range: 0.2, step: 0.2 },
        fieldOfView: { range: 10, step: 10 },
      }
    : {
        positionX: { range: 2.0, step: 0.25 },
        positionY: { range: 2.0, step: 0.25 },
        azimuth: { range: 15, step: 2 },
        elevation: { range: 15, step: 2 },
        height: { range: 0.3, step: 0.1 },
        fieldOfView: { range: 15, step: 3 },
      }

  const results: SweepResult[] = []
  let count = 0
  let bestPassRate = 0

  const generator = gridSearchGenerator(baseParams, ranges)

  for (const params of generator) {
    const result = evaluateCameraParams(correspondences, params)
    results.push({ params, result })

    if (result.passRate > bestPassRate) {
      bestPassRate = result.passRate
      if (options.verbose) {
        console.log(
          `  New best: ${(result.passRate * 100).toFixed(1)}% @ az=${params.azimuth.toFixed(1)}°, el=${params.elevation.toFixed(1)}°, pos=(${params.positionX.toFixed(2)}, ${params.positionY.toFixed(2)})`
        )
      }
    }

    count++
    if (count % 1000 === 0 && options.verbose) {
      process.stdout.write(`\r  Tested ${count} combinations...`)
    }
  }

  if (options.verbose) {
    console.log(`\r  Tested ${count} combinations total`)
  }

  // Sort by pass rate descending, then by mean error ascending
  results.sort((a, b) => {
    if (b.result.passRate !== a.result.passRate) {
      return b.result.passRate - a.result.passRate
    }
    return a.result.meanError - b.result.meanError
  })

  return results
}

// ============================================================================
// Nelder-Mead Refinement
// ============================================================================

function refineWithNelderMead(
  correspondences: Correspondence[],
  initialParams: CameraParams,
  verbose: boolean = false
): { params: CameraParams; result: EvaluationResult } {
  // Parameter vector: [posX, posY, azimuth, elevation, height, fov]
  const initial = [
    initialParams.positionX,
    initialParams.positionY,
    initialParams.azimuth,
    initialParams.elevation,
    initialParams.height,
    initialParams.fieldOfView,
  ]

  // Objective: minimize negative pass rate + small penalty for mean error
  const objective = (x: number[]): number => {
    const params: CameraParams = {
      positionX: x[0],
      positionY: x[1],
      azimuth: x[2],
      elevation: x[3],
      height: x[4],
      fieldOfView: x[5],
    }

    const result = evaluateCameraParams(correspondences, params)

    // Penalize invalid configurations
    if (result.validCount < correspondences.length * 0.5) {
      return 1000
    }

    // Primary: maximize pass rate, secondary: minimize mean error
    return -result.passRate + result.meanError * 0.01
  }

  const optimized = nelderMead(objective, initial, {
    maxIterations: 500,
    tolerance: 1e-6,
  })

  const finalParams: CameraParams = {
    positionX: optimized.params[0],
    positionY: optimized.params[1],
    azimuth: optimized.params[2],
    elevation: optimized.params[3],
    height: optimized.params[4],
    fieldOfView: optimized.params[5],
  }

  const finalResult = evaluateCameraParams(correspondences, finalParams)

  if (verbose) {
    console.log(
      `  Refined: ${(finalResult.passRate * 100).toFixed(1)}% (${finalResult.meanError.toFixed(3)}m avg)`
    )
  }

  return { params: finalParams, result: finalResult }
}

// ============================================================================
// Cross-Validation
// ============================================================================

function crossValidate(
  annotations: GroundTruthAnnotation[],
  cameraId: string,
  params: CameraParams,
  folds: number = 5
): { meanPassRate: number; stdPassRate: number; passRates: number[] } {
  const correspondences = extractCorrespondences(annotations, cameraId)
  const shuffled = [...correspondences].sort(() => Math.random() - 0.5)
  const foldSize = Math.floor(shuffled.length / folds)

  const passRates: number[] = []

  for (let i = 0; i < folds; i++) {
    const testStart = i * foldSize
    const testEnd = i === folds - 1 ? shuffled.length : (i + 1) * foldSize
    const testSet = shuffled.slice(testStart, testEnd)

    const result = evaluateCameraParams(testSet, params)
    passRates.push(result.passRate)
  }

  const mean = passRates.reduce((a, b) => a + b, 0) / passRates.length
  const variance = passRates.reduce((acc, r) => acc + (r - mean) ** 2, 0) / passRates.length
  const std = Math.sqrt(variance)

  return { meanPassRate: mean, stdPassRate: std, passRates }
}

// ============================================================================
// Main Sweep Function
// ============================================================================

async function runSweep(options: {
  sitemapPath: string
  groundTruthPath: string
  outputPath: string
  camerasOnly?: boolean
  obstaclesOnly?: boolean
  camera?: string
  quick?: boolean
  verbose?: boolean
}): Promise<void> {
  console.log('Sitemap Parameter Sweep Optimization')
  console.log('====================================\n')

  // Load sitemap
  const sitemapContent = await fs.readFile(options.sitemapPath, 'utf-8')
  const sitemap: SitemapConfig = JSON.parse(sitemapContent)

  // Load ground truths
  const groundTruths = await loadGroundTruths(options.groundTruthPath)
  console.log(`Ground Truth: ${groundTruths.annotations.length} annotations loaded`)

  // Evaluate current configuration
  const cameras = options.camera
    ? sitemap.cameras.filter((c) => c.id === options.camera)
    : sitemap.cameras

  const originalResults: Map<string, EvaluationResult> = new Map()
  const optimizedParams: Map<string, CameraParams> = new Map()
  const optimizedResults: Map<string, EvaluationResult> = new Map()

  // Initialize camera registry for K/R/T calibration
  const cameraRegistry = new CameraRegistry()

  for (const camera of cameras) {
    console.log(`\n--- Camera: ${camera.id} (${camera.name}) ---`)

    const correspondences = extractCorrespondences(groundTruths.annotations, camera.id)
    console.log(`  Correspondences: ${correspondences.length}`)

    const baseParams: CameraParams = {
      positionX: camera.position.x,
      positionY: camera.position.y,
      azimuth: camera.azimuth,
      elevation: camera.elevation,
      height: camera.height,
      fieldOfView: camera.fieldOfView,
    }

    // Evaluate with production K/R/T calibration (if available)
    const krtCalibration = cameraRegistry.getCalibration(camera.id)
    if (krtCalibration) {
      const krtResult = evaluateWithKRT(correspondences, krtCalibration, null)
      console.log(
        `  Production K/R/T: ${(krtResult.passRate * 100).toFixed(1)}% pass rate, ${krtResult.meanError.toFixed(3)}m avg error`
      )
    }

    // Evaluate with sitemap-derived K/R/T
    const originalResult = evaluateCameraParams(correspondences, baseParams)
    originalResults.set(camera.id, originalResult)
    console.log(
      `  Sitemap-derived: ${(originalResult.passRate * 100).toFixed(1)}% pass rate, ${originalResult.meanError.toFixed(3)}m avg error`
    )

    if (options.obstaclesOnly) {
      optimizedParams.set(camera.id, baseParams)
      optimizedResults.set(camera.id, originalResult)
      continue
    }

    // Phase 1: Grid Search
    console.log(`\n  Phase 1: Grid Search...`)
    const gridResults = await sweepCameraGrid(correspondences, baseParams, {
      quick: options.quick,
      verbose: options.verbose,
    })

    const topCandidates = gridResults.slice(0, 10)
    console.log(
      `  Top candidate: ${(topCandidates[0].result.passRate * 100).toFixed(1)}% @ az=${topCandidates[0].params.azimuth.toFixed(1)}°, el=${topCandidates[0].params.elevation.toFixed(1)}°`
    )

    // Phase 2: Nelder-Mead Refinement
    console.log(`\n  Phase 2: Nelder-Mead Refinement...`)
    let bestRefinedParams = topCandidates[0].params
    let bestRefinedResult = topCandidates[0].result

    for (let i = 0; i < Math.min(3, topCandidates.length); i++) {
      const refined = refineWithNelderMead(
        correspondences,
        topCandidates[i].params,
        options.verbose
      )
      if (refined.result.passRate > bestRefinedResult.passRate) {
        bestRefinedParams = refined.params
        bestRefinedResult = refined.result
      }
    }

    // Phase 3: Cross-Validation
    console.log(`\n  Phase 3: Cross-Validation (5-fold)...`)
    const cvResult = crossValidate(groundTruths.annotations, camera.id, bestRefinedParams, 5)
    console.log(
      `  CV Pass Rate: ${(cvResult.meanPassRate * 100).toFixed(1)}% +/- ${(cvResult.stdPassRate * 100).toFixed(1)}%`
    )

    optimizedParams.set(camera.id, bestRefinedParams)
    optimizedResults.set(camera.id, bestRefinedResult)
  }

  // Summary
  console.log('\n========================================')
  console.log('SUMMARY')
  console.log('========================================\n')

  for (const camera of cameras) {
    const original = originalResults.get(camera.id)!
    const optimized = optimizedResults.get(camera.id)!
    const params = optimizedParams.get(camera.id)!

    console.log(`${camera.id}:`)
    console.log(
      `  Original:  ${(original.passRate * 100).toFixed(1)}% pass, ${original.meanError.toFixed(3)}m avg`
    )
    console.log(
      `  Optimized: ${(optimized.passRate * 100).toFixed(1)}% pass, ${optimized.meanError.toFixed(3)}m avg`
    )
    console.log(
      `  Improvement: ${((optimized.passRate - original.passRate) * 100).toFixed(1)}pp`
    )
    console.log(`  Parameters:`)
    console.log(`    position: (${params.positionX.toFixed(3)}, ${params.positionY.toFixed(3)})`)
    console.log(`    azimuth: ${params.azimuth.toFixed(2)}°`)
    console.log(`    elevation: ${params.elevation.toFixed(2)}°`)
    console.log(`    height: ${params.height.toFixed(3)}m`)
    console.log(`    FOV: ${params.fieldOfView.toFixed(2)}°`)
    console.log()
  }

  // Generate optimized sitemap
  const optimizedSitemap = JSON.parse(JSON.stringify(sitemap))
  for (const camera of optimizedSitemap.cameras) {
    const params = optimizedParams.get(camera.id)
    if (params) {
      camera.position.x = Number(params.positionX.toFixed(4))
      camera.position.y = Number(params.positionY.toFixed(4))
      camera.azimuth = Number(params.azimuth.toFixed(2))
      camera.elevation = Number(params.elevation.toFixed(2))
      camera.height = Number(params.height.toFixed(4))
      camera.fieldOfView = Number(params.fieldOfView.toFixed(2))
    }
  }

  await fs.writeFile(options.outputPath, JSON.stringify(optimizedSitemap, null, 2))
  console.log(`Optimized sitemap saved to: ${options.outputPath}`)
}

// ============================================================================
// CLI
// ============================================================================

const program = new Command()
  .name('sweep-sitemap-params')
  .description('Sweep sitemap parameters to optimize projection accuracy')
  .option(
    '-s, --sitemap <path>',
    'Path to sitemap JSON',
    join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
  )
  .option(
    '-g, --ground-truth <path>',
    'Path to ground truth JSON',
    join(__dirname, '../../../GroundTruths.json')
  )
  .option(
    '-o, --output <path>',
    'Output path for optimized sitemap',
    join(__dirname, '../../../optimized-sitemap.json')
  )
  .option('--cameras-only', 'Only sweep camera parameters')
  .option('--obstacles-only', 'Only sweep obstacle parameters')
  .option('--camera <id>', 'Only sweep specific camera')
  .option('--quick', 'Quick mode with fewer iterations')
  .option('-v, --verbose', 'Verbose output')
  .action(async (opts) => {
    try {
      await runSweep({
        sitemapPath: opts.sitemap,
        groundTruthPath: opts.groundTruth,
        outputPath: opts.output,
        camerasOnly: opts.camerasOnly,
        obstaclesOnly: opts.obstaclesOnly,
        camera: opts.camera,
        quick: opts.quick,
        verbose: opts.verbose,
      })
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
