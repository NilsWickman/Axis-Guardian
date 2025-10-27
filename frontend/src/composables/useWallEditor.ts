import { ref, computed } from 'vue'
import type { Wall } from '../stores/siteMaps'
import {
  RENDER_SCALE,
  pixelsToMeters,
  createMeterUnit,
  extractValue,
  metersToPixels
} from '../utils/siteMapConversion'

export type WallEditorMode = 'none' | 'draw' | 'edit' | 'delete'

export interface WallDrawState {
  isDrawing: boolean
  startPoint: { x: number; y: number } | null // In meters during drawing
  currentPoint: { x: number; y: number } | null // In meters during drawing
  wallType: 'external' | 'internal' | 'door'
  thickness: number // Ignored - walls don't have thickness
}

export interface WallDragState {
  isDragging: boolean
  draggedWall: Wall | null
  draggedEndpoint: 'start' | 'end' | null
}

export interface WallHoverState {
  hoveredWall: Wall | null
  hoveredPart: 'start' | 'end' | 'body' | null
}

export interface WallSnapOptions {
  snapToGrid: boolean
  snapToWalls: boolean
  gridSize: number
  snapThreshold: number
}

export function useWallEditor() {
  const mode = ref<WallEditorMode>('none')
  const selectedWall = ref<Wall | null>(null)
  const snapOptions = ref<WallSnapOptions>({
    snapToGrid: true,
    snapToWalls: true,
    gridSize: RENDER_SCALE, // Fixed at 100 pixels per meter
    snapThreshold: 10
  })
  const drawState = ref<WallDrawState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    wallType: 'internal',
    thickness: 4 // Ignored
  })
  const dragState = ref<WallDragState>({
    isDragging: false,
    draggedWall: null,
    draggedEndpoint: null
  })
  const hoverState = ref<WallHoverState>({
    hoveredWall: null,
    hoveredPart: null
  })

  const isActive = computed(() => mode.value !== 'none')

  const setMode = (newMode: WallEditorMode) => {
    mode.value = newMode
    selectedWall.value = null
    resetDrawing()
  }

  const setWallType = (type: 'external' | 'internal' | 'door') => {
    drawState.value.wallType = type
  }

  const setThickness = (thickness: number) => {
    drawState.value.thickness = thickness
  }

  const startDrawing = (x: number, y: number) => {
    if (mode.value !== 'draw') return

    drawState.value.isDrawing = true
    drawState.value.startPoint = { x, y }
    drawState.value.currentPoint = { x, y }
  }

  const updateDrawing = (x: number, y: number) => {
    if (!drawState.value.isDrawing) return

    drawState.value.currentPoint = { x, y }
  }

  const finishDrawing = (): Wall | null => {
    if (!drawState.value.isDrawing || !drawState.value.startPoint || !drawState.value.currentPoint) {
      resetDrawing()
      return null
    }

    const start = drawState.value.startPoint
    const end = drawState.value.currentPoint

    // Check if the wall is too short (less than 0.1 meters = 10cm)
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    if (distance < 0.1) {
      resetDrawing()
      return null
    }

    // Create wall with meter-based unit objects
    const newWall: Wall = {
      id: `wall-${Date.now()}`,
      start: {
        x: createMeterUnit(start.x),
        y: createMeterUnit(start.y)
      },
      end: {
        x: createMeterUnit(end.x),
        y: createMeterUnit(end.y)
      },
      type: drawState.value.wallType
    }

    resetDrawing()
    return newWall
  }

  const resetDrawing = () => {
    drawState.value.isDrawing = false
    drawState.value.startPoint = null
    drawState.value.currentPoint = null
  }

  const findWallAtPoint = (x: number, y: number, walls: Wall[]): Wall | null => {
    // x, y are in pixels from mouse position
    for (const wall of walls) {
      // Convert wall coordinates from meters to pixels
      const startX = metersToPixels(extractValue(wall.start.x))
      const startY = metersToPixels(extractValue(wall.start.y))
      const endX = metersToPixels(extractValue(wall.end.x))
      const endY = metersToPixels(extractValue(wall.end.y))

      const distance = pointToLineDistance(x, y, startX, startY, endX, endY)

      const threshold = 10 // 10px tolerance
      if (distance < threshold) {
        return wall
      }
    }
    return null
  }

  const selectWall = (wall: Wall | null) => {
    selectedWall.value = wall
  }

  // Snapping utilities
  const snapToGridPoint = (x: number, y: number): { x: number; y: number } => {
    const gridSize = snapOptions.value.gridSize
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  const findNearestWallEndpoint = (x: number, y: number, walls: Wall[]): { x: number; y: number } | null => {
    // x, y are in meters
    let nearestPoint: { x: number; y: number } | null = null
    let minDistance = pixelsToMeters(snapOptions.value.snapThreshold)

    for (const wall of walls) {
      // Extract meter values from walls
      const startX = extractValue(wall.start.x)
      const startY = extractValue(wall.start.y)
      const endX = extractValue(wall.end.x)
      const endY = extractValue(wall.end.y)

      // Check start point
      const startDist = Math.sqrt(Math.pow(startX - x, 2) + Math.pow(startY - y, 2))
      if (startDist < minDistance) {
        minDistance = startDist
        nearestPoint = { x: startX, y: startY }
      }

      // Check end point
      const endDist = Math.sqrt(Math.pow(endX - x, 2) + Math.pow(endY - y, 2))
      if (endDist < minDistance) {
        minDistance = endDist
        nearestPoint = { x: endX, y: endY }
      }
    }

    return nearestPoint
  }

  const snapPoint = (x: number, y: number, walls: Wall[] = []): { x: number; y: number } => {
    let snappedPoint = { x, y }

    // First, try to snap to wall endpoints if enabled
    if (snapOptions.value.snapToWalls) {
      const wallSnap = findNearestWallEndpoint(x, y, walls)
      if (wallSnap) {
        return wallSnap
      }
    }

    // Then snap to grid if enabled
    if (snapOptions.value.snapToGrid) {
      snappedPoint = snapToGridPoint(x, y)
    }

    return snappedPoint
  }

  const setSnapOptions = (options: Partial<WallSnapOptions>) => {
    snapOptions.value = { ...snapOptions.value, ...options }
  }

  // Endpoint dragging utilities
  const findEndpointAtPoint = (x: number, y: number, wall: Wall): 'start' | 'end' | null => {
    const threshold = 10
    const startDist = Math.sqrt(Math.pow(wall.start.x - x, 2) + Math.pow(wall.start.y - y, 2))
    const endDist = Math.sqrt(Math.pow(wall.end.x - x, 2) + Math.pow(wall.end.y - y, 2))

    if (startDist < threshold) return 'start'
    if (endDist < threshold) return 'end'
    return null
  }

  const startDraggingEndpoint = (wall: Wall, endpoint: 'start' | 'end') => {
    dragState.value.isDragging = true
    dragState.value.draggedWall = wall
    dragState.value.draggedEndpoint = endpoint
  }

  const updateDraggingEndpoint = (x: number, y: number, walls: Wall[] = []): Wall | null => {
    if (!dragState.value.isDragging || !dragState.value.draggedWall || !dragState.value.draggedEndpoint) {
      return null
    }

    const snapped = snapPoint(x, y, walls.filter(w => w.id !== dragState.value.draggedWall?.id))
    const updatedWall = { ...dragState.value.draggedWall }

    if (dragState.value.draggedEndpoint === 'start') {
      updatedWall.start = snapped
    } else {
      updatedWall.end = snapped
    }

    return updatedWall
  }

  const finishDraggingEndpoint = (): Wall | null => {
    const result = dragState.value.draggedWall
    dragState.value.isDragging = false
    dragState.value.draggedWall = null
    dragState.value.draggedEndpoint = null
    return result
  }

  // Update hover state based on mouse position
  const updateHoverState = (x: number, y: number, walls: Wall[], isEditMode: boolean = false) => {
    if (!isEditMode) {
      hoverState.value.hoveredWall = null
      hoverState.value.hoveredPart = null
      return
    }

    // First check if hovering over any wall
    const wall = findWallAtPoint(x, y, walls)

    if (wall) {
      hoverState.value.hoveredWall = wall

      // Check if hovering over an endpoint
      const endpoint = findEndpointAtPoint(x, y, wall)
      if (endpoint) {
        hoverState.value.hoveredPart = endpoint
      } else {
        hoverState.value.hoveredPart = 'body'
      }
    } else {
      hoverState.value.hoveredWall = null
      hoverState.value.hoveredPart = null
    }
  }

  const clearHoverState = () => {
    hoverState.value.hoveredWall = null
    hoverState.value.hoveredPart = null
  }

  return {
    mode,
    selectedWall,
    drawState,
    dragState,
    hoverState,
    snapOptions,
    isActive,
    setMode,
    setWallType,
    setThickness,
    startDrawing,
    updateDrawing,
    finishDrawing,
    resetDrawing,
    findWallAtPoint,
    selectWall,
    snapPoint,
    setSnapOptions,
    findEndpointAtPoint,
    startDraggingEndpoint,
    updateDraggingEndpoint,
    finishDraggingEndpoint,
    updateHoverState,
    clearHoverState
  }
}

// Helper function to calculate distance from point to line segment
function pointToLineDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy

  return Math.sqrt(dx * dx + dy * dy)
}
