#!/usr/bin/env node
/**
 * Camera Calibration Optimizer
 *
 * Finds optimal camera configuration by comparing projected positions
 * against ground truth using a two-phase grid search.
 *
 * Usage:
 *   pnpm cli:calibrate --file detections.json.gz --ground-truth "1,8;1.5,8"
 */

import { Command } from 'commander'
import { createReadStream, readFileSync, existsSync, writeFileSync } from 'fs'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'

import { projectDetectionToGround } from '../projection/ground-plane.js'
import { undistortPoint } from '../projection/lens-distortion.js'
import type { CameraParams, Point2D, DetectionBBox, DistortionCoeffs } from '../types.js'
import type {
  CalibrationConfig,
  CalibrationResult,
  ConfigScore,
  DetectionFile,
  DetectionFrame,
  FrameError,
  RoomConstraints,
  SweepConfig,
} from './types.js'

// ============================================================================
// Constants
// ============================================================================

const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

// For seated/partial people, extend bbox downward to estimate feet position
// This multiplier extends the bbox height downward (1.0 = no extension, 1.5 = extend by 50%)
let BBOX_HEIGHT_EXTENSION = 1.0

// Default sweep configuration - covers full parameter space
const DEFAULT_COARSE_SWEEP: SweepConfig = {
  positionX: { min: 0, max: 18, step: 2 },      // Full room width
  positionY: { min: 0, max: 12, step: 2 },      // Full room height
  azimuth: { min: 0, max: 350, step: 15 },      // Full 360 degrees
  elevation: { min: 5, max: 60, step: 5 },      // 5-60 degrees down
  height: { min: 2, max: 5, step: 0.5 },        // Typical ceiling mount heights
  fieldOfView: { min: 60, max: 120, step: 10 }, // Wide FOV range
}

const DEFAULT_FINE_SWEEP: SweepConfig = {
  positionX: { min: -1, max: 1, step: 0.1 },  // Relative to best coarse
  positionY: { min: -1, max: 1, step: 0.1 },
  azimuth: { min: -3, max: 3, step: 0.5 },
  elevation: { min: -3, max: 3, step: 0.5 },
  height: { min: -0.3, max: 0.3, step: 0.1 },
  fieldOfView: { min: -6, max: 6, step: 1 },
}

const DISTORTION_SWEEP: SweepConfig = {
  positionX: { min: 0, max: 0, step: 1 },
  positionY: { min: 0, max: 0, step: 1 },
  azimuth: { min: 0, max: 0, step: 1 },
  elevation: { min: 0, max: 0, step: 1 },
  height: { min: 0, max: 0, step: 1 },
  fieldOfView: { min: 0, max: 0, step: 1 },
  distortion: {
    k1: { min: -0.3, max: 0.1, step: 0.02 },
    k2: { min: -0.1, max: 0.1, step: 0.01 },
  },
}

// ============================================================================
// Utility Functions
// ============================================================================

