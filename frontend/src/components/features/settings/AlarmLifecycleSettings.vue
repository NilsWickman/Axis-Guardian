<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold mb-1">Alarm Lifecycle Management</h3>
      <p class="text-sm text-muted-foreground">
        Configure how alarms should be handled by security operators
      </p>
    </div>

    <!-- Requirements Section -->
    <div class="space-y-4">
      <h4 class="font-medium text-sm">Requirements</h4>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 border rounded-lg">
          <div class="flex-1">
            <label class="font-medium text-sm cursor-pointer" for="require-notes-acknowledge">
              Require notes when acknowledging alarms
            </label>
            <p class="text-xs text-muted-foreground mt-1">
              Operators must provide notes when acknowledging an alarm
            </p>
          </div>
          <Switch
            id="require-notes-acknowledge"
            v-model:checked="localConfig.requireNotesOnAcknowledge"
          />
        </div>

        <div class="flex items-center justify-between p-3 border rounded-lg">
          <div class="flex-1">
            <label class="font-medium text-sm cursor-pointer" for="require-notes-dismiss">
              Require notes when dismissing alarms
            </label>
            <p class="text-xs text-muted-foreground mt-1">
              Operators must provide notes when dismissing an alarm
            </p>
          </div>
          <Switch
            id="require-notes-dismiss"
            v-model:checked="localConfig.requireNotesOnDismiss"
          />
        </div>

        <div class="flex items-center justify-between p-3 border rounded-lg">
          <div class="flex-1">
            <label class="font-medium text-sm cursor-pointer" for="require-dismissal-reason">
              Require dismissal reason
            </label>
            <p class="text-xs text-muted-foreground mt-1">
              Operators must select a reason when dismissing an alarm
            </p>
          </div>
          <Switch
            id="require-dismissal-reason"
            v-model:checked="localConfig.requireDismissalReason"
          />
        </div>

        <div class="flex items-center justify-between p-3 border rounded-lg">
          <div class="flex-1">
            <label class="font-medium text-sm cursor-pointer" for="require-closure-note">
              Require closure notes
            </label>
            <p class="text-xs text-muted-foreground mt-1">
              Operators must provide notes when closing an incident
            </p>
          </div>
          <Switch
            id="require-closure-note"
            v-model:checked="localConfig.requireClosureNote"
          />
        </div>

        <div class="flex items-center justify-between p-3 border rounded-lg">
          <div class="flex-1">
            <label class="font-medium text-sm cursor-pointer" for="require-outcome-category">
              Require outcome category
            </label>
            <p class="text-xs text-muted-foreground mt-1">
              Operators must select an outcome when closing an incident
            </p>
          </div>
          <Switch
            id="require-outcome-category"
            v-model:checked="localConfig.requireOutcomeCategory"
          />
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="space-y-4">
      <h4 class="font-medium text-sm">Features</h4>

      <div class="flex items-center justify-between p-3 border rounded-lg">
        <div class="flex-1">
          <label class="font-medium text-sm cursor-pointer" for="enable-incident-creation">
            Enable incident creation
          </label>
          <p class="text-xs text-muted-foreground mt-1">
            Allow operators to escalate alarms into formal incidents
          </p>
        </div>
        <Switch
          id="enable-incident-creation"
          v-model:checked="localConfig.enableIncidentCreation"
        />
      </div>

      <div class="space-y-2">
        <label class="font-medium text-sm" for="auto-archive-days">
          Auto-archive after (days)
        </label>
        <p class="text-xs text-muted-foreground">
          Automatically archive resolved alarms after this many days
        </p>
        <input
          id="auto-archive-days"
          v-model.number="localConfig.autoArchiveAfterDays"
          type="number"
          min="1"
          max="365"
          class="w-32 px-3 py-2 border rounded-lg bg-background text-sm"
        />
      </div>
    </div>

    <div v-if="hasChanges" class="flex gap-2 pt-2">
      <button
        @click="save"
        :disabled="saving"
        class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
      >
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
      <button
        @click="cancel"
        :disabled="saving"
        class="px-4 py-2 border rounded hover:bg-accent disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Switch } from '@/components/ui/switch'
import type { AlarmLifecycleConfig } from '@/types/settings'

const props = defineProps<{
  config: AlarmLifecycleConfig
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [config: AlarmLifecycleConfig]
  cancel: []
}>()

const localConfig = ref<AlarmLifecycleConfig>({ ...props.config })

const hasChanges = computed(() => {
  return JSON.stringify(localConfig.value) !== JSON.stringify(props.config)
})

function save() {
  emit('save', localConfig.value)
}

function cancel() {
  localConfig.value = { ...props.config }
  emit('cancel')
}

// Watch for external changes
watch(() => props.config, (newConfig) => {
  if (!hasChanges.value) {
    localConfig.value = { ...newConfig }
  }
}, { deep: true })
</script>
