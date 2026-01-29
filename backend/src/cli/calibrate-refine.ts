#!/usr/bin/env node
/**
 * CLI Tool: Calibration Refinement using Ground Truth
 *
 * Evaluates and reports camera calibration accuracy using ground truth
 * annotations with known world positions.
 *
 * Usage:
 *   pnpm cli:calibrate-refine \
 *     --ground-truth ../shared/ground-truths/cross-camera-annotations.json \
 *     --sitemap ../frontend/public/sitemap-rectangular-room.json
 *
 *   # Verbose output with individual errors
 *   pnpm cli:calibrate-refine --ground-truth ... --sitemap ... --verbose
 *
 *   # JSON output
 *   pnpm cli:calibrate-refine --ground-truth ... --sitemap ... --json
 *
 *   # Single camera only
 *   pnpm cli:calibrate-refine --ground-truth ... --sitemap ... --camera camera1
 */

import { Command } from 'commander'
import { resolve } from 'path'
import { existsSync, writeFileSync } from 'fs'
import {
  loadGroundTruth,
  validateGroundTruth,
  indexGroundTruth,
  getCameraAnnotationsWithWorldPosition,
  printGroundTruthSummary,
} from '../evaluation/ground-truth-loader.js'
import {
  computeCameraReprojectionStats,
  computeCameraReprojectionSamples,
  analyzeErrorBias,
  formatReprojectionStats,
  printSampleErrors,
} from '../evaluation/reprojection-error.js'
import { loadSiteMapConfig } from '../config/sitemap-loader.js'
import { CameraRegistry } from '../detection/camera-registry.js'
import { generateCalibrationFromSitemap } from '../calibration/sitemap-calibration.js'
import type { CameraReprojectionStats } from '../types/ground-truth.js'

const program = new Command()

