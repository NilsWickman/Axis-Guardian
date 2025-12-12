/**
 * Zone Editor Composable - Handles zone drawing and editing interactions
 *
 * Provides state and methods for:
 * - Drawing new zone polygons
 * - Selecting and editing existing zones
 * - Deleting zones
 */

import { ref } from 'vue'
import type { ZoneType, ZoneSeverity, ZoneVertex } from '../stores/zones'

export type ZoneEditorMode = 'none' | 'draw' | 'edit' | 'delete'

export function useZoneEditor() {
  // Editor state
  const mode = ref<ZoneEditorMode>('none')
  const selectedZoneId = ref<string | null>(null)
  const hoveredZoneId = ref<string | null>(null)

  // Drawing state
  const drawingVertices = ref<ZoneVertex[]>([])
  const currentMousePos = ref<ZoneVertex | null>(null)

  // New zone defaults
  const zoneType = ref<ZoneType>('restricted')
  const severity = ref<ZoneSeverity>('high')
  const color = ref('#ef4444')
  const cooldownMs = ref(30000)

  // Mode management
  function setMode(newMode: ZoneEditorMode): void {
    // Clear drawing state when switching modes
    if (newMode !== mode.value) {
      cancelDrawing()
      if (newMode !== 'edit') {
        selectedZoneId.value = null
      }
      hoveredZoneId.value = null
    }
    mode.value = newMode
  }

  // Drawing operations
  function addVertex(vertex: ZoneVertex): void {
    if (mode.value !== 'draw') return
    drawingVertices.value.push(vertex)
  }

  function updateMousePosition(pos: ZoneVertex): void {
    currentMousePos.value = pos
  }

  function cancelDrawing(): void {
    drawingVertices.value = []
    currentMousePos.value = null
  }

  // Selection operations
  function selectZone(zoneId: string | null): void {
    selectedZoneId.value = zoneId
  }

  function setHoveredZone(zoneId: string | null): void {
    hoveredZoneId.value = zoneId
  }

  // Zone type/color setters
  function setZoneType(type: ZoneType): void {
    zoneType.value = type
    // Set default color based on type
    switch (type) {
      case 'restricted':
        color.value = '#ef4444' // Red
        break
      case 'entry':
        color.value = '#22c55e' // Green
        break
      case 'exit':
        color.value = '#f97316' // Orange
        break
      case 'monitored':
        color.value = '#3b82f6' // Blue
        break
    }
  }

  function setSeverity(sev: ZoneSeverity): void {
    severity.value = sev
  }

  function setColor(c: string): void {
    color.value = c
  }

  function setCooldown(ms: number): void {
    cooldownMs.value = ms
  }

  return {
    // State
    mode,
    selectedZoneId,
    hoveredZoneId,
    drawingVertices,
    currentMousePos,
    zoneType,
    severity,
    color,
    cooldownMs,

    // Mode management
    setMode,

    // Drawing
    addVertex,
    updateMousePosition,
    cancelDrawing,

    // Selection
    selectZone,
    setHoveredZone,

    // Zone defaults
    setZoneType,
    setSeverity,
    setColor,
    setCooldown,
  }
}
