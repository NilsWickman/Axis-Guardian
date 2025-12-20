import { computed, onUnmounted, ref, type Ref } from 'vue'
import { config } from '@/config/environment'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useZoneStore } from '@/stores/zones'
import type { ReplayEvent, ReplayManifest, ReplaySnapshot } from '@/types/replay'

export interface UseReplayOptions {
  /**
   * Video element that defines the master timeline (video.currentTime).
   */
  masterVideo: Ref<HTMLVideoElement | null>
  /**
   * Buffer window (ms) to prefetch ahead of current time.
   */
  prefetchAheadMs?: number
  /**
   * Buffer window (ms) to keep behind current time.
   */
  keepBehindMs?: number
  /**
   * Time tolerance when releasing events (ms).
   */
  releaseToleranceMs?: number
}

interface BufferedEvent {
  seq: number
  videoTimeMs: number
  type: string
  payload: any
}

interface ReplayFrameInfo {
  cameraId: string
  frameNumber: number
  timestamp: number
}

export function useReplay(options: UseReplayOptions) {
  const globalTrackStore = useGlobalTrackStore()
  const zoneStore = useZoneStore()

  const manifest = ref<ReplayManifest | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const buffer: BufferedEvent[] = []
  let syncInterval: number | null = null
  let lastFetchedToMs = 0
  let opToken = 0
  let isSeeking = false
  let isFetching = false

  const prefetchAheadMs = options.prefetchAheadMs ?? 15000
  const keepBehindMs = options.keepBehindMs ?? 5000
  const releaseToleranceMs = options.releaseToleranceMs ?? 50

  const apiBase = computed(() => config.trackingServiceApiUrl.replace(/\/$/, ''))

  function clearBuffer(): void {
    buffer.length = 0
    lastFetchedToMs = 0
    isFetching = false
  }

  function applyEvent(evt: BufferedEvent): void {
    switch (evt.type) {
      case 'track_created':
      case 'track_updated':
        if (Array.isArray(evt.payload?.frames)) {
          globalTrackStore.updateFrameInfo(evt.payload.frames as ReplayFrameInfo[])
        }
        // Replay events contain wall-clock timestamps from when the recording was created.
        // The GlobalTrack store filters "active" tracks based on Date.now(), so we re-stamp
        // lastSeen (and per-camera association timestamps) to keep tracks visible during replay.
        if (evt.payload?.track && typeof evt.payload.track === 'object') {
          const now = Date.now()
          const track = evt.payload.track as any
          const cameraAssociations = track.cameraAssociations
          const patchedAssociations =
            cameraAssociations && typeof cameraAssociations === 'object'
              ? Object.fromEntries(Object.entries(cameraAssociations).map(([k, v]) => [k, { ...(v as any), lastSeen: now }]))
              : cameraAssociations
          globalTrackStore.upsertTrackFromServer({
            ...track,
            lastSeen: now,
            cameraAssociations: patchedAssociations,
          })
        } else {
          globalTrackStore.upsertTrackFromServer(evt.payload.track)
        }
        break
      case 'track_expired':
        if (evt.payload.trackId) globalTrackStore.removeTrack(evt.payload.trackId)
        break
      case 'zone_violation':
        if (evt.payload.violation) zoneStore.handleZoneViolation(evt.payload.violation)
        break
      case 'zones_updated':
        if (evt.payload.zones) zoneStore.handleZonesUpdated(evt.payload.zones)
        break
      case 'zone_metrics':
        if (evt.payload.metrics) zoneStore.handleZoneMetrics(evt.payload.metrics)
        break
      case 'zones_reset':
        zoneStore.handleZonesReset()
        break
      default:
        // ignore
        break
    }
  }

  function flushBufferedEvents(upToMs: number): void {
    // Release events up to the requested time immediately.
    // This is critical for seeks/scrubs, where the video jumps but the sync loop
    // would otherwise "catch up" over multiple ticks, causing flicker.
    while (buffer.length > 0) {
      const next = buffer[0]
      if (next.videoTimeMs <= upToMs + releaseToleranceMs) {
        buffer.shift()
        applyEvent(next)
      } else {
        break
      }
    }
  }

  function startSyncLoop(): void {
    if (syncInterval !== null) return
    syncInterval = window.setInterval(() => {
      if (isSeeking) return
      const video = options.masterVideo.value
      if (!video) return
      const nowMs = video.currentTime * 1000

      // IMPORTANT: Flush events FIRST, then prune old ones.
      // This ensures events are applied before being dropped.
      flushBufferedEvents(nowMs)

      // Drop old buffered events to cap memory (only events already past current time)
      while (buffer.length > 0 && buffer[0].videoTimeMs < nowMs - keepBehindMs) {
        buffer.shift()
      }

      // Prefetch ahead if we are running low
      void ensurePrefetch(nowMs)
    }, 16)
  }

  function stopSyncLoop(): void {
    if (syncInterval !== null) {
      window.clearInterval(syncInterval)
      syncInterval = null
    }
  }

  async function loadManifest(recordingId: string): Promise<ReplayManifest> {
    const res = await fetch(`${apiBase.value}/api/recordings/${encodeURIComponent(recordingId)}/manifest`)
    if (!res.ok) throw new Error(`Manifest not found (${res.status})`)
    return await res.json()
  }

  async function loadSnapshot(recordingId: string, timeMs: number): Promise<ReplaySnapshot | null> {
    const url = `${apiBase.value}/api/recordings/${encodeURIComponent(recordingId)}/snapshot?timeMs=${encodeURIComponent(String(timeMs))}`
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  }

  async function loadEvents(recordingId: string, fromMs: number, toMs: number): Promise<ReplayEvent[]> {
    const url = `${apiBase.value}/api/recordings/${encodeURIComponent(recordingId)}/events?fromMs=${encodeURIComponent(String(fromMs))}&toMs=${encodeURIComponent(String(toMs))}&limit=20000`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json() as { events: ReplayEvent[] }
    return data.events ?? []
  }

  function enqueueEvents(events: ReplayEvent[]): void {
    for (const e of events) {
      if (typeof e.videoTimeMs !== 'number' || typeof e.seq !== 'number') continue
      buffer.push({
        seq: e.seq,
        videoTimeMs: e.videoTimeMs,
        type: e.type,
        payload: e.payload,
      })
    }
    buffer.sort((a, b) => a.videoTimeMs - b.videoTimeMs || a.seq - b.seq)
  }

  async function ensurePrefetch(nowMs: number): Promise<void> {
    if (isSeeking || isFetching) return
    const m = manifest.value
    if (!m) return
    // Only refetch when we've consumed more than half the prefetch buffer
    // This prevents spamming fetches on every tick
    const refetchThreshold = prefetchAheadMs / 2
    if (nowMs + refetchThreshold < lastFetchedToMs) return
    const from = Math.max(0, lastFetchedToMs)
    const to = nowMs + prefetchAheadMs
    lastFetchedToMs = to
    isFetching = true
    const myToken = opToken
    try {
      const events = await loadEvents(m.recordingId, from, to)
      if (myToken !== opToken) return
      enqueueEvents(events)
    } finally {
      isFetching = false
    }
  }

  async function openRecording(recordingId: string): Promise<void> {
    isLoading.value = true
    error.value = null
    opToken += 1
    const myToken = opToken
    isSeeking = true
    clearBuffer()
    globalTrackStore.clearAllTracks()
    zoneStore.handleZonesReset()
    globalTrackStore.setDisableClientExpiry(true)

    try {
      manifest.value = await loadManifest(recordingId)
      if (myToken !== opToken) return
      startSyncLoop()

      // Prime state from snapshot at time 0
      const snap = await loadSnapshot(recordingId, 0)
      if (myToken !== opToken) return
      if (snap?.state?.tracks) {
        const now = Date.now()
        const patched = (snap.state.tracks as any[]).map((t) => {
          if (!t || typeof t !== 'object') return t
          const cameraAssociations = (t as any).cameraAssociations
          const patchedAssociations =
            cameraAssociations && typeof cameraAssociations === 'object'
              ? Object.fromEntries(Object.entries(cameraAssociations).map(([k, v]) => [k, { ...(v as any), lastSeen: now }]))
              : cameraAssociations
          return { ...(t as any), lastSeen: now, cameraAssociations: patchedAssociations }
        })
        globalTrackStore.setTracksFromServer(patched)
      }
      zoneStore.handleSnapshot(snap?.state?.zones, snap?.state?.zoneMetrics)

      // Preload a first window
      await ensurePrefetch(0)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to open recording'
      manifest.value = null
    } finally {
      if (myToken === opToken) isSeeking = false
      isLoading.value = false
    }
  }

  async function seekTo(timeMs: number): Promise<void> {
    const m = manifest.value
    if (!m) return

    opToken += 1
    const myToken = opToken
    isSeeking = true
    clearBuffer()
    globalTrackStore.clearAllTracks()
    zoneStore.handleZonesReset()
    globalTrackStore.setDisableClientExpiry(true)

    const snap = await loadSnapshot(m.recordingId, timeMs)
    if (myToken !== opToken) return
    if (snap?.state?.tracks) {
      const now = Date.now()
      const patched = (snap.state.tracks as any[]).map((t) => {
        if (!t || typeof t !== 'object') return t
        const cameraAssociations = (t as any).cameraAssociations
        const patchedAssociations =
          cameraAssociations && typeof cameraAssociations === 'object'
            ? Object.fromEntries(Object.entries(cameraAssociations).map(([k, v]) => [k, { ...(v as any), lastSeen: now }]))
            : cameraAssociations
        return { ...(t as any), lastSeen: now, cameraAssociations: patchedAssociations }
      })
      globalTrackStore.setTracksFromServer(patched)
    }
    zoneStore.handleSnapshot(snap?.state?.zones, snap?.state?.zoneMetrics)

    // Fetch events between snapshot and current time
    const snapTime = snap?.videoTimeMs ?? 0
    const events = await loadEvents(m.recordingId, snapTime, timeMs + prefetchAheadMs)
    if (myToken !== opToken) return
    enqueueEvents(events)
    flushBufferedEvents(timeMs)
    lastFetchedToMs = timeMs + prefetchAheadMs
    if (myToken === opToken) isSeeking = false
  }

  onUnmounted(() => {
    stopSyncLoop()
    globalTrackStore.setDisableClientExpiry(false)
  })

  return {
    manifest,
    isLoading,
    error,
    openRecording,
    seekTo,
    stop: stopSyncLoop,
  }
}
