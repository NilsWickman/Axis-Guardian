/**
 * REST API Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { appendFileSync } from 'fs'
import type { TrackingConfig } from '../types.js'
import { TrackManager, trackToJSON } from '../tracks/track-manager.js'
import { DetectionProcessor } from '../detection/detection-processor.js'
import { CameraRegistry } from '../detection/camera-registry.js'

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

const EmulatorDetectionSchema = z.object({
  camera_id: z.string(),
  timestamp: z.number().optional(),
  frame_number: z.number().optional(),
  dispatch_time: z.number().optional(),  // High-res ms timestamp for timing measurement
  detections: z.array(z.object({
    class_name: z.string().optional().default('person'),
    confidence: z.number().min(0).max(1),
    bbox: z.union([BboxArraySchema, BboxObjectSchema]),
    track_id: z.number().optional(),
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

export function registerRoutes(
  app: FastifyInstance,
  trackManager: TrackManager,
  detectionProcessor: DetectionProcessor,
  cameraRegistry: CameraRegistry
): void {
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
  app.post('/api/detections', async (request: FastifyRequest, reply: FastifyReply) => {
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
    const results: Array<{ detection: number; track: ReturnType<typeof trackToJSON> | null; worldPoint?: { x: number; y: number }; error?: string }> = []

    for (let i = 0; i < data.detections.length; i++) {
      const det = data.detections[i]
      // Convert bbox to x/y/width/height format
      // Handle both array [x, y, w, h] and object {left, top, right, bottom}
      let bbox: { x: number; y: number; width: number; height: number }
      if (Array.isArray(det.bbox)) {
        // Array format [x, y, width, height]
        bbox = {
          x: det.bbox[0],
          y: det.bbox[1],
          width: det.bbox[2],
          height: det.bbox[3],
        }
      } else {
        // Object format {left, top, right, bottom}
        bbox = {
          x: det.bbox.left,
          y: det.bbox.top,
          width: det.bbox.right - det.bbox.left,
          height: det.bbox.bottom - det.bbox.top,
        }
      }

      const track = detectionProcessor.processInjection(
        data.camera_id,
        bbox,
        det.confidence,
        det.track_id ?? i
      )

      results.push({
        detection: i,
        track: track ? trackToJSON(track) : null,
        worldPoint: track ? { x: track.currentPosition.x, y: track.currentPosition.y } : undefined,
        error: track ? undefined : 'Projection failed or invalid',
      })
    }

    return {
      processed: results.length,
      cameraId: data.camera_id,
      results,
    }
  })

  // Inject world position directly (bypasses projection)
  app.post('/api/world-position', async (request: FastifyRequest, reply: FastifyReply) => {
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

  // Get tracking config
  app.get('/api/config', async () => {
    return trackManager.getConfig()
  })

  // Update tracking config
  app.patch('/api/config', async (request: FastifyRequest, reply: FastifyReply) => {
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
  app.post('/api/config/reset', async () => {
    trackManager.resetConfig()
    return {
      message: 'Config reset to defaults',
      config: trackManager.getConfig(),
    }
  })

  // Clear all tracks
  app.post('/api/reset', async () => {
    trackManager.clearAllTracks()
    detectionProcessor.resetFrameTracking()
    return {
      success: true,
      message: 'All tracks cleared',
    }
  })

  // Trigger cleanup manually
  app.post('/api/cleanup', async () => {
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
}
