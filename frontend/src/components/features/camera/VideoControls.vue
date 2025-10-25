<template>
  <div class="video-controls">
    <!-- Play/Pause Button -->
    <button
      v-if="connectionState === 'connected'"
      :class="['control-button', 'play-pause']"
      @click="togglePlayPause"
      :title="isPaused ? 'Resume video' : 'Pause video'"
    >
      <component :is="isPaused ? PlayIcon : PauseIcon" />
    </button>

    <!-- Retry Button (shown when connection failed) -->
    <button
      v-if="showRetryButton"
      :class="['control-button', 'retry', { 'is-reconnecting': isReconnecting }]"
      @click="retry"
      :disabled="isReconnecting"
      :title="isReconnecting ? 'Reconnecting...' : 'Retry connection'"
    >
      <component :is="RefreshIcon" :class="{ 'spinning': isReconnecting }" />
      <span class="retry-text">{{ isReconnecting ? 'Reconnecting...' : 'Retry' }}</span>
    </button>

    <!-- Full Screen Button -->
    <button
      v-if="connectionState === 'connected'"
      class="control-button fullscreen"
      @click="toggleFullscreen"
      :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    >
      <component :is="isFullscreen ? MinimizeIcon : MaximizeIcon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'

const props = defineProps<{
  cameraId: string
  connectionState?: RTCPeerConnectionState
  isReconnecting?: boolean
}>()

const emit = defineEmits<{
  'toggle-play-pause': [isPaused: boolean]
  'retry': []
  'toggle-fullscreen': []
}>()

const isPaused = ref(false)
const isFullscreen = ref(false)

// Show retry button when connection is failed or disconnected
const showRetryButton = computed(() => {
  return props.connectionState === 'failed' ||
         props.connectionState === 'disconnected' ||
         props.connectionState === 'closed'
})

// Icon components using inline SVGs
const PlayIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M8 5v14l11-7z'
  })
])

const PauseIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z'
  })
])

const RefreshIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}, [
  h('path', {
    d: 'M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2'
  })
])

const MaximizeIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2'
}, [
  h('path', {
    d: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'
  })
])

const MinimizeIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2'
}, [
  h('path', {
    d: 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3'
  })
])

function togglePlayPause() {
  isPaused.value = !isPaused.value
  emit('toggle-play-pause', isPaused.value)
}

function retry() {
  emit('retry')
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  emit('toggle-fullscreen')
}

// Expose state for parent components
defineExpose({
  isPaused,
  isFullscreen,
  resetPause: () => { isPaused.value = false }
})
</script>

<style scoped>
.video-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Show controls on hover or when retry is needed */
.video-controls:hover,
.video-controls:has(.retry) {
  opacity: 1;
}

/* Parent container hover (from WebRTCDetectionView) */
:global(.camera-container:hover) .video-controls {
  opacity: 1;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 40px;
  height: 40px;
  padding: 0;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 8px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.control-button:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.95);
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.control-button:active:not(:disabled) {
  transform: translateY(0);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button svg {
  width: 20px;
  height: 20px;
}

/* Retry button specific styles */
.retry {
  width: auto;
  padding: 0 16px;
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.retry:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #ef4444;
}

.retry.is-reconnecting {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.5);
  color: #f59e0b;
}

.retry-text {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Spinning animation for refresh icon */
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Play/Pause specific hover */
.play-pause:hover:not(:disabled) {
  color: #22c55e;
  border-color: #22c55e;
}

/* Fullscreen specific hover */
.fullscreen:hover:not(:disabled) {
  color: #8b5cf6;
  border-color: #8b5cf6;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .video-controls {
    opacity: 1; /* Always visible on mobile */
    bottom: 8px;
    left: 8px;
  }

  .control-button {
    width: 36px;
    height: 36px;
  }

  .control-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>