function euclideanDistance(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function rangeValues(range: { min: number; max: number; step: number }): number[] {
  const values: number[] = []
  for (let v = range.min; v <= range.max + 0.0001; v += range.step) {
    values.push(Math.round(v * 1000) / 1000) // Avoid floating point issues
  }
  return values
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Normalize azimuth to [0, 360) range
 * Handles wraparound (e.g., 370° -> 10°, -10° -> 350°)
 */
function normalizeAzimuth(azimuth: number): number {
  return ((azimuth % 360) + 360) % 360
}

// ============================================================================
// Constraint Validation
// ============================================================================

/**
 * Check if camera position is on or near room perimeter (wall-mounted)
 *
 * A wall-mounted camera should be:
 * - On a wall edge (x=0, x=width, y=0, or y=height) OR
 * - Outside the room (looking in) OR
 * - Near a wall edge (within margin distance)
 *
 * @param config Camera configuration
 * @param room Room dimensions
 * @returns true if position is valid (on/near perimeter or outside)
 */
function isPositionOnPerimeter(
  config: CalibrationConfig,
  room: RoomConstraints
): boolean {
  const { x, y } = config.position
  const margin = room.margin ?? 0

  // Camera is outside room bounds (valid - looking in)
  if (x < 0 || x > room.width || y < 0 || y > room.height) {
    return true
  }

  // Camera is near a wall edge (within margin tolerance from inside)
  const nearLeftWall = x <= margin
  const nearRightWall = x >= room.width - margin
  const nearBottomWall = y <= margin
  const nearTopWall = y >= room.height - margin

  return nearLeftWall || nearRightWall || nearBottomWall || nearTopWall
}

/**
 * Check if camera azimuth points into the room
 *
 * For wall-mounted cameras, the azimuth should generally point inward.
 * This checks that the camera is pointing toward the room center.
 *
 * @param config Camera configuration
 * @param room Room dimensions
 * @returns true if azimuth points generally toward room interior
 */
function isAzimuthPointingInward(
  config: CalibrationConfig,
  room: RoomConstraints
): boolean {
  const { x, y } = config.position
  const azimuth = normalizeAzimuth(config.azimuth)
  const roomCenterX = room.width / 2
  const roomCenterY = room.height / 2

  // Calculate angle from camera to room center
  const dx = roomCenterX - x
  const dy = roomCenterY - y

  // Convert to azimuth convention (0° = +Y, clockwise)
  // atan2 gives angle from +X axis, counter-clockwise
  const angleToCenter = normalizeAzimuth(90 - (Math.atan2(dy, dx) * 180 / Math.PI))

  // Allow ±90° tolerance (camera FOV covers room center direction)
  const angleDiff = Math.abs(normalizeAzimuth(azimuth - angleToCenter))
  const tolerance = 90 // degrees

  return angleDiff <= tolerance || angleDiff >= (360 - tolerance)
}

/**
 * Validate camera configuration against room constraints
 *
 * @param config Camera configuration to validate
 * @param room Room dimensions (null to skip validation)
 * @returns true if configuration satisfies all constraints
 */
function isValidConfig(
  config: CalibrationConfig,
  room: RoomConstraints | null
): boolean {
  if (!room) return true // No constraints

  // Check position is on/outside room perimeter
  if (!isPositionOnPerimeter(config, room)) {
    return false
  }

  // Check azimuth points into the room
  if (!isAzimuthPointingInward(config, room)) {
    return false
  }

  return true
}

// ============================================================================
// Detection File Loading
// ============================================================================

async function loadDetectionFile(filePath: string): Promise<DetectionFile | null> {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return null
  }

  try {
    if (filePath.endsWith('.gz')) {
      const chunks: Buffer[] = []
      const gunzip = createGunzip()
      const source = createReadStream(filePath)

      await pipeline(
        source,
        gunzip,
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk as Buffer)
          }
        }
      )

      const content = Buffer.concat(chunks).toString('utf-8')
      return JSON.parse(content)
    } else {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Error loading file:', error)
    return null
  }
}

function selectSampleFrames(frames: DetectionFrame[], count: number): DetectionFrame[] {
  // Filter frames with exactly 2 high-confidence detections
  const validFrames = frames.filter(f =>
    f.detections.length === 2 &&
    f.detections.every(d => d.confidence >= 0.8 && d.class_name === 'person')
  )

  if (validFrames.length === 0) {
    console.warn('No frames with exactly 2 high-confidence detections found')
    return []
  }

  if (validFrames.length <= count) {
    return validFrames
  }

  // Sample evenly across the valid frames
  const step = Math.floor(validFrames.length / count)
  const sampled: DetectionFrame[] = []
  for (let i = 0; i < validFrames.length && sampled.length < count; i += step) {
    sampled.push(validFrames[i])
  }

  return sampled
}

// ============================================================================
// Projection and Error Calculation
// ============================================================================

function configToCameraParams(config: CalibrationConfig): CameraParams {
  return {
    position: {
      x: config.position.x,
      y: config.position.y,
      z: config.height,
    },
    azimuth: config.azimuth,
    elevation: config.elevation,
    fov: config.fieldOfView,
  }
}

function bboxFromLTRB(bbox: { left: number; top: number; right: number; bottom: number }): DetectionBBox {
  return {
    x: bbox.left,
    y: bbox.top,
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
  }
}

/**
 * Project a detection to ground plane
 *
 * For seated/partial people, the bbox can be extended downward to estimate
 * where feet would be if the full body was visible.
 */
