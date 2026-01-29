#!/usr/bin/env node
/**
 * CLI Tool: Evaluate MOT Metrics (Standalone)
 *
 * Runs tracking evaluation in-process without requiring a live backend service.
 * Loads ground truth from shared/ground-truths/, replays detection data through
 * TrackManager, and computes MOTA/MOTP metrics following MOT Challenge standards.
 *
 * Usage:
 *   # Basic evaluation
 *   pnpm cli:evaluate-metrics \
 *     --ground-truth ../shared/ground-truths/annotations.json \
 *     --detections ../shared/cameras/view-HC3.detections.json.gz \
 *     --camera camera1
 *
 *   # Multi-camera evaluation
 *   pnpm cli:evaluate-metrics \
 *     --ground-truth ../shared/ground-truths/annotations.json \
 *     --detections ../shared/cameras/view-HC3.detections.json.gz \
 *     --camera camera1 \
 *     --detections ../shared/cameras/view-HC4.detections.json.gz \
 *     --camera camera2 \
 *     --sitemap ../frontend/public/sitemap-rectangular-room.json
 *
 *   # CI mode with thresholds
 *   pnpm cli:evaluate-metrics \
 *     --ground-truth ... --detections ... --camera ... \
 *     --min-mota 0.5 --max-motp 1.0 --max-id-switches 10
 *
 * Exit Codes:
 *   0 - Success (all thresholds met)
 *   1 - Error (invalid arguments, missing files, etc.)
 *   2 - Threshold violation (MOTA too low, MOTP too high, etc.)
 */

import { Command } from 'commander'
import { resolve } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { gunzipSync } from 'zlib'

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
} from '../evaluation/track-matcher.js'
import {
  computeExtendedMOTMetrics,
  compileEvaluationResult,
  printEvaluationSummary,
  getSummaryLine,
} from '../evaluation/mot-metrics.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import { CameraRegistry } from '../detection/camera-registry.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'
import type { GlobalTrackJSON, CameraDetection } from '../types/track.js'
import type { FrameMatchResult, IndexedGroundTruth, MOTMetrics } from '../types/ground-truth.js'
import type { CameraCalibration } from '../types/camera.js'
import type { DetectionAttributes } from '../types/detection.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

// ============================================================================
// Types
// ============================================================================

interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Array<{
    bbox: number[]  // [left, top, width, height] normalized
    confidence: number
    class_name: string
    track_id: number
    attributes?: {
      embedding?: number[]
      embedding_quality?: number
      upper_clothing?: unknown
      lower_clothing?: unknown
    }
  }>
}

interface DetectionFile {
  format_version: string
  video_info: {
    fps: number
    total_frames: number
    duration_seconds?: number
  }
  frames: DetectionFrame[]
}

interface CameraDetectionSource {
  cameraId: string
  file: DetectionFile
  filePath: string
}

interface ThresholdConfig {
  minMota?: number
  maxMotp?: number
  maxIdSwitches?: number
  maxFalseNegativeRate?: number
  maxFalsePositiveRate?: number
}

// ============================================================================
// File Loading
// ============================================================================

function loadDetectionFile(filePath: string): DetectionFile | null {
  if (!existsSync(filePath)) {
    console.error(`Detection file not found: ${filePath}`)
    return null
  }

  try {
    let content: string
    if (filePath.endsWith('.gz')) {
      const compressed = readFileSync(filePath)
      content = gunzipSync(compressed).toString('utf-8')
    } else {
      content = readFileSync(filePath, 'utf-8')
    }
    return JSON.parse(content) as DetectionFile
  } catch (error) {
    console.error(`Error loading detection file: ${error}`)
    return null
  }
}

interface SiteMapCamera {
  id: string
  calibration?: CameraCalibration
  // Additional fields may exist
}

interface SiteMap {
  cameras?: SiteMapCamera[]
  siteDimensions?: { width: number; height: number }
}

