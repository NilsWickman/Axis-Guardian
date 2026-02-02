import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import type { TrackManager } from '../tracks/track-manager.js'
import { trackToJSON } from '../tracks/track-manager.js'
import type { WebSocketBroadcaster } from '../api/websocket.js'
import type { ReplayEvent, ReplayManifest, ReplaySnapshot } from './types.js'
import { readNdjsonFile } from './ndjson.js'
import {
  getDefaultReplayDirs,
  recordingDir,
  recordingEventsPath,
  recordingManifestPath,
  recordingSnapshotsPath,
} from './paths.js'
import { ReplayRecorder } from './recorder.js'

export interface StartRecordingInput {
  recordingId: string
  snapshotIntervalMs?: number
  cameras: ReplayManifest['cameras']
  siteMapConfig?: unknown
  durationMs?: number
}

export class ReplayManager {
  private active: Map<string, { recorder: ReplayRecorder; sink: (m: any) => void }> = new Map()
  private recordingsDir: string

  constructor(
    private deps: {
      trackManager: TrackManager
      broadcaster?: WebSocketBroadcaster | null
      recordingsDir?: string
    }
  ) {
    this.recordingsDir = deps.recordingsDir ?? getDefaultReplayDirs().recordingsDir
    mkdirSync(this.recordingsDir, { recursive: true })
  }

  isRecording(recordingId: string): boolean {
    return this.active.has(recordingId)
  }

  start(input: StartRecordingInput): { ok: true } | { ok: false; error: string } {
    const { broadcaster } = this.deps
    if (!broadcaster) return { ok: false, error: 'broadcaster_unavailable' }
    if (this.active.has(input.recordingId)) return { ok: false, error: 'already_recording' }

    const recorder = new ReplayRecorder({
      recordingsDir: this.recordingsDir,
      recordingId: input.recordingId,
      snapshotIntervalMs: input.snapshotIntervalMs,
      manifest: {
        recordingId: input.recordingId,
        cameras: input.cameras,
        durationMs: input.durationMs,
        siteMapConfig: input.siteMapConfig,
      },
      getSnapshotState: () => ({
        tracks: this.deps.trackManager.getActiveTracks().map(trackToJSON),
      }),
    })

    const sink = (message: any) => recorder.handleMessage(message)
    broadcaster.addSink(sink)
    recorder.start()

    // Write an initial snapshot at t=0 (or first event time). We use 0ms for deterministic seeks.
    recorder.writeManualSnapshot(0)

    this.active.set(input.recordingId, { recorder, sink })
    return { ok: true }
  }

  stop(recordingId: string, durationMs?: number): { ok: true } | { ok: false; error: string } {
    const { broadcaster } = this.deps
    const current = this.active.get(recordingId)
    if (!current) return { ok: false, error: 'not_recording' }
    if (broadcaster) broadcaster.removeSink(current.sink)
    current.recorder.stop(durationMs)
    this.active.delete(recordingId)
    return { ok: true }
  }

  list(): ReplayManifest[] {
    if (!existsSync(this.recordingsDir)) return []
    const entries = readdirSync(this.recordingsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    const manifests: ReplayManifest[] = []
    for (const id of entries) {
      const p = recordingManifestPath(recordingDir(this.recordingsDir, id))
      if (!existsSync(p)) continue
      try {
        const m = JSON.parse(readFileSync(p, 'utf-8')) as ReplayManifest
        manifests.push(m)
      } catch {
        // ignore bad manifests
      }
    }

    // Sort newest first
    manifests.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0))
    return manifests
  }

  getManifest(recordingId: string): ReplayManifest | null {
    const p = recordingManifestPath(recordingDir(this.recordingsDir, recordingId))
    if (!existsSync(p)) return null
    try {
      return JSON.parse(readFileSync(p, 'utf-8')) as ReplayManifest
    } catch {
      return null
    }
  }

  async getEvents(recordingId: string, fromMs: number, toMs: number, limit = 5000): Promise<ReplayEvent[]> {
    const eventsPath = recordingEventsPath(recordingDir(this.recordingsDir, recordingId))
    if (!existsSync(eventsPath)) return []

    const out: ReplayEvent[] = []
    await readNdjsonFile<ReplayEvent>(eventsPath, (evt) => {
      if (typeof evt?.videoTimeMs !== 'number') return
      if (evt.videoTimeMs < fromMs) return
      if (evt.videoTimeMs > toMs) return
      out.push(evt)
      if (out.length >= limit) {
        // stop early by throwing; caught below
        throw new Error('__limit__')
      }
    }).catch((e: unknown) => {
      if (e instanceof Error && e.message === '__limit__') return
      // ignore other read errors
    })

    return out
  }

  async getSnapshotAtOrBefore(recordingId: string, timeMs: number): Promise<ReplaySnapshot | null> {
    const snapshotsPath = recordingSnapshotsPath(recordingDir(this.recordingsDir, recordingId))
    if (!existsSync(snapshotsPath)) return null

    let best: ReplaySnapshot | null = null
    await readNdjsonFile<ReplaySnapshot>(snapshotsPath, (snap) => {
      if (typeof snap?.videoTimeMs !== 'number') return
      if (snap.videoTimeMs > timeMs) return
      if (!best || snap.videoTimeMs >= best.videoTimeMs) best = snap
    }).catch(() => {
      // ignore
    })

    return best
  }
}


