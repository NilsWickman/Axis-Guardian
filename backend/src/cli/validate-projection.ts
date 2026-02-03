#!/usr/bin/env node
/**
 * CLI Tool: Validate Projection Accuracy
 *
 * Compares projected positions against ground truth annotations to measure
 * projection accuracy per camera and overall.
 *
 * Usage:
 *   pnpm cli:validate-projection
 *   pnpm cli:validate-projection --annotations ../shared/ground-truths/cross-camera-annotations.json
 */

import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateCalibrationFromSitemap } from '../calibration/sitemap-calibration.js'
import { projectWithRay } from '../projection/ground-plane.js'
import type { SiteMapCameraConfig } from '../types/camera.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Annotation {
  id: string
  timestamp: number
  cameraId: string
  trackId: number
  personId?: number
  bbox: [number, number, number, number]  // [x, y, width, height] normalized
  confidence: number
  worldPosition?: {
    x: number
    y: number
  }
}

interface AnnotationFile {
  version: string
  keyframeIntervalSeconds?: number
  videoDuration?: number
  cameras: string[]
  annotations: Annotation[]
}

interface SiteMap {
  cameras: SiteMapCameraConfig[]
  dimensions: { width: number; height: number }
}

interface ValidationResult {
  cameraId: string
  annotationId: string
  expected: { x: number; y: number }
  projected: { x: number; y: number }
  error: number  // meters
  timestamp: number
}

interface CameraStats {
  count: number
  totalError: number
  maxError: number
  minError: number
  errors: number[]
}

const program = new Command()

