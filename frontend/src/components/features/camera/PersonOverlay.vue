<template>
  <div
    class="person-overlay"
    :style="{
      transform: `translate(${currentX}px, ${currentY}px) scale(${overlay.scale})`,
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: 10,
      pointerEvents: 'none',
      transition: 'none'
    }"
  >
    <img
      :src="overlay.svgPath"
      alt="Person"
      :style="{
        height: '100px',
        width: 'auto',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { PersonOverlay } from '@/composables/useCameraOverlays'

const props = defineProps<{
  overlay: PersonOverlay
  containerWidth: number
  containerHeight: number
}>()

const currentX = ref(0)
const currentY = ref(0)
let animationFrameId: number | null = null

// Calculate position based on percentage
const calculatePosition = () => {
  const elapsed = Date.now() - props.overlay.startTime
  const progress = (elapsed / 1000) * props.overlay.speed // pixels moved

  if (props.overlay.direction === 'left-to-right') {
    currentX.value = (props.overlay.x / 100) * props.containerWidth + progress
  } else {
    currentX.value = (props.overlay.x / 100) * props.containerWidth - progress
  }

  currentY.value = (props.overlay.y / 100) * props.containerHeight
}

const animate = () => {
  calculatePosition()
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  calculatePosition()
  animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.person-overlay {
  will-change: transform;
}
</style>
