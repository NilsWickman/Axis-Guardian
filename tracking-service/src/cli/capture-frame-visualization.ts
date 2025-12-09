#!/usr/bin/env node
/**
 * CLI Tool: Capture Frame Visualization
 *
 * Generates a visualization snapshot for a given frame showing:
 * - Sitemap with camera positions
 * - Bounding box detections from each camera
 * - Ground truth annotations
 * - Projected track positions
 *
 * Outputs all artifacts to a timestamped folder as SVG + HTML viewer.
 *
 * Usage:
 *   pnpm cli:visualize --frame 11
 *   pnpm cli:visualize --frame 50 --output ./snapshots
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

// ============================================================================
// Constants
// ============================================================================

const RENDER_SCALE = 80 // pixels per meter
const MARGIN = 50
const CAMERA_COLORS: Record<string, string> = {
  camera1: '#00bcd4', // cyan
  camera2: '#ff9800', // orange
}
const GROUND_TRUTH_COLOR = '#4caf50' // green
const ERROR_LINE_COLOR = '#ffeb3b' // yellow

// ============================================================================
// File Loading
// ============================================================================

async function loadDetectionFile(filePath: string): Promise<DetectionFile | null> {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
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
    console.error('Error loading file:', error)
    return null
  }
}

function loadGroundTruths(projectRoot: string): GroundTruthDataset | null {
  const gtPath = join(projectRoot, 'GroundTruths.json')
  if (!existsSync(gtPath)) {
    console.warn('GroundTruths.json not found')
    return null
  }

  try {
    const content = readFileSync(gtPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading ground truths:', error)
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

function generateSitemapSVG(
  roomWidth: number,
  roomHeight: number,
  cameras: Array<{ id: string; position: { x: number; y: number }; azimuth: number; fieldOfView: number }>,
  obstacles: Obstacle[],
  groundTruths: Array<{ position: Point2D; label: string }>,
  projections: Array<{ position: Point2D; cameraId: string; trackId: number }>,
  errorLines: Array<{ from: Point2D; to: Point2D; error: number }>,
  frameNumber: number
): string {
  const canvasWidth = roomWidth * RENDER_SCALE + MARGIN * 2
  const canvasHeight = roomHeight * RENDER_SCALE + MARGIN * 2

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <defs>
    <style>
      .grid-line { stroke: #333; stroke-width: 0.5; }
      .room-border { stroke: #fff; stroke-width: 2; fill: #1a1a2e; }
      .axis-label { fill: #666; font-family: Arial; font-size: 10px; }
      .camera-label { fill: #fff; font-family: Arial; font-size: 12px; font-weight: bold; text-anchor: middle; }
      .gt-marker { stroke: ${GROUND_TRUTH_COLOR}; stroke-width: 3; fill: none; }
      .gt-dot { fill: ${GROUND_TRUTH_COLOR}; }
      .gt-label { fill: ${GROUND_TRUTH_COLOR}; font-family: Arial; font-size: 10px; font-weight: bold; text-anchor: middle; }
      .proj-marker { stroke-width: 2; }
      .proj-label { font-family: Arial; font-size: 9px; }
      .error-line { stroke: ${ERROR_LINE_COLOR}; stroke-width: 1; stroke-dasharray: 4,4; }
      .error-label { fill: ${ERROR_LINE_COLOR}; font-family: Arial; font-size: 9px; text-anchor: middle; }
      .legend { fill: #fff; font-family: Arial; font-size: 12px; font-weight: bold; }
      .title { fill: #fff; font-family: Arial; font-size: 16px; font-weight: bold; text-anchor: end; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="#0d0d0d"/>

  <!-- Room -->
  <rect x="${MARGIN}" y="${MARGIN}" width="${roomWidth * RENDER_SCALE}" height="${roomHeight * RENDER_SCALE}" class="room-border"/>

  <!-- Grid -->
  <g class="grid">
`

  // Vertical grid lines
  for (let x = 0; x <= roomWidth; x++) {
    const canvasX = MARGIN + x * RENDER_SCALE
    svg += `    <line x1="${canvasX}" y1="${MARGIN}" x2="${canvasX}" y2="${MARGIN + roomHeight * RENDER_SCALE}" class="grid-line"/>\n`
  }

  // Horizontal grid lines
  for (let y = 0; y <= roomHeight; y++) {
    const canvasY = MARGIN + y * RENDER_SCALE
    svg += `    <line x1="${MARGIN}" y1="${canvasY}" x2="${MARGIN + roomWidth * RENDER_SCALE}" y2="${canvasY}" class="grid-line"/>\n`
  }

  svg += `  </g>

  <!-- Axis Labels -->
  <g class="axis-labels">
`

  // X axis labels
  for (let x = 0; x <= roomWidth; x += 2) {
    const canvasX = MARGIN + x * RENDER_SCALE
    svg += `    <text x="${canvasX}" y="${MARGIN + roomHeight * RENDER_SCALE + 15}" class="axis-label" text-anchor="middle">${x}m</text>\n`
  }

  // Y axis labels
  for (let y = 0; y <= roomHeight; y += 2) {
    const canvasY = MARGIN + (roomHeight - y) * RENDER_SCALE
    svg += `    <text x="${MARGIN - 5}" y="${canvasY + 4}" class="axis-label" text-anchor="end">${y}m</text>\n`
  }

  svg += `  </g>

  <!-- Obstacles -->
  <g class="obstacles">
`

  for (const obs of obstacles) {
    const pos = worldToCanvas(obs.position.x, obs.position.y, roomHeight)
    const color = obs.color || '#64748b'

    if (obs.type === 'circle' && obs.radius) {
      const r = obs.radius * RENDER_SCALE
      svg += `    <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="${color}" stroke="#94a3b8" stroke-width="1"/>\n`
      if (obs.label) {
        svg += `    <text x="${pos.x}" y="${pos.y + r + 12}" fill="#94a3b8" font-family="Arial" font-size="9" text-anchor="middle">${obs.label}</text>\n`
      }
    } else if (obs.type === 'rectangle' && obs.dimensions) {
      const w = obs.dimensions.width * RENDER_SCALE
      const h = obs.dimensions.height * RENDER_SCALE
      const rotation = obs.rotation || 0
      svg += `    <rect x="${pos.x - w/2}" y="${pos.y - h/2}" width="${w}" height="${h}" fill="${color}" stroke="#94a3b8" stroke-width="1" transform="rotate(${rotation} ${pos.x} ${pos.y})"/>\n`
      if (obs.label) {
        svg += `    <text x="${pos.x}" y="${pos.y + h/2 + 12}" fill="#94a3b8" font-family="Arial" font-size="9" text-anchor="middle">${obs.label}</text>\n`
      }
    }
  }

  svg += `  </g>

  <!-- Cameras -->
  <g class="cameras">
`

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

    svg += `    <path d="${pathPoints}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1" stroke-opacity="0.3"/>\n`
    svg += `    <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="${color}"/>\n`

    // Direction indicator clipped to wall
    const dirDist = Math.min(1.5, rayToWallDistance(cam.position.x, cam.position.y, Math.cos(azimuthMath), Math.sin(azimuthMath)))
    const dirWorld = worldToCanvas(
      cam.position.x + Math.cos(azimuthMath) * dirDist,
      cam.position.y + Math.sin(azimuthMath) * dirDist,
      roomHeight
    )
    svg += `    <line x1="${pos.x}" y1="${pos.y}" x2="${dirWorld.x}" y2="${dirWorld.y}" stroke="${color}" stroke-width="2"/>\n`

    // Label
    svg += `    <text x="${pos.x}" y="${pos.y - 15}" class="camera-label">${cam.id}</text>\n`
  }

  svg += `  </g>

  <!-- Error Lines -->
  <g class="error-lines">
`

  for (const line of errorLines) {
    const from = worldToCanvas(line.from.x, line.from.y, roomHeight)
    const to = worldToCanvas(line.to.x, line.to.y, roomHeight)
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2

    svg += `    <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="error-line"/>\n`
    svg += `    <text x="${midX}" y="${midY - 5}" class="error-label">${line.error.toFixed(2)}m</text>\n`
  }

  svg += `  </g>

  <!-- Ground Truths -->
  <g class="ground-truths">
`

  for (const gt of groundTruths) {
    const pos = worldToCanvas(gt.position.x, gt.position.y, roomHeight)
    svg += `    <circle cx="${pos.x}" cy="${pos.y}" r="12" class="gt-marker"/>\n`
    svg += `    <circle cx="${pos.x}" cy="${pos.y}" r="4" class="gt-dot"/>\n`
    svg += `    <text x="${pos.x}" y="${pos.y - 18}" class="gt-label">${gt.label}</text>\n`
  }

  svg += `  </g>

  <!-- Projections -->
  <g class="projections">
`

  for (const proj of projections) {
    const pos = worldToCanvas(proj.position.x, proj.position.y, roomHeight)
    const color = CAMERA_COLORS[proj.cameraId] || '#f44336'
    const size = 8

    svg += `    <line x1="${pos.x - size}" y1="${pos.y - size}" x2="${pos.x + size}" y2="${pos.y + size}" stroke="${color}" class="proj-marker"/>\n`
    svg += `    <line x1="${pos.x + size}" y1="${pos.y - size}" x2="${pos.x - size}" y2="${pos.y + size}" stroke="${color}" class="proj-marker"/>\n`
    svg += `    <text x="${pos.x + 10}" y="${pos.y + 4}" fill="${color}" class="proj-label">${proj.cameraId.replace('camera', 'C')}:${proj.trackId}</text>\n`
  }

  svg += `  </g>

  <!-- Legend -->
  <g class="legend-group">
    <circle cx="${MARGIN + 15}" cy="${MARGIN - 25}" r="5" fill="${GROUND_TRUTH_COLOR}"/>
    <text x="${MARGIN + 25}" y="${MARGIN - 21}" class="legend" fill="${GROUND_TRUTH_COLOR}">Ground Truth</text>

    <text x="${MARGIN + 140}" y="${MARGIN - 21}" class="legend" fill="${CAMERA_COLORS.camera1}">× Camera 1</text>
    <text x="${MARGIN + 250}" y="${MARGIN - 21}" class="legend" fill="${CAMERA_COLORS.camera2}">× Camera 2</text>
    <text x="${MARGIN + 360}" y="${MARGIN - 21}" class="legend" fill="${ERROR_LINE_COLOR}">--- Error</text>
  </g>

  <!-- Title -->
  <text x="${canvasWidth - MARGIN}" y="${MARGIN - 25}" class="title">Frame ${frameNumber}</text>

</svg>`

  return svg
}

function generateBBoxSVG(
  detections: Detection[],
  cameraId: string,
  frameNumber: number,
  imageWidth: number,
  imageHeight: number
): string {
  const color = CAMERA_COLORS[cameraId] || '#00ff00'

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
  <defs>
    <style>
      .bbox { stroke-width: 2; fill: none; }
      .label-bg { }
      .label-text { font-family: Arial; font-size: 12px; fill: #000; }
      .center-dot { }
      .foot-marker { stroke: #fff; stroke-width: 1; }
      .info { fill: #fff; font-family: Arial; font-weight: bold; }
    </style>
  </defs>

  <!-- Dark background -->
  <rect width="${imageWidth}" height="${imageHeight}" fill="#000"/>

  <!-- Detections -->
  <g class="detections">
`

  for (const det of detections) {
    const x = det.bbox.left * imageWidth
    const y = det.bbox.top * imageHeight
    const width = (det.bbox.right - det.bbox.left) * imageWidth
    const height = (det.bbox.bottom - det.bbox.top) * imageHeight
    const label = `#${det.track_id} (${(det.confidence * 100).toFixed(0)}%)`

    // Bounding box
    svg += `    <rect x="${x}" y="${y}" width="${width}" height="${height}" stroke="${color}" class="bbox"/>\n`

    // Label background
    const textWidth = label.length * 7 + 8
    svg += `    <rect x="${x}" y="${y - 18}" width="${textWidth}" height="18" fill="${color}"/>\n`
    svg += `    <text x="${x + 4}" y="${y - 5}" class="label-text">${label}</text>\n`

    // Center dot
    const centerX = x + width / 2
    const centerY = y + height / 2
    svg += `    <circle cx="${centerX}" cy="${centerY}" r="3" fill="${color}"/>\n`

    // Foot position (bottom center)
    const footX = centerX
    const footY = y + height
    svg += `    <line x1="${footX - 5}" y1="${footY}" x2="${footX + 5}" y2="${footY}" class="foot-marker"/>\n`
    svg += `    <line x1="${footX}" y1="${footY - 5}" x2="${footX}" y2="${footY + 5}" class="foot-marker"/>\n`
  }

  svg += `  </g>

  <!-- Info -->
  <text x="10" y="25" class="info" font-size="14">${cameraId} - Frame ${frameNumber}</text>
  <text x="10" y="45" class="info" font-size="14">${detections.length} detections</text>

</svg>`

  return svg
}

function generateHTMLViewer(
  frameNumber: number,
  files: { sitemap: string; camera1?: string; camera2?: string },
  report: object
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frame ${frameNumber} Visualization</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    h1 { margin-bottom: 20px; color: #00bcd4; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 20px; }
    .panel { background: #16213e; border-radius: 8px; padding: 15px; }
    .panel h2 { margin-bottom: 10px; font-size: 16px; color: #ff9800; }
    .panel img, .panel object { max-width: 100%; height: auto; border-radius: 4px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px; }
    .stat { background: #0f3460; padding: 10px; border-radius: 4px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #4caf50; }
    .stat-label { font-size: 12px; color: #888; }
    pre { background: #0f3460; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Frame ${frameNumber} Visualization</h1>

  <div class="grid">
    <div class="panel" style="grid-column: span 2;">
      <h2>Sitemap with Projections</h2>
      <object data="${files.sitemap}" type="image/svg+xml" style="width: 100%;"></object>
    </div>

    ${files.camera1 ? `
    <div class="panel">
      <h2>Camera 1 Detections</h2>
      <object data="${files.camera1}" type="image/svg+xml" style="width: 100%;"></object>
    </div>
    ` : ''}

    ${files.camera2 ? `
    <div class="panel">
      <h2>Camera 2 Detections</h2>
      <object data="${files.camera2}" type="image/svg+xml" style="width: 100%;"></object>
    </div>
    ` : ''}

    <div class="panel" style="grid-column: span 2;">
      <h2>Report Data</h2>
      <pre>${JSON.stringify(report, null, 2)}</pre>
    </div>
  </div>
</body>
</html>`
}

// ============================================================================
// Main Visualization
// ============================================================================

async function generateVisualization(
  frameNumber: number,
  outputDir: string,
  projectRoot: string
) {
  console.log(`\nGenerating visualization for frame ${frameNumber}...`)

  // Load sitemap config (use frontend/public for consistency with tests)
  const sitemapPath = join(projectRoot, 'frontend/public/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)
  const roomWidth = sitemapConfig.dimensions.width
  const roomHeight = sitemapConfig.dimensions.height

  console.log(`Room dimensions: ${roomWidth}m x ${roomHeight}m`)

  // Load ground truths
  const groundTruths = loadGroundTruths(projectRoot)
  const frameAnnotations = groundTruths?.annotations.filter((a) =>
    a.linkedDetections.some((d) => d.frameNumber === frameNumber)
  ) || []

  console.log(`Found ${frameAnnotations.length} ground truth annotations for frame ${frameNumber}`)

  // Load detection files
  const detectionsDir = join(projectRoot, 'shared/cameras/preprocessed/1080p')
  const camera1DetPath = join(detectionsDir, 'view-HC3-preprocessed.detections.json')
  const camera2DetPath = join(detectionsDir, 'view-HC4-preprocessed.detections.json')

  const camera1Detections = await loadDetectionFile(camera1DetPath)
  const camera2Detections = await loadDetectionFile(camera2DetPath)

  // Get frame data
  const camera1Frame = camera1Detections?.frames.find((f) => f.frame_number === frameNumber)
  const camera2Frame = camera2Detections?.frames.find((f) => f.frame_number === frameNumber)

  console.log(`Camera 1 detections: ${camera1Frame?.detections.length || 0}`)
  console.log(`Camera 2 detections: ${camera2Frame?.detections.length || 0}`)

  // Create output directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const frameDir = join(outputDir, `frame-${frameNumber}-${timestamp}`)
  mkdirSync(frameDir, { recursive: true })

  console.log(`Output directory: ${frameDir}`)

  // Set up camera registry for K/R/T projection (same as integration tests)
  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  // Get camera params for legacy projection fallback
  const cameraParams: Record<string, ReturnType<typeof siteMapCameraToCameraParams>> = {}
  for (const cam of sitemapConfig.cameras) {
    cameraParams[cam.id] = siteMapCameraToCameraParams(cam as any)
  }

  // Collect data for SVG
  const groundTruthMarkers: Array<{ position: Point2D; label: string }> = []
  const projectionMarkers: Array<{ position: Point2D; cameraId: string; trackId: number }> = []
  const errorLines: Array<{ from: Point2D; to: Point2D; error: number }> = []

  const projectionResults: Array<{
    annotation: Annotation
    projections: Array<{ cameraId: string; trackId: number; position: Point2D }>
    errors: number[]
  }> = []

  for (const annotation of frameAnnotations) {
    groundTruthMarkers.push({
      position: annotation.groundPosition as Point2D,
      label: 'GT',
    })

    const projections: Array<{ cameraId: string; trackId: number; position: Point2D }> = []

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

      // Use K/R/T projection if calibration available (same as DetectionProcessor)
      const calibration = cameraRegistry.getCalibration(det.cameraId)
      let position: Point2D
      let isValid: boolean

      if (calibration) {
        const krtResult = projectDetectionWithKRT(bbox, calibration, params, [], true, 1920, 1080)
        position = krtResult.worldPoint
        isValid = krtResult.isValid
      } else {
        // Fall back to legacy projection
        const legacyResult = projectDetectionToGround(bbox, params, [], true, 1920, 1080)
        position = legacyResult.worldPoint
        isValid = legacyResult.isValid
      }

      // Apply camera-specific bias correction (same as DetectionProcessor)
      const biasCorrection = CAMERA_BIAS_CORRECTIONS[det.cameraId] ?? { x: 0, y: 0 }
      position = {
        x: position.x + biasCorrection.x,
        y: position.y + biasCorrection.y,
      }

      if (isValid) {
        projections.push({ cameraId: det.cameraId, trackId: det.trackId, position })
        projectionMarkers.push({ position, cameraId: det.cameraId, trackId: det.trackId })

        const error = Math.sqrt(
          Math.pow(position.x - annotation.groundPosition.x, 2) +
            Math.pow(position.y - annotation.groundPosition.y, 2)
        )
        errorLines.push({
          from: annotation.groundPosition as Point2D,
          to: position,
          error,
        })
      }
    }

    const errors = projections.map((p) =>
      Math.sqrt(
        Math.pow(p.position.x - annotation.groundPosition.x, 2) +
          Math.pow(p.position.y - annotation.groundPosition.y, 2)
      )
    )

    projectionResults.push({ annotation, projections, errors })
  }

  // Extract obstacles from sitemap
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

  // Generate sitemap SVG
  const sitemapSVG = generateSitemapSVG(
    roomWidth,
    roomHeight,
    sitemapConfig.cameras.map((c) => ({
      id: c.id,
      position: { x: c.position.x, y: c.position.y },
      azimuth: c.azimuth,
      fieldOfView: c.fieldOfView,
    })),
    obstacles,
    groundTruthMarkers,
    projectionMarkers,
    errorLines,
    frameNumber
  )
  writeFileSync(join(frameDir, 'sitemap.svg'), sitemapSVG)
  console.log('  ✓ sitemap.svg')

  // Generate bbox SVGs
  const files: { sitemap: string; camera1?: string; camera2?: string } = {
    sitemap: 'sitemap.svg',
  }

  if (camera1Frame && camera1Frame.detections.length > 0) {
    const bbox1SVG = generateBBoxSVG(camera1Frame.detections, 'camera1', frameNumber, 1920, 1080)
    writeFileSync(join(frameDir, 'camera1-bboxes.svg'), bbox1SVG)
    files.camera1 = 'camera1-bboxes.svg'
    console.log('  ✓ camera1-bboxes.svg')
  }

  if (camera2Frame && camera2Frame.detections.length > 0) {
    const bbox2SVG = generateBBoxSVG(camera2Frame.detections, 'camera2', frameNumber, 1920, 1080)
    writeFileSync(join(frameDir, 'camera2-bboxes.svg'), bbox2SVG)
    files.camera2 = 'camera2-bboxes.svg'
    console.log('  ✓ camera2-bboxes.svg')
  }

  // Generate report
  const report = {
    frameNumber,
    timestamp: new Date().toISOString(),
    room: { width: roomWidth, height: roomHeight },
    cameras: sitemapConfig.cameras.map((c) => ({
      id: c.id,
      position: c.position,
      azimuth: c.azimuth,
      elevation: c.elevation,
      fov: c.fieldOfView,
    })),
    detections: {
      camera1: camera1Frame?.detections.length || 0,
      camera2: camera2Frame?.detections.length || 0,
    },
    groundTruths: frameAnnotations.map((a) => ({
      id: a.id,
      position: a.groundPosition,
      confidence: a.confidence,
      linkedDetections: a.linkedDetections.filter((d) => d.frameNumber === frameNumber).length,
    })),
    projectionResults: projectionResults.map((r) => ({
      annotationId: r.annotation.id,
      groundTruth: r.annotation.groundPosition,
      projections: r.projections,
      errors: r.errors,
      avgError: r.errors.length > 0 ? r.errors.reduce((a, b) => a + b, 0) / r.errors.length : null,
    })),
    statistics: {
      totalAnnotations: frameAnnotations.length,
      totalProjections: projectionResults.reduce((sum, r) => sum + r.projections.length, 0),
      avgError:
        projectionResults.length > 0 && projectionResults.flatMap((r) => r.errors).length > 0
          ? projectionResults.flatMap((r) => r.errors).reduce((a, b) => a + b, 0) /
            projectionResults.flatMap((r) => r.errors).length
          : null,
    },
  }

  writeFileSync(join(frameDir, 'report.json'), JSON.stringify(report, null, 2))
  console.log('  ✓ report.json')

  // Generate HTML viewer
  const htmlViewer = generateHTMLViewer(frameNumber, files, report)
  writeFileSync(join(frameDir, 'index.html'), htmlViewer)
  console.log('  ✓ index.html')

  // Print summary
  console.log('\n=== Summary ===')
  console.log(`Ground truth annotations: ${frameAnnotations.length}`)
  console.log(`Total projections: ${report.statistics.totalProjections}`)
  if (report.statistics.avgError !== null) {
    console.log(`Average projection error: ${report.statistics.avgError.toFixed(3)}m`)
  }

  console.log(`\nOutput saved to: ${frameDir}`)
  console.log(`Open ${join(frameDir, 'index.html')} in a browser to view`)

  return frameDir
}

// ============================================================================
// CLI
// ============================================================================

const program = new Command()

program
  .name('capture-frame-visualization')
  .description('Capture sitemap visualization with detections and ground truths')
  .requiredOption('-f, --frame <number>', 'Frame number to visualize')
  .option('-o, --output <dir>', 'Output directory', './visualization-output')
  .option('--project-root <dir>', 'Project root directory')
  .action(async (options) => {
    const frameNumber = parseInt(options.frame, 10)
    const outputDir = options.output

    // Determine project root
    let projectRoot = options.projectRoot
    if (!projectRoot) {
      // Navigate up from tracking-service/src/cli to project root
      projectRoot = join(dirname(new URL(import.meta.url).pathname), '../../..')
    }

    if (isNaN(frameNumber) || frameNumber < 0) {
      console.error('Invalid frame number')
      process.exit(1)
    }

    try {
      await generateVisualization(frameNumber, outputDir, projectRoot)
    } catch (error) {
      console.error('Error generating visualization:', error)
      process.exit(1)
    }
  })

program.parse()
