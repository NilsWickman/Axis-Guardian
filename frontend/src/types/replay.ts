export interface ReplayCameraManifest {
  cameraId: string
  label: string
  videoUrl: string
  sourcePath?: string
}

export interface ReplayManifest {
  recordingId: string
  createdAtMs: number
  endedAtMs?: number
  durationMs?: number
  siteMapConfig?: unknown
  cameras: ReplayCameraManifest[]
}

export interface ReplayEvent {
  seq: number
  videoTimeMs: number
  rtpTimestamp?: number
  type: string
  payload: any
}

export interface ReplaySnapshot {
  videoTimeMs: number
  state: {
    tracks: any[]
    zones?: any[]
    zoneMetrics?: any[]
  }
}


