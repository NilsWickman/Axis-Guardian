#!/usr/bin/env node
/**
 * PnP (Perspective-n-Point) Solver for Camera Calibration
 *
 * Solves for camera pose (R, T) given 2D-3D correspondences using
 * the DLT (Direct Linear Transform) method followed by refinement.
 *
 * This is more robust than generic optimization because it uses
 * the geometric structure of the projection problem.
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import {
  loadGroundTruths,
  filterAnnotations,
  rodriguezToMatrix,
  matrixToRodriguez,
  type Vector3,
} from './utils.js'
import { multiStartNelderMead } from './nelder-mead.js'

interface Correspondence {
  imageX: number
  imageY: number
  worldX: number
  worldY: number
  worldZ: number  // Always 0 for ground plane
}

interface CameraResult {
  cameraId: string
  K: number[][]
  R: number[][]
  T: Vector3
  center: [number, number]
  stats: {
    samples: number
    meanError: number
    passRate: number
  }
}

/**
 * Normalize 2D points for numerical stability
 */
function normalizePoints2D(points: { x: number; y: number }[]): {
  normalized: { x: number; y: number }[]
  T: number[][]
} {
  let meanX = 0, meanY = 0
  for (const p of points) {
    meanX += p.x
    meanY += p.y
  }
  meanX /= points.length
  meanY /= points.length

  let scale = 0
  for (const p of points) {
    scale += Math.sqrt((p.x - meanX) ** 2 + (p.y - meanY) ** 2)
  }
  scale = (Math.sqrt(2) * points.length) / scale

  const normalized = points.map(p => ({
    x: scale * (p.x - meanX),
    y: scale * (p.y - meanY),
  }))

  const T = [
    [scale, 0, -scale * meanX],
    [0, scale, -scale * meanY],
    [0, 0, 1],
  ]

  return { normalized, T }
}

/**
 * Normalize 3D points for numerical stability
 */
function normalizePoints3D(points: { x: number; y: number; z: number }[]): {
  normalized: { x: number; y: number; z: number }[]
  T: number[][]
} {
  let meanX = 0, meanY = 0, meanZ = 0
  for (const p of points) {
    meanX += p.x
    meanY += p.y
    meanZ += p.z
  }
  meanX /= points.length
  meanY /= points.length
  meanZ /= points.length

  let scale = 0
  for (const p of points) {
    scale += Math.sqrt((p.x - meanX) ** 2 + (p.y - meanY) ** 2 + (p.z - meanZ) ** 2)
  }
  scale = (Math.sqrt(3) * points.length) / scale

  const normalized = points.map(p => ({
    x: scale * (p.x - meanX),
    y: scale * (p.y - meanY),
    z: scale * (p.z - meanZ),
  }))

  const T = [
    [scale, 0, 0, -scale * meanX],
    [0, scale, 0, -scale * meanY],
    [0, 0, scale, -scale * meanZ],
    [0, 0, 0, 1],
  ]

  return { normalized, T }
}

/**
 * Solve homogeneous linear system Ax = 0 using SVD (power iteration)
 */
function solveHomogeneous(A: number[][]): number[] {
  const m = A.length
  const n = A[0].length

  // Compute A^T * A
  const AtA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < m; k++) {
        AtA[i][j] += A[k][i] * A[k][j]
      }
    }
  }

  // Power iteration to find smallest eigenvector
  let x = Array(n).fill(1 / Math.sqrt(n))

  for (let iter = 0; iter < 100; iter++) {
    // Solve AtA * y = x (inverse iteration for smallest eigenvalue)
    // Use Gaussian elimination
    const aug = AtA.map((row, i) => [...row, x[i]])

    // Forward elimination
    for (let col = 0; col < n; col++) {
      let maxRow = col
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
      }
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

      if (Math.abs(aug[col][col]) < 1e-12) continue

      for (let row = col + 1; row < n; row++) {
        const f = aug[row][col] / aug[col][col]
        for (let j = col; j <= n; j++) {
          aug[row][j] -= f * aug[col][j]
        }
      }
    }

    // Back substitution
    const y = Array(n).fill(0)
    for (let i = n - 1; i >= 0; i--) {
      let sum = aug[i][n]
      for (let j = i + 1; j < n; j++) {
        sum -= aug[i][j] * y[j]
      }
      y[i] = Math.abs(aug[i][i]) > 1e-12 ? sum / aug[i][i] : 0
    }

    // Normalize
    const norm = Math.sqrt(y.reduce((s, v) => s + v * v, 0))
    if (norm < 1e-12) break
    x = y.map(v => v / norm)
  }

  return x
}

/**
 * Compute camera matrix P using DLT from 2D-3D correspondences
 */
