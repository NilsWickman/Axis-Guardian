/**
 * Fastify Server Setup
 */

import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { TrackManager } from './tracks/track-manager.js'
import { CameraRegistry } from './detection/camera-registry.js'
import { DetectionProcessor } from './detection/detection-processor.js'
import { SynchronizedDetectionProcessor } from './sync/synchronized-detection-processor.js'
import { registerRoutes } from './api/routes.js'
import { WebSocketBroadcaster, registerWebSocket } from './api/websocket.js'
import { registerWsDetectionIngest } from './api/ws-detection-ingest.js'
import { loadEnvironment } from './config/environment.js'
import { loadSiteMapConfig, siteMapCamerasToGeometryConfig } from './config/sitemap-loader.js'
import { AcapClient } from './acap/acap-client.js'
import type { CameraParams } from './types.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface TrackingServiceComponents {
  trackManager: TrackManager
  cameraRegistry: CameraRegistry
  detectionProcessor: DetectionProcessor
  broadcaster: WebSocketBroadcaster
  acapClient: AcapClient | null
}

export interface CreateServerOptions {
  port?: number
  host?: string
  cameras?: Map<string, CameraParams>
}

export async function createServer(options: CreateServerOptions = {}): Promise<FastifyInstance> {
  const env = loadEnvironment()
  const port = options.port ?? env.port
  const host = options.host ?? env.host

  const app = Fastify({
    trustProxy: true,
    logger: {
      level: env.logLevel,
    },
  })

  // Register WebSocket plugin
  await app.register(websocket, {
    options: {
      maxPayload: env.wsMaxPayloadBytes,
      perMessageDeflate: false,
    },
  })

  // Create core components
  const trackManager = new TrackManager()
  const cameraRegistry = new CameraRegistry()

  // Load cameras from sitemap JSON (single source of truth)
  // This also auto-generates K/R/T calibration matrices from sitemap geometry
  const sitemapPath = resolve(__dirname, '../../frontend/public/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

  // Load optimized calibration from file if available (overrides sitemap-generated calibration)
  const calibrationPath = resolve(__dirname, '../calibration.json')
  if (existsSync(calibrationPath)) {
    await cameraRegistry.loadCalibrationFromFile(calibrationPath)
  }

  // Set up sitemap geometry for exit detection (FOV, boundaries, pillars)
  const geometryCameras = siteMapCamerasToGeometryConfig(sitemapConfig.cameras)
  trackManager.setSiteMapGeometry(
    geometryCameras,
    sitemapConfig.obstacles ?? [],
    { width: sitemapConfig.dimensions.width, height: sitemapConfig.dimensions.height }
  )

  // Register additional cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  const baseDetectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  const detectionProcessor = new SynchronizedDetectionProcessor(baseDetectionProcessor)

  // Seed the sync buffer with all known cameras up front so it can form complete batches
  // (otherwise it may flush partial single-camera buckets before the second camera is discovered).
  for (const cameraId of cameraRegistry.getCameraIds()) {
    detectionProcessor.registerCamera(cameraId)
  }

  // Load obstacles for detection filtering
  if (sitemapConfig.obstacles && sitemapConfig.obstacles.length > 0) {
    detectionProcessor.setObstacles(sitemapConfig.obstacles)
  }

  // Set room bounds for position validation
  if (sitemapConfig.dimensions) {
    detectionProcessor.setRoomBounds({
      width: sitemapConfig.dimensions.width,
      height: sitemapConfig.dimensions.height,
    })
  }

  const broadcaster = new WebSocketBroadcaster(trackManager, {
    getFrameInfo: () => baseDetectionProcessor.getCameraFrameInfo(),
    pingIntervalMs: env.wsPingIntervalMs,
  })

  // Set up periodic cleanup (200ms for quick FOV/boundary exit detection)
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 200)

  // Register routes
  registerRoutes(
    app,
    trackManager,
    detectionProcessor,
    cameraRegistry,
    null,
    null,
    null,
    detectionProcessor.getSyncBuffer()
  )
  registerWebSocket(app, broadcaster, {
    allowedOrigins: env.wsAllowedOrigins,
    allowNoOrigin: env.wsAllowNoOrigin,
    maxConnectionsPerIp: env.wsMaxConnectionsPerIp,
  })

  // Register WebSocket detection ingestion endpoint
  registerWsDetectionIngest(app, baseDetectionProcessor, cameraRegistry, {
    maxConnectionsPerIp: env.wsMaxConnectionsPerIp,
    enableMsgpack: true,
  })

  // Cleanup on shutdown
  app.addHook('onClose', () => {
    clearInterval(cleanupInterval)
  })

  // Start listening
  await app.listen({ port, host })

  return app
}

