/**
 * WebSocket Handler - Real-time track updates
 *
 * Supports dual tracking mode: sends both spatial-only and re-ID track sets
 * so the frontend can switch between viewing modes.
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { WebSocketMessage, CameraFrameInfo, DualTrackSnapshot, DualTrackUpdate, TrackChanges, GlobalTrack } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import type { ZoneManager } from '../zones/zone-manager.js'

export interface WebSocketBroadcasterOptions {
  getFrameInfo?: () => CameraFrameInfo[]
  /** Spatial-only track manager for dual mode */
  spatialTrackManager?: TrackManager
  /** Re-ID enabled track manager for dual mode */
  reidTrackManager?: TrackManager
}

export class WebSocketBroadcaster {
  private clients: Set<WebSocket> = new Set()
  private getFrameInfo?: () => CameraFrameInfo[]
  private zoneManager?: ZoneManager
  /** Spatial-only track manager (for dual mode) */
  private spatialTrackManager?: TrackManager
  /** Re-ID enabled track manager (for dual mode) */
  private reidTrackManager?: TrackManager
  /** Whether dual mode is enabled */
  private dualModeEnabled: boolean = false

  // Batch tracking changes for dual mode
  private pendingSpatialChanges: TrackChanges = {}
  private pendingReidChanges: TrackChanges = {}
  private batchTimeout: NodeJS.Timeout | null = null
  private static readonly BATCH_DELAY_MS = 50 // Batch updates within 50ms window

  constructor(private trackManager: TrackManager, options?: WebSocketBroadcasterOptions) {
    this.getFrameInfo = options?.getFrameInfo
    this.spatialTrackManager = options?.spatialTrackManager
    this.reidTrackManager = options?.reidTrackManager

    // Enable dual mode if both managers are provided
    this.dualModeEnabled = !!(this.spatialTrackManager && this.reidTrackManager)

    if (this.dualModeEnabled) {
      console.log('[WebSocketBroadcaster] Dual mode enabled: broadcasting both spatial and re-ID tracks')
      this.setupDualModeHooks()
    } else {
      // Single mode - use legacy hooks
      this.setupSingleModeHooks(trackManager)
    }
  }

