<template>
  <div
    v-if="visible"
    class="absolute bg-card border-2 border-primary rounded-lg shadow-xl p-4 z-50"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      minWidth: '280px'
    }"
  >
    <div class="mb-3">
      <h3 class="text-sm font-bold mb-1">Camera Configuration</h3>
      <p class="text-xs text-muted-foreground">{{ cameraName }}</p>
    </div>

    <div class="space-y-3">
      <!-- Height -->
      <div>
        <label class="block text-xs font-medium mb-1">
          Height (meters)
          <span class="text-muted-foreground font-normal">- mounting height</span>
        </label>
        <input
          v-model.number="localConfig.height"
          type="number"
          step="0.1"
          min="0.5"
          max="20"
          class="w-full px-2 py-1.5 text-sm border rounded bg-background"
          @keydown.enter="handleConfirm"
          @keydown.esc="handleCancel"
        />
      </div>

      <!-- Angle (Tilt) -->
      <div>
        <label class="block text-xs font-medium mb-1">
          Tilt Angle (degrees)
          <span class="text-muted-foreground font-normal">- 0° horizontal, 90° down</span>
        </label>
        <input
          v-model.number="localConfig.angle"
          type="number"
          step="1"
          min="0"
          max="90"
          class="w-full px-2 py-1.5 text-sm border rounded bg-background"
          @keydown.enter="handleConfirm"
          @keydown.esc="handleCancel"
        />
        <input
          v-model.number="localConfig.angle"
          type="range"
          min="0"
          max="90"
          step="1"
          class="w-full mt-1"
        />
      </div>

      <!-- Rotation (Pan) -->
      <div>
        <label class="block text-xs font-medium mb-1">
          Rotation (degrees)
          <span class="text-muted-foreground font-normal">- 0° right, 90° down, 180° left</span>
        </label>
        <input
          v-model.number="localConfig.rotation"
          type="number"
          step="1"
          min="0"
          max="360"
          class="w-full px-2 py-1.5 text-sm border rounded bg-background"
          @keydown.enter="handleConfirm"
          @keydown.esc="handleCancel"
        />
        <input
          v-model.number="localConfig.rotation"
          type="range"
          min="0"
          max="360"
          step="1"
          class="w-full mt-1"
        />
      </div>
    </div>

    <div class="flex gap-2 mt-4">
      <button
        @click="handleConfirm"
        class="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
      >
        Place Camera
      </button>
      <button
        @click="handleCancel"
        class="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded hover:bg-secondary/90 transition-colors"
      >
        Cancel
      </button>
    </div>

    <p class="text-xs text-muted-foreground mt-2 text-center">
      Press Enter to confirm, Esc to cancel
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface CameraConfig {
  height: number
  angle: number
  rotation: number
}

interface Props {
  visible: boolean
  position: { x: number; y: number }
  cameraName: string
  config: CameraConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: [config: CameraConfig]
  cancel: []
}>()

const localConfig = ref<CameraConfig>({
  height: props.config.height,
  angle: props.config.angle,
  rotation: props.config.rotation
})

// Update local config when props change
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

const handleConfirm = () => {
  emit('confirm', { ...localConfig.value })
}

const handleCancel = () => {
  emit('cancel')
}
</script>
