import { ref, type Ref } from 'vue'
import { useTheme } from './useTheme'
import type { CameraPlacement, Wall, Obstacle } from '../types/site-map-types'
import { calculateVisibleFOV, drawPolygon, arcToLineSegments, type Point, type LineSegment, type CircleObstacle, type RectangleObstacle, type HeightAwareOptions } from './useGeometry'
import {
  extractValue,
  metersToPixels,
  metersToCanvasY,
  RENDER_SCALE
} from '../utils/siteMapConversion'

export interface CanvasRenderOptions {
  showGrid: boolean
  showScaleReference: boolean
  showCameraLabels: boolean
  pixelsPerMeter: number // Note: This is used for display but internal is always RENDER_SCALE
}

// Helper to get CSS variable value as a color string
const getCssColor = (varName: string, fallback: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return value || fallback
}

// Canvas theme colors - reads from CSS variables
const getCanvasColors = () => ({
  gridMajor: getCssColor('--canvas-grid-major', '#4a4a5e'),
  gridMinor: getCssColor('--canvas-grid-minor', '#3a3a4e'),
  gridSubtle: getCssColor('--canvas-grid-subtle', '#2a2a3e'),
  text: getCssColor('--canvas-text', '#ffffff'),
  textMuted: getCssColor('--canvas-text-muted', '#9a9aae'),
  wallExternal: getCssColor('--canvas-wall-external', '#ffffff'),
  wallInternal: getCssColor('--canvas-wall-internal', '#cccccc'),
  wallDoor: getCssColor('--canvas-wall-door', '#60a5fa'),
  legendBg: getCssColor('--canvas-legend-bg', 'rgba(0, 0, 0, 0.9)'),
  legendText: getCssColor('--canvas-legend-text', '#ffffff'),
  scaleLine: getCssColor('--canvas-scale-line', '#ffffff'),
  highlight: getCssColor('--canvas-highlight', '#06b6d4'),
  hover: getCssColor('--canvas-hover', '#f59e0b'),
  selected: getCssColor('--canvas-selected', '#06b6d4'),
})

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
  let lastCanvas: HTMLCanvasElement | null = null
  const hoveredCameraId = ref<string | null>(null)
  const animationFrameId = ref<number | null>(null)
  const backgroundImage = ref<HTMLImageElement | null>(null)
  const imageLoaded = ref(false)

  const getCanvasContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.value
    if (!canvas) {
      ctx.value = null
      lastCanvas = null
      return null
    }

    if (lastCanvas !== canvas) {
      lastCanvas = canvas
      ctx.value = canvas.getContext('2d')
    } else if (!ctx.value) {
      ctx.value = canvas.getContext('2d')
    }

    return ctx.value
  }

  const initCanvas = () => {
    return !!getCanvasContext()
  }

  const resizeCanvas = (width: number, height: number) => {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.width = width
    canvas.height = height
  }

  const clearCanvas = () => {
    const canvas = canvasRef.value
    const context = getCanvasContext()
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
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
    const context = getCanvasContext()
    if (!canvas || !context || !backgroundImage.value || !imageLoaded.value) return

    // Draw the background image to fit the canvas
    context.save()
    context.globalAlpha = 0.7 // Make it semi-transparent so overlays are visible
    context.drawImage(backgroundImage.value, 0, 0, canvas.width, canvas.height)
    context.restore()
  }

  const drawGrid = () => {
    const canvas = canvasRef.value
    const context = getCanvasContext()
    if (!canvas || !context || !options.value.showGrid) return

    // Always use RENDER_SCALE for grid rendering
    const pixelsPerMeter = RENDER_SCALE
    const colors = getCanvasColors()

    context.save()

    // Calculate actual canvas dimensions in meters
    const widthInMeters = Math.ceil(canvas.width / pixelsPerMeter)
    const heightInMeters = Math.ceil(canvas.height / pixelsPerMeter)

    // Draw vertical lines - every meter
    for (let meters = 0; meters <= widthInMeters; meters++) {
      const x = meters * pixelsPerMeter
      const isMajorLine = meters % 10 === 0  // Major lines every 10m for large grids
      const isMinorMajorLine = meters % 5 === 0  // Minor major every 5m

      if (isMajorLine) {
        context.strokeStyle = colors.gridMajor
        context.lineWidth = 3
      } else if (isMinorMajorLine) {
        context.strokeStyle = colors.gridMinor
        context.lineWidth = 2
      } else {
        context.strokeStyle = colors.gridSubtle
        context.lineWidth = 1
      }

      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()

      // Draw labels on major lines
      if (isMajorLine && meters > 0) {
        context.fillStyle = colors.textMuted
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
        context.strokeStyle = colors.gridMajor
        context.lineWidth = 3
      } else if (isMinorMajorLine) {
        context.strokeStyle = colors.gridMinor
        context.lineWidth = 2
      } else {
        context.strokeStyle = colors.gridSubtle
        context.lineWidth = 1
      }

      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()

      // Draw labels on major lines
      if (isMajorLine && meters > 0) {
        context.fillStyle = colors.textMuted
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
    context.fillStyle = colors.legendBg
    context.fillRect(legendX - 5, legendY - 30, legendSize + 80, 60)

    // Draw 1-meter reference line
    context.strokeStyle = colors.scaleLine
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
    context.fillStyle = colors.legendText
    context.font = 'bold 14px monospace'
    context.textAlign = 'center'
    context.fillText('1 METER', legendX + legendSize / 2, legendY + 20)

    // Add canvas dimensions info
    context.fillStyle = colors.textMuted
    context.font = '11px monospace'
    context.fillText(`${widthInMeters}m × ${heightInMeters}m`, legendX + legendSize / 2, legendY + 35)

    context.restore()
  }

  const drawScaleReference = () => {
    const canvas = canvasRef.value
    const context = getCanvasContext()
    if (!canvas || !context || !options.value.showScaleReference) return
    const { pixelsPerMeter } = options.value
    const colors = getCanvasColors()

    context.save()

    // Calculate total width in meters
    const totalWidthMeters = canvas.width / pixelsPerMeter
    const barHeight = 40
    const barY = canvas.height - barHeight

    // Top border
    context.strokeStyle = colors.scaleLine
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

    // Draw ticks and labels
    context.strokeStyle = colors.scaleLine
    context.fillStyle = colors.scaleLine
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
    const context = getCanvasContext()
    if (!context || !walls || walls.length === 0) return
    const colors = getCanvasColors()

    context.save()

    walls.forEach((wall) => {
      const { start, end, type = 'internal', id } = wall
      const isSelected = selectedWallId === id
      const isHovered = hoveredWallId === id

      // Convert meter coordinates to pixels for rendering
      const startX = metersToPixels(extractValue(start.x))
      const startY = metersToCanvasY(extractValue(start.y))
      const endX = metersToPixels(extractValue(end.x))
      const endY = metersToCanvasY(extractValue(end.y))

      // Wall styling based on type (fixed line widths)
      const wallStyles = {
        external: { color: colors.wallExternal, width: 6 },
        internal: { color: colors.wallInternal, width: 4 },
        door: { color: colors.wallDoor, width: 3 },
      }

      const style = wallStyles[type] || wallStyles.internal

      // Highlight selected or hovered wall
      if (isSelected) {
        context.strokeStyle = colors.selected
        context.lineWidth = style.width + 4
      } else if (isHovered) {
        context.strokeStyle = colors.hover
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
          context.strokeStyle = colors.wallDoor
        }
      } else {
        context.setLineDash([])
      }

      context.beginPath()

      // Check if this is an arc wall
      const geometry = wall.geometry ?? 'line'
      if (geometry === 'arc' && wall.arc) {
        // Draw arc using center, radius, and angles
        const arc = wall.arc
        const centerX = metersToPixels(extractValue(arc.center.x))
        const centerY = metersToCanvasY(extractValue(arc.center.y))
        const radius = metersToPixels(extractValue(arc.radius))
        // Negate angles to account for Y-axis flip (metersToCanvasY inverts Y)
        // Original angles are in standard math convention (0° = +X, counterclockwise)
        const startRad = -extractValue(arc.startAngle) * Math.PI / 180
        const endRad = -extractValue(arc.endAngle) * Math.PI / 180
        const clockwise = arc.clockwise ?? false

        // Canvas arc() last param is "anticlockwise"
        // After Y-flip and angle negation, pass clockwise directly to get correct direction
        context.arc(centerX, centerY, radius, startRad, endRad, clockwise)
      } else {
        // Draw straight line
        context.moveTo(startX, startY)
        context.lineTo(endX, endY)
      }
      context.stroke()

      context.setLineDash([])

      // Draw handles for selected wall
      if (isSelected) {
        // Draw larger endpoint handles
        context.strokeStyle = '#1e293b' // slate-800
        context.lineWidth = 2
        context.fillStyle = colors.selected

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
        context.fillStyle = `${colors.hover}80` // Semi-transparent hover color

        if (hoveredPart === 'start') {
          // Highlight start endpoint
          context.beginPath()
          context.arc(startX, startY, 10, 0, Math.PI * 2)
          context.fill()

          // Draw label
          context.fillStyle = colors.text
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
          context.fillStyle = colors.text
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
    const colors = getCanvasColors()

    context.save()

    // Convert meter coordinates to pixels for rendering
    const startX = metersToPixels(start.x)
    const startY = metersToCanvasY(start.y)
    const endX = metersToPixels(end.x)
    const endY = metersToCanvasY(end.y)

    const wallStyles = {
      external: { color: colors.wallExternal, width: 6 },
      internal: { color: colors.wallInternal, width: 4 },
      door: { color: colors.wallDoor, width: 3 },
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

  // Category-based default colors (theme-aware)
  const getObstacleCategoryColors = () => {
    const { currentTheme } = useTheme()
    const isLightMode = currentTheme.value === 'light'
    return {
      furniture: isLightMode ? '#1c1917' : '#78716c',   // stone-900 / stone-500
      structural: isLightMode ? '#0f172a' : '#64748b',  // slate-900 / slate-500
      equipment: isLightMode ? '#0f172a' : '#1e293b',   // slate-900 / slate-800
      seating: isLightMode ? '#92400e' : '#fbbf24',     // amber-800 / amber-400
    }
  }

  const drawObstacles = (
    obstacles: Obstacle[],
    hoveredObstacleId?: string | null,
    selectedObstacleId?: string | null
  ) => {
    const context = getCanvasContext()
    if (!context || !obstacles || obstacles.length === 0) return

    context.save()

    obstacles.forEach((obstacle) => {
      const { id, type, position, rotation = 0, category = 'furniture', color } = obstacle
      const isHovered = hoveredObstacleId === id
      const isSelected = selectedObstacleId === id

      // Convert position from meters to pixels
      const centerX = metersToPixels(extractValue(position.x))
      const centerY = metersToCanvasY(extractValue(position.y))

      // Get color (use category default in light mode for better visibility, otherwise use provided color)
      const { currentTheme } = useTheme()
      const isLightMode = currentTheme.value === 'light'
      const obstacleColors = getObstacleCategoryColors()
      // In light mode, always use dark category colors; in dark mode, use provided color or category default
      const baseColor = isLightMode
        ? (obstacleColors[category] || obstacleColors.furniture)
        : (color || obstacleColors[category] || obstacleColors.furniture)

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
        // Draw polygon - vertices are relative offsets from position, context is already translated
        const vertices = obstacle.vertices.map(v => ({
          x: metersToPixels(extractValue(v.x)),
          y: metersToCanvasY(extractValue(v.y))
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
      } else if (type === 'arc-segment' && obstacle.arcSegment) {
        // Draw arc segment - curved seating rows
        // Arc segments use absolute coordinates (center is the arc center, not obstacle position)
        context.restore() // Restore before drawing with absolute coordinates
        context.save()

        const arc = obstacle.arcSegment
        const cx = metersToPixels(extractValue(arc.center.x))
        const cy = metersToCanvasY(extractValue(arc.center.y))
        const innerRadius = metersToPixels(extractValue(arc.innerRadius))
        const outerRadius = metersToPixels(extractValue(arc.outerRadius))
        // Negate angles to account for Y-axis flip (metersToCanvasY inverts Y)
        const startRad = -extractValue(arc.startAngle) * Math.PI / 180
        const endRad = -extractValue(arc.endAngle) * Math.PI / 180
        const clockwise = arc.clockwise ?? false

        // Check for wall-aligned sides
        const hasStartSide = arc.startSidePoints !== undefined
        const hasEndSide = arc.endSidePoints !== undefined

        context.beginPath()

        if (hasStartSide || hasEndSide) {
          // Wall-aligned rendering: draw explicit lines along walls instead of radial sides

          // Calculate inner arc angles from wall intersection points if needed
          let innerStartRad = startRad
          let innerEndRad = endRad

          if (hasStartSide && arc.startSidePoints) {
            const innerStartPt = arc.startSidePoints.inner
            // Calculate angle from arc center to inner intersection point
            // Note: metersToCanvasY flips Y, so we need to account for that in angle calculation
            const innerStartX = metersToPixels(innerStartPt.x)
            const innerStartY = metersToCanvasY(innerStartPt.y)
            innerStartRad = Math.atan2(innerStartY - cy, innerStartX - cx)
          }

          if (hasEndSide && arc.endSidePoints) {
            const innerEndPt = arc.endSidePoints.inner
            const innerEndX = metersToPixels(innerEndPt.x)
            const innerEndY = metersToCanvasY(innerEndPt.y)
            innerEndRad = Math.atan2(innerEndY - cy, innerEndX - cx)
          }

          // 1. Draw outer arc from start to end
          // Canvas arc() last param is "anticlockwise", so pass !clockwise
          context.arc(cx, cy, outerRadius, startRad, endRad, !clockwise)

          // 2. End side: line along wall from outer to inner intersection
          if (hasEndSide && arc.endSidePoints) {
            const outerEndPt = arc.endSidePoints.outer
            const innerEndPt = arc.endSidePoints.inner
            context.lineTo(metersToPixels(outerEndPt.x), metersToCanvasY(outerEndPt.y))
            context.lineTo(metersToPixels(innerEndPt.x), metersToCanvasY(innerEndPt.y))
          }

          // 3. Draw inner arc from end back to start (using adjusted angles if wall-aligned)
          context.arc(cx, cy, innerRadius, innerEndRad, innerStartRad, clockwise)

          // 4. Start side: line along wall from inner to outer intersection
          if (hasStartSide && arc.startSidePoints) {
            const innerStartPt = arc.startSidePoints.inner
            const outerStartPt = arc.startSidePoints.outer
            context.lineTo(metersToPixels(innerStartPt.x), metersToCanvasY(innerStartPt.y))
            context.lineTo(metersToPixels(outerStartPt.x), metersToCanvasY(outerStartPt.y))
          }

          context.closePath()
        } else {
          // Standard rendering: radial sides (original behavior)
          // Canvas arc() last param is "anticlockwise", so pass !clockwise for outer arc
          context.arc(cx, cy, outerRadius, startRad, endRad, !clockwise)
          // Inner arc goes in reversed direction
          context.arc(cx, cy, innerRadius, endRad, startRad, clockwise)
          context.closePath()
        }

        context.fillStyle = fillColor
        context.fill()
        // No stroke for arc-segments - borders look weird on curved seating
      } else if (type === 'linear' && obstacle.linear) {
        // Draw linear obstacle - two-point definition with perpendicular width
        // Linear obstacles use absolute coordinates (not relative to position)
        context.restore() // Restore before drawing with absolute coordinates
        context.save()

        const linear = obstacle.linear
        const startX = metersToPixels(extractValue(linear.start.x))
        const startY = metersToCanvasY(extractValue(linear.start.y))
        const endX = metersToPixels(extractValue(linear.end.x))
        const endY = metersToCanvasY(extractValue(linear.end.y))
        const halfWidth = metersToPixels(extractValue(linear.width)) / 2

        // Calculate direction and perpendicular vectors
        const dx = endX - startX
        const dy = endY - startY
        const length = Math.sqrt(dx * dx + dy * dy)

        if (length > 0) {
          // Normalize and get perpendicular
          const nx = -dy / length  // perpendicular x
          const ny = dx / length   // perpendicular y

          // Calculate the four corners of the rectangle
          const corners = [
            { x: startX + nx * halfWidth, y: startY + ny * halfWidth },  // start left
            { x: startX - nx * halfWidth, y: startY - ny * halfWidth },  // start right
            { x: endX - nx * halfWidth, y: endY - ny * halfWidth },      // end right
            { x: endX + nx * halfWidth, y: endY + ny * halfWidth },      // end left
          ]

          // Draw the rectangle
          context.beginPath()
          context.moveTo(corners[0].x, corners[0].y)
          context.lineTo(corners[1].x, corners[1].y)
          context.lineTo(corners[2].x, corners[2].y)
          context.lineTo(corners[3].x, corners[3].y)
          context.closePath()

          context.fillStyle = fillColor
          context.fill()
          context.strokeStyle = strokeColor
          context.lineWidth = lineWidth
          context.stroke()

          // Draw category-specific patterns
          if (category === 'structural') {
            // Draw cross-hatch pattern for structural elements
            context.strokeStyle = `${baseColor}30`
            context.lineWidth = 1
            const step = 10
            for (let i = 0; i < length; i += step) {
              const t = i / length
              const px = startX + dx * t
              const py = startY + dy * t
              context.beginPath()
              context.moveTo(px + nx * halfWidth, py + ny * halfWidth)
              context.lineTo(px - nx * halfWidth, py - ny * halfWidth)
              context.stroke()
            }
          } else if (category === 'seating') {
            // Draw centerline for seating to show direction
            context.strokeStyle = `${baseColor}50`
            context.lineWidth = 1
            context.setLineDash([4, 4])
            context.beginPath()
            context.moveTo(startX, startY)
            context.lineTo(endX, endY)
            context.stroke()
            context.setLineDash([])
          }
        }
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
      const centerY = metersToCanvasY(extractValue(obstacle.position.y))
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
        // Point-in-polygon test using ray casting - vertices are relative offsets from position
        const vertices = obstacle.vertices.map(v => ({
          x: metersToPixels(extractValue(v.x)),
          y: metersToCanvasY(extractValue(v.y))
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
      } else if (obstacle.type === 'arc-segment' && obstacle.arcSegment) {
        // Arc segment hit testing - check if point is within radii and angle range
        const arc = obstacle.arcSegment
        const cx = metersToPixels(extractValue(arc.center.x))
        const cy = metersToCanvasY(extractValue(arc.center.y))
        const innerRadius = metersToPixels(extractValue(arc.innerRadius))
        const outerRadius = metersToPixels(extractValue(arc.outerRadius))
        const startAngle = extractValue(arc.startAngle)
        const endAngle = extractValue(arc.endAngle)
        const clockwise = arc.clockwise ?? false

        // Distance from arc center to point (using absolute coordinates, not local)
        const arcDx = x - cx
        const arcDy = y - cy
        const distFromCenter = Math.sqrt(arcDx * arcDx + arcDy * arcDy)

        // Check if within radii
        if (distFromCenter >= innerRadius && distFromCenter <= outerRadius) {
          // Calculate angle of point from arc center
          let pointAngle = Math.atan2(arcDy, arcDx) * 180 / Math.PI
          if (pointAngle < 0) pointAngle += 360

          // Normalize angles to 0-360 range
          let start = startAngle % 360
          let end = endAngle % 360
          if (start < 0) start += 360
          if (end < 0) end += 360

          // Check if angle is within arc span
          let inArc = false
          if (clockwise) {
            // Clockwise: from start going down to end
            if (start >= end) {
              inArc = pointAngle <= start && pointAngle >= end
            } else {
              inArc = pointAngle <= start || pointAngle >= end
            }
          } else {
            // Counter-clockwise: from start going up to end
            if (start <= end) {
              inArc = pointAngle >= start && pointAngle <= end
            } else {
              inArc = pointAngle >= start || pointAngle <= end
            }
          }

          if (inArc) {
            return obstacle
          }
        }
      } else if (obstacle.type === 'linear' && obstacle.linear) {
        // Linear obstacle hit testing - check if point is inside the rectangle
        const linear = obstacle.linear
        const startX = metersToPixels(extractValue(linear.start.x))
        const startY = metersToCanvasY(extractValue(linear.start.y))
        const endX = metersToPixels(extractValue(linear.end.x))
        const endY = metersToCanvasY(extractValue(linear.end.y))
        const halfWidth = metersToPixels(extractValue(linear.width)) / 2

        // Calculate direction and perpendicular vectors
        const lineDx = endX - startX
        const lineDy = endY - startY
        const length = Math.sqrt(lineDx * lineDx + lineDy * lineDy)

        if (length > 0) {
          // Unit vectors along and perpendicular to the line
          const ux = lineDx / length  // along line x
          const uy = lineDy / length  // along line y
          const nx = -uy  // perpendicular x
          const ny = ux   // perpendicular y

          // Transform point to line's local coordinate system
          // (origin at start, x-axis along line, y-axis perpendicular)
          const ptDx = x - startX
          const ptDy = y - startY
          const localAlongLine = ptDx * ux + ptDy * uy
          const localPerpendicular = ptDx * nx + ptDy * ny

          // Check if within bounds
          if (localAlongLine >= 0 && localAlongLine <= length &&
              Math.abs(localPerpendicular) <= halfWidth) {
            return obstacle
          }
        }
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
    const startY = metersToCanvasY(start.y)
    const endX = metersToPixels(end.x)
    const endY = metersToCanvasY(end.y)

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
    const canvas = canvasRef.value
    if (!canvas) return

    const context = getCanvasContext()
    if (!context) return

    // Extract values from unit objects
    const x = metersToPixels(extractValue(placement.position.x))
    const y = metersToCanvasY(extractValue(placement.position.y))
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
    // Arc walls are converted to multiple line segments
    const wallSegments: LineSegment[] = walls.flatMap(wall => {
      const geometry = wall.geometry ?? 'line'
      if (geometry === 'arc' && wall.arc) {
        // Convert arc to line segments
        const arc = wall.arc
        // Negate angles to account for Y-axis flip
        // Pass clockwise directly - arcToLineSegments handles direction based on angleDiff sign
        return arcToLineSegments(
          {
            x: metersToPixels(extractValue(arc.center.x)),
            y: metersToCanvasY(extractValue(arc.center.y))
          },
          metersToPixels(extractValue(arc.radius)),
          -extractValue(arc.startAngle),
          -extractValue(arc.endAngle),
          arc.clockwise ?? false,
          24 // Higher segment count for smoother FOV calculation
        )
      } else {
        // Straight line wall
        return [{
          start: {
            x: metersToPixels(extractValue(wall.start.x)),
            y: metersToCanvasY(extractValue(wall.start.y))
          },
          end: {
            x: metersToPixels(extractValue(wall.end.x)),
            y: metersToCanvasY(extractValue(wall.end.y))
          }
        }]
      }
    })

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
            y: metersToCanvasY(extractValue(obstacle.position.y))
          },
          radius: metersToPixels(extractValue(obstacle.radius)),
          obstacleHeight: obstacle.height // physical height in meters
        })
      } else if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        rectangleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToCanvasY(extractValue(obstacle.position.y))
          },
          width: metersToPixels(extractValue(obstacle.dimensions.width)),
          height: metersToPixels(extractValue(obstacle.dimensions.height)),
          rotation: obstacle.rotation,
          obstacleHeight: obstacle.height // physical height in meters
        })
      } else if (obstacle.type === 'linear' && obstacle.linear) {
        // Convert linear obstacle to rectangle for FOV calculation
        const linear = obstacle.linear
        const startX = extractValue(linear.start.x)
        const startY = extractValue(linear.start.y)
        const endX = extractValue(linear.end.x)
        const endY = extractValue(linear.end.y)
        const width = extractValue(linear.width)

        // Calculate center, length, and rotation
        const centerX = (startX + endX) / 2
        const centerY = (startY + endY) / 2
        const dx = endX - startX
        const dy = endY - startY
        const length = Math.sqrt(dx * dx + dy * dy)
        // Rotation in degrees (from positive X axis)
        const rotation = Math.atan2(dy, dx) * 180 / Math.PI

        rectangleObstacles.push({
          center: {
            x: metersToPixels(centerX),
            y: metersToPixels(centerY)
          },
          width: metersToPixels(length),
          height: metersToPixels(width),
          rotation: rotation,
          obstacleHeight: obstacle.height
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
    const { currentTheme } = useTheme()
    const isLightMode = currentTheme.value === 'light'
    const fillStyle = isPreview
      ? `${hexColor}40`
      : isSelected
        ? `${hexColor}50`
        : `${hexColor}30`

    // Only stroke when selected or hovered to avoid border around obstacle cutouts
    const strokeStyle = (isSelected || isHovered)
      ? (isLightMode ? '#333333' : '#ffffff')
      : undefined
    const lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2

    drawPolygon(context, visiblePolygon, fillStyle, strokeStyle, lineWidth)

    // Note: Ground shadow zone drawing is disabled pending coordinate system fixes
    // The feature would show areas where camera can see people but not ground-level objects
    // See calculateGroundShadowZone in useGeometry.ts for the implementation
    void otherCameraFOVs // Used for shadow overlap detection when enabled

    // Draw camera icon
    // Convert from azimuth (0° = North, clockwise) to canvas rotation
    // With Y-flipped coordinates (North at top of canvas):
    // Azimuth 0° (North) → Canvas -90° (points up toward North)
    // Azimuth 90° (East) → Canvas 0° (points right)
    const canvasAngle = azimuth - 90
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
      const cameraY = metersToCanvasY(extractValue(camera.position.y))
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
    const y = metersToCanvasY(extractValue(placement.position.y))
    const azimuth = extractValue(placement.azimuth)
    const fov = extractValue(placement.fov)
    const FOV_RENDER_DISTANCE_M = 50
    const viewDistance = metersToPixels(FOV_RENDER_DISTANCE_M)

    // Convert walls to line segments (arc walls become multiple segments)
    const wallSegments: LineSegment[] = walls.flatMap(wall => {
      const geometry = wall.geometry ?? 'line'
      if (geometry === 'arc' && wall.arc) {
        const arc = wall.arc
        // Negate angles to account for Y-axis flip
        // Pass clockwise directly - arcToLineSegments handles direction based on angleDiff sign
        return arcToLineSegments(
          {
            x: metersToPixels(extractValue(arc.center.x)),
            y: metersToCanvasY(extractValue(arc.center.y))
          },
          metersToPixels(extractValue(arc.radius)),
          -extractValue(arc.startAngle),
          -extractValue(arc.endAngle),
          arc.clockwise ?? false,
          24
        )
      } else {
        return [{
          start: {
            x: metersToPixels(extractValue(wall.start.x)),
            y: metersToCanvasY(extractValue(wall.start.y))
          },
          end: {
            x: metersToPixels(extractValue(wall.end.x)),
            y: metersToCanvasY(extractValue(wall.end.y))
          }
        }]
      }
    })

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
            y: metersToCanvasY(extractValue(obstacle.position.y))
          },
          radius: metersToPixels(extractValue(obstacle.radius)),
          obstacleHeight: obstacle.height
        })
      } else if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        rectangleObstacles.push({
          center: {
            x: metersToPixels(extractValue(obstacle.position.x)),
            y: metersToCanvasY(extractValue(obstacle.position.y))
          },
          width: metersToPixels(extractValue(obstacle.dimensions.width)),
          height: metersToPixels(extractValue(obstacle.dimensions.height)),
          rotation: obstacle.rotation,
          obstacleHeight: obstacle.height
        })
      } else if (obstacle.type === 'linear' && obstacle.linear) {
        // Convert linear obstacle to rectangle for FOV calculation
        const linear = obstacle.linear
        const startX = extractValue(linear.start.x)
        const startY = extractValue(linear.start.y)
        const endX = extractValue(linear.end.x)
        const endY = extractValue(linear.end.y)
        const width = extractValue(linear.width)

        // Calculate center, length, and rotation
        const centerX = (startX + endX) / 2
        const centerY = (startY + endY) / 2
        const dx = endX - startX
        const dy = endY - startY
        const length = Math.sqrt(dx * dx + dy * dy)
        // Rotation in degrees (from positive X axis)
        const rotation = Math.atan2(dy, dx) * 180 / Math.PI

        rectangleObstacles.push({
          center: {
            x: metersToPixels(centerX),
            y: metersToPixels(centerY)
          },
          width: metersToPixels(length),
          height: metersToPixels(width),
          rotation: rotation,
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
  }
}
