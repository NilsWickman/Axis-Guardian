/**
 * Detection Processor - Main pipeline orchestrator
 *
 * Receives raw detections from camera emulators, projects them to world
 * coordinates, and feeds them into the TrackManager.
 */

import type { DetectionMessage, RawDetection, GlobalTrack, CameraDetection } from '../types.js'
import { projectDetectionToGround, projectDetectionWithKRT } from '../projection/ground-plane.js'
import { TrackManager } from '../tracks/track-manager.js'
import { CameraRegistry } from './camera-registry.js'
import { logProjectionFailure } from '../api/routes.js'

const MIN_CONFIDENCE = 0.7
const IMAGE_WIDTH = 1920
const IMAGE_HEIGHT = 1080

export class DetectionProcessor {
  private lastProcessedFrames: Map<string, number> = new Map()
  private lastCleanupTime: number = Date.now()
  private static readonly MAX_CAMERAS = 100  // Prevent unbounded growth
  private static readonly CLEANUP_INTERVAL_MS = 60000  // Cleanup every minute

  constructor(
    private trackManager: TrackManager,
    private cameraRegistry: CameraRegistry
  ) {}

  /**
   * Process a detection message from a camera emulator
   * Uses batch processing with Hungarian algorithm for optimal assignment
   */
  processMessage(message: DetectionMessage): GlobalTrack[] {
    const cameraId = this.cameraRegistry.normalizeCameraId(message.camera_id)

    // Skip if we've already processed this frame
    const lastFrame = this.lastProcessedFrames.get(cameraId) ?? -1
    if (message.frame_number <= lastFrame) {
      return []
    }
    this.lastProcessedFrames.set(cameraId, message.frame_number)

    // Periodic cleanup to prevent memory leaks from stale camera entries
    this.periodicCleanup()

    // Get camera parameters
    const camera = this.cameraRegistry.getCamera(cameraId)
    if (!camera) {
      console.warn(`Unknown camera: ${cameraId}`)
      return []
    }

    // Convert timestamp from seconds to ms
    const timestampMs = message.timestamp * 1000

    // Project all detections to world coordinates
    const projectedDetections: CameraDetection[] = []

    for (const detection of message.detections) {
      // Filter for person detections with sufficient confidence
      if (detection.class_name !== 'person' || detection.confidence < MIN_CONFIDENCE) {
        continue
      }

      // Convert bbox array to object format
      const bbox = this.parseBBox(detection)
      if (!bbox) continue

      // Project to world coordinates
      // Try K/R/T projection first (more accurate), fall back to legacy
      const calibration = this.cameraRegistry.getCalibration(cameraId)
      let worldPoint: { x: number; y: number }
      let isValid: boolean

      if (calibration) {
        const krtResult = projectDetectionWithKRT(bbox, calibration, true, IMAGE_WIDTH, IMAGE_HEIGHT)
        worldPoint = krtResult.worldPoint
        isValid = krtResult.isValid
      } else {
        const legacyResult = projectDetectionToGround(bbox, camera, true, IMAGE_WIDTH, IMAGE_HEIGHT)
        worldPoint = legacyResult.worldPoint
        isValid = legacyResult.isValid
      }

      if (!isValid) {
        continue
      }

      // Add to batch for Hungarian assignment
      projectedDetections.push({
        cameraId,
        trackId: detection.track_id ?? 0,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        confidence: detection.confidence,
        timestamp: timestampMs,
      })
    }

    // Use batch processing with Hungarian algorithm for optimal assignment
    if (projectedDetections.length > 0) {
      return this.trackManager.processBatchDetections(projectedDetections)
    }

    return []
  }

  // Debug counter
  private debugCount = 0

