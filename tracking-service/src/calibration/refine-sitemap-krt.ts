#!/usr/bin/env node
/**
 * Refine Sitemap K/R/T Parameters
 *
 * Starts with K/R/T derived from sitemap physical parameters and refines them
 * using Nelder-Mead optimization against ground truth.
 *
 * Parameters to optimize:
 * - Azimuth adjustment (±20°)
 * - Elevation adjustment (±20°)
 * - FOV adjustment (±20°)
 * - Position X adjustment (±2m)
 * - Position Y adjustment (±2m)
 */

import { Command } from 'commander'
import {
  loadGroundTruths,
  filterAnnotations,
} from './utils.js'
import { nelderMead } from './nelder-mead.js'
import * as fs from 'fs/promises'

interface SitemapCamera {
  id: string
  name: string
  position: { x: number; y: number }
  azimuth: number
  elevation: number
  height: number
  fieldOfView: number
}

interface Correspondence {
  imageX: number
  imageY: number
  gtX: number
  gtY: number
}

function deriveK(fov: number, width: number = 1920, height: number = 1080): number[][] {
  const fovRad = fov * Math.PI / 180
  const f = (width / 2) / Math.tan(fovRad / 2)
  return [
    [f, 0, width / 2],
    [0, f, height / 2],
    [0, 0, 1]
  ]
}

function deriveR(azimuth: number, elevation: number): number[][] {
  const azRad = azimuth * Math.PI / 180
  const elRad = elevation * Math.PI / 180
  const cosEl = Math.cos(elRad)
  const sinEl = Math.sin(elRad)

  const lookDir = [
    Math.sin(azRad) * cosEl,
    Math.cos(azRad) * cosEl,
    -sinEl
  ]

  const worldUp = [0, 0, 1]
  const right = [
    worldUp[1] * lookDir[2] - worldUp[2] * lookDir[1],
    worldUp[2] * lookDir[0] - worldUp[0] * lookDir[2],
    worldUp[0] * lookDir[1] - worldUp[1] * lookDir[0]
  ]
  const rightLen = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2)
  right[0] /= rightLen; right[1] /= rightLen; right[2] /= rightLen

  const down = [
    lookDir[1] * right[2] - lookDir[2] * right[1],
    lookDir[2] * right[0] - lookDir[0] * right[2],
    lookDir[0] * right[1] - lookDir[1] * right[0]
  ]
  const downLen = Math.sqrt(down[0] ** 2 + down[1] ** 2 + down[2] ** 2)
  down[0] /= downLen; down[1] /= downLen; down[2] /= downLen

  return [
    [right[0], right[1], right[2]],
    [down[0], down[1], down[2]],
    [lookDir[0], lookDir[1], lookDir[2]]
  ]
}

function deriveT(R: number[][], position: { x: number; y: number }, height: number): number[] {
  const P = [position.x, position.y, height]
  return [
    -(R[0][0] * P[0] + R[0][1] * P[1] + R[0][2] * P[2]),
    -(R[1][0] * P[0] + R[1][1] * P[1] + R[1][2] * P[2]),
    -(R[2][0] * P[0] + R[2][1] * P[1] + R[2][2] * P[2])
  ]
}

function projectImageToGround(
  u: number, v: number,
  K: number[][], R: number[][], T: number[]
): { x: number; y: number; valid: boolean } {
  const fx = K[0][0], fy = K[1][1], cx = K[0][2], cy = K[1][2]
  const x_norm = (u - cx) / fx
  const y_norm = (v - cy) / fy
  const ray_cam = [x_norm, y_norm, 1]

  const ray_world = [
    R[0][0] * ray_cam[0] + R[1][0] * ray_cam[1] + R[2][0] * ray_cam[2],
    R[0][1] * ray_cam[0] + R[1][1] * ray_cam[1] + R[2][1] * ray_cam[2],
    R[0][2] * ray_cam[0] + R[1][2] * ray_cam[1] + R[2][2] * ray_cam[2]
  ]

  const cam_world = [
    -(R[0][0] * T[0] + R[1][0] * T[1] + R[2][0] * T[2]),
    -(R[0][1] * T[0] + R[1][1] * T[1] + R[2][1] * T[2]),
    -(R[0][2] * T[0] + R[1][2] * T[1] + R[2][2] * T[2])
  ]

  if (Math.abs(ray_world[2]) < 1e-6) return { x: 0, y: 0, valid: false }
  const t = -cam_world[2] / ray_world[2]
  if (t < 0) return { x: 0, y: 0, valid: false }

  return {
    x: cam_world[0] + t * ray_world[0],
    y: cam_world[1] + t * ray_world[1],
    valid: true
  }
}