program
  .name('validate-projection')
  .description('Validate projection accuracy against ground truth annotations')
  .option(
    '-a, --annotations <path>',
    'Path to annotations JSON file',
    resolve(__dirname, '../../../shared/ground-truths/cross-camera-annotations.json')
  )
  .option(
    '-s, --sitemap <path>',
    'Path to sitemap JSON file',
    resolve(__dirname, '../../../frontend/public/sitemap-rectangular-room.json')
  )
  .option('--image-width <n>', 'Image width in pixels', '1920')
  .option('--image-height <n>', 'Image height in pixels', '1080')
  .option('--max-error <m>', 'Maximum acceptable error in meters', '1.5')
  .option('--verbose', 'Show individual annotation errors', false)
  .action(async (options) => {
    const imageWidth = parseInt(options.imageWidth, 10)
    const imageHeight = parseInt(options.imageHeight, 10)
    const maxAcceptableError = parseFloat(options.maxError)

    // Load sitemap
    if (!existsSync(options.sitemap)) {
      console.error(`Sitemap not found: ${options.sitemap}`)
      process.exit(1)
    }
    const sitemapData: SiteMap = JSON.parse(readFileSync(options.sitemap, 'utf-8'))
    console.log(`Loaded sitemap: ${sitemapData.dimensions.width}x${sitemapData.dimensions.height}m`)
    console.log(`Cameras: ${sitemapData.cameras.map(c => c.id).join(', ')}`)

    // Load annotations
    if (!existsSync(options.annotations)) {
      console.error(`Annotations file not found: ${options.annotations}`)
      process.exit(1)
    }
    const annotationData: AnnotationFile = JSON.parse(readFileSync(options.annotations, 'utf-8'))
    console.log(`\nLoaded ${annotationData.annotations.length} annotations`)

    // Filter annotations that have worldPosition
    const annotationsWithWorld = annotationData.annotations.filter(a => a.worldPosition)
    console.log(`Annotations with worldPosition: ${annotationsWithWorld.length}`)

    if (annotationsWithWorld.length === 0) {
      console.error('\nNo annotations with worldPosition found. Cannot validate projection.')
      process.exit(1)
    }

    // Generate calibrations for each camera
    const calibrations = new Map<string, ReturnType<typeof generateCalibrationFromSitemap>>()
    for (const cameraConfig of sitemapData.cameras) {
      calibrations.set(cameraConfig.id, generateCalibrationFromSitemap(cameraConfig))
    }

    // Validate each annotation
    const results: ValidationResult[] = []
    const cameraStats = new Map<string, CameraStats>()

    for (const ann of annotationsWithWorld) {
      const calibration = calibrations.get(ann.cameraId)
      if (!calibration) {
        console.warn(`No calibration for camera ${ann.cameraId}, skipping annotation ${ann.id}`)
        continue
      }

      // Get bbox bottom-center in pixels
      const [bx, by, bw, bh] = ann.bbox
      const bottomCenterX = (bx + bw / 2) * imageWidth
      const bottomCenterY = (by + bh) * imageHeight

      // Project to world coordinates
      const projection = projectWithRay(bottomCenterX, bottomCenterY, calibration)

      if (!projection.isValid) {
        if (options.verbose) {
          console.warn(`Invalid projection for ${ann.id}: ${projection.reason}`)
        }
        continue
      }

      // Calculate error
      const expected = ann.worldPosition!
      const dx = projection.worldPoint.x - expected.x
      const dy = projection.worldPoint.y - expected.y
      const error = Math.sqrt(dx * dx + dy * dy)

      results.push({
        cameraId: ann.cameraId,
        annotationId: ann.id,
        expected,
        projected: projection.worldPoint,
        error,
        timestamp: ann.timestamp,
      })

      // Update camera stats
      let stats = cameraStats.get(ann.cameraId)
      if (!stats) {
        stats = { count: 0, totalError: 0, maxError: 0, minError: Infinity, errors: [] }
        cameraStats.set(ann.cameraId, stats)
      }
      stats.count++
      stats.totalError += error
      stats.maxError = Math.max(stats.maxError, error)
      stats.minError = Math.min(stats.minError, error)
      stats.errors.push(error)
    }

    // Print per-camera statistics
    console.log('\n' + '='.repeat(70))
    console.log('PROJECTION ACCURACY BY CAMERA')
    console.log('='.repeat(70))

    let overallTotalError = 0
    let overallCount = 0
    let overallMaxError = 0

    for (const [cameraId, stats] of cameraStats) {
      const rmse = Math.sqrt(stats.totalError * stats.totalError / stats.count)
      const meanError = stats.totalError / stats.count

      // Calculate median
      const sortedErrors = [...stats.errors].sort((a, b) => a - b)
      const median = sortedErrors[Math.floor(sortedErrors.length / 2)]

      // Calculate 90th percentile
      const p90 = sortedErrors[Math.floor(sortedErrors.length * 0.9)]

      console.log(`\n${cameraId}:`)
      console.log(`  Annotations: ${stats.count}`)
      console.log(`  Mean error:  ${meanError.toFixed(3)}m`)
      console.log(`  Median:      ${median.toFixed(3)}m`)
      console.log(`  Min error:   ${stats.minError.toFixed(3)}m`)
      console.log(`  Max error:   ${stats.maxError.toFixed(3)}m`)
      console.log(`  90th %ile:   ${p90.toFixed(3)}m`)
      console.log(`  RMSE:        ${rmse.toFixed(3)}m`)

      overallTotalError += stats.totalError
      overallCount += stats.count
      overallMaxError = Math.max(overallMaxError, stats.maxError)
    }

    // Overall statistics
    const overallMean = overallTotalError / overallCount
    const allErrors = results.map(r => r.error).sort((a, b) => a - b)
    const overallMedian = allErrors[Math.floor(allErrors.length / 2)]
    const overall90 = allErrors[Math.floor(allErrors.length * 0.9)]
    const overallRmse = Math.sqrt(
      results.reduce((sum, r) => sum + r.error * r.error, 0) / results.length
    )

    console.log('\n' + '='.repeat(70))
    console.log('OVERALL STATISTICS')
    console.log('='.repeat(70))
    console.log(`Total annotations:  ${overallCount}`)
    console.log(`Mean error:         ${overallMean.toFixed(3)}m`)
    console.log(`Median error:       ${overallMedian.toFixed(3)}m`)
    console.log(`Max error:          ${overallMaxError.toFixed(3)}m`)
    console.log(`90th percentile:    ${overall90.toFixed(3)}m`)
    console.log(`RMSE:               ${overallRmse.toFixed(3)}m`)

    // Check success criteria
    const passCount = results.filter(r => r.error <= maxAcceptableError).length
    const passRate = (passCount / results.length) * 100

    console.log('\n' + '='.repeat(70))
    console.log('SUCCESS CRITERIA')
    console.log('='.repeat(70))
    console.log(`Target: Projections within ${maxAcceptableError}m of ground truth`)
    console.log(`Pass rate: ${passRate.toFixed(1)}% (${passCount}/${results.length})`)

    if (passRate >= 90) {
      console.log('\n✓ PASS: ≥90% of projections meet accuracy target')
    } else {
      console.log('\n✗ FAIL: <90% of projections meet accuracy target')
    }

    // Show verbose output if requested
    if (options.verbose) {
      console.log('\n' + '='.repeat(70))
      console.log('INDIVIDUAL ANNOTATION ERRORS')
      console.log('='.repeat(70))

      const sorted = [...results].sort((a, b) => b.error - a.error)
      for (const r of sorted.slice(0, 20)) {
        const status = r.error <= maxAcceptableError ? '✓' : '✗'
        console.log(
          `${status} ${r.cameraId.padEnd(10)} t=${r.timestamp.toFixed(1).padStart(6)}s ` +
          `expected=(${r.expected.x.toFixed(2)},${r.expected.y.toFixed(2)}) ` +
          `projected=(${r.projected.x.toFixed(2)},${r.projected.y.toFixed(2)}) ` +
          `error=${r.error.toFixed(3)}m`
        )
      }
      if (results.length > 20) {
        console.log(`... and ${results.length - 20} more`)
      }
    }

    // Exit with error code if validation fails
    process.exit(passRate >= 90 ? 0 : 1)
  })

program.parse()
