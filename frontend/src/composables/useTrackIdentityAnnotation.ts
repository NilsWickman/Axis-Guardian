import { ref, computed } from 'vue'
import type {
  TrackIdentityDataset,
  TrackIdentityAnnotation,
  PersonDefinition,
} from '@/types/track-identity'
import {
  createEmptyDataset,
  generateAnnotationId,
  isValidDataset,
} from '@/types/track-identity'

const STORAGE_KEY = 'track-identity-annotations'

/**
 * Composable for managing track identity annotations.
 * Allows assigning person IDs to globalTrackIds for ground truth labeling.
 */
export function useTrackIdentityAnnotation() {
  // Dataset state
  const dataset = ref<TrackIdentityDataset | null>(null)

  // Selection state
  const selectedTrackId = ref<string | null>(null)

  // Session state
  const isModified = ref(false)
  const lastSavedAt = ref<string | null>(null)

  // Computed: Set of annotated track IDs
  const annotatedTrackIds = computed(() => {
    if (!dataset.value) return new Set<string>()
    return new Set(dataset.value.annotations.map(a => a.globalTrackId))
  })

  // Computed: Map of personId -> globalTrackIds
  const personAssignments = computed(() => {
    const map = new Map<number, string[]>()
    if (!dataset.value) return map

    for (const ann of dataset.value.annotations) {
      const existing = map.get(ann.personId) || []
      existing.push(ann.globalTrackId)
      map.set(ann.personId, existing)
    }
    return map
  })

  // Computed: Get persons list
  const persons = computed<PersonDefinition[]>(() => {
    return dataset.value?.persons ?? []
  })

  // Computed: Stats
  const stats = computed(() => {
    if (!dataset.value) return null
    return {
      totalAnnotations: dataset.value.annotations.length,
      uniqueTracks: annotatedTrackIds.value.size,
      personsUsed: new Set(dataset.value.annotations.map(a => a.personId)).size,
    }
  })

  /**
   * Initialize the annotation session
   */
  function initializeSession(dataSource: 'live' | 'replay' = 'live'): void {
    // Always start fresh - clear any saved annotations
    localStorage.removeItem(STORAGE_KEY)
    dataset.value = createEmptyDataset(dataSource)
    lastSavedAt.value = null
    isModified.value = false
  }

  /**
   * Select a track for annotation
   */
  function selectTrack(globalTrackId: string): void {
    selectedTrackId.value = globalTrackId
  }

  /**
   * Clear the current selection
   */
  function clearSelection(): void {
    selectedTrackId.value = null
  }

  /**
   * Get annotation for a specific track
   */
  function getAnnotationForTrack(globalTrackId: string): TrackIdentityAnnotation | null {
    if (!dataset.value) return null
    return dataset.value.annotations.find(a => a.globalTrackId === globalTrackId) ?? null
  }

  /**
   * Get person definition for a track
   */
  function getPersonForTrack(globalTrackId: string): PersonDefinition | null {
    const annotation = getAnnotationForTrack(globalTrackId)
    if (!annotation || !dataset.value) return null
    return dataset.value.persons.find(p => p.id === annotation.personId) ?? null
  }

  /**
   * Assign a person to the currently selected track
   */
  function assignPersonToSelectedTrack(
    personId: number,
    position?: { x: number; y: number },
    notes?: string
  ): TrackIdentityAnnotation | null {
    if (!dataset.value || !selectedTrackId.value) return null

    // Check if track already has an assignment - update it
    const existingIdx = dataset.value.annotations.findIndex(
      a => a.globalTrackId === selectedTrackId.value
    )

    if (existingIdx >= 0) {
      // Update existing assignment
      dataset.value.annotations[existingIdx].personId = personId
      dataset.value.annotations[existingIdx].assignedAt = new Date().toISOString()
      if (position) {
        dataset.value.annotations[existingIdx].assignedAtPosition = position
      }
      if (notes !== undefined) {
        dataset.value.annotations[existingIdx].notes = notes
      }
      dataset.value.updatedAt = new Date().toISOString()
      isModified.value = true
      return dataset.value.annotations[existingIdx]
    }

    // Create new annotation
    const annotation: TrackIdentityAnnotation = {
      id: generateAnnotationId(),
      globalTrackId: selectedTrackId.value,
      personId,
      assignedAt: new Date().toISOString(),
      assignedAtPosition: position,
      notes,
    }

    dataset.value.annotations.push(annotation)
    dataset.value.updatedAt = new Date().toISOString()
    isModified.value = true

    return annotation
  }

  /**
   * Assign a person to a specific track (not requiring selection)
   */
  function assignPersonToTrack(
    globalTrackId: string,
    personId: number,
    position?: { x: number; y: number }
  ): TrackIdentityAnnotation | null {
    // Temporarily select, assign, then restore selection
    const previousSelection = selectedTrackId.value
    selectedTrackId.value = globalTrackId
    const result = assignPersonToSelectedTrack(personId, position)
    selectedTrackId.value = previousSelection
    return result
  }

  /**
   * Remove assignment from a track
   */
  function unassignTrack(globalTrackId: string): void {
    if (!dataset.value) return

    const idx = dataset.value.annotations.findIndex(a => a.globalTrackId === globalTrackId)
    if (idx >= 0) {
      dataset.value.annotations.splice(idx, 1)
      dataset.value.updatedAt = new Date().toISOString()
      isModified.value = true
    }
  }

  /**
   * Remove assignment from currently selected track
   */
  function unassignSelectedTrack(): void {
    if (selectedTrackId.value) {
      unassignTrack(selectedTrackId.value)
    }
  }

  /**
   * Clear all annotations
   */
  function clearAllAnnotations(): void {
    if (!dataset.value) return

    dataset.value.annotations = []
    dataset.value.updatedAt = new Date().toISOString()
    isModified.value = true
  }

  /**
   * Save to localStorage
   */
  function saveToLocalStorage(): void {
    if (!dataset.value) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset.value))
    lastSavedAt.value = new Date().toISOString()
    isModified.value = false
  }

  /**
   * Export as JSON file
   */
  function exportAsJson(): void {
    if (!dataset.value) return

    const blob = new Blob([JSON.stringify(dataset.value, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `track-identity-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Import from JSON file
   */
  async function importFromJson(file: File): Promise<void> {
    try {
      const text = await file.text()
      const imported = JSON.parse(text)

      if (!isValidDataset(imported)) {
        throw new Error('Invalid dataset format')
      }

      dataset.value = imported
      lastSavedAt.value = imported.updatedAt
      isModified.value = false
    } catch (e) {
      console.error('Import error:', e)
      throw e
    }
  }

  /**
   * Check if a track is annotated
   */
  function isTrackAnnotated(globalTrackId: string): boolean {
    return annotatedTrackIds.value.has(globalTrackId)
  }

  /**
   * Reset dataset - clears all annotations and creates fresh dataset
   */
  function resetDataset(dataSource: 'live' | 'replay' = 'live'): void {
    dataset.value = createEmptyDataset(dataSource)
    localStorage.removeItem(STORAGE_KEY)
    lastSavedAt.value = null
    isModified.value = false
  }

  return {
    // State
    dataset,
    selectedTrackId,
    isModified,
    lastSavedAt,

    // Computed
    annotatedTrackIds,
    personAssignments,
    persons,
    stats,

    // Methods
    initializeSession,
    selectTrack,
    clearSelection,
    getAnnotationForTrack,
    getPersonForTrack,
    assignPersonToSelectedTrack,
    assignPersonToTrack,
    unassignTrack,
    unassignSelectedTrack,
    clearAllAnnotations,
    saveToLocalStorage,
    exportAsJson,
    importFromJson,
    isTrackAnnotated,
    resetDataset,
  }
}
