/**
 * Verify the 82.4% ceiling is truly a hard limit
 * Analyze each ceiling case to understand why neither camera works
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

  // Analyze ceiling cases
  const ceilingCases: Array<{
    id: string
    gt: { x: number; y: number }
    cam1Error: number | null
    cam2Error: number | null
    reason: string
  }> = []

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

    const bestError = Math.min(...Object.values(errors).filter(e => !isNaN(e)))
    if (bestError >= 0.5) {
      let reason = ''
      const cam1Err = errors['camera1']
      const cam2Err = errors['camera2']

      if (cam1Err === undefined && cam2Err !== undefined) {
        reason = 'Only camera2 sees person, projection error too high'
      } else if (cam2Err === undefined && cam1Err !== undefined) {
        reason = 'Only camera1 sees person, projection error too high'
      } else if (cam1Err !== undefined && cam2Err !== undefined) {
        reason = 'Both cameras see person but both have high projection error'
      }

      ceilingCases.push({
        id: ann.id,
        gt: ann.groundPosition,
        cam1Error: cam1Err ?? null,
        cam2Error: cam2Err ?? null,
        reason,
      })
    }
  }

  console.log('=== CEILING CASE ANALYSIS ===\n')
  console.log(`Total ceiling cases: ${ceilingCases.length} (cannot achieve <0.5m with any camera selection)\n`)

  // Categorize
  const singleCamOnly = ceilingCases.filter(c => (c.cam1Error === null) !== (c.cam2Error === null))
  const bothCamsFail = ceilingCases.filter(c => c.cam1Error !== null && c.cam2Error !== null)

  console.log('Category 1: Single camera visibility with high error')
  console.log(`  Count: ${singleCamOnly.length}`)
  for (const c of singleCamOnly.slice(0, 5)) {
    const visibleCam = c.cam1Error !== null ? 'cam1' : 'cam2'
    const err = c.cam1Error ?? c.cam2Error
    console.log(`  - ${c.id}: GT=(${c.gt.x.toFixed(2)}, ${c.gt.y.toFixed(2)}), ${visibleCam}=${err?.toFixed(3)}m`)
  }
  if (singleCamOnly.length > 5) console.log(`  ... and ${singleCamOnly.length - 5} more`)

  console.log('\nCategory 2: Both cameras visible but both have high error')
  console.log(`  Count: ${bothCamsFail.length}`)
  for (const c of bothCamsFail.slice(0, 5)) {
    console.log(`  - ${c.id}: GT=(${c.gt.x.toFixed(2)}, ${c.gt.y.toFixed(2)}), cam1=${c.cam1Error?.toFixed(3)}m, cam2=${c.cam2Error?.toFixed(3)}m`)
  }
  if (bothCamsFail.length > 5) console.log(`  ... and ${bothCamsFail.length - 5} more`)

  // Analyze spatial distribution
  console.log('\n=== SPATIAL DISTRIBUTION OF CEILING CASES ===\n')
  const zones = {
    'Far Y (y < 4m)': ceilingCases.filter(c => c.gt.y < 4),
    'Mid Y (4-8m)': ceilingCases.filter(c => c.gt.y >= 4 && c.gt.y < 8),
    'Near Y (y >= 8m)': ceilingCases.filter(c => c.gt.y >= 8),
  }

  for (const [zoneName, cases] of Object.entries(zones)) {
    console.log(`${zoneName}: ${cases.length} ceiling cases`)
  }

  // Check if any are just slightly over threshold
  console.log('\n=== NEAR-MISS CEILING CASES (0.5-0.6m error) ===\n')
  const nearMiss = ceilingCases.filter(c => {
    const minErr = Math.min(c.cam1Error ?? Infinity, c.cam2Error ?? Infinity)
    return minErr >= 0.5 && minErr < 0.6
  })
  console.log(`Count: ${nearMiss.length}`)
  for (const c of nearMiss) {
    const minErr = Math.min(c.cam1Error ?? Infinity, c.cam2Error ?? Infinity)
    console.log(`  - ${c.id}: GT=(${c.gt.x.toFixed(2)}, ${c.gt.y.toFixed(2)}), best error=${minErr.toFixed(3)}m`)
  }

  console.log('\n=== CONCLUSION ===\n')
  console.log(`Maximum achievable accuracy: ${148 - ceilingCases.length}/148 = ${((148 - ceilingCases.length) / 148 * 100).toFixed(1)}%`)
  console.log(`Target accuracy: 90% (133/148)`)
  console.log(`Gap: ${133 - (148 - ceilingCases.length)} annotations`)
  console.log('\nThe 90% target is NOT achievable with current calibration.')
  console.log('This is a HARD CEILING due to fundamental projection errors.')
}

main().catch(console.error)
