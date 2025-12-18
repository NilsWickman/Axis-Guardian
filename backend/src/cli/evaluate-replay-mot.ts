#!/usr/bin/env node
/**
 * CLI Tool: Evaluate a Replay Recording with MOT-style Metrics
 *
 * This reuses the logic from `tests/integration/mot-challenge-metrics.test.ts`,
 * but instead of running TrackManager, it reads a replay recording's `events.ndjson`
 * and reconstructs the active track state over time.
 *
 * Metrics (same simplified MOT-like definitions as the existing test):
 * - MOTA = 1 - (FN + FP + IDSW) / GT
 * - Recall, Precision
 * - Counts of GT, matches, FN, FP, IDSW
 */

import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { gunzipSync } from 'zlib'

interface TrackTruthAnnotation {
  id: string
  globalTrackId: string // "camera1-N"
  personId: number
  assignedAt: string
}

interface TrackTruthsDataset {
  version: string
  annotations: TrackTruthAnnotation[]
  persons: Array<{ id: number; label: string; color: string }>
}

interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Array<{
    bbox: { left: number; top: number; right: number; bottom: number }
    confidence: number
    class_name: string
    track_id: number
  }>
}

interface DetectionFile {
  format_version: string
  video_info: {
    fps: number
    total_frames: number
    duration_seconds?: number
  }
  frames: DetectionFrame[]
}

type ReplayEvent = {
  seq: number
  videoTimeMs: number
  type: string
  payload: any
}

type Assoc = { cameraId: string; trackIds: number[]; lastSeen: number; lastFrameNumber?: number }
type TrackJSON = {
  globalTrackId: string
  cameraAssociations: Record<string, Assoc>
  currentPosition: { x: number; y: number }
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  confidence: number
  state: string
  videoTiming?: { videoTimeMs: number; frameNumber: number; cameraId: string; rtpTimestamp?: number }
}

function loadJsonOrGz<T>(filePath: string): T {
  const content = readFileSync(filePath)
  if (filePath.endsWith('.gz')) {
    return JSON.parse(gunzipSync(content).toString('utf-8')) as T
  }
  return JSON.parse(content.toString('utf-8')) as T
}

function loadTrackTruths(path: string): TrackTruthsDataset {
  return JSON.parse(readFileSync(path, 'utf-8')) as TrackTruthsDataset
}

function loadDetectionFile(path: string): DetectionFile {
  return loadJsonOrGz<DetectionFile>(path)
}

function loadReplayEvents(eventsPath: string): ReplayEvent[] {
  const lines = readFileSync(eventsPath, 'utf-8').split('\n')
  const out: ReplayEvent[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const obj = JSON.parse(trimmed) as ReplayEvent
      if (typeof obj.videoTimeMs === 'number' && typeof obj.seq === 'number' && typeof obj.type === 'string') {
        out.push(obj)
      }
    } catch {
      // ignore
    }
  }
  // Deterministic time order
  out.sort((a, b) => (a.videoTimeMs - b.videoTimeMs) || (a.seq - b.seq))
  return out
}

