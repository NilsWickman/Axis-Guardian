/**
 * Fastify Server Setup
 */

import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import type { FastifyInstance } from 'fastify'
import { TrackManager } from './tracks/track-manager.js'
import { CameraRegistry } from './detection/camera-registry.js'
import { DetectionProcessor } from './detection/detection-processor.js'
import { registerRoutes } from './api/routes.js'
import { WebSocketBroadcaster, registerWebSocket } from './api/websocket.js'
import { loadEnvironment } from './config/environment.js'
import type { CameraParams } from './types.js'

// ASCII visualization config (Auditorium scene ~20m x 20m based on calibration)
const GRID_WIDTH = 50
const GRID_HEIGHT = 25
const WORLD_MIN_X = 0
const WORLD_MAX_X = 20  // meters
const WORLD_MIN_Y = 0
const WORLD_MAX_Y = 20  // meters

const TRACK_SYMBOLS = ['●', '◆', '■', '▲', '★', '◉', '⬤', '⬥', '⬦', '◈']

import { detectionsReceived, lastDetectionTime, projectionFailures } from './api/routes.js'

function renderTrackingGrid(trackManager: TrackManager): void {
  const tracks = trackManager.getAllActiveTracks()

  // Create empty grid
  const grid: string[][] = []
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = []
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[y][x] = '·'
    }
  }

  // Draw border
  for (let x = 0; x < GRID_WIDTH; x++) {
    grid[0][x] = '─'
    grid[GRID_HEIGHT - 1][x] = '─'
  }
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y][0] = '│'
    grid[y][GRID_WIDTH - 1] = '│'
  }
  grid[0][0] = '┌'
  grid[0][GRID_WIDTH - 1] = '┐'
  grid[GRID_HEIGHT - 1][0] = '└'
  grid[GRID_HEIGHT - 1][GRID_WIDTH - 1] = '┘'

  // Plot tracks
  const trackInfo: string[] = []
  tracks.forEach((track, index) => {
    const symbol = TRACK_SYMBOLS[index % TRACK_SYMBOLS.length]
    const pos = track.currentPosition

    // Convert world coords to grid coords
    const gridX = Math.round(((pos.x - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X)) * (GRID_WIDTH - 3)) + 1
    const gridY = Math.round(((pos.y - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y)) * (GRID_HEIGHT - 3)) + 1

    if (gridX >= 1 && gridX < GRID_WIDTH - 1 && gridY >= 1 && gridY < GRID_HEIGHT - 1) {
      grid[gridY][gridX] = symbol
    }

    const status = track.isConfirmed ? '✓' : '?'
    trackInfo.push(`${symbol} ${track.globalTrackId.slice(-6)} (${pos.x.toFixed(1)},${pos.y.toFixed(1)}) ${status}`)
  })

  // Clear screen and print
  console.clear()
  console.log('\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[36m║\x1b[0m          \x1b[1mTRACKING SERVICE - LIVE VIEW\x1b[0m                        \x1b[36m║\x1b[0m')
  console.log('\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m')
  console.log()

  // Print grid
  for (let y = 0; y < GRID_HEIGHT; y++) {
    console.log('  ' + grid[y].join(''))
  }

  console.log()
  console.log(`\x1b[33mActive Tracks: ${tracks.length}\x1b[0m  (confirmed: ${trackManager.getActiveTrackCount()}, pending: ${trackManager.getPendingTrackCount()})`)
  console.log()

  if (trackInfo.length > 0) {
    console.log('\x1b[32mTracked Objects:\x1b[0m')
    trackInfo.forEach(info => console.log('  ' + info))
  } else {
    console.log('\x1b[90mNo active tracks - waiting for detections...\x1b[0m')
  }

  console.log()
  const timeSinceDetection = lastDetectionTime ? Math.round((Date.now() - lastDetectionTime) / 1000) : '-'
  console.log(`\x1b[90mGrid: ${WORLD_MAX_X}m x ${WORLD_MAX_Y}m | Detections: ${detectionsReceived} | Last: ${timeSinceDetection}s ago | ${new Date().toLocaleTimeString()}\x1b[0m`)

  if (projectionFailures.length > 0) {
    console.log()
    console.log('\x1b[31mRecent projection failures:\x1b[0m')
    projectionFailures.forEach(f => console.log(`  ${f}`))
  }
}

export interface TrackingServiceComponents {
  trackManager: TrackManager
  cameraRegistry: CameraRegistry
  detectionProcessor: DetectionProcessor
  broadcaster: WebSocketBroadcaster
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

  // Register cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  const broadcaster = new WebSocketBroadcaster(trackManager)

  // Set up periodic cleanup
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 5000)

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
    const { app, trackManager } = await createServerWithComponents({ port: env.port, host: env.host })

    // Start visual display after a brief delay
    setTimeout(() => {
      // Render tracking grid every second
      setInterval(() => {
        renderTrackingGrid(trackManager)
      }, 1000)
    }, 500)

    return app
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

export async function createServerWithComponents(options: CreateServerOptions = {}): Promise<{ app: FastifyInstance; trackManager: TrackManager }> {
  const env = loadEnvironment()
  const port = options.port ?? env.port
  const host = options.host ?? env.host

  const app = Fastify({
    logger: false,  // Disable fastify logging for clean visual display
  })

  // Register WebSocket plugin
  await app.register(websocket)

  // Create core components
  const trackManager = new TrackManager()
  const cameraRegistry = new CameraRegistry()

  // Register cameras if provided
  if (options.cameras) {
    for (const [cameraId, params] of options.cameras) {
      cameraRegistry.registerCamera(cameraId, params)
    }
  }

  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  const broadcaster = new WebSocketBroadcaster(trackManager)

  // Set up periodic cleanup
  const cleanupInterval = setInterval(() => {
    trackManager.cleanupExpiredTracks()
  }, 5000)

  // Register routes
  registerRoutes(app, trackManager, detectionProcessor, cameraRegistry)
  registerWebSocket(app, broadcaster)

  // Cleanup on shutdown
  app.addHook('onClose', () => {
    clearInterval(cleanupInterval)
  })

  // Start listening
  await app.listen({ port, host })

  return { app, trackManager }
}
