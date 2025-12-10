import { ref, reactive, computed } from 'vue'
import type { DetectionFile, FrameData, Detection } from '@/types/frame-review'
import type { TrackThumbnail, TrackThumbnailSet } from '@/types/track-identity'
import { AVAILABLE_VIDEOS } from '@/types/frame-review'

/** Camera ID to video source mapping */
const CAMERA_VIDEO_MAP: Record<string, string> = {
  camera1: 'hc3-preprocessed',
  camera2: 'hc4-preprocessed',
}

/** Number of thumbnails to extract per track */
const THUMBNAILS_PER_TRACK = 3

/** Padding around bounding box (as fraction of box size) */
const BBOX_PADDING = 0.1

/** Minimum time between thumbnail samples (seconds) */
const MIN_SAMPLE_INTERVAL = 1.0

/**
 * Camera data with loaded video and detections
 */
interface CameraVideoData {
  cameraId: string
  videoId: string
  videoPath: string
  videoElement: HTMLVideoElement | null
  detectionData: DetectionFile | null
  frameIndex: Map<number, FrameData>
  trackFrameIndex: Map<number, FrameData[]> // trackId -> frames containing this track
  isLoading: boolean
  isVideoReady: boolean
  error: string | null
}

/**
 * Track info extracted from detection files
 */
export interface OfflineTrackInfo {
  /** Unique key: cameraId-trackId */
  id: string
  cameraId: string
  trackId: number
  /** Number of frames this track appears in */
  frameCount: number
  /** First timestamp this track appears */
  firstSeen: number
  /** Last timestamp this track appears */
  lastSeen: number
  /** Average confidence across detections */
  avgConfidence: number
}

/**
 * Composable for extracting thumbnail images from video frames for tracks
 */
