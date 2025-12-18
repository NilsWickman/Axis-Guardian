/**
 * K/R/T Debug Script v2
 *
 * Understanding the coordinate system mismatch
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface LinkedDetection {
  cameraId: string
  bbox: { left: number; top: number; right: number; bottom: number }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: string
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  annotations: Annotation[]
}

// K/R/T matrices
const CAMERA_CALIBRATIONS: Record<string, {
  K: number[][]
  R: number[][]
  T: number[]
  center: number[]
}> = {
  camera1: {
    K: [[1480, 0, 0], [0, 1480, 0], [0, 0, 1]],
    R: [
      [0.26415998, 0.96365108, -0.0399512],
      [0.01284627, -0.04493433, -0.99890734],
      [-0.96439332, 0.26335812, -0.02424917],
    ],
    T: [8.31972445, 13.44595571, 1.59303293],
    center: [960, 540],
  },
  camera2: {
    K: [[2350, 0, 0], [0, 2350, 0], [0, 0, 1]],
    R: [[1, 0, 0], [0, -0.08715574, -0.9961947], [0, 0.9961947, -0.08715574]],
    T: [0, 0, 1.5],
    center: [960, 540],
  },
}

function matMul3x3(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

function matMulVec(A: number[][], v: number[]): number[] {
  return [
    A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
    A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
    A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2],
  ]
}

function solve3x3(A: number[][], b: number[]): number[] | null {
  const det =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
  if (Math.abs(det) < 1e-10) return null

  const x: number[] = []
  for (let i = 0; i < 3; i++) {
    const Ai: number[][] = A.map((row, ri) => row.map((val, ci) => ci === i ? b[ri] : val))
    const detAi =
      Ai[0][0] * (Ai[1][1] * Ai[2][2] - Ai[1][2] * Ai[2][1]) -
      Ai[0][1] * (Ai[1][0] * Ai[2][2] - Ai[1][2] * Ai[2][0]) +
      Ai[0][2] * (Ai[1][0] * Ai[2][1] - Ai[1][1] * Ai[2][0])
    x.push(detAi / det)
  }
  return x
}

function projectWithKRT(imageX: number, imageY: number, calib: typeof CAMERA_CALIBRATIONS['camera1']) {
  const { K, R, T, center } = calib
  const KR = matMul3x3(K, R)
  const A: number[][] = [
    [KR[0][0], KR[0][1], center[0] - imageX],
    [KR[1][0], KR[1][1], center[1] - imageY],
    [KR[2][0], KR[2][1], -1],
  ]
  const KRT = matMulVec(KR, T)
  return solve3x3(A, KRT)
}

const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Investigating the coordinate system ===\n')

// The key observation is:
// - Ground truth Y ranges from ~0.6m to ~9m (room is 18m x 12m, but people are in certain areas)
// - Raw projection Y is consistently ~12-18m
// - The offset is roughly 10-12m in Y

// Let's understand the dataset coordinate system by looking at the sitemap:
// Sitemap: 18m wide (X) x 12m tall (Y)
// Camera2 (HC4) is at sitemap position (0.9, 10.8) - near bottom-left of room
// Camera1 (HC3) is at sitemap position (16.22, 11.7) - near top-right corner

// In the sitemap, Y=0 is likely the BOTTOM of the room
// People standing in front of camera2 would have Y values around 1-4m (near the stage/bottom)

// In the dataset coordinates:
// Camera2 is at T = (0, 0, 1.5) - origin
// Camera1 is at T = (8.32, 13.45, 1.59)

// The raw projection gives Y values around 12-18, which is close to camera1's Y=13.45
// This suggests the raw projection Y might be in "distance along camera2's view direction"
// rather than a standard Cartesian Y

// Let's analyze the raw projections more carefully
console.log('Sitemap layout (Y=0 at bottom, Y=12 at top):')
console.log('  Camera2 (HC4): (0.9, 10.8) - near top-left, pointing toward stage')
console.log('  Camera1 (HC3): (16.22, 11.7) - near top-right, pointing toward stage')
console.log('  Stage/action area: Y ≈ 0-4m (bottom of room)')
console.log('')

// Gather raw projections to understand the coordinate system
console.log('=== Raw Projection Analysis ===')

const sampleData: Array<{
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number; z: number }
}> = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue
  if (sampleData.length >= 50) break

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    sampleData.push({
      cameraId: det.cameraId,
      gt: annotation.groundPosition,
      raw: { x: rawProj[0], y: rawProj[1], z: rawProj[2] }
    })
  }
}

// Analyze the relationship between ground truth and raw projections
console.log('Sample data analysis:')

const cam1Samples = sampleData.filter(s => s.cameraId === 'camera1')
const cam2Samples = sampleData.filter(s => s.cameraId === 'camera2')

console.log('\nCamera1 (HC3) at sitemap (16.22, 11.7):')
console.log('  GT_X range: ' + Math.min(...cam1Samples.map(s => s.gt.x)).toFixed(2) + ' to ' + Math.max(...cam1Samples.map(s => s.gt.x)).toFixed(2))
console.log('  GT_Y range: ' + Math.min(...cam1Samples.map(s => s.gt.y)).toFixed(2) + ' to ' + Math.max(...cam1Samples.map(s => s.gt.y)).toFixed(2))
console.log('  Raw_X range: ' + Math.min(...cam1Samples.map(s => s.raw.x)).toFixed(2) + ' to ' + Math.max(...cam1Samples.map(s => s.raw.x)).toFixed(2))
console.log('  Raw_Y range: ' + Math.min(...cam1Samples.map(s => s.raw.y)).toFixed(2) + ' to ' + Math.max(...cam1Samples.map(s => s.raw.y)).toFixed(2))

console.log('\nCamera2 (HC4) at sitemap (0.9, 10.8):')
console.log('  GT_X range: ' + Math.min(...cam2Samples.map(s => s.gt.x)).toFixed(2) + ' to ' + Math.max(...cam2Samples.map(s => s.gt.x)).toFixed(2))
console.log('  GT_Y range: ' + Math.min(...cam2Samples.map(s => s.gt.y)).toFixed(2) + ' to ' + Math.max(...cam2Samples.map(s => s.gt.y)).toFixed(2))
console.log('  Raw_X range: ' + Math.min(...cam2Samples.map(s => s.raw.x)).toFixed(2) + ' to ' + Math.max(...cam2Samples.map(s => s.raw.x)).toFixed(2))
console.log('  Raw_Y range: ' + Math.min(...cam2Samples.map(s => s.raw.y)).toFixed(2) + ' to ' + Math.max(...cam2Samples.map(s => s.raw.y)).toFixed(2))

// Key insight: Raw_Y is close to distance from camera in XY plane
// Let's compute correlations

console.log('\n=== Computing correlations ===')

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0, denX = 0, denY = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY)
    denX += (x[i] - meanX) ** 2
    denY += (y[i] - meanY) ** 2
  }

  return num / Math.sqrt(denX * denY)
}

// Check what GT variables correlate with Raw variables
console.log('\nCorrelation analysis (Camera1):')
console.log('  corr(GT_X, Raw_X): ' + pearsonCorrelation(cam1Samples.map(s => s.gt.x), cam1Samples.map(s => s.raw.x)).toFixed(3))
console.log('  corr(GT_X, Raw_Y): ' + pearsonCorrelation(cam1Samples.map(s => s.gt.x), cam1Samples.map(s => s.raw.y)).toFixed(3))
console.log('  corr(GT_Y, Raw_X): ' + pearsonCorrelation(cam1Samples.map(s => s.gt.y), cam1Samples.map(s => s.raw.x)).toFixed(3))
console.log('  corr(GT_Y, Raw_Y): ' + pearsonCorrelation(cam1Samples.map(s => s.gt.y), cam1Samples.map(s => s.raw.y)).toFixed(3))

console.log('\nCorrelation analysis (Camera2):')
console.log('  corr(GT_X, Raw_X): ' + pearsonCorrelation(cam2Samples.map(s => s.gt.x), cam2Samples.map(s => s.raw.x)).toFixed(3))
console.log('  corr(GT_X, Raw_Y): ' + pearsonCorrelation(cam2Samples.map(s => s.gt.x), cam2Samples.map(s => s.raw.y)).toFixed(3))
console.log('  corr(GT_Y, Raw_X): ' + pearsonCorrelation(cam2Samples.map(s => s.gt.y), cam2Samples.map(s => s.raw.x)).toFixed(3))
console.log('  corr(GT_Y, Raw_Y): ' + pearsonCorrelation(cam2Samples.map(s => s.gt.y), cam2Samples.map(s => s.raw.y)).toFixed(3))

// Try fitting a general affine transform per camera using SVD-like least squares
console.log('\n=== Per-Camera Affine Transform Fitting ===')

function fitAffineTransform(samples: typeof sampleData): { R: number[][], t: number[], scale: number, avgError: number } {
  // Fit: GT = R * Raw + t (6 parameters: 4 for R, 2 for t)
  // Using least squares: minimize sum((GT_x - (r00*Raw_x + r01*Raw_y + tx))^2 + (GT_y - (r10*Raw_x + r11*Raw_y + ty))^2)

  const n = samples.length
  const A: number[][] = []
  const b: number[] = []

  for (const s of samples) {
    A.push([s.raw.x, s.raw.y, 1, 0, 0, 0])
    b.push(s.gt.x)
    A.push([0, 0, 0, s.raw.x, s.raw.y, 1])
    b.push(s.gt.y)
  }

  // Normal equations: (A^T A) x = A^T b
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

  // Solve using Gaussian elimination
  const aug = ATA.map((row, i) => [...row, ATb[i]])

  for (let i = 0; i < 6; i++) {
    let maxRow = i
    for (let k = i + 1; k < 6; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]]

    for (let k = i + 1; k < 6; k++) {
      const c = aug[k][i] / aug[i][i]
      for (let j = i; j <= 6; j++) aug[k][j] -= c * aug[i][j]
    }
  }

  const x = Array(6).fill(0)
  for (let i = 5; i >= 0; i--) {
    x[i] = aug[i][6]
    for (let j = i + 1; j < 6; j++) x[i] -= aug[i][j] * x[j]
    x[i] /= aug[i][i]
  }

  const R = [[x[0], x[1]], [x[3], x[4]]]
  const t = [x[2], x[5]]

  // Calculate average error
  let totalError = 0
  for (const s of samples) {
    const px = R[0][0] * s.raw.x + R[0][1] * s.raw.y + t[0]
    const py = R[1][0] * s.raw.x + R[1][1] * s.raw.y + t[1]
    totalError += Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2)
  }

  const scale = Math.sqrt((R[0][0]**2 + R[0][1]**2 + R[1][0]**2 + R[1][1]**2) / 2)

  return { R, t, scale, avgError: totalError / n }
}

const cam1Transform = fitAffineTransform(cam1Samples)
const cam2Transform = fitAffineTransform(cam2Samples)

console.log('\nCamera1 optimal transform:')
console.log('  R = [[' + cam1Transform.R[0][0].toFixed(6) + ', ' + cam1Transform.R[0][1].toFixed(6) + '],')
console.log('       [' + cam1Transform.R[1][0].toFixed(6) + ', ' + cam1Transform.R[1][1].toFixed(6) + ']]')
console.log('  t = [' + cam1Transform.t[0].toFixed(6) + ', ' + cam1Transform.t[1].toFixed(6) + ']')
console.log('  Avg error: ' + cam1Transform.avgError.toFixed(3) + 'm')

console.log('\nCamera2 optimal transform:')
console.log('  R = [[' + cam2Transform.R[0][0].toFixed(6) + ', ' + cam2Transform.R[0][1].toFixed(6) + '],')
console.log('       [' + cam2Transform.R[1][0].toFixed(6) + ', ' + cam2Transform.R[1][1].toFixed(6) + ']]')
console.log('  t = [' + cam2Transform.t[0].toFixed(6) + ', ' + cam2Transform.t[1].toFixed(6) + ']')
console.log('  Avg error: ' + cam2Transform.avgError.toFixed(3) + 'm')

// Now let's see if the cameras have DIFFERENT transforms or if they can share
// This will tell us if the raw projection is consistent between cameras

console.log('\n=== Cross-camera consistency check ===')

// Apply camera1's transform to camera2's data
let cam1ToCam2Error = 0
for (const s of cam2Samples) {
  const px = cam1Transform.R[0][0] * s.raw.x + cam1Transform.R[0][1] * s.raw.y + cam1Transform.t[0]
  const py = cam1Transform.R[1][0] * s.raw.x + cam1Transform.R[1][1] * s.raw.y + cam1Transform.t[1]
  cam1ToCam2Error += Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2)
}
cam1ToCam2Error /= cam2Samples.length

let cam2ToCam1Error = 0
for (const s of cam1Samples) {
  const px = cam2Transform.R[0][0] * s.raw.x + cam2Transform.R[0][1] * s.raw.y + cam2Transform.t[0]
  const py = cam2Transform.R[1][0] * s.raw.x + cam2Transform.R[1][1] * s.raw.y + cam2Transform.t[1]
  cam2ToCam1Error += Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2)
}
cam2ToCam1Error /= cam1Samples.length

console.log('Camera1 transform applied to camera2 data: ' + cam1ToCam2Error.toFixed(3) + 'm avg error')
console.log('Camera2 transform applied to camera1 data: ' + cam2ToCam1Error.toFixed(3) + 'm avg error')

// The transforms are different! This means each camera needs its own transform
// Let's output the optimal per-camera transforms in the format needed by camera-registry.ts

console.log('\n=== Per-Camera World Transforms for camera-registry.ts ===')

console.log('\nCamera1 (HC3):')
console.log('camera1: {')
console.log('  worldTransform: {')
console.log('    rotation: [')
console.log('      [' + cam1Transform.R[0][0].toFixed(6) + ', ' + cam1Transform.R[0][1].toFixed(6) + '],')
console.log('      [' + cam1Transform.R[1][0].toFixed(6) + ', ' + cam1Transform.R[1][1].toFixed(6) + '],')
console.log('    ],')
console.log('    translation: [' + cam1Transform.t[0].toFixed(6) + ', ' + cam1Transform.t[1].toFixed(6) + '],')
console.log('    scale: 1.0,')
console.log('  }')
console.log('}')

console.log('\nCamera2 (HC4):')
console.log('camera2: {')
console.log('  worldTransform: {')
console.log('    rotation: [')
console.log('      [' + cam2Transform.R[0][0].toFixed(6) + ', ' + cam2Transform.R[0][1].toFixed(6) + '],')
console.log('      [' + cam2Transform.R[1][0].toFixed(6) + ', ' + cam2Transform.R[1][1].toFixed(6) + '],')
console.log('    ],')
console.log('    translation: [' + cam2Transform.t[0].toFixed(6) + ', ' + cam2Transform.t[1].toFixed(6) + '],')
console.log('    scale: 1.0,')
console.log('  }')
console.log('}')

// Calculate final accuracy with per-camera transforms
console.log('\n=== Final Accuracy with Per-Camera Transforms ===')

let totalWithin05 = 0
let totalSamples = 0
const allErrors: number[] = []

for (const s of cam1Samples) {
  const px = cam1Transform.R[0][0] * s.raw.x + cam1Transform.R[0][1] * s.raw.y + cam1Transform.t[0]
  const py = cam1Transform.R[1][0] * s.raw.x + cam1Transform.R[1][1] * s.raw.y + cam1Transform.t[1]
  const err = Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2)
  allErrors.push(err)
  if (err < 0.5) totalWithin05++
  totalSamples++
}

for (const s of cam2Samples) {
  const px = cam2Transform.R[0][0] * s.raw.x + cam2Transform.R[0][1] * s.raw.y + cam2Transform.t[0]
  const py = cam2Transform.R[1][0] * s.raw.x + cam2Transform.R[1][1] * s.raw.y + cam2Transform.t[1]
  const err = Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2)
  allErrors.push(err)
  if (err < 0.5) totalWithin05++
  totalSamples++
}

const avgError = allErrors.reduce((a, b) => a + b, 0) / allErrors.length

console.log('Average error: ' + avgError.toFixed(3) + 'm')
console.log('Within 0.5m: ' + totalWithin05 + '/' + totalSamples + ' (' + (totalWithin05/totalSamples*100).toFixed(1) + '%)')
console.log('Max error: ' + Math.max(...allErrors).toFixed(3) + 'm')
console.log('Min error: ' + Math.min(...allErrors).toFixed(3) + 'm')
