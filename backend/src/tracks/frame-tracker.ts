/**
 * Frame Tracker - Per-camera frame tracking for missed detection calculation
 *
 * Extracted from TrackManager to provide focused responsibility for
 * frame-based timing and missed frame detection.
 */

/**
 * Per-camera frame tracking state
 */
export interface CameraFrameState {
  lastFrameNumber: number
  lastFrameTimestamp: number
  estimatedFps: number
}

export interface FrameTrackerConfig {
  /** Default FPS assumption when no data available */
  defaultFps: number
  /** Smoothing factor for FPS estimation (0-1, higher = more weight on new samples) */
  fpsSmoothingFactor: number
}

const DEFAULT_CONFIG: FrameTrackerConfig = {
  defaultFps: 10,
  fpsSmoothingFactor: 0.1,
}

/**
 * FrameTracker - Tracks per-camera frame numbers for accurate missed frame detection
 *
 * Responsibilities:
 * - Tracking per-camera frame numbers and timestamps
 * - Estimating FPS per camera using exponential moving average
 * - Calculating missed frames based on frame deltas
 */
export class FrameTracker {
  private cameraStates: Map<string, CameraFrameState> = new Map()
  private config: FrameTrackerConfig

  constructor(config: Partial<FrameTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Update frame tracker for a camera with new frame data
   */
  updateFrame(cameraId: string, frameNumber: number, timestamp: number): void {
    const existing = this.cameraStates.get(cameraId)

    if (existing) {
      // Estimate FPS from frame delta
      const frameDelta = frameNumber - existing.lastFrameNumber
      const timeDelta = (timestamp - existing.lastFrameTimestamp) / 1000 // seconds

      if (frameDelta > 0 && timeDelta > 0) {
        const instantFps = frameDelta / timeDelta
        // Exponential moving average for FPS estimation
        existing.estimatedFps =
          existing.estimatedFps * (1 - this.config.fpsSmoothingFactor) +
          instantFps * this.config.fpsSmoothingFactor
      }

      existing.lastFrameNumber = frameNumber
      existing.lastFrameTimestamp = timestamp
    } else {
      this.cameraStates.set(cameraId, {
        lastFrameNumber: frameNumber,
        lastFrameTimestamp: timestamp,
        estimatedFps: this.config.defaultFps,
      })
    }
  }

  /**
   * Get the current frame state for a camera
   */
  getCameraState(cameraId: string): CameraFrameState | undefined {
    return this.cameraStates.get(cameraId)
  }

  /**
   * Get the estimated FPS for a camera
   */
  getEstimatedFps(cameraId: string): number {
    return this.cameraStates.get(cameraId)?.estimatedFps ?? this.config.defaultFps
  }

  /**
   * Get the last known frame number for a camera
   */
  getLastFrameNumber(cameraId: string): number | undefined {
    return this.cameraStates.get(cameraId)?.lastFrameNumber
  }

  /**
   * Calculate missed frames between a track's last seen frame and current camera frame
   *
   * @param cameraId - Camera to check
   * @param lastSeenFrame - Last frame number the track was seen on this camera
   * @returns Number of missed frames, or undefined if no frame data available
   */
  getMissedFrames(cameraId: string, lastSeenFrame: number): number | undefined {
    const state = this.cameraStates.get(cameraId)
    if (!state) return undefined

    const framesMissed = state.lastFrameNumber - lastSeenFrame
    return Math.max(0, framesMissed)
  }

  /**
   * Calculate missed frames for a track across multiple cameras.
   * Returns the minimum missed frames across all cameras that have seen this track.
   *
   * Using min ensures a multi-camera track does NOT become occluded while at least
   * one camera still actively sees it. If any camera is still tracking the person,
   * the track should remain active.
   *
   * @param cameraFrames - Map of cameraId to last seen frame number
   * @returns Minimum missed frames, or undefined if no frame data available
   */
  getMinMissedFramesAcrossCameras(
    cameraFrames: Map<string, number | undefined>
  ): number | undefined {
    const perCameraMissed: number[] = []

    for (const [cameraId, lastSeenFrame] of cameraFrames) {
      if (lastSeenFrame === undefined) continue

      const missed = this.getMissedFrames(cameraId, lastSeenFrame)
      if (missed !== undefined) {
        perCameraMissed.push(missed)
      }
    }

    if (perCameraMissed.length === 0) return undefined
    return Math.min(...perCameraMissed)
  }

  /**
   * Estimate missed frames from time delta (fallback when frame numbers unavailable)
   *
   * @param timeDeltaMs - Time since last detection in milliseconds
   * @param cameraId - Optional camera ID for FPS estimation
   * @returns Estimated number of missed frames
   */
  estimateMissedFramesFromTime(timeDeltaMs: number, cameraId?: string): number {
    const fps = cameraId
      ? this.getEstimatedFps(cameraId)
      : this.config.defaultFps

    const frameDurationMs = 1000 / fps
    return Math.floor(timeDeltaMs / frameDurationMs)
  }

  /**
   * Check if a camera has frame tracking data
   */
  hasCamera(cameraId: string): boolean {
    return this.cameraStates.has(cameraId)
  }

  /**
   * Get all tracked camera IDs
   */
  getCameraIds(): string[] {
    return Array.from(this.cameraStates.keys())
  }

  /**
   * Clear frame tracking for a specific camera
   */
  clearCamera(cameraId: string): void {
    this.cameraStates.delete(cameraId)
  }

  /**
   * Clear all frame tracking data
   */
  clearAll(): void {
    this.cameraStates.clear()
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<FrameTrackerConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): FrameTrackerConfig {
    return { ...this.config }
  }
}
