/**
 * WebSocket Detection Ingestion
 *
 * Provides a WebSocket endpoint for receiving camera detections.
 * Lower overhead than HTTP POST for high-frequency detection streams.
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { DetectionProcessor } from '../detection/detection-processor.js'
import type { CameraRegistry } from '../detection/camera-registry.js'
import type { DetectionMessage, DetectionAttributes } from '../types.js'
import { getMetrics } from '../metrics/tracking-metrics.js'
import msgpack from 'msgpack-lite'

export interface WsIngestionOptions {
  /** Max connections per IP */
  maxConnectionsPerIp: number
  /** Enable MessagePack binary protocol (in addition to JSON) */
  enableMsgpack?: boolean
  /** Heartbeat interval in ms */
  heartbeatIntervalMs?: number
}

interface IngestMessage {
  type: 'detection' | 'batch' | 'ping'
  camera_id?: string
  frame_number?: number
  timestamp?: number
  video_time_ms?: number
  rtp_timestamp?: number
  dispatch_time?: number
  detections?: Array<{
    class_name: string
    confidence: number
    bbox: [number, number, number, number] | { left: number; top: number; right: number; bottom: number }
    track_id?: number
    attributes?: unknown
  }>
  // For batch messages
  messages?: IngestMessage[]
}

interface IngestResponse {
  type: 'ack' | 'error' | 'pong'
  processed?: number
  tracksUpdated?: number
  error?: string
  timestamp?: number
}

/**
 * Register WebSocket detection ingestion endpoint
 */
export function registerWsDetectionIngest(
  app: FastifyInstance,
  detectionProcessor: DetectionProcessor,
  cameraRegistry: CameraRegistry,
  options: WsIngestionOptions
): void {
  const connectionsPerIp = new Map<string, number>()
  const enableMsgpack = options.enableMsgpack ?? true
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30000

  app.get('/ws/ingest', { websocket: true }, (socket: WebSocket, req) => {
    const ip = req.ip
    const current = connectionsPerIp.get(ip) ?? 0

    if (current >= options.maxConnectionsPerIp) {
      socket.close(1013, 'Too many connections')
      return
    }

    connectionsPerIp.set(ip, current + 1)
    console.log(`[WsIngest] Client connected from ${ip}`)

    // Track message stats
    let messagesReceived = 0
    let detectionsProcessed = 0

    // Heartbeat to keep connection alive
    const heartbeatTimer = setInterval(() => {
      if (socket.readyState === 1) {
        try {
          socket.ping()
        } catch {
          // Ignore ping errors
        }
      }
    }, heartbeatIntervalMs)

    // Handle incoming messages
    socket.on('message', async (data: Buffer | string) => {
      try {
        let message: IngestMessage

        // Detect format: MessagePack (binary) or JSON (string/utf8)
        if (Buffer.isBuffer(data) && enableMsgpack) {
          // Check if it looks like msgpack (starts with map/array marker)
          const firstByte = data[0]
          if (firstByte >= 0x80 || firstByte <= 0x8f || (firstByte >= 0xde && firstByte <= 0xdf)) {
            message = msgpack.decode(data) as IngestMessage
          } else {
            // Fallback to JSON string
            message = JSON.parse(data.toString('utf-8'))
          }
        } else {
          message = JSON.parse(typeof data === 'string' ? data : data.toString('utf-8'))
        }

        messagesReceived++

        // Handle different message types
        if (message.type === 'ping') {
          sendResponse(socket, { type: 'pong', timestamp: Date.now() }, enableMsgpack)
          return
        }

        if (message.type === 'batch' && message.messages) {
          // Process batch of detection messages
          const results = await processBatch(
            message.messages,
            detectionProcessor,
            cameraRegistry
          )
          detectionsProcessed += results.totalDetections
          sendResponse(socket, {
            type: 'ack',
            processed: results.totalDetections,
            tracksUpdated: results.tracksUpdated,
          }, enableMsgpack)
          return
        }

        if (message.type === 'detection' && message.camera_id && message.detections) {
          // Process single detection message
          const result = await processDetection(
            message,
            detectionProcessor,
            cameraRegistry
          )
          detectionsProcessed += result.detectionCount
          sendResponse(socket, {
            type: 'ack',
            processed: result.detectionCount,
            tracksUpdated: result.tracksUpdated,
          }, enableMsgpack)
          return
        }

        sendResponse(socket, {
          type: 'error',
          error: 'Invalid message format',
        }, enableMsgpack)

      } catch (error) {
        console.error('[WsIngest] Message processing error:', error)
        sendResponse(socket, {
          type: 'error',
          error: error instanceof Error ? error.message : 'Processing failed',
        }, enableMsgpack)
      }
    })

    // Cleanup on close
    socket.on('close', () => {
      clearInterval(heartbeatTimer)
      const next = (connectionsPerIp.get(ip) ?? 1) - 1
      if (next <= 0) connectionsPerIp.delete(ip)
      else connectionsPerIp.set(ip, next)
      console.log(`[WsIngest] Client disconnected from ${ip} (${messagesReceived} messages, ${detectionsProcessed} detections)`)
    })

    socket.on('error', (error) => {
      clearInterval(heartbeatTimer)
      const next = (connectionsPerIp.get(ip) ?? 1) - 1
      if (next <= 0) connectionsPerIp.delete(ip)
      else connectionsPerIp.set(ip, next)
      console.error('[WsIngest] Socket error:', error)
    })
  })
}

