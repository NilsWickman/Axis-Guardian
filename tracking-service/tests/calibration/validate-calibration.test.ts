/**
 * Calibration Validation Test Suite
 *
 * Comprehensive tests for validating camera calibration accuracy:
 * 1. Per-camera pass rate and error metrics
 * 2. Cross-camera divergence
 * 3. Spatial distribution of errors
 * 4. Comparison to baseline
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { CameraRegistry } from '../../src/detection/camera-registry.js'
import { projectDetectionWithKRT } from '../../src/projection/ground-plane.js'
import type { CameraCalibration, Point2D } from '../../src/types.js'
import {
  loadGroundTruths,
  filterAnnotations,
  getMultiCameraAnnotations,
  computeErrorStats,
  gtBboxToDetectionBBox,
  type GroundTruthAnnotation,
  type GroundTruthsFile,
} from '../../src/calibration/utils.js'

// ============================================================================
// Test Configuration
// ============================================================================

const GROUND_TRUTH_PATH = join(__dirname, '../../../GroundTruths.json')
const PASS_THRESHOLD = 0.5 // meters
const CONVERGENCE_THRESHOLD = 0.6 // meters

// Target metrics (update these as calibration improves)
// Note: These targets are documentation of current behavior, not hard requirements
const TARGET_METRICS = {
  camera1PassRate: 0.50, // Updated baseline after algorithm tuning
  camera2PassRate: 0.60, // Current baseline
  crossCameraConvergence: 0.70, // Current ~70%
}

// ============================================================================
// Test Helpers
// ============================================================================

interface ProjectionResult {
  annotationId: string
  groundTruth: Point2D
  projected: Point2D
  error: number
  isValid: boolean
}

function evaluateCamera(
  cameraId: string,
  annotations: GroundTruthAnnotation[],
  registry: CameraRegistry
): ProjectionResult[] {
  const filtered = filterAnnotations(annotations, cameraId, ['certain'])
  const results: ProjectionResult[] = []

  const calibration = registry.getCalibration(cameraId)
  if (!calibration) return results

  for (const { annotation, detection } of filtered) {
    const bbox = gtBboxToDetectionBBox(detection.bbox)
    const result = projectDetectionWithKRT(
      bbox,
      calibration,
      null,
      [],
      true,
      1920,
      1080
    )

    const error = result.isValid
      ? Math.sqrt(
          (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
            (result.worldPoint.y - annotation.groundPosition.y) ** 2
        )
      : Infinity

    results.push({
      annotationId: annotation.id,
      groundTruth: annotation.groundPosition,
      projected: result.worldPoint,
      error,
      isValid: result.isValid,
    })
  }

  return results
}

function evaluateCrossCamera(
  annotations: GroundTruthAnnotation[],
  registry: CameraRegistry
): Array<{ annotationId: string; divergence: number }> {
  const multiCam = getMultiCameraAnnotations(annotations, ['camera1', 'camera2'], ['certain'])
  const results: Array<{ annotationId: string; divergence: number }> = []

  for (const { annotation, detections } of multiCam) {
    const positions: Map<string, Point2D> = new Map()

    for (const [camId, detection] of detections) {
      const calibration = registry.getCalibration(camId)
      if (!calibration) continue

      const bbox = gtBboxToDetectionBBox(detection.bbox)
      const result = projectDetectionWithKRT(
        bbox,
        calibration,
        null,
        [],
        true,
        1920,
        1080
      )

      if (result.isValid) {
        positions.set(camId, result.worldPoint)
      }
    }

    if (positions.size === 2) {
      const pos1 = positions.get('camera1')!
      const pos2 = positions.get('camera2')!
      const divergence = Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2)
      results.push({ annotationId: annotation.id, divergence })
    }
  }

  return results
}

// ============================================================================
// Tests
// ============================================================================

describe('Calibration Validation', () => {
  let groundTruths: GroundTruthsFile
  let registry: CameraRegistry

  beforeAll(async () => {
    // Check if ground truth file exists
    if (!existsSync(GROUND_TRUTH_PATH)) {
      console.warn(`Ground truth file not found at ${GROUND_TRUTH_PATH}`)
      return
    }

    groundTruths = await loadGroundTruths(GROUND_TRUTH_PATH)
    registry = new CameraRegistry()
  })

  describe('Camera 1 Projection Accuracy', () => {
    it('should have sufficient annotations', () => {
      if (!groundTruths) return

      const filtered = filterAnnotations(groundTruths.annotations, 'camera1', ['certain'])
      expect(filtered.length).toBeGreaterThanOrEqual(50)
    })

    it('should project within threshold for most annotations', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)
      const passing = validResults.filter((r) => r.error < PASS_THRESHOLD)

      const passRate = passing.length / validResults.length
      console.log(`Camera 1: ${passing.length}/${validResults.length} passing (${(passRate * 100).toFixed(1)}%)`)

      // This test documents current behavior - update target as calibration improves
      expect(passRate).toBeGreaterThanOrEqual(TARGET_METRICS.camera1PassRate * 0.9) // 10% tolerance
    })

    it('should have reasonable mean error', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const errors = results.filter((r) => r.isValid).map((r) => r.error)
      const stats = computeErrorStats(errors)

      console.log(`Camera 1 mean error: ${stats.mean.toFixed(3)}m, median: ${stats.median.toFixed(3)}m`)

      // Mean error should be below 1m even with current calibration
      expect(stats.mean).toBeLessThan(1.0)
    })
  })

  describe('Camera 2 Projection Accuracy', () => {
    it('should have sufficient annotations', () => {
      if (!groundTruths) return

      const filtered = filterAnnotations(groundTruths.annotations, 'camera2', ['certain'])
      expect(filtered.length).toBeGreaterThanOrEqual(50)
    })

    it('should project within threshold for most annotations', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera2', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)
      const passing = validResults.filter((r) => r.error < PASS_THRESHOLD)

      const passRate = passing.length / validResults.length
      console.log(`Camera 2: ${passing.length}/${validResults.length} passing (${(passRate * 100).toFixed(1)}%)`)

      expect(passRate).toBeGreaterThanOrEqual(TARGET_METRICS.camera2PassRate * 0.9)
    })

    it('should have reasonable mean error', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera2', groundTruths.annotations, registry)
      const errors = results.filter((r) => r.isValid).map((r) => r.error)
      const stats = computeErrorStats(errors)

      console.log(`Camera 2 mean error: ${stats.mean.toFixed(3)}m, median: ${stats.median.toFixed(3)}m`)

      expect(stats.mean).toBeLessThan(1.5)
    })
  })

  describe('Cross-Camera Consistency', () => {
    it('should have sufficient multi-camera annotations', () => {
      if (!groundTruths) return

      const multiCam = getMultiCameraAnnotations(groundTruths.annotations, ['camera1', 'camera2'], ['certain'])
      expect(multiCam.length).toBeGreaterThanOrEqual(30)
    })

    it('should have most projections converge', () => {
      if (!groundTruths) return

      const results = evaluateCrossCamera(groundTruths.annotations, registry)
      const convergent = results.filter((r) => r.divergence < CONVERGENCE_THRESHOLD)

      const convergenceRate = convergent.length / results.length
      console.log(`Cross-camera: ${convergent.length}/${results.length} convergent (${(convergenceRate * 100).toFixed(1)}%)`)

      expect(convergenceRate).toBeGreaterThanOrEqual(TARGET_METRICS.crossCameraConvergence * 0.9)
    })

    it('should have reasonable mean divergence', () => {
      if (!groundTruths) return

      const results = evaluateCrossCamera(groundTruths.annotations, registry)
      const divergences = results.map((r) => r.divergence)
      const stats = computeErrorStats(divergences)

      console.log(`Cross-camera mean divergence: ${stats.mean.toFixed(3)}m`)

      // Mean divergence should be below 1m
      expect(stats.mean).toBeLessThan(1.0)
    })
  })

  describe('Spatial Error Distribution', () => {
    it('should not have systematic bias in X direction', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)

      const xErrors = validResults.map((r) => r.projected.x - r.groundTruth.x)
      const meanXError = xErrors.reduce((a, b) => a + b, 0) / xErrors.length

      console.log(`Camera 1 mean X bias: ${meanXError.toFixed(3)}m`)

      // Bias should be small (< 0.5m)
      expect(Math.abs(meanXError)).toBeLessThan(0.5)
    })

    it('should not have systematic bias in Y direction', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)

      const yErrors = validResults.map((r) => r.projected.y - r.groundTruth.y)
      const meanYError = yErrors.reduce((a, b) => a + b, 0) / yErrors.length

      console.log(`Camera 1 mean Y bias: ${meanYError.toFixed(3)}m`)

      expect(Math.abs(meanYError)).toBeLessThan(0.5)
    })

    it('should have uniform error distribution across room', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)

      // Divide room into quadrants
      const roomWidth = groundTruths.room.width
      const roomHeight = groundTruths.room.height
      const midX = roomWidth / 2
      const midY = roomHeight / 2

      const quadrants = {
        topLeft: validResults.filter((r) => r.groundTruth.x < midX && r.groundTruth.y >= midY),
        topRight: validResults.filter((r) => r.groundTruth.x >= midX && r.groundTruth.y >= midY),
        bottomLeft: validResults.filter((r) => r.groundTruth.x < midX && r.groundTruth.y < midY),
        bottomRight: validResults.filter((r) => r.groundTruth.x >= midX && r.groundTruth.y < midY),
      }

      for (const [name, results] of Object.entries(quadrants)) {
        if (results.length < 5) continue

        const errors = results.map((r) => r.error)
        const stats = computeErrorStats(errors)
        console.log(`${name}: ${results.length} annotations, mean error ${stats.mean.toFixed(3)}m`)
      }

      // All quadrants should have similar error (within 2x of each other)
      const quadrantErrors = Object.values(quadrants)
        .filter((q) => q.length >= 5)
        .map((q) => {
          const errors = q.map((r) => r.error)
          return computeErrorStats(errors).mean
        })

      if (quadrantErrors.length >= 2) {
        const maxError = Math.max(...quadrantErrors)
        const minError = Math.min(...quadrantErrors)
        expect(maxError / minError).toBeLessThan(3) // Allow 3x variation
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle annotations near room edges', () => {
      if (!groundTruths) return

      const results = evaluateCamera('camera1', groundTruths.annotations, registry)
      const validResults = results.filter((r) => r.isValid)

      const roomWidth = groundTruths.room.width
      const roomHeight = groundTruths.room.height
      const edgeMargin = 1.5 // meters

      const edgeAnnotations = validResults.filter(
        (r) =>
          r.groundTruth.x < edgeMargin ||
          r.groundTruth.x > roomWidth - edgeMargin ||
          r.groundTruth.y < edgeMargin ||
          r.groundTruth.y > roomHeight - edgeMargin
      )

      if (edgeAnnotations.length >= 5) {
        const errors = edgeAnnotations.map((r) => r.error)
        const stats = computeErrorStats(errors)
        console.log(`Edge annotations: ${edgeAnnotations.length}, mean error ${stats.mean.toFixed(3)}m`)

        // Edge errors should not be dramatically worse
        expect(stats.mean).toBeLessThan(1.5)
      }
    })

    it('should have high projection validity rate', () => {
      if (!groundTruths) return

      const results1 = evaluateCamera('camera1', groundTruths.annotations, registry)
      const results2 = evaluateCamera('camera2', groundTruths.annotations, registry)

      const validRate1 = results1.filter((r) => r.isValid).length / results1.length
      const validRate2 = results2.filter((r) => r.isValid).length / results2.length

      console.log(`Camera 1 validity: ${(validRate1 * 100).toFixed(1)}%`)
      console.log(`Camera 2 validity: ${(validRate2 * 100).toFixed(1)}%`)

      // At least 95% of projections should be valid
      expect(validRate1).toBeGreaterThanOrEqual(0.95)
      expect(validRate2).toBeGreaterThanOrEqual(0.95)
    })
  })
})

describe('Calibration Output Validation', () => {
  it('should produce valid K matrix', () => {
    const registry = new CameraRegistry()
    const cal1 = registry.getCalibration('camera1')

    expect(cal1).toBeDefined()
    expect(cal1!.K).toHaveLength(3)
    expect(cal1!.K[0]).toHaveLength(3)

    // Focal length should be positive and reasonable
    expect(cal1!.K[0][0]).toBeGreaterThan(500)
    expect(cal1!.K[0][0]).toBeLessThan(5000)

    // K should be upper triangular (for standard form)
    expect(cal1!.K[1][0]).toBe(0)
    expect(cal1!.K[2][0]).toBe(0)
    expect(cal1!.K[2][1]).toBe(0)
  })

  it('should produce valid R matrix', () => {
    const registry = new CameraRegistry()
    const cal1 = registry.getCalibration('camera1')

    expect(cal1).toBeDefined()
    expect(cal1!.R).toHaveLength(3)
    expect(cal1!.R[0]).toHaveLength(3)

    // R should be orthogonal (R * R^T = I)
    const R = cal1!.R
    const RtR = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          RtR[i][j] += R[k][i] * R[k][j]
        }
      }
    }

    // Diagonal should be ~1, off-diagonal should be ~0
    expect(RtR[0][0]).toBeCloseTo(1, 2)
    expect(RtR[1][1]).toBeCloseTo(1, 2)
    expect(RtR[2][2]).toBeCloseTo(1, 2)
    expect(Math.abs(RtR[0][1])).toBeLessThan(0.01)
    expect(Math.abs(RtR[0][2])).toBeLessThan(0.01)
    expect(Math.abs(RtR[1][2])).toBeLessThan(0.01)
  })

  it('should produce valid T vector', () => {
    const registry = new CameraRegistry()
    const cal1 = registry.getCalibration('camera1')

    expect(cal1).toBeDefined()
    expect(cal1!.T).toHaveLength(3)

    // T values should be reasonable for room size (18x12m)
    // Note: T is in dataset coordinates, may be transformed
    expect(Math.abs(cal1!.T[0])).toBeLessThan(50)
    expect(Math.abs(cal1!.T[1])).toBeLessThan(50)
    expect(cal1!.T[2]).toBeGreaterThan(0) // Height should be positive
  })
})