function computeDLT(correspondences: Correspondence[], fx: number, center: [number, number]): {
  P: number[][]
  R: number[][]
  T: Vector3
} {
  const n = correspondences.length

  // Normalize points
  const imagePoints = correspondences.map(c => ({ x: c.imageX, y: c.imageY }))
  const worldPoints = correspondences.map(c => ({ x: c.worldX, y: c.worldY, z: c.worldZ }))

  const { normalized: normImg, T: T2d } = normalizePoints2D(imagePoints)
  const { normalized: normWorld, T: T3d } = normalizePoints3D(worldPoints)

  // Build DLT matrix
  // For each correspondence: x × (P * X) = 0
  // This gives 2 equations per point
  const A: number[][] = []

  for (let i = 0; i < n; i++) {
    const X = normWorld[i].x
    const Y = normWorld[i].y
    const Z = normWorld[i].z
    const u = normImg[i].x
    const v = normImg[i].y

    // Row 1: [0, 0, 0, 0, -X, -Y, -Z, -1, v*X, v*Y, v*Z, v]
    A.push([0, 0, 0, 0, -X, -Y, -Z, -1, v * X, v * Y, v * Z, v])
    // Row 2: [X, Y, Z, 1, 0, 0, 0, 0, -u*X, -u*Y, -u*Z, -u]
    A.push([X, Y, Z, 1, 0, 0, 0, 0, -u * X, -u * Y, -u * Z, -u])
  }

  // Solve A * p = 0
  const p = solveHomogeneous(A)

  // Reshape to 3x4 matrix
  const Pnorm: number[][] = [
    [p[0], p[1], p[2], p[3]],
    [p[4], p[5], p[6], p[7]],
    [p[8], p[9], p[10], p[11]],
  ]

  // Denormalize: P = T2d^-1 * Pnorm * T3d
  // T2d^-1
  const T2dInv = [
    [1 / T2d[0][0], 0, -T2d[0][2] / T2d[0][0]],
    [0, 1 / T2d[1][1], -T2d[1][2] / T2d[1][1]],
    [0, 0, 1],
  ]

  // Pnorm * T3d
  const PT3d: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        PT3d[i][j] += Pnorm[i][k] * T3d[k][j]
      }
    }
  }

  // T2dInv * PT3d
  const P: number[][] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 3; k++) {
        P[i][j] += T2dInv[i][k] * PT3d[k][j]
      }
    }
  }

  // Decompose P = K * [R | t]
  // P = [M | p4] where M = K * R
  const M = [[P[0][0], P[0][1], P[0][2]], [P[1][0], P[1][1], P[1][2]], [P[2][0], P[2][1], P[2][2]]]
  const p4 = [P[0][3], P[1][3], P[2][3]]

  // RQ decomposition of M to get K and R
  // For simplicity, use known K and solve for R
  const Kinv = [
    [1 / fx, 0, -center[0] / fx],
    [0, 1 / fx, -center[1] / fx],
    [0, 0, 1],
  ]

  // R = K^-1 * M (approximately, need to orthogonalize)
  const R_approx: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        R_approx[i][j] += Kinv[i][k] * M[k][j]
      }
    }
  }

  // Orthogonalize R using SVD approximation
  const R = orthogonalizeRotation(R_approx)

  // t = K^-1 * p4
  const t: Vector3 = [
    Kinv[0][0] * p4[0] + Kinv[0][1] * p4[1] + Kinv[0][2] * p4[2],
    Kinv[1][0] * p4[0] + Kinv[1][1] * p4[1] + Kinv[1][2] * p4[2],
    Kinv[2][0] * p4[0] + Kinv[2][1] * p4[1] + Kinv[2][2] * p4[2],
  ]

  // Convert from camera-centric t to world-centric T
  // t = -R * T, so T = -R^T * t
  const Rt = [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]]
  const T: Vector3 = [
    -(Rt[0][0] * t[0] + Rt[0][1] * t[1] + Rt[0][2] * t[2]),
    -(Rt[1][0] * t[0] + Rt[1][1] * t[1] + Rt[1][2] * t[2]),
    -(Rt[2][0] * t[0] + Rt[2][1] * t[1] + Rt[2][2] * t[2]),
  ]

  return { P, R, T }
}

/**
 * Orthogonalize a matrix to be a valid rotation matrix
 */