function loadSiteMap(filePath: string): SiteMap | null {
  if (!existsSync(filePath)) {
    console.error(`Sitemap file not found: ${filePath}`)
    return null
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as SiteMap
  } catch (error) {
    console.error(`Error loading sitemap: ${error}`)
    return null
  }
}

// ============================================================================
// Detection Processing
// ============================================================================

/**
 * Project a single detection to world coordinates
 * Returns null if projection fails
 */
function projectDetection(
  cameraRegistry: CameraRegistry,
  cameraId: string,
  detection: DetectionFrame['detections'][0],
  timestamp: number
): CameraDetection | null {
  const calibration = cameraRegistry.getCalibration(cameraId)
  if (!calibration) {
    return null // Camera not registered
  }

  // Convert bbox format: input is [left, top, width, height] normalized
  const bbox = {
    x: detection.bbox[0],
    y: detection.bbox[1],
    width: detection.bbox[2],
    height: detection.bbox[3],
  }

  // Project to world coordinates
  const result = projectDetectionWithKRT(
    bbox,
    calibration,
    null, // cameraParams
    [], // obstacles
    true, // isNormalized - bbox values are 0-1
    ALGORITHM_CONSTANTS.detection.imageWidth,
    ALGORITHM_CONSTANTS.detection.imageHeight
  )

  if (!result.isValid) {
    return null
  }

  // Create CameraDetection for batch processing
  const attributes = detection.attributes as DetectionAttributes | undefined
  return {
    cameraId,
    localTrackId: detection.track_id,
    worldX: result.worldPoint.x,
    worldY: result.worldPoint.y,
    confidence: detection.confidence,
    timestamp, // Unix timestamp in ms
    bbox,
    attributes,
  }
}

// ============================================================================
// Evaluation Engine
// ============================================================================

interface EvaluationResult {
  metrics: MOTMetrics
  frameResults: FrameMatchResult[]
  matcherState: TrackMatcherState
  thresholdViolations: string[]
}

/**
 * Run tracking evaluation with proper cross-camera batch processing
 */
