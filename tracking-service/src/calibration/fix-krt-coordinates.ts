#!/usr/bin/env node
/**
 * Fix K/R/T Coordinate System
 *
 * Derives K/R/T matrices that project directly to sitemap coordinates,
 * eliminating the need for polynomial world transforms.
 *
 * Approach:
 * 1. Use ground truth to establish 2D-3D correspondences
 * 2. Solve for camera extrinsics (R, T) that map to sitemap coords
 * 3. Refine intrinsics (K) to minimize reprojection error
 *
 * The key insight: we need R and T such that projecting through K*R
 * gives us sitemap (x, y) coordinates directly on the z=0 ground plane.
 */

import { Command } from 'commander'
import { writeFileSync } from 'fs'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  rodriguezToMatrix,
  matrixToRodriguez,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'
import { multiStartNelderMead } from './nelder-mead.js'

interface Correspondence {
  // Image coordinates (pixels)
  imageX: number
  imageY: number
  // Ground truth world coordinates (sitemap)
  worldX: number
  worldY: number
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
    medianError: number
  }
}

/**
 * Project image point to world using K, R, T
 */
function projectToWorld(
  imageX: number,
  imageY: number,
  K: number[][],
  R: number[][],
  T: Vector3,
  center: [number, number]
): { x: number; y: number; valid: boolean } {
  const cx = center[0]
  const cy = center[1]
  const fx = K[0][0]
  const fy = K[1][1]

  // Normalized image coordinates
  const xn = (imageX - cx) / fx
  const yn = (imageY - cy) / fy

  // Ray in camera frame: [xn, yn, 1]
  // Transform to world: R^T * ray (since R rotates world->camera, R^T rotates camera->world)
  const Rt = [
    [R[0][0], R[1][0], R[2][0]],
    [R[0][1], R[1][1], R[2][1]],
    [R[0][2], R[1][2], R[2][2]],
  ]

  const rayWorld = [
    Rt[0][0] * xn + Rt[0][1] * yn + Rt[0][2],
    Rt[1][0] * xn + Rt[1][1] * yn + Rt[1][2],
    Rt[2][0] * xn + Rt[2][1] * yn + Rt[2][2],
  ]

  // Camera position in world coordinates
  // T in standard convention is camera origin in world frame
  const camX = T[0]
  const camY = T[1]
  const camZ = T[2]

  // Find intersection with z=0 plane
  // Point on ray: P = cam + t * rayWorld
  // At z=0: camZ + t * rayWorld[2] = 0
  // t = -camZ / rayWorld[2]

  if (Math.abs(rayWorld[2]) < 1e-10) {
    return { x: 0, y: 0, valid: false }
  }

  const t = -camZ / rayWorld[2]
  if (t < 0) {
    // Intersection behind camera
    return { x: 0, y: 0, valid: false }
  }

  const worldX = camX + t * rayWorld[0]
  const worldY = camY + t * rayWorld[1]

  return { x: worldX, y: worldY, valid: true }
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
): { meanError: number; passRate: number; medianError: number; errors: number[] } {
  const errors: number[] = []

  for (const { imageX, imageY, worldX, worldY } of correspondences) {
    const proj = projectToWorld(imageX, imageY, K, R, T, center)
    if (!proj.valid) {
      errors.push(100) // Large penalty for invalid projection
      continue
    }
    const error = Math.sqrt((proj.x - worldX) ** 2 + (proj.y - worldY) ** 2)
    errors.push(error)
  }

  const sorted = [...errors].sort((a, b) => a - b)
  return {
    meanError: errors.reduce((a, b) => a + b, 0) / errors.length,
    passRate: errors.filter((e) => e < 0.5).length / errors.length,
    medianError: sorted[Math.floor(sorted.length / 2)],
    errors,
  }
}

/**
 * Cost function for optimization
 */
