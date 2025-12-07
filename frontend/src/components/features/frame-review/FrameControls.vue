<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  currentFrame: number
  totalFrames: number
  fps: number
  timestamp: number
}>()

const emit = defineEmits<{
  (e: 'seek', frame: number): void
}>()

// Convert frame to formatted time string
const formattedTime = computed(() => {
  const seconds = props.timestamp
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2)
  return `${mins}:${secs.padStart(5, '0')}`
})

// Slider value needs to be an array for shadcn slider
const sliderValue = computed(() => [props.currentFrame])

function previousFrame(): void {
  const newFrame = Math.max(0, props.currentFrame - 1)
  emit('seek', newFrame)
}

function nextFrame(): void {
  const newFrame = Math.min(props.totalFrames - 1, props.currentFrame + 1)
  emit('seek', newFrame)
}

function skipBackward(frames: number = 10): void {
  const newFrame = Math.max(0, props.currentFrame - frames)
  emit('seek', newFrame)
}

function skipForward(frames: number = 10): void {
  const newFrame = Math.min(props.totalFrames - 1, props.currentFrame + frames)
  emit('seek', newFrame)
}

function goToFirst(): void {
  emit('seek', 0)
}

function goToLast(): void {
  emit('seek', props.totalFrames - 1)
}

function onSliderChange(value: number[]): void {
  if (value.length > 0) {
    emit('seek', value[0])
  }
}

function onFrameInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const frame = parseInt(target.value, 10)
  if (!isNaN(frame) && frame >= 0 && frame < props.totalFrames) {
    emit('seek', frame)
  }
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent): void {
  // Ignore if focus is on an input
  if ((event.target as HTMLElement)?.tagName === 'INPUT') return

  switch (event.key) {
    case 'ArrowLeft':
      if (event.shiftKey) {
        skipBackward(10)
      } else {
        previousFrame()
      }
      event.preventDefault()
      break
    case 'ArrowRight':
      if (event.shiftKey) {
        skipForward(10)
      } else {
        nextFrame()
      }
      event.preventDefault()
      break
    case 'Home':
      goToFirst()
      event.preventDefault()
      break
    case 'End':
      goToLast()
      event.preventDefault()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="space-y-3">
    <!-- Slider -->
    <Slider
      :model-value="sliderValue"
      :min="0"
      :max="Math.max(0, totalFrames - 1)"
      :step="1"
      class="w-full"
      @update:model-value="onSliderChange"
    />

    <!-- Controls Row -->
    <div class="flex items-center justify-between gap-4">
      <!-- Navigation Buttons -->
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame === 0"
          title="First frame (Home)"
          @click="goToFirst"
        >
          ⏮
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame < 10"
          title="Back 10 frames (Shift+←)"
          @click="skipBackward(10)"
        >
          ⏪
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame === 0"
          title="Previous frame (←)"
          @click="previousFrame"
        >
          ◀
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame >= totalFrames - 1"
          title="Next frame (→)"
          @click="nextFrame"
        >
          ▶
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame >= totalFrames - 11"
          title="Forward 10 frames (Shift+→)"
          @click="skipForward(10)"
        >
          ⏩
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentFrame >= totalFrames - 1"
          title="Last frame (End)"
          @click="goToLast"
        >
          ⏭
        </Button>
      </div>

      <!-- Frame Info -->
      <div class="flex items-center gap-3 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <span>Frame:</span>
          <Input
            type="number"
            :value="currentFrame"
            :min="0"
            :max="totalFrames - 1"
            class="w-20 h-7 text-center"
            @change="onFrameInput"
          />
          <span>/ {{ totalFrames - 1 }}</span>
        </div>
        <div class="text-muted-foreground">
          {{ formattedTime }}
        </div>
        <div class="text-xs text-muted-foreground/60">
          {{ fps.toFixed(2) }} fps
        </div>
      </div>
    </div>

    <!-- Keyboard Hints -->
    <div class="text-xs text-muted-foreground/50 text-center">
      ← → Step frames | Shift+← → Skip 10 | Home/End Jump to start/end
    </div>
  </div>
</template>