function runEvaluation(
  sources: CameraDetectionSource[],
  groundTruth: IndexedGroundTruth,
  cameraRegistry: CameraRegistry,
  matchThreshold: number,
  _keyframeInterval: number // Used in caller for config output
): EvaluationResult {
  // Create track manager with simulated clock
  let simulatedTime = 0
  const trackManager = new TrackManager({
    clock: () => simulatedTime,
  })

  // Merge all frames across cameras and sort by timestamp
  interface TimedFrame {
    cameraId: string
    frame: DetectionFrame
  }

  const allFrames: TimedFrame[] = []
  for (const source of sources) {
    for (const frame of source.file.frames) {
      allFrames.push({ cameraId: source.cameraId, frame })
    }
  }
  allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

  // Initialize matcher state
  const matcherState = new TrackMatcherState()
  const frameResults: FrameMatchResult[] = []

  // Track which keyframes we've evaluated
  const evaluatedKeyframes = new Set<number>()

  // Batch detections by timestamp (33ms window like production sync buffer)
  const frameBucketMs = ALGORITHM_CONSTANTS.sync.frameBucketMs // 33ms @ 30fps

  // Group frames into time buckets
  interface TimeBucket {
    timestampMs: number
    frames: TimedFrame[]
  }

  const buckets: TimeBucket[] = []
  let currentBucket: TimeBucket | null = null

  for (const timedFrame of allFrames) {
    const frameTimestampMs = Math.round(timedFrame.frame.timestamp * 1000)

    if (!currentBucket || frameTimestampMs - currentBucket.timestampMs > frameBucketMs) {
      // Start new bucket
      currentBucket = { timestampMs: frameTimestampMs, frames: [] }
      buckets.push(currentBucket)
    }
    currentBucket.frames.push(timedFrame)
  }

  // Process buckets
  let bucketIndex = 0
  for (const bucket of buckets) {
    // Update simulated time to bucket timestamp
    simulatedTime = bucket.timestampMs

    // Collect all detections from all cameras in this bucket
    const batchDetections: CameraDetection[] = []

    for (const { cameraId, frame } of bucket.frames) {
      for (const detection of frame.detections) {
        if (detection.class_name !== 'person') continue
        if (detection.confidence < ALGORITHM_CONSTANTS.detection.minConfidence) continue

        const projected = projectDetection(
          cameraRegistry,
          cameraId,
          detection,
          bucket.timestampMs
        )
        if (projected) {
          batchDetections.push(projected)
        }
      }
    }

    // Process entire batch together (enables cross-camera clustering)
    if (batchDetections.length > 0) {
      trackManager.processBatchDetections(batchDetections)
    }

    // Check if this bucket aligns with a ground truth keyframe
    const keyframeSec = Math.round(bucket.timestampMs / 1000)
    if (groundTruth.keyframes.includes(keyframeSec) && !evaluatedKeyframes.has(keyframeSec)) {
      evaluatedKeyframes.add(keyframeSec)

      // Get ground truth annotations for this keyframe
      const gtAnnotations = getAnnotationsAtKeyframe(groundTruth, keyframeSec)
      if (gtAnnotations.length === 0) continue

      // Get current tracks as JSON
      const tracks: GlobalTrackJSON[] = trackManager
        .getActiveTracks()
        .map(trackToJSON)

      // Match tracks to ground truth
      const result = matchTracksToGT(gtAnnotations, tracks, matcherState, {
        maxMatchDistance: matchThreshold,
        timestamp: keyframeSec,
      })

      frameResults.push(result)
    }

    bucketIndex++
    if (bucketIndex % 100 === 0) {
      process.stdout.write(`\rProcessed ${bucketIndex}/${buckets.length} time buckets...`)
    }
  }
  console.log(`\rProcessed ${buckets.length} time buckets (from ${allFrames.length} frames).`)

  // Compute final metrics (extended MOT Challenge metrics including IDF1, MT/PT/ML)
  const metrics = computeExtendedMOTMetrics(frameResults, matcherState, groundTruth.persons)

  return {
    metrics,
    frameResults,
    matcherState,
    thresholdViolations: [],
  }
}

/**
 * Check thresholds and return violations
 */
function checkThresholds(metrics: MOTMetrics, thresholds: ThresholdConfig): string[] {
  const violations: string[] = []

  if (thresholds.minMota !== undefined && metrics.MOTA < thresholds.minMota) {
    violations.push(
      `MOTA ${(metrics.MOTA * 100).toFixed(1)}% is below minimum ${(thresholds.minMota * 100).toFixed(1)}%`
    )
  }

  if (thresholds.maxMotp !== undefined && metrics.MOTP > thresholds.maxMotp) {
    violations.push(
      `MOTP ${metrics.MOTP.toFixed(2)}m exceeds maximum ${thresholds.maxMotp.toFixed(2)}m`
    )
  }

  if (thresholds.maxIdSwitches !== undefined && metrics.idSwitches > thresholds.maxIdSwitches) {
    violations.push(
      `ID switches ${metrics.idSwitches} exceeds maximum ${thresholds.maxIdSwitches}`
    )
  }

  if (thresholds.maxFalseNegativeRate !== undefined) {
    const fnRate = metrics.totalGT > 0 ? metrics.falseNegatives / metrics.totalGT : 0
    if (fnRate > thresholds.maxFalseNegativeRate) {
      violations.push(
        `False negative rate ${(fnRate * 100).toFixed(1)}% exceeds maximum ${(thresholds.maxFalseNegativeRate * 100).toFixed(1)}%`
      )
    }
  }

  if (thresholds.maxFalsePositiveRate !== undefined) {
    const total = metrics.truePositives + metrics.falsePositives
    const fpRate = total > 0 ? metrics.falsePositives / total : 0
    if (fpRate > thresholds.maxFalsePositiveRate) {
      violations.push(
        `False positive rate ${(fpRate * 100).toFixed(1)}% exceeds maximum ${(thresholds.maxFalsePositiveRate * 100).toFixed(1)}%`
      )
    }
  }

  return violations
}

