#!/usr/bin/env node
/**
 * Auto-Calibration CLI Tool
 *
 * Uses cross-camera ReID matches to optimize camera projection parameters.
 *
 * Usage:
 *   pnpm cli:calibrate \
 *     --sitemap ../frontend/public/sitemap-rectangular-room.json \
 *     --detections ../shared/cameras/view-HC3.detections.json.gz \
 *                  ../shared/cameras/view-HC4.detections.json.gz \
 *     --track-truths ./TrackTruths.json \
 *     --output ./calibration-auto.json
 */

import { Command } from 'commander'
import { resolve, basename } from 'path'
import { existsSync, writeFileSync } from 'fs'
import {
  loadDetectionFile,
  loadTrackTruths,
  discoverCrossMatches,
  computeMatchStatistics,
  optimizeProjection,
  saveCalibration,
} from '../calibration/index.js'
import type { DetectionFile, TrackTruthsFile } from '../calibration/types.js'

// ============================================================================
// CLI Definition
// ============================================================================

const program = new Command()

program
  .name('calibrate')
  .description('Auto-calibrate camera projections using cross-camera ReID matches')
  .requiredOption(
    '--sitemap <path>',
    'Path to sitemap JSON file'
  )
  .requiredOption(
    '--detections <paths...>',
    'Paths to detection files (*.detections.json.gz)'
  )
  .option(
    '--camera-ids <ids...>',
    'Camera IDs corresponding to detection files (default: camera1, camera2, ...)'
  )
  .option(
    '--track-truths <path>',
    'Path to TrackTruths.json for match validation (optional)'
  )
  .option(
    '--output <path>',
    'Output calibration file path',
    './calibration-auto.json'
  )
  .option(
    '--min-similarity <value>',
    'Minimum embedding similarity for matches',
    '0.65'
  )
  .option(
    '--max-iterations <value>',
    'Maximum optimization iterations',
    '500'
  )
  .option(
    '--save-matches <path>',
    'Save discovered matches to JSON file (for debugging)'
  )
  .option(
    '--quiet',
    'Suppress verbose output',
    false
  )
  .action(async (options) => {
    try {
      await runCalibration(options)
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

// ============================================================================
// Main Calibration Logic
// ============================================================================

interface CalibrationOptions {
  sitemap: string
  detections: string[]
  cameraIds?: string[]
  trackTruths?: string
  output: string
  minSimilarity: string
  maxIterations: string
  saveMatches?: string
  quiet: boolean
}

async function runCalibration(options: CalibrationOptions): Promise<void> {
  const verbose = !options.quiet

  if (verbose) {
    console.log('=== Auto-Calibration System ===\n')
  }

  // -------------------------------------------------------------------------
  // Step 1: Load inputs
  // -------------------------------------------------------------------------
  if (verbose) {
    console.log('[1/4] Loading data...')
  }

  // Validate sitemap
  const sitemapPath = resolve(options.sitemap)
  if (!existsSync(sitemapPath)) {
    throw new Error(`Sitemap not found: ${sitemapPath}`)
  }

  // Load detection files
  const detectionFiles = new Map<string, DetectionFile>()

  for (let i = 0; i < options.detections.length; i++) {
    const detPath = resolve(options.detections[i])
    if (!existsSync(detPath)) {
      throw new Error(`Detection file not found: ${detPath}`)
    }

    // Determine camera ID
    let cameraId: string
    if (options.cameraIds && options.cameraIds[i]) {
      cameraId = options.cameraIds[i]
    } else {
      // Default: camera1, camera2, etc.
      cameraId = `camera${i + 1}`
    }

    if (verbose) {
      console.log(`  Loading ${basename(detPath)} as ${cameraId}...`)
    }

    const detFile = loadDetectionFile(detPath)
    detectionFiles.set(cameraId, detFile)

    if (verbose) {
      console.log(`    ${detFile.frames.length} frames, ${detFile.video_info.fps.toFixed(1)} fps`)
    }
  }

  // Load TrackTruths if provided
  let trackTruths: TrackTruthsFile | null = null
  if (options.trackTruths) {
    const trackTruthsPath = resolve(options.trackTruths)
    if (!existsSync(trackTruthsPath)) {
      console.warn(`  Warning: TrackTruths file not found: ${trackTruthsPath}`)
    } else {
      trackTruths = loadTrackTruths(trackTruthsPath)
      if (verbose) {
        console.log(`  TrackTruths: ${trackTruths.annotations.length} annotations`)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Discover cross-camera matches
  // -------------------------------------------------------------------------
  if (verbose) {
    console.log('\n[2/4] Discovering cross-camera matches...')
  }

  const minSimilarity = parseFloat(options.minSimilarity)
  const matches = discoverCrossMatches(detectionFiles, trackTruths, {
    minSimilarity,
    maxFrameGapMs: 100,
    minMatchesRequired: 10,
    minEmbeddingQuality: 0.5,
  })

  if (matches.length === 0) {
    throw new Error('No cross-camera matches found. Check detection files and similarity threshold.')
  }

  // Compute statistics
  const stats = computeMatchStatistics(matches)

  if (verbose) {
    console.log(`  Found ${stats.totalMatches} matches`)
    if (trackTruths) {
      console.log(`  Validated by TrackTruths: ${stats.validatedMatches}`)
    }
    console.log(`  Similarity: min=${stats.similarityDistribution.min.toFixed(3)}, ` +
      `mean=${stats.similarityDistribution.mean.toFixed(3)}, ` +
      `max=${stats.similarityDistribution.max.toFixed(3)}`)

    console.log('  Camera pairs:')
    for (const [pair, count] of stats.cameraPairs) {
      console.log(`    ${pair}: ${count} matches`)
    }
  }

  // Save matches if requested
  if (options.saveMatches) {
    const matchesPath = resolve(options.saveMatches)
    const serializableMatches = matches.map(m => ({
      timestamp: m.timestamp,
      detection1: {
        cameraId: m.detection1.cameraId,
        frameNumber: m.detection1.frameNumber,
        timestamp: m.detection1.timestamp,
        localTrackId: m.detection1.localTrackId,
        bbox: m.detection1.bbox,
        embeddingQuality: m.detection1.embeddingQuality,
        confidence: m.detection1.confidence,
        // Exclude embedding to reduce file size
      },
      detection2: {
        cameraId: m.detection2.cameraId,
        frameNumber: m.detection2.frameNumber,
        timestamp: m.detection2.timestamp,
        localTrackId: m.detection2.localTrackId,
        bbox: m.detection2.bbox,
        embeddingQuality: m.detection2.embeddingQuality,
        confidence: m.detection2.confidence,
      },
      similarity: m.similarity,
      personId: m.personId,
      isValidated: m.isValidated,
    }))
    writeFileSync(matchesPath, JSON.stringify(serializableMatches, null, 2))
    console.log(`  Matches saved to: ${matchesPath}`)
  }

  // -------------------------------------------------------------------------
  // Step 3: Optimize projection parameters
  // -------------------------------------------------------------------------
  if (verbose) {
    console.log('\n[3/4] Optimizing projection parameters...')
  }

  const maxIterations = parseInt(options.maxIterations, 10)

  const { calibration, metrics } = await optimizeProjection(matches, sitemapPath, {
    maxIterations,
    verbose,
  })

  if (verbose) {
    console.log(`  Initial mean error: ${metrics.initialMeanError.toFixed(3)}m`)
    console.log(`  Final mean error: ${metrics.finalMeanError.toFixed(3)}m`)
    const improvement = (1 - metrics.finalMeanError / metrics.initialMeanError) * 100
    console.log(`  Improvement: ${improvement.toFixed(1)}%`)
  }

  // -------------------------------------------------------------------------
  // Step 4: Save calibration
  // -------------------------------------------------------------------------
  if (verbose) {
    console.log('\n[4/4] Saving calibration...')
  }

  const outputPath = resolve(options.output)
  saveCalibration(calibration, outputPath)

  console.log(`\nCalibration saved to: ${outputPath}`)
  console.log(`  Mean convergence error: ${metrics.finalMeanError.toFixed(3)}m`)
  console.log(`  Cameras calibrated: ${calibration.cameras.length}`)

  // Print per-camera summary
  if (verbose) {
    console.log('\nPer-camera parameters:')
    for (const cam of calibration.cameras) {
      const p = cam.calibration_params
      console.log(`  ${cam.cameraId}:`)
      console.log(`    focal_length: ${p.focal_length.toFixed(0)}`)
      console.log(`    azimuth: ${p.effective_azimuth.toFixed(1)}° (offset: ${p.azimuth_offset >= 0 ? '+' : ''}${p.azimuth_offset.toFixed(1)}°)`)
      console.log(`    elevation: ${p.effective_elevation.toFixed(1)}° (offset: ${p.elevation_offset >= 0 ? '+' : ''}${p.elevation_offset.toFixed(1)}°)`)
    }
  }
}

// ============================================================================
// Entry Point
// ============================================================================

program.parse()