  /**
   * Set up hooks for single (legacy) mode
   */
  private setupSingleModeHooks(trackManager: TrackManager): void {
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
   * Set up hooks for dual mode broadcasting
   */
  private setupDualModeHooks(): void {
    // Hook spatial track manager
    if (this.spatialTrackManager) {
      this.spatialTrackManager.onTrackCreated = (track) => {
        this.queueSpatialChange('created', track)
      }
      this.spatialTrackManager.onTrackUpdated = (track) => {
        this.queueSpatialChange('updated', track)
      }
      this.spatialTrackManager.onTrackExpired = (track) => {
        this.queueSpatialChange('expired', track)
      }
    }

    // Hook re-ID track manager
    if (this.reidTrackManager) {
      this.reidTrackManager.onTrackCreated = (track) => {
        this.queueReidChange('created', track)
      }
      this.reidTrackManager.onTrackUpdated = (track) => {
        this.queueReidChange('updated', track)
      }
      this.reidTrackManager.onTrackExpired = (track) => {
        this.queueReidChange('expired', track)
      }
    }
  }

  /**
   * Queue a spatial track change for batched broadcasting
   */
  private queueSpatialChange(type: 'created' | 'updated' | 'expired', track: GlobalTrack): void {
    if (type === 'expired') {
      this.pendingSpatialChanges.expired = this.pendingSpatialChanges.expired ?? []
      this.pendingSpatialChanges.expired.push(track.globalTrackId)
    } else if (type === 'created') {
      this.pendingSpatialChanges.created = this.pendingSpatialChanges.created ?? []
      this.pendingSpatialChanges.created.push(trackToJSON(track))
    } else {
      this.pendingSpatialChanges.updated = this.pendingSpatialChanges.updated ?? []
      this.pendingSpatialChanges.updated.push(trackToJSON(track))
    }
    this.scheduleBatchBroadcast()
  }

  /**
   * Queue a re-ID track change for batched broadcasting
   */
  private queueReidChange(type: 'created' | 'updated' | 'expired', track: GlobalTrack): void {
    if (type === 'expired') {
      this.pendingReidChanges.expired = this.pendingReidChanges.expired ?? []
      this.pendingReidChanges.expired.push(track.globalTrackId)
    } else if (type === 'created') {
      this.pendingReidChanges.created = this.pendingReidChanges.created ?? []
      this.pendingReidChanges.created.push(trackToJSON(track))
    } else {
      this.pendingReidChanges.updated = this.pendingReidChanges.updated ?? []
      this.pendingReidChanges.updated.push(trackToJSON(track))
    }
    this.scheduleBatchBroadcast()
  }

  /**
   * Schedule a batched dual update broadcast
   */
  private scheduleBatchBroadcast(): void {
    if (this.batchTimeout) return // Already scheduled

    this.batchTimeout = setTimeout(() => {
      this.flushBatchedUpdates()
    }, WebSocketBroadcaster.BATCH_DELAY_MS)
  }

  /**
   * Flush batched updates and broadcast
   */
  private flushBatchedUpdates(): void {
    this.batchTimeout = null

    // Only broadcast if there are changes
    const hasSpatialChanges = this.hasChanges(this.pendingSpatialChanges)
    const hasReidChanges = this.hasChanges(this.pendingReidChanges)

    if (!hasSpatialChanges && !hasReidChanges) return

    const update: DualTrackUpdate = {
      type: 'dual_track_update',
      frames: this.getFrameInfo?.(),
    }

    if (hasSpatialChanges) {
      update.spatial = { ...this.pendingSpatialChanges }
    }
    if (hasReidChanges) {
      update.reid = { ...this.pendingReidChanges }
    }

    this.broadcast(update)

    // Clear pending changes
    this.pendingSpatialChanges = {}
    this.pendingReidChanges = {}
  }

  /**
   * Check if changes object has any data
   */
  private hasChanges(changes: TrackChanges): boolean {
    return !!(
      (changes.created && changes.created.length > 0) ||
      (changes.updated && changes.updated.length > 0) ||
      (changes.expired && changes.expired.length > 0)
    )
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

    // Send appropriate snapshot based on mode
    if (this.dualModeEnabled) {
      this.sendDualSnapshot(socket)
    } else {
      this.sendSingleSnapshot(socket)
    }

    // Handle disconnection
    socket.on('close', () => {
      this.clients.delete(socket)
    })

    socket.on('error', () => {
      this.clients.delete(socket)
    })
  }

  /**
   * Send single-mode snapshot (legacy)
   */
  private sendSingleSnapshot(socket: WebSocket): void {
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
   * Send dual-mode snapshot with both track sets
   */
  private sendDualSnapshot(socket: WebSocket): void {
    const snapshot: DualTrackSnapshot = {
      type: 'dual_snapshot',
      spatialTracks: this.spatialTrackManager?.getActiveTracks().map(trackToJSON) ?? [],
      reidTracks: this.reidTrackManager?.getActiveTracks().map(trackToJSON) ?? [],
      frames: this.getFrameInfo?.(),
      zones: this.zoneManager?.getZones(),
      zoneMetrics: this.zoneManager?.getAllZoneMetrics(),
    }
    this.send(socket, snapshot)
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

  /**
   * Check if dual mode is enabled
   */
  isDualModeEnabled(): boolean {
    return this.dualModeEnabled
  }
}

export function registerWebSocket(
  app: FastifyInstance,
  broadcaster: WebSocketBroadcaster
): void {
  app.get('/ws', { websocket: true }, (socket) => {
    console.log(`WebSocket client connected (dual mode: ${broadcaster.isDualModeEnabled()})`)
    broadcaster.addClient(socket)
  })
}
