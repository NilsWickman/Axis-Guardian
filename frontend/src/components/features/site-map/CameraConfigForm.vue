<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between border-b pb-2">
      <h3 class="text-sm font-semibold">{{ cameraName }}</h3>
      <span class="text-[9px] text-muted-foreground">{{ isUpdating ? 'Editing' : 'New Placement' }}</span>
    </div>

    <!-- Position - Dual Column -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium mb-1">Position X</label>
        <input
          :value="config.x"
          @input="updateConfig('x', $event)"
          type="number"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.x ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="X"
        />
        <p v-if="validationErrors.x" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.x }}</p>
      </div>
      <div>
        <label class="block text-xs font-medium mb-1">Position Y</label>
        <input
          :value="config.y"
          @input="updateConfig('y', $event)"
          type="number"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.y ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="Y"
        />
        <p v-if="validationErrors.y" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.y }}</p>
      </div>
    </div>

    <!-- Rotation and Angle - Dual Column -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium mb-1">Rotation (pan)</label>
        <input
          :value="config.rotation"
          @input="updateConfig('rotation', $event)"
          type="number"
          min="0"
          max="360"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.rotation ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="0-360"
        />
        <input
          :value="config.rotation"
          @input="updateConfig('rotation', $event)"
          type="range"
          min="0"
          max="360"
          class="w-full mt-1"
        />
        <p v-if="validationErrors.rotation" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.rotation }}</p>
      </div>
      <div>
        <label class="block text-xs font-medium mb-1">Down Angle (0°=horizon, 90°=floor)</label>
        <input
          :value="config.angle"
          @input="updateConfig('angle', $event)"
          type="number"
          min="0"
          max="90"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.angle ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="0-90"
        />
        <input
          :value="config.angle"
          @input="updateConfig('angle', $event)"
          type="range"
          min="0"
          max="90"
          class="w-full mt-1"
        />
        <p v-if="validationErrors.angle" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.angle }}</p>
      </div>
    </div>

    <!-- Height and FOV - Dual Column -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-xs font-medium mb-1">Height (meters)</label>
        <input
          :value="config.height"
          @input="updateConfig('height', $event)"
          type="number"
          min="0"
          max="50"
          step="0.1"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.height ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="e.g. 3.0"
        />
        <p v-if="validationErrors.height" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.height }}</p>
      </div>
      <div>
        <label class="block text-xs font-medium mb-1">FOV (degrees)</label>
        <input
          :value="config.fov"
          @input="updateConfig('fov', $event)"
          type="number"
          min="30"
          max="180"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          :class="validationErrors.fov ? 'border-red-500 focus:ring-red-500' : ''"
          placeholder="30-180"
        />
        <input
          :value="config.fov"
          @input="updateConfig('fov', $event)"
          type="range"
          min="30"
          max="180"
          class="w-full mt-1"
        />
        <p v-if="validationErrors.fov" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.fov }}</p>
      </div>
    </div>

    <!-- View Distance with Auto-Calculate -->
    <div>
      <div class="flex items-center justify-between mb-1">
        <label class="block text-xs font-medium">View Distance (pixels)</label>
        <label class="flex items-center gap-1 text-[10px] cursor-pointer">
          <input
            :checked="config.autoCalculateDistance"
            @change="updateConfig('autoCalculateDistance', $event)"
            type="checkbox"
            class="w-3 h-3 rounded"
          />
          Auto-calc
        </label>
      </div>
      <input
        :value="config.viewDistance"
        @input="updateConfig('viewDistance', $event)"
        type="number"
        min="50"
        max="500"
        :disabled="config.autoCalculateDistance"
        class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        :class="{
          'opacity-50 cursor-not-allowed': config.autoCalculateDistance,
          'border-red-500 focus:ring-red-500': validationErrors.viewDistance
        }"
        placeholder="50-500"
      />
      <p v-if="config.autoCalculateDistance && calculatedDistance" class="text-[10px] text-muted-foreground mt-1">
        Calculated: {{ calculatedDistance.toFixed(1) }}px ({{ (calculatedDistance / pixelsPerMeter).toFixed(1) }}m @ {{ pixelsPerMeter }}px/m)
      </p>
      <p v-if="validationErrors.viewDistance" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.viewDistance }}</p>
    </div>

    <!-- Color -->
    <div>
      <label class="block text-xs font-medium mb-1">Camera Icon Color</label>
      <input
        :value="config.color"
        @input="updateConfig('color', $event)"
        type="color"
        class="w-full h-9 px-2 py-1 border rounded-lg bg-background cursor-pointer"
      />
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-xs font-medium mb-1">Notes</label>
      <textarea
        :value="config.notes"
        @input="updateConfig('notes', $event)"
        class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        rows="2"
        placeholder="Additional notes..."
      ></textarea>
    </div>

    <div class="flex gap-2">
      <button
        @click="$emit('save')"
        class="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        :disabled="!isValid"
        :class="!isValid ? 'opacity-50 cursor-not-allowed' : ''"
      >
        {{ isUpdating ? 'Update' : 'Add to Map' }}
      </button>
      <button
        v-if="isUpdating"
        @click="$emit('remove')"
        class="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CameraConfig } from '../../../composables/useCameraPlacement'

interface Props {
  config: CameraConfig
  cameraName: string
  isUpdating: boolean
  calculatedDistance: number
  validationErrors: Record<string, string>
  isValid: boolean
  pixelsPerMeter?: number
}

const props = withDefaults(defineProps<Props>(), {
  pixelsPerMeter: 50
})

const emit = defineEmits<{
  update: [field: keyof CameraConfig, value: any]
  save: []
  remove: []
}>()

const updateConfig = (field: keyof CameraConfig, event: Event) => {
  const target = event.target as HTMLInputElement
  let value: any = target.value

  // Handle different input types
  if (target.type === 'number') {
    value = parseFloat(value)
  } else if (target.type === 'checkbox') {
    value = target.checked
  } else if (target.type === 'range') {
    value = parseFloat(value)
  }

  emit('update', field, value)
}
</script>
