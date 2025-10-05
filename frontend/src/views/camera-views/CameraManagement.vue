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

    <!-- Search and Filters -->
    <div class="border-b bg-card p-3 space-y-3">
      <CameraSearchBar
        v-model="searchQuery"
        placeholder="Search by name, IP address, serial number, or model..."
        :show-clear="hasActiveFilters"
        @clear="clearFilters"
      />

      <CameraFilters
        v-model:status-filter="statusFilter"
        v-model:model-filter="modelFilter"
        v-model:sort-by="sortBy"
        :total-count="cameras.length"
        :filtered-count="filteredAndSortedCameras.length"
        :status-counts="statusCounts"
        :available-models="availableModels"
        :sort-options="[
          { value: 'name', label: 'Sort: Name' },
          { value: 'ip', label: 'Sort: IP Address' },
          { value: 'status', label: 'Sort: Status' },
          { value: 'model', label: 'Sort: Model' }
        ]"
      />
    </div>

    <!-- Camera List -->
    <div class="flex-1 overflow-auto p-4">
      <!-- No cameras at all -->
      <EmptyState
        v-if="cameras.length === 0"
        :icon-component="Cctv"
        icon-class="w-16 h-16 mx-auto mb-4 opacity-50"
        title="No cameras configured"
        description="Click 'Discover Network' or 'Add Camera' to get started"
      />

      <!-- No results from filters -->
      <EmptyState
        v-else-if="filteredAndSortedCameras.length === 0"
        title="No cameras match your filters"
        description="Try adjusting your search or filter criteria"
        :action-text="hasActiveFilters ? 'Clear All Filters' : undefined"
        :action-handler="hasActiveFilters ? clearFilters : undefined"
      >
        <template #actions>
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </template>
      </EmptyState>

      <!-- Camera Grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <CameraCard
          v-for="camera in filteredAndSortedCameras"
          :key="camera.id"
          :camera="camera"
        >
          <template #actions="{ camera }">
            <button
              @click="testConnection(camera)"
              :disabled="testingCamera === camera.id"
              class="p-0.5 hover:bg-accent rounded disabled:opacity-50"
              :title="testingCamera === camera.id ? 'Testing...' : 'Test Connection'"
            >
              <Activity class="w-3.5 h-3.5" />
            </button>
            <button
              @click="viewLive(camera)"
              class="p-0.5 hover:bg-accent rounded"
              title="View Live Feed"
            >
              <Play class="w-3.5 h-3.5" />
            </button>
            <button
              @click="editCamera(camera)"
              class="p-0.5 hover:bg-accent rounded"
              title="Edit Camera"
            >
              <Settings class="w-3.5 h-3.5" />
            </button>
            <button
              @click="confirmRemoveCamera(camera)"
              class="p-0.5 hover:bg-destructive/10 text-destructive rounded"
              title="Remove Camera"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </template>
        </CameraCard>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="Remove Camera"
      :message="`Are you sure you want to remove <strong>${cameraToDelete?.name}</strong>?`"
      description="This action cannot be undone. The camera will be removed from the system."
      confirm-text="Remove Camera"
      cancel-text="Cancel"
      variant="destructive"
      @confirm="executeRemoveCamera"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Add/Edit Camera Dialog -->
    <CameraForm
      :open="showAddDialog || !!editingCamera"
      :initial-data="editingCamera ? cameraForm : undefined"
      :title="editingCamera ? 'Edit Camera' : 'Add Camera'"
      :submit-text="editingCamera ? 'Save Changes' : 'Add Camera'"
      @close="closeDialog"
      @submit="saveCamera"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Cctv, Settings, Trash2, Play, Activity } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import CameraSearchBar from '@/components/features/camera/CameraSearchBar.vue'
import CameraFilters from '@/components/features/camera/CameraFilters.vue'
import CameraCard from '@/components/features/camera/CameraCard.vue'
import CameraForm from '@/components/features/camera/CameraForm.vue'
import EmptyState from '@/components/layout/EmptyState.vue'
import ConfirmDialog from '@/components/layout/ConfirmDialog.vue'

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
    name: 'Front Entrance Camera',
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
  {
    id: 'cam-demo-2',
    name: 'Warehouse Camera A',
    ipAddress: '192.168.1.101',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'online',
    model: 'AXIS M3068-P',
    serialNumber: 'ACCC8E234567',
    firmwareVersion: '11.5.12',
    rtspUrl: 'rtsp://192.168.1.101:554/axis-media/media.amp',
  },
  {
    id: 'cam-demo-3',
    name: 'Back Entrance',
    ipAddress: '192.168.1.102',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'offline',
    model: 'AXIS Q6075-E',
    serialNumber: 'ACCC8E345678',
    firmwareVersion: '11.3.45',
    rtspUrl: 'rtsp://192.168.1.102:554/axis-media/media.amp',
  },
  {
    id: 'cam-demo-4',
    name: 'Parking Lot Camera 1',
    ipAddress: '192.168.1.103',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'online',
    model: 'AXIS P1375',
    serialNumber: 'ACCC8E456789',
    firmwareVersion: '11.4.63',
    rtspUrl: 'rtsp://192.168.1.103:554/axis-media/media.amp',
  },
  {
    id: 'cam-demo-5',
    name: 'Warehouse Camera B',
    ipAddress: '192.168.1.104',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'configuring',
    model: 'AXIS M3068-P',
    serialNumber: 'ACCC8E567890',
    rtspUrl: 'rtsp://192.168.1.104:554/axis-media/media.amp',
  },
  {
    id: 'cam-demo-6',
    name: 'Loading Dock',
    ipAddress: '192.168.1.105',
    port: 80,
    username: 'root',
    password: '',
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
    status: 'online',
    model: 'AXIS Q6075-E',
    serialNumber: 'ACCC8E678901',
    firmwareVersion: '11.3.45',
    rtspUrl: 'rtsp://192.168.1.105:554/axis-media/media.amp',
  },
])

