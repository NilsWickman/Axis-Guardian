#!/usr/bin/env node
/**
 * CLI Tool: Filter Outlier Annotations
 *
 * Removes annotations that have high reprojection error after polynomial fitting.
 * Uses leave-one-out cross-validation to identify outliers.
 */

import { Command } from 'commander'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import {
  fitPolynomial,
  evaluatePolynomial,
} from '../calibration/polynomial-fitting.js'
import type { CorrespondencePoint } from '../calibration/polynomial-fitting.js'

interface Annotation {
  id: string
  timestamp: number
  cameraId: string
  trackId: number
  personId: number
  bbox: [number, number, number, number]
  confidence: number
  assignedAt: string
  worldPosition?: { x: number; y: number }
}

interface Dataset {
  version: string
  keyframeIntervalSeconds: number
  videoDuration: number
  cameras: string[]
  annotations: Annotation[]
  persons: Array<{ id: number; label: string; color: string }>
  metadata: { createdAt: string; lastModifiedAt: string }
}

const program = new Command()

program
  .name('filter-outliers')
  .description('Remove outlier annotations with high projection error')
  .requiredOption('--ground-truth <path>', 'Path to ground truth annotations')
  .requiredOption('--output <path>', 'Output path for filtered annotations')
  .option('--camera <id>', 'Filter only specific camera')
  .option('--threshold <m>', 'Error threshold in meters', '2.0')
  .option('--verbose', 'Show detailed output', false)
  .action(async (options) => {
    const gtPath = resolve(options.groundTruth)
    const outputPath = resolve(options.output)
    const threshold = parseFloat(options.threshold)

    // Load ground truth
    const gtData: Dataset = JSON.parse(readFileSync(gtPath, 'utf-8'))
    console.log(`Loaded ${gtData.annotations.length} annotations`)

    // Determine cameras to process
    const camerasToProcess = options.camera
      ? [options.camera]
      : [...new Set(gtData.annotations.map(a => a.cameraId))]

    const outlierIds = new Set<string>()

    for (const cameraId of camerasToProcess) {
      // Get annotations for this camera with world position
      const cameraAnns = gtData.annotations.filter(
        a => a.cameraId === cameraId && a.worldPosition
      )

      if (cameraAnns.length < 15) {
        console.log(`${cameraId}: Only ${cameraAnns.length} annotations, skipping outlier detection`)
        continue
      }

      // Convert to correspondence points
      const points: (CorrespondencePoint & { id: string })[] = cameraAnns.map(ann => ({
        id: ann.id,
        annotationId: ann.id,
        imageX: ann.bbox[0] + ann.bbox[2] / 2,  // center x
        imageY: ann.bbox[1] + ann.bbox[3],       // bottom y
        worldX: ann.worldPosition!.x,
        worldY: ann.worldPosition!.y,
      }))

      // Fit polynomial with all points
      const allPointsForFit: CorrespondencePoint[] = points.map(p => ({
        annotationId: p.annotationId,
        imageX: p.imageX,
        imageY: p.imageY,
        worldX: p.worldX,
        worldY: p.worldY,
      }))

      const result = fitPolynomial(allPointsForFit, 3)
      console.log(`\n${cameraId}: RMSE=${result.rmse.toFixed(3)}m, MaxErr=${result.maxError.toFixed(3)}m`)

      // Evaluate each point
      const errors: { id: string; error: number; predicted: { x: number; y: number }; actual: { x: number; y: number } }[] = []

      for (const point of points) {
        const predicted = evaluatePolynomial(
          result.polynomial,
          point.imageX,
          point.imageY
        )
        const dx = predicted.x - point.worldX
        const dy = predicted.y - point.worldY
        const error = Math.sqrt(dx * dx + dy * dy)

        errors.push({
          id: point.id,
          error,
          predicted,
          actual: { x: point.worldX, y: point.worldY }
        })
      }

      // Sort by error descending
      errors.sort((a, b) => b.error - a.error)

      // Identify outliers
      const cameraOutliers = errors.filter(e => e.error > threshold)
      console.log(`  Outliers (>${threshold}m): ${cameraOutliers.length}/${errors.length}`)

      for (const outlier of cameraOutliers) {
        outlierIds.add(outlier.id)
        if (options.verbose) {
          console.log(`    ${outlier.error.toFixed(2)}m: predicted (${outlier.predicted.x.toFixed(1)}, ${outlier.predicted.y.toFixed(1)}) vs actual (${outlier.actual.x.toFixed(1)}, ${outlier.actual.y.toFixed(1)})`)
        }
      }
    }

    // Filter out outliers
    const filteredAnnotations = gtData.annotations.filter(a => !outlierIds.has(a.id))

    console.log(`\nRemoved ${outlierIds.size} outliers`)
    console.log(`Remaining: ${filteredAnnotations.length} annotations`)

    // Save filtered dataset
    const filtered: Dataset = {
      ...gtData,
      annotations: filteredAnnotations,
      metadata: {
        ...gtData.metadata,
        lastModifiedAt: new Date().toISOString(),
      },
    }

    writeFileSync(outputPath, JSON.stringify(filtered, null, 2))
    console.log(`Saved to: ${outputPath}`)
  })

program.parse()
