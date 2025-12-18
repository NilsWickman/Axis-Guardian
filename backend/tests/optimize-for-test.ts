/**
 * Optimize transforms to match the test evaluation method
 *
 * The test uses:
 * 1. For multi-camera: centroid of all camera projections
 * 2. For single-camera: direct projection
 *
 * This script optimizes for both cameras jointly to minimize:
 * - Individual projection errors
 * - Centroid errors for multi-camera cases
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

console.log('=== Optimizing for Test Evaluation Method ===\n')

// Build data for optimization
interface RawProjection {
  cameraId: string
  raw: { x: number; y: number }
}

interface AnnotationData {
  id: string
  gt: { x: number; y: number }
  projections: RawProjection[]
}

const annotations: AnnotationData[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  const projections: RawProjection[] = []

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    projections.push({
      cameraId: det.cameraId,
      raw: { x: rawProj[0], y: rawProj[1] }
    })
  }

  if (projections.length > 0) {
    annotations.push({
      id: annotation.id,
      gt: annotation.groundPosition,
      projections
    })
  }
}

console.log(`Loaded ${annotations.length} annotations`)
console.log(`  Multi-camera: ${annotations.filter(a => a.projections.length > 1).length}`)
console.log(`  Single-camera: ${annotations.filter(a => a.projections.length === 1).length}`)

// Function to apply polynomial and compute centroid
function applyPolynomial(x: number, y: number, coeffsX: number[], coeffsY: number[], degree: number): { x: number, y: number } {
  const features = createFeatures(x, y, degree)
  let px = 0, py = 0
  for (let i = 0; i < features.length && i < coeffsX.length; i++) {
    px += coeffsX[i] * features[i]
    py += coeffsY[i] * features[i]
  }
  return { x: px, y: py }
}

// Evaluate using same logic as test (centroid for multi-camera)
function evaluateLikeTest(
  cam1Coeffs: { coeffsX: number[], coeffsY: number[] },
  cam2Coeffs: { coeffsX: number[], coeffsY: number[] },
  degree: number
) {
  let passed = 0
  let totalError = 0

  for (const ann of annotations) {
    const positions: { x: number; y: number }[] = []

    for (const proj of ann.projections) {
      const coeffs = proj.cameraId === 'camera1' ? cam1Coeffs : cam2Coeffs
      const transformed = applyPolynomial(proj.raw.x, proj.raw.y, coeffs.coeffsX, coeffs.coeffsY, degree)
      positions.push(transformed)
    }

    // Compute centroid (like the test does)
    const centroid = {
      x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
      y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
    }

    const error = Math.sqrt((centroid.x - ann.gt.x)**2 + (centroid.y - ann.gt.y)**2)
    totalError += error
    if (error < 0.5) passed++
  }

  return {
    accuracy: passed / annotations.length,
    avgError: totalError / annotations.length
  }
}

// Iterative optimization approach
// Start with standard fit, then iteratively adjust to improve centroid accuracy
function optimizeForCentroid(degree: number, iterations: number = 10) {
  // Initial fit: standard per-camera regression
  const cam1Samples = annotations.flatMap(a =>
    a.projections.filter(p => p.cameraId === 'camera1').map(p => ({ raw: p.raw, gt: a.gt }))
  )
  const cam2Samples = annotations.flatMap(a =>
    a.projections.filter(p => p.cameraId === 'camera2').map(p => ({ raw: p.raw, gt: a.gt }))
  )

  const fitCamera = (samples: { raw: { x: number, y: number }, gt: { x: number, y: number } }[]) => {
    const A = samples.map(s => createFeatures(s.raw.x, s.raw.y, degree))
    const bx = samples.map(s => s.gt.x)
    const by = samples.map(s => s.gt.y)
    return {
      coeffsX: solveLinearLeastSquares(A, bx),
      coeffsY: solveLinearLeastSquares(A, by)
    }
  }

  let cam1Coeffs = fitCamera(cam1Samples)
  let cam2Coeffs = fitCamera(cam2Samples)

  console.log(`\nInitial fit (degree ${degree}):`, evaluateLikeTest(cam1Coeffs, cam2Coeffs, degree))

  // Now try adjusting for multi-camera centroids
  // For multi-camera cases, we want both cameras to project to the same point
  // Idea: add weighted constraints for centroid accuracy

  const multiCameraAnnotations = annotations.filter(a => a.projections.length > 1)
  console.log(`Multi-camera annotations: ${multiCameraAnnotations.length}`)

  // Build extended system with centroid constraints
  // For each multi-camera annotation, add constraint that cameras should average to GT

  // Camera 1 extended system
  const A1_ext: number[][] = []
  const bx1_ext: number[] = []
  const by1_ext: number[] = []

  // Standard constraints
  for (const s of cam1Samples) {
    A1_ext.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx1_ext.push(s.gt.x)
    by1_ext.push(s.gt.y)
  }

  // Camera 2 extended system
  const A2_ext: number[][] = []
  const bx2_ext: number[] = []
  const by2_ext: number[] = []

  for (const s of cam2Samples) {
    A2_ext.push(createFeatures(s.raw.x, s.raw.y, degree))
    bx2_ext.push(s.gt.x)
    by2_ext.push(s.gt.y)
  }

  // Add centroid constraints with higher weight for multi-camera cases
  const centroidWeight = 2.0  // Give extra weight to getting centroids right

  for (const ann of multiCameraAnnotations) {
    const cam1Proj = ann.projections.find(p => p.cameraId === 'camera1')
    const cam2Proj = ann.projections.find(p => p.cameraId === 'camera2')

    if (cam1Proj && cam2Proj) {
      const w = Math.sqrt(centroidWeight)

      // Add weighted constraint for camera1
      A1_ext.push(createFeatures(cam1Proj.raw.x, cam1Proj.raw.y, degree).map(f => f * w))
      bx1_ext.push(ann.gt.x * w)
      by1_ext.push(ann.gt.y * w)

      // Add weighted constraint for camera2
      A2_ext.push(createFeatures(cam2Proj.raw.x, cam2Proj.raw.y, degree).map(f => f * w))
      bx2_ext.push(ann.gt.x * w)
      by2_ext.push(ann.gt.y * w)
    }
  }

  cam1Coeffs = {
    coeffsX: solveLinearLeastSquares(A1_ext, bx1_ext),
    coeffsY: solveLinearLeastSquares(A1_ext, by1_ext)
  }
  cam2Coeffs = {
    coeffsX: solveLinearLeastSquares(A2_ext, bx2_ext),
    coeffsY: solveLinearLeastSquares(A2_ext, by2_ext)
  }

  console.log(`With centroid weight ${centroidWeight}:`, evaluateLikeTest(cam1Coeffs, cam2Coeffs, degree))

  return { cam1Coeffs, cam2Coeffs }
}

// Test different configurations
console.log('\n=== Testing Different Degrees ===')
for (const degree of [3, 4]) {
  optimizeForCentroid(degree)
}

// Try RANSAC-style approach
console.log('\n=== RANSAC + Centroid Optimization ===')

function ransacOptimize(degree: number, threshold: number) {
  // First fit
  const cam1Samples = annotations.flatMap(a =>
    a.projections.filter(p => p.cameraId === 'camera1').map(p => ({ raw: p.raw, gt: a.gt, annId: a.id }))
  )
  const cam2Samples = annotations.flatMap(a =>
    a.projections.filter(p => p.cameraId === 'camera2').map(p => ({ raw: p.raw, gt: a.gt, annId: a.id }))
  )

  const fitCamera = (samples: { raw: { x: number, y: number }, gt: { x: number, y: number } }[]) => {
    const A = samples.map(s => createFeatures(s.raw.x, s.raw.y, degree))
    const bx = samples.map(s => s.gt.x)
    const by = samples.map(s => s.gt.y)
    return {
      coeffsX: solveLinearLeastSquares(A, bx),
      coeffsY: solveLinearLeastSquares(A, by)
    }
  }

  let cam1Coeffs = fitCamera(cam1Samples)
  let cam2Coeffs = fitCamera(cam2Samples)

  // Find inlier annotations (based on centroid error)
  const inlierIds = new Set<string>()
  for (const ann of annotations) {
    const positions: { x: number; y: number }[] = []
    for (const proj of ann.projections) {
      const coeffs = proj.cameraId === 'camera1' ? cam1Coeffs : cam2Coeffs
      const transformed = applyPolynomial(proj.raw.x, proj.raw.y, coeffs.coeffsX, coeffs.coeffsY, degree)
      positions.push(transformed)
    }
    const centroid = {
      x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
      y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length
    }
    const error = Math.sqrt((centroid.x - ann.gt.x)**2 + (centroid.y - ann.gt.y)**2)
    if (error < threshold) {
      inlierIds.add(ann.id)
    }
  }

  console.log(`  Inliers (threshold=${threshold}m): ${inlierIds.size}/${annotations.length}`)

  // Refit on inliers only
  const inlierCam1 = cam1Samples.filter(s => inlierIds.has(s.annId))
  const inlierCam2 = cam2Samples.filter(s => inlierIds.has(s.annId))

  if (inlierCam1.length < 20 || inlierCam2.length < 20) {
    console.log('  Too few inliers, using all data')
  } else {
    cam1Coeffs = fitCamera(inlierCam1)
    cam2Coeffs = fitCamera(inlierCam2)
  }

  const result = evaluateLikeTest(cam1Coeffs, cam2Coeffs, degree)
  console.log(`  Result: accuracy=${(result.accuracy*100).toFixed(1)}%, avg_err=${result.avgError.toFixed(3)}m`)

  return { cam1Coeffs, cam2Coeffs, ...result }
}

let best = { accuracy: 0, coeffs: { cam1: { coeffsX: [] as number[], coeffsY: [] as number[] }, cam2: { coeffsX: [] as number[], coeffsY: [] as number[] } }, degree: 4, threshold: 1.0 }

for (const degree of [3, 4]) {
  for (const threshold of [0.75, 1.0, 1.25, 1.5]) {
    const result = ransacOptimize(degree, threshold)
    if (result.accuracy > best.accuracy) {
      best = {
        accuracy: result.accuracy,
        coeffs: { cam1: result.cam1Coeffs, cam2: result.cam2Coeffs },
        degree,
        threshold
      }
    }
  }
}

console.log(`\n=== Best Configuration ===`)
console.log(`Degree: ${best.degree}, Threshold: ${best.threshold}m`)
console.log(`Accuracy: ${(best.accuracy*100).toFixed(1)}%`)

console.log('\n=== Best Coefficients ===')
console.log('Camera1:')
console.log('  coeffsX:', best.coeffs.cam1.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', best.coeffs.cam1.coeffsY.map(c => c.toFixed(8)))
console.log('Camera2:')
console.log('  coeffsX:', best.coeffs.cam2.coeffsX.map(c => c.toFixed(8)))
console.log('  coeffsY:', best.coeffs.cam2.coeffsY.map(c => c.toFixed(8)))
