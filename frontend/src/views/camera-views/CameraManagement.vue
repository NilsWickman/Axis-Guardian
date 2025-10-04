<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 border-b">
      <h1 class="text-base font-bold text-foreground">Manage Cameras</h1>
      <div class="flex items-center space-x-2">
        <button
          @click="discoverCameras"
          :disabled="isDiscovering"
          class="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          {{ isDiscovering ? 'Discovering...' : 'Discover Network' }}
        </button>
        <button
          @click="showAddDialog = true"
          class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Camera
        </button>
      </div>
    </div>

    <!-- Camera List -->
    <div class="flex-1 overflow-auto p-4">
      <div v-if="cameras.length === 0" class="text-center text-muted-foreground py-12">
        <Cctv class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p class="text-sm">No cameras configured</p>
        <p class="text-xs mt-2">Click "Discover Network" or "Add Camera" to get started</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="camera in cameras"
          :key="camera.id"
          class="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-sm">{{ camera.name }}</h3>
              <p class="text-xs text-muted-foreground">{{ camera.ipAddress }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span
                :class="camera.status === 'online' ? 'bg-status-online' : camera.status === 'offline' ? 'bg-status-offline' : 'bg-status-configuring'"
                class="px-2 py-0.5 rounded text-white text-[10px] uppercase"
              >
                {{ camera.status }}
              </span>
              <button
                @click="editCamera(camera)"
                class="p-1 hover:bg-accent rounded"
                title="Edit"
              >
                <Settings class="w-4 h-4" />
              </button>
              <button
                @click="removeCamera(camera.id)"
                class="p-1 hover:bg-destructive/10 text-destructive rounded"
                title="Remove"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Model:</span>
              <span>{{ camera.model || 'Unknown' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Serial:</span>
              <span class="font-mono">{{ camera.serialNumber || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Firmware:</span>
              <span>{{ camera.firmwareVersion || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Stream URL:</span>
              <span class="font-mono truncate">{{ camera.rtspUrl }}</span>
            </div>
          </div>

          <div class="mt-3 flex space-x-2">
            <button
              @click="testConnection(camera)"
              :disabled="testingCamera === camera.id"
              class="flex-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {{ testingCamera === camera.id ? 'Testing...' : 'Test Connection' }}
            </button>
            <button
              @click="viewLive(camera)"
              class="flex-1 px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
            >
              View Live
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Camera Dialog -->
    <div
      v-if="showAddDialog || editingCamera"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="font-bold text-sm">{{ editingCamera ? 'Edit Camera' : 'Add Camera' }}</h2>
          <button @click="closeDialog" class="p-1 hover:bg-accent rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="saveCamera" class="p-4 space-y-4">
          <!-- Camera Name -->
          <div>
            <label class="block text-xs font-medium mb-1">Camera Name *</label>
            <input
              v-model="cameraForm.name"
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
              v-model="cameraForm.ipAddress"
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
              v-model="cameraForm.port"
              type="number"
              min="1"
              max="65535"
              placeholder="80"
              class="w-full px-3 py-2 text-xs border rounded bg-background"
            />
          </div>

          <!-- Authentication -->
          <div class="pt-2 border-t">
            <h3 class="text-xs font-semibold mb-2">Authentication</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium mb-1">Username *</label>
                <input
                  v-model="cameraForm.username"
                  type="text"
                  required
                  placeholder="root"
                  autocomplete="username"
                  class="w-full px-3 py-2 text-xs border rounded bg-background"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Password *</label>
                <input
                  v-model="cameraForm.password"
                  type="password"
                  required
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full px-3 py-2 text-xs border rounded bg-background"
                />
              </div>
            </div>
          </div>

          <!-- RTSP Configuration -->
          <div class="pt-2 border-t">
            <h3 class="text-xs font-semibold mb-2">Stream Configuration</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium mb-1">RTSP Port</label>
                <input
                  v-model="cameraForm.rtspPort"
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
                  v-model="cameraForm.streamPath"
                  type="text"
                  placeholder="/axis-media/media.amp"
                  class="w-full px-3 py-2 text-xs border rounded bg-background"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-2 pt-2">
            <button
              type="button"
              @click="closeDialog"
              class="flex-1 px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              {{ editingCamera ? 'Save Changes' : 'Add Camera' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Cctv, Settings, Trash2, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

interface ManagedCamera {
  id: string
  name: string
  ipAddress: string
  port: number
  username: string
  password: string
  rtspPort: number
  streamPath: string
  status: 'online' | 'offline' | 'configuring'
  model?: string
  serialNumber?: string
  firmwareVersion?: string
  rtspUrl: string
}

const router = useRouter()
const toast = useToast()

const cameras = ref<ManagedCamera[]>([
  {
    id: 'cam-demo-1',
    name: 'Demo Camera 1',
    ipAddress: '192.168.1.100',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'online',
    model: 'AXIS P1375',
    serialNumber: 'ACCC8E123456',
    firmwareVersion: '11.4.63',
    rtspUrl: 'rtsp://192.168.1.100:554/axis-media/media.amp',
  },
])

const isDiscovering = ref(false)
const showAddDialog = ref(false)
const editingCamera = ref<ManagedCamera | null>(null)
const testingCamera = ref<string | null>(null)

const cameraForm = ref({
  name: '',
  ipAddress: '',
  port: 80,
  username: 'root',
  password: '',
  rtspPort: 554,
  streamPath: '/axis-media/media.amp',
})

const discoverCameras = async () => {
  isDiscovering.value = true

  // Simulate network discovery using mDNS-SD
  // In real implementation, this would call the VAPIX mdnssd.cgi API
  // with service type "_axis-video._tcp" to discover Axis cameras
  setTimeout(() => {
    const discovered: ManagedCamera[] = [
      {
        id: 'discovered-' + Date.now(),
        name: 'Discovered Camera',
        ipAddress: '192.168.1.101',
        port: 80,
        username: '',
        password: '',
        rtspPort: 554,
        streamPath: '/axis-media/media.amp',
        status: 'configuring',
        model: 'AXIS M3068-P',
        serialNumber: 'ACCC8E789012',
        rtspUrl: 'rtsp://192.168.1.101:554/axis-media/media.amp',
      },
    ]

    // Add discovered cameras that aren't already in the list
    discovered.forEach(cam => {
      if (!cameras.value.find(c => c.ipAddress === cam.ipAddress)) {
        cameras.value.push(cam)
      }
    })

    isDiscovering.value = false
    if (discovered.length > 0) {
      toast.success(`Network scan complete. Found ${discovered.length} new camera(s)`)
    } else {
      toast.info('Network scan complete. No new cameras found')
    }
  }, 2000)
}

const editCamera = (camera: ManagedCamera) => {
  editingCamera.value = camera
  cameraForm.value = {
    name: camera.name,
    ipAddress: camera.ipAddress,
    port: camera.port,
    username: camera.username,
    password: camera.password,
    rtspPort: camera.rtspPort,
    streamPath: camera.streamPath,
  }
}

const closeDialog = () => {
  showAddDialog.value = false
  editingCamera.value = null
  cameraForm.value = {
    name: '',
    ipAddress: '',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
  }
}

const saveCamera = () => {
  if (editingCamera.value) {
    // Update existing camera
    const index = cameras.value.findIndex(c => c.id === editingCamera.value!.id)
    if (index !== -1) {
      cameras.value[index] = {
        ...cameras.value[index],
        name: cameraForm.value.name,
        ipAddress: cameraForm.value.ipAddress,
        port: cameraForm.value.port,
        username: cameraForm.value.username,
        password: cameraForm.value.password,
        rtspPort: cameraForm.value.rtspPort,
        streamPath: cameraForm.value.streamPath,
        rtspUrl: `rtsp://${cameraForm.value.ipAddress}:${cameraForm.value.rtspPort}${cameraForm.value.streamPath}`,
      }
      toast.success(`Camera "${cameraForm.value.name}" updated successfully`)
    }
  } else {
    // Add new camera
    const newCamera: ManagedCamera = {
      id: 'cam-' + Date.now(),
      name: cameraForm.value.name,
      ipAddress: cameraForm.value.ipAddress,
      port: cameraForm.value.port,
      username: cameraForm.value.username,
      password: cameraForm.value.password,
      rtspPort: cameraForm.value.rtspPort,
      streamPath: cameraForm.value.streamPath,
      status: 'configuring',
      rtspUrl: `rtsp://${cameraForm.value.ipAddress}:${cameraForm.value.rtspPort}${cameraForm.value.streamPath}`,
    }
    cameras.value.push(newCamera)
    toast.success(`Camera "${cameraForm.value.name}" added successfully`)

    // Simulate device info retrieval
    setTimeout(() => {
      testConnection(newCamera)
    }, 500)
  }

  closeDialog()
}

const testConnection = async (camera: ManagedCamera) => {
  testingCamera.value = camera.id

  // Simulate connection test
  // In real implementation, this would:
  // 1. Test HTTP connection to http://{ip}:{port}
  // 2. Authenticate using Basic Auth with username/password
  // 3. Call /axis-cgi/basicdeviceinfo.cgi to get device information
  // 4. Test RTSP stream connectivity

  setTimeout(() => {
    const index = cameras.value.findIndex(c => c.id === camera.id)
    if (index !== -1) {
      cameras.value[index].status = Math.random() > 0.2 ? 'online' : 'offline'

      if (cameras.value[index].status === 'online') {
        // Simulate retrieving device info
        cameras.value[index].model = 'AXIS ' + ['P1375', 'M3068-P', 'Q6075-E'][Math.floor(Math.random() * 3)]
        cameras.value[index].serialNumber = 'ACCC8E' + Math.random().toString().slice(2, 8)
        cameras.value[index].firmwareVersion = '11.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 100)
      }
    }

    testingCamera.value = null
    if (cameras.value[index].status === 'online') {
      toast.success('Connection successful!')
    } else {
      toast.error('Connection failed. Please check credentials and network settings.')
    }
  }, 1500)
}

const removeCamera = (id: string) => {
  if (confirm('Are you sure you want to remove this camera?')) {
    const camera = cameras.value.find(c => c.id === id)
    cameras.value = cameras.value.filter(c => c.id !== id)
    if (camera) {
      toast.info(`Camera "${camera.name}" removed`)
    }
  }
}

const viewLive = (camera: ManagedCamera) => {
  // Navigate to camera view with this camera selected
  router.push('/cameras/focus')
}
</script>
