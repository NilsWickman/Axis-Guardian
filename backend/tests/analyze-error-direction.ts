/**
 * Analyze the direction of errors to find systematic biases
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

  interface FailureInfo {
    id: string
    gt: { x: number; y: number }
    proj: { x: number; y: number }
    errorX: number
    errorY: number
    errorMag: number
    cameras: string[]
  }

  const failures: FailureInfo[] = []

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

    const errorMag = distance(finalPosition, ann.groundPosition)
    if (errorMag >= 0.5) {
      failures.push({
        id: ann.id,
        gt: ann.groundPosition,
        proj: finalPosition,
        errorX: finalPosition.x - ann.groundPosition.x,
        errorY: finalPosition.y - ann.groundPosition.y,
        errorMag,
        cameras: cameraIds,
      })
    }
  }

  console.log(`=== ERROR DIRECTION ANALYSIS (${failures.length} failures) ===\n`)

  // Categorize by error direction
  const xPos = failures.filter(f => f.errorX > 0.3)  // Projected too far right
  const xNeg = failures.filter(f => f.errorX < -0.3) // Projected too far left
  const yPos = failures.filter(f => f.errorY > 0.3)  // Projected too far up (toward back)
  const yNeg = failures.filter(f => f.errorY < -0.3) // Projected too far down (toward entrance)

  console.log('X-direction errors:')
  console.log(`  Too far RIGHT (X+): ${xPos.length} cases`)
  console.log(`  Too far LEFT  (X-): ${xNeg.length} cases`)
  console.log()
  console.log('Y-direction errors:')
  console.log(`  Too far UP   (Y+): ${yPos.length} cases (toward back of room)`)
  console.log(`  Too far DOWN (Y-): ${yNeg.length} cases (toward entrance)`)
  console.log()

  // Group by zone and show error direction
  console.log('=== FAILURES BY ZONE WITH ERROR DIRECTION ===\n')

  // Focus on center problem zone
  const centerFailures = failures.filter(f => f.gt.x >= 6 && f.gt.x < 12)
  console.log(`Center zone (x=6-12m): ${centerFailures.length} failures`)

  let sumX = 0, sumY = 0
  for (const f of centerFailures) {
    sumX += f.errorX
    sumY += f.errorY
    console.log(`  ${f.id.substring(0, 25)}: GT=(${f.gt.x.toFixed(1)}, ${f.gt.y.toFixed(1)}), ` +
      `Error=(${f.errorX > 0 ? '+' : ''}${f.errorX.toFixed(2)}, ${f.errorY > 0 ? '+' : ''}${f.errorY.toFixed(2)}) = ${f.errorMag.toFixed(3)}m, ` +
      `Cameras: [${f.cameras.join(', ')}]`)
  }

  if (centerFailures.length > 0) {
    console.log(`\n  Average error direction: (${(sumX / centerFailures.length).toFixed(3)}, ${(sumY / centerFailures.length).toFixed(3)})`)
    if (sumY / centerFailures.length > 0.2) {
      console.log('  BIAS: Projecting too high (Y+) - possibly detecting seated people as standing?')
    } else if (sumY / centerFailures.length < -0.2) {
      console.log('  BIAS: Projecting too low (Y-)')
    }
  }

  // Look for patterns in single-camera failures
  console.log('\n=== SINGLE-CAMERA FAILURE PATTERNS ===\n')
  const cam1Only = failures.filter(f => f.cameras.length === 1 && f.cameras[0] === 'camera1')
  const cam2Only = failures.filter(f => f.cameras.length === 1 && f.cameras[0] === 'camera2')

  console.log(`camera1-only failures: ${cam1Only.length}`)
  if (cam1Only.length > 0) {
    const avgX = cam1Only.reduce((s, f) => s + f.errorX, 0) / cam1Only.length
    const avgY = cam1Only.reduce((s, f) => s + f.errorY, 0) / cam1Only.length
    console.log(`  Average error direction: (${avgX.toFixed(3)}, ${avgY.toFixed(3)})`)
  }

  console.log(`\ncamera2-only failures: ${cam2Only.length}`)
  if (cam2Only.length > 0) {
    const avgX = cam2Only.reduce((s, f) => s + f.errorX, 0) / cam2Only.length
    const avgY = cam2Only.reduce((s, f) => s + f.errorY, 0) / cam2Only.length
    console.log(`  Average error direction: (${avgX.toFixed(3)}, ${avgY.toFixed(3)})`)
  }
}

main().catch(console.error)
