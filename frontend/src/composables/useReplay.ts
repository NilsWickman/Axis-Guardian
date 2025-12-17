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
  videoTimeMs: number
  type: string
  payload: any
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

  const prefetchAheadMs = options.prefetchAheadMs ?? 15000
  const keepBehindMs = options.keepBehindMs ?? 5000
  const releaseToleranceMs = options.releaseToleranceMs ?? 50

  const apiBase = computed(() => config.trackingServiceApiUrl.replace(/\/$/, ''))

  function clearBuffer(): void {
    buffer.length = 0
    lastFetchedToMs = 0
  }

  function applyEvent(evt: BufferedEvent): void {
    switch (evt.type) {
      case 'track_created':
      case 'track_updated':
        globalTrackStore.upsertTrackFromServer(evt.payload.track)
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

  function startSyncLoop(): void {
    if (syncInterval !== null) return
    syncInterval = window.setInterval(() => {
      const video = options.masterVideo.value
      if (!video) return
      const nowMs = video.currentTime * 1000

      // Drop old buffered events to cap memory
      while (buffer.length > 0 && buffer[0].videoTimeMs < nowMs - keepBehindMs) {
        buffer.shift()
      }

      // Release events up to (now + tolerance)
      while (buffer.length > 0) {
        const next = buffer[0]
        if (next.videoTimeMs <= nowMs + releaseToleranceMs) {
          buffer.shift()
          applyEvent(next)
        } else {
          break
        }
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
      if (typeof e.videoTimeMs !== 'number') continue
      buffer.push({
        videoTimeMs: e.videoTimeMs,
        type: e.type,
        payload: e.payload,
      })
    }
    buffer.sort((a, b) => a.videoTimeMs - b.videoTimeMs)
  }

  async function ensurePrefetch(nowMs: number): Promise<void> {
    const m = manifest.value
    if (!m) return
    const wantTo = nowMs + prefetchAheadMs
    if (wantTo <= lastFetchedToMs) return
    const from = Math.max(0, lastFetchedToMs)
    const to = wantTo
    lastFetchedToMs = to
    const events = await loadEvents(m.recordingId, from, to)
    enqueueEvents(events)
  }

  async function openRecording(recordingId: string): Promise<void> {
    isLoading.value = true
    error.value = null
    clearBuffer()
    globalTrackStore.clearAllTracks()
    zoneStore.handleZonesReset()

    try {
      manifest.value = await loadManifest(recordingId)
      startSyncLoop()

      // Prime state from snapshot at time 0
      const snap = await loadSnapshot(recordingId, 0)
      if (snap?.state?.tracks) {
        globalTrackStore.setTracksFromServer(snap.state.tracks)
      }
      zoneStore.handleSnapshot(snap?.state?.zones, snap?.state?.zoneMetrics)

      // Preload a first window
      await ensurePrefetch(0)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to open recording'
      manifest.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function seekTo(timeMs: number): Promise<void> {
    const m = manifest.value
    if (!m) return

    clearBuffer()
    globalTrackStore.clearAllTracks()
    zoneStore.handleZonesReset()

    const snap = await loadSnapshot(m.recordingId, timeMs)
    if (snap?.state?.tracks) {
      globalTrackStore.setTracksFromServer(snap.state.tracks)
    }
    zoneStore.handleSnapshot(snap?.state?.zones, snap?.state?.zoneMetrics)

    // Fetch events between snapshot and current time
    const snapTime = snap?.videoTimeMs ?? 0
    const events = await loadEvents(m.recordingId, snapTime, timeMs + prefetchAheadMs)
    enqueueEvents(events)
    lastFetchedToMs = timeMs + prefetchAheadMs
  }

  onUnmounted(() => {
    stopSyncLoop()
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



