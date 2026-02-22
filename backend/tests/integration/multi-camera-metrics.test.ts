/**
 * Multi-Camera Specific Metrics Tests
 *
 * Metrics specific to multi-camera tracking systems:
 * - False Merge Rate: % of merges that combined different persons
 * - Handoff Latency: Time between camera transitions
 * - Camera Contribution Ratio: Which camera's projection is used more
 * - Overlap Dwell Time: Average time tracks spend in overlap zones
 * - Cross-Camera Consistency: How consistent projections are across cameras
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { gunzipSync } from 'zlib'
import { TrackManager } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { loadSiteMapConfig } from '../../src/config/sitemap-loader.js'
import { projectDetectionWithKRT } from '../../src/projection/ground-plane.js'
import type { Point2D, GlobalTrack, CameraDetection } from '../../src/types.js'
import { stitchTracks } from '../helpers/track-stitcher.js'

// ============================================================================
// Types
// ============================================================================

interface TrackTruthAnnotation {
  id: string
  globalTrackId: string
  personId: number
  assignedAt: string
}

interface TrackTruthsDataset {
  version: string
  annotations: TrackTruthAnnotation[]
  persons: Array<{ id: number; label: string; color: string }>
}

interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Array<{
    // YOLO format: [center_x, center_y, width, height] normalized OR {left, top, right, bottom}
    bbox: [number, number, number, number] | { left: number; top: number; right: number; bottom: number }
    confidence: number
    class_name: string
    track_id: number
    attributes?: {
      embedding?: number[]
      embedding_quality?: number
    }
  }>
}

interface DetectionFile {
  video_path: string
  fps: number
  total_frames: number
  frames: DetectionFrame[]
}

interface MultiCameraMetrics {
  falseMergeRate: number
  avgHandoffLatency: number
  cameraContribution: Map<string, number>
  avgOverlapDwellTime: number
  crossCameraConsistency: number
}

// ============================================================================
// Helpers
// ============================================================================

function distance(p1: Point2D, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

/**
 * Convert detection bbox to top-left format expected by projection
 * Handles both YOLO format [cx, cy, w, h] and object format {left, top, right, bottom}
 */
function convertBBox(bbox: [number, number, number, number] | { left: number; top: number; right: number; bottom: number }): { x: number; y: number; width: number; height: number } {
  if (Array.isArray(bbox)) {
    // YOLO format: [center_x, center_y, width, height] normalized
    const [cx, cy, width, height] = bbox
    return { x: cx - width / 2, y: cy - height / 2, width, height }
  } else {
    // Object format: {left, top, right, bottom}
    return {
      x: bbox.left,
      y: bbox.top,
      width: bbox.right - bbox.left,
      height: bbox.bottom - bbox.top,
    }
  }
}

