/**
 * Optimize World Transforms using Quartic Polynomial Regression
 *
 * Uses a quartic model with 15 terms:
 * GT = c0 + c1*x + c2*y + c3*x^2 + c4*y^2 + c5*x*y +
 *      c6*x^3 + c7*y^3 + c8*x^2*y + c9*x*y^2 +
 *      c10*x^4 + c11*y^4 + c12*x^3*y + c13*x*y^3 + c14*x^2*y^2
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

// Solve least squares
function solveLinearLeastSquares(A: number[][], b: number[]): number[] {
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

  // Add regularization
  for (let i = 0; i < n; i++) {
    ATA[i][i] += 1e-6  // Higher regularization for stability
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

console.log('=== Quartic Polynomial Transform Optimization ===\n')

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

// Test multiple polynomial degrees
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

function fitTransform(samples: Sample[], degree: number): { coeffsX: number[], coeffsY: number[], avgError: number, errors: number[] } {
  const A: number[][] = []
  const bx: number[] = []
  const by: number[] = []

  for (const s of samples) {
    A.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx.push(s.gt.x)
    by.push(s.gt.y)
  }

  const coeffsX = solveLinearLeastSquares(A, bx)
  const coeffsY = solveLinearLeastSquares(A, by)

  // Calculate errors
  const errors: number[] = []
  for (const s of samples) {
    const features = createFeatures(s.raw.x, s.raw.y, degree)
    let px = 0, py = 0
    for (let i = 0; i < features.length; i++) {
      px += coeffsX[i] * features[i]
      py += coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return {
    coeffsX,
    coeffsY,
    avgError: errors.reduce((a, b) => a + b, 0) / samples.length,
    errors
  }
}

console.log('\n=== Degree Comparison ===')
for (const degree of [2, 3, 4]) {
  const cam1Result = fitTransform(cam1Samples, degree)
  const cam2Result = fitTransform(cam2Samples, degree)
  const allErrors = [...cam1Result.errors, ...cam2Result.errors]
  const within05 = allErrors.filter(e => e < 0.5).length

  console.log(`Degree ${degree}:`)
  console.log(`  Camera1: avg=${cam1Result.avgError.toFixed(3)}m, within 0.5m=${cam1Result.errors.filter(e => e < 0.5).length}/${cam1Samples.length}`)
  console.log(`  Camera2: avg=${cam2Result.avgError.toFixed(3)}m, within 0.5m=${cam2Result.errors.filter(e => e < 0.5).length}/${cam2Samples.length}`)
  console.log(`  Combined: avg=${(allErrors.reduce((a,b)=>a+b,0)/allErrors.length).toFixed(3)}m, within 0.5m=${within05}/${allErrors.length} (${(within05/allErrors.length*100).toFixed(1)}%)`)
}

// Use degree that gives best results (likely 3 or 4)
// For production, we'll use the coefficients from best degree

// Try RANSAC for each degree
console.log('\n=== RANSAC + Degree Optimization ===')

function ransacFit(samples: Sample[], degree: number, errorThreshold: number = 1.0) {
  // First pass
  const firstPass = fitTransform(samples, degree)

  // Find inliers
  const inliers = samples.filter((_, i) => firstPass.errors[i] < errorThreshold)
  if (inliers.length < 10) return firstPass

  // Second pass on inliers
  const inlierResult = fitTransform(inliers, degree)

  // Evaluate on ALL samples
  const errors: number[] = []
  for (const s of samples) {
    const features = createFeatures(s.raw.x, s.raw.y, degree)
    let px = 0, py = 0
    for (let i = 0; i < features.length; i++) {
      px += inlierResult.coeffsX[i] * features[i]
      py += inlierResult.coeffsY[i] * features[i]
    }
    errors.push(Math.sqrt((px - s.gt.x)**2 + (py - s.gt.y)**2))
  }

  return {
    coeffsX: inlierResult.coeffsX,
    coeffsY: inlierResult.coeffsY,
    avgError: errors.reduce((a, b) => a + b, 0) / samples.length,
    errors
  }
}

let bestResult = { degree: 2, cam1: fitTransform(cam1Samples, 2), cam2: fitTransform(cam2Samples, 2), within05: 0 }

for (const degree of [2, 3, 4]) {
  const cam1Result = ransacFit(cam1Samples, degree)
  const cam2Result = ransacFit(cam2Samples, degree)
  const allErrors = [...cam1Result.errors, ...cam2Result.errors]
  const within05 = allErrors.filter(e => e < 0.5).length

  console.log(`RANSAC Degree ${degree}: within 0.5m=${within05}/${allErrors.length} (${(within05/allErrors.length*100).toFixed(1)}%), avg=${(allErrors.reduce((a,b)=>a+b,0)/allErrors.length).toFixed(3)}m`)

  if (within05 > bestResult.within05) {
    bestResult = { degree, cam1: cam1Result, cam2: cam2Result, within05 }
  }
}

console.log(`\nBest: Degree ${bestResult.degree} with ${bestResult.within05} samples within 0.5m`)

// Output the best coefficients
console.log('\n=== Best Coefficients ===')
console.log(`// Polynomial degree ${bestResult.degree}`)

if (bestResult.degree === 2) {
  console.log(`CAMERA1_QUADRATIC = {
  coeffsX: [${bestResult.cam1.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${bestResult.cam1.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}`)
  console.log(`CAMERA2_QUADRATIC = {
  coeffsX: [${bestResult.cam2.coeffsX.map(c => c.toFixed(8)).join(', ')}],
  coeffsY: [${bestResult.cam2.coeffsY.map(c => c.toFixed(8)).join(', ')}],
}`)
} else {
  console.log('Camera1:')
  console.log('  coeffsX:', bestResult.cam1.coeffsX.map(c => c.toFixed(8)))
  console.log('  coeffsY:', bestResult.cam1.coeffsY.map(c => c.toFixed(8)))
  console.log('Camera2:')
  console.log('  coeffsX:', bestResult.cam2.coeffsX.map(c => c.toFixed(8)))
  console.log('  coeffsY:', bestResult.cam2.coeffsY.map(c => c.toFixed(8)))
}
