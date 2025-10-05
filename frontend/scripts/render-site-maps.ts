#!/usr/bin/env tsx

/**
 * Site Map Renderer Script
 *
 * This script renders all site maps to PNG images for visualization and iteration.
 * Run with: npm run render-maps
 */

import { createCanvas, loadImage, Canvas, SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get directory paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'output', 'rendered-maps')

// ============================================================================
// Type Definitions (matching the application types)
// ============================================================================

interface Point {
  x: number
  y: number
}

interface LineSegment {
  start: Point
  end: Point
}

interface Wall {
  id: string
  start: Point
  end: Point
  type?: 'external' | 'internal' | 'door'
  thickness?: number
}

interface CameraPlacement {
  cameraId: string
  x: number
  y: number
  rotation: number
  angle: number
  height: number
  fov: number
  viewDistance: number
  autoCalculateDistance: boolean
  color: string
  notes?: string
}

interface SiteMap {
  id: string
  name: string
  description?: string
  imagePath?: string
  width: number
  height: number
  scale: number
  cameras: CameraPlacement[]
  walls: Wall[]
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Geometry Utilities (replicated from useGeometry.ts)
// ============================================================================

function getLineIntersection(line1: LineSegment, line2: LineSegment): Point | null {
  const x1 = line1.start.x
  const y1 = line1.start.y
  const x2 = line1.end.x
  const y2 = line1.end.y
  const x3 = line2.start.x
  const y3 = line2.start.y
  const x4 = line2.end.x
  const y4 = line2.end.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

  if (Math.abs(denom) < 1e-10) {
    return null
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    }
  }

  return null
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

function castRay(
  origin: Point,
  direction: { x: number; y: number },
  maxDistance: number,
  walls: LineSegment[]
): Point {
  const rayEnd: Point = {
    x: origin.x + direction.x * maxDistance,
    y: origin.y + direction.y * maxDistance,
  }

  const ray: LineSegment = { start: origin, end: rayEnd }

  let closestIntersection: Point | null = null
  let closestDistance = Infinity

  for (const wall of walls) {
    const intersection = getLineIntersection(ray, wall)
    if (intersection) {
      const dist = distance(origin, intersection)
      if (dist < closestDistance) {
        closestDistance = dist
        closestIntersection = intersection
      }
    }
  }

  return closestIntersection || rayEnd
}

function calculateVisibleFOV(
  cameraPosition: Point,
  rotation: number,
  fov: number,
  viewDistance: number,
  walls: LineSegment[]
): Point[] {
  const rotationRad = (rotation * Math.PI) / 180
  const halfFovRad = (fov / 2) * (Math.PI) / 180

  const rightAngle = rotationRad + halfFovRad

  const numRays = Math.max(Math.floor(fov / 2), 20)
  const angleStep = (fov * Math.PI / 180) / numRays

  const visiblePoints: Point[] = [cameraPosition]

  for (let i = 0; i <= numRays; i++) {
    const angle = rightAngle - i * angleStep
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    }

    const hitPoint = castRay(cameraPosition, direction, viewDistance, walls)
    visiblePoints.push(hitPoint)
  }

  visiblePoints.push(cameraPosition)

  return visiblePoints
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillStyle?: string,
  strokeStyle?: string,
  lineWidth?: number
) {
  if (points.length < 3) return

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  ctx.closePath()

  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth || 2
    ctx.stroke()
  }
}

// ============================================================================
// Color Utilities
// ============================================================================

