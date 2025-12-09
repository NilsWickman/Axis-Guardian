/**
 * Analyze the 35 remaining failure cases after degree 5 polynomial upgrade
 * to understand what improvements might still be possible
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'
import { getBBoxBottomCenter, projectWithKRT } from '../src/projection/ground-plane.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface LinkedDetection {
  cameraId: string
  bbox: { left: number; top: number; right: number; bottom: number }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  confidence: string
  linkedDetections: LinkedDetection[]
}

interface Point2D {
  x: number
  y: number
}

function distance(p1: Point2D, p2: Point2D): number {
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

  const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === 'certain')

  interface FailureCase {
    ann: Annotation
    error: number
    cameras: string[]
    projections: Record<string, Point2D>
    individual_errors: Record<string, number>
    category: string
  }

  const failures: FailureCase[] = []

  for (const ann of certainAnnotations) {
    const projections: Record<string, Point2D> = {}
    const individual_errors: Record<string, number> = {}

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
      if (!calibration || !camera) {
        console.log(`Skipping ${det.cameraId} (normalizedId: ${normalizedId}): calibration=${!!calibration}, camera=${!!camera}`)
        continue
      }

      const feetPos = getBBoxBottomCenter(bbox, camera, [], true, 1920, 1080, true)
      const result = projectWithKRT(feetPos.x, feetPos.y, calibration)
      if (!result.isValid) continue
      const worldPos = result.worldPoint

      projections[det.cameraId] = worldPos
      individual_errors[det.cameraId] = distance(worldPos, ann.groundPosition)
    }

    const cameraIds = Object.keys(projections)
    if (cameraIds.length === 0) continue

    let finalPosition: Point2D
    if (cameraIds.length === 1) {
      finalPosition = projections[cameraIds[0]]
    } else {
      finalPosition = {
        x: cameraIds.reduce((s, c) => s + projections[c].x, 0) / cameraIds.length,
        y: cameraIds.reduce((s, c) => s + projections[c].y, 0) / cameraIds.length,
      }
    }

    const error = distance(finalPosition, ann.groundPosition)

    if (error >= 0.5) {
      // Categorize the failure
      let category = 'unknown'

      if (cameraIds.length === 1) {
        category = `single-camera-${cameraIds[0]}`
      } else {
        // Multi-camera case
        const cam1Err = individual_errors['camera1'] || Infinity
        const cam2Err = individual_errors['camera2'] || Infinity
        const bestIndividual = Math.min(cam1Err, cam2Err)

        if (bestIndividual < 0.5) {
          // One camera is accurate, but merge made it worse
          const betterCamera = cam1Err < cam2Err ? 'camera1' : 'camera2'
          category = `merge-hurt-${betterCamera}-was-better`
        } else if (cam1Err >= 0.5 && cam2Err >= 0.5) {
          // Both cameras failed - fundamental ceiling issue
          category = 'both-cameras-failed'
        }
      }

      failures.push({
        ann,
        error,
        cameras: cameraIds,
        projections,
        individual_errors,
        category,
      })
    }
  }

  // Sort by error (worst first)
  failures.sort((a, b) => b.error - a.error)

  console.log(`\n=== FAILURE ANALYSIS (${failures.length} cases) ===\n`)

  // Count categories
  const categories: Record<string, FailureCase[]> = {}
  for (const f of failures) {
    if (!categories[f.category]) categories[f.category] = []
    categories[f.category].push(f)
  }

  console.log('FAILURE CATEGORIES:')
  for (const [cat, cases] of Object.entries(categories).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cat}: ${cases.length} cases (avg error: ${(cases.reduce((s, c) => s + c.error, 0) / cases.length).toFixed(3)}m)`)
  }

  // Analyze merge-hurt cases more deeply
  const mergeHurt = failures.filter(f => f.category.startsWith('merge-hurt'))
  if (mergeHurt.length > 0) {
    console.log(`\n=== MERGE-HURT CASES (${mergeHurt.length}) ===`)
    console.log('These are cases where one camera was accurate but merging made it worse.')
    console.log('If we pick the better camera, we could recover these.\n')

    let recoverable = 0
    for (const f of mergeHurt) {
      const cam1Err = f.individual_errors['camera1'] || Infinity
      const cam2Err = f.individual_errors['camera2'] || Infinity
      const bestErr = Math.min(cam1Err, cam2Err)
      const betterCam = cam1Err < cam2Err ? 'camera1' : 'camera2'

      if (bestErr < 0.5) recoverable++

      console.log(`  ${f.ann.id.substring(0, 30)}:`)
      console.log(`    Merged error: ${f.error.toFixed(3)}m`)
      console.log(`    camera1 error: ${cam1Err.toFixed(3)}m, camera2 error: ${cam2Err.toFixed(3)}m`)
      console.log(`    Better: ${betterCam} (${bestErr.toFixed(3)}m)`)
      console.log(`    GT: (${f.ann.groundPosition.x.toFixed(2)}, ${f.ann.groundPosition.y.toFixed(2)})`)
    }

    console.log(`\nRecoverable if we pick better camera: ${recoverable}/${mergeHurt.length}`)
  }

  // Analyze both-cameras-failed cases
  const bothFailed = categories['both-cameras-failed'] || []
  if (bothFailed.length > 0) {
    console.log(`\n=== BOTH-CAMERAS-FAILED CASES (${bothFailed.length}) ===`)
    console.log('These are fundamental ceiling cases - neither camera is accurate.\n')

    // Group by error magnitude
    const catastrophic = bothFailed.filter(f => f.error >= 2.0)
    const severe = bothFailed.filter(f => f.error >= 1.0 && f.error < 2.0)
    const moderate = bothFailed.filter(f => f.error >= 0.5 && f.error < 1.0)

    console.log(`  Catastrophic (>=2.0m): ${catastrophic.length}`)
    console.log(`  Severe (1.0-2.0m): ${severe.length}`)
    console.log(`  Moderate (0.5-1.0m): ${moderate.length}`)

    if (catastrophic.length > 0) {
      console.log('\n  CATASTROPHIC CASES:')
      for (const f of catastrophic) {
        console.log(`    ${f.ann.id.substring(0, 30)}: ${f.error.toFixed(3)}m`)
        console.log(`      cam1: ${(f.individual_errors['camera1'] || NaN).toFixed(3)}m, cam2: ${(f.individual_errors['camera2'] || NaN).toFixed(3)}m`)
        console.log(`      GT: (${f.ann.groundPosition.x.toFixed(2)}, ${f.ann.groundPosition.y.toFixed(2)})`)
      }
    }
  }

  // Analyze single-camera failures
  const singleCam1 = categories['single-camera-camera1'] || []
  const singleCam2 = categories['single-camera-camera2'] || []

  if (singleCam1.length > 0 || singleCam2.length > 0) {
    console.log(`\n=== SINGLE-CAMERA FAILURES ===`)
    console.log(`  camera1 only: ${singleCam1.length} failures`)
    console.log(`  camera2 only: ${singleCam2.length} failures`)

    // Analyze where these failures occur spatially
    const analyzeRegion = (cases: FailureCase[], label: string) => {
      if (cases.length === 0) return

      console.log(`\n  ${label} spatial distribution:`)
      const nearEntrance = cases.filter(f => f.ann.groundPosition.y < 3)
      const middle = cases.filter(f => f.ann.groundPosition.y >= 3 && f.ann.groundPosition.y < 8)
      const farSide = cases.filter(f => f.ann.groundPosition.y >= 8)

      console.log(`    Near entrance (y<3): ${nearEntrance.length}`)
      console.log(`    Middle (3<=y<8): ${middle.length}`)
      console.log(`    Far side (y>=8): ${farSide.length}`)
    }

    analyzeRegion(singleCam1, 'camera1')
    analyzeRegion(singleCam2, 'camera2')
  }

  // Summary
  console.log('\n=== IMPROVEMENT POTENTIAL ===')
  const mergeHurtCount = mergeHurt.length
  const bothFailedCount = bothFailed.length
  const singleFailedCount = singleCam1.length + singleCam2.length

  console.log(`Current: 113/148 pass (76.4%)`)
  console.log(`Target: 133/148 pass (90%)`)
  console.log(`Need to recover: 20 more cases`)
  console.log()
  console.log(`Failure breakdown:`)
  console.log(`  - Merge-hurt (one camera was good): ${mergeHurtCount} (recoverable with smart selection)`)
  console.log(`  - Both-cameras-failed (ceiling): ${bothFailedCount} (very hard to fix)`)
  console.log(`  - Single-camera failures: ${singleFailedCount} (might improve with better polynomial)`)

  if (mergeHurtCount >= 10) {
    console.log(`\n*** OPPORTUNITY: Smart camera selection could recover ~${mergeHurtCount} cases ***`)
  }
}

main().catch(console.error)
