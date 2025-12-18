/**
 * Batch Optimizer - Sliding Window Multi-Frame Assignment
 *
 * Uses a sliding window approach for continuous track emission while maintaining
 * multi-frame optimization for improved ID consistency and trajectory smoothness.
 *
 * Key features:
 * - Rolling buffer: Keeps up to N frames (default 150) for optimization context
 * - Continuous emission: Emits frames with fixed delay (default 30 frames / ~1s)
 * - Incremental optimization: Optimizes newest frames using full buffer context
 * - No freezing: Frontend receives continuous stream after initial delay
 *
 * Data flow:
 *   Frame arrives → Add to rolling buffer
 *                → If buffer.length >= emissionDelayFrames:
 *                    → Optimize oldest frames using full buffer context
 *                    → Emit oldest frame → Remove from buffer
 */

import type { CameraDetection, GlobalTrack, Point2D } from '../types/index.js'
import type { BatchOptimizationConstants } from '../config/algorithm-constants.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'
import { solveBlockCoordinateDescent, type FrameBatchInput } from './temporal-assignment.js'
import { smoothTrajectories } from './rts-smoother.js'

/**
 * Configuration for BatchOptimizer
 */
export interface BatchOptimizerConfig extends BatchOptimizationConstants {
  /** Callback when optimization completes */
  onBatchComplete?: (result: OptimizationResult) => void
  /** Callback when a frame is emitted */
  onFrameEmitted?: (assignment: FrameAssignment) => void
}

/**
 * A batch of detections for a single frame
 */
export interface FrameBatch {
  frameNumber: number
  timestamp: number
  detections: CameraDetection[]
  /** Flag indicating if this frame has been optimized */
  optimized: boolean
  /** Cached optimization result for this frame */
  cachedAssignment?: FrameAssignment
}

/**
 * Window of frames being buffered/processed
 */
export interface BatchWindow {
  windowId: string
  frames: FrameBatch[]
  startTimeMs: number
  endTimeMs: number
  frameCount: number
  detectionCount: number
  status: 'buffering' | 'optimizing' | 'emitting'
}

/**
 * Assignment result for a single frame
 */
export interface FrameAssignment {
  frameNumber: number
  timestamp: number
  matches: Array<{
    detection: CameraDetection
    trackId: string
    cost: number
    smoothedPosition?: Point2D
  }>
  unmatchedDetections: CameraDetection[]
}

/**
 * Metrics from batch optimization
 */
export interface BatchMetrics {
  /** Total cost across all frames */
  totalCost: number
  /** Average cost per assignment */
  avgCostPerAssignment: number
  /** Number of iterations for convergence */
  iterations: number
  /** Optimization time (ms) */
  optimizationTimeMs: number
  /** Number of tracks smoothed */
  tracksSmoothed: number
}

/**
 * Result of batch optimization
 */
export interface OptimizationResult {
  windowId: string
  frameAssignments: FrameAssignment[]
  newTracks: string[]
  metrics: BatchMetrics
}

/**
 * Interface for TrackManager operations needed by BatchOptimizer
 */
export interface ITrackManager {
  getActiveTracks(): GlobalTrack[]
  getAllTracks(): GlobalTrack[]
  processBatchDetections(detections: CameraDetection[]): GlobalTrack[]
  // For applying batch results
  associateDetectionWithTrack?(detection: CameraDetection, trackId: string): void
  createTrackFromDetection?(detection: CameraDetection): string
}

/**
 * BatchOptimizer - Sliding window with continuous frame emission
 *
 * Unlike batch-and-wait, this maintains a rolling buffer and emits frames
 * continuously after an initial delay, preventing frontend freezing.
 */
