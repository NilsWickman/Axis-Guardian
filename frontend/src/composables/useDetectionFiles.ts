/**
 * Composable for loading and querying detection files (.detections.json.gz)
 */

import { ref, computed } from 'vue'
import { inflate } from 'pako'
import type {
  CameraConfig,
  DetectionFileData,
  DetectionFrame,
  FileDetection,
  CameraDetections,
} from '@/types/keyframe-annotation'

interface LoadedCamera {
  config: CameraConfig
  data: DetectionFileData
  frameIndex: Map<number, DetectionFrame> // frameNumber -> frame
  timestampIndex: number[] // sorted timestamps for binary search
}

export function useDetectionFiles() {
  const loadedCameras = ref<Map<string, LoadedCamera>>(new Map())
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Computed: video duration (minimum across all cameras)
  const videoDuration = computed(() => {
    if (loadedCameras.value.size === 0) return 0
    return Math.min(
      ...Array.from(loadedCameras.value.values()).map((c) => c.data.video_info.duration)
    )
  })

  // Computed: total frames (minimum across all cameras)
  const totalFrames = computed(() => {
    if (loadedCameras.value.size === 0) return 0
    return Math.min(
      ...Array.from(loadedCameras.value.values()).map((c) => c.data.video_info.total_frames)
    )
  })

  // Computed: FPS (from first camera)
  const fps = computed(() => {
    const first = Array.from(loadedCameras.value.values())[0]
    return first?.data.video_info.fps ?? 30
  })

  /**
   * Load detection files for multiple cameras
   */
  async function loadCameras(cameras: CameraConfig[]): Promise<void> {
    isLoading.value = true
    loadError.value = null

    try {
      const results = await Promise.all(cameras.map((config) => loadCamera(config)))

      loadedCameras.value = new Map(
        results.filter((r): r is LoadedCamera => r !== null).map((r) => [r.config.id, r])
      )

      if (loadedCameras.value.size === 0) {
        loadError.value = 'No detection files could be loaded'
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : 'Failed to load detection files'
      console.error('Detection file load error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a single camera's detection file
   */
  async function loadCamera(config: CameraConfig): Promise<LoadedCamera | null> {
    try {
      const response = await fetch(config.detectionsPath)
      if (!response.ok) {
        console.warn(`Failed to load ${config.detectionsPath}: ${response.status}`)
        return null
      }

      let data: DetectionFileData

      // Check if server already decompressed the content (Content-Encoding: gzip)
      // In that case, browser auto-decompresses and we get plain JSON
      const contentEncoding = response.headers.get('Content-Encoding')
      const isAutoDecompressed = contentEncoding === 'gzip'

      if (config.detectionsPath.endsWith('.gz') && !isAutoDecompressed) {
        // Need to manually decompress gzip
        const buffer = await response.arrayBuffer()
        const decompressed = inflate(new Uint8Array(buffer))
        const text = new TextDecoder().decode(decompressed)
        data = JSON.parse(text)
      } else {
        // Plain JSON or auto-decompressed by browser
        data = await response.json()
      }

      // Build frame index
      const frameIndex = new Map<number, DetectionFrame>()
      const timestampIndex: number[] = []

      for (const frame of data.frames) {
        frameIndex.set(frame.frame_number, frame)
        timestampIndex.push(frame.timestamp)
      }

      return {
        config,
        data,
        frameIndex,
        timestampIndex,
      }
    } catch (err) {
      console.error(`Error loading ${config.detectionsPath}:`, err)
      return null
    }
  }

  /**
   * Get detections for a camera at a specific timestamp
   * Uses binary search to find nearest frame
   */
  function getDetectionsAtTimestamp(cameraId: string, timestamp: number): FileDetection[] {
    const camera = loadedCameras.value.get(cameraId)
    if (!camera) return []

    const frame = findNearestFrame(camera, timestamp)
    return frame?.detections ?? []
  }

  /**
   * Get frame at a specific timestamp for a camera
   */
  function getFrameAtTimestamp(cameraId: string, timestamp: number): DetectionFrame | null {
    const camera = loadedCameras.value.get(cameraId)
    if (!camera) return null

    return findNearestFrame(camera, timestamp)
  }

  /**
   * Get detections for all cameras at a timestamp
   */
  function getAllCameraDetections(timestamp: number): CameraDetections[] {
    return Array.from(loadedCameras.value.entries()).map(([cameraId, camera]) => {
      const frame = findNearestFrame(camera, timestamp)
      return {
        cameraId,
        detections: frame?.detections ?? [],
        frameNumber: frame?.frame_number ?? 0,
      }
    })
  }

  /**
   * Binary search to find nearest frame to a timestamp
   */
  function findNearestFrame(camera: LoadedCamera, timestamp: number): DetectionFrame | null {
    const { timestampIndex, data } = camera

    if (timestampIndex.length === 0) return null

    // Binary search for nearest timestamp
    let left = 0
    let right = timestampIndex.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (timestampIndex[mid] < timestamp) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    // Check if left or left-1 is closer
    let bestIdx = left
    if (left > 0) {
      const diffLeft = Math.abs(timestampIndex[left] - timestamp)
      const diffPrev = Math.abs(timestampIndex[left - 1] - timestamp)
      if (diffPrev < diffLeft) {
        bestIdx = left - 1
      }
    }

    return data.frames[bestIdx] ?? null
  }

  /**
   * Get frame number from timestamp
   */
  function timestampToFrameNumber(timestamp: number): number {
    return Math.round(timestamp * fps.value)
  }

  /**
   * Get timestamp from frame number
   */
  function frameNumberToTimestamp(frameNumber: number): number {
    return frameNumber / fps.value
  }

  /**
   * Get all camera IDs
   */
  const cameraIds = computed(() => Array.from(loadedCameras.value.keys()))

  return {
    // State
    loadedCameras,
    isLoading,
    loadError,

    // Computed
    videoDuration,
    totalFrames,
    fps,
    cameraIds,

    // Methods
    loadCameras,
    getDetectionsAtTimestamp,
    getFrameAtTimestamp,
    getAllCameraDetections,
    timestampToFrameNumber,
    frameNumberToTimestamp,
  }
}
