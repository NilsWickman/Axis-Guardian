#!/usr/bin/env node
/**
 * CLI Tool: Terminal Sitemap
 *
 * Real-time ASCII visualization of tracks on the sitemap in the terminal.
 * Useful for headless development and debugging without frontend access.
 *
 * Usage:
 *   pnpm cli:sitemap
 *   pnpm cli:sitemap --watch
 *   pnpm cli:sitemap --width 80 --height 30
 */

import { Command } from 'commander'

// ============================================================================
// Types
// ============================================================================

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

interface SiteMapConfig {
  dimensions: { width: number; height: number }
  cameras: Array<{
    id: string
    position: { x: number; y: number; z: number }
    azimuth: number
    elevation: number
    fieldOfView: number
  }>
}

// ============================================================================
// ANSI Color Codes
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
}

// Track colors (rotate through these)
const TRACK_COLORS = [
  COLORS.green,
  COLORS.cyan,
  COLORS.yellow,
  COLORS.magenta,
  COLORS.blue,
  COLORS.red,
]

// ============================================================================
// ASCII Rendering
// ============================================================================

class AsciiSitemap {
  private width: number
  private height: number
  private roomWidth: number
  private roomHeight: number
  private buffer: string[][]
  private colorBuffer: string[][]

  constructor(termWidth: number, termHeight: number, roomWidth: number, roomHeight: number) {
    // Leave space for border and labels
    this.width = Math.min(termWidth - 4, Math.floor(roomWidth * 4))
    this.height = Math.min(termHeight - 10, Math.floor(roomHeight * 2))
    this.roomWidth = roomWidth
    this.roomHeight = roomHeight
    this.buffer = []
    this.colorBuffer = []
    this.clear()
  }

  clear(): void {
    this.buffer = []
    this.colorBuffer = []
    for (let y = 0; y < this.height; y++) {
      this.buffer.push(new Array(this.width).fill(' '))
      this.colorBuffer.push(new Array(this.width).fill(''))
    }
  }

  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } | null {
    // Flip Y axis (world Y=0 at bottom, screen Y=0 at top)
    const screenX = Math.floor((worldX / this.roomWidth) * (this.width - 1))
    const screenY = Math.floor(((this.roomHeight - worldY) / this.roomHeight) * (this.height - 1))

    if (screenX < 0 || screenX >= this.width || screenY < 0 || screenY >= this.height) {
      return null
    }

    return { x: screenX, y: screenY }
  }

  private setChar(x: number, y: number, char: string, color: string = ''): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.buffer[y][x] = char
      this.colorBuffer[y][x] = color
    }
  }

  drawCamera(worldX: number, worldY: number, _id: string, azimuth: number): void {
    const pos = this.worldToScreen(worldX, worldY)
    if (!pos) return

    // Camera marker
    this.setChar(pos.x, pos.y, 'C', COLORS.white + COLORS.bold)

    // Direction indicator based on azimuth
    const dirChars: Record<string, string> = {
      N: '^',
      NE: '/',
      E: '>',
      SE: '\\',
      S: 'v',
      SW: '/',
      W: '<',
      NW: '\\',
    }

    let dir = 'N'
    const normalizedAzimuth = ((azimuth % 360) + 360) % 360
    if (normalizedAzimuth >= 337.5 || normalizedAzimuth < 22.5) dir = 'N'
    else if (normalizedAzimuth < 67.5) dir = 'NE'
    else if (normalizedAzimuth < 112.5) dir = 'E'
    else if (normalizedAzimuth < 157.5) dir = 'SE'
    else if (normalizedAzimuth < 202.5) dir = 'S'
    else if (normalizedAzimuth < 247.5) dir = 'SW'
    else if (normalizedAzimuth < 292.5) dir = 'W'
    else dir = 'NW'

    // Place direction indicator adjacent to camera
    const dirOffsets: Record<string, { dx: number; dy: number }> = {
      N: { dx: 0, dy: -1 },
      NE: { dx: 1, dy: -1 },
      E: { dx: 1, dy: 0 },
      SE: { dx: 1, dy: 1 },
      S: { dx: 0, dy: 1 },
      SW: { dx: -1, dy: 1 },
      W: { dx: -1, dy: 0 },
      NW: { dx: -1, dy: -1 },
    }

    const offset = dirOffsets[dir]
    this.setChar(pos.x + offset.dx, pos.y + offset.dy, dirChars[dir], COLORS.dim + COLORS.white)
  }

  drawTrack(worldX: number, worldY: number, trackId: string, color: string, confirmed: boolean): void {
    const pos = this.worldToScreen(worldX, worldY)
    if (!pos) return

    // Track marker
    const marker = confirmed ? '@' : 'o'
    this.setChar(pos.x, pos.y, marker, color + COLORS.bold)

    // Track ID label (first character or number)
    const label = trackId.replace('global-', '').slice(0, 2)
    if (pos.x + 1 < this.width) {
      this.setChar(pos.x + 1, pos.y, label[0] || '', color)
    }
    if (label.length > 1 && pos.x + 2 < this.width) {
      this.setChar(pos.x + 2, pos.y, label[1], color)
    }
  }

  drawTrail(trail: Array<{ x: number; y: number }>, color: string): void {
    for (let i = 0; i < trail.length - 1; i++) {
      const pos = this.worldToScreen(trail[i].x, trail[i].y)
      if (pos) {
        // Fade older trail points
        const fadeColor = i < trail.length / 2 ? COLORS.dim + color : color
        this.setChar(pos.x, pos.y, '.', fadeColor)
      }
    }
  }

  drawBorder(): void {
    // Border is drawn directly in render(), this method is a placeholder
  }

  render(): string {
    const lines: string[] = []

    // Top border with scale
    const scaleTop = '    ' + '0m'.padEnd(Math.floor(this.width / 2)) + `${this.roomWidth}m`
    lines.push(COLORS.dim + scaleTop + COLORS.reset)
    lines.push(COLORS.dim + '  ┌' + '─'.repeat(this.width) + '┐' + COLORS.reset)

    // Buffer content
    for (let y = 0; y < this.height; y++) {
      let line = COLORS.dim + '  │' + COLORS.reset

      for (let x = 0; x < this.width; x++) {
        const color = this.colorBuffer[y][x]
        const char = this.buffer[y][x]
        if (color) {
          line += color + char + COLORS.reset
        } else {
          line += char
        }
      }

      line += COLORS.dim + '│' + COLORS.reset

      // Y-axis label
      if (y === 0) {
        line += ` ${this.roomHeight}m`
      } else if (y === this.height - 1) {
        line += ' 0m'
      }

      lines.push(line)
    }

    // Bottom border
    lines.push(COLORS.dim + '  └' + '─'.repeat(this.width) + '┘' + COLORS.reset)

    return lines.join('\n')
  }
}