export function useTrackThumbnails() {
  // Camera data storage
  const cameras = reactive<Map<string, CameraVideoData>>(new Map())

  // Thumbnail cache: globalTrackId -> thumbnails
  const thumbnailCache = reactive<Map<string, TrackThumbnailSet>>(new Map())

  // Loading state
  const isInitialized = ref(false)
  const initError = ref<string | null>(null)

  /**
   * Initialize video and detection data for all cameras
   */
  async function initialize(): Promise<void> {
    if (isInitialized.value) return

    try {
      // Initialize each camera
      for (const [cameraId, videoId] of Object.entries(CAMERA_VIDEO_MAP)) {
        const videoOption = AVAILABLE_VIDEOS.find(v => v.id === videoId)
        if (!videoOption) {
          console.warn(`Video not found for camera ${cameraId}: ${videoId}`)
          continue
        }

        const cameraData: CameraVideoData = {
          cameraId,
          videoId,
          videoPath: videoOption.videoPath,
          videoElement: null,
          detectionData: null,
          frameIndex: new Map(),
          trackFrameIndex: new Map(),
          isLoading: true,
          isVideoReady: false,
          error: null,
        }
        cameras.set(cameraId, cameraData)

        // Load detection data
        try {
          const response = await fetch(videoOption.detectionsPath)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const data = (await response.json()) as DetectionFile
          cameraData.detectionData = data

          // Build frame index
          cameraData.frameIndex = new Map(data.frames.map(f => [f.frame_number, f]))

          // Build track-to-frames index for quick lookup
          for (const frame of data.frames) {
            for (const detection of frame.detections) {
              const trackId = detection.track_id
              if (!cameraData.trackFrameIndex.has(trackId)) {
                cameraData.trackFrameIndex.set(trackId, [])
              }
              cameraData.trackFrameIndex.get(trackId)!.push(frame)
            }
          }

          cameraData.isLoading = false
        } catch (e) {
          cameraData.error = e instanceof Error ? e.message : 'Unknown error'
          cameraData.isLoading = false
          console.error(`Failed to load detections for ${cameraId}:`, e)
        }

        // Create video element
        const video = document.createElement('video')
        video.src = videoOption.videoPath
        video.muted = true
        video.preload = 'auto'
        video.crossOrigin = 'anonymous'

        video.addEventListener('loadeddata', () => {
          cameraData.isVideoReady = true
        })

        video.addEventListener('error', () => {
          cameraData.error = 'Video failed to load'
        })

        cameraData.videoElement = video
      }

      isInitialized.value = true
    } catch (e) {
      initError.value = e instanceof Error ? e.message : 'Initialization failed'
      console.error('Failed to initialize track thumbnails:', e)
    }
  }

  /**
   * Wait for video to be ready and seeked to timestamp
   */
  function seekVideoToTimestamp(video: HTMLVideoElement, timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video seek timeout'))
      }, 5000)

      const onSeeked = () => {
        clearTimeout(timeout)
        video.removeEventListener('seeked', onSeeked)
        resolve()
      }

      video.addEventListener('seeked', onSeeked)
      video.currentTime = timestamp
    })
  }

  /**
   * Extract a cropped thumbnail from a video frame
   */
  async function extractThumbnail(
    cameraId: string,
    frame: FrameData,
    detection: Detection
  ): Promise<TrackThumbnail | null> {
    const camera = cameras.get(cameraId)
    if (!camera?.videoElement || !camera.isVideoReady) {
      return null
    }

    const video = camera.videoElement

    try {
      // Seek to the frame timestamp
      await seekVideoToTimestamp(video, frame.timestamp)

      // Create canvas for the full frame
      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = video.videoWidth
      frameCanvas.height = video.videoHeight
      const frameCtx = frameCanvas.getContext('2d')
      if (!frameCtx) return null

      // Draw video frame
      frameCtx.drawImage(video, 0, 0)

      // Calculate crop region with padding
      const bbox = detection.bbox
      const width = (bbox.right - bbox.left) * frameCanvas.width
      const height = (bbox.bottom - bbox.top) * frameCanvas.height
      const padX = width * BBOX_PADDING
      const padY = height * BBOX_PADDING

      const cropX = Math.max(0, bbox.left * frameCanvas.width - padX)
      const cropY = Math.max(0, bbox.top * frameCanvas.height - padY)
      const cropWidth = Math.min(frameCanvas.width - cropX, width + padX * 2)
      const cropHeight = Math.min(frameCanvas.height - cropY, height + padY * 2)

      // Create cropped canvas
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = Math.ceil(cropWidth)
      croppedCanvas.height = Math.ceil(cropHeight)
      const croppedCtx = croppedCanvas.getContext('2d')
      if (!croppedCtx) return null

      // Draw cropped region
      croppedCtx.drawImage(
        frameCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )

      // Convert to data URL (JPEG for smaller size)
      const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.85)

      return {
        dataUrl,
        frameNumber: frame.frame_number,
        timestamp: frame.timestamp,
        cameraId,
        confidence: detection.confidence,
      }
    } catch (e) {
      console.error('Failed to extract thumbnail:', e)
      return null
    }
  }

  /**
   * Select representative frames for a track (spread across its lifetime)
   */
  function selectRepresentativeFrames(
    frames: FrameData[],
    trackId: number,
    count: number = THUMBNAILS_PER_TRACK
  ): Array<{ frame: FrameData; detection: Detection }> {
    if (frames.length === 0) return []

    // Sort by timestamp
    const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp)

    // Filter frames that have good detections for this track
    const validFrames: Array<{ frame: FrameData; detection: Detection }> = []
    for (const frame of sorted) {
      const detection = frame.detections.find(d => d.track_id === trackId)
      if (detection && detection.confidence > 0.5) {
        validFrames.push({ frame, detection })
      }
    }

    if (validFrames.length === 0) return []
    if (validFrames.length <= count) return validFrames

    // Select frames spread across the track's lifetime
    const result: Array<{ frame: FrameData; detection: Detection }> = []
    const totalDuration =
      validFrames[validFrames.length - 1].frame.timestamp - validFrames[0].frame.timestamp

    if (totalDuration < MIN_SAMPLE_INTERVAL * (count - 1)) {
      // Track is too short, just take evenly spaced indices
      const step = Math.floor(validFrames.length / count)
      for (let i = 0; i < count && i * step < validFrames.length; i++) {
        result.push(validFrames[i * step])
      }
    } else {
      // Select frames at start, middle, and end
      const interval = totalDuration / (count - 1)
      const startTime = validFrames[0].frame.timestamp

      for (let i = 0; i < count; i++) {
        const targetTime = startTime + i * interval

        // Find closest frame to target time
        let bestIdx = 0
        let bestDiff = Infinity
        for (let j = 0; j < validFrames.length; j++) {
          const diff = Math.abs(validFrames[j].frame.timestamp - targetTime)
          if (diff < bestDiff) {
            bestDiff = diff
            bestIdx = j
          }
        }

        // Avoid duplicates
        if (!result.some(r => r.frame.frame_number === validFrames[bestIdx].frame.frame_number)) {
          result.push(validFrames[bestIdx])
        }
      }
    }

    // Sort result by timestamp
    result.sort((a, b) => a.frame.timestamp - b.frame.timestamp)
    return result
  }

  /**
   * Get thumbnails for a track, using cache or extracting new ones
   */
  async function getThumbnailsForTrack(
    globalTrackId: string,
    cameraAssociations: Map<string, { trackIds: number[] }>
  ): Promise<TrackThumbnailSet> {
    // Check cache first
    const cached = thumbnailCache.get(globalTrackId)
    if (cached && cached.thumbnails.length > 0) {
      return cached
    }

    const thumbnails: TrackThumbnail[] = []

    // Extract thumbnails from each camera that has seen this track
    for (const [cameraId, association] of cameraAssociations) {
      const camera = cameras.get(cameraId)
      if (!camera?.detectionData || !camera.isVideoReady) continue

      // Get all frames for any of the associated track IDs
      for (const trackId of association.trackIds) {
        const frames = camera.trackFrameIndex.get(trackId) || []
        const selected = selectRepresentativeFrames(frames, trackId, THUMBNAILS_PER_TRACK)

        for (const { frame, detection } of selected) {
          const thumbnail = await extractThumbnail(cameraId, frame, detection)
          if (thumbnail) {
            thumbnails.push(thumbnail)
          }

          // Limit total thumbnails
          if (thumbnails.length >= THUMBNAILS_PER_TRACK * 2) break
        }

        if (thumbnails.length >= THUMBNAILS_PER_TRACK * 2) break
      }

      if (thumbnails.length >= THUMBNAILS_PER_TRACK * 2) break
    }

    // Sort by confidence and take top N
    thumbnails.sort((a, b) => b.confidence - a.confidence)
    const finalThumbnails = thumbnails.slice(0, THUMBNAILS_PER_TRACK)

    const thumbnailSet: TrackThumbnailSet = {
      globalTrackId,
      thumbnails: finalThumbnails,
      updatedAt: Date.now(),
    }

    // Cache the result
    thumbnailCache.set(globalTrackId, thumbnailSet)

    return thumbnailSet
  }

  /**
   * Clear thumbnail cache for a track
   */
  function clearThumbnailCache(globalTrackId?: string): void {
    if (globalTrackId) {
      thumbnailCache.delete(globalTrackId)
    } else {
      thumbnailCache.clear()
    }
  }

  /**
   * Check if cameras are ready
   */
  function areCamerasReady(): boolean {
    for (const camera of cameras.values()) {
      if (!camera.isVideoReady || camera.isLoading) {
        return false
      }
    }
    return cameras.size > 0
  }

  /**
   * Get all unique tracks from detection files across all cameras
   */
  function getAllOfflineTracks(): OfflineTrackInfo[] {
    const tracks: OfflineTrackInfo[] = []

    for (const camera of cameras.values()) {
      if (!camera.detectionData) continue

      for (const [trackId, frames] of camera.trackFrameIndex) {
        if (frames.length === 0) continue

        // Calculate stats for this track
        let totalConfidence = 0
        let count = 0
        let firstSeen = Infinity
        let lastSeen = -Infinity

        for (const frame of frames) {
          const detection = frame.detections.find(d => d.track_id === trackId)
          if (detection) {
            totalConfidence += detection.confidence
            count++
            firstSeen = Math.min(firstSeen, frame.timestamp)
            lastSeen = Math.max(lastSeen, frame.timestamp)
          }
        }

        tracks.push({
          id: `${camera.cameraId}-${trackId}`,
          cameraId: camera.cameraId,
          trackId,
          frameCount: frames.length,
          firstSeen,
          lastSeen,
          avgConfidence: count > 0 ? totalConfidence / count : 0,
        })
      }
    }

    // Sort by camera, then by firstSeen timestamp
    tracks.sort((a, b) => {
      if (a.cameraId !== b.cameraId) {
        return a.cameraId.localeCompare(b.cameraId)
      }
      return a.firstSeen - b.firstSeen
    })

    return tracks
  }

  /**
   * Get thumbnails for an offline track (by camera and trackId)
   */
  async function getThumbnailsForOfflineTrack(
    cameraId: string,
    trackId: number
  ): Promise<TrackThumbnailSet> {
    const cacheKey = `${cameraId}-${trackId}`

    // Check cache first
    const cached = thumbnailCache.get(cacheKey)
    if (cached && cached.thumbnails.length > 0) {
      return cached
    }

    const camera = cameras.get(cameraId)
    if (!camera?.detectionData || !camera.isVideoReady) {
      return {
        globalTrackId: cacheKey,
        thumbnails: [],
        updatedAt: Date.now(),
      }
    }

    const frames = camera.trackFrameIndex.get(trackId) || []
    const selected = selectRepresentativeFrames(frames, trackId, THUMBNAILS_PER_TRACK)

    const thumbnails: TrackThumbnail[] = []
    for (const { frame, detection } of selected) {
      const thumbnail = await extractThumbnail(cameraId, frame, detection)
      if (thumbnail) {
        thumbnails.push(thumbnail)
      }
    }

    const thumbnailSet: TrackThumbnailSet = {
      globalTrackId: cacheKey,
      thumbnails,
      updatedAt: Date.now(),
    }

    // Cache the result
    thumbnailCache.set(cacheKey, thumbnailSet)

    return thumbnailSet
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    for (const camera of cameras.values()) {
      if (camera.videoElement) {
        camera.videoElement.pause()
        camera.videoElement.src = ''
        camera.videoElement = null
      }
    }
    cameras.clear()
    thumbnailCache.clear()
    isInitialized.value = false
  }

  return {
    // State
    cameras,
    thumbnailCache,
    isInitialized,
    initError,

    // Methods
    initialize,
    getThumbnailsForTrack,
    getThumbnailsForOfflineTrack,
    getAllOfflineTracks,
    clearThumbnailCache,
    areCamerasReady,
    cleanup,
  }
}
