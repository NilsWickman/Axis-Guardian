#!/usr/bin/env node
/**
 * CLI Tool: Synchronized Multi-Camera Replay
 *
 * Replays detection data from multiple camera files simultaneously,
 * ensuring frames with matching frame_numbers are sent together for
 * proper multi-camera batching and clustering.
 *
 * Usage:
 *   pnpm cli:replay-multicam \
 *     --camera camera1:../shared/cameras/view-HC3.detections.json.gz \
 *     --camera camera2:../shared/cameras/view-HC4.detections.json.gz
 */

import { Command } from 'commander'
import { createReadStream, readFileSync, existsSync } from 'fs'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'

interface BBox {
  left: number
  top: number
  right: number
  bottom: number
}

interface DetectionAttributes {
  upper_clothing?: {
    colors: { name: string; score: number }[]
    type?: { name: string; score: number }
  }
  lower_clothing?: {
    colors: { name: string; score: number }[]
    type?: { name: string; score: number }
  }
  embedding?: number[]
  embedding_quality?: number
}

interface Detection {
  bbox: BBox
  confidence: number
  class_name: string
  track_id: number
  attributes?: DetectionAttributes
}

interface Frame {
  frame_number: number
  timestamp: number
  detections: Detection[]
}

interface DetectionFile {
  format_version: string
  video_info: {
    fps: number
    total_frames: number
    duration_seconds?: number
  }
  frames: Frame[]
}

interface CameraData {
  cameraId: string
  filePath: string
  data: DetectionFile
  frameMap: Map<number, Frame>
}

const program = new Command()

program
  .name('replay-multicam')
  .description('Synchronized multi-camera replay for proper batching and clustering')
  .option('-c, --camera <mapping>', 'Camera mapping in format camera_id:file_path (can specify multiple)', collectCameras, [])
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('-s, --speed <multiplier>', 'Playback speed multiplier (1.0 = real-time)', '1.0')
  .option('-l, --loop', 'Loop playback continuously', false)
  .option('--start-frame <n>', 'Start from frame number', '0')
  .option('--end-frame <n>', 'End at frame number (0 = all frames)')
  .option('--skip-empty', 'Skip frames with no detections from any camera', false)
  .option('--quiet', 'Suppress per-frame output', false)
  .action(async (options) => {
    const cameraMappings = options.camera as string[]

    if (cameraMappings.length < 2) {
      console.error('Error: At least 2 cameras are required for multi-camera replay')
      console.error('Usage: --camera camera1:file1.json.gz --camera camera2:file2.json.gz')
      process.exit(1)
    }

    const baseUrl = options.url
    const speed = parseFloat(options.speed)
    const startFrame = parseInt(options.startFrame, 10)
    const endFrame = parseInt(options.endFrame || '0', 10)

    // Load all camera data
    console.log('Loading camera detection files...')
    const cameras: CameraData[] = []

    for (const mapping of cameraMappings) {
      const [cameraId, filePath] = mapping.split(':')
      if (!cameraId || !filePath) {
        console.error(`Invalid camera mapping: ${mapping}`)
        console.error('Expected format: camera_id:file_path')
        process.exit(1)
      }

      console.log(`  Loading ${cameraId} from ${filePath}...`)
      const data = await loadDetectionFile(filePath)
      if (!data) {
        console.error(`Failed to load detection file for ${cameraId}`)
        process.exit(1)
      }

      // Build frame lookup map
      const frameMap = new Map<number, Frame>()
      for (const frame of data.frames) {
        frameMap.set(frame.frame_number, frame)
      }

      cameras.push({ cameraId, filePath, data, frameMap })
    }

    // Determine common frame range
    const allFrameNumbers = new Set<number>()
    for (const cam of cameras) {
      for (const frame of cam.data.frames) {
        allFrameNumbers.add(frame.frame_number)
      }
    }
    const sortedFrames = Array.from(allFrameNumbers).sort((a, b) => a - b)

    // Filter to requested range
    const frameRange = sortedFrames.filter(f =>
      f >= startFrame && (endFrame === 0 || f < endFrame)
    )

    const fps = cameras[0].data.video_info.fps
    const frameInterval = (1000 / fps) / speed

    console.log(`\nMulti-camera sync replay:`)
    console.log(`  Cameras: ${cameras.map(c => c.cameraId).join(', ')}`)
    console.log(`  Total unique frames: ${sortedFrames.length}`)
    console.log(`  Frames to replay: ${frameRange.length}`)
    console.log(`  FPS: ${fps.toFixed(2)}`)
    console.log(`  Speed: ${speed}x`)
    console.log(`  Frame interval: ${frameInterval.toFixed(1)}ms`)
    console.log('')

    // Main replay loop
    let loopCount = 0
    do {
      loopCount++
      if (options.loop && loopCount > 1) {
        console.log(`\n--- Loop ${loopCount} ---\n`)
        await fetch(`${baseUrl}/api/reset`, { method: 'POST' })
      }

      await replaySynchronized(cameras, frameRange, {
        baseUrl,
        frameInterval,
        skipEmpty: options.skipEmpty,
        quiet: options.quiet,
      })

    } while (options.loop)

    console.log('\nReplay complete!')

    // Show sync buffer status
    try {
      const syncResponse = await fetch(`${baseUrl}/api/sync/status`)
      const syncData = await syncResponse.json() as { metrics: { batchesProcessed: number; completeBatches: number; avgCamerasPerBatch: number } }
      console.log(`\nSync buffer metrics:`)
      console.log(`  Batches processed: ${syncData.metrics.batchesProcessed}`)
      console.log(`  Complete batches: ${syncData.metrics.completeBatches}`)
      console.log(`  Avg cameras/batch: ${syncData.metrics.avgCamerasPerBatch.toFixed(2)}`)
    } catch {
      // Ignore
    }

    // Show clustering metrics
    try {
      const metricsResponse = await fetch(`${baseUrl}/api/metrics`)
      const metrics = await metricsResponse.json() as { clustering: { multiCameraClusters: number; totalClustersCreated: number } }
      console.log(`\nClustering metrics:`)
      console.log(`  Multi-camera clusters: ${metrics.clustering.multiCameraClusters}`)
      console.log(`  Total clusters: ${metrics.clustering.totalClustersCreated}`)
      const multiRate = metrics.clustering.totalClustersCreated > 0
        ? (metrics.clustering.multiCameraClusters / metrics.clustering.totalClustersCreated * 100).toFixed(1)
        : '0'
      console.log(`  Multi-camera rate: ${multiRate}%`)
    } catch {
      // Ignore
    }

    // Show final track state
    try {
      const response = await fetch(`${baseUrl}/api/tracks`)
      const trackData = await response.json() as { tracks: Array<{ globalTrackId: string; currentPosition: { x: number; y: number }; cameraAssociations: Record<string, unknown> }> }
      console.log(`\nActive tracks: ${trackData.tracks.length}`)
      for (const track of trackData.tracks.slice(0, 10)) {
        const cameraCount = Object.keys(track.cameraAssociations).length
        console.log(`  ${track.globalTrackId}: (${track.currentPosition.x.toFixed(2)}, ${track.currentPosition.y.toFixed(2)}) - ${cameraCount} camera(s)`)
      }
    } catch {
      // Ignore
    }
  })