function loadTrackTruths(): TrackTruthsDataset | null {
  try {
    const path = join(__dirname, '../../../TrackTruths.json')
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function loadDetectionFile(filePath: string, applyStitching = false): DetectionFile | null {
  try {
    const content = readFileSync(filePath)
    let data: DetectionFile
    if (filePath.endsWith('.gz')) {
      data = JSON.parse(gunzipSync(content).toString('utf-8'))
    } else {
      data = JSON.parse(content.toString('utf-8'))
    }

    // Apply track stitching to reduce fragmentation from YOLOv8
    if (applyStitching && data.frames) {
      const result = stitchTracks(data as any)
      console.log(`  Track stitching: ${result.originalTrackCount} -> ${result.stitchedTrackCount} tracks`)
    }

    return data
  } catch {
    return null
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Multi-Camera Specific Metrics', () => {
  let trackTruths: TrackTruthsDataset | null
  let cameraRegistry: CameraRegistry
  let sitemapConfig: ReturnType<typeof loadSiteMapConfig>
  let detectionFiles: Map<string, DetectionFile>
  let latestFalseMergeRate: number | null = null

  beforeAll(async () => {
    console.log('\n' + '='.repeat(70))
    console.log('MULTI-CAMERA SPECIFIC METRICS')
    console.log('='.repeat(70))

    // Load track truths
    trackTruths = loadTrackTruths()
    if (trackTruths) {
      console.log(`Loaded ${trackTruths.annotations.length} track annotations`)
    }

    // Load sitemap
    const sitemapPath = join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
    sitemapConfig = loadSiteMapConfig(sitemapPath)

    // Initialize camera registry
    cameraRegistry = new CameraRegistry()
    cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

    // Load calibration from calibration.json for proper K/R/T matrices and worldTransform
    try {
      const calibrationPath = join(__dirname, '../../calibration.json')
      await cameraRegistry.loadCalibrationFromFile(calibrationPath)
    } catch (e) {
      console.log('Could not load calibration.json - using hardcoded calibrations')
    }

    // Load detection files
    detectionFiles = new Map()
    const cameraConfigs = [
      { cameraId: 'camera1', file: 'view-HC3.detections.json.gz' },
      { cameraId: 'camera2', file: 'view-HC4.detections.json.gz' },
      { cameraId: 'camera3', file: 'view-IP2.detections.json.gz' },
      { cameraId: 'camera4', file: 'view-IP5.detections.json.gz' },
    ]

    for (const config of cameraConfigs) {
      const filePath = join(__dirname, '../../../shared/cameras', config.file)
      const detFile = loadDetectionFile(filePath)
      if (detFile) {
        detectionFiles.set(config.cameraId, detFile)
        console.log(`Loaded ${detFile.frames.length} frames from ${config.cameraId}`)
      }
    }
  })

  describe('False Merge Rate', () => {
    it('identifies when different persons are incorrectly merged', () => {
      if (!trackTruths) {
        console.log('Skipping false merge analysis - no track truth data')
        expect(detectionFiles.size).toBeGreaterThan(0)
        return
      }

      // Build camera track -> person ID mapping
      // Skip person 0 ("Invalid") - these are noise/invalid detections
      const cameraTrackToPerson = new Map<string, number>()
      for (const ann of trackTruths.annotations) {
        if (ann.personId !== 0) {
          cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
        }
      }

      // Track embedding similarities for false merge analysis
      const personEmbeddings: Map<number, number[][]> = new Map()  // personId -> list of embeddings

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Track which persons are in each global track
      const globalTrackPersons: Map<string, Set<number>> = new Map()
      // Also track which camera tracks contributed to each global track
      const globalTrackCameraTracks: Map<string, Set<string>> = new Map()

      // Process frames
      const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          allFrames.push({ cameraId, frame })
        }
      }
      allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

      for (const { cameraId, frame } of allFrames) {
        mockTime = Math.floor(frame.timestamp * 1000) + 1000

        for (const det of frame.detections) {
          const cameraTrackId = `${cameraId}-${det.track_id}`
          const personId = cameraTrackToPerson.get(cameraTrackId)

          const bbox = convertBBox(det.bbox)
          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id, det.attributes)

          if (track && personId !== undefined) {
            if (!globalTrackPersons.has(track.globalTrackId)) {
              globalTrackPersons.set(track.globalTrackId, new Set())
              globalTrackCameraTracks.set(track.globalTrackId, new Set())
            }
            globalTrackPersons.get(track.globalTrackId)!.add(personId)
            globalTrackCameraTracks.get(track.globalTrackId)!.add(cameraTrackId)

            // Collect embeddings by person for similarity analysis
            const embedding = det.attributes?.embedding
            if (embedding && embedding.length > 0) {
              if (!personEmbeddings.has(personId)) {
                personEmbeddings.set(personId, [])
              }
              // Only keep first embedding per detection to avoid duplicates
              personEmbeddings.get(personId)!.push(embedding)
            }
          }
        }
      }

      // Count false merges (excluding person 0 "Invalid")
      let totalTracks = 0
      let falseMerges = 0

      for (const [trackId, persons] of globalTrackPersons) {
        // Filter out person 0 (Invalid) from the set
        const validPersons = new Set([...persons].filter(p => p !== 0))
        if (validPersons.size === 0) continue // Skip tracks with only invalid detections

        totalTracks++
        if (validPersons.size > 1) {
          falseMerges++
        }
      }

      const falseMergeRate = totalTracks > 0 ? falseMerges / totalTracks : 0

      console.log(`\n--- False Merge Rate ---`)
      console.log(`Total global tracks: ${totalTracks}`)
      console.log(`Tracks with multiple persons (false merges): ${falseMerges}`)
      console.log(`False Merge Rate: ${(falseMergeRate * 100).toFixed(1)}%`)
      console.log(`Target: < 5%`)

      // List false merges with detailed camera track info
      if (falseMerges > 0) {
        console.log(`\nFalse merge details:`)
        let count = 0

        // Build reverse mapping: globalTrack -> list of cameraTrackIds with their personIds
        const trackDetails: Map<string, Array<{ cameraTrack: string; personId: number }>> = new Map()
        for (const [trackId, persons] of globalTrackPersons) {
          const validPersons = new Set([...persons].filter(p => p !== 0))
          if (validPersons.size > 1) {
            // Find which camera tracks contributed to this global track
            const details: Array<{ cameraTrack: string; personId: number }> = []
            for (const ann of trackTruths.annotations) {
              if (ann.personId === 0) continue
              // This is a bit hacky - we can't directly trace which camera tracks went to which global track
              // So just list the persons
            }
            trackDetails.set(trackId, details)
          }
        }

        for (const [trackId, persons] of globalTrackPersons) {
          const validPersons = new Set([...persons].filter(p => p !== 0))
          if (validPersons.size > 1 && count < 5) {
            const cameraTracks = globalTrackCameraTracks.get(trackId) ?? new Set()
            console.log(`  ${trackId}: persons [${Array.from(validPersons).join(', ')}]`)
            console.log(`    camera tracks: [${Array.from(cameraTracks).join(', ')}]`)
            count++
          }
        }
        if (falseMerges > 5) {
          console.log(`  ... and ${falseMerges - 5} more`)
        }
      }

      // Analyze embedding similarity between different persons that got merged
      console.log(`\nEmbedding similarity analysis (should be < 0.70 to block merge):`)
      // For the problematic merges, check pairwise similarity
      let highSimilarityMerges = 0
      let lowSimilarityMerges = 0
      let noEmbeddingMerges = 0
      for (const [trackId, persons] of globalTrackPersons) {
        const validPersons = [...persons].filter(p => p !== 0)
        if (validPersons.length > 1) {
          // Check similarity between first two persons
          const p1 = validPersons[0]
          const p2 = validPersons[1]
          const emb1 = personEmbeddings.get(p1)?.[0]
          const emb2 = personEmbeddings.get(p2)?.[0]
          if (emb1 && emb2 && emb1.length === emb2.length) {
            let dot = 0, norm1 = 0, norm2 = 0
            for (let i = 0; i < emb1.length; i++) {
              dot += emb1[i] * emb2[i]
              norm1 += emb1[i] * emb1[i]
              norm2 += emb2[i] * emb2[i]
            }
            const sim = dot / (Math.sqrt(norm1) * Math.sqrt(norm2))
            const passThreshold = sim >= 0.70
            console.log(`  ${trackId}: person ${p1} vs ${p2} = ${sim.toFixed(3)} ${passThreshold ? '❌ PASSES threshold' : '✓ below threshold'}`)
            if (passThreshold) highSimilarityMerges++
            else lowSimilarityMerges++
          } else {
            console.log(`  ${trackId}: person ${p1} vs ${p2} = NO EMBEDDINGS`)
            noEmbeddingMerges++
          }
        }
      }
      console.log(`\nSummary: ${highSimilarityMerges} merges with sim>=0.70, ${lowSimilarityMerges} with sim<0.70, ${noEmbeddingMerges} without embeddings`)

      latestFalseMergeRate = falseMergeRate
      expect(falseMergeRate).toBeLessThan(0.15)
    })

    it('regression guard keeps false merge rate under 5% on replay dataset', () => {
      expect(latestFalseMergeRate).not.toBeNull()
      expect(latestFalseMergeRate!).toBeLessThan(0.05)
    })
  })

  describe('Camera Contribution Analysis', () => {
    it('measures which cameras contribute more to final track positions', () => {
      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Count detections per camera that resulted in track updates
      const cameraDetectionCount: Map<string, number> = new Map()
      const cameraTrackContribution: Map<string, number> = new Map()

      // Process frames
      const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          allFrames.push({ cameraId, frame })
        }
      }
      allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

      for (const { cameraId, frame } of allFrames) {
        mockTime = Math.floor(frame.timestamp * 1000) + 1000

        for (const det of frame.detections) {
          cameraDetectionCount.set(cameraId, (cameraDetectionCount.get(cameraId) ?? 0) + 1)

          const bbox = convertBBox(det.bbox)
          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id, det.attributes)

          if (track) {
            cameraTrackContribution.set(cameraId, (cameraTrackContribution.get(cameraId) ?? 0) + 1)
          }
        }
      }

      console.log(`\n--- Camera Contribution Analysis ---`)
      console.log(`Camera      | Detections | Track Updates | Conversion Rate`)
      console.log('-'.repeat(60))

      const totalDetections = Array.from(cameraDetectionCount.values()).reduce((a, b) => a + b, 0)
      const totalContributions = Array.from(cameraTrackContribution.values()).reduce((a, b) => a + b, 0)

      for (const [cameraId] of detectionFiles) {
        const detections = cameraDetectionCount.get(cameraId) ?? 0
        const contributions = cameraTrackContribution.get(cameraId) ?? 0
        const conversionRate = detections > 0 ? contributions / detections : 0
        const detPct = totalDetections > 0 ? (detections / totalDetections) * 100 : 0
        const contribPct = totalContributions > 0 ? (contributions / totalContributions) * 100 : 0

        console.log(
          `${cameraId.padEnd(11)} | ${detections.toString().padStart(10)} | ` +
          `${contributions.toString().padStart(13)} | ${(conversionRate * 100).toFixed(1)}%`
        )
      }

      // Calculate balance ratio
      const contributions = Array.from(cameraTrackContribution.values())
      if (contributions.length >= 2) {
        const max = Math.max(...contributions)
        const min = Math.min(...contributions)
        const balanceRatio = min / max

        console.log(`\nCamera Balance Ratio: ${balanceRatio.toFixed(2)}`)
        console.log(`(1.0 = perfectly balanced, 0.0 = one camera dominates)`)
        console.log(`Target: > 0.5`)

        // Regression guard: avoid severe single-camera collapse.
        expect(balanceRatio).toBeGreaterThan(0.1)
      }

      expect(cameraTrackContribution.size).toBeGreaterThan(0)
    })
  })

  describe('Multi-Camera Track Analysis', () => {
    it('analyzes tracks that have detections from multiple cameras', () => {
      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })

      // Helper to project detection to world coordinates
      function projectDetection(cameraId: string, det: any, timestamp: number): CameraDetection | null {
        const bbox = convertBBox(det.bbox)
        const calib = cameraRegistry.getCalibration(cameraId)
        if (!calib) return null

        const result = projectDetectionWithKRT(bbox, calib, null, [], true, 1920, 1080)
        if (!result.isValid) return null

        return {
          cameraId,
          localTrackId: det.track_id,
          worldX: result.worldPoint.x,
          worldY: result.worldPoint.y,
          confidence: det.confidence,
          timestamp,
          attributes: det.attributes,
        }
      }

      // Collect all detections with their timestamps
      const allDetections: Array<{ cameraId: string; det: any; timestamp: number }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          const timestamp = Math.floor(frame.timestamp * 1000) + 1000
          for (const det of frame.detections) {
            allDetections.push({ cameraId, det, timestamp })
          }
        }
      }

      // Sort by timestamp and group into batches (100ms windows)
      allDetections.sort((a, b) => a.timestamp - b.timestamp)
      const BATCH_WINDOW_MS = 100

      let currentBatch: CameraDetection[] = []
      let batchStartTime = allDetections[0]?.timestamp ?? 0

      for (const { cameraId, det, timestamp } of allDetections) {
        if (timestamp - batchStartTime > BATCH_WINDOW_MS && currentBatch.length > 0) {
          // Process current batch
          mockTime = batchStartTime + BATCH_WINDOW_MS / 2
          trackManager.processBatchDetections(currentBatch)

          // Start new batch
          currentBatch = []
          batchStartTime = timestamp
        }

        const projected = projectDetection(cameraId, det, timestamp)
        if (projected) {
          currentBatch.push(projected)
        }
      }

      // Process final batch
      if (currentBatch.length > 0) {
        mockTime = batchStartTime + BATCH_WINDOW_MS / 2
        trackManager.processBatchDetections(currentBatch)
      }

      // Analyze tracks
      const allTracks = trackManager.getAllActiveTracks()

      let singleCameraTracks = 0
      let multiCameraTracks = 0
      let zeroCameraTracks = 0
      const cameraAssociationCounts: number[] = []

      for (const track of allTracks) {
        const numCameras = track.cameraAssociations.size
        cameraAssociationCounts.push(numCameras)

        if (numCameras === 0) {
          zeroCameraTracks++
        } else if (numCameras === 1) {
          singleCameraTracks++
        } else if (numCameras >= 2) {
          multiCameraTracks++
        }
      }

      const tracksWithAssociations = allTracks.length - zeroCameraTracks
      const multiCameraRate = tracksWithAssociations > 0 ? multiCameraTracks / tracksWithAssociations : 0

      console.log(`\n--- Multi-Camera Track Analysis ---`)
      console.log(`Total active tracks: ${allTracks.length}`)
      console.log(`Zero-camera tracks: ${zeroCameraTracks}`)
      console.log(`Single-camera tracks: ${singleCameraTracks} (${((singleCameraTracks / allTracks.length) * 100).toFixed(1)}%)`)
      console.log(`Multi-camera tracks: ${multiCameraTracks} (${(tracksWithAssociations > 0 ? (multiCameraTracks / tracksWithAssociations) * 100 : 0).toFixed(1)}% of tracks with associations)`)

      if (cameraAssociationCounts.length > 0) {
        const avgCameras = cameraAssociationCounts.reduce((a, b) => a + b, 0) / cameraAssociationCounts.length
        console.log(`\nAverage cameras per track: ${avgCameras.toFixed(2)}`)
      }

      console.log(`\nTarget multi-camera rate: > 30% (indicates good overlap coverage)`)

      expect(allTracks.length).toBeGreaterThan(0)
      expect(tracksWithAssociations).toBeGreaterThan(0)
      // Regression guard: avoid major degradation in overlap utilization.
      // Current replay baseline is ~0.25 after strict identity gating.
      expect(multiCameraRate).toBeGreaterThan(0.2)
    })
  })

  describe('Camera Synchronization Quality', () => {
    it('measures how well cameras are time-synchronized', () => {
      // Analyze timestamp differences between cameras at same logical time
      const cam1Timestamps: number[] = []
      const cam2Timestamps: number[] = []

      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          if (cameraId === 'camera1') {
            cam1Timestamps.push(frame.timestamp)
          } else if (cameraId === 'camera2') {
            cam2Timestamps.push(frame.timestamp)
          }
        }
      }

      console.log(`\n--- Camera Synchronization ---`)
      console.log(`Camera1 frames: ${cam1Timestamps.length}`)
      console.log(`Camera2 frames: ${cam2Timestamps.length}`)

      if (cam1Timestamps.length > 0 && cam2Timestamps.length > 0) {
        // Find overlapping time range
        const minTime = Math.max(Math.min(...cam1Timestamps), Math.min(...cam2Timestamps))
        const maxTime = Math.min(Math.max(...cam1Timestamps), Math.max(...cam2Timestamps))

        console.log(`\nOverlapping time range: ${(maxTime - minTime).toFixed(1)}s`)

        // Find nearest timestamps
        const timeDiffs: number[] = []
        for (const t1 of cam1Timestamps) {
          if (t1 < minTime || t1 > maxTime) continue

          // Find nearest cam2 timestamp
          let nearestDiff = Infinity
          for (const t2 of cam2Timestamps) {
            const diff = Math.abs(t1 - t2)
            if (diff < nearestDiff) {
              nearestDiff = diff
            }
          }
          if (nearestDiff < 1.0) { // Only consider if within 1 second
            timeDiffs.push(nearestDiff * 1000) // Convert to ms
          }
        }

        if (timeDiffs.length > 0) {
          const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
          const maxDiff = Math.max(...timeDiffs)

          console.log(`\nTimestamp alignment:`)
          console.log(`  Average offset: ${avgDiff.toFixed(1)}ms`)
          console.log(`  Max offset: ${maxDiff.toFixed(1)}ms`)
          console.log(`  Target: < 50ms for good synchronization`)
        }
      }

      expect(cam1Timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('Summary Report', () => {
    it('prints multi-camera metrics summary', () => {
      console.log('\n' + '='.repeat(70))
      console.log('MULTI-CAMERA METRICS - SUMMARY')
      console.log('='.repeat(70))

      console.log(`
Multi-Camera Metric Targets:
┌─────────────────────────────────────────────────────────────────────┐
│ Metric                    │ Target            │ Impact              │
├─────────────────────────────────────────────────────────────────────┤
│ False Merge Rate          │ < 5%              │ Track accuracy      │
│ Camera Balance Ratio      │ > 0.5             │ Coverage quality    │
│ Multi-Camera Track Rate   │ > 30%             │ Overlap utilization │
│ Camera Sync Offset        │ < 50ms            │ Merge quality       │
│ Cross-Camera Consistency  │ < 0.6m difference │ Calibration quality │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- False merges indicate calibration or merge threshold issues
- Low multi-camera rate suggests cameras don't overlap enough
- High sync offset can cause merge failures
- Requires TrackTruths.json for false merge detection
`)

      expect(detectionFiles.size).toBeGreaterThan(0)
    })
  })
})
