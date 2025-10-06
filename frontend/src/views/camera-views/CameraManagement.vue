<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-sidebar-border">
      <h1 class="text-base font-bold text-foreground">Manage Cameras</h1>
    </div>

    <!-- Actions and Filters Bar -->
    <div class="border-b border-sidebar-border bg-card p-3">
      <div class="flex items-center gap-3">
        <!-- Left: Action Buttons -->
        <div class="flex-1 flex items-center gap-2">
          <button
            @click="showAddDialog = true"
            class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Add
          </button>
          <button
            @click="discoverCameras"
            :disabled="isDiscovering"
            class="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {{ isDiscovering ? 'Discovering...' : 'Discover' }}
          </button>
          <button
            @click="bulkTestConnection"
            :disabled="isBulkTesting || selectedCameras.length === 0"
            class="py-1.5 bg-secondary text-secondary-foreground text-xs rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 whitespace-nowrap min-w-[4rem]"
            :class="selectedCameras.length > 0 ? 'px-2' : 'px-3'"
          >
            {{ isBulkTesting ? 'Testing...' : selectedCameras.length > 0 ? `Test ${selectedCameras.length}` : 'Test' }}
          </button>
          <button
            @click="bulkDelete"
            :disabled="selectedCameras.length === 0"
            class="py-1.5 bg-destructive text-destructive-foreground text-xs rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 whitespace-nowrap min-w-[4.5rem]"
            :class="selectedCameras.length > 0 ? 'px-2' : 'px-3'"
          >
            {{ selectedCameras.length > 0 ? `Delete ${selectedCameras.length}` : 'Delete' }}
          </button>
        </div>

        <!-- Center: Search Bar -->
        <div class="flex-1 max-w-lg">
          <CameraSearchBar
            v-model="searchQuery"
            placeholder="Search cameras..."
            :show-clear="false"
          />
        </div>

        <!-- Right: Filters -->
        <div class="flex-1 flex justify-end">
          <CameraFilters
            v-model:status-filter="statusFilter"
            v-model:model-filter="modelFilter"
            v-model:sort-by="sortBy"
            :total-count="cameras.length"
            :filtered-count="filteredAndSortedCameras.length"
            :status-counts="statusCounts"
            :available-models="availableModels"
            :show-status-filters="cameras.length > 25"
            :show-model-filter="cameras.length > 25"
            :sort-options="[
              { value: 'name', label: 'Name' },
              { value: 'ip', label: 'IP Address' },
              { value: 'status', label: 'Status' },
              { value: 'model', label: 'Model' }
            ]"
          />
        </div>
      </div>
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
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        <CameraCard
          v-for="camera in filteredAndSortedCameras"
          :key="camera.id"
          :camera="camera"
          selectable
          :is-selected="selectedCameras.includes(camera.id)"
          @toggle-select="toggleCameraSelection"
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
              @click="openFirmwareDialog(camera)"
              class="p-0.5 hover:bg-accent rounded"
              title="Firmware Update"
            >
              <Download class="w-3.5 h-3.5" />
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

    <!-- Network Discovery Dialog -->
    <div
      v-if="discoveryDialogOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDiscoveryDialog"
    >
      <div class="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="font-bold text-sm">Network Camera Discovery</h2>
          <button @click="closeDiscoveryDialog" class="p-1 hover:bg-accent rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 flex-1 overflow-y-auto">
          <div v-if="isDiscovering" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p class="text-sm text-muted-foreground">Scanning network for cameras...</p>
            <p class="text-xs text-muted-foreground mt-2">Found {{ discoveredCameras.length }} camera(s)</p>
          </div>

          <div v-else-if="discoveredCameras.length > 0" class="space-y-2">
            <div class="flex justify-between items-center mb-3">
              <p class="text-sm font-semibold">Found {{ discoveredCameras.length }} camera(s)</p>
              <div class="flex gap-2">
                <button
                  @click="selectAllDiscovered"
                  class="text-xs px-2 py-1 border rounded hover:bg-accent"
                >
                  Select All
                </button>
                <button
                  @click="deselectAllDiscovered"
                  class="text-xs px-2 py-1 border rounded hover:bg-accent"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div
              v-for="camera in discoveredCameras"
              :key="camera.id"
              class="border rounded p-3 hover:bg-accent/5 cursor-pointer"
              :class="{ 'ring-2 ring-primary': selectedDiscoveredCameras.includes(camera.id) }"
              @click="toggleDiscoveredCamera(camera.id)"
            >
              <div class="flex items-start gap-3">
                <input
                  type="checkbox"
                  :checked="selectedDiscoveredCameras.includes(camera.id)"
                  class="mt-0.5 cursor-pointer"
                  @click.stop="toggleDiscoveredCamera(camera.id)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-semibold text-sm">{{ camera.name }}</h3>
                      <p class="text-xs text-muted-foreground">{{ camera.ipAddress }}</p>
                    </div>
                    <span
                      v-if="cameras.find(c => c.ipAddress === camera.ipAddress)"
                      class="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
                    >
                      Already Added
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span class="text-muted-foreground">Model:</span>
                      <span class="ml-1">{{ camera.model }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Serial:</span>
                      <span class="ml-1 font-mono">{{ camera.serialNumber }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Firmware:</span>
                      <span class="ml-1 font-mono">{{ camera.firmwareVersion }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">MAC:</span>
                      <span class="ml-1 font-mono">{{ camera.macAddress }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-muted-foreground">
            <p class="text-sm">No cameras discovered</p>
            <p class="text-xs mt-1">Click "Start Discovery" to scan your network</p>
          </div>
        </div>

        <div class="p-4 border-t flex justify-between">
          <button
            @click="closeDiscoveryDialog"
            class="px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <div class="flex gap-2">
            <button
              v-if="!isDiscovering"
              @click="startDiscovery"
              class="px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
            >
              {{ discoveredCameras.length > 0 ? 'Scan Again' : 'Start Discovery' }}
            </button>
            <button
              v-if="selectedDiscoveredCameras.length > 0"
              @click="addDiscoveredCameras"
              class="px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Add {{ selectedDiscoveredCameras.length }} Camera(s)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Firmware Update Dialog -->
    <div
      v-if="firmwareDialogOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeFirmwareDialog"
    >
      <div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="font-bold text-sm">Firmware Management</h2>
          <button @click="closeFirmwareDialog" class="p-1 hover:bg-accent rounded">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 space-y-4">
          <div v-if="selectedFirmwareCamera">
            <h3 class="text-sm font-semibold mb-2">{{ selectedFirmwareCamera.name }}</h3>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Current Version:</span>
                <span class="font-mono">{{ selectedFirmwareCamera.firmwareVersion || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Model:</span>
                <span>{{ selectedFirmwareCamera.model || 'Unknown' }}</span>
              </div>
            </div>
          </div>

          <div class="border-t pt-3">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold">Available Updates</h4>
              <button
                @click="checkForUpdates"
                :disabled="isCheckingUpdates"
                class="text-xs px-2 py-1 border rounded hover:bg-accent disabled:opacity-50"
              >
                {{ isCheckingUpdates ? 'Checking...' : 'Check for Updates' }}
              </button>
            </div>

            <div v-if="isCheckingUpdates" class="text-xs text-center py-4 text-muted-foreground">
              Checking for firmware updates...
            </div>

            <div v-else-if="availableFirmware" class="space-y-3">
              <div class="p-3 border rounded bg-primary/5">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <div class="font-semibold text-xs">Version {{ availableFirmware.version }}</div>
                    <div class="text-xs text-muted-foreground">{{ availableFirmware.releaseDate }}</div>
                  </div>
                  <span class="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">Latest</span>
                </div>
                <p class="text-xs text-muted-foreground mb-3">{{ availableFirmware.description }}</p>

                <div v-if="isUpdating" class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span>Updating firmware...</span>
                    <span>{{ updateProgress }}%</span>
                  </div>
                  <div class="w-full bg-secondary rounded-full h-2">
                    <div
                      class="bg-primary h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${updateProgress}%` }"
                    ></div>
                  </div>
                </div>

                <button
                  v-else
                  @click="startFirmwareUpdate"
                  class="w-full px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Install Update
                </button>
              </div>

              <div class="text-xs text-muted-foreground">
                <p class="font-semibold mb-1">Release Notes:</p>
                <ul class="list-disc list-inside space-y-0.5">
                  <li v-for="(note, idx) in availableFirmware.releaseNotes" :key="idx">{{ note }}</li>
                </ul>
              </div>
            </div>

            <div v-else class="text-xs text-center py-4 text-muted-foreground">
              {{ hasCheckedUpdates ? 'No updates available' : 'Click "Check for Updates" to scan' }}
            </div>
          </div>
        </div>

        <div class="p-4 border-t flex justify-end">
          <button
            @click="closeFirmwareDialog"
            class="px-3 py-2 text-xs border rounded hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Cctv, Settings, Trash2, Play, Activity, Download, X } from 'lucide-vue-next'
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

// Network discovery state
const discoveryDialogOpen = ref(false)
const discoveredCameras = ref<Array<ManagedCamera & { macAddress: string }>>([])
const selectedDiscoveredCameras = ref<string[]>([])

// Bulk operations state
const selectedCameras = ref<string[]>([])
const isBulkTesting = ref(false)

// Firmware update state
const firmwareDialogOpen = ref(false)
const selectedFirmwareCamera = ref<ManagedCamera | null>(null)
const isCheckingUpdates = ref(false)
const hasCheckedUpdates = ref(false)
const isUpdating = ref(false)
const updateProgress = ref(0)
const availableFirmware = ref<{
  version: string
  releaseDate: string
  description: string
  releaseNotes: string[]
} | null>(null)

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
  username: 'root',
  password: '',
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

// Computed - Results text
const resultsText = computed(() => {
  const plural = cameras.value.length !== 1 ? 's' : ''
  return `Showing ${filteredAndSortedCameras.value.length} of ${cameras.value.length} camera${plural}`
})

// Filter actions
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  modelFilter.value = 'all'
}

const discoverCameras = () => {
  discoveryDialogOpen.value = true
  discoveredCameras.value = []
  selectedDiscoveredCameras.value = []
}

const closeDiscoveryDialog = () => {
  discoveryDialogOpen.value = false
  discoveredCameras.value = []
  selectedDiscoveredCameras.value = []
  isDiscovering.value = false
}

const startDiscovery = async () => {
  isDiscovering.value = true
  discoveredCameras.value = []
  selectedDiscoveredCameras.value = []

  // Simulate network discovery using mDNS-SD/SSDP
  // In real implementation, this would:
  // 1. Use mDNS-SD to discover cameras (_axis-video._tcp)
  // 2. Or use SSDP/UPnP for network scanning
  // 3. Query each discovered device via VAPIX basicdeviceinfo.cgi

  const models = ['AXIS P1375', 'AXIS M3068-P', 'AXIS Q6075-E', 'AXIS M1065-L', 'AXIS P3245-LVE']
  const numToDiscover = Math.floor(Math.random() * 5) + 2 // 2-6 cameras

  for (let i = 0; i < numToDiscover; i++) {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    const baseIp = 192 * 256 * 256 * 256 + 168 * 256 * 256 + 1 * 256
    const lastOctet = 110 + i
    const ipNum = baseIp + lastOctet
    const ipAddress = `192.168.1.${lastOctet}`

    const model = models[Math.floor(Math.random() * models.length)]
    const serialSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()

    discoveredCameras.value.push({
      id: 'discovered-' + Date.now() + '-' + i,
      name: `${model} (${ipAddress})`,
      ipAddress,
      port: 80,
      username: 'root',
      password: '',
      rtspPort: 554,
      streamPath: '/axis-media/media.amp',
      status: 'configuring',
      model,
      serialNumber: `ACCC8E${serialSuffix}`,
      firmwareVersion: `11.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
      macAddress: `00:40:8C:${serialSuffix.substring(0, 2)}:${serialSuffix.substring(2, 4)}:${serialSuffix.substring(4, 6)}`,
      rtspUrl: `rtsp://${ipAddress}:554/axis-media/media.amp`,
    })
  }

  isDiscovering.value = false
  toast.success(`Discovery complete. Found ${discoveredCameras.value.length} camera(s)`)
}

const toggleDiscoveredCamera = (cameraId: string) => {
  const index = selectedDiscoveredCameras.value.indexOf(cameraId)
  if (index > -1) {
    selectedDiscoveredCameras.value.splice(index, 1)
  } else {
    selectedDiscoveredCameras.value.push(cameraId)
  }
}

const selectAllDiscovered = () => {
  selectedDiscoveredCameras.value = discoveredCameras.value
    .filter(cam => !cameras.value.find(c => c.ipAddress === cam.ipAddress))
    .map(cam => cam.id)
}

const deselectAllDiscovered = () => {
  selectedDiscoveredCameras.value = []
}

const addDiscoveredCameras = () => {
  const camerasToAdd = discoveredCameras.value.filter(cam =>
    selectedDiscoveredCameras.value.includes(cam.id) &&
    !cameras.value.find(c => c.ipAddress === cam.ipAddress)
  )

  cameras.value.push(...camerasToAdd)
  toast.success(`Added ${camerasToAdd.length} camera(s)`)

  closeDiscoveryDialog()

  // Test connections for newly added cameras
  camerasToAdd.forEach(cam => {
    setTimeout(() => testConnection(cam), 500)
  })
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
        username: data.username,
        password: data.password,
        rtspPort: data.rtspPort,
        streamPath: data.streamPath,
        rtspUrl: `rtsp://${data.username}:${data.password}@${data.ipAddress}:${data.rtspPort}${data.streamPath}`,
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
      username: data.username,
      password: data.password,
      rtspPort: data.rtspPort,
      streamPath: data.streamPath,
      status: 'configuring',
      rtspUrl: `rtsp://${data.username}:${data.password}@${data.ipAddress}:${data.rtspPort}${data.streamPath}`,
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

// Bulk operations
const toggleCameraSelection = (cameraId: string) => {
  const index = selectedCameras.value.indexOf(cameraId)
  if (index > -1) {
    selectedCameras.value.splice(index, 1)
  } else {
    selectedCameras.value.push(cameraId)
  }
}

const clearSelection = () => {
  selectedCameras.value = []
}

const bulkTestConnection = async () => {
  if (selectedCameras.value.length === 0) return

  isBulkTesting.value = true

  // Test connections sequentially with a small delay
  for (const cameraId of selectedCameras.value) {
    const camera = cameras.value.find(c => c.id === cameraId)
    if (camera) {
      await testConnection(camera)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  isBulkTesting.value = false
  toast.success(`Tested ${selectedCameras.value.length} camera(s)`)
  clearSelection()
}

const bulkDelete = () => {
  if (selectedCameras.value.length === 0) return

  const confirmMessage = `Are you sure you want to delete ${selectedCameras.value.length} camera(s)? This action cannot be undone.`

  if (confirm(confirmMessage)) {
    const count = selectedCameras.value.length
    cameras.value = cameras.value.filter(c => !selectedCameras.value.includes(c.id))
    toast.info(`Deleted ${count} camera(s)`)
    clearSelection()
  }
}

// Firmware management
const openFirmwareDialog = (camera: ManagedCamera) => {
  selectedFirmwareCamera.value = camera
  firmwareDialogOpen.value = true
  hasCheckedUpdates.value = false
  availableFirmware.value = null
}

const closeFirmwareDialog = () => {
  firmwareDialogOpen.value = false
  selectedFirmwareCamera.value = null
  hasCheckedUpdates.value = false
  availableFirmware.value = null
  isUpdating.value = false
  updateProgress.value = 0
}

const checkForUpdates = async () => {
  if (!selectedFirmwareCamera.value) return

  isCheckingUpdates.value = true

  // Simulate checking for firmware updates
  // In real implementation, this would call the VAPIX firmware.cgi API
  await new Promise(resolve => setTimeout(resolve, 1500))

  const currentVersion = selectedFirmwareCamera.value.firmwareVersion || '11.0.0'
  const currentMajor = parseInt(currentVersion.split('.')[0])
  const currentMinor = parseInt(currentVersion.split('.')[1])

  // Simulate finding a newer version
  const hasUpdate = Math.random() > 0.3

  if (hasUpdate) {
    availableFirmware.value = {
      version: `${currentMajor}.${currentMinor + 1}.${Math.floor(Math.random() * 100)}`,
      releaseDate: new Date().toLocaleDateString(),
      description: 'This firmware update includes security patches, performance improvements, and new features.',
      releaseNotes: [
        'Enhanced video analytics performance',
        'Security vulnerability fixes (CVE-2024-XXXX)',
        'Improved network stability',
        'New API endpoints for better integration',
        'Bug fixes and general improvements'
      ]
    }
  } else {
    availableFirmware.value = null
  }

  isCheckingUpdates.value = false
  hasCheckedUpdates.value = true
}

const startFirmwareUpdate = async () => {
  if (!selectedFirmwareCamera.value || !availableFirmware.value) return

  isUpdating.value = true
  updateProgress.value = 0

  // Simulate firmware update progress
  // In real implementation, this would:
  // 1. Upload firmware file via HTTP POST to /axis-cgi/firmwareupgrade.cgi
  // 2. Monitor progress
  // 3. Handle camera reboot
  // 4. Verify new firmware version

  const interval = setInterval(() => {
    updateProgress.value += Math.random() * 15
    if (updateProgress.value >= 100) {
      updateProgress.value = 100
      clearInterval(interval)

      setTimeout(() => {
        // Update camera firmware version
        const index = cameras.value.findIndex(c => c.id === selectedFirmwareCamera.value!.id)
        if (index !== -1) {
          cameras.value[index].firmwareVersion = availableFirmware.value!.version
          cameras.value[index].status = 'configuring'

          // Simulate camera coming back online after reboot
          setTimeout(() => {
            cameras.value[index].status = 'online'
            toast.success(`Firmware updated to ${availableFirmware.value!.version}`)
            closeFirmwareDialog()
          }, 2000)
        }
      }, 500)
    }
  }, 300)
}
</script>
