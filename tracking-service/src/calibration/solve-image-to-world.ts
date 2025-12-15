#!/usr/bin/env node
/**
 * Image-to-World Calibration Solver
 *
 * Computes a homography that maps image coordinates (u, v) directly to
 * world ground plane coordinates (X, Y) in sitemap space.
 *
 * This bypasses K/R/T entirely and computes a single 3x3 homography matrix.
 * For ground-plane projection, this is mathematically equivalent but more stable.
 *
 * The homography satisfies:
 *   [X]   [h11 h12 h13] [u]
 *   [Y] = [h21 h22 h23] [v]
 *   [1]   [h31 h32 h33] [1]
 *
 * After normalization: X = (h11*u + h12*v + h13) / (h31*u + h32*v + h33)
 *                      Y = (h21*u + h22*v + h23) / (h31*u + h32*v + h33)
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import {
  loadGroundTruths,
  filterAnnotations,
  type GroundTruthAnnotation,
} from './utils.js'
import { multiStartNelderMead } from './nelder-mead.js'

interface HomographyResult {
  /** 3x3 homography matrix (row-major) */
  H: number[][]
  /** Mean reprojection error in meters */
  error: number
  /** Pass rate (<0.5m) */
  passRate: number
  /** Per-sample errors */
  sampleErrors: number[]
}

interface ImagePoint {
  u: number
  v: number
}

interface WorldPoint {
  x: number
  y: number
}

interface Correspondence {
  image: ImagePoint
  world: WorldPoint
}

/**
 * Build DLT matrix for image-to-world homography
 *
 * For the mapping: world = H * image (in homogeneous coords)
 * We have:
 *   X = (h11*u + h12*v + h13) / (h31*u + h32*v + h33)
 *   Y = (h21*u + h22*v + h23) / (h31*u + h32*v + h33)
 *
 * Cross-multiplying:
 *   X * (h31*u + h32*v + h33) = h11*u + h12*v + h13
 *   Y * (h31*u + h32*v + h33) = h21*u + h22*v + h23
 *
 * Rearranging for DLT:
 *   h11*u + h12*v + h13 - X*h31*u - X*h32*v - X*h33 = 0
 *   h21*u + h22*v + h23 - Y*h31*u - Y*h32*v - Y*h33 = 0
 */
function buildDLTMatrix(correspondences: Correspondence[]): number[][] {
  const A: number[][] = []

  for (const { image, world } of correspondences) {
    const u = image.u
    const v = image.v
    const X = world.x
    const Y = world.y

    // Row for X constraint: [u, v, 1, 0, 0, 0, -X*u, -X*v, -X]
    A.push([u, v, 1, 0, 0, 0, -X * u, -X * v, -X])
    // Row for Y constraint: [0, 0, 0, u, v, 1, -Y*u, -Y*v, -Y]
    A.push([0, 0, 0, u, v, 1, -Y * u, -Y * v, -Y])
  }

  return A
}

/**
 * Solve for null space of A using SVD (simplified via eigendecomposition of A^T*A)
 */
function solveNullSpace(A: number[][]): number[] {
  const m = A.length
  const n = A[0].length // Should be 9 for homography

  // Compute A^T * A
  const AtA: number[][] = []
  for (let i = 0; i < n; i++) {
    AtA[i] = []
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < m; k++) {
        sum += A[k][i] * A[k][j]
      }
      AtA[i][j] = sum
    }
  }

  // Power iteration to find smallest eigenvector of A^T*A
  // (which is the right singular vector for smallest singular value of A)
  // We use inverse iteration with shift

  // Start with random vector
  let x = new Array(n).fill(0).map(() => Math.random() - 0.5)

  // Normalize
  let norm = Math.sqrt(x.reduce((s, v) => s + v * v, 0))
  x = x.map((v) => v / norm)

  // Inverse iteration (finds smallest eigenvalue)
  // Solve (A^T*A) * y = x, then normalize y
  for (let iter = 0; iter < 100; iter++) {
    // Solve using Gaussian elimination
    const augmented: number[][] = AtA.map((row, i) => [...row, x[i]])

    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row
        }
      }

      // Swap rows
      ;[augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]]

      if (Math.abs(augmented[col][col]) < 1e-12) continue

      // Eliminate
      for (let row = col + 1; row < n; row++) {
        const factor = augmented[row][col] / augmented[col][col]
        for (let j = col; j <= n; j++) {
          augmented[row][j] -= factor * augmented[col][j]
        }
      }
    }

    // Back substitution
    const y = new Array(n).fill(0)
    for (let i = n - 1; i >= 0; i--) {
      let sum = augmented[i][n]
      for (let j = i + 1; j < n; j++) {
        sum -= augmented[i][j] * y[j]
      }
      y[i] = Math.abs(augmented[i][i]) > 1e-12 ? sum / augmented[i][i] : 0
    }

    // Normalize
    norm = Math.sqrt(y.reduce((s, v) => s + v * v, 0))
    if (norm < 1e-12) break

    const newX = y.map((v) => v / norm)

    // Check convergence
    const diff = Math.sqrt(newX.reduce((s, v, i) => s + (v - x[i]) ** 2, 0))
    x = newX

    if (diff < 1e-10) break
  }

  return x
}

