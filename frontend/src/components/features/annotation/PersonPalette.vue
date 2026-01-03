<script setup lang="ts">
import type { PersonDefinition } from '@/types/keyframe-annotation'

const props = defineProps<{
  persons: PersonDefinition[]
  selectedPersonId: number | null
  annotationCounts: Map<number, number>
  hasSelection: boolean // Whether a detection is selected
  presentPersonIds?: Set<number> // Persons with detections at current timestamp (via track truths)
}>()

const emit = defineEmits<{
  selectPerson: [personId: number]
}>()

// Get annotation count for a person
function getCount(personId: number): number {
  return props.annotationCounts.get(personId) ?? 0
}

// Get keyboard shortcut label
function getShortcut(personId: number): string {
  if (personId < 10) return personId.toString()
  if (personId === 10) return 'Shift+0'
  if (personId <= 19) return `Shift+${personId - 10}`
  return `Shift+0` // 20
}

// Check if person is present at current timestamp (has a detection with track truth)
function isPersonPresent(personId: number): boolean {
  return props.presentPersonIds?.has(personId) ?? false
}

// Check if person button should be enabled
function isPersonClickable(personId: number): boolean {
  return props.hasSelection || isPersonPresent(personId)
}

// Handle person click
function onPersonClick(personId: number): void {
  if (isPersonClickable(personId)) {
    emit('selectPerson', personId)
  }
}
</script>

<template>
  <div class="border-t border-border bg-card px-4 py-3">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold text-foreground">Assign Person</span>
      <span v-if="!hasSelection && presentPersonIds && presentPersonIds.size > 0" class="text-xs text-primary font-medium">
        Click a visible person to set position
      </span>
      <span v-else-if="!hasSelection" class="text-xs text-muted-foreground">
        Click a detection to select
      </span>
      <span v-else class="text-xs text-primary font-medium">
        Press 0-9 or click to assign
      </span>
    </div>

    <!-- Person buttons grid -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="person in persons"
        :key="person.id"
        class="relative rounded-lg border-2 transition-all overflow-hidden flex flex-col items-center justify-center"
        :class="[
          person.thumbnailUrl ? 'w-14 h-16' : 'w-10 h-10',
          {
            'opacity-30 cursor-not-allowed': !isPersonClickable(person.id),
            'opacity-100': isPersonClickable(person.id),
            'hover:ring-2 hover:ring-primary hover:scale-105': isPersonClickable(person.id),
            'ring-2 ring-primary scale-105': selectedPersonId === person.id,
            'ring-2 ring-green-500': !hasSelection && isPersonPresent(person.id),
          },
        ]"
        :style="{
          borderColor: person.color,
          backgroundColor: person.thumbnailUrl ? 'transparent' : person.color + '20',
        }"
        :disabled="!isPersonClickable(person.id)"
        :title="`${person.label} (${getShortcut(person.id)})${isPersonPresent(person.id) ? ' - Visible in frame' : ''}`"
        @click="onPersonClick(person.id)"
      >
        <!-- Thumbnail image -->
        <template v-if="person.thumbnailUrl">
          <img
            :src="person.thumbnailUrl"
            :alt="person.label"
            class="w-full h-10 object-cover"
          />
          <span
            class="text-[10px] font-bold py-0.5 w-full text-center"
            :style="{ backgroundColor: person.color, color: '#fff' }"
          >
            {{ person.id }}
          </span>
        </template>

        <!-- Fallback: just show ID number -->
        <template v-else>
          <span
            class="text-sm font-bold"
            :style="{ color: person.color }"
          >
            {{ person.id }}
          </span>
        </template>

        <!-- Count badge -->
        <span
          v-if="getCount(person.id) > 0"
          class="absolute -top-1 -right-1 min-w-[18px] px-1 py-0.5 rounded-full text-[9px] font-bold text-white text-center"
          :style="{ backgroundColor: person.color }"
        >
          {{ getCount(person.id) }}
        </span>
      </button>
    </div>

    <!-- Keyboard shortcuts hint -->
    <div class="mt-2 text-[10px] text-muted-foreground">
      Keys: 0-9 for persons 0-9, Shift+0-9 for 10-20 | Space: play/pause | ←→: prev/next keyframe
    </div>
  </div>
</template>
