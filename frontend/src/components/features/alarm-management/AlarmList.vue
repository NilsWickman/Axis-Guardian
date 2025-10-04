<template>
  <div class="alarm-list space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-foreground">Alarm Management</h2>
      <div class="flex items-center space-x-2">
        <Badge :variant="unacknowledgedCount > 0 ? 'destructive' : 'default'">
          {{ unacknowledgedCount }} Unacknowledged
        </Badge>
        <Button @click="refreshAlarms" size="sm" variant="outline">
          <RefreshCw class="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardHeader>
        <CardTitle class="text-sm">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="text-sm font-medium">Type</label>
            <Select v-model="filters.type">
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="intrusion">Intrusion</SelectItem>
                <SelectItem value="loitering">Loitering</SelectItem>
                <SelectItem value="line_crossing">Line Crossing</SelectItem>
                <SelectItem value="zone_violation">Zone Violation</SelectItem>
                <SelectItem value="abandoned_object">Abandoned Object</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium">Severity</label>
            <Select v-model="filters.severity">
              <SelectTrigger>
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium">Status</label>
            <Select v-model="filters.acknowledged">
              <SelectTrigger>
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="false">Unacknowledged</SelectItem>
                <SelectItem value="true">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-end">
            <Button @click="applyFilters" size="sm">
              <Filter class="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Alarms List -->
    <div class="space-y-3">
      <div v-if="loading" class="text-center p-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle class="w-8 h-8" />
        </div>
        Loading alarms...
      </div>

      <div v-else-if="alarms.length === 0" class="text-center p-8 text-muted-foreground">
        <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Shield class="w-8 h-8" />
        </div>
        No alarms found
      </div>

      <AlarmCard
        v-for="alarm in alarms"
        :key="alarm.id"
        :alarm="alarm"
        @acknowledge="handleAcknowledge"
        @view-source="handleViewSource"
        @view-camera="handleViewCamera"
      />
    </div>

    <!-- Load More -->
    <div v-if="alarms.length > 0" class="text-center">
      <Button @click="loadMore" variant="outline" :disabled="loading">
        {{ loading ? 'Loading...' : 'Load More' }}
      </Button>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedAlarms.length > 0" class="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">{{ selectedAlarms.length }} selected</span>
        <Button @click="acknowledgeSelected" size="sm">
          <Check class="w-4 h-4 mr-1" />
          Acknowledge All
        </Button>
        <Button @click="clearSelection" size="sm" variant="outline">
          Clear
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Shield, RefreshCw, Filter, Check } from 'lucide-vue-next'
import AlarmCard from './AlarmCard.vue'
import type { Alarm, Detection } from '@/types/generated'
import { DetectionApiClient } from '@/api/clients/detections'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  'view-camera': [cameraId: string]
  'view-source': [alarm: Alarm]
}>()

const alarms = ref<Alarm[]>([])
const selectedAlarms = ref<string[]>([])
const loading = ref(false)

const filters = ref({
  type: '',
  severity: '',
  acknowledged: ''
})

const detectionApi = new DetectionApiClient()
const { user } = useAuth()

const unacknowledgedCount = computed(() =>
  alarms.value.filter(alarm => !alarm.acknowledged).length
)

const loadAlarms = async (append = false) => {
  loading.value = true
  try {
    const params: any = {
      limit: 20,
      offset: append ? alarms.value.length : 0
    }

    if (filters.value.type) params.type = filters.value.type
    if (filters.value.severity) params.severity = filters.value.severity
    if (filters.value.acknowledged) params.acknowledged = filters.value.acknowledged === 'true'

    const newAlarms = await detectionApi.getAlarms(params)

    if (append) {
      alarms.value.push(...newAlarms)
    } else {
      alarms.value = newAlarms
    }
  } catch (error) {
    console.error('Failed to load alarms:', error)
  } finally {
    loading.value = false
  }
}

const refreshAlarms = () => {
  loadAlarms(false)
}

const loadMore = () => {
  loadAlarms(true)
}

const applyFilters = () => {
  loadAlarms(false)
}

const handleAcknowledge = async (alarmId: string) => {
  if (!user.value) return

  try {
    await detectionApi.acknowledgeAlarm(alarmId, user.value.username)

    // Update local state
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.acknowledged = true
      alarm.acknowledgedBy = user.value.username
      alarm.acknowledgedAt = new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to acknowledge alarm:', error)
  }
}

const acknowledgeSelected = async () => {
  if (!user.value) return

  try {
    await Promise.all(
      selectedAlarms.value.map(alarmId =>
        detectionApi.acknowledgeAlarm(alarmId, user.value!.username)
      )
    )

    // Update local state
    selectedAlarms.value.forEach(alarmId => {
      const alarm = alarms.value.find(a => a.id === alarmId)
      if (alarm) {
        alarm.acknowledged = true
        alarm.acknowledgedBy = user.value!.username
        alarm.acknowledgedAt = new Date().toISOString()
      }
    })

    clearSelection()
  } catch (error) {
    console.error('Failed to acknowledge selected alarms:', error)
  }
}

const clearSelection = () => {
  selectedAlarms.value = []
}

const handleViewSource = (alarm: Alarm) => {
  emit('view-source', alarm)
}

const handleViewCamera = (cameraId: string) => {
  emit('view-camera', cameraId)
}

// Create alarm from detection (called from parent)
const createAlarmFromDetection = async (detection: Detection) => {
  const newAlarm: Alarm = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'intrusion', // Default type, would be determined by detection analysis
    severity: detection.confidence > 0.9 ? 'high' : detection.confidence > 0.7 ? 'medium' : 'low',
    source: {
      cameraId: detection.cameraId,
      zoneId: 'zone-1', // Would be determined by detection location
      trackId: detection.id
    },
    acknowledged: false
  }

  // Add to beginning of list
  alarms.value.unshift(newAlarm)
}

// Expose method to parent component
defineExpose({
  createAlarmFromDetection
})

onMounted(() => {
  loadAlarms()
})

// Auto-refresh every 30 seconds for unacknowledged alarms
const autoRefreshInterval = setInterval(() => {
  if (unacknowledgedCount.value > 0) {
    refreshAlarms()
  }
}, 30000)

// Cleanup on unmount
onUnmounted(() => {
  clearInterval(autoRefreshInterval)
})
</script>