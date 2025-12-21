/**
 * Connection status store for WebSocket connections
 * Provides global visibility into connection health
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'

export interface ConnectionInfo {
  state: ConnectionState
  reconnectAttempt: number
  lastConnectedAt: number | null
  lastError: string | null
  nextRetryMs: number | null
}

export const useConnectionStatusStore = defineStore('connectionStatus', () => {
  // Backend WebSocket connection
  const backendState = ref<ConnectionState>('disconnected')
  const backendReconnectAttempt = ref(0)
  const backendLastConnected = ref<number | null>(null)
  const backendLastError = ref<string | null>(null)
  const backendNextRetryMs = ref<number | null>(null)

  // Detection WebSocket connection
  const detectionState = ref<ConnectionState>('disconnected')
  const detectionReconnectAttempt = ref(0)
  const detectionLastConnected = ref<number | null>(null)
  const detectionLastError = ref<string | null>(null)
  const detectionNextRetryMs = ref<number | null>(null)

  // Computed: overall connection status
  const isConnected = computed(() =>
    backendState.value === 'connected' || detectionState.value === 'connected'
  )

  const isReconnecting = computed(() =>
    backendState.value === 'reconnecting' || detectionState.value === 'reconnecting'
  )

  const hasError = computed(() =>
    backendState.value === 'error' || detectionState.value === 'error'
  )

  const overallState = computed<ConnectionState>(() => {
    if (backendState.value === 'connected' && detectionState.value === 'connected') {
      return 'connected'
    }
    if (backendState.value === 'error' || detectionState.value === 'error') {
      return 'error'
    }
    if (backendState.value === 'reconnecting' || detectionState.value === 'reconnecting') {
      return 'reconnecting'
    }
    if (backendState.value === 'connecting' || detectionState.value === 'connecting') {
      return 'connecting'
    }
    return 'disconnected'
  })

  // Actions: update backend connection status
  function setBackendConnected() {
    backendState.value = 'connected'
    backendReconnectAttempt.value = 0
    backendLastConnected.value = Date.now()
    backendLastError.value = null
    backendNextRetryMs.value = null
  }

  function setBackendConnecting() {
    backendState.value = 'connecting'
  }

  function setBackendReconnecting(attempt: number, nextRetryMs: number) {
    backendState.value = 'reconnecting'
    backendReconnectAttempt.value = attempt
    backendNextRetryMs.value = nextRetryMs
  }

  function setBackendDisconnected() {
    backendState.value = 'disconnected'
    backendNextRetryMs.value = null
  }

  function setBackendError(error: string) {
    backendState.value = 'error'
    backendLastError.value = error
    backendNextRetryMs.value = null
  }

  // Actions: update detection connection status
  function setDetectionConnected() {
    detectionState.value = 'connected'
    detectionReconnectAttempt.value = 0
    detectionLastConnected.value = Date.now()
    detectionLastError.value = null
    detectionNextRetryMs.value = null
  }

  function setDetectionConnecting() {
    detectionState.value = 'connecting'
  }

  function setDetectionReconnecting(attempt: number, nextRetryMs: number) {
    detectionState.value = 'reconnecting'
    detectionReconnectAttempt.value = attempt
    detectionNextRetryMs.value = nextRetryMs
  }

  function setDetectionDisconnected() {
    detectionState.value = 'disconnected'
    detectionNextRetryMs.value = null
  }

  function setDetectionError(error: string) {
    detectionState.value = 'error'
    detectionLastError.value = error
    detectionNextRetryMs.value = null
  }

  // Get info for a specific connection
  function getBackendInfo(): ConnectionInfo {
    return {
      state: backendState.value,
      reconnectAttempt: backendReconnectAttempt.value,
      lastConnectedAt: backendLastConnected.value,
      lastError: backendLastError.value,
      nextRetryMs: backendNextRetryMs.value,
    }
  }

  function getDetectionInfo(): ConnectionInfo {
    return {
      state: detectionState.value,
      reconnectAttempt: detectionReconnectAttempt.value,
      lastConnectedAt: detectionLastConnected.value,
      lastError: detectionLastError.value,
      nextRetryMs: detectionNextRetryMs.value,
    }
  }

  return {
    // State
    backendState,
    backendReconnectAttempt,
    backendLastConnected,
    backendLastError,
    backendNextRetryMs,
    detectionState,
    detectionReconnectAttempt,
    detectionLastConnected,
    detectionLastError,
    detectionNextRetryMs,

    // Computed
    isConnected,
    isReconnecting,
    hasError,
    overallState,

    // Actions
    setBackendConnected,
    setBackendConnecting,
    setBackendReconnecting,
    setBackendDisconnected,
    setBackendError,
    setDetectionConnected,
    setDetectionConnecting,
    setDetectionReconnecting,
    setDetectionDisconnected,
    setDetectionError,
    getBackendInfo,
    getDetectionInfo,
  }
})
