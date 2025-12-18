/**
 * Analyze recoverable annotations - cases where optimal camera selection
 * could improve accuracy beyond current weighted averaging
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

  let alreadyPassing = 0
  let recoverableWithSmartSelect = 0
  let atCeiling = 0

  const recoverableCases: Array<{
    id: string
    gt: { x: number; y: number }
    cam1Err: number
    cam2Err: number
    bestErr: number
    weightedErr: number
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

    const cam1Err = errors['camera1']
    const cam2Err = errors['camera2']
    const errorValues = Object.values(errors).filter(e => !isNaN(e))
    if (errorValues.length === 0) continue

    const bestError = Math.min(...errorValues)

    if (bestError >= 0.5) {
      atCeiling++
    } else if (cam1Err !== undefined && cam2Err !== undefined) {
      const w1 = 1.2, w2 = 0.8
      const divergent = Math.abs(cam1Err - cam2Err) > 0.6

      let effectiveError: number
      if (divergent) {
        effectiveError = cam1Err
      } else {
        effectiveError = (cam1Err * w1 + cam2Err * w2) / (w1 + w2)
      }

      if (effectiveError < 0.5) {
        alreadyPassing++
      } else if (bestError < 0.5) {
        recoverableWithSmartSelect++
        recoverableCases.push({
          id: ann.id,
          gt: ann.groundPosition,
          cam1Err,
          cam2Err,
          bestErr: bestError,
          weightedErr: effectiveError,
        })
      }
    } else {
      if (bestError < 0.5) {
        alreadyPassing++
      }
    }
  }

  console.log('=== RECOVERABLE ANNOTATION ANALYSIS ===\n')
  console.log('Total certain annotations: ' + certainAnnotations.length)
  console.log('Already passing: ' + alreadyPassing)
  console.log('Recoverable with better selection: ' + recoverableWithSmartSelect)
  console.log('At ceiling (not recoverable): ' + atCeiling)
  console.log('\nTheoretical ceiling: ' + ((alreadyPassing + recoverableWithSmartSelect) / certainAnnotations.length * 100).toFixed(1) + '%')
  console.log('Current actual: ' + (alreadyPassing / certainAnnotations.length * 100).toFixed(1) + '%')
  console.log('Gap to close: ' + recoverableWithSmartSelect + ' annotations (' + (recoverableWithSmartSelect / certainAnnotations.length * 100).toFixed(1) + '%)')

  if (recoverableCases.length > 0) {
    console.log('\n=== RECOVERABLE CASES ===\n')
    for (const c of recoverableCases) {
      console.log(c.id + ':')
      console.log('  GT: (' + c.gt.x.toFixed(2) + ', ' + c.gt.y.toFixed(2) + ')')
      console.log('  cam1=' + c.cam1Err.toFixed(3) + 'm, cam2=' + c.cam2Err.toFixed(3) + 'm')
      console.log('  best=' + c.bestErr.toFixed(3) + 'm, weighted=' + c.weightedErr.toFixed(3) + 'm')
      console.log('  Recovery: pick ' + (c.cam1Err < c.cam2Err ? 'cam1' : 'cam2'))
    }
  }
}

main().catch(console.error)
