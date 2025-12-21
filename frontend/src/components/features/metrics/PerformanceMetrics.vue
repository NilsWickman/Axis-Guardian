<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSystemMetricsStore } from '@/stores/systemMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-vue-next'

const metricsStore = useSystemMetricsStore()
const { performance } = storeToRefs(metricsStore)

const latencyColor = computed(() => {
  if (!performance.value) return 'text-muted-foreground'
  const p95 = performance.value.processingLatency.p95
  if (p95 < 20) return 'text-green-500'
  if (p95 < 50) return 'text-yellow-500'
  return 'text-red-500'
})

function formatMs(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${value.toFixed(1)}ms`
}

function formatRate(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${value.toFixed(1)}/s`
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <Activity class="h-4 w-4" />
        Performance
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <template v-if="performance">
        <!-- Latency sparkline representation -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Processing Latency</span>
            <span :class="latencyColor">p95: {{ formatMs(performance.processingLatency.p95) }}</span>
          </div>
          <div class="flex items-center gap-1 h-6">
            <div class="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-primary transition-all"
                :style="{ width: `${Math.min(100, (performance.processingLatency.p50 / 100) * 100)}%` }"
              />
            </div>
          </div>
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>p50: {{ formatMs(performance.processingLatency.p50) }}</span>
            <span>p99: {{ formatMs(performance.processingLatency.p99) }}</span>
          </div>
        </div>

        <!-- Key metrics -->
        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Throughput</div>
            <div class="text-lg font-semibold">{{ formatRate(performance.detectionsPerSecond) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Total Processed</div>
            <div class="text-lg font-semibold">{{ performance.totalDetectionsProcessed?.toLocaleString() || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Hungarian Algo</div>
            <div class="text-sm">{{ formatMs(performance.avgHungarianTimeMs) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Kalman Update</div>
            <div class="text-sm">{{ formatMs(performance.avgKalmanUpdateTimeMs) }}</div>
          </div>
        </div>

        <!-- Tracks per camera -->
        <div v-if="performance.tracksPerCamera && Object.keys(performance.tracksPerCamera).length > 0" class="pt-2">
          <div class="text-xs text-muted-foreground mb-1">Active Tracks by Camera</div>
          <div class="flex gap-2 flex-wrap">
            <span
              v-for="(count, cameraId) in performance.tracksPerCamera"
              :key="cameraId"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
            >
              <span class="text-muted-foreground">{{ cameraId }}:</span>
              <span class="font-medium">{{ count }}</span>
            </span>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
