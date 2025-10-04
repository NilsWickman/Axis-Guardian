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

  return {
    mouseX,
    mouseY,
    dragState,
    getCanvasCoordinates,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onDragMove,
    startDrag,
    endDrag
  }
}
