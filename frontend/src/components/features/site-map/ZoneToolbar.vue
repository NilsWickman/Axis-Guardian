<template>
  <div class="flex items-center gap-2 p-2 bg-background/95 backdrop-blur rounded-lg border shadow-sm">
    <!-- Mode indicator -->
    <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs">
      <span
        class="w-2 h-2 rounded-full"
        :class="getModeIndicatorClass()"
      ></span>
      <span class="font-medium">{{ getModeLabel() }}</span>
    </div>

    <!-- Mode buttons -->
    <div class="flex gap-1 border-l pl-2">
      <button
        @click="$emit('set-mode', 'draw')"
        class="p-1.5 rounded text-xs transition-colors"
        :class="mode === 'draw' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
        title="Draw new zone (D)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 12 12 12 19 5 3" />
        </svg>
      </button>
      <button
        @click="$emit('set-mode', 'edit')"
        class="p-1.5 rounded text-xs transition-colors"
        :class="mode === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
        title="Edit zones (E)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        @click="$emit('set-mode', 'delete')"
        class="p-1.5 rounded text-xs transition-colors"
        :class="mode === 'delete' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-accent'"
        title="Delete zones (X)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>

    <!-- Zone type selector (when drawing) -->
    <div v-if="mode === 'draw'" class="flex items-center gap-1 border-l pl-2">
      <select
        :value="zoneType"
        @change="$emit('set-zone-type', ($event.target as HTMLSelectElement).value as ZoneType)"
        class="px-2 py-1 text-xs border rounded bg-background"
      >
        <option value="restricted">Restricted</option>
        <option value="entry">Entry</option>
        <option value="exit">Exit</option>
        <option value="monitored">Monitored</option>
      </select>
      <input
        type="color"
        :value="color"
        @input="$emit('set-color', ($event.target as HTMLInputElement).value)"
        class="w-6 h-6 border rounded cursor-pointer"
        title="Zone color"
      />
    </div>

    <!-- Drawing info -->
    <div v-if="mode === 'draw' && drawingVertexCount > 0" class="text-xs text-muted-foreground border-l pl-2">
      {{ drawingVertexCount }} point{{ drawingVertexCount !== 1 ? 's' : '' }}
      <span v-if="drawingVertexCount >= 3" class="text-primary">(ready to close)</span>
    </div>

    <!-- Cancel/Done buttons when drawing -->
    <div v-if="mode === 'draw' && drawingVertexCount > 0" class="flex gap-1 border-l pl-2">
      <button
        @click="$emit('cancel-drawing')"
        class="px-2 py-1 text-xs border rounded hover:bg-accent"
      >
        Cancel
      </button>
      <button
        v-if="drawingVertexCount >= 3"
        @click="$emit('finish-drawing')"
        class="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Done
      </button>
    </div>

    <!-- Exit button -->
    <button
      @click="$emit('exit')"
      class="p-1.5 rounded text-xs hover:bg-accent border-l pl-2"
      title="Exit zone editor (Esc)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <!-- Help text -->
    <div class="text-[10px] text-muted-foreground ml-2">
      {{ getHelpText() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ZoneType } from '../../../stores/zones'
import type { ZoneEditorMode } from '../../../composables/useZoneEditor'

interface Props {
  mode: ZoneEditorMode
  zoneType: ZoneType
  color: string
  drawingVertexCount: number
}

const props = defineProps<Props>()

defineEmits<{
  'set-mode': [mode: ZoneEditorMode]
  'set-zone-type': [type: ZoneType]
  'set-color': [color: string]
  'cancel-drawing': []
  'finish-drawing': []
  'exit': []
}>()

function getModeLabel(): string {
  switch (props.mode) {
    case 'draw':
      return 'Drawing'
    case 'edit':
      return 'Editing'
    case 'delete':
      return 'Deleting'
    default:
      return 'Zone Editor'
  }
}

function getModeIndicatorClass(): string {
  switch (props.mode) {
    case 'draw':
      return 'bg-green-500'
    case 'edit':
      return 'bg-blue-500'
    case 'delete':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function getHelpText(): string {
  switch (props.mode) {
    case 'draw':
      return props.drawingVertexCount === 0
        ? 'Click to start drawing'
        : props.drawingVertexCount < 3
        ? 'Click to add more points'
        : 'Click first point or press Enter to close'
    case 'edit':
      return 'Click to select, drag vertices to move'
    case 'delete':
      return 'Click a zone to delete it'
    default:
      return 'Select a mode to begin'
  }
}
</script>
