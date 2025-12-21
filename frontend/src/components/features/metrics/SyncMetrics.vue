<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSystemMetricsStore } from '@/stores/systemMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Radio } from 'lucide-vue-next'

const metricsStore = useSystemMetricsStore()
const { sync, diagnostic } = storeToRefs(metricsStore)

// Camera sync offset bars
const cameraOffsets = computed(() => {
  if (!sync.value?.cameraSyncOffsets) return []
  const offsets = sync.value.cameraSyncOffsets
  const maxOffset = Math.max(...Object.values(offsets).map(Math.abs), 1)

  return Object.entries(offsets).map(([cameraId, offset]) => ({
    cameraId,
    offset,
    barWidth: Math.abs(offset) / maxOffset * 50,
    isNegative: offset < 0,
  }))
})

function formatPercent(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${(value * 100).toFixed(1)}%`
}

function formatMs(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-'
  return `${value.toFixed(1)}ms`
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <Radio class="h-4 w-4" />
        Camera Sync
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <template v-if="sync">
        <!-- Batch completion rate -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Batch Completion</span>
          <span class="text-lg font-semibold" :class="(sync.batchCompletionRate ?? 0) > 0.9 ? 'text-green-500' : 'text-yellow-500'">
            {{ formatPercent(sync.batchCompletionRate) }}
          </span>
        </div>

        <!-- Camera sync offsets (bar chart) -->
        <div v-if="cameraOffsets.length > 0" class="space-y-2">
          <div class="text-xs text-muted-foreground">Clock Offsets</div>
          <div class="space-y-1">
            <div
              v-for="cam in cameraOffsets"
              :key="cam.cameraId"
              class="flex items-center gap-2"
            >
              <span class="w-16 text-xs text-muted-foreground truncate">{{ cam.cameraId }}</span>
              <div class="flex-1 flex items-center h-4">
                <!-- Center line -->
                <div class="w-1/2 flex justify-end">
                  <div
                    v-if="cam.isNegative"
                    class="h-2 bg-blue-500 rounded-l"
                    :style="{ width: `${cam.barWidth}%` }"
                  />
                </div>
                <div class="w-px h-full bg-border" />
                <div class="w-1/2 flex justify-start">
                  <div
                    v-if="!cam.isNegative"
                    class="h-2 bg-orange-500 rounded-r"
                    :style="{ width: `${cam.barWidth}%` }"
                  />
                </div>
              </div>
              <span class="w-14 text-xs text-muted-foreground text-right">
                {{ cam.offset > 0 ? '+' : '' }}{{ cam.offset.toFixed(0) }}ms
              </span>
            </div>
          </div>
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Batches Processed</div>
            <div class="text-sm font-medium">{{ sync.batchesProcessed?.toLocaleString() || '-' }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Timeout Flushes</div>
            <div class="text-sm" :class="(sync.timeoutFlushes ?? 0) > 10 ? 'text-yellow-500' : ''">
              {{ sync.timeoutFlushes || 0 }}
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Max Clock Drift</div>
            <div class="text-sm">{{ formatMs(sync.maxClockDriftMs) }}</div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">Avg Cameras/Batch</div>
            <div class="text-sm">{{ sync.avgCamerasPerBatch?.toFixed(1) || '-' }}</div>
          </div>
        </div>

        <!-- Diagnostic rejects -->
        <div v-if="diagnostic" class="pt-2 border-t border-border">
          <div class="text-xs text-muted-foreground mb-2">Pipeline Rejects</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Exclusion Zone:</span>
              <span>{{ diagnostic.exclusionZoneBlocks || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Velocity Sanity:</span>
              <span>{{ diagnostic.velocitySanityRejects || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Assignment Gate:</span>
              <span>{{ diagnostic.assignmentGateRejects || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Projection Fail:</span>
              <span>{{ diagnostic.projectionFailures || 0 }}</span>
            </div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
