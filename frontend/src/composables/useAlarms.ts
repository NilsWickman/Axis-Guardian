import { computed, ref } from 'vue'
import { useAlarmStore } from '@/stores/alarms'
import type { components } from '@/types/generated'

type Alarm = components['schemas']['Alarm']
type AlarmSeverity = components['schemas']['AlarmSeverity']

export function useAlarms() {
  const store = useAlarmStore()
  const error = ref<string | null>(null)

  // ===== Alarm Fetching =====
  const loadAlarms = async (options?: { limit?: number }) => {
    try {
      error.value = null
      await store.fetchAlarms(options)
    } catch (err: any) {
      error.value = err.message || 'Failed to load alarms'
      throw err
    }
  }

  // ===== Alarm Actions =====
  const acknowledgeAlarm = async (alarmId: string, acknowledgedBy: string, notes?: string) => {
    try {
      error.value = null
      await store.acknowledgeAlarm(alarmId, acknowledgedBy)
    } catch (err: any) {
      error.value = err.message || 'Failed to acknowledge alarm'
      throw err
    }
  }

  const confirmAlarm = async (
    alarmId: string,
    confirmedBy: string,
    data: {
      notes?: string
      outcomeCategory?: string
      createIncident?: boolean
    }
  ) => {
    try {
      error.value = null
      await store.confirmAlarm(alarmId, confirmedBy, data)
    } catch (err: any) {
      error.value = err.message || 'Failed to confirm alarm'
      throw err
    }
  }

  const dismissAlarm = async (
    alarmId: string,
    dismissedBy: string,
    data: {
      reason: string
      outcomeCategory?: string
      closureNotes?: string
    }
  ) => {
    try {
      error.value = null
      await store.dismissAlarm(alarmId, dismissedBy, data)
    } catch (err: any) {
      error.value = err.message || 'Failed to dismiss alarm'
      throw err
    }
  }

  const addTags = async (alarmId: string, tags: string[]) => {
    try {
      error.value = null
      await store.addTags(alarmId, tags)
    } catch (err: any) {
      error.value = err.message || 'Failed to add tags'
      throw err
    }
  }

  // ===== Filtering =====
  const filterBySeverity = (severity: AlarmSeverity | '') => {
    store.setFilters({ severity })
  }

  const filterByAcknowledged = (acknowledged: 'true' | 'false' | '') => {
    store.setFilters({ acknowledged })
  }

  const clearAllFilters = () => {
    store.clearFilters()
  }

  // ===== Alarm Retrieval =====
  const getAlarmById = (id: string): Alarm | undefined => {
    return store.getAlarmById(id)
  }

  const getAlarmsBySiteMap = (siteMapId: string): Alarm[] => {
    // This would need to be implemented based on camera-to-sitemap mapping
    return store.alarms
  }

  const getAlarmsByCamera = (cameraId: string): Alarm[] => {
    return store.alarms.filter(alarm => alarm.source.cameraId === cameraId)
  }

  // ===== Timeline Integration =====
  const getAlarmTimelineRange = (alarm: Alarm, paddingSeconds: number = 15) => {
    const alarmTime = new Date(alarm.timestamp).getTime()
    const paddingMs = paddingSeconds * 1000

    return {
      start: alarmTime - paddingMs,
      end: alarmTime + paddingMs,
      alarmTimestamp: alarmTime,
    }
  }

  // ===== Statistics =====
  const getStatistics = () => {
    const alarms = store.alarms
    const unacknowledged = store.unacknowledgedAlarms

    return {
      total: alarms.length,
      unacknowledged: unacknowledged.length,
      bySeverity: {
        low: alarms.filter(a => a.severity === 'low').length,
        medium: alarms.filter(a => a.severity === 'medium').length,
        high: alarms.filter(a => a.severity === 'high').length,
        critical: alarms.filter(a => a.severity === 'critical').length,
      },
    }
  }

  // ===== Utility Functions =====
  const getSeverityColor = (severity: AlarmSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp: string, format: 'short' | 'long' | 'time-only' = 'short') => {
    const date = new Date(timestamp)

    switch (format) {
      case 'short':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      case 'long':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      case 'time-only':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      default:
        return date.toLocaleString()
    }
  }

  const getRelativeTime = (timestamp: string): string => {
    const now = Date.now()
    const alarmTime = new Date(timestamp).getTime()
    const diffMs = now - alarmTime

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  }

  // ===== Computed Properties =====
  const hasActiveAlarms = computed(() => store.unacknowledgedCount > 0)
  const criticalAlarmCount = computed(() => store.criticalAlarms.length)

  return {
    // State
    error,
    store,

    // Computed
    hasActiveAlarms,
    criticalAlarmCount,

    // Alarm Loading
    loadAlarms,

    // Alarm Actions
    acknowledgeAlarm,
    confirmAlarm,
    dismissAlarm,
    addTags,

    // Filtering
    filterBySeverity,
    filterByAcknowledged,
    clearAllFilters,

    // Retrieval
    getAlarmById,
    getAlarmsBySiteMap,
    getAlarmsByCamera,

    // Timeline
    getAlarmTimelineRange,

    // Statistics
    getStatistics,

    // Utilities
    getSeverityColor,
    formatTimestamp,
    getRelativeTime,
  }
}