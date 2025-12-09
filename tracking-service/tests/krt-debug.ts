/**
 * K/R/T Debug Script
 *
 * Detailed analysis of the projection math to identify calibration issues
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: 'certain' | 'estimated' | 'uncertain'
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  version: string
  room: { width: number; height: number }
  cameras: Array<{ cameraId: string; videoFile: string; detectionsFile: string }>
  annotations: Annotation[]
}

// K/R/T Calibration matrices
const CAMERA_CALIBRATIONS: Record<string, {
  K: number[][]
  R: number[][]
  T: number[]
  center: number[]
}> = {
  camera1: {
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
      [0, 0, 1],
    ],
    R: [
      [0.26415998, 0.96365108, -0.0399512],
      [0.01284627, -0.04493433, -0.99890734],
      [-0.96439332, 0.26335812, -0.02424917],
    ],
    T: [8.31972445, 13.44595571, 1.59303293],
    center: [960, 540],
  },
  camera2: {
    K: [
      [2350, 0, 0],
      [0, 2350, 0],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, -0.08715574, -0.9961947],
      [0, 0.9961947, -0.08715574],
    ],
    T: [0, 0, 1.5],
    center: [960, 540],
  },
}

// Matrix utilities
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
    const Ai: number[][] = A.map((row, ri) =>
      row.map((val, ci) => ci === i ? b[ri] : val)
    )
    const detAi =
      Ai[0][0] * (Ai[1][1] * Ai[2][2] - Ai[1][2] * Ai[2][1]) -
      Ai[0][1] * (Ai[1][0] * Ai[2][2] - Ai[1][2] * Ai[2][0]) +
      Ai[0][2] * (Ai[1][0] * Ai[2][1] - Ai[1][1] * Ai[2][0])
    x.push(detAi / det)
  }

  return x
}

// Project using K/R/T (current formula from ground-plane.ts)
function projectWithKRT(imageX: number, imageY: number, calib: typeof CAMERA_CALIBRATIONS['camera1']) {
  const { K, R, T, center } = calib

  // A = K * R
  const KR = matMul3x3(K, R)

  // Build modified A matrix: [KR(:,1:2), [cx-x; cy-y; -1]]
  const A: number[][] = [
    [KR[0][0], KR[0][1], center[0] - imageX],
    [KR[1][0], KR[1][1], center[1] - imageY],
    [KR[2][0], KR[2][1], -1],
  ]

  // KRT = K * R * T
  const KRT = matMulVec(KR, T)

  // Solve A * p = KRT for p
  const p = solve3x3(A, KRT)

  return p
}

// Load ground truth
const groundTruthPath = join(__dirname, '../../GroundTruths.json')
const content = readFileSync(groundTruthPath, 'utf-8')
const groundTruth: GroundTruthDataset = JSON.parse(content)

console.log('=== K/R/T Debug Analysis ===\n')

// Let's verify by reverse projection - if we have a known world point,
// project it to image coordinates and verify it matches the bbox

// Test: For a ground truth point (9.29, 1.59), verify the projection matches

// First, let's analyze what coordinate system the raw K/R/T gives us
// The T vector tells us the camera position in the dataset coordinate system:
// camera1: T = [8.32, 13.45, 1.59] (camera height 1.59m)
// camera2: T = [0, 0, 1.5] (at origin, height 1.5m)

// The R matrix tells us the camera orientation.
// For camera2, R is approximately an identity with pitch (looking down):
// [ 1  0  0 ]     - no yaw rotation
// [ 0 -0.087 -0.996 ] - pitch rotation
// [ 0  0.996 -0.087 ]

console.log('Camera positions in dataset coords (from T vectors):')
for (const [cameraId, calib] of Object.entries(CAMERA_CALIBRATIONS)) {
  console.log('  ' + cameraId + ': (' + calib.T[0].toFixed(2) + ', ' + calib.T[1].toFixed(2) + ', ' + calib.T[2].toFixed(2) + ')')
}

console.log('\nSitemap positions (from sitemap config):')
console.log('  camera1 (HC3): (16.22, 11.7)')
console.log('  camera2 (HC4): (0.9, 10.8)')

console.log('\n=== Testing projection with known ground truth ===')

// Get the first annotation with both cameras
const firstMultiCamera = groundTruth.annotations.find(
  a => a.confidence === 'certain' && a.linkedDetections.length >= 2
)

if (firstMultiCamera) {
  console.log('\nAnnotation: ' + firstMultiCamera.id)
  console.log('Ground truth position: (' + firstMultiCamera.groundPosition.x.toFixed(2) + ', ' + firstMultiCamera.groundPosition.y.toFixed(2) + ')')

  for (const det of firstMultiCamera.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const bbox = det.bbox
    const footX = (bbox.left + (bbox.right - bbox.left) / 2) * 1920
    const footY = bbox.bottom * 1080

    console.log('\n' + det.cameraId + ':')
    console.log('  Bbox foot (pixels): (' + footX.toFixed(1) + ', ' + footY.toFixed(1) + ')')

    const rawProj = projectWithKRT(footX, footY, calib)
    if (rawProj) {
      console.log('  Raw projection (dataset coords): (' + rawProj[0].toFixed(3) + ', ' + rawProj[1].toFixed(3) + ', ' + rawProj[2].toFixed(3) + ')')
    }
  }
}

// Analyze the relationship between dataset and sitemap coordinates
console.log('\n=== Coordinate System Analysis ===')

// Dataset camera positions vs sitemap camera positions:
// Dataset:  camera1 at (8.32, 13.45), camera2 at (0, 0)
// Sitemap:  camera1 at (16.22, 11.7), camera2 at (0.9, 10.8)

// Vector from camera2 to camera1:
// Dataset: (8.32 - 0, 13.45 - 0) = (8.32, 13.45)
// Sitemap: (16.22 - 0.9, 11.7 - 10.8) = (15.32, 0.9)

console.log('Vector from camera2 to camera1:')
console.log('  Dataset: (8.32, 13.45)')
console.log('  Sitemap: (15.32, 0.9)')

// This tells us:
// 1. The X-axis in dataset is rotated relative to sitemap
// 2. There's a significant rotation involved

const datasetVec = [8.32, 13.45]
const sitemapVec = [15.32, 0.9]

// Calculate the rotation angle
const datasetAngle = Math.atan2(datasetVec[1], datasetVec[0]) * 180 / Math.PI
const sitemapAngle = Math.atan2(sitemapVec[1], sitemapVec[0]) * 180 / Math.PI

console.log('  Dataset angle: ' + datasetAngle.toFixed(1) + '°')
console.log('  Sitemap angle: ' + sitemapAngle.toFixed(1) + '°')
console.log('  Rotation needed: ' + (datasetAngle - sitemapAngle).toFixed(1) + '°')

// The cameras are ~58° rotated, and ~3.4° in sitemap
// So we need about -55° rotation

// Also calculate scale
const datasetDist = Math.sqrt(datasetVec[0]**2 + datasetVec[1]**2)
const sitemapDist = Math.sqrt(sitemapVec[0]**2 + sitemapVec[1]**2)

console.log('  Dataset distance: ' + datasetDist.toFixed(2) + 'm')
console.log('  Sitemap distance: ' + sitemapDist.toFixed(2) + 'm')
console.log('  Scale factor: ' + (sitemapDist / datasetDist).toFixed(3))

// Calculate optimal transform analytically
console.log('\n=== Computing Analytical Transform ===')

// We need: sitemap = scale * R * dataset + translation
// Using the two camera positions as constraints:
// camera2_sitemap = scale * R * camera2_dataset + t = scale * R * [0,0] + t = t
// camera1_sitemap = scale * R * camera1_dataset + t

// So: t = camera2_sitemap = [0.9, 10.8]
// And: camera1_sitemap - t = scale * R * camera1_dataset
//      [15.32, 0.9] = scale * R * [8.32, 13.45]

// For pure rotation R = [[cos, -sin], [sin, cos]]:
// 15.32 = scale * (8.32 * cos - 13.45 * sin)
// 0.9 = scale * (8.32 * sin + 13.45 * cos)

// Solving...
// Let s * cos = a, s * sin = b
// 15.32 = 8.32*a - 13.45*b
// 0.9 = 8.32*b + 13.45*a

// From second equation: a = (0.9 - 8.32*b) / 13.45
// Substitute: 15.32 = 8.32 * (0.9 - 8.32*b) / 13.45 - 13.45*b
// 15.32 * 13.45 = 8.32 * 0.9 - 8.32² * b - 13.45² * b
// 206.05 = 7.488 - 69.22*b - 180.90*b
// 198.57 = -250.12 * b
// b = -0.794

const b = -198.57 / 250.12
const a = (0.9 - 8.32 * b) / 13.45

console.log('Intermediate: a = ' + a.toFixed(4) + ', b = ' + b.toFixed(4))

const scale = Math.sqrt(a**2 + b**2)
const cos = a / scale
const sin = b / scale
const rotationAngle = Math.atan2(sin, cos) * 180 / Math.PI

console.log('Scale: ' + scale.toFixed(4))
console.log('Rotation angle: ' + rotationAngle.toFixed(2) + '°')
console.log('cos: ' + cos.toFixed(6) + ', sin: ' + sin.toFixed(6))

// Build rotation matrix (column-major for [R00, R01; R10, R11] acting on column vector)
const R = [
  [cos, -sin],
  [sin, cos]
]

console.log('\nAnalytical transform:')
console.log('const WORLD_TRANSFORM = {')
console.log('  rotation: [')
console.log('    [' + R[0][0].toFixed(6) + ', ' + R[0][1].toFixed(6) + '],')
console.log('    [' + R[1][0].toFixed(6) + ', ' + R[1][1].toFixed(6) + '],')
console.log('  ],')
console.log('  translation: [0.9, 10.8],')
console.log('  scale: ' + scale.toFixed(6) + ',')
console.log('}')

// Now let's verify this transform
console.log('\n=== Verifying Analytical Transform ===')

function applyTransform(raw: number[], R: number[][], t: number[], s: number) {
  return [
    s * (R[0][0] * raw[0] + R[0][1] * raw[1]) + t[0],
    s * (R[1][0] * raw[0] + R[1][1] * raw[1]) + t[1]
  ]
}

const t = [0.9, 10.8]

// Verify camera positions transform correctly
const cam2Dataset = [0, 0]
const cam2Transformed = applyTransform(cam2Dataset, R, t, scale)
console.log('Camera2: Dataset (0, 0) -> Transformed (' + cam2Transformed[0].toFixed(2) + ', ' + cam2Transformed[1].toFixed(2) + ') (expected: 0.9, 10.8)')

const cam1Dataset = [8.32, 13.45]
const cam1Transformed = applyTransform(cam1Dataset, R, t, scale)
console.log('Camera1: Dataset (8.32, 13.45) -> Transformed (' + cam1Transformed[0].toFixed(2) + ', ' + cam1Transformed[1].toFixed(2) + ') (expected: 16.22, 11.7)')

// Test with ground truth samples
console.log('\n=== Testing with Ground Truth Samples ===')

let totalError = 0
let count = 0
const errors: number[] = []

for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const transformed = applyTransform([rawProj[0], rawProj[1]], R, t, scale)

    const error = Math.sqrt(
      (transformed[0] - annotation.groundPosition.x)**2 +
      (transformed[1] - annotation.groundPosition.y)**2
    )

    totalError += error
    errors.push(error)
    count++
  }
}

const avgError = totalError / count
const within05 = errors.filter(e => e < 0.5).length

console.log('Analytical transform results:')
console.log('  Average error: ' + avgError.toFixed(3) + 'm')
console.log('  Within 0.5m: ' + within05 + '/' + count + ' (' + (within05/count*100).toFixed(1) + '%)')

// What's still wrong? Let's check individual samples
console.log('\n=== Sample Analysis ===')
let sampleCount = 0
for (const annotation of groundTruth.annotations) {
  if (annotation.confidence !== 'certain') continue
  if (sampleCount >= 10) break

  for (const det of annotation.linkedDetections) {
    const calib = CAMERA_CALIBRATIONS[det.cameraId]
    if (!calib) continue

    const footX = (det.bbox.left + (det.bbox.right - det.bbox.left) / 2) * 1920
    const footY = det.bbox.bottom * 1080

    const rawProj = projectWithKRT(footX, footY, calib)
    if (!rawProj) continue

    const transformed = applyTransform([rawProj[0], rawProj[1]], R, t, scale)

    const error = Math.sqrt(
      (transformed[0] - annotation.groundPosition.x)**2 +
      (transformed[1] - annotation.groundPosition.y)**2
    )

    console.log(det.cameraId + ': GT=(' + annotation.groundPosition.x.toFixed(2) + ',' + annotation.groundPosition.y.toFixed(2) + ') -> Raw=(' + rawProj[0].toFixed(2) + ',' + rawProj[1].toFixed(2) + ') -> Trans=(' + transformed[0].toFixed(2) + ',' + transformed[1].toFixed(2) + ') err=' + error.toFixed(2) + 'm')

    sampleCount++
    if (sampleCount >= 10) break
  }
}
