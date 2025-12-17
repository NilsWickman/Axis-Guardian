import { existsSync } from 'fs'
import type { ReplayEventType } from './types.js'
import { readNdjsonFile } from './ndjson.js'

export type SlimTrackUpdate = {
  globalTrackId: string
  cameraAssociations: Record<string, { trackIds: number[]; lastSeen: number; lastFrameNumber?: number }>
  currentPosition: { x: number; y: number }
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  detectionCount: number
  confidence: number
  state: string
  videoTiming?: { videoTimeMs: number; frameNumber: number; cameraId: string; rtpTimestamp?: number }
}

export type SlimReplayEvent =
  | { seq: number; videoTimeMs: number; type: 'track_created' | 'track_updated'; track: SlimTrackUpdate }
  | { seq: number; videoTimeMs: number; type: 'track_expired'; trackId: string }
  | { seq: number; videoTimeMs: number; type: Exclude<ReplayEventType, 'track_created' | 'track_updated' | 'track_expired'>; payload: any }

function toSlimTrack(track: any): SlimTrackUpdate | null {
  if (!track || typeof track !== 'object') return null
  if (typeof track.globalTrackId !== 'string') return null
  if (!track.currentPosition || typeof track.currentPosition.x !== 'number' || typeof track.currentPosition.y !== 'number') return null

  return {
    globalTrackId: track.globalTrackId,
    cameraAssociations: track.cameraAssociations ?? {},
    currentPosition: { x: track.currentPosition.x, y: track.currentPosition.y },
    lastSeen: typeof track.lastSeen === 'number' ? track.lastSeen : 0,
    isActive: Boolean(track.isActive),
    isConfirmed: Boolean(track.isConfirmed),
    detectionCount: typeof track.detectionCount === 'number' ? track.detectionCount : 0,
    confidence: typeof track.confidence === 'number' ? track.confidence : 0,
    state: typeof track.state === 'string' ? track.state : 'unknown',
    videoTiming: track.videoTiming,
  }
}

export async function loadSlimReplayEvents(eventsPath: string): Promise<SlimReplayEvent[]> {
  if (!existsSync(eventsPath)) return []
  const out: SlimReplayEvent[] = []

  await readNdjsonFile<any>(eventsPath, (evt) => {
    const seq = evt?.seq
    const videoTimeMs = evt?.videoTimeMs
    const type = evt?.type as ReplayEventType | undefined
    const payload = evt?.payload

    if (typeof seq !== 'number' || typeof videoTimeMs !== 'number' || typeof type !== 'string') return

    if (type === 'track_created' || type === 'track_updated') {
      const track = toSlimTrack(payload?.track)
      if (!track) return
      out.push({ seq, videoTimeMs, type, track })
      return
    }

    if (type === 'track_expired') {
      const trackId = payload?.trackId
      if (typeof trackId !== 'string') return
      out.push({ seq, videoTimeMs, type, trackId })
      return
    }

    // Keep other event types for completeness (zone metrics, etc.)
    out.push({ seq, videoTimeMs, type: type as any, payload })
  })

  // Deterministic ordering for evaluation: time first, then seq.
  out.sort((a, b) => (a.videoTimeMs - b.videoTimeMs) || (a.seq - b.seq))
  return out
}



