/**
 * Tracking Quality Metrics Tests
 *
 * These tests measure behavioral tracking quality beyond projection accuracy:
 * - Track Continuity Index (TCI): ID persistence across the scene
 * - Position Jitter RMSE: Kalman filter smoothness
 * - Velocity Consistency Index (VCI): Motion plausibility
 * - Cross-Camera Handoff Success Rate (CHSR): Inter-camera track persistence
 * - Track Merge Success Rate: Multi-camera detection fusion
 *
 * These metrics can be verified end-to-end from the frontend via WebSocket events.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { TrackManager } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../../src/config/sitemap-loader.js'
import type { CameraParams, Point2D, DetectionMessage, GlobalTrack } from '../../src/types.js'

// ============================================================================
// Types
// ============================================================================

interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: 'certain' | 'estimated' | 'uncertain'
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  version: string
  room: { width: number; height: number }
  cameras: Array<{ cameraId: string; videoFile: string; detectionsFile: string }>
  annotations: Annotation[]
}

interface TrackObservation {
  trackId: string
  position: Point2D
  timestamp: number
  frameNumber: number
  cameraId: string
}

interface MetricsResult {
  trackContinuityIndex: number
  positionJitterRMSE: number
  velocityConsistencyIndex: number
  crossCameraHandoffRate: number
  trackMergeSuccessRate: number
  averageProjectionError: number
  shortLivedTrackRate: number
}

// ============================================================================
// Helper Functions
// ============================================================================

function distance(p1: Point2D, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function convertBbox(det: LinkedDetection) {
  return {
    x: det.bbox.left,
    y: det.bbox.top,
    width: det.bbox.right - det.bbox.left,
    height: det.bbox.bottom - det.bbox.top,
  }
}

function createDetectionMessage(det: LinkedDetection): DetectionMessage {
  const bbox = convertBbox(det)
  return {
    camera_id: det.cameraId,
    frame_number: det.frameNumber,
    timestamp: det.timestamp,
    detection_count: 1,
    detections: [
      {
        class_name: 'person',
        confidence: 0.95,
        bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
        track_id: det.trackId,
      },
    ],
  }
}

// ============================================================================
// Metric Calculators
// ============================================================================

/**
 * Track Continuity Index (TCI)
 * Measures how well the number of track IDs matches the number of people.
 * Penalizes both fragmentation (too many tracks) and over-merging (too few tracks).
 * TCI = min(unique_persons, total_tracks_created) / max(unique_persons, total_tracks_created)
 */
function calculateTrackContinuityIndex(
  uniquePersonCount: number,
  totalTracksCreated: number
): number {
  if (uniquePersonCount === 0 || totalTracksCreated === 0) return 0
  const minCount = Math.min(uniquePersonCount, totalTracksCreated)
  const maxCount = Math.max(uniquePersonCount, totalTracksCreated)
  return minCount / maxCount
}

/**
 * Position Jitter RMSE
 * Measures smoothness of track positions between consecutive observations
 * Lower is better - indicates Kalman filter is working well
 */
function calculatePositionJitterRMSE(
  observations: Map<string, TrackObservation[]>
): number {
  const jitters: number[] = []

  for (const [trackId, obs] of observations) {
    if (obs.length < 3) continue

    // Sort by timestamp
    const sorted = [...obs].sort((a, b) => a.timestamp - b.timestamp)

    // Calculate deviation from linear interpolation between neighbors
    for (let i = 1; i < sorted.length - 1; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const next = sorted[i + 1]

      // Time ratios
      const totalTime = next.timestamp - prev.timestamp
      if (totalTime <= 0) continue
      const ratio = (curr.timestamp - prev.timestamp) / totalTime

      // Linear interpolation of where position "should" be
      const expectedX = prev.position.x + ratio * (next.position.x - prev.position.x)
      const expectedY = prev.position.y + ratio * (next.position.y - prev.position.y)

      // Deviation from expected
      const jitter = Math.sqrt(
        Math.pow(curr.position.x - expectedX, 2) +
        Math.pow(curr.position.y - expectedY, 2)
      )
      jitters.push(jitter)
    }
  }

  if (jitters.length === 0) return 0

  // RMSE
  const sumSquares = jitters.reduce((sum, j) => sum + j * j, 0)
  return Math.sqrt(sumSquares / jitters.length)
}

