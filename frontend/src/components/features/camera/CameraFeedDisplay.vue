<template>
  <div class="relative bg-gray-900 rounded-lg overflow-hidden h-full border border-secondary">
    <video
      v-if="camera"
      :ref="el => videoRef = el as HTMLVideoElement"
      class="w-full h-full object-cover"
      autoplay
      muted
      playsinline
      loop
      crossorigin="anonymous"
    ></video>

    <slot name="overlays"></slot>

    <div
      v-if="!camera || !isLoaded"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  camera: any | null
  streamReady?: boolean
  loadingText?: string
}>(), {
  streamReady: false
})

const emit = defineEmits<{
  'stream-loaded': []
  'stream-error': [error: any]
  'video-ready': [cameraId: string, videoElement: HTMLVideoElement]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isLoaded = ref(false)

const loadingText = computed(() => {
  if (!props.camera) return props.loadingText || 'Select a camera'
  return props.loadingText || 'Connecting to camera...'
})

const setupVideoStream = async () => {
  if (!props.camera || !videoRef.value) return

  try {
    // Set video source directly from camera's rtspUrl
    videoRef.value.src = props.camera.rtspUrl

    // Wait for video to be ready
    videoRef.value.onloadeddata = () => {
      isLoaded.value = true
      emit('stream-loaded')
      emit('video-ready', props.camera.id, videoRef.value!)
      console.log('Video stream loaded for camera:', props.camera?.name)
    }

    videoRef.value.onerror = (error: any) => {
      isLoaded.value = false
      emit('stream-error', error)
      const videoElement = videoRef.value
      const errorDetails = {
        error: videoElement?.error,
        networkState: videoElement?.networkState,
        readyState: videoElement?.readyState,
        src: videoElement?.src,
        currentSrc: videoElement?.currentSrc
      }
      console.error('Video error for camera:', props.camera?.name, errorDetails)

      // Retry loading after a short delay if it's a network error
      if (videoElement?.error?.code === 2) { // MEDIA_ERR_NETWORK
        console.log('Network error, retrying in 2 seconds...')
        setTimeout(() => {
          if (videoRef.value && props.camera) {
            videoRef.value.load()
          }
        }, 2000)
      }
    }

  } catch (err) {
    console.error(`Failed to setup video stream for ${props.camera?.name}:`, err)
    emit('stream-error', err)
  }
}

const cleanup = () => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
  }
  isLoaded.value = false
}

// Watch for camera changes
watch(() => props.camera, (newCamera, oldCamera) => {
  if (newCamera?.id !== oldCamera?.id) {
    cleanup()
    if (newCamera) {
      setTimeout(() => setupVideoStream(), 100)
    }
  }
}, { immediate: true })

onMounted(() => {
  if (props.camera) {
    setTimeout(() => setupVideoStream(), 100)
  }
})

onUnmounted(() => {
  cleanup()
})

defineExpose({ videoRef })
</script>
