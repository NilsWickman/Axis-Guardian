<template>
  <div class="space-y-3">
    <div class="border-b pb-2">
      <div class="flex items-center gap-2 mb-1">
        <div class="flex-1 px-2 py-1 text-sm font-semibold">
          {{ cameraName }}
        </div>
        <!-- Color Picker Button -->
        <div class="relative">
          <button
            @click="showColorPicker = !showColorPicker"
            type="button"
            class="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
            :style="{ backgroundColor: getColorHex(config.color), borderColor: getColorHex(config.color) }"
            title="Change color"
          ></button>

          <!-- Color Picker Popup -->
          <div
            v-if="showColorPicker"
            class="absolute right-0 top-10 z-50 p-3 bg-popover border rounded-lg shadow-lg"
          >
            <div class="grid grid-cols-5 gap-2 w-48">
              <button
                v-for="color in colorPalette"
                :key="color"
                type="button"
                @click="selectColor(color)"
                class="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
                :class="config.color === color ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ backgroundColor: getColorHex(color) }"
                :title="color"
              ></button>
            </div>
          </div>
        </div>
      </div>
      <span class="text-[9px] text-muted-foreground">{{ isUpdating ? 'Editing' : 'New Placement' }}</span>
    </div>

    <!-- Position - Dual Column -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[10px] font-medium mb-1">Position X</label>
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
        <label class="block text-[10px] font-medium mb-1">Position Y</label>
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
        <label class="block text-[10px] font-medium mb-1">Rotation (pan)</label>
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
          class="w-full mt-1 accent-primary"
        />
        <p v-if="validationErrors.rotation" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.rotation }}</p>
      </div>
      <div>
        <label class="block text-[10px] font-medium mb-1">Down Angle</label>
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
          class="w-full mt-1 accent-primary"
        />
        <p v-if="validationErrors.angle" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.angle }}</p>
      </div>
    </div>

    <!-- Height and FOV - Dual Column -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="block text-[10px] font-medium mb-1">Height (meters)</label>
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
        <label class="block text-[10px] font-medium mb-1">FOV (degrees)</label>
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
          class="w-full mt-1 accent-primary"
        />
        <p v-if="validationErrors.fov" class="text-[10px] text-red-500 mt-0.5">{{ validationErrors.fov }}</p>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-[10px] font-medium mb-1">Description</label>
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
import { ref, onMounted, onUnmounted } from 'vue'
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

const showColorPicker = ref(false)

const colorPalette = [
  'red-400', 'red-500',
  'orange-400', 'orange-500',
  'amber-400', 'amber-500',
  'yellow-400', 'yellow-500',
  'lime-400', 'lime-500',
  'green-400', 'green-500',
  'emerald-400', 'emerald-500',
  'teal-400', 'teal-500',
  'cyan-400', 'cyan-500',
  'sky-400', 'sky-500',
  'blue-400', 'blue-500',
  'indigo-400', 'indigo-500',
  'violet-400', 'violet-500',
  'purple-400', 'purple-500',
  'fuchsia-400', 'fuchsia-500',
  'pink-400', 'pink-500',
  'rose-400', 'rose-500',
]

const TAILWIND_COLOR_MAP: Record<string, string> = {
  'red-400': '#f87171', 'red-500': '#ef4444',
  'orange-400': '#fb923c', 'orange-500': '#f97316',
  'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
  'yellow-400': '#facc15', 'yellow-500': '#eab308',
  'lime-400': '#a3e635', 'lime-500': '#84cc16',
  'green-400': '#4ade80', 'green-500': '#22c55e',
  'emerald-400': '#34d399', 'emerald-500': '#10b981',
  'teal-400': '#2dd4bf', 'teal-500': '#14b8a6',
  'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
  'sky-400': '#38bdf8', 'sky-500': '#0ea5e9',
  'blue-400': '#60a5fa', 'blue-500': '#3b82f6',
  'indigo-400': '#818cf8', 'indigo-500': '#6366f1',
  'violet-400': '#a78bfa', 'violet-500': '#8b5cf6',
  'purple-400': '#c084fc', 'purple-500': '#a855f7',
  'fuchsia-400': '#e879f9', 'fuchsia-500': '#d946ef',
  'pink-400': '#f472b6', 'pink-500': '#ec4899',
  'rose-400': '#fb7185', 'rose-500': '#f43f5e',
}

const getColorHex = (color: string): string => {
  if (color.startsWith('#')) return color
  const cleanColor = color.replace(/^bg-/, '')
  return TAILWIND_COLOR_MAP[cleanColor] || '#6366f1'
}

const selectColor = (color: string) => {
  emit('update', 'color', color)
  showColorPicker.value = false
}

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

// Close color picker when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showColorPicker.value && !target.closest('.relative')) {
    showColorPicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
