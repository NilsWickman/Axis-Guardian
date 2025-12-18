#!/usr/bin/env node
/**
 * CLI Tool: Simulate Walk
 *
 * Simulates a person walking from one position to another.
 *
 * Usage:
 *   npx tsx src/cli/simulate-walk.ts --from "0,0" --to "10,10" --speed 1.4
 *   npx tsx src/cli/simulate-walk.ts --from "0,0" --to "10,10" --duration 10
 */

import { Command } from 'commander'

const program = new Command()

program
  .name('simulate-walk')
  .description('Simulate a person walking from one position to another')
  .option('-f, --from <coords>', 'Starting position as "x,y" (meters)', '0,0')
  .option('-t, --to <coords>', 'Ending position as "x,y" (meters)', '10,10')
  .option('-s, --speed <value>', 'Walking speed in m/s (default: 1.4 m/s)', '1.4')
  .option('-d, --duration <seconds>', 'Total duration in seconds (overrides speed)')
  .option('-r, --rate <hz>', 'Detection rate in Hz', '10')
  .option('-c, --camera <id>', 'Camera ID', 'camera1')
  .option('-C, --confidence <value>', 'Detection confidence (0-1)', '0.9')
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('--dry-run', 'Show what would be sent without actually sending')
  .action(async (options) => {
    const baseUrl = options.url
    const [fromX, fromY] = options.from.split(',').map(Number)
    const [toX, toY] = options.to.split(',').map(Number)
    const speed = parseFloat(options.speed)
    const rate = parseFloat(options.rate)
    const confidence = parseFloat(options.confidence)

    // Calculate distance
    const dx = toX - fromX
    const dy = toY - fromY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Calculate duration (either from speed or explicit duration)
    let duration: number
    if (options.duration) {
      duration = parseFloat(options.duration)
    } else {
      duration = distance / speed
    }

    // Calculate number of steps
    const numSteps = Math.ceil(duration * rate)
    const stepInterval = 1000 / rate // ms between steps

    console.log(`Simulating walk:`)
    console.log(`  From: (${fromX}, ${fromY})`)
    console.log(`  To: (${toX}, ${toY})`)
    console.log(`  Distance: ${distance.toFixed(2)} m`)
    console.log(`  Duration: ${duration.toFixed(2)} s`)
    console.log(`  Speed: ${(distance / duration).toFixed(2)} m/s`)
    console.log(`  Steps: ${numSteps}`)
    console.log(`  Rate: ${rate} Hz`)
    console.log(`  Camera: ${options.camera}`)
    console.log('')

    if (options.dryRun) {
      console.log('Dry run - showing first 5 positions:')
      for (let i = 0; i < Math.min(5, numSteps); i++) {
        const t = i / (numSteps - 1)
        const x = fromX + dx * t
        const y = fromY + dy * t
        console.log(`  Step ${i + 1}: (${x.toFixed(2)}, ${y.toFixed(2)})`)
      }
      if (numSteps > 5) {
        console.log(`  ... and ${numSteps - 5} more steps`)
      }
      return
    }

    console.log('Starting simulation...')

    for (let i = 0; i < numSteps; i++) {
      const t = numSteps === 1 ? 0 : i / (numSteps - 1)
      const x = fromX + dx * t
      const y = fromY + dy * t

      try {
        const response = await fetch(`${baseUrl}/api/world-position`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id: options.camera,
            world_x: x,
            world_y: y,
            confidence,
            track_id: 1, // Use consistent track ID for the walk
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error(`Step ${i + 1} failed:`, error)
          continue
        }

        const result = await response.json() as { track: { globalTrackId: string; isConfirmed: boolean } }
        const status = result.track.isConfirmed ? '✓' : '○'
        console.log(`  [${i + 1}/${numSteps}] ${status} Position: (${x.toFixed(2)}, ${y.toFixed(2)}) - Track: ${result.track.globalTrackId}`)

      } catch (error) {
        console.error(`Step ${i + 1} error:`, error)
      }

      // Wait for next step
      if (i < numSteps - 1) {
        await new Promise(resolve => setTimeout(resolve, stepInterval))
      }
    }

    console.log('\nSimulation complete!')

    // Show final track state
    try {
      const response = await fetch(`${baseUrl}/api/tracks`)
      const data = await response.json() as { tracks: Array<{ globalTrackId: string; currentPosition: { x: number; y: number }; trail: unknown[] }> }
      console.log(`\nActive tracks: ${data.tracks.length}`)
      for (const track of data.tracks) {
        console.log(`  ${track.globalTrackId}: (${track.currentPosition.x.toFixed(2)}, ${track.currentPosition.y.toFixed(2)}) - ${track.trail.length} trail points`)
      }
    } catch {
      // Ignore errors fetching final state
    }
  })

program.parse()
