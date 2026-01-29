#!/usr/bin/env node
/**
 * CLI Tool: Polynomial Calibration Fitting
 *
 * Fits direct polynomial mappings from image coordinates to world coordinates
 * using ground truth annotations. Outputs calibration JSON that can be loaded
 * by the tracking service.
 *
 * Usage:
 *   # Fit degree-3 polynomials for all cameras
 *   npx tsx src/cli/fit-polynomial.ts \
 *     --ground-truth ../shared/ground-truths/cross-camera-annotations.json \
 *     --output calibration-polynomial.json
 *
 *   # Fit with cross-validation to select best degree
 *   npx tsx src/cli/fit-polynomial.ts \
 *     --ground-truth ... --output ... --cross-validate
 *
 *   # Fit specific degree
 *   npx tsx src/cli/fit-polynomial.ts \
 *     --ground-truth ... --output ... --degree 4
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
  extractCorrespondencePoints,
  fitPolynomial,
  crossValidate,
  formatFitResult,
  formatCrossValidation,
  getTermCount,
} from '../calibration/polynomial-fitting.js'
import type { DirectPolynomial } from '../types/camera.js'

/**
 * Calibration output format
 */
interface CalibrationOutput {
  version: string
  generatedAt: string
  groundTruthFile: string
  cameras: Record<
    string,
    {
      directPolynomial: DirectPolynomial
      fitStats: {
        pointCount: number
        rmse: number
        maxError: number
      }
    }
  >
}

const program = new Command()

program
  .name('fit-polynomial')
  .description('Fit polynomial calibration from ground truth annotations')
  .requiredOption('--ground-truth <path>', 'Path to ground truth annotations JSON')
  .requiredOption('--output <path>', 'Output path for calibration JSON')
  .option('--degree <n>', 'Polynomial degree (3, 4, or 5)', '3')
  .option('--cross-validate', 'Run cross-validation to select best degree', false)
  .option('--camera <id>', 'Fit only specific camera')
  .option('--min-points <n>', 'Minimum points required per camera', '10')
  .option('--verbose', 'Show detailed output', false)
  .option('--json', 'Output results as JSON only', false)
  .action(async (options) => {
    try {
      const gtPath = resolve(options.groundTruth)
      const outputPath = resolve(options.output)
      const degree = parseInt(options.degree, 10) as 3 | 4 | 5
      const minPoints = parseInt(options.minPoints, 10)

      // Validate degree
      if (![3, 4, 5].includes(degree)) {
        console.error('Error: Degree must be 3, 4, or 5')
        process.exit(1)
      }

      // Validate ground truth file exists
      if (!existsSync(gtPath)) {
        console.error(`Error: Ground truth file not found: ${gtPath}`)
        process.exit(1)
      }

      // Load ground truth
      if (!options.json) {
        console.log(`Loading ground truth: ${gtPath}`)
      }
      const gtData = loadGroundTruth(gtPath)
      const validation = validateGroundTruth(gtData)

      if (!validation.valid) {
        console.error('Ground truth validation failed:')
        for (const error of validation.errors) {
          console.error(`  - ${error}`)
        }
        process.exit(1)
      }

      // Index ground truth
      const index = indexGroundTruth(gtData)

      if (!options.json) {
        printGroundTruthSummary(index)
      }

      // Determine cameras to process
      const camerasToProcess = options.camera
        ? [options.camera]
        : index.meta.cameraIds

      // Prepare output
      const output: CalibrationOutput = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        groundTruthFile: gtPath,
        cameras: {},
      }

      if (!options.json) {
        console.log('\n=== Polynomial Fitting ===\n')
      }

      for (const cameraId of camerasToProcess) {
        // Get annotations with world positions
        const annotations = getCameraAnnotationsWithWorldPosition(index, cameraId)

        if (annotations.length < minPoints) {
          if (!options.json) {
            console.log(
              `${cameraId}: Skipping (only ${annotations.length} points, need ${minPoints})`
            )
          }
          continue
        }

        // Extract correspondence points
        const points = extractCorrespondencePoints(annotations)

        if (points.length < getTermCount(degree)) {
          if (!options.json) {
            console.log(
              `${cameraId}: Skipping (${points.length} points insufficient for degree ${degree})`
            )
          }
          continue
        }

        // Cross-validation if requested
        let selectedDegree: 3 | 4 | 5 = degree
        if (options.crossValidate && points.length >= 20) {
          if (!options.json) {
            console.log(`${cameraId}: Running cross-validation...`)
          }

          const cvResults = crossValidate(points, [3, 4, 5], 5)

          if (cvResults.size > 0) {
            const best = cvResults.values().next().value
            if (best) {
              selectedDegree = best.recommendedDegree as 3 | 4 | 5
            }

            if (!options.json && options.verbose) {
              console.log(formatCrossValidation(cvResults))
            } else if (!options.json) {
              console.log(`${cameraId}: Cross-validation recommends degree ${selectedDegree}`)
            }
          }
        }

        // Fit polynomial
        try {
          const result = fitPolynomial(points, selectedDegree)

          output.cameras[cameraId] = {
            directPolynomial: result.polynomial,
            fitStats: {
              pointCount: result.pointCount,
              rmse: result.rmse,
              maxError: result.maxError,
            },
          }

          if (!options.json) {
            console.log(formatFitResult(result, cameraId))
            console.log('')
          }
        } catch (error) {
          if (!options.json) {
            console.error(`${cameraId}: Fitting failed - ${error}`)
          }
        }
      }

      // Check if any cameras were fitted
      const fittedCount = Object.keys(output.cameras).length
      if (fittedCount === 0) {
        console.error('Error: No cameras were successfully fitted')
        process.exit(1)
      }

      // Write output
      writeFileSync(outputPath, JSON.stringify(output, null, 2))

      if (!options.json) {
        console.log('=== Summary ===')
        console.log(`Cameras fitted: ${fittedCount}`)
        console.log(`Output saved to: ${outputPath}`)

        // Show how to use
        console.log('\nTo use this calibration:')
        console.log(`  1. Copy to backend: cp ${outputPath} backend/calibration.json`)
        console.log('  2. Restart backend - it will auto-load calibration.json')
        console.log('  3. Or load dynamically via API: POST /api/calibration')
      } else {
        console.log(JSON.stringify(output, null, 2))
      }
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
