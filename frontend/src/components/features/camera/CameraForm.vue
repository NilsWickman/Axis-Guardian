<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="font-bold text-sm">{{ title }}</h2>
        <button @click="emit('close')" class="p-1 hover:bg-accent rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <form @submit.prevent="emit('submit', formData)" class="p-4 space-y-4">
        <!-- Camera Name -->
        <div>
          <label class="block text-xs font-medium mb-1">Camera Name *</label>
          <input
            v-model="formData.name"
            type="text"
            required
            placeholder="e.g., Front Entrance"
            class="w-full px-3 py-2 text-xs border rounded bg-background"
          />
        </div>

        <!-- IP Address -->
        <div>
          <label class="block text-xs font-medium mb-1">IP Address / Hostname *</label>
          <input
            v-model="formData.ipAddress"
            type="text"
            required
            placeholder="192.168.1.100 or camera.local"
            class="w-full px-3 py-2 text-xs border rounded bg-background"
          />
        </div>

        <!-- Port -->
        <div>
          <label class="block text-xs font-medium mb-1">HTTP Port</label>
          <input
            v-model="formData.port"
            type="number"
            min="1"
            max="65535"
            placeholder="80"
            class="w-full px-3 py-2 text-xs border rounded bg-background"
          />
        </div>

        <!-- RTSP Configuration -->
        <div class="space-y-3 border-t pt-3">
          <h3 class="text-xs font-semibold">RTSP Configuration</h3>
          <div>
            <label class="block text-xs font-medium mb-1">RTSP Port</label>
            <input
              v-model="formData.rtspPort"
              type="number"
              min="1"
              max="65535"
              placeholder="554"
              class="w-full px-3 py-2 text-xs border rounded bg-background"
            />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Stream Path</label>
            <input
              v-model="formData.streamPath"
              type="text"
              placeholder="/axis-media/media.amp"
              class="w-full px-3 py-2 text-xs border rounded bg-background"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex space-x-2 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            {{ submitText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open: boolean
  initialData?: {
    name: string
    ipAddress: string
    port: number
    rtspPort: number
    streamPath: string
  }
  title?: string
  submitText?: string
}>(), {
  title: 'Add Camera',
  submitText: 'Add Camera'
})

const emit = defineEmits<{
  close: []
  submit: [data: typeof formData]
}>()

const formData = reactive({
  name: '',
  ipAddress: '',
  port: 80,
  rtspPort: 554,
  streamPath: '/axis-media/media.amp'
})

watch(() => props.initialData, (data) => {
  if (data) {
    Object.assign(formData, data)
  } else {
    // Reset form
    formData.name = ''
    formData.ipAddress = ''
    formData.port = 80
    formData.rtspPort = 554
    formData.streamPath = '/axis-media/media.amp'
  }
}, { immediate: true })
</script>
