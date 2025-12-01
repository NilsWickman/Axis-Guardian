/**
 * WebSocket Handler - Real-time track updates
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { GlobalTrack, WebSocketMessage } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'

export class WebSocketBroadcaster {
  private clients: Set<WebSocket> = new Set()

  constructor(private trackManager: TrackManager) {
    // Hook into track manager events
    trackManager.onTrackCreated = (track) => this.broadcast({
      type: 'track_created',
      track: trackToJSON(track),
    })

    trackManager.onTrackUpdated = (track) => this.broadcast({
      type: 'track_updated',
      track: trackToJSON(track),
    })

    trackManager.onTrackExpired = (track) => this.broadcast({
      type: 'track_expired',
      trackId: track.globalTrackId,
    })
  }

  /**
   * Add a new client connection
   */
  addClient(socket: WebSocket): void {
    this.clients.add(socket)

    // Send current state snapshot
    const snapshot: WebSocketMessage = {
      type: 'snapshot',
      tracks: this.trackManager.getActiveTracks().map(trackToJSON),
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
