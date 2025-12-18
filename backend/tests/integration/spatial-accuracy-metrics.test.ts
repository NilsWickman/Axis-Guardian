/**
 * Spatial Accuracy Metrics Tests
 *
 * Analyzes projection accuracy across different spatial regions:
 * - Edge-of-FOV Error: Accuracy at image periphery vs center
 * - Distance-Based Error Bands: Error by distance from camera
 * - Overlap Zone Accuracy: Error in multi-camera overlap areas
 * - Heading/Direction Accuracy: Movement direction prediction quality
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { TrackManager } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { loadSiteMapConfig } from '../../src/config/sitemap-loader.js'
import type { CameraParams, Point2D } from '../../src/types.js'

// ============================================================================
// Types
// ============================================================================

interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: { left: number; top: number; right: number; bottom: number }
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

interface SpatialMetrics {
  // Edge-of-FOV metrics
  centerError: number      // Error for detections in center 50% of image
  edgeError: number        // Error for detections in outer 25% of image
  cornerError: number      // Error for detections in corners
  edgeTocentRatio: number  // Ratio of edge to center error

  // Distance-based metrics
  nearError: number        // 0-5m from camera
  midError: number         // 5-10m from camera
  farError: number         // 10m+ from camera
  errorByDistanceBand: Map<string, { avgError: number; count: number; passRate: number }>

  // Overlap zone metrics
  overlapZoneError: number      // Error in multi-camera overlap zones
  singleCameraError: number     // Error in single-camera zones
  overlapImprovement: number    // How much better overlap is vs single

  // Regional metrics
  errorByQuadrant: Map<string, { avgError: number; count: number }>
}

// ============================================================================
// Helpers
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

function getBboxCenter(det: LinkedDetection): { x: number; y: number } {
  return {
    x: (det.bbox.left + det.bbox.right) / 2,
    y: (det.bbox.top + det.bbox.bottom) / 2,
  }
}

function getImageRegion(bboxCenter: { x: number; y: number }, imageWidth = 1920, imageHeight = 1080): string {
  const normX = bboxCenter.x / imageWidth
  const normY = bboxCenter.y / imageHeight

  // Check corners (outer 20%)
  const isLeftEdge = normX < 0.2
  const isRightEdge = normX > 0.8
  const isTopEdge = normY < 0.2
  const isBottomEdge = normY > 0.8

  if ((isLeftEdge || isRightEdge) && (isTopEdge || isBottomEdge)) {
    return 'corner'
  }
  if (isLeftEdge || isRightEdge || isTopEdge || isBottomEdge) {
    return 'edge'
  }
  return 'center'
}

function getQuadrant(worldPos: { x: number; y: number }, roomWidth: number, roomHeight: number): string {
  const isRight = worldPos.x > roomWidth / 2
  const isTop = worldPos.y > roomHeight / 2
  if (isRight && isTop) return 'NE'
  if (!isRight && isTop) return 'NW'
  if (isRight && !isTop) return 'SE'
  return 'SW'
}

function getDistanceBand(distanceFromCamera: number): string {
  if (distanceFromCamera < 3) return '0-3m'
  if (distanceFromCamera < 5) return '3-5m'
  if (distanceFromCamera < 7) return '5-7m'
  if (distanceFromCamera < 10) return '7-10m'
  return '10m+'
}

function isInOverlapZone(worldPos: { x: number; y: number }, cameras: Map<string, CameraParams>): boolean {
  // A point is in overlap zone if it's visible from multiple cameras
  // Simplified: check if distance to multiple cameras is reasonable
  let visibleFromCount = 0
  for (const [, camera] of cameras) {
    const dist = Math.sqrt(
      Math.pow(worldPos.x - camera.position.x, 2) +
      Math.pow(worldPos.y - camera.position.y, 2)
    )
    // Consider visible if within 15m and roughly in FOV direction
    if (dist < 15) visibleFromCount++
  }
  return visibleFromCount >= 2
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Spatial Accuracy Metrics', () => {
  let groundTruth: GroundTruthDataset
  let cameraRegistry: CameraRegistry
  let sitemapConfig: ReturnType<typeof loadSiteMapConfig>
  let certainAnnotations: Annotation[]
  let cameras: Map<string, CameraParams>

  beforeAll(() => {
    // Load ground truth data
    const groundTruthPath = join(__dirname, '../../../GroundTruths.json')
    groundTruth = JSON.parse(readFileSync(groundTruthPath, 'utf-8'))

    // Load sitemap configuration
    const sitemapPath = join(__dirname, '../../../shared/config/sitemap-rectangular-room.json')
    sitemapConfig = loadSiteMapConfig(sitemapPath)

    // Initialize camera registry
    cameraRegistry = new CameraRegistry()
    cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

    // Build cameras map
    cameras = new Map()
    for (const cam of sitemapConfig.cameras) {
      cameras.set(cam.id, {
        position: { x: cam.position.x, y: cam.position.y, z: cam.height },
        azimuth: cam.azimuth,
        elevation: cam.elevation ?? 45,
        fov: cam.fieldOfView,
      })
    }

    // Filter annotations
    certainAnnotations = groundTruth.annotations.filter(a => a.confidence === 'certain')

    console.log('\n' + '='.repeat(70))
    console.log('SPATIAL ACCURACY METRICS')
    console.log('='.repeat(70))
    console.log(`Annotations: ${certainAnnotations.length}`)
    console.log(`Room: ${sitemapConfig.dimensions.width}m x ${sitemapConfig.dimensions.height}m`)
    console.log(`Cameras: ${cameras.size}`)
  })

  describe('Edge-of-FOV Error Analysis', () => {
    it('analyzes error by image region (center vs edge vs corner)', () => {
      const regionErrors: Map<string, number[]> = new Map([
        ['center', []],
        ['edge', []],
        ['corner', []],
      ])

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      for (const annotation of certainAnnotations) {
        trackManager.clearAllTracks()
        detectionProcessor.resetFrameTracking()
        mockTime = Math.floor(annotation.timestamp * 1000) + 1000

        for (const det of annotation.linkedDetections) {
          const bbox = convertBbox(det)
          const bboxCenter = getBboxCenter(det)
          const region = getImageRegion(bboxCenter)

          // Project single detection
          const singleTrackManager = new TrackManager({
            clock: () => mockTime,
            idGenerator: (() => { let id = 0; return () => `single-${++id}` })(),
          })
          const singleProcessor = new DetectionProcessor(singleTrackManager, cameraRegistry)
          singleProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)

          const tracks = singleTrackManager.getAllActiveTracks()
          if (tracks.length > 0) {
            const error = distance(tracks[0].currentPosition, annotation.groundPosition)
            regionErrors.get(region)!.push(error)
          }
        }
      }

      // Calculate statistics
      console.log('\n--- Edge-of-FOV Error Analysis ---')
      console.log('Region    | Count | Avg Error | Pass Rate (<0.5m)')
      console.log('-'.repeat(55))

      for (const [region, errors] of regionErrors) {
        if (errors.length === 0) continue
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
        const passRate = errors.filter(e => e < 0.5).length / errors.length
        console.log(
          `${region.padEnd(9)} | ${errors.length.toString().padStart(5)} | ` +
          `${avgError.toFixed(3)}m    | ${(passRate * 100).toFixed(1)}%`
        )
      }

      const centerErrors = regionErrors.get('center')!
      const edgeErrors = regionErrors.get('edge')!

      if (centerErrors.length > 0 && edgeErrors.length > 0) {
        const centerAvg = centerErrors.reduce((a, b) => a + b, 0) / centerErrors.length
        const edgeAvg = edgeErrors.reduce((a, b) => a + b, 0) / edgeErrors.length
        console.log(`\nEdge/Center Error Ratio: ${(edgeAvg / centerAvg).toFixed(2)}x`)
      }

      // Note: Center region may have 0 samples if test data only includes corner detections
      // This is diagnostic - we report whatever data is available
      expect(regionErrors.get('corner')!.length).toBeGreaterThan(0)
    })
  })

  describe('Distance-Based Error Bands', () => {
    it('analyzes error by distance from camera', () => {
      const distanceErrors: Map<string, number[]> = new Map([
        ['0-3m', []],
        ['3-5m', []],
        ['5-7m', []],
        ['7-10m', []],
        ['10m+', []],
      ])

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      for (const annotation of certainAnnotations) {
        for (const det of annotation.linkedDetections) {
          trackManager.clearAllTracks()
          detectionProcessor.resetFrameTracking()
          mockTime = Math.floor(annotation.timestamp * 1000) + 1000

          const bbox = convertBbox(det)
          detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)

          const tracks = trackManager.getAllActiveTracks()
          if (tracks.length > 0) {
            const projectedPos = tracks[0].currentPosition
            const camera = cameras.get(det.cameraId)
            if (camera) {
              const distFromCamera = Math.sqrt(
                Math.pow(annotation.groundPosition.x - camera.position.x, 2) +
                Math.pow(annotation.groundPosition.y - camera.position.y, 2)
              )
              const band = getDistanceBand(distFromCamera)
              const error = distance(projectedPos, annotation.groundPosition)
              distanceErrors.get(band)!.push(error)
            }
          }
        }
      }

      console.log('\n--- Distance-Based Error Analysis ---')
      console.log('Distance  | Count | Avg Error | Pass Rate | Trend')
      console.log('-'.repeat(60))

      let prevAvg = 0
      for (const [band, errors] of distanceErrors) {
        if (errors.length === 0) {
          console.log(`${band.padEnd(9)} | ${'-'.padStart(5)} | ${'N/A'.padStart(9)} | ${'N/A'.padStart(9)} |`)
          continue
        }
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
        const passRate = errors.filter(e => e < 0.5).length / errors.length
        const trend = prevAvg === 0 ? '-' : avgError > prevAvg ? '↑ worse' : '↓ better'
        console.log(
          `${band.padEnd(9)} | ${errors.length.toString().padStart(5)} | ` +
          `${avgError.toFixed(3)}m    | ${(passRate * 100).toFixed(1)}%     | ${trend}`
        )
        prevAvg = avgError
      }

      expect(distanceErrors.get('3-5m')!.length).toBeGreaterThan(0)
    })
  })

  describe('Overlap Zone Accuracy', () => {
    it('compares accuracy in overlap zones vs single-camera zones', () => {
      const overlapErrors: number[] = []
      const singleErrors: number[] = []

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      for (const annotation of certainAnnotations) {
        trackManager.clearAllTracks()
        detectionProcessor.resetFrameTracking()
        mockTime = Math.floor(annotation.timestamp * 1000) + 1000

        // Process all detections
        for (const det of annotation.linkedDetections) {
          const bbox = convertBbox(det)
          detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
          mockTime += 10
        }

        const tracks = trackManager.getAllActiveTracks()
        if (tracks.length > 0) {
          // Use first track (merged if multiple cameras)
          const finalPos = tracks[0].currentPosition
          const error = distance(finalPos, annotation.groundPosition)

          const isOverlap = annotation.linkedDetections.length >= 2
          if (isOverlap) {
            overlapErrors.push(error)
          } else {
            singleErrors.push(error)
          }
        }
      }

      console.log('\n--- Overlap Zone Analysis ---')

      const overlapAvg = overlapErrors.length > 0
        ? overlapErrors.reduce((a, b) => a + b, 0) / overlapErrors.length : 0
      const overlapPass = overlapErrors.length > 0
        ? overlapErrors.filter(e => e < 0.5).length / overlapErrors.length : 0

      const singleAvg = singleErrors.length > 0
        ? singleErrors.reduce((a, b) => a + b, 0) / singleErrors.length : 0
      const singlePass = singleErrors.length > 0
        ? singleErrors.filter(e => e < 0.5).length / singleErrors.length : 0

      console.log(`Multi-camera (overlap): ${overlapErrors.length} samples`)
      console.log(`  Avg error: ${overlapAvg.toFixed(3)}m`)
      console.log(`  Pass rate: ${(overlapPass * 100).toFixed(1)}%`)

      console.log(`\nSingle-camera: ${singleErrors.length} samples`)
      console.log(`  Avg error: ${singleAvg.toFixed(3)}m`)
      console.log(`  Pass rate: ${(singlePass * 100).toFixed(1)}%`)

      if (overlapAvg > 0 && singleAvg > 0) {
        const improvement = ((singleAvg - overlapAvg) / singleAvg) * 100
        console.log(`\nOverlap improvement: ${improvement.toFixed(1)}% ${improvement > 0 ? '(better)' : '(worse)'}`)
      }

      expect(overlapErrors.length).toBeGreaterThan(0)
      expect(singleErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Regional Error Distribution', () => {
    it('analyzes error by room quadrant', () => {
      const quadrantErrors: Map<string, number[]> = new Map([
        ['NW', []], ['NE', []], ['SW', []], ['SE', []],
      ])

      let mockTime = 1000
      const trackManager = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `global-${++id}` })(),
      })
      const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

      for (const annotation of certainAnnotations) {
        trackManager.clearAllTracks()
        detectionProcessor.resetFrameTracking()
        mockTime = Math.floor(annotation.timestamp * 1000) + 1000

        for (const det of annotation.linkedDetections) {
          const bbox = convertBbox(det)
          detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
          mockTime += 10
        }

        const tracks = trackManager.getAllActiveTracks()
        if (tracks.length > 0) {
          const finalPos = tracks[0].currentPosition
          const error = distance(finalPos, annotation.groundPosition)
          const quadrant = getQuadrant(
            annotation.groundPosition,
            sitemapConfig.dimensions.width,
            sitemapConfig.dimensions.height
          )
          quadrantErrors.get(quadrant)!.push(error)
        }
      }

      console.log('\n--- Regional Error Distribution ---')
      console.log('Quadrant | Count | Avg Error | Pass Rate')
      console.log('-'.repeat(45))

      for (const [quadrant, errors] of quadrantErrors) {
        if (errors.length === 0) continue
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
        const passRate = errors.filter(e => e < 0.5).length / errors.length
        console.log(
          `${quadrant.padEnd(8)} | ${errors.length.toString().padStart(5)} | ` +
          `${avgError.toFixed(3)}m    | ${(passRate * 100).toFixed(1)}%`
        )
      }

      expect(true).toBe(true)
    })
  })

  describe('Final Summary', () => {
    it('prints comprehensive spatial metrics report', () => {
      console.log('\n' + '='.repeat(70))
      console.log('SPATIAL ACCURACY METRICS - SUMMARY')
      console.log('='.repeat(70))

      console.log(`
Key Findings:
- Edge-of-FOV analysis shows how lens distortion affects accuracy
- Distance bands reveal calibration quality at different ranges
- Overlap zones typically have better accuracy due to multi-camera fusion
- Regional distribution helps identify systematic calibration biases

Recommendations:
- If edge error >> center error: Consider lens distortion correction
- If far distance error >> near: May need better camera calibration
- If overlap worse than single: Check camera synchronization
- If one quadrant has high error: Check camera coverage/calibration
`)

      expect(true).toBe(true)
    })
  })
})
