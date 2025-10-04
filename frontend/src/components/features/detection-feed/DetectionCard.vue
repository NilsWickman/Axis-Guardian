<template>
  <Card class="detection-card">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Badge :variant="getTypeVariant(detection.type)">
            {{ detection.type.toUpperCase() }}
          </Badge>
          <Badge variant="outline">
            {{ formatConfidence(detection.confidence) }}
          </Badge>
        </div>
        <div class="text-sm text-muted-foreground">
          {{ formatTimestamp(detection.timestamp) }}
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-3">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">Camera:</span>
          <span class="ml-1 font-medium">{{ detection.cameraId }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Detection ID:</span>
          <span class="ml-1 font-mono text-xs">{{ detection.id.slice(0, 8) }}...</span>
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-sm text-muted-foreground">Bounding Box:</div>
        <div class="grid grid-cols-4 gap-2 text-xs">
          <div class="bg-muted p-2 rounded">
            <div class="text-muted-foreground">X</div>
            <div class="font-mono">{{ Math.round(detection.bbox.x) }}</div>
          </div>
          <div class="bg-muted p-2 rounded">
            <div class="text-muted-foreground">Y</div>
            <div class="font-mono">{{ Math.round(detection.bbox.y) }}</div>
          </div>
          <div class="bg-muted p-2 rounded">
            <div class="text-muted-foreground">W</div>
            <div class="font-mono">{{ Math.round(detection.bbox.width) }}</div>
          </div>
          <div class="bg-muted p-2 rounded">
            <div class="text-muted-foreground">H</div>
            <div class="font-mono">{{ Math.round(detection.bbox.height) }}</div>
          </div>
        </div>
      </div>

      <div v-if="detection.attributes" class="space-y-2">
        <div class="text-sm text-muted-foreground">Attributes:</div>
        <div class="text-xs space-y-1">
          <div
            v-for="(value, key) in detection.attributes"
            :key="key"
            class="flex justify-between"
          >
            <span class="text-muted-foreground">{{ key }}:</span>
            <span class="font-mono">{{ value }}</span>
          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter class="pt-3 space-x-2">
      <Button @click="viewCamera" size="sm" variant="outline">
        <Camera class="w-4 h-4 mr-1" />
        View Camera
      </Button>
      <Button
        @click="createAlarm"
        size="sm"
        variant="destructive"
        v-if="isHighConfidence"
      >
        <AlertTriangle class="w-4 h-4 mr-1" />
        Create Alarm
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, AlertTriangle } from 'lucide-vue-next'
import type { Detection } from '@/types/generated'

const props = defineProps<{
  detection: Detection
}>()

const emit = defineEmits<{
  'view-camera': [cameraId: string]
  'create-alarm': [detection: Detection]
}>()

const isHighConfidence = computed(() => props.detection.confidence >= 0.8)

const getTypeVariant = (type: string) => {
  switch (type) {
    case 'person': return 'default'
    case 'vehicle': return 'secondary'
    case 'animal': return 'outline'
    default: return 'destructive'
  }
}

const formatConfidence = (confidence: number) => {
  return `${Math.round(confidence * 100)}%`
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const viewCamera = () => {
  emit('view-camera', props.detection.cameraId)
}

const createAlarm = () => {
  emit('create-alarm', props.detection)
}
</script>