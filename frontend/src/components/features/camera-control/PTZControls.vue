<template>
  <div class="ptz-controls space-y-4">
    <!-- Directional Controls -->
    <div class="text-center">
      <div class="inline-grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg">
        <!-- Top row -->
        <div></div>
        <Button
          @mousedown="startPTZ('tilt', 1)"
          @mouseup="stopPTZ"
          @mouseleave="stopPTZ"
          variant="outline"
          size="sm"
          class="h-12 w-12"
        >
          <ChevronUp class="w-4 h-4" />
        </Button>
        <div></div>

        <!-- Middle row -->
        <Button
          @mousedown="startPTZ('pan', -1)"
          @mouseup="stopPTZ"
          @mouseleave="stopPTZ"
          variant="outline"
          size="sm"
          class="h-12 w-12"
        >
          <ChevronLeft class="w-4 h-4" />
        </Button>
        <Button
          @click="goHome"
          variant="default"
          size="sm"
          class="h-12 w-12"
        >
          <Home class="w-4 h-4" />
        </Button>
        <Button
          @mousedown="startPTZ('pan', 1)"
          @mouseup="stopPTZ"
          @mouseleave="stopPTZ"
          variant="outline"
          size="sm"
          class="h-12 w-12"
        >
          <ChevronRight class="w-4 h-4" />
        </Button>

        <!-- Bottom row -->
        <div></div>
        <Button
          @mousedown="startPTZ('tilt', -1)"
          @mouseup="stopPTZ"
          @mouseleave="stopPTZ"
          variant="outline"
          size="sm"
          class="h-12 w-12"
        >
          <ChevronDown class="w-4 h-4" />
        </Button>
        <div></div>
      </div>
    </div>

    <!-- Zoom Controls -->
    <div class="flex justify-center space-x-2">
      <Button
        @mousedown="startPTZ('zoom', -1)"
        @mouseup="stopPTZ"
        @mouseleave="stopPTZ"
        variant="outline"
        size="sm"
      >
        <ZoomOut class="w-4 h-4 mr-1" />
        Zoom Out
      </Button>
      <Button
        @mousedown="startPTZ('zoom', 1)"
        @mouseup="stopPTZ"
        @mouseleave="stopPTZ"
        variant="outline"
        size="sm"
      >
        <ZoomIn class="w-4 h-4 mr-1" />
        Zoom In
      </Button>
    </div>

    <!-- Speed Control -->
    <div class="space-y-2">
      <label class="text-sm font-medium">Speed: {{ Math.round(speed * 100) }}%</label>
      <Slider
        v-model="speed"
        :min="0.1"
        :max="1"
        :step="0.1"
        class="w-full"
      />
    </div>

    <!-- Preset Controls -->
    <div class="space-y-2">
      <label class="text-sm font-medium">Presets</label>
      <div class="grid grid-cols-4 gap-2">
        <Button
          v-for="preset in presets"
          :key="preset.id"
          @click="goToPreset(preset.id)"
          variant="outline"
          size="sm"
        >
          {{ preset.name }}
        </Button>
      </div>
    </div>

    <!-- Current Status -->
    <div v-if="currentCommand" class="p-2 bg-accent rounded text-sm">
      <div class="font-medium">Active Command:</div>
      <div class="text-muted-foreground">
        {{ currentCommand.action.toUpperCase() }}
        ({{ currentCommand.value > 0 ? '+' : '' }}{{ currentCommand.value }})
        at {{ Math.round((currentCommand.speed || 0) * 100) }}% speed
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  ZoomIn,
  ZoomOut
} from 'lucide-vue-next'
import type { PTZCommand } from '@/types/generated'
import { CameraApiClient } from '@/api/clients/cameras'

const props = defineProps<{
  cameraId: string
}>()

const emit = defineEmits<{
  'command-sent': [command: string]
}>()

const speed = ref([0.5])
const currentCommand = ref<PTZCommand>()
const ptzInterval = ref<number>()

const presets = [
  { id: '1', name: 'Entrance' },
  { id: '2', name: 'Parking' },
  { id: '3', name: 'Exit' },
  { id: '4', name: 'Overview' }
]

const cameraApi = new CameraApiClient()

const startPTZ = (action: 'pan' | 'tilt' | 'zoom', value: number) => {
  const command: PTZCommand = {
    action,
    value,
    speed: speed.value[0]
  }

  currentCommand.value = command
  sendPTZCommand(command)

  // Continue sending command while mouse is held down
  ptzInterval.value = window.setInterval(() => {
    sendPTZCommand(command)
  }, 100)
}

const stopPTZ = () => {
  if (ptzInterval.value) {
    clearInterval(ptzInterval.value)
    ptzInterval.value = undefined
  }
  currentCommand.value = undefined
}

const sendPTZCommand = async (command: PTZCommand) => {
  try {
    await cameraApi.controlPTZ(props.cameraId, command)
    emit('command-sent', `${command.action}:${command.value}`)
  } catch (error) {
    console.error('PTZ command failed:', error)
  }
}

const goHome = async () => {
  const command: PTZCommand = {
    action: 'home'
  }

  try {
    await cameraApi.controlPTZ(props.cameraId, command)
    emit('command-sent', 'home')
  } catch (error) {
    console.error('Home command failed:', error)
  }
}

const goToPreset = async (presetId: string) => {
  const command: PTZCommand = {
    action: 'preset',
    preset: presetId
  }

  try {
    await cameraApi.controlPTZ(props.cameraId, command)
    emit('command-sent', `preset:${presetId}`)
  } catch (error) {
    console.error('Preset command failed:', error)
  }
}
</script>