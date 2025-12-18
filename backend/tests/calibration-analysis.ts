/**
 * Calibration Analysis Script
 *
 * Analyzes ground truth data to find optimal world transform parameters
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
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

// Current world transform (from camera-registry.ts)
const CURRENT_WORLD_TRANSFORM = {
  rotation: [
    [0.656713, 0.991407],
    [0.485295, -0.497672],
  ],
  translation: [-2.313309, 9.903918],
  scale: 1.0,
}

// K/R/T Calibration matrices (from camera-registry.ts)
const CAMERA_CALIBRATIONS: Record<string, any> = {
  camera1: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [0.26415998, 0.96365108, -0.0399512],
      [0.01284627, -0.04493433, -0.99890734],
      [-0.96439332, 0.26335812, -0.02424917],
    ],
    T: [8.31972445, 13.44595571, 1.59303293],
    center: [960, 540],
    scale: 1,
    worldTransform: CURRENT_WORLD_TRANSFORM,
  },
  camera2: {
    K: [
      [2350, 0, 0],
      [0, 2350, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, -0.08715574, -0.9961947],
      [0, 0.9961947, -0.08715574],
    ],
    T: [0, 0, 1.5],
    center: [960, 540],
    scale: 1,
    worldTransform: CURRENT_WORLD_TRANSFORM,
  },
}

// Load ground truth
const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Calibration Analysis ===\n')
console.log('Total annotations: ' + groundTruth.annotations.length)

// Convert bbox to feet position (bottom center in pixels)
function getBboxFeetPosition(bbox: LinkedDetection['bbox'], imageWidth = 1920, imageHeight = 1080) {
  const x = (bbox.left + (bbox.right - bbox.left) / 2) * imageWidth
  const y = bbox.bottom * imageHeight
  return { x, y }
}

// Collect projection data
interface ProjectionSample {
  cameraId: string
  annotationId: string
  groundTruth: { x: number; y: number }
  projected: { x: number; y: number }
  raw: { x: number; y: number }  // Before world transform
  imagePoint: { x: number; y: number }
}

const samples: ProjectionSample[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calibration = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calibration) continue

    const feetPos = getBboxFeetPosition(det.bbox)

    // Get raw projection (without world transform)
    const rawCalib = { ...calibration, worldTransform: undefined }
    const rawResult = projectWithKRT(feetPos.x, feetPos.y, rawCalib)

    // Get full projection
    const fullResult = projectWithKRT(feetPos.x, feetPos.y, calibration)

    if (rawResult.isValid && fullResult.isValid) {
      samples.push({
        cameraId: det.cameraId,
        annotationId: annotation.id,
        groundTruth: annotation.groundPosition,
        projected: fullResult.worldPoint,
        raw: rawResult.worldPoint,
        imagePoint: feetPos,
      })
    }
  }
}

console.log('\nCollected ' + samples.length + ' projection samples')

// Analyze errors by camera
const byCamera = new Map<string, ProjectionSample[]>()
for (const sample of samples) {
  const list = byCamera.get(sample.cameraId) || []
  list.push(sample)
  byCamera.set(sample.cameraId, list)
}

for (const [cameraId, cameraSamples] of byCamera) {
  console.log('\n=== ' + cameraId + ' (' + cameraSamples.length + ' samples) ===')

  // Calculate errors
  const errors = cameraSamples.map(s => ({
    dx: s.projected.x - s.groundTruth.x,
    dy: s.projected.y - s.groundTruth.y,
    dist: Math.sqrt(
      Math.pow(s.projected.x - s.groundTruth.x, 2) +
      Math.pow(s.projected.y - s.groundTruth.y, 2)
    )
  }))

  const avgDx = errors.reduce((s, e) => s + e.dx, 0) / errors.length
  const avgDy = errors.reduce((s, e) => s + e.dy, 0) / errors.length
  const avgDist = errors.reduce((s, e) => s + e.dist, 0) / errors.length

  console.log('Current average error: X=' + avgDx.toFixed(3) + 'm, Y=' + avgDy.toFixed(3) + 'm, Total=' + avgDist.toFixed(3) + 'm')

  // Analyze raw projections
  console.log('\nRaw projection samples (before world transform):')
  for (const sample of cameraSamples.slice(0, 5)) {
    console.log('  GT=(' + sample.groundTruth.x.toFixed(2) + ', ' + sample.groundTruth.y.toFixed(2) + ') Raw=(' + sample.raw.x.toFixed(2) + ', ' + sample.raw.y.toFixed(2) + ') Proj=(' + sample.projected.x.toFixed(2) + ', ' + sample.projected.y.toFixed(2) + ')')
  }
}

// Solve linear system using Gaussian elimination
function solveLinear(M: number[][], v: number[]): number[] {
  const n = v.length
  const augmented = M.map((row, i) => [...row, v[i]])

  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

    for (let k = i + 1; k < n; k++) {
      const c = augmented[k][i] / augmented[i][i]
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= c * augmented[i][j]
      }
    }
  }

  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j]
    }
    x[i] /= augmented[i][i]
  }

  return x
}

// Compute optimal transform using least squares
console.log('\n=== Least Squares Optimization ===')

// We want to find R, t such that: sitemap = R * raw + t
// For each sample: [GT_x, GT_y] = [[r00, r01], [r10, r11]] * [raw_x, raw_y] + [tx, ty]
// This is a linear regression problem

// Separate by camera and solve for each
for (const [cameraId, cameraSamples] of byCamera) {
  console.log('\nOptimizing ' + cameraId + '...')

  // Build matrices for: b = A * x where x = [r00, r01, tx, r10, r11, ty]
  const n = cameraSamples.length
  const A: number[][] = []
  const b: number[] = []

  for (const sample of cameraSamples) {
    // Row for X equation
    A.push([sample.raw.x, sample.raw.y, 1, 0, 0, 0])
    b.push(sample.groundTruth.x)

    // Row for Y equation
    A.push([0, 0, 0, sample.raw.x, sample.raw.y, 1])
    b.push(sample.groundTruth.y)
  }

  // Solve using normal equations: (A^T * A) * x = A^T * b
  const ATA: number[][] = Array(6).fill(0).map(() => Array(6).fill(0))
  const ATb: number[] = Array(6).fill(0)

  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < 6; j++) {
      ATb[j] += A[i][j] * b[i]
      for (let k = 0; k < 6; k++) {
        ATA[j][k] += A[i][j] * A[i][k]
      }
    }
  }

  const solution = solveLinear(ATA, ATb)
  const optimalTransform = {
    rotation: [
      [solution[0], solution[1]],
      [solution[3], solution[4]],
    ],
    translation: [solution[2], solution[5]],
  }

  console.log('Optimal transform for ' + cameraId + ':')
  console.log('  rotation: [[' + solution[0].toFixed(6) + ', ' + solution[1].toFixed(6) + '], [' + solution[3].toFixed(6) + ', ' + solution[4].toFixed(6) + ']]')
  console.log('  translation: [' + solution[2].toFixed(6) + ', ' + solution[5].toFixed(6) + ']')

  // Compute new errors
  const newErrors = cameraSamples.map(sample => {
    const newX = optimalTransform.rotation[0][0] * sample.raw.x + optimalTransform.rotation[0][1] * sample.raw.y + optimalTransform.translation[0]
    const newY = optimalTransform.rotation[1][0] * sample.raw.x + optimalTransform.rotation[1][1] * sample.raw.y + optimalTransform.translation[1]
    return Math.sqrt(
      Math.pow(newX - sample.groundTruth.x, 2) +
      Math.pow(newY - sample.groundTruth.y, 2)
    )
  })

  const newAvgError = newErrors.reduce((s, e) => s + e, 0) / newErrors.length
  const within05m = newErrors.filter(e => e < 0.5).length

  console.log('  Optimized avg error: ' + newAvgError.toFixed(3) + 'm')
  console.log('  Within 0.5m: ' + within05m + '/' + n + ' (' + (within05m/n*100).toFixed(1) + '%)')
}

// Now compute a shared transform for ALL cameras
console.log('\n=== Shared Transform Optimization (All Cameras) ===')

const allA: number[][] = []
const allB: number[] = []

for (const sample of samples) {
  allA.push([sample.raw.x, sample.raw.y, 1, 0, 0, 0])
  allB.push(sample.groundTruth.x)
  allA.push([0, 0, 0, sample.raw.x, sample.raw.y, 1])
  allB.push(sample.groundTruth.y)
}

const sharedATA: number[][] = Array(6).fill(0).map(() => Array(6).fill(0))
const sharedATb: number[] = Array(6).fill(0)

for (let i = 0; i < allA.length; i++) {
  for (let j = 0; j < 6; j++) {
    sharedATb[j] += allA[i][j] * allB[i]
    for (let k = 0; k < 6; k++) {
      sharedATA[j][k] += allA[i][j] * allA[i][k]
    }
  }
}

const sharedSolution = solveLinear(sharedATA, sharedATb)
const sharedTransform = {
  rotation: [
    [sharedSolution[0], sharedSolution[1]],
    [sharedSolution[3], sharedSolution[4]],
  ],
  translation: [sharedSolution[2], sharedSolution[5]],
}

console.log('\nOptimal SHARED transform:')
console.log('const WORLD_TRANSFORM = {')
console.log('  rotation: [')
console.log('    [' + sharedSolution[0].toFixed(6) + ', ' + sharedSolution[1].toFixed(6) + '],')
console.log('    [' + sharedSolution[3].toFixed(6) + ', ' + sharedSolution[4].toFixed(6) + '],')
console.log('  ],')
console.log('  translation: [' + sharedSolution[2].toFixed(6) + ', ' + sharedSolution[5].toFixed(6) + '],')
console.log('  scale: 1.0,')
console.log('}')

// Compute new errors with shared transform
const sharedErrors = samples.map(sample => {
  const newX = sharedTransform.rotation[0][0] * sample.raw.x + sharedTransform.rotation[0][1] * sample.raw.y + sharedTransform.translation[0]
  const newY = sharedTransform.rotation[1][0] * sample.raw.x + sharedTransform.rotation[1][1] * sample.raw.y + sharedTransform.translation[1]
  return {
    dist: Math.sqrt(
      Math.pow(newX - sample.groundTruth.x, 2) +
      Math.pow(newY - sample.groundTruth.y, 2)
    ),
    cameraId: sample.cameraId,
  }
})

const sharedAvgError = sharedErrors.reduce((s, e) => s + e.dist, 0) / sharedErrors.length
const sharedWithin05m = sharedErrors.filter(e => e.dist < 0.5).length

console.log('\nShared transform results:')
console.log('  Average error: ' + sharedAvgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + sharedWithin05m + '/' + samples.length + ' (' + (sharedWithin05m/samples.length*100).toFixed(1) + '%)')

// Per-camera breakdown
for (const [cameraId, ] of byCamera) {
  const cameraErrors = sharedErrors.filter(e => e.cameraId === cameraId)
  const cameraAvg = cameraErrors.reduce((s, e) => s + e.dist, 0) / cameraErrors.length
  const cameraWithin = cameraErrors.filter(e => e.dist < 0.5).length
  console.log('  ' + cameraId + ': avg=' + cameraAvg.toFixed(3) + 'm, within 0.5m: ' + cameraWithin + '/' + cameraErrors.length)
}