function projectDetection(
  detection: { bbox: { left: number; top: number; right: number; bottom: number } },
  camera: CameraParams,
  distortion?: DistortionCoeffs
): Point2D | null {
  const bbox = bboxFromLTRB(detection.bbox)

  // Apply bbox height extension if configured
  // This extends the bbox downward to estimate feet position for seated people
  let extendedHeight = bbox.height
  if (BBOX_HEIGHT_EXTENSION > 1.0) {
    extendedHeight = bbox.height * BBOX_HEIGHT_EXTENSION
  }

  // Get feet position (bottom-center of extended bbox)
  let footX = (bbox.x + bbox.width / 2) * IMAGE_WIDTH
  let footY = (bbox.y + extendedHeight) * IMAGE_HEIGHT

  // Clamp footY to image bounds
  footY = Math.min(footY, IMAGE_HEIGHT - 1)

  // Apply distortion correction if provided
  if (distortion && (distortion.k1 !== 0 || distortion.k2 !== 0)) {
    const fx = (IMAGE_WIDTH / 2) / Math.tan((camera.fov * Math.PI / 180) / 2)
    const fy = fx
    const cx = IMAGE_WIDTH / 2
    const cy = IMAGE_HEIGHT / 2

    const corrected = undistortPoint(footX, footY, fx, fy, cx, cy, distortion)
    footX = corrected.x
    footY = corrected.y
  }

  // Project to ground plane (z=0)
  const result = projectDetectionToGround(
    { x: footX, y: footY, width: 0, height: 0 },
    camera,
    [], // No tables for calibration
    false, // Already in pixel coordinates
    IMAGE_WIDTH,
    IMAGE_HEIGHT
  )

  if (!result.isValid) {
    return null
  }

  return result.worldPoint
}

function calculateFrameError(
  frame: DetectionFrame,
  config: CalibrationConfig,
  groundTruth: Point2D[]
): FrameError | null {
  const camera = configToCameraParams(config)

  // Project both detections
  const projected: Point2D[] = []
  for (const detection of frame.detections) {
    const pos = projectDetection(detection, camera, config.distortion)
    if (pos === null) {
      return null // Invalid projection
    }
    projected.push(pos)
  }

  // Build 2x2 cost matrix for Hungarian assignment
  // Since we only have 2x2, we can do this manually
  const cost00 = euclideanDistance(projected[0], groundTruth[0])
  const cost01 = euclideanDistance(projected[0], groundTruth[1])
  const cost10 = euclideanDistance(projected[1], groundTruth[0])
  const cost11 = euclideanDistance(projected[1], groundTruth[1])

  // Find optimal assignment (min sum matching)
  const straightCost = cost00 + cost11
  const crossedCost = cost01 + cost10

  let assignment: Array<{ detection: number; groundTruth: number }>
  let matchedError: number
  let individualErrors: number[]

  if (straightCost <= crossedCost) {
    assignment = [{ detection: 0, groundTruth: 0 }, { detection: 1, groundTruth: 1 }]
    matchedError = straightCost
    individualErrors = [cost00, cost11]
  } else {
    assignment = [{ detection: 0, groundTruth: 1 }, { detection: 1, groundTruth: 0 }]
    matchedError = crossedCost
    individualErrors = [cost01, cost10]
  }

  return {
    frameNumber: frame.frame_number,
    projectedPositions: projected,
    matchedError,
    individualErrors,
    assignment,
  }
}

function evaluateConfig(
  config: CalibrationConfig,
  frames: DetectionFrame[],
  groundTruth: Point2D[]
): ConfigScore {
  const frameErrors: FrameError[] = []
  let validProjections = 0

  for (const frame of frames) {
    const error = calculateFrameError(frame, config, groundTruth)
    if (error) {
      frameErrors.push(error)
      validProjections++
    }
  }

  if (frameErrors.length === 0) {
    return {
      config,
      totalError: Infinity,
      meanError: Infinity,
      maxError: Infinity,
      minError: Infinity,
      stdDev: 0,
      validProjections: 0,
      totalFrames: frames.length,
      frameErrors: [],
    }
  }

  const allErrors = frameErrors.flatMap(e => e.individualErrors)
  const totalError = allErrors.reduce((a, b) => a + b, 0)

  return {
    config,
    totalError,
    meanError: totalError / allErrors.length,
    maxError: Math.max(...allErrors),
    minError: Math.min(...allErrors),
    stdDev: stdDev(allErrors),
    validProjections,
    totalFrames: frames.length,
    frameErrors,
  }
}

