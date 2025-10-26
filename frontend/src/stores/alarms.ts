// Active alarms store
import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { Alarm, AlarmSeverity } from '../types/generated'
import type { ApiError } from '../types/errors'
import { alarmService } from '../api/services/alarmService'
import { AlarmWebSocketClient } from '../api/websocket/alarm'
import { config } from '../config/environment'

// WebSocket client instance
const wsClient = new AlarmWebSocketClient()

export const useAlarmStore = defineStore('alarms', () => {
  // State
  const alarms = ref<Alarm[]>([])
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  const wsConnected = ref(false)

  // Filters
  const filters = ref({
    severity: '' as AlarmSeverity | '',
    acknowledged: '' as 'true' | 'false' | '',
  })

  // WebSocket event handlers
  function initWebSocket() {
    // Only connect WebSocket when not in mock mode
    if (config.useMockData) {
      console.log('Alarm WebSocket: Skipping connection (mock mode enabled)')
      return
    }

    wsClient.on('alarm.new', (alarm: Alarm) => {
      // Add new alarm to the beginning of the list
      alarms.value.unshift(alarm)
    })

    wsClient.on('alarm.acknowledged', (data: { id: string; acknowledgedBy: string; acknowledgedAt: string }) => {
      const alarm = alarms.value.find((a) => a.id === data.id)
      if (alarm) {
        alarm.acknowledged = true
        alarm.acknowledgedBy = data.acknowledgedBy
        alarm.acknowledgedAt = data.acknowledgedAt
        if (alarm.status === 'pending') {
          alarm.status = 'acknowledged'
        }
      }
    })

    wsClient.on('alarm.resolved', (data: { id: string }) => {
      const index = alarms.value.findIndex((a) => a.id === data.id)
      if (index !== -1) {
        alarms.value.splice(index, 1)
      }
    })

    wsClient.on('connected', () => {
      wsConnected.value = true
      console.log('Alarm WebSocket connected')
    })

    wsClient.on('disconnected', () => {
      wsConnected.value = false
      console.log('Alarm WebSocket disconnected')
    })

    wsClient.on('error', (err) => {
      console.error('Alarm WebSocket error:', err)
    })

    // Connect to WebSocket
    wsClient.connect().catch((err) => {
      console.error('Failed to connect to Alarm WebSocket:', err)
    })
  }

  // Initialize WebSocket on store creation
  initWebSocket()

  // Cleanup on unmount
  onUnmounted(() => {
    if (!config.useMockData) {
      wsClient.disconnect()
    }
  })

  // Getters
  const unacknowledgedAlarms = computed(() => alarms.value.filter((a) => !a.acknowledged))
  const acknowledgedAlarms = computed(() => alarms.value.filter((a) => a.acknowledged))
  const criticalAlarms = computed(() => alarms.value.filter((a) => a.severity === 'critical'))
  const unacknowledgedCount = computed(() => unacknowledgedAlarms.value.length)

  const filteredAlarms = computed(() => {
    let result = [...alarms.value]

    if (filters.value.severity) {
      result = result.filter((alarm) => alarm.severity === filters.value.severity)
    }

    if (filters.value.acknowledged !== '') {
      const isAcknowledged = filters.value.acknowledged === 'true'
      result = result.filter((alarm) => alarm.acknowledged === isAcknowledged)
    }

    // Sort by acknowledgment status first (unacknowledged first), then by timestamp (newest first)
    return result.sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  })

  const hasFilters = computed(
    () => filters.value.severity || filters.value.acknowledged
  )

  // Actions
  async function fetchAlarms(options?: { limit?: number }) {
    loading.value = true
    error.value = null
    try {
      alarms.value = await alarmService.getAlarms({ limit: options?.limit })
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  async function acknowledgeAlarm(alarmId: string, acknowledgedBy: string) {
    try {
      const updatedAlarm = await alarmService.acknowledgeAlarm(alarmId, { acknowledgedBy })
      // Update local state
      const index = alarms.value.findIndex((a) => a.id === alarmId)
      if (index !== -1) {
        alarms.value[index] = updatedAlarm
      }
    } catch (err) {
      error.value = err as ApiError
      throw err
    }
  }

  async function confirmAlarm(
    alarmId: string,
    confirmedBy: string,
    data: {
      notes?: string
      outcomeCategory?: string
      createIncident?: boolean
    }
  ) {
    try {
      const updatedAlarm = await alarmService.confirmAlarm(alarmId, { confirmedBy, ...data })
      // Update local state
      const index = alarms.value.findIndex((a) => a.id === alarmId)
      if (index !== -1) {
        alarms.value[index] = updatedAlarm
      }
    } catch (err) {
      error.value = err as ApiError
      throw err
    }
  }

  async function dismissAlarm(
    alarmId: string,
    dismissedBy: string,
    data: {
      reason: string
      outcomeCategory?: string
      closureNotes?: string
    }
  ) {
    try {
      const updatedAlarm = await alarmService.dismissAlarm(alarmId, {
        dismissedBy,
        reason: data.reason,
        outcomeCategory: data.outcomeCategory,
        notes: data.closureNotes,
      })
      // Update local state
      const index = alarms.value.findIndex((a) => a.id === alarmId)
      if (index !== -1) {
        alarms.value[index] = updatedAlarm
      }
    } catch (err) {
      error.value = err as ApiError
      throw err
    }
  }

  async function addTags(alarmId: string, tags: string[]) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200))

      const alarm = alarms.value.find((a) => a.id === alarmId)
      if (alarm) {
        if (!alarm.tags) {
          alarm.tags = []
        }
        tags.forEach(tag => {
          if (!alarm.tags!.includes(tag)) {
            alarm.tags!.push(tag)
          }
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add tags'
      throw err
    }
  }

  async function archiveAlarm(alarmId: string, archivedBy: string) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200))

      const alarm = alarms.value.find((a) => a.id === alarmId)
      if (alarm) {
        alarm.status = 'archived'
        ;(alarm as any).archivedBy = archivedBy
        ;(alarm as any).archivedAt = new Date().toISOString()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to archive alarm'
      throw err
    }
  }

  async function unarchiveAlarm(alarmId: string) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200))

      const alarm = alarms.value.find((a) => a.id === alarmId)
      if (alarm) {
        // Restore to previous status or default to acknowledged
        alarm.status = alarm.dismissedAt ? 'dismissed' : alarm.confirmedAt ? 'confirmed' : 'acknowledged'
        ;(alarm as any).archivedBy = undefined
        ;(alarm as any).archivedAt = undefined
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to unarchive alarm'
      throw err
    }
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      severity: '',
      acknowledged: '',
    }
  }

  function getAlarmById(id: string): Alarm | undefined {
    return alarms.value.find((a) => a.id === id)
  }

  return {
    // State
    alarms,
    loading,
    error,
    filters,
    // Getters
    unacknowledgedAlarms,
    acknowledgedAlarms,
    criticalAlarms,
    unacknowledgedCount,
    filteredAlarms,
    hasFilters,
    // Actions
    fetchAlarms,
    acknowledgeAlarm,
    confirmAlarm,
    dismissAlarm,
    addTags,
    archiveAlarm,
    unarchiveAlarm,
    setFilters,
    clearFilters,
    getAlarmById,
  }
})