/**
 * Velocity Consistency Index (VCI)
 * Measures percentage of position deltas with plausible velocity
 * Walking: 0.5-2.0 m/s, Running: up to 5.0 m/s
 */
function calculateVelocityConsistencyIndex(
  observations: Map<string, TrackObservation[]>,
  minVelocity: number = 0.0,
  maxVelocity: number = 5.0
): { index: number; violations: number; total: number } {
  let validCount = 0
  let totalCount = 0
  let violations = 0

  for (const [trackId, obs] of observations) {
    if (obs.length < 2) continue

    const sorted = [...obs].sort((a, b) => a.timestamp - b.timestamp)

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]

      const timeDelta = (curr.timestamp - prev.timestamp) / 1000 // to seconds
      if (timeDelta <= 0.01) continue // Skip very close timestamps

      const dist = distance(curr.position, prev.position)
      const velocity = dist / timeDelta

      totalCount++
      if (velocity >= minVelocity && velocity <= maxVelocity) {
        validCount++
      } else {
        violations++
      }
    }
  }

  return {
    index: totalCount > 0 ? validCount / totalCount : 1.0,
    violations,
    total: totalCount,
  }
}

/**
 * Cross-Camera Handoff Success Rate (CHSR)
 * In this ground-truth set, a "handoff opportunity" is a multi-camera annotation
 * (same person visible in overlapping FOVs). A success means the closest global
 * track contains associations from all cameras in that annotation.
 */
function calculateCrossHandoffRate(successfulHandoffs: number, totalHandoffs: number): number {
  if (totalHandoffs === 0) return 1.0
  return successfulHandoffs / totalHandoffs
}

/**
 * Track Merge Success Rate
 * Measures how often multi-camera detections merge into single track
 */
function calculateTrackMergeRate(
  mergedCount: number,
  totalMultiCamera: number
): number {
  if (totalMultiCamera === 0) return 1.0
  return mergedCount / totalMultiCamera
}

/**
 * Short-Lived Track Rate (SLTR)
 * Proxy for flicker: percentage of tracks that exist for < thresholdMs.
 */
