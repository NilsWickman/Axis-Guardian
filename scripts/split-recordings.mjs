#!/usr/bin/env node
import { createReadStream, createWriteStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import readline from 'node:readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')

const TRACKING_RECORDINGS_DIR = resolve(repoRoot, 'tracking-service', 'recordings')
const FRONTEND_RECORDINGS_DIR = resolve(repoRoot, 'frontend', 'public', 'recordings')

const SEGMENT_MS = 30_000
const OUTPUT_IDS = [
  'beginning, many people walking',
  'middle two stationary objects',
  'end many people running',
]

function encodeRecordingId(recordingId) {
  return encodeURIComponent(recordingId)
}

async function listRecordingIds(recordingsDir) {
  const entries = await fs.readdir(recordingsDir, { withFileTypes: true }).catch(() => [])
  return entries.filter(e => e.isDirectory()).map(e => e.name)
}

async function readJson(path) {
  const raw = await fs.readFile(path, 'utf-8')
  return JSON.parse(raw)
}

async function pickNewestRecordingId() {
  const ids = await listRecordingIds(TRACKING_RECORDINGS_DIR)
  let best = null
  for (const id of ids) {
    const manifestPath = resolve(TRACKING_RECORDINGS_DIR, id, 'manifest.json')
    try {
      const manifest = await readJson(manifestPath)
      const createdAtMs = typeof manifest?.createdAtMs === 'number' ? manifest.createdAtMs : 0
      if (!best || createdAtMs > best.createdAtMs) {
        best = { id, createdAtMs }
      }
    } catch {
      // ignore
    }
  }
  return best?.id ?? null
}

function getFileNameFromVideoUrl(videoUrl) {
  const normalized = String(videoUrl).split('?')[0]
  const parts = normalized.split('/')
  return parts[parts.length - 1]
}