program
  .name('calibrate-refine')
  .description('Evaluate camera calibration accuracy using ground truth annotations')
  .requiredOption('--ground-truth <path>', 'Path to ground truth annotations JSON')
  .requiredOption('--sitemap <path>', 'Path to sitemap JSON file')
  .option('--calibration <path>', 'Path to existing calibration file (optional)')
  .option('--camera <id>', 'Evaluate only specific camera (default: all cameras)')
  .option('--verbose', 'Show detailed per-annotation errors', false)
  .option('--json', 'Output results as JSON', false)
  .option('--output <path>', 'Save results to JSON file')
  .action(async (options) => {
    try {
      // Resolve paths
      const gtPath = resolve(options.groundTruth)
      const sitemapPath = resolve(options.sitemap)

      // Validate files exist
      if (!existsSync(gtPath)) {
        console.error(`Error: Ground truth file not found: ${gtPath}`)
        process.exit(1)
      }
      if (!existsSync(sitemapPath)) {
        console.error(`Error: Sitemap file not found: ${sitemapPath}`)
        process.exit(1)
      }

      // Load sitemap
      if (!options.json) {
        console.log(`Loading sitemap: ${sitemapPath}`)
      }
      const sitemapConfig = loadSiteMapConfig(sitemapPath)

      // Load and validate ground truth
      if (!options.json) {
        console.log(`Loading ground truth: ${gtPath}`)
      }
      const gtData = loadGroundTruth(gtPath)
      const validation = validateGroundTruth(gtData, {
        width: sitemapConfig.dimensions.width,
        height: sitemapConfig.dimensions.height,
      })

      if (!validation.valid) {
        console.error('Ground truth validation failed:')
        for (const error of validation.errors) {
          console.error(`  - ${error}`)
        }
        process.exit(1)
      }

      if (validation.warnings.length > 0 && !options.json) {
        console.warn('Ground truth warnings:')
        for (const warning of validation.warnings.slice(0, 5)) {
          console.warn(`  - ${warning}`)
        }
        if (validation.warnings.length > 5) {
          console.warn(`  ... and ${validation.warnings.length - 5} more warnings`)
        }
      }

      // Index ground truth
      const index = indexGroundTruth(gtData)

      if (!options.json) {
        printGroundTruthSummary(index)
      }

      // Initialize camera registry
      const cameraRegistry = new CameraRegistry()
      cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

      // Load calibration if provided
      if (options.calibration) {
        const calibPath = resolve(options.calibration)
        if (!existsSync(calibPath)) {
          console.error(`Error: Calibration file not found: ${calibPath}`)
          process.exit(1)
        }
        if (!options.json) {
          console.log(`Loading calibration: ${calibPath}`)
        }
        await cameraRegistry.loadCalibrationFromFile(calibPath)
      }

      // Determine cameras to evaluate
      const camerasToEvaluate = options.camera
        ? [options.camera]
        : index.meta.cameraIds

      // Evaluate each camera
      const results: CameraReprojectionStats[] = []

      if (!options.json) {
        console.log('\n=== Reprojection Error Analysis ===\n')
      }

      for (const cameraId of camerasToEvaluate) {
        // Get calibration for this camera
        let calibration = cameraRegistry.getCalibration(cameraId)

        if (!calibration) {
          // Generate from sitemap if no calibration exists
          const cameraConfig = sitemapConfig.cameras.find((c) => c.id === cameraId)
          if (cameraConfig) {
            calibration = generateCalibrationFromSitemap(cameraConfig)
          }
        }

        if (!calibration) {
          if (!options.json) {
            console.warn(`Warning: No calibration found for ${cameraId}, skipping`)
          }
          continue
        }

        // Get camera params
        const cameraParams = cameraRegistry.getCamera(cameraId)

        // Get annotations with world positions for this camera
        const annotations = getCameraAnnotationsWithWorldPosition(index, cameraId)

        if (annotations.length === 0) {
          if (!options.json) {
            console.log(`${cameraId}: No annotations with world positions`)
          }
          continue
        }

        // Use default 1920x1080 resolution
        const imageWidth = 1920
        const imageHeight = 1080

        // Compute reprojection stats
        const stats = computeCameraReprojectionStats(
          annotations,
          calibration,
          cameraParams ?? null,
          imageWidth,
          imageHeight
        )
        results.push(stats)

        if (!options.json) {
          console.log(formatReprojectionStats(stats))

          // Analyze bias
          const samples = computeCameraReprojectionSamples(
            annotations,
            calibration,
            cameraParams ?? null,
            imageWidth,
            imageHeight
          )
          const bias = analyzeErrorBias(samples)

          if (bias.hasBias) {
            console.log(
              `  Systematic Bias: ${bias.biasMagnitude.toFixed(2)}m @ ${bias.biasAngleDeg.toFixed(0)}°`
            )
            console.log(
              `    (offset: dx=${bias.biasX.toFixed(2)}m, dy=${bias.biasY.toFixed(2)}m)`
            )
          }

          if (options.verbose) {
            printSampleErrors(samples, 10)
          }

          console.log('')
        }
      }

      // Output results
      const output = {
        evaluatedAt: new Date().toISOString(),
        groundTruthFile: gtPath,
        sitemapFile: sitemapPath,
        calibrationFile: options.calibration ?? null,
        cameras: results,
        summary: {
          totalCameras: results.length,
          overallMeanError:
            results.length > 0
              ? results.reduce((sum, r) => sum + r.meanError * r.sampleCount, 0) /
                results.reduce((sum, r) => sum + r.sampleCount, 0)
              : 0,
          overallMedianError:
            results.length > 0
              ? results.reduce((sum, r) => sum + r.medianError, 0) / results.length
              : 0,
          overallMaxError:
            results.length > 0 ? Math.max(...results.map((r) => r.maxError)) : 0,
          totalSamples: results.reduce((sum, r) => sum + r.sampleCount, 0),
          totalInvalid: results.reduce((sum, r) => sum + r.invalidCount, 0),
        },
      }

      if (options.json) {
        console.log(JSON.stringify(output, null, 2))
      } else {
        console.log('=== Summary ===')
        console.log(`Cameras Evaluated: ${output.summary.totalCameras}`)
        console.log(`Total Samples: ${output.summary.totalSamples}`)
        console.log(`Invalid Projections: ${output.summary.totalInvalid}`)
        console.log(`Overall Mean Error: ${output.summary.overallMeanError.toFixed(3)}m`)
        console.log(`Overall Median Error: ${output.summary.overallMedianError.toFixed(3)}m`)
        console.log(`Overall Max Error: ${output.summary.overallMaxError.toFixed(3)}m`)
      }

      // Save to file if requested
      if (options.output) {
        const outputPath = resolve(options.output)
        writeFileSync(outputPath, JSON.stringify(output, null, 2))
        if (!options.json) {
          console.log(`\nResults saved to: ${outputPath}`)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
