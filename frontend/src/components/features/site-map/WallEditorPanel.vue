<template>
  <div class="space-y-3 border-t pt-3">
    <h3 class="text-sm font-semibold">Wall Editor</h3>

    <!-- Mode Selection -->
    <div class="grid grid-cols-3 gap-2">
      <button
        @click="$emit('set-mode', 'draw')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'draw' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
      >
        ✏️ Draw
      </button>
      <button
        @click="$emit('set-mode', 'edit')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'edit' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
      >
        ✂️ Edit
      </button>
      <button
        @click="$emit('set-mode', 'delete')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'delete' ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border hover:bg-accent'"
      >
        🗑️ Delete
      </button>
    </div>

    <!-- Wall Type Selection (for drawing) -->
    <div v-if="mode === 'draw'" class="space-y-2">
      <div>
        <label class="block text-[10px] font-medium mb-1">Wall Type</label>
        <select
          :value="wallType"
          @change="$emit('set-wall-type', ($event.target as HTMLSelectElement).value as 'external' | 'internal' | 'door')"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        >
          <option value="internal">Internal Wall</option>
          <option value="external">External Wall</option>
          <option value="door">Door</option>
        </select>
      </div>

      <div>
        <label class="block text-[10px] font-medium mb-1">Thickness (px)</label>
        <input
          :value="thickness"
          @input="$emit('set-thickness', Number(($event.target as HTMLInputElement).value))"
          type="number"
          min="1"
          max="20"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        />
      </div>

      <div class="text-xs text-muted-foreground bg-muted p-2 rounded">
        Click and drag on the canvas to draw a wall
      </div>
    </div>

    <!-- Edit Mode Info -->
    <div v-if="mode === 'edit'" class="text-xs text-muted-foreground bg-muted p-2 rounded">
      Click on a wall to select it. Selected walls can be moved by dragging the endpoints.
    </div>

    <!-- Delete Mode Info -->
    <div v-if="mode === 'delete'" class="text-xs text-muted-foreground bg-muted p-2 rounded">
      Click on a wall to delete it
    </div>

    <!-- Selected Wall Info -->
    <div v-if="selectedWall" class="space-y-2 border-t pt-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium">Selected Wall</span>
        <button
          @click="$emit('delete-wall')"
          class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
        >
          Delete
        </button>
      </div>
      <div class="text-[10px] text-muted-foreground">
        <div>Type: {{ selectedWall.type || 'internal' }}</div>
        <div>From: ({{ Math.round(selectedWall.start.x) }}, {{ Math.round(selectedWall.start.y) }})</div>
        <div>To: ({{ Math.round(selectedWall.end.x) }}, {{ Math.round(selectedWall.end.y) }})</div>
      </div>
    </div>

    <!-- Exit Button -->
    <button
      @click="$emit('set-mode', 'none')"
      class="w-full px-3 py-1.5 text-sm border rounded-lg hover:bg-accent"
    >
      Exit Wall Editor
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Wall } from '../../../stores/siteMaps'
import type { WallEditorMode } from '../../../composables/useWallEditor'

interface Props {
  mode: WallEditorMode
  wallType: 'external' | 'internal' | 'door'
  thickness: number
  selectedWall: Wall | null
}

defineProps<Props>()

defineEmits<{
  'set-mode': [mode: WallEditorMode]
  'set-wall-type': [type: 'external' | 'internal' | 'door']
  'set-thickness': [thickness: number]
  'delete-wall': []
}>()
</script>