/**
 * Compute image-to-world homography from correspondences
 */
function computeHomography(correspondences: Correspondence[]): number[][] {
  if (correspondences.length < 4) {
    throw new Error('Need at least 4 correspondences')
  }

  // Normalize points for numerical stability
  // Compute centroids and scales
  let meanU = 0, meanV = 0, meanX = 0, meanY = 0
  for (const { image, world } of correspondences) {
    meanU += image.u
    meanV += image.v
    meanX += world.x
    meanY += world.y
  }
  const n = correspondences.length
  meanU /= n
  meanV /= n
  meanX /= n
  meanY /= n

  let scaleImage = 0, scaleWorld = 0
  for (const { image, world } of correspondences) {
    scaleImage += Math.sqrt((image.u - meanU) ** 2 + (image.v - meanV) ** 2)
    scaleWorld += Math.sqrt((world.x - meanX) ** 2 + (world.y - meanY) ** 2)
  }
  scaleImage = (n * Math.sqrt(2)) / scaleImage
  scaleWorld = (n * Math.sqrt(2)) / scaleWorld

  // Normalization transforms
  const Timage: number[][] = [
    [scaleImage, 0, -scaleImage * meanU],
    [0, scaleImage, -scaleImage * meanV],
    [0, 0, 1],
  ]
  const Tworld: number[][] = [
    [scaleWorld, 0, -scaleWorld * meanX],
    [0, scaleWorld, -scaleWorld * meanY],
    [0, 0, 1],
  ]
  const TworldInv: number[][] = [
    [1 / scaleWorld, 0, meanX],
    [0, 1 / scaleWorld, meanY],
    [0, 0, 1],
  ]

  // Normalize correspondences
  const normalizedCorrespondences: Correspondence[] = correspondences.map(({ image, world }) => ({
    image: {
      u: scaleImage * (image.u - meanU),
      v: scaleImage * (image.v - meanV),
    },
    world: {
      x: scaleWorld * (world.x - meanX),
      y: scaleWorld * (world.y - meanY),
    },
  }))

  // Build DLT matrix and solve
  const A = buildDLTMatrix(normalizedCorrespondences)
  const h = solveNullSpace(A)

  // Reshape to 3x3
  const Hnorm: number[][] = [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], h[8]],
  ]

  // Denormalize: H = Tworld^-1 * Hnorm * Timage
  // H = TworldInv * Hnorm * Timage
  const temp: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        temp[i][j] += Hnorm[i][k] * Timage[k][j]
      }
    }
  }

  const H: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        H[i][j] += TworldInv[i][k] * temp[k][j]
      }
    }
  }

  // Normalize so H[2][2] = 1
  const scale = H[2][2]
  if (Math.abs(scale) > 1e-10) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        H[i][j] /= scale
      }
    }
  }

  return H
}

/**
 * Apply homography to project image point to world
 */
function applyHomography(H: number[][], image: ImagePoint): WorldPoint {
  const u = image.u
  const v = image.v

  const w = H[2][0] * u + H[2][1] * v + H[2][2]
  const x = (H[0][0] * u + H[0][1] * v + H[0][2]) / w
  const y = (H[1][0] * u + H[1][1] * v + H[1][2]) / w

  return { x, y }
}

/**
 * Evaluate homography quality
 */
function evaluateHomography(
  H: number[][],
  correspondences: Correspondence[]
): { error: number; passRate: number; errors: number[] } {
  const errors: number[] = []

  for (const { image, world } of correspondences) {
    const projected = applyHomography(H, image)
    const error = Math.sqrt((projected.x - world.x) ** 2 + (projected.y - world.y) ** 2)
    errors.push(error)
  }

  const mean = errors.reduce((a, b) => a + b, 0) / errors.length
  const passRate = errors.filter((e) => e < 0.5).length / errors.length

  return { error: mean, passRate, errors }
}

/**
 * Refine homography using Nelder-Mead optimization
 */
