#!/usr/bin/env node
/**
 * CLI Tool: Augment Ground Truth Annotations
 *
 * Fills in missing camera annotations by using TrackTruths mappings.
 * When a person is annotated in one camera but visible in another,
 * this tool creates the corresponding annotation using the shared worldPosition.
 *
 * Usage:
 *   npx tsx src/cli/augment-gt.ts \
 *     --ground-truth ../shared/ground-truths/cross-camera-annotations.json \
 *     --track-truths ../frontend/public/TrackTruths.json \
 *     --detections ../frontend/public/cameras \
 *     --output ../shared/ground-truths/augmented-annotations.json
 */

import { Command } from 'commander'
import { resolve, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { gunzipSync } from 'zlib'

// Types
interface GroundTruthAnnotation {
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

interface GroundTruthDataset {
  version: string
  keyframeIntervalSeconds: number
  videoDuration: number
  cameras: string[]
  annotations: GroundTruthAnnotation[]
  persons: Array<{ id: number; label: string; color: string }>
  metadata: { createdAt: string; lastModifiedAt: string }
}

interface TrackTruth {
  id: string
  globalTrackId: string  // "camera2-3"
  personId: number
  assignedAt: string
}

interface TrackTruthsFile {
  annotations: TrackTruth[]
  persons: Array<{ id: number; label: string; color: string }>
}

interface Detection {
  track_id: number
  bbox: [number, number, number, number]
  confidence: number
}

interface DetectionFrame {
  timestamp: number
  detections: Detection[]
}

interface DetectionFile {
  frames: DetectionFrame[]
}

const program = new Command()

program
  .name('augment-gt')
  .description('Augment ground truth annotations with missing camera data')
  .requiredOption('--ground-truth <path>', 'Path to cross-camera annotations JSON')
  .requiredOption('--track-truths <path>', 'Path to TrackTruths.json')
  .requiredOption('--detections <path>', 'Path to detection files directory')
  .requiredOption('--output <path>', 'Output path for augmented annotations')
  .option('--verbose', 'Show detailed output', false)
  .action(async (options) => {
    try {
      // Load ground truth
      const gtPath = resolve(options.groundTruth)
      const gtData: GroundTruthDataset = JSON.parse(readFileSync(gtPath, 'utf-8'))
      console.log(`Loaded ${gtData.annotations.length} annotations from ground truth`)

      // Load track truths
      const ttPath = resolve(options.trackTruths)
      const ttData: TrackTruthsFile = JSON.parse(readFileSync(ttPath, 'utf-8'))

      // Build lookup: cameraId-trackId -> personId
      const trackToPersonMap = new Map<string, number>()
      for (const tt of ttData.annotations) {
        trackToPersonMap.set(tt.globalTrackId, tt.personId)
      }
      console.log(`Loaded ${trackToPersonMap.size} track truth mappings`)

      // Build lookup: timestamp-personId -> worldPosition
      const personPositionMap = new Map<string, { x: number; y: number }>()
      for (const ann of gtData.annotations) {
        if (ann.worldPosition) {
          const key = `${ann.timestamp}-${ann.personId}`
          personPositionMap.set(key, ann.worldPosition)
        }
      }
      console.log(`Found ${personPositionMap.size} person positions`)

      // Load detection files for each camera
      const cameraDetections = new Map<string, Map<number, Detection[]>>()

      const detectionsDir = resolve(options.detections)
      const cameraFiles: Record<string, string> = {
        camera1: 'view-HC3.detections.json.gz',
        camera2: 'view-HC4.detections.json.gz',
        camera3: 'view-IP2.detections.json.gz',
        camera4: 'view-IP5.detections.json.gz',
      }

      for (const [cameraId, filename] of Object.entries(cameraFiles)) {
        const filepath = join(detectionsDir, filename)
        if (!existsSync(filepath)) {
          console.warn(`Detection file not found: ${filepath}`)
          continue
        }

        const compressed = readFileSync(filepath)
        const json = gunzipSync(compressed).toString('utf-8')
        const detFile: DetectionFile = JSON.parse(json)

        // Index by rounded timestamp
        const timestampMap = new Map<number, Detection[]>()
        for (const frame of detFile.frames) {
          const roundedTs = Math.round(frame.timestamp)
          timestampMap.set(roundedTs, frame.detections)
        }
        cameraDetections.set(cameraId, timestampMap)
        console.log(`Loaded ${detFile.frames.length} frames for ${cameraId}`)
      }

      // Get unique timestamps from existing annotations
      const timestamps = [...new Set(gtData.annotations.map(a => a.timestamp))]
      console.log(`\nProcessing ${timestamps.length} keyframe timestamps: ${timestamps.join(', ')}`)

      // Count per-camera annotations before
      const beforeCounts: Record<string, number> = {}
      for (const ann of gtData.annotations) {
        beforeCounts[ann.cameraId] = (beforeCounts[ann.cameraId] ?? 0) + 1
      }
      console.log('\nAnnotations before:', beforeCounts)

      // Track new annotations
      const newAnnotations: GroundTruthAnnotation[] = []
      let skippedNoPosition = 0
      let skippedNoTrackTruth = 0
      let skippedAlreadyExists = 0

      // For each timestamp
      for (const timestamp of timestamps) {
        // Get all persons that have worldPosition at this timestamp
        const personsWithPosition = new Map<number, { x: number; y: number }>()
        for (const ann of gtData.annotations) {
          if (Math.abs(ann.timestamp - timestamp) < 0.5 && ann.worldPosition) {
            personsWithPosition.set(ann.personId, ann.worldPosition)
          }
        }

        // For each camera
        for (const cameraId of gtData.cameras) {
          const detMap = cameraDetections.get(cameraId)
          if (!detMap) continue

          // Get detections at this timestamp
          const detections = detMap.get(Math.round(timestamp))
          if (!detections) continue

          // For each detection
          for (const det of detections) {
            const trackKey = `${cameraId}-${det.track_id}`
            const personId = trackToPersonMap.get(trackKey)

            if (personId === undefined || personId === 0) {
              skippedNoTrackTruth++
              continue
            }

            // Check if annotation already exists
            const exists = gtData.annotations.some(a =>
              Math.abs(a.timestamp - timestamp) < 0.5 &&
              a.cameraId === cameraId &&
              a.trackId === det.track_id
            )
            if (exists) {
              skippedAlreadyExists++
              continue
            }

            // Get world position from same person at this timestamp
            const worldPosition = personsWithPosition.get(personId)
            if (!worldPosition) {
              skippedNoPosition++
              if (options.verbose) {
                console.log(`  No position for Person ${personId} at t=${timestamp}`)
              }
              continue
            }

            // Create new annotation
            const newAnn: GroundTruthAnnotation = {
              id: `aug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              timestamp,
              cameraId,
              trackId: det.track_id,
              personId,
              bbox: det.bbox,
              confidence: det.confidence,
              assignedAt: new Date().toISOString(),
              worldPosition,
            }
            newAnnotations.push(newAnn)

            if (options.verbose) {
              console.log(`  + ${cameraId} track ${det.track_id} -> Person ${personId} at (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`)
            }
          }
        }
      }

      console.log(`\nSkipped:`)
      console.log(`  - ${skippedNoTrackTruth} detections without track truth`)
      console.log(`  - ${skippedAlreadyExists} detections already annotated`)
      console.log(`  - ${skippedNoPosition} detections without position`)

      // Merge new annotations
      const augmented: GroundTruthDataset = {
        ...gtData,
        annotations: [...gtData.annotations, ...newAnnotations],
        metadata: {
          ...gtData.metadata,
          lastModifiedAt: new Date().toISOString(),
        },
      }

      // Count per-camera annotations after
      const afterCounts: Record<string, number> = {}
      for (const ann of augmented.annotations) {
        afterCounts[ann.cameraId] = (afterCounts[ann.cameraId] ?? 0) + 1
      }
      console.log('\nAnnotations after:', afterCounts)
      console.log(`Added ${newAnnotations.length} new annotations`)

      // Save
      const outputPath = resolve(options.output)
      writeFileSync(outputPath, JSON.stringify(augmented, null, 2))
      console.log(`\nSaved augmented annotations to: ${outputPath}`)

    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })

program.parse()
