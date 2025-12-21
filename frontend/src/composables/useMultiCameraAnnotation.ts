import { ref, computed, reactive } from 'vue'
import type {
  CrossCameraDataset,
  CrossCameraAnnotation,
  LinkedDetection,
} from '@/types/ground-truth'
import {
  createEmptyCrossCameraDataset,
  generateAnnotationId,
  calculateCrossCameraStats,
} from '@/types/ground-truth'
import type { DetectionFile, FrameData } from '@/types/frame-review'
import { normalizeBbox } from '@/types/frame-review'

const STORAGE_KEY = 'cross-camera-ground-truth'

/** Camera data with loaded detections */
export interface CameraData {
  cameraId: string
  videoFile: string
  detectionsFile: string
  videoPath: string
  detectionData: DetectionFile | null
  frameIndex: Map<number, FrameData>
  isLoading: boolean
  error: string | null
}

/** Selection state for a single detection */
export interface DetectionSelection {
  cameraId: string
  frameNumber: number
  timestamp: number
  detectionIndex: number
  trackId: number
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
}

/**
 * Composable for managing cross-camera ground truth annotations.
 * Supports loading multiple camera feeds and annotating shared positions.
 */
export function useMultiCameraAnnotation() {
  // Dataset state
  const dataset = ref<CrossCameraDataset | null>(null)

  // Camera data
  const cameras = reactive<Map<string, CameraData>>(new Map())

  // Current state
  const currentTimestamp = ref(0)
  const activeCamera = ref<string | null>(null)

  // Selection state - detections selected across cameras
  const selectedDetections = ref<DetectionSelection[]>([])

  // Session state
  const isModified = ref(false)
  const lastSavedAt = ref<string | null>(null)

  // Computed
  const cameraList = computed(() => Array.from(cameras.values()))

  const activeCameraData = computed<CameraData | null>(() => {
    if (!activeCamera.value) return null
    return cameras.get(activeCamera.value) ?? null
  })

  const currentFrameData = computed<FrameData | null>(() => {
    const cam = activeCameraData.value
    if (!cam || !cam.detectionData) return null

    // Find frame closest to current timestamp
    return findFrameAtTimestamp(cam, currentTimestamp.value)
  })

  const stats = computed(() => {
    if (!dataset.value) return null
    return calculateCrossCameraStats(dataset.value)
  })

  // Find frame at or near timestamp
  function findFrameAtTimestamp(camera: CameraData, timestamp: number): FrameData | null {
    if (!camera.detectionData) return null

    const frames = camera.detectionData.frames
    if (frames.length === 0) return null

    // Binary search for closest frame
    let low = 0
    let high = frames.length - 1

    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      if (frames[mid].timestamp < timestamp) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    // Check if the previous frame is closer
    if (low > 0) {
      const prevDiff = Math.abs(frames[low - 1].timestamp - timestamp)
      const currDiff = Math.abs(frames[low].timestamp - timestamp)
      if (prevDiff < currDiff) {
        return frames[low - 1]
      }
    }

    return frames[low]
  }

  // Get frame number for a camera at current timestamp
  function getFrameNumberAtTimestamp(cameraId: string, timestamp: number): number | null {
    const cam = cameras.get(cameraId)
    if (!cam) return null
    const frame = findFrameAtTimestamp(cam, timestamp)
    return frame?.frame_number ?? null
  }

  /**
   * Initialize cameras and load detection files
   */
  async function initializeCameras(
    cameraSources: Array<{
      cameraId: string
      videoFile: string
      videoPath: string
      detectionsPath: string
    }>,
    roomWidth: number,
    roomHeight: number
  ): Promise<void> {
    // Try to load existing dataset from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CrossCameraDataset
        if (parsed.version === '2.0') {
          dataset.value = parsed
          lastSavedAt.value = parsed.updatedAt
        }
      } catch (e) {
      }
    }

    // Create new dataset if none exists
    if (!dataset.value) {
      dataset.value = createEmptyCrossCameraDataset(
        cameraSources.map(s => ({
          cameraId: s.cameraId,
          videoFile: s.videoFile,
          detectionsFile: s.detectionsPath,
        })),
        roomWidth,
        roomHeight
      )
    }

    // Load detection files for each camera
    for (const source of cameraSources) {
      const cameraData: CameraData = {
        cameraId: source.cameraId,
        videoFile: source.videoFile,
        detectionsFile: source.detectionsPath,
        videoPath: source.videoPath,
        detectionData: null,
        frameIndex: new Map(),
        isLoading: true,
        error: null,
      }
      cameras.set(source.cameraId, cameraData)

      // Load detection file
      try {
        const response = await fetch(source.detectionsPath)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json() as DetectionFile
        cameraData.detectionData = data
        cameraData.frameIndex = new Map(
          data.frames.map(f => [f.frame_number, f])
        )
        cameraData.isLoading = false
      } catch (e) {
        cameraData.error = e instanceof Error ? e.message : 'Unknown error'
        cameraData.isLoading = false
      }
    }

    // Set first camera as active
    if (cameraSources.length > 0) {
      activeCamera.value = cameraSources[0].cameraId
    }
  }

  /**
   * Navigate to a specific timestamp (synced across cameras)
   */
  function goToTimestamp(timestamp: number): void {
    currentTimestamp.value = Math.max(0, timestamp)
  }

  /**
   * Navigate to next frame with detections (in active camera)
   */
  function goToNextFrame(): void {
    const cam = activeCameraData.value
    if (!cam?.detectionData) return

    const frames = cam.detectionData.frames
    const currentFrame = findFrameAtTimestamp(cam, currentTimestamp.value)
    if (!currentFrame) return

    const currentIdx = frames.findIndex(f => f.frame_number === currentFrame.frame_number)
    if (currentIdx < frames.length - 1) {
      currentTimestamp.value = frames[currentIdx + 1].timestamp
    }
  }

  /**
   * Navigate to previous frame with detections (in active camera)
   */
  function goToPrevFrame(): void {
    const cam = activeCameraData.value
    if (!cam?.detectionData) return

    const frames = cam.detectionData.frames
    const currentFrame = findFrameAtTimestamp(cam, currentTimestamp.value)
    if (!currentFrame) return

    const currentIdx = frames.findIndex(f => f.frame_number === currentFrame.frame_number)
    if (currentIdx > 0) {
      currentTimestamp.value = frames[currentIdx - 1].timestamp
    }
  }

  /**
   * Switch active camera
   */
  function setActiveCamera(cameraId: string): void {
    if (cameras.has(cameraId)) {
      activeCamera.value = cameraId
    }
  }

  /**
   * Check if a track is already annotated at the current timestamp
   * @param cameraId - Camera ID
   * @param trackId - Track ID
   * @param toleranceSeconds - Time window to check for existing annotations (default 0.5s)
   */
  function isTrackAlreadyAnnotated(
    cameraId: string,
    trackId: number,
    toleranceSeconds: number = 0.5
  ): CrossCameraAnnotation | null {
    if (!dataset.value) return null

    for (const ann of dataset.value.annotations) {
      // Only check annotations near current timestamp
      if (Math.abs(ann.timestamp - currentTimestamp.value) > toleranceSeconds) {
        continue
      }

      for (const det of ann.linkedDetections) {
        if (det.cameraId === cameraId && det.trackId === trackId) {
          return ann
        }
      }
    }
    return null
  }

  /**
   * Toggle selection of a detection
   */
  function toggleDetectionSelection(
    cameraId: string,
    detectionIndex: number
  ): { success: boolean; reason?: string } {
    const cam = cameras.get(cameraId)
    if (!cam?.detectionData) return { success: false, reason: 'Camera not found' }

    const frame = findFrameAtTimestamp(cam, currentTimestamp.value)
    if (!frame) return { success: false, reason: 'Frame not found' }

    const detection = frame.detections[detectionIndex]
    if (!detection) return { success: false, reason: 'Detection not found' }

    // Check if already selected (allow deselect)
    const existingIdx = selectedDetections.value.findIndex(
      s => s.cameraId === cameraId &&
           s.frameNumber === frame.frame_number &&
           s.detectionIndex === detectionIndex
    )

    if (existingIdx >= 0) {
      // Deselect
      selectedDetections.value.splice(existingIdx, 1)
      return { success: true }
    }

    // Check if this track is already annotated at this timestamp
    const existingAnnotation = isTrackAlreadyAnnotated(cameraId, detection.track_id)
    if (existingAnnotation) {
      return {
        success: false,
        reason: `Track ${detection.track_id} already annotated at this timestamp (${existingAnnotation.groundPosition.x.toFixed(2)}, ${existingAnnotation.groundPosition.y.toFixed(2)})`
      }
    }

    // Select
    const normalizedBbox = normalizeBbox(detection.bbox)
    selectedDetections.value.push({
      cameraId,
      frameNumber: frame.frame_number,
      timestamp: frame.timestamp,
      detectionIndex,
      trackId: detection.track_id,
      bbox: normalizedBbox,
    })
    return { success: true }
  }

  /**
   * Check if a detection is selected
   */
  function isDetectionSelected(cameraId: string, detectionIndex: number): boolean {
    const cam = cameras.get(cameraId)
    if (!cam?.detectionData) return false

    const frame = findFrameAtTimestamp(cam, currentTimestamp.value)
    if (!frame) return false

    return selectedDetections.value.some(
      s => s.cameraId === cameraId &&
           s.frameNumber === frame.frame_number &&
           s.detectionIndex === detectionIndex
    )
  }

  /**
   * Get selections for a specific camera
   */
  function getSelectionsForCamera(cameraId: string): DetectionSelection[] {
    return selectedDetections.value.filter(s => s.cameraId === cameraId)
  }

  /**
   * Clear all selections
   */
  function clearSelections(): void {
    selectedDetections.value = []
  }

  /**
   * Create annotation at ground position from current selections
   */
  function createAnnotation(
    groundPosition: { x: number; y: number },
    confidence: 'certain' | 'estimated' | 'uncertain' = 'certain'
  ): CrossCameraAnnotation | null {
    if (!dataset.value || selectedDetections.value.length === 0) return null

    // Build linked detections from selections
    const linkedDetections: LinkedDetection[] = selectedDetections.value.map(sel => {
      const cam = cameras.get(sel.cameraId)
      return {
        cameraId: sel.cameraId,
        videoFile: cam?.videoFile ?? '',
        frameNumber: sel.frameNumber,
        timestamp: sel.timestamp,
        trackId: sel.trackId,
        bbox: sel.bbox,
      }
    })

    // Use average timestamp as reference
    const avgTimestamp = linkedDetections.reduce((sum, d) => sum + d.timestamp, 0) / linkedDetections.length

    const annotation: CrossCameraAnnotation = {
      id: generateAnnotationId(),
      groundPosition,
      timestamp: avgTimestamp,
      confidence,
      annotatedAt: new Date().toISOString(),
      linkedDetections,
    }

    dataset.value.annotations.push(annotation)
    dataset.value.updatedAt = new Date().toISOString()
    isModified.value = true

    // Clear selections after creating annotation
    clearSelections()

    return annotation
  }

  /**
   * Delete an annotation by ID
   */
  function deleteAnnotation(annotationId: string): void {
    if (!dataset.value) return

    const idx = dataset.value.annotations.findIndex(a => a.id === annotationId)
    if (idx >= 0) {
      dataset.value.annotations.splice(idx, 1)
      dataset.value.updatedAt = new Date().toISOString()
      isModified.value = true
    }
  }

  /**
   * Get annotations near current timestamp
   */
  function getAnnotationsNearTimestamp(toleranceSeconds: number = 0.5): CrossCameraAnnotation[] {
    if (!dataset.value) return []

    return dataset.value.annotations.filter(
      a => Math.abs(a.timestamp - currentTimestamp.value) <= toleranceSeconds
    )
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
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cross-camera-ground-truth-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Export in calibration tool format (CSV-like)
   */
  function exportForCalibration(): string {
    if (!dataset.value) return ''

    // Format: cameraId,trackId,x,y per line
    const lines: string[] = []

    for (const ann of dataset.value.annotations) {
      for (const det of ann.linkedDetections) {
        lines.push(
          `${det.cameraId},${det.trackId},${ann.groundPosition.x.toFixed(3)},${ann.groundPosition.y.toFixed(3)}`
        )
      }
    }

    return lines.join('\n')
  }

  /**
   * Import from JSON file
   */
  async function importFromJson(file: File): Promise<void> {
    try {
      const text = await file.text()
      const imported = JSON.parse(text) as CrossCameraDataset

      if (imported.version !== '2.0') {
        throw new Error(`Unsupported version: ${imported.version}`)
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
   * Get total duration based on loaded cameras
   */
  const totalDuration = computed(() => {
    let maxDuration = 0
    for (const cam of cameras.values()) {
      if (cam.detectionData) {
        maxDuration = Math.max(maxDuration, cam.detectionData.video_info.duration_seconds)
      }
    }
    return maxDuration
  })

  return {
    // State
    dataset,
    cameras,
    currentTimestamp,
    activeCamera,
    selectedDetections,
    isModified,
    lastSavedAt,

    // Computed
    cameraList,
    activeCameraData,
    currentFrameData,
    stats,
    totalDuration,

    // Methods
    initializeCameras,
    goToTimestamp,
    goToNextFrame,
    goToPrevFrame,
    setActiveCamera,
    toggleDetectionSelection,
    isDetectionSelected,
    isTrackAlreadyAnnotated,
    getSelectionsForCamera,
    clearSelections,
    createAnnotation,
    deleteAnnotation,
    getAnnotationsNearTimestamp,
    getFrameNumberAtTimestamp,
    saveToLocalStorage,
    exportAsJson,
    exportForCalibration,
    importFromJson,
  }
}
