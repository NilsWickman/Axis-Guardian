/**
 * WebSocket Handler - Real-time track updates
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { WebSocketMessage, CameraFrameInfo, TrackDelta } from '../types.js'
import type { GlobalTrack } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import msgpack from 'msgpack-lite'

export interface WebSocketBroadcasterOptions {
  getFrameInfo?: () => CameraFrameInfo[]
  pingIntervalMs?: number
  /** Enable incremental (delta) updates instead of full track objects */
  enableDeltaUpdates?: boolean
  /** Minimum position change (meters) to trigger delta update */
  deltaPositionThreshold?: number
}

/** Cached track state for delta computation */
interface CachedTrackState {
  position: { x: number; y: number }
  trailLength: number
  confidence: number
  state: string
  lastSeen: number
}

export class WebSocketBroadcaster {
  private clients: Set<WebSocket> = new Set()
  private sinks: Set<(message: WebSocketMessage) => void> = new Set()
  private getFrameInfo?: () => CameraFrameInfo[]
  private pingIntervalMs: number
  private pingTimers: Map<WebSocket, NodeJS.Timeout> = new Map()
  private lastPongAt: Map<WebSocket, number> = new Map()
  private frameInfoInterval?: NodeJS.Timeout
  private enableDeltaUpdates: boolean
  private deltaPositionThreshold: number
  /** Cache of track states for delta computation */
  private trackCache: Map<string, CachedTrackState> = new Map()
  /** Cache cleanup interval */
  private cacheCleanupInterval?: NodeJS.Timeout

  constructor(private trackManager: TrackManager, options?: WebSocketBroadcasterOptions) {
    this.getFrameInfo = options?.getFrameInfo
    this.pingIntervalMs = options?.pingIntervalMs ?? 30000
    this.enableDeltaUpdates = options?.enableDeltaUpdates ?? false
    this.deltaPositionThreshold = options?.deltaPositionThreshold ?? 0.1  // 10cm default
    this.setupHooks()
    this.startFrameInfoBroadcast()
    this.startCacheCleanup()
  }

  /**
   * Start periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      // Clean up track cache for expired tracks
      const activeTracks = new Set(
        this.trackManager.getActiveTracks().map(t => t.globalTrackId)
      )
      for (const trackId of this.trackCache.keys()) {
        if (!activeTracks.has(trackId)) {
          this.trackCache.delete(trackId)
        }
      }
    }, 30000)  // Every 30 seconds
  }

  /**
   * Compute delta between cached and current track state
   */
  private computeTrackDelta(track: GlobalTrack): TrackDelta | null {
    const cached = this.trackCache.get(track.globalTrackId)

    if (!cached) {
      // No cache - this is a new track, can't compute delta
      return null
    }

    const dx = track.currentPosition.x - cached.position.x
    const dy = track.currentPosition.y - cached.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if anything changed
    const positionChanged = distance >= this.deltaPositionThreshold
    const trailChanged = track.trail.length !== cached.trailLength
    const confidenceChanged = track.confidence !== cached.confidence
    const stateChanged = track.state !== cached.state
    const lastSeenChanged = track.lastSeen !== cached.lastSeen

    if (!positionChanged && !trailChanged && !confidenceChanged && !stateChanged && !lastSeenChanged) {
      return null  // No meaningful change
    }

    const delta: TrackDelta = {
      trackId: track.globalTrackId,
    }

    if (positionChanged) {
      delta.position = { ...track.currentPosition }
      // Include velocity from Kalman state if available
      if (track.kalmanState?.mean) {
        delta.velocity = {
          x: track.kalmanState.mean[2]?.[0] ?? 0,
          y: track.kalmanState.mean[3]?.[0] ?? 0,
        }
      }
    }

    if (trailChanged && track.trail.length > cached.trailLength) {
      // Only send new trail points (append-only)
      delta.trail = track.trail.slice(cached.trailLength)
    }

    if (confidenceChanged) {
      delta.confidence = track.confidence
    }

    if (stateChanged) {
      delta.state = track.state
    }

    if (lastSeenChanged) {
      delta.lastSeen = track.lastSeen
    }

    // Include video timing if present
    if (track.videoTiming) {
      delta.videoTiming = track.videoTiming
    }

    return delta
  }

