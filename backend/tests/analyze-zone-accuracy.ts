/**
 * Analyze per-camera accuracy in different zones
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

  // Zones by X
  const zones = [
    { name: 'Left (0-6m)', xMin: 0, xMax: 6 },
    { name: 'Center (6-12m)', xMin: 6, xMax: 12 },
    { name: 'Right (12-18m)', xMin: 12, xMax: 18 },
  ]

  interface CamStats { pass: number; total: number; errors: number[] }
  const stats: Record<string, { cam1: CamStats; cam2: CamStats }> = {}

  for (const zone of zones) {
    stats[zone.name] = {
      cam1: { pass: 0, total: 0, errors: [] },
      cam2: { pass: 0, total: 0, errors: [] },
    }
  }

  for (const ann of certainAnnotations) {
    const gt = ann.groundPosition
    const zone = zones.find(z => gt.x >= z.xMin && gt.x < z.xMax)
    if (!zone) continue

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

      const error = distance(result.worldPoint, ann.groundPosition)
      const camStats = det.cameraId === 'camera1' ? stats[zone.name].cam1 : stats[zone.name].cam2
      camStats.total++
      camStats.errors.push(error)
      if (error < 0.5) camStats.pass++
    }
  }

  console.log('=== PER-ZONE CAMERA ACCURACY ===\n')
  console.log('Zone                | Camera1          | Camera2          | Better')
  console.log('--------------------|------------------|------------------|--------')

  for (const zone of zones) {
    const s = stats[zone.name]
    const cam1Rate = s.cam1.total > 0 ? s.cam1.pass / s.cam1.total : 0
    const cam2Rate = s.cam2.total > 0 ? s.cam2.pass / s.cam2.total : 0

    const cam1Str = s.cam1.total > 0
      ? `${s.cam1.pass}/${s.cam1.total} (${(cam1Rate * 100).toFixed(0)}%)`
      : 'N/A'
    const cam2Str = s.cam2.total > 0
      ? `${s.cam2.pass}/${s.cam2.total} (${(cam2Rate * 100).toFixed(0)}%)`
      : 'N/A'

    const better = cam1Rate > cam2Rate ? 'Camera1' : cam2Rate > cam1Rate ? 'Camera2' : 'Tie'

    console.log(`${zone.name.padEnd(19)} | ${cam1Str.padEnd(16)} | ${cam2Str.padEnd(16)} | ${better}`)
  }

  // Now calculate optimal per-zone camera selection
  console.log('\n=== OPTIMAL ZONE-BASED SELECTION ===\n')

  let totalPassed = 0
  let totalCount = 0

  for (const ann of certainAnnotations) {
    const gt = ann.groundPosition
    const zone = zones.find(z => gt.x >= z.xMin && gt.x < z.xMax)
    if (!zone) continue

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
    totalCount++

    // Determine best camera for this zone
    const s = stats[zone.name]
    const cam1Better = (s.cam1.total > 0 ? s.cam1.pass / s.cam1.total : 0) >=
                       (s.cam2.total > 0 ? s.cam2.pass / s.cam2.total : 0)

    let selectedError: number
    if (errors['camera1'] && errors['camera2']) {
      // Both available - pick based on zone
      selectedError = cam1Better ? errors['camera1'] : errors['camera2']
    } else {
      selectedError = errors['camera1'] ?? errors['camera2']
    }

    if (selectedError < 0.5) totalPassed++
  }

  console.log(`With zone-based camera selection: ${totalPassed}/${totalCount} pass (${(totalPassed / totalCount * 100).toFixed(1)}%)`)
}

main().catch(console.error)