// ============================================================================
// Data Fetching
// ============================================================================

async function fetchTracks(baseUrl: string, all: boolean): Promise<{ tracks: Track[]; count: number } | null> {
  try {
    const endpoint = all ? '/api/tracks/all' : '/api/tracks'
    const response = await fetch(`${baseUrl}${endpoint}`)
    if (!response.ok) return null
    return (await response.json()) as { tracks: Track[]; count: number }
  } catch {
    return null
  }
}

async function fetchSiteMap(baseUrl: string): Promise<SiteMapConfig | null> {
  try {
    const response = await fetch(`${baseUrl}/api/config/sitemap`)
    if (!response.ok) return null
    return (await response.json()) as SiteMapConfig
  } catch {
    return null
  }
}

// ============================================================================
// Main Rendering Loop
// ============================================================================

async function renderFrame(
  baseUrl: string,
  termWidth: number,
  termHeight: number,
  showAll: boolean,
  showTrails: boolean
): Promise<string> {
  const sitemap = await fetchSiteMap(baseUrl)
  const trackData = await fetchTracks(baseUrl, showAll)

  if (!sitemap) {
    return COLORS.red + 'Error: Could not fetch sitemap config from tracking service' + COLORS.reset
  }

  const ascii = new AsciiSitemap(
    termWidth,
    termHeight,
    sitemap.dimensions.width,
    sitemap.dimensions.height
  )

  // Draw cameras
  for (const cam of sitemap.cameras) {
    ascii.drawCamera(cam.position.x, cam.position.y, cam.id, cam.azimuth)
  }

  // Draw tracks
  const tracks = trackData?.tracks || []
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    const color = TRACK_COLORS[i % TRACK_COLORS.length]

    // Draw trail first (so track marker is on top)
    if (showTrails && track.trail && track.trail.length > 0) {
      ascii.drawTrail(track.trail, color)
    }

    // Draw track position
    ascii.drawTrack(
      track.currentPosition.x,
      track.currentPosition.y,
      track.globalTrackId,
      color,
      track.isConfirmed
    )
  }

  // Compose output
  const output: string[] = []

  // Header
  output.push(COLORS.bold + COLORS.cyan + '╔══════════════════════════════════════════════════════════════════╗' + COLORS.reset)
  output.push(COLORS.bold + COLORS.cyan + '║' + COLORS.reset + '  Terminal Sitemap - ' + new Date().toLocaleTimeString() + '                                  ' + COLORS.bold + COLORS.cyan + '║' + COLORS.reset)
  output.push(COLORS.bold + COLORS.cyan + '╚══════════════════════════════════════════════════════════════════╝' + COLORS.reset)
  output.push('')

  // Sitemap
  output.push(ascii.render())
  output.push('')

  // Legend
  output.push(COLORS.dim + '  Legend: ' + COLORS.reset +
    COLORS.white + COLORS.bold + 'C' + COLORS.reset + '=Camera  ' +
    COLORS.green + COLORS.bold + '@' + COLORS.reset + '=Confirmed Track  ' +
    COLORS.yellow + 'o' + COLORS.reset + '=Unconfirmed  ' +
    COLORS.dim + '.' + COLORS.reset + '=Trail'
  )
  output.push('')

  // Track list
  if (tracks.length > 0) {
    output.push(COLORS.bold + '  Active Tracks:' + COLORS.reset)
    for (let i = 0; i < Math.min(tracks.length, 6); i++) {
      const track = tracks[i]
      const color = TRACK_COLORS[i % TRACK_COLORS.length]
      const status = track.isConfirmed ? '✓' : '?'
      const cameras = Object.keys(track.cameraAssociations).join(', ') || 'none'
      const pos = `(${track.currentPosition.x.toFixed(1)}, ${track.currentPosition.y.toFixed(1)})`

      output.push(
        `  ${color}${status} ${track.globalTrackId.padEnd(12)}${COLORS.reset} ` +
        `${COLORS.dim}pos:${COLORS.reset} ${pos.padEnd(14)} ` +
        `${COLORS.dim}cams:${COLORS.reset} ${cameras}`
      )
    }
    if (tracks.length > 6) {
      output.push(COLORS.dim + `  ... and ${tracks.length - 6} more tracks` + COLORS.reset)
    }
  } else {
    output.push(COLORS.dim + '  No active tracks' + COLORS.reset)
  }

  output.push('')
  output.push(COLORS.dim + '  Press Ctrl+C to exit' + COLORS.reset)

  return output.join('\n')
}

