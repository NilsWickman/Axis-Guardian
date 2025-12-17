#!/usr/bin/env node
/**
 * CLI Tool: Evaluate a replay recording against the repo's existing metrics suites.
 *
 * What it does:
 * - Runs the existing vitest metric suites to show "test system" baseline output.
 * - Computes replay-retargeted equivalents from `events.ndjson` (using slim event loading).
 *
 * Note: Several existing tests measure projection-only behavior by reconstructing
 * single-detection projections; those don't depend on the replay. For those,
 * we report baseline and additionally report tracking-state error vs GroundTruths
 * using the replay track positions (more relevant to map replay quality).
 */

import { Command } from 'commander'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { spawnSync } from 'child_process'
import { gunzipSync } from 'zlib'
import { loadSlimReplayEvents, type SlimReplayEvent, type SlimTrackUpdate } from '../replay/eval-loader.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const trackingServiceRoot = resolve(dirname(__filename), '../..')

function runVitestFor(file: string): { ok: boolean; stdout: string } {
  // Use vitest directly to ensure console output is present even when not attached to a TTY.
  const res = spawnSync('pnpm', ['-s', 'vitest', 'run', '--reporter', 'verbose', '--silent', 'false', file], {
    cwd: trackingServiceRoot,
    encoding: 'utf-8',
  })
  const raw = (res.stdout ?? '') + (res.stderr ?? '')
  // Strip ANSI escape codes so regex parsing is stable.
  const cleaned = raw.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
  return { ok: res.status === 0, stdout: cleaned }
}

