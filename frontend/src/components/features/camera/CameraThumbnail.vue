<template>
  <div
    @click="emit('select', camera)"
    class="relative bg-gray-900 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
    :class="{ 'ring-2 ring-primary': isSelected }"
  >
    <video
      :ref="el => videoRef = el as HTMLVideoElement"
      class="w-full object-cover"
      :class="videoClass"
      autoplay
      muted
      playsinline
    ></video>

    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
      <div class="text-white text-xs">
        <div class="font-semibold">{{ camera.name }}</div>
        <div class="text-white/70">{{ camera.id }}</div>
      </div>
    </div>

    <div class="absolute top-2 right-2 flex items-center space-x-1 bg-black/50 px-1 py-0.5 rounded backdrop-blur-sm">
      <span
        :class="statusClass"
        class="w-1 h-1 rounded-full"
      ></span>
    </div>

    <div
      v-if="!streamReady"
      class="absolute inset-0 flex items-center justify-center bg-gray-900"
    >
      <div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Camera } from '@/types/generated'

const props = withDefaults(defineProps<{
  camera: Camera
  isSelected?: boolean
  streamReady?: boolean
  videoClass?: string
}>(), {
  isSelected: false,
  streamReady: false,
  videoClass: 'h-32'
})

const emit = defineEmits<{
  select: [camera: Camera]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

const statusClass = computed(() => {
  return props.camera.status === 'online' ? 'bg-status-online' : 'bg-status-offline'
})

defineExpose({ videoRef })
</script>
