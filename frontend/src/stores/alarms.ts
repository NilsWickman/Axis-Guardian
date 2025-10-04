// Active alarms store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Alarm } from '../types/generated'
import { mockAlarms, acknowledgeMockAlarm } from '../mocks/data'

export const useAlarmStore = defineStore('alarms', () => {
  // State
  const alarms = ref<Alarm[]>([...mockAlarms])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filters = ref({
    type: '' as Alarm['type'] | '',
    severity: '' as Alarm['severity'] | '',
    acknowledged: '' as 'true' | 'false' | '',
  })

  // Getters
  const unacknowledgedAlarms = computed(() => alarms.value.filter((a) => !a.acknowledged))
  const acknowledgedAlarms = computed(() => alarms.value.filter((a) => a.acknowledged))
  const criticalAlarms = computed(() => alarms.value.filter((a) => a.severity === 'critical'))
  const unacknowledgedCount = computed(() => unacknowledgedAlarms.value.length)

  const filteredAlarms = computed(() => {
    let result = [...alarms.value]

    if (filters.value.type) {
      result = result.filter((alarm) => alarm.type === filters.value.type)
    }

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
    () => filters.value.type || filters.value.severity || filters.value.acknowledged
  )

  // Actions
  async function fetchAlarms(options?: { limit?: number }) {
    loading.value = true
    error.value = null
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      let result = [...mockAlarms]
      if (options?.limit) {
        result = result.slice(0, options.limit)
      }
      alarms.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch alarms'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function acknowledgeAlarm(alarmId: string, acknowledgedBy: string) {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 200))

      const alarm = alarms.value.find((a) => a.id === alarmId)
      if (alarm) {
        alarm.acknowledged = true
        alarm.acknowledgedBy = acknowledgedBy
        alarm.acknowledgedAt = new Date().toISOString()
      }

      // Also update in mock data
      acknowledgeMockAlarm(alarmId, acknowledgedBy)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to acknowledge alarm'
      throw err
    }
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      type: '',
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
    setFilters,
    clearFilters,
    getAlarmById,
  }
})