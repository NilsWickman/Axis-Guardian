import type { WebSocketMessage } from '../types.js'
import type { ReplayEvent, ReplayManifest, ReplaySnapshot } from './types.js'
import { mkdirSync, createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs'
import {
  recordingDir,
  recordingEventsPath,
  recordingManifestPath,
  recordingSnapshotsPath,
} from './paths.js'

export interface ReplayRecorderOptions {
  recordingsDir: string
  recordingId: string
  snapshotIntervalMs?: number
  manifest: Omit<ReplayManifest, 'createdAtMs'>
  /**
   * Called when the recorder needs to generate a snapshot (for fast seeking).
   */
  getSnapshotState: () => ReplaySnapshot['state']
  /**
   * If track messages have no videoTiming, fall back to wall-clock elapsed.
   */
  clock?: () => number
}

export class ReplayRecorder {
  private seq = 0
  private startedAtMs: number
  private lastSnapshotVideoTimeMs: number | null = null
  private eventsStream: ReturnType<typeof createWriteStream> | null = null
  private snapshotsStream: ReturnType<typeof createWriteStream> | null = null
  private stopped = false

  private snapshotIntervalMs: number
  private dirPath: string
  private manifestPath: string

  constructor(private opts: ReplayRecorderOptions) {
    this.startedAtMs = (opts.clock ?? Date.now)()
    this.snapshotIntervalMs = opts.snapshotIntervalMs ?? 2000
    this.dirPath = recordingDir(opts.recordingsDir, opts.recordingId)
    this.manifestPath = recordingManifestPath(this.dirPath)
  }

  start(): void {
    if (this.eventsStream || this.snapshotsStream) return

    mkdirSync(this.dirPath, { recursive: true })

    const eventsPath = recordingEventsPath(this.dirPath)
    const snapshotsPath = recordingSnapshotsPath(this.dirPath)

    this.eventsStream = createWriteStream(eventsPath, { flags: 'a' })
    this.snapshotsStream = createWriteStream(snapshotsPath, { flags: 'a' })

    // Write an initial manifest immediately (endedAtMs filled on stop).
    const manifest: ReplayManifest = {
      ...this.opts.manifest,
      recordingId: this.opts.recordingId,
      createdAtMs: this.startedAtMs,
    }
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  }

  stop(durationMs?: number): void {
    if (this.stopped) return
    this.stopped = true

    const endedAtMs = (this.opts.clock ?? Date.now)()
    const existing: ReplayManifest | null = existsSync(this.manifestPath)
      ? JSON.parse(readFileSync(this.manifestPath, 'utf-8'))
      : null

    const manifest: ReplayManifest = {
      ...(existing ?? {
        ...this.opts.manifest,
        recordingId: this.opts.recordingId,
        createdAtMs: this.startedAtMs,
      }),
      endedAtMs,
      durationMs: durationMs ?? existing?.durationMs,
    }
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    this.eventsStream?.end()
    this.snapshotsStream?.end()
    this.eventsStream = null
    this.snapshotsStream = null
  }

  handleMessage(message: WebSocketMessage): void {
    if (this.stopped) return
    if (!this.eventsStream) this.start()

    // Ignore snapshot messages (these are connection-level, not timeline events).
    if (message.type === 'snapshot') return

    const { videoTimeMs, rtpTimestamp } = this.extractTiming(message)
    if (videoTimeMs === null) return

    const event: ReplayEvent = {
      seq: ++this.seq,
      videoTimeMs,
      rtpTimestamp,
      type: message.type,
      payload: message,
    }

    this.writeNdjson(this.eventsStream!, event)
    this.maybeSnapshot(videoTimeMs)
  }

  writeManualSnapshot(videoTimeMs: number): void {
    if (this.stopped) return
    if (!this.snapshotsStream) this.start()
    this.writeSnapshot(videoTimeMs)
  }

  private maybeSnapshot(videoTimeMs: number): void {
    if (!this.snapshotsStream) return
    if (this.lastSnapshotVideoTimeMs === null) {
      this.writeSnapshot(videoTimeMs)
      return
    }
    if (videoTimeMs - this.lastSnapshotVideoTimeMs >= this.snapshotIntervalMs) {
      this.writeSnapshot(videoTimeMs)
    }
  }

  private writeSnapshot(videoTimeMs: number): void {
    const snap: ReplaySnapshot = {
      videoTimeMs,
      state: this.opts.getSnapshotState(),
    }
    this.writeNdjson(this.snapshotsStream!, snap)
    this.lastSnapshotVideoTimeMs = videoTimeMs
  }

  private extractTiming(message: WebSocketMessage): { videoTimeMs: number | null; rtpTimestamp?: number } {
    const now = (this.opts.clock ?? Date.now)()
    const fallbackVideoTimeMs = now - this.startedAtMs

    if (message.type === 'track_created' || message.type === 'track_updated') {
      const timing = message.track?.videoTiming
      return {
        videoTimeMs: timing?.videoTimeMs ?? fallbackVideoTimeMs,
        rtpTimestamp: timing?.rtpTimestamp,
      }
    }
    if (message.type === 'track_expired') {
      // Expiry timing is not included; fall back to elapsed wall-clock.
      return { videoTimeMs: fallbackVideoTimeMs }
    }

    // Zone events currently have no video timing; attach them to the current timeline time.
    return { videoTimeMs: fallbackVideoTimeMs }
  }

  private writeNdjson(stream: ReturnType<typeof createWriteStream>, obj: unknown): void {
    // Ensure one JSON object per line for streaming reads.
    stream.write(`${JSON.stringify(obj)}\n`)
  }
}