/**
 * Send response in JSON or MessagePack format
 */
function sendResponse(socket: WebSocket, response: IngestResponse, useMsgpack: boolean): void {
  if (socket.readyState !== 1) return

  try {
    if (useMsgpack) {
      socket.send(msgpack.encode(response))
    } else {
      socket.send(JSON.stringify(response))
    }
  } catch (error) {
    console.error('[WsIngest] Send error:', error)
  }
}

/**
 * Process a single detection message
 */
async function processDetection(
  message: IngestMessage,
  detectionProcessor: DetectionProcessor,
  cameraRegistry: CameraRegistry
): Promise<{ detectionCount: number; tracksUpdated: number }> {
  const normalizedCameraId = cameraRegistry.normalizeCameraId(message.camera_id!)

  // Record latency if dispatch_time is present
  if (message.dispatch_time) {
    const latencyMs = Date.now() - message.dispatch_time
    getMetrics().recordLatency(latencyMs)
  }

  // Convert to DetectionMessage format
  const rawTimestampSec = message.timestamp ?? Date.now() / 1000
  const timestampSec = rawTimestampSec > 1e9 ? rawTimestampSec : Date.now() / 1000

  const detectionMessage: DetectionMessage = {
    camera_id: normalizedCameraId,
    frame_number: message.frame_number ?? 0,
    timestamp: timestampSec,
    detection_count: message.detections?.length ?? 0,
    video_time_ms: message.video_time_ms,
    rtp_timestamp: message.rtp_timestamp,
    detections: (message.detections ?? []).map((det, i) => {
      let bbox: [number, number, number, number]
      if (Array.isArray(det.bbox)) {
        bbox = det.bbox
      } else {
        bbox = [
          det.bbox.left,
          det.bbox.top,
          det.bbox.right - det.bbox.left,
          det.bbox.bottom - det.bbox.top,
        ]
      }
      return {
        class_name: det.class_name,
        confidence: det.confidence,
        bbox,
        track_id: det.track_id ?? i,
        attributes: det.attributes as DetectionAttributes | undefined,
      }
    }),
  }

  // Process through detection pipeline
  const tracks = detectionProcessor.processMessage(detectionMessage)

  return {
    detectionCount: detectionMessage.detections.length,
    tracksUpdated: tracks.length,
  }
}

/**
 * Process a batch of detection messages
 */
async function processBatch(
  messages: IngestMessage[],
  detectionProcessor: DetectionProcessor,
  cameraRegistry: CameraRegistry
): Promise<{ totalDetections: number; tracksUpdated: number }> {
  let totalDetections = 0

  // Convert all messages to DetectionMessage format
  const detectionMessages: DetectionMessage[] = messages.map(message => {
    const normalizedCameraId = cameraRegistry.normalizeCameraId(message.camera_id!)

    // Record latency
    if (message.dispatch_time) {
      const latencyMs = Date.now() - message.dispatch_time
      getMetrics().recordLatency(latencyMs)
    }

    const rawTimestampSec = message.timestamp ?? Date.now() / 1000
    const timestampSec = rawTimestampSec > 1e9 ? rawTimestampSec : Date.now() / 1000

    const detections = (message.detections ?? []).map((det, i) => {
      let bbox: [number, number, number, number]
      if (Array.isArray(det.bbox)) {
        bbox = det.bbox
      } else {
        bbox = [
          det.bbox.left,
          det.bbox.top,
          det.bbox.right - det.bbox.left,
          det.bbox.bottom - det.bbox.top,
        ]
      }
      return {
        class_name: det.class_name,
        confidence: det.confidence,
        bbox,
        track_id: det.track_id ?? i,
        attributes: det.attributes as DetectionAttributes | undefined,
      }
    })

    totalDetections += detections.length

    return {
      camera_id: normalizedCameraId,
      frame_number: message.frame_number ?? 0,
      timestamp: timestampSec,
      detection_count: detections.length,
      video_time_ms: message.video_time_ms,
      rtp_timestamp: message.rtp_timestamp,
      detections,
    }
  })

  // Use multi-camera batch processing for optimal synchronization
  const tracks = detectionProcessor.processMultiCameraMessages(detectionMessages)

  return {
    totalDetections,
    tracksUpdated: tracks.length,
  }
}
