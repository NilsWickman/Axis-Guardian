/**
 * Analyze failure cases - fixed bbox extraction
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackManager } from '../src/tracks/track-manager.js'
import { DetectionProcessor } from '../src/detection/detection-processor.js'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig } from '../src/config/sitemap-loader.js'
import { projectWithKRT, projectDetectionWithKRT, getBBoxBottomCenter } from '../src/projection/ground-plane.js'

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

  const certainAnnotations = groundTruth.annotations.filter((a) => a.confidence === 'certain')

  // Find the worst failures
  const results: Array<{
    id: string
    groundTruth: Point2D
    det: LinkedDetection
    bbox: { x: number; y: number; width: number; height: number }
    feetPos: Point2D
    rawKRT: Point2D
    transformed: Point2D
    error: number
  }> = []

  for (const ann of certainAnnotations) {
    for (const det of ann.linkedDetections) {
      const bbox = convertBbox(det)
      const feetPos = getBBoxBottomCenter(bbox, null, [], false, 1920, 1080, false)

      const calibration = cameraRegistry.getCalibration(det.cameraId)
      if (!calibration) continue

      // Raw KRT without world transform
      const { K, R, T, center, scale } = calibration

      // Calculate raw KRT
      const x = feetPos.x * scale
      const y = feetPos.y * scale

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

      const A = [
        [KR[0][0], KR[0][1], center[0] - x],
        [KR[1][0], KR[1][1], center[1] - y],
        [KR[2][0], KR[2][1], -1],
      ]

      const KRTvec = [
        KR[0][0] * T[0] + KR[0][1] * T[1] + KR[0][2] * T[2],
        KR[1][0] * T[0] + KR[1][1] * T[1] + KR[1][2] * T[2],
        KR[2][0] * T[0] + KR[2][1] * T[1] + KR[2][2] * T[2],
      ]

      const det3x3 = (m: number[][]) =>
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

      const detA = det3x3(A)
      let rawKRT: Point2D = { x: 0, y: 0 }
      if (Math.abs(detA) > 1e-10) {
        const Ax = A.map((row, ri) => row.map((val, ci) => ci === 0 ? KRTvec[ri] : val))
        const Ay = A.map((row, ri) => row.map((val, ci) => ci === 1 ? KRTvec[ri] : val))
        rawKRT = { x: det3x3(Ax) / detA, y: det3x3(Ay) / detA }
      }

      // Get transformed result
      const krtResult = projectDetectionWithKRT(bbox, calibration, null, [], false, 1920, 1080)
      const transformed = krtResult.worldPoint

      const error = distance(transformed, ann.groundPosition)

      results.push({
        id: ann.id,
        groundTruth: ann.groundPosition as Point2D,
        det,
        bbox,
        feetPos,
        rawKRT,
        transformed,
        error,
      })
    }
  }

  // Sort by error descending
  results.sort((a, b) => b.error - a.error)

  console.log('=== TOP 15 WORST PROJECTIONS ===\n')

  for (const r of results.slice(0, 15)) {
    console.log(`${r.id} (${r.det.cameraId}):`)
    console.log(`  Ground Truth: (${r.groundTruth.x.toFixed(2)}, ${r.groundTruth.y.toFixed(2)})`)
    console.log(`  BBox: left=${r.det.bbox.left.toFixed(0)}, top=${r.det.bbox.top.toFixed(0)}, right=${r.det.bbox.right.toFixed(0)}, bottom=${r.det.bbox.bottom.toFixed(0)}`)
    console.log(`  BBox size: ${r.bbox.width.toFixed(0)}x${r.bbox.height.toFixed(0)}`)
    console.log(`  Feet position (image): (${r.feetPos.x.toFixed(1)}, ${r.feetPos.y.toFixed(1)})`)
    console.log(`  Raw KRT (dataset coords): (${r.rawKRT.x.toFixed(2)}, ${r.rawKRT.y.toFixed(2)})`)
    console.log(`  Transformed (sitemap coords): (${r.transformed.x.toFixed(2)}, ${r.transformed.y.toFixed(2)})`)
    console.log(`  Error: ${r.error.toFixed(3)}m`)
    console.log()
  }

  // Analyze raw KRT distribution
  console.log('=== RAW KRT COORDINATE RANGES ===\n')

  const cam1Results = results.filter(r => r.det.cameraId === 'camera1')
  const cam2Results = results.filter(r => r.det.cameraId === 'camera2')

  console.log('Camera1 raw KRT range:')
  const cam1XMin = Math.min(...cam1Results.map(r => r.rawKRT.x))
  const cam1XMax = Math.max(...cam1Results.map(r => r.rawKRT.x))
  const cam1YMin = Math.min(...cam1Results.map(r => r.rawKRT.y))
  const cam1YMax = Math.max(...cam1Results.map(r => r.rawKRT.y))
  console.log(`  X: [${cam1XMin.toFixed(2)}, ${cam1XMax.toFixed(2)}]`)
  console.log(`  Y: [${cam1YMin.toFixed(2)}, ${cam1YMax.toFixed(2)}]`)

  console.log('\nCamera2 raw KRT range:')
  const cam2XMin = Math.min(...cam2Results.map(r => r.rawKRT.x))
  const cam2XMax = Math.max(...cam2Results.map(r => r.rawKRT.x))
  const cam2YMin = Math.min(...cam2Results.map(r => r.rawKRT.y))
  const cam2YMax = Math.max(...cam2Results.map(r => r.rawKRT.y))
  console.log(`  X: [${cam2XMin.toFixed(2)}, ${cam2XMax.toFixed(2)}]`)
  console.log(`  Y: [${cam2YMin.toFixed(2)}, ${cam2YMax.toFixed(2)}]`)

  // Analyze transformation quality by region
  console.log('\n=== ERROR BY RAW KRT REGION ===\n')

  // Bin camera1 results by raw KRT coordinates
  for (const camera of ['camera1', 'camera2']) {
    const camResults = results.filter(r => r.det.cameraId === camera)
    const xBins = new Map<string, number[]>()

    for (const r of camResults) {
      const xBin = Math.floor(r.rawKRT.x / 2) * 2 // 2m bins
      const yBin = Math.floor(r.rawKRT.y / 2) * 2
      const key = `x[${xBin},${xBin+2}]_y[${yBin},${yBin+2}]`
      if (!xBins.has(key)) xBins.set(key, [])
      xBins.get(key)!.push(r.error)
    }

    console.log(`${camera} error by raw KRT region:`)
    for (const [key, errors] of xBins) {
      const avgErr = errors.reduce((a, b) => a + b, 0) / errors.length
      const count = errors.length
      if (count >= 3) {
        console.log(`  ${key}: avg_err=${avgErr.toFixed(3)}m, n=${count}`)
      }
    }
    console.log()
  }

  // Identify extrapolation issues
  console.log('=== POTENTIAL EXTRAPOLATION ISSUES ===\n')

  // Find results where rawKRT is outside the training range
  // Our polynomial was trained on certain ground truth points
  // If rawKRT is far from training data, extrapolation errors occur

  for (const r of results.slice(0, 10)) {
    // Check if this is an outlier in rawKRT space
    const camResults = results.filter(rr => rr.det.cameraId === r.det.cameraId)
    const xMean = camResults.reduce((s, rr) => s + rr.rawKRT.x, 0) / camResults.length
    const yMean = camResults.reduce((s, rr) => s + rr.rawKRT.y, 0) / camResults.length
    const xStd = Math.sqrt(camResults.reduce((s, rr) => s + Math.pow(rr.rawKRT.x - xMean, 2), 0) / camResults.length)
    const yStd = Math.sqrt(camResults.reduce((s, rr) => s + Math.pow(rr.rawKRT.y - yMean, 2), 0) / camResults.length)

    const xZ = Math.abs(r.rawKRT.x - xMean) / xStd
    const yZ = Math.abs(r.rawKRT.y - yMean) / yStd

    if (xZ > 2 || yZ > 2) {
      console.log(`${r.id} (${r.det.cameraId}): rawKRT=(${r.rawKRT.x.toFixed(2)}, ${r.rawKRT.y.toFixed(2)}), z-scores=(${xZ.toFixed(2)}, ${yZ.toFixed(2)}), error=${r.error.toFixed(3)}m`)
    }
  }
}

main().catch(console.error)
