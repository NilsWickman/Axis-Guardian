<template>
  <div class="overlay-controls">
    <div class="controls-group">
      <!-- Overlay Mode Toggle -->
      <div class="control-section">
        <label class="control-label">Overlay Mode</label>
        <div class="button-group">
          <button
            v-for="mode in overlayModes"
            :key="mode.value"
            :class="['mode-button', { active: modelValue.overlayMode === mode.value }]"
            @click="updateOverlayMode(mode.value)"
            :title="mode.description"
          >
            <component :is="mode.icon" class="mode-icon" />
            <span class="mode-label">{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="control-section">
        <label class="control-label">Display Options</label>
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input
              type="checkbox"
              :checked="modelValue.showLabels"
              @change="updateOption('showLabels', ($event.target as HTMLInputElement).checked)"
              :disabled="modelValue.overlayMode === 'off'"
            />
            <span>Show Labels</span>
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              :checked="modelValue.showConfidence"
              @change="updateOption('showConfidence', ($event.target as HTMLInputElement).checked)"
              :disabled="modelValue.overlayMode === 'off'"
            />
            <span>Show Confidence</span>
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              :checked="modelValue.showCoordinates"
              @change="updateOption('showCoordinates', ($event.target as HTMLInputElement).checked)"
            />
            <span>Show Coordinates</span>
          </label>
        </div>
      </div>

      <!-- Confidence Threshold Slider -->
      <div class="control-section" v-if="modelValue.overlayMode !== 'off'">
        <label class="control-label">
          Confidence Threshold: {{ Math.round(modelValue.confidenceThreshold * 100) }}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          :value="modelValue.confidenceThreshold * 100"
          @input="updateThreshold(($event.target as HTMLInputElement).value)"
          class="threshold-slider"
        />
        <div class="threshold-hints">
          <span>Low (0%)</span>
          <span>High (100%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'

export interface OverlaySettings {
  overlayMode: 'full' | 'minimal' | 'off'
  showLabels: boolean
  showConfidence: boolean
  showCoordinates: boolean
  confidenceThreshold: number
}

const props = defineProps<{
  modelValue: OverlaySettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: OverlaySettings]
}>()

// Overlay mode definitions with SVG icons
const overlayModes = [
  {
    value: 'full' as const,
    label: 'Full',
    description: 'Show bounding boxes, labels, and confidence scores',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }),
      h('path', { d: 'M7 7h10M7 12h10M7 17h7' })
    ])
  },
  {
    value: 'minimal' as const,
    label: 'Minimal',
    description: 'Show only bounding boxes',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' })
    ])
  },
  {
    value: 'off' as const,
    label: 'Off',
    description: 'Hide all detection overlays',
    icon: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M2 2l20 20M9 9v10M15 5v6' }),
      h('path', { d: 'M3 3l18 18' })
    ])
  }
]

function updateOverlayMode(mode: 'full' | 'minimal' | 'off') {
  emit('update:modelValue', {
    ...props.modelValue,
    overlayMode: mode
  })
}

function updateOption(key: keyof OverlaySettings, value: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

function updateThreshold(value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    confidenceThreshold: parseInt(value) / 100
  })
}
</script>

<style scoped>
.overlay-controls {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.controls-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Button Group */
.button-group {
  display: flex;
  gap: 8px;
}

.mode-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(51, 65, 85, 0.5);
  border: 2px solid transparent;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-button:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
}

.mode-button.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #3b82f6;
}

.mode-icon {
  width: 24px;
  height: 24px;
}

.mode-label {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(51, 65, 85, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  color: #e2e8f0;
  font-size: 0.875rem;
}

.checkbox-item:hover {
  background: rgba(51, 65, 85, 0.5);
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.checkbox-item input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Threshold Slider */
.threshold-slider {
  width: 100%;
  height: 6px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.threshold-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.threshold-slider::-webkit-slider-thumb:hover {
  background: #60a5fa;
  transform: scale(1.1);
}

.threshold-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.threshold-slider::-moz-range-thumb:hover {
  background: #60a5fa;
  transform: scale(1.1);
}

.threshold-hints {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}
</style>
