#!/usr/bin/env node
/**
 * CLI Tool: Batch Visualization
 *
 * Generate visualizations for all frames in ground truth annotations,
 * producing a summary report with aggregate metrics.
 *
 * Usage:
 *   pnpm cli:batch-visualize
 *   pnpm cli:batch-visualize --output ./report
 *   pnpm cli:batch-visualize --frames 11,50,100
 *   pnpm cli:batch-visualize --max-frames 10
 */

import { Command } from 'commander'
import { readFileSync, existsSync, mkdirSync, writeFileSync, createReadStream } from 'fs'
import { join, dirname } from 'path'
import { createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../config/sitemap-loader.js'
import { projectDetectionToGround, projectDetectionWithKRT } from '../projection/ground-plane.js'
import { CameraRegistry, CAMERA_BIAS_CORRECTIONS } from '../detection/camera-registry.js'

// ============================================================================
// Types
// ============================================================================

interface BBox {
  left: number
  top: number
  right: number
  bottom: number
}

interface Detection {
  bbox: BBox
  confidence: number
  class_name: string
  track_id: number
}

interface Frame {
  frame_number: number
  timestamp: number
  detections: Detection[]
}

interface DetectionFile {
  format_version: string
  video_info: {
    fps: number
    total_frames: number
    duration_seconds: number
  }
  frames: Frame[]
}

interface LinkedDetection {
  cameraId: string
  videoFile: string
  frameNumber: number
  timestamp: number
  trackId: number
  bbox: BBox
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  timestamp: number
  confidence: 'certain' | 'estimated' | 'uncertain'
  linkedDetections: LinkedDetection[]
}

interface GroundTruthDataset {
  version: string
  room: { width: number; height: number }
  cameras: Array<{ cameraId: string; videoFile: string; detectionsFile: string }>
  annotations: Annotation[]
}

interface Point2D {
  x: number
  y: number
}

interface FrameResult {
  frameNumber: number
  timestamp: number
  annotationCount: number
  projectionCount: number
  avgError: number | null
  errors: number[]
  passed: number
  failed: number
}

// ============================================================================
// Constants
// ============================================================================

const RENDER_SCALE = 80
const MARGIN = 50
const CAMERA_COLORS: Record<string, string> = {
  camera1: '#00bcd4',
  camera2: '#ff9800',
}
const ERROR_THRESHOLD = 0.5 // meters

// ============================================================================
// File Loading
// ============================================================================

async function loadDetectionFile(filePath: string): Promise<DetectionFile | null> {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    if (filePath.endsWith('.gz')) {
      const chunks: Buffer[] = []
      const gunzip = createGunzip()
      const source = createReadStream(filePath)

      await pipeline(
        source,
        gunzip,
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk as Buffer)
          }
        }
      )

      const content = Buffer.concat(chunks).toString('utf-8')
      return JSON.parse(content)
    } else {
      const content = readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    return null
  }
}

