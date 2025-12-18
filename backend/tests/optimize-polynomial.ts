/**
 * Optimize World Transforms using Polynomial Regression
 *
 * Uses a quadratic model: GT = f(raw_x, raw_y, raw_x^2, raw_y^2, raw_x*raw_y)
 * This captures non-linear distortions in the projection.
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

// Solve least squares Ax = b using QR decomposition (Gram-Schmidt)
function solveLinearLeastSquares(A: number[][], b: number[]): number[] {
  const m = A.length
  const n = A[0].length

  // QR decomposition using Gram-Schmidt
  const Q: number[][] = Array(m).fill(0).map(() => Array(n).fill(0))
  const R: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

  for (let j = 0; j < n; j++) {
    // Copy column j of A into v
    const v: number[] = A.map(row => row[j])

    // Subtract projections onto previous Q columns
    for (let i = 0; i < j; i++) {
      let dot = 0
      for (let k = 0; k < m; k++) dot += Q[k][i] * A[k][j]
      R[i][j] = dot
      for (let k = 0; k < m; k++) v[k] -= dot * Q[k][i]
    }

    // Compute norm and normalize
    let norm = 0
    for (let k = 0; k < m; k++) norm += v[k] * v[k]
    norm = Math.sqrt(norm)

    R[j][j] = norm
    if (norm > 1e-10) {
      for (let k = 0; k < m; k++) Q[k][j] = v[k] / norm
    }
  }

  // Solve Q^T b
  const y: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) y[i] += Q[k][i] * b[k]
  }

  // Back-substitute to solve Rx = y
  const x: number[] = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = y[i]
    for (let j = i + 1; j < n; j++) x[i] -= R[i][j] * x[j]
    if (Math.abs(R[i][i]) > 1e-10) x[i] /= R[i][i]
  }

  return x
}

const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Polynomial Transform Optimization ===\n')

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

// Fit polynomial transform (quadratic)
// Model: GT_x = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y
//        GT_y = d0 + d1*x + d2*y + d3*x^2 + d4*y^2 + d5*x*y
function fitQuadraticTransform(samples: Sample[]): { coeffsX: number[], coeffsY: number[], avgError: number, errors: number[] } {
  const n = samples.length

  // Build design matrix for X
  const Ax: number[][] = []
  const bx: number[] = []
  const by: number[] = []

  for (const s of samples) {
    const x = s.raw.x
    const y = s.raw.y
    Ax.push([1, x, y, x*x, y*y, x*y])
    bx.push(s.gt.x)
    by.push(s.gt.y)
  }

  const coeffsX = solveLinearLeastSquares(Ax, bx)
  const coeffsY = solveLinearLeastSquares(Ax, by)

  // Calculate errors
  const errors: number[] = []
  for (const s of samples) {
    const x = s.raw.x
    const y = s.raw.y
    const px = coeffsX[0] + coeffsX[1]*x + coeffsX[2]*y + coeffsX[3]*x*x + coeffsX[4]*y*y + coeffsX[5]*x*y
    const py = coeffsY[0] + coeffsY[1]*x + coeffsY[2]*y + coeffsY[3]*x*x + coeffsY[4]*y*y + coeffsY[5]*x*y
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return {
    coeffsX,
    coeffsY,
    avgError: errors.reduce((a, b) => a + b, 0) / n,
    errors
  }
}

const cam1Quadratic = fitQuadraticTransform(cam1Samples)
const cam2Quadratic = fitQuadraticTransform(cam2Samples)

console.log('\n=== Quadratic Transform Results ===')

console.log('\nCamera1 (HC3):')
console.log('  CoeffsX: [' + cam1Quadratic.coeffsX.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  CoeffsY: [' + cam1Quadratic.coeffsY.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  Avg error: ' + cam1Quadratic.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Quadratic.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length)

console.log('\nCamera2 (HC4):')
console.log('  CoeffsX: [' + cam2Quadratic.coeffsX.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  CoeffsY: [' + cam2Quadratic.coeffsY.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  Avg error: ' + cam2Quadratic.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Quadratic.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length)

// Combined statistics
const allErrors = [...cam1Quadratic.errors, ...cam2Quadratic.errors]
console.log('\n=== Combined Statistics (Quadratic) ===')
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

// Generate code for ground-plane.ts
console.log('\n=== Code for Implementation ===')
console.log(`
// Quadratic transform coefficients
// Model: result = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y
interface QuadraticTransform {
  coeffsX: number[]  // [c0, c1, c2, c3, c4, c5]
  coeffsY: number[]  // [d0, d1, d2, d3, d4, d5]
}

const CAMERA1_QUADRATIC_TRANSFORM: QuadraticTransform = {
  coeffsX: [${cam1Quadratic.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${cam1Quadratic.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}

const CAMERA2_QUADRATIC_TRANSFORM: QuadraticTransform = {
  coeffsX: [${cam2Quadratic.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${cam2Quadratic.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}

function applyQuadraticTransform(raw: { x: number, y: number }, transform: QuadraticTransform): { x: number, y: number } {
  const { x, y } = raw
  const { coeffsX: cx, coeffsY: cy } = transform
  return {
    x: cx[0] + cx[1]*x + cx[2]*y + cx[3]*x*x + cx[4]*y*y + cx[5]*x*y,
    y: cy[0] + cy[1]*x + cy[2]*y + cy[3]*x*x + cy[4]*y*y + cy[5]*x*y,
  }
}
`)