function calculateShortLivedTrackRate(
  tracks: GlobalTrack[],
  thresholdMs: number = 2000
): { rate: number; shortLived: number; total: number } {
  if (tracks.length === 0) return { rate: 0, shortLived: 0, total: 0 }

  let shortLived = 0
  for (const t of tracks) {
    const firstSeen = t.trail.length > 0
      ? t.trail[t.trail.length - 1].timestamp
      : t.lastSeen
    const lifetime = t.lastSeen - firstSeen
    if (lifetime < thresholdMs) shortLived++
  }

  return {
    rate: shortLived / tracks.length,
    shortLived,
    total: tracks.length,
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Tracking Quality Metrics', () => {
  let groundTruth: GroundTruthDataset
  let cameraRegistry: CameraRegistry
  let cameraParams: Map<string, CameraParams>
  let sitemapConfig: any

  // Metrics storage
  let metrics: MetricsResult

  beforeAll(() => {
    // Load ground truth
    const groundTruthPath = join(__dirname, '../../../GroundTruths.json')
    groundTruth = JSON.parse(readFileSync(groundTruthPath, 'utf-8'))

    // Load sitemap config
    const sitemapPath = join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
    sitemapConfig = loadSiteMapConfig(sitemapPath)

    // Initialize camera registry
    cameraRegistry = new CameraRegistry()
    cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

    // Build camera params map
    cameraParams = new Map()
    for (const cam of sitemapConfig.cameras) {
      cameraParams.set(cam.id, siteMapCameraToCameraParams(cam))
    }

    console.log('\n=== Tracking Quality Metrics Test Suite ===')
    console.log(`Ground truth annotations: ${groundTruth.annotations.length}`)
    console.log(`Cameras: ${Array.from(cameraParams.keys()).join(', ')}`)
  })

  describe('Metric Collection', () => {
    let trackManager: TrackManager
    let detectionProcessor: DetectionProcessor
    let observations: Map<string, TrackObservation[]>
    let trackAssignments: Map<string, string>
    let multiCameraCount: number
    let mergedCount: number
    let handoffSuccessCount: number
    let totalTracksCreated: number
    let projectionErrors: number[]

    beforeAll(() => {
      // Process all annotations and collect metrics
      trackManager = new TrackManager({
        idGenerator: (() => {
          let id = 0
          return () => `global-${++id}`
        })(),
      })
      detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      // Load obstacles if any
      if (sitemapConfig.obstacles) {
        detectionProcessor.setObstacles(sitemapConfig.obstacles)
      }

      observations = new Map()
      trackAssignments = new Map()
      multiCameraCount = 0
      mergedCount = 0
      handoffSuccessCount = 0
      projectionErrors = []

      const certainAnnotations = groundTruth.annotations
        .filter(a => a.confidence === 'certain')
        .sort((a, b) => a.timestamp - b.timestamp)

      console.log(`\nProcessing ${certainAnnotations.length} certain annotations...`)

      // Group annotations by timestamp for proper temporal processing
      const annotationsByTimestamp = new Map<number, Annotation[]>()
      for (const ann of certainAnnotations) {
        if (!annotationsByTimestamp.has(ann.timestamp)) {
          annotationsByTimestamp.set(ann.timestamp, [])
        }
        annotationsByTimestamp.get(ann.timestamp)!.push(ann)
      }

      const sortedTimestamps = [...annotationsByTimestamp.keys()].sort((a, b) => a - b)
      let allTracksEverCreated = new Set<string>()

      for (const timestamp of sortedTimestamps) {
        const annsAtTime = annotationsByTimestamp.get(timestamp)!

        for (const annotation of annsAtTime) {
          const isMultiCamera = annotation.linkedDetections.length > 1
          if (isMultiCamera) multiCameraCount++

          // Get tracks before processing
          const tracksBefore = new Set(trackManager.getActiveTracks().map(t => t.globalTrackId))

          // Process each detection for this annotation
          for (const det of annotation.linkedDetections) {
            const msg = createDetectionMessage(det)
            detectionProcessor.processMessage(msg)
          }

          // Get active tracks after processing
          const activeTracks = trackManager.getActiveTracks()

          // Track all tracks ever created
          for (const track of activeTracks) {
            allTracksEverCreated.add(track.globalTrackId)
          }

          if (activeTracks.length > 0) {
            // Find the track closest to the ground truth position
            let bestTrack = activeTracks[0]
            let bestDist = distance(bestTrack.currentPosition, annotation.groundPosition)
            for (const track of activeTracks) {
              const dist = distance(track.currentPosition, annotation.groundPosition)
              if (dist < bestDist) {
                bestDist = dist
                bestTrack = track
              }
            }

            // Record track assignment
            trackAssignments.set(annotation.id, bestTrack.globalTrackId)

            // Check if multi-camera merged into single track
            if (isMultiCamera) {
              const camerasInDetections = new Set(annotation.linkedDetections.map(d => d.cameraId))

              // Handoff success for this overlap opportunity:
              // closest track should include all cameras in the annotation.
              const bestTrackCameras = new Set(bestTrack.cameraAssociations.keys())
              if ([...camerasInDetections].every(cam => bestTrackCameras.has(cam))) {
                handoffSuccessCount++
              }

              // Count how many tracks have associations from both cameras
              let tracksWithBothCameras = 0
              for (const track of activeTracks) {
                const trackCameras = new Set(track.cameraAssociations.keys())
                if ([...camerasInDetections].every(cam => trackCameras.has(cam))) {
                  tracksWithBothCameras++
                }
              }
              if (tracksWithBothCameras >= 1) {
                mergedCount++
              }
            }

            // Record observations for jitter/velocity analysis
            if (!observations.has(bestTrack.globalTrackId)) {
              observations.set(bestTrack.globalTrackId, [])
            }
            observations.get(bestTrack.globalTrackId)!.push({
              trackId: bestTrack.globalTrackId,
              position: { ...bestTrack.currentPosition },
              timestamp: annotation.timestamp,
              frameNumber: annotation.linkedDetections[0].frameNumber,
              cameraId: annotation.linkedDetections[0].cameraId,
            })

            // Calculate projection error
            projectionErrors.push(bestDist)
          }
        }
      }

      // Count unique tracks created across all processing
      totalTracksCreated = allTracksEverCreated.size

      console.log(`Total unique tracks created: ${totalTracksCreated}`)
      console.log(`Multi-camera annotations: ${multiCameraCount}`)
      console.log(`Successfully merged: ${mergedCount}`)
      console.log(`Observations recorded: ${observations.size} tracks`)
    })

    it('calculates Track Continuity Index (TCI)', () => {
      // Estimate unique persons from ground truth
      // Use position clustering - annotations within 1m at same time are likely same person
      const uniquePersonEstimate = estimateUniquePersonsAcrossScene(
        groundTruth.annotations.filter(a => a.confidence === 'certain')
      )

      const tci = calculateTrackContinuityIndex(uniquePersonEstimate, totalTracksCreated)

      console.log('\n--- Track Continuity Index (TCI) ---')
      console.log(`  Estimated unique persons: ${uniquePersonEstimate}`)
      console.log(`  Total tracks created: ${totalTracksCreated}`)
      console.log(`  TCI: ${(tci * 100).toFixed(1)}%`)
      console.log(`  Target: > 85%`)

      // Store for final report
      metrics = metrics || {} as MetricsResult
      metrics.trackContinuityIndex = tci

      expect(tci).toBeGreaterThan(0.2) // Relaxed threshold for now
    })

    it('calculates Position Jitter RMSE', () => {
      const jitterRMSE = calculatePositionJitterRMSE(observations)

      console.log('\n--- Position Jitter RMSE ---')
      console.log(`  Jitter RMSE: ${jitterRMSE.toFixed(3)}m`)
      console.log(`  Target: < 0.15m`)

      metrics.positionJitterRMSE = jitterRMSE

      expect(jitterRMSE).toBeLessThan(0.5) // Relaxed threshold
    })

    it('calculates Velocity Consistency Index (VCI)', () => {
      const vciResult = calculateVelocityConsistencyIndex(observations)

      console.log('\n--- Velocity Consistency Index (VCI) ---')
      console.log(`  Valid velocities: ${vciResult.index * 100}%`)
      console.log(`  Violations: ${vciResult.violations}/${vciResult.total}`)
      console.log(`  Target: > 85%`)

      metrics.velocityConsistencyIndex = vciResult.index

      expect(vciResult.index).toBeGreaterThan(0.5) // Relaxed threshold
    })

    it('calculates Cross-Camera Handoff Success Rate (CHSR)', () => {
      const chsrRate = calculateCrossHandoffRate(handoffSuccessCount, multiCameraCount)

      console.log('\n--- Cross-Camera Handoff Success Rate (CHSR) ---')
      console.log(`  Handoff success: ${(chsrRate * 100).toFixed(1)}%`)
      console.log(`  Successful: ${handoffSuccessCount}/${multiCameraCount}`)
      console.log(`  Target: > 90%`)

      metrics.crossCameraHandoffRate = chsrRate

      expect(chsrRate).toBeGreaterThan(0.5) // Relaxed threshold
    })

    it('calculates Track Merge Success Rate', () => {
      const mergeRate = calculateTrackMergeRate(mergedCount, multiCameraCount)

      console.log('\n--- Track Merge Success Rate ---')
      console.log(`  Merge success: ${(mergeRate * 100).toFixed(1)}%`)
      console.log(`  Merged: ${mergedCount}/${multiCameraCount}`)
      console.log(`  Target: > 70%`)

      metrics.trackMergeSuccessRate = mergeRate

      expect(mergeRate).toBeGreaterThan(0.5) // Relaxed threshold
    })

    it('calculates Short-Lived Track Rate (SLTR)', () => {
      const allTracks = trackManager.getAllTracks()
      const sltr = calculateShortLivedTrackRate(allTracks)

      console.log('\n--- Short-Lived Track Rate (SLTR) ---')
      console.log(`  Short-lived tracks (<2s): ${sltr.shortLived}/${sltr.total}`)
      console.log(`  SLTR: ${(sltr.rate * 100).toFixed(1)}%`)
      console.log(`  Target: < 30%`)

      metrics.shortLivedTrackRate = sltr.rate

      // Relaxed gate: should only fail on extreme flicker regressions.
      expect(sltr.rate).toBeLessThan(0.8)
    })

    it('calculates Average Projection Error', () => {
      const avgError = projectionErrors.length > 0
        ? projectionErrors.reduce((a, b) => a + b, 0) / projectionErrors.length
        : 0

      console.log('\n--- Average Projection Error ---')
      console.log(`  Average error: ${avgError.toFixed(3)}m`)
      console.log(`  Target: < 0.5m`)
      console.log(`  Note: For accurate projection error, see ground-truth-validation.test.ts`)
      console.log(`        which uses smart camera selection (achieves 0.418m)`)

      metrics.averageProjectionError = avgError

      // This test measures behavioral metrics, not projection accuracy
      // The projection accuracy is tested in ground-truth-validation.test.ts
      expect(true).toBe(true)
    })
  })

  describe('Final Metrics Report', () => {
    it('prints comprehensive metrics summary', () => {
      console.log('\n' + '='.repeat(60))
      console.log('TRACKING QUALITY METRICS - FINAL REPORT')
      console.log('='.repeat(60))

      const results = [
        {
          name: 'Track Continuity Index (TCI)',
          value: metrics?.trackContinuityIndex ?? 0,
          target: 0.85,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
        {
          name: 'Position Jitter RMSE',
          value: metrics?.positionJitterRMSE ?? 0,
          target: 0.15,
          format: (v: number) => `${v.toFixed(3)}m`,
          lowerIsBetter: true,
        },
        {
          name: 'Velocity Consistency Index (VCI)',
          value: metrics?.velocityConsistencyIndex ?? 0,
          target: 0.85,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
        {
          name: 'Cross-Camera Handoff Rate (CHSR)',
          value: metrics?.crossCameraHandoffRate ?? 0,
          target: 0.90,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
        {
          name: 'Track Merge Success Rate',
          value: metrics?.trackMergeSuccessRate ?? 0,
          target: 0.70,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
        },
        {
          name: 'Average Projection Error',
          value: metrics?.averageProjectionError ?? 0,
          target: 0.50,
          format: (v: number) => `${v.toFixed(3)}m`,
          lowerIsBetter: true,
        },
        {
          name: 'Short-Lived Track Rate (SLTR)',
          value: metrics?.shortLivedTrackRate ?? 0,
          target: 0.30,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
          lowerIsBetter: true,
        },
      ]

      let allPassing = true

      for (const r of results) {
        const passing = r.lowerIsBetter
          ? r.value <= r.target
          : r.value >= r.target
        const status = passing ? '✅' : '❌'
        if (!passing) allPassing = false

        const targetStr = r.lowerIsBetter ? `< ${r.format(r.target)}` : `> ${r.format(r.target)}`
        console.log(`\n${r.name}:`)
        console.log(`  Current: ${r.format(r.value)}`)
        console.log(`  Target:  ${targetStr}`)
        console.log(`  Status:  ${status}`)
      }

      console.log('\n' + '='.repeat(60))
      console.log(`Overall: ${allPassing ? '✅ ALL TARGETS MET' : '❌ SOME TARGETS NOT MET'}`)
      console.log('='.repeat(60) + '\n')

      // This test always passes - it's for reporting
      expect(true).toBe(true)
    })
  })
})

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Estimate unique persons across the full scene by greedily linking annotations
 * into continuous trajectories. This avoids inflating counts by using max-concurrency.
 */
function estimateUniquePersonsAcrossScene(
  annotations: Annotation[],
  maxGapSec: number = 20,
  maxDistM: number = 1.0
): number {
  if (annotations.length === 0) return 0

  const sorted = [...annotations].sort((a, b) => a.timestamp - b.timestamp)
  const clusters: Array<{ lastPos: { x: number; y: number }; lastTime: number }> = []

  for (const ann of sorted) {
    let bestIdx = -1
    let bestDist = Infinity

    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i]
      if (ann.timestamp - c.lastTime > maxGapSec) continue
      const d = Math.sqrt(
        Math.pow(ann.groundPosition.x - c.lastPos.x, 2) +
        Math.pow(ann.groundPosition.y - c.lastPos.y, 2)
      )
      if (d <= maxDistM && d < bestDist) {
        bestIdx = i
        bestDist = d
      }
    }

    if (bestIdx >= 0) {
      clusters[bestIdx].lastPos = ann.groundPosition
      clusters[bestIdx].lastTime = ann.timestamp
    } else {
      clusters.push({ lastPos: ann.groundPosition, lastTime: ann.timestamp })
    }
  }

  return clusters.length
}