function createCostFn(correspondences: Correspondence[], center: [number, number]) {
  return (params: number[]): number => {
    // params: [rx, ry, rz, tx, ty, tz, fx]
    const rodriguez: Vector3 = [params[0], params[1], params[2]]
    const T: Vector3 = [params[3], params[4], params[5]]
    const fx = params[6]

    // Enforce constraints
    if (fx < 500 || fx > 5000) return 1e9  // Reasonable focal length range
    if (T[2] < 0.5 || T[2] > 10) return 1e9  // Camera height 0.5-10m
    if (T[0] < -5 || T[0] > 25) return 1e9  // X within extended room bounds
    if (T[1] < -5 || T[1] > 20) return 1e9  // Y within extended room bounds

    const R = rodriguezToMatrix(rodriguez)
    const K = [
      [fx, 0, center[0]],
      [0, fx, center[1]],
      [0, 0, 1],
    ]

    let totalError = 0
    let validCount = 0

    for (const { imageX, imageY, worldX, worldY } of correspondences) {
      const proj = projectToWorld(imageX, imageY, K, R, T, center)
      if (!proj.valid) {
        totalError += 100
        continue
      }
      totalError += (proj.x - worldX) ** 2 + (proj.y - worldY) ** 2
      validCount++
    }

    // Penalize if too few valid projections
    if (validCount < correspondences.length * 0.8) {
      totalError += (correspondences.length - validCount) * 10
    }

    return validCount > 0 ? totalError / validCount : 1e9
  }
}

/**
 * Estimate initial camera pose from sitemap configuration
 */
function estimateInitialPose(
  cameraId: string,
  correspondences: Correspondence[]
): { rodriguez: Vector3; T: Vector3; fx: number } {
  // Camera positions from sitemap
  const cameraPositions: Record<string, { x: number; y: number; z: number; azimuth: number; elevation: number }> = {
    camera1: { x: 16.22, y: 11.7, z: 1.68, azimuth: 197, elevation: 35 },
    camera2: { x: 0.9, y: 11.5, z: 1.7, azimuth: -25, elevation: 35 },
  }

  const pos = cameraPositions[cameraId] || { x: 9, y: 6, z: 3, azimuth: 0, elevation: 45 }

  // Convert azimuth/elevation to rotation matrix
  // Azimuth: rotation around Z axis (0 = looking along +X, 90 = looking along +Y)
  // Elevation: angle below horizontal

  const azRad = (pos.azimuth * Math.PI) / 180
  const elRad = (pos.elevation * Math.PI) / 180

  // Camera looks in direction determined by azimuth, tilted down by elevation
  // Build rotation matrix that transforms camera frame to world frame

  // Camera Z-axis (viewing direction) in world coordinates
  const lookX = Math.cos(azRad) * Math.cos(elRad)
  const lookY = Math.sin(azRad) * Math.cos(elRad)
  const lookZ = -Math.sin(elRad)

  // Camera Y-axis (down in image) - we want it to point roughly toward ground
  // Start with world -Z, then adjust
  const upWorld = [0, 0, 1]

  // Camera X-axis = Y_world × look (cross product)
  let camX = [
    upWorld[1] * lookZ - upWorld[2] * lookY,
    upWorld[2] * lookX - upWorld[0] * lookZ,
    upWorld[0] * lookY - upWorld[1] * lookX,
  ]
  let camXLen = Math.sqrt(camX[0] ** 2 + camX[1] ** 2 + camX[2] ** 2)
  camX = [camX[0] / camXLen, camX[1] / camXLen, camX[2] / camXLen]

  // Camera Y-axis = look × X
  const camY = [
    lookY * camX[2] - lookZ * camX[1],
    lookZ * camX[0] - lookX * camX[2],
    lookX * camX[1] - lookY * camX[0],
  ]

  // R transforms world to camera: R * world_point = camera_point
  // Rows of R are camera axes in world coordinates
  const R: number[][] = [
    [camX[0], camX[1], camX[2]],
    [camY[0], camY[1], camY[2]],
    [lookX, lookY, lookZ],
  ]

  const rodriguez = matrixToRodriguez(R)
  const T: Vector3 = [pos.x, pos.y, pos.z]

  // Estimate focal length from typical FOV (~66 degrees)
  const fovRad = (66 * Math.PI) / 180
  const fx = (1920 / 2) / Math.tan(fovRad / 2)

  return { rodriguez, T, fx }
}

