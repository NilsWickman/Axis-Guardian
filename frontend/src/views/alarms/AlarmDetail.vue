<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 p-4 border-b border-sidebar-border">
      <Button variant="ghost" size="sm" @click="goBack">
        <ArrowLeft class="w-4 h-4 mr-1" />
        Back
      </Button>
      <h1 class="text-base font-bold text-foreground">Alarm Details</h1>
      <span
        class="px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0"
        :class="getSeverityColor(alarm?.severity || 'medium')"
      >
        {{ alarm?.severity?.toUpperCase() }}
      </span>
      <span
        class="px-2 py-0.5 text-xs font-medium rounded-full"
        :class="getStatusColor(alarm?.status || 'pending')"
      >
        {{ alarm?.status?.toUpperCase() }}
      </span>
    </div>

    <!-- Content -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="alarm" class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Main Info Card -->
        <div class="bg-card border rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Alarm ID</h3>
                <p class="text-sm font-mono">{{ alarm.id }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Timestamp</h3>
                <p class="text-sm">{{ formatTimestamp(alarm.timestamp) }}</p>
                <p class="text-xs text-muted-foreground">{{ getRelativeTime(alarm.timestamp) }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Type</h3>
                <p class="text-sm capitalize">{{ alarm.type.replace(/_/g, ' ') }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Camera</h3>
                <p class="text-sm">{{ alarm.source.cameraId }}</p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Zone</h3>
                <p class="text-sm">{{ alarm.source.zoneId }}</p>
              </div>
            </div>

            <!-- Lifecycle Info -->
            <div class="space-y-4">
              <div v-if="alarm.acknowledgedBy">
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Acknowledged</h3>
                <p class="text-sm">{{ alarm.acknowledgedBy }}</p>
                <p class="text-xs text-muted-foreground">{{ formatTimestamp(alarm.acknowledgedAt!) }}</p>
              </div>

              <div v-if="alarm.confirmedBy">
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Confirmed</h3>
                <p class="text-sm">{{ alarm.confirmedBy }}</p>
                <p class="text-xs text-muted-foreground">{{ formatTimestamp(alarm.confirmedAt!) }}</p>
                <p v-if="alarm.incidentId" class="text-xs text-primary mt-1">Incident: {{ alarm.incidentId }}</p>
              </div>

              <div v-if="alarm.dismissedBy">
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Dismissed</h3>
                <p class="text-sm">{{ alarm.dismissedBy }}</p>
                <p class="text-xs text-muted-foreground">{{ formatTimestamp(alarm.dismissedAt!) }}</p>
                <p v-if="alarm.dismissalReason" class="text-sm mt-2">
                  <span class="font-medium">Reason:</span> {{ alarm.dismissalReason }}
                </p>
              </div>

              <div v-if="alarm.outcomeCategory">
                <h3 class="text-sm font-semibold text-muted-foreground mb-1">Outcome</h3>
                <p class="text-sm capitalize">{{ alarm.outcomeCategory.replace(/_/g, ' ') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Evidence Section -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-sm font-bold mb-4">Evidence</h2>

          <!-- Snapshots -->
          <div v-if="alarm.source.snapshot || alarm.source.snapshots?.length" class="mb-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Snapshots</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-if="alarm.source.snapshot" class="border rounded-lg overflow-hidden bg-gray-900">
                <img
                  :src="alarm.source.snapshot"
                  alt="Alarm snapshot"
                  class="w-full h-48 object-cover"
                  @error="handleImageError"
                />
              </div>
              <div
                v-for="(snapshot, idx) in alarm.source.snapshots"
                :key="idx"
                class="border rounded-lg overflow-hidden bg-gray-900"
              >
                <img
                  :src="snapshot"
                  :alt="`Snapshot ${idx + 1}`"
                  class="w-full h-48 object-cover"
                  @error="handleImageError"
                />
              </div>
            </div>
          </div>

          <!-- Video Playback -->
          <div v-if="alarm.source.videoUrl" class="mb-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Video Recording</h3>
            <div class="border rounded-lg overflow-hidden bg-gray-900">
              <video
                ref="videoPlayer"
                :src="alarm.source.videoUrl"
                controls
                class="w-full max-h-96"
                @error="handleVideoError"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <!-- Coordinates -->
          <div v-if="alarm.source.coordinates">
            <h3 class="text-sm font-semibold text-muted-foreground mb-2">Coordinates</h3>
            <p class="text-sm font-mono">
              X: {{ alarm.source.coordinates.x.toFixed(2) }}, Y: {{ alarm.source.coordinates.y.toFixed(2) }}
            </p>
          </div>
        </div>

        <!-- Notes & Tags -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-sm font-bold mb-4">Notes & Tags</h2>

          <!-- Tags -->
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in alarm.tags"
                :key="tag"
                class="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
              >
                {{ tag }}
              </span>
              <span v-if="!alarm.tags?.length" class="text-sm text-muted-foreground">No tags</span>
            </div>
            <div v-if="alarm.status !== 'confirmed' && alarm.status !== 'dismissed'" class="mt-3">
              <Input
                v-model="newTag"
                placeholder="Add tag..."
                class="text-xs"
                @keyup.enter="addTag"
              />
              <Button size="sm" class="mt-2" @click="addTag" :disabled="!newTag.trim()">
                Add Tag
              </Button>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="alarm.notes" class="mb-4">
            <h3 class="text-sm font-semibold text-muted-foreground mb-2">Notes</h3>
            <p class="text-sm whitespace-pre-wrap">{{ alarm.notes }}</p>
          </div>

          <!-- Closure Notes -->
          <div v-if="alarm.closureNotes">
            <h3 class="text-sm font-semibold text-muted-foreground mb-2">Closure Notes</h3>
            <p class="text-sm whitespace-pre-wrap">{{ alarm.closureNotes }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="alarm.status === 'pending' || alarm.status === 'acknowledged'" class="bg-card border rounded-lg p-6">
          <h2 class="text-sm font-bold mb-4">Actions</h2>

          <div class="flex gap-3">
            <Button
              v-if="!alarm.acknowledged"
              @click="handleAcknowledge"
              :disabled="isProcessing"
            >
              <Check class="w-4 h-4 mr-1" />
              Acknowledge
            </Button>

            <Button
              @click="showConfirmDialog = true"
              variant="default"
              :disabled="isProcessing"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Confirm Alarm
            </Button>

            <Button
              @click="showDismissDialog = true"
              variant="destructive"
              :disabled="isProcessing"
            >
              <X class="w-4 h-4 mr-1" />
              Dismiss Alarm
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-muted-foreground">Alarm not found</p>
    </div>

    <!-- Confirm Dialog -->
    <Dialog v-model:open="showConfirmDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Alarm</DialogTitle>
          <DialogDescription>
            Confirm this alarm as a real incident. An incident will be created for follow-up.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Outcome Category</label>
            <Select v-model="confirmForm.outcomeCategory">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incident_created">Incident Created</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved_on_site">Resolved On-Site</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium">Notes</label>
            <Textarea
              v-model="confirmForm.notes"
              placeholder="Add notes about confirmation..."
              class="mt-1"
              rows="3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showConfirmDialog = false">Cancel</Button>
          <Button @click="handleConfirm" :disabled="isProcessing">
            {{ isProcessing ? 'Confirming...' : 'Confirm' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dismiss Dialog -->
    <Dialog v-model:open="showDismissDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dismiss Alarm</DialogTitle>
          <DialogDescription>
            Dismiss this alarm as a false positive. Please provide a reason.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Reason *</label>
            <Textarea
              v-model="dismissForm.reason"
              placeholder="Enter reason for dismissal (required)..."
              class="mt-1"
              rows="3"
            />
          </div>

          <div>
            <label class="text-sm font-medium">Outcome Category</label>
            <Select v-model="dismissForm.outcomeCategory">
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false_alarm">False Alarm</SelectItem>
                <SelectItem value="authorized_personnel">Authorized Personnel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium">Additional Notes</label>
            <Textarea
              v-model="dismissForm.closureNotes"
              placeholder="Add additional closure notes..."
              class="mt-1"
              rows="2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDismissDialog = false">Cancel</Button>
          <Button
            variant="destructive"
            @click="handleDismiss"
            :disabled="isProcessing || !dismissForm.reason.trim()"
          >
            {{ isProcessing ? 'Dismissing...' : 'Dismiss' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlarms } from '@/composables/useAlarms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Check, CheckCircle, X } from 'lucide-vue-next'
import type { components } from '@/types/generated'

type Alarm = components['schemas']['Alarm']

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { store, getSeverityColor, formatTimestamp, getRelativeTime } = useAlarms()

const alarm = ref<Alarm | null>(null)
const loading = ref(true)
const isProcessing = ref(false)
const newTag = ref('')
const videoPlayer = ref<HTMLVideoElement | null>(null)

const showConfirmDialog = ref(false)
const showDismissDialog = ref(false)

const confirmForm = ref({
  outcomeCategory: '',
  notes: ''
})

const dismissForm = ref({
  reason: '',
  outcomeCategory: '',
  closureNotes: ''
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
    case 'acknowledged':
      return 'bg-blue-100 text-blue-700 border border-blue-300'
    case 'confirmed':
      return 'bg-red-100 text-red-700 border border-red-300'
    case 'dismissed':
      return 'bg-gray-100 text-gray-700 border border-gray-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const goBack = () => {
  router.back()
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dy=".3em"%3ESnapshot Unavailable%3C/text%3E%3C/svg%3E'
}

const handleVideoError = (event: Event) => {
  console.error('Video failed to load', event)
}

const handleAcknowledge = async () => {
  if (!alarm.value || !authStore.currentUser) return

  isProcessing.value = true
  try {
    // Mock acknowledgment - in real implementation, call API
    alarm.value.acknowledged = true
    alarm.value.acknowledgedBy = authStore.currentUser.username
    alarm.value.acknowledgedAt = new Date().toISOString()
    alarm.value.status = 'acknowledged' as any
  } catch (error) {
    console.error('Failed to acknowledge alarm:', error)
  } finally {
    isProcessing.value = false
  }
}

const handleConfirm = async () => {
  if (!alarm.value || !authStore.currentUser) return

  isProcessing.value = true
  try {
    // Mock confirmation - in real implementation, call API
    alarm.value.status = 'confirmed' as any
    alarm.value.confirmedBy = authStore.currentUser.username
    alarm.value.confirmedAt = new Date().toISOString()
    alarm.value.outcomeCategory = confirmForm.value.outcomeCategory as any
    alarm.value.closureNotes = confirmForm.value.notes
    alarm.value.incidentId = `incident-${Date.now()}`

    showConfirmDialog.value = false
  } catch (error) {
    console.error('Failed to confirm alarm:', error)
  } finally {
    isProcessing.value = false
  }
}

const handleDismiss = async () => {
  if (!alarm.value || !authStore.currentUser) return

  isProcessing.value = true
  try {
    // Mock dismissal - in real implementation, call API
    alarm.value.status = 'dismissed' as any
    alarm.value.dismissedBy = authStore.currentUser.username
    alarm.value.dismissedAt = new Date().toISOString()
    alarm.value.dismissalReason = dismissForm.value.reason
    alarm.value.outcomeCategory = dismissForm.value.outcomeCategory as any
    alarm.value.closureNotes = dismissForm.value.closureNotes

    showDismissDialog.value = false
  } catch (error) {
    console.error('Failed to dismiss alarm:', error)
  } finally {
    isProcessing.value = false
  }
}

const addTag = () => {
  if (!alarm.value || !newTag.value.trim()) return

  if (!alarm.value.tags) {
    alarm.value.tags = []
  }

  if (!alarm.value.tags.includes(newTag.value.trim())) {
    alarm.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const alarmId = route.params.alarmId as string
    // Mock data - in real implementation, fetch from API
    alarm.value = store.alarms.find(a => a.id === alarmId) || null

    // Add mock video/snapshot URLs if not present
    if (alarm.value && !alarm.value.source.videoUrl) {
      alarm.value.source.videoUrl = '/mock-video/alarm-clip.mp4'
    }
  } catch (error) {
    console.error('Failed to load alarm:', error)
  } finally {
    loading.value = false
  }
})
</script>
