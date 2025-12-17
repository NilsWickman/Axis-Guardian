/**
 * WebSocket Handler - Real-time track updates
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { WebSocketMessage, CameraFrameInfo } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import type { ZoneManager } from '../zones/zone-manager.js'

export interface WebSocketBroadcasterOptions {
  getFrameInfo?: () => CameraFrameInfo[]
}

export class WebSocketBroadcaster {
  private clients: Set<WebSocket> = new Set()
  private sinks: Set<(message: WebSocketMessage) => void> = new Set()
  private getFrameInfo?: () => CameraFrameInfo[]
  private zoneManager?: ZoneManager

  constructor(private trackManager: TrackManager, options?: WebSocketBroadcasterOptions) {
    this.getFrameInfo = options?.getFrameInfo
    this.setupHooks()
  }

  /**
   * Set up hooks for track event broadcasting
   */
  private setupHooks(): void {
    // Only broadcast confirmed tracks. Unconfirmed tracks are often short-lived
    // (especially in the first second of a replay) and show up as “weird tracks”.
    this.trackManager.onTrackCreated = (track) => {
      if (!track.isConfirmed) return
      this.broadcast({
        type: 'track_created',
        track: trackToJSON(track),
        frames: this.getFrameInfo?.(),
      })
    }

    this.trackManager.onTrackUpdated = (track) => {
      if (!track.isConfirmed) return
      this.broadcast({
        type: 'track_updated',
        track: trackToJSON(track),
        frames: this.getFrameInfo?.(),
      })
    }

    this.trackManager.onTrackExpired = (track) => this.broadcast({
      type: 'track_expired',
      trackId: track.globalTrackId,
      frames: this.getFrameInfo?.(),
    })
  }

  /**
   * Set zone manager and hook up violation events
   */
  setZoneManager(zoneManager: ZoneManager): void {
    this.zoneManager = zoneManager

    // Hook into zone violation events
    zoneManager.onViolation = (violation) => {
      this.broadcast({
        type: 'zone_violation',
        violation,
      })
    }

    // Hook into zone metrics changes
    zoneManager.onMetricsChanged = (_zoneId, metrics) => {
      this.broadcast({
        type: 'zone_metrics',
        metrics,
      })
    }

    // Hook into zones reset
    zoneManager.onZonesReset = () => {
      this.broadcast({
        type: 'zones_reset',
      })
    }
  }

  /**
   * Add a new client connection
   */
  addClient(socket: WebSocket): void {
    this.clients.add(socket)

    // Send current state snapshot
    this.sendSnapshot(socket)

    // Handle disconnection
    socket.on('close', () => {
      this.clients.delete(socket)
    })

    socket.on('error', () => {
      this.clients.delete(socket)
    })
  }

  /**
   * Send snapshot of current tracks
   */
  private sendSnapshot(socket: WebSocket): void {
    const snapshot: WebSocketMessage = {
      type: 'snapshot',
      tracks: this.trackManager.getActiveTracks().map(trackToJSON),
      frames: this.getFrameInfo?.(),
      zones: this.zoneManager?.getZones(),
      zoneMetrics: this.zoneManager?.getAllZoneMetrics(),
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
   * Broadcast a message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message)
    for (const client of this.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data)
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
   * Send a message to a specific client
   */
  private send(socket: WebSocket, message: WebSocketMessage): void {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message))
    }
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
  broadcaster: WebSocketBroadcaster
): void {
  app.get('/ws', { websocket: true }, (socket) => {
    console.log('WebSocket client connected')
    broadcaster.addClient(socket)
  })
}
