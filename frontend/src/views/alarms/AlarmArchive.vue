<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b bg-card">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Alarm Archive</h1>
            <p class="text-sm text-muted-foreground mt-1">
              View and search archived alarms
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ filteredAlarms.length }} archived alarm{{ filteredAlarms.length !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-3 mt-4 flex-wrap">
          <!-- Severity Filter -->
          <Select v-model="severityFilter">
            <SelectTrigger class="w-36 h-9">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <!-- Type Filter -->
          <Select v-model="typeFilter">
            <SelectTrigger class="w-36 h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="intrusion">Intrusion</SelectItem>
              <SelectItem value="loitering">Loitering</SelectItem>
              <SelectItem value="line_crossing">Line Crossing</SelectItem>
              <SelectItem value="zone_violation">Zone Violation</SelectItem>
            </SelectContent>
          </Select>

          <!-- Status Filter -->
          <Select v-model="statusFilter">
            <SelectTrigger class="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>

          <!-- Date Range Filter -->
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn(
                  'w-64 justify-start text-left font-normal h-9',
                  !dateRange && 'text-muted-foreground',
                )"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <template v-if="dateRange?.start">
                  <template v-if="dateRange.end">
                    {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} - {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                  </template>
                  <template v-else>
                    {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                  </template>
                </template>
                <template v-else>
                  Pick a date range
                </template>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <RangeCalendar v-model="dateRange" initial-focus :number-of-months="2" />
            </PopoverContent>
          </Popover>

          <!-- Clear Filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <X class="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <!-- Loading State -->
      <div v-if="store.loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-muted-foreground">
          <Loader2 class="w-5 h-5 animate-spin" />
          Loading archived alarms...
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="store.error" class="p-6">
        <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p class="text-destructive">{{ store.error }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAlarms.length === 0" class="flex flex-col items-center justify-center py-12 px-4">
        <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Bell class="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-semibold mb-2">No archived alarms found</h3>
        <p class="text-sm text-muted-foreground text-center max-w-md">
          {{ hasActiveFilters ? 'Try adjusting your filters to see more results.' : 'Archived alarms will appear here after they are automatically archived or manually moved to archive.' }}
        </p>
      </div>

      <!-- Alarms Table -->
      <div v-else class="p-6">
        <div class="border rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Severity
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Camera
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Archived
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-card divide-y divide-border">
              <tr
                v-for="alarm in paginatedAlarms"
                :key="alarm.id"
                class="hover:bg-accent/50 transition-colors cursor-pointer"
                @click="viewAlarmDetails(alarm.id)"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium">{{ formatTimestamp(alarm.timestamp) }}</div>
                  <div class="text-xs text-muted-foreground">{{ getRelativeTime(alarm.timestamp) }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="text-sm capitalize">{{ alarm.type.replace('_', ' ') }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="getSeverityColor(alarm.severity)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ alarm.severity }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  {{ alarm.source.cameraId }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="getStatusColor(alarm.status)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ alarm.status }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                  {{ alarm.archivedAt ? formatTimestamp(alarm.archivedAt) : '-' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    @click.stop="viewAlarmDetails(alarm.id)"
                    class="text-primary hover:text-primary/80 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
          <div class="text-sm text-muted-foreground">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredAlarms.length) }} of {{ filteredAlarms.length }} results
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'px-3 py-1.5 text-sm border rounded-lg transition-colors',
                  currentPage === page
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                ]"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { DateRange } from 'reka-ui'
import { useRouter } from 'vue-router'
import { useAlarmStore } from '@/stores/alarms'
import { Bell, X, Loader2, CalendarIcon } from 'lucide-vue-next'
import type { Alarm } from '@/types/generated'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const router = useRouter()
const store = useAlarmStore()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

// Filters
const severityFilter = ref<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
const typeFilter = ref<'all' | 'intrusion' | 'loitering' | 'line_crossing' | 'zone_violation'>('all')
const statusFilter = ref<'all' | 'dismissed' | 'confirmed' | 'acknowledged'>('all')
const dateRange = ref() as Ref<DateRange | undefined>

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Computed
const archivedAlarms = computed(() => {
  // Filter only archived alarms (status === 'archived' or has archivedAt timestamp)
  return store.alarms.filter(alarm =>
    (alarm as any).status === 'archived' || (alarm as any).archivedAt
  )
})

const filteredAlarms = computed(() => {
  let alarms = [...archivedAlarms.value]

  // Severity filter
  if (severityFilter.value !== 'all') {
    alarms = alarms.filter(a => a.severity === severityFilter.value)
  }

  // Type filter
  if (typeFilter.value !== 'all') {
    alarms = alarms.filter(a => a.type === typeFilter.value)
  }

  // Status filter (for archived alarms that have additional status info)
  if (statusFilter.value !== 'all') {
    alarms = alarms.filter(a => (a as any).status === statusFilter.value)
  }

  // Date range filter
  if (dateRange.value?.start) {
    const fromDate = dateRange.value.start.toDate(getLocalTimeZone()).getTime()
    alarms = alarms.filter(a => new Date(a.timestamp).getTime() >= fromDate)
  }
  if (dateRange.value?.end) {
    const toDate = new Date(dateRange.value.end.toDate(getLocalTimeZone()))
    toDate.setHours(23, 59, 59, 999)
    alarms = alarms.filter(a => new Date(a.timestamp).getTime() <= toDate.getTime())
  }

  // Sort by timestamp (newest first)
  return alarms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const paginatedAlarms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlarms.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredAlarms.value.length / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const hasActiveFilters = computed(() => {
  return severityFilter.value !== 'all' ||
         typeFilter.value !== 'all' ||
         statusFilter.value !== 'all' ||
         dateRange.value !== undefined
})

// Methods
function clearFilters() {
  severityFilter.value = 'all'
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  dateRange.value = undefined
}

function getSeverityColor(severity: string) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    low: 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
  }
  return colors[severity] || colors.low
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    dismissed: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
    confirmed: 'bg-red-500/20 text-red-700 dark:text-red-400',
    acknowledged: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    archived: 'bg-purple-500/20 text-purple-700 dark:text-purple-400'
  }
  return colors[status] || colors.archived
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

function getRelativeTime(timestamp: string) {
  const now = Date.now()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

function viewAlarmDetails(alarmId: string) {
  router.push(`/alarms/${alarmId}`)
}

// Lifecycle
onMounted(() => {
  store.fetchAlarms()
})
</script>
