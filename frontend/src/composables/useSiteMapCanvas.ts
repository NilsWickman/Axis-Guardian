import { ref, type Ref } from 'vue'
import type { CameraPlacement, Wall, Obstacle } from '../types/site-map-types'
import type { ZoneConfig } from '../stores/zones'
import { calculateVisibleFOV, drawPolygon, type Point, type LineSegment, type CircleObstacle, type RectangleObstacle, type HeightAwareOptions } from './useGeometry'
import {
  extractValue,
  metersToPixels,
  RENDER_SCALE
} from '../utils/siteMapConversion'

export interface CanvasRenderOptions {
  showGrid: boolean
  showScaleReference: boolean
  showCameraLabels: boolean
  pixelsPerMeter: number // Note: This is used for display but internal is always RENDER_SCALE
}

// Tailwind color map for canvas rendering
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

// Convert Tailwind color class to hex color
const tailwindColorToHex = (color: string): string => {
  // If already a hex color, return as is
  if (color.startsWith('#')) return color

  // Remove 'bg-' prefix if present
  const cleanColor = color.replace(/^bg-/, '')

  // Look up in color map
  return TAILWIND_COLORS[cleanColor] || '#6366f1' // default to indigo-500
}

export function useSiteMapCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: Ref<CanvasRenderOptions>
) {
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const hoveredCameraId = ref<string | null>(null)
  const animationFrameId = ref<number | null>(null)
  const backgroundImage = ref<HTMLImageElement | null>(null)
  const imageLoaded = ref(false)

  const initCanvas = () => {
    const canvas = canvasRef.value
    if (!canvas) return false

    ctx.value = canvas.getContext('2d')
    return !!ctx.value
  }

  const resizeCanvas = (width: number, height: number) => {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.width = width
    canvas.height = height
  }

  const clearCanvas = () => {
    const canvas = canvasRef.value
    if (!canvas || !ctx.value) return

    ctx.value.clearRect(0, 0, canvas.width, canvas.height)
  }

  const loadBackgroundImage = (imagePath?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!imagePath) {
        backgroundImage.value = null
        imageLoaded.value = false
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        backgroundImage.value = img
        imageLoaded.value = true
        resolve()
      }
      img.onerror = () => {
        console.error(`Failed to load floorplan image: ${imagePath}`)
        backgroundImage.value = null
        imageLoaded.value = false
        reject(new Error(`Failed to load image: ${imagePath}`))
      }
      img.src = imagePath
    })
  }

  const drawBackgroundImage = () => {
    const canvas = canvasRef.value
    if (!canvas || !ctx.value || !backgroundImage.value || !imageLoaded.value) return

    const context = ctx.value

    // Draw the background image to fit the canvas
    context.save()
    context.globalAlpha = 0.7 // Make it semi-transparent so overlays are visible
    context.drawImage(backgroundImage.value, 0, 0, canvas.width, canvas.height)
    context.restore()
  }

  const drawGrid = () => {
    const canvas = canvasRef.value
    if (!canvas || !ctx.value || !options.value.showGrid) return

    // Always use RENDER_SCALE for grid rendering
    const pixelsPerMeter = RENDER_SCALE
    const context = ctx.value

    context.save()

    // Calculate actual canvas dimensions in meters
    const widthInMeters = Math.ceil(canvas.width / pixelsPerMeter)
    const heightInMeters = Math.ceil(canvas.height / pixelsPerMeter)

    console.log(`Drawing grid: ${widthInMeters}m × ${heightInMeters}m (${canvas.width}px × ${canvas.height}px) at ${RENDER_SCALE}px/m`)

    // Draw vertical lines - every meter
    for (let meters = 0; meters <= widthInMeters; meters++) {
      const x = meters * pixelsPerMeter
      const isMajorLine = meters % 10 === 0  // Major lines every 10m for large grids
      const isMinorMajorLine = meters % 5 === 0  // Minor major every 5m

      if (isMajorLine) {
        context.strokeStyle = '#4a4a5e'
        context.lineWidth = 3
      } else if (isMinorMajorLine) {
        context.strokeStyle = '#3a3a4e'
        context.lineWidth = 2
      } else {
        context.strokeStyle = '#2a2a3e'
        context.lineWidth = 1
      }

      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()

      // Draw labels on major lines
      if (isMajorLine && meters > 0) {
        context.fillStyle = '#9a9aae'
        context.font = 'bold 14px monospace'
        context.textAlign = 'center'
        context.fillText(`${meters}m`, x, 20)
      }
    }

    // Draw horizontal lines - every meter
    for (let meters = 0; meters <= heightInMeters; meters++) {
      const y = meters * pixelsPerMeter
      const isMajorLine = meters % 10 === 0
      const isMinorMajorLine = meters % 5 === 0

      if (isMajorLine) {
        context.strokeStyle = '#4a4a5e'
        context.lineWidth = 3
      } else if (isMinorMajorLine) {
        context.strokeStyle = '#3a3a4e'
        context.lineWidth = 2
      } else {
        context.strokeStyle = '#2a2a3e'
        context.lineWidth = 1
      }

      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()

      // Draw labels on major lines
      if (isMajorLine && meters > 0) {
        context.fillStyle = '#9a9aae'
        context.font = 'bold 14px monospace'
        context.textAlign = 'left'
        context.fillText(`${meters}m`, 8, y - 5)
      }
    }

    // Draw grid scale legend in top-left corner
    const legendX = 10
    const legendY = 50
    const legendSize = pixelsPerMeter

    // Draw background for legend
    context.fillStyle = 'rgba(0, 0, 0, 0.9)'
    context.fillRect(legendX - 5, legendY - 30, legendSize + 80, 60)

    // Draw 1-meter reference line
    context.strokeStyle = '#ffffff'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(legendX, legendY)
    context.lineTo(legendX + legendSize, legendY)
    context.stroke()

    // Draw tick marks at ends
    context.beginPath()
    context.moveTo(legendX, legendY - 5)
    context.lineTo(legendX, legendY + 5)
    context.moveTo(legendX + legendSize, legendY - 5)
    context.lineTo(legendX + legendSize, legendY + 5)
    context.stroke()

    // Draw label
    context.fillStyle = '#ffffff'
    context.font = 'bold 14px monospace'
    context.textAlign = 'center'
    context.fillText('1 METER', legendX + legendSize / 2, legendY + 20)

    // Add canvas dimensions info
    context.fillStyle = '#aaaaaa'
    context.font = '11px monospace'
    context.fillText(`${widthInMeters}m × ${heightInMeters}m`, legendX + legendSize / 2, legendY + 35)

    context.restore()
  }

  const drawScaleReference = () => {
    const canvas = canvasRef.value
    if (!canvas || !ctx.value || !options.value.showScaleReference) return

    const context = ctx.value
    const { pixelsPerMeter } = options.value

    context.save()

    // Calculate total width in meters
    const totalWidthMeters = canvas.width / pixelsPerMeter
    const barHeight = 40
    const barY = canvas.height - barHeight

    // Top border - white
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(0, barY)
    context.lineTo(canvas.width, barY)
    context.stroke()

    // Calculate appropriate tick spacing
    let meterInterval = 1
    const numTicks = totalWidthMeters / meterInterval

    // Adjust interval for better readability based on total width
    if (numTicks > 40) meterInterval = 5
    else if (numTicks > 20) meterInterval = 2
    else if (numTicks < 5) meterInterval = 0.5

    // Draw ticks and labels - white
    context.strokeStyle = '#ffffff'
    context.fillStyle = '#ffffff'
    context.font = '11px monospace'
    context.textAlign = 'center'
    context.lineWidth = 1.5

    for (let meters = 0; meters <= totalWidthMeters; meters += meterInterval) {
      const x = meters * pixelsPerMeter

      // Determine tick height - longer for major intervals
      const isMajorTick = meters % (meterInterval * 5) === 0 || meters === 0
      const tickHeight = isMajorTick ? 15 : 10

      // Draw tick
      context.beginPath()
      context.moveTo(x, barY)
      context.lineTo(x, barY + tickHeight)
      context.stroke()

      // Draw label for major ticks
      if (isMajorTick) {
        const label = meters % 1 === 0 ? `${meters}m` : `${meters.toFixed(1)}m`
        context.fillText(label, x, barY + 28)
      }
    }

    context.restore()
  }

  const drawWalls = (
    walls: Wall[],
    selectedWallId?: string | null,
    hoveredWallId?: string | null,
    hoveredPart?: 'start' | 'end' | 'body' | null
  ) => {
    if (!ctx.value || !walls || walls.length === 0) return

    const context = ctx.value

    context.save()

    walls.forEach((wall) => {
      const { start, end, type = 'internal', id } = wall
      const isSelected = selectedWallId === id
      const isHovered = hoveredWallId === id

      // Convert meter coordinates to pixels for rendering
      const startX = metersToPixels(extractValue(start.x))
      const startY = metersToPixels(extractValue(start.y))
      const endX = metersToPixels(extractValue(end.x))
      const endY = metersToPixels(extractValue(end.y))

      // Wall styling based on type (fixed line widths)
      const wallStyles = {
        external: { color: '#ffffff', width: 6 },
        internal: { color: '#cccccc', width: 4 },
        door: { color: '#60a5fa', width: 3 },
      }

      const style = wallStyles[type] || wallStyles.internal

      // Highlight selected or hovered wall
      if (isSelected) {
        context.strokeStyle = '#06b6d4' // cyan-500
        context.lineWidth = style.width + 4
      } else if (isHovered) {
        context.strokeStyle = '#f59e0b' // amber-500 for hover
        context.lineWidth = style.width + 3
      } else {
        context.strokeStyle = style.color
        context.lineWidth = style.width
      }

      context.lineCap = 'round'

      // Draw door differently (with a gap or arc)
      if (type === 'door') {
        // Draw door as a dashed line
        context.setLineDash([8, 6])
        if (!isSelected && !isHovered) {
          context.strokeStyle = '#60a5fa'
        }
      } else {
        context.setLineDash([])
      }

      context.beginPath()
      context.moveTo(startX, startY)
      context.lineTo(endX, endY)
      context.stroke()

      context.setLineDash([])

      // Draw handles for selected wall
      if (isSelected) {
        // Draw larger endpoint handles
        context.strokeStyle = '#1e293b' // slate-800
        context.lineWidth = 2
        context.fillStyle = '#06b6d4' // cyan-500

        // Start endpoint
        context.beginPath()
        context.arc(startX, startY, 7, 0, Math.PI * 2)
        context.fill()
        context.stroke()

        // End endpoint
        context.beginPath()
        context.arc(endX, endY, 7, 0, Math.PI * 2)
        context.fill()
        context.stroke()
      }

      // Draw hover feedback for endpoints when in edit mode
      if (isHovered && hoveredPart) {
        context.fillStyle = 'rgba(245, 158, 11, 0.5)' // Semi-transparent amber-500

        if (hoveredPart === 'start') {
          // Highlight start endpoint
          context.beginPath()
          context.arc(startX, startY, 10, 0, Math.PI * 2)
          context.fill()

          // Draw label
          context.fillStyle = '#ffffff'
          context.font = 'bold 11px sans-serif'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('DRAG', startX, startY - 18)
        } else if (hoveredPart === 'end') {
          // Highlight end endpoint
          context.beginPath()
          context.arc(endX, endY, 10, 0, Math.PI * 2)
          context.fill()

          // Draw label
          context.fillStyle = '#ffffff'
          context.font = 'bold 11px sans-serif'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('DRAG', endX, endY - 18)
        } else if (hoveredPart === 'body') {
          // Show that the whole wall can be moved (future feature)
          // For now, just show a subtle highlight
        }
      }
    })

    context.restore()
  }

  const drawPreviewWall = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    wallType: 'external' | 'internal' | 'door',
    _thickness: number // Ignored - we use fixed widths
  ) => {
    if (!ctx.value) return

    const context = ctx.value

    context.save()

    // Convert meter coordinates to pixels for rendering
    const startX = metersToPixels(start.x)
    const startY = metersToPixels(start.y)
    const endX = metersToPixels(end.x)
    const endY = metersToPixels(end.y)

    const wallStyles = {
      external: { color: '#ffffff', width: 6 },
      internal: { color: '#cccccc', width: 4 },
      door: { color: '#60a5fa', width: 3 },
    }

    const style = wallStyles[wallType] || wallStyles.internal

    context.strokeStyle = style.color
    context.globalAlpha = 0.6
    context.lineWidth = style.width
    context.lineCap = 'round'

    if (wallType === 'door') {
      context.setLineDash([8, 6])
    }

    context.beginPath()
    context.moveTo(startX, startY)
    context.lineTo(endX, endY)
    context.stroke()

    context.setLineDash([])

    // Draw endpoints
    context.fillStyle = style.color
    context.beginPath()
    context.arc(startX, startY, 4, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.arc(endX, endY, 4, 0, Math.PI * 2)
    context.fill()

    context.restore()
  }

  // Category-based default colors
  const OBSTACLE_CATEGORY_COLORS: Record<string, string> = {
    furniture: '#78716c',   // stone-500
    structural: '#64748b',  // slate-500
    equipment: '#1e293b',   // slate-800
  }

  // Zone type default colors
  const ZONE_TYPE_COLORS: Record<string, string> = {
    restricted: '#ef4444',  // red-500
    entry: '#22c55e',       // green-500
    exit: '#f97316',        // orange-500
    monitored: '#3b82f6',   // blue-500
  }

  const drawObstacles = (
    obstacles: Obstacle[],
    hoveredObstacleId?: string | null,
    selectedObstacleId?: string | null
  ) => {
    if (!ctx.value || !obstacles || obstacles.length === 0) return

    const context = ctx.value

    context.save()

    obstacles.forEach((obstacle) => {
      const { id, type, position, rotation = 0, category = 'furniture', color } = obstacle
      const isHovered = hoveredObstacleId === id
      const isSelected = selectedObstacleId === id

      // Convert position from meters to pixels
      const centerX = metersToPixels(extractValue(position.x))
      const centerY = metersToPixels(extractValue(position.y))

      // Get color (use provided color or category default)
      const baseColor = color || OBSTACLE_CATEGORY_COLORS[category] || OBSTACLE_CATEGORY_COLORS.furniture

      // Determine fill and stroke colors based on state
      let fillColor = baseColor
      let strokeColor = baseColor
      let lineWidth = 2

      if (isSelected) {
        strokeColor = '#06b6d4' // cyan-500
        lineWidth = 4
      } else if (isHovered) {
        strokeColor = '#f59e0b' // amber-500
        lineWidth = 3
      }

      // Add transparency to fill
      const fillAlpha = isSelected ? '80' : isHovered ? '60' : '40'
      if (fillColor.startsWith('#') && fillColor.length === 7) {
        fillColor = fillColor + fillAlpha
      }

      context.save()
      context.translate(centerX, centerY)

      // Apply rotation (convert degrees to radians, rotation is clockwise)
      if (rotation !== 0) {
        context.rotate((rotation * Math.PI) / 180)
      }

      if (type === 'rectangle' && obstacle.dimensions) {
        const width = metersToPixels(extractValue(obstacle.dimensions.width))
        const height = metersToPixels(extractValue(obstacle.dimensions.height))

        // Draw rectangle centered at position
        context.fillStyle = fillColor
        context.fillRect(-width / 2, -height / 2, width, height)

        context.strokeStyle = strokeColor
        context.lineWidth = lineWidth
        context.strokeRect(-width / 2, -height / 2, width, height)

        // Draw category-specific patterns
        if (category === 'structural') {
          // Draw cross-hatch pattern for structural elements
          context.strokeStyle = `${baseColor}30`
          context.lineWidth = 1
          const step = 10
          for (let i = -width / 2; i < width / 2; i += step) {
            context.beginPath()
            context.moveTo(i, -height / 2)
            context.lineTo(i + height, height / 2)
            context.stroke()
          }
        } else if (category === 'equipment') {
          // Draw dashed border for equipment
          context.setLineDash([5, 3])
          context.strokeStyle = '#ffffff40'
          context.lineWidth = 1
          context.strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8)
          context.setLineDash([])
        }

      } else if (type === 'circle' && obstacle.radius !== undefined) {
        const radius = metersToPixels(extractValue(obstacle.radius))

        // Draw circle centered at position
        context.beginPath()
        context.arc(0, 0, radius, 0, Math.PI * 2)
        context.fillStyle = fillColor
        context.fill()
        context.strokeStyle = strokeColor
        context.lineWidth = lineWidth
        context.stroke()

        // Draw cross pattern for structural pillars
        if (category === 'structural') {
          context.strokeStyle = `${baseColor}50`
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(-radius * 0.6, 0)
          context.lineTo(radius * 0.6, 0)
          context.moveTo(0, -radius * 0.6)
          context.lineTo(0, radius * 0.6)
          context.stroke()
        }

      } else if (type === 'polygon' && obstacle.vertices && obstacle.vertices.length >= 3) {
        // Draw polygon
        const vertices = obstacle.vertices.map(v => ({
          x: metersToPixels(extractValue(v.x)) - centerX,
          y: metersToPixels(extractValue(v.y)) - centerY
        }))

        context.beginPath()
        context.moveTo(vertices[0].x, vertices[0].y)
        for (let i = 1; i < vertices.length; i++) {
          context.lineTo(vertices[i].x, vertices[i].y)
        }
        context.closePath()

        context.fillStyle = fillColor
        context.fill()
        context.strokeStyle = strokeColor
        context.lineWidth = lineWidth
        context.stroke()
      }

      context.restore()

      // Draw label if hovered or selected
      if ((isHovered || isSelected) && obstacle.label) {
        context.fillStyle = 'rgba(0, 0, 0, 0.8)'
        context.font = 'bold 12px sans-serif'
        const labelMetrics = context.measureText(obstacle.label)
        const labelPadding = 6
        const labelHeight = 20

        // Position label above the obstacle
        const labelX = centerX - labelMetrics.width / 2 - labelPadding
        const labelY = centerY - 30

        // Draw label background
        context.fillRect(
          labelX,
          labelY - labelHeight / 2,
          labelMetrics.width + labelPadding * 2,
          labelHeight
        )

        // Draw label text
        context.fillStyle = '#ffffff'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(obstacle.label, centerX, labelY)
      }
    })

    context.restore()
  }

  const findObstacleAtPoint = (
    x: number,
    y: number,
    obstacles: Obstacle[]
  ): Obstacle | null => {
    // x, y are in pixels from mouse position
    // Check in reverse order (top-most first)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i]
      const centerX = metersToPixels(extractValue(obstacle.position.x))
      const centerY = metersToPixels(extractValue(obstacle.position.y))
      const rotation = (obstacle.rotation ?? 0) * Math.PI / 180

      // Transform point to obstacle's local coordinate system
      const dx = x - centerX
      const dy = y - centerY

      // Apply inverse rotation
      const localX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation)
      const localY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation)

      if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        const halfWidth = metersToPixels(extractValue(obstacle.dimensions.width)) / 2
        const halfHeight = metersToPixels(extractValue(obstacle.dimensions.height)) / 2

        if (Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight) {
          return obstacle
        }
      } else if (obstacle.type === 'circle' && obstacle.radius !== undefined) {
        const radius = metersToPixels(extractValue(obstacle.radius))
        const distance = Math.sqrt(localX * localX + localY * localY)

        if (distance <= radius) {
          return obstacle
        }
      } else if (obstacle.type === 'polygon' && obstacle.vertices && obstacle.vertices.length >= 3) {
        // Point-in-polygon test using ray casting
        const vertices = obstacle.vertices.map(v => ({
          x: metersToPixels(extractValue(v.x)) - centerX,
          y: metersToPixels(extractValue(v.y)) - centerY
        }))

        let inside = false
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
          const xi = vertices[i].x, yi = vertices[i].y
          const xj = vertices[j].x, yj = vertices[j].y

          if (((yi > localY) !== (yj > localY)) &&
              (localX < (xj - xi) * (localY - yi) / (yj - yi) + xi)) {
            inside = !inside
          }
        }

        if (inside) {
          return obstacle
        }
      }
    }
    return null
  }

  /**
   * Draw restricted zones on the canvas
   */
  const drawZones = (
    zones: ZoneConfig[],
    hoveredZoneId?: string | null,
    selectedZoneId?: string | null,
    showLabels: boolean = true
  ) => {
    if (!ctx.value || !zones || zones.length === 0) return

    const context = ctx.value

    context.save()

    // Sort zones so disabled/lower-severity ones are drawn first (behind)
    const sortedZones = [...zones].sort((a, b) => {
      // Enabled zones on top
      if (a.enabled !== b.enabled) return a.enabled ? 1 : -1
      // Higher severity on top
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0)
    })

    sortedZones.forEach((zone) => {
      const { id, vertices, type, color, enabled, name } = zone
      const isHovered = hoveredZoneId === id
      const isSelected = selectedZoneId === id

      if (vertices.length < 3) return

      // Convert vertices from meters to pixels
      const pixelVertices = vertices.map(v => ({
        x: metersToPixels(v.x),
        y: metersToPixels(v.y)
      }))

      // Get zone color (use provided or type default)
      const baseColor = color || ZONE_TYPE_COLORS[type] || ZONE_TYPE_COLORS.restricted

      // Determine fill opacity based on state
      let fillOpacity = '33' // 20% default
      if (!enabled) {
        fillOpacity = '15' // 9% for disabled
      } else if (isSelected) {
        fillOpacity = '66' // 40% for selected
      } else if (isHovered) {
        fillOpacity = '4d' // 30% for hovered
      }

      // Determine stroke style
      let strokeStyle = baseColor
      let lineWidth = 2
      let lineDash: number[] = []

      if (isSelected) {
        strokeStyle = '#ffffff'
        lineWidth = 3
      } else if (isHovered) {
        strokeStyle = '#ffffff'
        lineWidth = 2.5
      } else if (!enabled) {
        lineDash = [5, 5]
      }

      // Non-restricted zones get dashed border
      if (type !== 'restricted' && !isSelected && !isHovered) {
        lineDash = [8, 4]
      }

      // Draw zone polygon
      context.beginPath()
      context.moveTo(pixelVertices[0].x, pixelVertices[0].y)
      for (let i = 1; i < pixelVertices.length; i++) {
        context.lineTo(pixelVertices[i].x, pixelVertices[i].y)
      }
      context.closePath()

      // Fill
      context.fillStyle = `${baseColor}${fillOpacity}`
      context.fill()

      // Stroke
      context.strokeStyle = strokeStyle
      context.lineWidth = lineWidth
      context.setLineDash(lineDash)
      context.stroke()
      context.setLineDash([])

      // Draw vertices for selected zones
      if (isSelected) {
        pixelVertices.forEach((vertex, index) => {
          context.beginPath()
          context.arc(vertex.x, vertex.y, 6, 0, Math.PI * 2)
          context.fillStyle = '#ffffff'
          context.fill()
          context.strokeStyle = baseColor
          context.lineWidth = 2
          context.stroke()

          // Draw vertex number
          context.fillStyle = '#000000'
          context.font = 'bold 10px monospace'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(String(index + 1), vertex.x, vertex.y)
        })
      }

      // Draw zone label at centroid
      if (showLabels && (enabled || isHovered || isSelected)) {
        const centroid = pixelVertices.reduce(
          (acc, v) => ({ x: acc.x + v.x / pixelVertices.length, y: acc.y + v.y / pixelVertices.length }),
          { x: 0, y: 0 }
        )

        // Label background
        context.font = 'bold 12px sans-serif'
        const labelText = name
        const labelMetrics = context.measureText(labelText)
        const labelPadding = 6
        const labelHeight = 20

        context.fillStyle = `${baseColor}dd`
        context.fillRect(
          centroid.x - labelMetrics.width / 2 - labelPadding,
          centroid.y - labelHeight / 2,
          labelMetrics.width + labelPadding * 2,
          labelHeight
        )

        // Label border
        context.strokeStyle = '#ffffff'
        context.lineWidth = 1
        context.strokeRect(
          centroid.x - labelMetrics.width / 2 - labelPadding,
          centroid.y - labelHeight / 2,
          labelMetrics.width + labelPadding * 2,
          labelHeight
        )

        // Label text
        context.fillStyle = '#ffffff'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(labelText, centroid.x, centroid.y)

        // Zone type icon/indicator below label
        if (type !== 'restricted') {
          context.font = '10px sans-serif'
          context.fillStyle = '#ffffffaa'
          const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
          context.fillText(typeLabel, centroid.x, centroid.y + 14)
        }
      }
    })

    context.restore()
  }

  /**
   * Draw a zone being drawn (preview)
   */
  const drawZonePreview = (
    vertices: { x: number; y: number }[],
    type: ZoneConfig['type'],
    color?: string,
    cursorPosition?: { x: number; y: number }
  ) => {
    if (!ctx.value || vertices.length === 0) return

    const context = ctx.value

    context.save()

    // Convert vertices from meters to pixels
    const pixelVertices = vertices.map(v => ({
      x: metersToPixels(v.x),
      y: metersToPixels(v.y)
    }))

    const baseColor = color || ZONE_TYPE_COLORS[type] || ZONE_TYPE_COLORS.restricted

    // Draw lines connecting vertices
    context.beginPath()
    context.moveTo(pixelVertices[0].x, pixelVertices[0].y)
    for (let i = 1; i < pixelVertices.length; i++) {
      context.lineTo(pixelVertices[i].x, pixelVertices[i].y)
    }

    // Draw line to cursor position if provided
    if (cursorPosition) {
      const cursorPixel = {
        x: metersToPixels(cursorPosition.x),
        y: metersToPixels(cursorPosition.y)
      }
      context.lineTo(cursorPixel.x, cursorPixel.y)

      // Draw dashed line back to first vertex (preview of closing)
      context.setLineDash([5, 5])
      context.lineTo(pixelVertices[0].x, pixelVertices[0].y)
    } else if (pixelVertices.length >= 3) {
      // Close the polygon
      context.closePath()
    }

    // Fill with transparency
    if (pixelVertices.length >= 3) {
      context.fillStyle = `${baseColor}33`
      context.fill()
    }

    // Stroke
    context.strokeStyle = baseColor
    context.lineWidth = 2
    context.stroke()
    context.setLineDash([])

    // Draw vertices
    pixelVertices.forEach((vertex, index) => {
      const isFirst = index === 0
      const radius = isFirst ? 8 : 5

      context.beginPath()
      context.arc(vertex.x, vertex.y, radius, 0, Math.PI * 2)
      context.fillStyle = isFirst ? '#ffffff' : baseColor
      context.fill()
      context.strokeStyle = isFirst ? baseColor : '#ffffff'
      context.lineWidth = 2
      context.stroke()

      // Draw "Close" indicator on first vertex when hovering near it
      if (isFirst && cursorPosition && pixelVertices.length >= 3) {
        const cursorPixel = {
          x: metersToPixels(cursorPosition.x),
          y: metersToPixels(cursorPosition.y)
        }
        const dist = Math.sqrt(
          Math.pow(cursorPixel.x - vertex.x, 2) + Math.pow(cursorPixel.y - vertex.y, 2)
        )
        if (dist < 20) {
          context.fillStyle = '#ffffff'
          context.font = 'bold 10px sans-serif'
          context.textAlign = 'center'
          context.fillText('Close', vertex.x, vertex.y - 15)
        }
      }
    })

    context.restore()
  }

  /**
   * Find zone at a given pixel coordinate
   */
  const findZoneAtPoint = (
    x: number,
    y: number,
    zones: ZoneConfig[]
  ): ZoneConfig | null => {
    // Check in reverse order (top-most first based on rendering order)
    const sortedZones = [...zones].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    })

    for (const zone of sortedZones) {
      if (zone.vertices.length < 3) continue

      // Convert vertices to pixels for hit testing
      const pixelVertices = zone.vertices.map(v => ({
        x: metersToPixels(v.x),
        y: metersToPixels(v.y)
      }))

      // Point-in-polygon test using ray casting
      let inside = false
      for (let i = 0, j = pixelVertices.length - 1; i < pixelVertices.length; j = i++) {
        const xi = pixelVertices[i].x, yi = pixelVertices[i].y
        const xj = pixelVertices[j].x, yj = pixelVertices[j].y

        if (((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
      }

      if (inside) {
        return zone
      }
    }
    return null
  }

  /**
   * Find zone vertex near a given pixel coordinate
   */
  const findZoneVertexAtPoint = (
    x: number,
    y: number,
    zone: ZoneConfig,
    threshold: number = 10
  ): { vertexIndex: number; vertex: { x: number; y: number } } | null => {
    for (let i = 0; i < zone.vertices.length; i++) {
      const vertex = zone.vertices[i]
      const pixelX = metersToPixels(vertex.x)
      const pixelY = metersToPixels(vertex.y)
      const dist = Math.sqrt(Math.pow(x - pixelX, 2) + Math.pow(y - pixelY, 2))
      if (dist <= threshold) {
        return { vertexIndex: i, vertex }
      }
    }
    return null
  }

  const drawWallMeasurements = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    _pixelsPerMeter: number = RENDER_SCALE // Ignored, always use RENDER_SCALE
  ) => {
    if (!ctx.value) return

    const context = ctx.value
    context.save()

    // Convert meter coordinates to pixels for rendering
    const startX = metersToPixels(start.x)
    const startY = metersToPixels(start.y)
    const endX = metersToPixels(end.x)
    const endY = metersToPixels(end.y)

    // Calculate distance in meters directly
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distanceMeters = Math.sqrt(dx * dx + dy * dy)
    const distanceCentimeters = distanceMeters * 100
    const angleDegrees = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI)

    // Calculate midpoint in pixels
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    // Format distance display with both meters and centimeters
    const metersWhole = Math.floor(distanceMeters)
    const centimetersRemainder = Math.round((distanceMeters - metersWhole) * 100)

    let distanceText: string
    let distanceSubtext: string

    if (distanceMeters >= 1) {
      // Display as "X.XXm" for primary, "X cm" for secondary
      distanceText = `${distanceMeters.toFixed(2)}m`
      distanceSubtext = `(${metersWhole}m ${centimetersRemainder}cm)`
    } else {
      // Display in cm if less than 1 meter
      distanceText = `${distanceCentimeters.toFixed(0)}cm`
      distanceSubtext = `(${distanceMeters.toFixed(3)}m)`
    }

    // Draw distance label with larger, more prominent styling
    context.font = 'bold 14px monospace'
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    // Measure text for background
    const metrics = context.measureText(distanceText)
    const padding = 6

    // Draw background box for distance
    context.fillStyle = 'rgba(6, 182, 212, 0.95)' // cyan-500 with high opacity
    const boxHeight = 42
    const boxWidth = Math.max(metrics.width + padding * 2, 140)
    context.fillRect(
      midX - boxWidth / 2,
      midY - 30,
      boxWidth,
      boxHeight
    )

    // Draw border
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(
      midX - boxWidth / 2,
      midY - 30,
      boxWidth,
      boxHeight
    )

    // Draw main distance text
    context.fillStyle = '#ffffff'
    context.fillText(distanceText, midX, midY - 18)

    // Draw subtext with meters and centimeters
    context.font = '11px monospace'
    context.fillStyle = '#e0f7fa'
    context.fillText(distanceSubtext, midX, midY - 2)

    // Draw angle label
    const angleText = `${angleDegrees.toFixed(1)}°`
    const angleMetrics = context.measureText(angleText)

    context.fillStyle = 'rgba(245, 158, 11, 0.95)' // amber-500
    const angleBoxWidth = angleMetrics.width + padding * 2
    context.fillRect(
      midX - angleBoxWidth / 2,
      midY + 16,
      angleBoxWidth,
      20
    )

    // Draw border for angle
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(
      midX - angleBoxWidth / 2,
      midY + 16,
      angleBoxWidth,
      20
    )

    context.font = 'bold 12px monospace'
    context.fillStyle = '#ffffff'
    context.fillText(angleText, midX, midY + 26)

    context.restore()
  }

  const drawCamera = (
    placement: CameraPlacement,
    getCameraName: (id: string) => string,
    isSelected: boolean = false,
    isPreview: boolean = false,
    walls: Wall[] = [],
    obstacles: Obstacle[] = [],
    otherCameraFOVs: Point[][] = [] // FOV polygons from other cameras for overlap detection
  ) => {
    if (!ctx.value) return

    const canvas = canvasRef.value
    if (!canvas) return

    const context = ctx.value

    // Extract values from unit objects
    const x = metersToPixels(extractValue(placement.position.x))
    const y = metersToPixels(extractValue(placement.position.y))
    const azimuth = extractValue(placement.azimuth)
    const elevation = extractValue(placement.elevation)
    const fov = extractValue(placement.fov)
    // Use fixed render distance for FOV visualization (cameras can see to horizon)
    const FOV_RENDER_DISTANCE_M = 50
    const viewDistance = metersToPixels(FOV_RENDER_DISTANCE_M)
    const color = placement.color

    const isHovered = hoveredCameraId.value === placement.cameraId

    // Convert Tailwind color to hex
    const hexColor = tailwindColorToHex(color)

    // Convert walls to line segments for ray-casting (in pixels)
    const wallSegments: LineSegment[] = walls.map(wall => ({
      start: {
        x: metersToPixels(extractValue(wall.start.x)),
        y: metersToPixels(extractValue(wall.start.y))
      },
      end: {
        x: metersToPixels(extractValue(wall.end.x)),
        y: metersToPixels(extractValue(wall.end.y))
      }
    }))

    // Convert obstacles to geometry types for ray-casting (only those that block view)
    const circleObstacles: CircleObstacle[] = []
    const rectangleObstacles: RectangleObstacle[] = []

    for (const obstacle of obstacles) {
      // Only include obstacles that block camera view
      if (obstacle.blocksView === false) continue

      if (obstacle.type === 'circle' && obstacle.radius !== undefined) {
        circleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToPixels(extractValue(obstacle.position.y))
          },
          radius: metersToPixels(extractValue(obstacle.radius)),
          obstacleHeight: obstacle.height // physical height in meters
        })
      } else if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        rectangleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToPixels(extractValue(obstacle.position.y))
          },
          width: metersToPixels(extractValue(obstacle.dimensions.width)),
          height: metersToPixels(extractValue(obstacle.dimensions.height)),
          rotation: obstacle.rotation,
          obstacleHeight: obstacle.height // physical height in meters
        })
      }
    }

    // Get camera height for height-aware occlusion
    const cameraHeight = extractValue(placement.height)

    // Height-aware occlusion options
    // Target height is the typical person detection height (~1.7m)
    const heightOptions: HeightAwareOptions = {
      cameraHeight,
      targetHeight: 1.7, // person height
      pixelsPerMeter: RENDER_SCALE
    }

    // Calculate visible FOV with wall and obstacle occlusion (height-aware)
    const visiblePolygon = calculateVisibleFOV(
      { x, y },
      azimuth,
      fov,
      viewDistance,
      wallSegments,
      circleObstacles,
      rectangleObstacles,
      heightOptions
    )

    // Draw FOV cone with wall occlusion
    const fillStyle = isPreview
      ? `${hexColor}40`
      : isSelected
        ? `${hexColor}50`
        : `${hexColor}30`

    const strokeStyle = isSelected || isHovered ? '#ffffff' : `${hexColor}cc`
    const lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2

    drawPolygon(context, visiblePolygon, fillStyle, strokeStyle, lineWidth)

    // Note: Ground shadow zone drawing is disabled pending coordinate system fixes
    // The feature would show areas where camera can see people but not ground-level objects
    // See calculateGroundShadowZone in useGeometry.ts for the implementation
    void otherCameraFOVs // Used for shadow overlap detection when enabled

    // Draw camera icon
    // Convert from azimuth (0° = North, clockwise) to canvas rotation
    // Navigation azimuth: 0°=N, 90°=E - converts to canvas angle = 90 - azimuth
    const canvasAngle = 90 - azimuth
    context.save()
    context.translate(x, y)
    context.rotate((canvasAngle * Math.PI) / 180)

    // Camera body
    context.beginPath()
    context.rect(-15, -10, 30, 20)
    context.fillStyle = hexColor
    context.fill()
    context.strokeStyle = isSelected || isHovered ? '#ffff00' : '#ffffff'
    context.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2
    context.stroke()

    // Camera lens
    context.beginPath()
    context.arc(12, 0, 6, 0, Math.PI * 2)
    context.fillStyle = '#1a1a2e'
    context.fill()
    context.strokeStyle = '#ffffff'
    context.lineWidth = 1
    context.stroke()

    // Elevation indicator
    if (elevation > 0 && elevation < 90) {
      const angleIndicatorLength = 20
      const angleRad = (elevation * Math.PI) / 180

      context.beginPath()
      context.moveTo(15, 0)
      context.arc(15, 0, angleIndicatorLength, Math.PI / 2, Math.PI / 2 + angleRad, true)
      context.strokeStyle = '#f87171'
      context.lineWidth = 2
      context.stroke()

      const endX = 15 + angleIndicatorLength * Math.sin(angleRad)
      const endY = angleIndicatorLength * Math.cos(angleRad)

      context.beginPath()
      context.moveTo(endX, endY)
      context.lineTo(endX - 3, endY - 3)
      context.lineTo(endX + 3, endY - 3)
      context.closePath()
      context.fillStyle = '#f87171'
      context.fill()
    }

    context.restore()

    // Smart label positioning
    if (options.value.showCameraLabels) {
      const labelY = y - 25 < 20 ? y + 40 : y - 25
      const labelX = x < 50 ? x + 30 : x > canvas.width - 50 ? x - 30 : x

      context.fillStyle = isSelected || isHovered ? '#ffffff' : '#cccccc'
      context.font = isSelected ? 'bold 12px monospace' : '12px monospace'
      context.textAlign = x < 50 ? 'left' : x > canvas.width - 50 ? 'right' : 'center'
      context.fillText(getCameraName(placement.cameraId), labelX, labelY)

      if (elevation > 0 && elevation < 90) {
        context.font = '10px monospace'
        context.fillStyle = '#f87171'
        context.textAlign = 'center'
        context.fillText(`▼ ${elevation}°`, x, y - 10)
      }
    }
  }

  const findCameraAtPoint = (
    x: number,
    y: number,
    cameras: CameraPlacement[]
  ): CameraPlacement | null => {
    // x, y are in pixels from mouse position
    for (const camera of cameras) {
      // Convert camera position from meters to pixels
      const cameraX = metersToPixels(extractValue(camera.position.x))
      const cameraY = metersToPixels(extractValue(camera.position.y))
      const distance = Math.sqrt(Math.pow(x - cameraX, 2) + Math.pow(y - cameraY, 2))
      if (distance < 20) {
        return camera
      }
    }
    return null
  }

  const requestRedraw = (drawFn: () => void) => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
    }

    animationFrameId.value = requestAnimationFrame(() => {
      drawFn()
      animationFrameId.value = null
    })
  }

  // Calculate FOV polygon for a camera without drawing (for overlap detection)
  const getCameraFOVPolygon = (
    placement: CameraPlacement,
    walls: Wall[] = [],
    obstacles: Obstacle[] = []
  ): Point[] => {
    const x = metersToPixels(extractValue(placement.position.x))
    const y = metersToPixels(extractValue(placement.position.y))
    const azimuth = extractValue(placement.azimuth)
    const fov = extractValue(placement.fov)
    const FOV_RENDER_DISTANCE_M = 50
    const viewDistance = metersToPixels(FOV_RENDER_DISTANCE_M)

    // Convert walls to line segments
    const wallSegments: LineSegment[] = walls.map(wall => ({
      start: {
        x: metersToPixels(extractValue(wall.start.x)),
        y: metersToPixels(extractValue(wall.start.y))
      },
      end: {
        x: metersToPixels(extractValue(wall.end.x)),
        y: metersToPixels(extractValue(wall.end.y))
      }
    }))

    // Convert obstacles (only those that block view AND are tall enough to fully block)
    const cameraHeight = extractValue(placement.height)
    const circleObstacles: CircleObstacle[] = []
    const rectangleObstacles: RectangleObstacle[] = []

    for (const obstacle of obstacles) {
      if (obstacle.blocksView === false) continue
      // For FOV calculation, only include obstacles that fully block (>= camera height)
      // Shorter obstacles don't block the person-height FOV
      if (obstacle.height !== undefined && obstacle.height < cameraHeight) continue

      if (obstacle.type === 'circle' && obstacle.radius !== undefined) {
        circleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToPixels(extractValue(obstacle.position.y))
          },
          radius: metersToPixels(extractValue(obstacle.radius)),
          obstacleHeight: obstacle.height
        })
      } else if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        rectangleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToPixels(extractValue(obstacle.position.y))
          },
          width: metersToPixels(extractValue(obstacle.dimensions.width)),
          height: metersToPixels(extractValue(obstacle.dimensions.height)),
          rotation: obstacle.rotation,
          obstacleHeight: obstacle.height
        })
      }
    }

    return calculateVisibleFOV(
      { x, y },
      azimuth,
      fov,
      viewDistance,
      wallSegments,
      circleObstacles,
      rectangleObstacles
    )
  }

  return {
    ctx,
    hoveredCameraId,
    imageLoaded,
    initCanvas,
    resizeCanvas,
    clearCanvas,
    loadBackgroundImage,
    drawBackgroundImage,
    drawGrid,
    drawScaleReference,
    drawWalls,
    drawPreviewWall,
    drawWallMeasurements,
    drawObstacles,
    findObstacleAtPoint,
    drawCamera,
    findCameraAtPoint,
    getCameraFOVPolygon,
    requestRedraw,
    // Zone functions
    drawZones,
    drawZonePreview,
    findZoneAtPoint,
    findZoneVertexAtPoint,
  }
}
