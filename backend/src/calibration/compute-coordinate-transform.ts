#!/usr/bin/env node
/**
 * Compute Coordinate Transform
 *
 * Instead of re-solving K/R/T from scratch (which is ill-conditioned),
 * compute the affine transform that converts from the existing K/R/T
 * output coordinates to sitemap coordinates.
 *
 * This gives us a 2x3 affine matrix that can be composed with R to get
 * new R and T matrices that project directly to sitemap coordinates.
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
} from './utils.js'

interface Correspondence {
  rawX: number   // K/R/T output
  rawY: number
  gtX: number    // Sitemap ground truth
  gtY: number
}

/**
 * Fit affine transform using least squares
 * Maps (rawX, rawY) -> (gtX, gtY)
 *
 * gtX = a11*rawX + a12*rawY + a13
 * gtY = a21*rawX + a22*rawY + a23
 */
function fitAffine(correspondences: Correspondence[]): {
  A: number[][]  // 2x3 affine matrix [[a11,a12,a13], [a21,a22,a23]]
  error: number
} {
  const n = correspondences.length

  // Build system for X: [rawX, rawY, 1] * [a11, a12, a13]^T = gtX
  // Build system for Y: [rawX, rawY, 1] * [a21, a22, a23]^T = gtY

  const M: number[][] = []  // nx3 matrix
  const bX: number[] = []
  const bY: number[] = []

  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    M.push([rawX, rawY, 1])
    bX.push(gtX)
    bY.push(gtY)
  }

  // Solve using normal equations: (M^T M) a = M^T b
  const MtM: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const MtbX: number[] = [0, 0, 0]
  const MtbY: number[] = [0, 0, 0]

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        MtM[j][k] += M[i][j] * M[i][k]
      }
      MtbX[j] += M[i][j] * bX[i]
      MtbY[j] += M[i][j] * bY[i]
    }
  }

  // Solve using Cholesky
  const L: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = MtM[i][j]
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j]
    }
  }

  // Solve L y = b, then L^T x = y
  function solveCholesky(L: number[][], b: number[]): number[] {
    const y = [0, 0, 0]
    for (let i = 0; i < 3; i++) {
      let sum = b[i]
      for (let j = 0; j < i; j++) sum -= L[i][j] * y[j]
      y[i] = sum / L[i][i]
    }
    const x = [0, 0, 0]
    for (let i = 2; i >= 0; i--) {
      let sum = y[i]
      for (let j = i + 1; j < 3; j++) sum -= L[j][i] * x[j]
      x[i] = sum / L[i][i]
    }
    return x
  }

  const aX = solveCholesky(L, MtbX)
  const aY = solveCholesky(L, MtbY)

  const A = [aX, aY]

  // Compute error
  let totalError = 0
  for (const { rawX, rawY, gtX, gtY } of correspondences) {
    const predX = A[0][0] * rawX + A[0][1] * rawY + A[0][2]
    const predY = A[1][0] * rawX + A[1][1] * rawY + A[1][2]
    totalError += Math.sqrt((predX - gtX) ** 2 + (predY - gtY) ** 2)
  }

  return { A, error: totalError / n }
}

/**
 * Decompose affine matrix into rotation, scale, and translation
 */
function decomposeAffine(A: number[][]): {
  rotation: number  // angle in radians
  scaleX: number
  scaleY: number
  shear: number
  translateX: number
  translateY: number
} {
  const a = A[0][0], b = A[0][1], c = A[0][2]
  const d = A[1][0], e = A[1][1], f = A[1][2]

  // SVD-like decomposition
  // M = [[a,b],[d,e]] = R * S where R is rotation and S is scale/shear

  const scaleX = Math.sqrt(a * a + d * d)
  const scaleY = Math.sqrt(b * b + e * e)
  const rotation = Math.atan2(d, a)
  const shear = Math.atan2(a * b + d * e, a * e - b * d)

  return {
    rotation,
    scaleX,
    scaleY,
    shear,
    translateX: c,
    translateY: f,
  }
}

/**
 * Compose affine transform with existing R matrix to get new R
 * that projects directly to sitemap coordinates
 */
function composeWithRotation(
  A: number[][],
  R: number[][]
): { R_new: number[][]; T_new: Vector3 } {
  // The affine transform A maps 2D ground plane coordinates
  // A = [[a11, a12, tx], [a21, a22, ty]]
  //
  // We want new R' such that ground projection gives sitemap coords directly
  //
  // The ground plane projection from camera coords (after R*world + T) gives:
  // raw_x = ...some function of K*R*world_point...
  // raw_y = ...
  //
  // We want: sitemap_x = A[0] * [raw_x, raw_y, 1]^T
  //
  // This is a 2D post-transform, not a 3D rotation change.
  // We can incorporate it by modifying the top 2 rows of R and T.

  // For a proper composition, we need to understand the projection chain:
  // world_point -> R*world + T = camera_point
  // camera_point -> K*camera = image_point (homogeneous)
  // image_point -> inverse_project_to_ground = raw_ground_point
  // raw_ground_point -> A * raw_ground = sitemap_point

  // The cleanest way is to transform the output, not modify R directly.
  // But if we insist on modifying R, we need a 3D rotation that induces
  // the 2D affine transform on the ground plane.

  // Let's extract rotation angle from A
  const a11 = A[0][0], a12 = A[0][1]
  const a21 = A[1][0], a22 = A[1][1]

  // The 2x2 linear part is [[a11,a12],[a21,a22]]
  // Decompose into rotation * scale
  const det = a11 * a22 - a12 * a21
  const sign = det >= 0 ? 1 : -1

  // Polar decomposition: M = R * S
  // For our purposes, extract the rotation angle
  const angle = Math.atan2(a21 - a12, a11 + a22)  // Average rotation angle

  // Create a 3D rotation around Z axis
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const Rz: number[][] = [
    [cosA, -sinA, 0],
    [sinA, cosA, 0],
    [0, 0, 1],
  ]

  // New R = Rz * R (rotate the camera orientation)
  const R_new: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        R_new[i][j] += Rz[i][k] * R[k][j]
      }
    }
  }

  // Translation also needs adjustment
  const T_new: Vector3 = [A[0][2], A[1][2], 0]  // Will need refinement

  return { R_new, T_new }
}

