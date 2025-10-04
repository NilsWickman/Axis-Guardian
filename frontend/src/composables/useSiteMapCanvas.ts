import { ref, computed, type Ref } from 'vue'
import type { CameraPlacement, Wall } from '../stores/siteMaps'
import { calculateVisibleFOV, drawPolygon, type LineSegment } from './useGeometry'

export interface CanvasRenderOptions {
  showGrid: boolean
  showScaleReference: boolean
  showCameraLabels: boolean
  pixelsPerMeter: number
}

export function useSiteMapCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: Ref<CanvasRenderOptions>
) {
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const hoveredCameraId = ref<string | null>(null)
  const animationFrameId = ref<number | null>(null)

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

    const startX = canvas.width - 220
    const startY = canvas.height - 120

    // Background panel
    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    context.fillRect(startX - 10, startY - 10, 210, 110)
    context.strokeStyle = '#4ecca3'
    context.lineWidth = 2
    context.strokeRect(startX - 10, startY - 10, 210, 110)

    // Title
    context.fillStyle = '#ffffff'
    context.font = 'bold 12px monospace'
    context.textAlign = 'left'
    context.fillText('SCALE REFERENCE', startX, startY + 5)

    // Scale ruler
    const rulerY = startY + 25
    const rulerLength = 5 * pixelsPerMeter

    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(startX, rulerY)
    context.lineTo(startX + rulerLength, rulerY)
    context.stroke()

    // Ruler ticks
    for (let i = 0; i <= 5; i++) {
      const tickX = startX + i * pixelsPerMeter
      context.beginPath()
      context.moveTo(tickX, rulerY - 5)
      context.lineTo(tickX, rulerY + 5)
      context.stroke()

      context.fillStyle = '#ffffff'
      context.font = '10px monospace'
      context.textAlign = 'center'
      context.fillText(`${i}m`, tickX, rulerY + 18)
    }

    // Human figure (1.75m)
    const humanX = startX + 20
    const humanY = startY + 50

    context.strokeStyle = '#60a5fa'
    context.lineWidth = 2

    // Head
    context.beginPath()
    context.arc(humanX, humanY, 5, 0, Math.PI * 2)
    context.stroke()

    // Body
    context.beginPath()
    context.moveTo(humanX, humanY + 5)
    context.lineTo(humanX, humanY + 25)
    context.stroke()

    // Arms
    context.beginPath()
    context.moveTo(humanX - 8, humanY + 12)
    context.lineTo(humanX + 8, humanY + 12)
    context.stroke()

    // Legs
    context.beginPath()
    context.moveTo(humanX, humanY + 25)
    context.lineTo(humanX - 6, humanY + 38)
    context.moveTo(humanX, humanY + 25)
    context.lineTo(humanX + 6, humanY + 38)
    context.stroke()

    // Label
    context.fillStyle = '#60a5fa'
    context.font = '10px monospace'
    context.textAlign = 'center'
    context.fillText('1.75m', humanX, humanY + 52)

    // Car silhouette
    const carX = startX + 80
    const carY = startY + 75

    context.fillStyle = '#f87171'
    context.strokeStyle = '#f87171'
    context.lineWidth = 2

    context.fillRect(carX, carY - 8, 45, 12)
    context.fillRect(carX + 10, carY - 15, 25, 7)

    // Wheels
    context.beginPath()
    context.arc(carX + 8, carY + 4, 3, 0, Math.PI * 2)
    context.arc(carX + 37, carY + 4, 3, 0, Math.PI * 2)
    context.fill()

    // Label
    context.fillStyle = '#f87171'
    context.font = '10px monospace'
    context.textAlign = 'center'
    context.fillText('~4.5m', carX + 22, carY + 18)

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
      ? `${color}40`
      : isSelected
        ? `${color}50`
        : `${color}30`

    const strokeStyle = isSelected || isHovered ? '#ffffff' : `${color}cc`
    const lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2

    drawPolygon(context, visiblePolygon, fillStyle, strokeStyle, lineWidth)

    // Draw camera icon
    context.save()
    context.translate(x, y)
    context.rotate((rotation * Math.PI) / 180)

    // Camera body
    context.beginPath()
    context.rect(-15, -10, 30, 20)
    context.fillStyle = color
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
    initCanvas,
    resizeCanvas,
    clearCanvas,
    drawGrid,
    drawScaleReference,
    drawWalls,
    drawCamera,
    findCameraAtPoint,
    requestRedraw
  }
}
