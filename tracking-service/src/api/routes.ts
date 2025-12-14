/**
 * REST API Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { appendFileSync } from 'fs'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import type { IDetectionProcessor } from '../detection/detection-processor.js'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  getSiteMapConfigJson,
  isDatabaseSeeded,
  getZones,
  getZoneById,
  createZone as createZoneDb,
  updateZone as updateZoneDb,
  deleteZone as deleteZoneDb,
} from '../db/repositories.js'
import { getPipelineLogger } from '../debug/pipeline-logger.js'
import type { AcapClient } from '../acap/acap-client.js'
import type { ZoneManager } from '../zones/zone-manager.js'
import type { WebSocketBroadcaster } from './websocket.js'
import { getMetrics } from '../metrics/index.js'
import type { MultiCameraSyncBuffer } from '../sync/multi-camera-sync-buffer.js'

// Read-only mode for demo deployment (disables write endpoints except emulator-detections)
const isReadOnlyMode = process.env.READ_ONLY_MODE === 'true'

// Middleware to block write operations in read-only mode
function readOnlyGuard(
  _request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  if (isReadOnlyMode) {
    reply.status(403).send({
      error: 'Read-only mode',
      message: 'This endpoint is disabled in demo mode',
    })
    return
  }
  done()
}

// Stats tracking (exported for display)
export let detectionsReceived = 0
export let lastDetectionTime = 0
export const projectionFailures: string[] = []

export function logProjectionFailure(msg: string): void {
  projectionFailures.push(msg)
  if (projectionFailures.length > 5) {
    projectionFailures.shift()
  }
}

// Request schemas
const InjectDetectionSchema = z.object({
  camera_id: z.string(),
  timestamp: z.number().optional(),
  frame_number: z.number().optional(),
  detections: z.array(z.object({
    class_name: z.string().optional().default('person'),
    confidence: z.number().min(0).max(1),
    bbox: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    }),
    track_id: z.number().optional(),
  })),
})

const InjectWorldPositionSchema = z.object({
  camera_id: z.string(),
  world_x: z.number(),
  world_y: z.number(),
  confidence: z.number().min(0).max(1).optional().default(0.9),
  track_id: z.number().optional().default(0),
})

const UpdateConfigSchema = z.object({
  correlationDistanceM: z.number().positive().optional(),
  mergeWindowMs: z.number().positive().optional(),
  trackExpiryMs: z.number().positive().optional(),
  maxTrailLength: z.number().int().positive().optional(),
  minDetectionsToConfirm: z.number().int().positive().optional(),
  maxVelocityMs: z.number().positive().optional(),
})

// Camera emulator format - accepts both array [x, y, w, h] and object {left, top, right, bottom}
const BboxArraySchema = z.tuple([
  z.number().min(0).max(1),  // x
  z.number().min(0).max(1),  // y
  z.number().min(0).max(1),  // width
  z.number().min(0).max(1),  // height
])

const BboxObjectSchema = z.object({
  left: z.number().min(0).max(1),
  top: z.number().min(0).max(1),
  right: z.number().min(0).max(1),
  bottom: z.number().min(0).max(1),
})

// Detection attributes schema (from YOLOv8 + Re-ID preprocessing)
const ColorScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
})

const ClothingTypeScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
})

const ClothingAttributesSchema = z.object({
  colors: z.array(ColorScoreSchema),
  type: ClothingTypeScoreSchema.optional(),
})

const DetectionAttributesSchema = z.object({
  upper_clothing: ClothingAttributesSchema.optional(),
  lower_clothing: ClothingAttributesSchema.optional(),
  embedding: z.array(z.number()).optional(),
  embedding_quality: z.number().min(0).max(1).optional(),
}).optional()

const EmulatorDetectionSchema = z.object({
  camera_id: z.string(),
  timestamp: z.number().optional(),
  frame_number: z.number().optional(),
  dispatch_time: z.number().optional(),  // High-res ms timestamp for timing measurement
  video_time_ms: z.number().optional(),  // Video position in ms (for frontend sync)
  rtp_timestamp: z.number().optional(),  // RTP timestamp (90kHz clock) for frame-perfect sync
  detections: z.array(z.object({
    class_name: z.string().optional().default('person'),
    confidence: z.number().min(0).max(1),
    bbox: z.union([BboxArraySchema, BboxObjectSchema]),
    track_id: z.number().optional(),
    attributes: DetectionAttributesSchema,
  })),
})

// Timing stats for HTTP path latency measurement
interface TimingStats {
  samples: number[]
  maxSamples: number
}
const httpTimingStats: TimingStats = { samples: [], maxSamples: 100 }
const TIMING_LOG_FILE = '/tmp/tracking-timing.log'

function recordHttpLatency(dispatchTime: number): void {
  const latency = Date.now() - dispatchTime
  httpTimingStats.samples.push(latency)
  if (httpTimingStats.samples.length > httpTimingStats.maxSamples) {
    httpTimingStats.samples.shift()
  }
  // Log every 50 samples to file (stderr gets cleared by console.clear)
  if (httpTimingStats.samples.length % 50 === 0) {
    const avg = httpTimingStats.samples.reduce((a, b) => a + b, 0) / httpTimingStats.samples.length
    const min = Math.min(...httpTimingStats.samples)
    const max = Math.max(...httpTimingStats.samples)
    const msg = `[${new Date().toISOString()}] HTTP path latency - avg: ${avg.toFixed(1)}ms, min: ${min}ms, max: ${max}ms (n=${httpTimingStats.samples.length})\n`
    appendFileSync(TIMING_LOG_FILE, msg)
  }
}

export interface RouteOptions {
  acapClient?: AcapClient | null
  zoneManager?: ZoneManager | null
  broadcaster?: WebSocketBroadcaster | null
  syncBuffer?: MultiCameraSyncBuffer | null
}

export function registerRoutes(
  app: FastifyInstance,
  trackManager: TrackManager,
  detectionProcessor: IDetectionProcessor,
  cameraRegistry: CameraRegistry,
  acapClient: AcapClient | null = null,
  zoneManager: ZoneManager | null = null,
  broadcaster: WebSocketBroadcaster | null = null,
  syncBuffer: MultiCameraSyncBuffer | null = null
): void {
  // Log read-only mode status
  if (isReadOnlyMode) {
    console.log('[API] Running in READ-ONLY mode - write endpoints disabled (except emulator-detections)')
  }

  // Health check
  app.get('/api/health', async () => {
    return {
      status: 'healthy',
      activeTracks: trackManager.getActiveTrackCount(),
      pendingTracks: trackManager.getPendingTrackCount(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    }
  })

  // List active tracks
  app.get('/api/tracks', async () => {
    const tracks = trackManager.getActiveTracks()
    return {
      count: tracks.length,
      tracks: tracks.map(trackToJSON),
    }
  })

  // List all tracks (including unconfirmed)
  app.get('/api/tracks/all', async () => {
    const tracks = trackManager.getAllActiveTracks()
    return {
      count: tracks.length,
      confirmedCount: trackManager.getActiveTrackCount(),
      pendingCount: trackManager.getPendingTrackCount(),
      tracks: tracks.map(trackToJSON),
    }
  })

  // Get specific track
  app.get('/api/tracks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const track = trackManager.getTrackById(request.params.id)
    if (!track) {
      return reply.status(404).send({ error: 'Track not found' })
    }
    return trackToJSON(track)
  })

  // Get track trail
  app.get('/api/tracks/:id/trail', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const track = trackManager.getTrackById(request.params.id)
    if (!track) {
      return reply.status(404).send({ error: 'Track not found' })
    }
    return {
      globalTrackId: track.globalTrackId,
      trail: track.trail,
    }
  })

  // Inject test detection (projects to world coords)
  // Protected by read-only guard
  app.post('/api/detections', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = InjectDetectionSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const data = parseResult.data
    const results: Array<{ detection: number; track: ReturnType<typeof trackToJSON> | null; error?: string }> = []

    for (let i = 0; i < data.detections.length; i++) {
      const det = data.detections[i]
      const track = detectionProcessor.processInjection(
        data.camera_id,
        det.bbox,
        det.confidence,
        det.track_id ?? i
      )

      results.push({
        detection: i,
        track: track ? trackToJSON(track) : null,
        error: track ? undefined : 'Projection failed or invalid',
      })
    }

    return {
      processed: results.length,
      results,
    }
  })

  // Inject detection from camera emulator (left/top/right/bottom format)
  // Uses batch processing with Hungarian algorithm for optimal track assignment
  app.post('/api/emulator-detections', async (request: FastifyRequest, reply: FastifyReply) => {
    detectionsReceived++
    lastDetectionTime = Date.now()

    const parseResult = EmulatorDetectionSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const data = parseResult.data

    // Record timing if dispatch_time is present
    if (data.dispatch_time) {
      recordHttpLatency(data.dispatch_time)
    }

    // Convert to DetectionMessage format for batch processing
    // This enables Hungarian algorithm assignment and video timing propagation.
    // Camera emulator detection files often use relative timestamps (0..duration seconds).
    // Normalize to wall-clock seconds so track expiry/cleanup works correctly.
    const rawTimestampSec = data.timestamp ?? Date.now() / 1000
    const timestampSec = rawTimestampSec > 1e9 ? rawTimestampSec : Date.now() / 1000
    const detectionMessage = {
      camera_id: data.camera_id,
      frame_number: data.frame_number ?? 0,
      timestamp: timestampSec,
      detection_count: data.detections.length,
      video_time_ms: data.video_time_ms,
      rtp_timestamp: data.rtp_timestamp,
      detections: data.detections.map((det, i) => {
        // Convert bbox to array format [x, y, w, h]
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
          attributes: det.attributes,  // Pass through re-ID attributes
        }
      }),
    }

    // Use batch processing path (Hungarian algorithm + video timing)
    const tracks = detectionProcessor.processMessage(detectionMessage)

    return {
      processed: detectionMessage.detections.length,
      cameraId: data.camera_id,
      tracksUpdated: tracks.length,
      results: tracks.map(track => ({
        track: trackToJSON(track),
        worldPoint: { x: track.currentPosition.x, y: track.currentPosition.y },
      })),
    }
  })

  // Batch detection endpoint - receives detections from multiple cameras at once
  // Enables true multi-camera synchronization
  const BatchDetectionsSchema = z.object({
    detections: z.array(EmulatorDetectionSchema),
  })

  app.post('/api/emulator-detections/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = BatchDetectionsSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const { detections } = parseResult.data

    // Convert all messages to DetectionMessage format
    const messages = detections.map(data => {
      const rawTimestampSec = data.timestamp ?? Date.now() / 1000
      const timestampSec = rawTimestampSec > 1e9 ? rawTimestampSec : Date.now() / 1000

      return {
        camera_id: data.camera_id,
        frame_number: data.frame_number ?? 0,
        timestamp: timestampSec,
        detection_count: data.detections.length,
        video_time_ms: data.video_time_ms,
        rtp_timestamp: data.rtp_timestamp,
        detections: data.detections.map((det, i) => {
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
            attributes: det.attributes,
          }
        }),
      }
    })

    // Use multi-camera batch processing
    const tracks = detectionProcessor.processMultiCameraMessages(messages)

    detectionsReceived += detections.length
    lastDetectionTime = Date.now()

    return {
      processed: messages.reduce((sum, m) => sum + m.detections.length, 0),
      camerasInBatch: messages.length,
      tracksUpdated: tracks.length,
      results: tracks.map(track => ({
        track: trackToJSON(track),
        worldPoint: { x: track.currentPosition.x, y: track.currentPosition.y },
      })),
    }
  })

  // ============================================================================
  // Clock Synchronization API
  // ============================================================================

  // Get server time for clock offset calculation
  app.get('/api/time', async () => {
    return {
      serverTime: Date.now(),
      timestamp: Date.now(),
    }
  })

  // Record clock offset for a camera
  const ClockOffsetSchema = z.object({
    camera_id: z.string(),
    client_time: z.number(),
    server_time: z.number().optional(),
  })

  app.post('/api/time/offset', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = ClockOffsetSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const { camera_id, client_time, server_time } = parseResult.data
    const serverNow = Date.now()
    const referenceTime = server_time ?? serverNow

    // Calculate clock offset: positive = client ahead, negative = client behind
    const offset = client_time - referenceTime

    // Record in sync buffer if available
    syncBuffer?.recordClockOffset(camera_id, offset)

    // Also record in global metrics
    getMetrics().recordCameraClockOffset(camera_id, offset)

    return {
      camera_id,
      offset_ms: offset,
      server_time: serverNow,
      message: `Camera ${camera_id} clock offset: ${offset}ms`,
    }
  })

  // Get sync buffer status
  app.get('/api/sync/status', async () => {
    if (!syncBuffer) {
      return {
        enabled: false,
        message: 'Sync buffer not initialized',
      }
    }

    const metrics = syncBuffer.getMetrics()
    return {
      enabled: true,
      registeredCameras: syncBuffer.getRegisteredCameras(),
      metrics: {
        batchesProcessed: metrics.batchesProcessed,
        timeoutFlushes: metrics.timeoutFlushes,
        completeBatches: metrics.completeBatches,
        avgCamerasPerBatch: metrics.avgCamerasPerBatch,
        avgDetectionsPerBatch: metrics.avgDetectionsPerBatch,
        maxFrameSkewMs: metrics.maxFrameSkewMs,
        avgSyncWaitMs: metrics.avgSyncWaitMs,
        droppedStaleFrames: metrics.droppedStaleFrames,
        currentBufferSize: metrics.currentBufferSize,
        cameraClockOffsets: Object.fromEntries(metrics.cameraClockOffsets),
      },
    }
  })

  // Inject world position directly (bypasses projection)
  // Protected by read-only guard
  app.post('/api/world-position', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = InjectWorldPositionSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const data = parseResult.data
    const track = detectionProcessor.processWorldPosition(
      data.camera_id,
      data.world_x,
      data.world_y,
      data.confidence,
      data.track_id
    )

    return {
      track: trackToJSON(track),
    }
  })

  // List cameras
  app.get('/api/cameras', async () => {
    return {
      cameras: cameraRegistry.getAllCameras().map(({ cameraId, params }) => ({
        cameraId,
        position: params.position,
        azimuth: params.azimuth,
        elevation: params.elevation,
        fov: params.fov,
      })),
    }
  })

  // Get site map config from database (matches frontend JSON format)
  app.get('/api/sitemap', async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!isDatabaseSeeded()) {
      return reply.status(503).send({
        error: 'Database not seeded',
        message: 'Run `pnpm db:seed` to initialize the database',
      })
    }

    const config = getSiteMapConfigJson()
    if (!config) {
      return reply.status(404).send({
        error: 'Site config not found',
      })
    }

    return config
  })

  // Get tracking config
  app.get('/api/config', async () => {
    return trackManager.getConfig()
  })

  // Update tracking config
  // Protected by read-only guard
  app.patch('/api/config', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateConfigSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    trackManager.updateConfig(parseResult.data)
    return {
      message: 'Config updated',
      config: trackManager.getConfig(),
    }
  })

  // Reset config to defaults
  // Protected by read-only guard
  app.post('/api/config/reset', { preHandler: readOnlyGuard }, async () => {
    trackManager.resetConfig()
    return {
      message: 'Config reset to defaults',
      config: trackManager.getConfig(),
    }
  })

  // Clear all tracks
  // Protected by read-only guard
  app.post('/api/reset', { preHandler: readOnlyGuard }, async () => {
    trackManager.clearAllTracks()
    detectionProcessor.resetFrameTracking()
    return {
      success: true,
      message: 'All tracks cleared',
    }
  })

  // Trigger cleanup manually
  // Protected by read-only guard
  app.post('/api/cleanup', { preHandler: readOnlyGuard }, async () => {
    const beforeCount = trackManager.getAllTracks().length
    trackManager.cleanupExpiredTracks()
    const afterCount = trackManager.getAllTracks().length

    return {
      success: true,
      removed: beforeCount - afterCount,
      remaining: afterCount,
    }
  })

  // Stats endpoint
  app.get('/api/stats', async () => {
    const allTracks = trackManager.getAllTracks()
    const activeTracks = trackManager.getActiveTracks()
    const allActiveTracks = trackManager.getAllActiveTracks()

    return {
      totalTracks: allTracks.length,
      activeConfirmedTracks: activeTracks.length,
      activeUnconfirmedTracks: allActiveTracks.length - activeTracks.length,
      inactiveTracks: allTracks.length - allActiveTracks.length,
      cameras: cameraRegistry.getCameraIds().length,
      config: trackManager.getConfig(),
    }
  })

  // ============================================================================
  // Metrics API
  // ============================================================================

  // Get comprehensive tracking metrics
  app.get('/api/metrics', async () => {
    return getMetrics().getMetrics()
  })

  // Get specific metric categories
  app.get('/api/metrics/handoff', async () => {
    return getMetrics().getHandoffMetrics()
  })

  app.get('/api/metrics/merger', async () => {
    return getMetrics().getMergerMetrics()
  })

  app.get('/api/metrics/clustering', async () => {
    return getMetrics().getClusteringMetrics()
  })

  app.get('/api/metrics/lifecycle', async () => {
    return getMetrics().getLifecycleMetrics()
  })

  app.get('/api/metrics/performance', async () => {
    return getMetrics().getPerformanceMetrics()
  })

  app.get('/api/metrics/diagnostic', async () => {
    return getMetrics().getDiagnosticMetrics()
  })

  app.get('/api/metrics/sync', async () => {
    return getMetrics().getSyncMetrics()
  })

  app.get('/api/metrics/quality', async () => {
    return getMetrics().getQualityMetrics()
  })

  // Reset metrics (protected by read-only guard)
  app.post('/api/metrics/reset', { preHandler: readOnlyGuard }, async () => {
    getMetrics().reset()
    return { success: true, message: 'Metrics reset' }
  })

  // ============================================================================
  // Debug Logging API
  // ============================================================================

  // Start debug session
  // Protected by read-only guard
  app.post('/api/debug/session/start', { preHandler: readOnlyGuard }, async (request: FastifyRequest<{ Body: { name?: string } }>) => {
    const logger = getPipelineLogger()
    const name = (request.body as { name?: string })?.name
    const sessionId = await logger.startSession(name)
    return {
      success: true,
      sessionId,
      message: 'Debug logging started',
    }
  })

  // End debug session
  // Protected by read-only guard
  app.post('/api/debug/session/end', { preHandler: readOnlyGuard }, async (request: FastifyRequest<{ Body: { notes?: string } }>) => {
    const logger = getPipelineLogger()
    const notes = (request.body as { notes?: string })?.notes
    await logger.endSession(notes)
    return {
      success: true,
      message: 'Debug logging stopped',
    }
  })

  // Get debug session status
  app.get('/api/debug/session', async () => {
    const logger = getPipelineLogger()
    const sessionId = logger.getSessionId()
    const isEnabled = logger.isEnabled()

    if (!isEnabled || !sessionId) {
      return {
        active: false,
        sessionId: null,
      }
    }

    const stats = await logger.getSessionStats()
    return {
      active: true,
      sessionId,
      stats,
    }
  })

  // Get session stats
  app.get('/api/debug/session/:id/stats', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const logger = getPipelineLogger()
    const stats = await logger.getSessionStats(request.params.id)
    return {
      sessionId: request.params.id,
      stats,
    }
  })

  // ============================================================================
  // ACAP Client API
  // ============================================================================

  // Get ACAP client status
  app.get('/api/acap/status', async () => {
    if (!acapClient) {
      return {
        enabled: false,
        connected: false,
        message: 'ACAP client not initialized (set ACAP_ENABLED=true)',
      }
    }

    return {
      enabled: true,
      ...acapClient.getStatus(),
    }
  })

  // Enable ACAP client (connect)
  // Protected by read-only guard
  app.post('/api/acap/enable', { preHandler: readOnlyGuard }, async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!acapClient) {
      return reply.status(400).send({
        error: 'ACAP client not initialized',
        message: 'Set ACAP_ENABLED=true and restart the server',
      })
    }

    if (acapClient.isConnected()) {
      return {
        success: true,
        message: 'ACAP client already connected',
        status: acapClient.getStatus(),
      }
    }

    try {
      await acapClient.connect()
      return {
        success: true,
        message: 'ACAP client connected',
        status: acapClient.getStatus(),
      }
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to connect ACAP client',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })

  // Disable ACAP client (disconnect)
  // Protected by read-only guard
  app.post('/api/acap/disable', { preHandler: readOnlyGuard }, async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!acapClient) {
      return reply.status(400).send({
        error: 'ACAP client not initialized',
      })
    }

    if (!acapClient.isConnected()) {
      return {
        success: true,
        message: 'ACAP client already disconnected',
      }
    }

    await acapClient.disconnect()
    return {
      success: true,
      message: 'ACAP client disconnected',
    }
  })

  // Reset ACAP client statistics
  // Protected by read-only guard
  app.post('/api/acap/reset-stats', { preHandler: readOnlyGuard }, async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!acapClient) {
      return reply.status(400).send({
        error: 'ACAP client not initialized',
      })
    }

    acapClient.resetStats()
    return {
      success: true,
      message: 'ACAP statistics reset',
      status: acapClient.getStatus(),
    }
  })

  // ============================================================================
  // Zone Routes
  // ============================================================================

  const ZoneVertexSchema = z.object({
    x: z.number(),
    y: z.number(),
  })

  const CreateZoneSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(['restricted', 'entry', 'exit', 'monitored']),
    vertices: z.array(ZoneVertexSchema).min(3),
    enabled: z.boolean().default(true),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
    color: z.string().default('#ef4444'),
    cooldownMs: z.number().min(0).default(30000),
  })

  const UpdateZoneSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['restricted', 'entry', 'exit', 'monitored']).optional(),
    vertices: z.array(ZoneVertexSchema).min(3).optional(),
    enabled: z.boolean().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    color: z.string().optional(),
    cooldownMs: z.number().min(0).optional(),
  })

  // GET /api/zones - List all zones
  app.get('/api/zones', async () => {
    const zones = getZones()
    return { zones }
  })

  // GET /api/zones/:id - Get a specific zone
  app.get('/api/zones/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const zone = getZoneById(request.params.id)
    if (!zone) {
      return reply.status(404).send({ error: 'Zone not found' })
    }
    return zone
  })

  // POST /api/zones - Create a new zone
  // Protected by read-only guard
  app.post('/api/zones', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateZoneSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const data = parseResult.data
    const zoneId = data.id || `zone-${Date.now()}`

    const zone = createZoneDb({
      id: zoneId,
      siteConfigId: 'default',
      name: data.name,
      type: data.type,
      vertices: data.vertices,
      enabled: data.enabled,
      severity: data.severity,
      color: data.color,
      cooldownMs: data.cooldownMs,
    })

    // Notify ZoneManager
    zoneManager?.setZone(zone)

    // Broadcast update to all clients
    if (broadcaster && zoneManager) {
      broadcaster.broadcast({ type: 'zones_updated', zones: zoneManager.getZones() })
    }

    return { zone }
  })

  // PUT /api/zones/:id - Update a zone
  // Protected by read-only guard
  app.put('/api/zones/:id', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const parseResult = UpdateZoneSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parseResult.error.issues,
      })
    }

    const zone = updateZoneDb(id, parseResult.data)
    if (!zone) {
      return reply.status(404).send({ error: 'Zone not found' })
    }

    // Notify ZoneManager
    zoneManager?.setZone(zone)

    // Broadcast update to all clients
    if (broadcaster && zoneManager) {
      broadcaster.broadcast({ type: 'zones_updated', zones: zoneManager.getZones() })
    }

    return { zone }
  })

  // DELETE /api/zones/:id - Delete a zone
  // Protected by read-only guard
  app.delete('/api/zones/:id', { preHandler: readOnlyGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const success = deleteZoneDb(id)
    if (!success) {
      return reply.status(404).send({ error: 'Zone not found' })
    }

    // Notify ZoneManager
    zoneManager?.removeZone(id)

    // Broadcast update to all clients
    if (broadcaster && zoneManager) {
      broadcaster.broadcast({ type: 'zones_updated', zones: zoneManager.getZones() })
    }

    return { success: true }
  })

  // POST /api/zones/reset - Reset all zone alarm states (for camera restart)
  // Protected by read-only guard
  app.post('/api/zones/reset', { preHandler: readOnlyGuard }, async () => {
    zoneManager?.resetAllStates()
    return { success: true, message: 'Zone alarm states reset' }
  })
}