function orthogonalizeRotation(M: number[][]): number[][] {
  // Gram-Schmidt orthogonalization
  const r0 = [M[0][0], M[1][0], M[2][0]]
  const r1 = [M[0][1], M[1][1], M[2][1]]
  const r2 = [M[0][2], M[1][2], M[2][2]]

  // Normalize r0
  let len = Math.sqrt(r0[0] ** 2 + r0[1] ** 2 + r0[2] ** 2)
  const e0 = [r0[0] / len, r0[1] / len, r0[2] / len]

  // r1 - (r1.e0)e0
  const dot1 = r1[0] * e0[0] + r1[1] * e0[1] + r1[2] * e0[2]
  const u1 = [r1[0] - dot1 * e0[0], r1[1] - dot1 * e0[1], r1[2] - dot1 * e0[2]]
  len = Math.sqrt(u1[0] ** 2 + u1[1] ** 2 + u1[2] ** 2)
  const e1 = [u1[0] / len, u1[1] / len, u1[2] / len]

  // e2 = e0 × e1
  const e2 = [
    e0[1] * e1[2] - e0[2] * e1[1],
    e0[2] * e1[0] - e0[0] * e1[2],
    e0[0] * e1[1] - e0[1] * e1[0],
  ]

  // Ensure right-handed (det = 1)
  const det = e0[0] * (e1[1] * e2[2] - e1[2] * e2[1]) -
              e0[1] * (e1[0] * e2[2] - e1[2] * e2[0]) +
              e0[2] * (e1[0] * e2[1] - e1[1] * e2[0])

  if (det < 0) {
    e2[0] = -e2[0]
    e2[1] = -e2[1]
    e2[2] = -e2[2]
  }

  return [
    [e0[0], e1[0], e2[0]],
    [e0[1], e1[1], e2[1]],
    [e0[2], e1[2], e2[2]],
  ]
}

/**
 * Project image point to ground plane using R, T, K
 */
function projectToGround(
  imageX: number,
  imageY: number,
  K: number[][],
  R: number[][],
  T: Vector3,
  center: [number, number]
): { x: number; y: number; valid: boolean } {
  const fx = K[0][0]
  const fy = K[1][1]
  const cx = center[0]
  const cy = center[1]

  // Normalized image coordinates
  const xn = (imageX - cx) / fx
  const yn = (imageY - cy) / fy

  // Ray in camera frame
  const rayC = [xn, yn, 1]

  // Transform to world frame: R^T * ray
  const Rt = [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]]
  const rayW = [
    Rt[0][0] * rayC[0] + Rt[0][1] * rayC[1] + Rt[0][2] * rayC[2],
    Rt[1][0] * rayC[0] + Rt[1][1] * rayC[1] + Rt[1][2] * rayC[2],
    Rt[2][0] * rayC[0] + Rt[2][1] * rayC[1] + Rt[2][2] * rayC[2],
  ]

  // Intersect with z=0
  if (Math.abs(rayW[2]) < 1e-10) return { x: 0, y: 0, valid: false }

  const t = -T[2] / rayW[2]
  if (t < 0) return { x: 0, y: 0, valid: false }

  return {
    x: T[0] + t * rayW[0],
    y: T[1] + t * rayW[1],
    valid: true,
  }
}

/**
 * Refine camera parameters using Nelder-Mead
 */
function refineParameters(
  correspondences: Correspondence[],
  initialR: number[][],
  initialT: Vector3,
  fx: number,
  center: [number, number]
): { R: number[][]; T: Vector3; fx: number } {
  const rodriguez = matrixToRodriguez(initialR)

  const costFn = (params: number[]): number => {
    const rod: Vector3 = [params[0], params[1], params[2]]
    const T: Vector3 = [params[3], params[4], params[5]]
    const f = params[6]

    if (f < 500 || f > 5000) return 1e9
    if (T[2] < 0.5 || T[2] > 10) return 1e9

    const R = rodriguezToMatrix(rod)
    const K = [[f, 0, center[0]], [0, f, center[1]], [0, 0, 1]]

    let totalErr = 0
    let count = 0

    for (const c of correspondences) {
      const proj = projectToGround(c.imageX, c.imageY, K, R, T, center)
      if (!proj.valid) {
        totalErr += 100
        continue
      }
      totalErr += (proj.x - c.worldX) ** 2 + (proj.y - c.worldY) ** 2
      count++
    }

    return count > 0 ? totalErr / count : 1e9
  }

  const initial = [...rodriguez, ...initialT, fx]
  const startPoints = [initial]

  // Add perturbations
  for (let i = 0; i < 50; i++) {
    startPoints.push([
      rodriguez[0] + (Math.random() - 0.5) * 0.5,
      rodriguez[1] + (Math.random() - 0.5) * 0.5,
      rodriguez[2] + (Math.random() - 0.5) * 0.5,
      initialT[0] + (Math.random() - 0.5) * 2,
      initialT[1] + (Math.random() - 0.5) * 2,
      Math.max(1, initialT[2] + (Math.random() - 0.5) * 1),
      fx + (Math.random() - 0.5) * 500,
    ])
  }

  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 2000,
    tolerance: 1e-10,
  })

  return {
    R: rodriguezToMatrix([result.params[0], result.params[1], result.params[2]]),
    T: [result.params[3], result.params[4], result.params[5]],
    fx: result.params[6],
  }
}