function extractNumber(re: RegExp, text: string): number | null {
  const m = text.match(re)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function extractAfterLabelNumber(text: string, label: string): number | null {
  const idx = text.indexOf(label)
  if (idx < 0) return null
  const slice = text.slice(idx + label.length, idx + label.length + 50)
  const m = slice.match(/([0-9]+(?:\.[0-9]+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

function getBboxCenterNorm(det: { bbox: { left: number; top: number; right: number; bottom: number } }): { x: number; y: number } {
  return {
    x: (det.bbox.left + det.bbox.right) / 2,
    y: (det.bbox.top + det.bbox.bottom) / 2,
  }
}

function getImageRegionNorm(center: { x: number; y: number }): 'center' | 'edge' | 'corner' {
  const isLeft = center.x < 0.2
  const isRight = center.x > 0.8
  const isTop = center.y < 0.2
  const isBottom = center.y > 0.8
  if ((isLeft || isRight) && (isTop || isBottom)) return 'corner'
  if (isLeft || isRight || isTop || isBottom) return 'edge'
  return 'center'
}

function getDistanceBand(distanceFromCamera: number): string {
  if (distanceFromCamera < 3) return '0-3m'
  if (distanceFromCamera < 5) return '3-5m'
  if (distanceFromCamera < 7) return '5-7m'
  if (distanceFromCamera < 10) return '7-10m'
  return '10m+'
}

function getQuadrant(worldPos: { x: number; y: number }, roomWidth: number, roomHeight: number): 'NE' | 'NW' | 'SE' | 'SW' {
  const isRight = worldPos.x > roomWidth / 2
  const isTop = worldPos.y > roomHeight / 2
  if (isRight && isTop) return 'NE'
  if (!isRight && isTop) return 'NW'
  if (isRight && !isTop) return 'SE'
  return 'SW'
}

function getLifetimeBucket(lifetimeMs: number): string {
  const seconds = lifetimeMs / 1000
  if (seconds < 1) return '<1s'
  if (seconds < 2) return '1-2s'
  if (seconds < 5) return '2-5s'
  if (seconds < 10) return '5-10s'
  if (seconds < 30) return '10-30s'
  if (seconds < 60) return '30-60s'
  return '>60s'
}

// ============================================================================
// Replay-retargeted computations (for the key suites)
// ============================================================================

type TrackTruthsDataset = {
  annotations: Array<{ globalTrackId: string; personId: number }>
  persons: Array<{ id: number }>
}

type DetectionFile = {
  frames: Array<{
    timestamp: number
    detections: Array<{ track_id: number }>
    frame_number: number
  }>
}

type GroundTruthDataset = {
  room: { width: number; height: number }
  annotations: Array<{
    id: string
    groundPosition: { x: number; y: number }
    timestamp: number
    confidence: 'certain' | 'estimated' | 'uncertain'
    linkedDetections: Array<{
      cameraId: 'camera1' | 'camera2'
      frameNumber: number
      timestamp: number
      trackId: number
      bbox: { left: number; top: number; right: number; bottom: number }
    }>
  }>
}

function loadJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf-8')) as T
}

function loadDetectionGzOrJson(p: string): any {
  const buf = readFileSync(p)
  if (p.endsWith('.gz')) {
    return JSON.parse(gunzipSync(buf).toString('utf-8'))
  }
  return JSON.parse(buf.toString('utf-8'))
}

function buildReplayTrackState(events: SlimReplayEvent[]) {
  const active = new Map<string, SlimTrackUpdate>()
  const all = new Map<string, SlimTrackUpdate>()
  return {
    active,
    all,
    apply(evt: SlimReplayEvent) {
      if (evt.type === 'track_created' || evt.type === 'track_updated') {
        all.set(evt.track.globalTrackId, evt.track)
        if (evt.track.isActive) active.set(evt.track.globalTrackId, evt.track)
        else active.delete(evt.track.globalTrackId)
      } else if (evt.type === 'track_expired') {
        active.delete(evt.trackId)
        const prev = all.get(evt.trackId)
        if (prev) all.set(evt.trackId, { ...prev, isActive: false })
      }
    },
  }
}

function calculateTrackContinuityIndex(uniquePersonCount: number, totalTracksCreated: number): number {
  if (uniquePersonCount === 0 || totalTracksCreated === 0) return 0
  const minCount = Math.min(uniquePersonCount, totalTracksCreated)
  const maxCount = Math.max(uniquePersonCount, totalTracksCreated)
  return minCount / maxCount
}

function calculatePositionJitterRMSE(observations: Map<string, Array<{ position: { x: number; y: number }; timestampMs: number }>>): number {
  const jitters: number[] = []
  for (const obs of observations.values()) {
    if (obs.length < 3) continue
    const sorted = [...obs].sort((a, b) => a.timestampMs - b.timestampMs)
    for (let i = 1; i < sorted.length - 1; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const next = sorted[i + 1]
      const totalTime = next.timestampMs - prev.timestampMs
      if (totalTime <= 0) continue
      const ratio = (curr.timestampMs - prev.timestampMs) / totalTime
      const expectedX = prev.position.x + ratio * (next.position.x - prev.position.x)
      const expectedY = prev.position.y + ratio * (next.position.y - prev.position.y)
      const jitter = Math.sqrt((curr.position.x - expectedX) ** 2 + (curr.position.y - expectedY) ** 2)
      jitters.push(jitter)
    }
  }
  if (jitters.length === 0) return 0
  const sumSquares = jitters.reduce((sum, j) => sum + j * j, 0)
  return Math.sqrt(sumSquares / jitters.length)
}

function calculateVelocityConsistencyIndex(
  observations: Map<string, Array<{ position: { x: number; y: number }; timestampMs: number }>>,
  minVelocity = 0.0,
  maxVelocity = 8.0
): { index: number; violations: number; total: number } {
  let validCount = 0
  let totalCount = 0
  let violations = 0
  for (const obs of observations.values()) {
    if (obs.length < 2) continue
    const sorted = [...obs].sort((a, b) => a.timestampMs - b.timestampMs)
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const timeDelta = (curr.timestampMs - prev.timestampMs) / 1000
      if (timeDelta <= 0.01) continue
      const dist = distance(curr.position, prev.position)
      const velocity = dist / timeDelta
      totalCount++
      if (velocity >= minVelocity && velocity <= maxVelocity) validCount++
      else violations++
    }
  }
  return { index: totalCount > 0 ? validCount / totalCount : 1.0, violations, total: totalCount }
}

function evaluateReplayTrackingQuality(args: {
  events: SlimReplayEvent[]
  groundTruth: GroundTruthDataset
  uniquePersonCount: number
}) {
  const certain = args.groundTruth.annotations
    .filter(a => a.confidence === 'certain')
    .sort((a, b) => a.timestamp - b.timestamp)

  const state = buildReplayTrackState(args.events)
  let ei = 0

  const observations = new Map<string, Array<{ position: { x: number; y: number }; timestampMs: number }>>()
  let totalMultiCamera = 0
  let mergedCount = 0
  let handoffSuccessCount = 0
  const projectionErrors: number[] = []

  const allTrackIds = new Set<string>()

  for (const ann of certain) {
    const tMs = Math.round(ann.timestamp * 1000)
    while (ei < args.events.length && args.events[ei].videoTimeMs <= tMs) {
      const evt = args.events[ei]
      if (evt.type === 'track_created' || evt.type === 'track_updated') allTrackIds.add(evt.track.globalTrackId)
      state.apply(evt)
      ei++
    }

    const activeTracks = Array.from(state.active.values()).filter(t => t.isConfirmed)
    if (activeTracks.length === 0) continue

    const isMultiCamera = ann.linkedDetections.length > 1
    if (isMultiCamera) totalMultiCamera++

    // Closest track to GT position
    let best = activeTracks[0]
    let bestDist = distance(best.currentPosition, ann.groundPosition)
    for (const tr of activeTracks) {
      const d = distance(tr.currentPosition, ann.groundPosition)
      if (d < bestDist) {
        bestDist = d
        best = tr
      }
    }
    projectionErrors.push(bestDist)

    if (!observations.has(best.globalTrackId)) observations.set(best.globalTrackId, [])
    observations.get(best.globalTrackId)!.push({ position: best.currentPosition, timestampMs: tMs })

    if (isMultiCamera) {
      const camsInDetections = new Set(ann.linkedDetections.map(d => d.cameraId))
      const bestCams = new Set(Object.keys(best.cameraAssociations ?? {}))
      if ([...camsInDetections].every(c => bestCams.has(c))) handoffSuccessCount++

      let tracksWithBoth = 0
      for (const tr of activeTracks) {
        const trCams = new Set(Object.keys(tr.cameraAssociations ?? {}))
        if ([...camsInDetections].every(c => trCams.has(c))) tracksWithBoth++
      }
      if (tracksWithBoth >= 1) mergedCount++
    }
  }

  const totalTracksCreated = allTrackIds.size
  const tci = calculateTrackContinuityIndex(args.uniquePersonCount, totalTracksCreated)
  const jitter = calculatePositionJitterRMSE(observations)
  const vci = calculateVelocityConsistencyIndex(observations)
  const chsr = totalMultiCamera === 0 ? 1.0 : handoffSuccessCount / totalMultiCamera
  const mergeRate = totalMultiCamera === 0 ? 1.0 : mergedCount / totalMultiCamera
  const avgErr = projectionErrors.length ? projectionErrors.reduce((a, b) => a + b, 0) / projectionErrors.length : 0

  // SLTR: percentage of tracks with detectionCount < 2 (use latest state)
  const finalTracks = Array.from(state.all.values())
  const shortLived = finalTracks.filter(t => t.detectionCount < 2).length
  const sltr = finalTracks.length ? shortLived / finalTracks.length : 0

  return {
    tci,
    totalTracksCreated,
    jitterRMSE: jitter,
    vci,
    chsr,
    mergeRate,
    avgTrackingError: avgErr,
    sltr,
    shortLived,
    totalTracksFinal: finalTracks.length,
  }
}

function evaluateReplaySpatialAccuracy(args: {
  events: SlimReplayEvent[]
  groundTruth: GroundTruthDataset
  cameras: Map<string, { position: { x: number; y: number; z: number } }>
}) {
  const certain = args.groundTruth.annotations
    .filter(a => a.confidence === 'certain')
    .sort((a, b) => a.timestamp - b.timestamp)

  const regionErrors: Record<'center' | 'edge' | 'corner', number[]> = { center: [], edge: [], corner: [] }
  const bandErrors = new Map<string, number[]>()
  const overlapErrors: number[] = []
  const singleErrors: number[] = []
  const quadErrors = new Map<string, number[]>()

  const state = buildReplayTrackState(args.events)
  let ei = 0

  for (const ann of certain) {
    const tMs = Math.round(ann.timestamp * 1000)
    while (ei < args.events.length && args.events[ei].videoTimeMs <= tMs) {
      state.apply(args.events[ei])
      ei++
    }

    const active = Array.from(state.active.values()).filter(t => t.isConfirmed)
    if (active.length === 0) continue

    // Closest track error (tracking error)
    let best = active[0]
    let bestDist = distance(best.currentPosition, ann.groundPosition)
    for (const tr of active) {
      const d = distance(tr.currentPosition, ann.groundPosition)
      if (d < bestDist) { bestDist = d; best = tr }
    }

    // Region classification from first linked detection bbox center
    const det0 = ann.linkedDetections[0]
    const region = getImageRegionNorm(getBboxCenterNorm(det0))
    regionErrors[region].push(bestDist)

    // Distance band from camera that provided the detection
    const cam = args.cameras.get(det0.cameraId)
    if (cam) {
      const distCam = Math.sqrt((ann.groundPosition.x - cam.position.x) ** 2 + (ann.groundPosition.y - cam.position.y) ** 2)
      const band = getDistanceBand(distCam)
      if (!bandErrors.has(band)) bandErrors.set(band, [])
      bandErrors.get(band)!.push(bestDist)
    }

    // Overlap vs single based on number of linked detections
    if (ann.linkedDetections.length >= 2) overlapErrors.push(bestDist)
    else singleErrors.push(bestDist)

    // Quadrant
    const q = getQuadrant(ann.groundPosition, args.groundTruth.room.width, args.groundTruth.room.height)
    if (!quadErrors.has(q)) quadErrors.set(q, [])
    quadErrors.get(q)!.push(bestDist)
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const centerError = avg(regionErrors.center)
  const edgeError = avg(regionErrors.edge)
  const cornerError = avg(regionErrors.corner)
  const edgeToCenterRatio = centerError > 0 ? edgeError / centerError : 0
  const overlapZoneError = avg(overlapErrors)
  const singleCameraError = avg(singleErrors)
  const overlapImprovement = singleCameraError > 0 ? ((singleCameraError - overlapZoneError) / singleCameraError) : 0

  return {
    centerError,
    edgeError,
    cornerError,
    edgeToCenterRatio,
    overlapZoneError,
    singleCameraError,
    overlapImprovement,
    bandErrors,
    quadErrors,
  }
}

function evaluateReplayTemporal(args: { events: SlimReplayEvent[] }) {
  const firstSeen = new Map<string, number>()
  const lastSeen = new Map<string, number>()
  const confirmedAt = new Map<string, number>()
  const expiredAt = new Map<string, number>()

  for (const evt of args.events) {
    if (evt.type === 'track_created' || evt.type === 'track_updated') {
      const id = evt.track.globalTrackId
      if (!firstSeen.has(id)) firstSeen.set(id, evt.videoTimeMs)
      lastSeen.set(id, evt.videoTimeMs)
      if (evt.track.isConfirmed && !confirmedAt.has(id)) confirmedAt.set(id, evt.videoTimeMs)
    } else if (evt.type === 'track_expired') {
      expiredAt.set(evt.trackId, evt.videoTimeMs)
    }
  }

  const lifetimes: number[] = []
  const buckets = new Map<string, number>()
  for (const [id, start] of firstSeen) {
    const end = (expiredAt.get(id) ?? lastSeen.get(id) ?? start)
    const lt = Math.max(0, end - start)
    lifetimes.push(lt)
    const b = getLifetimeBucket(lt)
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  lifetimes.sort((a, b) => a - b)
  const avgLifetime = lifetimes.length ? lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length : 0
  const medianLifetime = lifetimes.length ? lifetimes[Math.floor(lifetimes.length * 0.5)] : 0

  const confirmationLatencies: number[] = []
  for (const [id, cAt] of confirmedAt) {
    const s = firstSeen.get(id)
    if (s !== undefined) confirmationLatencies.push(cAt - s)
  }
  const avgConfirm = confirmationLatencies.length ? confirmationLatencies.reduce((a, b) => a + b, 0) / confirmationLatencies.length : 0

  // Update frequency: track_updated per second over recording duration
  const times = args.events.map(e => e.videoTimeMs)
  const minT = times.length ? Math.min(...times) : 0
  const maxT = times.length ? Math.max(...times) : 0
  const durSec = Math.max(0.001, (maxT - minT) / 1000)
  const updates = args.events.filter(e => e.type === 'track_updated' || e.type === 'track_created').length
  const updatesPerSec = updates / durSec

  return {
    trackCount: firstSeen.size,
    avgTrackLifetimeMs: avgLifetime,
    medianTrackLifetimeMs: medianLifetime,
    lifetimeBuckets: buckets,
    avgConfirmationLatencyMs: avgConfirm,
    updatesPerSec,
  }
}

function evaluateReplayMultiCamera(args: { events: SlimReplayEvent[]; trackTruths: TrackTruthsDataset }) {
  // Map camera-local track id -> person id (from TrackTruths.json)
  const cameraTrackToPerson = new Map<string, number>()
  for (const ann of args.trackTruths.annotations) cameraTrackToPerson.set(ann.globalTrackId, ann.personId)

  // Global track -> set of persons it ever contains (via camera associations)
  const globalPersons = new Map<string, Set<number>>()
  const cameraContribution = new Map<string, number>() // by videoTiming.cameraId

  for (const evt of args.events) {
    if (evt.type !== 'track_created' && evt.type !== 'track_updated') continue
    const tr = evt.track

    const persons = globalPersons.get(tr.globalTrackId) ?? new Set<number>()
    const assocs = tr.cameraAssociations || {}
    for (const camKey of Object.keys(assocs)) {
      for (const tid of assocs[camKey].trackIds || []) {
        const pid = cameraTrackToPerson.get(`${camKey}-${tid}`)
        if (pid !== undefined) persons.add(pid)
      }
    }
    if (persons.size) globalPersons.set(tr.globalTrackId, persons)

    const vtCam = tr.videoTiming?.cameraId
    if (vtCam) cameraContribution.set(vtCam, (cameraContribution.get(vtCam) ?? 0) + 1)
  }

  let totalTracks = 0
  let falseMerges = 0
  for (const persons of globalPersons.values()) {
    totalTracks++
    if (persons.size > 1) falseMerges++
  }
  const falseMergeRate = totalTracks ? falseMerges / totalTracks : 0

  return {
    totalTracksWithTruth: totalTracks,
    falseMerges,
    falseMergeRate,
    cameraContribution,
  }
}

function evaluateReplayIdentity(args: { events: SlimReplayEvent[]; trackTruths: TrackTruthsDataset }) {
  // Build person -> cameraTrackIds
  const personToCameraTracks = new Map<number, string[]>()
  for (const ann of args.trackTruths.annotations) {
    const arr = personToCameraTracks.get(ann.personId) ?? []
    arr.push(ann.globalTrackId)
    personToCameraTracks.set(ann.personId, arr)
  }

  // Build global track -> persons seen
  const cameraTrackToPerson = new Map<string, number>()
  for (const ann of args.trackTruths.annotations) cameraTrackToPerson.set(ann.globalTrackId, ann.personId)

  const globalPersons = new Map<string, Set<number>>()
  for (const evt of args.events) {
    if (evt.type !== 'track_created' && evt.type !== 'track_updated') continue
    const tr = evt.track
    const persons = globalPersons.get(tr.globalTrackId) ?? new Set<number>()
    const assocs = tr.cameraAssociations || {}
    for (const camKey of Object.keys(assocs)) {
      for (const tid of assocs[camKey].trackIds || []) {
        const pid = cameraTrackToPerson.get(`${camKey}-${tid}`)
        if (pid !== undefined) persons.add(pid)
      }
    }
    if (persons.size) globalPersons.set(tr.globalTrackId, persons)
  }

  const totalGlobalWithTruth = globalPersons.size
  let tracksWithSwitch = 0
  for (const persons of globalPersons.values()) {
    if (persons.size > 1) tracksWithSwitch++
  }
  const idSwitchRate = totalGlobalWithTruth ? tracksWithSwitch / totalGlobalWithTruth : 0

  // Fragmentation rate: avg # global tracks per person (for persons that appear)
  const personGlobal = new Map<number, Set<string>>()
  for (const [gid, persons] of globalPersons) {
    for (const pid of persons) {
      const set = personGlobal.get(pid) ?? new Set<string>()
      set.add(gid)
      personGlobal.set(pid, set)
    }
  }
  const personsTracked = personGlobal.size
  let totalPersonTracks = 0
  for (const set of personGlobal.values()) totalPersonTracks += set.size
  const fragmentationRate = personsTracked ? totalPersonTracks / personsTracked : 0

  const identityPrecision = totalGlobalWithTruth ? (totalGlobalWithTruth - tracksWithSwitch) / totalGlobalWithTruth : 0
  const identityRecall = args.trackTruths.persons?.length ? personsTracked / args.trackTruths.persons.length : 0

  // Cross-camera persistence (approx): for persons that have camera tracks in both cams,
  // did all their camera tracks map to a single global ID?
  let handoffOpp = 0
  let handoffSuccess = 0
  for (const [pid, cameraTrackIds] of personToCameraTracks) {
    const cams = new Set(cameraTrackIds.map(id => id.split('-')[0]))
    if (!(cams.has('camera1') && cams.has('camera2'))) continue
    handoffOpp++
    const gids = personGlobal.get(pid)
    if (gids && gids.size === 1) handoffSuccess++
  }
  const crossCameraPersistence = handoffOpp ? handoffSuccess / handoffOpp : 1.0

  return {
    totalPersons: args.trackTruths.persons?.length ?? 0,
    totalCameraTrackIds: args.trackTruths.annotations.length,
    totalGlobalWithTruth,
    tracksWithSwitch,
    idSwitchRate,
    fragmentationRate,
    identityPrecision,
    identityRecall,
    crossCameraPersistence,
    handoffOpp,
    handoffSuccess,
  }
}

function replayMOTLike(args: {
  events: SlimReplayEvent[]
  trackTruths: TrackTruthsDataset
  det1: DetectionFile
  det2: DetectionFile
  sampleEveryN: number
}) {
  const cameraTrackToPerson = new Map<string, number>()
  const personToCameraTracks = new Map<number, Set<string>>()
  for (const ann of args.trackTruths.annotations) {
    cameraTrackToPerson.set(ann.globalTrackId, ann.personId)
    if (!personToCameraTracks.has(ann.personId)) personToCameraTracks.set(ann.personId, new Set())
    personToCameraTracks.get(ann.personId)!.add(ann.globalTrackId)
  }

  const allFrames: Array<{ cameraId: 'camera1' | 'camera2'; timestamp: number; detections: Array<{ track_id: number }> }> = []
  for (const f of args.det1.frames) allFrames.push({ cameraId: 'camera1', timestamp: f.timestamp, detections: f.detections })
  for (const f of args.det2.frames) allFrames.push({ cameraId: 'camera2', timestamp: f.timestamp, detections: f.detections })
  allFrames.sort((a, b) => a.timestamp - b.timestamp)
  const sampled = allFrames.filter((_, i) => i % args.sampleEveryN === 0)

  const state = buildReplayTrackState(args.events)
  let ei = 0

  let totalGT = 0
  let totalFP = 0
  let totalFN = 0
  let totalIDSW = 0
  let totalMatches = 0
  const lastAssignment = new Map<number, string>()

  // For MT/PT/ML and fragmentation-by-person (replay-based)
  const personTotalFrames = new Map<number, number>()
  const personTrackedFrames = new Map<number, number>()
  const personGlobalIds = new Map<number, Set<string>>()

  for (const fr of sampled) {
    const tMs = Math.round(fr.timestamp * 1000)
    while (ei < args.events.length && args.events[ei].videoTimeMs <= tMs) {
      state.apply(args.events[ei])
      ei++
    }

    const gtPersons = new Set<number>()
    for (const det of fr.detections) {
      const cameraTrackId = `${fr.cameraId}-${det.track_id}`
      const pid = cameraTrackToPerson.get(cameraTrackId)
      if (pid !== undefined) gtPersons.add(pid)
    }
    totalGT += gtPersons.size

    for (const pid of gtPersons) {
      personTotalFrames.set(pid, (personTotalFrames.get(pid) ?? 0) + 1)
    }

    const trackedPersons = new Set<number>()
    const framePersonClaims = new Map<number, { trackId: string; recency: number }[]>()

    for (const track of state.active.values()) {
      const assocs = track.cameraAssociations || {}
      for (const camKey of Object.keys(assocs)) {
        const assoc = assocs[camKey]
        for (const tid of assoc.trackIds || []) {
          const cameraTrackId = `${camKey}-${tid}`
          const pid = cameraTrackToPerson.get(cameraTrackId)
          if (pid !== undefined && gtPersons.has(pid)) {
            const claims = framePersonClaims.get(pid) || []
            claims.push({ trackId: track.globalTrackId, recency: assoc.lastSeen })
            framePersonClaims.set(pid, claims)
          }
        }
      }
    }

    for (const [pid, claims] of framePersonClaims) {
      claims.sort((a, b) => b.recency - a.recency)
      const best = claims[0].trackId
      const last = lastAssignment.get(pid)
      if (last && last !== best) totalIDSW++
      lastAssignment.set(pid, best)
      trackedPersons.add(pid)
      totalMatches++

      personTrackedFrames.set(pid, (personTrackedFrames.get(pid) ?? 0) + 1)
      if (!personGlobalIds.has(pid)) personGlobalIds.set(pid, new Set())
      personGlobalIds.get(pid)!.add(best)
    }

    for (const pid of gtPersons) {
      if (!trackedPersons.has(pid)) totalFN++
    }

    const personToTracks = new Map<number, string[]>()
    for (const track of state.active.values()) {
      const assocs = track.cameraAssociations || {}
      for (const camKey of Object.keys(assocs)) {
        const assoc = assocs[camKey]
        for (const tid of assoc.trackIds || []) {
          const cameraTrackId = `${camKey}-${tid}`
          const pid = cameraTrackToPerson.get(cameraTrackId)
          if (pid !== undefined) {
            const existing = personToTracks.get(pid) || []
            if (!existing.includes(track.globalTrackId)) {
              existing.push(track.globalTrackId)
              personToTracks.set(pid, existing)
            }
          }
        }
      }
    }
    let frameFP = 0
    for (const [pid, tracks] of personToTracks) {
      if (gtPersons.has(pid) && tracks.length > 1) frameFP += tracks.length - 1
    }
    totalFP += frameFP
  }

  const MOTA = totalGT > 0 ? 1 - (totalFN + totalFP + totalIDSW) / totalGT : 0
  const Recall = totalGT > 0 ? (totalGT - totalFN) / totalGT : 0
  const Precision = (totalMatches + totalFP) > 0 ? totalMatches / (totalMatches + totalFP) : 0

  // MT/PT/ML from replay (based on sampled frames)
  let MT = 0, PT = 0, ML = 0
  for (const pid of personTotalFrames.keys()) {
    const tot = personTotalFrames.get(pid) ?? 0
    const tr = personTrackedFrames.get(pid) ?? 0
    const ratio = tot > 0 ? tr / tot : 0
    if (ratio >= 0.8) MT++
    else if (ratio >= 0.2) PT++
    else ML++
  }

  // Frag (replay): count extra global tracks per person beyond 1
  let Frag = 0
  for (const pid of personGlobalIds.keys()) {
    Frag += Math.max(0, (personGlobalIds.get(pid)?.size ?? 0) - 1)
  }

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
    MT,
    PT,
    ML,
    Frag,
  }
}

// ============================================================================
// CLI
// ============================================================================

const program = new Command()

program
  .name('evaluate-replay-all-metrics')
  .description('Run existing metrics tests (baseline) and replay-retargeted evaluations (recording)')
  .requiredOption('-r, --recording <dir>', 'Recording directory (contains events.ndjson)')
  .option('--sample-every <n>', 'Frame sampling rate for MOT-like eval (default 10)', '10')
  .action(async (opts) => {
    const recordingDir = resolve(String(opts.recording))
    const eventsPath = join(recordingDir, 'events.ndjson')
    if (!existsSync(eventsPath)) {
      console.error(`events.ndjson not found: ${eventsPath}`)
      process.exit(1)
    }

    const sampleEveryN = Math.max(1, parseInt(String(opts.sampleEvery), 10) || 10)

    console.log('\n' + '='.repeat(80))
    console.log('METRICS BASELINE (existing vitest suites)')
    console.log('='.repeat(80))

    const suites = [
      'tests/integration/mot-challenge-metrics.test.ts',
      'tests/integration/tracking-quality-metrics.test.ts',
      'tests/integration/spatial-accuracy-metrics.test.ts',
      'tests/integration/multi-camera-metrics.test.ts',
      'tests/integration/temporal-metrics.test.ts',
      'tests/integration/track-identity-evaluation.test.ts',
    ]

    const baselineOutputs: Record<string, string> = {}
    for (const s of suites) {
      const { ok, stdout } = runVitestFor(s)
      baselineOutputs[s] = stdout
      console.log(`- ${s}: ${ok ? 'ok' : 'failed'}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('REPLAY-RETARGETED EVALUATION (recording)')
    console.log('='.repeat(80))
    console.log(`Recording: ${recordingDir}`)

    console.log('\n--- MOT-like (retargeted) ---')
    const trackTruths = loadJson<TrackTruthsDataset>('/home/nilwi971/projects/Axis-Guardian/TrackTruths.json')
    const det1 = loadDetectionGzOrJson('/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p/view-HC3-reid.detections.json.gz') as DetectionFile
    const det2 = loadDetectionGzOrJson('/home/nilwi971/projects/Axis-Guardian/shared/cameras/preprocessed/1080p/view-HC4-reid.detections.json.gz') as DetectionFile

    const events = await loadSlimReplayEvents(eventsPath)
    const mot = replayMOTLike({ events, trackTruths, det1, det2, sampleEveryN })

    console.log(`GT=${mot.totalGT} TP=${mot.totalMatches} FN=${mot.totalFN} FP=${mot.totalFP} IDSW=${mot.totalIDSW} Frag=${mot.Frag}`)
    console.log(`MOTA=${pct(mot.MOTA)} Recall=${pct(mot.Recall)} Precision=${pct(mot.Precision)}`)
    console.log(`MT=${mot.MT}/${mot.totalPersons} PT=${mot.PT}/${mot.totalPersons} ML=${mot.ML}/${mot.totalPersons}`)

    console.log('\n--- Tracking Quality (replay-retargeted) ---')
    const groundTruth = loadJson<GroundTruthDataset>('/home/nilwi971/projects/Axis-Guardian/GroundTruths.json')
    const tq = evaluateReplayTrackingQuality({
      events,
      groundTruth,
      uniquePersonCount: trackTruths.persons?.length ?? 0,
    })
    console.log(`TCI=${pct(tq.tci)} (tracksCreated=${tq.totalTracksCreated})`)
    console.log(`JitterRMSE=${tq.jitterRMSE.toFixed(3)}m`)
    console.log(`VCI=${pct(tq.vci.index)} (violations=${tq.vci.violations}/${tq.vci.total})`)
    console.log(`CHSR=${pct(tq.chsr)} MergeRate=${pct(tq.mergeRate)}`)
    console.log(`AvgTrackingError=${tq.avgTrackingError.toFixed(3)}m`)
    console.log(`SLTR=${pct(tq.sltr)} (${tq.shortLived}/${tq.totalTracksFinal})`)

    console.log('\n--- Spatial Accuracy (tracking error from replay) ---')
    // Build a minimal camera map for distance bands
    // NOTE: positions are in meters (from the seeded sitemap)
    const sitemap = loadJson<any>('/home/nilwi971/projects/Axis-Guardian/shared/config/sitemap-rectangular-room.json')
    const cameras = new Map<string, { position: { x: number; y: number; z: number } }>()
    for (const cam of sitemap.cameras ?? []) {
      cameras.set(cam.id, { position: { x: cam.position.x, y: cam.position.y, z: cam.height } })
    }
    const sa = evaluateReplaySpatialAccuracy({ events, groundTruth, cameras })
    console.log(`Center=${sa.centerError.toFixed(3)}m Edge=${sa.edgeError.toFixed(3)}m Corner=${sa.cornerError.toFixed(3)}m Edge/Center=${sa.edgeToCenterRatio.toFixed(2)}`)
    console.log(`Overlap=${sa.overlapZoneError.toFixed(3)}m Single=${sa.singleCameraError.toFixed(3)}m OverlapImprovement=${(sa.overlapImprovement*100).toFixed(1)}%`)

    console.log('\n--- Multi-Camera (replay-retargeted) ---')
    const mc = evaluateReplayMultiCamera({ events, trackTruths })
    console.log(`FalseMergeRate=${(mc.falseMergeRate * 100).toFixed(1)}% (falseMerges=${mc.falseMerges}/${mc.totalTracksWithTruth})`)
    console.log(`CameraContribution(share of updates): ${Array.from(mc.cameraContribution.entries()).map(([k,v])=>`${k}=${v}`).join(' ')}`)

    console.log('\n--- Temporal (replay-retargeted) ---')
    const tm = evaluateReplayTemporal({ events })
    console.log(`Tracks=${tm.trackCount} AvgLifetime=${(tm.avgTrackLifetimeMs/1000).toFixed(1)}s MedianLifetime=${(tm.medianTrackLifetimeMs/1000).toFixed(1)}s`)
    console.log(`AvgConfirmationLatency=${tm.avgConfirmationLatencyMs.toFixed(0)}ms UpdatesPerSec=${tm.updatesPerSec.toFixed(1)}`)

    console.log('\n--- Track Identity (replay-retargeted) ---')
    const idr = evaluateReplayIdentity({ events, trackTruths })
    console.log(`IDSwitchRate=${(idr.idSwitchRate * 100).toFixed(2)}% (tracksWithSwitch=${idr.tracksWithSwitch}/${idr.totalGlobalWithTruth})`)
    console.log(`FragmentationRate=${idr.fragmentationRate.toFixed(2)} tracks/person`)
    console.log(`IdentityPrecision=${(idr.identityPrecision * 100).toFixed(1)}% IdentityRecall=${(idr.identityRecall * 100).toFixed(1)}%`)
    console.log(`CrossCameraPersistence=${(idr.crossCameraPersistence * 100).toFixed(1)}% (handoff=${idr.handoffSuccess}/${idr.handoffOpp})`)

    console.log('\n' + '='.repeat(80))
    console.log('BASELINE vs REPLAY (quick comparison extract)')
    console.log('='.repeat(80))

    // MOT baseline extract (from mot-challenge-metrics.test.ts output)
    const motOut = baselineOutputs['tests/integration/mot-challenge-metrics.test.ts'] ?? ''
    const bMOTA = extractNumber(/MOTA:\\s*([0-9.]+)\\s*[%％]/i, motOut) ?? extractAfterLabelNumber(motOut, 'MOTA:')
    const bRecall = extractNumber(/Recall:\\s*([0-9.]+)\\s*[%％]/i, motOut) ?? extractAfterLabelNumber(motOut, 'Recall:')
    const bPrec = extractNumber(/Precision:\\s*([0-9.]+)\\s*[%％]/i, motOut) ?? extractAfterLabelNumber(motOut, 'Precision:')
    const bFN = extractNumber(/False Negatives:\\s+(\\d+)/i, motOut) ?? extractAfterLabelNumber(motOut, 'False Negatives:')
    const bFP = extractNumber(/False Positives:\\s+(\\d+)/i, motOut) ?? extractAfterLabelNumber(motOut, 'False Positives:')
    const bIDSW = extractNumber(/ID Switches:\\s+(\\d+)/i, motOut) ?? extractAfterLabelNumber(motOut, 'ID Switches:')
    console.log('MOT (baseline from test) vs MOT (replay-retargeted):')
    console.log(`- MOTA: ${bMOTA !== null ? bMOTA.toFixed(1) + '%' : 'n/a'} vs ${(mot.MOTA * 100).toFixed(1)}%`)
    console.log(`- Recall: ${bRecall !== null ? bRecall.toFixed(1) + '%' : 'n/a'} vs ${(mot.Recall * 100).toFixed(1)}%`)
    console.log(`- Precision: ${bPrec !== null ? bPrec.toFixed(1) + '%' : 'n/a'} vs ${(mot.Precision * 100).toFixed(1)}%`)
    console.log(`- FN: ${bFN !== null ? bFN : 'n/a'} vs ${mot.totalFN}`)
    console.log(`- FP: ${bFP !== null ? bFP : 'n/a'} vs ${mot.totalFP}`)
    console.log(`- IDSW: ${bIDSW !== null ? bIDSW : 'n/a'} vs ${mot.totalIDSW}`)

    // Tracking quality baseline extract
    const tqOut = baselineOutputs['tests/integration/tracking-quality-metrics.test.ts'] ?? ''
    const bTCI = extractNumber(/\bTCI:\s*([\d.]+)%/i, tqOut)
    const bJitter = extractNumber(/\bJitter RMSE:\s*([\d.]+)m/i, tqOut)
    const bVCI = extractNumber(/\bValid velocities:\s*([\d.]+)%/i, tqOut)
    const bCHSR = extractNumber(/\bHandoff success:\s*([\d.]+)%/i, tqOut)
    const bMerge = extractNumber(/\bMerge success:\s*([\d.]+)%/i, tqOut)
    const bSLTR = extractNumber(/\bSLTR:\s*([\d.]+)%/i, tqOut)
    const bAvgErr = extractNumber(/\bAverage error:\s*([\d.]+)m/i, tqOut)

    console.log('\nTracking Quality (baseline test) vs Tracking Quality (replay-retargeted):')
    console.log(`- TCI: ${bTCI !== null ? bTCI.toFixed(1) + '%' : 'n/a'} vs ${(tq.tci * 100).toFixed(1)}%`)
    console.log(`- JitterRMSE: ${bJitter !== null ? bJitter.toFixed(3) + 'm' : 'n/a'} vs ${tq.jitterRMSE.toFixed(3)}m`)
    console.log(`- VCI: ${bVCI !== null ? bVCI.toFixed(1) + '%' : 'n/a'} vs ${(tq.vci.index * 100).toFixed(1)}%`)
    console.log(`- CHSR: ${bCHSR !== null ? bCHSR.toFixed(1) + '%' : 'n/a'} vs ${(tq.chsr * 100).toFixed(1)}%`)
    console.log(`- Merge: ${bMerge !== null ? bMerge.toFixed(1) + '%' : 'n/a'} vs ${(tq.mergeRate * 100).toFixed(1)}%`)
    console.log(`- AvgError: ${bAvgErr !== null ? bAvgErr.toFixed(3) + 'm' : 'n/a'} vs ${tq.avgTrackingError.toFixed(3)}m`)
    console.log(`- SLTR: ${bSLTR !== null ? bSLTR.toFixed(1) + '%' : 'n/a'} vs ${(tq.sltr * 100).toFixed(1)}%`)

    // Multi-camera baseline extract
    const mcOut = baselineOutputs['tests/integration/multi-camera-metrics.test.ts'] ?? ''
    const bFalseMerge = extractNumber(/False Merge Rate:\s*([\d.]+)%/i, mcOut)
    console.log('\nMulti-Camera (baseline test) vs Multi-Camera (replay-retargeted):')
    console.log(`- FalseMergeRate: ${bFalseMerge !== null ? bFalseMerge.toFixed(1) + '%' : 'n/a'} vs ${(mc.falseMergeRate * 100).toFixed(1)}%`)

    // Temporal baseline extract (limited)
    // Identity baseline extract
    const idOut = baselineOutputs['tests/integration/track-identity-evaluation.test.ts'] ?? ''
    const bIdSwitchRate =
      extractNumber(/ID Switch Rate\\s*[|│]\\s*([0-9.]+)%/i, idOut)
      ?? extractAfterLabelNumber(idOut, 'ID Switch Rate')
    const bFragRate =
      extractNumber(/Fragmentation Rate\\s*[|│]\\s*([0-9.]+)/i, idOut)
      ?? extractAfterLabelNumber(idOut, 'Fragmentation Rate')
    const bIdPrec =
      extractNumber(/Identity Precision\\s*[|│]\\s*([0-9.]+)%/i, idOut)
      ?? extractAfterLabelNumber(idOut, 'Identity Precision')
    const bIdRec =
      extractNumber(/Identity Recall\\s*[|│]\\s*([0-9.]+)%/i, idOut)
      ?? extractAfterLabelNumber(idOut, 'Identity Recall')
    const bCross =
      extractNumber(/Cross-Camera Persistence\\s*[|│]\\s*([0-9.]+)%/i, idOut)
      ?? extractAfterLabelNumber(idOut, 'Cross-Camera Persistence')

    console.log('\nTrack Identity (baseline test) vs Track Identity (replay-retargeted):')
    console.log(`- IDSwitchRate: ${bIdSwitchRate !== null ? bIdSwitchRate.toFixed(2) + '%' : 'n/a'} vs ${(idr.idSwitchRate * 100).toFixed(2)}%`)
    console.log(`- FragmentationRate: ${bFragRate !== null ? bFragRate.toFixed(2) : 'n/a'} vs ${idr.fragmentationRate.toFixed(2)}`)
    console.log(`- IdentityPrecision: ${bIdPrec !== null ? bIdPrec.toFixed(1) + '%' : 'n/a'} vs ${(idr.identityPrecision * 100).toFixed(1)}%`)
    console.log(`- IdentityRecall: ${bIdRec !== null ? bIdRec.toFixed(1) + '%' : 'n/a'} vs ${(idr.identityRecall * 100).toFixed(1)}%`)
    console.log(`- CrossCameraPersistence: ${bCross !== null ? bCross.toFixed(1) + '%' : 'n/a'} vs ${(idr.crossCameraPersistence * 100).toFixed(1)}%`)

    const tmOut = baselineOutputs['tests/integration/temporal-metrics.test.ts'] ?? ''
    const bAvgLifetime = extractNumber(/\bAverage:\s*([\d.]+)s\b/i, tmOut) // first "Average" in lifetime section
    console.log('\nTemporal (baseline test) vs Temporal (replay-retargeted):')
    console.log(`- AvgTrackLifetime: ${bAvgLifetime !== null ? bAvgLifetime.toFixed(1) + 's' : 'n/a'} vs ${(tm.avgTrackLifetimeMs / 1000).toFixed(1)}s`)

    console.log('\nNotes:')
    console.log('- Spatial Accuracy baseline suite measures projection error by re-projecting single detections; replay numbers above are tracking error vs GroundTruths.')
    console.log('- Some baseline suite outputs have multiple “Average:” lines; this report extracts the most relevant ones but can be expanded if you want exact 1:1 mapping.\n')
  })

program.parse(process.argv)


