/**
 * Analyze camera reliability by spatial region
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
  const groundTruth = JSON.parse(readFileSync(groundTruthPath, 'utf-8'))
  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)
  const cam1Params = siteMapCameraToCameraParams(sitemapConfig.cameras.find((c: any) => c.id === 'camera1') as any)
  const cam2Params = siteMapCameraToCameraParams(sitemapConfig.cameras.find((c: any) => c.id === 'camera2') as any)
  const certainAnnotations = groundTruth.annotations.filter((a: any) => a.confidence === 'certain')

  interface RegionStats { cam1Pass: number; cam1Total: number; cam2Pass: number; cam2Total: number; cam1Better: number; cam2Better: number }
  const regions: Record<string, RegionStats> = {}
  
  for (let xR = 0; xR < 3; xR++) {
    for (let yR = 0; yR < 3; yR++) {
      regions['x' + xR + '_y' + yR] = { cam1Pass: 0, cam1Total: 0, cam2Pass: 0, cam2Total: 0, cam1Better: 0, cam2Better: 0 }
    }
  }

  for (const ann of certainAnnotations) {
    const gt = ann.groundPosition
    const xR = Math.min(2, Math.floor(gt.x / 6))
    const yR = Math.min(2, Math.floor(gt.y / 4))
    const regionKey = 'x' + xR + '_y' + yR
    const errors: Record<string, number> = {}

    for (const det of ann.linkedDetections) {
      const bbox = { x: det.bbox.left, y: det.bbox.top, width: det.bbox.right - det.bbox.left, height: det.bbox.bottom - det.bbox.top }
      const camera = det.cameraId === 'camera1' ? cam1Params : cam2Params
      const calibration = cameraRegistry.getCalibration(det.cameraId)
      if (!calibration || !camera) continue
      const feetPos = getBBoxBottomCenter(bbox, camera, [], true, 1920, 1080, true)
      const result = projectWithKRT(feetPos.x, feetPos.y, calibration)
      if (!result.isValid) continue
      errors[det.cameraId] = distance(result.worldPoint, ann.groundPosition)
    }

    if (errors['camera1'] !== undefined) {
      regions[regionKey].cam1Total++
      if (errors['camera1'] < 0.5) regions[regionKey].cam1Pass++
    }
    if (errors['camera2'] !== undefined) {
      regions[regionKey].cam2Total++
      if (errors['camera2'] < 0.5) regions[regionKey].cam2Pass++
    }
    if (errors['camera1'] !== undefined && errors['camera2'] !== undefined) {
      if (errors['camera1'] < errors['camera2']) regions[regionKey].cam1Better++
      else regions[regionKey].cam2Better++
    }
  }

  console.log('=== SPATIAL CAMERA RELIABILITY ANALYSIS ===\n')
  console.log('Room: 18m x 12m, divided into 3x3 grid')
  console.log('Camera1 at (16.22, 11.7), Camera2 at (0.9, 10.8)\n')

  for (let yR = 2; yR >= 0; yR--) {
    const yLabel = yR === 2 ? 'Near cams (y=8-12)' : yR === 1 ? 'Mid room (y=4-8)' : 'Far (y=0-4)'
    console.log('=== ' + yLabel + ' ===')
    for (let xR = 0; xR < 3; xR++) {
      const xLabel = xR === 0 ? 'Left' : xR === 1 ? 'Center' : 'Right'
      const r = regions['x' + xR + '_y' + yR]
      const c1Acc = r.cam1Total > 0 ? (r.cam1Pass / r.cam1Total * 100).toFixed(0) : 'N/A'
      const c2Acc = r.cam2Total > 0 ? (r.cam2Pass / r.cam2Total * 100).toFixed(0) : 'N/A'
      const total = r.cam1Better + r.cam2Better
      const c1BetterPct = total > 0 ? (r.cam1Better / total * 100).toFixed(0) : 'N/A'
      console.log('  ' + xLabel + ': cam1=' + c1Acc + '% (' + r.cam1Pass + '/' + r.cam1Total + '), cam2=' + c2Acc + '% (' + r.cam2Pass + '/' + r.cam2Total + '), cam1-better=' + c1BetterPct + '%')
    }
    console.log('')
  }

  console.log('=== REGION-BASED CAMERA SELECTION RULES ===\n')
  for (let yR = 0; yR < 3; yR++) {
    for (let xR = 0; xR < 3; xR++) {
      const r = regions['x' + xR + '_y' + yR]
      const total = r.cam1Better + r.cam2Better
      if (total >= 3) {
        const c1Pct = r.cam1Better / total
        const pref = c1Pct > 0.55 ? 'camera1' : c1Pct < 0.45 ? 'camera2' : 'weighted'
        console.log('x=' + (xR*6) + '-' + ((xR+1)*6) + ', y=' + (yR*4) + '-' + ((yR+1)*4) + ': ' + pref + ' (cam1=' + (c1Pct*100).toFixed(0) + '%)')
      }
    }
  }
}

main().catch(console.error)
