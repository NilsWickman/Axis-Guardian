<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSystemMetricsStore } from '@/stores/systemMetrics'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { X, FileText, Video, Clock, Layers } from 'lucide-vue-next'
import PerformanceMetrics from './PerformanceMetrics.vue'
import TrackingMetrics from './TrackingMetrics.vue'
import ReIDMetrics from './ReIDMetrics.vue'
import SyncMetrics from './SyncMetrics.vue'

const metricsStore = useSystemMetricsStore()
const { isOpen, evaluationInfo } = storeToRefs(metricsStore)
</script>

<template>
  <Drawer
    :open="isOpen"
    direction="right"
    @update:open="(open: boolean) => open ? metricsStore.openDrawer() : metricsStore.closeDrawer()"
  >
    <DrawerContent class="h-full w-[400px] sm:max-w-[450px]">
      <DrawerHeader class="border-b border-border pb-4">
        <div class="flex items-center justify-between">
          <div>
            <DrawerTitle class="text-lg font-semibold">Evaluation Metrics</DrawerTitle>
            <DrawerDescription class="text-sm text-muted-foreground">
              Test run performance analysis
            </DrawerDescription>
          </div>
          <DrawerClose as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <X class="h-4 w-4" />
            </Button>
          </DrawerClose>
        </div>

        <!-- Evaluation metadata -->
        <div v-if="evaluationInfo" class="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium">
            <FileText class="h-3 w-3" />
            <span>{{ evaluationInfo.id }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-1.5">
              <Video class="h-3 w-3" />
              <span>{{ evaluationInfo.source }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Clock class="h-3 w-3" />
              <span>{{ evaluationInfo.duration }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Layers class="h-3 w-3" />
              <span>{{ evaluationInfo.frames.toLocaleString() }} frames</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ evaluationInfo.annotations }} annotations</span>
            </div>
          </div>
        </div>
      </DrawerHeader>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <PerformanceMetrics />
        <TrackingMetrics />
        <ReIDMetrics />
        <SyncMetrics />
      </div>
    </DrawerContent>
  </Drawer>
</template>
