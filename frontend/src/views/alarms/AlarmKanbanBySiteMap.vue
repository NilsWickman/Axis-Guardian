<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { DateRange } from 'reka-ui'
import { useRouter } from 'vue-router'
import { useAlarms } from '@/composables/useAlarms'
import { useAuthStore } from '@/stores/auth'
import { Map, AlertTriangle, Bell, X, Loader2, CalendarIcon } from 'lucide-vue-next'
import type { components } from '@/types/generated'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Alarm = components['schemas']['Alarm']

const router = useRouter()
const authStore = useAuthStore()
const { store, loadAlarms, acknowledgeAlarm, getSeverityColor, formatTimestamp, getRelativeTime } = useAlarms()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

// Filters
const statusFilter = ref<'all' | 'pending' | 'acknowledged'>('all')
const severityFilter = ref<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
const timeRangeFilter = ref<'1h' | '6h' | '12h' | '24h' | 'all'>('all')
const dateRange = ref() as Ref<DateRange | undefined>

// Site maps matching actual frontend site maps
const siteMaps = ref([
  { id: 'map-office-building', name: 'Site Map 1', cameras: ['cam-05', 'cam-06'] },
  { id: 'map-warehouse-main', name: 'Site Map 2', cameras: ['cam-01', 'cam-02', 'cam-03', 'cam-04'] },
  { id: 'map-parking-lot', name: 'Site Map 3', cameras: ['cam-02', 'cam-05', 'cam-06'] },
])

// Filter alarms based on selected filters
const filteredAlarms = computed(() => {
  let alarms = [...store.alarms]

  // Status filter
  if (statusFilter.value === 'pending') {
    alarms = alarms.filter(a => !a.acknowledged)
  } else if (statusFilter.value === 'acknowledged') {
    alarms = alarms.filter(a => a.acknowledged)
  }

  // Severity filter
  if (severityFilter.value !== 'all') {
    alarms = alarms.filter(a => a.severity === severityFilter.value)
  }

  // Time range filter
  if (timeRangeFilter.value !== 'all') {
    const now = Date.now()
    const timeRanges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }
    const range = timeRanges[timeRangeFilter.value]
    alarms = alarms.filter(a => now - new Date(a.timestamp).getTime() <= range)
  }

  // Date range filter
  if (dateRange.value?.start) {
    const fromDate = dateRange.value.start.toDate(getLocalTimeZone()).getTime()
    alarms = alarms.filter(a => new Date(a.timestamp).getTime() >= fromDate)
  }
  if (dateRange.value?.end) {
    const toDate = new Date(dateRange.value.end.toDate(getLocalTimeZone()))
    toDate.setHours(23, 59, 59, 999) // End of day
    alarms = alarms.filter(a => new Date(a.timestamp).getTime() <= toDate.getTime())
  }

  return alarms
})

const hasActiveFilters = computed(() => {
  return statusFilter.value !== 'all' ||
         severityFilter.value !== 'all' ||
         timeRangeFilter.value !== 'all' ||
         dateRange.value !== undefined
})

const clearFilters = () => {
  statusFilter.value = 'all'
  severityFilter.value = 'all'
  timeRangeFilter.value = 'all'
  dateRange.value = undefined
}

