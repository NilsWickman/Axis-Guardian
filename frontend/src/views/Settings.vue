<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b bg-card">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">System Settings</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Configure system-wide alarm detection and lifecycle management
            </p>
          </div>

          <div v-if="hasUnsavedChanges" class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Unsaved changes
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-6">
        <div class="flex gap-6 border-b">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-1 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-4xl mx-auto p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="flex items-center gap-3 text-muted-foreground">
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading settings...
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium text-destructive">Failed to load settings</p>
              <p class="text-sm text-destructive/80 mt-1">{{ error }}</p>
              <button
                @click="loadSettings"
                class="mt-2 text-sm text-destructive hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Content -->
        <div v-else class="space-y-8">
          <!-- Object Types Tab -->
          <ObjectTypeSettings
            v-if="activeTab === 'object-types'"
            :object-types="settings.objectTypes"
            :saving="saving"
            @save="handleSaveObjectTypes"
            @cancel="handleCancel"
          />

          <!-- Alarm Lifecycle Tab -->
          <AlarmLifecycleSettings
            v-if="activeTab === 'alarm-lifecycle'"
            :config="settings.alarmLifecycle"
            :saving="saving"
            @save="handleSaveAlarmLifecycle"
            @cancel="handleCancel"
          />

          <!-- Dismissal Reasons Tab -->
          <div v-if="activeTab === 'dismissal-reasons'" class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold mb-1">Dismissal Reasons</h3>
              <p class="text-sm text-muted-foreground">
                Predefined reasons for dismissing false alarms
              </p>
            </div>

            <div class="space-y-2">
              <div
                v-for="reason in settings.dismissalReasons"
                :key="reason.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p class="font-medium text-sm">{{ reason.label }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ reason.requiresNote ? 'Requires note' : 'Note optional' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Outcome Categories Tab -->
          <div v-if="activeTab === 'outcome-categories'" class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold mb-1">Outcome Categories</h3>
              <p class="text-sm text-muted-foreground">
                Categories for classifying incident outcomes
              </p>
            </div>

            <div class="space-y-2">
              <div
                v-for="category in settings.outcomeCategories"
                :key="category.id"
                class="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    category.color === 'green' && 'bg-green-500',
                    category.color === 'red' && 'bg-red-500',
                    category.color === 'yellow' && 'bg-yellow-500',
                    category.color === 'gray' && 'bg-gray-500'
                  ]"
                />
                <p class="font-medium text-sm">{{ category.label }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Last Updated Info -->
        <div
          v-if="!loading && !error && settings.updatedAt"
          class="mt-8 pt-6 border-t text-xs text-muted-foreground"
        >
          Last updated: {{ formatDate(settings.updatedAt) }}
          <span v-if="settings.updatedBy"> by {{ settings.updatedBy }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSystemSettingsStore } from '@/stores/systemSettings'
import { storeToRefs } from 'pinia'
import ObjectTypeSettings from '@/components/features/settings/ObjectTypeSettings.vue'
import AlarmLifecycleSettings from '@/components/features/settings/AlarmLifecycleSettings.vue'
import type { ObjectTypeConfig, AlarmLifecycleConfig } from '@/types/settings'

// Store
const settingsStore = useSystemSettingsStore()
const { settings, loading, error, hasUnsavedChanges } = storeToRefs(settingsStore)

// Local state
const activeTab = ref<'object-types' | 'alarm-lifecycle' | 'dismissal-reasons' | 'outcome-categories'>('object-types')
const saving = ref(false)

const tabs = [
  { id: 'object-types' as const, label: 'Object Types' },
  { id: 'alarm-lifecycle' as const, label: 'Alarm Lifecycle' },
  { id: 'dismissal-reasons' as const, label: 'Dismissal Reasons' },
  { id: 'outcome-categories' as const, label: 'Outcome Categories' }
]

// Methods
async function loadSettings() {
  try {
    await settingsStore.fetchSettings()
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
}

async function handleSaveObjectTypes(objectTypes: ObjectTypeConfig[]) {
  saving.value = true
  try {
    await settingsStore.updateObjectTypes(objectTypes)
  } catch (err) {
    console.error('Failed to save object types:', err)
  } finally {
    saving.value = false
  }
}

async function handleSaveAlarmLifecycle(config: AlarmLifecycleConfig) {
  saving.value = true
  try {
    await settingsStore.updateAlarmLifecycle(config)
  } catch (err) {
    console.error('Failed to save alarm lifecycle:', err)
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  // Reset handled by child components
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>
