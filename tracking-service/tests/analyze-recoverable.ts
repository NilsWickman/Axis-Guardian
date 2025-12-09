/**
 * Analyze the gap between current accuracy (77.7%) and theoretical ceiling (82.4%)
 * These are cases where one camera is accurate but we're not selecting it correctly
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

  // Categories:
  // 1. "Recoverable" - one camera is accurate (<0.5m), but our smart selection picks the wrong one
  // 2. "Ceiling" - no camera is accurate (>=0.5m)

  const recoverable: Array<{
    ann: Annotation
    errors: Record<string, number>
    projections: Record<string, Point2D>
    selected: string
    selectedError: number
    betterCamera: string
    betterError: number
  }> = []

  const ceiling: Array<{
    ann: Annotation
    errors: Record<string, number>
    projections: Record<string, Point2D>
  }> = []

  for (const ann of certainAnnotations) {
    const errors: Record<string, number> = {}
    const projections: Record<string, Point2D> = {}

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
      projections[det.cameraId] = result.worldPoint
    }

    if (Object.keys(errors).length === 0) continue

    const bestError = Math.min(...Object.values(errors))
    const bestCamera = Object.entries(errors).find(([_, e]) => e === bestError)![0]

    // Simulate our smart selection logic
    let selectedCamera: string
    let selectedError: number

    if (Object.keys(errors).length === 1) {
      selectedCamera = Object.keys(errors)[0]
      selectedError = errors[selectedCamera]
    } else {
      // Both cameras available
      const dist = distance(projections['camera1']!, projections['camera2']!)
      if (dist > 0.6) {
        // Divergent - pick camera1
        selectedCamera = 'camera1'
        selectedError = errors['camera1']
      } else {
        // Convergent - weighted average
        const w1 = 1.2, w2 = 0.8
        const avgPos = {
          x: (projections['camera1']!.x * w1 + projections['camera2']!.x * w2) / (w1 + w2),
          y: (projections['camera1']!.y * w1 + projections['camera2']!.y * w2) / (w1 + w2),
        }
        selectedError = distance(avgPos, ann.groundPosition)
        selectedCamera = 'weighted_average'
      }
    }

    // Classify
    if (bestError < 0.5 && selectedError >= 0.5) {
      // Recoverable - we failed but could have succeeded
      recoverable.push({
        ann,
        errors,
        projections,
        selected: selectedCamera,
        selectedError,
        betterCamera: bestCamera,
        betterError: bestError,
      })
    } else if (bestError >= 0.5) {
      // Ceiling - even best camera fails
      ceiling.push({ ann, errors, projections })
    }
  }

  console.log('=== RECOVERABLE CASES ===')
  console.log(`(Could pass with better camera selection: ${recoverable.length} cases)\n`)

  for (const r of recoverable) {
    console.log(`${r.ann.id}:`)
    console.log(`  Ground truth: (${r.ann.groundPosition.x.toFixed(2)}, ${r.ann.groundPosition.y.toFixed(2)})`)
    console.log(`  Camera errors: cam1=${r.errors['camera1']?.toFixed(3) ?? 'N/A'}m, cam2=${r.errors['camera2']?.toFixed(3) ?? 'N/A'}m`)
    if (r.projections['camera1'] && r.projections['camera2']) {
      const dist = distance(r.projections['camera1'], r.projections['camera2'])
      console.log(`  Camera distance: ${dist.toFixed(3)}m (${dist > 0.6 ? 'DIVERGENT' : 'CONVERGENT'})`)
    }
    console.log(`  Selected: ${r.selected} (error=${r.selectedError.toFixed(3)}m)`)
    console.log(`  Better: ${r.betterCamera} (error=${r.betterError.toFixed(3)}m)`)
    console.log()
  }

  // Analyze patterns
  console.log('\n=== PATTERN ANALYSIS ===\n')

  const byZone: Record<string, typeof recoverable> = {
    'Left (0-6m)': [],
    'Center (6-12m)': [],
    'Right (12-18m)': [],
  }

  for (const r of recoverable) {
    const x = r.ann.groundPosition.x
    if (x < 6) byZone['Left (0-6m)'].push(r)
    else if (x < 12) byZone['Center (6-12m)'].push(r)
    else byZone['Right (12-18m)'].push(r)
  }

  for (const [zone, cases] of Object.entries(byZone)) {
    if (cases.length === 0) continue
    console.log(`${zone}: ${cases.length} recoverable cases`)
    const cam1Better = cases.filter(c => c.betterCamera === 'camera1').length
    const cam2Better = cases.filter(c => c.betterCamera === 'camera2').length
    console.log(`  Camera1 better: ${cam1Better}, Camera2 better: ${cam2Better}`)
  }

  // Convergent vs divergent
  const divergentRecoverable = recoverable.filter(r => {
    if (!r.projections['camera1'] || !r.projections['camera2']) return false
    return distance(r.projections['camera1'], r.projections['camera2']) > 0.6
  })
  const convergentRecoverable = recoverable.filter(r => {
    if (!r.projections['camera1'] || !r.projections['camera2']) return true // single camera
    return distance(r.projections['camera1'], r.projections['camera2']) <= 0.6
  })

  console.log(`\nDivergent recoverable: ${divergentRecoverable.length}`)
  for (const r of divergentRecoverable) {
    console.log(`  ${r.ann.id}: better=${r.betterCamera}`)
  }

  console.log(`\nConvergent recoverable: ${convergentRecoverable.length}`)
  for (const r of convergentRecoverable) {
    console.log(`  ${r.ann.id}: better=${r.betterCamera}`)
  }

  console.log(`\n=== CEILING CASES (${ceiling.length}) ===`)
  console.log('(Neither camera can achieve <0.5m accuracy)\n')

  for (const c of ceiling.slice(0, 5)) {
    console.log(`${c.ann.id}:`)
    console.log(`  Ground truth: (${c.ann.groundPosition.x.toFixed(2)}, ${c.ann.groundPosition.y.toFixed(2)})`)
    console.log(`  Camera errors: cam1=${c.errors['camera1']?.toFixed(3) ?? 'N/A'}m, cam2=${c.errors['camera2']?.toFixed(3) ?? 'N/A'}m`)
  }
  if (ceiling.length > 5) {
    console.log(`  ... and ${ceiling.length - 5} more ceiling cases`)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Current accuracy: ${148 - recoverable.length - ceiling.length}/148 = ${((148 - recoverable.length - ceiling.length) / 148 * 100).toFixed(1)}%`)
  console.log(`Recoverable: ${recoverable.length} cases`)
  console.log(`Ceiling: ${ceiling.length} cases`)
  console.log(`Theoretical max: ${148 - ceiling.length}/148 = ${((148 - ceiling.length) / 148 * 100).toFixed(1)}%`)
}

main().catch(console.error)