function evaluateParams(
  correspondences: Correspondence[],
  azimuth: number, elevation: number, fov: number,
  posX: number, posY: number, height: number
): { passRate: number; meanError: number } {
  const K = deriveK(fov)
  const R = deriveR(azimuth, elevation)
  const T = deriveT(R, { x: posX, y: posY }, height)

  let passCount = 0
  let totalError = 0
  let validCount = 0

  for (const { imageX, imageY, gtX, gtY } of correspondences) {
    const projected = projectImageToGround(imageX, imageY, K, R, T)
    if (projected.valid) {
      const error = Math.sqrt((projected.x - gtX) ** 2 + (projected.y - gtY) ** 2)
      totalError += error
      if (error < 0.5) passCount++
      validCount++
    }
  }

  if (validCount === 0) return { passRate: 0, meanError: Infinity }

  return {
    passRate: passCount / validCount,
    meanError: totalError / validCount
  }
}

async function main() {
  const program = new Command()
    .name('refine-sitemap-krt')
    .description('Refine K/R/T by optimizing sitemap physical parameters')
    .requiredOption('-s, --sitemap <file>', 'Path to sitemap JSON')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-c, --camera <id>', 'Camera ID to optimize (default: all)')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Refining K/R/T from Sitemap Parameters ===\n')

  const sitemapContent = await fs.readFile(opts.sitemap, 'utf-8')
  const sitemap = JSON.parse(sitemapContent)
  const cameras: SitemapCamera[] = sitemap.cameras

  const groundTruths = await loadGroundTruths(opts.groundTruth)

  const camerasToProcess = opts.camera
    ? cameras.filter(c => c.id === opts.camera)
    : cameras

  for (const cam of camerasToProcess) {
    console.log(`--- ${cam.id} (${cam.name}) ---`)
    console.log(`Initial: Azimuth=${cam.azimuth}°, Elevation=${cam.elevation}°, FOV=${cam.fieldOfView}°`)
    console.log(`Position: (${cam.position.x}, ${cam.position.y}) at height ${cam.height}m\n`)

    // Get correspondences
    const annotations = filterAnnotations(groundTruths.annotations, cam.id, ['certain'])
    const correspondences: Correspondence[] = annotations.map(({ annotation, detection }) => ({
      imageX: ((detection.bbox.left + detection.bbox.right) / 2) * 1920,
      imageY: detection.bbox.bottom * 1080,
      gtX: annotation.groundPosition.x,
      gtY: annotation.groundPosition.y
    }))

    if (correspondences.length < 10) {
      console.log('Not enough correspondences for optimization\n')
      continue
    }

    // Initial evaluation
    const initial = evaluateParams(
      correspondences,
      cam.azimuth, cam.elevation, cam.fieldOfView,
      cam.position.x, cam.position.y, cam.height
    )
    console.log(`Initial accuracy: ${(initial.passRate * 100).toFixed(1)}% pass, ${initial.meanError.toFixed(3)}m error`)

    // Optimize using Nelder-Mead
    // Parameters: [azimuth_delta, elevation_delta, fov_delta, pos_x_delta, pos_y_delta]
    const costFunction = (params: number[]): number => {
      const [azDelta, elDelta, fovDelta, pxDelta, pyDelta] = params

      // Apply bounds
      const azimuth = cam.azimuth + azDelta
      const elevation = cam.elevation + elDelta
      const fov = Math.max(20, Math.min(120, cam.fieldOfView + fovDelta))
      const posX = cam.position.x + pxDelta
      const posY = cam.position.y + pyDelta

      if (elevation < 0 || elevation > 80) return 1e9
      if (fov < 20 || fov > 120) return 1e9

      const { meanError, passRate } = evaluateParams(
        correspondences, azimuth, elevation, fov, posX, posY, cam.height
      )

      // Optimize for mean error, with penalty for low pass rate
      return meanError + (1 - passRate) * 2
    }

    console.log('\nOptimizing...')

    // Grid search first to find good starting region
    let bestStart = [0, 0, 0, 0, 0]
    let bestStartCost = costFunction(bestStart)

    for (let azDelta = -30; azDelta <= 30; azDelta += 10) {
      for (let elDelta = -20; elDelta <= 20; elDelta += 10) {
        const cost = costFunction([azDelta, elDelta, 0, 0, 0])
        if (cost < bestStartCost) {
          bestStartCost = cost
          bestStart = [azDelta, elDelta, 0, 0, 0]
        }
      }
    }

    console.log(`Grid search found: azimuth+${bestStart[0]}°, elevation+${bestStart[1]}°`)

    // Fine-tune with Nelder-Mead
    const result = nelderMead(costFunction, bestStart, {
      maxIterations: 500,
      tolerance: 1e-6,
    })

    const [azDelta, elDelta, fovDelta, pxDelta, pyDelta] = result.params
    const finalAz = cam.azimuth + azDelta
    const finalEl = cam.elevation + elDelta
    const finalFov = Math.max(20, Math.min(120, cam.fieldOfView + fovDelta))
    const finalPx = cam.position.x + pxDelta
    const finalPy = cam.position.y + pyDelta

    const final = evaluateParams(
      correspondences,
      finalAz, finalEl, finalFov,
      finalPx, finalPy, cam.height
    )

    console.log(`\nOptimized parameters:`)
    console.log(`  Azimuth: ${cam.azimuth}° → ${finalAz.toFixed(1)}° (${azDelta >= 0 ? '+' : ''}${azDelta.toFixed(1)}°)`)
    console.log(`  Elevation: ${cam.elevation}° → ${finalEl.toFixed(1)}° (${elDelta >= 0 ? '+' : ''}${elDelta.toFixed(1)}°)`)
    console.log(`  FOV: ${cam.fieldOfView}° → ${finalFov.toFixed(1)}° (${fovDelta >= 0 ? '+' : ''}${fovDelta.toFixed(1)}°)`)
    console.log(`  Position X: ${cam.position.x} → ${finalPx.toFixed(2)}m (${pxDelta >= 0 ? '+' : ''}${pxDelta.toFixed(2)}m)`)
    console.log(`  Position Y: ${cam.position.y} → ${finalPy.toFixed(2)}m (${pyDelta >= 0 ? '+' : ''}${pyDelta.toFixed(2)}m)`)

    console.log(`\nFinal accuracy: ${(final.passRate * 100).toFixed(1)}% pass, ${final.meanError.toFixed(3)}m error`)
    console.log(`Improvement: ${(final.passRate * 100 - initial.passRate * 100).toFixed(1)}% pass rate, ${(initial.meanError - final.meanError).toFixed(3)}m error`)

    // Generate final K/R/T
    const K = deriveK(finalFov)
    const R = deriveR(finalAz, finalEl)
    const T = deriveT(R, { x: finalPx, y: finalPy }, cam.height)

    console.log(`\n// Optimized K/R/T for ${cam.id}`)
    console.log(`// Derived from sitemap with optimized: az=${finalAz.toFixed(1)}°, el=${finalEl.toFixed(1)}°, fov=${finalFov.toFixed(1)}°`)
    console.log(`${cam.id}: {`)
    console.log(`  K: [`)
    console.log(`    [${K[0][0].toFixed(0)}, 0, 0],`)
    console.log(`    [0, ${K[1][1].toFixed(0)}, 0],`)
    console.log(`    [0, 0, 1],`)
    console.log(`  ],`)
    console.log(`  R: [`)
    console.log(`    [${R[0].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`    [${R[1].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`    [${R[2].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  ],`)
    console.log(`  T: [${T.map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  center: [960, 540],`)
    console.log(`  scale: 1,`)
    console.log(`},`)

    console.log()
  }
}

main().catch(console.error)
