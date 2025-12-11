/**
 * WebSocket Handler - Real-time track updates
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { WebSocketMessage, CameraFrameInfo, ZoneConfig } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import type { ZoneManager } from '../zones/zone-manager.js'

export interface WebSocketBroadcasterOptions {
  getFrameInfo?: () => CameraFrameInfo[]
}

export class WebSocketBroadcaster {
  private clients: Set<WebSocket> = new Set()
  private getFrameInfo?: () => CameraFrameInfo[]
  private zoneManager?: ZoneManager

  constructor(private trackManager: TrackManager, options?: WebSocketBroadcasterOptions) {
    this.getFrameInfo = options?.getFrameInfo

    // Hook into track manager events
    trackManager.onTrackCreated = (track) => this.broadcast({
      type: 'track_created',
      track: trackToJSON(track),
      frames: this.getFrameInfo?.(),
    })

    trackManager.onTrackUpdated = (track) => this.broadcast({
      type: 'track_updated',
      track: trackToJSON(track),
      frames: this.getFrameInfo?.(),
    })

    trackManager.onTrackExpired = (track) => this.broadcast({
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
  }

  /**
   * Add a new client connection
   */
  addClient(socket: WebSocket): void {
    this.clients.add(socket)

    // Send current state snapshot (including zones if available)
    const snapshot: WebSocketMessage = {
      type: 'snapshot',
      tracks: this.trackManager.getActiveTracks().map(trackToJSON),
      frames: this.getFrameInfo?.(),
      zones: this.zoneManager?.getZones(),
    }
    this.send(socket, snapshot)

    // Handle disconnection
    socket.on('close', () => {
      this.clients.delete(socket)
    })

    socket.on('error', () => {
      this.clients.delete(socket)
    })
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
