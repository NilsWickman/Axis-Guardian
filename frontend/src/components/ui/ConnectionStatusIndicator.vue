<template>
  <div
    class="connection-status-indicator flex items-center gap-2 px-2 py-1 rounded-md text-xs"
    :class="statusClasses"
    :title="tooltipText"
  >
    <!-- Status dot with animation -->
    <div class="relative">
      <div
        class="w-2.5 h-2.5 rounded-full"
        :class="dotClasses"
      />
      <!-- Pulse animation for reconnecting -->
      <div
        v-if="isReconnecting"
        class="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
        :class="dotClasses"
        style="opacity: 0.4"
      />
    </div>

    <!-- Status text (optional) -->
    <span v-if="showText" class="font-medium">
      {{ statusText }}
    </span>

    <!-- Reconnect attempt counter -->
    <span
      v-if="isReconnecting && showAttempts"
      class="text-gray-400"
    >
      ({{ reconnectAttempt }})
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConnectionStatusStore, type ConnectionState } from '../../stores/connectionStatus'
import { formatBackoffDelay } from '../../utils/exponential-backoff'

interface Props {
  /** Show status text label */
  showText?: boolean
  /** Show reconnect attempt counter */
  showAttempts?: boolean
  /** Connection type to display ('backend' | 'detection' | 'overall') */
  connectionType?: 'backend' | 'detection' | 'overall'
}

const props = withDefaults(defineProps<Props>(), {
  showText: false,
  showAttempts: true,
  connectionType: 'overall',
})

const store = useConnectionStatusStore()

const state = computed<ConnectionState>(() => {
  switch (props.connectionType) {
    case 'backend':
      return store.backendState
    case 'detection':
      return store.detectionState
    default:
      return store.overallState
  }
})

const reconnectAttempt = computed(() => {
  switch (props.connectionType) {
    case 'backend':
      return store.backendReconnectAttempt
    case 'detection':
      return store.detectionReconnectAttempt
    default:
      return Math.max(store.backendReconnectAttempt, store.detectionReconnectAttempt)
  }
})

const nextRetryMs = computed(() => {
  switch (props.connectionType) {
    case 'backend':
      return store.backendNextRetryMs
    case 'detection':
      return store.detectionNextRetryMs
    default:
      return store.backendNextRetryMs ?? store.detectionNextRetryMs
  }
})

const isReconnecting = computed(() => state.value === 'reconnecting')

const statusText = computed(() => {
  switch (state.value) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting...'
    case 'reconnecting':
      return 'Reconnecting...'
    case 'disconnected':
      return 'Disconnected'
    case 'error':
      return 'Error'
  }
})

const tooltipText = computed(() => {
  const base = statusText.value
  if (state.value === 'reconnecting' && nextRetryMs.value) {
    return `${base} - Next retry in ${formatBackoffDelay(nextRetryMs.value)}`
  }
  return base
})

const statusClasses = computed(() => ({
  'bg-green-900/30': state.value === 'connected',
  'bg-yellow-900/30': state.value === 'connecting' || state.value === 'reconnecting',
  'bg-gray-800/30': state.value === 'disconnected',
  'bg-red-900/30': state.value === 'error',
}))

const dotClasses = computed(() => ({
  'bg-green-500': state.value === 'connected',
  'bg-yellow-500': state.value === 'connecting' || state.value === 'reconnecting',
  'bg-gray-500': state.value === 'disconnected',
  'bg-red-500': state.value === 'error',
}))
</script>

<style scoped>
.connection-status-indicator {
  user-select: none;
}
</style>
