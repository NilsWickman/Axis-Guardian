<template>
  <div class="p-8">
    <div class="max-w-2xl mx-auto text-center">
      <div class="mb-8">
        <div class="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
          <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-foreground mb-4">{{ pageTitle }}</h1>
        <p class="text-lg text-muted-foreground mb-8">
          This is a placeholder page. Content for this section will be implemented soon.
        </p>
      </div>

      <div class="bg-accent/10 border border-accent rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-accent-foreground mb-2">Current Route</h2>
        <code class="text-sm bg-card px-3 py-2 rounded border border-border text-accent-foreground">{{ $route.path }}</code>
      </div>

      <div class="text-sm text-muted-foreground">
        <p>Route: {{ $route.name || 'Unknown' }}</p>
        <p>Path: {{ $route.path }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title || route.name || 'Page'
})
</script>