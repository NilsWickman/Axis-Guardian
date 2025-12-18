/**
 * Debug a specific merge-hurt case
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

  // Check the specific case: ann_1765238415895_yqcf3a1mp
  const ann = groundTruth.annotations.find((a: any) => a.id === 'ann_1765238415895_yqcf3a1mp')
  if (!ann) {
    console.log('Annotation not found!')
    return
  }

  console.log('Annotation:', ann.id)
  console.log('Ground truth:', ann.groundPosition)

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
    const err = distance(result.worldPoint, ann.groundPosition)
    console.log(`${det.cameraId}: (${result.worldPoint.x.toFixed(2)}, ${result.worldPoint.y.toFixed(2)}) - error: ${err.toFixed(3)}m`)
  }

  // Check distance between cameras
  if (projections['camera1'] && projections['camera2']) {
    const dist = distance(projections['camera1'], projections['camera2'])
    console.log(`\nDistance between cameras: ${dist.toFixed(3)}m`)
    console.log(`Threshold: 0.6m`)
    console.log(`Behavior: ${dist > 0.6 ? 'Pick camera1 (divergent)' : 'Average (convergent)'}`)

    if (dist <= 0.6) {
      const avg = {
        x: (projections['camera1'].x + projections['camera2'].x) / 2,
        y: (projections['camera1'].y + projections['camera2'].y) / 2,
      }
      const avgErr = distance(avg, ann.groundPosition)
      console.log(`Average position: (${avg.x.toFixed(2)}, ${avg.y.toFixed(2)}) - error: ${avgErr.toFixed(3)}m`)
    }
  }
}

main().catch(console.error)
