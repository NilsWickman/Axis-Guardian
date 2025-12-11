/**
 * Tracking Service WebSocket Client
 *
 * Connects to the tracking-service WebSocket endpoint to receive
 * real-time global track updates with accurate K/R/T projection.
 */

import { ref, onUnmounted } from 'vue'
import { useGlobalTrackStore } from '@/stores/globalTracks'
import { useZoneStore } from '@/stores/zones'
import { config } from '@/config/environment'

export interface TrackingServiceOptions {
  autoReconnect?: boolean
  reconnectIntervalMs?: number
  maxReconnectAttempts?: number
}

const DEFAULT_OPTIONS: Required<TrackingServiceOptions> = {
  autoReconnect: true,
  reconnectIntervalMs: 3000,
  maxReconnectAttempts: 10,
}

export function useTrackingServiceWebSocket(options: TrackingServiceOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const globalTrackStore = useGlobalTrackStore()
  const zoneStore = useZoneStore()

  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  const messageCount = ref(0)

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Connect to the tracking service WebSocket
   */
  function connect(): void {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = config.trackingServiceWsUrl || 'ws://localhost:3010/ws'

    try {
      socket.value = new WebSocket(wsUrl)

      socket.value.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        lastError.value = null
      }

      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
          messageCount.value++
        } catch (error) {
          console.error('[TrackingWS] Failed to parse message:', error)
        }
      }

      socket.value.onclose = () => {
        isConnected.value = false
        socket.value = null

        if (opts.autoReconnect && reconnectAttempts.value < opts.maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      socket.value.onerror = (error) => {
        console.error('[TrackingWS] Error:', error)
        lastError.value = 'WebSocket error'
      }
    } catch (error) {
      console.error('[TrackingWS] Failed to create WebSocket:', error)
      lastError.value = String(error)

      if (opts.autoReconnect && reconnectAttempts.value < opts.maxReconnectAttempts) {
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
  }

  /**
   * Schedule a reconnection attempt
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) return

    reconnectAttempts.value++

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, opts.reconnectIntervalMs)
  }

  /**
   * Handle incoming WebSocket messages
   */
  function handleMessage(message: {
    type: string
    track?: unknown
    tracks?: unknown[]
    trackId?: string
    frames?: unknown[]
    zones?: unknown[]
    violation?: unknown
  }): void {
    // Update frame info if present
    if (message.frames) {
      globalTrackStore.updateFrameInfo(message.frames as { cameraId: string; frameNumber: number; timestamp: number }[])
    }

    switch (message.type) {
      case 'snapshot':
        if (Array.isArray(message.tracks)) {
          globalTrackStore.setTracksFromServer(message.tracks)
        }
        // Handle zones in snapshot
        if (message.zones) {
          zoneStore.handleSnapshot(message.zones as import('@/stores/zones').ZoneConfig[])
        }
        break

      case 'track_created':
        if (message.track) {
          globalTrackStore.upsertTrackFromServer(message.track)
        }
        break

      case 'track_updated':
        if (message.track) {
          globalTrackStore.upsertTrackFromServer(message.track)
        }
        break

      case 'track_expired':
        if (message.trackId) {
          globalTrackStore.removeTrack(message.trackId)
        }
        break

      case 'zone_violation':
        if (message.violation) {
          zoneStore.handleZoneViolation(message.violation as import('@/stores/zones').ZoneViolation)
        }
        break

      case 'zones_updated':
        if (message.zones) {
          zoneStore.handleZonesUpdated(message.zones as import('@/stores/zones').ZoneConfig[])
        }
        break

      default:
        console.warn(`[TrackingWS] Unknown message type: ${message.type}`)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    isConnected,
    reconnectAttempts,
    lastError,
    messageCount,

    // Actions
    connect,
    disconnect,
  }
}