async function main() {
  const program = new Command()
    .name('compute-coordinate-transform')
    .description('Compute affine transform from K/R/T coords to sitemap coords')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Coordinate Transform Analysis ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---\n`)

    const cal = registry.getCalibration(cameraId)!
    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])

    // Project through existing K/R/T
    const correspondences: Correspondence[] = []
    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      const result = projectImageToWorld(
        imageX, imageY,
        cal.K, cal.R,
        [cal.T[0], cal.T[1], cal.T[2]] as Vector3,
        cal.center as [number, number]
      )

      if (result.isValid) {
        correspondences.push({
          rawX: result.worldPoint.x,
          rawY: result.worldPoint.y,
          gtX: annotation.groundPosition.x,
          gtY: annotation.groundPosition.y,
        })
      }
    }

    console.log(`Correspondences: ${correspondences.length}`)

    // Show coordinate ranges
    const rawXs = correspondences.map(c => c.rawX)
    const rawYs = correspondences.map(c => c.rawY)
    const gtXs = correspondences.map(c => c.gtX)
    const gtYs = correspondences.map(c => c.gtY)

    console.log(`Raw X range: [${Math.min(...rawXs).toFixed(2)}, ${Math.max(...rawXs).toFixed(2)}]`)
    console.log(`Raw Y range: [${Math.min(...rawYs).toFixed(2)}, ${Math.max(...rawYs).toFixed(2)}]`)
    console.log(`GT X range:  [${Math.min(...gtXs).toFixed(2)}, ${Math.max(...gtXs).toFixed(2)}]`)
    console.log(`GT Y range:  [${Math.min(...gtYs).toFixed(2)}, ${Math.max(...gtYs).toFixed(2)}]`)

    // Fit affine transform
    const { A, error } = fitAffine(correspondences)

    console.log(`\nAffine transform (raw -> sitemap):`)
    console.log(`  sitemap_x = ${A[0][0].toFixed(4)}*raw_x + ${A[0][1].toFixed(4)}*raw_y + ${A[0][2].toFixed(4)}`)
    console.log(`  sitemap_y = ${A[1][0].toFixed(4)}*raw_x + ${A[1][1].toFixed(4)}*raw_y + ${A[1][2].toFixed(4)}`)
    console.log(`  Mean error: ${error.toFixed(3)}m`)

    // Decompose
    const decomp = decomposeAffine(A)
    console.log(`\nDecomposition:`)
    console.log(`  Rotation: ${(decomp.rotation * 180 / Math.PI).toFixed(1)}°`)
    console.log(`  Scale X: ${decomp.scaleX.toFixed(3)}`)
    console.log(`  Scale Y: ${decomp.scaleY.toFixed(3)}`)
    console.log(`  Shear: ${decomp.shear.toFixed(3)}`)
    console.log(`  Translation: (${decomp.translateX.toFixed(2)}, ${decomp.translateY.toFixed(2)})`)

    // Evaluate affine-only projection
    let passCount = 0
    for (const { rawX, rawY, gtX, gtY } of correspondences) {
      const predX = A[0][0] * rawX + A[0][1] * rawY + A[0][2]
      const predY = A[1][0] * rawX + A[1][1] * rawY + A[1][2]
      const err = Math.sqrt((predX - gtX) ** 2 + (predY - gtY) ** 2)
      if (err < 0.5) passCount++
    }
    console.log(`\nAffine-only pass rate: ${(passCount / correspondences.length * 100).toFixed(1)}%`)

    // Show how to modify K/R/T
    console.log(`\n--- Modified K/R/T (incorporating 2D affine) ---`)

    // The key insight: we can apply a 2D similarity transform (rotation + scale + translation)
    // to the ground plane coordinates by modifying R and T.
    //
    // For ground plane z=0, the projection simplifies. If we have:
    // [x, y] = project(K, R, T, world_point)
    //
    // We want: [x', y'] = A * [x, y, 1]^T
    //
    // This can be achieved by:
    // 1. Rotating the first two rows of R
    // 2. Scaling the first two rows of R
    // 3. Modifying T

    // Extract the 2x2 linear part of A
    const M = [[A[0][0], A[0][1]], [A[1][0], A[1][1]]]

    // For simplicity, let's just output the affine transform to be applied post-projection
    console.log(`\nTo use this, modify ground-plane.ts to apply after K/R/T projection:`)
    console.log(`const COORD_TRANSFORM_${cameraId.toUpperCase()} = {`)
    console.log(`  matrix: [[${A[0][0].toFixed(8)}, ${A[0][1].toFixed(8)}], [${A[1][0].toFixed(8)}, ${A[1][1].toFixed(8)}]],`)
    console.log(`  translation: [${A[0][2].toFixed(8)}, ${A[1][2].toFixed(8)}],`)
    console.log(`};`)

    console.log()
  }
}

main().catch(console.error)
