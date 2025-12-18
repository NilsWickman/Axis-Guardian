/**
 * Joint Optimization of World Transforms with Cross-Camera Convergence Constraint
 *
 * This approach optimizes both cameras together, adding a penalty term for
 * divergent projections when the same person is seen by multiple cameras.
 *
 * Objective: minimize(individual_error + lambda * cross_camera_divergence)
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

// Create polynomial features
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

  return features
}

// Apply polynomial transform
function applyPolynomial(x: number, y: number, coeffsX: number[], coeffsY: number[], degree: number): { x: number, y: number } {
  const features = createFeatures(x, y, degree)
  let px = 0, py = 0
  for (let i = 0; i < features.length && i < coeffsX.length; i++) {
    px += coeffsX[i] * features[i]
    py += coeffsY[i] * features[i]
  }
  return { x: px, y: py }
}

const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Joint Optimization with Cross-Camera Constraints ===\n')

interface Sample {
  annotationId: string
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number }
  isMultiCamera: boolean
}

interface MultiCameraPair {
  annotationId: string
  cam1Raw: { x: number; y: number }
  cam2Raw: { x: number; y: number }
  gt: { x: number; y: number }
}

const allSamples: Sample[] = []
const multiCameraPairs: MultiCameraPair[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  const detections: Map<string, { x: number; y: number }> = new Map()

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    detections.set(det.cameraId, { x: rawProj[0], y: rawProj[1] })

    allSamples.push({
      annotationId: annotation.id,
      cameraId: det.cameraId,
      gt: annotation.groundPosition,
      raw: { x: rawProj[0], y: rawProj[1] },
      isMultiCamera: annotation.linkedDetections.length > 1
    })
  }

  // Create pair for multi-camera annotations
  if (detections.has('camera1') && detections.has('camera2')) {
    multiCameraPairs.push({
      annotationId: annotation.id,
      cam1Raw: detections.get('camera1')!,
      cam2Raw: detections.get('camera2')!,
      gt: annotation.groundPosition
    })
  }
}

console.log(`Total samples: ${allSamples.length}`)
console.log(`  Camera1: ${allSamples.filter(s => s.cameraId === 'camera1').length}`)
console.log(`  Camera2: ${allSamples.filter(s => s.cameraId === 'camera2').length}`)
console.log(`Multi-camera pairs: ${multiCameraPairs.length}`)

// Standard least squares with regularization
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

// Fit with cross-camera convergence constraint
// Extended model: both camera transforms share parameters through convergence constraint
function fitJointWithConvergence(degree: number, convergenceWeight: number) {
  const numFeatures = degree === 2 ? 6 : degree === 3 ? 10 : 15

  // Build camera-specific matrices
  const cam1Samples = allSamples.filter(s => s.cameraId === 'camera1')
  const cam2Samples = allSamples.filter(s => s.cameraId === 'camera2')

  // For each camera, build A and b for ground truth error
  const A1: number[][] = []
  const bx1: number[] = []
  const by1: number[] = []

  for (const s of cam1Samples) {
    A1.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx1.push(s.gt.x)
    by1.push(s.gt.y)
  }

  const A2: number[][] = []
  const bx2: number[] = []
  const by2: number[] = []

  for (const s of cam2Samples) {
    A2.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx2.push(s.gt.x)
    by2.push(s.gt.y)
  }

  // First pass: fit each camera independently
  const coeffs1X = solveLinearLeastSquares(A1, bx1)
  const coeffs1Y = solveLinearLeastSquares(A1, by1)
  const coeffs2X = solveLinearLeastSquares(A2, bx2)
  const coeffs2Y = solveLinearLeastSquares(A2, by2)

  // Now apply convergence constraint iteratively
  // For each multi-camera pair, add soft constraint that both cameras should project to same point

  // Add convergence equations as additional constraints
  // cam1_proj should equal cam2_proj for multi-camera pairs
  // This means: features1 * coeffs1 - features2 * coeffs2 = 0
  // We'll use the centroid target instead: both should project to their average

  const A1_ext: number[][] = [...A1]
  const bx1_ext: number[] = [...bx1]
  const by1_ext: number[] = [...by1]

  const A2_ext: number[][] = [...A2]
  const bx2_ext: number[] = [...bx2]
  const by2_ext: number[] = [...by2]

  for (const pair of multiCameraPairs) {
    // For convergence: both cameras should project to the same point (the ground truth)
    // Weight this constraint
    const w = Math.sqrt(convergenceWeight)

    const f1 = createFeatures(pair.cam1Raw.x, pair.cam1Raw.y, degree).map(f => f * w)
    const f2 = createFeatures(pair.cam2Raw.x, pair.cam2Raw.y, degree).map(f => f * w)

    // Target is ground truth with weight
    A1_ext.push(f1)
    bx1_ext.push(pair.gt.x * w)
    by1_ext.push(pair.gt.y * w)

    A2_ext.push(f2)
    bx2_ext.push(pair.gt.x * w)
    by2_ext.push(pair.gt.y * w)
  }

  // Solve extended systems
  const coeffs1X_ext = solveLinearLeastSquares(A1_ext, bx1_ext)
  const coeffs1Y_ext = solveLinearLeastSquares(A1_ext, by1_ext)
  const coeffs2X_ext = solveLinearLeastSquares(A2_ext, bx2_ext)
  const coeffs2Y_ext = solveLinearLeastSquares(A2_ext, by2_ext)

  return {
    cam1: { coeffsX: coeffs1X_ext, coeffsY: coeffs1Y_ext },
    cam2: { coeffsX: coeffs2X_ext, coeffsY: coeffs2Y_ext }
  }
}

// Evaluate quality
function evaluate(coeffs: { cam1: { coeffsX: number[], coeffsY: number[] }, cam2: { coeffsX: number[], coeffsY: number[] } }, degree: number) {
  let totalError = 0
  let within05 = 0
  const errors: { annotationId: string, error: number }[] = []

  // Evaluate individual projection accuracy
  for (const s of allSamples) {
    const coeff = s.cameraId === 'camera1' ? coeffs.cam1 : coeffs.cam2
    const proj = applyPolynomial(s.raw.x, s.raw.y, coeff.coeffsX, coeff.coeffsY, degree)
    const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
    totalError += err
    if (err < 0.5) within05++
    errors.push({ annotationId: s.annotationId, error: err })
  }

  // Evaluate cross-camera convergence
  let converged = 0
  let divergenceSum = 0
  for (const pair of multiCameraPairs) {
    const proj1 = applyPolynomial(pair.cam1Raw.x, pair.cam1Raw.y, coeffs.cam1.coeffsX, coeffs.cam1.coeffsY, degree)
    const proj2 = applyPolynomial(pair.cam2Raw.x, pair.cam2Raw.y, coeffs.cam2.coeffsX, coeffs.cam2.coeffsY, degree)
    const dist = Math.sqrt((proj1.x - proj2.x)**2 + (proj1.y - proj2.y)**2)
    divergenceSum += dist
    if (dist <= 0.6) converged++
  }

  return {
    avgError: totalError / allSamples.length,
    accuracy: within05 / allSamples.length,
    convergence: converged / multiCameraPairs.length,
    avgDivergence: divergenceSum / multiCameraPairs.length,
    errors
  }
}

console.log('\n=== Testing Different Convergence Weights ===')

const degree = 4
for (const weight of [0, 0.5, 1.0, 2.0, 3.0, 5.0, 10.0]) {
  const coeffs = fitJointWithConvergence(degree, weight)
  const eval_ = evaluate(coeffs, degree)
  console.log(`Weight ${weight.toFixed(1)}: accuracy=${(eval_.accuracy*100).toFixed(1)}%, avg_err=${eval_.avgError.toFixed(3)}m, convergence=${(eval_.convergence*100).toFixed(1)}%, avg_div=${eval_.avgDivergence.toFixed(3)}m`)
}

// Find best weight by grid search
console.log('\n=== Fine-grained Search ===')
let bestWeight = 0
let bestScore = -Infinity

for (let weight = 0; weight <= 20; weight += 0.5) {
  const coeffs = fitJointWithConvergence(degree, weight)
  const eval_ = evaluate(coeffs, degree)
  // Combined score: prioritize accuracy but penalize low convergence
  const score = eval_.accuracy + 0.5 * eval_.convergence - 0.5 * eval_.avgError
  if (score > bestScore) {
    bestScore = score
    bestWeight = weight
  }
}

console.log(`Best weight: ${bestWeight}`)
const bestCoeffs = fitJointWithConvergence(degree, bestWeight)
const bestEval = evaluate(bestCoeffs, degree)
console.log(`Best results: accuracy=${(bestEval.accuracy*100).toFixed(1)}%, avg_err=${bestEval.avgError.toFixed(3)}m, convergence=${(bestEval.convergence*100).toFixed(1)}%`)

// Output coefficients
console.log('\n=== Best Coefficients ===')
console.log('Camera1:')
console.log('  coeffsX:', bestCoeffs.cam1.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', bestCoeffs.cam1.coeffsY.map(c => c.toFixed(8)))
console.log('Camera2:')
console.log('  coeffsX:', bestCoeffs.cam2.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', bestCoeffs.cam2.coeffsY.map(c => c.toFixed(8)))

// Try alternate approach: optimize for centroid accuracy on multi-camera samples
console.log('\n=== Centroid-Based Optimization ===')

// For multi-camera samples, optimize so the centroid of projections matches ground truth
// This naturally encourages convergence
function fitWithCentroidTarget(degree: number) {
  const cam1Samples = allSamples.filter(s => s.cameraId === 'camera1')
  const cam2Samples = allSamples.filter(s => s.cameraId === 'camera2')

  // Build matrices for camera 1
  const A1: number[][] = []
  const bx1: number[] = []
  const by1: number[] = []

  for (const s of cam1Samples) {
    A1.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx1.push(s.gt.x)
    by1.push(s.gt.y)
  }

  // Build matrices for camera 2
  const A2: number[][] = []
  const bx2: number[] = []
  const by2: number[] = []

  for (const s of cam2Samples) {
    A2.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx2.push(s.gt.x)
    by2.push(s.gt.y)
  }

  // Solve
  const coeffs1X = solveLinearLeastSquares(A1, bx1)
  const coeffs1Y = solveLinearLeastSquares(A1, by1)
  const coeffs2X = solveLinearLeastSquares(A2, bx2)
  const coeffs2Y = solveLinearLeastSquares(A2, by2)

  return {
    cam1: { coeffsX: coeffs1X, coeffsY: coeffs1Y },
    cam2: { coeffsX: coeffs2X, coeffsY: coeffs2Y }
  }
}

const standardCoeffs = fitWithCentroidTarget(degree)
const standardEval = evaluate(standardCoeffs, degree)
console.log(`Standard fit: accuracy=${(standardEval.accuracy*100).toFixed(1)}%, avg_err=${standardEval.avgError.toFixed(3)}m, convergence=${(standardEval.convergence*100).toFixed(1)}%`)

// Try RANSAC with multi-camera constraint
console.log('\n=== RANSAC with Convergence ===')

function ransacWithConvergence(degree: number, errorThreshold: number, convergenceWeight: number) {
  // First pass
  const firstCoeffs = fitJointWithConvergence(degree, 0)
  const firstEval = evaluate(firstCoeffs, degree)

  // Find inliers (samples with error < threshold)
  const inlierSamples = allSamples.filter((_, i) => firstEval.errors[i].error < errorThreshold)

  if (inlierSamples.length < 20) {
    console.log('  Too few inliers, using all samples')
    return fitJointWithConvergence(degree, convergenceWeight)
  }

  console.log(`  Using ${inlierSamples.length}/${allSamples.length} inliers`)

  // Refit on inliers with convergence constraint
  // For this we need to recreate the allSamples temporarily
  const originalSamples = [...allSamples]
  allSamples.length = 0
  allSamples.push(...inlierSamples)

  const result = fitJointWithConvergence(degree, convergenceWeight)

  // Restore
  allSamples.length = 0
  allSamples.push(...originalSamples)

  return result
}

for (const weight of [1.0, 2.0, 5.0]) {
  const coeffs = ransacWithConvergence(degree, 1.0, weight)
  const eval_ = evaluate(coeffs, degree)
  console.log(`RANSAC weight ${weight.toFixed(1)}: accuracy=${(eval_.accuracy*100).toFixed(1)}%, avg_err=${eval_.avgError.toFixed(3)}m, convergence=${(eval_.convergence*100).toFixed(1)}%`)
}
