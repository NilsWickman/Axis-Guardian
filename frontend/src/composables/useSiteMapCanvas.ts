import { ref, computed, type Ref } from 'vue'
import type { CameraPlacement, Wall } from '../stores/siteMaps'
import { calculateVisibleFOV, drawPolygon, type LineSegment } from './useGeometry'

export interface CanvasRenderOptions {
  showGrid: boolean
  showScaleReference: boolean
  showCameraLabels: boolean
  pixelsPerMeter: number
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

    const { pixelsPerMeter } = options.value
    const context = ctx.value

    context.save()
    context.strokeStyle = '#2a2a3e'
    context.lineWidth = 1

    // Vertical lines
    for (let x = 0; x < canvas.width; x += pixelsPerMeter) {
      const meters = x / pixelsPerMeter
      const isMajorLine = meters % 5 === 0

      context.lineWidth = isMajorLine ? 2 : 1
      context.strokeStyle = isMajorLine ? '#3a3a4e' : '#2a2a3e'

      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, canvas.height)
      context.stroke()

      if (isMajorLine && meters > 0) {
        context.fillStyle = '#6a6a7e'
        context.font = '10px monospace'
        context.textAlign = 'center'
        context.fillText(`${meters}m`, x, 15)
      }
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += pixelsPerMeter) {
      const meters = y / pixelsPerMeter
      const isMajorLine = meters % 5 === 0

      context.lineWidth = isMajorLine ? 2 : 1
      context.strokeStyle = isMajorLine ? '#3a3a4e' : '#2a2a3e'

      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(canvas.width, y)
      context.stroke()

      if (isMajorLine && meters > 0) {
        context.fillStyle = '#6a6a7e'
        context.font = '10px monospace'
        context.textAlign = 'left'
        context.fillText(`${meters}m`, 5, y - 3)
      }
    }

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

  const drawWalls = (walls: Wall[]) => {
    if (!ctx.value || !walls || walls.length === 0) return

    const context = ctx.value

    context.save()

    walls.forEach((wall) => {
      const { start, end, type = 'internal', thickness = 4 } = wall

      // Wall styling based on type
      const wallStyles = {
        external: { color: '#ffffff', width: thickness + 2 },
        internal: { color: '#cccccc', width: thickness },
        door: { color: '#60a5fa', width: thickness - 1 },
      }

      const style = wallStyles[type] || wallStyles.internal

      context.strokeStyle = style.color
      context.lineWidth = style.width
      context.lineCap = 'round'

      // Draw door differently (with a gap or arc)
      if (type === 'door') {
        // Draw door as a dashed line
        context.setLineDash([8, 6])
        context.strokeStyle = '#60a5fa'
      } else {
        context.setLineDash([])
      }

      context.beginPath()
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()

      context.setLineDash([])
    })

    context.restore()
  }

  const drawCamera = (
    placement: CameraPlacement,
    getCameraName: (id: string) => string,
    isSelected: boolean = false,
    isPreview: boolean = false,
    walls: Wall[] = []
  ) => {
    if (!ctx.value) return

    const canvas = canvasRef.value
    if (!canvas) return

    const context = ctx.value
    const { x, y, rotation, angle, fov, viewDistance, color } = placement
    const isHovered = hoveredCameraId.value === placement.cameraId

    // Convert Tailwind color to hex
    const hexColor = tailwindColorToHex(color)

    // Convert walls to line segments for ray-casting
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

    // Draw FOV cone with wall occlusion
    const fillStyle = isPreview
      ? `${hexColor}40`
      : isSelected
        ? `${hexColor}50`
        : `${hexColor}30`

    const strokeStyle = isSelected || isHovered ? '#ffffff' : `${hexColor}cc`
    const lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2

    drawPolygon(context, visiblePolygon, fillStyle, strokeStyle, lineWidth)

    // Draw camera icon
    context.save()
    context.translate(x, y)
    context.rotate((rotation * Math.PI) / 180)

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

    // Angle indicator
    if (angle > 0 && angle < 90) {
      const angleIndicatorLength = 20
      const angleRad = (angle * Math.PI) / 180

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

      if (angle > 0 && angle < 90) {
        context.font = '10px monospace'
        context.fillStyle = '#f87171'
        context.textAlign = 'center'
        context.fillText(`▼ ${angle}°`, x, y - 10)
      }
    }
  }

  const findCameraAtPoint = (
    x: number,
    y: number,
    cameras: CameraPlacement[]
  ): CameraPlacement | null => {
    for (const camera of cameras) {
      const distance = Math.sqrt(Math.pow(x - camera.x, 2) + Math.pow(y - camera.y, 2))
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
    drawCamera,
    findCameraAtPoint,
    requestRedraw
  }
}