// ============================================================================
// CLI Program
// ============================================================================

const program = new Command()

program
  .name('evaluate-metrics')
  .description('Evaluate MOT metrics (MOTA/MOTP) using ground truth annotations - standalone mode')
  .requiredOption('--ground-truth <path>', 'Path to ground truth annotations JSON')
  .option('-d, --detection <path>', 'Detection file path (can be specified multiple times)', (val, prev: string[]) => [...prev, val], [])
  .option('-c, --camera <id>', 'Camera ID (can be specified multiple times, must match --detection order)', (val, prev: string[]) => [...prev, val], [])
  .option('--sitemap <path>', 'Path to sitemap JSON (for camera calibrations)')
  .option('--match-threshold <meters>', 'Maximum distance for GT-track match', '2.0')
  .option('--keyframe-interval <seconds>', 'Keyframe interval override', '1')
  .option('--output <path>', 'Save results to JSON file')
  .option('--json', 'Output results as JSON only', false)
  .option('--verbose', 'Show detailed per-keyframe results', false)
  // CI threshold options
  .option('--min-mota <value>', 'Minimum MOTA threshold (0-1)')
  .option('--max-motp <meters>', 'Maximum MOTP threshold')
  .option('--max-id-switches <count>', 'Maximum ID switch count')
  .option('--max-fn-rate <value>', 'Maximum false negative rate (0-1)')
  .option('--max-fp-rate <value>', 'Maximum false positive rate (0-1)')
  .action(async (options) => {
    try {
      // Validate required options
      const gtPath = resolve(options.groundTruth)
      if (!existsSync(gtPath)) {
        console.error(`Error: Ground truth file not found: ${gtPath}`)
        process.exit(1)
      }

      // Parse detection files and camera IDs
      const detectionPaths: string[] = options.detection || []
      const cameraIds: string[] = options.camera || []

      if (detectionPaths.length !== cameraIds.length) {
        console.error('Error: Number of --detections must match number of --camera arguments')
        console.error(`  Got ${detectionPaths.length} detection files and ${cameraIds.length} camera IDs`)
        process.exit(1)
      }

      if (detectionPaths.length === 0) {
        console.error('Error: At least one --detections and --camera pair is required')
        process.exit(1)
      }

      const matchThreshold = parseFloat(options.matchThreshold)
      const keyframeInterval = parseInt(options.keyframeInterval, 10)

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

      if (validation.warnings.length > 0 && !options.json) {
        console.warn('Ground truth warnings:')
        for (const warning of validation.warnings.slice(0, 5)) {
          console.warn(`  - ${warning}`)
        }
        if (validation.warnings.length > 5) {
          console.warn(`  ... and ${validation.warnings.length - 5} more warnings`)
        }
      }

      const groundTruth = indexGroundTruth(gtData)

      if (!options.json) {
        printGroundTruthSummary(groundTruth)
      }

      // Load sitemap for calibrations
      let siteMap: SiteMap | null = null
      if (options.sitemap) {
        const sitemapPath = resolve(options.sitemap)
        siteMap = loadSiteMap(sitemapPath)
        if (!siteMap) {
          console.error('Failed to load sitemap')
          process.exit(1)
        }
        if (!options.json) {
          console.log(`Loaded sitemap: ${sitemapPath}`)
        }
      }

      // Set up camera registry with calibrations
      const cameraRegistry = new CameraRegistry()

      // First try to load polynomial calibration from calibration.json in cwd
      const calibrationPath = resolve(process.cwd(), 'calibration.json')
      if (existsSync(calibrationPath)) {
        await cameraRegistry.loadCalibrationFromFile(calibrationPath)
      } else if (siteMap?.cameras) {
        // Fallback to sitemap calibration if no calibration.json
        for (const cam of siteMap.cameras) {
          if (cam.calibration) {
            cameraRegistry.setCalibration(cam.id, cam.calibration)
          }
        }
      }

      // Load detection files
      const sources: CameraDetectionSource[] = []
      for (let i = 0; i < detectionPaths.length; i++) {
        const filePath = resolve(detectionPaths[i])
        const cameraId = cameraIds[i]

        if (!options.json) {
          console.log(`Loading detections: ${filePath} -> ${cameraId}`)
        }

        const file = loadDetectionFile(filePath)
        if (!file) {
          process.exit(1)
        }

        // Verify camera has calibration
        if (!cameraRegistry.getCalibration(cameraId)) {
          console.error(`Error: No calibration found for camera ${cameraId}`)
          console.error('  Make sure --sitemap is provided and contains calibration for this camera')
          process.exit(1)
        }

        sources.push({ cameraId, file, filePath })
      }

      if (!options.json) {
        console.log('')
        console.log('=== Running Evaluation ===')
        console.log(`Match threshold: ${matchThreshold}m`)
        console.log(`Cameras: ${cameraIds.join(', ')}`)
        console.log('')
      }

      // Run evaluation
      const result = runEvaluation(
        sources,
        groundTruth,
        cameraRegistry,
        matchThreshold,
        keyframeInterval
      )

      // Check thresholds
      const thresholds: ThresholdConfig = {}
      if (options.minMota !== undefined) thresholds.minMota = parseFloat(options.minMota)
      if (options.maxMotp !== undefined) thresholds.maxMotp = parseFloat(options.maxMotp)
      if (options.maxIdSwitches !== undefined) thresholds.maxIdSwitches = parseInt(options.maxIdSwitches, 10)
      if (options.maxFnRate !== undefined) thresholds.maxFalseNegativeRate = parseFloat(options.maxFnRate)
      if (options.maxFpRate !== undefined) thresholds.maxFalsePositiveRate = parseFloat(options.maxFpRate)

      const violations = checkThresholds(result.metrics, thresholds)

      // Compile full evaluation result using the actual matcher state
      const evalResult = compileEvaluationResult(
        result.frameResults,
        groundTruth.persons,
        result.matcherState,
        {
          matchDistanceThreshold: matchThreshold,
          keyframeInterval,
        },
        groundTruth.meta.version
      )

      // Use the extended metrics we computed
      evalResult.mot = result.metrics

      // Output results
      if (options.json) {
        const output = {
          ...evalResult,
          thresholds: Object.keys(thresholds).length > 0 ? thresholds : undefined,
          violations: violations.length > 0 ? violations : undefined,
          passed: violations.length === 0,
        }
        console.log(JSON.stringify(output, null, 2))
      } else {
        printEvaluationSummary(evalResult)

        // Print threshold check results
        if (Object.keys(thresholds).length > 0) {
          console.log('\n=== Threshold Checks ===')
          if (violations.length === 0) {
            console.log('All thresholds PASSED')
          } else {
            console.log('FAILED thresholds:')
            for (const violation of violations) {
              console.log(`  - ${violation}`)
            }
          }
        }

        // Print summary line for quick reference
        console.log('\n' + getSummaryLine(result.metrics))
      }

      // Save to file if requested
      if (options.output) {
        const outputPath = resolve(options.output)
        const output = {
          ...evalResult,
          thresholds: Object.keys(thresholds).length > 0 ? thresholds : undefined,
          violations: violations.length > 0 ? violations : undefined,
          passed: violations.length === 0,
        }
        writeFileSync(outputPath, JSON.stringify(output, null, 2))
        if (!options.json) {
          console.log(`\nResults saved to: ${outputPath}`)
        }
      }

      // Exit with appropriate code
      if (violations.length > 0) {
        process.exit(2) // Threshold violation
      }
      process.exit(0) // Success
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
