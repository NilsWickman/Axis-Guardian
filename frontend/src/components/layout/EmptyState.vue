<template>
  <div class="text-center py-16">
    <div v-if="icon" class="text-3xl mb-3">{{ icon }}</div>
    <component v-else-if="iconComponent" :is="iconComponent" :class="iconClass" />
    <h3 class="text-lg font-medium mb-1">{{ title }}</h3>
    <p class="text-sm text-muted-foreground">{{ description }}</p>
    <slot name="actions">
      <button
        v-if="actionText && actionHandler"
        @click="actionHandler"
        class="mt-4 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: string
  iconComponent?: Component
  iconClass?: string
  title: string
  description: string
  actionText?: string
  actionHandler?: () => void
}>()
</script>