export class BatchOptimizer {
  private config: BatchOptimizerConfig
  private trackManager: ITrackManager
  private rollingBuffer: FrameBatch[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private windowCounter = 0
  private totalFramesEmitted = 0
  private isInitialBuffering = true

  // Callbacks
  public onBatchComplete?: (result: OptimizationResult) => void
  public onFrameEmitted?: (assignment: FrameAssignment) => void

  constructor(
    trackManager: ITrackManager,
    config: Partial<BatchOptimizerConfig> = {}
  ) {
    this.trackManager = trackManager
    this.config = {
      ...ALGORITHM_CONSTANTS.batch,
      ...config,
    }
    this.onBatchComplete = config.onBatchComplete
    this.onFrameEmitted = config.onFrameEmitted
  }

  /**
   * Reset optimizer state (used when an upstream video/camera loops and frame numbers restart).
   *
   * This prevents mixing frames across loops inside the rolling buffer.
   */
  reset(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.rollingBuffer = []
    this.windowCounter = 0
    this.totalFramesEmitted = 0
    this.isInitialBuffering = true
  }

  /**
   * Check if batch optimization is enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get current buffer status
   */
  getStatus(): {
    bufferSize: number
    status: string
    isBuffering: boolean
    framesEmitted: number
  } {
    return {
      bufferSize: this.rollingBuffer.length,
      status: this.isInitialBuffering ? 'buffering' : 'streaming',
      isBuffering: this.isInitialBuffering,
      framesEmitted: this.totalFramesEmitted,
    }
  }

  /**
   * Add a frame of detections to the buffer
   *
   * This is the main entry point called by DetectionProcessor.
   * Uses sliding window approach:
   * 1. During initial buffer fill (first emissionDelayFrames): process frame-by-frame for low latency
   * 2. After buffer fills: optimize and emit oldest frame, maintaining continuous stream
   *
   * @param frameNumber - Frame number from camera
   * @param timestamp - Unix timestamp in ms
   * @param detections - Projected detections for this frame
   * @returns Tracks to display (never empty after initial buffer fill)
   */
  addFrame(
    frameNumber: number,
    timestamp: number,
    detections: CameraDetection[]
  ): GlobalTrack[] {
    // If batch mode disabled, pass through immediately
    if (!this.config.enabled) {
      return this.trackManager.processBatchDetections(detections)
    }

    // Add frame to rolling buffer
    const frame: FrameBatch = {
      frameNumber,
      timestamp,
      detections,
      optimized: false,
    }
    this.rollingBuffer.push(frame)

    // Trim buffer if it exceeds max size
    while (this.rollingBuffer.length > this.config.maxBufferSize) {
      this.rollingBuffer.shift()
    }

    // Reset flush timer
    this.resetFlushTimer()

    // Phase 1: Initial buffering - process frame-by-frame for immediate display
    if (this.isInitialBuffering) {
      if (this.rollingBuffer.length < this.config.emissionDelayFrames) {
        // Still filling buffer - process immediately for low-latency display
        const tracks = this.trackManager.processBatchDetections(detections)
        const activeTracks = this.trackManager.getActiveTracks()
        if (this.rollingBuffer.length % 5 === 0 || this.rollingBuffer.length === 1) {
          console.log(`[BatchOptimizer] Hybrid mode: frame ${frameNumber}, buffer ${this.rollingBuffer.length}/${this.config.emissionDelayFrames}, ${detections.length} dets, returned ${tracks.length} tracks, total active: ${activeTracks.length}`)
        }
        return tracks
      }
      // Buffer is full - transition to sliding window mode
      const activeTracks = this.trackManager.getActiveTracks()
      console.log(`[BatchOptimizer] Transitioning to sliding window mode at frame ${frameNumber}, ${activeTracks.length} active tracks`)
      this.isInitialBuffering = false
    }

    // Phase 2: Sliding window mode
    // Process the CURRENT frame immediately (just like hybrid mode) for real-time display
    // The buffer provides context for future optimization but doesn't delay processing
    const tracks = this.trackManager.processBatchDetections(detections)

    // Trim old frames from buffer to maintain window size
    while (this.rollingBuffer.length > this.config.emissionDelayFrames) {
      this.rollingBuffer.shift()
    }

    return tracks
  }

  /**
   * Optimize oldest frames and emit the oldest one
   *
   * @returns Updated tracks for display
   */
  private processAndEmitOldest(): GlobalTrack[] {
    if (this.rollingBuffer.length < this.config.emissionDelayFrames) {
      // Not enough frames for optimization - shouldn't happen in normal flow
      console.warn(`[BatchOptimizer] processAndEmitOldest called with insufficient buffer: ${this.rollingBuffer.length} < ${this.config.emissionDelayFrames}`)
      return []
    }

    // Get optimization window (oldest N frames)
    const optimizationEnd = Math.min(
      this.config.optimizationWindowSize,
      this.rollingBuffer.length
    )
    const framesToOptimize = this.rollingBuffer.slice(0, optimizationEnd)

    // Check if ANY frame in the window needs optimization
    // This is important because new frames are added at the end, but we emit from the start
    const needsOptimization = framesToOptimize.some(f => !f.optimized)
    if (needsOptimization) {
      // Run optimization on the window
      this.optimizeFrameWindow(framesToOptimize)
    }

    // Emit the oldest frame
    const emittedFrame = this.rollingBuffer.shift()!
    this.totalFramesEmitted++

    // Apply the cached assignment
    if (emittedFrame.cachedAssignment) {
      this.applyFrameAssignment(emittedFrame.cachedAssignment)
      this.onFrameEmitted?.(emittedFrame.cachedAssignment)
    } else {
      console.warn(`[BatchOptimizer] Frame ${emittedFrame.frameNumber} has no cached assignment`)
    }

    // Return current tracks for display
    const tracks = this.trackManager.getActiveTracks()
    if (this.totalFramesEmitted % 30 === 0) {
      console.log(`[BatchOptimizer] Sliding window: emitted ${this.totalFramesEmitted} frames, buffer ${this.rollingBuffer.length}, ${tracks.length} active tracks`)
    }
    return tracks
  }

  /**
   * Optimize a window of frames using block coordinate descent
   *
   * @param frames - Frames to optimize
   */
  private optimizeFrameWindow(frames: FrameBatch[]): void {
    if (frames.length === 0) return

    const startTime = performance.now()

    // Get active tracks for assignment
    const activeTracks = this.trackManager.getActiveTracks()
    console.log(`[BatchOptimizer] optimizeFrameWindow: ${frames.length} frames, ${activeTracks.length} active tracks`)

    // If no active tracks, optimization will produce 0 matches - this is a problem!
    if (activeTracks.length === 0) {
      console.warn(`[BatchOptimizer] WARNING: No active tracks for optimization! Detections will be unmatched.`)
    }

    // Convert frames to input format
    const frameInputs: FrameBatchInput[] = frames.map(f => ({
      frameNumber: f.frameNumber,
      timestamp: f.timestamp,
      detections: f.detections,
    }))

    // Run block coordinate descent
    const { assignments, totalCost, iterations } = solveBlockCoordinateDescent(
      frameInputs,
      activeTracks,
      this.config
    )

    // Log optimization results
    let totalMatches = 0
    let totalUnmatched = 0
    for (const frameAssigns of assignments) {
      for (const assign of frameAssigns) {
        if (assign.trackId) totalMatches++
        else totalUnmatched++
      }
    }
    console.log(`[BatchOptimizer] Optimization result: ${iterations} iters, cost=${totalCost.toFixed(2)}, ${totalMatches} matches, ${totalUnmatched} unmatched`)

    // Group assignments by track for smoothing
    const trackAssignments = new Map<string, Array<{ timestamp: number; position: Point2D }>>()

    for (const frameAssigns of assignments) {
      for (const assign of frameAssigns) {
        if (assign.trackId) {
          if (!trackAssignments.has(assign.trackId)) {
            trackAssignments.set(assign.trackId, [])
          }
          trackAssignments.get(assign.trackId)!.push({
            timestamp: assign.detection.timestamp,
            position: { x: assign.detection.worldX, y: assign.detection.worldY },
          })
        }
      }
    }

    // Apply RTS smoother to trajectories
    const allTracks = this.trackManager.getAllTracks()
    const tracksMap = new Map<string, GlobalTrack>()
    for (const track of allTracks) {
      tracksMap.set(track.globalTrackId, track)
    }
    const smoothedTrajectories = smoothTrajectories(trackAssignments, tracksMap)

    // Convert to frame assignments with smoothed positions
    for (let f = 0; f < frames.length; f++) {
      const frame = frames[f]
      const frameAssigns = assignments[f]

      const matches: FrameAssignment['matches'] = []
      const unmatched: CameraDetection[] = []

      for (const assign of frameAssigns) {
        if (assign.trackId) {
          // Find smoothed position for this timestamp
          const smoothed = smoothedTrajectories.get(assign.trackId)
          const smoothedPoint = smoothed?.find(s => s.timestamp === assign.detection.timestamp)

          // Validate smoothed position - use original if invalid
          let validSmoothedPosition: Point2D | undefined
          if (smoothedPoint?.position &&
              typeof smoothedPoint.position.x === 'number' &&
              typeof smoothedPoint.position.y === 'number' &&
              !isNaN(smoothedPoint.position.x) &&
              !isNaN(smoothedPoint.position.y) &&
              isFinite(smoothedPoint.position.x) &&
              isFinite(smoothedPoint.position.y)) {
            validSmoothedPosition = smoothedPoint.position
          }

          matches.push({
            detection: assign.detection,
            trackId: assign.trackId,
            cost: assign.cost,
            smoothedPosition: validSmoothedPosition,
          })
        } else {
          unmatched.push(assign.detection)
        }
      }

      // Cache the assignment in the frame
      frame.cachedAssignment = {
        frameNumber: frame.frameNumber,
        timestamp: frame.timestamp,
        matches,
        unmatchedDetections: unmatched,
      }
      frame.optimized = true
    }

    const optimizationTimeMs = performance.now() - startTime

    // Emit completion callback
    const result: OptimizationResult = {
      windowId: `sliding-${Date.now()}-${++this.windowCounter}`,
      frameAssignments: frames.map(f => f.cachedAssignment!),
      newTracks: [],
      metrics: {
        totalCost,
        avgCostPerAssignment: totalCost / Math.max(1, frames.reduce((sum, f) => sum + f.cachedAssignment!.matches.length, 0)),
        iterations,
        optimizationTimeMs,
        tracksSmoothed: smoothedTrajectories.size,
      },
    }

    this.onBatchComplete?.(result)
  }

  /**
   * Apply a frame's assignments to the track manager
   *
   * During hybrid mode, frames are already processed through the track manager.
   * Re-processing them with old timestamps causes track expiry issues.
   *
   * For now, we skip re-processing and just log the assignment.
   * The optimization results are captured in metrics/callbacks.
   *
   * TODO: Future enhancement - update track positions directly without
   * going through the full processBatchDetections pipeline.
   */
  private applyFrameAssignment(assignment: FrameAssignment): void {
    // Log the assignment for debugging (suppress most logs to reduce noise)
    if (this.totalFramesEmitted % 30 === 0) {
      console.log(`[BatchOptimizer] applyFrameAssignment: frame ${assignment.frameNumber}, ${assignment.matches.length} matches, ${assignment.unmatchedDetections.length} unmatched`)
    }

    // NOTE: We intentionally DON'T call processBatchDetections here because:
    // 1. These frames were already processed during hybrid mode
    // 2. Re-processing with old timestamps confuses the track expiry logic
    // 3. The tracks are already being broadcast via WebSocket callbacks
    //
    // The optimization provides better assignment quality for the batch,
    // but the tracks were already created/updated during hybrid mode.
  }

  /**
   * Force flush remaining buffer (e.g., on shutdown)
   */
  async flush(): Promise<OptimizationResult | null> {
    if (this.rollingBuffer.length === 0) {
      return null
    }

    // Optimize any remaining unoptimized frames
    const unoptimizedFrames = this.rollingBuffer.filter(f => !f.optimized)
    if (unoptimizedFrames.length > 0) {
      this.optimizeFrameWindow(unoptimizedFrames)
    }

    // Emit all remaining frames
    const allAssignments: FrameAssignment[] = []
    while (this.rollingBuffer.length > 0) {
      const frame = this.rollingBuffer.shift()!
      if (frame.cachedAssignment) {
        this.applyFrameAssignment(frame.cachedAssignment)
        this.onFrameEmitted?.(frame.cachedAssignment)
        allAssignments.push(frame.cachedAssignment)
      }
      this.totalFramesEmitted++
    }

    return {
      windowId: `flush-${Date.now()}`,
      frameAssignments: allAssignments,
      newTracks: [],
      metrics: {
        totalCost: 0,
        avgCostPerAssignment: 0,
        iterations: 0,
        optimizationTimeMs: 0,
        tracksSmoothed: 0,
      },
    }
  }

  /**
   * Reset flush timer for timeout-based emission
   */
  private resetFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      // Force emit if we have frames waiting
      if (this.rollingBuffer.length > 0 && !this.isInitialBuffering) {
        this.processAndEmitOldest()
      }
    }, this.config.maxBatchDelayMs)
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.rollingBuffer = []
    this.isInitialBuffering = true
    this.totalFramesEmitted = 0
  }
}
