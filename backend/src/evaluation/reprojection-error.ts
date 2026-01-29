/**
 * Reprojection Error Calculator
 *
 * Computes error between projected bbox positions and ground truth world positions.
 * Used to evaluate and refine camera calibration accuracy.
 */

import type { CameraCalibration, CameraParams } from '../types/camera.js'
import type {
  GroundTruthAnnotation,
  CameraReprojectionStats,
  ReprojectionSample,
} from '../types/ground-truth.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'

// ============================================================================
// Single Sample Error Calculation
// ============================================================================

/**
 * Project a single annotation bbox and compute error against ground truth
 */
export function computeReprojectionError(
  annotation: GroundTruthAnnotation,
  calibration: CameraCalibration,
  cameraParams: CameraParams | null = null,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): ReprojectionSample {
  // Annotation must have world position for calibration evaluation
  if (!annotation.worldPosition) {
    return {
      annotationId: annotation.id,
      cameraId: annotation.cameraId,
      personId: annotation.personId,
      timestamp: annotation.timestamp,
      gtPosition: { x: 0, y: 0 },
      projectedPosition: null,
      error: Infinity,
      isValid: false,
      invalidReason: 'no_world_position',
    }
  }

  // Convert normalized bbox array to DetectionBBox format
  const [x, y, width, height] = annotation.bbox
  const bbox = { x, y, width, height }

  // Project using existing K/R/T projection
  const result = projectDetectionWithKRT(
    bbox,
    calibration,
    cameraParams,
    [], // no tables for GT evaluation
    true, // isNormalized
    imageWidth,
    imageHeight
  )

  if (!result.isValid) {
    return {
      annotationId: annotation.id,
      cameraId: annotation.cameraId,
      personId: annotation.personId,
      timestamp: annotation.timestamp,
      gtPosition: annotation.worldPosition,
      projectedPosition: null,
      error: Infinity,
      isValid: false,
      invalidReason: result.reason ?? 'projection_failed',
    }
  }

  // Compute Euclidean distance to GT world position
  const dx = result.worldPoint.x - annotation.worldPosition.x
  const dy = result.worldPoint.y - annotation.worldPosition.y
  const error = Math.sqrt(dx * dx + dy * dy)

  return {
    annotationId: annotation.id,
    cameraId: annotation.cameraId,
    personId: annotation.personId,
    timestamp: annotation.timestamp,
    gtPosition: annotation.worldPosition,
    projectedPosition: result.worldPoint,
    error,
    isValid: true,
  }
}

// ============================================================================
// Camera-Level Statistics
// ============================================================================

/**
 * Compute reprojection statistics for all annotations of a camera
 */
export function computeCameraReprojectionStats(
  annotations: GroundTruthAnnotation[],
  calibration: CameraCalibration,
  cameraParams: CameraParams | null = null,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): CameraReprojectionStats {
  if (annotations.length === 0) {
    return {
      cameraId: 'unknown',
      sampleCount: 0,
      meanError: 0,
      maxError: 0,
      stdError: 0,
      medianError: 0,
      errors: [],
      invalidCount: 0,
    }
  }

  const samples = annotations.map((ann) =>
    computeReprojectionError(ann, calibration, cameraParams, imageWidth, imageHeight)
  )

  const validSamples = samples.filter((s) => s.isValid)
  const invalidCount = samples.length - validSamples.length
  const errors = validSamples.map((s) => s.error)

  if (errors.length === 0) {
    return {
      cameraId: annotations[0].cameraId,
      sampleCount: 0,
      meanError: 0,
      maxError: 0,
      stdError: 0,
      medianError: 0,
      errors: [],
      invalidCount,
    }
  }

  // Compute statistics
  const mean = errors.reduce((a, b) => a + b, 0) / errors.length
  const max = Math.max(...errors)
  const sorted = [...errors].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const variance = errors.reduce((sum, e) => sum + (e - mean) ** 2, 0) / errors.length
  const std = Math.sqrt(variance)

  return {
    cameraId: annotations[0].cameraId,
    sampleCount: validSamples.length,
    meanError: mean,
    maxError: max,
    stdError: std,
    medianError: median,
    errors,
    invalidCount,
  }
}

/**
 * Compute all individual reprojection samples for a camera
 */
