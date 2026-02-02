/**
 * Backend WebSocket Client
 *
 * Connects to the backend WebSocket endpoint to receive
 * real-time global track updates with accurate K/R/T projection.
 *
 * Supports video-synchronized track updates by buffering updates with
 * videoTiming and releasing them when the video catches up.
 */

import { ref, onUnmounted, type Ref } from 'vue'
import { useGlobalTrackStore, type VideoTimingInfo } from '@/stores/globalTracks'
import { useConnectionStatusStore } from '@/stores/connectionStatus'
import { config } from '@/config/environment'
import { createBackoffCalculator, type BackoffConfig } from '@/utils/exponential-backoff'
import msgpack from 'msgpack-lite'

/** Track delta for incremental updates (matches backend TrackDelta) */
export interface TrackDelta {
  trackId: string
  position?: { x: number; y: number }
  trail?: { x: number; y: number; timestamp: number }[]
  confidence?: number
  state?: string
  velocity?: { x: number; y: number }
  lastSeen?: number
  videoTiming?: { videoTimeMs?: number; rtpTimestamp?: number; cameraId?: string }
}

export interface BackendWebSocketOptions {
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  /** Backoff configuration for reconnection */
  backoff?: Partial<BackoffConfig>
  /** Video element ref for sync (optional - if not provided, updates apply immediately) */
  videoElement?: Ref<HTMLVideoElement | null>
  /** Camera ID to sync with (only buffer tracks from this camera) */
  syncCameraId?: string
  /** Enable adaptive sync tolerance based on measured jitter */
  adaptiveTolerance?: boolean
  /** Base sync tolerance in ms (default 50) */
  baseSyncToleranceMs?: number
  /** Maximum sync tolerance in ms (default 200) */
  maxSyncToleranceMs?: number
  /** Stale update threshold in ms (default 2000) */
  staleThresholdMs?: number
}

const DEFAULT_OPTIONS: Required<Omit<BackendWebSocketOptions, 'videoElement' | 'syncCameraId' | 'backoff'>> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  adaptiveTolerance: true,
  baseSyncToleranceMs: 50,
  maxSyncToleranceMs: 200,
  staleThresholdMs: 2000,
}

/** Track update with video timing for buffering */
interface BufferedTrackUpdate {
  type: 'track_created' | 'track_updated' | 'track_delta'
  track?: unknown
  delta?: TrackDelta
  videoTiming: VideoTimingInfo
}

// RTP tolerance for frame matching (~1.5 frames at 30fps, 90kHz clock)
const RTP_TOLERANCE = 4500

