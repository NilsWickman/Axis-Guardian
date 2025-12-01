#!/usr/bin/env node
/**
 * CLI Tool: Start Tracking Service with Sitemap
 *
 * Starts the tracking service with cameras pre-configured from a sitemap JSON file.
 *
 * Usage:
 *   npx tsx src/cli/start-with-sitemap.ts --sitemap ../frontend/public/sitemap-rectangular-room.json
 *   npx tsx src/cli/start-with-sitemap.ts --sitemap ../frontend/public/sitemap-rectangular-room.json --port 3010
 */

import { Command } from 'commander'
import { createServer } from '../server.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../config/sitemap-loader.js'
import type { CameraParams } from '../types.js'

const program = new Command()

program
  .name('start-with-sitemap')
  .description('Start tracking service with cameras from sitemap')
  .option('-s, --sitemap <path>', 'Path to sitemap JSON file', '../frontend/public/sitemap-rectangular-room.json')
  .option('-p, --port <port>', 'Server port', '3010')
  .option('-h, --host <host>', 'Server host', '0.0.0.0')
  .action(async (options) => {
    const port = parseInt(options.port, 10)
    const host = options.host

    console.log(`Loading sitemap from: ${options.sitemap}`)

    let cameras: Map<string, CameraParams>
    try {
      const config = loadSiteMapConfig(options.sitemap)
      cameras = new Map()

      console.log(`Site: ${config.dimensions.width}m x ${config.dimensions.height}m`)
      console.log(`Found ${config.cameras.length} cameras:`)

      for (const cam of config.cameras) {
        const params = siteMapCameraToCameraParams(cam)
        cameras.set(cam.id, params)
        console.log(`  - ${cam.id} (${cam.name}): pos=(${params.position.x}, ${params.position.y}, ${params.position.z}), azimuth=${params.azimuth}°, fov=${params.fov}°`)
      }
    } catch (error) {
      console.error(`Failed to load sitemap: ${error}`)
      process.exit(1)
    }

    console.log('')
    console.log('Starting tracking service...')

    const server = await createServer({
      port,
      host,
      cameras,
    })

    console.log(`
Tracking service running at http://${host}:${port}

Endpoints:
  GET  /api/health           - Health check
  GET  /api/tracks           - List active confirmed tracks
  GET  /api/tracks/all       - List all active tracks (including unconfirmed)
  GET  /api/tracks/:id       - Get specific track
  GET  /api/cameras          - List cameras
  POST /api/detections       - Inject detection (x/y/width/height bbox)
  POST /api/emulator-detections - Inject detection (left/top/right/bottom bbox)
  POST /api/world-position   - Inject world position directly
  GET  /api/config           - Get tracking config
  PATCH /api/config          - Update tracking config
  POST /api/reset            - Clear all tracks
  WS   /ws                   - WebSocket for real-time track updates

Test with:
  curl http://localhost:${port}/api/health
  curl -X POST http://localhost:${port}/api/emulator-detections \\
    -H "Content-Type: application/json" \\
    -d '{"camera_id":"camera1","detections":[{"confidence":0.9,"bbox":{"left":0.4,"top":0.3,"right":0.6,"bottom":0.7}}]}'
`)

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...')
      await server.close()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\nShutting down...')
      await server.close()
      process.exit(0)
    })
  })

program.parse()