/**
 * Calibrate a single camera
 */
function calibrateCamera(
  cameraId: string,
  correspondences: Correspondence[],
  verbose: boolean
): CameraResult {
  const center: [number, number] = [960, 540]

  // Get initial estimate
  const initial = estimateInitialPose(cameraId, correspondences)

  if (verbose) {
    console.log(`  Initial pose: T=(${initial.T.map((v) => v.toFixed(2)).join(', ')}), fx=${initial.fx.toFixed(0)}`)
  }

  // Create cost function
  const costFn = createCostFn(correspondences, center)

  // Generate start points around initial estimate
  const startPoints: number[][] = [
    [...initial.rodriguez, ...initial.T, initial.fx],
  ]

  // Add perturbations with wider search
  for (let i = 0; i < 100; i++) {
    const rotScale = 1.0  // Wider rotation search
    const posScale = 3
    const fxScale = 500
    startPoints.push([
      initial.rodriguez[0] + (Math.random() - 0.5) * rotScale,
      initial.rodriguez[1] + (Math.random() - 0.5) * rotScale,
      initial.rodriguez[2] + (Math.random() - 0.5) * rotScale,
      initial.T[0] + (Math.random() - 0.5) * posScale,
      initial.T[1] + (Math.random() - 0.5) * posScale,
      Math.max(1, initial.T[2] + (Math.random() - 0.5) * 2),
      Math.max(800, initial.fx + (Math.random() - 0.5) * fxScale),
    ])
  }

  // Also try some completely different starting points (grid search)
  for (const fx of [1000, 1500, 2000, 2500]) {
    for (const tz of [1.5, 2.5, 3.5]) {
      startPoints.push([
        initial.rodriguez[0],
        initial.rodriguez[1],
        initial.rodriguez[2],
        initial.T[0],
        initial.T[1],
        tz,
        fx,
      ])
    }
  }

  // Optimize
  const result = multiStartNelderMead(costFn, startPoints, {
    maxIterations: 2000,
    tolerance: 1e-10,
  })

  const rodriguez: Vector3 = [result.params[0], result.params[1], result.params[2]]
  const T: Vector3 = [result.params[3], result.params[4], result.params[5]]
  const fx = result.params[6]

  const R = rodriguezToMatrix(rodriguez)
  const K = [
    [fx, 0, center[0]],
    [0, fx, center[1]],
    [0, 0, 1],
  ]

  const stats = evaluate(correspondences, K, R, T, center)

  if (verbose) {
    console.log(`  Optimized: T=(${T.map((v) => v.toFixed(2)).join(', ')}), fx=${fx.toFixed(0)}`)
    console.log(`  Pass rate: ${(stats.passRate * 100).toFixed(1)}%, Mean error: ${stats.meanError.toFixed(3)}m`)
  }

  return {
    cameraId,
    K,
    R,
    T,
    center,
    stats: {
      samples: correspondences.length,
      meanError: stats.meanError,
      passRate: stats.passRate,
      medianError: stats.medianError,
    },
  }
}

/**
 * Cross-validate to check for overfitting
 */
function crossValidate(
  correspondences: Correspondence[],
  center: [number, number],
  folds: number = 5
): { meanError: number; passRate: number } {
  const n = correspondences.length
  const shuffled = [...correspondences].sort(() => Math.random() - 0.5)
  const foldSize = Math.floor(n / folds)

  const allErrors: number[] = []

  for (let fold = 0; fold < folds; fold++) {
    const testStart = fold * foldSize
    const testEnd = fold === folds - 1 ? n : (fold + 1) * foldSize

    const train = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)]
    const test = shuffled.slice(testStart, testEnd)

    // Quick optimization on training set
    const initial = { rodriguez: [0, 0, 0] as Vector3, T: [9, 6, 3] as Vector3, fx: 1500 }
    const costFn = createCostFn(train, center)

    const startPoints = [[...initial.rodriguez, ...initial.T, initial.fx]]
    for (let i = 0; i < 20; i++) {
      startPoints.push([
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        5 + Math.random() * 10,
        5 + Math.random() * 7,
        1.5 + Math.random() * 2,
        1200 + Math.random() * 800,
      ])
    }

    const result = multiStartNelderMead(costFn, startPoints, { maxIterations: 500 })

    const R = rodriguezToMatrix([result.params[0], result.params[1], result.params[2]])
    const T: Vector3 = [result.params[3], result.params[4], result.params[5]]
    const K = [
      [result.params[6], 0, center[0]],
      [0, result.params[6], center[1]],
      [0, 0, 1],
    ]

    // Evaluate on test set
    for (const { imageX, imageY, worldX, worldY } of test) {
      const proj = projectToWorld(imageX, imageY, K, R, T, center)
      if (proj.valid) {
        allErrors.push(Math.sqrt((proj.x - worldX) ** 2 + (proj.y - worldY) ** 2))
      }
    }
  }

  return {
    meanError: allErrors.reduce((a, b) => a + b, 0) / allErrors.length,
    passRate: allErrors.filter((e) => e < 0.5).length / allErrors.length,
  }
}

