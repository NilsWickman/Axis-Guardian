/**
 * Camera Calibration Sweep Test
 *
 * Tests small variations in camera position (x, y) and azimuth to find
 * calibration settings that minimize projection error against ground truth.
 *
 * This is NOT overfitting - it only tests reasonable physical adjustments
 * (±0.3m position, ±5° azimuth) that could represent measurement uncertainty
 * in the original camera placement.
 *
 * Run: pnpm tsx tests/calibration/camera-sweep-test.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  loadSiteMapConfig,
  siteMapCameraToCameraParams,
} from '../../src/config/sitemap-loader.js'
import { projectToGround } from '../../src/projection/ground-plane.js'
import type { CameraParams, Point2D } from '../../src/types.js'

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
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
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

interface SweepResult {
  cameraId: string
  deltaX: number
  deltaY: number
  deltaAzimuth: number
  avgError: number
  maxError: number
  passRate: number
  sampleCount: number
}

// ============================================================================
// Helpers
// ============================================================================

function loadGroundTruths(): GroundTruthDataset {
  const path = join(__dirname, '../../../GroundTruths.json')
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function distance(p1: Point2D, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function getBboxCenter(bbox: LinkedDetection['bbox']): { x: number; y: number } {
  return {
    x: (bbox.left + bbox.right) / 2,
    y: bbox.bottom, // Use foot position (bottom of bbox)
  }
}

/**
 * Evaluate projection accuracy for a camera with modified parameters
 */
function evaluateCamera(
  cameraId: string,
  baseParams: CameraParams,
  deltaX: number,
  deltaY: number,
  deltaAzimuth: number,
  annotations: Annotation[],
  imageWidth: number,
  imageHeight: number
): { avgError: number; maxError: number; passRate: number; sampleCount: number } {
  // Create modified camera params
  const modifiedParams: CameraParams = {
    ...baseParams,
    position: {
      x: baseParams.position.x + deltaX,
      y: baseParams.position.y + deltaY,
      z: baseParams.position.z,
    },
    azimuth: baseParams.azimuth + deltaAzimuth,
  }

  const imageParams = { width: imageWidth, height: imageHeight }
  const errors: number[] = []

  for (const ann of annotations) {
    // Only use certain confidence annotations
    if (ann.confidence !== 'certain') continue

    // Find detection from this camera
    const det = ann.linkedDetections.find(d => d.cameraId === cameraId)
    if (!det) continue

    // Get pixel coordinates
    const center = getBboxCenter(det.bbox)
    const pixelX = center.x * imageWidth
    const pixelY = center.y * imageHeight

    // Project to ground
    const result = projectToGround({ x: pixelX, y: pixelY }, modifiedParams, imageParams)
    if (!result.isValid) continue

    // Calculate error
    const error = distance(result.worldPoint, ann.groundPosition)
    errors.push(error)
  }

  if (errors.length === 0) {
    return { avgError: Infinity, maxError: Infinity, passRate: 0, sampleCount: 0 }
  }

  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
  const maxError = Math.max(...errors)
  const passRate = errors.filter(e => e < 0.5).length / errors.length

  return { avgError, maxError, passRate, sampleCount: errors.length }
}

// ============================================================================
// Main Sweep
// ============================================================================

