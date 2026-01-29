import type { WebSocketMessage } from '../types.js'

export interface ReplayCameraManifest {
  cameraId: string
  label: string
  /**
   * Browser-accessible URL (recommended), e.g. `/recordings/<id>/camera1.mp4`
   * This is what the frontend should put into `<video src>`.
   */
  videoUrl: string
  /**
   * Optional original local filesystem path that was copied from.
   * Not used by the frontend.
   */
  sourcePath?: string
}

export interface ReplayManifest {
  recordingId: string
  createdAtMs: number
  endedAtMs?: number
  /**
   * Optional duration in ms. If omitted, the UI can derive duration from the master video element.
   */
  durationMs?: number
  /**
   * Snapshot of the sitemap config used during recording (frontend JSON format).
   * Stored as unknown to avoid coupling backend replay to frontend types.
   */
  siteMapConfig?: unknown
  cameras: ReplayCameraManifest[]
}

export type ReplayEventType =
  | 'track_created'
  | 'track_updated'
  | 'track_delta'
  | 'track_expired'
  | 'zone_violation'
  | 'zones_updated'
  | 'zone_metrics'
  | 'zones_reset'

export interface ReplayEvent {
  seq: number
  /**
   * Video time in ms on the shared timeline. Primary sync value for replay.
   */
  videoTimeMs: number
  /**
   * Optional RTP timestamp (90kHz clock) for frame-perfect sync.
   */
  rtpTimestamp?: number
  type: ReplayEventType
  /**
   * The original message payload (subset of WebSocketMessage depending on type).
   */
  payload: WebSocketMessage
}

export interface ReplaySnapshotState {
  tracks: unknown[]
  zones?: unknown[]
  zoneMetrics?: unknown[]
}

export interface ReplaySnapshot {
  videoTimeMs: number
  state: ReplaySnapshotState
}


