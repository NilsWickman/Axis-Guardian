/**
 * Categorize the 33 remaining failures precisely
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

  interface FailureCase {
    id: string
    gt: { x: number; y: number }
    finalPos: { x: number; y: number }
    finalError: number
    cam1Pos?: { x: number; y: number }
    cam1Error?: number
    cam2Pos?: { x: number; y: number }
    cam2Error?: number
    numCameras: number
    category: string
  }

  const failures: FailureCase[] = []
  let passed = 0

  for (const ann of certainAnnotations) {
    const projections: Record<string, { x: number; y: number }> = {}
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

      projections[det.cameraId] = result.worldPoint
      errors[det.cameraId] = distance(result.worldPoint, ann.groundPosition)
    }

    const cameraIds = Object.keys(projections)
    if (cameraIds.length === 0) continue

    // Apply smart camera selection (matching test logic)
    let finalPosition: { x: number; y: number }
    if (cameraIds.length === 1) {
      finalPosition = projections[cameraIds[0]]
    } else {
      const dist = distance(projections['camera1']!, projections['camera2']!)
      if (dist > 0.6) {
        // Divergent - pick camera1
        finalPosition = projections['camera1'] || projections['camera2']!
      } else {
        // Convergent - average
        finalPosition = {
          x: (projections['camera1'].x + projections['camera2'].x) / 2,
          y: (projections['camera1'].y + projections['camera2'].y) / 2,
        }
      }
    }

    const finalError = distance(finalPosition, ann.groundPosition)

    if (finalError < 0.5) {
      passed++
      continue
    }

    // Categorize the failure
    let category = ''
    const cam1Err = errors['camera1']
    const cam2Err = errors['camera2']

    if (cameraIds.length === 1) {
      category = `single-${cameraIds[0]}`
    } else {
      // Multi-camera case
      const dist = distance(projections['camera1']!, projections['camera2']!)

      if (dist > 0.6) {
        // Used smart selection (picked camera1)
        if (cam1Err < 0.5) {
          category = 'selected-cam1-passed-but-final-failed' // Shouldn't happen
        } else if (cam2Err < 0.5) {
          category = 'selected-cam1-but-cam2-was-better'
        } else {
          category = 'both-failed-divergent'
        }
      } else {
        // Averaged
        if (cam1Err < 0.5 || cam2Err < 0.5) {
          category = 'averaged-but-one-was-good'
        } else {
          category = 'both-failed-convergent'
        }
      }
    }

    failures.push({
      id: ann.id,
      gt: ann.groundPosition,
      finalPos: finalPosition,
      finalError,
      cam1Pos: projections['camera1'],
      cam1Error: cam1Err,
      cam2Pos: projections['camera2'],
      cam2Error: cam2Err,
      numCameras: cameraIds.length,
      category,
    })
  }

  console.log(`=== FAILURE CATEGORIZATION (${failures.length} failures, ${passed} passed) ===\n`)

  // Group by category
  const categories: Record<string, FailureCase[]> = {}
  for (const f of failures) {
    if (!categories[f.category]) categories[f.category] = []
    categories[f.category].push(f)
  }

  for (const [cat, cases] of Object.entries(categories).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${cat}: ${cases.length} cases`)

    if (cat === 'averaged-but-one-was-good') {
      console.log('  (Could recover by using smart selection with lower threshold)')
      for (const c of cases.slice(0, 5)) {
        console.log(`    ${c.id.substring(0, 25)}: cam1=${c.cam1Error?.toFixed(3)}m, cam2=${c.cam2Error?.toFixed(3)}m, final=${c.finalError.toFixed(3)}m`)
      }
      if (cases.length > 5) console.log(`    ... and ${cases.length - 5} more`)
    }

    if (cat.startsWith('single-')) {
      for (const c of cases.slice(0, 3)) {
        console.log(`    ${c.id.substring(0, 25)}: error=${c.finalError.toFixed(3)}m, GT=(${c.gt.x.toFixed(1)}, ${c.gt.y.toFixed(1)})`)
      }
      if (cases.length > 3) console.log(`    ... and ${cases.length - 3} more`)
    }

    if (cat === 'selected-cam1-but-cam2-was-better') {
      console.log('  (Wrong camera selected - could use smarter selection)')
      for (const c of cases) {
        console.log(`    ${c.id.substring(0, 25)}: cam1=${c.cam1Error?.toFixed(3)}m, cam2=${c.cam2Error?.toFixed(3)}m`)
      }
    }
  }

  // Summary of improvement potential
  console.log('\n=== IMPROVEMENT POTENTIAL ===\n')
  console.log(`Current: ${passed}/${passed + failures.length} pass (${(passed / (passed + failures.length) * 100).toFixed(1)}%)`)
  console.log(`Target: 90% (${Math.ceil((passed + failures.length) * 0.9)}/${passed + failures.length})`)
  console.log(`Need: ${Math.ceil((passed + failures.length) * 0.9) - passed} more passes`)
  console.log()

  const avgdButGood = categories['averaged-but-one-was-good']?.length || 0
  const cam2Better = categories['selected-cam1-but-cam2-was-better']?.length || 0
  console.log(`Recoverable with smarter camera selection: ${avgdButGood + cam2Better}`)

  const singleCam = (categories['single-camera1']?.length || 0) + (categories['single-camera2']?.length || 0)
  console.log(`Single-camera failures (need better calibration): ${singleCam}`)

  const bothFailed = (categories['both-failed-divergent']?.length || 0) + (categories['both-failed-convergent']?.length || 0)
  console.log(`Both cameras failed (ceiling): ${bothFailed}`)
}

main().catch(console.error)
