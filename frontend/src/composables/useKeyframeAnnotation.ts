/**
 * Composable for managing keyframe-based cross-camera annotations
 */

import { ref, computed, watch } from 'vue'
import type {
  AnnotationDataset,
  KeyframeAnnotation,
  PersonDefinition,
  NormalizedBbox,
  LegacyTrackTruths,
} from '@/types/keyframe-annotation'
import { generateAnnotationId, createEmptyDataset, createDefaultPersons } from '@/types/keyframe-annotation'

const STORAGE_KEY = 'cross-camera-annotations'

export function useKeyframeAnnotation() {
  const dataset = ref<AnnotationDataset | null>(null)
  const isModified = ref(false)

  // Legacy track truths lookup (trackId mappings)
  const trackTruthsLookup = ref<Map<string, number>>(new Map()) // "camera1-5" -> personId
  const trackTruthsPersons = ref<PersonDefinition[]>([])
  const trackTruthsLoaded = ref(false)

  // Computed: all annotations
  const annotations = computed(() => dataset.value?.annotations ?? [])

  // Computed: person definitions (prefer trackTruths persons if loaded, as they have thumbnails)
  const persons = computed(() => {
    if (trackTruthsPersons.value.length > 0) {
      return trackTruthsPersons.value
    }
    return dataset.value?.persons ?? createDefaultPersons()
  })

  // Computed: annotation count per person
  const annotationCountByPerson = computed(() => {
    const counts = new Map<number, number>()
    for (const ann of annotations.value) {
      counts.set(ann.personId, (counts.get(ann.personId) ?? 0) + 1)
    }
    return counts
  })

  // Computed: total annotations
  const totalAnnotations = computed(() => annotations.value.length)

  /**
   * Initialize a new annotation session
   */
  function initializeSession(
    cameras: string[],
    intervalSeconds: number,
    videoDuration: number
  ): void {
    // Try to load from localStorage first
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AnnotationDataset
        // Check if it matches current config
        if (
          parsed.version === '2.0' &&
          parsed.keyframeIntervalSeconds === intervalSeconds &&
          JSON.stringify(parsed.cameras.sort()) === JSON.stringify(cameras.sort())
        ) {
          dataset.value = parsed
          isModified.value = false
          return
        }
      } catch {
        // Invalid saved data, start fresh
      }
    }

    dataset.value = createEmptyDataset(cameras, intervalSeconds, videoDuration)
    isModified.value = false
  }

  /**
   * Assign a person to a detection
   */
  function assignPerson(params: {
    timestamp: number
    cameraId: string
    trackId: number
    personId: number
    bbox: NormalizedBbox
    confidence: number
  }): KeyframeAnnotation {
    if (!dataset.value) {
      throw new Error('No dataset initialized')
    }

    // Check for existing annotation at same timestamp/camera/track
    const existingIdx = dataset.value.annotations.findIndex(
      (ann) =>
        Math.abs(ann.timestamp - params.timestamp) < 0.1 &&
        ann.cameraId === params.cameraId &&
        ann.trackId === params.trackId
    )

    const annotation: KeyframeAnnotation = {
      id: existingIdx >= 0 ? dataset.value.annotations[existingIdx].id : generateAnnotationId(),
      timestamp: params.timestamp,
      cameraId: params.cameraId,
      trackId: params.trackId,
      personId: params.personId,
      bbox: params.bbox,
      confidence: params.confidence,
      assignedAt: new Date().toISOString(),
    }

    if (existingIdx >= 0) {
      // Update existing
      dataset.value.annotations[existingIdx] = annotation
    } else {
      // Add new
      dataset.value.annotations.push(annotation)
    }

    dataset.value.metadata.lastModifiedAt = new Date().toISOString()
    isModified.value = true
    saveToLocalStorage()

    return annotation
  }

  /**
   * Set world position for an existing annotation
   */
  function setWorldPosition(annotationId: string, x: number, y: number): void {
    if (!dataset.value) return

    const annotation = dataset.value.annotations.find((a) => a.id === annotationId)
    if (annotation) {
      annotation.worldPosition = { x, y }
      dataset.value.metadata.lastModifiedAt = new Date().toISOString()
      isModified.value = true
      saveToLocalStorage()
    }
  }

  /**
   * Remove an annotation
   */
  function removeAnnotation(annotationId: string): void {
    if (!dataset.value) return

    const idx = dataset.value.annotations.findIndex((a) => a.id === annotationId)
    if (idx >= 0) {
      dataset.value.annotations.splice(idx, 1)
      dataset.value.metadata.lastModifiedAt = new Date().toISOString()
      isModified.value = true
      saveToLocalStorage()
    }
  }

  /**
   * Get annotations at a specific timestamp (within tolerance)
   */
  function getAnnotationsAtTimestamp(timestamp: number, tolerance = 0.5): KeyframeAnnotation[] {
    return annotations.value.filter((ann) => Math.abs(ann.timestamp - timestamp) <= tolerance)
  }

  /**
   * Get annotation for a specific detection
   */
  function getAnnotationForDetection(
    timestamp: number,
    cameraId: string,
    trackId: number,
    tolerance = 0.5
  ): KeyframeAnnotation | null {
    return (
      annotations.value.find(
        (ann) =>
          Math.abs(ann.timestamp - timestamp) <= tolerance &&
          ann.cameraId === cameraId &&
          ann.trackId === trackId
      ) ?? null
    )
  }

  /**
   * Get person definition by ID
   */
  function getPersonById(personId: number): PersonDefinition | null {
    return persons.value.find((p) => p.id === personId) ?? null
  }

  /**
   * Save to localStorage
   */
  function saveToLocalStorage(): void {
    if (dataset.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset.value))
    }
  }

  /**
   * Export dataset as JSON
   */
  function exportDataset(): string {
    if (!dataset.value) return '{}'
    return JSON.stringify(dataset.value, null, 2)
  }

  /**
   * Download dataset as JSON file
   */
  function downloadDataset(filename = 'annotations.json'): void {
    const json = exportDataset()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Import dataset from JSON
   */
  function importDataset(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as AnnotationDataset
      if (parsed.version !== '2.0') {
        console.error('Invalid dataset version')
        return false
      }
      dataset.value = parsed
      isModified.value = true
      saveToLocalStorage()
      return true
    } catch (err) {
      console.error('Failed to import dataset:', err)
      return false
    }
  }

  /**
   * Clear all annotations
   */
  function clearAnnotations(): void {
    if (!dataset.value) return
    dataset.value.annotations = []
    dataset.value.metadata.lastModifiedAt = new Date().toISOString()
    isModified.value = true
    saveToLocalStorage()
  }

  /**
   * Reset entire session
   */
  function resetSession(): void {
    localStorage.removeItem(STORAGE_KEY)
    dataset.value = null
    isModified.value = false
  }

  /**
   * Load legacy TrackTruths.json file
   */
  async function loadTrackTruths(url = '/TrackTruths.json'): Promise<void> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`Failed to load TrackTruths: ${response.status}`)
        return
      }

      const data = (await response.json()) as LegacyTrackTruths

      // Build lookup map
      const lookup = new Map<string, number>()
      for (const ann of data.annotations) {
        lookup.set(ann.globalTrackId, ann.personId)
      }
      trackTruthsLookup.value = lookup

      // Store persons with thumbnails
      if (data.persons && data.persons.length > 0) {
        trackTruthsPersons.value = data.persons
      }

      trackTruthsLoaded.value = true
      console.log(`Loaded ${lookup.size} track truths from TrackTruths.json`)
    } catch (err) {
      console.error('Failed to load TrackTruths:', err)
    }
  }

  /**
   * Get person ID for a track from legacy TrackTruths
   */
  function getTrackTruthPersonId(cameraId: string, trackId: number): number | null {
    const key = `${cameraId}-${trackId}`
    return trackTruthsLookup.value.get(key) ?? null
  }

  /**
   * Check if a detection has a track truth annotation
   */
  function hasTrackTruth(cameraId: string, trackId: number): boolean {
    const key = `${cameraId}-${trackId}`
    return trackTruthsLookup.value.has(key)
  }

  // Auto-save on changes
  watch(
    () => dataset.value?.annotations.length,
    () => {
      if (isModified.value) {
        saveToLocalStorage()
      }
    }
  )

  return {
    // State
    dataset,
    annotations,
    persons,
    isModified,
    totalAnnotations,
    annotationCountByPerson,
    trackTruthsLoaded,

    // Methods
    initializeSession,
    assignPerson,
    setWorldPosition,
    removeAnnotation,
    getAnnotationsAtTimestamp,
    getAnnotationForDetection,
    getPersonById,
    exportDataset,
    downloadDataset,
    importDataset,
    clearAnnotations,
    resetSession,
    loadTrackTruths,
    getTrackTruthPersonId,
    hasTrackTruth,
  }
}