function loadGroundTruths(projectRoot: string): GroundTruthDataset | null {
  const gtPath = join(projectRoot, 'GroundTruths.json')
  if (!existsSync(gtPath)) {
    return null
  }

  try {
    const content = readFileSync(gtPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

// ============================================================================
// SVG Generation
// ============================================================================

function worldToCanvas(worldX: number, worldY: number, roomHeight: number): Point2D {
  return {
    x: MARGIN + worldX * RENDER_SCALE,
    y: MARGIN + (roomHeight - worldY) * RENDER_SCALE,
  }
}

interface Obstacle {
  id: string
  type: 'circle' | 'rectangle'
  position: { x: number; y: number }
  radius?: number
  dimensions?: { width: number; height: number }
  rotation?: number
  label?: string
  color?: string
}

function generateFrameSVG(
  roomWidth: number,
  roomHeight: number,
  cameras: Array<{ id: string; position: { x: number; y: number }; azimuth: number; fieldOfView: number }>,
  obstacles: Obstacle[],
  groundTruths: Array<{ position: Point2D; error?: number }>,
  projections: Array<{ position: Point2D; cameraId: string }>,
  frameNumber: number,
  avgError: number | null
): string {
  const canvasWidth = roomWidth * RENDER_SCALE + MARGIN * 2
  const canvasHeight = roomHeight * RENDER_SCALE + MARGIN * 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="#0d0d0d"/>
  <rect x="${MARGIN}" y="${MARGIN}" width="${roomWidth * RENDER_SCALE}" height="${roomHeight * RENDER_SCALE}" fill="#1a1a2e" stroke="#fff" stroke-width="2"/>
`

  // Grid
  for (let x = 0; x <= roomWidth; x += 2) {
    const canvasX = MARGIN + x * RENDER_SCALE
    svg += `  <line x1="${canvasX}" y1="${MARGIN}" x2="${canvasX}" y2="${MARGIN + roomHeight * RENDER_SCALE}" stroke="#333" stroke-width="0.5"/>\n`
  }
  for (let y = 0; y <= roomHeight; y += 2) {
    const canvasY = MARGIN + y * RENDER_SCALE
    svg += `  <line x1="${MARGIN}" y1="${canvasY}" x2="${MARGIN + roomWidth * RENDER_SCALE}" y2="${canvasY}" stroke="#333" stroke-width="0.5"/>\n`
  }

  // Obstacles (pillars and tables)
  for (const obs of obstacles) {
    const pos = worldToCanvas(obs.position.x, obs.position.y, roomHeight)
    const color = obs.color || '#64748b'

    if (obs.type === 'circle' && obs.radius) {
      const r = obs.radius * RENDER_SCALE
      svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="${color}" stroke="#94a3b8" stroke-width="1"/>\n`
      // Label
      if (obs.label) {
        svg += `  <text x="${pos.x}" y="${pos.y + r + 12}" fill="#94a3b8" font-family="Arial" font-size="9" text-anchor="middle">${obs.label}</text>\n`
      }
    } else if (obs.type === 'rectangle' && obs.dimensions) {
      const w = obs.dimensions.width * RENDER_SCALE
      const h = obs.dimensions.height * RENDER_SCALE
      const rotation = obs.rotation || 0
      svg += `  <rect x="${pos.x - w/2}" y="${pos.y - h/2}" width="${w}" height="${h}" fill="${color}" stroke="#94a3b8" stroke-width="1" transform="rotate(${rotation} ${pos.x} ${pos.y})"/>\n`
      if (obs.label) {
        svg += `  <text x="${pos.x}" y="${pos.y + h/2 + 12}" fill="#94a3b8" font-family="Arial" font-size="9" text-anchor="middle">${obs.label}</text>\n`
      }
    }
  }

  // Helper to find ray-wall intersection distance
  const rayToWallDistance = (
    ox: number, oy: number, // origin in world coords
    dx: number, dy: number  // direction (unit vector)
  ): number => {
    let minDist = Infinity
    // Room boundaries: x in [0, roomWidth], y in [0, roomHeight]

    // Left wall (x = 0)
    if (dx < 0) {
      const t = -ox / dx
      const hitY = oy + t * dy
      if (t > 0 && hitY >= 0 && hitY <= roomHeight) minDist = Math.min(minDist, t)
    }
    // Right wall (x = roomWidth)
    if (dx > 0) {
      const t = (roomWidth - ox) / dx
      const hitY = oy + t * dy
      if (t > 0 && hitY >= 0 && hitY <= roomHeight) minDist = Math.min(minDist, t)
    }
    // Bottom wall (y = 0)
    if (dy < 0) {
      const t = -oy / dy
      const hitX = ox + t * dx
      if (t > 0 && hitX >= 0 && hitX <= roomWidth) minDist = Math.min(minDist, t)
    }
    // Top wall (y = roomHeight)
    if (dy > 0) {
      const t = (roomHeight - oy) / dy
      const hitX = ox + t * dx
      if (t > 0 && hitX >= 0 && hitX <= roomWidth) minDist = Math.min(minDist, t)
    }
    return minDist === Infinity ? 20 : minDist // fallback to 20m
  }

  // Cameras with FOV cones clipped to room walls
  for (const cam of cameras) {
    const pos = worldToCanvas(cam.position.x, cam.position.y, roomHeight)
    const color = CAMERA_COLORS[cam.id] || '#888'

    const fovRad = (cam.fieldOfView * Math.PI) / 180
    // Convert azimuth to math angle (azimuth 0=North=+Y, 90=East=+X)
    // Math angle: 0=+X, 90=+Y, so azimuth 0 -> 90°, azimuth 90 -> 0°
    const azimuthMath = (90 - cam.azimuth) * Math.PI / 180

    const startAngle = azimuthMath + fovRad / 2
    const endAngle = azimuthMath - fovRad / 2

    // Generate polygon points along the FOV arc, clipped to walls
    const numSegments = 20
    let pathPoints = `M ${pos.x} ${pos.y}`

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments
      const angle = startAngle + t * (endAngle - startAngle)
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const dist = rayToWallDistance(cam.position.x, cam.position.y, dx, dy)

      const worldX = cam.position.x + dx * dist
      const worldY = cam.position.y + dy * dist
      const canvasPoint = worldToCanvas(worldX, worldY, roomHeight)

      pathPoints += ` L ${canvasPoint.x} ${canvasPoint.y}`
    }
    pathPoints += ' Z'

    svg += `  <path d="${pathPoints}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1" stroke-opacity="0.3"/>\n`

    // Camera marker
    svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${color}"/>\n`

    // Direction line
    const dirDist = Math.min(1.5, rayToWallDistance(cam.position.x, cam.position.y, Math.cos(azimuthMath), Math.sin(azimuthMath)))
    const dirWorld = worldToCanvas(
      cam.position.x + Math.cos(azimuthMath) * dirDist,
      cam.position.y + Math.sin(azimuthMath) * dirDist,
      roomHeight
    )
    svg += `  <line x1="${pos.x}" y1="${pos.y}" x2="${dirWorld.x}" y2="${dirWorld.y}" stroke="${color}" stroke-width="2"/>\n`

    // Camera label
    svg += `  <text x="${pos.x}" y="${pos.y - 10}" fill="${color}" font-family="Arial" font-size="10" text-anchor="middle" font-weight="bold">${cam.id}</text>\n`
  }

  // Ground truths with error coloring
  for (const gt of groundTruths) {
    const pos = worldToCanvas(gt.position.x, gt.position.y, roomHeight)
    const color = gt.error !== undefined && gt.error < ERROR_THRESHOLD ? '#4caf50' : '#f44336'
    svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="none" stroke="${color}" stroke-width="2"/>\n`
    svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="3" fill="${color}"/>\n`
  }

  // Projections
  for (const proj of projections) {
    const pos = worldToCanvas(proj.position.x, proj.position.y, roomHeight)
    const color = CAMERA_COLORS[proj.cameraId] || '#888'
    svg += `  <line x1="${pos.x - 5}" y1="${pos.y - 5}" x2="${pos.x + 5}" y2="${pos.y + 5}" stroke="${color}" stroke-width="2"/>\n`
    svg += `  <line x1="${pos.x + 5}" y1="${pos.y - 5}" x2="${pos.x - 5}" y2="${pos.y + 5}" stroke="${color}" stroke-width="2"/>\n`
  }

  // Title
  const errorText = avgError !== null ? ` | Avg Error: ${avgError.toFixed(2)}m` : ''
  svg += `  <text x="${canvasWidth - MARGIN}" y="25" fill="#fff" font-family="Arial" font-size="14" text-anchor="end">Frame ${frameNumber}${errorText}</text>\n`

  svg += `</svg>`
  return svg
}

