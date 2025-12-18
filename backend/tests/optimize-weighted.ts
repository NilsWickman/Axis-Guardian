/**
 * Optimize World Transforms using Weighted Polynomial Regression
 *
 * Uses weighting to give more importance to distant samples (which have higher error)
 * and to reduce the influence of outliers
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

// Weighted least squares solver
function solveWeightedLeastSquares(A: number[][], b: number[], weights: number[]): number[] {
  const m = A.length
  const n = A[0].length

  // Form W * A^T * W * A and W * A^T * W * b where W is diagonal weight matrix
  const WTWA: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))
  const WTWb: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        WTWA[i][j] += weights[k] * weights[k] * A[k][i] * A[k][j]
      }
    }
    for (let k = 0; k < m; k++) {
      WTWb[i] += weights[k] * weights[k] * A[k][i] * b[k]
    }
  }

  // Add regularization
  for (let i = 0; i < n; i++) {
    WTWA[i][i] += 1e-8
  }

  // Solve using Gaussian elimination
  const aug = WTWA.map((row, i) => [...row, WTWb[i]])
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

console.log('=== Weighted Polynomial Transform Optimization ===\n')

interface Sample {
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number }
  bboxBottom: number  // For weighting
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
      raw: { x: rawProj[0], y: rawProj[1] },
      bboxBottom: det.bbox.bottom
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

// Create feature vector for quadratic polynomial
function createQuadraticFeatures(x: number, y: number): number[] {
  return [1, x, y, x*x, y*y, x*y]
}

// Fit weighted quadratic transform
// Weight = 1 / bboxBottom to give more weight to distant samples
function fitWeightedQuadraticTransform(samples: Sample[], weightDistant: boolean = true): { coeffsX: number[], coeffsY: number[], avgError: number, errors: number[] } {
  const n = samples.length
  const numFeatures = 6

  const A: number[][] = []
  const bx: number[] = []
  const by: number[] = []
  const weights: number[] = []

  for (const s of samples) {
    A.push(createQuadraticFeatures(s.raw.x, s.raw.y))
    bx.push(s.gt.x)
    by.push(s.gt.y)
    // Weight distant samples more (smaller bboxBottom = further = higher weight)
    weights.push(weightDistant ? 1.0 / Math.max(s.bboxBottom, 0.3) : 1.0)
  }

  const coeffsX = solveWeightedLeastSquares(A, bx, weights)
  const coeffsY = solveWeightedLeastSquares(A, by, weights)

  // Calculate errors
  const errors: number[] = []
  for (const s of samples) {
    const features = createQuadraticFeatures(s.raw.x, s.raw.y)
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

// Compare unweighted vs weighted
console.log('\n=== Camera1 (HC3) ===')
const cam1Unweighted = fitWeightedQuadraticTransform(cam1Samples, false)
const cam1Weighted = fitWeightedQuadraticTransform(cam1Samples, true)

console.log('Unweighted:')
console.log('  Avg error: ' + cam1Unweighted.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Unweighted.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length)
console.log('Weighted (favor distant):')
console.log('  Avg error: ' + cam1Weighted.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Weighted.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length)

console.log('\n=== Camera2 (HC4) ===')
const cam2Unweighted = fitWeightedQuadraticTransform(cam2Samples, false)
const cam2Weighted = fitWeightedQuadraticTransform(cam2Samples, true)

console.log('Unweighted:')
console.log('  Avg error: ' + cam2Unweighted.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Unweighted.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length)
console.log('Weighted (favor distant):')
console.log('  Avg error: ' + cam2Weighted.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Weighted.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length)

// Use the better result
const bestCam1 = cam1Weighted.avgError < cam1Unweighted.avgError ? cam1Weighted : cam1Unweighted
const bestCam2 = cam2Weighted.avgError < cam2Unweighted.avgError ? cam2Weighted : cam2Unweighted

// Also try RANSAC-style approach: fit on subset, evaluate on all
console.log('\n=== RANSAC-style: Fit on low-error subset ===')

function ransacFit(samples: Sample[], errorThreshold: number = 1.0): { coeffsX: number[], coeffsY: number[], avgError: number, errors: number[] } {
  // First pass: fit on all samples
  const firstPass = fitWeightedQuadraticTransform(samples, false)

  // Find inliers (error < threshold)
  const inliers = samples.filter((s, i) => firstPass.errors[i] < errorThreshold)
  console.log('  Inliers (error < ' + errorThreshold + 'm): ' + inliers.length + '/' + samples.length)

  if (inliers.length < 10) {
    console.log('  Too few inliers, using all samples')
    return firstPass
  }

  // Second pass: fit on inliers only
  const secondPass = fitWeightedQuadraticTransform(inliers, false)

  // Evaluate on all samples
  const errors: number[] = []
  for (const s of samples) {
    const features = createQuadraticFeatures(s.raw.x, s.raw.y)
    let px = 0, py = 0
    for (let i = 0; i < 6; i++) {
      px += secondPass.coeffsX[i] * features[i]
      py += secondPass.coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return {
    coeffsX: secondPass.coeffsX,
    coeffsY: secondPass.coeffsY,
    avgError: errors.reduce((a, b) => a + b, 0) / samples.length,
    errors
  }
}

const cam1Ransac = ransacFit(cam1Samples, 1.0)
const cam2Ransac = ransacFit(cam2Samples, 1.0)

console.log('Camera1 RANSAC:')
console.log('  Avg error: ' + cam1Ransac.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam1Ransac.errors.filter(e => e < 0.5).length + '/' + cam1Samples.length)

console.log('Camera2 RANSAC:')
console.log('  Avg error: ' + cam2Ransac.avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + cam2Ransac.errors.filter(e => e < 0.5).length + '/' + cam2Samples.length)

// Find the best overall combination
const combinations = [
  { name: 'Unweighted', cam1: cam1Unweighted, cam2: cam2Unweighted },
  { name: 'Weighted', cam1: cam1Weighted, cam2: cam2Weighted },
  { name: 'RANSAC', cam1: cam1Ransac, cam2: cam2Ransac },
]

console.log('\n=== Combined Results ===')
for (const combo of combinations) {
  const allErrors = [...combo.cam1.errors, ...combo.cam2.errors]
  const avgError = allErrors.reduce((a, b) => a + b, 0) / allErrors.length
  const within05 = allErrors.filter(e => e < 0.5).length
  console.log(combo.name + ': avg=' + avgError.toFixed(3) + 'm, within 0.5m=' + within05 + '/' + allErrors.length + ' (' + (within05/allErrors.length*100).toFixed(1) + '%)')
}

// Output best coefficients
const best = combinations.reduce((a, b) => {
  const aAvg = [...a.cam1.errors, ...a.cam2.errors].reduce((x, y) => x + y, 0) / (cam1Samples.length + cam2Samples.length)
  const bAvg = [...b.cam1.errors, ...b.cam2.errors].reduce((x, y) => x + y, 0) / (cam1Samples.length + cam2Samples.length)
  return aAvg < bAvg ? a : b
})

console.log('\n=== Best Coefficients (' + best.name + ') ===')
console.log('CAMERA1_QUADRATIC = {')
console.log('  coeffsX: [' + best.cam1.coeffsX.map(c => c.toFixed(8)).join(', ') + '],')
console.log('  coeffsY: [' + best.cam1.coeffsY.map(c => c.toFixed(8)).join(', ') + '],')
console.log('}')
console.log('CAMERA2_QUADRATIC = {')
console.log('  coeffsX: [' + best.cam2.coeffsX.map(c => c.toFixed(8)).join(', ') + '],')
console.log('  coeffsY: [' + best.cam2.coeffsY.map(c => c.toFixed(8)).join(', ') + '],')
console.log('}')
