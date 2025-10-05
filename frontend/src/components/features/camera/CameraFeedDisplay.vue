<template>
  <div class="relative bg-gray-900 rounded-lg overflow-hidden h-full">
    <video
      v-if="camera"
      :ref="el => videoRef = el as HTMLVideoElement"
      class="w-full h-full object-contain"
      autoplay
      muted
      playsinline
    ></video>

    <slot name="overlays"></slot>

    <div
      v-if="!camera || !streamReady"
      class="absolute inset-0 flex items-center justify-center bg-gray-900"
    >
      <div class="text-center text-white">
        <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        <p class="text-lg">{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = withDefaults(defineProps<{
  camera: any | null
  streamReady?: boolean
  loadingText?: string
}>(), {
  streamReady: false
})

const videoRef = ref<HTMLVideoElement | null>(null)

const loadingText = computed(() => {
  if (!props.camera) return props.loadingText || 'Select a camera'
  return props.loadingText || 'Connecting to camera...'
})

defineExpose({ videoRef })
</script>
