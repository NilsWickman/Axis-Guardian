<template>
  <div class="relative bg-gray-900 rounded-lg overflow-hidden h-full border border-secondary flex items-center justify-center">
    <video
      v-if="camera"
      :ref="el => videoRef = el as HTMLVideoElement"
      class="w-full h-full object-contain"
      autoplay
      muted
      playsinline
      loop
      crossorigin="anonymous"
    ></video>

    <slot
      name="overlays"
      :video-width="videoNativeWidth"
      :video-height="videoNativeHeight"
      :container-width="containerWidth"
      :container-height="containerHeight"
    ></slot>

    <div
      v-if="!camera || !isLoaded"
      class="absolute inset-0 flex items-center justify-center bg-gray-900 z-10"
    >
      <div class="text-center text-white">
        <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        <p class="text-lg">{{ loadingText }}</p>
        <p class="text-sm mt-2 opacity-50">isLoaded: {{ isLoaded }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Declare HLS.js global type
declare const Hls: any

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
const videoNativeWidth = ref(1920)
const videoNativeHeight = ref(1080)
const containerWidth = ref(1920)
const containerHeight = ref(1080)

// HLS.js instance
let hls: any = null

const loadingText = computed(() => {
  if (!props.camera) return props.loadingText || 'Select a camera'
  return props.loadingText || 'Connecting to camera...'
})

const setupVideoStream = async () => {
  if (!props.camera || !videoRef.value) return

  try {
    // Convert RTSP URL to HLS URL for browser compatibility
    // MediaMTX serves HLS at http://localhost:8888/<stream_name>/index.m3u8
    let videoSrc = props.camera.rtspUrl

    // If it's an RTSP URL, convert to HLS
    if (videoSrc.startsWith('rtsp://')) {
      // Extract stream name from RTSP URL
      // Format: rtsp://localhost:8554/camera1 -> http://localhost:8888/camera1/index.m3u8
      const streamName = videoSrc.split('/').pop()
      videoSrc = `http://localhost:8888/${streamName}/index.m3u8`
      console.log(`Converted RTSP to HLS: ${props.camera.rtspUrl} -> ${videoSrc}`)
    }

    // Check if HLS.js is supported
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      console.log('Using HLS.js for video playback')

      // Destroy previous HLS instance if it exists
      if (hls) {
        hls.destroy()
      }

      // Create new HLS instance
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      })

      // Load HLS stream
      hls.loadSource(videoSrc)
      hls.attachMedia(videoRef.value)

      // Handle HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed, starting playback')
        videoRef.value?.play().then(() => {
          console.log('▶️  Video playback started successfully')
        }).catch((err: any) => {
          console.warn('⚠️ Auto-play prevented:', err)
        })
      })

      hls.on(Hls.Events.FRAG_LOADED, () => {
        console.log('📦 HLS fragment loaded')
      })

      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        console.error('HLS error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Fatal error, cannot recover')
              hls.destroy()
              emit('stream-error', data)
              break
          }
        }
      })

    } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      console.log('Using native HLS playback (Safari)')
      videoRef.value.src = videoSrc
      videoRef.value.play().catch((err: any) => {
        console.warn('Auto-play prevented:', err)
      })
    } else {
      console.error('HLS is not supported in this browser')
      emit('stream-error', new Error('HLS not supported'))
      return
    }

    // Wait for video to be ready
    videoRef.value.onloadedmetadata = () => {
      if (videoRef.value) {
        videoNativeWidth.value = videoRef.value.videoWidth || 1920
        videoNativeHeight.value = videoRef.value.videoHeight || 1080
        console.log(`Video dimensions: ${videoNativeWidth.value}x${videoNativeHeight.value}`)
      }
    }

    videoRef.value.onloadeddata = () => {
      console.log('🎥 Video loadeddata event fired for camera:', props.camera?.name)
      console.log('Video ready state:', videoRef.value?.readyState)
      console.log('Video paused:', videoRef.value?.paused)
      console.log('Video dimensions:', videoRef.value?.videoWidth, 'x', videoRef.value?.videoHeight)

      isLoaded.value = true

      // Update container dimensions
      if (videoRef.value) {
        const rect = videoRef.value.getBoundingClientRect()
        containerWidth.value = rect.width
        containerHeight.value = rect.height
      }

      emit('stream-loaded')
      emit('video-ready', props.camera.id, videoRef.value!)
      console.log('✅ Video stream loaded for camera:', props.camera?.name)
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
    }

  } catch (err) {
    console.error(`Failed to setup video stream for ${props.camera?.name}:`, err)
    emit('stream-error', err)
  }
}

const cleanup = () => {
  // Destroy HLS instance
  if (hls) {
    hls.destroy()
    hls = null
  }

  // Clean up video element
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