/**
 * Evaluate calibration quality
 */
function evaluate(
  correspondences: Correspondence[],
  K: number[][],
  R: number[][],
  T: Vector3,
  center: [number, number]
): { meanError: number; passRate: number } {
  const errors: number[] = []

  for (const c of correspondences) {
    const proj = projectToGround(c.imageX, c.imageY, K, R, T, center)
    if (proj.valid) {
      errors.push(Math.sqrt((proj.x - c.worldX) ** 2 + (proj.y - c.worldY) ** 2))
    } else {
      errors.push(100)
    }
  }

  return {
    meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
    passRate: errors.filter(e => e < 0.5).length / errors.length,
  }
}

async function main() {
  const program = new Command()
    .name('solve-pnp')
    .description('Solve camera pose using PnP algorithm')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file')
    .option('-v, --verbose', 'Show detailed progress')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== PnP Camera Calibration ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)
  console.log(`Room: ${groundTruths.room.width}m x ${groundTruths.room.height}m\n`)

  const results: CameraResult[] = []
  const center: [number, number] = [960, 540]

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---`)

    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])
    console.log(`  Annotations: ${annotations.length}`)

    const correspondences: Correspondence[] = annotations.map(({ annotation, detection }) => ({
      imageX: ((detection.bbox.left + detection.bbox.right) / 2) * 1920,
      imageY: detection.bbox.bottom * 1080,
      worldX: annotation.groundPosition.x,
      worldY: annotation.groundPosition.y,
      worldZ: 0,
    }))

    // Try multiple focal lengths and pick best
    let bestResult: { R: number[][]; T: Vector3; fx: number; stats: { meanError: number; passRate: number } } | null = null

    for (const fxInit of [1000, 1200, 1500, 1800, 2000, 2500]) {
      try {
        // Get initial estimate from DLT
        const dlt = computeDLT(correspondences, fxInit, center)

        if (opts.verbose) {
          console.log(`  DLT (fx=${fxInit}): T=(${dlt.T.map(v => v.toFixed(2)).join(', ')})`)
        }

        // Refine
        const refined = refineParameters(correspondences, dlt.R, dlt.T, fxInit, center)
        const K = [[refined.fx, 0, center[0]], [0, refined.fx, center[1]], [0, 0, 1]]
        const stats = evaluate(correspondences, K, refined.R, refined.T, center)

        if (opts.verbose) {
          console.log(`  Refined: fx=${refined.fx.toFixed(0)}, T=(${refined.T.map(v => v.toFixed(2)).join(', ')}), pass=${(stats.passRate*100).toFixed(1)}%`)
        }

        if (!bestResult || stats.passRate > bestResult.stats.passRate) {
          bestResult = { R: refined.R, T: refined.T, fx: refined.fx, stats }
        }
      } catch (e) {
        // Skip failed attempts
      }
    }

    if (bestResult) {
      const K = [[bestResult.fx, 0, center[0]], [0, bestResult.fx, center[1]], [0, 0, 1]]

      results.push({
        cameraId,
        K,
        R: bestResult.R,
        T: bestResult.T,
        center,
        stats: {
          samples: correspondences.length,
          meanError: bestResult.stats.meanError,
          passRate: bestResult.stats.passRate,
        },
      })

      console.log(`  Best: ${(bestResult.stats.passRate * 100).toFixed(1)}% pass, ${bestResult.stats.meanError.toFixed(3)}m error`)
      console.log(`  fx=${bestResult.fx.toFixed(0)}, T=(${bestResult.T.map(v => v.toFixed(2)).join(', ')})`)
    }
    console.log()
  }

  // Print code
  console.log('=== Code for camera-registry.ts ===\n')
  for (const r of results) {
    console.log(`// ${r.cameraId} - Direct sitemap coordinates`)
    console.log(`// Pass: ${(r.stats.passRate * 100).toFixed(1)}%, Error: ${r.stats.meanError.toFixed(3)}m`)
    console.log(`${r.cameraId}: {`)
    console.log(`  K: [`)
    for (const row of r.K) console.log(`    [${row.map(v => v.toFixed(2)).join(', ')}],`)
    console.log(`  ],`)
    console.log(`  R: [`)
    for (const row of r.R) console.log(`    [${row.map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  ],`)
    console.log(`  T: [${r.T.map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  center: [${r.center.join(', ')}],`)
    console.log(`  scale: 1,`)
    console.log(`},\n`)
  }

  if (opts.output) {
    writeFileSync(opts.output, JSON.stringify({ cameras: results }, null, 2))
    console.log(`Saved to ${opts.output}`)
  }
}

main().catch(console.error)
