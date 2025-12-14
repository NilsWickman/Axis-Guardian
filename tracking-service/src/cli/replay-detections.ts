#!/usr/bin/env node
/**
 * CLI Tool: Replay Preprocessed Detections
 *
 * Replays detection data from preprocessed JSON files to the tracking service,
 * simulating camera emulators sending real detection data.
 *
 * Usage:
 *   # With re-ID embeddings (recommended):
 *   pnpm cli:replay --file ../shared/cameras/preprocessed/1080p/view-HC3-reid.detections.json.gz --camera camera1
 *
 *   # Without embeddings (spatial-only):
 *   pnpm cli:replay --file ../shared/cameras/preprocessed/1080p/view-HC3-preprocessed.detections.json.gz --camera camera1
 *
 *   # With options:
 *   pnpm cli:replay --file detections.json --camera camera1 --speed 2.0 --loop
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
    duration_seconds: number
  }
  frames: Frame[]
}

const program = new Command()

program
  .name('replay-detections')
  .description('Replay preprocessed detection data to the tracking service')
  .requiredOption('-f, --file <path>', 'Path to detection JSON file (supports .json and .json.gz)')
  .requiredOption('-c, --camera <id>', 'Camera ID to use (e.g., camera1, camera-HC3)')
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('-s, --speed <multiplier>', 'Playback speed multiplier (1.0 = real-time)', '1.0')
  .option('-l, --loop', 'Loop playback continuously', false)
  .option('--start-frame <n>', 'Start from frame number', '0')
  .option('--end-frame <n>', 'End at frame number (0 = all frames)')
  .option('--skip-empty', 'Skip frames with no detections', false)
  .option('--dry-run', 'Show what would be sent without actually sending', false)
  .option('--quiet', 'Suppress per-frame output', false)
  .action(async (options) => {
    const baseUrl = options.url
    const cameraId = options.camera
    const speed = parseFloat(options.speed)
    const startFrame = parseInt(options.startFrame, 10)
    const endFrame = parseInt(options.endFrame || '0', 10)

    // Load detection file
    console.log(`Loading detections from: ${options.file}`)
    const data = await loadDetectionFile(options.file)

    if (!data) {
      console.error('Failed to load detection file')
      process.exit(1)
    }

    const fps = data.video_info.fps
    const frameInterval = (1000 / fps) / speed
    const totalFrames = data.frames.length

    console.log(`\nDetection file info:`)
    console.log(`  Format version: ${data.format_version}`)
    console.log(`  FPS: ${fps.toFixed(2)}`)
    console.log(`  Total frames: ${totalFrames}`)
    console.log(`  Duration: ${data.video_info.duration_seconds.toFixed(2)}s`)
    console.log(`\nPlayback settings:`)
    console.log(`  Camera ID: ${cameraId}`)
    console.log(`  Speed: ${speed}x`)
    console.log(`  Frame interval: ${frameInterval.toFixed(1)}ms`)
    console.log(`  Loop: ${options.loop}`)
    if (startFrame > 0) console.log(`  Start frame: ${startFrame}`)
    if (endFrame > 0) console.log(`  End frame: ${endFrame}`)
    console.log('')

    if (options.dryRun) {
      console.log('DRY RUN - showing first 5 frames:')
      for (let i = 0; i < Math.min(5, data.frames.length); i++) {
        const frame = data.frames[i]
        console.log(`  Frame ${frame.frame_number}: ${frame.detections.length} detections`)
        for (const det of frame.detections.slice(0, 3)) {
          console.log(`    - track_id=${det.track_id} conf=${det.confidence.toFixed(2)} bbox=(${det.bbox.left.toFixed(2)},${det.bbox.top.toFixed(2)})`)
        }
        if (frame.detections.length > 3) {
          console.log(`    ... and ${frame.detections.length - 3} more`)
        }
      }
      return
    }

    // Main replay loop
    let loopCount = 0
    do {
      loopCount++
      if (options.loop && loopCount > 1) {
        console.log(`\n--- Loop ${loopCount} ---\n`)
        // Reset tracks between loops
        await fetch(`${baseUrl}/api/reset`, { method: 'POST' })
      }

      await replayFrames(data.frames, {
        baseUrl,
        cameraId,
        frameInterval,
        startFrame,
        endFrame: endFrame > 0 ? endFrame : totalFrames,
        skipEmpty: options.skipEmpty,
        quiet: options.quiet,
      })

    } while (options.loop)

    console.log('\nReplay complete!')

    // Show final track state
    try {
      const response = await fetch(`${baseUrl}/api/tracks`)
      const trackData = await response.json() as { tracks: Array<{ globalTrackId: string; currentPosition: { x: number; y: number }; trail: unknown[] }> }
      console.log(`\nActive tracks: ${trackData.tracks.length}`)
      for (const track of trackData.tracks.slice(0, 10)) {
        console.log(`  ${track.globalTrackId}: (${track.currentPosition.x.toFixed(2)}, ${track.currentPosition.y.toFixed(2)}) - ${track.trail.length} trail points`)
      }
      if (trackData.tracks.length > 10) {
        console.log(`  ... and ${trackData.tracks.length - 10} more`)
      }
    } catch {
      // Ignore errors fetching final state
    }
  })

async function loadDetectionFile(filePath: string): Promise<DetectionFile | null> {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return null
  }

  try {
    if (filePath.endsWith('.gz')) {
      // Decompress gzipped file
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
      // Read plain JSON
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Error loading file:', error)
    return null
  }
}

interface ReplayOptions {
  baseUrl: string
  cameraId: string
  frameInterval: number
  startFrame: number
  endFrame: number
  skipEmpty: boolean
  quiet: boolean
}

async function replayFrames(frames: Frame[], options: ReplayOptions): Promise<void> {
  const { baseUrl, cameraId, frameInterval, startFrame, endFrame, skipEmpty, quiet } = options

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let totalDetections = 0

  const filteredFrames = frames.filter(f =>
    f.frame_number >= startFrame &&
    f.frame_number < endFrame &&
    (!skipEmpty || f.detections.length > 0)
  )

  console.log(`Replaying ${filteredFrames.length} frames...`)
  const startTime = Date.now()

  for (let i = 0; i < filteredFrames.length; i++) {
    const frame = filteredFrames[i]

    if (frame.detections.length === 0) {
      skippedCount++
      continue
    }

    try {
      const response = await fetch(`${baseUrl}/api/emulator-detections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: cameraId,
          timestamp: frame.timestamp,
          frame_number: frame.frame_number,
          detection_count: frame.detections.length,
          detections: frame.detections.map(d => ({
            class_name: d.class_name,
            confidence: d.confidence,
            bbox: d.bbox,
            track_id: d.track_id,
            attributes: d.attributes,  // Pass through re-ID attributes
          })),
        }),
      })

      if (response.ok) {
        successCount++
        totalDetections += frame.detections.length

        if (!quiet) {
          const result = await response.json() as { results: Array<{ track: { globalTrackId: string } | null }> }
          const trackIds = result.results
            .filter(r => r.track)
            .map(r => r.track!.globalTrackId)
            .filter((v, i, a) => a.indexOf(v) === i) // unique

          process.stdout.write(`\r  [${i + 1}/${filteredFrames.length}] Frame ${frame.frame_number}: ${frame.detections.length} detections -> ${trackIds.length} tracks`)
        }
      } else {
        errorCount++
        if (!quiet) {
          const error = await response.text()
          console.error(`\n  Frame ${frame.frame_number} error: ${error}`)
        }
      }
    } catch (error) {
      errorCount++
      if (!quiet) {
        console.error(`\n  Frame ${frame.frame_number} error:`, error)
      }
    }

    // Wait for next frame (unless this is the last one)
    if (i < filteredFrames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, frameInterval))
    }
  }

  const elapsed = (Date.now() - startTime) / 1000
  console.log(`\n\nReplay statistics:`)
  console.log(`  Frames sent: ${successCount}`)
  console.log(`  Frames skipped: ${skippedCount}`)
  console.log(`  Frames failed: ${errorCount}`)
  console.log(`  Total detections: ${totalDetections}`)
  console.log(`  Elapsed time: ${elapsed.toFixed(2)}s`)
  console.log(`  Effective FPS: ${(successCount / elapsed).toFixed(2)}`)
}

program.parse()
