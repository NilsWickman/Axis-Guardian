<template>
  <div class="flex flex-col h-full">
    <div class="mb-3">
      <h2 class="text-sm font-semibold mb-2">
        Available Cameras
        <span v-if="showCounter" class="text-xs text-muted-foreground ml-1">
          ({{ placedCount }}/{{ cameras.length }})
        </span>
      </h2>

      <!-- Search/Filter Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search cameras..."
        class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>

    <div class="flex-1 overflow-y-auto space-y-2">
      <div
        v-for="camera in filteredCameras"
        :key="camera.id"
        @click="$emit('select', camera.id)"
        class="p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md"
        :class="selectedCameraId === camera.id ? 'bg-accent border-accent-foreground' : 'hover:bg-accent/50'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate">{{ camera.name }}</p>
            <p class="text-[10px] text-muted-foreground truncate">{{ camera.id }}</p>
          </div>
          <div class="flex flex-wrap gap-1 justify-end flex-shrink-0">
            <span
              class="px-1.5 py-0.5 text-[9px] font-semibold rounded-full"
              :class="camera.status === 'online'
                ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-red-500/20 text-red-700 dark:text-red-400'"
            >
              {{ camera.status }}
            </span>
            <span
              v-if="isPlaced(camera.id)"
              class="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-primary/20 text-primary"
            >
              Placed
            </span>
          </div>
        </div>
      </div>

      <div v-if="filteredCameras.length === 0" class="text-center py-8">
        <p class="text-xs text-muted-foreground">No cameras found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Camera } from '../../../types/generated'

interface Props {
  cameras: Camera[]
  selectedCameraId?: string
  placedCameraIds?: string[]
  showCounter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedCameraId: '',
  placedCameraIds: () => [],
  showCounter: true
})

defineEmits<{
  select: [cameraId: string]
}>()

const searchQuery = ref('')

const filteredCameras = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.cameras
  }

  const query = searchQuery.value.toLowerCase()
  return props.cameras.filter(camera =>
    camera.name.toLowerCase().includes(query) ||
    camera.id.toLowerCase().includes(query)
  )
})

const placedCount = computed(() => props.placedCameraIds.length)

const isPlaced = (cameraId: string) => {
  return props.placedCameraIds.includes(cameraId)
}
</script>
