<template>
  <div
    v-if="alerts && alerts.length > 0"
    class="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-none"
  >
    <div
      v-for="alert in alerts"
      :key="alert.id"
      class="bg-orange-500/90 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm mb-2 shadow-lg animate-pulse"
    >
      <div class="flex items-center space-x-2">
        <span class="text-sm font-semibold">⚠️ {{ alert.type }}</span>
        <span class="text-xs opacity-90">{{ alert.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  alerts?: Array<{ id: string; type: string; message: string }>
}>()
</script>
