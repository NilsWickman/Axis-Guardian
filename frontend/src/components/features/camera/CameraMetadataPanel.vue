<template>
  <div class="mt-2 border rounded-lg bg-card overflow-hidden">
    <button
      @click="emit('update:open', !open)"
      class="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold hover:bg-accent transition-colors"
    >
      <span>{{ title }}</span>
      <span>{{ open ? '▼' : '▶' }}</span>
    </button>
    <div v-if="open" class="px-3 py-2 border-t text-xs space-y-2">
      <div class="grid grid-cols-3 gap-2">
        <div class="bg-muted p-2 rounded">
          <div class="text-muted-foreground text-[10px]">People</div>
          <div class="font-semibold">{{ metadata?.peopleCount || 0 }}</div>
        </div>
        <div class="bg-muted p-2 rounded">
          <div class="text-muted-foreground text-[10px]">Vehicles</div>
          <div class="font-semibold">{{ metadata?.vehicleCount || 0 }}</div>
        </div>
        <div class="bg-muted p-2 rounded">
          <div class="text-muted-foreground text-[10px]">Motion</div>
          <div class="font-semibold">{{ metadata?.motionLevel || 'Low' }}</div>
        </div>
      </div>
      <div v-if="metadata?.detections && metadata.detections.length > 0" class="space-y-1">
        <div class="text-muted-foreground text-[10px] font-semibold">Recent Detections:</div>
        <div
          v-for="detection in metadata.detections"
          :key="detection.id"
          class="flex items-center justify-between bg-muted px-2 py-1 rounded"
        >
          <span>{{ detection.object }}</span>
          <span class="text-muted-foreground">{{ detection.confidence }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  metadata?: {
    peopleCount: number
    vehicleCount: number
    motionLevel: string
    detections: Array<{ id: string; object: string; confidence: number }>
  }
  title?: string
}>(), {
  title: 'Analytics & Metadata'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>