// ============================================================================
// CLI
// ============================================================================

const program = new Command()

program
  .name('terminal-sitemap')
  .description('Real-time ASCII sitemap visualization in terminal')
  .option('-u, --url <url>', 'Tracking service URL', 'http://localhost:3010')
  .option('-w, --watch', 'Watch mode - refresh continuously')
  .option('-r, --refresh <ms>', 'Refresh interval in milliseconds', '500')
  .option('-a, --all', 'Show all tracks including unconfirmed')
  .option('-t, --trails', 'Show track trails')
  .option('--width <n>', 'Terminal width override')
  .option('--height <n>', 'Terminal height override')
  .action(async (options) => {
    const baseUrl = options.url
    const termWidth = options.width ? parseInt(options.width, 10) : process.stdout.columns || 80
    const termHeight = options.height ? parseInt(options.height, 10) : process.stdout.rows || 24
    const refreshMs = parseInt(options.refresh, 10)

    if (options.watch) {
      // Watch mode with continuous refresh
      const render = async () => {
        console.clear()
        const frame = await renderFrame(baseUrl, termWidth, termHeight, !!options.all, !!options.trails)
        console.log(frame)
      }

      await render()
      setInterval(render, refreshMs)

      // Handle terminal resize
      process.stdout.on('resize', () => {
        render()
      })

      // Keep process alive
      process.stdin.resume()
    } else {
      // Single render
      const frame = await renderFrame(baseUrl, termWidth, termHeight, !!options.all, !!options.trails)
      console.log(frame)
    }
  })

program.parse()
