<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSystemMetricsStore } from '@/stores/systemMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Fingerprint } from 'lucide-vue-next'

const metricsStore = useSystemMetricsStore()
const { reid } = storeToRefs(metricsStore)

// Calculate histogram bar widths
const histogramBars = computed(() => {
  if (!reid.value?.similarityDistribution) return []
  const dist = reid.value.similarityDistribution
  const total = dist.veryLow + dist.low + dist.medium + dist.high + dist.veryHigh
  if (total === 0) return []

  return [
    { label: '<0.3', value: dist.veryLow, pct: (dist.veryLow / total) * 100, color: 'bg-red-500' },
    { label: '0.3-0.5', value: dist.low, pct: (dist.low / total) * 100, color: 'bg-orange-500' },
    { label: '0.5-0.7', value: dist.medium, pct: (dist.medium / total) * 100, color: 'bg-yellow-500' },
    { label: '0.7-0.9', value: dist.high, pct: (dist.high / total) * 100, color: 'bg-lime-500' },
    { label: '>0.9', value: dist.veryHigh, pct: (dist.veryHigh / total) * 100, color: 'bg-green-500' },
  ]
})

function formatPercent(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${(value * 100).toFixed(1)}%`
}

function formatDecimal(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return value.toFixed(3)
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <Fingerprint class="h-4 w-4" />
        Re-Identification
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <template v-if="reid">
        <!-- Match success rate -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Match Success Rate</span>
          <span class="text-lg font-semibold" :class="(reid.reidMatchSuccessRate ?? 0) > 0.5 ? 'text-green-500' : 'text-yellow-500'">
            {{ formatPercent(reid.reidMatchSuccessRate) }}
          </span>
        </div>

        <!-- Similarity distribution histogram -->
        <div class="space-y-2">
          <div class="text-xs text-muted-foreground">Similarity Distribution</div>
          <div class="space-y-1">
            <div
              v-for="bar in histogramBars"
              :key="bar.label"
              class="flex items-center gap-2"
            >
              <span class="w-12 text-xs text-muted-foreground text-right">{{ bar.label }}</span>
              <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full transition-all"
                  :class="bar.color"
                  :style="{ width: `${bar.pct}%` }"
                />
              </div>
              <span class="w-8 text-xs text-muted-foreground">{{ bar.value }}</span>
            </div>
          </div>
        </div>

        <!-- Key metrics grid -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Avg Match Similarity</div>
            <div class="text-sm font-medium">{{ formatDecimal(reid.avgMatchSimilarity) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Match Attempts</div>
            <div class="text-sm font-medium">{{ reid.reidMatchAttempts?.toLocaleString() || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Embedding Bonus</div>
            <div class="text-sm text-green-500">+{{ reid.embeddingBonusApplied || 0 }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Embedding Penalty</div>
            <div class="text-sm text-red-500">-{{ reid.embeddingPenaltyApplied || 0 }}</div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