const TAILWIND_COLORS: Record<string, string> = {
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
  'amber-400': '#fbbf24',
  'amber-500': '#f59e0b',
  'amber-600': '#d97706',
  'yellow-400': '#facc15',
  'yellow-500': '#eab308',
  'yellow-600': '#ca8a04',
  'lime-400': '#a3e635',
  'lime-500': '#84cc16',
  'lime-600': '#65a30d',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'teal-600': '#0d9488',
  'cyan-400': '#22d3ee',
  'cyan-500': '#06b6d4',
  'cyan-600': '#0891b2',
  'sky-400': '#38bdf8',
  'sky-500': '#0ea5e9',
  'sky-600': '#0284c7',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'indigo-400': '#818cf8',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'violet-400': '#a78bfa',
  'violet-500': '#8b5cf6',
  'violet-600': '#7c3aed',
  'purple-400': '#c084fc',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'fuchsia-400': '#e879f9',
  'fuchsia-500': '#d946ef',
  'fuchsia-600': '#c026d3',
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',
  'rose-400': '#fb7185',
  'rose-500': '#f43f5e',
  'rose-600': '#e11d48',
}

function tailwindColorToHex(color: string): string {
  if (color.startsWith('#')) return color
  const cleanColor = color.replace(/^bg-/, '')
  return TAILWIND_COLORS[cleanColor] || '#6366f1'
}

// ============================================================================
// Rendering Functions
// ============================================================================

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, pixelsPerMeter: number) {
  ctx.save()
  ctx.strokeStyle = '#2a2a3e'
  ctx.lineWidth = 1

  // Vertical lines
  for (let x = 0; x < width; x += pixelsPerMeter) {
    const meters = x / pixelsPerMeter
    const isMajorLine = meters % 5 === 0

    ctx.lineWidth = isMajorLine ? 2 : 1
    ctx.strokeStyle = isMajorLine ? '#3a3a4e' : '#2a2a3e'

    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    if (isMajorLine && meters > 0) {
      ctx.fillStyle = '#6a6a7e'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${meters}m`, x, 15)
    }
  }

  // Horizontal lines
  for (let y = 0; y < height; y += pixelsPerMeter) {
    const meters = y / pixelsPerMeter
    const isMajorLine = meters % 5 === 0

    ctx.lineWidth = isMajorLine ? 2 : 1
    ctx.strokeStyle = isMajorLine ? '#3a3a4e' : '#2a2a3e'

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()

    if (isMajorLine && meters > 0) {
      ctx.fillStyle = '#6a6a7e'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${meters}m`, 5, y - 3)
    }
  }

  ctx.restore()
}

function drawScaleReference(ctx: CanvasRenderingContext2D, width: number, height: number, pixelsPerMeter: number) {
  ctx.save()

  const totalWidthMeters = width / pixelsPerMeter
  const barHeight = 40
  const barY = height - barHeight

  // Top border
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, barY)
  ctx.lineTo(width, barY)
  ctx.stroke()

  let meterInterval = 1
  const numTicks = totalWidthMeters / meterInterval

  if (numTicks > 40) meterInterval = 5
  else if (numTicks > 20) meterInterval = 2
  else if (numTicks < 5) meterInterval = 0.5

  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.lineWidth = 1.5

  for (let meters = 0; meters <= totalWidthMeters; meters += meterInterval) {
    const x = meters * pixelsPerMeter

    const isMajorTick = meters % (meterInterval * 5) === 0 || meters === 0
    const tickHeight = isMajorTick ? 15 : 10

    ctx.beginPath()
    ctx.moveTo(x, barY)
    ctx.lineTo(x, barY + tickHeight)
    ctx.stroke()

    if (isMajorTick) {
      const label = meters % 1 === 0 ? `${meters}m` : `${meters.toFixed(1)}m`
      ctx.fillText(label, x, barY + 28)
    }
  }

  ctx.restore()
}

function drawWalls(ctx: CanvasRenderingContext2D, walls: Wall[]) {
  if (!walls || walls.length === 0) return

  ctx.save()

  walls.forEach((wall) => {
    const { start, end, type = 'internal', thickness = 4 } = wall

    const wallStyles = {
      external: { color: '#ffffff', width: thickness + 2 },
      internal: { color: '#cccccc', width: thickness },
      door: { color: '#60a5fa', width: thickness - 1 },
    }

    const style = wallStyles[type] || wallStyles.internal

    ctx.strokeStyle = style.color
    ctx.lineWidth = style.width
    ctx.lineCap = 'round'

    if (type === 'door') {
      ctx.setLineDash([8, 6])
      ctx.strokeStyle = '#60a5fa'
    } else {
      ctx.setLineDash([])
    }

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.setLineDash([])
  })

  ctx.restore()
}

