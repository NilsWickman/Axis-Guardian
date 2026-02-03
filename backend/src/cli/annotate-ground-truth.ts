#!/usr/bin/env node
/**
 * Ground Truth Annotation Tool
 *
 * Helps create accurate worldPosition annotations by:
 * 1. Exporting video frames with detection bboxes drawn
 * 2. Exporting sitemap with coordinate grid overlay
 * 3. Interactive CLI to enter world coordinates for each detection
 *
 * Usage:
 *   pnpm cli:annotate-gt --export-frames   # Export frames with bboxes
 *   pnpm cli:annotate-gt --export-sitemap  # Export sitemap with grid
 *   pnpm cli:annotate-gt --annotate        # Interactive annotation mode
 */

import { Command } from 'commander'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import * as readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Annotation {
  id: string
  timestamp: number
  cameraId: string
  trackId: number
  personId?: number
  bbox: [number, number, number, number]
  confidence: number
  worldPosition?: { x: number; y: number }
}

interface AnnotationFile {
  version: string
  keyframeIntervalSeconds?: number
  videoDuration?: number
  cameras: string[]
  annotations: Annotation[]
}

interface SiteMap {
  dimensions: { width: number; height: number }
  cameras: Array<{ id: string; name: string; position: { x: number; y: number } }>
}

const program = new Command()

program
  .name('annotate-ground-truth')
  .description('Ground truth annotation tool for improving projection accuracy')

// ============================================================================
// Export Frames Command
// ============================================================================

program
  .command('export-frames')
  .description('Export video frames with detection bboxes drawn')
  .requiredOption('-v, --video <path>', 'Path to video file')
  .requiredOption('-d, --detections <path>', 'Path to detections JSON file')
  .option('-o, --output <dir>', 'Output directory', './annotation-frames')
  .option('-c, --camera <id>', 'Camera ID for this video', 'camera1')
  .option('--timestamps <list>', 'Comma-separated timestamps to export (default: all keyframes)')
  .action(async (options) => {
    const outputDir = resolve(options.output)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Load detections
    let detections: any
    if (options.detections.endsWith('.gz')) {
      const { gunzipSync } = await import('zlib')
      const compressed = readFileSync(options.detections)
      detections = JSON.parse(gunzipSync(compressed).toString())
    } else {
      detections = JSON.parse(readFileSync(options.detections, 'utf-8'))
    }

    // Get unique timestamps
    const timestamps = options.timestamps
      ? options.timestamps.split(',').map(Number)
      : [...new Set(detections.frames.map((f: any) => f.timestamp))].sort((a: number, b: number) => a - b)

    console.log(`Exporting ${timestamps.length} frames from ${options.video}`)
    console.log(`Output directory: ${outputDir}`)

    for (const ts of timestamps) {
      const frame = detections.frames.find((f: any) => Math.abs(f.timestamp - ts) < 0.1)
      if (!frame || frame.detections.length === 0) continue

      const outputFile = resolve(outputDir, `${options.camera}_t${ts.toFixed(1)}.png`)

      // Use ffmpeg to extract frame and draw bboxes
      // First extract the frame
      const tempFrame = resolve(outputDir, `temp_${ts}.png`)
      try {
        execSync(
          `ffmpeg -y -ss ${ts} -i "${options.video}" -vframes 1 -q:v 2 "${tempFrame}" 2>/dev/null`,
          { stdio: 'pipe' }
        )

        // Get video dimensions
        const probeOutput = execSync(
          `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${options.video}"`,
          { encoding: 'utf-8' }
        ).trim()
        const [width, height] = probeOutput.split(',').map(Number)

        // Build ffmpeg drawbox filter for all detections
        const drawFilters = frame.detections.map((det: any, idx: number) => {
          const [bx, by, bw, bh] = det.bbox
          const x = Math.round(bx * width)
          const y = Math.round(by * height)
          const w = Math.round(bw * width)
          const h = Math.round(bh * height)
          // Position label above bbox with contrasting colors for visibility
          const labelY = Math.max(y - 8, 20) // Keep label on screen
          return `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=green:thickness=3,` +
                 `drawtext=text='${idx + 1}':x=${x + 2}:y=${labelY}:fontsize=28:fontcolor=yellow:borderw=2:bordercolor=black`
        }).join(',')

        // Apply filters
        execSync(
          `ffmpeg -y -i "${tempFrame}" -vf "${drawFilters}" "${outputFile}" 2>/dev/null`,
          { stdio: 'pipe' }
        )

        // Clean up temp file
        execSync(`rm "${tempFrame}"`, { stdio: 'pipe' })

        // Write detection info to companion text file
        const infoFile = outputFile.replace('.png', '.txt')
        const info = frame.detections.map((det: any, idx: number) => {
          const [bx, by, bw, bh] = det.bbox
          return `${idx + 1}: bbox=[${bx.toFixed(3)}, ${by.toFixed(3)}, ${bw.toFixed(3)}, ${bh.toFixed(3)}] conf=${det.confidence.toFixed(2)}`
        }).join('\n')
        writeFileSync(infoFile, `Camera: ${options.camera}\nTimestamp: ${ts}s\n\nDetections:\n${info}\n`)

        console.log(`  Exported: ${basename(outputFile)} (${frame.detections.length} detections)`)
      } catch (err) {
        console.error(`  Failed to export frame at t=${ts}s:`, err)
      }
    }

    console.log('\nDone! Review frames in:', outputDir)
    console.log('Each frame has a .txt file listing detection numbers and bboxes')
  })

