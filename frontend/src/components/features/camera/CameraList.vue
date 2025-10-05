<template>
  <div class="space-y-1" :class="props.containerClass">
    <div
      v-for="camera in props.cameras"
      :key="camera.cameraId"
      @click="emit('select', camera.cameraId)"
      class="px-2 py-1.5 border rounded cursor-pointer hover:bg-accent transition-colors text-sm"
      :class="props.selectedCameraId === camera.cameraId ? 'bg-accent border-accent-foreground' : ''"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: props.getColorHex(camera.color) }"
          ></div>
          <span class="font-medium text-xs">{{ props.getCameraName(camera.cameraId) }}</span>
        </div>
        <span
          :class="getStatusClass(props.getCameraStatus(camera.cameraId))"
          class="px-1.5 py-0.5 text-[9px] font-semibold rounded-full"
        >
          {{ props.getCameraStatus(camera.cameraId) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CameraPlacement } from '@/stores/siteMaps'

const props = withDefaults(defineProps<{
  cameras: CameraPlacement[]
  selectedCameraId: string | null
  getCameraName: (id: string) => string
  getCameraStatus: (id: string) => string
  getColorHex: (color: string) => string
  containerClass?: string
}>(), {
  containerClass: 'mb-4'
})

const emit = defineEmits<{
  select: [cameraId: string]
}>()

const getStatusClass = (status: string) => {
  return status === 'online'
    ? 'bg-green-500/20 text-green-700 dark:text-green-400'
    : 'bg-red-500/20 text-red-700 dark:text-red-400'
}
</script>