// ============================================================================
// Grid Search
// ============================================================================

function* generateCoarseConfigs(sweep: SweepConfig): Generator<CalibrationConfig> {
  const posXValues = rangeValues(sweep.positionX)
  const posYValues = rangeValues(sweep.positionY)
  const azimuthValues = rangeValues(sweep.azimuth)
  const elevationValues = rangeValues(sweep.elevation)
  const heightValues = rangeValues(sweep.height)
  const fovValues = rangeValues(sweep.fieldOfView)

  for (const posX of posXValues) {
    for (const posY of posYValues) {
      for (const azimuth of azimuthValues) {
        for (const elevation of elevationValues) {
          for (const height of heightValues) {
            for (const fov of fovValues) {
              yield {
                position: { x: posX, y: posY },
                azimuth,
                elevation,
                height,
                fieldOfView: fov,
              }
            }
          }
        }
      }
    }
  }
}

function* generateFineConfigs(
  base: CalibrationConfig,
  sweep: SweepConfig
): Generator<CalibrationConfig> {
  const posXValues = rangeValues({
    min: base.position.x + sweep.positionX.min,
    max: base.position.x + sweep.positionX.max,
    step: sweep.positionX.step,
  })
  const posYValues = rangeValues({
    min: base.position.y + sweep.positionY.min,
    max: base.position.y + sweep.positionY.max,
    step: sweep.positionY.step,
  })
  const azimuthValues = rangeValues({
    min: base.azimuth + sweep.azimuth.min,
    max: base.azimuth + sweep.azimuth.max,
    step: sweep.azimuth.step,
  })
  const elevationValues = rangeValues({
    min: base.elevation + sweep.elevation.min,
    max: base.elevation + sweep.elevation.max,
    step: sweep.elevation.step,
  })
  const heightValues = rangeValues({
    min: base.height + sweep.height.min,
    max: base.height + sweep.height.max,
    step: sweep.height.step,
  })
  const fovValues = rangeValues({
    min: base.fieldOfView + sweep.fieldOfView.min,
    max: base.fieldOfView + sweep.fieldOfView.max,
    step: sweep.fieldOfView.step,
  })

  for (const posX of posXValues) {
    for (const posY of posYValues) {
      for (const azimuth of azimuthValues) {
        for (const elevation of elevationValues) {
          for (const height of heightValues) {
            for (const fov of fovValues) {
              yield {
                position: { x: posX, y: posY },
                azimuth,
                elevation,
                height,
                fieldOfView: fov,
              }
            }
          }
        }
      }
    }
  }
}

function* generateDistortionConfigs(
  base: CalibrationConfig,
  sweep: SweepConfig
): Generator<CalibrationConfig> {
  if (!sweep.distortion) return

  const k1Values = rangeValues(sweep.distortion.k1)
  const k2Values = rangeValues(sweep.distortion.k2)

  for (const k1 of k1Values) {
    for (const k2 of k2Values) {
      yield {
        ...base,
        distortion: {
          k1,
          k2,
          k3: 0,
          p1: 0,
          p2: 0,
        },
      }
    }
  }
}

function countConfigs(sweep: SweepConfig): number {
  const dims = [
    rangeValues(sweep.positionX).length,
    rangeValues(sweep.positionY).length,
    rangeValues(sweep.azimuth).length,
    rangeValues(sweep.elevation).length,
    rangeValues(sweep.height).length,
    rangeValues(sweep.fieldOfView).length,
  ]
  return dims.reduce((a, b) => a * b, 1)
}