function computeMetrics(args: {
  recordingDir: string
  trackTruthsPath: string
  detectionsDir: string
  sampleEveryN: number
}) {
  const trackTruths = loadTrackTruths(args.trackTruthsPath)

  // Build cameraTrackId -> personId mapping (ground truth identity)
  const cameraTrackToPerson = new Map<string, number>()
  const personToCameraTracks = new Map<number, Set<string>>()
  for (const ann of trackTruths.annotations) {
    cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
    if (!personToCameraTracks.has(ann.personId)) personToCameraTracks.set(ann.personId, new Set())
    personToCameraTracks.get(ann.personId)!.add(ann.globalTrackId)
  }

  const det1 = loadDetectionFile(join(args.detectionsDir, 'view-HC3-reid.detections.json.gz'))
  const det2 = loadDetectionFile(join(args.detectionsDir, 'view-HC4-reid.detections.json.gz'))

  const allFrames: Array<{ cameraId: string; frame: DetectionFrame }> = []
  for (const f of det1.frames) allFrames.push({ cameraId: 'camera1', frame: f })
  for (const f of det2.frames) allFrames.push({ cameraId: 'camera2', frame: f })
  allFrames.sort((a, b) => a.frame.timestamp - b.frame.timestamp)
  const sampled = allFrames.filter((_, i) => i % args.sampleEveryN === 0)

  const eventsPath = resolve(args.recordingDir, 'events.ndjson')
  const events = loadReplayEvents(eventsPath)

  // Track state reconstructed from replay
  const activeTracks = new Map<string, TrackJSON>()
  const allTracks = new Map<string, TrackJSON>()
  const allTrackIds = new Set<string>()

  let ei = 0
  function applyEvent(evt: ReplayEvent): void {
    if (evt.type === 'track_created' || evt.type === 'track_updated') {
      const t = evt.payload?.track as TrackJSON | undefined
      if (!t || typeof t.globalTrackId !== 'string') return
      allTrackIds.add(t.globalTrackId)
      allTracks.set(t.globalTrackId, t)
      if (t.isActive) activeTracks.set(t.globalTrackId, t)
      else activeTracks.delete(t.globalTrackId)
    } else if (evt.type === 'track_expired') {
      const id = evt.payload?.trackId as string | undefined
      if (!id) return
      activeTracks.delete(id)
      const prev = allTracks.get(id)
      if (prev) {
        allTracks.set(id, { ...prev, isActive: false })
      }
    }
  }

  // Accumulators (same definitions as the existing test)
  let totalGT = 0
  let totalFP = 0
  let totalFN = 0
  let totalIDSW = 0
  let totalMatches = 0
  const lastAssignment = new Map<number, string>()

  for (const { cameraId, frame } of sampled) {
    const frameTimeMs = Math.round(frame.timestamp * 1000)

    while (ei < events.length && events[ei].videoTimeMs <= frameTimeMs) {
      applyEvent(events[ei])
      ei++
    }

    // GT persons visible in this frame (only annotated detections)
    const gtPersonsInFrame = new Set<number>()
    for (const det of frame.detections) {
      const cameraTrackId = `${cameraId}-${det.track_id}`
      const personId = cameraTrackToPerson.get(cameraTrackId)
      if (personId !== undefined) gtPersonsInFrame.add(personId)
    }
    totalGT += gtPersonsInFrame.size

    const active = Array.from(activeTracks.values())

    const trackedPersons = new Set<number>()
    const framePersonClaims = new Map<number, { trackId: string; recency: number }[]>()

    for (const track of active) {
      const assocs = track.cameraAssociations || {}
      for (const camKey of Object.keys(assocs)) {
        const assoc = assocs[camKey]
        if (!assoc?.trackIds) continue
        for (const tid of assoc.trackIds) {
          const cameraTrackId = `${camKey}-${tid}`
          const personId = cameraTrackToPerson.get(cameraTrackId)
          if (personId !== undefined && gtPersonsInFrame.has(personId)) {
            const claims = framePersonClaims.get(personId) || []
            claims.push({ trackId: track.globalTrackId, recency: assoc.lastSeen })
            framePersonClaims.set(personId, claims)
          }
        }
      }
    }

    // Pick best track per person, count ID switches
    for (const [personId, claims] of framePersonClaims) {
      claims.sort((a, b) => b.recency - a.recency)
      const bestTrackId = claims[0].trackId
      const last = lastAssignment.get(personId)
      if (last && last !== bestTrackId) totalIDSW++
      lastAssignment.set(personId, bestTrackId)
      trackedPersons.add(personId)
      totalMatches++
    }

    // FN
    for (const personId of gtPersonsInFrame) {
      if (!trackedPersons.has(personId)) totalFN++
    }

    // FP (duplicate tracks per person)
    const personToTracks = new Map<number, string[]>()
    for (const track of active) {
      const assocs = track.cameraAssociations || {}
      for (const camKey of Object.keys(assocs)) {
        const assoc = assocs[camKey]
        if (!assoc?.trackIds) continue
        for (const tid of assoc.trackIds) {
          const cameraTrackId = `${camKey}-${tid}`
          const personId = cameraTrackToPerson.get(cameraTrackId)
          if (personId !== undefined) {
            const existing = personToTracks.get(personId) || []
            if (!existing.includes(track.globalTrackId)) {
              existing.push(track.globalTrackId)
              personToTracks.set(personId, existing)
            }
          }
        }
      }
    }
    let frameFP = 0
    for (const [personId, tracks] of personToTracks) {
      if (gtPersonsInFrame.has(personId) && tracks.length > 1) {
        frameFP += tracks.length - 1
      }
    }
    totalFP += frameFP
  }

  const MOTA = totalGT > 0 ? 1 - (totalFN + totalFP + totalIDSW) / totalGT : 0
  const Recall = totalGT > 0 ? (totalGT - totalFN) / totalGT : 0
  const Precision = (totalMatches + totalFP) > 0 ? totalMatches / (totalMatches + totalFP) : 0

  // Diagnostic: how many global tracks ever touched annotated camera tracks
  const tracksWithAnnotations = Array.from(allTracks.values()).filter(track => {
    const assocs = track.cameraAssociations || {}
    for (const camKey of Object.keys(assocs)) {
      const assoc = assocs[camKey]
      for (const tid of assoc.trackIds || []) {
        if (cameraTrackToPerson.has(`${camKey}-${tid}`)) return true
      }
    }
    return false
  })

  return {
    sampledFrames: sampled.length,
    totalPersons: personToCameraTracks.size,
    totalGT,
    totalMatches,
    totalFN,
    totalFP,
    totalIDSW,
    MOTA,
    Recall,
    Precision,
    totalGlobalTracksSeen: allTrackIds.size,
    tracksWithAnnotatedAssociations: tracksWithAnnotations.length,
  }
}

