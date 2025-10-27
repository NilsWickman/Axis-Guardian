<template>
  <div class="flex gap-2 flex-wrap">
    <!-- View Controls -->
    <button
      @click="$emit('toggleGrid')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
      :class="showGrid ? 'bg-accent' : ''"
      title="Toggle Grid (G)"
    >
      Grid
    </button>

    <button
      v-if="showLabelsToggle"
      @click="$emit('toggleLabels')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
      :class="showLabels ? 'bg-accent' : ''"
      title="Toggle Camera Labels (L)"
    >
      Labels
    </button>

    <button
      v-if="showPersonPositionsToggle"
      @click="$emit('togglePersonPositions')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
      :class="showPersonPositions ? 'bg-accent' : ''"
      title="Toggle Person Positions (P)"
    >
      👤 Positions
    </button>

    <button
      v-if="showSnapToggle"
      @click="$emit('toggleSnap')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-xs transition-colors"
      :class="snapToGrid ? 'bg-accent' : ''"
      title="Toggle Snap to Grid (S)"
    >
      🧲 Snap
    </button>

    <!-- Zoom Controls -->
    <template v-if="showZoomControls">
      <div class="w-px bg-border"></div>

      <button
        @click="$emit('zoomOut')"
        class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm transition-colors"
        title="Zoom Out (-)"
      >
        −
      </button>

      <button
        @click="$emit('zoomIn')"
        class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm transition-colors"
        title="Zoom In (+)"
      >
        +
      </button>

      <button
        v-if="showResetZoom"
        @click="$emit('resetZoom')"
        class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm transition-colors"
        title="Reset Zoom (0)"
      >
        100%
      </button>
    </template>

    <!-- Undo/Redo (only in editor mode) -->
    <template v-if="showHistory">
      <div class="w-px bg-border"></div>

      <button
        @click="$emit('undo')"
        :disabled="!canUndo"
        class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm transition-colors"
        :class="!canUndo ? 'opacity-50 cursor-not-allowed' : ''"
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>

      <button
        @click="$emit('redo')"
        :disabled="!canRedo"
        class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm transition-colors"
        :class="!canRedo ? 'opacity-50 cursor-not-allowed' : ''"
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </template>

    <!-- Action Buttons -->
    <div class="flex-1"></div>

    <button
      v-if="showFitToView"
      @click="$emit('fitToView')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm"
      title="Fit to View (F)"
    >
      Fit to View
    </button>

    <button
      v-if="showResetView"
      @click="$emit('resetView')"
      class="px-3 py-1.5 border rounded-lg hover:bg-accent text-sm"
      title="Reset View (R)"
    >
      Reset View
    </button>

    <button
      v-if="showSave"
      @click="$emit('save')"
      class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-xs font-medium"
      title="Save Configuration (Ctrl+S)"
    >
      Save
    </button>

    <button
      v-if="showExport"
      @click="$emit('export')"
      class="px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary/10 text-xs font-medium"
      title="Export as JSON"
    >
      📥 Export
    </button>

    <label
      v-if="showImport"
      class="px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary/10 text-xs font-medium cursor-pointer inline-block"
      title="Import from JSON"
    >
      📤 Import
      <input
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="$emit('import', $event)"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showGrid?: boolean
  showScaleReference?: boolean
  showLabels?: boolean
  showLabelsToggle?: boolean
  showPersonPositions?: boolean
  showPersonPositionsToggle?: boolean
  snapToGrid?: boolean
  showSnapToggle?: boolean
  showHistory?: boolean
  canUndo?: boolean
  canRedo?: boolean
  showFitToView?: boolean
  showResetView?: boolean
  showSave?: boolean
  showExport?: boolean
  showImport?: boolean
  showZoomControls?: boolean
  showResetZoom?: boolean
}

withDefaults(defineProps<Props>(), {
  showGrid: true,
  showScaleReference: true,
  showLabels: true,
  showLabelsToggle: true,
  showPersonPositions: true,
  showPersonPositionsToggle: true,
  snapToGrid: false,
  showSnapToggle: false,
  showHistory: false,
  canUndo: false,
  canRedo: false,
  showFitToView: false,
  showResetView: false,
  showSave: false,
  showExport: false,
  showImport: false,
  showZoomControls: false,
  showResetZoom: false
})

defineEmits<{
  toggleGrid: []
  toggleScale: []
  toggleLabels: []
  togglePersonPositions: []
  toggleSnap: []
  undo: []
  redo: []
  fitToView: []
  resetView: []
  save: []
  export: []
  import: [event: Event]
  zoomIn: []
  zoomOut: []
  resetZoom: []
}>()
</script>