function runCoarseSearch(
  frames: DetectionFrame[],
  groundTruth: Point2D[],
  sweep: SweepConfig,
  verbose: boolean,
  room: RoomConstraints | null = null
): ConfigScore {
  const totalConfigs = countConfigs(sweep)
  const constraintMsg = room ? ` (room constraints: ${room.width}x${room.height}m)` : ''
  console.log(`Phase 1: Coarse Grid Search (${totalConfigs.toLocaleString()} combinations)${constraintMsg}`)

  let bestScore: ConfigScore | null = null
  let count = 0
  let skipped = 0
  const startTime = Date.now()
  const updateInterval = Math.max(1, Math.floor(totalConfigs / 20))

  for (const config of generateCoarseConfigs(sweep)) {
    count++

    // Skip configs that violate room constraints
    if (!isValidConfig(config, room)) {
      skipped++
      continue
    }

    const score = evaluateConfig(config, frames, groundTruth)

    if (bestScore === null || score.meanError < bestScore.meanError) {
      bestScore = score
      if (verbose) {
        console.log(`  [${count}] New best: error=${score.meanError.toFixed(3)}m @ ` +
          `azimuth=${config.azimuth}, elev=${config.elevation}, ` +
          `height=${config.height}, FOV=${config.fieldOfView}`)
      }
    }

    if (count % updateInterval === 0) {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.round((count / totalConfigs) * 100)
      process.stdout.write(`\r  Progress: ${progress}% | Best error: ${bestScore?.meanError.toFixed(3) ?? '?'}m | Elapsed: ${elapsed.toFixed(1)}s`)
    }
  }

  const elapsed = (Date.now() - startTime) / 1000
  console.log(`\n  Completed in ${elapsed.toFixed(1)}s`)
  if (skipped > 0) {
    console.log(`  Skipped ${skipped.toLocaleString()} configs (${Math.round(skipped / totalConfigs * 100)}%) due to constraints`)
  }

  if (!bestScore) {
    console.error('  ERROR: No valid configurations found! Check room constraints.')
    process.exit(1)
  }

  console.log(`  Best coarse config: error=${bestScore.meanError.toFixed(3)}m`)
  console.log(`    position: (${bestScore.config.position.x}, ${bestScore.config.position.y})`)
  console.log(`    azimuth: ${bestScore.config.azimuth}, elevation: ${bestScore.config.elevation}`)
  console.log(`    height: ${bestScore.config.height}, FOV: ${bestScore.config.fieldOfView}`)

  return bestScore
}

function runFineSearch(
  frames: DetectionFrame[],
  groundTruth: Point2D[],
  baseConfig: CalibrationConfig,
  sweep: SweepConfig,
  verbose: boolean,
  room: RoomConstraints | null = null
): ConfigScore {
  // Count combinations for fine sweep
  const totalConfigs =
    rangeValues({ min: baseConfig.position.x + sweep.positionX.min, max: baseConfig.position.x + sweep.positionX.max, step: sweep.positionX.step }).length *
    rangeValues({ min: baseConfig.position.y + sweep.positionY.min, max: baseConfig.position.y + sweep.positionY.max, step: sweep.positionY.step }).length *
    rangeValues({ min: baseConfig.azimuth + sweep.azimuth.min, max: baseConfig.azimuth + sweep.azimuth.max, step: sweep.azimuth.step }).length *
    rangeValues({ min: baseConfig.elevation + sweep.elevation.min, max: baseConfig.elevation + sweep.elevation.max, step: sweep.elevation.step }).length *
    rangeValues({ min: baseConfig.height + sweep.height.min, max: baseConfig.height + sweep.height.max, step: sweep.height.step }).length *
    rangeValues({ min: baseConfig.fieldOfView + sweep.fieldOfView.min, max: baseConfig.fieldOfView + sweep.fieldOfView.max, step: sweep.fieldOfView.step }).length

  console.log(`\nPhase 2: Fine Grid Search (${totalConfigs.toLocaleString()} combinations)`)

  let bestScore: ConfigScore | null = null
  let count = 0
  let skipped = 0
  const startTime = Date.now()
  const updateInterval = Math.max(1, Math.floor(totalConfigs / 20))

  for (const config of generateFineConfigs(baseConfig, sweep)) {
    count++

    // Skip configs that violate room constraints
    if (!isValidConfig(config, room)) {
      skipped++
      continue
    }

    const score = evaluateConfig(config, frames, groundTruth)

    if (bestScore === null || score.meanError < bestScore.meanError) {
      bestScore = score
      if (verbose) {
        console.log(`  [${count}] New best: error=${score.meanError.toFixed(3)}m`)
      }
    }

    if (count % updateInterval === 0) {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.round((count / totalConfigs) * 100)
      process.stdout.write(`\r  Progress: ${progress}% | Best error: ${bestScore?.meanError.toFixed(3) ?? '?'}m | Elapsed: ${elapsed.toFixed(1)}s`)
    }
  }

  const elapsed = (Date.now() - startTime) / 1000
  console.log(`\n  Completed in ${elapsed.toFixed(1)}s`)
  if (skipped > 0) {
    console.log(`  Skipped ${skipped.toLocaleString()} configs due to constraints`)
  }

  if (!bestScore) {
    console.error('  ERROR: No valid configurations found in fine search!')
    process.exit(1)
  }

  console.log(`  Best fine config: error=${bestScore.meanError.toFixed(3)}m`)

  return bestScore
}

