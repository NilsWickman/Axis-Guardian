import { ref, computed } from 'vue'
import type {
  GroundTruthDataset,
  FrameAnnotation,
  AnnotationSession,
} from '@/types/ground-truth'
import { createEmptyDataset, calculateStats } from '@/types/ground-truth'
import type { FrameData } from '@/types/frame-review'

const STORAGE_KEY_PREFIX = 'ground-truth-'

/**
 * Composable for managing ground truth annotations.
 * Handles loading, saving, and editing annotation data.
 */
export function useGroundTruthAnnotation() {
  const dataset = ref<GroundTruthDataset | null>(null)
  const session = ref<AnnotationSession>({
    videoId: '',
    cameraId: '',
    currentFrame: 0,
    selectedDetectionIndex: null,
    isModified: false,
    lastSavedAt: null
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed helpers
  const currentFrameAnnotation = computed<FrameAnnotation | null>(() => {
    if (!dataset.value) return null
    return dataset.value.annotations.find(
      a => a.frameNumber === session.value.currentFrame
    ) ?? null
  })

  const annotationProgress = computed(() => {
    if (!dataset.value) return { percent: 0, annotated: 0, total: 0 }
    const { annotatedDetections, totalDetections } = dataset.value.stats
    return {
      percent: totalDetections > 0 ? Math.round((annotatedDetections / totalDetections) * 100) : 0,
      annotated: annotatedDetections,
      total: totalDetections
    }
  })

  /**
   * Initialize a new annotation session from detection data
   */
  function initializeFromDetections(
    videoId: string,
    cameraId: string,
    frames: FrameData[],
    roomWidth: number,
    roomHeight: number
  ): void {
    // Try to load existing annotations from localStorage
    const storageKey = `${STORAGE_KEY_PREFIX}${videoId}`
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GroundTruthDataset
        dataset.value = parsed
        session.value = {
          videoId,
          cameraId,
          currentFrame: 0,
          selectedDetectionIndex: null,
          isModified: false,
          lastSavedAt: parsed.updatedAt
        }
        console.log(`Loaded ${parsed.stats.annotatedDetections} existing annotations for ${videoId}`)
        return
      } catch (e) {
        console.warn('Failed to parse saved annotations, starting fresh:', e)
      }
    }

    // Create new dataset from detection frames
    const newDataset = createEmptyDataset(videoId, cameraId, roomWidth, roomHeight)

    // Convert detection frames to annotation frames
    newDataset.annotations = frames
      .filter(f => f.detections.length > 0)
      .map(frame => ({
        frameNumber: frame.frame_number,
        timestamp: frame.timestamp,
        detections: frame.detections.map(det => ({
          trackId: det.track_id,
          bbox: { ...det.bbox },
          groundPosition: null,
          confidence: 'certain' as const
        }))
      }))

    newDataset.stats = calculateStats(newDataset.annotations)

    dataset.value = newDataset
    session.value = {
      videoId,
      cameraId,
      currentFrame: frames[0]?.frame_number ?? 0,
      selectedDetectionIndex: null,
      isModified: false,
      lastSavedAt: null
    }
  }

  /**
   * Set ground truth position for a detection
   */
  function setGroundPosition(
    frameNumber: number,
    detectionIndex: number,
    position: { x: number; y: number },
    confidence: 'certain' | 'estimated' | 'uncertain' = 'certain'
  ): void {
    if (!dataset.value) return

    const frameAnnotation = dataset.value.annotations.find(
      a => a.frameNumber === frameNumber
    )
    if (!frameAnnotation) return

    const detection = frameAnnotation.detections[detectionIndex]
    if (!detection) return

    detection.groundPosition = { ...position }
    detection.confidence = confidence
    detection.annotatedAt = new Date().toISOString()

    // Update stats
    dataset.value.stats = calculateStats(dataset.value.annotations)
    dataset.value.updatedAt = new Date().toISOString()
    session.value.isModified = true
  }

  /**
   * Clear ground truth position for a detection
   */
  function clearGroundPosition(frameNumber: number, detectionIndex: number): void {
    if (!dataset.value) return

    const frameAnnotation = dataset.value.annotations.find(
      a => a.frameNumber === frameNumber
    )
    if (!frameAnnotation) return

    const detection = frameAnnotation.detections[detectionIndex]
    if (!detection) return

    detection.groundPosition = null
    detection.annotatedAt = undefined

    // Update stats
    dataset.value.stats = calculateStats(dataset.value.annotations)
    dataset.value.updatedAt = new Date().toISOString()
    session.value.isModified = true
  }

  /**
   * Navigate to a specific frame
   */
  function goToFrame(frameNumber: number): void {
    session.value.currentFrame = frameNumber
    session.value.selectedDetectionIndex = null
  }

  /**
   * Navigate to next/previous frame with detections
   */
  function goToNextFrame(): void {
    if (!dataset.value) return
    const currentIdx = dataset.value.annotations.findIndex(
      a => a.frameNumber === session.value.currentFrame
    )
    if (currentIdx < dataset.value.annotations.length - 1) {
      session.value.currentFrame = dataset.value.annotations[currentIdx + 1].frameNumber
      session.value.selectedDetectionIndex = null
    }
  }

  function goToPrevFrame(): void {
    if (!dataset.value) return
    const currentIdx = dataset.value.annotations.findIndex(
      a => a.frameNumber === session.value.currentFrame
    )
    if (currentIdx > 0) {
      session.value.currentFrame = dataset.value.annotations[currentIdx - 1].frameNumber
      session.value.selectedDetectionIndex = null
    }
  }

  /**
   * Navigate to next unannotated detection
   */
  function goToNextUnannotated(): void {
    if (!dataset.value) return

    // Find first unannotated detection after current position
    const currentIdx = dataset.value.annotations.findIndex(
      a => a.frameNumber === session.value.currentFrame
    )

    for (let i = currentIdx; i < dataset.value.annotations.length; i++) {
      const frame = dataset.value.annotations[i]
      const unannotatedIdx = frame.detections.findIndex(d => d.groundPosition === null)

      if (unannotatedIdx !== -1) {
        // Skip current selection
        if (i === currentIdx && unannotatedIdx === session.value.selectedDetectionIndex) {
          // Look for next unannotated in same frame
          const nextUnannotated = frame.detections.findIndex(
            (d, idx) => idx > unannotatedIdx && d.groundPosition === null
          )
          if (nextUnannotated !== -1) {
            session.value.selectedDetectionIndex = nextUnannotated
            return
          }
          continue
        }

        session.value.currentFrame = frame.frameNumber
        session.value.selectedDetectionIndex = unannotatedIdx
        return
      }
    }

    // Wrap around to beginning
    for (let i = 0; i < currentIdx; i++) {
      const frame = dataset.value.annotations[i]
      const unannotatedIdx = frame.detections.findIndex(d => d.groundPosition === null)

      if (unannotatedIdx !== -1) {
        session.value.currentFrame = frame.frameNumber
        session.value.selectedDetectionIndex = unannotatedIdx
        return
      }
    }
  }

  /**
   * Select a detection by index
   */
  function selectDetection(index: number | null): void {
    session.value.selectedDetectionIndex = index
  }

  /**
   * Save annotations to localStorage
   */
  function saveToLocalStorage(): void {
    if (!dataset.value || !session.value.videoId) return

    const storageKey = `${STORAGE_KEY_PREFIX}${session.value.videoId}`
    localStorage.setItem(storageKey, JSON.stringify(dataset.value))
    session.value.lastSavedAt = new Date().toISOString()
    session.value.isModified = false
    console.log(`Saved annotations for ${session.value.videoId}`)
  }

  /**
   * Export annotations as JSON file
   */
  function exportAsJson(): void {
    if (!dataset.value) return

    const blob = new Blob([JSON.stringify(dataset.value, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ground-truth-${session.value.videoId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Export in calibration tool format (simple position list)
   */
  function exportForCalibration(): string {
    if (!dataset.value) return ''

    const positions: string[] = []

    for (const frame of dataset.value.annotations) {
      for (const det of frame.detections) {
        if (det.groundPosition) {
          positions.push(`${det.groundPosition.x.toFixed(2)},${det.groundPosition.y.toFixed(2)}`)
        }
      }
    }

    return positions.join(';')
  }

  /**
   * Import annotations from JSON file
   */
  async function importFromJson(file: File): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const text = await file.text()
      const imported = JSON.parse(text) as GroundTruthDataset

      if (imported.version !== '1.0') {
        throw new Error(`Unsupported version: ${imported.version}`)
      }

      dataset.value = imported
      session.value = {
        videoId: imported.videoFile,
        cameraId: imported.cameraId,
        currentFrame: imported.annotations[0]?.frameNumber ?? 0,
        selectedDetectionIndex: null,
        isModified: false,
        lastSavedAt: imported.updatedAt
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to import file'
      console.error('Import error:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get list of frames with annotations for quick navigation
   */
  const annotatedFrames = computed(() => {
    if (!dataset.value) return []
    return dataset.value.annotations
      .filter(a => a.detections.some(d => d.groundPosition !== null))
      .map(a => a.frameNumber)
  })

  /**
   * Get frame numbers for navigation
   */
  const frameNumbers = computed(() => {
    if (!dataset.value) return []
    return dataset.value.annotations.map(a => a.frameNumber)
  })

  return {
    // State
    dataset,
    session,
    isLoading,
    error,

    // Computed
    currentFrameAnnotation,
    annotationProgress,
    annotatedFrames,
    frameNumbers,

    // Methods
    initializeFromDetections,
    setGroundPosition,
    clearGroundPosition,
    goToFrame,
    goToNextFrame,
    goToPrevFrame,
    goToNextUnannotated,
    selectDetection,
    saveToLocalStorage,
    exportAsJson,
    exportForCalibration,
    importFromJson
  }
}