// ============================================================================
// Projection Processing
// ============================================================================

async function processFrame(
  frameNumber: number,
  annotations: Annotation[],
  _camera1Detections: DetectionFile | null,
  _camera2Detections: DetectionFile | null,
  cameraRegistry: CameraRegistry,
  cameraParams: Record<string, ReturnType<typeof siteMapCameraToCameraParams>>
): Promise<{
  groundTruths: Array<{ position: Point2D; error?: number }>
  projections: Array<{ position: Point2D; cameraId: string }>
  errors: number[]
}> {
  const groundTruths: Array<{ position: Point2D; error?: number }> = []
  const projections: Array<{ position: Point2D; cameraId: string }> = []
  const errors: number[] = []

  for (const annotation of annotations) {
    const annotationErrors: number[] = []

    for (const det of annotation.linkedDetections) {
      if (det.frameNumber !== frameNumber) continue

      const params = cameraParams[det.cameraId]
      if (!params) continue

      const bbox = {
        x: det.bbox.left,
        y: det.bbox.top,
        width: det.bbox.right - det.bbox.left,
        height: det.bbox.bottom - det.bbox.top,
      }

      const calibration = cameraRegistry.getCalibration(det.cameraId)
      let position: Point2D
      let isValid: boolean

      if (calibration) {
        const krtResult = projectDetectionWithKRT(bbox, calibration, params, [], true, 1920, 1080)
        position = krtResult.worldPoint
        isValid = krtResult.isValid
      } else {
        const legacyResult = projectDetectionToGround(bbox, params, [], true, 1920, 1080)
        position = legacyResult.worldPoint
        isValid = legacyResult.isValid
      }

      const biasCorrection = CAMERA_BIAS_CORRECTIONS[det.cameraId] ?? { x: 0, y: 0 }
      position = {
        x: position.x + biasCorrection.x,
        y: position.y + biasCorrection.y,
      }

      if (isValid) {
        projections.push({ position, cameraId: det.cameraId })

        const error = Math.sqrt(
          Math.pow(position.x - annotation.groundPosition.x, 2) +
            Math.pow(position.y - annotation.groundPosition.y, 2)
        )
        annotationErrors.push(error)
        errors.push(error)
      }
    }

    const minError = annotationErrors.length > 0 ? Math.min(...annotationErrors) : undefined
    groundTruths.push({
      position: annotation.groundPosition as Point2D,
      error: minError,
    })
  }

  return { groundTruths, projections, errors }
}

