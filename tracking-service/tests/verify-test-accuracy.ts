/**
 * Verify test accuracy - mirrors exactly what ground-truth-validation.test.ts does
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackManager } from '../src/tracks/track-manager.js'
import { DetectionProcessor } from '../src/detection/detection-processor.js'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

interface Point2D {
  x: number
  y: number
}

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

async function main() {
  // Load ground truth data
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const content = readFileSync(groundTruthPath, 'utf-8')
  const groundTruth = JSON.parse(content) as GroundTruthDataset

  // Load sitemap configuration
  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  // Initialize camera registry with sitemap cameras
  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  // Filter for certain confidence
  const certainAnnotations = groundTruth.annotations.filter((a) => a.confidence === 'certain')
  const multiCameraAnnotations = certainAnnotations.filter((a) => a.linkedDetections.length >= 2)

  console.log(`Total annotations: ${groundTruth.annotations.length}`)
  console.log(`Certain confidence: ${certainAnnotations.length}`)
  console.log(`Multi-camera: ${multiCameraAnnotations.length}`)
  console.log()

  // Check calibration
  console.log('Camera calibrations:')
  console.log(`  camera1 has calibration: ${cameraRegistry.hasCalibration('camera1')}`)
  console.log(`  camera2 has calibration: ${cameraRegistry.hasCalibration('camera2')}`)
  const cal1 = cameraRegistry.getCalibration('camera1')
  const cal2 = cameraRegistry.getCalibration('camera2')
  console.log(`  camera1 worldTransform.polynomial: ${cal1?.worldTransform?.polynomial ? 'yes (degree ' + cal1.worldTransform.polynomial.degree + ')' : 'no'}`)
  console.log(`  camera2 worldTransform.polynomial: ${cal2?.worldTransform?.polynomial ? 'yes (degree ' + cal2.worldTransform.polynomial.degree + ')' : 'no'}`)
  console.log()

  // ============================================================================
  // Test 1: projects all certain annotations within 0.5m of ground truth
  // ============================================================================
  console.log('=== Test 1: Projection Accuracy (same as test) ===')

  let mockTime = 1000
  let passed = 0
  let failed = 0
  const errors: number[] = []

  for (const annotation of certainAnnotations) {
    const trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => {
        let id = 0
        return () => `global-${++id}`
      })(),
    })
    const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

    mockTime = Math.floor(annotation.timestamp * 1000) + 1000

    for (const det of annotation.linkedDetections) {
      const bbox = convertBbox(det)
      detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
      mockTime += 10
    }

    const activeTracks = trackManager.getAllActiveTracks()
    if (activeTracks.length === 0) {
      failed++
      continue
    }

    const finalPosition = activeTracks[0].currentPosition
    const error = distance(finalPosition, annotation.groundPosition)
    errors.push(error)

    if (error < 0.5) {
      passed++
    } else {
      failed++
    }
  }

  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
  console.log(`Total: ${certainAnnotations.length}`)
  console.log(`Passed (<0.5m): ${passed} (${((passed / certainAnnotations.length) * 100).toFixed(1)}%)`)
  console.log(`Failed (>=0.5m): ${failed}`)
  console.log(`Average error: ${avgError.toFixed(3)}m`)
  console.log()

  // ============================================================================
  // Test 2: Cross-camera convergence
  // ============================================================================
  console.log('=== Test 2: Cross-Camera Convergence ===')

  let converged = 0
  let diverged = 0

  for (const annotation of multiCameraAnnotations) {
    const projections: Array<{ camera: string; position: Point2D }> = []

    for (const det of annotation.linkedDetections) {
      mockTime = Math.floor(annotation.timestamp * 1000) + 1000

      const tempTrackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => {
          let id = 0
          return () => `temp-${++id}`
        })(),
      })
      const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry)

      const bbox = convertBbox(det)
      const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)

      if (track) {
        projections.push({
          camera: det.cameraId,
          position: { ...track.currentPosition },
        })
      }
    }

    if (projections.length < 2) continue

    // Calculate max distance between any two projections
    let maxDist = 0
    for (let i = 0; i < projections.length; i++) {
      for (let j = i + 1; j < projections.length; j++) {
        const dist = distance(projections[i].position, projections[j].position)
        maxDist = Math.max(maxDist, dist)
      }
    }

    if (maxDist <= 0.6) {
      converged++
    } else {
      diverged++
    }
  }

  const total = converged + diverged
  console.log(`Total multi-camera: ${total}`)
  console.log(`Converged (<=0.6m): ${converged} (${((converged / total) * 100).toFixed(1)}%)`)
  console.log(`Diverged (>0.6m): ${diverged}`)
  console.log()

  // ============================================================================
  // Test 3: Centroid accuracy
  // ============================================================================
  console.log('=== Test 3: Centroid Accuracy ===')

  let centroidPassed = 0
  let centroidFailed = 0

  for (const annotation of multiCameraAnnotations) {
    const projections: Point2D[] = []

    for (const det of annotation.linkedDetections) {
      mockTime = Math.floor(annotation.timestamp * 1000) + 1000

      const tempTrackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => {
          let id = 0
          return () => `temp-${++id}`
        })(),
      })
      const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry)

      const bbox = convertBbox(det)
      const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)

      if (track) {
        projections.push({ ...track.currentPosition })
      }
    }

    if (projections.length === 0) continue

    // Calculate centroid
    const centroid: Point2D = {
      x: projections.reduce((sum, p) => sum + p.x, 0) / projections.length,
      y: projections.reduce((sum, p) => sum + p.y, 0) / projections.length,
    }

    const error = distance(centroid, annotation.groundPosition)
    if (error < 0.5) {
      centroidPassed++
    } else {
      centroidFailed++
    }
  }

  const centroidTotal = centroidPassed + centroidFailed
  console.log(`Total multi-camera: ${centroidTotal}`)
  console.log(`Passed (<0.5m): ${centroidPassed} (${((centroidPassed / centroidTotal) * 100).toFixed(1)}%)`)
  console.log(`Failed (>=0.5m): ${centroidFailed}`)
}

main().catch(console.error)
