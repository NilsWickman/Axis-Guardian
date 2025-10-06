<template>
  <div class="h-full flex flex-col bg-background overflow-auto">
    <!-- Header -->
    <div class="border-b border-sidebar-border p-4">
      <h1 class="text-base font-bold text-foreground mb-4">Dashboard</h1>

      <div class="flex space-x-3">
        <button
          v-for="preset in timePresets"
          :key="preset.key"
          @click="setTimeRange(preset.key)"
          class="px-3 py-1 text-sm border rounded hover:bg-accent"
          :class="{ 'bg-primary text-primary-foreground': selectedPreset === preset.key }"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div v-if="analytics" class="p-4 space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="border rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Total Events</div>
          <div class="text-3xl font-bold">{{ analytics.totalEvents }}</div>
          <div class="text-xs mt-1" :class="getTrendClass(analytics.trend)">
            {{ analytics.trend }} trend
          </div>
        </div>

        <div class="border rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Avg Events/Day</div>
          <div class="text-3xl font-bold">{{ analytics.averageEventsPerDay.toFixed(0) }}</div>
        </div>

        <div class="border rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Peak Hour</div>
          <div class="text-3xl font-bold">{{ analytics.peakHour }}:00</div>
        </div>

        <div class="border rounded-lg p-4">
          <div class="text-sm text-muted-foreground">Peak Day</div>
          <div class="text-3xl font-bold">{{ getDayName(analytics.peakDay) }}</div>
        </div>
      </div>

      <!-- Events by Type Chart -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Events by Type</h3>
        <div class="space-y-2">
          <div
            v-for="(count, type) in analytics.eventsByType"
            :key="type"
            class="flex items-center"
          >
            <div class="w-32 text-sm">{{ type }}</div>
            <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                class="h-6 rounded-full flex items-center justify-end px-2"
                :style="{
                  width: `${(count / analytics.totalEvents) * 100}%`,
                  backgroundColor: getEventTypeColor(type),
                }"
              >
                <span class="text-xs font-semibold text-white">{{ count }}</span>
              </div>
            </div>
            <div class="w-16 text-right text-sm text-muted-foreground">
              {{ ((count / analytics.totalEvents) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Events by Camera -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Events by Camera</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="(count, cameraId) in analytics.eventsByCameraId"
            :key="cameraId"
            class="border rounded p-3"
          >
            <div class="text-sm font-medium">{{ cameraId }}</div>
            <div class="text-2xl font-bold">{{ count }}</div>
          </div>
        </div>
      </div>

      <!-- Events by Hour -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Events by Hour of Day</h3>
        <div class="flex items-end space-x-1 h-48">
          <div
            v-for="(count, hour) in analytics.eventsByHour"
            :key="hour"
            class="flex-1 bg-primary rounded-t relative group"
            :style="{ height: `${(count / Math.max(...analytics.eventsByHour)) * 100}%` }"
          >
            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded">
              {{ hour }}:00 - {{ count }} events
            </div>
          </div>
        </div>
        <div class="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0:00</span>
          <span>6:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      <!-- Events by Day of Week -->
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold mb-4">Events by Day of Week</h3>
        <div class="flex items-end space-x-2 h-48">
          <div
            v-for="(count, day) in analytics.eventsByDayOfWeek"
            :key="day"
            class="flex-1 flex flex-col items-center"
          >
            <div class="text-xs text-muted-foreground mb-1">{{ count }}</div>
            <div
              class="w-full bg-primary rounded-t"
              :style="{ height: `${(count / Math.max(...analytics.eventsByDayOfWeek)) * 100}%` }"
            ></div>
            <div class="text-xs font-medium mt-2">{{ getDayName(day) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading analytics...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeline } from '@/composables/useTimeline'

const { loadEventAnalytics, store, setPreset } = useTimeline()

const selectedPreset = ref('last24Hours')

const timePresets = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last24Hours', label: 'Last 24h' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
]

const analytics = computed(() => store.eventAnalytics)

const setTimeRange = async (preset: string) => {
  selectedPreset.value = preset
  setPreset(preset as any)
  await loadEventAnalytics()
}

const getTrendClass = (trend: string) => {
  const classes: Record<string, string> = {
    increasing: 'text-red-600',
    decreasing: 'text-green-600',
    stable: 'text-blue-600',
  }
  return classes[trend] || 'text-gray-600'
}

const getDayName = (day: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[day]
}

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    motion: '#3b82f6',
    person: '#10b981',
    vehicle: '#8b5cf6',
    sound: '#f59e0b',
    alarm: '#ef4444',
    zone_breach: '#f97316',
    camera_offline: '#6b7280',
    camera_online: '#06b6d4',
  }
  return colors[type] || '#9ca3af'
}

onMounted(async () => {
  await setTimeRange('last24Hours')
})
</script>
