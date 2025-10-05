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
      class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
      title="Save Configuration (Ctrl+S)"
    >
      Save Configuration
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showGrid?: boolean
  showScaleReference?: boolean
  showLabels?: boolean
  showLabelsToggle?: boolean
  showHistory?: boolean
  canUndo?: boolean
  canRedo?: boolean
  showFitToView?: boolean
  showResetView?: boolean
  showSave?: boolean
  showZoomControls?: boolean
  showResetZoom?: boolean
}

withDefaults(defineProps<Props>(), {
  showGrid: true,
  showScaleReference: true,
  showLabels: true,
  showLabelsToggle: true,
  showHistory: false,
  canUndo: false,
  canRedo: false,
  showFitToView: false,
  showResetView: false,
  showSave: false,
  showZoomControls: false,
  showResetZoom: false
})

defineEmits<{
  toggleGrid: []
  toggleScale: []
  toggleLabels: []
  undo: []
  redo: []
  fitToView: []
  resetView: []
  save: []
  zoomIn: []
  zoomOut: []
  resetZoom: []
}>()
</script>
