<template>
  <div class="h-full w-full bg-background flex flex-col overflow-hidden">
    <div class="border-b border-border px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="font-semibold">Recordings</div>
        <div v-if="isLoading" class="text-xs text-muted-foreground">Loading…</div>
        <div v-else-if="error" class="text-xs text-destructive">{{ error }}</div>
      </div>
      <button
        class="px-3 py-1.5 rounded border border-border text-xs font-semibold hover:bg-accent"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <div class="p-4 flex items-center gap-3">
      <input
        v-model="query"
        class="flex-1 px-3 py-2 rounded border border-border bg-background text-sm"
        placeholder="Search by recording ID…"
      />
      <div class="text-xs text-muted-foreground whitespace-nowrap">
        {{ filtered.length }} / {{ recordings.length }}
      </div>
    </div>

    <div class="flex-1 overflow-auto px-4 pb-4">
      <div class="rounded-lg border border-border bg-card overflow-hidden">
        <div class="grid grid-cols-12 gap-2 px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground">
          <div class="col-span-5">Recording</div>
          <div class="col-span-3">Created</div>
          <div class="col-span-2">Cameras</div>
          <div class="col-span-2 text-right">Open</div>
        </div>

        <div v-if="filtered.length === 0" class="p-8 text-center text-sm text-muted-foreground">
          No recordings found.
        </div>

        <div
          v-for="rec in filtered"
          :key="rec.recordingId"
          class="grid grid-cols-12 gap-2 px-3 py-2 border-b border-border last:border-b-0 items-center"
        >
          <div class="col-span-5">
            <div class="font-mono text-xs text-foreground">{{ rec.recordingId }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatDuration(rec.durationMs) }}
              <span v-if="rec.siteMapConfig" class="ml-2">• sitemap</span>
            </div>
          </div>
          <div class="col-span-3 text-xs text-muted-foreground">
            {{ formatDate(rec.createdAtMs) }}
          </div>
          <div class="col-span-2 text-xs text-muted-foreground">
            {{ rec.cameras?.length ?? 0 }}
          </div>
          <div class="col-span-2 flex justify-end">
            <router-link
              class="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              :to="`/replay/${encodeURIComponent(rec.recordingId)}`"
            >
              View
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { config } from '@/config/environment'
import type { ReplayManifest } from '@/types/replay'

const apiBase = computed(() => config.trackingServiceApiUrl.replace(/\/$/, ''))

const recordings = ref<ReplayManifest[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return recordings.value
  return recordings.value.filter(r => r.recordingId.toLowerCase().includes(q))
})

function formatDate(ms: number): string {
  if (!Number.isFinite(ms)) return ''
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return ''
  }
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || !Number.isFinite(durationMs)) return '—'
  const s = Math.max(0, Math.round(durationMs / 1000))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

async function load(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    const res = await fetch(`${apiBase.value}/api/recordings`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Failed to load recordings (${res.status})`)
    const data = await res.json() as { recordings: ReplayManifest[] }
    recordings.value = Array.isArray(data.recordings) ? data.recordings : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load recordings'
    recordings.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

