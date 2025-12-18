/**
 * Analyze spatial distribution of failures
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'
import { getBBoxBottomCenter, projectWithKRT } from '../src/projection/ground-plane.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

async function main() {
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const content = readFileSync(groundTruthPath, 'utf-8')
  const groundTruth = JSON.parse(content)

  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  const cam1Config = sitemapConfig.cameras.find((c: any) => c.id === 'camera1')
  const cam2Config = sitemapConfig.cameras.find((c: any) => c.id === 'camera2')
  const cam1Params = cam1Config ? siteMapCameraToCameraParams(cam1Config as any) : null
  const cam2Params = cam2Config ? siteMapCameraToCameraParams(cam2Config as any) : null

  const certainAnnotations = groundTruth.annotations.filter((a: any) => a.confidence === 'certain')

  // Grid: divide room into 3x4 sections (6m x 3m each for 18m x 12m room)
  const grid: { pass: number; fail: number; errors: number[] }[][] = []
  for (let gy = 0; gy < 4; gy++) {
    grid[gy] = []
    for (let gx = 0; gx < 3; gx++) {
      grid[gy][gx] = { pass: 0, fail: 0, errors: [] }
    }
  }

  for (const ann of certainAnnotations) {
    const projections: Record<string, { x: number; y: number }> = {}

    for (const det of ann.linkedDetections) {
      const bbox = {
        x: det.bbox.left,
        y: det.bbox.top,
        width: det.bbox.right - det.bbox.left,
        height: det.bbox.bottom - det.bbox.top,
      }

      const camera = det.cameraId === 'camera1' ? cam1Params : cam2Params
      const normalizedId = cameraRegistry.normalizeCameraId(det.cameraId)
      const calibration = cameraRegistry.getCalibration(normalizedId)
      if (!calibration || !camera) continue

      const feetPos = getBBoxBottomCenter(bbox, camera, [], true, 1920, 1080, true)
      const result = projectWithKRT(feetPos.x, feetPos.y, calibration)
      if (!result.isValid) continue

      projections[det.cameraId] = result.worldPoint
    }

    const cameraIds = Object.keys(projections)
    if (cameraIds.length === 0) continue

    // Smart camera selection
    let finalPosition: { x: number; y: number }
    if (cameraIds.length === 1) {
      finalPosition = projections[cameraIds[0]]
    } else {
      const dist = distance(projections['camera1']!, projections['camera2']!)
      if (dist > 0.6) {
        finalPosition = projections['camera1'] || projections['camera2']!
      } else {
        finalPosition = {
          x: cameraIds.reduce((s, c) => s + projections[c].x, 0) / cameraIds.length,
          y: cameraIds.reduce((s, c) => s + projections[c].y, 0) / cameraIds.length,
        }
      }
    }

    const error = distance(finalPosition, ann.groundPosition)
    const gt = ann.groundPosition

    // Map to grid (0-18 for X, 0-12 for Y)
    const gx = Math.min(2, Math.floor(gt.x / 6))
    const gy = Math.min(3, Math.floor(gt.y / 3))

    if (error < 0.5) {
      grid[gy][gx].pass++
    } else {
      grid[gy][gx].fail++
    }
    grid[gy][gx].errors.push(error)
  }

  console.log('=== SPATIAL FAILURE DISTRIBUTION ===\n')
  console.log('Room: 18m x 12m, Grid: 6m x 3m cells')
  console.log('Y increases from bottom (entrance) to top (back)')
  console.log()

  console.log('       | 0-6m (left) | 6-12m (center) | 12-18m (right)')
  console.log('-------+-------------+----------------+----------------')

  const labels = ['0-3m (entrance)', '3-6m', '6-9m', '9-12m (back)']
  for (let gy = 0; gy < 4; gy++) {
    let row = labels[gy].padEnd(14) + '|'
    for (let gx = 0; gx < 3; gx++) {
      const cell = grid[gy][gx]
      const total = cell.pass + cell.fail
      const rate = total > 0 ? (cell.pass / total * 100).toFixed(0) : '-'
      const avgErr = cell.errors.length > 0
        ? (cell.errors.reduce((s, e) => s + e, 0) / cell.errors.length).toFixed(2)
        : '-'
      row += ` ${cell.pass}/${total} (${rate}%)`.padEnd(15) + '|'
    }
    console.log(row)
  }

  // Identify problem zones
  console.log('\n=== PROBLEM ZONES (< 70% pass rate) ===\n')
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const cell = grid[gy][gx]
      const total = cell.pass + cell.fail
      if (total === 0) continue

      const rate = cell.pass / total
      if (rate < 0.7) {
        console.log(`Zone (${gx * 6}-${(gx + 1) * 6}m, ${gy * 3}-${(gy + 1) * 3}m): ${(rate * 100).toFixed(1)}% pass, ${cell.fail} failures`)
      }
    }
  }
}

main().catch(console.error)
