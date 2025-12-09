/**
 * Debug specific failing case: ann_1765238504031_myfcocxgq
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackManager } from '../src/tracks/track-manager.js'
import { DetectionProcessor } from '../src/detection/detection-processor.js'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const content = readFileSync(groundTruthPath, 'utf-8')
  const groundTruth = JSON.parse(content)

  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  // Find the specific failing annotation
  const ann = groundTruth.annotations.find((a: any) => a.id === 'ann_1765238504031_myfcocxgq')
  if (!ann) {
    console.log('Annotation not found!')
    return
  }

  console.log('Annotation:', ann.id)
  console.log('Ground truth:', ann.groundPosition)
  console.log('Linked detections:', ann.linkedDetections.length)

  let mockTime = Math.floor(ann.timestamp * 1000) + 1000

  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => {
      let id = 0
      return () => `global-${++id}`
    })(),
  })
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

  for (const det of ann.linkedDetections) {
    console.log(`\nProcessing detection from ${det.cameraId}:`)
    const bbox = {
      x: det.bbox.left,
      y: det.bbox.top,
      width: det.bbox.right - det.bbox.left,
      height: det.bbox.bottom - det.bbox.top,
    }
    console.log('  BBox:', bbox)

    const track = detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId)
    if (track) {
      console.log('  Track ID:', track.globalTrackId)
      console.log('  Current position:', track.currentPosition)
      console.log('  Detection count:', track.detectionCount)
      console.log('  Camera associations:', [...track.cameraAssociations.keys()])
      console.log('  Pending detections:', track.pendingDetections.length)
    } else {
      console.log('  No track returned!')
    }

    mockTime += 10
  }

  // Get final track state
  console.log('\n=== FINAL STATE ===')
  const activeTracks = trackManager.getAllActiveTracks()
  console.log('Active tracks:', activeTracks.length)

  for (const track of activeTracks) {
    console.log('\nTrack:', track.globalTrackId)
    console.log('  Position:', track.currentPosition)
    console.log('  Detection count:', track.detectionCount)
    console.log('  Cameras:', [...track.cameraAssociations.keys()])
    console.log('  Pending detections:', track.pendingDetections.length)
    if (track.pendingDetections.length > 0) {
      console.log('  Pending positions:', track.pendingDetections.map(d => ({
        camera: d.cameraId,
        pos: { x: d.worldX, y: d.worldY }
      })))
    }
  }

  // Compare to ground truth
  if (activeTracks.length > 0) {
    const finalPos = activeTracks[0].currentPosition
    const gt = ann.groundPosition
    const error = Math.sqrt(Math.pow(finalPos.x - gt.x, 2) + Math.pow(finalPos.y - gt.y, 2))
    console.log('\nFinal error:', error.toFixed(3), 'm')
    console.log('Expected (from analysis):')
    console.log('  camera2 proj: (17.66, 0.74) -> error 2.514m')
    console.log('  camera1 proj: (15.10, 1.14) -> error 0.080m')
    console.log('  If smart selection worked, should pick camera1')
  }
}

main().catch(console.error)
