<template>
  <div class="flex gap-2 flex-wrap items-center">
    <!-- Status Filters -->
    <div class="flex gap-1">
      <button
        v-for="status in statusOptions"
        :key="status.value"
        @click="emit('update:statusFilter', status.value)"
        :class="statusFilter === status.value ? status.activeClass : 'hover:bg-accent'"
        class="px-2 py-1 text-[10px] border rounded transition-colors"
      >
        {{ status.label }} ({{ status.count }})
      </button>
    </div>

    <div class="w-px h-6 bg-border"></div>

    <!-- Model Filter -->
    <select
      :value="modelFilter"
      @change="emit('update:modelFilter', ($event.target as HTMLSelectElement).value)"
      class="px-2 py-1 text-[10px] border rounded bg-background cursor-pointer"
    >
      <option value="all">All Models</option>
      <option v-for="model in availableModels" :key="model" :value="model">
        {{ model }}
      </option>
    </select>

    <!-- Sort -->
    <select
      :value="sortBy"
      @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
      class="px-2 py-1 text-[10px] border rounded bg-background cursor-pointer"
    >
      <option v-for="option in sortOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <div class="flex-1"></div>

    <!-- Results Count -->
    <span class="text-[10px] text-muted-foreground">
      {{ resultsText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  statusFilter: string
  modelFilter: string
  sortBy: string
  totalCount: number
  filteredCount: number
  statusCounts: Record<string, number>
  availableModels: string[]
  sortOptions?: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  'update:statusFilter': [value: string]
  'update:modelFilter': [value: string]
  'update:sortBy': [value: string]
}>()

const statusOptions = computed(() => [
  {
    value: 'all',
    label: 'All',
    count: props.totalCount,
    activeClass: 'bg-accent border-accent-foreground'
  },
  {
    value: 'online',
    label: 'Online',
    count: props.statusCounts.online || 0,
    activeClass: 'bg-green-500/20 border-green-600'
  },
  {
    value: 'offline',
    label: 'Offline',
    count: props.statusCounts.offline || 0,
    activeClass: 'bg-red-500/20 border-red-600'
  },
  {
    value: 'configuring',
    label: 'Configuring',
    count: props.statusCounts.configuring || 0,
    activeClass: 'bg-yellow-500/20 border-yellow-600'
  }
])

const resultsText = computed(() => {
  const plural = props.totalCount !== 1 ? 's' : ''
  return `Showing ${props.filteredCount} of ${props.totalCount} camera${plural}`
})
</script>