// ============================================================================
// Export Sitemap Command
// ============================================================================

program
  .command('export-sitemap')
  .description('Export sitemap image with coordinate grid')
  .option('-s, --sitemap <path>', 'Path to sitemap JSON', resolve(__dirname, '../../../frontend/public/sitemap-rectangular-room.json'))
  .option('-o, --output <file>', 'Output image file', './annotation-frames/sitemap-grid.png')
  .action(async (options) => {
    const sitemap: SiteMap = JSON.parse(readFileSync(options.sitemap, 'utf-8'))
    const { width, height } = sitemap.dimensions

    const outputDir = dirname(resolve(options.output))
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Create SVG with grid
    const scale = 30 // pixels per meter
    const svgWidth = width * scale
    const svgHeight = height * scale
    const padding = 50

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth + padding * 2}" height="${svgHeight + padding * 2}">
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  <g transform="translate(${padding}, ${padding})">
`

    // Draw grid lines every 2 meters
    for (let x = 0; x <= width; x += 2) {
      const px = x * scale
      svg += `    <line x1="${px}" y1="0" x2="${px}" y2="${svgHeight}" stroke="#333" stroke-width="1"/>\n`
      svg += `    <text x="${px}" y="${svgHeight + 20}" fill="#888" font-size="12" text-anchor="middle">${x}</text>\n`
    }
    for (let y = 0; y <= height; y += 2) {
      const py = (height - y) * scale  // Flip Y for screen coords
      svg += `    <line x1="0" y1="${py}" x2="${svgWidth}" y2="${py}" stroke="#333" stroke-width="1"/>\n`
      svg += `    <text x="-10" y="${py + 4}" fill="#888" font-size="12" text-anchor="end">${y}</text>\n`
    }

    // Draw camera positions
    for (const cam of sitemap.cameras) {
      const cx = cam.position.x * scale
      const cy = (height - cam.position.y) * scale
      svg += `    <circle cx="${cx}" cy="${cy}" r="8" fill="#4CAF50"/>\n`
      svg += `    <text x="${cx + 12}" y="${cy + 4}" fill="#4CAF50" font-size="11">${cam.id}</text>\n`
    }

    // Draw room outline (simplified)
    svg += `    <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="none" stroke="#666" stroke-width="2"/>\n`

    // Add axis labels
    svg += `    <text x="${svgWidth / 2}" y="${svgHeight + 40}" fill="#aaa" font-size="14" text-anchor="middle">X (meters)</text>\n`
    svg += `    <text x="-35" y="${svgHeight / 2}" fill="#aaa" font-size="14" text-anchor="middle" transform="rotate(-90, -35, ${svgHeight / 2})">Y (meters)</text>\n`

    svg += `  </g>
</svg>`

    // Write SVG
    const svgFile = options.output.replace('.png', '.svg')
    writeFileSync(svgFile, svg)
    console.log(`Exported sitemap SVG: ${svgFile}`)

    // Try to convert to PNG using ImageMagick or rsvg-convert
    try {
      execSync(`which convert`, { stdio: 'pipe' })
      execSync(`convert "${svgFile}" "${options.output}"`, { stdio: 'pipe' })
      console.log(`Exported sitemap PNG: ${options.output}`)
    } catch {
      console.log('Note: Install ImageMagick to auto-convert to PNG')
      console.log('Or open the SVG in a browser and save as PNG')
    }

    console.log(`\nSitemap dimensions: ${width}m x ${height}m`)
    console.log('Grid lines every 2 meters')
    console.log('Green dots = camera positions')
  })

// ============================================================================
// Annotate Command
// ============================================================================

program
  .command('annotate')
  .description('Interactive mode to enter world coordinates for detections')
  .requiredOption('-a, --annotations <path>', 'Path to annotations JSON file')
  .option('-o, --output <path>', 'Output file (default: overwrites input)')
  .option('--camera <id>', 'Only annotate specific camera')
  .option('--unannotated-only', 'Only show detections without worldPosition', false)
  .action(async (options) => {
    const annotationFile: AnnotationFile = JSON.parse(readFileSync(options.annotations, 'utf-8'))
    const outputPath = options.output || options.annotations

    let toAnnotate = annotationFile.annotations
    if (options.camera) {
      toAnnotate = toAnnotate.filter(a => a.cameraId === options.camera)
    }
    if (options.unannotatedOnly) {
      toAnnotate = toAnnotate.filter(a => !a.worldPosition)
    }

    console.log(`\nGround Truth Annotation Tool`)
    console.log(`============================`)
    console.log(`Annotations file: ${options.annotations}`)
    console.log(`Total annotations: ${annotationFile.annotations.length}`)
    console.log(`To annotate: ${toAnnotate.length}`)
    console.log(`\nFor each detection, enter world coordinates as "x,y" (e.g., "15.5,12.3")`)
    console.log(`Commands: skip (s), quit (q), back (b)\n`)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve)
      })
    }

    let annotated = 0
    let i = 0

    while (i < toAnnotate.length) {
      const ann = toAnnotate[i]
      const [bx, by, bw, bh] = ann.bbox
      const footX = ((bx + bw / 2) * 100).toFixed(1)
      const footY = ((by + bh) * 100).toFixed(1)

      console.log(`\n[${i + 1}/${toAnnotate.length}] ${ann.cameraId} @ t=${ann.timestamp}s`)
      console.log(`  Detection ID: ${ann.id}`)
      console.log(`  BBox: [${bx.toFixed(3)}, ${by.toFixed(3)}, ${bw.toFixed(3)}, ${bh.toFixed(3)}]`)
      console.log(`  Foot position (normalized %): (${footX}%, ${footY}%)`)
      if (ann.worldPosition) {
        console.log(`  Current worldPosition: (${ann.worldPosition.x.toFixed(2)}, ${ann.worldPosition.y.toFixed(2)})`)
      }

      const input = await question('  Enter x,y (or skip/quit/back): ')
      const trimmed = input.trim().toLowerCase()

      if (trimmed === 'q' || trimmed === 'quit') {
        break
      } else if (trimmed === 's' || trimmed === 'skip' || trimmed === '') {
        i++
        continue
      } else if (trimmed === 'b' || trimmed === 'back') {
        if (i > 0) i--
        continue
      }

      // Parse coordinates
      const match = input.match(/^\s*([\d.]+)\s*,\s*([\d.]+)\s*$/)
      if (match) {
        const x = parseFloat(match[1])
        const y = parseFloat(match[2])

        // Update annotation
        const originalIdx = annotationFile.annotations.findIndex(a => a.id === ann.id)
        if (originalIdx >= 0) {
          annotationFile.annotations[originalIdx].worldPosition = { x, y }
          console.log(`  ✓ Set worldPosition to (${x}, ${y})`)
          annotated++
        }
      } else {
        console.log(`  Invalid format. Use "x,y" (e.g., "15.5,12.3")`)
        continue  // Don't advance
      }

      i++
    }

    rl.close()

    // Save
    writeFileSync(outputPath, JSON.stringify(annotationFile, null, 2))
    console.log(`\nAnnotated ${annotated} detections`)
    console.log(`Saved to: ${outputPath}`)
  })

// ============================================================================
// Validate Command
// ============================================================================

program
  .command('validate')
  .description('Check annotation file for completeness')
  .requiredOption('-a, --annotations <path>', 'Path to annotations JSON file')
  .action((options) => {
    const annotationFile: AnnotationFile = JSON.parse(readFileSync(options.annotations, 'utf-8'))

    const total = annotationFile.annotations.length
    const withWorld = annotationFile.annotations.filter(a => a.worldPosition).length
    const byCamera: Record<string, { total: number; annotated: number }> = {}

    for (const ann of annotationFile.annotations) {
      if (!byCamera[ann.cameraId]) {
        byCamera[ann.cameraId] = { total: 0, annotated: 0 }
      }
      byCamera[ann.cameraId].total++
      if (ann.worldPosition) {
        byCamera[ann.cameraId].annotated++
      }
    }

    console.log(`\nAnnotation File: ${options.annotations}`)
    console.log(`Version: ${annotationFile.version}`)
    console.log(`\nOverall: ${withWorld}/${total} annotated (${(withWorld / total * 100).toFixed(1)}%)`)
    console.log(`\nBy Camera:`)
    for (const [camId, stats] of Object.entries(byCamera)) {
      const pct = (stats.annotated / stats.total * 100).toFixed(1)
      console.log(`  ${camId}: ${stats.annotated}/${stats.total} (${pct}%)`)
    }

    // List unannotated
    const unannotated = annotationFile.annotations.filter(a => !a.worldPosition)
    if (unannotated.length > 0 && unannotated.length <= 20) {
      console.log(`\nUnannotated detections:`)
      for (const ann of unannotated) {
        console.log(`  - ${ann.id} (${ann.cameraId} @ t=${ann.timestamp}s)`)
      }
    }
  })

program.parse()
