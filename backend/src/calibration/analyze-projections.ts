#!/usr/bin/env node
/**
 * Projection Analysis Tool
 *
 * Analyzes current K/R/T projection accuracy against ground truth data.
 * Establishes baseline metrics and identifies error patterns.
 *
 * Usage:
 *   pnpm cli:analyze-projections --ground-truth ../GroundTruths.json --output analysis.json
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'

import { CameraRegistry } from '../detection/camera-registry.js'
import { projectDetectionWithKRT } from '../projection/ground-plane.js'
import type { CameraCalibration, Point2D } from '../types.js'
import {
  loadGroundTruths,
  filterAnnotations,
  getMultiCameraAnnotations,
  computeErrorStats,
  formatErrorStats,
  gtBboxToDetectionBBox,
  type GroundTruthAnnotation,
} from './utils.js'

// ============================================================================
// Types
// ============================================================================

interface AnnotationError {
  annotationId: string
  groundTruth: Point2D
  cameraId: string
  projectedPosition: Point2D
  error: number
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
  frameNumber: number
  isValid: boolean
  reason?: string
}

interface CameraAnalysis {
  cameraId: string
  totalAnnotations: number
  validProjections: number
  invalidProjections: number
  errors: number[]
  stats: ReturnType<typeof computeErrorStats>
  annotationErrors: AnnotationError[]
}

interface CrossCameraAnalysis {
  totalPairs: number
  convergentPairs: number
  divergentPairs: number
  convergenceThreshold: number
  divergences: number[]
  stats: ReturnType<typeof computeErrorStats>
  pairs: Array<{
    annotationId: string
    groundTruth: Point2D
    camera1Position: Point2D
    camera2Position: Point2D
    divergence: number
  }>
}

interface AnalysisReport {
  timestamp: string
  groundTruthFile: string
  totalAnnotations: number
  cameras: CameraAnalysis[]
  crossCamera: CrossCameraAnalysis
  summary: {
    overallPassRate: number
    bestCamera: string
    worstCamera: string
    crossCameraConvergenceRate: number
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeCamera(
  cameraId: string,
  annotations: GroundTruthAnnotation[],
  calibration: CameraCalibration,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): CameraAnalysis {
  const filtered = filterAnnotations(annotations, cameraId, ['certain'])
  const annotationErrors: AnnotationError[] = []
  const errors: number[] = []
  let validProjections = 0
  let invalidProjections = 0

  for (const { annotation, detection } of filtered) {
    // Convert bbox format and project to ground using K/R/T
    const bbox = gtBboxToDetectionBBox(detection.bbox)

    const result = projectDetectionWithKRT(
      bbox,
      calibration,
      null,
      [],
      true,
      imageWidth,
      imageHeight
    )

    if (result.isValid) {
      validProjections++
      const error = Math.sqrt(
        (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
          (result.worldPoint.y - annotation.groundPosition.y) ** 2
      )
      errors.push(error)

      annotationErrors.push({
        annotationId: annotation.id,
        groundTruth: annotation.groundPosition,
        cameraId,
        projectedPosition: result.worldPoint,
        error,
        bbox: detection.bbox,
        frameNumber: detection.frameNumber,
        isValid: true,
      })
    } else {
      invalidProjections++
      annotationErrors.push({
        annotationId: annotation.id,
        groundTruth: annotation.groundPosition,
        cameraId,
        projectedPosition: { x: 0, y: 0 },
        error: Infinity,
        bbox: detection.bbox,
        frameNumber: detection.frameNumber,
        isValid: false,
        reason: result.reason,
      })
    }
  }

  return {
    cameraId,
    totalAnnotations: filtered.length,
    validProjections,
    invalidProjections,
    errors,
    stats: computeErrorStats(errors),
    annotationErrors,
  }
}

function analyzeCrossCamera(
  annotations: GroundTruthAnnotation[],
  registry: CameraRegistry,
  cameraIds: string[],
  convergenceThreshold: number = 0.6
): CrossCameraAnalysis {
  const multiCam = getMultiCameraAnnotations(annotations, cameraIds, ['certain'])
  const divergences: number[] = []
  const pairs: CrossCameraAnalysis['pairs'] = []
  let convergentPairs = 0
  let divergentPairs = 0

  for (const { annotation, detections } of multiCam) {
    const positions: Map<string, Point2D> = new Map()

    // Project from each camera
    for (const [camId, detection] of detections) {
      const calibration = registry.getCalibration(camId)
      if (!calibration) continue

      const bbox = gtBboxToDetectionBBox(detection.bbox)
      const result = projectDetectionWithKRT(
        bbox,
        calibration,
        null,
        [],
        true,
        1920,
        1080
      )

      if (result.isValid) {
        positions.set(camId, result.worldPoint)
      }
    }

    // Check divergence between camera pairs
    if (positions.size >= 2) {
      const posArray = Array.from(positions.entries())
      const [, pos1] = posArray[0]
      const [, pos2] = posArray[1]

      const divergence = Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2)
      divergences.push(divergence)

      if (divergence <= convergenceThreshold) {
        convergentPairs++
      } else {
        divergentPairs++
      }

      pairs.push({
        annotationId: annotation.id,
        groundTruth: annotation.groundPosition,
        camera1Position: pos1,
        camera2Position: pos2,
        divergence,
      })
    }
  }

  return {
    totalPairs: pairs.length,
    convergentPairs,
    divergentPairs,
    convergenceThreshold,
    divergences,
    stats: computeErrorStats(divergences),
    pairs,
  }
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const program = new Command()
    .name('analyze-projections')
    .description('Analyze K/R/T projection accuracy against ground truth')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file for analysis results')
    .option('-c, --cameras <ids>', 'Comma-separated camera IDs (default: camera1,camera2)', 'camera1,camera2')
    .option('--convergence-threshold <meters>', 'Cross-camera convergence threshold', '0.6')
    .option('-v, --verbose', 'Show detailed per-annotation errors')
    .parse(process.argv)

  const opts = program.opts()

  // Load ground truth
  console.log(`Loading ground truth from ${opts.groundTruth}...`)
  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)

  // Initialize camera registry
  const registry = new CameraRegistry()
  const cameraIds = opts.cameras.split(',').map((s: string) => s.trim())

  // Analyze each camera
  const cameraAnalyses: CameraAnalysis[] = []

  for (const cameraId of cameraIds) {
    const calibration = registry.getCalibration(cameraId)
    if (!calibration) {
      console.warn(`No calibration found for ${cameraId}, skipping`)
      continue
    }

    console.log(`\nAnalyzing ${cameraId}...`)
    const analysis = analyzeCamera(cameraId, groundTruths.annotations, calibration)
    cameraAnalyses.push(analysis)

    console.log(`  Annotations: ${analysis.totalAnnotations}`)
    console.log(`  Valid projections: ${analysis.validProjections}`)
    console.log(`  Invalid projections: ${analysis.invalidProjections}`)
    console.log(`  ${formatErrorStats(analysis.stats).split('\n').map(l => '  ' + l).join('\n')}`)

    if (opts.verbose && analysis.annotationErrors.length > 0) {
      console.log('\n  Top 10 worst projections:')
      const sorted = [...analysis.annotationErrors].sort((a, b) => b.error - a.error)
      for (const err of sorted.slice(0, 10)) {
        if (err.isValid) {
          console.log(
            `    ${err.annotationId}: error=${err.error.toFixed(3)}m ` +
              `ground=(${err.groundTruth.x.toFixed(2)}, ${err.groundTruth.y.toFixed(2)}) ` +
              `projected=(${err.projectedPosition.x.toFixed(2)}, ${err.projectedPosition.y.toFixed(2)})`
          )
        }
      }
    }
  }

  // Cross-camera analysis
  console.log('\nAnalyzing cross-camera consistency...')
  const crossCamera = analyzeCrossCamera(
    groundTruths.annotations,
    registry,
    cameraIds,
    parseFloat(opts.convergenceThreshold)
  )

  console.log(`  Total pairs: ${crossCamera.totalPairs}`)
  console.log(`  Convergent (< ${crossCamera.convergenceThreshold}m): ${crossCamera.convergentPairs}`)
  console.log(`  Divergent (>= ${crossCamera.convergenceThreshold}m): ${crossCamera.divergentPairs}`)
  console.log(`  Convergence rate: ${((crossCamera.convergentPairs / crossCamera.totalPairs) * 100).toFixed(1)}%`)
  console.log(`  ${formatErrorStats(crossCamera.stats).split('\n').map(l => '  ' + l).join('\n')}`)

  if (opts.verbose && crossCamera.pairs.length > 0) {
    console.log('\n  Top 10 worst divergences:')
    const sorted = [...crossCamera.pairs].sort((a, b) => b.divergence - a.divergence)
    for (const pair of sorted.slice(0, 10)) {
      console.log(
        `    ${pair.annotationId}: divergence=${pair.divergence.toFixed(3)}m ` +
          `cam1=(${pair.camera1Position.x.toFixed(2)}, ${pair.camera1Position.y.toFixed(2)}) ` +
          `cam2=(${pair.camera2Position.x.toFixed(2)}, ${pair.camera2Position.y.toFixed(2)})`
      )
    }
  }

  // Summary
  const bestCamera = cameraAnalyses.reduce((a, b) =>
    a.stats.passRate > b.stats.passRate ? a : b
  )
  const worstCamera = cameraAnalyses.reduce((a, b) =>
    a.stats.passRate < b.stats.passRate ? a : b
  )
  const overallPassRate =
    cameraAnalyses.reduce((sum, c) => sum + c.stats.passRate * c.totalAnnotations, 0) /
    cameraAnalyses.reduce((sum, c) => sum + c.totalAnnotations, 0)

  console.log('\n=== Summary ===')
  console.log(`Overall pass rate: ${(overallPassRate * 100).toFixed(1)}%`)
  console.log(`Best camera: ${bestCamera.cameraId} (${(bestCamera.stats.passRate * 100).toFixed(1)}%)`)
  console.log(`Worst camera: ${worstCamera.cameraId} (${(worstCamera.stats.passRate * 100).toFixed(1)}%)`)
  console.log(
    `Cross-camera convergence: ${((crossCamera.convergentPairs / crossCamera.totalPairs) * 100).toFixed(1)}%`
  )

  // Build report
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    groundTruthFile: opts.groundTruth,
    totalAnnotations: groundTruths.annotations.length,
    cameras: cameraAnalyses,
    crossCamera,
    summary: {
      overallPassRate,
      bestCamera: bestCamera.cameraId,
      worstCamera: worstCamera.cameraId,
      crossCameraConvergenceRate: crossCamera.convergentPairs / crossCamera.totalPairs,
    },
  }

  // Save output
  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify(report, null, 2))
    console.log(`\nAnalysis saved to ${opts.output}`)
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
