/**
 * Calibration Parameter Sweep
 *
 * Sweeps K matrix (focal length) and lens distortion parameters to optimize
 * projection accuracy against ground truth data.
 *
 * Uses k-fold cross-validation to prevent overfitting.
 *
 * Usage:
 *   npx tsx tests/calibration-sweep.ts
 *   npx tsx tests/calibration-sweep.ts --camera camera1
 *   npx tsx tests/calibration-sweep.ts --verbose
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackManager } from '../src/tracks/track-manager.js'
import { DetectionProcessor } from '../src/detection/detection-processor.js'
import { CameraRegistry, CAMERA_BIAS_CORRECTIONS } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'
import type { CameraParams, Point2D, DistortionCoeffs, CameraCalibration } from '../src/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================================================
// Types
// ============================================================================

interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: { left: number; top: number; right: number; bottom: number }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: 'certain' | 'estimated' | 'uncertain'
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  version: string
  room: { width: number; height: number }
  cameras: Array<{ cameraId: string; videoFile: string; detectionsFile: string }>
  annotations: Annotation[]
}

interface SweepParams {
  camera1FocalDelta: number
  camera2FocalDelta: number
  k1: number
  k2: number
  p1: number
  p2: number
}

interface EvalResult {
  passRate: number
  avgError: number
  maxError: number
  passCount: number
  totalCount: number
  errors: number[]
}

interface CrossValResult {
  params: SweepParams
  trainPassRate: number
  testPassRate: number
  trainAvgError: number
  testAvgError: number
  overfit: number
}

// ============================================================================
// Globals for parameter injection
// ============================================================================

// These will be dynamically injected into the camera registry
let FOCAL_LENGTH_OVERRIDES: Record<string, number> = {}
let DISTORTION_OVERRIDES: DistortionCoeffs = { k1: 0, k2: 0, k3: 0, p1: 0, p2: 0 }

// Base focal lengths from camera-registry.ts
const BASE_FOCAL_LENGTHS: Record<string, number> = {
  camera1: 1480,
  camera2: 2350,
}

// ============================================================================
// Helpers
// ============================================================================

function distance(p1: Point2D, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function convertBbox(det: LinkedDetection) {
  return {
    x: det.bbox.left,
    y: det.bbox.top,
    width: det.bbox.right - det.bbox.left,
    height: det.bbox.bottom - det.bbox.top,
  }
}

function shuffleArray<T>(array: T[], seed: number = 42): T[] {
  const result = [...array]
  let m = result.length
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  while (m) {
    const i = Math.floor(random() * m--)
    ;[result[m], result[i]] = [result[i], result[m]]
  }
  return result
}

function kFoldSplit<T>(data: T[], k: number, foldIndex: number): { train: T[]; test: T[] } {
  const foldSize = Math.ceil(data.length / k)
  const start = foldIndex * foldSize
  const end = Math.min(start + foldSize, data.length)
  return {
    test: data.slice(start, end),
    train: [...data.slice(0, start), ...data.slice(end)],
  }
}

// ============================================================================
// Modified CameraRegistry that uses overridden calibration
// ============================================================================

class ModifiedCameraRegistry extends CameraRegistry {
  getCalibration(cameraId: string): CameraCalibration | undefined {
    const baseCalib = super.getCalibration(cameraId)
    if (!baseCalib) return undefined

    // Apply focal length override
    const normalizedId = this.normalizeCameraId(cameraId)
    const focalOverride = FOCAL_LENGTH_OVERRIDES[normalizedId]

    // Deep copy and modify
    const modifiedCalib: CameraCalibration = {
      ...baseCalib,
      K: baseCalib.K.map(row => [...row]) as [[number, number, number], [number, number, number], [number, number, number]],
      distortion: { ...DISTORTION_OVERRIDES },
    }

    // Apply focal length override
    if (focalOverride !== undefined) {
      modifiedCalib.K[0][0] = focalOverride
      modifiedCalib.K[1][1] = focalOverride
    }

    return modifiedCalib
  }
}

// ============================================================================
// Evaluation
// ============================================================================

function evaluateParams(
  annotations: Annotation[],
  sitemapConfig: ReturnType<typeof loadSiteMapConfig>,
  params: SweepParams
): EvalResult {
  // Set global overrides
  FOCAL_LENGTH_OVERRIDES = {
    camera1: BASE_FOCAL_LENGTHS.camera1 + params.camera1FocalDelta,
    camera2: BASE_FOCAL_LENGTHS.camera2 + params.camera2FocalDelta,
  }
  DISTORTION_OVERRIDES = {
    k1: params.k1,
    k2: params.k2,
    k3: 0,
    p1: params.p1,
    p2: params.p2,
  }

  // Create components with modified registry
  const cameraRegistry = new ModifiedCameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  let mockTime = 1000
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => {
      let id = 0
      return () => `global-${++id}`
    })(),
  })
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

  const errors: number[] = []
  let passCount = 0

  for (const annotation of annotations) {
    trackManager.clearAllTracks()
    detectionProcessor.resetFrameTracking()
    mockTime = Math.floor(annotation.timestamp * 1000) + 1000

    // Process all detections for this annotation
    for (const det of annotation.linkedDetections) {
      const bbox = convertBbox(det)
      detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
      mockTime += 10
    }

    // Get the final position
    const activeTracks = trackManager.getAllActiveTracks()
    if (activeTracks.length === 0) {
      errors.push(10) // Penalty for no projection
      continue
    }

    // Smart camera selection (same as ground-truth-validation.test.ts)
    let finalPosition: Point2D
    if (activeTracks.length === 1) {
      finalPosition = activeTracks[0].currentPosition
    } else {
      const cam1Track = activeTracks.find(t => t.cameraAssociations.has('camera1'))
      const cam2Track = activeTracks.find(t => t.cameraAssociations.has('camera2'))

      if (cam1Track && cam2Track) {
        const dist = distance(cam1Track.currentPosition, cam2Track.currentPosition)
        if (dist > 0.6) {
          finalPosition = cam1Track.currentPosition
        } else {
          const w1 = 1.2, w2 = 0.8
          finalPosition = {
            x: (cam1Track.currentPosition.x * w1 + cam2Track.currentPosition.x * w2) / (w1 + w2),
            y: (cam1Track.currentPosition.y * w1 + cam2Track.currentPosition.y * w2) / (w1 + w2),
          }
        }
      } else {
        finalPosition = (cam1Track || cam2Track || activeTracks[0]).currentPosition
      }
    }

    const error = distance(finalPosition, annotation.groundPosition)
    errors.push(error)
    if (error < 0.5) passCount++
  }

  if (errors.length === 0) {
    return { passRate: 0, avgError: Infinity, maxError: Infinity, passCount: 0, totalCount: 0, errors: [] }
  }

  return {
    passRate: passCount / errors.length,
    avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
    maxError: Math.max(...errors),
    passCount,
    totalCount: errors.length,
    errors,
  }
}

function crossValidate(
  allAnnotations: Annotation[],
  sitemapConfig: ReturnType<typeof loadSiteMapConfig>,
  params: SweepParams,
  kFolds: number = 5
): CrossValResult {
  const shuffled = shuffleArray(allAnnotations)

  let totalTrainPass = 0, totalTrainCount = 0
  let totalTestPass = 0, totalTestCount = 0
  let totalTrainError = 0, totalTestError = 0

  for (let fold = 0; fold < kFolds; fold++) {
    const { train, test } = kFoldSplit(shuffled, kFolds, fold)

    const trainResult = evaluateParams(train, sitemapConfig, params)
    const testResult = evaluateParams(test, sitemapConfig, params)

    totalTrainPass += trainResult.passCount
    totalTrainCount += train.length
    totalTestPass += testResult.passCount
    totalTestCount += test.length
    totalTrainError += trainResult.avgError * train.length
    totalTestError += testResult.avgError * test.length
  }

  const trainPassRate = totalTrainPass / totalTrainCount
  const testPassRate = totalTestPass / totalTestCount
  const trainAvgError = totalTrainError / totalTrainCount
  const testAvgError = totalTestError / totalTestCount

  return {
    params,
    trainPassRate,
    testPassRate,
    trainAvgError,
    testAvgError,
    overfit: trainPassRate - testPassRate,
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose')
  const quick = args.includes('--quick')

  console.log('=' .repeat(70))
  console.log('CALIBRATION PARAMETER SWEEP (using actual DetectionProcessor)')
  console.log('=' .repeat(70))

  // Load data
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const groundTruth: GroundTruthDataset = JSON.parse(readFileSync(groundTruthPath, 'utf-8'))

  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  const certainAnnotations = groundTruth.annotations.filter(a => a.confidence === 'certain')

  console.log(`\nLoaded ${groundTruth.annotations.length} annotations`)
  console.log(`Certain annotations: ${certainAnnotations.length}`)

  // Baseline evaluation
  console.log('\n' + '-'.repeat(70))
  console.log('BASELINE (current parameters)')
  console.log('-'.repeat(70))

  const baselineParams: SweepParams = {
    camera1FocalDelta: 0,
    camera2FocalDelta: 0,
    k1: 0, k2: 0, p1: 0, p2: 0,
  }

  const baseline = evaluateParams(certainAnnotations, sitemapConfig, baselineParams)
  console.log(`Pass rate: ${(baseline.passRate * 100).toFixed(1)}% (${baseline.passCount}/${baseline.totalCount})`)
  console.log(`Avg error: ${baseline.avgError.toFixed(3)}m`)
  console.log(`Max error: ${baseline.maxError.toFixed(3)}m`)

  // Cross-validate baseline
  console.log('\nCross-validation (5-fold):')
  const baselineCV = crossValidate(certainAnnotations, sitemapConfig, baselineParams)
  console.log(`  Train: ${(baselineCV.trainPassRate * 100).toFixed(1)}%`)
  console.log(`  Test:  ${(baselineCV.testPassRate * 100).toFixed(1)}%`)
  console.log(`  Overfit: ${(baselineCV.overfit * 100).toFixed(1)}%`)

  // PHASE 1: Focal Length Sweep for each camera
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 1: FOCAL LENGTH SWEEP')
  console.log('='.repeat(70))

  let bestCam1Delta = 0
  let bestCam2Delta = 0
  let bestFocalPassRate = baseline.passRate

  // Sweep camera1
  console.log('\nSweeping camera1 focal length...')
  const cam1Deltas = quick ? [-100, -50, 0, 50, 100] : [-200, -150, -100, -50, 0, 50, 100, 150, 200]

  for (const delta of cam1Deltas) {
    const params: SweepParams = { ...baselineParams, camera1FocalDelta: delta }
    const result = evaluateParams(certainAnnotations, sitemapConfig, params)
    const marker = result.passRate > bestFocalPassRate ? ' *BEST*' : ''
    if (verbose || result.passRate > bestFocalPassRate) {
      console.log(`  cam1 delta=${delta}: ${(result.passRate * 100).toFixed(1)}%, err=${result.avgError.toFixed(3)}m${marker}`)
    }
    if (result.passRate > bestFocalPassRate) {
      bestCam1Delta = delta
      bestFocalPassRate = result.passRate
    }
  }

  // Sweep camera2
  console.log('\nSweeping camera2 focal length...')
  const cam2Deltas = quick ? [-100, -50, 0, 50, 100] : [-200, -150, -100, -50, 0, 50, 100, 150, 200]

  for (const delta of cam2Deltas) {
    const params: SweepParams = { ...baselineParams, camera1FocalDelta: bestCam1Delta, camera2FocalDelta: delta }
    const result = evaluateParams(certainAnnotations, sitemapConfig, params)
    const marker = result.passRate > bestFocalPassRate ? ' *BEST*' : ''
    if (verbose || result.passRate > bestFocalPassRate) {
      console.log(`  cam2 delta=${delta}: ${(result.passRate * 100).toFixed(1)}%, err=${result.avgError.toFixed(3)}m${marker}`)
    }
    if (result.passRate > bestFocalPassRate) {
      bestCam2Delta = delta
      bestFocalPassRate = result.passRate
    }
  }

  console.log(`\nBest focal length configuration:`)
  console.log(`  camera1: ${BASE_FOCAL_LENGTHS.camera1} + ${bestCam1Delta} = ${BASE_FOCAL_LENGTHS.camera1 + bestCam1Delta}`)
  console.log(`  camera2: ${BASE_FOCAL_LENGTHS.camera2} + ${bestCam2Delta} = ${BASE_FOCAL_LENGTHS.camera2 + bestCam2Delta}`)
  console.log(`  Pass rate: ${(bestFocalPassRate * 100).toFixed(1)}%`)

  // Fine-tune focal lengths
  if (!quick) {
    console.log('\nFine-tuning focal lengths...')
    const fineDeltas = [-30, -20, -10, 0, 10, 20, 30]

    for (const d1 of fineDeltas) {
      for (const d2 of fineDeltas) {
        const params: SweepParams = {
          ...baselineParams,
          camera1FocalDelta: bestCam1Delta + d1,
          camera2FocalDelta: bestCam2Delta + d2,
        }
        const result = evaluateParams(certainAnnotations, sitemapConfig, params)
        if (result.passRate > bestFocalPassRate) {
          bestCam1Delta += d1
          bestCam2Delta += d2
          bestFocalPassRate = result.passRate
          console.log(`  New best: cam1=${BASE_FOCAL_LENGTHS.camera1 + bestCam1Delta}, cam2=${BASE_FOCAL_LENGTHS.camera2 + bestCam2Delta}, pass=${(result.passRate * 100).toFixed(1)}%`)
        }
      }
    }
  }

  // PHASE 2: Lens Distortion Sweep
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 2: LENS DISTORTION SWEEP')
  console.log('='.repeat(70))

  let bestK1 = 0, bestK2 = 0, bestP1 = 0, bestP2 = 0
  let bestDistortionPassRate = bestFocalPassRate

  // Coarse sweep of k1, k2
  console.log('\nCoarse sweep of radial distortion (k1, k2)...')
  const k1Values = quick ? [-0.1, 0, 0.1] : [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]
  const k2Values = quick ? [-0.05, 0, 0.05] : [-0.1, -0.05, 0, 0.05, 0.1]

  for (const k1 of k1Values) {
    for (const k2 of k2Values) {
      const params: SweepParams = {
        camera1FocalDelta: bestCam1Delta,
        camera2FocalDelta: bestCam2Delta,
        k1, k2, p1: 0, p2: 0,
      }
      const result = evaluateParams(certainAnnotations, sitemapConfig, params)
      if (result.passRate > bestDistortionPassRate) {
        bestK1 = k1
        bestK2 = k2
        bestDistortionPassRate = result.passRate
        console.log(`  k1=${k1.toFixed(2)}, k2=${k2.toFixed(2)}: ${(result.passRate * 100).toFixed(1)}% *BEST*`)
      } else if (verbose) {
        console.log(`  k1=${k1.toFixed(2)}, k2=${k2.toFixed(2)}: ${(result.passRate * 100).toFixed(1)}%`)
      }
    }
  }

  // Sweep tangential distortion (p1, p2)
  console.log('\nSweeping tangential distortion (p1, p2)...')
  const pValues = quick ? [-0.01, 0, 0.01] : [-0.02, -0.01, 0, 0.01, 0.02]

  for (const p1 of pValues) {
    for (const p2 of pValues) {
      const params: SweepParams = {
        camera1FocalDelta: bestCam1Delta,
        camera2FocalDelta: bestCam2Delta,
        k1: bestK1, k2: bestK2, p1, p2,
      }
      const result = evaluateParams(certainAnnotations, sitemapConfig, params)
      if (result.passRate > bestDistortionPassRate) {
        bestP1 = p1
        bestP2 = p2
        bestDistortionPassRate = result.passRate
        console.log(`  p1=${p1.toFixed(3)}, p2=${p2.toFixed(3)}: ${(result.passRate * 100).toFixed(1)}% *BEST*`)
      }
    }
  }

  // PHASE 3: Cross-validation of best parameters
  console.log('\n' + '='.repeat(70))
  console.log('PHASE 3: CROSS-VALIDATION')
  console.log('='.repeat(70))

  const bestParams: SweepParams = {
    camera1FocalDelta: bestCam1Delta,
    camera2FocalDelta: bestCam2Delta,
    k1: bestK1,
    k2: bestK2,
    p1: bestP1,
    p2: bestP2,
  }

  console.log('\nBest parameters found:')
  console.log(`  camera1 focal: ${BASE_FOCAL_LENGTHS.camera1 + bestCam1Delta}`)
  console.log(`  camera2 focal: ${BASE_FOCAL_LENGTHS.camera2 + bestCam2Delta}`)
  console.log(`  k1: ${bestK1.toFixed(3)}`)
  console.log(`  k2: ${bestK2.toFixed(3)}`)
  console.log(`  p1: ${bestP1.toFixed(4)}`)
  console.log(`  p2: ${bestP2.toFixed(4)}`)

  const bestCV = crossValidate(certainAnnotations, sitemapConfig, bestParams)
  console.log('\nCross-validation (5-fold):')
  console.log(`  Train pass rate: ${(bestCV.trainPassRate * 100).toFixed(1)}%`)
  console.log(`  Test pass rate:  ${(bestCV.testPassRate * 100).toFixed(1)}%`)
  console.log(`  Train avg error: ${bestCV.trainAvgError.toFixed(3)}m`)
  console.log(`  Test avg error:  ${bestCV.testAvgError.toFixed(3)}m`)
  console.log(`  Overfit margin:  ${(bestCV.overfit * 100).toFixed(1)}%`)

  // FINAL REPORT
  console.log('\n' + '='.repeat(70))
  console.log('FINAL REPORT')
  console.log('='.repeat(70))

  const finalResult = evaluateParams(certainAnnotations, sitemapConfig, bestParams)

  console.log('\nBaseline:')
  console.log(`  Pass rate: ${(baseline.passRate * 100).toFixed(1)}%`)
  console.log(`  Avg error: ${baseline.avgError.toFixed(3)}m`)

  console.log('\nOptimized:')
  console.log(`  Pass rate: ${(finalResult.passRate * 100).toFixed(1)}%`)
  console.log(`  Avg error: ${finalResult.avgError.toFixed(3)}m`)
  console.log(`  Improvement: ${((finalResult.passRate - baseline.passRate) * 100).toFixed(1)}%`)

  console.log('\nCross-validated (test set):')
  console.log(`  Pass rate: ${(bestCV.testPassRate * 100).toFixed(1)}%`)
  console.log(`  Avg error: ${bestCV.testAvgError.toFixed(3)}m`)

  // Warning about overfitting
  if (bestCV.overfit > 0.05) {
    console.log('\n⚠️  WARNING: Significant overfitting detected!')
    console.log('   The optimized parameters may not generalize well.')
    console.log('   Consider using more conservative parameters.')
  }

  // Code snippet for applying changes
  console.log('\n' + '-'.repeat(70))
  console.log('To apply these changes, update camera-registry.ts:')
  console.log('-'.repeat(70))
  console.log(`
// In CAMERA_CALIBRATIONS:
camera1: {
  K: [[${BASE_FOCAL_LENGTHS.camera1 + bestCam1Delta}, 0, 0], [0, ${BASE_FOCAL_LENGTHS.camera1 + bestCam1Delta}, 0], [0, 0, 1]],
  // ... rest unchanged
  distortion: { k1: ${bestK1}, k2: ${bestK2}, k3: 0, p1: ${bestP1}, p2: ${bestP2} },
},
camera2: {
  K: [[${BASE_FOCAL_LENGTHS.camera2 + bestCam2Delta}, 0, 0], [0, ${BASE_FOCAL_LENGTHS.camera2 + bestCam2Delta}, 0], [0, 0, 1]],
  // ... rest unchanged
  distortion: { k1: ${bestK1}, k2: ${bestK2}, k3: 0, p1: ${bestP1}, p2: ${bestP2} },
},
`)

  console.log('=' .repeat(70))
}

main().catch(console.error)
