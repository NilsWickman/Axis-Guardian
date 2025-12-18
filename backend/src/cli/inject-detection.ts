#!/usr/bin/env node
/**
 * CLI Tool: Inject Detection
 *
 * Injects a test detection into the tracking service via REST API.
 *
 * Usage:
 *   npx tsx src/cli/inject-detection.ts --camera camera1 --bbox "0.4,0.3,0.6,0.7" --confidence 0.9
 *   npx tsx src/cli/inject-detection.ts --camera camera1 --world "5.2,3.8" --confidence 0.9
 */

import { Command } from 'commander'

const program = new Command()

program
  .name('inject-detection')
  .description('Inject a test detection into the tracking service')
  .option('-c, --camera <id>', 'Camera ID (e.g., camera1)', 'camera1')
  .option('-b, --bbox <coords>', 'Bounding box as "x,y,width,height" (normalized 0-1)')
  .option('-w, --world <coords>', 'World position as "x,y" (meters)')
  .option('-C, --confidence <value>', 'Detection confidence (0-1)', '0.9')
  .option('-t, --track-id <id>', 'Track ID for correlation', '0')
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('-n, --count <n>', 'Number of detections to inject', '1')
  .action(async (options) => {
    const baseUrl = options.url

    if (!options.bbox && !options.world) {
      console.error('Error: Either --bbox or --world must be specified')
      process.exit(1)
    }

    const count = parseInt(options.count, 10)
    const confidence = parseFloat(options.confidence)
    const trackId = parseInt(options.trackId, 10)

    for (let i = 0; i < count; i++) {
      try {
        let response: Response
        let result: unknown

        if (options.world) {
          // Inject world position directly
          const [worldX, worldY] = options.world.split(',').map(Number)
          response = await fetch(`${baseUrl}/api/world-position`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              camera_id: options.camera,
              world_x: worldX,
              world_y: worldY,
              confidence,
              track_id: trackId,
            }),
          })
        } else {
          // Inject bbox detection (will be projected)
          const [x, y, width, height] = options.bbox.split(',').map(Number)
          response = await fetch(`${baseUrl}/api/detections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              camera_id: options.camera,
              detections: [{
                confidence,
                bbox: { x, y, width, height },
                track_id: trackId,
              }],
            }),
          })
        }

        result = await response.json()

        if (!response.ok) {
          console.error('Error:', result)
          process.exit(1)
        }

        if (i === count - 1 || count === 1) {
          console.log(JSON.stringify(result, null, 2))
        } else {
          // Brief output for multiple injections
          const r = result as { track?: { globalTrackId: string; currentPosition: { x: number; y: number } } }
          if (r.track) {
            console.log(`[${i + 1}/${count}] Track: ${r.track.globalTrackId} at (${r.track.currentPosition.x.toFixed(2)}, ${r.track.currentPosition.y.toFixed(2)})`)
          }
        }

        // Small delay between multiple injections
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('Failed to connect to tracking service:', error)
        process.exit(1)
      }
    }
  })

program.parse()