function drawCamera(
  ctx: CanvasRenderingContext2D,
  placement: CameraPlacement,
  getCameraName: (id: string) => string,
  walls: Wall[],
  showLabels: boolean = true
) {
  const { x, y, rotation, angle, fov, viewDistance, color } = placement

  const hexColor = tailwindColorToHex(color)

  // Convert walls to line segments
  const wallSegments: LineSegment[] = walls.map(wall => ({
    start: wall.start,
    end: wall.end
  }))

  // Calculate visible FOV with wall occlusion
  const visiblePolygon = calculateVisibleFOV(
    { x, y },
    rotation,
    fov,
    viewDistance,
    wallSegments
  )

  // Draw FOV cone
  const fillStyle = `${hexColor}30`
  const strokeStyle = `${hexColor}cc`
  const lineWidth = 2

  drawPolygon(ctx, visiblePolygon, fillStyle, strokeStyle, lineWidth)

  // Draw camera icon
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)

  // Camera body
  ctx.beginPath()
  ctx.rect(-15, -10, 30, 20)
  ctx.fillStyle = hexColor
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // Camera lens
  ctx.beginPath()
  ctx.arc(12, 0, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#1a1a2e'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Angle indicator
  if (angle > 0 && angle < 90) {
    const angleIndicatorLength = 20
    const angleRad = (angle * Math.PI) / 180

    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.arc(15, 0, angleIndicatorLength, Math.PI / 2, Math.PI / 2 + angleRad, true)
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 2
    ctx.stroke()

    const endX = 15 + angleIndicatorLength * Math.sin(angleRad)
    const endY = angleIndicatorLength * Math.cos(angleRad)

    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - 3, endY - 3)
    ctx.lineTo(endX + 3, endY - 3)
    ctx.closePath()
    ctx.fillStyle = '#f87171'
    ctx.fill()
  }

  ctx.restore()

  // Camera label
  if (showLabels) {
    ctx.fillStyle = '#cccccc'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(getCameraName(placement.cameraId), x, y - 25)

    if (angle > 0 && angle < 90) {
      ctx.font = '10px monospace'
      ctx.fillStyle = '#f87171'
      ctx.textAlign = 'center'
      ctx.fillText(`▼ ${angle}°`, x, y - 10)
    }
  }
}

async function drawBackgroundImage(ctx: CanvasRenderingContext2D, imagePath: string, width: number, height: number) {
  try {
    const fullPath = path.join(rootDir, imagePath)
    const img = await loadImage(fullPath)

    ctx.save()
    ctx.globalAlpha = 0.7
    ctx.drawImage(img, 0, 0, width, height)
    ctx.restore()

    console.log(`  ✓ Loaded background image: ${imagePath}`)
  } catch (error) {
    console.log(`  ⚠ Could not load background image: ${imagePath}`)
  }
}

// ============================================================================
// Site Map Data (from siteMaps store)
// ============================================================================

