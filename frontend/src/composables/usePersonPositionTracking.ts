/**
 * Composable for tracking person positions on the site map from camera detections
 *
 * This composable listens to both:
 * 1. Detection store (for mock/API detections)
 * 2. WebRTC data channel detections (for real-time streaming)
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDetectionStore } from '../stores/detections'
import { usePersonPositionStore, type PersonPosition } from '../stores/personPositions'
import { useSiteMapStore } from '../stores/siteMaps'
import type { Detection } from '../types/generated'
import type { DetectionMetadata } from './useWebRTCDetection'
import { detectionToWorldCoordinates, getBBoxBottomCenter } from '../utils/cameraTransform'

export interface UsePersonPositionTrackingOptions {
  enabled?: boolean
  updateIntervalMs?: number
  minConfidence?: number // Minimum detection confidence to track
  enableWebRTCIntegration?: boolean // Listen to WebRTC data channels
}

// Global event bus for WebRTC detections
const webrtcDetectionHandlers: Array<(metadata: DetectionMetadata) => void> = []

export function registerWebRTCDetectionHandler(handler: (metadata: DetectionMetadata) => void) {
  webrtcDetectionHandlers.push(handler)
  return () => {
    const index = webrtcDetectionHandlers.indexOf(handler)
    if (index > -1) webrtcDetectionHandlers.splice(index, 1)
  }
}

export function emitWebRTCDetection(metadata: DetectionMetadata) {
  webrtcDetectionHandlers.forEach(handler => handler(metadata))
}

export function usePersonPositionTracking(options: UsePersonPositionTrackingOptions = {}) {
  const {
    enabled = true,
    updateIntervalMs = 500, // Update every 500ms
    minConfidence = 0.5,
    enableWebRTCIntegration = true,
  } = options

  const detectionStore = useDetectionStore()
  const positionStore = usePersonPositionStore()
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
      // Skip if this frame was already processed
      const lastFrame = lastProcessedFrames.value.get(metadata.camera_id)
      if (lastFrame !== undefined && metadata.frame_number <= lastFrame) {
        return
      }
      lastProcessedFrames.value.set(metadata.camera_id, metadata.frame_number)

      // Get current site map
      const siteMap = siteMapStore.activeSiteMap
      if (!siteMap) {
        return
      }

      // Find camera placement on site map
      const cameraPlacement = siteMap.cameras.find(c => c.cameraId === metadata.camera_id)
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

      // Transform each detection to world coordinates
      const newPositions: PersonPosition[] = []

      personDetections.forEach((detection, idx) => {
        try {
          // Create a Detection object compatible with our transform function
          const det = {
            id: `${metadata.camera_id}-${metadata.frame_number}-${idx}`,
            timestamp: new Date(metadata.timestamp * 1000).toISOString(),
            cameraId: metadata.camera_id,
            type: 'person' as const,
            confidence: detection.confidence,
            bbox: {
              x: detection.bbox.left,
              y: detection.bbox.top,
              width: detection.bbox.right - detection.bbox.left,
              height: detection.bbox.bottom - detection.bbox.top,
            }
          }

          const worldPos = detectionToWorldCoordinates(
            det,
            cameraPlacement,
            { scale: siteMap.scale }
          )

          // Calculate image center for reference
          const imageCenterX = det.bbox.x + det.bbox.width / 2
          const imageCenterY = det.bbox.y + det.bbox.height / 2

          const position: PersonPosition = {
            detectionId: det.id,
            cameraId: det.cameraId,
            worldX: (worldPos.x - 60) / siteMap.scale, // Convert to meters
            worldY: (worldPos.y - 60) / siteMap.scale,
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

      // Add positions to store
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
        detections.forEach(detection => {
          try {
            const worldPos = detectionToWorldCoordinates(
              detection,
              cameraPlacement,
              { scale: siteMap.scale }
            )

            // Calculate image center for reference
            const imageCenterX = detection.bbox.x + detection.bbox.width / 2
            const imageCenterY = detection.bbox.y + detection.bbox.height / 2

            const position: PersonPosition = {
              detectionId: detection.id,
              cameraId: detection.cameraId,
              worldX: (worldPos.x - 60) / siteMap.scale, // Convert to meters
              worldY: (worldPos.y - 60) / siteMap.scale,
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

      // Add positions to store
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
      console.log('[PersonPositionTracking] Registered WebRTC detection handler')
    }

    // Set up periodic updates for detection store
    updateInterval = setInterval(() => {
      if (isTracking.value) {
        processDetections()
      }
    }, updateIntervalMs)

    // Set up periodic cleanup of expired positions
    cleanupInterval = setInterval(() => {
      positionStore.cleanupExpiredPositions()
    }, 5000) // Cleanup every 5 seconds
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
      console.log('[PersonPositionTracking] Unregistered WebRTC detection handler')
    }

    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }

  /**
   * Reset tracking state
   */
  function resetTracking() {
    lastProcessedDetectionIds.value.clear()
    positionStore.clearAllPositions()
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
