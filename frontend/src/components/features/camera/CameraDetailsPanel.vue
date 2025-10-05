<template>
  <div v-if="camera" class="space-y-3 border-t pt-3">
    <div class="pb-2 border-b">
      <h3 class="text-sm font-semibold mb-0.5">{{ getCameraName(camera.cameraId) }}</h3>
      <p class="text-[10px] text-muted-foreground">{{ camera.cameraId }}</p>
    </div>

    <!-- Position -->
    <div class="space-y-1">
      <h4 class="text-[10px] font-semibold text-muted-foreground uppercase">Position</h4>
      <div class="grid grid-cols-2 gap-1.5 text-xs">
        <div class="flex justify-between">
          <span class="text-muted-foreground">X:</span>
          <span class="font-mono">{{ camera.x }}px</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">Y:</span>
          <span class="font-mono">{{ camera.y }}px</span>
        </div>
      </div>
    </div>

    <!-- Camera Settings -->
    <div class="space-y-1">
      <h4 class="text-[10px] font-semibold text-muted-foreground uppercase">Camera Settings</h4>
      <div class="space-y-0.5 text-xs">
        <div class="flex justify-between">
          <span class="text-muted-foreground">Rotation:</span>
          <span class="font-mono">{{ camera.rotation }}°</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">Down Angle:</span>
          <span class="font-mono">{{ camera.angle }}°</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">Height:</span>
          <span class="font-mono">{{ camera.height }}m</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">FOV:</span>
          <span class="font-mono">{{ camera.fov }}°</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">View Distance:</span>
          <span class="font-mono">{{ camera.viewDistance }}px ({{ (camera.viewDistance / scale).toFixed(1) }}m)</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted-foreground">Color:</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="getColorBadgeClass(camera.color)">
            {{ getColorBadgeText(camera.color) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="camera.notes" class="space-y-1">
      <h4 class="text-[10px] font-semibold text-muted-foreground uppercase">Notes</h4>
      <p class="text-xs">{{ camera.notes }}</p>
    </div>

    <!-- Status -->
    <div class="space-y-1 pt-2 border-t">
      <h4 class="text-[10px] font-semibold text-muted-foreground uppercase">Live Status</h4>
      <div class="flex items-center gap-2">
        <span
          :class="getCameraStatus(camera.cameraId) === 'online' ? 'bg-green-500' : 'bg-red-500'"
          class="w-2 h-2 rounded-full animate-pulse"
        ></span>
        <span class="text-xs capitalize">{{ getCameraStatus(camera.cameraId) }}</span>
      </div>
    </div>

    <slot name="actions">
      <button
        v-if="showLiveButton"
        @click="emit('view-live')"
        class="w-full mt-3 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
      >
        {{ liveButtonText }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { CameraPlacement } from '@/stores/siteMaps'

withDefaults(defineProps<{
  camera: CameraPlacement | null
  getCameraName: (id: string) => string
  getCameraStatus: (id: string) => string
  getColorBadgeClass: (color: string) => string
  getColorBadgeText: (color: string) => string
  scale?: number
  showLiveButton?: boolean
  liveButtonText?: string
}>(), {
  scale: 50,
  showLiveButton: true,
  liveButtonText: 'View Live Feed'
})

const emit = defineEmits<{
  'view-live': []
}>()
</script>
