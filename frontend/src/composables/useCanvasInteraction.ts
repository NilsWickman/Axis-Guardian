import { ref, type Ref } from 'vue'
import type { CameraPlacement } from '../stores/siteMaps'

export interface DragState {
  isDragging: boolean
  draggedCamera: CameraPlacement | null
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

export interface PanState {
  isPanning: boolean
  startX: number
  startY: number
  startOffsetX: number
  startOffsetY: number
}

export function useCanvasInteraction(
  canvasRef: Ref<HTMLCanvasElement | null>,
  findCameraAtPoint: (x: number, y: number, cameras: CameraPlacement[]) => CameraPlacement | null
) {
  const mouseX = ref(0)
  const mouseY = ref(0)
  const dragState = ref<DragState>({
    isDragging: false,
    draggedCamera: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  })

  const panState = ref<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  })

  const scale = ref(1)
  const offsetX = ref(0)
  const offsetY = ref(0)
  const snapToGrid = ref(false)
  const gridSize = ref(50) // pixels per meter

  const getCanvasCoordinates = (event: MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top)
    }
  }

  const onMouseMove = (event: MouseEvent) => {
    const coords = getCanvasCoordinates(event)
    mouseX.value = coords.x
    mouseY.value = coords.y
  }

  const startDrag = (camera: CameraPlacement, startX: number, startY: number) => {
    dragState.value = {
      isDragging: true,
      draggedCamera: camera,
      startX,
      startY,
      offsetX: startX - camera.x,
      offsetY: startY - camera.y
    }
  }

  const onDragMove = (event: MouseEvent): { x: number; y: number } | null => {
    if (!dragState.value.isDragging || !dragState.value.draggedCamera) return null

    const coords = getCanvasCoordinates(event)
    return {
      x: coords.x - dragState.value.offsetX,
      y: coords.y - dragState.value.offsetY
    }
  }

  const endDrag = () => {
    const wasDragging = dragState.value.isDragging
    const draggedCamera = dragState.value.draggedCamera

    dragState.value = {
      isDragging: false,
      draggedCamera: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    }

    return { wasDragging, draggedCamera }
  }

  const onMouseDown = (
    event: MouseEvent,
    cameras: CameraPlacement[]
  ): CameraPlacement | null => {
    const coords = getCanvasCoordinates(event)
    const camera = findCameraAtPoint(coords.x, coords.y, cameras)

    if (camera) {
      startDrag(camera, coords.x, coords.y)
      return camera
    }

    return null
  }

  const onMouseUp = () => {
    return endDrag()
  }

  const snapToGridPoint = (x: number, y: number): { x: number; y: number } => {
    if (!snapToGrid.value) return { x, y }

    const snappedX = Math.round(x / gridSize.value) * gridSize.value
    const snappedY = Math.round(y / gridSize.value) * gridSize.value

    return { x: snappedX, y: snappedY }
  }

  const handleZoom = (delta: number, mouseX: number, mouseY: number) => {
    const zoomFactor = delta > 0 ? 1.1 : 0.9
    const newScale = Math.max(0.1, Math.min(5, scale.value * zoomFactor))

    // Zoom towards mouse position
    const scaleChange = newScale / scale.value

    offsetX.value = mouseX - (mouseX - offsetX.value) * scaleChange
    offsetY.value = mouseY - (mouseY - offsetY.value) * scaleChange

    scale.value = newScale
  }

  const startPan = (x: number, y: number) => {
    panState.value = {
      isPanning: true,
      startX: x,
      startY: y,
      startOffsetX: offsetX.value,
      startOffsetY: offsetY.value
    }
  }

  const updatePan = (x: number, y: number) => {
    if (!panState.value.isPanning) return

    const dx = x - panState.value.startX
    const dy = y - panState.value.startY

    offsetX.value = panState.value.startOffsetX + dx
    offsetY.value = panState.value.startOffsetY + dy
  }

  const endPan = () => {
    panState.value.isPanning = false
  }

  const toggleSnapToGrid = () => {
    snapToGrid.value = !snapToGrid.value
  }

  const setSnapToGrid = (enabled: boolean) => {
    snapToGrid.value = enabled
  }

  const resetView = (canvasWidth: number, canvasHeight: number, containerWidth: number, containerHeight: number) => {
    const padding = 40
    const scaleX = (containerWidth - padding * 2) / canvasWidth
    const scaleY = (containerHeight - padding * 2) / canvasHeight
    const newScale = Math.min(scaleX, scaleY, 1)

    scale.value = newScale
    offsetX.value = (containerWidth - canvasWidth * newScale) / 2
    offsetY.value = (containerHeight - canvasHeight * newScale) / 2
  }

  return {
    mouseX,
    mouseY,
    dragState,
    panState,
    scale,
    offsetX,
    offsetY,
    snapToGrid,
    gridSize,
    getCanvasCoordinates,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onDragMove,
    startDrag,
    endDrag,
    snapToGridPoint,
    handleZoom,
    startPan,
    updatePan,
    endPan,
    toggleSnapToGrid,
    setSnapToGrid,
    resetView
  }
}
