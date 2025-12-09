/**
 * Optimize World Transforms using ALL ground truth data
 *
 * Uses least squares to find optimal per-camera affine transforms
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

console.log('=== Full Ground Truth Transform Optimization ===\n')

// Collect ALL samples
interface Sample {
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number }
}

const cam1Samples: Sample[] = []
const cam2Samples: Sample[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const sample = {
      cameraId: det.cameraId,
      gt: annotation.groundPosition,
      raw: { x: rawProj[0], y: rawProj[1] }
    }

    if (det.cameraId === 'camera1') {
      cam1Samples.push(sample)
    } else {
      cam2Samples.push(sample)
    }
  }
}

console.log('Total samples: ' + (cam1Samples.length + cam2Samples.length))
console.log('  Camera1: ' + cam1Samples.length)
console.log('  Camera2: ' + cam2Samples.length)

// Fit affine transform
function fitAffineTransform(samples: Sample[]): { R: number[][], t: number[], avgError: number, errors: number[] } {
  const n = samples.length
  const A: number[][] = []
  const b: number[] = []

  for (const s of samples) {
    A.push([s.raw.x, s.raw.y, 1, 0, 0, 0])
    b.push(s.gt.x)
    A.push([0, 0, 0, s.raw.x, s.raw.y, 1])
    b.push(s.gt.y)
  }

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

  // Gaussian elimination
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

  const errors: number[] = []
  for (const s of samples) {
    const px = R[0][0] * s.raw.x + R[0][1] * s.raw.y + t[0]
    const py = R[1][0] * s.raw.x + R[1][1] * s.raw.y + t[1]
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return { R, t, avgError: errors.reduce((a, b) => a + b, 0) / n, errors }
}

const cam1Transform = fitAffineTransform(cam1Samples)
const cam2Transform = fitAffineTransform(cam2Samples)

console.log('\n=== Optimal Per-Camera Transforms ===')

console.log('\nCamera1 (HC3):')
console.log('  R = [[' + cam1Transform.R[0][0].toFixed(6) + ', ' + cam1Transform.R[0][1].toFixed(6) + '],')
console.log('       [' + cam1Transform.R[1][0].toFixed(6) + ', ' + cam1Transform.R[1][1].toFixed(6) + ']]')
console.log('  t = [' + cam1Transform.t[0].toFixed(6) + ', ' + cam1Transform.t[1].toFixed(6) + ']')
console.log('  Avg error: ' + cam1Transform.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Transform.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length)

console.log('\nCamera2 (HC4):')
console.log('  R = [[' + cam2Transform.R[0][0].toFixed(6) + ', ' + cam2Transform.R[0][1].toFixed(6) + '],')
console.log('       [' + cam2Transform.R[1][0].toFixed(6) + ', ' + cam2Transform.R[1][1].toFixed(6) + ']]')
console.log('  t = [' + cam2Transform.t[0].toFixed(6) + ', ' + cam2Transform.t[1].toFixed(6) + ']')
console.log('  Avg error: ' + cam2Transform.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Transform.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length)

// Print in format for camera-registry.ts
console.log('\n=== Copy-paste for camera-registry.ts ===')
console.log('\nconst CAMERA1_WORLD_TRANSFORM = {')
console.log('  rotation: [')
console.log('    [' + cam1Transform.R[0][0].toFixed(6) + ', ' + cam1Transform.R[0][1].toFixed(6) + '],')
console.log('    [' + cam1Transform.R[1][0].toFixed(6) + ', ' + cam1Transform.R[1][1].toFixed(6) + '],')
console.log('  ],')
console.log('  translation: [' + cam1Transform.t[0].toFixed(6) + ', ' + cam1Transform.t[1].toFixed(6) + '],')
console.log('  scale: 1.0,')
console.log('}')

console.log('\nconst CAMERA2_WORLD_TRANSFORM = {')
console.log('  rotation: [')
console.log('    [' + cam2Transform.R[0][0].toFixed(6) + ', ' + cam2Transform.R[0][1].toFixed(6) + '],')
console.log('    [' + cam2Transform.R[1][0].toFixed(6) + ', ' + cam2Transform.R[1][1].toFixed(6) + '],')
console.log('  ],')
console.log('  translation: [' + cam2Transform.t[0].toFixed(6) + ', ' + cam2Transform.t[1].toFixed(6) + '],')
console.log('  scale: 1.0,')
console.log('}')

// Combined statistics
const allErrors = [...cam1Transform.errors, ...cam2Transform.errors]
console.log('\n=== Combined Statistics ===')
console.log('Total samples: ' + allErrors.length)
console.log('Average error: ' + (allErrors.reduce((a, b) => a + b, 0) / allErrors.length).toFixed(3) + 'm')
console.log('Within 0.5m: ' + allErrors.filter(e => e < 0.5).length + '/' + allErrors.length + ' (' + (allErrors.filter(e => e < 0.5).length / allErrors.length * 100).toFixed(1) + '%)')
console.log('Max error: ' + Math.max(...allErrors).toFixed(3) + 'm')
console.log('Min error: ' + Math.min(...allErrors).toFixed(3) + 'm')

// Error histogram
console.log('\nError distribution:')
const buckets = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0]
let prev = 0
for (const bucket of buckets) {
  const count = allErrors.filter(e => e >= prev && e < bucket).length
  console.log('  ' + prev.toFixed(2) + 'm - ' + bucket.toFixed(2) + 'm: ' + count + ' (' + (count / allErrors.length * 100).toFixed(1) + '%)')
  prev = bucket
}
const rest = allErrors.filter(e => e >= prev).length
console.log('  >= ' + prev.toFixed(2) + 'm: ' + rest + ' (' + (rest / allErrors.length * 100).toFixed(1) + '%)')

// Identify outliers
console.log('\n=== Outlier Analysis (errors > 2m) ===')
const outlierAnnotations = new Map<string, {cameraId: string, error: number, gt: {x: number, y: number}, proj: {x: number, y: number}}>()

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const transform = det.cameraId === 'camera1' ? cam1Transform : cam2Transform
    const px = transform.R[0][0] * rawProj[0] + transform.R[0][1] * rawProj[1] + transform.t[0]
    const py = transform.R[1][0] * rawProj[0] + transform.R[1][1] * rawProj[1] + transform.t[1]
    const error = Math.sqrt((px - annotation.groundPosition.x)**2 + (py - annotation.groundPosition.y)**2)

    if (error > 2.0) {
      outlierAnnotations.set(annotation.id, {
        cameraId: det.cameraId,
        error,
        gt: annotation.groundPosition,
        proj: {x: px, y: py}
      })
    }
  }
}

for (const [id, data] of outlierAnnotations) {
  console.log(id + ' (' + data.cameraId + '): error=' + data.error.toFixed(2) + 'm, GT=(' + data.gt.x.toFixed(2) + ',' + data.gt.y.toFixed(2) + ') -> Proj=(' + data.proj.x.toFixed(2) + ',' + data.proj.y.toFixed(2) + ')')
}
