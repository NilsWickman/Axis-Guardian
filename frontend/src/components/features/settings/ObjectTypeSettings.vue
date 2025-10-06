<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-lg font-semibold mb-1">Object Detection Types</h3>
      <p class="text-sm text-muted-foreground">
        Configure which object types should trigger alarms when detected in restricted zones
      </p>
    </div>

    <div class="space-y-3">
      <div
        v-for="objectType in objectTypes"
        :key="objectType.type"
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ objectType.label }}</span>
            <span
              v-if="objectType.enabled"
              class="px-2 py-0.5 text-xs bg-green-500/20 text-green-700 dark:text-green-400 rounded"
            >
              Active
            </span>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            {{ objectType.description }}
          </p>
        </div>

        <Switch
          :checked="objectType.enabled"
          @update:checked="toggleObjectType(objectType.type)"
          :aria-label="`Toggle ${objectType.label} detection`"
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
import { ref, computed } from 'vue'
import { Switch } from '@/components/ui/switch'
import type { ObjectTypeConfig, ObjectType } from '@/types/settings'

const props = defineProps<{
  objectTypes: ObjectTypeConfig[]
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [objectTypes: ObjectTypeConfig[]]
  cancel: []
}>()

const localObjectTypes = ref<ObjectTypeConfig[]>([...props.objectTypes])

const hasChanges = computed(() => {
  return JSON.stringify(localObjectTypes.value) !== JSON.stringify(props.objectTypes)
})

function toggleObjectType(type: ObjectType) {
  const objectType = localObjectTypes.value.find(ot => ot.type === type)
  if (objectType) {
    objectType.enabled = !objectType.enabled
  }
}

function save() {
  emit('save', localObjectTypes.value)
}

function cancel() {
  localObjectTypes.value = [...props.objectTypes]
  emit('cancel')
}

// Watch for external changes
import { watch } from 'vue'
watch(() => props.objectTypes, (newTypes) => {
  if (!hasChanges.value) {
    localObjectTypes.value = [...newTypes]
  }
}, { deep: true })
</script>
