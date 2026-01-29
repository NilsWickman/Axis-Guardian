/**
 * Tracking service client
 * POSTs detections to the tracking service with optional batching and WebSocket transport
 */

import type { Detection, DetectionFrame } from '../types.js'
import WebSocket from 'ws'
import msgpack from 'msgpack-lite'

// RTP clock rate for video (H.264 standard)
const RTP_CLOCK_RATE = 90000

export interface TrackingClientOptions {
  /** Video FPS for calculating video timing */
  fps?: number
  /** Enable detection batching (default: false) */
  enableBatching?: boolean
  /** Batch flush interval in ms (default: 100) */
  batchIntervalMs?: number
  /** Max detections per batch before forced flush (default: 50) */
  maxBatchSize?: number
  /** Use WebSocket transport instead of HTTP (default: false) */
  useWebSocket?: boolean
  /** Use MessagePack encoding for WebSocket (default: true) */
  useMsgpack?: boolean
}

interface BatchedFrame {
  camera_id: string
  frame_number: number
  timestamp: number
  video_time_ms: number
  rtp_timestamp: number
  dispatch_time: number
  detections: Detection[]
}

export class TrackingClient {
  private errorCount = 0
  private maxErrorLog = 3
  private fps: number
  private rtpTicksPerFrame: number

  // Batching
  private enableBatching: boolean
  private batchIntervalMs: number
  private maxBatchSize: number
  private pendingFrames: BatchedFrame[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private totalPendingDetections = 0

  // WebSocket transport
  private useWebSocket: boolean
  private useMsgpack: boolean
  private ws: WebSocket | null = null
  private wsConnecting = false
  private wsReconnectTimer: NodeJS.Timeout | null = null

  constructor(
    private trackingServiceUrl: string,
    private trackingCameraId: string,
    options: TrackingClientOptions = {}
  ) {
    this.fps = options.fps ?? 30
    this.rtpTicksPerFrame = Math.round(RTP_CLOCK_RATE / this.fps)
    this.enableBatching = options.enableBatching ?? false
    this.batchIntervalMs = options.batchIntervalMs ?? 100
    this.maxBatchSize = options.maxBatchSize ?? 50
    this.useWebSocket = options.useWebSocket ?? false
    this.useMsgpack = options.useMsgpack ?? true

    if (this.useWebSocket) {
      this.connectWebSocket()
    }

    if (this.enableBatching) {
      this.startBatchTimer()
    }
  }

  /**
   * Connect to WebSocket ingestion endpoint
   */
  private connectWebSocket(): void {
    if (this.ws || this.wsConnecting) return
    this.wsConnecting = true

    // Convert HTTP URL to WebSocket URL
    const wsUrl = this.trackingServiceUrl
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')
      + '/ws/ingest'

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.on('open', () => {
        this.wsConnecting = false
        console.log(`[TrackingClient] WebSocket connected to ${wsUrl}`)
        this.errorCount = 0
      })

      this.ws.on('close', () => {
        this.ws = null
        this.wsConnecting = false
        // Attempt reconnect after delay
        this.wsReconnectTimer = setTimeout(() => {
          this.connectWebSocket()
        }, 2000)
      })

      this.ws.on('error', (error) => {
        this.errorCount++
        if (this.errorCount <= this.maxErrorLog) {
          console.warn(`[TrackingClient] WebSocket error:`, error.message)
        }
      })

      this.ws.on('message', (data) => {
        // Handle ACK messages (optional logging)
        try {
          const response = this.useMsgpack
            ? msgpack.decode(data as Buffer)
            : JSON.parse(data.toString())
          if (response.type === 'error') {
            console.warn(`[TrackingClient] Server error:`, response.error)
          }
        } catch {
          // Ignore parse errors
        }
      })
    } catch (error) {
      this.wsConnecting = false
      this.errorCount++
      if (this.errorCount <= this.maxErrorLog) {
        console.warn(`[TrackingClient] WebSocket connect error:`, error)
      }
    }
  }

  /**
   * Start batch timer for periodic flushes
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBatch()
    }, this.batchIntervalMs)
  }

  /**
   * Flush pending batch to tracking service
   */
  private async flushBatch(): Promise<void> {
    if (this.pendingFrames.length === 0) return

    const frames = this.pendingFrames
    this.pendingFrames = []
    this.totalPendingDetections = 0

    if (this.useWebSocket && this.ws?.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      const message = {
        type: 'batch',
        messages: frames.map(f => ({
          type: 'detection',
          ...f,
        })),
      }
      try {
        if (this.useMsgpack) {
          this.ws.send(msgpack.encode(message))
        } else {
          this.ws.send(JSON.stringify(message))
        }
      } catch (error) {
        this.errorCount++
        if (this.errorCount <= this.maxErrorLog) {
          console.warn(`[TrackingClient] WebSocket send error:`, error)
        }
      }
    } else {
      // Fall back to HTTP batch endpoint
      try {
        const response = await fetch(`${this.trackingServiceUrl}/api/emulator-detections/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detections: frames }),
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        this.errorCount = 0
      } catch (error) {
        this.errorCount++
        if (this.errorCount <= this.maxErrorLog) {
          console.warn(`[TrackingClient] Batch HTTP error:`, error)
        }
      }
    }
  }

  /**
   * POST detections to tracking service
   * Includes video timing info for frontend sync
   */
  async postDetections(frame: DetectionFrame): Promise<void> {
    if (frame.detections.length === 0) {
      return
    }

    // Calculate video timing for sync
    const videoTimeMs = (frame.frame_number / this.fps) * 1000
    const rtpTimestamp = frame.frame_number * this.rtpTicksPerFrame
    const dispatchTime = Date.now()
    const wallTimestampSec = dispatchTime / 1000

    const payload: BatchedFrame = {
      camera_id: this.trackingCameraId,
      frame_number: frame.frame_number,
      timestamp: wallTimestampSec,
      video_time_ms: videoTimeMs,
      rtp_timestamp: rtpTimestamp,
      dispatch_time: dispatchTime,
      detections: frame.detections,
    }

    // If batching enabled, queue for batch send
    if (this.enableBatching) {
      this.pendingFrames.push(payload)
      this.totalPendingDetections += frame.detections.length
      // Force flush if batch is full
      if (this.totalPendingDetections >= this.maxBatchSize) {
        await this.flushBatch()
      }
      return
    }

    // If WebSocket enabled, send directly
    if (this.useWebSocket && this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'detection',
        ...payload,
      }
      try {
        if (this.useMsgpack) {
          this.ws.send(msgpack.encode(message))
        } else {
          this.ws.send(JSON.stringify(message))
        }
        this.errorCount = 0
      } catch (error) {
        this.errorCount++
        if (this.errorCount <= this.maxErrorLog) {
          console.warn(`[TrackingClient] WebSocket send error:`, error)
        }
      }
      return
    }

    // Fall back to HTTP POST
    try {
      const response = await fetch(`${this.trackingServiceUrl}/api/emulator-detections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      this.errorCount = 0
    } catch (error) {
      this.errorCount++
      if (this.errorCount <= this.maxErrorLog) {
        console.warn(`Tracking service error (${this.errorCount}):`, error)
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer)
      this.wsReconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    // Flush any remaining frames
    this.flushBatch()
  }
}
