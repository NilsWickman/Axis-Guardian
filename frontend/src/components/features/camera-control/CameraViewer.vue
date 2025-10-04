<template>
  <div class="camera-viewer space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-foreground">Camera Control</h2>
      <div class="flex items-center space-x-2">
        <Badge :variant="camera?.status === 'online' ? 'default' : 'destructive'">
          {{ camera?.status || 'Unknown' }}
        </Badge>
        <Button @click="refreshCamera" size="sm" variant="outline">
          <RefreshCw class="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>
    </div>

    <div v-if="!cameraId" class="text-center p-8 text-muted-foreground">
      <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
        <Camera class="w-8 h-8" />
      </div>
      Select a camera to view controls
    </div>

    <div v-else-if="loading" class="text-center p-8">
      <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center animate-pulse">
        <Camera class="w-8 h-8" />
      </div>
      Loading camera...
    </div>

    <div v-else-if="camera" class="space-y-6">
      <!-- Camera Info -->
      <Card>
        <CardHeader>
          <CardTitle>{{ camera.name }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Camera ID:</span>
              <span class="ml-1 font-mono">{{ camera.id }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Status:</span>
              <Badge class="ml-1" :variant="camera.status === 'online' ? 'default' : 'destructive'">
                {{ camera.status }}
              </Badge>
            </div>
            <div v-if="camera.capabilities?.resolution">
              <span class="text-muted-foreground">Resolution:</span>
              <span class="ml-1">{{ camera.capabilities.resolution }}</span>
            </div>
            <div v-if="camera.capabilities?.fps">
              <span class="text-muted-foreground">FPS:</span>
              <span class="ml-1">{{ camera.capabilities.fps }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Stream Control -->
      <Card>
        <CardHeader>
          <CardTitle>Stream Control</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Quality</label>
              <Select v-model="streamSettings.quality">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-medium">Protocol</label>
              <Select v-model="streamSettings.protocol">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtsp">RTSP</SelectItem>
                  <SelectItem value="hls">HLS</SelectItem>
                  <SelectItem value="webrtc">WebRTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <input
              id="analytics"
              type="checkbox"
              v-model="streamSettings.analytics"
              class="rounded"
            />
            <label for="analytics" class="text-sm">Enable Analytics</label>
          </div>

          <div class="space-x-2">
            <Button @click="startStream" :disabled="isStreaming || streamLoading">
              {{ streamLoading ? 'Starting...' : 'Start Stream' }}
            </Button>
            <Button @click="stopStream" variant="outline" :disabled="!isStreaming">
              Stop Stream
            </Button>
            <Button @click="takeSnapshot" variant="outline">
              <Camera class="w-4 h-4 mr-1" />
              Snapshot
            </Button>
          </div>

          <div v-if="streamUrl" class="mt-4 p-4 bg-muted rounded">
            <div class="text-sm font-medium mb-2">Stream URL:</div>
            <div class="font-mono text-xs break-all">{{ streamUrl }}</div>
          </div>
        </CardContent>
      </Card>

      <!-- PTZ Controls -->
      <Card v-if="camera.capabilities?.ptz">
        <CardHeader>
          <CardTitle>PTZ Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <PTZControls :camera-id="camera.id" @command-sent="handlePTZCommand" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, RefreshCw } from 'lucide-vue-next'
import PTZControls from './PTZControls.vue'
import type { Camera as CameraType, StreamRequest, StreamResponse } from '@/types/generated'
import { CameraApiClient } from '@/api/clients/cameras'

const props = defineProps<{
  cameraId?: string
}>()

const emit = defineEmits<{
  'stream-started': [streamResponse: StreamResponse]
  'snapshot-taken': [blob: Blob]
}>()

const camera = ref<CameraType>()
const loading = ref(false)
const isStreaming = ref(false)
const streamLoading = ref(false)
const streamUrl = ref<string>()

const streamSettings = ref<StreamRequest>({
  quality: 'medium',
  protocol: 'webrtc',
  analytics: false
})

const cameraApi = new CameraApiClient()

const loadCamera = async () => {
  if (!props.cameraId) return

  loading.value = true
  try {
    camera.value = await cameraApi.getCamera(props.cameraId)
  } catch (error) {
    console.error('Failed to load camera:', error)
  } finally {
    loading.value = false
  }
}

const refreshCamera = () => {
  loadCamera()
}

const startStream = async () => {
  if (!props.cameraId) return

  streamLoading.value = true
  try {
    const response = await cameraApi.startStream(props.cameraId, streamSettings.value)
    streamUrl.value = response.url
    isStreaming.value = true
    emit('stream-started', response)
  } catch (error) {
    console.error('Failed to start stream:', error)
  } finally {
    streamLoading.value = false
  }
}

const stopStream = () => {
  isStreaming.value = false
  streamUrl.value = undefined
}

const takeSnapshot = async () => {
  if (!props.cameraId) return

  try {
    const blob = await cameraApi.getSnapshot(props.cameraId)
    emit('snapshot-taken', blob)

    // Show snapshot in new window for demo
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Failed to take snapshot:', error)
  }
}

const handlePTZCommand = (command: string) => {
  console.log('PTZ command sent:', command)
}

watch(() => props.cameraId, loadCamera, { immediate: true })

onMounted(() => {
  if (props.cameraId) {
    loadCamera()
  }
})
</script>