/**
 * Composable for tracking person positions on the site map from camera detections
 *
 * This composable listens to both:
 * 1. Detection store (for mock/API detections)
 * 2. WebRTC data channel detections (for real-time streaming)
 *
 * It routes all detections through the global track store for cross-camera correlation.
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDetectionStore } from '../stores/detections'
import { usePersonPositionStore, type PersonPosition } from '../stores/personPositions'
import { useGlobalTrackStore } from '../stores/globalTracks'
import { useSiteMapStore } from '../stores/siteMaps'
import type { Detection } from '../types/generated'
import type { DetectionMetadata } from './useWebRTCDetection'
import { projectDetectionToWorld } from '../utils/projectionBridge'
import { normalizedToApiBbox } from '../types/detection.types'

// Only track HC3 camera (camera1) for now
const TRACKED_CAMERA_ID: string | null = 'camera1'

export interface UsePersonPositionTrackingOptions {
  enabled?: boolean
  updateIntervalMs?: number
  minConfidence?: number // Minimum detection confidence to track
  enableWebRTCIntegration?: boolean // Listen to WebRTC data channels
}

// Global event bus for WebRTC detections
// Use a Set for O(1) add/remove and automatic deduplication
const webrtcDetectionHandlers = new Set<(metadata: DetectionMetadata) => void>()

export function registerWebRTCDetectionHandler(handler: (metadata: DetectionMetadata) => void) {
  // Prevent duplicate registrations
  if (webrtcDetectionHandlers.has(handler)) {
    console.warn('[PersonPositionTracking] Handler already registered, skipping duplicate')
    return () => {
      webrtcDetectionHandlers.delete(handler)
    }
  }

  webrtcDetectionHandlers.add(handler)
  return () => {
    webrtcDetectionHandlers.delete(handler)
  }
}

export function emitWebRTCDetection(metadata: DetectionMetadata) {
  webrtcDetectionHandlers.forEach(handler => handler(metadata))
}

// Camera ID mapping (emulator uses camera-HC3/HC4, frontend uses camera1/camera2)
const CAMERA_ID_MAP: Record<string, string> = {
  'camera-HC3': 'camera1',
  'camera-HC4': 'camera2',
  'camera-IP2': 'camera3',
  'camera-IP5': 'camera4',
}

/**
 * Normalize camera ID from emulator format to frontend format
 */
function normalizeCameraId(cameraId: string): string {
  return CAMERA_ID_MAP[cameraId] || cameraId
}

