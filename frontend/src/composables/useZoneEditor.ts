/**
 * Zone Editor Composable - Handles zone drawing and editing interactions
 *
 * Provides state and methods for:
 * - Drawing new zone polygons
 * - Selecting and editing existing zones
 * - Dragging zone vertices
 * - Deleting zones
 */

import { ref, computed } from 'vue'
import { useZoneStore, type ZoneConfig, type ZoneType, type ZoneSeverity, type ZoneVertex } from '../stores/zones'
import { pixelsToMeters } from '../utils/siteMapConversion'

export type ZoneEditorMode = 'none' | 'draw' | 'edit' | 'delete'

export interface ZoneEditorState {
  mode: ZoneEditorMode
  selectedZoneId: string | null
  hoveredZoneId: string | null
  hoveredVertexIndex: number | null
  draggingVertexIndex: number | null
}

export interface NewZoneDefaults {
  type: ZoneType
  severity: ZoneSeverity
  color: string
  cooldownMs: number
}

const DEFAULT_NEW_ZONE: NewZoneDefaults = {
  type: 'restricted',
  severity: 'high',
  color: '#ef4444',
  cooldownMs: 30000,
}

export function useZoneEditor(siteConfigId: string) {
  const zoneStore = useZoneStore()

  // Editor state
  const mode = ref<ZoneEditorMode>('none')
  const selectedZoneId = ref<string | null>(null)
  const hoveredZoneId = ref<string | null>(null)
  const hoveredVertexIndex = ref<number | null>(null)
  const draggingVertexIndex = ref<number | null>(null)

  // Drawing state
  const drawingVertices = ref<ZoneVertex[]>([])
  const cursorPosition = ref<ZoneVertex | null>(null)
  const newZoneDefaults = ref<NewZoneDefaults>({ ...DEFAULT_NEW_ZONE })

  // Getters
  const selectedZone = computed(() =>
    selectedZoneId.value ? zoneStore.getZoneById(selectedZoneId.value) : null
  )

  const hoveredZone = computed(() =>
    hoveredZoneId.value ? zoneStore.getZoneById(hoveredZoneId.value) : null
  )

  const isDrawing = computed(() => mode.value === 'draw' && drawingVertices.value.length > 0)

  const canClosePolygon = computed(() => drawingVertices.value.length >= 3)

  // Mode management
  function setMode(newMode: ZoneEditorMode): void {
    // Clear state when switching modes
    if (newMode !== mode.value) {
      cancelDrawing()
      if (newMode !== 'edit') {
        selectedZoneId.value = null
      }
      hoveredZoneId.value = null
      hoveredVertexIndex.value = null
      draggingVertexIndex.value = null
    }
    mode.value = newMode
  }

  function enterDrawMode(defaults?: Partial<NewZoneDefaults>): void {
    if (defaults) {
      newZoneDefaults.value = { ...DEFAULT_NEW_ZONE, ...defaults }
    }
    setMode('draw')
  }

  function enterEditMode(): void {
    setMode('edit')
  }

  function enterDeleteMode(): void {
    setMode('delete')
  }

  function exitEditor(): void {
    setMode('none')
  }

  // Drawing operations
  function addDrawingVertex(x: number, y: number): void {
    if (mode.value !== 'draw') return

    // Round to grid (1m grid snapping)
    const snappedX = Math.round(x * 2) / 2 // Snap to 0.5m
    const snappedY = Math.round(y * 2) / 2

    // Check if clicking near first vertex to close
    if (drawingVertices.value.length >= 3) {
      const first = drawingVertices.value[0]
      const dist = Math.sqrt(Math.pow(snappedX - first.x, 2) + Math.pow(snappedY - first.y, 2))
      if (dist < 0.5) { // Within 0.5m of first vertex
        finishDrawing()
        return
      }
    }

    drawingVertices.value.push({ x: snappedX, y: snappedY })
  }

  function updateCursorPosition(x: number, y: number): void {
    // Snap to grid
    const snappedX = Math.round(x * 2) / 2
    const snappedY = Math.round(y * 2) / 2
    cursorPosition.value = { x: snappedX, y: snappedY }
  }

  function removeLastVertex(): void {
    if (drawingVertices.value.length > 0) {
      drawingVertices.value.pop()
    }
  }

  function cancelDrawing(): void {
    drawingVertices.value = []
    cursorPosition.value = null
  }

  async function finishDrawing(name?: string): Promise<ZoneConfig | null> {
    if (drawingVertices.value.length < 3) {
      cancelDrawing()
      return null
    }

    const zone = await zoneStore.createZone({
      siteConfigId,
      name: name || `Zone ${zoneStore.zones.length + 1}`,
      type: newZoneDefaults.value.type,
      vertices: [...drawingVertices.value],
      enabled: true,
      severity: newZoneDefaults.value.severity,
      color: newZoneDefaults.value.color,
      cooldownMs: newZoneDefaults.value.cooldownMs,
    })

    cancelDrawing()
    return zone
  }

  // Selection operations
  function selectZone(zoneId: string | null): void {
    selectedZoneId.value = zoneId
    if (zoneId && mode.value === 'none') {
      mode.value = 'edit'
    }
  }

  function clearSelection(): void {
    selectedZoneId.value = null
    hoveredVertexIndex.value = null
    draggingVertexIndex.value = null
  }

  // Hover operations
  function setHoveredZone(zoneId: string | null): void {
    hoveredZoneId.value = zoneId
  }

  function setHoveredVertex(index: number | null): void {
    hoveredVertexIndex.value = index
  }

  // Vertex editing
  function startDraggingVertex(index: number): void {
    if (mode.value !== 'edit' || !selectedZoneId.value) return
    draggingVertexIndex.value = index
  }

  function updateDraggingVertex(x: number, y: number): void {
    if (draggingVertexIndex.value === null || !selectedZone.value) return

    // Snap to grid
    const snappedX = Math.round(x * 2) / 2
    const snappedY = Math.round(y * 2) / 2

    // Update vertex in local state (will be saved on drop)
    const newVertices = [...selectedZone.value.vertices]
    newVertices[draggingVertexIndex.value] = { x: snappedX, y: snappedY }

    // Update store immediately for visual feedback (optimistic update)
    const zoneIndex = zoneStore.zones.findIndex(z => z.id === selectedZoneId.value)
    if (zoneIndex !== -1) {
      zoneStore.zones[zoneIndex] = {
        ...zoneStore.zones[zoneIndex],
        vertices: newVertices,
      }
    }
  }

  async function finishDraggingVertex(): Promise<void> {
    if (draggingVertexIndex.value === null || !selectedZone.value) {
      draggingVertexIndex.value = null
      return
    }

    // Save the updated vertices to the server
    await zoneStore.updateZone(selectedZone.value.id, {
      vertices: selectedZone.value.vertices,
    })

    draggingVertexIndex.value = null
  }

  // Zone operations
  async function deleteSelectedZone(): Promise<boolean> {
    if (!selectedZoneId.value) return false

    const success = await zoneStore.deleteZone(selectedZoneId.value)
    if (success) {
      selectedZoneId.value = null
    }
    return success
  }

  async function deleteZone(zoneId: string): Promise<boolean> {
    const success = await zoneStore.deleteZone(zoneId)
    if (success && selectedZoneId.value === zoneId) {
      selectedZoneId.value = null
    }
    return success
  }

  async function toggleZoneEnabled(zoneId: string): Promise<boolean> {
    return zoneStore.toggleZone(zoneId)
  }

  async function updateZone(zoneId: string, updates: Partial<ZoneConfig>): Promise<ZoneConfig | null> {
    return zoneStore.updateZone(zoneId, updates)
  }

  // Pixel-based event handlers (for direct canvas interaction)
  function handleCanvasClick(pixelX: number, pixelY: number, findZoneAtPoint: (x: number, y: number) => ZoneConfig | null): void {
    const meterX = pixelsToMeters(pixelX)
    const meterY = pixelsToMeters(pixelY)

    switch (mode.value) {
      case 'draw':
        addDrawingVertex(meterX, meterY)
        break

      case 'edit':
        // Check if clicking on a vertex of selected zone
        if (selectedZone.value && hoveredVertexIndex.value !== null) {
          startDraggingVertex(hoveredVertexIndex.value)
        } else {
          // Select zone at click position
          const zone = findZoneAtPoint(pixelX, pixelY)
          selectZone(zone?.id ?? null)
        }
        break

      case 'delete':
        const zoneToDelete = findZoneAtPoint(pixelX, pixelY)
        if (zoneToDelete) {
          deleteZone(zoneToDelete.id)
        }
        break

      case 'none':
        // Select zone for viewing
        const clickedZone = findZoneAtPoint(pixelX, pixelY)
        if (clickedZone) {
          selectZone(clickedZone.id)
        }
        break
    }
  }

  function handleCanvasMouseMove(
    pixelX: number,
    pixelY: number,
    findZoneAtPoint: (x: number, y: number) => ZoneConfig | null,
    findVertexAtPoint?: (x: number, y: number, zone: ZoneConfig) => { vertexIndex: number } | null
  ): void {
    const meterX = pixelsToMeters(pixelX)
    const meterY = pixelsToMeters(pixelY)

    // Update cursor position for drawing preview
    if (mode.value === 'draw') {
      updateCursorPosition(meterX, meterY)
    }

    // Handle vertex dragging
    if (draggingVertexIndex.value !== null) {
      updateDraggingVertex(meterX, meterY)
      return
    }

    // Update hovered zone
    const zone = findZoneAtPoint(pixelX, pixelY)
    setHoveredZone(zone?.id ?? null)

    // Update hovered vertex for selected zone
    if (mode.value === 'edit' && selectedZone.value && findVertexAtPoint) {
      const vertex = findVertexAtPoint(pixelX, pixelY, selectedZone.value)
      setHoveredVertex(vertex?.vertexIndex ?? null)
    } else {
      setHoveredVertex(null)
    }
  }

  function handleCanvasMouseUp(): void {
    if (draggingVertexIndex.value !== null) {
      finishDraggingVertex()
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        if (mode.value === 'draw' && drawingVertices.value.length > 0) {
          cancelDrawing()
        } else {
          exitEditor()
        }
        break

      case 'Backspace':
      case 'Delete':
        if (mode.value === 'draw') {
          removeLastVertex()
        } else if (mode.value === 'edit' && selectedZoneId.value) {
          // Could delete selected zone, but require explicit action
        }
        break

      case 'Enter':
        if (mode.value === 'draw' && canClosePolygon.value) {
          finishDrawing()
        }
        break
    }
  }

  // Set zone defaults for drawing
  function setZoneDefaults(defaults: Partial<NewZoneDefaults>): void {
    newZoneDefaults.value = { ...newZoneDefaults.value, ...defaults }
  }

  return {
    // State
    mode,
    selectedZoneId,
    hoveredZoneId,
    hoveredVertexIndex,
    draggingVertexIndex,
    drawingVertices,
    cursorPosition,
    newZoneDefaults,

    // Getters
    selectedZone,
    hoveredZone,
    isDrawing,
    canClosePolygon,

    // Mode management
    setMode,
    enterDrawMode,
    enterEditMode,
    enterDeleteMode,
    exitEditor,

    // Drawing
    addDrawingVertex,
    updateCursorPosition,
    removeLastVertex,
    cancelDrawing,
    finishDrawing,
    setZoneDefaults,

    // Selection
    selectZone,
    clearSelection,
    setHoveredZone,
    setHoveredVertex,

    // Vertex editing
    startDraggingVertex,
    updateDraggingVertex,
    finishDraggingVertex,

    // Zone operations
    deleteSelectedZone,
    deleteZone,
    toggleZoneEnabled,
    updateZone,

    // Event handlers
    handleCanvasClick,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleKeyDown,
  }
}