export function useBackendWebSocket(options: BackendWebSocketOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const globalTrackStore = useGlobalTrackStore()
  const connectionStatus = useConnectionStatusStore()

  // Create backoff calculator for exponential reconnection delays
  const backoffCalculator = createBackoffCalculator(options.backoff)

  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  const messageCount = ref(0)

  // Video sync state
  const trackSyncBuffer: BufferedTrackUpdate[] = []
  let syncInterval: ReturnType<typeof setInterval> | null = null
  let lastVideoRtpTimestamp: number | null = null
  let syncCalibrated = false
  let syncOffset = 0

  // Adaptive sync tolerance state
  const syncDeltas: number[] = []
  const MAX_DELTA_SAMPLES = 50
  let currentSyncTolerance = opts.baseSyncToleranceMs
  const perCameraLastSeen: Map<string, number> = new Map()

  // Sync metrics (exported for debugging)
  const syncMetrics = ref({
    bufferedUpdates: 0,
    appliedUpdates: 0,
    droppedStaleUpdates: 0,
    currentTolerance: opts.baseSyncToleranceMs,
    avgJitter: 0,
    perCameraStale: {} as Record<string, boolean>,
  })

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Connect to the backend WebSocket
   */
  function connect(): void {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = config.trackingServiceWsUrl || 'ws://localhost:3010/ws'
    // Use MessagePack binary protocol for efficient encoding
    const wsUrlWithFormat = wsUrl.includes('?') ? `${wsUrl}&format=msgpack` : `${wsUrl}?format=msgpack`
    connectionStatus.setBackendConnecting()

    try {
      socket.value = new WebSocket(wsUrlWithFormat)

      socket.value.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        lastError.value = null
        backoffCalculator.reset()
        connectionStatus.setBackendConnected()

        // Clear all tracks on reconnection to prevent stale data from previous session
        // The server will send a fresh snapshot immediately after connection
        globalTrackStore.clearAllTracks()
      }

      socket.value.onmessage = (event) => {
        try {
          let message
          // Handle both MessagePack binary and JSON text formats
          if (event.data instanceof ArrayBuffer) {
            // MessagePack binary
            message = msgpack.decode(new Uint8Array(event.data))
          } else if (event.data instanceof Blob) {
            // Blob needs async conversion - skip for now, should be rare
            event.data.arrayBuffer().then(buffer => {
              const decoded = msgpack.decode(new Uint8Array(buffer))
              handleMessage(decoded)
              messageCount.value++
            })
            return
          } else {
            // JSON string
            message = JSON.parse(event.data)
          }
          handleMessage(message)
          messageCount.value++
        } catch (error) {
          console.error('[TrackingWS] Failed to parse message:', error)
        }
      }

      socket.value.onclose = () => {
        isConnected.value = false
        socket.value = null

        if (opts.autoReconnect && !backoffCalculator.isMaxAttempts(opts.maxReconnectAttempts)) {
          scheduleReconnect()
        } else {
          connectionStatus.setBackendDisconnected()
        }
      }

      socket.value.onerror = (error) => {
        console.error('[TrackingWS] Error:', error)
        lastError.value = 'WebSocket error'
        connectionStatus.setBackendError('WebSocket error')
      }
    } catch (error) {
      console.error('[TrackingWS] Failed to create WebSocket:', error)
      lastError.value = String(error)
      connectionStatus.setBackendError(String(error))

      if (opts.autoReconnect && !backoffCalculator.isMaxAttempts(opts.maxReconnectAttempts)) {
        scheduleReconnect()
      }
    }
  }

  /**
   * Disconnect from the tracking service
   */
  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (socket.value) {
      socket.value.close()
      socket.value = null
    }

    isConnected.value = false
    backoffCalculator.reset()
    connectionStatus.setBackendDisconnected()
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) return

    reconnectAttempts.value++
    const delay = backoffCalculator.next()

    connectionStatus.setBackendReconnecting(reconnectAttempts.value, delay)
    console.log(`[TrackingWS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value})`)

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  /**
   * Check if video sync is enabled (video element provided)
   */
  function isSyncEnabled(): boolean {
    return !!options.videoElement?.value
  }

  /**
   * Calculate adaptive sync tolerance based on measured jitter
   */
  function calculateAdaptiveTolerance(): number {
    if (!opts.adaptiveTolerance || syncDeltas.length < 5) {
      return opts.baseSyncToleranceMs
    }

    // Calculate jitter (standard deviation of sync deltas)
    const avg = syncDeltas.reduce((a, b) => a + b, 0) / syncDeltas.length
    const variance = syncDeltas.reduce((sum, d) => sum + (d - avg) ** 2, 0) / syncDeltas.length
    const jitter = Math.sqrt(variance)

    // Adaptive tolerance = base + 2 * jitter (95th percentile coverage)
    const adaptive = Math.min(
      opts.maxSyncToleranceMs,
      Math.max(opts.baseSyncToleranceMs, opts.baseSyncToleranceMs + jitter * 2)
    )

    // Update metrics
    syncMetrics.value.avgJitter = jitter
    syncMetrics.value.currentTolerance = adaptive

    return adaptive
  }

  /**
   * Record a sync delta for adaptive tolerance calculation
   */
  function recordSyncDelta(delta: number): void {
    syncDeltas.push(Math.abs(delta))
    if (syncDeltas.length > MAX_DELTA_SAMPLES) {
      syncDeltas.shift()
    }
    currentSyncTolerance = calculateAdaptiveTolerance()
  }

  /**
   * Check if a camera appears stale (no updates recently)
   */
  function updateCameraStaleness(cameraId: string): void {
    const now = Date.now()
    perCameraLastSeen.set(cameraId, now)

    // Check all cameras for staleness (> 3 seconds without update)
    const staleThreshold = 3000
    const staleStatus: Record<string, boolean> = {}
    for (const [cam, lastSeen] of perCameraLastSeen) {
      staleStatus[cam] = (now - lastSeen) > staleThreshold
    }
    syncMetrics.value.perCameraStale = staleStatus
  }

  /**
   * Start the sync loop that releases buffered track updates
   */
  function startSyncLoop(): void {
    if (syncInterval) return

    syncInterval = setInterval(() => {
      if (!options.videoElement?.value || trackSyncBuffer.length === 0) return

      const video = options.videoElement.value
      const videoTimeMs = video.currentTime * 1000

      // Calibrate offset on first buffered update
      if (!syncCalibrated && trackSyncBuffer.length > 0) {
        const first = trackSyncBuffer[0]
        syncOffset = first.videoTiming.videoTimeMs - videoTimeMs
        syncCalibrated = true
        console.log(`[TrackSync] Calibrated offset: ${syncOffset.toFixed(0)}ms`)
      }

      // Update buffer size metric
      syncMetrics.value.bufferedUpdates = trackSyncBuffer.length

      // Prune stale updates (configurable threshold)
      while (trackSyncBuffer.length > 0) {
        const oldest = trackSyncBuffer[0]
        const age = videoTimeMs - (oldest.videoTiming.videoTimeMs - syncOffset)
        if (age > opts.staleThresholdMs) {
          trackSyncBuffer.shift()
          syncMetrics.value.droppedStaleUpdates++
        } else {
          break
        }
      }

      // Release updates that match current video time
      while (trackSyncBuffer.length > 0) {
        const update = trackSyncBuffer[0]
        const timing = update.videoTiming

        // Track per-camera staleness
        if (timing.cameraId) {
          updateCameraStaleness(timing.cameraId)
        }

        // Use RTP timestamp if available for frame-perfect sync
        if (timing.rtpTimestamp !== undefined && lastVideoRtpTimestamp !== null) {
          const rtpDiff = lastVideoRtpTimestamp - timing.rtpTimestamp
          if (rtpDiff >= -RTP_TOLERANCE) {
            // Video has caught up - release this update
            trackSyncBuffer.shift()
            applyTrackUpdate(update)
            recordSyncDelta(rtpDiff / 90) // Convert RTP ticks to ~ms
          } else {
            // Update is ahead of video - wait
            break
          }
        } else {
          // Fallback to time-based sync with adaptive tolerance
          const updateTime = timing.videoTimeMs - syncOffset
          const delta = videoTimeMs - updateTime

          if (delta >= -currentSyncTolerance) {
            // Within adaptive tolerance
            trackSyncBuffer.shift()
            applyTrackUpdate(update)
            recordSyncDelta(delta)
          } else {
            break
          }
        }
      }
    }, 16) // ~60fps polling

    console.log('[TrackSync] Started sync loop with adaptive tolerance')
  }

  /**
   * Stop the sync loop
   */
  function stopSyncLoop(): void {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
    trackSyncBuffer.length = 0
    syncCalibrated = false
    lastVideoRtpTimestamp = null
    // Reset adaptive state
    syncDeltas.length = 0
    currentSyncTolerance = opts.baseSyncToleranceMs
    perCameraLastSeen.clear()
    console.log('[TrackSync] Stopped sync loop')
  }

  /**
   * Reset sync metrics
   */
  function resetSyncMetrics(): void {
    syncMetrics.value = {
      bufferedUpdates: 0,
      appliedUpdates: 0,
      droppedStaleUpdates: 0,
      currentTolerance: opts.baseSyncToleranceMs,
      avgJitter: 0,
      perCameraStale: {},
    }
    syncDeltas.length = 0
    currentSyncTolerance = opts.baseSyncToleranceMs
  }

  /**
   * Apply a track update to the store
   */
  function applyTrackUpdate(update: BufferedTrackUpdate): void {
    if (update.type === 'track_created' || update.type === 'track_updated') {
      globalTrackStore.upsertTrackFromServer(update.track)
      syncMetrics.value.appliedUpdates++
    } else if (update.type === 'track_delta' && update.delta) {
      globalTrackStore.applyTrackDelta(update.delta)
      syncMetrics.value.appliedUpdates++
    }
  }

  /**
   * Update the last known video RTP timestamp (call from video frame callback)
   */
  function updateVideoRtpTimestamp(rtpTimestamp: number): void {
    lastVideoRtpTimestamp = rtpTimestamp
  }

  /**
   * Handle incoming WebSocket messages
   */
  function handleMessage(message: {
    type: string
    track?: unknown & { videoTiming?: VideoTimingInfo }
    tracks?: unknown[]
    trackId?: string
    delta?: TrackDelta
    frames?: unknown[]
  }): void {
    // Update frame info if present
    if (message.frames) {
      globalTrackStore.updateFrameInfo(message.frames as { cameraId: string; frameNumber: number; timestamp: number }[])
    }

    switch (message.type) {
      case 'snapshot':
        // Snapshots apply immediately (initial state)
        if (Array.isArray(message.tracks)) {
          globalTrackStore.setTracksFromServer(message.tracks)
        }
        break

      case 'track_created':
      case 'track_updated':
        if (message.track) {
          const track = message.track as { videoTiming?: VideoTimingInfo }

          // Check if we should buffer this update for video sync
          if (isSyncEnabled() && track.videoTiming) {
            // Only sync tracks from the specified camera (if configured)
            const shouldSync = !options.syncCameraId ||
              track.videoTiming.cameraId === options.syncCameraId

            if (shouldSync) {
              // Start sync loop if not running
              startSyncLoop()

              // Buffer the update
              trackSyncBuffer.push({
                type: message.type,
                track: message.track,
                videoTiming: track.videoTiming,
              })
              return
            }
          }

          // No video sync - apply immediately
          globalTrackStore.upsertTrackFromServer(message.track)
        }
        break

      case 'track_delta':
        // Handle incremental track updates
        if (message.delta) {
          const delta = message.delta

          // Check if we should buffer this delta for video sync
          if (isSyncEnabled() && delta.videoTiming) {
            // Only sync deltas from the specified camera (if configured)
            const shouldSync = !options.syncCameraId ||
              delta.videoTiming.cameraId === options.syncCameraId

            if (shouldSync) {
              // Start sync loop if not running
              startSyncLoop()

              // Buffer the delta update
              trackSyncBuffer.push({
                type: 'track_delta',
                delta,
                videoTiming: delta.videoTiming as VideoTimingInfo,
              })
              return
            }
          }

          // No video sync - apply immediately
          globalTrackStore.applyTrackDelta(delta)
        }
        break

      case 'track_expired':
        if (message.trackId) {
          globalTrackStore.removeTrack(message.trackId)
        }
        break

      case 'frame_info':
        // Periodic frame info broadcast for delay counters
        if (message.frames) {
          globalTrackStore.updateFrameInfo(message.frames as { cameraId: string; frameNumber: number; timestamp: number }[])
        }
        break

      default:
        console.warn(`[TrackingWS] Unknown message type: ${message.type}`)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
    stopSyncLoop()
  })

  return {
    // State
    isConnected,
    reconnectAttempts,
    lastError,
    messageCount,
    syncMetrics,

    // Actions
    connect,
    disconnect,

    // Video sync
    updateVideoRtpTimestamp,
    stopSyncLoop,
    resetSyncMetrics,
  }
}
