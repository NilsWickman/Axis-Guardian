/**
 * Analyze projection errors for table-occluded detections using GroundTruths.json.
 *
 * Prints per-camera stats for detections classified as table-occluded (feet hidden),
 * so we can compare HC3 vs HC4 behavior objectively.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { projectDetectionWithKRT, estimateBBoxHeightExtension } from '../src/projection/ground-plane.js'
import { clampBehindOccludingTable2D } from '../src/geometry/obstacles.js'
import type { Point2D } from '../src/types.js'

interface LinkedDetection {
  cameraId: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: { left: number; top: number; right: number; bottom: number }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: 'certain' | 'likely' | 'uncertain'
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  annotations: Annotation[]
}

function dist(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')

  const gt = JSON.parse(readFileSync(groundTruthPath, 'utf-8')) as GroundTruthDataset
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  const tables = (sitemapConfig.obstacles as any[]).filter((o) =>
    o.blocksView === true &&
    o.height !== undefined &&
    o.height >= 0.8 &&
    o.height <= 1.3 &&
    o.category === 'furniture'
  )

  const camParamsById = new Map<string, ReturnType<typeof siteMapCameraToCameraParams>>()
  for (const c of (sitemapConfig.cameras as any[])) {
    camParamsById.set(c.id, siteMapCameraToCameraParams(c))
  }

  const MIN_BEHIND_TABLE_M = 0.2
  const MAX_BEHIND_TABLE_M = 0.9

  const perCameraErrors = new Map<string, number[]>()
  const perCameraErrorsTable = new Map<string, number[]>()

  for (const ann of gt.annotations.filter(a => a.confidence === 'certain')) {
    const gtPos: Point2D = { x: ann.groundPosition.x, y: ann.groundPosition.y }

    for (const det of ann.linkedDetections) {
      const calibration = cameraRegistry.getCalibration(det.cameraId)
      const cameraParams = camParamsById.get(det.cameraId)
      if (!calibration || !cameraParams) continue

      const bbox = {
        x: det.bbox.left,
        y: det.bbox.top,
        width: det.bbox.right - det.bbox.left,
        height: det.bbox.bottom - det.bbox.top,
      }

      const tableExt = estimateBBoxHeightExtension(bbox, cameraParams, tables as any, true, 1920, 1080)
      const isTableOccluded = tableExt > 1.05

      const proj = projectDetectionWithKRT(bbox, calibration, cameraParams, tables as any, true, 1920, 1080)
      if (!proj.isValid) continue

      // Apply bias correction (same as DetectionProcessor)
      const bias = cameraRegistry.getBiasCorrection(det.cameraId)
      let world: Point2D = { x: proj.worldPoint.x + bias.x, y: proj.worldPoint.y + bias.y }

      if (isTableOccluded && tables.length > 0) {
        const clamped = clampBehindOccludingTable2D(
          { x: cameraParams.position.x, y: cameraParams.position.y },
          world,
          tables as any,
          MAX_BEHIND_TABLE_M,
          MIN_BEHIND_TABLE_M
        )
        world = clamped.point
      }

      const e = dist(world, gtPos)
      const arr = perCameraErrors.get(det.cameraId) ?? []
      arr.push(e)
      perCameraErrors.set(det.cameraId, arr)

      if (isTableOccluded) {
        const arrT = perCameraErrorsTable.get(det.cameraId) ?? []
        arrT.push(e)
        perCameraErrorsTable.set(det.cameraId, arrT)
      }
    }
  }

  const printStats = (label: string, m: Map<string, number[]>) => {
    console.log(`\n=== ${label} ===`)
    for (const [cam, errors] of m) {
      const mean = errors.reduce((s, v) => s + v, 0) / Math.max(1, errors.length)
      console.log(
        `${cam}: n=${errors.length} mean=${mean.toFixed(3)}m median=${median(errors).toFixed(3)}m p95=${(
          [...errors].sort((a, b) => a - b)[Math.floor(errors.length * 0.95)] ?? 0
        ).toFixed(3)}m`
      )
    }
  }

  printStats('All certain linked detections (per camera)', perCameraErrors)
  printStats('Table-occluded subset (per camera)', perCameraErrorsTable)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