const program = new Command()

program
  .name('evaluate-replay-mot')
  .description('Evaluate a replay recording using the existing MOT-like metrics logic')
  .requiredOption('-r, --recording <dir>', 'Path to recording directory (contains events.ndjson)')
  .option('--track-truths <path>', 'Path to TrackTruths.json', '/home/nilwi971/projects/Axis-Guardian/TrackTruths.json')
  .option('--detections-dir <dir>', 'Directory containing preprocessed detection files', '/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p')
  .option('--sample-every <n>', 'Sample every Nth combined frame (like the test)', '10')
  .action((opts) => {
    const recordingDir = resolve(String(opts.recording))
    const eventsPath = join(recordingDir, 'events.ndjson')
    if (!existsSync(eventsPath)) {
      console.error(`events.ndjson not found: ${eventsPath}`)
      process.exit(1)
    }

    const sampleEveryN = Math.max(1, parseInt(String(opts.sampleEvery), 10) || 10)
    const result = computeMetrics({
      recordingDir,
      trackTruthsPath: resolve(String(opts.trackTruths)),
      detectionsDir: resolve(String(opts.detectionsDir)),
      sampleEveryN,
    })

    console.log('\n' + '='.repeat(70))
    console.log('REPLAY MOT METRICS (retargeted from mot-challenge-metrics.test.ts)')
    console.log('='.repeat(70))
    console.log(`Recording: ${recordingDir}`)
    console.log(`Sampled frames: ${result.sampledFrames}`)
    console.log(`GT persons: ${result.totalPersons}`)
    console.log('')
    console.log(`GT detections: ${result.totalGT}`)
    console.log(`True Positives: ${result.totalMatches}`)
    console.log(`False Negatives: ${result.totalFN}`)
    console.log(`False Positives: ${result.totalFP}`)
    console.log(`ID Switches: ${result.totalIDSW}`)
    console.log('')
    console.log(`MOTA: ${(result.MOTA * 100).toFixed(1)}%`)
    console.log(`Recall: ${(result.Recall * 100).toFixed(1)}%`)
    console.log(`Precision: ${(result.Precision * 100).toFixed(1)}%`)
    console.log('')
    console.log(`Global tracks seen (any time): ${result.totalGlobalTracksSeen}`)
    console.log(`Tracks w/ annotated associations: ${result.tracksWithAnnotatedAssociations}`)
    console.log('='.repeat(70) + '\n')
  })

program.parse(process.argv)



