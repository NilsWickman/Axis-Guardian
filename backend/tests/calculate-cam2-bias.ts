/**
 * Calculate optimal bias correction for camera2 to reduce its rightward bias
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

  // Collect camera2-only projections
  interface Projection {
    gt: { x: number; y: number }
    proj: { x: number; y: number }
    errorX: number
    errorY: number
  }

  const cam2Projections: Projection[] = []

  for (const ann of certainAnnotations) {
    const cam2Dets = ann.linkedDetections.filter((d: any) => d.cameraId === 'camera2')
    const cam1Dets = ann.linkedDetections.filter((d: any) => d.cameraId === 'camera1')

    // Focus on camera2-only cases
    if (cam2Dets.length > 0 && cam1Dets.length === 0) {
      for (const det of cam2Dets) {
        const bbox = {
          x: det.bbox.left,
          y: det.bbox.top,
          width: det.bbox.right - det.bbox.left,
          height: det.bbox.bottom - det.bbox.top,
        }

        const calibration = cameraRegistry.getCalibration('camera2')
        if (!calibration || !cam2Params) continue

        const feetPos = getBBoxBottomCenter(bbox, cam2Params, [], true, 1920, 1080, true)
        const result = projectWithKRT(feetPos.x, feetPos.y, calibration)
        if (!result.isValid) continue

        cam2Projections.push({
          gt: ann.groundPosition,
          proj: result.worldPoint,
          errorX: result.worldPoint.x - ann.groundPosition.x,
          errorY: result.worldPoint.y - ann.groundPosition.y,
        })
      }
    }
  }

  console.log(`Camera2-only projections: ${cam2Projections.length}`)
  console.log()

  // Calculate average error
  const avgErrorX = cam2Projections.reduce((s, p) => s + p.errorX, 0) / cam2Projections.length
  const avgErrorY = cam2Projections.reduce((s, p) => s + p.errorY, 0) / cam2Projections.length
  console.log(`Average error: (${avgErrorX.toFixed(3)}, ${avgErrorY.toFixed(3)})`)

  // Calculate what bias correction would help
  console.log(`\nSuggested bias correction: (${(-avgErrorX).toFixed(3)}, ${(-avgErrorY).toFixed(3)})`)

  // Test different bias corrections
  console.log('\n=== TESTING BIAS CORRECTIONS ===\n')

  const corrections = [
    { x: 0, y: 0, name: 'None' },
    { x: -avgErrorX, y: -avgErrorY, name: 'Full average' },
    { x: -avgErrorX * 0.5, y: -avgErrorY * 0.5, name: '50% of average' },
    { x: -0.3, y: 0, name: 'Fixed -0.3 X' },
    { x: -0.5, y: 0, name: 'Fixed -0.5 X' },
    { x: -0.7, y: 0, name: 'Fixed -0.7 X' },
  ]

  for (const corr of corrections) {
    let passed = 0
    let totalError = 0

    for (const p of cam2Projections) {
      const corrected = {
        x: p.proj.x + corr.x,
        y: p.proj.y + corr.y,
      }
      const error = distance(corrected, p.gt)
      totalError += error
      if (error < 0.5) passed++
    }

    const avgErr = totalError / cam2Projections.length
    console.log(`${corr.name.padEnd(20)}: ${passed}/${cam2Projections.length} pass (${(passed / cam2Projections.length * 100).toFixed(1)}%), avg error: ${avgErr.toFixed(3)}m`)
  }
}

main().catch(console.error)
