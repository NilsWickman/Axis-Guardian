<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSystemMetricsStore } from '@/stores/systemMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, AlertTriangle, TrendingUp } from 'lucide-vue-next'

const metricsStore = useSystemMetricsStore()
const { lifecycle, quality, reid } = storeToRefs(metricsStore)

const idSwitchTrend = computed(() => {
  if (!reid.value) return 'neutral'
  const rate = reid.value.idSwitchCount
  if (rate === 0) return 'good'
  if (rate < 5) return 'warning'
  return 'bad'
})

function formatPercent(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${(value * 100).toFixed(1)}%`
}

function formatMs(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  if (value > 1000) return `${(value / 1000).toFixed(1)}s`
  return `${value.toFixed(0)}ms`
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <Users class="h-4 w-4" />
        Tracking Quality
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <template v-if="lifecycle">
        <!-- ID Switch Counter with trend -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div class="flex items-center gap-2">
            <AlertTriangle
              class="h-4 w-4"
              :class="{
                'text-green-500': idSwitchTrend === 'good',
                'text-yellow-500': idSwitchTrend === 'warning',
                'text-red-500': idSwitchTrend === 'bad',
              }"
            />
            <span class="text-sm">ID Switches</span>
          </div>
          <span class="text-2xl font-bold" :class="{
            'text-green-500': idSwitchTrend === 'good',
            'text-yellow-500': idSwitchTrend === 'warning',
            'text-red-500': idSwitchTrend === 'bad',
          }">
            {{ reid?.idSwitchCount ?? '-' }}
          </span>
        </div>

        <!-- Track lifecycle stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Tracks Created</div>
            <div class="text-lg font-semibold">{{ lifecycle?.totalTracksCreated?.toLocaleString() || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Tracks Confirmed</div>
            <div class="text-lg font-semibold">{{ lifecycle?.totalTracksConfirmed?.toLocaleString() || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Ghost Rate</div>
            <div class="text-sm" :class="(lifecycle?.ghostTrackRate ?? 0) > 0.3 ? 'text-yellow-500' : ''">
              {{ formatPercent(lifecycle?.ghostTrackRate) }}
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Occlusion Recovery</div>
            <div class="text-sm">{{ formatPercent(lifecycle?.occlusionRecoveryRate) }}</div>
          </div>
        </div>

        <!-- Timing stats -->
        <div class="pt-2 border-t border-border">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <div class="text-xs text-muted-foreground">Avg Time to Confirm</div>
              <div class="text-sm">{{ formatMs(lifecycle?.avgTimeToConfirmMs) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-muted-foreground">Avg Track Duration</div>
              <div class="text-sm">{{ formatMs(lifecycle?.avgTrackDurationMs) }}</div>
            </div>
          </div>
        </div>

        <!-- Quality metrics -->
        <div v-if="quality" class="pt-2 border-t border-border">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp class="h-3 w-3 text-muted-foreground" />
            <span class="text-xs text-muted-foreground">Quality Indicators</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <div class="text-xs text-muted-foreground">Track Purity</div>
              <div class="text-sm">{{ formatPercent(quality.trackPurity) }}</div>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-muted-foreground">Coverage</div>
              <div class="text-sm">{{ formatPercent(quality.avgTrackCoverage) }}</div>
            </div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