function runDistortionSearch(
  frames: DetectionFrame[],
  groundTruth: Point2D[],
  baseConfig: CalibrationConfig,
  sweep: SweepConfig,
  verbose: boolean
): ConfigScore {
  if (!sweep.distortion) return evaluateConfig(baseConfig, frames, groundTruth)

  const k1Count = rangeValues(sweep.distortion.k1).length
  const k2Count = rangeValues(sweep.distortion.k2).length
  const totalConfigs = k1Count * k2Count

  console.log(`\nPhase 3: Distortion Optimization (${totalConfigs.toLocaleString()} combinations)`)

  let bestScore: ConfigScore | null = null
  let count = 0
  const startTime = Date.now()

  for (const config of generateDistortionConfigs(baseConfig, sweep)) {
    count++

    const score = evaluateConfig(config, frames, groundTruth)

    if (bestScore === null || score.meanError < bestScore.meanError) {
      bestScore = score
      if (verbose) {
        console.log(`  [${count}] New best: error=${score.meanError.toFixed(3)}m @ k1=${config.distortion?.k1}, k2=${config.distortion?.k2}`)
      }
    }

    if (count % 50 === 0) {
      const progress = Math.round((count / totalConfigs) * 100)
      process.stdout.write(`\r  Progress: ${progress}% | Best error: ${bestScore?.meanError.toFixed(3) ?? '?'}m`)
    }
  }

  const elapsed = (Date.now() - startTime) / 1000
  console.log(`\n  Completed in ${elapsed.toFixed(1)}s`)

  if (bestScore!.config.distortion) {
    console.log(`  Best distortion: k1=${bestScore!.config.distortion.k1}, k2=${bestScore!.config.distortion.k2}`)
  }

  return bestScore!
}

// ============================================================================
// CLI Interface
// ============================================================================

const program = new Command()

