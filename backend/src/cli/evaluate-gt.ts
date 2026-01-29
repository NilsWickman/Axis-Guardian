#!/usr/bin/env node
/**
 * CLI Tool: Ground Truth Tracking Evaluation
 *
 * Evaluates tracking accuracy against ground truth annotations.
 * Requires a running backend with replayed detection data.
 *
 * Usage:
 *   # Evaluate against live service
 *   pnpm cli:evaluate-gt \
 *     --ground-truth ../shared/ground-truths/cross-camera-annotations.json \
 *     --url http://localhost:3010
 *
 *   # With custom match threshold
 *   pnpm cli:evaluate-gt --ground-truth ... --match-threshold 1.5
 *
 *   # Save results to file
 *   pnpm cli:evaluate-gt --ground-truth ... --output results.json
 */

import { Command } from 'commander'
import { resolve } from 'path'
import { existsSync, writeFileSync } from 'fs'
import {
  loadGroundTruth,
  validateGroundTruth,
  indexGroundTruth,
  getAnnotationsAtKeyframe,
  printGroundTruthSummary,
} from '../evaluation/ground-truth-loader.js'
import {
  TrackMatcherState,
  matchTracksToGT,
  printMatchSummary,
} from '../evaluation/track-matcher.js'
import {
  compileEvaluationResult,
  printEvaluationSummary,
} from '../evaluation/mot-metrics.js'
import type { GlobalTrackJSON } from '../types/track.js'
import type { FrameMatchResult } from '../types/ground-truth.js'

const program = new Command()

program
  .name('evaluate-gt')
  .description('Evaluate tracking accuracy using ground truth annotations')
  .requiredOption('--ground-truth <path>', 'Path to ground truth annotations JSON')
  .option('--url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('--match-threshold <meters>', 'Maximum distance for GT-track match', '2.0')
  .option('--output <path>', 'Save results to JSON file')
  .option('--verbose', 'Show detailed per-keyframe results', false)
  .option('--json', 'Output results as JSON only', false)
  .option('--wait <seconds>', 'Wait for service before starting', '0')
  .action(async (options) => {
    try {
      const gtPath = resolve(options.groundTruth)
      const serviceUrl = options.url
      const matchThreshold = parseFloat(options.matchThreshold)
      const waitSeconds = parseInt(options.wait, 10)

      // Validate ground truth file exists
      if (!existsSync(gtPath)) {
        console.error(`Error: Ground truth file not found: ${gtPath}`)
        process.exit(1)
      }

      // Load and validate ground truth
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
        console.log(`\nMatch Threshold: ${matchThreshold}m`)
        console.log(`Service URL: ${serviceUrl}`)
      }

      // Wait if requested
      if (waitSeconds > 0 && !options.json) {
        console.log(`Waiting ${waitSeconds}s for service...`)
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000))
      }

      // Check service is reachable
      try {
        const response = await fetch(`${serviceUrl}/api/tracks`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error(`Error: Cannot reach tracking service at ${serviceUrl}`)
        console.error('Make sure the backend is running with: pnpm dev')
        process.exit(1)
      }

      // Initialize matcher state
      const matcherState = new TrackMatcherState()
      const frameResults: FrameMatchResult[] = []

      if (!options.json) {
        console.log('\n=== Evaluating Keyframes ===\n')
      }

      // Evaluate each keyframe
      for (const timestamp of index.keyframes) {
        // Get ground truth annotations at this keyframe
        const gtAnnotations = getAnnotationsAtKeyframe(index, timestamp)

        if (gtAnnotations.length === 0) {
          continue
        }

        // Fetch current tracks from service
        let tracks: GlobalTrackJSON[] = []
        try {
          const response = await fetch(`${serviceUrl}/api/tracks/all`)
          if (response.ok) {
            const data = (await response.json()) as { tracks?: GlobalTrackJSON[] }
            tracks = data.tracks ?? []
          }
        } catch {
          // Service might not have tracks yet
        }

        // Match tracks to ground truth
        const result = matchTracksToGT(gtAnnotations, tracks, matcherState, {
          maxMatchDistance: matchThreshold,
          timestamp,
        })

        frameResults.push(result)

        if (options.verbose && !options.json) {
          printMatchSummary(result)
        } else if (!options.json) {
          // Progress indicator
          process.stdout.write(
            `\rKeyframe ${timestamp}s: ` +
              `GT=${result.stats.gtCount}, ` +
              `Match=${result.stats.matchCount}, ` +
              `FN=${result.stats.fnCount}, ` +
              `FP=${result.stats.fpCount}, ` +
              `IDsw=${result.stats.idSwitchCount}    `
          )
        }
      }

      if (!options.json) {
        console.log('\n')
      }

      // Compile final results
      const evalResult = compileEvaluationResult(
        frameResults,
        index.persons,
        matcherState,
        {
          matchDistanceThreshold: matchThreshold,
          keyframeInterval: index.meta.keyframeInterval,
        },
        index.meta.version
      )

      // Output results
      if (options.json) {
        console.log(JSON.stringify(evalResult, null, 2))
      } else {
        printEvaluationSummary(evalResult)

        // Print ID switch details
        const idSwitches = matcherState.getIdSwitches()
        if (idSwitches.length > 0) {
          console.log('\n=== ID Switch Details ===')
          for (const sw of idSwitches) {
            const personLabel =
              index.persons.get(sw.personId)?.label ?? `Person ${sw.personId}`
            console.log(
              `  ${sw.timestamp}s: ${personLabel} switched from ${sw.fromTrackId} to ${sw.toTrackId}`
            )
          }
        }
      }

      // Save to file if requested
      if (options.output) {
        const outputPath = resolve(options.output)
        writeFileSync(outputPath, JSON.stringify(evalResult, null, 2))
        if (!options.json) {
          console.log(`\nResults saved to: ${outputPath}`)
        }
      }

      // Exit with non-zero if MOTA is poor
      if (evalResult.mot.MOTA < 0) {
        if (!options.json) {
          console.log('\nWarning: Negative MOTA indicates more errors than detections')
        }
        process.exit(2)
      }
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
