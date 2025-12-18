/**
 * Calculate theoretical maximum accuracy if we always pick the better camera
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

  let passed = 0
  let total = 0
  let totalError = 0
  let ceiling = 0  // Cases where no camera is accurate

  for (const ann of certainAnnotations) {
    const errors: Record<string, number> = {}

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

      errors[det.cameraId] = distance(result.worldPoint, ann.groundPosition)
    }

    if (Object.keys(errors).length === 0) continue
    total++

    // Always pick the best camera
    const bestError = Math.min(...Object.values(errors))
    totalError += bestError

    if (bestError < 0.5) {
      passed++
    } else {
      ceiling++
    }
  }

  console.log('=== THEORETICAL MAXIMUM (Best Camera Selection) ===\n')
  console.log(`Total annotations: ${total}`)
  console.log(`Passed (<0.5m): ${passed} (${(passed / total * 100).toFixed(1)}%)`)
  console.log(`Failed (>=0.5m): ${total - passed} (${((total - passed) / total * 100).toFixed(1)}%)`)
  console.log(`Average error: ${(totalError / total).toFixed(3)}m`)
  console.log()
  console.log(`Ceiling cases (no camera accurate): ${ceiling}`)
  console.log('These cases cannot be fixed without better calibration.')
}

main().catch(console.error)