export function usePersonPositionTracking(options: UsePersonPositionTrackingOptions = {}) {
  const {
    enabled = true,
    updateIntervalMs = 1000, // Update every 1000ms (was 500ms - reduced CPU pressure)
    minConfidence = 0.5,
    enableWebRTCIntegration = true,
  } = options

  const detectionStore = useDetectionStore()
  const positionStore = usePersonPositionStore()
  const globalTrackStore = useGlobalTrackStore()
  const siteMapStore = useSiteMapStore()

  const isTracking = ref(enabled)
  const lastProcessedDetectionIds = ref(new Set<string>())
  const lastProcessedFrames = ref(new Map<string, number>()) // Track last processed frame per camera
  const processingError = ref<string | null>(null)

  let updateInterval: ReturnType<typeof setInterval> | null = null
  let cleanupInterval: ReturnType<typeof setInterval> | null = null
  let unregisterWebRTC: (() => void) | null = null

  /**
   * Process WebRTC detection metadata
   */
  function processWebRTCDetections(metadata: DetectionMetadata) {
    try {
      // Normalize camera ID from emulator format to frontend format
      const normalizedCameraId = normalizeCameraId(metadata.camera_id)

      // Skip if not the tracked camera (single camera mode)
      if (TRACKED_CAMERA_ID !== null && normalizedCameraId !== TRACKED_CAMERA_ID) {
        return
      }

      // Skip if this frame was already processed
      const lastFrame = lastProcessedFrames.value.get(normalizedCameraId)
      if (lastFrame !== undefined && metadata.frame_number <= lastFrame) {
        return
      }
      lastProcessedFrames.value.set(normalizedCameraId, metadata.frame_number)

      // Get current site map
      const siteMap = siteMapStore.activeSiteMap
      if (!siteMap) {
        return
      }

      // Find camera placement on site map using normalized camera ID
      const cameraPlacement = siteMap.cameras.find(c => c.cameraId === normalizedCameraId)
      if (!cameraPlacement) {
        return
      }

      // Filter for person detections only
      const personDetections = metadata.detections.filter(
        det => det.class_name === 'person' && det.confidence >= minConfidence
      )

      if (personDetections.length === 0) {
        return
      }

      // Transform each detection to world coordinates and route through global track store
      const newPositions: PersonPosition[] = []

      personDetections.forEach((detection, idx) => {
        try {
          // Convert normalized bbox (0-1) to pixel coordinates for transform
          const pixelBbox = normalizedToApiBbox(detection.bbox, 1920, 1080)

          // Create a Detection object compatible with our transform function
          const det = {
            id: `${normalizedCameraId}-${metadata.frame_number}-${idx}`,
            timestamp: new Date(metadata.timestamp * 1000).toISOString(),
            cameraId: normalizedCameraId,
            type: 'person' as const,
            confidence: detection.confidence,
            bbox: pixelBbox,
          }

          // Transform using the new projection bridge
          const result = projectDetectionToWorld(det, cameraPlacement, false)

          // Skip invalid projections (outside FOV or too close)
          if (!result.isValid) {
            return // Skip this detection
          }

          // worldX and worldY are already in meters from the new projection
          const worldX = result.worldX
          const worldY = result.worldY

          // Route through global track store for cross-camera correlation
          // Use track_id from ByteTrack if available, otherwise use index
          const trackId = detection.track_id ?? idx
          globalTrackStore.processDetection(
            normalizedCameraId,
            trackId,
            worldX,
            worldY,
            detection.confidence
          )

          // Also maintain legacy position store for backward compatibility
          const imageCenterX = det.bbox.x + det.bbox.width / 2
          const imageCenterY = det.bbox.y + det.bbox.height / 2

          const position: PersonPosition = {
            detectionId: det.id,
            cameraId: det.cameraId,
            worldX,
            worldY,
            confidence: det.confidence,
            timestamp: det.timestamp,
            imageX: imageCenterX,
            imageY: imageCenterY,
          }

          newPositions.push(position)
        } catch (err) {
          console.error(`Failed to transform WebRTC detection:`, err)
        }
      })

      // Add positions to legacy store for backward compatibility
      if (newPositions.length > 0) {
        positionStore.addPositions(newPositions)
      }
    } catch (err) {
      processingError.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error processing WebRTC detections:', err)
    }
  }

  /**
   * Process detections from detection store (mock/API mode)
   */
  function processDetections() {
    try {
      processingError.value = null

      // Get current site map
      const siteMap = siteMapStore.activeSiteMap
      if (!siteMap) {
        return
      }

      // Get recent person detections
      const recentDetections = detectionStore.recentDetections.filter(
        det => det.type === 'person' && det.confidence >= minConfidence
      )

      // Process new detections only
      const newDetections = recentDetections.filter(
        det => !lastProcessedDetectionIds.value.has(det.id)
      )

      if (newDetections.length === 0) {
        return
      }

      // Group detections by camera
      const detectionsByCamera = new Map<string, Detection[]>()
      newDetections.forEach(det => {
        if (!detectionsByCamera.has(det.cameraId)) {
          detectionsByCamera.set(det.cameraId, [])
        }
        detectionsByCamera.get(det.cameraId)!.push(det)
      })

      // Transform detections to world coordinates
      const newPositions: PersonPosition[] = []

      detectionsByCamera.forEach((detections, cameraId) => {
        // Find camera placement on site map
        const cameraPlacement = siteMap.cameras.find(c => c.cameraId === cameraId)
        if (!cameraPlacement) {
          // Camera not placed on site map, skip
          return
        }

        // Transform each detection
        detections.forEach((detection, idx) => {
          try {
            // Transform using the new projection bridge
            const result = projectDetectionToWorld(detection, cameraPlacement, false)

            // Skip invalid projections (outside FOV or too close)
            if (!result.isValid) {
              lastProcessedDetectionIds.value.add(detection.id) // Still mark as processed
              return
            }

            // worldX and worldY are already in meters from the new projection
            const worldX = result.worldX
            const worldY = result.worldY

            // Route through global track store for cross-camera correlation
            // Use track ID from detection if available, otherwise use index
            const trackId = detection.trackId ?? idx
            globalTrackStore.processDetection(
              cameraId,
              trackId,
              worldX,
              worldY,
              detection.confidence
            )

            // Also maintain legacy position store for backward compatibility
            const imageCenterX = detection.bbox.x + detection.bbox.width / 2
            const imageCenterY = detection.bbox.y + detection.bbox.height / 2

            const position: PersonPosition = {
              detectionId: detection.id,
              cameraId: detection.cameraId,
              worldX,
              worldY,
              confidence: detection.confidence,
              timestamp: detection.timestamp,
              imageX: imageCenterX,
              imageY: imageCenterY,
            }

            newPositions.push(position)
            lastProcessedDetectionIds.value.add(detection.id)
          } catch (err) {
            console.error(`Failed to transform detection ${detection.id}:`, err)
          }
        })
      })

      // Add positions to legacy store for backward compatibility
      if (newPositions.length > 0) {
        positionStore.addPositions(newPositions)
      }

      // Cleanup old detection IDs from tracking set
      if (lastProcessedDetectionIds.value.size > 1000) {
        // Keep only the most recent 1000
        const recentIds = new Set(
          recentDetections.slice(0, 1000).map(d => d.id)
        )
        lastProcessedDetectionIds.value = recentIds
      }
    } catch (err) {
      processingError.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error processing detections:', err)
    }
  }

  /**
   * Start tracking person positions
   */
  function startTracking() {
    if (updateInterval) return

    isTracking.value = true

    // Process immediately (for detection store mode)
    processDetections()

    // Register WebRTC detection handler if enabled
    if (enableWebRTCIntegration) {
      unregisterWebRTC = registerWebRTCDetectionHandler(processWebRTCDetections)
    }

    // Set up periodic updates for detection store
    updateInterval = setInterval(() => {
      if (isTracking.value) {
        processDetections()
      }
    }, updateIntervalMs)

    // Set up periodic cleanup of expired positions and tracks
    // Run frequently (1s) for responsive visual disappearance at FOV/boundary edges
    cleanupInterval = setInterval(() => {
      positionStore.cleanupExpiredPositions()
      globalTrackStore.cleanupExpiredTracks()

      // Prevent memory leak: limit frame tracking map size
      if (lastProcessedFrames.value.size > 50) {
        lastProcessedFrames.value.clear()
      }
    }, 1000) // Cleanup every 1 second for responsive track expiration
  }

  /**
   * Stop tracking person positions
   */
  function stopTracking() {
    isTracking.value = false

    // Unregister WebRTC handler
    if (unregisterWebRTC) {
      unregisterWebRTC()
      unregisterWebRTC = null
    }

    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }

    // Clear tracking state to free memory
    lastProcessedFrames.value.clear()
  }

  /**
   * Reset tracking state
   */
  function resetTracking() {
    lastProcessedDetectionIds.value.clear()
    positionStore.clearAllPositions()
    globalTrackStore.clearAllTracks()
    processingError.value = null
  }

  /**
   * Toggle tracking on/off
   */
  function toggleTracking() {
    if (isTracking.value) {
      stopTracking()
    } else {
      startTracking()
    }
  }

  // Watch for enabled option changes
  watch(() => enabled, (newEnabled) => {
    if (newEnabled) {
      startTracking()
    } else {
      stopTracking()
    }
  })

  // Auto-start if enabled
  onMounted(() => {
    if (enabled) {
      startTracking()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })

  return {
    isTracking,
    processingError,
    startTracking,
    stopTracking,
    resetTracking,
    toggleTracking,
  }
}
