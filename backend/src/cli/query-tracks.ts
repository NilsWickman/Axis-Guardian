#!/usr/bin/env node
/**
 * CLI Tool: Query Tracks
 *
 * Query active tracks from the tracking service.
 *
 * Usage:
 *   npx tsx src/cli/query-tracks.ts
 *   npx tsx src/cli/query-tracks.ts --format table
 *   npx tsx src/cli/query-tracks.ts --all
 *   npx tsx src/cli/query-tracks.ts --id global-1
 */

import { Command } from 'commander'

const program = new Command()

interface Track {
  globalTrackId: string
  currentPosition: { x: number; y: number }
  confidence: number
  isConfirmed: boolean
  detectionCount: number
  cameraAssociations: Record<string, { cameraId: string; trackIds: number[] }>
  trail: Array<{ x: number; y: number; timestamp: number }>
  lastSeen: number
  color: string
}

function formatTable(tracks: Track[]): void {
  if (tracks.length === 0) {
    console.log('No tracks found')
    return
  }

  // Header
  console.log('┌─────────────┬──────────────┬────────────┬───────────┬────────────┐')
  console.log('│ Track ID    │ Position     │ Confidence │ Cameras   │ Trail Len  │')
  console.log('├─────────────┼──────────────┼────────────┼───────────┼────────────┤')

  for (const track of tracks) {
    const pos = `(${track.currentPosition.x.toFixed(1)},${track.currentPosition.y.toFixed(1)})`
    const cameras = Object.keys(track.cameraAssociations).join(',') || 'none'
    const conf = (track.confidence * 100).toFixed(0) + '%'
    const status = track.isConfirmed ? '✓' : '?'

    console.log(
      `│ ${(track.globalTrackId + status).padEnd(11)} │ ${pos.padEnd(12)} │ ${conf.padEnd(10)} │ ${cameras.padEnd(9)} │ ${String(track.trail.length).padEnd(10)} │`
    )
  }

  console.log('└─────────────┴──────────────┴────────────┴───────────┴────────────┘')
}

program
  .name('query-tracks')
  .description('Query tracks from the tracking service')
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('-f, --format <format>', 'Output format: json, table', 'table')
  .option('-a, --all', 'Include unconfirmed tracks')
  .option('-i, --id <id>', 'Get specific track by ID')
  .option('-s, --stats', 'Show statistics only')
  .option('-w, --watch', 'Watch mode - refresh every second')
  .action(async (options) => {
    const baseUrl = options.url

    const fetchTracks = async () => {
      try {
        if (options.stats) {
          const response = await fetch(`${baseUrl}/api/stats`)
          const stats = await response.json()
          console.log(JSON.stringify(stats, null, 2))
          return
        }

        if (options.id) {
          const response = await fetch(`${baseUrl}/api/tracks/${options.id}`)
          if (!response.ok) {
            console.error('Track not found')
            process.exit(1)
          }
          const track = await response.json()
          console.log(JSON.stringify(track, null, 2))
          return
        }

        const endpoint = options.all ? '/api/tracks/all' : '/api/tracks'
        const response = await fetch(`${baseUrl}${endpoint}`)
        const data = await response.json() as { tracks: Track[]; count: number }

        if (options.format === 'json') {
          console.log(JSON.stringify(data, null, 2))
        } else {
          if (options.watch) {
            console.clear()
            console.log(`Tracks (refreshing every second, Ctrl+C to stop)`)
            console.log(`Time: ${new Date().toLocaleTimeString()}`)
            console.log('')
          }
          formatTable(data.tracks)
          console.log(`\nTotal: ${data.count} track(s)`)
        }
      } catch (error) {
        console.error('Failed to connect to tracking service:', error)
        if (!options.watch) {
          process.exit(1)
        }
      }
    }

    if (options.watch) {
      await fetchTracks()
      setInterval(fetchTracks, 1000)
    } else {
      await fetchTracks()
    }
  })

program.parse()