  /**
   * Update track cache after sending update
   */
  private updateTrackCache(track: GlobalTrack): void {
    this.trackCache.set(track.globalTrackId, {
      position: { ...track.currentPosition },
      trailLength: track.trail.length,
      confidence: track.confidence,
      state: track.state,
      lastSeen: track.lastSeen,
    })
  }

  /**
   * Start periodic frame info broadcast to keep delay counters updated
   * even when no track events are occurring.
   */
  private startFrameInfoBroadcast(): void {
    this.frameInfoInterval = setInterval(() => {
      if (this.clients.size === 0) return
      const frames = this.getFrameInfo?.()
      if (frames && frames.length > 0) {
        this.broadcast({ type: 'frame_info', frames })
      }
    }, 1000) // Every 1 second
  }

  /**
   * Stop frame info broadcast timer
   */
  stopFrameInfoBroadcast(): void {
    if (this.frameInfoInterval) {
      clearInterval(this.frameInfoInterval)
      this.frameInfoInterval = undefined
    }
  }

  /**
   * Stop cache cleanup timer
   */
  stopCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval)
      this.cacheCleanupInterval = undefined
    }
  }

  /**
   * Clean up all timers and resources
   */
  destroy(): void {
    this.stopFrameInfoBroadcast()
    this.stopCacheCleanup()
    for (const timer of this.pingTimers.values()) {
      clearInterval(timer)
    }
    this.pingTimers.clear()
    this.clients.clear()
    this.trackCache.clear()
  }

  /**
   * Set up hooks for track event broadcasting
   */
  private setupHooks(): void {
    // Only broadcast confirmed tracks. Unconfirmed tracks are often short-lived
    // (especially in the first second of a replay) and show up as "weird tracks".
    this.trackManager.onTrackCreated = (track) => {
      if (!track.isConfirmed) return
      // Initialize cache for new track
      this.updateTrackCache(track)
      this.broadcast({
        type: 'track_created',
        track: trackToJSON(track),
        frames: this.getFrameInfo?.(),
      })
    }

    this.trackManager.onTrackUpdated = (track) => {
      if (!track.isConfirmed) return

      // Try delta update if enabled
      if (this.enableDeltaUpdates) {
        const delta = this.computeTrackDelta(track)
        if (delta) {
          this.updateTrackCache(track)
          this.broadcast({
            type: 'track_delta',
            delta,
            frames: this.getFrameInfo?.(),
          })
          return
        } else if (this.trackCache.has(track.globalTrackId)) {
          // No significant change, skip broadcast
          return
        }
      }

      // Fall back to full update
      this.updateTrackCache(track)
      this.broadcast({
        type: 'track_updated',
        track: trackToJSON(track),
        frames: this.getFrameInfo?.(),
      })
    }

    this.trackManager.onTrackExpired = (track) => {
      // Clean up cache
      this.trackCache.delete(track.globalTrackId)
      this.broadcast({
        type: 'track_expired',
        trackId: track.globalTrackId,
        frames: this.getFrameInfo?.(),
      })
    }
  }

  /**
   * Add a new client connection (all clients use MessagePack)
   */
  addClient(socket: WebSocket): void {
    this.clients.add(socket)

    // Send current state snapshot
    this.sendSnapshot(socket)

    // Clients should be receive-only for this endpoint
    socket.on('message', () => {
      try {
        socket.close(1008, 'Client messages not supported')
      } catch {
        socket.terminate()
      }
    })

    this.setupKeepAlive(socket)

    // Handle disconnection
    socket.on('close', () => {
      this.clients.delete(socket)
      this.cleanupKeepAlive(socket)
    })

    socket.on('error', () => {
      this.clients.delete(socket)
      this.cleanupKeepAlive(socket)
    })
  }

  private setupKeepAlive(socket: WebSocket): void {
    this.lastPongAt.set(socket, Date.now())
    socket.on('pong', () => {
      this.lastPongAt.set(socket, Date.now())
    })

    const timer = setInterval(() => {
      if (socket.readyState !== 1) {
        this.cleanupKeepAlive(socket)
        return
      }

      const lastPong = this.lastPongAt.get(socket) ?? 0
      if (Date.now() - lastPong > this.pingIntervalMs * 2) {
        try {
          socket.terminate()
        } finally {
          this.cleanupKeepAlive(socket)
        }
        return
      }

      try {
        socket.ping()
      } catch {
        try {
          socket.terminate()
        } finally {
          this.cleanupKeepAlive(socket)
        }
      }
    }, this.pingIntervalMs)

    this.pingTimers.set(socket, timer)
  }

  private cleanupKeepAlive(socket: WebSocket): void {
    const timer = this.pingTimers.get(socket)
    if (timer) clearInterval(timer)
    this.pingTimers.delete(socket)
    this.lastPongAt.delete(socket)
  }

  /**
   * Send snapshot of current tracks
   */
  private sendSnapshot(socket: WebSocket): void {
    const snapshot: WebSocketMessage = {
      type: 'snapshot',
      tracks: this.trackManager.getActiveTracks().map(trackToJSON),
      frames: this.getFrameInfo?.(),
    }
    this.send(socket, snapshot)
  }

  /**
   * Add a message sink (e.g. for recording/replay capture).
   * Sinks receive the same messages that are broadcast to WS clients.
   */
  addSink(sink: (message: WebSocketMessage) => void): void {
    this.sinks.add(sink)
  }

  removeSink(sink: (message: WebSocketMessage) => void): void {
    this.sinks.delete(sink)
  }

  /**
   * Broadcast a message to all connected clients using MessagePack encoding
   */
  broadcast(message: WebSocketMessage): void {
    if (this.clients.size > 0) {
      const data = msgpack.encode(message)
      for (const client of this.clients) {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(data)
        }
      }
    }

    // Notify sinks (never throw)
    if (this.sinks.size > 0) {
      for (const sink of this.sinks) {
        try {
          sink(message)
        } catch (err) {
          console.warn('[WebSocketBroadcaster] Sink error:', err)
        }
      }
    }
  }

  /**
   * Send a message to a specific client using MessagePack encoding
   */
  private send(socket: WebSocket, message: WebSocketMessage): void {
    if (socket.readyState !== 1) return
    socket.send(msgpack.encode(message))
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size
  }
}

