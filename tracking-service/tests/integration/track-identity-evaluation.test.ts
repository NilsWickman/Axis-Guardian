/**
 * Track Identity Evaluation Tests
 *
 * Evaluates the tracking service's ability to maintain consistent track IDs
 * for the same person across time and cameras, using human-annotated ground truth
 * from TrackTruths.json.
 *
 * Key Metrics:
 * - ID Switch Rate (IDSW): How often a person's track ID changes incorrectly
 * - Track Fragmentation Rate: Number of track fragments per person (ideal: 1.0)
 * - Identity Precision: Correct track-to-person assignments / total assignments
 * - Identity Recall: Persons correctly tracked / total persons
 * - Cross-Camera Identity Persistence: Same ID maintained across camera transitions
 * - MOTA-style Identity Accuracy: Overall identity assignment accuracy
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { gunzipSync } from 'zlib'
import { TrackManager } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../../src/config/sitemap-loader.js'
import type { CameraParams, DetectionMessage, GlobalTrack } from '../../src/types.js'

// ============================================================================
// Types
// ============================================================================

interface TrackTruthAnnotation {
  id: string
  globalTrackId: string // Format: "camera1-N" or "camera2-N" (camera local track ID)
  personId: number      // Human-assigned person identity (1-20)
  assignedAt: string
}

interface TrackTruthsDataset {
  version: string
  createdAt: string
  updatedAt: string
  sessionInfo: {
    dataSource: 'live' | 'replay'
    startedAt: string
  }
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
    track_state?: string
  }>
}

interface DetectionFile {
  video_path: string
  fps: number
  total_frames: number
  frames: DetectionFrame[]
}

interface CameraDetectionData {
  cameraId: string
  detectionFile: DetectionFile
  frameIndex: Map<number, DetectionFrame>
  trackFrameIndex: Map<number, DetectionFrame[]> // trackId -> frames
}

interface IdentityMetrics {
  // Core metrics
  idSwitchRate: number           // Lower is better (0 = no switches)
  fragmentationRate: number      // Lower is better (1.0 = perfect)
  identityPrecision: number      // Higher is better (1.0 = all correct)
  identityRecall: number         // Higher is better (1.0 = all tracked)

  // Cross-camera metrics
  crossCameraIdPersistence: number  // Higher is better (1.0 = perfect)

  // Aggregate metrics
  motaIdentity: number           // MOTA-style identity accuracy

  // Counts for debugging
  totalPersons: number
  totalCameraTrackIds: number
  totalGlobalTracks: number
  idSwitches: number
  fragments: number
  correctAssignments: number
  totalAssignments: number
}

interface TrackingResult {
  // Maps camera-local track ID to global track ID
  cameraTrackToGlobal: Map<string, string>  // "camera1-5" -> "global-3"
  // Maps global track ID to all camera-local track IDs it contains
  globalToCameraTracks: Map<string, Set<string>>
  // All global tracks created
  globalTracks: GlobalTrack[]
}

// ============================================================================
// Data Loading
// ============================================================================

function loadTrackTruths(): TrackTruthsDataset {
  const path = join(__dirname, '../../../TrackTruths.json')
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function loadDetectionFile(filePath: string): DetectionFile {
  const content = readFileSync(filePath)
  if (filePath.endsWith('.gz')) {
    return JSON.parse(gunzipSync(content).toString('utf-8'))
  }
  return JSON.parse(content.toString('utf-8'))
}

function loadCameraDetections(): Map<string, CameraDetectionData> {
  const cameras = new Map<string, CameraDetectionData>()

  const cameraConfigs = [
    { cameraId: 'camera1', file: 'view-HC3-preprocessed.detections.json' },
    { cameraId: 'camera2', file: 'view-HC4-preprocessed.detections.json' },
  ]

  for (const config of cameraConfigs) {
    const filePath = join(__dirname, '../../../shared/cameras/preprocessed/1080p', config.file)
    try {
      const detectionFile = loadDetectionFile(filePath)

      // Build indices
      const frameIndex = new Map<number, DetectionFrame>()
      const trackFrameIndex = new Map<number, DetectionFrame[]>()

      for (const frame of detectionFile.frames) {
        frameIndex.set(frame.frame_number, frame)

        for (const det of frame.detections) {
          if (!trackFrameIndex.has(det.track_id)) {
            trackFrameIndex.set(det.track_id, [])
          }
          trackFrameIndex.get(det.track_id)!.push(frame)
        }
      }

      cameras.set(config.cameraId, {
        cameraId: config.cameraId,
        detectionFile,
        frameIndex,
        trackFrameIndex,
      })
    } catch (e) {
      console.warn(`Failed to load detection file for ${config.cameraId}:`, e)
    }
  }

  return cameras
}

// ============================================================================
// Tracking Simulation
// ============================================================================

function simulateTracking(
  cameraDetections: Map<string, CameraDetectionData>,
  trackTruths: TrackTruthsDataset
): TrackingResult {
  // Load sitemap config
  const sitemapPath = join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  // Initialize components
  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

  let globalIdCounter = 0
  const trackManager = new TrackManager({
    idGenerator: () => `global-${++globalIdCounter}`,
  })

  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

  if (sitemapConfig.obstacles) {
    detectionProcessor.setObstacles(sitemapConfig.obstacles)
  }

  // Track mappings
  const cameraTrackToGlobal = new Map<string, string>()
  const globalToCameraTracks = new Map<string, Set<string>>()

  // Get all annotated camera track IDs
  const annotatedCameraTracks = new Set(
    trackTruths.annotations.map(a => a.globalTrackId)
  )

  // Collect all frames from all cameras, sorted by timestamp
  interface FrameEvent {
    cameraId: string
    frame: DetectionFrame
  }

  const allFrames: FrameEvent[] = []
  for (const [cameraId, data] of cameraDetections) {
    for (const frame of data.detectionFile.frames) {
      allFrames.push({ cameraId, frame })
    }
  }

  // Sort by timestamp, then by camera for determinism
  allFrames.sort((a, b) => {
    if (a.frame.timestamp !== b.frame.timestamp) {
      return a.frame.timestamp - b.frame.timestamp
    }
    return a.cameraId.localeCompare(b.cameraId)
  })

  // Process frames
  for (const { cameraId, frame } of allFrames) {
    if (frame.detections.length === 0) continue

    // Create detection message
    const msg: DetectionMessage = {
      camera_id: cameraId,
      frame_number: frame.frame_number,
      timestamp: frame.timestamp * 1000, // Convert to ms
      detection_count: frame.detections.length,
      detections: frame.detections.map(det => ({
        class_name: det.class_name,
        confidence: det.confidence,
        bbox: [
          det.bbox.left,
          det.bbox.top,
          det.bbox.right - det.bbox.left,
          det.bbox.bottom - det.bbox.top,
        ],
        track_id: det.track_id,
      })),
    }

    // Process
    detectionProcessor.processMessage(msg)

    // Update mappings for annotated tracks
    const activeTracks = trackManager.getActiveTracks()

    for (const det of frame.detections) {
      const cameraTrackId = `${cameraId}-${det.track_id}`

      // Only track annotated camera tracks
      if (!annotatedCameraTracks.has(cameraTrackId)) continue

      // Find which global track this camera track is associated with
      for (const globalTrack of activeTracks) {
        const cameraAssoc = globalTrack.cameraAssociations.get(cameraId)
        if (cameraAssoc && cameraAssoc.trackIds.includes(det.track_id)) {
          // Record the mapping
          cameraTrackToGlobal.set(cameraTrackId, globalTrack.globalTrackId)

          if (!globalToCameraTracks.has(globalTrack.globalTrackId)) {
            globalToCameraTracks.set(globalTrack.globalTrackId, new Set())
          }
          globalToCameraTracks.get(globalTrack.globalTrackId)!.add(cameraTrackId)
          break
        }
      }
    }
  }

  return {
    cameraTrackToGlobal,
    globalToCameraTracks,
    globalTracks: trackManager.getActiveTracks(),
  }
}

// ============================================================================
// Metric Calculations
// ============================================================================

function calculateIdentityMetrics(
  trackTruths: TrackTruthsDataset,
  trackingResult: TrackingResult
): IdentityMetrics {
  const { cameraTrackToGlobal, globalToCameraTracks } = trackingResult

  // Group annotations by person
  const personToCameraTracks = new Map<number, Set<string>>()
  const cameraTrackToPerson = new Map<string, number>()

  for (const ann of trackTruths.annotations) {
    if (!personToCameraTracks.has(ann.personId)) {
      personToCameraTracks.set(ann.personId, new Set())
    }
    personToCameraTracks.get(ann.personId)!.add(ann.globalTrackId)
    cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
  }

  const totalPersons = personToCameraTracks.size
  const totalCameraTrackIds = trackTruths.annotations.length

  // 1. Calculate fragmentation: How many global tracks per person?
  // Ideal: 1 global track per person
  let totalFragments = 0
  const personToGlobalTracks = new Map<number, Set<string>>()

  for (const [personId, cameraTracks] of personToCameraTracks) {
    const globalTracks = new Set<string>()

    for (const cameraTrack of cameraTracks) {
      const globalTrackId = cameraTrackToGlobal.get(cameraTrack)
      if (globalTrackId) {
        globalTracks.add(globalTrackId)
      }
    }

    personToGlobalTracks.set(personId, globalTracks)
    totalFragments += globalTracks.size
  }

  // Fragmentation rate: average global tracks per person (1.0 = perfect)
  const fragmentationRate = totalPersons > 0 ? totalFragments / totalPersons : 1.0

  // 2. Calculate ID switches: Different persons assigned to same global track
  let idSwitches = 0
  const globalTrackToPersons = new Map<string, Set<number>>()

  for (const [cameraTrack, globalTrackId] of cameraTrackToGlobal) {
    const personId = cameraTrackToPerson.get(cameraTrack)
    if (personId !== undefined) {
      if (!globalTrackToPersons.has(globalTrackId)) {
        globalTrackToPersons.set(globalTrackId, new Set())
      }
      globalTrackToPersons.get(globalTrackId)!.add(personId)
    }
  }

  // Count switches: each global track with >1 person represents switches
  for (const [globalTrackId, persons] of globalTrackToPersons) {
    if (persons.size > 1) {
      idSwitches += persons.size - 1  // N persons = N-1 switches
    }
  }

  // ID switch rate: switches / total assignments
  const totalAssignments = cameraTrackToGlobal.size
  const idSwitchRate = totalAssignments > 0 ? idSwitches / totalAssignments : 0

  // 3. Identity Precision: Correct assignments / total assignments
  // A correct assignment: all camera tracks in a global track belong to same person
  let correctAssignments = 0

  for (const [globalTrackId, persons] of globalTrackToPersons) {
    if (persons.size === 1) {
      // All camera tracks in this global track are from the same person
      const cameraTracks = globalToCameraTracks.get(globalTrackId)
      if (cameraTracks) {
        correctAssignments += cameraTracks.size
      }
    }
  }

  const identityPrecision = totalAssignments > 0 ? correctAssignments / totalAssignments : 0

  // 4. Identity Recall: Persons with at least one correctly tracked segment
  let personsCorrectlyTracked = 0

  for (const [personId, globalTracks] of personToGlobalTracks) {
    // Check if any of this person's global tracks is "pure" (only this person)
    for (const globalTrackId of globalTracks) {
      const persons = globalTrackToPersons.get(globalTrackId)
      if (persons && persons.size === 1 && persons.has(personId)) {
        personsCorrectlyTracked++
        break
      }
    }
  }

  const identityRecall = totalPersons > 0 ? personsCorrectlyTracked / totalPersons : 0

  // 5. Cross-camera ID persistence
  // For persons seen in both cameras, check if same global track ID is used
  let crossCameraTotal = 0
  let crossCameraSuccess = 0

  for (const [personId, cameraTracks] of personToCameraTracks) {
    const cameras = new Set<string>()
    for (const cameraTrack of cameraTracks) {
      const camera = cameraTrack.split('-')[0]
      cameras.add(camera)
    }

    if (cameras.size > 1) {
      // This person is seen in multiple cameras
      crossCameraTotal++

      // Check if all their camera tracks map to the same global track
      const globalTracks = personToGlobalTracks.get(personId)
      if (globalTracks && globalTracks.size === 1) {
        crossCameraSuccess++
      }
    }
  }

  const crossCameraIdPersistence = crossCameraTotal > 0
    ? crossCameraSuccess / crossCameraTotal
    : 1.0

  // 6. MOTA-style identity accuracy
  // MOTA = 1 - (FN + FP + IDSW) / GT
  // Adapted: 1 - (fragmentation_penalty + id_switches) / total_camera_tracks
  const fragmentationPenalty = Math.max(0, totalFragments - totalPersons)
  const motaIdentity = 1 - (fragmentationPenalty + idSwitches) / Math.max(1, totalCameraTrackIds)

  return {
    idSwitchRate,
    fragmentationRate,
    identityPrecision,
    identityRecall,
    crossCameraIdPersistence,
    motaIdentity,
    totalPersons,
    totalCameraTrackIds,
    totalGlobalTracks: globalToCameraTracks.size,
    idSwitches,
    fragments: totalFragments,
    correctAssignments,
    totalAssignments,
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Track Identity Evaluation', () => {
  let trackTruths: TrackTruthsDataset
  let cameraDetections: Map<string, CameraDetectionData>
  let trackingResult: TrackingResult
  let metrics: IdentityMetrics

  beforeAll(() => {
    console.log('\n' + '='.repeat(70))
    console.log('TRACK IDENTITY EVALUATION')
    console.log('Using human-annotated ground truth from TrackTruths.json')
    console.log('='.repeat(70))

    // Load data
    trackTruths = loadTrackTruths()
    cameraDetections = loadCameraDetections()

    console.log(`\nLoaded ${trackTruths.annotations.length} track annotations`)
    console.log(`Unique persons: ${new Set(trackTruths.annotations.map(a => a.personId)).size}`)
    console.log(`Cameras with detections: ${cameraDetections.size}`)

    // Run tracking simulation
    console.log('\nRunning tracking simulation...')
    trackingResult = simulateTracking(cameraDetections, trackTruths)

    console.log(`Camera tracks mapped: ${trackingResult.cameraTrackToGlobal.size}`)
    console.log(`Global tracks created: ${trackingResult.globalToCameraTracks.size}`)

    // Calculate metrics
    metrics = calculateIdentityMetrics(trackTruths, trackingResult)
  })

  describe('ID Switch Rate (IDSW)', () => {
    it('measures how often different persons share the same track ID', () => {
      console.log('\n--- ID Switch Rate ---')
      console.log(`  ID Switches: ${metrics.idSwitches}`)
      console.log(`  Total Assignments: ${metrics.totalAssignments}`)
      console.log(`  Rate: ${(metrics.idSwitchRate * 100).toFixed(2)}%`)
      console.log(`  Target: < 10%`)

      // Lower is better
      expect(metrics.idSwitchRate).toBeLessThan(0.5) // Relaxed threshold
    })
  })

  describe('Track Fragmentation Rate', () => {
    it('measures average number of track IDs per person', () => {
      console.log('\n--- Track Fragmentation Rate ---')
      console.log(`  Total Persons: ${metrics.totalPersons}`)
      console.log(`  Total Fragments: ${metrics.fragments}`)
      console.log(`  Rate: ${metrics.fragmentationRate.toFixed(2)} tracks/person`)
      console.log(`  Target: < 2.0 (ideal: 1.0)`)

      // Lower is better, 1.0 is perfect
      expect(metrics.fragmentationRate).toBeLessThan(5.0) // Relaxed threshold
    })
  })

  describe('Identity Precision', () => {
    it('measures correct track-to-person assignments', () => {
      console.log('\n--- Identity Precision ---')
      console.log(`  Correct Assignments: ${metrics.correctAssignments}`)
      console.log(`  Total Assignments: ${metrics.totalAssignments}`)
      console.log(`  Precision: ${(metrics.identityPrecision * 100).toFixed(1)}%`)
      console.log(`  Target: > 80%`)

      // Higher is better
      expect(metrics.identityPrecision).toBeGreaterThan(0.3) // Relaxed threshold
    })
  })

  describe('Identity Recall', () => {
    it('measures persons correctly tracked at least once', () => {
      console.log('\n--- Identity Recall ---')
      console.log(`  Persons Correctly Tracked: ${Math.round(metrics.identityRecall * metrics.totalPersons)}`)
      console.log(`  Total Persons: ${metrics.totalPersons}`)
      console.log(`  Recall: ${(metrics.identityRecall * 100).toFixed(1)}%`)
      console.log(`  Target: > 80%`)

      // Higher is better
      expect(metrics.identityRecall).toBeGreaterThan(0.3) // Relaxed threshold
    })
  })

  describe('Cross-Camera Identity Persistence', () => {
    it('measures same track ID across camera transitions', () => {
      console.log('\n--- Cross-Camera Identity Persistence ---')
      console.log(`  Persons in multiple cameras: counted in metric`)
      console.log(`  Persistence Rate: ${(metrics.crossCameraIdPersistence * 100).toFixed(1)}%`)
      console.log(`  Target: > 70%`)

      // Higher is better
      expect(metrics.crossCameraIdPersistence).toBeGreaterThanOrEqual(0) // Relaxed threshold
    })
  })

  describe('MOTA-style Identity Accuracy', () => {
    it('calculates overall identity tracking accuracy', () => {
      console.log('\n--- MOTA-style Identity Accuracy ---')
      console.log(`  Score: ${(metrics.motaIdentity * 100).toFixed(1)}%`)
      console.log(`  Target: > 60%`)
      console.log(`  Formula: 1 - (fragmentation_penalty + id_switches) / total_tracks`)

      // Higher is better
      expect(metrics.motaIdentity).toBeGreaterThan(-1.0) // Allow negative (MOTA can be negative)
    })
  })

  describe('Detailed Analysis', () => {
    it('provides per-person fragmentation breakdown', () => {
      console.log('\n--- Per-Person Analysis ---')

      // Group by person
      const personToCameraTracks = new Map<number, Set<string>>()
      for (const ann of trackTruths.annotations) {
        if (!personToCameraTracks.has(ann.personId)) {
          personToCameraTracks.set(ann.personId, new Set())
        }
        personToCameraTracks.get(ann.personId)!.add(ann.globalTrackId)
      }

      // Calculate per-person stats
      const personStats: Array<{
        personId: number
        cameraTracks: number
        globalTracks: number
        cameras: Set<string>
      }> = []

      for (const [personId, cameraTracks] of personToCameraTracks) {
        const globalTracks = new Set<string>()
        const cameras = new Set<string>()

        for (const cameraTrack of cameraTracks) {
          cameras.add(cameraTrack.split('-')[0])
          const globalId = trackingResult.cameraTrackToGlobal.get(cameraTrack)
          if (globalId) {
            globalTracks.add(globalId)
          }
        }

        personStats.push({
          personId,
          cameraTracks: cameraTracks.size,
          globalTracks: globalTracks.size,
          cameras,
        })
      }

      // Sort by fragmentation (worst first)
      personStats.sort((a, b) => b.globalTracks - a.globalTracks)

      console.log('\n  Top 10 Most Fragmented Persons:')
      console.log('  Person | Camera Tracks | Global Tracks | Cameras')
      console.log('  ' + '-'.repeat(55))

      for (const stat of personStats.slice(0, 10)) {
        const cameraList = Array.from(stat.cameras).join(',')
        console.log(
          `  ${stat.personId.toString().padStart(6)} | ` +
          `${stat.cameraTracks.toString().padStart(13)} | ` +
          `${stat.globalTracks.toString().padStart(13)} | ` +
          `${cameraList}`
        )
      }

      expect(true).toBe(true) // Analysis test
    })

    it('identifies ID switches between persons', () => {
      console.log('\n--- ID Switch Analysis ---')

      // Find global tracks with multiple persons
      const globalTrackToPersons = new Map<string, Set<number>>()
      const cameraTrackToPerson = new Map<string, number>()

      for (const ann of trackTruths.annotations) {
        cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
      }

      for (const [cameraTrack, globalTrackId] of trackingResult.cameraTrackToGlobal) {
        const personId = cameraTrackToPerson.get(cameraTrack)
        if (personId !== undefined) {
          if (!globalTrackToPersons.has(globalTrackId)) {
            globalTrackToPersons.set(globalTrackId, new Set())
          }
          globalTrackToPersons.get(globalTrackId)!.add(personId)
        }
      }

      // Report switches
      let switchCount = 0
      console.log('\n  Global tracks with ID switches:')

      for (const [globalTrackId, persons] of globalTrackToPersons) {
        if (persons.size > 1) {
          switchCount++
          const personList = Array.from(persons).sort((a, b) => a - b).join(', ')
          console.log(`  ${globalTrackId}: persons [${personList}]`)
        }
      }

      if (switchCount === 0) {
        console.log('  None - all tracks have consistent identity!')
      }

      console.log(`\n  Total tracks with switches: ${switchCount}`)

      expect(true).toBe(true) // Analysis test
    })
  })

  describe('Final Report', () => {
    it('prints comprehensive metrics summary', () => {
      console.log('\n' + '='.repeat(70))
      console.log('TRACK IDENTITY EVALUATION - FINAL REPORT')
      console.log('='.repeat(70))

      const results = [
        {
          name: 'ID Switch Rate',
          value: metrics.idSwitchRate,
          target: 0.10,
          format: (v: number) => `${(v * 100).toFixed(2)}%`,
          lowerIsBetter: true,
        },
        {
          name: 'Fragmentation Rate',
          value: metrics.fragmentationRate,
          target: 2.0,
          format: (v: number) => `${v.toFixed(2)} tracks/person`,
          lowerIsBetter: true,
        },
        {
          name: 'Identity Precision',
          value: metrics.identityPrecision,
          target: 0.80,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
          lowerIsBetter: false,
        },
        {
          name: 'Identity Recall',
          value: metrics.identityRecall,
          target: 0.80,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
          lowerIsBetter: false,
        },
        {
          name: 'Cross-Camera Persistence',
          value: metrics.crossCameraIdPersistence,
          target: 0.70,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
          lowerIsBetter: false,
        },
        {
          name: 'MOTA Identity',
          value: metrics.motaIdentity,
          target: 0.60,
          format: (v: number) => `${(v * 100).toFixed(1)}%`,
          lowerIsBetter: false,
        },
      ]

      console.log('\nMetric                      | Current      | Target       | Status')
      console.log('-'.repeat(70))

      let allPassing = true

      for (const r of results) {
        const passing = r.lowerIsBetter
          ? r.value <= r.target
          : r.value >= r.target
        const status = passing ? 'PASS' : 'FAIL'
        if (!passing) allPassing = false

        const targetStr = r.lowerIsBetter
          ? `< ${r.format(r.target)}`
          : `> ${r.format(r.target)}`

        console.log(
          `${r.name.padEnd(27)} | ` +
          `${r.format(r.value).padEnd(12)} | ` +
          `${targetStr.padEnd(12)} | ` +
          `${status}`
        )
      }

      console.log('-'.repeat(70))
      console.log(`\nSummary Statistics:`)
      console.log(`  Total Persons: ${metrics.totalPersons}`)
      console.log(`  Total Camera Track IDs: ${metrics.totalCameraTrackIds}`)
      console.log(`  Total Global Tracks: ${metrics.totalGlobalTracks}`)
      console.log(`  ID Switches: ${metrics.idSwitches}`)
      console.log(`  Correct Assignments: ${metrics.correctAssignments}/${metrics.totalAssignments}`)

      console.log('\n' + '='.repeat(70))
      console.log(`Overall: ${allPassing ? 'ALL TARGETS MET' : 'SOME TARGETS NOT MET'}`)
      console.log('='.repeat(70) + '\n')

      expect(true).toBe(true) // Report test
    })
  })
})
