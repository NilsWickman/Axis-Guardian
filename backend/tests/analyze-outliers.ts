/**
 * Analyze outlier samples to understand why they have high error
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

// Quadratic transforms
const CAMERA1_QUADRATIC = {
  coeffsX: [-6.48698008, 1.20976159, 1.41710851, 0.00481909, -0.01048777, -0.03639196],
  coeffsY: [11.55335761, 2.76646650, -0.93821108, 0.13966499, 0.01800095, -0.14600651],
}

const CAMERA2_QUADRATIC = {
  coeffsX: [-1.18151630, 1.21515900, 0.80827081, -0.00322794, 0.00700946, -0.03536392],
  coeffsY: [12.97347210, 0.73688380, -0.88399761, -0.01294947, 0.00773315, 0.01760611],
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

function applyQuadraticTransform(raw: { x: number, y: number }, coeffsX: number[], coeffsY: number[]) {
  const { x, y } = raw
  return {
    x: coeffsX[0] + coeffsX[1]*x + coeffsX[2]*y + coeffsX[3]*x*x + coeffsX[4]*y*y + coeffsX[5]*x*y,
    y: coeffsY[0] + coeffsY[1]*x + coeffsY[2]*y + coeffsY[3]*x*x + coeffsY[4]*y*y + coeffsY[5]*x*y,
  }
}

const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== Outlier Analysis ===\n')

interface SampleWithError {
  annotationId: string
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number }
  proj: { x: number; y: number }
  bbox: { left: number; top: number; right: number; bottom: number }
  error: number
}

const allSamples: SampleWithError[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const transform = det.cameraId === 'camera1' ? CAMERA1_QUADRATIC : CAMERA2_QUADRATIC
    const proj = applyQuadraticTransform({ x: rawProj[0], y: rawProj[1] }, transform.coeffsX, transform.coeffsY)

    const error = Math.sqrt((proj.x - annotation.groundPosition.x)**2 + (proj.y - annotation.groundPosition.y)**2)

    allSamples.push({
      annotationId: annotation.id,
      cameraId: det.cameraId,
      gt: annotation.groundPosition,
      raw: { x: rawProj[0], y: rawProj[1] },
      proj,
      bbox: det.bbox,
      error
    })
  }
}

// Sort by error
allSamples.sort((a, b) => b.error - a.error)

console.log('Top 15 worst projections:\n')
for (const sample of allSamples.slice(0, 15)) {
  const bbox = sample.bbox
  const bboxWidth = (bbox.right - bbox.left) * 1920
  const bboxHeight = (bbox.bottom - bbox.top) * 1080
  const aspectRatio = bboxHeight / bboxWidth
  const bboxArea = bboxWidth * bboxHeight

  console.log(sample.annotationId + ' (' + sample.cameraId + ')')
  console.log('  Error: ' + sample.error.toFixed(2) + 'm')
  console.log('  GT: (' + sample.gt.x.toFixed(2) + ', ' + sample.gt.y.toFixed(2) + ')')
  console.log('  Proj: (' + sample.proj.x.toFixed(2) + ', ' + sample.proj.y.toFixed(2) + ')')
  console.log('  Raw: (' + sample.raw.x.toFixed(2) + ', ' + sample.raw.y.toFixed(2) + ')')
  console.log('  BBox: left=' + bbox.left.toFixed(3) + ', top=' + bbox.top.toFixed(3) + ', right=' + bbox.right.toFixed(3) + ', bottom=' + bbox.bottom.toFixed(3))
  console.log('  BBox size: ' + bboxWidth.toFixed(0) + 'x' + bboxHeight.toFixed(0) + ' px, aspect=' + aspectRatio.toFixed(2) + ', area=' + bboxArea.toFixed(0))
  console.log('')
}

// Analyze patterns
console.log('=== Pattern Analysis ===\n')

// Check if outliers have specific characteristics
const highErrorSamples = allSamples.filter(s => s.error > 1.5)
const lowErrorSamples = allSamples.filter(s => s.error < 0.5)

console.log('High error samples (>1.5m): ' + highErrorSamples.length)
console.log('Low error samples (<0.5m): ' + lowErrorSamples.length)

// Analyze raw coordinate ranges
const highRawX = highErrorSamples.map(s => s.raw.x)
const highRawY = highErrorSamples.map(s => s.raw.y)
const lowRawX = lowErrorSamples.map(s => s.raw.x)
const lowRawY = lowErrorSamples.map(s => s.raw.y)

console.log('\nRaw coordinate analysis:')
console.log('High error:')
console.log('  Raw X: ' + Math.min(...highRawX).toFixed(2) + ' to ' + Math.max(...highRawX).toFixed(2) + ' (mean: ' + (highRawX.reduce((a,b)=>a+b,0)/highRawX.length).toFixed(2) + ')')
console.log('  Raw Y: ' + Math.min(...highRawY).toFixed(2) + ' to ' + Math.max(...highRawY).toFixed(2) + ' (mean: ' + (highRawY.reduce((a,b)=>a+b,0)/highRawY.length).toFixed(2) + ')')

console.log('Low error:')
console.log('  Raw X: ' + Math.min(...lowRawX).toFixed(2) + ' to ' + Math.max(...lowRawX).toFixed(2) + ' (mean: ' + (lowRawX.reduce((a,b)=>a+b,0)/lowRawX.length).toFixed(2) + ')')
console.log('  Raw Y: ' + Math.min(...lowRawY).toFixed(2) + ' to ' + Math.max(...lowRawY).toFixed(2) + ' (mean: ' + (lowRawY.reduce((a,b)=>a+b,0)/lowRawY.length).toFixed(2) + ')')

// Ground truth positions
const highGtY = highErrorSamples.map(s => s.gt.y)
const lowGtY = lowErrorSamples.map(s => s.gt.y)

console.log('\nGround truth Y (vertical position in room):')
console.log('High error GT_Y: ' + Math.min(...highGtY).toFixed(2) + ' to ' + Math.max(...highGtY).toFixed(2) + ' (mean: ' + (highGtY.reduce((a,b)=>a+b,0)/highGtY.length).toFixed(2) + ')')
console.log('Low error GT_Y: ' + Math.min(...lowGtY).toFixed(2) + ' to ' + Math.max(...lowGtY).toFixed(2) + ' (mean: ' + (lowGtY.reduce((a,b)=>a+b,0)/lowGtY.length).toFixed(2) + ')')

// Check bbox characteristics
const highBboxAspect = highErrorSamples.map(s => ((s.bbox.bottom - s.bbox.top) * 1080) / ((s.bbox.right - s.bbox.left) * 1920))
const lowBboxAspect = lowErrorSamples.map(s => ((s.bbox.bottom - s.bbox.top) * 1080) / ((s.bbox.right - s.bbox.left) * 1920))

console.log('\nBBox aspect ratio (height/width):')
console.log('High error: mean=' + (highBboxAspect.reduce((a,b)=>a+b,0)/highBboxAspect.length).toFixed(2))
console.log('Low error: mean=' + (lowBboxAspect.reduce((a,b)=>a+b,0)/lowBboxAspect.length).toFixed(2))

// BBox bottom position (how far down the image)
const highBboxBottom = highErrorSamples.map(s => s.bbox.bottom)
const lowBboxBottom = lowErrorSamples.map(s => s.bbox.bottom)

console.log('\nBBox bottom position (0=top, 1=bottom of image):')
console.log('High error: mean=' + (highBboxBottom.reduce((a,b)=>a+b,0)/highBboxBottom.length).toFixed(3))
console.log('Low error: mean=' + (lowBboxBottom.reduce((a,b)=>a+b,0)/lowBboxBottom.length).toFixed(3))

// Camera breakdown
const cam1High = highErrorSamples.filter(s => s.cameraId === 'camera1').length
const cam2High = highErrorSamples.filter(s => s.cameraId === 'camera2').length
const cam1Low = lowErrorSamples.filter(s => s.cameraId === 'camera1').length
const cam2Low = lowErrorSamples.filter(s => s.cameraId === 'camera2').length

console.log('\nCamera breakdown:')
console.log('High error: camera1=' + cam1High + ', camera2=' + cam2High)
console.log('Low error: camera1=' + cam1Low + ', camera2=' + cam2Low)
