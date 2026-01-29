/**
 * Camera Emulator Server
 * Fastify server with WebSocket support for mediasoup signaling
 */

import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import type { CameraConfig, SyncCoordinator } from './types.js'
import { createWorker, createRouter } from './mediasoup/worker.js'
import { createPlainTransport, createDirectTransport, createDataProducerOnDirect } from './mediasoup/transports.js'
import { FFmpegStreamer } from './video/ffmpeg-streamer.js'
import { loadDetections } from './detections/loader.js'
import { DetectionSync } from './detections/sync.js'
import { TrackingClient } from './detections/tracking-client.js'
import { registerWebSocketSignaling } from './signaling/websocket-handler.js'
import { WS_MAX_PAYLOAD_BYTES } from './config.js'

export interface CameraEmulatorServer {
  start(): Promise<void>
  stop(): Promise<void>
  /** Get the FFmpeg streamer for sync coordination */
  getFFmpegStreamer(): FFmpegStreamer
}

export async function createCameraEmulator(
  config: CameraConfig,
  syncCoordinator?: SyncCoordinator
): Promise<CameraEmulatorServer> {
  const app = Fastify({ logger: false, trustProxy: true })

  // Register plugins
  await app.register(cors, { origin: true })
  await app.register(websocket, {
    options: {
      maxPayload: WS_MAX_PAYLOAD_BYTES,
      perMessageDeflate: false,
    },
  })

  // Load detection data
  const detectionData = await loadDetections(config.detectionsPath)
  const detectionSync = new DetectionSync(config.cameraId, detectionData)

  // Create tracking client with video FPS for accurate timing sync
  // WebSocket transport with MessagePack encoding for lower latency than HTTP
  // Batching reduces network overhead for high frame rates
  const trackingClient = new TrackingClient(
    config.trackingServiceUrl,
    config.trackingCameraId,
    {
      fps: detectionData.video_info.fps || 30,
      useWebSocket: true,
      useMsgpack: true,
      enableBatching: true,
      batchIntervalMs: 50,  // Flush every 50ms for ~20 batches/sec
      maxBatchSize: 30,     // Or flush after 30 detections
    }
  )

  // Create mediasoup infrastructure
  const worker = await createWorker()
  const router = await createRouter(worker)

  // Create PlainTransport for FFmpeg RTP input
  // The transport returns the actual port to send RTP to and the unique SSRC
  const { rtpPort: actualRtpPort, ssrc, createProducer } = await createPlainTransport(router, 0)

  // Create DirectTransport for server→client data channel
  const directTransport = await createDirectTransport(router)
  const dataProducer = await createDataProducerOnDirect(directTransport)

  // Create FFmpeg streamer - use the actual port mediasoup is listening on and matching SSRC
  const ffmpegStreamer = new FFmpegStreamer(
    config.videoPath,
    actualRtpPort,
    {
      fps: detectionData.video_info.fps,
      total_frames: detectionData.video_info.total_frames,
      duration: detectionData.video_info.duration,
      sharedStartTime: syncCoordinator?.sharedStartTime,
      onSyncReset: syncCoordinator?.onSyncReset,
      ssrc,  // Pass unique SSRC to match mediasoup producer
    }
  )

  // Start FFmpeg first so it sends packets
  ffmpegStreamer.start()

  // Wait a moment for FFmpeg to start sending RTP packets (comedia needs incoming packets)
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Now create the producer (after FFmpeg is sending)
  const videoProducer = await createProducer()

  // Handle FFmpeg frame events - send detections via DirectTransport DataProducer
  let lastFrameSent = -1
  ffmpegStreamer.on('frame', (frameNumber: number, videoTimeMs: number) => {
    // Only send if frame changed
    if (frameNumber === lastFrameSent) return
    lastFrameSent = frameNumber

    // High-resolution dispatch timestamp for timing measurement
    const dispatchTime = Date.now()

    // Send to all DataConsumers via single DataProducer
    // Include video_time_ms for frontend sync with video element
    const detectionBuffer = detectionSync.getDetectionForFrame(frameNumber, dispatchTime, videoTimeMs)
    try {
      dataProducer.send(detectionBuffer)
    } catch (error) {
      console.error('Error sending detection data:', error)
    }

    // Also send to tracking service with same dispatch time
    const rawFrame = detectionSync.getRawDetectionForFrame(frameNumber)
    if (rawFrame) {
      trackingClient.postDetections({ ...rawFrame, dispatch_time: dispatchTime })
    }
  })

  // Register WebSocket signaling
  registerWebSocketSignaling(
    app,
    router,
    videoProducer,
    dataProducer,
    detectionSync
  )

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'online',
    camera_id: config.cameraId,
    ffmpeg_running: ffmpegStreamer.isRunning(),
    current_frame: ffmpegStreamer.getCurrentFrame(),
    loop_count: ffmpegStreamer.getLoopCount(),
  }))

  // VAPIX camera info endpoint (for compatibility)
  app.get('/vapix/camera', async () => ({
    camera_id: config.cameraId,
    model: 'AXIS P3245-LVE',
    serial: `SERIAL-${config.cameraId}`,
    firmware: '11.11.73',
    resolution: {
      width: detectionData.video_info.width,
      height: detectionData.video_info.height,
    },
    fps: detectionData.video_info.fps,
    capabilities: {
      ptz: false,
      audio: false,
      analytics: true,
    },
  }))

  return {
    async start() {
      // FFmpeg streamer already started during initialization (before producer creation)
      // Just start the Fastify server
      await app.listen({ port: config.port, host: '0.0.0.0' })

      console.log(`Camera emulator '${config.cameraId}' started on port ${config.port}`)
      console.log(`  Video: ${config.videoPath}`)
      console.log(`  Detections: ${detectionData.frames.length} frames`)
      console.log(`  Signaling: ws://localhost:${config.port}/ws/webrtc`)
      console.log(`  Health: http://localhost:${config.port}/health`)
    },

    async stop() {
      ffmpegStreamer.stop()
      trackingClient.destroy()  // Flush remaining batches and close WebSocket
      await app.close()
    },

    getFFmpegStreamer() {
      return ffmpegStreamer
    },
  }
}