function collectCameras(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

async function loadDetectionFile(filePath: string): Promise<DetectionFile | null> {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return null
  }

  try {
    if (filePath.endsWith('.gz')) {
      const chunks: Buffer[] = []
      const gunzip = createGunzip()
      const source = createReadStream(filePath)

      await pipeline(
        source,
        gunzip,
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk as Buffer)
          }
        }
      )

      const content = Buffer.concat(chunks).toString('utf-8')
      return JSON.parse(content)
    } else {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Error loading file:', error)
    return null
  }
}

interface SyncReplayOptions {
  baseUrl: string
  frameInterval: number
  skipEmpty: boolean
  quiet: boolean
}

async function replaySynchronized(
  cameras: CameraData[],
  frameNumbers: number[],
  options: SyncReplayOptions
): Promise<void> {
  const { baseUrl, frameInterval, skipEmpty, quiet } = options

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let totalDetections = 0
  let multiCameraFrames = 0

  console.log(`Replaying ${frameNumbers.length} synchronized frames...`)
  const startTime = Date.now()

  for (let i = 0; i < frameNumbers.length; i++) {
    const frameNum = frameNumbers[i]

    // Collect frames from all cameras for this frame number
    const frameData: { cameraId: string; frame: Frame }[] = []
    for (const cam of cameras) {
      const frame = cam.frameMap.get(frameNum)
      if (frame && frame.detections.length > 0) {
        frameData.push({ cameraId: cam.cameraId, frame })
      }
    }

    if (frameData.length === 0) {
      if (skipEmpty) {
        skippedCount++
        continue
      }
    }

    if (frameData.length > 1) {
      multiCameraFrames++
    }

    // Send all camera detections for this frame simultaneously
    const timestamp = frameData[0]?.frame.timestamp ?? (frameNum / 30)
    const videoTimeMs = Math.round(timestamp * 1000)

    const sendPromises = frameData.map(async ({ cameraId, frame }) => {
      try {
        const response = await fetch(`${baseUrl}/api/emulator-detections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: cameraId,
            timestamp: frame.timestamp,
            frame_number: frame.frame_number,
            video_time_ms: videoTimeMs,
            detection_count: frame.detections.length,
            detections: frame.detections.map(d => ({
              class_name: d.class_name,
              confidence: d.confidence,
              bbox: d.bbox,
              track_id: d.track_id,
              attributes: d.attributes,
            })),
          }),
        })

        if (response.ok) {
          return { success: true, detections: frame.detections.length }
        } else {
          return { success: false, error: await response.text() }
        }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    })

    // Wait for all cameras to send (parallel)
    const results = await Promise.all(sendPromises)

    const frameSuccess = results.every(r => r.success)
    if (frameSuccess) {
      successCount++
      for (const r of results) {
        if (r.success && 'detections' in r) {
          totalDetections += r.detections
        }
      }
    } else {
      errorCount++
      if (!quiet) {
        const errors = results.filter(r => !r.success).map(r => ('error' in r ? r.error : 'unknown'))
        console.error(`\n  Frame ${frameNum} errors: ${errors.join(', ')}`)
      }
    }

    if (!quiet && i % 50 === 0) {
      process.stdout.write(`\r  [${i + 1}/${frameNumbers.length}] Frame ${frameNum}: ${frameData.length} cameras, ${frameData.reduce((s, f) => s + f.frame.detections.length, 0)} detections`)
    }

    // Wait for next frame
    if (i < frameNumbers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, frameInterval))
    }
  }

  const elapsed = (Date.now() - startTime) / 1000
  console.log(`\n\nReplay statistics:`)
  console.log(`  Frames sent: ${successCount}`)
  console.log(`  Frames skipped: ${skippedCount}`)
  console.log(`  Frames failed: ${errorCount}`)
  console.log(`  Multi-camera frames: ${multiCameraFrames} (${(multiCameraFrames / successCount * 100).toFixed(1)}%)`)
  console.log(`  Total detections: ${totalDetections}`)
  console.log(`  Elapsed time: ${elapsed.toFixed(2)}s`)
  console.log(`  Effective FPS: ${(successCount / elapsed).toFixed(2)}`)
}

program.parse()