program
  .name('calibrate-camera')
  .description('Find optimal camera configuration by comparing projections to ground truth')
  .requiredOption('-f, --file <path>', 'Path to detection JSON file (supports .json and .json.gz)')
  .requiredOption('-g, --ground-truth <points>', 'Ground truth positions as "x1,y1;x2,y2"')
  .option('-s, --samples <n>', 'Number of sample frames to use', '20')
  .option('-o, --output <path>', 'Output JSON file path for results')
  .option('--coarse-only', 'Skip fine and distortion optimization phases')
  .option('--skip-distortion', 'Skip distortion optimization phase')
  .option('-v, --verbose', 'Show detailed progress')
  .option('--bbox-extend <multiplier>', 'Extend bbox height downward for seated/partial people (e.g., 1.5 = extend by 50%)', '1.0')
  .option('-r, --room <dimensions>', 'Room dimensions as "width,height" in meters (enables constraint-aware search)')
  .option('--room-margin <meters>', 'Margin from room edge for wall detection (default: 0.5)', '0.5')
  .option('-p, --position <x,y>', 'Fixed camera position as "x,y" (skips position sweep)')
  .option('-a, --azimuth <degrees>', 'Fixed camera azimuth in degrees (skips azimuth sweep)')
  .option('--fov <degrees>', 'Fixed camera field of view in degrees (skips FOV sweep)')
  .action(async (options) => {
    // Set bbox height extension for seated/partial people
    BBOX_HEIGHT_EXTENSION = parseFloat(options.bboxExtend)
    if (isNaN(BBOX_HEIGHT_EXTENSION) || BBOX_HEIGHT_EXTENSION < 1.0) {
      BBOX_HEIGHT_EXTENSION = 1.0
    }
    const startTime = Date.now()

    // Parse ground truth
    const gtParts = options.groundTruth.split(';')
    if (gtParts.length !== 2) {
      console.error('Ground truth must have exactly 2 points (format: "x1,y1;x2,y2")')
      process.exit(1)
    }

    const groundTruth: Point2D[] = gtParts.map((part: string) => {
      const [x, y] = part.split(',').map(Number)
      if (isNaN(x) || isNaN(y)) {
        console.error(`Invalid ground truth point: ${part}`)
        process.exit(1)
      }
      return { x, y }
    })

    // Parse room constraints (optional)
    let roomConstraints: RoomConstraints | null = null
    if (options.room) {
      const [width, height] = options.room.split(',').map(Number)
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error('Invalid room dimensions (format: "width,height" in meters, e.g., "18,12")')
        process.exit(1)
      }
      const margin = parseFloat(options.roomMargin)
      roomConstraints = {
        width,
        height,
        margin: isNaN(margin) ? 0.5 : margin,
      }
    }

    // Parse fixed position (optional)
    let fixedPosition: { x: number; y: number } | null = null
    if (options.position) {
      const [x, y] = options.position.split(',').map(Number)
      if (isNaN(x) || isNaN(y)) {
        console.error('Invalid position (format: "x,y" in meters, e.g., "16,9")')
        process.exit(1)
      }
      fixedPosition = { x, y }
    }

    // Parse fixed azimuth (optional)
    let fixedAzimuth: number | null = null
    if (options.azimuth) {
      fixedAzimuth = parseFloat(options.azimuth)
      if (isNaN(fixedAzimuth)) {
        console.error('Invalid azimuth (must be a number in degrees)')
        process.exit(1)
      }
    }

    // Parse fixed FOV (optional)
    let fixedFov: number | null = null
    if (options.fov) {
      fixedFov = parseFloat(options.fov)
      if (isNaN(fixedFov)) {
        console.error('Invalid FOV (must be a number in degrees)')
        process.exit(1)
      }
    }

    console.log('=== Camera Configuration Calibration ===')
    console.log(`Ground Truth: [(${groundTruth[0].x}, ${groundTruth[0].y}), (${groundTruth[1].x}, ${groundTruth[1].y})]`)
    if (BBOX_HEIGHT_EXTENSION > 1.0) {
      console.log(`BBox extension: ${BBOX_HEIGHT_EXTENSION}x (extending bbox height downward for seated/partial people)`)
    }
    if (fixedPosition) {
      console.log(`Fixed position: (${fixedPosition.x}, ${fixedPosition.y})`)
    }
    if (fixedAzimuth !== null) {
      console.log(`Fixed azimuth: ${fixedAzimuth}°`)
    }
    if (fixedFov !== null) {
      console.log(`Fixed FOV: ${fixedFov}°`)
    }
    if (roomConstraints) {
      console.log(`Room constraints: ${roomConstraints.width}x${roomConstraints.height}m (margin: ${roomConstraints.margin}m)`)
      console.log(`  - Camera must be on/outside room perimeter`)
      console.log(`  - Camera must point toward room interior`)
    }

    // Load detection file
    console.log(`\nLoading: ${options.file}`)
    const data = await loadDetectionFile(options.file)

    if (!data) {
      console.error('Failed to load detection file')
      process.exit(1)
    }

    console.log(`  Video: ${data.video_info.width}x${data.video_info.height} @ ${data.video_info.fps.toFixed(2)}fps`)
    console.log(`  Total frames: ${data.frames.length}`)

    // Select sample frames
    const sampleCount = parseInt(options.samples, 10)
    const frames = selectSampleFrames(data.frames, sampleCount)

    if (frames.length === 0) {
      console.error('No valid frames found (need frames with exactly 2 high-confidence person detections)')
      process.exit(1)
    }

    console.log(`  Sample frames: ${frames.length} (from ${data.frames.filter(f => f.detections.length === 2).length} valid)`)

    // Create sweep config - fix parameters as specified
    let coarseSweep: SweepConfig = { ...DEFAULT_COARSE_SWEEP }
    let fineSweep: SweepConfig = { ...DEFAULT_FINE_SWEEP }

    if (fixedPosition) {
      coarseSweep.positionX = { min: fixedPosition.x, max: fixedPosition.x, step: 1 }
      coarseSweep.positionY = { min: fixedPosition.y, max: fixedPosition.y, step: 1 }
      fineSweep.positionX = { min: 0, max: 0, step: 1 }
      fineSweep.positionY = { min: 0, max: 0, step: 1 }
    }

    if (fixedAzimuth !== null) {
      coarseSweep.azimuth = { min: fixedAzimuth, max: fixedAzimuth, step: 1 }
      fineSweep.azimuth = { min: 0, max: 0, step: 1 }
    }

    if (fixedFov !== null) {
      coarseSweep.fieldOfView = { min: fixedFov, max: fixedFov, step: 1 }
      fineSweep.fieldOfView = { min: 0, max: 0, step: 1 }
    }

    // Run optimization
    let coarseScore = runCoarseSearch(frames, groundTruth, coarseSweep, options.verbose, roomConstraints)
    let bestScore = coarseScore
    let coarseCombinations = countConfigs(coarseSweep)
    let fineCombinations = 0

    if (!options.coarseOnly) {
      bestScore = runFineSearch(frames, groundTruth, coarseScore.config, fineSweep, options.verbose, roomConstraints)
      fineCombinations = countConfigs(fineSweep) // Approximate

      // Distortion optimization if error still > 0.5m
      if (!options.skipDistortion && bestScore.meanError > 0.5) {
        console.log(`\n  Mean error > 0.5m, trying distortion correction...`)
        const distortionScore = runDistortionSearch(frames, groundTruth, bestScore.config, DISTORTION_SWEEP, options.verbose)
        if (distortionScore.meanError < bestScore.meanError) {
          bestScore = distortionScore
        }
      }
    }

    const totalTime = Date.now() - startTime

    // Print final results
    console.log('\n' + '='.repeat(50))
    console.log('=== BEST CONFIGURATION ===')
    console.log('='.repeat(50))
    console.log(JSON.stringify({
      position: bestScore.config.position,
      azimuth: bestScore.config.azimuth,
      elevation: bestScore.config.elevation,
      height: bestScore.config.height,
      fieldOfView: bestScore.config.fieldOfView,
      ...(bestScore.config.distortion && { distortion: bestScore.config.distortion }),
    }, null, 2))

    console.log('\nError Statistics:')
    console.log(`  Mean error: ${bestScore.meanError.toFixed(3)}m (${(bestScore.meanError / 2).toFixed(3)}m per person)`)
    console.log(`  Max error:  ${bestScore.maxError.toFixed(3)}m`)
    console.log(`  Min error:  ${bestScore.minError.toFixed(3)}m`)
    console.log(`  Std dev:    ${bestScore.stdDev.toFixed(3)}m`)
    console.log(`  Valid projections: ${bestScore.validProjections}/${bestScore.totalFrames}`)

    // Show sample projections
    console.log('\nSample Projections:')
    const sampleErrors = bestScore.frameErrors.slice(0, 3)
    for (const fe of sampleErrors) {
      console.log(`  Frame ${fe.frameNumber}:`)
      for (let i = 0; i < fe.projectedPositions.length; i++) {
        const proj = fe.projectedPositions[i]
        const gtIdx = fe.assignment.find(a => a.detection === i)?.groundTruth ?? i
        const gt = groundTruth[gtIdx]
        const err = fe.individualErrors[i]
        console.log(`    Det${i + 1}: (${proj.x.toFixed(2)}, ${proj.y.toFixed(2)}) -> GT (${gt.x.toFixed(2)}, ${gt.y.toFixed(2)}) = ${err.toFixed(2)}m`)
      }
    }

    console.log(`\nTotal time: ${(totalTime / 1000).toFixed(1)}s`)

    // Save results if output specified
    if (options.output) {
      const result: CalibrationResult = {
        timestamp: new Date().toISOString(),
        dataset: options.file,
        groundTruth,
        samplesUsed: frames.length,
        bestConfig: bestScore.config,
        errorStats: {
          meanError: bestScore.meanError,
          maxError: bestScore.maxError,
          minError: bestScore.minError,
          stdDev: bestScore.stdDev,
          validProjectionRate: bestScore.validProjections / bestScore.totalFrames,
        },
        searchStats: {
          coarseCombinations,
          fineCombinations,
          totalTimeMs: totalTime,
        },
        sampleProjections: bestScore.frameErrors.slice(0, 10).map(fe => ({
          frame: fe.frameNumber,
          projected: fe.projectedPositions,
          groundTruth,
          errors: fe.individualErrors,
        })),
      }

      writeFileSync(options.output, JSON.stringify(result, null, 2))
      console.log(`\nResults saved to: ${options.output}`)
    }
  })

program.parse()