async function runSweepTest() {
  console.log('='.repeat(70))
  console.log('CAMERA CALIBRATION SWEEP TEST')
  console.log('='.repeat(70))
  console.log()

  // Load data
  const sitemapPath = join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  const groundTruths = loadGroundTruths()

  console.log(`Loaded ${groundTruths.annotations.length} ground truth annotations`)
  console.log(`Cameras: ${sitemapConfig.cameras.map(c => c.id).join(', ')}`)
  console.log()

  // Sweep parameters - small adjustments only
  const positionSteps = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3] // ±30cm
  const azimuthSteps = [-5, -3, -2, -1, 0, 1, 2, 3, 5] // ±5 degrees

  const results: SweepResult[] = []

  for (const sitemapCamera of sitemapConfig.cameras) {
    const cameraId = sitemapCamera.id
    const baseParams = siteMapCameraToCameraParams(sitemapCamera as any)
    const imageWidth = sitemapCamera.resolution?.width || 1920
    const imageHeight = sitemapCamera.resolution?.height || 1080

    console.log(`\n--- Sweeping ${cameraId} ---`)
    console.log(`Base position: (${baseParams.position.x.toFixed(2)}, ${baseParams.position.y.toFixed(2)})`)
    console.log(`Base azimuth: ${baseParams.azimuth}°`)

    let bestResult: SweepResult | null = null
    let baselineResult: SweepResult | null = null

    // Test each combination
    for (const dx of positionSteps) {
      for (const dy of positionSteps) {
        for (const dAz of azimuthSteps) {
          const { avgError, maxError, passRate, sampleCount } = evaluateCamera(
            cameraId,
            baseParams,
            dx,
            dy,
            dAz,
            groundTruths.annotations,
            imageWidth,
            imageHeight
          )

          if (sampleCount === 0) continue

          const result: SweepResult = {
            cameraId,
            deltaX: dx,
            deltaY: dy,
            deltaAzimuth: dAz,
            avgError,
            maxError,
            passRate,
            sampleCount,
          }

          results.push(result)

          // Track baseline (0, 0, 0)
          if (dx === 0 && dy === 0 && dAz === 0) {
            baselineResult = result
          }

          // Track best
          if (!bestResult || avgError < bestResult.avgError) {
            bestResult = result
          }
        }
      }
    }

    // Report findings
    if (baselineResult) {
      console.log(`\nBaseline (current config):`)
      console.log(`  Avg error: ${baselineResult.avgError.toFixed(3)}m`)
      console.log(`  Max error: ${baselineResult.maxError.toFixed(3)}m`)
      console.log(`  Pass rate (<0.5m): ${(baselineResult.passRate * 100).toFixed(1)}%`)
      console.log(`  Samples: ${baselineResult.sampleCount}`)
    }

    if (bestResult && baselineResult) {
      const improvement = baselineResult.avgError - bestResult.avgError
      console.log(`\nBest configuration:`)
      console.log(`  Delta: x=${bestResult.deltaX > 0 ? '+' : ''}${bestResult.deltaX}m, y=${bestResult.deltaY > 0 ? '+' : ''}${bestResult.deltaY}m, azimuth=${bestResult.deltaAzimuth > 0 ? '+' : ''}${bestResult.deltaAzimuth}°`)
      console.log(`  Avg error: ${bestResult.avgError.toFixed(3)}m`)
      console.log(`  Max error: ${bestResult.maxError.toFixed(3)}m`)
      console.log(`  Pass rate (<0.5m): ${(bestResult.passRate * 100).toFixed(1)}%`)
      console.log(`  Improvement: ${improvement > 0 ? '+' : ''}${(improvement * 100).toFixed(1)}cm`)

      if (improvement > 0.02) { // More than 2cm improvement
        console.log(`\n  RECOMMENDED UPDATE:`)
        console.log(`    position: { x: ${(baseParams.position.x + bestResult.deltaX).toFixed(2)}, y: ${(baseParams.position.y + bestResult.deltaY).toFixed(2)} }`)
        console.log(`    azimuth: ${baseParams.azimuth + bestResult.deltaAzimuth}`)
      } else {
        console.log(`\n  Current calibration is already near-optimal (improvement < 2cm)`)
      }
    }
  }

  // Cross-camera analysis
  console.log('\n' + '='.repeat(70))
  console.log('CROSS-CAMERA CONVERGENCE ANALYSIS')
  console.log('='.repeat(70))

  // Find annotations with both cameras
  const multiCameraAnnotations = groundTruths.annotations.filter(
    ann => ann.confidence === 'certain' && ann.linkedDetections.length > 1
  )
  console.log(`\nMulti-camera annotations: ${multiCameraAnnotations.length}`)

  // Evaluate cross-camera convergence with baseline vs best configs
  console.log(`\nThis analysis helps identify if camera calibrations are consistent.`)
  console.log(`If projections from different cameras for the same person diverge significantly,`)
  console.log(`it indicates calibration inconsistency between cameras.`)

  // Save results to JSON for further analysis
  const outputPath = join(__dirname, 'sweep-results.json')
  writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    sweepParams: {
      positionSteps,
      azimuthSteps,
    },
    results: results.filter(r => r.deltaX === 0 && r.deltaY === 0 && r.deltaAzimuth === 0)
      .concat(results.filter(r => {
        // Include best for each camera
        const cameraResults = results.filter(cr => cr.cameraId === r.cameraId)
        const best = cameraResults.reduce((a, b) => a.avgError < b.avgError ? a : b)
        return r === best
      })),
  }, null, 2))
  console.log(`\nResults saved to: ${outputPath}`)

  console.log('\n' + '='.repeat(70))
  console.log('SWEEP COMPLETE')
  console.log('='.repeat(70))
}

// Run if executed directly
runSweepTest().catch(console.error)
