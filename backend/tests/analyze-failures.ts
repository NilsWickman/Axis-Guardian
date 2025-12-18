/**
 * Analyze failure cases to understand patterns
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackManager } from '../src/tracks/track-manager.js'
import { DetectionProcessor } from '../src/detection/detection-processor.js'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig } from '../src/config/sitemap-loader.js'
import { projectWithKRT } from '../src/projection/ground-plane.js'

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

function getBBoxBottomCenter(bbox: { x: number; y: number; width: number; height: number }, imageWidth = 1920, imageHeight = 1080) {
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height,
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

  const certainAnnotations = groundTruth.annotations.filter((a) => a.confidence === 'certain')

  // Analyze each annotation
  const failures: Array<{
    id: string
    groundTruth: Point2D
    projections: Array<{ camera: string; projected: Point2D; rawKRT: Point2D; error: number; bboxCenter: Point2D }>
    finalError: number
    cameraCount: number
    groundTruthRegion: string
  }> = []

  let mockTime = 1000

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

    const projections: Array<{ camera: string; projected: Point2D; rawKRT: Point2D; error: number; bboxCenter: Point2D }> = []

    for (const det of annotation.linkedDetections) {
      const bbox = convertBbox(det)
      const bboxCenter = getBBoxBottomCenter(bbox)

      // Get raw KRT projection (before world transform)
      const calibration = cameraRegistry.getCalibration(det.cameraId)
      let rawKRT: Point2D = { x: 0, y: 0 }
      if (calibration) {
        // Project without world transform
        const { K, R, T, center, scale } = calibration
        const footX = bboxCenter.x
        const footY = bboxCenter.y

        // Manual KRT calculation
        const KR = [
          [K[0][0] * R[0][0] + K[0][1] * R[1][0] + K[0][2] * R[2][0],
           K[0][0] * R[0][1] + K[0][1] * R[1][1] + K[0][2] * R[2][1],
           K[0][0] * R[0][2] + K[0][1] * R[1][2] + K[0][2] * R[2][2]],
          [K[1][0] * R[0][0] + K[1][1] * R[1][0] + K[1][2] * R[2][0],
           K[1][0] * R[0][1] + K[1][1] * R[1][1] + K[1][2] * R[2][1],
           K[1][0] * R[0][2] + K[1][1] * R[1][2] + K[1][2] * R[2][2]],
          [K[2][0] * R[0][0] + K[2][1] * R[1][0] + K[2][2] * R[2][0],
           K[2][0] * R[0][1] + K[2][1] * R[1][1] + K[2][2] * R[2][1],
           K[2][0] * R[0][2] + K[2][1] * R[1][2] + K[2][2] * R[2][2]],
        ]

        // Build A matrix
        const x = footX * scale
        const y = footY * scale
        const A = [
          [KR[0][0], KR[0][1], center[0] - x],
          [KR[1][0], KR[1][1], center[1] - y],
          [KR[2][0], KR[2][1], -1],
        ]

        // KRT vector
        const KRTvec = [
          KR[0][0] * T[0] + KR[0][1] * T[1] + KR[0][2] * T[2],
          KR[1][0] * T[0] + KR[1][1] * T[1] + KR[1][2] * T[2],
          KR[2][0] * T[0] + KR[2][1] * T[1] + KR[2][2] * T[2],
        ]

        // Solve using Cramer's rule
        const det3x3 = (m: number[][]) =>
          m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
          m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
          m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

        const detA = det3x3(A)
        if (Math.abs(detA) > 1e-10) {
          const Ax = A.map((row, ri) => row.map((val, ci) => ci === 0 ? KRTvec[ri] : val))
          const Ay = A.map((row, ri) => row.map((val, ci) => ci === 1 ? KRTvec[ri] : val))
          rawKRT = { x: det3x3(Ax) / detA, y: det3x3(Ay) / detA }
        }
      }

      const track = detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
      mockTime += 10

      if (track) {
        const projError = distance(track.currentPosition, annotation.groundPosition)
        projections.push({
          camera: det.cameraId,
          projected: { ...track.currentPosition },
          rawKRT,
          error: projError,
          bboxCenter,
        })
      }
    }

    const activeTracks = trackManager.getAllActiveTracks()
    if (activeTracks.length > 0) {
      const finalPosition = activeTracks[0].currentPosition
      const finalError = distance(finalPosition, annotation.groundPosition)

      // Determine region
      const gt = annotation.groundPosition
      let region = 'center'
      if (gt.y < 2) region = 'bottom'
      else if (gt.y > 10) region = 'top'
      if (gt.x < 3) region = 'left-' + region
      else if (gt.x > 15) region = 'right-' + region

      if (finalError >= 0.5) {
        failures.push({
          id: annotation.id,
          groundTruth: annotation.groundPosition as Point2D,
          projections,
          finalError,
          cameraCount: annotation.linkedDetections.length,
          groundTruthRegion: region,
        })
      }
    }
  }

  // Sort by error
  failures.sort((a, b) => b.finalError - a.finalError)

  console.log(`\n=== FAILURE ANALYSIS ===\n`)
  console.log(`Total failures: ${failures.length} / ${certainAnnotations.length}`)
  console.log()

  // Group by region
  const byRegion = new Map<string, typeof failures>()
  for (const f of failures) {
    const region = f.groundTruthRegion
    if (!byRegion.has(region)) byRegion.set(region, [])
    byRegion.get(region)!.push(f)
  }

  console.log('Failures by region:')
  for (const [region, items] of byRegion) {
    console.log(`  ${region}: ${items.length}`)
  }
  console.log()

  // Group by camera configuration
  const singleCamFailures = failures.filter(f => f.cameraCount === 1)
  const multiCamFailures = failures.filter(f => f.cameraCount >= 2)
  console.log(`Single-camera failures: ${singleCamFailures.length}`)
  console.log(`Multi-camera failures: ${multiCamFailures.length}`)
  console.log()

  // Analyze single-camera failures by camera
  const cam1Failures = singleCamFailures.filter(f => f.projections[0]?.camera === 'camera1')
  const cam2Failures = singleCamFailures.filter(f => f.projections[0]?.camera === 'camera2')
  console.log(`Single-camera failures breakdown:`)
  console.log(`  Camera1: ${cam1Failures.length}`)
  console.log(`  Camera2: ${cam2Failures.length}`)
  console.log()

  // Show top 10 worst failures
  console.log('Top 10 worst failures:')
  for (const f of failures.slice(0, 10)) {
    console.log(`  ${f.id}:`)
    console.log(`    Ground truth: (${f.groundTruth.x.toFixed(2)}, ${f.groundTruth.y.toFixed(2)}) [${f.groundTruthRegion}]`)
    console.log(`    Final error: ${f.finalError.toFixed(3)}m`)
    console.log(`    Cameras: ${f.cameraCount}`)
    for (const p of f.projections) {
      console.log(`      ${p.camera}: projected=(${p.projected.x.toFixed(2)}, ${p.projected.y.toFixed(2)}), rawKRT=(${p.rawKRT.x.toFixed(2)}, ${p.rawKRT.y.toFixed(2)}), bbox_bottom=(${p.bboxCenter.x.toFixed(0)}, ${p.bboxCenter.y.toFixed(0)}), err=${p.error.toFixed(3)}m`)
    }
  }
  console.log()

  // Analyze raw KRT coordinates vs transformed coordinates for single camera failures
  console.log('=== Raw KRT Analysis (Single Camera Failures) ===')
  for (const f of cam1Failures.slice(0, 5)) {
    const p = f.projections[0]
    console.log(`${f.id}:`)
    console.log(`  GT: (${f.groundTruth.x.toFixed(2)}, ${f.groundTruth.y.toFixed(2)})`)
    console.log(`  Raw KRT: (${p.rawKRT.x.toFixed(2)}, ${p.rawKRT.y.toFixed(2)})`)
    console.log(`  Transformed: (${p.projected.x.toFixed(2)}, ${p.projected.y.toFixed(2)})`)
    console.log(`  Error: ${p.error.toFixed(3)}m`)
    console.log()
  }

  // Check for systematic errors
  console.log('=== Systematic Error Analysis ===')

  // X and Y error distributions
  let xErrors: number[] = []
  let yErrors: number[] = []

  for (const f of failures) {
    for (const p of f.projections) {
      xErrors.push(p.projected.x - f.groundTruth.x)
      yErrors.push(p.projected.y - f.groundTruth.y)
    }
  }

  const avgXError = xErrors.reduce((a, b) => a + b, 0) / xErrors.length
  const avgYError = yErrors.reduce((a, b) => a + b, 0) / yErrors.length

  console.log(`Average X error (failures only): ${avgXError.toFixed(3)}m`)
  console.log(`Average Y error (failures only): ${avgYError.toFixed(3)}m`)
  console.log()

  // Look for bbox size correlation
  console.log('=== BBox Size Analysis ===')
  for (const f of failures.slice(0, 5)) {
    for (const p of f.projections) {
      const det = certainAnnotations.find(a => a.id === f.id)!.linkedDetections.find(d => d.cameraId === p.camera)!
      const bbox = convertBbox(det)
      console.log(`${f.id} ${p.camera}: bbox_size=${bbox.width.toFixed(0)}x${bbox.height.toFixed(0)}, error=${p.error.toFixed(3)}m`)
    }
  }
}

main().catch(console.error)