  /**
   * Process a detection injection request (for testing)
   */
  processInjection(
    cameraId: string,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
    trackId: number = 0
  ): GlobalTrack | null {
    const normalizedCameraId = this.cameraRegistry.normalizeCameraId(cameraId)

    // Try K/R/T projection first (more accurate)
    const calibration = this.cameraRegistry.getCalibration(normalizedCameraId)
    if (calibration) {
      const result = projectDetectionWithKRT(bbox, calibration, true, IMAGE_WIDTH, IMAGE_HEIGHT)

      if (!result.isValid) {
        logProjectionFailure(`track=${trackId}: ${result.reason}`)
        return null
      }

      const track = this.trackManager.processDetection(
        normalizedCameraId,
        trackId,
        result.worldPoint.x,
        result.worldPoint.y,
        confidence
      )

      return track
    }

    // Fall back to legacy projection if no K/R/T calibration
    const camera = this.cameraRegistry.getCamera(normalizedCameraId)
    if (!camera) {
      if (this.debugCount < 3) console.warn(`Unknown camera: ${cameraId}`)
      return null
    }

    const result = projectDetectionToGround(bbox, camera, true, IMAGE_WIDTH, IMAGE_HEIGHT)

    if (!result.isValid) {
      logProjectionFailure(`track=${trackId}: ${result.reason}, dist=${result.distance?.toFixed(1)}m`)
      return null
    }

    const track = this.trackManager.processDetection(
      normalizedCameraId,
      trackId,
      result.worldPoint.x,
      result.worldPoint.y,
      confidence
    )

    return track
  }

  /**
   * Process a direct world position (bypasses projection)
   */
  processWorldPosition(
    cameraId: string,
    worldX: number,
    worldY: number,
    confidence: number,
    trackId: number = 0
  ): GlobalTrack {
    return this.trackManager.processDetection(
      cameraId,
      trackId,
      worldX,
      worldY,
      confidence
    )
  }

  private parseBBox(detection: RawDetection): { x: number; y: number; width: number; height: number } | null {
    // Handle array format [x, y, w, h]
    if (Array.isArray(detection.bbox) && detection.bbox.length === 4) {
      const [x, y, width, height] = detection.bbox
      return { x, y, width, height }
    }

    // Handle object format (for injection API)
    if (detection.bbox && typeof detection.bbox === 'object') {
      const b = detection.bbox as unknown as { x?: number; y?: number; width?: number; height?: number }
      if (b.x !== undefined && b.y !== undefined && b.width !== undefined && b.height !== undefined) {
        return { x: b.x, y: b.y, width: b.width, height: b.height }
      }
    }

    return null
  }

  /**
   * Reset frame tracking (useful for testing)
   */
  resetFrameTracking(): void {
    this.lastProcessedFrames.clear()
    this.lastCleanupTime = Date.now()
  }

  /**
   * Get last processed frame for a camera
   */
  getLastProcessedFrame(cameraId: string): number {
    return this.lastProcessedFrames.get(cameraId) ?? -1
  }

  /**
   * Periodic cleanup to prevent memory leaks from accumulated camera entries
   * Removes entries for cameras not in the registry (stale/disconnected cameras)
   */
  private periodicCleanup(): void {
    const now = Date.now()
    if (now - this.lastCleanupTime < DetectionProcessor.CLEANUP_INTERVAL_MS) {
      return
    }
    this.lastCleanupTime = now

    // Remove entries for cameras no longer in the registry
    const registeredCameras = new Set(this.cameraRegistry.getCameraIds())
    const cameraIds = Array.from(this.lastProcessedFrames.keys())
    for (const cameraId of cameraIds) {
      if (!registeredCameras.has(cameraId)) {
        this.lastProcessedFrames.delete(cameraId)
      }
    }

    // Emergency cleanup if too many entries (hard limit)
    if (this.lastProcessedFrames.size > DetectionProcessor.MAX_CAMERAS) {
      // Keep only the most recently used cameras
      const entries = Array.from(this.lastProcessedFrames.entries())
        .sort((a, b) => b[1] - a[1])  // Sort by frame number (higher = more recent)
        .slice(0, DetectionProcessor.MAX_CAMERAS)

      this.lastProcessedFrames.clear()
      for (const [id, frame] of entries) {
        this.lastProcessedFrames.set(id, frame)
      }
    }
  }
}
