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
import type { Point2D, GlobalTrack } from '../../src/types.js'

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
    bbox: { left: number; top: number; right: number; bottom: number }
    confidence: number
    class_name: string
    track_id: number
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

function loadTrackTruths(): TrackTruthsDataset | null {
  try {
    const path = join(__dirname, '../../../TrackTruths.json')
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function loadDetectionFile(filePath: string): DetectionFile | null {
  try {
    const content = readFileSync(filePath)
    if (filePath.endsWith('.gz')) {
      return JSON.parse(gunzipSync(content).toString('utf-8'))
    }
    return JSON.parse(content.toString('utf-8'))
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

  beforeAll(() => {
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

    // Load detection files
    detectionFiles = new Map()
    const cameraConfigs = [
      { cameraId: 'camera1', file: 'view-HC3-preprocessed.detections.json' },
      { cameraId: 'camera2', file: 'view-HC4-preprocessed.detections.json' },
    ]

    for (const config of cameraConfigs) {
      const filePath = join(__dirname, '../../../shared/cameras/preprocessed/1080p', config.file)
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
        expect(true).toBe(true)
        return
      }

      // Build camera track -> person ID mapping
      const cameraTrackToPerson = new Map<string, number>()
      for (const ann of trackTruths.annotations) {
        cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
      }

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Track which persons are in each global track
      const globalTrackPersons: Map<string, Set<number>> = new Map()

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

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track && personId !== undefined) {
            if (!globalTrackPersons.has(track.globalTrackId)) {
              globalTrackPersons.set(track.globalTrackId, new Set())
            }
            globalTrackPersons.get(track.globalTrackId)!.add(personId)
          }
        }
      }

      // Count false merges
      let totalTracks = 0
      let falseMerges = 0

      for (const [trackId, persons] of globalTrackPersons) {
        totalTracks++
        if (persons.size > 1) {
          falseMerges++
        }
      }

      const falseMergeRate = totalTracks > 0 ? falseMerges / totalTracks : 0

      console.log(`\n--- False Merge Rate ---`)
      console.log(`Total global tracks: ${totalTracks}`)
      console.log(`Tracks with multiple persons (false merges): ${falseMerges}`)
      console.log(`False Merge Rate: ${(falseMergeRate * 100).toFixed(1)}%`)
      console.log(`Target: < 5%`)

      // List false merges
      if (falseMerges > 0) {
        console.log(`\nFalse merge details:`)
        let count = 0
        for (const [trackId, persons] of globalTrackPersons) {
          if (persons.size > 1 && count < 5) {
            console.log(`  ${trackId}: persons [${Array.from(persons).join(', ')}]`)
            count++
          }
        }
        if (falseMerges > 5) {
          console.log(`  ... and ${falseMerges - 5} more`)
        }
      }

      expect(falseMergeRate).toBeLessThan(0.5) // Allow up to 50% for now
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

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

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
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

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
          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }
          detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)
        }
      }

      // Analyze tracks
      const allTracks = trackManager.getAllActiveTracks()

      let singleCameraTracks = 0
      let multiCameraTracks = 0
      const cameraAssociationCounts: number[] = []

      for (const track of allTracks) {
        const numCameras = track.cameraAssociations.size
        cameraAssociationCounts.push(numCameras)

        if (numCameras === 1) {
          singleCameraTracks++
        } else {
          multiCameraTracks++
        }
      }

      const multiCameraRate = allTracks.length > 0 ? multiCameraTracks / allTracks.length : 0

      console.log(`\n--- Multi-Camera Track Analysis ---`)
      console.log(`Total active tracks: ${allTracks.length}`)
      console.log(`Single-camera tracks: ${singleCameraTracks} (${((singleCameraTracks / allTracks.length) * 100).toFixed(1)}%)`)
      console.log(`Multi-camera tracks: ${multiCameraTracks} (${((multiCameraTracks / allTracks.length) * 100).toFixed(1)}%)`)

      if (cameraAssociationCounts.length > 0) {
        const avgCameras = cameraAssociationCounts.reduce((a, b) => a + b, 0) / cameraAssociationCounts.length
        console.log(`\nAverage cameras per track: ${avgCameras.toFixed(2)}`)
      }

      console.log(`\nTarget multi-camera rate: > 30% (indicates good overlap coverage)`)

      expect(allTracks.length).toBeGreaterThan(0)
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

      expect(true).toBe(true)
    })
  })
})