async function main() {
  const program = new Command()
    .name('fix-krt-coordinates')
    .description('Derive K/R/T matrices in sitemap coordinates')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-o, --output <file>', 'Output JSON file')
    .option('-v, --verbose', 'Show detailed progress')
    .option('--cross-validate', 'Run cross-validation')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Fix K/R/T Coordinate System ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations`)
  console.log(`Room: ${groundTruths.room.width}m x ${groundTruths.room.height}m\n`)

  const results: CameraResult[] = []

  for (const cameraId of ['camera1', 'camera2']) {
    console.log(`--- ${cameraId} ---`)

    const annotations = filterAnnotations(groundTruths.annotations, cameraId, ['certain'])
    console.log(`  Annotations: ${annotations.length}`)

    // Create correspondences
    const correspondences: Correspondence[] = annotations.map(({ annotation, detection }) => ({
      imageX: ((detection.bbox.left + detection.bbox.right) / 2) * 1920,
      imageY: detection.bbox.bottom * 1080,
      worldX: annotation.groundPosition.x,
      worldY: annotation.groundPosition.y,
    }))

    // Calibrate
    const result = calibrateCamera(cameraId, correspondences, opts.verbose || false)
    results.push(result)

    console.log(`  Results: ${(result.stats.passRate * 100).toFixed(1)}% pass rate, ${result.stats.meanError.toFixed(3)}m mean error`)

    // Cross-validation
    if (opts.crossValidate) {
      console.log('  Running cross-validation...')
      const cv = crossValidate(correspondences, result.center)
      console.log(`  CV: ${(cv.passRate * 100).toFixed(1)}% pass rate, ${cv.meanError.toFixed(3)}m mean error`)
    }

    console.log()
  }

  // Print code for camera-registry.ts
  console.log('=== Code for camera-registry.ts ===\n')
  for (const result of results) {
    console.log(`// ${result.cameraId} - Direct sitemap coordinates (no polynomial needed)`)
    console.log(`// Pass rate: ${(result.stats.passRate * 100).toFixed(1)}%, Mean error: ${result.stats.meanError.toFixed(3)}m`)
    console.log(`${result.cameraId}: {`)
    console.log(`  K: [`)
    for (const row of result.K) {
      console.log(`    [${row.map((v) => v.toFixed(2)).join(', ')}],`)
    }
    console.log(`  ],`)
    console.log(`  R: [`)
    for (const row of result.R) {
      console.log(`    [${row.map((v) => v.toFixed(8)).join(', ')}],`)
    }
    console.log(`  ],`)
    console.log(`  T: [${result.T.map((v) => v.toFixed(8)).join(', ')}],`)
    console.log(`  center: [${result.center.join(', ')}],`)
    console.log(`  scale: 1,`)
    console.log(`  // No worldTransform needed!`)
    console.log(`},`)
    console.log()
  }

  // Save output
  if (opts.output) {
    const output = {
      timestamp: new Date().toISOString(),
      groundTruthFile: opts.groundTruth,
      cameras: results,
    }
    writeFileSync(opts.output, JSON.stringify(output, null, 2))
    console.log(`Saved to ${opts.output}`)
  }
}

main().catch(console.error)
