<template>
  <div class="space-y-3 border-t pt-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">Bulk Edit ({{ selectedCount }} cameras)</h3>
      <button
        @click="$emit('clear-selection')"
        class="text-xs text-muted-foreground hover:text-foreground"
      >
        Clear
      </button>
    </div>

    <div class="space-y-2">
      <!-- Rotation -->
      <div>
        <label class="block text-[10px] font-medium mb-1">Rotation (pan)</label>
        <div class="flex gap-2">
          <input
            v-model.number="bulkConfig.rotation"
            type="number"
            min="0"
            max="360"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Leave empty to keep"
          />
          <button
            @click="applyField('rotation')"
            class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/90 rounded"
            :disabled="bulkConfig.rotation === null"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Angle -->
      <div>
        <label class="block text-[10px] font-medium mb-1">Down Angle</label>
        <div class="flex gap-2">
          <input
            v-model.number="bulkConfig.angle"
            type="number"
            min="0"
            max="90"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Leave empty to keep"
          />
          <button
            @click="applyField('angle')"
            class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/90 rounded"
            :disabled="bulkConfig.angle === null"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Height -->
      <div>
        <label class="block text-[10px] font-medium mb-1">Height (meters)</label>
        <div class="flex gap-2">
          <input
            v-model.number="bulkConfig.height"
            type="number"
            min="0"
            max="50"
            step="0.1"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Leave empty to keep"
          />
          <button
            @click="applyField('height')"
            class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/90 rounded"
            :disabled="bulkConfig.height === null"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- FOV -->
      <div>
        <label class="block text-[10px] font-medium mb-1">FOV (degrees)</label>
        <div class="flex gap-2">
          <input
            v-model.number="bulkConfig.fov"
            type="number"
            min="30"
            max="180"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
            placeholder="Leave empty to keep"
          />
          <button
            @click="applyField('fov')"
            class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/90 rounded"
            :disabled="bulkConfig.fov === null"
          >
            Apply
          </button>
        </div>
      </div>

      <!-- Color -->
      <div>
        <label class="block text-[10px] font-medium mb-1">Color</label>
        <div class="flex gap-2">
          <select
            v-model="bulkConfig.color"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option :value="null">Keep current</option>
            <option v-for="color in colorOptions" :key="color" :value="color">
              {{ color }}
            </option>
          </select>
          <button
            @click="applyField('color')"
            class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/90 rounded"
            :disabled="bulkConfig.color === null"
          >
            Apply
          </button>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button
          @click="applyAll"
          class="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Apply All Changes
        </button>
        <button
          @click="deleteSelected"
          class="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

interface Props {
  selectedCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  'apply-field': [field: string, value: any]
  'apply-all': [config: any]
  'delete-selected': []
  'clear-selection': []
}>()

const colorOptions = [
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

const bulkConfig = reactive<{
  rotation: number | null
  angle: number | null
  height: number | null
  fov: number | null
  color: string | null
}>({
  rotation: null,
  angle: null,
  height: null,
  fov: null,
  color: null
})

const applyField = (field: string) => {
  const value = (bulkConfig as any)[field]
  if (value !== null) {
    emit('apply-field', field, value)
    // Reset after apply
    ;(bulkConfig as any)[field] = null
  }
}

const applyAll = () => {
  const config: any = {}
  Object.entries(bulkConfig).forEach(([key, value]) => {
    if (value !== null) {
      config[key] = value
    }
  })

  if (Object.keys(config).length > 0) {
    emit('apply-all', config)
    // Reset all
    bulkConfig.rotation = null
    bulkConfig.angle = null
    bulkConfig.height = null
    bulkConfig.fov = null
    bulkConfig.color = null
  }
}

const deleteSelected = () => {
  if (confirm('Are you sure you want to delete the selected cameras?')) {
    emit('delete-selected')
  }
}
</script>
