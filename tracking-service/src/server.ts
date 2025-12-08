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
import { registerRoutes } from './api/routes.js'
import { WebSocketBroadcaster, registerWebSocket } from './api/websocket.js'
import { loadEnvironment } from './config/environment.js'
import { loadSiteMapConfig } from './config/sitemap-loader.js'
import { AcapClient } from './acap/acap-client.js'
import type { CameraParams } from './types.js'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

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
    logger: {
      level: env.logLevel,
    },
  })

  // Register WebSocket plugin
  await app.register(websocket)

  // Create core components
  const trackManager = new TrackManager()
  const cameraRegistry = new CameraRegistry()

  // Load cameras from sitemap JSON (single source of truth)
  const sitemapPath = resolve(__dirname, '../../frontend/public/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

  // Register additional cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

  // Load obstacles for detection filtering
  if (sitemapConfig.obstacles && sitemapConfig.obstacles.length > 0) {
    detectionProcessor.setObstacles(sitemapConfig.obstacles)
  }

  const broadcaster = new WebSocketBroadcaster(trackManager, {
    getFrameInfo: () => detectionProcessor.getCameraFrameInfo(),
  })

  // Set up periodic cleanup (1s for responsive track removal)
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 1000)

  // Register routes
  registerRoutes(app, trackManager, detectionProcessor, cameraRegistry)
  registerWebSocket(app, broadcaster)

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

export async function createServerWithComponents(options: CreateServerOptions = {}): Promise<{ app: FastifyInstance; trackManager: TrackManager; acapClient: AcapClient | null }> {
  const env = loadEnvironment()
  const port = options.port ?? env.port
  const host = options.host ?? env.host

  const app = Fastify({
    logger: false,  // Disable fastify logging for clean visual display
  })

  // Register CORS plugin (allow frontend to connect)
  await app.register(cors, {
    origin: true, // Allow all origins in development
  })

  // Register WebSocket plugin
  await app.register(websocket)

  // Create core components
  const trackManager = new TrackManager()
  const cameraRegistry = new CameraRegistry()

  // Load cameras from sitemap JSON (single source of truth)
  const sitemapPath = resolve(__dirname, '../../frontend/public/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras)

  // Register additional cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)

  // Load obstacles for detection filtering
  if (sitemapConfig.obstacles && sitemapConfig.obstacles.length > 0) {
    detectionProcessor.setObstacles(sitemapConfig.obstacles)
  }

  const broadcaster = new WebSocketBroadcaster(trackManager, {
    getFrameInfo: () => detectionProcessor.getCameraFrameInfo(),
  })

  // Set up periodic cleanup (1s for responsive track removal)
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 1000)

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

  // Register routes (pass acapClient for runtime control)
  registerRoutes(app, trackManager, detectionProcessor, cameraRegistry, acapClient)
  registerWebSocket(app, broadcaster)

  // Cleanup on shutdown
  app.addHook('onClose', async () => {
    clearInterval(cleanupInterval)
    if (acapClient) {
      await acapClient.disconnect()
    }
  })

  // Start listening
  await app.listen({ port, host })

  return { app, trackManager, acapClient }
}