export function registerWebSocket(
  app: FastifyInstance,
  broadcaster: WebSocketBroadcaster,
  options: {
    allowedOrigins: string[]
    allowNoOrigin?: boolean
    maxConnectionsPerIp: number
  }
): void {
  const connectionsPerIp = new Map<string, number>()

  app.get('/ws', { websocket: true }, (socket, req) => {
    const origin = req.headers.origin
    if (!isAllowedOrigin(origin, options.allowedOrigins, options.allowNoOrigin ?? false)) {
      socket.close(1008, 'Origin not allowed')
      return
    }

    const ip = req.ip
    const current = connectionsPerIp.get(ip) ?? 0
    if (current >= options.maxConnectionsPerIp) {
      socket.close(1013, 'Too many connections')
      return
    }

    connectionsPerIp.set(ip, current + 1)
    socket.on('close', () => {
      const next = (connectionsPerIp.get(ip) ?? 1) - 1
      if (next <= 0) connectionsPerIp.delete(ip)
      else connectionsPerIp.set(ip, next)
    })

    console.log('WebSocket client connected (msgpack)')
    broadcaster.addClient(socket)
  })
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
  allowNoOrigin: boolean
): boolean {
  if (!origin) return allowNoOrigin
  return allowedOrigins.includes(origin)
}
