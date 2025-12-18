#!/usr/bin/env node
/**
 * CLI Tool: Record a Replay from Preprocessed Assets (one iteration)
 *
 * This is an end-to-end "one shot" command:
 * - starts an in-process backend on an ephemeral port
 * - starts replay recording (NDJSON events + snapshots)
 * - replays 2-camera preprocessed detection metadata exactly once (no looping)
 * - stops recording and shuts down the server
 *
 * Default inputs mirror `camera-emulator/src/config.ts` (HC3->camera1, HC4->camera2).
 */

import { Command } from 'commander'
import { createReadStream, existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { extname } from 'path'
import { createServerWithComponents } from '../server.js'
import { getDefaultReplayDirs, publicRecordingDir, toPublicRecordingUrl } from '../replay/paths.js'

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

async function loadDetectionFile(filePath: string): Promise<DetectionFile> {
  if (!existsSync(filePath)) {
    throw new Error(`Detections file not found: ${filePath}`)
  }

  if (filePath.endsWith('.gz')) {
    const chunks: Buffer[] = []
    const gunzip = createGunzip()
    const source = createReadStream(filePath)
    await pipeline(
      source,
      gunzip,
      async function* (src) {
        for await (const chunk of src) {
          chunks.push(chunk as Buffer)
        }
      }
    )
    const content = Buffer.concat(chunks).toString('utf-8')
    return JSON.parse(content) as DetectionFile
  }

  return JSON.parse(readFileSync(filePath, 'utf-8')) as DetectionFile
}

function computeDurationMs(file: DetectionFile): number {
  if (typeof file.video_info.duration_seconds === 'number') {
    return Math.round(file.video_info.duration_seconds * 1000)
  }
  return Math.round((file.video_info.total_frames / file.video_info.fps) * 1000)
}

async function postBatchDetections(
  baseUrl: string,
  payload: unknown
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/emulator-detections/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Batch detections failed (${res.status}): ${text}`)
  }
}

async function startRecording(baseUrl: string, body: unknown): Promise<void> {
  const res = await fetch(`${baseUrl}/api/recordings/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Start recording failed (${res.status}): ${text}`)
  }
}

async function stopRecording(baseUrl: string, recordingId: string, durationMs: number): Promise<void> {
  const res = await fetch(`${baseUrl}/api/recordings/${encodeURIComponent(recordingId)}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ durationMs }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Stop recording failed (${res.status}): ${text}`)
  }
}

const program = new Command()

program
  .name('record-preprocessed-once')
  .description('One-shot: replay preprocessed HC3+HC4 detections once and record a replay package')
  .option('--recordingId <id>', 'Recording ID (folder name)', `preprocessed-${Date.now()}`)
  .option('--base-path <path>', 'Base path containing preprocessed assets', '/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p')
  .option('--hc3-detections <path>', 'HC3 detections file (.json or .json.gz)')
  .option('--hc4-detections <path>', 'HC4 detections file (.json or .json.gz)')
  .option('--hc3-video <path>', 'HC3 video file (.mp4)')
  .option('--hc4-video <path>', 'HC4 video file (.mp4)')
  .option('--snapshot-interval-ms <ms>', 'Snapshot interval for fast seeking', '2000')
  .action(async (options) => {
    const recordingId = String(options.recordingId)
    const basePath = String(options.basePath)
    const snapshotIntervalMs = Number(options.snapshotIntervalMs ?? '2000')

    const hc3Detections = options.hc3Detections ?? `${basePath}/view-HC3-reid.detections.json.gz`
    const hc4Detections = options.hc4Detections ?? `${basePath}/view-HC4-reid.detections.json.gz`
    const hc3Video = options.hc3Video ?? `${basePath}/view-HC3-preprocessed.mp4`
    const hc4Video = options.hc4Video ?? `${basePath}/view-HC4-preprocessed.mp4`

    // Start backend in-process on an ephemeral port.
    const { app } = await createServerWithComponents({ host: '127.0.0.1', port: 0 })
    const address = app.server.address()
    const port = typeof address === 'object' && address ? address.port : null
    if (!port) {
      await app.close()
      throw new Error('Failed to determine backend port')
    }
    const baseUrl = `http://127.0.0.1:${port}`

    try {
      // Copy videos into frontend/public so the replay page can load them as static assets.
      const dirs = getDefaultReplayDirs()
      const publicDir = publicRecordingDir(dirs.frontendRecordingsPublicDir, recordingId)
      mkdirSync(publicDir, { recursive: true })

      const v1Ext = extname(hc3Video) || '.mp4'
      const v2Ext = extname(hc4Video) || '.mp4'
      const v1Name = `camera1${v1Ext}`
      const v2Name = `camera2${v2Ext}`

      if (!existsSync(hc3Video)) throw new Error(`HC3 video not found: ${hc3Video}`)
      if (!existsSync(hc4Video)) throw new Error(`HC4 video not found: ${hc4Video}`)
      copyFileSync(hc3Video, `${publicDir}/${v1Name}`)
      copyFileSync(hc4Video, `${publicDir}/${v2Name}`)

      // Best-effort embed sitemap config (if DB is seeded).
      let siteMapConfig: unknown | undefined
      try {
        const res = await fetch(`${baseUrl}/api/sitemap`, { headers: { Accept: 'application/json' } })
        if (res.ok) siteMapConfig = await res.json()
      } catch {
        // ignore
      }

      // Load detection metadata
      console.log(`Loading detections:\n  HC3: ${hc3Detections}\n  HC4: ${hc4Detections}`)
      const [hc3, hc4] = await Promise.all([
        loadDetectionFile(hc3Detections),
        loadDetectionFile(hc4Detections),
      ])

      const fps = hc3.video_info.fps
      const durationMs = Math.max(computeDurationMs(hc3), computeDurationMs(hc4))

      // Start recording (camera1/camera2 videos)
      await startRecording(baseUrl, {
        recordingId,
        snapshotIntervalMs,
        durationMs,
        siteMapConfig,
        cameras: [
          {
            cameraId: 'camera1',
            label: 'camera1',
            videoUrl: toPublicRecordingUrl(recordingId, v1Name),
            sourcePath: hc3Video,
          },
          {
            cameraId: 'camera2',
            label: 'camera2',
            videoUrl: toPublicRecordingUrl(recordingId, v2Name),
            sourcePath: hc4Video,
          },
        ],
      })

      // Replay detections once, frame-aligned via batch endpoint.
      const frames1 = hc3.frames
      const frames2 = hc4.frames
      const n = Math.min(frames1.length, frames2.length)

      console.log(`Replaying ${n} frames (batch)…`)

      for (let i = 0; i < n; i++) {
        const f1 = frames1[i]
        const f2 = frames2[i]

        const videoTimeMs = Math.round((i / fps) * 1000)

        await postBatchDetections(baseUrl, {
          detections: [
            {
              camera_id: 'camera1',
              timestamp: f1.timestamp,
              frame_number: f1.frame_number,
              video_time_ms: videoTimeMs,
              detections: f1.detections.map(d => ({
                class_name: d.class_name,
                confidence: d.confidence,
                bbox: d.bbox,
                track_id: d.track_id,
                attributes: d.attributes,
              })),
            },
            {
              camera_id: 'camera2',
              timestamp: f2.timestamp,
              frame_number: f2.frame_number,
              video_time_ms: videoTimeMs,
              detections: f2.detections.map(d => ({
                class_name: d.class_name,
                confidence: d.confidence,
                bbox: d.bbox,
                track_id: d.track_id,
                attributes: d.attributes,
              })),
            },
          ],
        })
      }

      await stopRecording(baseUrl, recordingId, durationMs)

      console.log(`\n✅ Recording complete: ${recordingId}`)
      console.log(`- Replay UI: /replay/${recordingId}`)
      console.log(`- Public videos: ${publicDir}`)
      console.log(`- Recorded events: ${dirs.recordingsDir}/${recordingId}/events.ndjson`)
    } finally {
      await app.close()
    }
  })

program.parse(process.argv)


