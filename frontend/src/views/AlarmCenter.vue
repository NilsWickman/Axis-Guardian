<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-foreground">Alarm Center</h1>
      <div class="flex items-center space-x-4">
        <span class="text-sm text-muted-foreground">
          {{ unacknowledgedAlarms }} unacknowledged alarms
        </span>
        <button @click="refreshAlarms"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-4 p-4 bg-card border rounded-lg">
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Type:</label>
        <select v-model="filters.type" @change="applyFilters"
                class="px-3 py-1 border border-border rounded text-sm">
          <option value="">All Types</option>
          <option value="intrusion">Intrusion</option>
          <option value="loitering">Loitering</option>
          <option value="line_crossing">Line Crossing</option>
          <option value="zone_violation">Zone Violation</option>
        </select>
      </div>

      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Severity:</label>
        <select v-model="filters.severity" @change="applyFilters"
                class="px-3 py-1 border border-border rounded text-sm">
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium">Status:</label>
        <select v-model="filters.acknowledged" @change="applyFilters"
                class="px-3 py-1 border border-border rounded text-sm">
          <option value="">All</option>
          <option value="false">Unacknowledged</option>
          <option value="true">Acknowledged</option>
        </select>
      </div>

      <button @click="clearFilters"
              class="px-3 py-1 border border-border rounded text-sm hover:bg-accent">
        Clear Filters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-card border rounded-lg p-4 animate-pulse">
        <div class="flex justify-between items-start">
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-muted rounded w-1/3"></div>
            <div class="h-3 bg-muted rounded w-1/2"></div>
            <div class="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div class="h-8 w-20 bg-muted rounded"></div>
        </div>
      </div>
    </div>

    <!-- Alarms List -->
    <div v-else-if="filteredAlarms.length > 0" class="space-y-4">
      <div v-for="alarm in filteredAlarms" :key="alarm.id"
           :class="[
             'bg-card border rounded-lg p-4 transition-colors',
             !alarm.acknowledged ? 'border-l-4' : '',
             getSeverityBorderColor(alarm.severity)
           ]">

        <div class="flex justify-between items-start">
          <div class="flex-1">
            <!-- Alarm Header -->
            <div class="flex items-center space-x-3 mb-2">
              <span :class="getSeverityBadgeColor(alarm.severity)"
                    class="px-2 py-1 text-xs font-medium rounded-full">
                {{ alarm.severity.toUpperCase() }}
              </span>
              <span class="text-sm font-medium capitalize">
                {{ alarm.type.replace('_', ' ') }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ formatTime(alarm.timestamp) }}
              </span>
            </div>

            <!-- Alarm Details -->
            <div class="space-y-1 text-sm text-muted-foreground">
              <div>
                <strong>Source:</strong> {{ getAlarmSource(alarm) }}
              </div>
              <div v-if="alarm.acknowledgedBy">
                <strong>Acknowledged by:</strong> {{ alarm.acknowledgedBy }}
                <span class="ml-2">({{ formatTime(alarm.acknowledgedAt || '') }})</span>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="ml-4">
            <button v-if="!alarm.acknowledged"
                    @click="acknowledgeAlarm(alarm)"
                    class="px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">
              Acknowledge
            </button>
            <span v-else class="px-4 py-2 bg-green-100 text-green-800 text-sm rounded">
              ✓ Acknowledged
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🚨</div>
      <h3 class="text-xl font-semibold mb-2">No Alarms Found</h3>
      <p class="text-muted-foreground mb-4">
        {{ hasFilters ? 'No alarms match the current filters.' : 'No alarms have been triggered.' }}
      </p>
      <button @click="hasFilters ? clearFilters() : refreshAlarms()"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
        {{ hasFilters ? 'Clear Filters' : 'Refresh' }}
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <p class="text-destructive font-medium">Error loading alarms:</p>
      <p class="text-destructive text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Alarm } from '../types/generated'
import { useAlarmStore } from '../stores/alarms'

// Use alarm store
const alarmStore = useAlarmStore()

const loading = computed(() => alarmStore.loading)
const error = computed(() => alarmStore.error)
const alarms = computed(() => alarmStore.alarms)
const filteredAlarms = computed(() => alarmStore.filteredAlarms)
const unacknowledgedAlarms = computed(() => alarmStore.unacknowledgedCount)
const hasFilters = computed(() => alarmStore.hasFilters)
const filters = computed({
  get: () => alarmStore.filters,
  set: (value) => alarmStore.setFilters(value),
})

const getSeverityBorderColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'border-l-red-500'
    case 'high': return 'border-l-orange-500'
    case 'medium': return 'border-l-yellow-500'
    case 'low': return 'border-l-blue-500'
    default: return 'border-l-gray-500'
  }
}

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getAlarmSource = (alarm: Alarm) => {
  try {
    const source = typeof alarm.source === 'string' ? JSON.parse(alarm.source) : alarm.source
    return `Camera: ${source.cameraId} | Zone: ${source.zoneId || 'Unknown'}`
  } catch {
    return 'Unknown source'
  }
}

const formatTime = (timestamp: string) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

const refreshAlarms = async () => {
  try {
    await alarmStore.fetchAlarms({ limit: 50 })
    console.log('Loaded alarms:', alarms.value)
  } catch (err) {
    console.error('Failed to load alarms:', err)
  }
}

const applyFilters = () => {
  console.log('Applying filters:', filters.value)
}

const clearFilters = () => {
  alarmStore.clearFilters()
}

const acknowledgeAlarm = async (alarm: Alarm) => {
  try {
    const currentUser = 'operator' // TODO: Get actual authenticated user
    await alarmStore.acknowledgeAlarm(alarm.id, currentUser)
    console.log('Alarm acknowledged:', alarm.id)
  } catch (err) {
    console.error('Failed to acknowledge alarm:', err)
    alert(`Failed to acknowledge alarm: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

onMounted(() => {
  refreshAlarms()
})
</script>