const kanbanColumns = computed(() => {
  return siteMaps.value.map(siteMap => {
    const alarms = filteredAlarms.value.filter(alarm =>
      siteMap.cameras.includes(alarm.source.cameraId)
    ).sort((a, b) => {
      // Sort by acknowledgment status first, then by severity, then by timestamp
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1
      }
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    const unacknowledged = alarms.filter(a => !a.acknowledged).length
    const critical = alarms.filter(a => a.severity === 'critical').length

    return {
      ...siteMap,
      alarms,
      count: alarms.length,
      unacknowledged,
      critical,
    }
  })
})

const totalAlarmsCount = computed(() => filteredAlarms.value.length)
const totalPendingCount = computed(() => filteredAlarms.value.filter(a => !a.acknowledged).length)

onMounted(async () => {
  await loadAlarms()
})

const handleAcknowledge = async (alarmId: string) => {
  if (authStore.currentUser) {
    await acknowledgeAlarm(alarmId, authStore.currentUser.username)
  }
}

const viewAlarmDetails = (alarmId: string) => {
  router.push(`/alarms/${alarmId}`)
}
</script>

<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-sidebar-border">
      <div class="mb-4">
        <h1 class="text-base font-bold text-foreground mb-2">Alarms</h1>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Total:</span>
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
              {{ totalAlarmsCount }}
            </span>
          </div>
          <div v-if="totalPendingCount > 0" class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Pending:</span>
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-600">
              {{ totalPendingCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Status Filter -->
        <Select v-model="statusFilter">
          <SelectTrigger class="w-36 h-[30px] text-xs">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
            <SelectItem value="acknowledged">Acknowledged Only</SelectItem>
          </SelectContent>
        </Select>

        <!-- Severity Filter -->
        <Select v-model="severityFilter">
          <SelectTrigger class="w-36 h-[30px] text-xs">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <!-- Time Range Filter -->
        <Select v-model="timeRangeFilter">
          <SelectTrigger class="w-36 h-[30px] text-xs">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="6h">Last 6 Hours</SelectItem>
            <SelectItem value="12h">Last 12 Hours</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
          </SelectContent>
        </Select>

        <!-- Date Range Filter -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              :class="cn(
                'w-[200px] justify-start text-left font-normal text-xs h-[30px] px-3',
                !dateRange && 'text-muted-foreground',
              )"
            >
              <CalendarIcon class="mr-2 h-3 w-3" />
              <template v-if="dateRange?.start">
                <template v-if="dateRange.end">
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} - {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                </template>
                <template v-else>
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                </template>
              </template>
              <template v-else>
                Pick date range
              </template>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <RangeCalendar
              v-model="dateRange"
              initial-focus
              :number-of-months="2"
            />
          </PopoverContent>
        </Popover>

        <!-- Clear Filters Button -->
        <Button
          v-if="hasActiveFilters"
          @click="clearFilters"
          variant="outline"
          size="sm"
          class="h-[30px] text-xs"
        >
          <X class="w-3 h-3 mr-1" />
          Clear Filters
        </Button>
      </div>
    </div>

    <!-- Kanban Headers (Fixed) -->
    <div class="flex gap-0 border-b">
      <div
        v-for="column in kanbanColumns"
        :key="`header-${column.id}`"
        class="flex-1 min-w-[280px] p-4 bg-card border-r last:border-r-0"
      >
        <h3 class="font-semibold text-foreground">
          {{ column.name }}
        </h3>
      </div>
    </div>

    <!-- Kanban Board (Scrollable Content) -->
    <div class="flex-1 overflow-y-scroll">
      <div class="flex gap-0 min-h-full">
        <div
          v-for="column in kanbanColumns"
          :key="column.id"
          class="flex-1 min-w-[280px] border-r last:border-r-0"
        >
          <!-- Column Content -->
          <div class="p-3 space-y-2 bg-card">
            <!-- Loading state (only when loading and no data) -->
            <div v-if="store.loading && column.alarms.length === 0" class="flex justify-center items-center py-12">
              <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
            </div>

            <!-- Empty state -->
            <div v-else-if="!store.loading && column.alarms.length === 0" class="text-center py-8 text-muted-foreground text-sm">
              No alarms
            </div>

            <!-- Alarms -->
            <div
              v-for="alarm in column.alarms"
              :key="alarm.id"
              class="bg-card border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
              :class="[
                alarm.severity === 'critical' ? 'border-red-300' :
                alarm.severity === 'high' ? 'border-orange-300' :
                'border-border',
                alarm.acknowledged ? 'opacity-60' : ''
              ]"
              @click="viewAlarmDetails(alarm.id)"
            >
              <div class="flex items-start gap-2 mb-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="text-sm font-semibold text-foreground truncate">
                      Alarm {{ alarm.id }}
                    </h4>
                    <span
                      v-if="alarm.acknowledged"
                      class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 flex-shrink-0"
                    >
                      ACK
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ getRelativeTime(alarm.timestamp) }}
                  </p>
                </div>
                <span
                  class="px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0"
                  :class="getSeverityColor(alarm.severity)"
                >
                  {{ alarm.severity[0].toUpperCase() }}
                </span>
              </div>

              <div class="space-y-1 text-xs mb-3">
                <div class="flex items-center gap-1 text-muted-foreground">
                  <Bell class="w-3 h-3" />
                  <span class="truncate">{{ alarm.source.cameraId }}</span>
                </div>
                <div class="text-muted-foreground truncate">
                  Zone: {{ alarm.source.zoneId }}
                </div>
              </div>

              <!-- Card Actions -->
              <div class="flex gap-1 pt-2 border-t">
                <button
                  @click.stop="viewAlarmDetails(alarm.id)"
                  class="flex-1 px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Details
                </button>
                <button
                  v-if="!alarm.acknowledged"
                  @click.stop="handleAcknowledge(alarm.id)"
                  class="flex-1 px-2 py-1 text-xs font-medium rounded bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