// ============================================================================
// HTML Report Generation
// ============================================================================

function generateSummaryHTML(
  results: FrameResult[],
  roomWidth: number,
  roomHeight: number,
  frameSVGs: Map<number, string>
): string {
  const totalAnnotations = results.reduce((sum, r) => sum + r.annotationCount, 0)
  const totalProjections = results.reduce((sum, r) => sum + r.projectionCount, 0)
  const allErrors = results.flatMap((r) => r.errors)
  const avgError = allErrors.length > 0 ? allErrors.reduce((a, b) => a + b, 0) / allErrors.length : 0
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
  const passRate = totalAnnotations > 0 ? (totalPassed / totalAnnotations) * 100 : 0

  // Error distribution
  const errorBuckets = [0, 0, 0, 0, 0] // <0.25m, 0.25-0.5m, 0.5-1m, 1-2m, >2m
  for (const err of allErrors) {
    if (err < 0.25) errorBuckets[0]++
    else if (err < 0.5) errorBuckets[1]++
    else if (err < 1.0) errorBuckets[2]++
    else if (err < 2.0) errorBuckets[3]++
    else errorBuckets[4]++
  }

  const frameCards = results
    .map((r) => {
      const svg = frameSVGs.get(r.frameNumber) || ''
      const statusColor = r.passed > r.failed ? '#4caf50' : '#f44336'
      return `
      <div class="frame-card" id="frame-${r.frameNumber}">
        <div class="frame-header">
          <span class="frame-title">Frame ${r.frameNumber}</span>
          <span class="frame-status" style="color: ${statusColor}">${r.passed}/${r.annotationCount} passed</span>
        </div>
        <div class="frame-svg">${svg}</div>
        <div class="frame-stats">
          <div class="stat">Avg Error: ${r.avgError !== null ? r.avgError.toFixed(2) + 'm' : 'N/A'}</div>
          <div class="stat">Projections: ${r.projectionCount}</div>
        </div>
      </div>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tracking Batch Visualization Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    h1 { margin-bottom: 10px; color: #00bcd4; }
    .subtitle { color: #888; margin-bottom: 20px; }

    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #16213e; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-value { font-size: 36px; font-weight: bold; color: #00bcd4; }
    .summary-value.good { color: #4caf50; }
    .summary-value.bad { color: #f44336; }
    .summary-label { color: #888; font-size: 14px; margin-top: 5px; }

    .distribution { background: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .distribution h2 { margin-bottom: 15px; font-size: 16px; color: #ff9800; }
    .bar-chart { display: flex; gap: 10px; align-items: flex-end; height: 100px; }
    .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .bar { width: 100%; background: #00bcd4; border-radius: 4px 4px 0 0; min-height: 4px; }
    .bar.good { background: #4caf50; }
    .bar.warn { background: #ff9800; }
    .bar.bad { background: #f44336; }
    .bar-label { font-size: 11px; color: #888; margin-top: 5px; text-align: center; }
    .bar-value { font-size: 12px; color: #fff; margin-bottom: 5px; }

    .frames-section h2 { margin-bottom: 15px; color: #ff9800; }
    .frames-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .frame-card { background: #16213e; border-radius: 8px; overflow: hidden; }
    .frame-header { padding: 10px 15px; background: #0f3460; display: flex; justify-content: space-between; align-items: center; }
    .frame-title { font-weight: bold; }
    .frame-status { font-size: 14px; }
    .frame-svg { padding: 10px; display: flex; justify-content: center; }
    .frame-svg svg { max-width: 100%; height: auto; }
    .frame-stats { padding: 10px 15px; display: flex; gap: 20px; font-size: 13px; color: #888; border-top: 1px solid #0f3460; }

    .legend { display: flex; gap: 20px; margin-bottom: 20px; padding: 10px; background: #16213e; border-radius: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .legend-x { width: 12px; height: 12px; position: relative; }
    .legend-x::before, .legend-x::after { content: ''; position: absolute; width: 2px; height: 14px; background: currentColor; left: 5px; }
    .legend-x::before { transform: rotate(45deg); }
    .legend-x::after { transform: rotate(-45deg); }
  </style>
</head>
<body>
  <h1>Tracking Batch Visualization Report</h1>
  <p class="subtitle">Generated: ${new Date().toISOString()} | Room: ${roomWidth}m x ${roomHeight}m</p>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-value">${results.length}</div>
      <div class="summary-label">Frames Analyzed</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${totalAnnotations}</div>
      <div class="summary-label">Ground Truth Annotations</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${totalProjections}</div>
      <div class="summary-label">Projections Generated</div>
    </div>
    <div class="summary-card">
      <div class="summary-value ${passRate >= 80 ? 'good' : passRate >= 50 ? '' : 'bad'}">${passRate.toFixed(1)}%</div>
      <div class="summary-label">Pass Rate (&lt;${ERROR_THRESHOLD}m)</div>
    </div>
    <div class="summary-card">
      <div class="summary-value ${avgError < 0.5 ? 'good' : avgError < 1.0 ? '' : 'bad'}">${avgError.toFixed(2)}m</div>
      <div class="summary-label">Average Error</div>
    </div>
  </div>

  <div class="distribution">
    <h2>Error Distribution</h2>
    <div class="bar-chart">
      ${['<0.25m', '0.25-0.5m', '0.5-1.0m', '1.0-2.0m', '>2.0m']
        .map((label, i) => {
          const maxCount = Math.max(...errorBuckets, 1)
          const height = (errorBuckets[i] / maxCount) * 100
          const barClass = i < 2 ? 'good' : i === 2 ? 'warn' : 'bad'
          return `
        <div class="bar-wrapper">
          <div class="bar-value">${errorBuckets[i]}</div>
          <div class="bar ${barClass}" style="height: ${height}%"></div>
          <div class="bar-label">${label}</div>
        </div>`
        })
        .join('')}
    </div>
  </div>

  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background: #4caf50;"></div> Ground Truth (passed)</div>
    <div class="legend-item"><div class="legend-dot" style="background: #f44336;"></div> Ground Truth (failed)</div>
    <div class="legend-item"><div class="legend-x" style="color: #00bcd4;"></div> Camera 1 Projection</div>
    <div class="legend-item"><div class="legend-x" style="color: #ff9800;"></div> Camera 2 Projection</div>
  </div>

  <div class="frames-section">
    <h2>Frame Details (${results.length} frames)</h2>
    <div class="frames-grid">
      ${frameCards}
    </div>
  </div>
</body>
</html>`
}

function generateMarkdownReport(results: FrameResult[]): string {
  const totalAnnotations = results.reduce((sum, r) => sum + r.annotationCount, 0)
  const allErrors = results.flatMap((r) => r.errors)
  const avgError = allErrors.length > 0 ? allErrors.reduce((a, b) => a + b, 0) / allErrors.length : 0
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
  const passRate = totalAnnotations > 0 ? (totalPassed / totalAnnotations) * 100 : 0

  let md = `# Tracking Batch Visualization Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Frames Analyzed | ${results.length} |
| Total Annotations | ${totalAnnotations} |
| Pass Rate (<${ERROR_THRESHOLD}m) | ${passRate.toFixed(1)}% |
| Average Error | ${avgError.toFixed(3)}m |
| Min Error | ${allErrors.length > 0 ? Math.min(...allErrors).toFixed(3) : 'N/A'}m |
| Max Error | ${allErrors.length > 0 ? Math.max(...allErrors).toFixed(3) : 'N/A'}m |

## Frame Results

| Frame | Annotations | Projections | Avg Error | Pass Rate |
|-------|-------------|-------------|-----------|-----------|
`

  for (const r of results) {
    const rate = r.annotationCount > 0 ? ((r.passed / r.annotationCount) * 100).toFixed(0) : 'N/A'
    md += `| ${r.frameNumber} | ${r.annotationCount} | ${r.projectionCount} | ${r.avgError !== null ? r.avgError.toFixed(2) + 'm' : 'N/A'} | ${rate}% |\n`
  }

  return md
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const program = new Command()

  program
    .name('batch-visualize')
    .description('Generate batch visualization for all ground truth frames')
    .option('-o, --output <dir>', 'Output directory', './visualization-output/batch')
    .option('-f, --frames <frames>', 'Comma-separated list of specific frames to process')
    .option('-m, --max-frames <n>', 'Maximum number of frames to process', '50')
    .option('--project-root <dir>', 'Project root directory')
    .option('--no-html', 'Skip HTML report generation')
    .option('--markdown', 'Generate markdown report')
    .action(async (options) => {
      // Determine project root
      let projectRoot = options.projectRoot
      if (!projectRoot) {
        projectRoot = join(dirname(new URL(import.meta.url).pathname), '../../..')
      }

      console.log('Tracking Batch Visualization')
      console.log('============================\n')

      // Load ground truths
      const groundTruths = loadGroundTruths(projectRoot)
      if (!groundTruths) {
        console.error('Error: GroundTruths.json not found')
        process.exit(1)
      }

      console.log(`Loaded ${groundTruths.annotations.length} annotations`)

      // Load sitemap
      const sitemapPath = join(projectRoot, 'frontend/public/sitemap-rectangular-room.json')
      const sitemapConfig = loadSiteMapConfig(sitemapPath)
      const roomWidth = sitemapConfig.dimensions.width
      const roomHeight = sitemapConfig.dimensions.height

      console.log(`Room: ${roomWidth}m x ${roomHeight}m`)

      // Set up camera registry
      const cameraRegistry = new CameraRegistry()
      cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

      const cameraParams: Record<string, ReturnType<typeof siteMapCameraToCameraParams>> = {}
      for (const cam of sitemapConfig.cameras) {
        cameraParams[cam.id] = siteMapCameraToCameraParams(cam as any)
      }

      // Load detection files
      const detectionsDir = join(projectRoot, 'shared/cameras/preprocessed/1080p')
      const camera1Detections = await loadDetectionFile(join(detectionsDir, 'view-HC3-preprocessed.detections.json'))
      const camera2Detections = await loadDetectionFile(join(detectionsDir, 'view-HC4-preprocessed.detections.json'))

      // Determine frames to process
      let framesToProcess: number[]

      if (options.frames) {
        framesToProcess = options.frames.split(',').map((f: string) => parseInt(f.trim(), 10))
      } else {
        // Get unique frames from annotations
        const frameSet = new Set<number>()
        for (const ann of groundTruths.annotations) {
          for (const det of ann.linkedDetections) {
            frameSet.add(det.frameNumber)
          }
        }
        framesToProcess = Array.from(frameSet).sort((a, b) => a - b)

        const maxFrames = parseInt(options.maxFrames, 10)
        if (framesToProcess.length > maxFrames) {
          console.log(`Limiting to first ${maxFrames} frames (use --max-frames to change)`)
          framesToProcess = framesToProcess.slice(0, maxFrames)
        }
      }

      console.log(`Processing ${framesToProcess.length} frames...\n`)

      // Process frames
      const results: FrameResult[] = []
      const frameSVGs = new Map<number, string>()

      for (const frameNumber of framesToProcess) {
        const frameAnnotations = groundTruths.annotations.filter((a) =>
          a.linkedDetections.some((d) => d.frameNumber === frameNumber)
        )

        if (frameAnnotations.length === 0) continue

        const { groundTruths: gtMarkers, projections, errors } = await processFrame(
          frameNumber,
          frameAnnotations,
          camera1Detections,
          camera2Detections,
          cameraRegistry,
          cameraParams
        )

        const avgError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : null
        const passed = errors.filter((e) => e < ERROR_THRESHOLD).length
        const failed = frameAnnotations.length - passed

        results.push({
          frameNumber,
          timestamp: frameAnnotations[0]?.timestamp || 0,
          annotationCount: frameAnnotations.length,
          projectionCount: projections.length,
          avgError,
          errors,
          passed,
          failed,
        })

        // Generate mini SVG for this frame
        const obstacles: Obstacle[] = ((sitemapConfig as any).obstacles || []).map((o: any) => ({
          id: o.id,
          type: o.type,
          position: o.position,
          radius: o.radius,
          dimensions: o.dimensions,
          rotation: o.rotation,
          label: o.label,
          color: o.color,
        }))

        const svg = generateFrameSVG(
          roomWidth,
          roomHeight,
          sitemapConfig.cameras.map((c) => ({
            id: c.id,
            position: { x: c.position.x, y: c.position.y },
            azimuth: c.azimuth,
            fieldOfView: c.fieldOfView,
          })),
          obstacles,
          gtMarkers,
          projections,
          frameNumber,
          avgError
        )
        frameSVGs.set(frameNumber, svg)

        // Progress indicator
        const passIcon = passed >= failed ? '✓' : '✗'
        const errorStr = avgError !== null ? `${avgError.toFixed(2)}m` : 'N/A'
        console.log(`  Frame ${String(frameNumber).padStart(4)}: ${frameAnnotations.length} annotations, ${passed}/${frameAnnotations.length} passed, avg error: ${errorStr} ${passIcon}`)
      }

      // Create output directory
      mkdirSync(options.output, { recursive: true })

      // Generate reports
      if (options.html !== false) {
        const htmlReport = generateSummaryHTML(results, roomWidth, roomHeight, frameSVGs)
        const htmlPath = join(options.output, 'index.html')
        writeFileSync(htmlPath, htmlReport)
        console.log(`\n✓ HTML report: ${htmlPath}`)
      }

      if (options.markdown) {
        const mdReport = generateMarkdownReport(results)
        const mdPath = join(options.output, 'report.md')
        writeFileSync(mdPath, mdReport)
        console.log(`✓ Markdown report: ${mdPath}`)
      }

      // Save JSON data
      const jsonPath = join(options.output, 'results.json')
      writeFileSync(jsonPath, JSON.stringify({ results, generated: new Date().toISOString() }, null, 2))
      console.log(`✓ JSON data: ${jsonPath}`)

      // Summary
      const totalAnnotations = results.reduce((sum, r) => sum + r.annotationCount, 0)
      const allErrors = results.flatMap((r) => r.errors)
      const avgError = allErrors.length > 0 ? allErrors.reduce((a, b) => a + b, 0) / allErrors.length : 0
      const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
      const passRate = totalAnnotations > 0 ? (totalPassed / totalAnnotations) * 100 : 0

      console.log('\n============================')
      console.log('Summary')
      console.log('============================')
      console.log(`Frames processed: ${results.length}`)
      console.log(`Total annotations: ${totalAnnotations}`)
      console.log(`Pass rate (<${ERROR_THRESHOLD}m): ${passRate.toFixed(1)}%`)
      console.log(`Average error: ${avgError.toFixed(3)}m`)
    })

  await program.parseAsync()
}

main().catch(console.error)
