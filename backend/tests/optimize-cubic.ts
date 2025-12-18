/**
 * Optimize World Transforms using Cubic Polynomial Regression
 *
 * Uses a cubic model with 10 terms:
 * GT = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y + c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2
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

// Solve least squares using Cholesky decomposition (more stable than QR for larger systems)
function solveLinearLeastSquares(A: number[][], b: number[]): number[] {
  const m = A.length
  const n = A[0].length

  // Form A^T A (n x n) and A^T b (n x 1)
  const ATA: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))
  const ATb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        ATA[i][j] += A[k][i] * A[k][j]
      }
    }
    for (let k = 0; k < m; k++) {
      ATb[i] += A[k][i] * b[k]
    }
  }

  // Add small regularization for numerical stability
  for (let i = 0; i < n; i++) {
    ATA[i][i] += 1e-8
  }

  // Solve using Gaussian elimination with partial pivoting
  const aug = ATA.map((row, i) => [...row, ATb[i]])
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]]

    if (Math.abs(aug[i][i]) < 1e-12) continue

    for (let k = i + 1; k < n; k++) {
      const c = aug[k][i] / aug[i][i]
      for (let j = i; j <= n; j++) aug[k][j] -= c * aug[i][j]
    }
  }

  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j]
    if (Math.abs(aug[i][i]) > 1e-12) x[i] /= aug[i][i]
  }

  return x
}

const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Cubic Polynomial Transform Optimization ===\n')

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

// Create feature vector for cubic polynomial
// Terms: 1, x, y, x^2, y^2, xy, x^3, y^3, x^2*y, x*y^2
function createCubicFeatures(x: number, y: number): number[] {
  return [
    1, x, y,            // degree 0, 1
    x*x, y*y, x*y,      // degree 2
    x*x*x, y*y*y, x*x*y, x*y*y  // degree 3
  ]
}

// Fit cubic transform
function fitCubicTransform(samples: Sample[]): { coeffsX: number[], coeffsY: number[], avgError: number, errors: number[] } {
  const n = samples.length
  const numFeatures = 10

  // Build design matrix
  const A: number[][] = []
  const bx: number[] = []
  const by: number[] = []

  for (const s of samples) {
    A.push(createCubicFeatures(s.raw.x, s.raw.y))
    bx.push(s.gt.x)
    by.push(s.gt.y)
  }

  const coeffsX = solveLinearLeastSquares(A, bx)
  const coeffsY = solveLinearLeastSquares(A, by)

  // Calculate errors
  const errors: number[] = []
  for (const s of samples) {
    const features = createCubicFeatures(s.raw.x, s.raw.y)
    let px = 0, py = 0
    for (let i = 0; i < numFeatures; i++) {
      px += coeffsX[i] * features[i]
      py += coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return {
    coeffsX,
    coeffsY,
    avgError: errors.reduce((a, b) => a + b, 0) / n,
    errors
  }
}

const cam1Cubic = fitCubicTransform(cam1Samples)
const cam2Cubic = fitCubicTransform(cam2Samples)

console.log('\n=== Cubic Transform Results ===')

console.log('\nCamera1 (HC3):')
console.log('  CoeffsX (10 terms): [' + cam1Cubic.coeffsX.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  CoeffsY (10 terms): [' + cam1Cubic.coeffsY.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  Avg error: ' + cam1Cubic.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Cubic.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length + ' (' + (cam1Cubic.errors.filter(e => e < 0.5).length / cam1Samples.length * 100).toFixed(1) + '%)')

console.log('\nCamera2 (HC4):')
console.log('  CoeffsX (10 terms): [' + cam2Cubic.coeffsX.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  CoeffsY (10 terms): [' + cam2Cubic.coeffsY.map(c => c.toFixed(6)).join(', ') + ']')
console.log('  Avg error: ' + cam2Cubic.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Cubic.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length + ' (' + (cam2Cubic.errors.filter(e => e < 0.5).length / cam2Samples.length * 100).toFixed(1) + '%)')

// Combined statistics
const allErrors = [...cam1Cubic.errors, ...cam2Cubic.errors]
console.log('\n=== Combined Statistics (Cubic) ===')
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

// Output code
console.log('\n=== Code for Implementation (Cubic) ===')
console.log(`
// Cubic transform: 1, x, y, x^2, y^2, xy, x^3, y^3, x^2*y, x*y^2
interface CubicTransform {
  coeffsX: number[]  // 10 coefficients
  coeffsY: number[]  // 10 coefficients
}

const CAMERA1_CUBIC_TRANSFORM: CubicTransform = {
  coeffsX: [${cam1Cubic.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${cam1Cubic.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}

const CAMERA2_CUBIC_TRANSFORM: CubicTransform = {
  coeffsX: [${cam2Cubic.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${cam2Cubic.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}

function applyCubicTransform(raw: { x: number, y: number }, transform: CubicTransform): { x: number, y: number } {
  const { x, y } = raw
  const { coeffsX: cx, coeffsY: cy } = transform
  // Terms: 1, x, y, x^2, y^2, xy, x^3, y^3, x^2*y, x*y^2
  return {
    x: cx[0] + cx[1]*x + cx[2]*y + cx[3]*x*x + cx[4]*y*y + cx[5]*x*y + cx[6]*x*x*x + cx[7]*y*y*y + cx[8]*x*x*y + cx[9]*x*y*y,
    y: cy[0] + cy[1]*x + cy[2]*y + cy[3]*x*x + cy[4]*y*y + cy[5]*x*y + cy[6]*x*x*x + cy[7]*y*y*y + cy[8]*x*x*y + cy[9]*x*y*y,
  }
}
`)
