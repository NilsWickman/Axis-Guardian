<template>
  <div
    class="border rounded p-2 bg-card hover:shadow-md transition-shadow relative"
    :class="{ 'ring-2 ring-primary bg-primary/5': isSelected, 'cursor-pointer': selectable }"
    @click="handleCardClick"
  >
    <div class="flex justify-between items-start">
      <div class="flex items-start gap-2 flex-1 min-w-0">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <div
              :class="statusClass"
              :title="camera.status"
              class="w-2 h-2 rounded-full shrink-0"
            ></div>
            <h3 class="font-semibold text-xs truncate">{{ camera.name }}</h3>
          </div>
          <p class="text-xs text-muted-foreground truncate ml-3.5">{{ camera.ipAddress }}</p>
          <div class="flex justify-between text-xs mt-1 ml-3.5">
            <span class="text-muted-foreground truncate">{{ camera.model || 'Unknown' }}</span>
            <span class="font-mono text-muted-foreground truncate ml-2">{{ camera.serialNumber || 'N/A' }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-0.5 ml-2 shrink-0" @click.stop>
        <slot name="actions" :camera="camera"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  camera: {
    id: string
    name: string
    ipAddress: string
    status: 'online' | 'offline' | 'configuring'
    model?: string
    serialNumber?: string
  }
  selectable?: boolean
  isSelected?: boolean
}>()

const emit = defineEmits<{
  'toggle-select': [cameraId: string]
}>()

const handleCardClick = () => {
  if (props.selectable) {
    emit('toggle-select', props.camera.id)
  }
}

const statusClass = computed(() => {
  switch (props.camera.status) {
    case 'online':
      return 'bg-status-online'
    case 'offline':
      return 'bg-status-offline'
    case 'configuring':
      return 'bg-status-configuring'
    default:
      return 'bg-gray-500'
  }
})
</script>
