<template>
  <div class="flex gap-2 flex-wrap items-center">
    <!-- Status Filters (only show when > 25 cameras) -->
    <template v-if="showStatusFilters">
      <div class="flex gap-1">
        <button
          v-for="status in statusOptions"
          :key="status.value"
          @click="emit('update:statusFilter', status.value)"
          :class="statusFilter === status.value ? status.activeClass : 'hover:bg-accent'"
          class="px-2 py-1 text-[10px] border rounded transition-colors"
        >
          {{ status.label }} {{ status.count }}
        </button>
      </div>

      <div class="w-px h-6 bg-border"></div>
    </template>

    <!-- Model Filter (only show when > 25 cameras) -->
    <Select
      v-if="showModelFilter"
      :model-value="modelFilter"
      @update:model-value="emit('update:modelFilter', $event)"
    >
      <SelectTrigger class="w-36 h-[30px] text-xs">
        <SelectValue placeholder="All Models" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Models</SelectItem>
        <SelectItem v-for="model in availableModels" :key="model" :value="model">
          {{ model }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Sort -->
    <Select
      :model-value="sortBy"
      @update:model-value="emit('update:sortBy', $event)"
    >
      <SelectTrigger class="w-36 h-[30px] text-xs">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  statusFilter: string
  modelFilter: string
  sortBy: string
  totalCount: number
  filteredCount: number
  statusCounts: Record<string, number>
  availableModels: string[]
  sortOptions?: Array<{ value: string; label: string }>
  showStatusFilters?: boolean
  showModelFilter?: boolean
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
</script>