function refineHomography(
  H: number[][],
  correspondences: Correspondence[]
): number[][] {
  // Flatten H to parameters (skip H[2][2] which is fixed to 1)
  const initial = [
    H[0][0], H[0][1], H[0][2],
    H[1][0], H[1][1], H[1][2],
    H[2][0], H[2][1],
  ]

  const costFn = (params: number[]): number => {
    const Htest: number[][] = [
      [params[0], params[1], params[2]],
      [params[3], params[4], params[5]],
      [params[6], params[7], 1],
    ]

    let totalError = 0
    for (const { image, world } of correspondences) {
      const projected = applyHomography(Htest, image)
      totalError += (projected.x - world.x) ** 2 + (projected.y - world.y) ** 2
    }

    return totalError / correspondences.length
  }

  // Generate start points
  const startPoints = [initial]
  for (let i = 0; i < 10; i++) {
    startPoints.push(initial.map((v) => v * (1 + (Math.random() - 0.5) * 0.2)))
  }

  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 500,
    tolerance: 1e-10,
  })

  return [
    [result.params[0], result.params[1], result.params[2]],
    [result.params[3], result.params[4], result.params[5]],
    [result.params[6], result.params[7], 1],
  ]
}

/**
 * Create correspondences from annotations
 */
function annotationsToCorrespondences(
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>
): Correspondence[] {
  return annotations.map(({ annotation, detection }) => ({
    image: {
      u: ((detection.bbox.left + detection.bbox.right) / 2) * 1920,
      v: detection.bbox.bottom * 1080,
    },
    world: {
      x: annotation.groundPosition.x,
      y: annotation.groundPosition.y,
    },
  }))
}

async function main() {
  const program = new Command()
    .name('solve-image-to-world')
    .description('Compute image-to-world homography for ground plane projection')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-c, --camera <id>', 'Camera ID (camera1 or camera2)', 'camera1')
    .option('-o, --output <file>', 'Output JSON file')
    .option('--refine', 'Refine homography with Nelder-Mead')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Image-to-World Homography Solver ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations\n`)

  const annotations = filterAnnotations(groundTruths.annotations, opts.camera, ['certain'])
  console.log(`${opts.camera}: ${annotations.length} 'certain' annotations\n`)

  // Create correspondences
  const correspondences = annotationsToCorrespondences(annotations)

  // Compute homography
  console.log('Computing homography using DLT...')
  let H = computeHomography(correspondences)

  let evalResult = evaluateHomography(H, correspondences)
  console.log(`  Initial mean error: ${evalResult.error.toFixed(3)}m`)
  console.log(`  Initial pass rate: ${(evalResult.passRate * 100).toFixed(1)}%`)

  // Refine if requested
  if (opts.refine) {
    console.log('\nRefining with Nelder-Mead...')
    H = refineHomography(H, correspondences)
    evalResult = evaluateHomography(H, correspondences)
    console.log(`  Refined mean error: ${evalResult.error.toFixed(3)}m`)
    console.log(`  Refined pass rate: ${(evalResult.passRate * 100).toFixed(1)}%`)
  }

  // Print homography
  console.log('\n--- Homography Matrix ---')
  console.log('H = [')
  for (const row of H) {
    console.log(`  [${row.map((v) => v.toFixed(8)).join(', ')}],`)
  }
  console.log(']')

  // Show sample projections
  console.log('\n--- Sample Projections ---')
  console.log('Image Point | Projected | Ground Truth | Error')
  for (let i = 0; i < Math.min(10, correspondences.length); i++) {
    const { image, world } = correspondences[i]
    const projected = applyHomography(H, image)
    const error = Math.sqrt((projected.x - world.x) ** 2 + (projected.y - world.y) ** 2)
    console.log(
      `(${image.u.toFixed(0)}, ${image.v.toFixed(0)}) | (${projected.x.toFixed(2)}, ${projected.y.toFixed(2)}) | (${world.x.toFixed(2)}, ${world.y.toFixed(2)}) | ${error.toFixed(3)}m`
    )
  }

  // Error distribution
  console.log('\n--- Error Distribution ---')
  const sorted = [...evalResult.errors].sort((a, b) => a - b)
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p90 = sorted[Math.floor(sorted.length * 0.9)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  console.log(`  Median: ${p50.toFixed(3)}m`)
  console.log(`  90th percentile: ${p90.toFixed(3)}m`)
  console.log(`  95th percentile: ${p95.toFixed(3)}m`)
  console.log(`  Max: ${sorted[sorted.length - 1].toFixed(3)}m`)

  // Save output
  if (opts.output) {
    const result: HomographyResult = {
      H,
      error: evalResult.error,
      passRate: evalResult.passRate,
      sampleErrors: evalResult.errors,
    }
    writeFileSync(opts.output, JSON.stringify(result, null, 2))
    console.log(`\nSaved to ${opts.output}`)
  }

  // Print usage code
  console.log('\n--- Usage Code ---')
  console.log(`
// Project image point to world
function projectToWorld(u: number, v: number): { x: number; y: number } {
  const H = ${JSON.stringify(H)};
  const w = H[2][0] * u + H[2][1] * v + H[2][2];
  return {
    x: (H[0][0] * u + H[0][1] * v + H[0][2]) / w,
    y: (H[1][0] * u + H[1][1] * v + H[1][2]) / w,
  };
}
`)
}

main().catch(console.error)