export function computeCameraReprojectionSamples(
  annotations: GroundTruthAnnotation[],
  calibration: CameraCalibration,
  cameraParams: CameraParams | null = null,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): ReprojectionSample[] {
  return annotations.map((ann) =>
    computeReprojectionError(ann, calibration, cameraParams, imageWidth, imageHeight)
  )
}

// ============================================================================
// Error Pattern Analysis
// ============================================================================

/**
 * Analyze directional bias in reprojection errors
 * Returns systematic offset that could be corrected via calibration adjustment
 */
export function analyzeErrorBias(samples: ReprojectionSample[]): {
  biasX: number
  biasY: number
  hasBias: boolean
  biasAngleDeg: number
  biasMagnitude: number
} {
  const validSamples = samples.filter((s) => s.isValid && s.projectedPosition)

  if (validSamples.length < 3) {
    return { biasX: 0, biasY: 0, hasBias: false, biasAngleDeg: 0, biasMagnitude: 0 }
  }

  // Compute mean offset (projected - GT)
  let sumDx = 0
  let sumDy = 0
  for (const s of validSamples) {
    sumDx += s.projectedPosition!.x - s.gtPosition.x
    sumDy += s.projectedPosition!.y - s.gtPosition.y
  }

  const biasX = sumDx / validSamples.length
  const biasY = sumDy / validSamples.length
  const biasMagnitude = Math.sqrt(biasX * biasX + biasY * biasY)
  const biasAngleDeg = (Math.atan2(biasY, biasX) * 180) / Math.PI

  // Consider bias significant if > 0.2m systematic offset
  const hasBias = biasMagnitude > 0.2

  return { biasX, biasY, hasBias, biasAngleDeg, biasMagnitude }
}

/**
 * Compute error percentiles for detailed analysis
 */
export function computeErrorPercentiles(errors: number[]): {
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
} {
  if (errors.length === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
  }

  const sorted = [...errors].sort((a, b) => a - b)
  const percentile = (p: number) => sorted[Math.floor((sorted.length - 1) * p)]

  return {
    p50: percentile(0.5),
    p75: percentile(0.75),
    p90: percentile(0.9),
    p95: percentile(0.95),
    p99: percentile(0.99),
  }
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format reprojection stats for console output
 */
export function formatReprojectionStats(stats: CameraReprojectionStats): string {
  const lines: string[] = []

  lines.push(`Camera: ${stats.cameraId}`)
  lines.push(`  Samples: ${stats.sampleCount} valid, ${stats.invalidCount} invalid`)

  if (stats.sampleCount > 0) {
    lines.push(`  Mean Error: ${stats.meanError.toFixed(3)}m`)
    lines.push(`  Median Error: ${stats.medianError.toFixed(3)}m`)
    lines.push(`  Max Error: ${stats.maxError.toFixed(3)}m`)
    lines.push(`  Std Dev: ${stats.stdError.toFixed(3)}m`)

    const percentiles = computeErrorPercentiles(stats.errors)
    lines.push(`  Percentiles: p50=${percentiles.p50.toFixed(2)}m, p90=${percentiles.p90.toFixed(2)}m, p95=${percentiles.p95.toFixed(2)}m`)
  }

  return lines.join('\n')
}

/**
 * Print detailed sample errors (for verbose output)
 */
export function printSampleErrors(samples: ReprojectionSample[], maxSamples: number = 20): void {
  const sorted = [...samples].sort((a, b) => b.error - a.error)
  const toShow = sorted.slice(0, maxSamples)

  console.log('\nLargest reprojection errors:')
  console.log('  Error   | GT Position      | Projected        | Person | Timestamp')
  console.log('  --------|------------------|------------------|--------|----------')

  for (const s of toShow) {
    if (!s.isValid) continue

    const errorStr = s.error.toFixed(2).padStart(6)
    const gtStr = `(${s.gtPosition.x.toFixed(1)}, ${s.gtPosition.y.toFixed(1)})`.padEnd(16)
    const projStr = s.projectedPosition
      ? `(${s.projectedPosition.x.toFixed(1)}, ${s.projectedPosition.y.toFixed(1)})`.padEnd(16)
      : 'N/A'.padEnd(16)
    const personStr = String(s.personId).padStart(6)
    const timeStr = String(s.timestamp).padStart(8)

    console.log(`  ${errorStr}m | ${gtStr} | ${projStr} | ${personStr} | ${timeStr}s`)
  }
}
