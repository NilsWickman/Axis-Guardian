<template>
  <div class="space-y-3 border-t pt-3">
    <h3 class="text-sm font-semibold flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-red-500"></span>
      Zone Editor
    </h3>

    <!-- Mode Selection -->
    <div class="grid grid-cols-3 gap-2">
      <button
        @click="$emit('set-mode', 'draw')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'draw' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
      >
        Draw
      </button>
      <button
        @click="$emit('set-mode', 'edit')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'edit' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'"
      >
        Edit
      </button>
      <button
        @click="$emit('set-mode', 'delete')"
        class="px-2 py-1.5 text-xs rounded border transition-colors"
        :class="mode === 'delete' ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border hover:bg-accent'"
      >
        Delete
      </button>
    </div>

    <!-- Drawing Options -->
    <div v-if="mode === 'draw'" class="space-y-2">
      <div>
        <label class="block text-[10px] font-medium mb-1">Zone Type</label>
        <select
          :value="zoneType"
          @change="$emit('set-zone-type', ($event.target as HTMLSelectElement).value as ZoneType)"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        >
          <option value="restricted">Restricted</option>
          <option value="entry">Entry</option>
          <option value="exit">Exit</option>
          <option value="monitored">Monitored</option>
        </select>
      </div>

      <div>
        <label class="block text-[10px] font-medium mb-1">Severity</label>
        <select
          :value="severity"
          @change="$emit('set-severity', ($event.target as HTMLSelectElement).value as ZoneSeverity)"
          class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div>
        <label class="block text-[10px] font-medium mb-1">Color</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="color"
            @input="$emit('set-color', ($event.target as HTMLInputElement).value)"
            class="w-8 h-8 border rounded cursor-pointer"
          />
          <input
            type="text"
            :value="color"
            @input="$emit('set-color', ($event.target as HTMLInputElement).value)"
            class="flex-1 px-2 py-1.5 text-sm border rounded-lg bg-background font-mono"
            placeholder="#ef4444"
          />
        </div>
      </div>

      <div class="text-xs text-muted-foreground bg-muted p-2 rounded">
        <p class="font-medium mb-1">Drawing Instructions:</p>
        <ul class="list-disc list-inside space-y-0.5">
          <li>Click to add vertices</li>
          <li>Click first vertex to close</li>
          <li>Press Escape to cancel</li>
          <li>Press Enter to finish</li>
        </ul>
      </div>

      <!-- Drawing Progress -->
      <div v-if="drawingVertices.length > 0" class="text-xs bg-primary/10 p-2 rounded border border-primary/20">
        <div class="font-medium">Drawing: {{ drawingVertices.length }} vertices</div>
        <div class="text-muted-foreground">
          {{ drawingVertices.length >= 3 ? 'Click first vertex or press Enter to finish' : `Need ${3 - drawingVertices.length} more` }}
        </div>
      </div>
    </div>

    <!-- Edit Mode Info -->
    <div v-if="mode === 'edit'" class="text-xs text-muted-foreground bg-muted p-2 rounded">
      <p>Click a zone to select it. Drag vertices to reshape.</p>
    </div>

    <!-- Delete Mode Info -->
    <div v-if="mode === 'delete'" class="text-xs text-muted-foreground bg-muted p-2 rounded">
      <p>Click a zone to delete it.</p>
    </div>

    <!-- Zone List -->
    <div v-if="zones.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium">Zones ({{ zones.length }})</span>
      </div>
      <div class="max-h-40 overflow-y-auto space-y-1">
        <div
          v-for="zone in zones"
          :key="zone.id"
          class="flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors"
          :class="[
            selectedZoneId === zone.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-accent',
            !zone.enabled && 'opacity-50'
          ]"
          @click="$emit('select-zone', zone.id)"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-sm border"
              :style="{ backgroundColor: zone.color + '66', borderColor: zone.color }"
            ></span>
            <span>{{ zone.name }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span
              class="px-1.5 py-0.5 rounded text-[10px]"
              :class="getTypeClass(zone.type)"
            >
              {{ zone.type }}
            </span>
            <button
              @click.stop="$emit('toggle-zone', zone.id)"
              class="p-0.5 hover:bg-accent rounded"
              :title="zone.enabled ? 'Disable zone' : 'Enable zone'"
            >
              {{ zone.enabled ? 'ON' : 'OFF' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Zone Details -->
    <div v-if="selectedZone" class="space-y-2 border-t pt-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium">Selected Zone</span>
        <button
          @click="$emit('delete-zone', selectedZone.id)"
          class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
        >
          Delete
        </button>
      </div>

      <div class="space-y-2">
        <div>
          <label class="block text-[10px] font-medium mb-1">Name</label>
          <input
            :value="selectedZone.name"
            @change="$emit('update-zone', selectedZone.id, { name: ($event.target as HTMLInputElement).value })"
            type="text"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-medium mb-1">Type</label>
            <select
              :value="selectedZone.type"
              @change="$emit('update-zone', selectedZone.id, { type: ($event.target as HTMLSelectElement).value })"
              class="w-full px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="restricted">Restricted</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="monitored">Monitored</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-medium mb-1">Severity</label>
            <select
              :value="selectedZone.severity"
              @change="$emit('update-zone', selectedZone.id, { severity: ($event.target as HTMLSelectElement).value })"
              class="w-full px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-medium mb-1">Cooldown (seconds)</label>
          <input
            :value="Math.round(selectedZone.cooldownMs / 1000)"
            @change="$emit('update-zone', selectedZone.id, { cooldownMs: Number(($event.target as HTMLInputElement).value) * 1000 })"
            type="number"
            min="0"
            max="300"
            class="w-full px-2 py-1.5 text-sm border rounded-lg bg-background"
          />
        </div>

        <div class="text-[10px] text-muted-foreground">
          <div>Vertices: {{ selectedZone.vertices.length }}</div>
          <div>Enabled: {{ selectedZone.enabled ? 'Yes' : 'No' }}</div>
        </div>
      </div>
    </div>

    <!-- Violations Summary -->
    <div v-if="violationCount > 0" class="border-t pt-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-destructive">
          Active Violations: {{ violationCount }}
        </span>
        <button
          @click="$emit('clear-violations')"
          class="px-2 py-1 text-[10px] border rounded hover:bg-accent"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Exit Button -->
    <button
      @click="$emit('set-mode', 'none')"
      class="w-full px-3 py-1.5 text-sm border rounded-lg hover:bg-accent"
    >
      Exit Zone Editor
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ZoneConfig, ZoneType, ZoneSeverity, ZoneVertex } from '../../../stores/zones'
import type { ZoneEditorMode } from '../../../composables/useZoneEditor'

interface Props {
  mode: ZoneEditorMode
  zones: ZoneConfig[]
  selectedZoneId: string | null
  selectedZone: ZoneConfig | null
  zoneType: ZoneType
  severity: ZoneSeverity
  color: string
  drawingVertices: ZoneVertex[]
  violationCount: number
}

defineProps<Props>()

defineEmits<{
  'set-mode': [mode: ZoneEditorMode]
  'set-zone-type': [type: ZoneType]
  'set-severity': [severity: ZoneSeverity]
  'set-color': [color: string]
  'select-zone': [id: string]
  'toggle-zone': [id: string]
  'delete-zone': [id: string]
  'update-zone': [id: string, updates: Partial<ZoneConfig>]
  'clear-violations': []
}>()

function getTypeClass(type: ZoneType): string {
  switch (type) {
    case 'restricted':
      return 'bg-red-500/20 text-red-400'
    case 'entry':
      return 'bg-green-500/20 text-green-400'
    case 'exit':
      return 'bg-orange-500/20 text-orange-400'
    case 'monitored':
      return 'bg-blue-500/20 text-blue-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}
</script>
