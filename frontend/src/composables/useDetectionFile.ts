import { ref, computed } from 'vue'
import type { DetectionFile, FrameData, VideoInfo } from '@/types/frame-review'

/**
 * Composable for loading and accessing detection data from preprocessed video files.
 * Loads gzipped JSON detection files and provides O(1) frame lookup.
 */
export function useDetectionFile() {
  const detectionData = ref<DetectionFile | null>(null)
  const frameIndex = ref<Map<number, FrameData>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const videoInfo = computed<VideoInfo | null>(() => detectionData.value?.video_info ?? null)
  const fps = computed(() => videoInfo.value?.fps ?? 30)
  const totalFrames = computed(() => videoInfo.value?.total_frames ?? 0)
  const duration = computed(() => videoInfo.value?.duration_seconds ?? 0)

  /**
   * Load a detection file from a URL.
   * Supports both .json and .json.gz files (browser handles gzip decompression).
   */
  async function loadDetectionFile(url: string): Promise<void> {
    isLoading.value = true
    error.value = null
    detectionData.value = null
    frameIndex.value = new Map()

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch detection file: ${response.status} ${response.statusText}`)
      }

      const text = await response.text()
      const data = JSON.parse(text) as DetectionFile

      detectionData.value = data

      // Build frame index for O(1) lookup
      frameIndex.value = new Map(
        data.frames.map(frame => [frame.frame_number, frame])
      )

      console.log(`Loaded detection file: ${data.frames.length} frames, ${data.video_info.fps} fps`)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error loading detection file'
      console.error('Error loading detection file:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get detection data for a specific frame number.
   * Returns null if frame not found.
   */
  function getFrameData(frameNumber: number): FrameData | null {
    return frameIndex.value.get(frameNumber) ?? null
  }

  /**
   * Find the nearest frame with detections.
   * Useful when seeking to frames that may not have detection data.
   */
  function findNearestFrameWithDetections(
    frameNumber: number,
    direction: 'forward' | 'backward' | 'nearest' = 'nearest'
  ): FrameData | null {
    const data = detectionData.value
    if (!data || data.frames.length === 0) return null

    if (direction === 'forward') {
      return data.frames.find(f => f.frame_number >= frameNumber && f.detections.length > 0) ?? null
    }

    if (direction === 'backward') {
      for (let i = data.frames.length - 1; i >= 0; i--) {
        const frame = data.frames[i]
        if (frame.frame_number <= frameNumber && frame.detections.length > 0) {
          return frame
        }
      }
      return null
    }

    // Nearest: find closest frame with detections in either direction
    let nearest: FrameData | null = null
    let minDistance = Infinity

    for (const frame of data.frames) {
      if (frame.detections.length > 0) {
        const distance = Math.abs(frame.frame_number - frameNumber)
        if (distance < minDistance) {
          minDistance = distance
          nearest = frame
        }
      }
    }

    return nearest
  }

  /**
   * Convert frame number to video timestamp in seconds.
   */
  function frameToTime(frameNumber: number): number {
    return frameNumber / fps.value
  }

  /**
   * Convert video timestamp to frame number.
   */
  function timeToFrame(timeSeconds: number): number {
    return Math.round(timeSeconds * fps.value)
  }

  /**
   * Clear loaded detection data.
   */
  function clear(): void {
    detectionData.value = null
    frameIndex.value = new Map()
    error.value = null
  }

  return {
    // State
    detectionData,
    isLoading,
    error,

    // Computed
    videoInfo,
    fps,
    totalFrames,
    duration,

    // Methods
    loadDetectionFile,
    getFrameData,
    findNearestFrameWithDetections,
    frameToTime,
    timeToFrame,
    clear,
  }
}
