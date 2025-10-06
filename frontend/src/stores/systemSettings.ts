import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SystemSettings, ObjectTypeConfig, AlarmLifecycleConfig } from '../types/settings'

export const useSystemSettingsStore = defineStore('systemSettings', () => {
  // State
  const settings = ref<SystemSettings>({
    objectTypes: [
      {
        type: 'person',
        enabled: true,
        label: 'Person',
        description: 'Human detection triggers alarms'
      },
      {
        type: 'vehicle',
        enabled: false,
        label: 'Vehicle',
        description: 'Vehicle detection triggers alarms'
      },
      {
        type: 'animal',
        enabled: false,
        label: 'Animal',
        description: 'Animal detection triggers alarms'
      }
    ],
    alarmLifecycle: {
      requireNotesOnAcknowledge: false,
      requireNotesOnDismiss: true,
      requireDismissalReason: true,
      requireClosureNote: false,
      requireOutcomeCategory: false,
      enableIncidentCreation: true,
      autoArchiveAfterDays: 30
    },
    dismissalReasons: [
      { id: 'false_positive', label: 'False Positive', requiresNote: false },
      { id: 'authorized_person', label: 'Authorized Person', requiresNote: true },
      { id: 'animal', label: 'Animal Detected', requiresNote: false },
      { id: 'weather', label: 'Weather Event', requiresNote: false },
      { id: 'technical_issue', label: 'Technical Issue', requiresNote: true },
      { id: 'other', label: 'Other', requiresNote: true }
    ],
    outcomeCategories: [
      { id: 'resolved', label: 'Resolved', color: 'green' },
      { id: 'escalated', label: 'Escalated', color: 'red' },
      { id: 'monitoring', label: 'Monitoring', color: 'yellow' },
      { id: 'no_action', label: 'No Action Required', color: 'gray' }
    ]
  })

  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasUnsavedChanges = ref(false)

  // Actions
  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300))
      // settings.value = response from API
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateObjectTypes(objectTypes: ObjectTypeConfig[]) {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      settings.value.objectTypes = objectTypes
      settings.value.updatedAt = new Date().toISOString()
      hasUnsavedChanges.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update object types'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAlarmLifecycle(lifecycle: AlarmLifecycleConfig) {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      settings.value.alarmLifecycle = lifecycle
      settings.value.updatedAt = new Date().toISOString()
      hasUnsavedChanges.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update alarm lifecycle'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveSettings() {
    loading.value = true
    error.value = null
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      settings.value.updatedAt = new Date().toISOString()
      hasUnsavedChanges.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save settings'
      throw err
    } finally {
      loading.value = false
    }
  }

  function markAsChanged() {
    hasUnsavedChanges.value = true
  }

  return {
    // State
    settings,
    loading,
    error,
    hasUnsavedChanges,
    // Actions
    fetchSettings,
    updateObjectTypes,
    updateAlarmLifecycle,
    saveSettings,
    markAsChanged
  }
})