const isDiscovering = ref(false)
const showAddDialog = ref(false)
const editingCamera = ref<ManagedCamera | null>(null)
const testingCamera = ref<string | null>(null)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const cameraToDelete = ref<ManagedCamera | null>(null)
const lastDeletionTime = ref<number | null>(null)

// Search and filter state
const searchQuery = ref('')
const statusFilter = ref<'all' | 'online' | 'offline' | 'configuring'>('all')
const modelFilter = ref('all')
const sortBy = ref<'name' | 'ip' | 'status' | 'model'>('name')

const cameraForm = ref({
  name: '',
  ipAddress: '',
  port: 80,
  rtspPort: 554,
  streamPath: '/axis-media/media.amp',
})

// Computed - Status counts
const statusCounts = computed(() => ({
  online: cameras.value.filter(c => c.status === 'online').length,
  offline: cameras.value.filter(c => c.status === 'offline').length,
  configuring: cameras.value.filter(c => c.status === 'configuring').length,
}))

// Computed - Available models for filter dropdown
const availableModels = computed(() => {
  const models = new Set<string>()
  cameras.value.forEach(camera => {
    if (camera.model) {
      models.add(camera.model)
    }
  })
  return Array.from(models).sort()
})

// Computed - Has active filters
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || statusFilter.value !== 'all' || modelFilter.value !== 'all'
})

// Computed - Filtered and sorted cameras
const filteredAndSortedCameras = computed(() => {
  let filtered = cameras.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(camera =>
      camera.name.toLowerCase().includes(query) ||
      camera.ipAddress.toLowerCase().includes(query) ||
      camera.model?.toLowerCase().includes(query) ||
      camera.serialNumber?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(camera => camera.status === statusFilter.value)
  }

  // Apply model filter
  if (modelFilter.value !== 'all') {
    filtered = filtered.filter(camera => camera.model === modelFilter.value)
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'ip':
        return a.ipAddress.localeCompare(b.ipAddress)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'model':
        return (a.model || '').localeCompare(b.model || '')
      default:
        return 0
    }
  })

  return sorted
})

// Filter actions
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  modelFilter.value = 'all'
}

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
    rtspPort: 554,
    streamPath: '/axis-media/media.amp',
  }
}

const saveCamera = (data: typeof cameraForm.value) => {
  if (editingCamera.value) {
    // Update existing camera
    const index = cameras.value.findIndex(c => c.id === editingCamera.value!.id)
    if (index !== -1) {
      cameras.value[index] = {
        ...cameras.value[index],
        name: data.name,
        ipAddress: data.ipAddress,
        port: data.port,
        rtspPort: data.rtspPort,
        streamPath: data.streamPath,
        rtspUrl: `rtsp://${data.ipAddress}:${data.rtspPort}${data.streamPath}`,
      }
      toast.success(`Camera "${data.name}" updated successfully`)
    }
  } else {
    // Add new camera
    const newCamera: ManagedCamera = {
      id: 'cam-' + Date.now(),
      name: data.name,
      ipAddress: data.ipAddress,
      port: data.port,
      username: '',
      password: '',
      rtspPort: data.rtspPort,
      streamPath: data.streamPath,
      status: 'configuring',
      rtspUrl: `rtsp://${data.ipAddress}:${data.rtspPort}${data.streamPath}`,
    }
    cameras.value.push(newCamera)
    toast.success(`Camera "${data.name}" added successfully`)

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

const confirmRemoveCamera = (camera: ManagedCamera) => {
  const now = Date.now()
  const oneMinute = 60 * 1000

  // If deleted within the last minute, skip confirmation
  if (lastDeletionTime.value && (now - lastDeletionTime.value) < oneMinute) {
    cameraToDelete.value = camera
    executeRemoveCamera()
  } else {
    // Show confirmation modal
    cameraToDelete.value = camera
    showDeleteConfirm.value = true
  }
}

const executeRemoveCamera = () => {
  if (!cameraToDelete.value) return

  const camera = cameraToDelete.value
  cameras.value = cameras.value.filter(c => c.id !== camera.id)

  // Update last deletion time
  lastDeletionTime.value = Date.now()

  toast.info(`Camera "${camera.name}" removed`)

  // Reset state
  showDeleteConfirm.value = false
  cameraToDelete.value = null
}

const viewLive = (camera: ManagedCamera) => {
  // Navigate to camera view with this camera selected
  router.push('/cameras/focus')
}
</script>