function runFfmpegClip({ inputPath, outputPath, startMs, durationMs }) {
  const startSec = (startMs / 1000).toFixed(3)
  const durationSec = (durationMs / 1000).toFixed(3)
  const res = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      startSec,
      '-i',
      inputPath,
      '-t',
      durationSec,
      '-map',
      '0',
      '-c',
      'copy',
      '-avoid_negative_ts',
      'make_zero',
      outputPath,
    ],
    { stdio: 'inherit' }
  )
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (${res.status}) for ${outputPath}`)
  }
}

async function filterEvents({ inputPath, outputPath, startMs, endMs }) {
  const rl = readline.createInterface({
    input: createReadStream(inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })
  const out = createWriteStream(outputPath, { encoding: 'utf-8' })

  let seq = 0
  for await (const line of rl) {
    if (!line) continue
    let evt
    try {
      evt = JSON.parse(line)
    } catch {
      continue
    }
    const videoTimeMs = evt?.videoTimeMs
    if (typeof videoTimeMs !== 'number') continue
    if (videoTimeMs < startMs || videoTimeMs > endMs) continue

    const shifted = Math.max(0, videoTimeMs - startMs)
    seq += 1
    evt.seq = seq
    evt.videoTimeMs = shifted

    const timing = evt?.payload?.track?.videoTiming
    if (timing && typeof timing.videoTimeMs === 'number') {
      timing.videoTimeMs = Math.max(0, timing.videoTimeMs - startMs)
    }

    out.write(`${JSON.stringify(evt)}\n`)
  }

  await new Promise((resolve, reject) => {
    out.end(() => resolve())
    out.on('error', reject)
  })
}

async function filterSnapshots({ inputPath, outputPath, startMs, endMs }) {
  const rl = readline.createInterface({
    input: createReadStream(inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })

  let bestAtOrBeforeStart = null
  const inWindow = []

  for await (const line of rl) {
    if (!line) continue
    let snap
    try {
      snap = JSON.parse(line)
    } catch {
      continue
    }
    const t = snap?.videoTimeMs
    if (typeof t !== 'number') continue
    if (t <= startMs) {
      if (!bestAtOrBeforeStart || t >= bestAtOrBeforeStart.videoTimeMs) {
        bestAtOrBeforeStart = snap
      }
      continue
    }
    if (t > endMs) continue
    inWindow.push(snap)
  }

  inWindow.sort((a, b) => a.videoTimeMs - b.videoTimeMs)

  const out = createWriteStream(outputPath, { encoding: 'utf-8' })

  const base =
    bestAtOrBeforeStart
    ?? (inWindow.length > 0 ? inWindow[0] : null)
    ?? { videoTimeMs: 0, state: { tracks: [], zones: [], zoneMetrics: [] } }

  out.write(`${JSON.stringify({ ...base, videoTimeMs: 0 })}\n`)

  for (const snap of inWindow) {
    const shifted = Math.max(0, snap.videoTimeMs - startMs)
    if (shifted === 0) continue
    out.write(`${JSON.stringify({ ...snap, videoTimeMs: shifted })}\n`)
  }

  await new Promise((resolve, reject) => {
    out.end(() => resolve())
    out.on('error', reject)
  })
}

async function ensureCleanDirs(dirs) {
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function removeAllExcept(rootDir, keepDirNames) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => [])
  for (const e of entries) {
    if (!e.isDirectory()) continue
    if (keepDirNames.includes(e.name)) continue
    await fs.rm(resolve(rootDir, e.name), { recursive: true, force: true })
  }
}

async function main() {
  await ensureCleanDirs([TRACKING_RECORDINGS_DIR, FRONTEND_RECORDINGS_DIR])

  const sourceId = await pickNewestRecordingId()
  if (!sourceId) {
    throw new Error('No source recording found in tracking-service/recordings/')
  }

  const sourceTrackingDir = resolve(TRACKING_RECORDINGS_DIR, sourceId)
  const sourceFrontendDir = resolve(FRONTEND_RECORDINGS_DIR, sourceId)

  const manifestPath = resolve(sourceTrackingDir, 'manifest.json')
  const eventsPath = resolve(sourceTrackingDir, 'events.ndjson')
  const snapshotsPath = resolve(sourceTrackingDir, 'snapshots.ndjson')

  const manifest = await readJson(manifestPath)
  const durationMs = typeof manifest?.durationMs === 'number' ? manifest.durationMs : null
  if (!durationMs || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('Source manifest is missing a valid durationMs')
  }

  const segmentMs = Math.min(SEGMENT_MS, durationMs)
  const midStartMs = Math.max(0, Math.round(durationMs / 2 - segmentMs / 2))
  const endStartMs = Math.max(0, durationMs - segmentMs)

  const segments = [
    { id: OUTPUT_IDS[0], startMs: 0, durationMs: segmentMs },
    { id: OUTPUT_IDS[1], startMs: midStartMs, durationMs: segmentMs },
    { id: OUTPUT_IDS[2], startMs: endStartMs, durationMs: segmentMs },
  ]

  const cameras = Array.isArray(manifest?.cameras) ? manifest.cameras : []
  if (cameras.length === 0) throw new Error('Source manifest has no cameras')

  for (const seg of segments) {
    const outTrackingDir = resolve(TRACKING_RECORDINGS_DIR, seg.id)
    const outFrontendDir = resolve(FRONTEND_RECORDINGS_DIR, seg.id)
    await fs.rm(outTrackingDir, { recursive: true, force: true })
    await fs.rm(outFrontendDir, { recursive: true, force: true })
    await fs.mkdir(outTrackingDir, { recursive: true })
    await fs.mkdir(outFrontendDir, { recursive: true })

    for (const cam of cameras) {
      const fileName = getFileNameFromVideoUrl(cam.videoUrl)
      const inputVideoPath = resolve(sourceFrontendDir, fileName)
      const outputVideoPath = resolve(outFrontendDir, fileName)

      await fs.access(inputVideoPath)
      runFfmpegClip({
        inputPath: inputVideoPath,
        outputPath: outputVideoPath,
        startMs: seg.startMs,
        durationMs: seg.durationMs,
      })
    }

    const createdAtMs = Date.now()
    const encodedId = encodeRecordingId(seg.id)
    const newManifest = {
      ...manifest,
      recordingId: seg.id,
      createdAtMs,
      endedAtMs: createdAtMs + seg.durationMs,
      durationMs: seg.durationMs,
      cameras: cameras.map((c) => {
        const fileName = getFileNameFromVideoUrl(c.videoUrl)
        return {
          ...c,
          videoUrl: `/recordings/${encodedId}/${fileName}`,
        }
      }),
    }

    await fs.writeFile(resolve(outTrackingDir, 'manifest.json'), JSON.stringify(newManifest, null, 2), 'utf-8')

    const segEndMs = seg.startMs + seg.durationMs
    await filterEvents({
      inputPath: eventsPath,
      outputPath: resolve(outTrackingDir, 'events.ndjson'),
      startMs: seg.startMs,
      endMs: segEndMs,
    })

    await filterSnapshots({
      inputPath: snapshotsPath,
      outputPath: resolve(outTrackingDir, 'snapshots.ndjson'),
      startMs: seg.startMs,
      endMs: segEndMs,
    })
  }

  await removeAllExcept(TRACKING_RECORDINGS_DIR, segments.map(s => s.id))
  await removeAllExcept(FRONTEND_RECORDINGS_DIR, segments.map(s => s.id))

  console.log('Done.')
  console.log(`Source: ${sourceId}`)
  for (const seg of segments) {
    console.log(`- ${seg.id} (${seg.startMs}ms..${seg.startMs + seg.durationMs}ms)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
