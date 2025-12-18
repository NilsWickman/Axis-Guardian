/**
 * Focused optimization on Camera2, which has worse accuracy
 *
 * Try different approaches:
 * 1. More aggressive RANSAC on camera2
 * 2. Higher degree polynomial for camera2
 * 3. Region-specific transforms
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

function createFeatures(x: number, y: number, degree: number): number[] {
  const features: number[] = [1, x, y]  // degree 0, 1

  if (degree >= 2) {
    features.push(x*x, y*y, x*y)  // degree 2
  }

  if (degree >= 3) {
    features.push(x*x*x, y*y*y, x*x*y, x*y*y)  // degree 3
  }

  if (degree >= 4) {
    features.push(x*x*x*x, y*y*y*y, x*x*x*y, x*y*y*y, x*x*y*y)  // degree 4
  }

  if (degree >= 5) {
    features.push(
      x*x*x*x*x, y*y*y*y*y, // x^5, y^5
      x*x*x*x*y, x*y*y*y*y, // x^4*y, x*y^4
      x*x*x*y*y, x*x*y*y*y  // x^3*y^2, x^2*y^3
    )
  }

  return features
}

function solveLinearLeastSquares(A: number[][], b: number[], regularization: number = 1e-6): number[] {
  const m = A.length
  const n = A[0].length

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

  for (let i = 0; i < n; i++) {
    ATA[i][i] += regularization
  }

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

console.log('=== Camera2 Focused Optimization ===\n')

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

console.log(`Camera1 samples: ${cam1Samples.length}`)
console.log(`Camera2 samples: ${cam2Samples.length}`)

function fitTransform(samples: Sample[], degree: number): { coeffsX: number[], coeffsY: number[] } {
  const A: number[][] = []
  const bx: number[] = []
  const by: number[] = []

  for (const s of samples) {
    A.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx.push(s.gt.x)
    by.push(s.gt.y)
  }

  return {
    coeffsX: solveLinearLeastSquares(A, bx),
    coeffsY: solveLinearLeastSquares(A, by)
  }
}

function evaluateTransform(samples: Sample[], coeffs: { coeffsX: number[], coeffsY: number[] }, degree: number) {
  const errors: number[] = []

  for (const s of samples) {
    const features = createFeatures(s.raw.x, s.raw.y, degree)
    let px = 0, py = 0
    for (let i = 0; i < features.length && i < coeffs.coeffsX.length; i++) {
      px += coeffs.coeffsX[i] * features[i]
      py += coeffs.coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  const within05 = errors.filter(e => e < 0.5).length
  const avgError = errors.reduce((a, b) => a + b, 0) / samples.length

  return { avgError, accuracy: within05 / samples.length, errors }
}

function ransacFit(samples: Sample[], degree: number, threshold: number, iterations: number = 3) {
  let best = fitTransform(samples, degree)
  let bestEval = evaluateTransform(samples, best, degree)

  for (let iter = 0; iter < iterations; iter++) {
    // Find inliers
    const inliers = samples.filter((_, i) => bestEval.errors[i] < threshold)
    if (inliers.length < 20) break

    // Refit on inliers
    const newCoeffs = fitTransform(inliers, degree)

    // Evaluate on ALL samples
    const newEval = evaluateTransform(samples, newCoeffs, degree)

    if (newEval.accuracy > bestEval.accuracy) {
      best = newCoeffs
      bestEval = newEval
    }
  }

  return { coeffs: best, eval: bestEval }
}

// Test different approaches for camera2
console.log('\n=== Standard Fit (All Degrees) ===')
for (const degree of [2, 3, 4, 5]) {
  const coeffs = fitTransform(cam2Samples, degree)
  const eval_ = evaluateTransform(cam2Samples, coeffs, degree)
  console.log(`Degree ${degree}: accuracy=${(eval_.accuracy*100).toFixed(1)}%, avg_err=${eval_.avgError.toFixed(3)}m`)
}

console.log('\n=== RANSAC with Different Thresholds (Degree 4) ===')
for (const threshold of [0.5, 0.75, 1.0, 1.5]) {
  const result = ransacFit(cam2Samples, 4, threshold)
  console.log(`Threshold ${threshold}m: accuracy=${(result.eval.accuracy*100).toFixed(1)}%, avg_err=${result.eval.avgError.toFixed(3)}m`)
}

console.log('\n=== RANSAC with Different Thresholds (Degree 3) ===')
for (const threshold of [0.5, 0.75, 1.0, 1.5]) {
  const result = ransacFit(cam2Samples, 3, threshold)
  console.log(`Threshold ${threshold}m: accuracy=${(result.eval.accuracy*100).toFixed(1)}%, avg_err=${result.eval.avgError.toFixed(3)}m`)
}

// Find best combination
console.log('\n=== Best Camera2 Configuration ===')
let bestCam2Config = { degree: 4, threshold: 1.0, accuracy: 0, avgError: 999, coeffs: { coeffsX: [] as number[], coeffsY: [] as number[] } }

for (const degree of [3, 4]) {
  for (const threshold of [0.5, 0.75, 1.0, 1.25, 1.5]) {
    const result = ransacFit(cam2Samples, degree, threshold)
    if (result.eval.accuracy > bestCam2Config.accuracy ||
        (result.eval.accuracy === bestCam2Config.accuracy && result.eval.avgError < bestCam2Config.avgError)) {
      bestCam2Config = {
        degree,
        threshold,
        accuracy: result.eval.accuracy,
        avgError: result.eval.avgError,
        coeffs: result.coeffs
      }
    }
  }
}

console.log(`Best: degree=${bestCam2Config.degree}, threshold=${bestCam2Config.threshold}m, ` +
  `accuracy=${(bestCam2Config.accuracy*100).toFixed(1)}%, avg_err=${bestCam2Config.avgError.toFixed(3)}m`)

// Now optimize camera1 similarly
console.log('\n=== Best Camera1 Configuration ===')
let bestCam1Config = { degree: 4, threshold: 1.0, accuracy: 0, avgError: 999, coeffs: { coeffsX: [] as number[], coeffsY: [] as number[] } }

for (const degree of [3, 4]) {
  for (const threshold of [0.5, 0.75, 1.0, 1.25, 1.5]) {
    const result = ransacFit(cam1Samples, degree, threshold)
    if (result.eval.accuracy > bestCam1Config.accuracy ||
        (result.eval.accuracy === bestCam1Config.accuracy && result.eval.avgError < bestCam1Config.avgError)) {
      bestCam1Config = {
        degree,
        threshold,
        accuracy: result.eval.accuracy,
        avgError: result.eval.avgError,
        coeffs: result.coeffs
      }
    }
  }
}

console.log(`Best: degree=${bestCam1Config.degree}, threshold=${bestCam1Config.threshold}m, ` +
  `accuracy=${(bestCam1Config.accuracy*100).toFixed(1)}%, avg_err=${bestCam1Config.avgError.toFixed(3)}m`)

// Combined results
console.log('\n=== Combined Results ===')
const allErrors = [
  ...evaluateTransform(cam1Samples, bestCam1Config.coeffs, bestCam1Config.degree).errors,
  ...evaluateTransform(cam2Samples, bestCam2Config.coeffs, bestCam2Config.degree).errors
]
const totalWithin05 = allErrors.filter(e => e < 0.5).length
const totalAvgError = allErrors.reduce((a, b) => a + b, 0) / allErrors.length
console.log(`Combined: accuracy=${(totalWithin05/allErrors.length*100).toFixed(1)}%, avg_err=${totalAvgError.toFixed(3)}m`)

// Output best coefficients
console.log('\n=== Best Camera1 Coefficients ===')
console.log('  degree:', bestCam1Config.degree)
console.log('  coeffsX:', bestCam1Config.coeffs.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', bestCam1Config.coeffs.coeffsY.map(c => c.toFixed(8)))

console.log('\n=== Best Camera2 Coefficients ===')
console.log('  degree:', bestCam2Config.degree)
console.log('  coeffsX:', bestCam2Config.coeffs.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', bestCam2Config.coeffs.coeffsY.map(c => c.toFixed(8)))

// Try weighted least squares - give more weight to samples that should be easier to fit
console.log('\n=== Weighted Least Squares (Camera2) ===')
function fitWeightedTransform(samples: Sample[], degree: number, getWeight: (s: Sample) => number): { coeffsX: number[], coeffsY: number[] } {
  const A: number[][] = []
  const bx: number[] = []
  const by: number[] = []

  for (const s of samples) {
    const w = Math.sqrt(getWeight(s))
    const features = createFeatures(s.raw.x, s.raw.y, degree).map(f => f * w)
    A.push(features)
    bx.push(s.gt.x * w)
    by.push(s.gt.y * w)
  }

  return {
    coeffsX: solveLinearLeastSquares(A, bx),
    coeffsY: solveLinearLeastSquares(A, by)
  }
}

// Weight by inverse distance from center of data distribution
const cam2CenterX = cam2Samples.reduce((a, s) => a + s.raw.x, 0) / cam2Samples.length
const cam2CenterY = cam2Samples.reduce((a, s) => a + s.raw.y, 0) / cam2Samples.length
console.log(`Camera2 data center: (${cam2CenterX.toFixed(2)}, ${cam2CenterY.toFixed(2)})`)

// Higher weight for samples closer to the center
const weightedCoeffs = fitWeightedTransform(cam2Samples, 4, (s) => {
  const dist = Math.sqrt((s.raw.x - cam2CenterX)**2 + (s.raw.y - cam2CenterY)**2)
  return 1 / (1 + dist)
})
const weightedEval = evaluateTransform(cam2Samples, weightedCoeffs, 4)
console.log(`Center-weighted: accuracy=${(weightedEval.accuracy*100).toFixed(1)}%, avg_err=${weightedEval.avgError.toFixed(3)}m`)

// Weight by Y position (distant people have higher Y in raw coords often)
const weightedByY = fitWeightedTransform(cam2Samples, 4, (s) => {
  // Give more weight to samples closer to camera (lower Y in raw coords typically)
  return Math.max(0.5, 15 - Math.abs(s.raw.y)) / 15
})
const weightedByYEval = evaluateTransform(cam2Samples, weightedByY, 4)
console.log(`Y-weighted: accuracy=${(weightedByYEval.accuracy*100).toFixed(1)}%, avg_err=${weightedByYEval.avgError.toFixed(3)}m`)