const siteMaps: SiteMap[] = [
  {
    id: 'map-warehouse-main',
    name: 'Site Map 2',
    description: 'Residential apartment with kitchen, living areas, and bedrooms',
    imagePath: 'src/mocks/floorplans/floorplan1.png',
    width: 795,
    height: 1011,
    scale: 80,
    walls: [
      { id: 'w-ext-1', start: { x: 60, y: 60 }, end: { x: 735, y: 60 }, type: 'external', thickness: 6 },
      { id: 'w-ext-2', start: { x: 735, y: 60 }, end: { x: 735, y: 950 }, type: 'external', thickness: 6 },
      { id: 'w-ext-3', start: { x: 735, y: 950 }, end: { x: 60, y: 950 }, type: 'external', thickness: 6 },
      { id: 'w-ext-4', start: { x: 60, y: 950 }, end: { x: 60, y: 60 }, type: 'external', thickness: 6 },
      { id: 'w-int-1', start: { x: 60, y: 290 }, end: { x: 150, y: 290 }, type: 'internal', thickness: 4 },
      { id: 'w-int-2', start: { x: 350, y: 60 }, end: { x: 350, y: 290 }, type: 'internal', thickness: 4 },
      { id: 'w-int-3', start: { x: 60, y: 290 }, end: { x: 540, y: 290 }, type: 'internal', thickness: 4 },
      { id: 'w-int-4', start: { x: 280, y: 290 }, end: { x: 280, y: 615 }, type: 'internal', thickness: 4 },
      { id: 'w-int-5', start: { x: 540, y: 290 }, end: { x: 540, y: 615 }, type: 'internal', thickness: 4 },
      { id: 'w-int-6', start: { x: 60, y: 615 }, end: { x: 735, y: 615 }, type: 'internal', thickness: 4 },
      { id: 'w-int-7', start: { x: 60, y: 750 }, end: { x: 350, y: 750 }, type: 'internal', thickness: 4 },
      { id: 'w-int-8', start: { x: 350, y: 750 }, end: { x: 350, y: 950 }, type: 'internal', thickness: 4 },
      { id: 'w-int-9', start: { x: 540, y: 615 }, end: { x: 540, y: 750 }, type: 'internal', thickness: 4 },
    ],
    cameras: [
      {
        cameraId: 'cam-01',
        x: 120, y: 120,
        rotation: 135,
        angle: 35,
        height: 2.4,
        fov: 90,
        viewDistance: 150,
        autoCalculateDistance: true,
        color: 'emerald-400',
        notes: 'Living room corner view',
      },
      {
        cameraId: 'cam-02',
        x: 650, y: 150,
        rotation: 225,
        angle: 35,
        height: 2.4,
        fov: 100,
        viewDistance: 160,
        autoCalculateDistance: true,
        color: 'blue-500',
        notes: 'Bedroom entrance coverage',
      },
      {
        cameraId: 'cam-03',
        x: 400, y: 450,
        rotation: 180,
        angle: 40,
        height: 2.6,
        fov: 110,
        viewDistance: 140,
        autoCalculateDistance: true,
        color: 'red-500',
        notes: 'Hallway and stairs monitoring',
      },
      {
        cameraId: 'cam-04',
        x: 200, y: 850,
        rotation: 90,
        angle: 35,
        height: 2.4,
        fov: 95,
        viewDistance: 130,
        autoCalculateDistance: true,
        color: 'amber-400',
        notes: 'Bathroom and bedroom area',
      },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'map-office-building',
    name: 'Site Map 1',
    description: 'Ground floor with offices, conference rooms, and stairwell',
    imagePath: 'src/mocks/floorplans/floorplan2.png',
    width: 700,
    height: 612,
    scale: 60,
    walls: [
      { id: 'w-ext-1', start: { x: 20, y: 20 }, end: { x: 680, y: 20 }, type: 'external', thickness: 6 },
      { id: 'w-ext-2', start: { x: 680, y: 20 }, end: { x: 680, y: 592 }, type: 'external', thickness: 6 },
      { id: 'w-ext-3', start: { x: 680, y: 592 }, end: { x: 20, y: 592 }, type: 'external', thickness: 6 },
      { id: 'w-ext-4', start: { x: 20, y: 592 }, end: { x: 20, y: 20 }, type: 'external', thickness: 6 },
      { id: 'w-int-1', start: { x: 20, y: 110 }, end: { x: 140, y: 110 }, type: 'internal', thickness: 4 },
      { id: 'w-int-2', start: { x: 140, y: 110 }, end: { x: 140, y: 380 }, type: 'internal', thickness: 4 },
      { id: 'w-int-3', start: { x: 140, y: 380 }, end: { x: 20, y: 380 }, type: 'internal', thickness: 4 },
      { id: 'w-int-4', start: { x: 140, y: 200 }, end: { x: 420, y: 200 }, type: 'internal', thickness: 4 },
      { id: 'w-int-5', start: { x: 140, y: 380 }, end: { x: 420, y: 380 }, type: 'internal', thickness: 4 },
      { id: 'w-int-6', start: { x: 420, y: 20 }, end: { x: 420, y: 200 }, type: 'internal', thickness: 4 },
      { id: 'w-int-7', start: { x: 420, y: 380 }, end: { x: 420, y: 592 }, type: 'internal', thickness: 4 },
      { id: 'w-int-8', start: { x: 550, y: 200 }, end: { x: 550, y: 380 }, type: 'internal', thickness: 4 },
      { id: 'w-int-9', start: { x: 320, y: 20 }, end: { x: 320, y: 100 }, type: 'internal', thickness: 4 },
    ],
    cameras: [
      {
        cameraId: 'cam-05',
        x: 80, y: 240,
        rotation: 90,
        angle: 30,
        height: 2.8,
        fov: 90,
        viewDistance: 120,
        autoCalculateDistance: true,
        color: 'purple-500',
        notes: 'Stairwell monitoring',
      },
      {
        cameraId: 'cam-06',
        x: 600, y: 100,
        rotation: 225,
        angle: 35,
        height: 2.8,
        fov: 100,
        viewDistance: 140,
        autoCalculateDistance: true,
        color: 'pink-500',
        notes: 'Upper office corridor',
      },
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'map-parking-lot',
    name: 'Site Map 3',
    description: 'Main floor with bedrooms, kitchen, family room, and bathroom',
    imagePath: 'src/mocks/floorplans/floorplan3.png',
    width: 2732,
    height: 1908,
    scale: 105,
    walls: [
      { id: 'w-ext-1', start: { x: 410, y: 145 }, end: { x: 2280, y: 145 }, type: 'external', thickness: 8 },
      { id: 'w-ext-2', start: { x: 2280, y: 145 }, end: { x: 2280, y: 1420 }, type: 'external', thickness: 8 },
      { id: 'w-ext-3', start: { x: 2280, y: 1420 }, end: { x: 410, y: 1420 }, type: 'external', thickness: 8 },
      { id: 'w-ext-4', start: { x: 410, y: 1420 }, end: { x: 410, y: 145 }, type: 'external', thickness: 8 },
      { id: 'w-ext-5', start: { x: 410, y: 1420 }, end: { x: 410, y: 1660 }, type: 'external', thickness: 8 },
      { id: 'w-ext-6', start: { x: 410, y: 1660 }, end: { x: 2280, y: 1660 }, type: 'external', thickness: 8 },
      { id: 'w-ext-7', start: { x: 2280, y: 1660 }, end: { x: 2280, y: 1420 }, type: 'external', thickness: 8 },
      { id: 'w-int-1', start: { x: 410, y: 280 }, end: { x: 800, y: 280 }, type: 'internal', thickness: 5 },
      { id: 'w-int-2', start: { x: 800, y: 280 }, end: { x: 800, y: 680 }, type: 'internal', thickness: 5 },
      { id: 'w-int-3', start: { x: 800, y: 680 }, end: { x: 410, y: 680 }, type: 'internal', thickness: 5 },
      { id: 'w-int-4', start: { x: 800, y: 145 }, end: { x: 800, y: 420 }, type: 'internal', thickness: 5 },
      { id: 'w-int-5', start: { x: 800, y: 420 }, end: { x: 1220, y: 420 }, type: 'internal', thickness: 5 },
      { id: 'w-int-6', start: { x: 1220, y: 145 }, end: { x: 1220, y: 680 }, type: 'internal', thickness: 5 },
      { id: 'w-int-7', start: { x: 1220, y: 680 }, end: { x: 1660, y: 680 }, type: 'internal', thickness: 5 },
      { id: 'w-int-8', start: { x: 1660, y: 420 }, end: { x: 1660, y: 1020 }, type: 'internal', thickness: 5 },
      { id: 'w-int-9', start: { x: 410, y: 1020 }, end: { x: 1010, y: 1020 }, type: 'internal', thickness: 5 },
      { id: 'w-int-10', start: { x: 1010, y: 1020 }, end: { x: 1010, y: 1420 }, type: 'internal', thickness: 5 },
    ],
    cameras: [
      {
        cameraId: 'cam-02',
        x: 900, y: 800,
        rotation: 90,
        angle: 40,
        height: 2.4,
        fov: 110,
        viewDistance: 200,
        autoCalculateDistance: true,
        color: 'blue-500',
        notes: 'Hallway and family room entrance',
      },
      {
        cameraId: 'cam-05',
        x: 2150, y: 300,
        rotation: 225,
        angle: 35,
        height: 2.4,
        fov: 95,
        viewDistance: 180,
        autoCalculateDistance: true,
        color: 'purple-500',
        notes: 'Master bedroom coverage',
      },
      {
        cameraId: 'cam-06',
        x: 700, y: 1280,
        rotation: 45,
        angle: 38,
        height: 2.4,
        fov: 100,
        viewDistance: 190,
        autoCalculateDistance: true,
        color: 'pink-500',
        notes: 'Kitchen and dining area',
      },
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-10'),
  },
]

// Camera names mapping
const cameraNames: Record<string, string> = {
  'cam-01': 'Front Entrance',
  'cam-02': 'Parking Lot',
  'cam-03': 'Warehouse',
  'cam-04': 'Loading Dock',
  'cam-05': 'Back Entrance',
  'cam-06': 'Perimeter North',
}

function getCameraName(id: string): string {
  return cameraNames[id] || id
}

// ============================================================================
// Main Rendering Function
// ============================================================================

async function renderSiteMap(siteMap: SiteMap, options: {
  showGrid: boolean
  showScaleReference: boolean
  showCameraLabels: boolean
  showBackgroundImage: boolean
}): Promise<Canvas> {
  const { width, height, scale: pixelsPerMeter } = siteMap
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, width, height)

  // Background image (if enabled and available)
  if (options.showBackgroundImage && siteMap.imagePath) {
    await drawBackgroundImage(ctx, siteMap.imagePath, width, height)
  }

  // Grid
  if (options.showGrid) {
    drawGrid(ctx, width, height, pixelsPerMeter)
  }

  // Walls
  drawWalls(ctx, siteMap.walls)

  // Cameras
  siteMap.cameras.forEach(camera => {
    drawCamera(ctx, camera, getCameraName, siteMap.walls, options.showCameraLabels)
  })

  // Scale reference (drawn last so it appears on top)
  if (options.showScaleReference) {
    drawScaleReference(ctx, width, height, pixelsPerMeter)
  }

  return canvas
}

async function main() {
  console.log('🎨 Site Map Renderer\n')
  console.log(`Output directory: ${outputDir}\n`)

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const renderOptions = {
    showGrid: true,
    showScaleReference: true,
    showCameraLabels: true,
    showBackgroundImage: false, // Set to true to overlay floorplan images
  }

  console.log('Rendering site maps...\n')

  for (const siteMap of siteMaps) {
    console.log(`📍 ${siteMap.name} (${siteMap.id})`)
    console.log(`   ${siteMap.description}`)
    console.log(`   Size: ${siteMap.width}×${siteMap.height}px`)
    console.log(`   Cameras: ${siteMap.cameras.length}`)
    console.log(`   Walls: ${siteMap.walls.length}`)

    const canvas = await renderSiteMap(siteMap, renderOptions)

    // Generate filename from display name (e.g., "Site Map 2" -> "site-map-2.png")
    const filename = `${siteMap.name.toLowerCase().replace(/\s+/g, '-')}.png`
    const filepath = path.join(outputDir, filename)

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(filepath, buffer)

    console.log(`   ✅ Saved: ${filename}\n`)
  }

  console.log('✨ All site maps rendered successfully!')
  console.log(`\nOutput location: ${outputDir}`)
}

// Run the script
main().catch(console.error)
