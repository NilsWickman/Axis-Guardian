/**
 * Calibration Types
 *
 * Type definitions for camera configuration optimization.
 */

import type { Point2D, DistortionCoeffs } from '../types.js'

/**
 * Room dimensions for constraint-aware search
 */
export interface RoomConstraints {
  width: number   // X dimension (meters)
  height: number  // Y dimension (meters)
  margin?: number // Min distance from room edge for camera (default: 0)
}

/**
 * Camera configuration for calibration sweep
 */
export interface CalibrationConfig {
  position: { x: number; y: number }
  azimuth: number
  elevation: number
  height: number
  fieldOfView: number
  distortion?: DistortionCoeffs
}

/**
 * Parameter ranges for grid search
 */
export interface ParameterRange {
  min: number
  max: number
  step: number
}

/**
 * Configuration for parameter sweep
 */
export interface SweepConfig {
  positionX: ParameterRange
  positionY: ParameterRange
  azimuth: ParameterRange
  elevation: ParameterRange
  height: ParameterRange
  fieldOfView: ParameterRange
  distortion?: {
    k1: ParameterRange
    k2: ParameterRange
  }
}

/**
 * Error metrics for a single frame evaluation
 */
export interface FrameError {
  frameNumber: number
  projectedPositions: Point2D[]
  matchedError: number
  individualErrors: number[]
  assignment: Array<{ detection: number; groundTruth: number }>
}

/**
 * Aggregate error statistics for a configuration
 */
export interface ConfigScore {
  config: CalibrationConfig
  totalError: number
  meanError: number
  maxError: number
  minError: number
  stdDev: number
  validProjections: number
  totalFrames: number
  frameErrors: FrameError[]
}

/**
 * Final calibration result
 */
export interface CalibrationResult {
  timestamp: string
  dataset: string
  groundTruth: Point2D[]
  samplesUsed: number

  bestConfig: CalibrationConfig

  errorStats: {
    meanError: number
    maxError: number
    minError: number
    stdDev: number
    validProjectionRate: number
  }

  searchStats: {
    coarseCombinations: number
    fineCombinations: number
    totalTimeMs: number
  }

  sampleProjections: Array<{
    frame: number
    projected: Point2D[]
    groundTruth: Point2D[]
    errors: number[]
  }>
}

/**
 * Detection file format (from preprocessed dataset)
 */
export interface DetectionFile {
  format_version: string
  video_info: {
    fps: number
    width: number
    height: number
    total_frames: number
    duration_seconds: number
  }
  frames: DetectionFrame[]
}

export interface DetectionFrame {
  frame_number: number
  timestamp: number
  detections: Detection[]
  stats?: {
    detection_count: number
    avg_confidence: number
  }
}

export interface Detection {
  bbox: {
    left: number
    top: number
    right: number
    bottom: number
  }
  confidence: number
  class_name: string
  track_id?: number
}
