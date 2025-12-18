#!/usr/bin/env -S pnpm -C backend exec tsx
import { spawnSync } from 'node:child_process'
import { createReadStream, createWriteStream, promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = resolve(__dirname, '..')

const BACKEND_RECORDINGS_DIR = resolve(repoRoot, 'backend', 'recordings')
const FRONTEND_RECORDINGS_DIR = resolve(repoRoot, 'frontend', 'public', 'recordings')

const SEGMENT_MS = 30_000
const OUTPUT_IDS = [
  'beginning, many people walking',
  'middle two stationary objects',
  'end many people running',
]

type Manifest = {
  createdAtMs?: number
  durationMs?: number
  cameras?: Array<{ videoUrl: string }>
  [key: string]: unknown
}

type NdjsonEvent = {
  seq?: number
  videoTimeMs?: number
  payload?: {
    track?: {
      videoTiming?: { videoTimeMs?: number }
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

type Snapshot = {
  videoTimeMs?: number
  state?: unknown
  [key: string]: unknown
}

function encodeRecordingId(recordingId: string): string {
  return encodeURIComponent(recordingId)
}

async function listRecordingIds(recordingsDir: string): Promise<string[]> {
  const entries = await fs.readdir(recordingsDir, { withFileTypes: true }).catch(() => [])
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function readJson<T>(path: string): Promise<T> {
  const raw = await fs.readFile(path, 'utf-8')
  return JSON.parse(raw) as T
}

async function pickNewestRecordingId(): Promise<string | null> {
  const ids = await listRecordingIds(BACKEND_RECORDINGS_DIR)
  let best: { id: string; createdAtMs: number } | null = null

  for (const id of ids) {
    const manifestPath = resolve(BACKEND_RECORDINGS_DIR, id, 'manifest.json')
    try {
      const manifest = await readJson<Manifest>(manifestPath)
      const createdAtMs = typeof manifest.createdAtMs === 'number' ? manifest.createdAtMs : 0
      if (!best || createdAtMs > best.createdAtMs) best = { id, createdAtMs }
    } catch {
      // ignore
    }
  }

  return best?.id ?? null
}

function getFileNameFromVideoUrl(videoUrl: string): string {
  const normalized = String(videoUrl).split('?')[0]
  const parts = normalized.split('/')
  return parts[parts.length - 1] ?? ''
}

function runFfmpegClip(args: {
  inputPath: string
  outputPath: string
  startMs: number
  durationMs: number
}): void {
  const startSec = (args.startMs / 1000).toFixed(3)
  const durationSec = (args.durationMs / 1000).toFixed(3)
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
      args.inputPath,
      '-t',
      durationSec,
      '-map',
      '0',
      '-c',
      'copy',
      '-avoid_negative_ts',
      'make_zero',
      args.outputPath,
    ],
    { stdio: 'inherit' },
  )

  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (${res.status}) for ${args.outputPath}`)
  }
}

async function filterEvents(args: {
  inputPath: string
  outputPath: string
  startMs: number
  endMs: number
}): Promise<void> {
  const rl = readline.createInterface({
    input: createReadStream(args.inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })
  const out = createWriteStream(args.outputPath, { encoding: 'utf-8' })

  let seq = 0
  for await (const line of rl) {
    if (!line) continue
    let evt: NdjsonEvent
    try {
      evt = JSON.parse(line) as NdjsonEvent
    } catch {
      continue
    }

    const videoTimeMs = evt.videoTimeMs
    if (typeof videoTimeMs !== 'number') continue
    if (videoTimeMs < args.startMs || videoTimeMs > args.endMs) continue

    const shifted = Math.max(0, videoTimeMs - args.startMs)
    seq += 1
    evt.seq = seq
    evt.videoTimeMs = shifted

    const timing = evt.payload?.track?.videoTiming
    if (timing && typeof timing.videoTimeMs === 'number') {
      timing.videoTimeMs = Math.max(0, timing.videoTimeMs - args.startMs)
    }

    out.write(`${JSON.stringify(evt)}\n`)
  }

  await new Promise<void>((resolvePromise, reject) => {
    out.end(() => resolvePromise())
    out.on('error', reject)
  })
}

async function filterSnapshots(args: {
  inputPath: string
  outputPath: string
  startMs: number
  endMs: number
}): Promise<void> {
  const rl = readline.createInterface({
    input: createReadStream(args.inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })

  let bestAtOrBeforeStart: Snapshot | null = null
  const inWindow: Snapshot[] = []

  for await (const line of rl) {
    if (!line) continue
    let snap: Snapshot
    try {
      snap = JSON.parse(line) as Snapshot
    } catch {
      continue
    }

    const t = snap.videoTimeMs
    if (typeof t !== 'number') continue
    if (t <= args.startMs) {
      if (!bestAtOrBeforeStart || (typeof bestAtOrBeforeStart.videoTimeMs === 'number' && t >= bestAtOrBeforeStart.videoTimeMs)) {
        bestAtOrBeforeStart = snap
      }
      continue
    }
    if (t > args.endMs) continue
    inWindow.push(snap)
  }

  inWindow.sort((a, b) => (a.videoTimeMs ?? 0) - (b.videoTimeMs ?? 0))

  const out = createWriteStream(args.outputPath, { encoding: 'utf-8' })

  const base =
    bestAtOrBeforeStart ??
    (inWindow.length > 0 ? inWindow[0] : null) ??
    ({ videoTimeMs: 0, state: { tracks: [], zones: [], zoneMetrics: [] } } satisfies Snapshot)

  out.write(`${JSON.stringify({ ...base, videoTimeMs: 0 })}\n`)

  for (const snap of inWindow) {
    const shifted = Math.max(0, (snap.videoTimeMs ?? 0) - args.startMs)
    if (shifted === 0) continue
    out.write(`${JSON.stringify({ ...snap, videoTimeMs: shifted })}\n`)
  }

  await new Promise<void>((resolvePromise, reject) => {
    out.end(() => resolvePromise())
    out.on('error', reject)
  })
}

async function ensureCleanDirs(dirs: string[]): Promise<void> {
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function removeAllExcept(rootDir: string, keepDirNames: string[]): Promise<void> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => [])
  for (const e of entries) {
    if (!e.isDirectory()) continue
    if (keepDirNames.includes(e.name)) continue
    await fs.rm(resolve(rootDir, e.name), { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  await ensureCleanDirs([BACKEND_RECORDINGS_DIR, FRONTEND_RECORDINGS_DIR])

  const sourceId = await pickNewestRecordingId()
  if (!sourceId) {
    throw new Error('No source recording found in backend/recordings/')
  }

  const sourceBackendDir = resolve(BACKEND_RECORDINGS_DIR, sourceId)
  const sourceFrontendDir = resolve(FRONTEND_RECORDINGS_DIR, sourceId)

  const manifestPath = resolve(sourceBackendDir, 'manifest.json')
  const eventsPath = resolve(sourceBackendDir, 'events.ndjson')
  const snapshotsPath = resolve(sourceBackendDir, 'snapshots.ndjson')

  const manifest = await readJson<Manifest>(manifestPath)
  const durationMs = typeof manifest.durationMs === 'number' ? manifest.durationMs : null
  if (!durationMs || !Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('Source manifest is missing a valid durationMs')
  }

  const segmentMs = Math.min(SEGMENT_MS, durationMs)
  const midStartMs = Math.max(0, Math.round(durationMs / 2 - segmentMs / 2))
  const endStartMs = Math.max(0, durationMs - segmentMs)

  const segments = [
    { id: OUTPUT_IDS[0]!, startMs: 0, durationMs: segmentMs },
    { id: OUTPUT_IDS[1]!, startMs: midStartMs, durationMs: segmentMs },
    { id: OUTPUT_IDS[2]!, startMs: endStartMs, durationMs: segmentMs },
  ]

  const cameras = Array.isArray(manifest.cameras) ? manifest.cameras : []
  if (cameras.length === 0) throw new Error('Source manifest has no cameras')

  for (const seg of segments) {
    const outBackendDir = resolve(BACKEND_RECORDINGS_DIR, seg.id)
    const outFrontendDir = resolve(FRONTEND_RECORDINGS_DIR, seg.id)
    await fs.rm(outBackendDir, { recursive: true, force: true })
    await fs.rm(outFrontendDir, { recursive: true, force: true })
    await fs.mkdir(outBackendDir, { recursive: true })
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
    const newManifest: Manifest = {
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

    await fs.writeFile(resolve(outBackendDir, 'manifest.json'), JSON.stringify(newManifest, null, 2), 'utf-8')

    const segEndMs = seg.startMs + seg.durationMs
    await filterEvents({
      inputPath: eventsPath,
      outputPath: resolve(outBackendDir, 'events.ndjson'),
      startMs: seg.startMs,
      endMs: segEndMs,
    })

    await filterSnapshots({
      inputPath: snapshotsPath,
      outputPath: resolve(outBackendDir, 'snapshots.ndjson'),
      startMs: seg.startMs,
      endMs: segEndMs,
    })
  }

  await removeAllExcept(BACKEND_RECORDINGS_DIR, segments.map((s) => s.id))
  await removeAllExcept(FRONTEND_RECORDINGS_DIR, segments.map((s) => s.id))

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
