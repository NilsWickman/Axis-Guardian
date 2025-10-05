<template>
  <div :class="positionClass" class="pointer-events-none">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
}>(), {
  position: 'bottom-left'
})

const positionClass = computed(() => {
  const baseClass = 'absolute'
  switch (props.position) {
    case 'top-left':
      return `${baseClass} top-4 left-4`
    case 'top-right':
      return `${baseClass} top-4 right-4`
    case 'bottom-left':
      return `${baseClass} bottom-4 left-4`
    case 'bottom-right':
      return `${baseClass} bottom-4 right-4`
    case 'center':
      return `${baseClass} inset-0 flex items-center justify-center`
    default:
      return `${baseClass} bottom-4 left-4`
  }
})
</script>
