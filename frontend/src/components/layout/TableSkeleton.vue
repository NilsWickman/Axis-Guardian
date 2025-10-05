<template>
  <div class="flex-1 space-y-2" :class="containerClass">
    <div
      v-for="i in rows"
      :key="i"
      class="bg-card border rounded p-2 animate-pulse"
      :class="rowClass"
    >
      <div class="flex justify-between items-center">
        <div class="space-y-1.5 flex-1">
          <div class="h-3 bg-muted rounded" :style="{ width: primaryWidth }"></div>
          <div class="h-2 bg-muted rounded" :style="{ width: secondaryWidth }"></div>
        </div>
        <div v-if="showActions" class="h-6 bg-muted rounded" :style="{ width: actionsWidth }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  primaryWidth?: string
  secondaryWidth?: string
  actionsWidth?: string
  showActions?: boolean
  containerClass?: string
  rowClass?: string
}>(), {
  rows: 6,
  primaryWidth: '25%',
  secondaryWidth: '33%',
  actionsWidth: '64px',
  showActions: true,
  containerClass: 'px-4',
  rowClass: ''
})
</script>
