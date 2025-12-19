/**
 * Temporal Metrics Tests
 *
 * Measures time-based tracking quality:
 * - Track Latency: Time from first detection to confirmed track
 * - Re-ID Latency: Time to re-acquire a lost track
 * - Occlusion Recovery Rate: % of tracks recovered after temporary occlusion
 * - Mean Time Between ID Switches: Average duration before an ID switch
 * - Track Lifetime Distribution: How long tracks typically last
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
import { stitchTracks } from '../helpers/track-stitcher.js'

// ============================================================================
// Types
// ============================================================================

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

interface TemporalMetrics {
  // Latency metrics
  avgTrackCreationLatency: number   // ms from first detection to track creation
  avgConfirmationLatency: number    // ms from creation to confirmed status

  // Recovery metrics
  occlusionRecoveryRate: number     // % of tracks recovered after gap
  avgRecoveryTime: number           // ms to recover after gap

  // Stability metrics
  meanTimeBetweenIDSwitches: number // ms
  avgTrackLifetime: number          // ms
  medianTrackLifetime: number       // ms

  // Distribution
  lifetimeDistribution: Map<string, number>  // bucket -> count
}

interface TrackEvent {
  type: 'created' | 'updated' | 'confirmed' | 'expired'
  trackId: string
  timestamp: number
  cameraId?: string
}

// ============================================================================
// Helpers
// ============================================================================

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

function getLifetimeBucket(lifetimeMs: number): string {
  const seconds = lifetimeMs / 1000
  if (seconds < 1) return '<1s'
  if (seconds < 2) return '1-2s'
  if (seconds < 5) return '2-5s'
  if (seconds < 10) return '5-10s'
  if (seconds < 30) return '10-30s'
  if (seconds < 60) return '30-60s'
  return '>60s'
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

describe('Temporal Metrics', () => {
  let cameraRegistry: CameraRegistry
  let sitemapConfig: ReturnType<typeof loadSiteMapConfig>
  let detectionFiles: Map<string, DetectionFile>

  beforeAll(() => {
    console.log('\n' + '='.repeat(70))
    console.log('TEMPORAL METRICS')
    console.log('='.repeat(70))

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

  describe('Track Creation Latency', () => {
    it('measures time from first detection to track creation', () => {
      // Track first detection time per camera track
      const firstDetectionTime: Map<string, number> = new Map()
      const trackCreationTime: Map<string, number> = new Map()

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Process all frames
      const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          allFrames.push({ cameraId, frame })
        }
      }
      allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)

      const seenCameraTracks = new Set<string>()
      const trackFirstSeen = new Map<string, number>()

      for (const { cameraId, frame } of allFrames) {
        mockTime = Math.floor(frame.timestamp * 1000) + 1000

        for (const det of frame.detections) {
          const cameraTrackId = `${cameraId}-${det.track_id}`

          // Record first detection time
          if (!seenCameraTracks.has(cameraTrackId)) {
            seenCameraTracks.add(cameraTrackId)
            firstDetectionTime.set(cameraTrackId, mockTime)
          }

          const bbox = {
            x: det.bbox.left,
            y: det.bbox.top,
            width: det.bbox.right - det.bbox.left,
            height: det.bbox.bottom - det.bbox.top,
          }

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track && !trackFirstSeen.has(track.globalTrackId)) {
            trackFirstSeen.set(track.globalTrackId, mockTime)
            trackCreationTime.set(cameraTrackId, mockTime)
          }
        }
      }

      // Calculate latencies
      const latencies: number[] = []
      for (const [cameraTrackId, firstTime] of firstDetectionTime) {
        const createTime = trackCreationTime.get(cameraTrackId)
        if (createTime !== undefined) {
          latencies.push(createTime - firstTime)
        }
      }

      console.log(`\n--- Track Creation Latency ---`)
      console.log(`Camera tracks seen: ${seenCameraTracks.size}`)
      console.log(`Tracks created: ${trackFirstSeen.size}`)

      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
        const maxLatency = Math.max(...latencies)
        const p50 = percentile(latencies, 0.5)
        const p95 = percentile(latencies, 0.95)

        console.log(`\nLatency from first detection to track creation:`)
        console.log(`  Average: ${avgLatency.toFixed(0)}ms`)
        console.log(`  Median (p50): ${p50.toFixed(0)}ms`)
        console.log(`  p95: ${p95.toFixed(0)}ms`)
        console.log(`  Max: ${maxLatency.toFixed(0)}ms`)
        console.log(`  Target: < 100ms`)
      }

      expect(latencies.length).toBeGreaterThan(0)
    })
  })

  describe('Track Lifetime Distribution', () => {
    it('analyzes how long tracks typically last', () => {
      const trackLifetimes: number[] = []
      const lifetimeBuckets: Map<string, number> = new Map([
        ['<1s', 0],
        ['1-2s', 0],
        ['2-5s', 0],
        ['5-10s', 0],
        ['10-30s', 0],
        ['30-60s', 0],
        ['>60s', 0],
      ])

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Track creation and last update times
      const trackCreated: Map<string, number> = new Map()
      const trackLastSeen: Map<string, number> = new Map()

      // Process all frames
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

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track) {
            if (!trackCreated.has(track.globalTrackId)) {
              trackCreated.set(track.globalTrackId, mockTime)
            }
            trackLastSeen.set(track.globalTrackId, mockTime)
          }
        }
      }

      // Calculate lifetimes
      for (const [trackId, created] of trackCreated) {
        const lastSeen = trackLastSeen.get(trackId) ?? created
        const lifetime = lastSeen - created
        trackLifetimes.push(lifetime)

        const bucket = getLifetimeBucket(lifetime)
        lifetimeBuckets.set(bucket, (lifetimeBuckets.get(bucket) ?? 0) + 1)
      }

      console.log(`\n--- Track Lifetime Distribution ---`)
      console.log(`Total tracks: ${trackLifetimes.length}`)

      if (trackLifetimes.length > 0) {
        const avgLifetime = trackLifetimes.reduce((a, b) => a + b, 0) / trackLifetimes.length
        const medianLifetime = percentile(trackLifetimes, 0.5)
        const maxLifetime = Math.max(...trackLifetimes)

        console.log(`\nLifetime Statistics:`)
        console.log(`  Average: ${(avgLifetime / 1000).toFixed(1)}s`)
        console.log(`  Median: ${(medianLifetime / 1000).toFixed(1)}s`)
        console.log(`  Max: ${(maxLifetime / 1000).toFixed(1)}s`)

        console.log(`\nDistribution:`)
        for (const [bucket, count] of lifetimeBuckets) {
          const pct = (count / trackLifetimes.length) * 100
          const bar = '█'.repeat(Math.round(pct / 5))
          console.log(`  ${bucket.padEnd(8)}: ${count.toString().padStart(4)} (${pct.toFixed(1).padStart(5)}%) ${bar}`)
        }

        // Short-lived tracks indicate fragmentation issues
        const shortLived = (lifetimeBuckets.get('<1s') ?? 0) + (lifetimeBuckets.get('1-2s') ?? 0)
        const shortLivedPct = (shortLived / trackLifetimes.length) * 100
        console.log(`\nShort-lived tracks (<2s): ${shortLivedPct.toFixed(1)}%`)
        console.log(`Target: < 30%`)
      }

      expect(trackLifetimes.length).toBeGreaterThan(0)
    })
  })

  describe('Detection Gap Analysis', () => {
    it('analyzes gaps in detection sequences (occlusion events)', () => {
      // Track detection timestamps for each camera track
      const trackDetections: Map<string, number[]> = new Map()

      for (const [cameraId, detFile] of detectionFiles) {
        for (const frame of detFile.frames) {
          const timestamp = Math.floor(frame.timestamp * 1000)

          for (const det of frame.detections) {
            const cameraTrackId = `${cameraId}-${det.track_id}`

            if (!trackDetections.has(cameraTrackId)) {
              trackDetections.set(cameraTrackId, [])
            }
            trackDetections.get(cameraTrackId)!.push(timestamp)
          }
        }
      }

      // Analyze gaps
      const gaps: number[] = []
      let tracksWithGaps = 0
      let totalGaps = 0

      for (const [, timestamps] of trackDetections) {
        if (timestamps.length < 2) continue

        timestamps.sort((a, b) => a - b)

        let hasGap = false
        for (let i = 1; i < timestamps.length; i++) {
          const gap = timestamps[i] - timestamps[i - 1]
          // Consider gaps > 500ms as potential occlusions
          if (gap > 500) {
            gaps.push(gap)
            hasGap = true
            totalGaps++
          }
        }

        if (hasGap) tracksWithGaps++
      }

      console.log(`\n--- Detection Gap Analysis ---`)
      console.log(`Total camera tracks: ${trackDetections.size}`)
      console.log(`Tracks with gaps (>500ms): ${tracksWithGaps}`)
      console.log(`Total gaps detected: ${totalGaps}`)

      if (gaps.length > 0) {
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
        const maxGap = Math.max(...gaps)
        const p50 = percentile(gaps, 0.5)
        const p95 = percentile(gaps, 0.95)

        console.log(`\nGap Statistics:`)
        console.log(`  Average: ${(avgGap / 1000).toFixed(2)}s`)
        console.log(`  Median: ${(p50 / 1000).toFixed(2)}s`)
        console.log(`  p95: ${(p95 / 1000).toFixed(2)}s`)
        console.log(`  Max: ${(maxGap / 1000).toFixed(2)}s`)

        // Gap distribution
        const shortGaps = gaps.filter(g => g < 1000).length
        const medGaps = gaps.filter(g => g >= 1000 && g < 5000).length
        const longGaps = gaps.filter(g => g >= 5000).length

        console.log(`\nGap Distribution:`)
        console.log(`  Short (<1s): ${shortGaps} (${((shortGaps / gaps.length) * 100).toFixed(1)}%)`)
        console.log(`  Medium (1-5s): ${medGaps} (${((medGaps / gaps.length) * 100).toFixed(1)}%)`)
        console.log(`  Long (>5s): ${longGaps} (${((longGaps / gaps.length) * 100).toFixed(1)}%)`)
      }

      expect(trackDetections.size).toBeGreaterThan(0)
    })
  })

  describe('Track Update Frequency', () => {
    it('measures how frequently tracks are updated', () => {
      const updateIntervals: number[] = []

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Track last update time per global track
      const lastUpdate: Map<string, number> = new Map()

      // Process all frames
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

          const track = detectionProcessor.processInjection(cameraId, bbox, det.confidence, det.track_id)

          if (track) {
            const prevUpdate = lastUpdate.get(track.globalTrackId)
            if (prevUpdate !== undefined) {
              const interval = mockTime - prevUpdate
              if (interval > 0 && interval < 10000) { // Ignore very long gaps
                updateIntervals.push(interval)
              }
            }
            lastUpdate.set(track.globalTrackId, mockTime)
          }
        }
      }

      console.log(`\n--- Track Update Frequency ---`)
      console.log(`Total updates recorded: ${updateIntervals.length}`)

      if (updateIntervals.length > 0) {
        const avgInterval = updateIntervals.reduce((a, b) => a + b, 0) / updateIntervals.length
        const p50 = percentile(updateIntervals, 0.5)
        const p95 = percentile(updateIntervals, 0.95)

        console.log(`\nUpdate Interval Statistics:`)
        console.log(`  Average: ${avgInterval.toFixed(0)}ms`)
        console.log(`  Median: ${p50.toFixed(0)}ms`)
        console.log(`  p95: ${p95.toFixed(0)}ms`)

        // Calculate effective frame rate
        const effectiveFPS = 1000 / avgInterval
        console.log(`\nEffective update rate: ${effectiveFPS.toFixed(1)} Hz`)
        console.log(`Target: > 10 Hz for smooth tracking`)
      }

      expect(updateIntervals.length).toBeGreaterThan(0)
    })
  })

  describe('Summary Report', () => {
    it('prints temporal metrics summary', () => {
      console.log('\n' + '='.repeat(70))
      console.log('TEMPORAL METRICS - SUMMARY')
      console.log('='.repeat(70))

      console.log(`
Temporal Metric Targets:
┌─────────────────────────────────────────────────────────────────────┐
│ Metric                    │ Target            │ Impact              │
├─────────────────────────────────────────────────────────────────────┤
│ Track Creation Latency    │ < 100ms           │ Responsiveness      │
│ Track Confirmation Time   │ < 500ms           │ Detection reliability│
│ Avg Track Lifetime        │ > 10s             │ Track stability     │
│ Short-lived Track Rate    │ < 30%             │ Fragmentation       │
│ Update Frequency          │ > 10 Hz           │ Smoothness          │
│ Gap Recovery Rate         │ > 80%             │ Occlusion handling  │
└─────────────────────────────────────────────────────────────────────┘

Notes:
- Short-lived tracks indicate fragmentation issues
- Long gaps between detections may indicate occlusion events
- Higher update frequency leads to smoother tracking visualization
`)

      expect(true).toBe(true)
    })
  })
})