export async function startServer() {
  const env = loadEnvironment()

  try {
    const { app } = await createServerWithComponents({ port: env.port, host: env.host })
    console.log(`Tracking service started on ${env.host}:${env.port}`)
    return app
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

export async function createServerWithComponents(options: CreateServerOptions = {}): Promise<{
  app: FastifyInstance
  trackManager: TrackManager
  acapClient: AcapClient | null
}> {
  const env = loadEnvironment()
  const port = options.port ?? env.port
  const host = options.host ?? env.host

  const app = Fastify({
    trustProxy: true,
    logger: false,  // Disable fastify logging for clean visual display
  })

  // Register CORS plugin (allow frontend to connect)
  await app.register(cors, {
    origin: true, // Allow all origins in development
  })

  // Register WebSocket plugin
  await app.register(websocket, {
    options: {
      maxPayload: env.wsMaxPayloadBytes,
      perMessageDeflate: false,
    },
  })

  // Create camera registry
  const cameraRegistry = new CameraRegistry()

  // Create track manager with re-ID enabled (embedding similarity in cost)
  const trackManager = new TrackManager({
    embeddingWeight: 0.3,  // Re-ID: 30% weight for embedding similarity in cost
  })

  // Load cameras from sitemap JSON (single source of truth)
  const sitemapPath = resolve(__dirname, '../../frontend/public/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

  // Load optimized calibration from file if available (overrides sitemap-generated calibration)
  const calibrationPath = resolve(__dirname, '../calibration.json')
  if (existsSync(calibrationPath)) {
    await cameraRegistry.loadCalibrationFromFile(calibrationPath)
  }

  // Set up sitemap geometry for exit detection (FOV, boundaries, pillars)
  const geometryCameras = siteMapCamerasToGeometryConfig(sitemapConfig.cameras)
  const roomBounds = { width: sitemapConfig.dimensions.width, height: sitemapConfig.dimensions.height }
  const obstacles = sitemapConfig.obstacles ?? []

  trackManager.setSiteMapGeometry(geometryCameras, obstacles, roomBounds)

  // Register additional cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  // Create detection processor
  const baseDetectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  const detectionProcessor = new SynchronizedDetectionProcessor(baseDetectionProcessor)

  // Seed the sync buffer with all known cameras up front so it can form complete batches
  // (otherwise it may flush partial single-camera buckets before the second camera is discovered).
  for (const cameraId of cameraRegistry.getCameraIds()) {
    detectionProcessor.registerCamera(cameraId)
  }

  // Load obstacles for detection filtering
  if (sitemapConfig.obstacles && sitemapConfig.obstacles.length > 0) {
    detectionProcessor.setObstacles(sitemapConfig.obstacles)
  }

  // Set room bounds for position validation
  if (sitemapConfig.dimensions) {
    detectionProcessor.setRoomBounds({
      width: sitemapConfig.dimensions.width,
      height: sitemapConfig.dimensions.height,
    })
  }

  // Create broadcaster
  const broadcaster = new WebSocketBroadcaster(trackManager, {
    getFrameInfo: () => baseDetectionProcessor.getCameraFrameInfo(),
    pingIntervalMs: env.wsPingIntervalMs,
  })

  registerWebSocket(app, broadcaster, {
    allowedOrigins: env.wsAllowedOrigins,
    allowNoOrigin: env.wsAllowNoOrigin,
    maxConnectionsPerIp: env.wsMaxConnectionsPerIp,
  })

  // Register WebSocket detection ingestion endpoint
  registerWsDetectionIngest(app, baseDetectionProcessor, cameraRegistry, {
    maxConnectionsPerIp: env.wsMaxConnectionsPerIp,
    enableMsgpack: true,
  })

  // Set up periodic cleanup (200ms for quick FOV/boundary exit detection)
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 200)

  // Initialize ACAP client if enabled
  let acapClient: AcapClient | null = null
  if (env.acapEnabled) {
    acapClient = new AcapClient(detectionProcessor, cameraRegistry, {
      brokerHost: env.acapBrokerHost,
      brokerPort: env.acapBrokerPort,
      topicPrefix: env.acapTopicPrefix,
      username: env.acapUsername,
      password: env.acapPassword,
    })

    try {
      await acapClient.connect()
      console.log('[ACAP] Client connected and subscribed')
    } catch (error) {
      console.error('[ACAP] Failed to connect:', error)
      // Don't fail server startup if ACAP fails
      acapClient = null
    }
  }

  // Register routes
  registerRoutes(
    app,
    trackManager,
    detectionProcessor,
    cameraRegistry,
    acapClient,
    null,
    broadcaster,
    detectionProcessor.getSyncBuffer()
  )

  // Cleanup on shutdown
  app.addHook('onClose', async () => {
    clearInterval(cleanupInterval)
    if (acapClient) {
      await acapClient.disconnect()
    }
  })

  // Start listening
  await app.listen({ port, host })

  console.log('[Server] Tracking service started with re-ID enabled')

  return { app, trackManager, acapClient }
}
