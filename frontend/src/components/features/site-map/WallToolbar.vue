<template>
  <div v-if="isActive" class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-2">
    <!-- Mode Buttons -->
    <div class="flex gap-1 border-r pr-2">
      <button
        @click="$emit('set-mode', 'draw')"
        class="px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 border-2"
        :class="mode === 'draw' ? 'border-primary' : 'border-transparent hover:bg-accent'"
        title="Draw mode (D)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span>Draw</span>
      </button>

      <!-- Wall Type Selector (inline with Draw button) -->
      <select
        v-if="mode === 'draw'"
        :value="wallType"
        @change="$emit('set-wall-type', ($event.target as HTMLSelectElement).value as 'external' | 'internal' | 'door')"
        class="px-2 py-1 text-sm border rounded bg-background"
        title="Wall type"
      >
        <option value="internal">Internal (1)</option>
        <option value="external">External (2)</option>
        <option value="door">Door (3)</option>
      </select>

      <button
        @click="$emit('set-mode', 'edit')"
        class="px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 border-2"
        :class="mode === 'edit' ? 'border-primary' : 'border-transparent hover:bg-accent'"
        title="Edit mode (E)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Edit</span>
      </button>
      <button
        @click="$emit('set-mode', 'delete')"
        class="px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 border-2"
        :class="mode === 'delete' ? 'border-destructive' : 'border-transparent hover:bg-accent'"
        title="Delete mode (X)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </button>
    </div>

    <!-- Grid Snap Toggle -->
    <div class="flex items-center gap-2 border-r pr-2">
      <button
        @click="$emit('toggle-grid')"
        class="px-2 py-1 text-xs rounded transition-colors flex items-center gap-1"
        :class="showGrid ? 'bg-accent' : 'hover:bg-accent'"
        :title="`Grid & Snap: ${showGrid ? 'On' : 'Off'}`"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Grid
      </button>
    </div>

    <!-- View Controls -->
    <div class="flex items-center gap-1 border-r pr-2">
      <button
        @click="$emit('undo')"
        :disabled="!canUndo"
        class="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        @click="$emit('redo')"
        :disabled="!canRedo"
        class="px-2 py-1 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </button>
      <button
        @click="$emit('zoom-in')"
        class="px-2 py-1 text-xs rounded hover:bg-accent"
        title="Zoom In"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </button>
      <button
        @click="$emit('zoom-out')"
        class="px-2 py-1 text-xs rounded hover:bg-accent"
        title="Zoom Out"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </button>
      <button
        @click="$emit('reset-view')"
        class="px-2 py-1 text-xs rounded hover:bg-accent"
        title="Reset View"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>

    <!-- Selected Wall Actions -->
    <div v-if="selectedWall" class="flex items-center gap-2 border-r pr-2">
      <span class="text-xs text-muted-foreground">
        Selected: {{ selectedWall.type || 'internal' }} wall
      </span>
      <button
        @click="$emit('delete-wall')"
        class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Wall } from '../../../stores/siteMaps'
import type { WallEditorMode } from '../../../composables/useWallEditor'

interface Props {
  isActive: boolean
  mode: WallEditorMode
  wallType: 'external' | 'internal' | 'door'
  selectedWall: Wall | null
  showGrid: boolean
  canUndo: boolean
  canRedo: boolean
}

defineProps<Props>()

defineEmits<{
  'set-mode': [mode: WallEditorMode]
  'set-wall-type': [type: 'external' | 'internal' | 'door']
  'delete-wall': []
  'toggle-grid': []
  'undo': []
  'redo': []
  'zoom-in': []
  'zoom-out': []
  'reset-view': []
}>()
</script>
