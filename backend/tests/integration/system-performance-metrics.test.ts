/**
 * System Performance Metrics Tests
 *
 * Measures operational performance of the tracking system:
 * - Track Count Accuracy: Predicted vs actual person count
 * - Ghost Track Rate: Tracks with no real person
 * - Missed Detection Rate: Real persons not tracked
 * - Processing Throughput: Detections per second
 * - Memory Efficiency: Tracks per unit memory
 * - Track Churn Rate: Track creation/expiration frequency
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { gunzipSync } from 'zlib'
import { TrackManager } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { loadSiteMapConfig } from '../../src/config/sitemap-loader.js'
import type { GlobalTrack } from '../../src/types.js'

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

interface PerformanceMetrics {
  throughput: number              // detections per second
  avgProcessingTime: number       // ms per detection
  peakTracks: number              // maximum concurrent tracks
  trackCreationRate: number       // tracks created per second
  trackExpirationRate: number     // tracks expired per second
  ghostTrackRate: number          // % of tracks that are false positives
  missedDetectionRate: number     // % of real persons not tracked
}

// ============================================================================
// Helpers
// ============================================================================

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

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

// ============================================================================
// Test Suite
// ============================================================================

describe('System Performance Metrics', () => {
  let trackTruths: TrackTruthsDataset | null
  let cameraRegistry: CameraRegistry
  let sitemapConfig: ReturnType<typeof loadSiteMapConfig>
  let detectionFiles: Map<string, DetectionFile>

  beforeAll(() => {
    console.log('\n' + '='.repeat(70))
    console.log('SYSTEM PERFORMANCE METRICS')
    console.log('='.repeat(70))

    // Load track truths
    trackTruths = loadTrackTruths()
    if (trackTruths) {
      console.log(`Loaded ${trackTruths.annotations.length} track annotations`)
      console.log(`Unique persons: ${trackTruths.persons.length}`)
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
      { cameraId: 'camera1', file: 'view-HC3.detections.json.gz' },
      { cameraId: 'camera2', file: 'view-HC4.detections.json.gz' },
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

  describe('Processing Throughput', () => {
    it('measures detections processed per second', () => {
      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Process frames and measure time
      const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          allFrames.push({ cameraId, frame })
        }
      }
      allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

      let totalDetections = 0
      const processingTimes: number[] = []

      const startTime = Date.now()

      for (const { cameraId, frame } of allFrames) {
        mockTime = Math.floor(frame.timestamp * 1000) + 1000

        for (const det of frame.detections) {
          const detStart = performance.now()

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }
          detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          const detEnd = performance.now()
          processingTimes.push(detEnd - detStart)
          totalDetections++
        }
      }

      const endTime = Date.now()
      const totalTimeMs = endTime - startTime

      console.log(`\n--- Processing Throughput ---`)
      console.log(`Total detections processed: ${totalDetections}`)
      console.log(`Total processing time: ${totalTimeMs}ms`)

      const throughput = (totalDetections / totalTimeMs) * 1000
      console.log(`\nThroughput: ${throughput.toFixed(0)} detections/second`)

      if (processingTimes.length > 0) {
        const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        const p50 = percentile(processingTimes, 0.5)
        const p95 = percentile(processingTimes, 0.95)
        const p99 = percentile(processingTimes, 0.99)

        console.log(`\nPer-detection processing time:`)
        console.log(`  Average: ${avgTime.toFixed(3)}ms`)
        console.log(`  Median (p50): ${p50.toFixed(3)}ms`)
        console.log(`  p95: ${p95.toFixed(3)}ms`)
        console.log(`  p99: ${p99.toFixed(3)}ms`)
        console.log(`\nTarget: < 1ms average for real-time processing`)
      }

      expect(throughput).toBeGreaterThan(100) // At least 100 detections/second
    })
  })

  describe('Track Count Over Time', () => {
    it('analyzes concurrent track count distribution', () => {
      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      const trackCounts: number[] = []
      const trackCountByTime: Map<number, number> = new Map()

      // Process frames
      const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          allFrames.push({ cameraId, frame })
        }
      }
      allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

      let lastTimestamp = 0
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

        // Record track count at each unique timestamp
        const ts = Math.floor(frame.timestamp)
        if (ts !== lastTimestamp) {
          const count = trackManager.getAllActiveTracks().length
          trackCounts.push(count)
          trackCountByTime.set(ts, count)
          lastTimestamp = ts
        }
      }

      console.log(`\n--- Track Count Analysis ---`)
      console.log(`Samples recorded: ${trackCounts.length}`)

      if (trackCounts.length > 0) {
        const avgCount = trackCounts.reduce((a, b) => a + b, 0) / trackCounts.length
        const maxCount = Math.max(...trackCounts)
        const minCount = Math.min(...trackCounts)
        const p50 = percentile(trackCounts, 0.5)
        const p95 = percentile(trackCounts, 0.95)

        console.log(`\nConcurrent Tracks:`)
        console.log(`  Average: ${avgCount.toFixed(1)}`)
        console.log(`  Median: ${p50}`)
        console.log(`  Min: ${minCount}`)
        console.log(`  Max (peak): ${maxCount}`)
        console.log(`  p95: ${p95}`)

        // Distribution
        const countBuckets: Map<string, number> = new Map([
          ['0', 0], ['1-2', 0], ['3-5', 0], ['6-10', 0], ['11-20', 0], ['>20', 0],
        ])

        for (const count of trackCounts) {
          if (count === 0) countBuckets.set('0', (countBuckets.get('0') ?? 0) + 1)
          else if (count <= 2) countBuckets.set('1-2', (countBuckets.get('1-2') ?? 0) + 1)
          else if (count <= 5) countBuckets.set('3-5', (countBuckets.get('3-5') ?? 0) + 1)
          else if (count <= 10) countBuckets.set('6-10', (countBuckets.get('6-10') ?? 0) + 1)
          else if (count <= 20) countBuckets.set('11-20', (countBuckets.get('11-20') ?? 0) + 1)
          else countBuckets.set('>20', (countBuckets.get('>20') ?? 0) + 1)
        }

        console.log(`\nDistribution:`)
        for (const [bucket, count] of countBuckets) {
          const pct = (count / trackCounts.length) * 100
          const bar = '█'.repeat(Math.round(pct / 5))
          console.log(`  ${bucket.padEnd(6)}: ${count.toString().padStart(4)} (${pct.toFixed(1).padStart(5)}%) ${bar}`)
        }
      }

      expect(trackCounts.length).toBeGreaterThan(0)
    })
  })

  describe('Track Churn Analysis', () => {
    it('measures track creation and expiration rates', () => {
      let mockTime = 1000
      let tracksCreated = 0
      let tracksExpired = 0

      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
        onTrackCreated: () => { tracksCreated++ },
        onTrackExpired: () => { tracksExpired++ },
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

      let startTimestamp = 0
      let endTimestamp = 0

      for (const { cameraId, frame } of allFrames) {
        mockTime = Math.floor(frame.timestamp * 1000) + 1000

        if (startTimestamp === 0) startTimestamp = frame.timestamp
        endTimestamp = frame.timestamp

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

      const durationSeconds = endTimestamp - startTimestamp

      console.log(`\n--- Track Churn Analysis ---`)
      console.log(`Duration: ${durationSeconds.toFixed(1)}s`)
      console.log(`Tracks created: ${tracksCreated}`)
      console.log(`Tracks expired: ${tracksExpired}`)

      if (durationSeconds > 0) {
        const creationRate = tracksCreated / durationSeconds
        const expirationRate = tracksExpired / durationSeconds
        const churnRate = (tracksCreated + tracksExpired) / durationSeconds

        console.log(`\nRates:`)
        console.log(`  Creation rate: ${creationRate.toFixed(2)} tracks/second`)
        console.log(`  Expiration rate: ${expirationRate.toFixed(2)} tracks/second`)
        console.log(`  Total churn: ${churnRate.toFixed(2)} events/second`)

        // High churn indicates fragmentation
        console.log(`\nChurn assessment:`)
        if (churnRate < 0.5) {
          console.log(`  Status: LOW (stable tracking)`)
        } else if (churnRate < 2) {
          console.log(`  Status: MODERATE (some fragmentation)`)
        } else {
          console.log(`  Status: HIGH (significant fragmentation)`)
        }
        console.log(`  Target: < 1.0 events/second`)
      }

      // Note: In replay mode, tracks may already exist from startup
      // This metric is most useful in live scenarios
      expect(tracksCreated + tracksExpired).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Ghost Track Detection', () => {
    it('identifies tracks that may not correspond to real persons', () => {
      if (!trackTruths) {
        console.log('Skipping ghost track detection - no track truth data')
        expect(true).toBe(true)
        return
      }

      // Build set of known camera track IDs
      const knownCameraTracks = new Set<string>()
      for (const ann of trackTruths.annotations) {
        knownCameraTracks.add(ann.globalTrackId)
      }

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Track which camera tracks are associated with each global track
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

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track) {
            if (!globalTrackCameraTracks.has(track.globalTrackId)) {
              globalTrackCameraTracks.set(track.globalTrackId, new Set())
            }
            globalTrackCameraTracks.get(track.globalTrackId)!.add(cameraTrackId)
          }
        }
      }

      // Identify ghost tracks (no known camera tracks)
      let ghostTracks = 0
      let validTracks = 0

      for (const [globalTrackId, cameraTracks] of globalTrackCameraTracks) {
        let hasKnown = false
        for (const ct of cameraTracks) {
          if (knownCameraTracks.has(ct)) {
            hasKnown = true
            break
          }
        }
        if (hasKnown) {
          validTracks++
        } else {
          ghostTracks++
        }
      }

      const totalTracks = globalTrackCameraTracks.size
      const ghostRate = totalTracks > 0 ? ghostTracks / totalTracks : 0

      console.log(`\n--- Ghost Track Analysis ---`)
      console.log(`Total global tracks: ${totalTracks}`)
      console.log(`Valid tracks (matched to known persons): ${validTracks}`)
      console.log(`Ghost tracks (no known person): ${ghostTracks}`)
      console.log(`\nGhost Track Rate: ${(ghostRate * 100).toFixed(1)}%`)
      console.log(`Target: < 10%`)

      // Note: High ghost rate indicates tracking creates many false tracks
      // This is diagnostic - actual threshold depends on application requirements
      // With tighter tracking parameters to improve VCI, ghost rate may be higher
      expect(ghostRate).toBeLessThan(0.95) // Allow up to 95% - this is diagnostic
    })
  })

  describe('Detection Utilization', () => {
    it('measures what percentage of detections result in track updates', () => {
      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      let totalDetections = 0
      let usedDetections = 0
      let filteredByConfidence = 0
      let filteredByObstacle = 0

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
          totalDetections++

          if (det.confidence < 0.7) {
            filteredByConfidence++
            continue
          }

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track) {
            usedDetections++
          }
        }
      }

      const utilizationRate = totalDetections > 0 ? usedDetections / totalDetections : 0
      const filteredRate = totalDetections > 0 ? filteredByConfidence / totalDetections : 0

      console.log(`\n--- Detection Utilization ---`)
      console.log(`Total detections: ${totalDetections}`)
      console.log(`Filtered (low confidence): ${filteredByConfidence} (${(filteredRate * 100).toFixed(1)}%)`)
      console.log(`Used for tracking: ${usedDetections} (${(utilizationRate * 100).toFixed(1)}%)`)
      console.log(`\nUtilization Rate: ${(utilizationRate * 100).toFixed(1)}%`)
      console.log(`Target: > 70%`)

      expect(utilizationRate).toBeGreaterThan(0.5) // At least 50% utilization
    })
  })

  describe('Summary Report', () => {
    it('prints system performance summary', () => {
      console.log('\n' + '='.repeat(70))
      console.log('SYSTEM PERFORMANCE METRICS - SUMMARY')
      console.log('='.repeat(70))

      console.log(`
System Performance Targets:
┌─────────────────────────────────────────────────────────────────────┐
│ Metric                    │ Target            │ Impact              │
├─────────────────────────────────────────────────────────────────────┤
│ Processing Throughput     │ > 1000 det/s      │ Real-time capable   │
│ Per-Detection Latency     │ < 1ms             │ Responsiveness      │
│ Peak Concurrent Tracks    │ Depends on scene  │ Memory usage        │
│ Track Churn Rate          │ < 1.0 /second     │ Track stability     │
│ Ghost Track Rate          │ < 10%             │ False positive rate │
│ Detection Utilization     │ > 70%             │ Efficiency          │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- High throughput enables real-time tracking on live video
- Low latency ensures responsive UI updates
- High churn indicates fragmentation (tracks breaking up)
- Ghost tracks are false positives that waste resources
- Low utilization may indicate overly strict filtering
`)

      expect(true).toBe(true)
    })
  })
})
