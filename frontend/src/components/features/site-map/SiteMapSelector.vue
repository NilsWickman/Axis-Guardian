<template>
  <div class="w-64 border-r bg-card overflow-y-auto flex flex-col">
    <div class="p-4 border-b flex items-center justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h2 class="text-base font-bold">{{ title }}</h2>
        <p class="text-xs text-muted-foreground mt-1">{{ subtitle }}</p>
      </div>
      <!-- Add New Site Map Button -->
      <button
        @click.stop="emit('addNew')"
        type="button"
        class="px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0 cursor-pointer text-xs font-medium"
        title="Add New Site Map"
      >
        new site
      </button>
    </div>

    <slot name="controls"></slot>

    <div class="flex-1 p-3 space-y-2">
      <div
        v-for="map in siteMaps"
        :key="map.id"
        @click="emit('select', map.id)"
        class="p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md"
        :class="selectedMapId === map.id ? 'bg-accent border-accent-foreground' : 'hover:bg-accent/50'"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-sm">{{ map.name }}</h3>
          <button
            @click.stop="emit('edit', map.id)"
            type="button"
            class="p-1 hover:bg-accent rounded transition-colors shrink-0"
            title="Edit Site Map"
          >
            <SquarePen class="h-3.5 w-3.5" />
          </button>
        </div>

        <p v-if="map.description" class="text-xs text-muted-foreground mb-2">
          {{ map.description }}
        </p>

        <div class="flex items-baseline justify-between text-xs">
          <div class="flex items-baseline gap-2">
            <span class="text-muted-foreground">Cameras:</span>
            <span class="font-semibold">{{ map.cameras.length }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-muted-foreground">Size:</span>
            <span class="font-mono text-[10px]">{{ formatSize(map) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SquarePen } from 'lucide-vue-next'
import type { SiteMap } from '@/stores/siteMaps'

withDefaults(defineProps<{
  siteMaps: SiteMap[]
  selectedMapId: string | null
  title?: string
  subtitle?: string
}>(), {
  title: 'Site Maps',
  subtitle: 'Select a site map to view'
})

const emit = defineEmits<{
  select: [mapId: string]
  addNew: []
  edit: [mapId: string]
}>()

const formatSize = (map: SiteMap): string => {
  // Convert pixels to meters using the scale (pixels per meter)
  const widthMeters = map.width / map.scale
  const heightMeters = map.height / map.scale

  // Format to 1 decimal place
  return `${widthMeters.toFixed(1)} × ${heightMeters.toFixed(1)} m`
}
</script>
