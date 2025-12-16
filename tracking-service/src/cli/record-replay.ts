#!/usr/bin/env node
/**
 * CLI Tool: Record a Replay Session
 *
 * Creates a recording package by:
 * - copying provided video files into `frontend/public/recordings/<recordingId>/`
 * - starting a tracking-service recorder that captures WS messages into NDJSON
 *
 * Usage:
 *   pnpm cli:record --recordingId myrun \
 *     --camera camera1=/abs/path/cam1.mp4 \
 *     --camera camera2=/abs/path/cam2.mp4 \
 *     --duration 60
 */

import { Command } from 'commander'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { extname } from 'path'
import { getDefaultReplayDirs, publicRecordingDir, toPublicRecordingUrl } from '../replay/paths.js'

interface CameraArg {
  cameraId: string
  sourcePath: string
}

function parseCameraArg(input: string): CameraArg {
  const idx = input.indexOf('=')
  if (idx < 1) throw new Error(`Invalid --camera value: ${input} (expected cameraId=/path/to/file)`)
  const cameraId = input.slice(0, idx).trim()
  const sourcePath = input.slice(idx + 1).trim()
  if (!cameraId || !sourcePath) throw new Error(`Invalid --camera value: ${input}`)
  return { cameraId, sourcePath }
}

const program = new Command()

program
  .name('record-replay')
  .description('Create a replay recording from existing video files + live tracking-service outputs')
  .requiredOption('--recordingId <id>', 'Recording ID (used as folder name)')
  .requiredOption('--camera <cameraId=path>', 'Camera mapping (repeat for camera1/camera2)', (v, prev: string[]) => {
    prev.push(v)
    return prev
  }, [])
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('--duration <seconds>', 'Auto-stop after N seconds (otherwise Ctrl+C)', '')
  .option('--snapshot-interval-ms <ms>', 'Snapshot interval for fast seeking', '2000')
  .option('--no-sitemap', 'Do not embed sitemap config into manifest (recording will still replay)')
  .action(async (options) => {
    const recordingId = String(options.recordingId)
    const baseUrl = String(options.url).replace(/\/$/, '')
    const snapshotIntervalMs = Number(options.snapshotIntervalMs ?? '2000')
    const durationSec = options.duration ? Number(options.duration) : null
    const includeSitemap = options.sitemap !== false

    const cameraArgs = (options.camera as string[]).map(parseCameraArg)
    if (cameraArgs.length < 1) {
      console.error('At least one --camera is required')
      process.exit(1)
    }

    // Copy videos into frontend/public so the replay page can load them as static assets.
    const dirs = getDefaultReplayDirs()
    const publicDir = publicRecordingDir(dirs.frontendRecordingsPublicDir, recordingId)
    mkdirSync(publicDir, { recursive: true })

    const cameras = cameraArgs.map(({ cameraId, sourcePath }) => {
      if (!existsSync(sourcePath)) {
        throw new Error(`Video file not found: ${sourcePath}`)
      }
      const ext = extname(sourcePath) || '.mp4'
      const fileName = `${cameraId}${ext}`
      const destPath = `${publicDir}/${fileName}`
      copyFileSync(sourcePath, destPath)
      const videoUrl = toPublicRecordingUrl(recordingId, fileName)
      return {
        cameraId,
        label: cameraId,
        videoUrl,
        sourcePath,
      }
    })

    let siteMapConfig: unknown | undefined
    if (includeSitemap) {
      try {
        const res = await fetch(`${baseUrl}/api/sitemap`, { headers: { Accept: 'application/json' } })
        if (res.ok) siteMapConfig = await res.json()
      } catch {
        // best-effort
      }
    }

    // Start recording
    const startRes = await fetch(`${baseUrl}/api/recordings/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordingId,
        snapshotIntervalMs,
        siteMapConfig,
        cameras,
        durationMs: durationSec && Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : undefined,
      }),
    })
    if (!startRes.ok) {
      const text = await startRes.text()
      console.error(`Failed to start recording (${startRes.status}): ${text}`)
      process.exit(1)
    }

    console.log(`Recording started: ${recordingId}`)
    console.log(`  Videos copied to: ${publicDir}`)
    console.log(`  Replay page will load: /replay/${recordingId}`)
    console.log(durationSec ? `  Auto-stopping in ${durationSec}s...` : '  Press Ctrl+C to stop...')

    const stop = async () => {
      try {
        await fetch(`${baseUrl}/api/recordings/${encodeURIComponent(recordingId)}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationMs: durationSec && Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : undefined,
          }),
        })
      } catch {
        // ignore
      }
    }

    const onSigint = async () => {
      console.log('\nStopping recording...')
      await stop()
      process.exit(0)
    }
    process.on('SIGINT', onSigint)
    process.on('SIGTERM', onSigint)

    if (durationSec && Number.isFinite(durationSec) && durationSec > 0) {
      await new Promise(resolve => setTimeout(resolve, durationSec * 1000))
      console.log('Stopping recording (duration reached)...')
      await stop()
      process.exit(0)
    } else {
      // Keep process alive until signal
      await new Promise(() => {})
    }
  })

program.parse(process.argv)


