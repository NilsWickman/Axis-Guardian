/**
 * Analyze spatial error distribution and try zone-based transforms
 *
 * Hypothesis: errors vary by distance/region, so separate transforms for
 * near/far or different image regions could help
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

// Camera positions in sitemap coords
const CAMERA_POSITIONS = {
  camera1: { x: 16.22, y: 11.7 },
  camera2: { x: 0.9, y: 10.8 }
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

console.log('=== Spatial Error Analysis ===\n')

interface Sample {
  cameraId: string
  gt: { x: number; y: number }
  raw: { x: number; y: number }
  bbox: { left: number; top: number; right: number; bottom: number }
  bboxHeight: number  // Size in image (proxy for distance)
  distanceFromCamera: number
}

const samples: Sample[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const camPos = CAMERA_POSITIONS[det.cameraId as keyof typeof CAMERA_POSITIONS]
    const distFromCam = Math.sqrt(
      (annotation.groundPosition.x - camPos.x)**2 +
      (annotation.groundPosition.y - camPos.y)**2
    )

    samples.push({
      cameraId: det.cameraId,
      gt: annotation.groundPosition,
      raw: { x: rawProj[0], y: rawProj[1] },
      bbox: det.bbox,
      bboxHeight: det.bbox.bottom - det.bbox.top,
      distanceFromCamera: distFromCam
    })
  }
}

// Analyze error by bbox height (proxy for distance)
console.log('=== Error by Bbox Height (Distance Proxy) ===')
const heightBuckets: { min: number, max: number, samples: Sample[] }[] = [
  { min: 0, max: 0.15, samples: [] },
  { min: 0.15, max: 0.25, samples: [] },
  { min: 0.25, max: 0.35, samples: [] },
  { min: 0.35, max: 0.5, samples: [] },
  { min: 0.5, max: 1, samples: [] },
]

for (const s of samples) {
  for (const bucket of heightBuckets) {
    if (s.bboxHeight >= bucket.min && s.bboxHeight < bucket.max) {
      bucket.samples.push(s)
      break
    }
  }
}

// Current transform coefficients (quartic)
const TRANSFORMS: Record<string, { coeffsX: number[], coeffsY: number[] }> = {
  camera1: {
    coeffsX: [-154.23384997, -50.89881234, 43.24877206, -0.89282346, -4.36056190, 10.68070505,
              -0.18750394, 0.19777282, 0.06050380, -0.71526411,
              0.00148595, -0.00332412, 0.01224795, 0.01553980, -0.00053797],
    coeffsY: [-31.17612169, 1.02233342, 15.46346650, -1.87493799, -2.06650486, -0.17482509,
              -0.00253090, 0.10911070, 0.27296694, 0.02818387,
              -0.00573859, -0.00203211, 0.00064268, -0.00119990, -0.00890833],
  },
  camera2: {
    coeffsX: [-9.22186354, -4.73656375, 4.86537495, 0.99405105, -0.71291290, 1.77410522,
              0.06202410, 0.05167168, -0.24512471, -0.15266355,
              0.02341675, -0.00127858, -0.01311222, 0.00393854, 0.01202618],
    coeffsY: [17.19627516, 3.89869105, -2.71954941, 0.10847543, 0.33666902, -1.39420855,
              0.12643365, -0.02588033, -0.03974158, 0.16130150,
              -0.00372490, 0.00071922, -0.00953930, -0.00547948, 0.00328624],
  },
}

function createFeatures(x: number, y: number): number[] {
  return [1, x, y, x*x, y*y, x*y,
          x*x*x, y*y*y, x*x*y, x*y*y,
          x*x*x*x, y*y*y*y, x*x*x*y, x*y*y*y, x*x*y*y]
}

function applyTransform(x: number, y: number, cameraId: string): { x: number, y: number } {
  const t = TRANSFORMS[cameraId]
  const features = createFeatures(x, y)
  let px = 0, py = 0
  for (let i = 0; i < features.length; i++) {
    px += t.coeffsX[i] * features[i]
    py += t.coeffsY[i] * features[i]
  }
  return { x: px, y: py }
}

for (const bucket of heightBuckets) {
  if (bucket.samples.length === 0) continue

  let totalError = 0
  let within05 = 0

  for (const s of bucket.samples) {
    const proj = applyTransform(s.raw.x, s.raw.y, s.cameraId)
    const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
    totalError += err
    if (err < 0.5) within05++
  }

  console.log(`Height ${bucket.min.toFixed(2)}-${bucket.max.toFixed(2)}: ` +
    `n=${bucket.samples.length}, avg_err=${(totalError/bucket.samples.length).toFixed(3)}m, ` +
    `within_0.5m=${within05}/${bucket.samples.length} (${(within05/bucket.samples.length*100).toFixed(1)}%)`)
}

// Analyze by actual distance from camera
console.log('\n=== Error by Actual Distance from Camera ===')
const distBuckets: { min: number, max: number, samples: Sample[] }[] = [
  { min: 0, max: 5, samples: [] },
  { min: 5, max: 8, samples: [] },
  { min: 8, max: 12, samples: [] },
  { min: 12, max: 16, samples: [] },
  { min: 16, max: 25, samples: [] },
]

for (const s of samples) {
  for (const bucket of distBuckets) {
    if (s.distanceFromCamera >= bucket.min && s.distanceFromCamera < bucket.max) {
      bucket.samples.push(s)
      break
    }
  }
}

for (const bucket of distBuckets) {
  if (bucket.samples.length === 0) continue

  let totalError = 0
  let within05 = 0

  for (const s of bucket.samples) {
    const proj = applyTransform(s.raw.x, s.raw.y, s.cameraId)
    const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
    totalError += err
    if (err < 0.5) within05++
  }

  console.log(`Distance ${bucket.min}-${bucket.max}m: ` +
    `n=${bucket.samples.length}, avg_err=${(totalError/bucket.samples.length).toFixed(3)}m, ` +
    `within_0.5m=${within05}/${bucket.samples.length} (${(within05/bucket.samples.length*100).toFixed(1)}%)`)
}

// Analyze by image region (left/center/right)
console.log('\n=== Error by Image Region (Horizontal) ===')
const regionBuckets: { name: string, xMin: number, xMax: number, samples: Sample[] }[] = [
  { name: 'left', xMin: 0, xMax: 0.33, samples: [] },
  { name: 'center', xMin: 0.33, xMax: 0.67, samples: [] },
  { name: 'right', xMin: 0.67, xMax: 1.0, samples: [] },
]

for (const s of samples) {
  const centerX = (s.bbox.left + s.bbox.right) / 2
  for (const bucket of regionBuckets) {
    if (centerX >= bucket.xMin && centerX < bucket.xMax) {
      bucket.samples.push(s)
      break
    }
  }
}

for (const bucket of regionBuckets) {
  if (bucket.samples.length === 0) continue

  let totalError = 0
  let within05 = 0

  for (const s of bucket.samples) {
    const proj = applyTransform(s.raw.x, s.raw.y, s.cameraId)
    const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
    totalError += err
    if (err < 0.5) within05++
  }

  console.log(`Region ${bucket.name}: ` +
    `n=${bucket.samples.length}, avg_err=${(totalError/bucket.samples.length).toFixed(3)}m, ` +
    `within_0.5m=${within05}/${bucket.samples.length} (${(within05/bucket.samples.length*100).toFixed(1)}%)`)
}

// Analyze per-camera
console.log('\n=== Per-Camera Analysis ===')
for (const cameraId of ['camera1', 'camera2']) {
  const cameraSamples = samples.filter(s => s.cameraId === cameraId)

  let totalError = 0
  let within05 = 0
  const errors: number[] = []

  for (const s of cameraSamples) {
    const proj = applyTransform(s.raw.x, s.raw.y, s.cameraId)
    const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
    totalError += err
    errors.push(err)
    if (err < 0.5) within05++
  }

  errors.sort((a, b) => a - b)
  const median = errors[Math.floor(errors.length / 2)]
  const p90 = errors[Math.floor(errors.length * 0.9)]

  console.log(`${cameraId}: n=${cameraSamples.length}, avg=${(totalError/cameraSamples.length).toFixed(3)}m, ` +
    `median=${median.toFixed(3)}m, p90=${p90.toFixed(3)}m, ` +
    `within_0.5m=${within05}/${cameraSamples.length} (${(within05/cameraSamples.length*100).toFixed(1)}%)`)
}

// Show worst outliers for analysis
console.log('\n=== Top 10 Worst Errors ===')
const errorsWithInfo: { s: Sample, error: number, proj: { x: number, y: number } }[] = []

for (const s of samples) {
  const proj = applyTransform(s.raw.x, s.raw.y, s.cameraId)
  const err = Math.sqrt((proj.x - s.gt.x)**2 + (proj.y - s.gt.y)**2)
  errorsWithInfo.push({ s, error: err, proj })
}

errorsWithInfo.sort((a, b) => b.error - a.error)

for (const { s, error, proj } of errorsWithInfo.slice(0, 10)) {
  console.log(`${s.cameraId}: err=${error.toFixed(2)}m, GT=(${s.gt.x.toFixed(1)}, ${s.gt.y.toFixed(1)}), ` +
    `Proj=(${proj.x.toFixed(1)}, ${proj.y.toFixed(1)}), ` +
    `bboxH=${s.bboxHeight.toFixed(2)}, dist=${s.distanceFromCamera.toFixed(1)}m`)
}

// Count samples by annotation to see multi-camera vs single-camera breakdown
console.log('\n=== Sample Count Summary ===')
console.log(`Total samples: ${samples.length}`)
console.log(`  Camera1: ${samples.filter(s => s.cameraId === 'camera1').length}`)
console.log(`  Camera2: ${samples.filter(s => s.cameraId === 'camera2').length}`)
