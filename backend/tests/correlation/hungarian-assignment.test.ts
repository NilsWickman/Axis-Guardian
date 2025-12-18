/**
 * Hungarian Assignment Tests
 */

import { describe, it, expect } from 'vitest'
import {
  assignDetectionsToTracks,
  buildCostMatrix,
  compareAssignmentMethods,
  type AssignmentConfig,
} from '../../src/correlation/hungarian-assignment.js'
import type { CameraDetection, GlobalTrack } from '../../src/types.js'

// Test-specific config that disables optional cost components for isolated testing
const TEST_CONFIG: AssignmentConfig = {
  maxCost: 10.0,
  useKalmanPrediction: false,
  associationBonus: 1.0,
  sameCameraPenalty: 1.5,
  velocityConsistencyWeight: 0,  // Disable for basic tests
  crossingProximityThreshold: 1.5,
  crossingMaxCostMultiplier: 0.5,
  directionConsistencyWeight: 0,  // Disable for basic tests
  minSpeedForDirection: 0.2,
  crossCameraBonus: 0.6,
  crossCameraBonusWindowMs: 2000,
  maxAccelerationMs2: 3.0,
  accelerationConsistencyWeight: 0,  // Disable for basic tests
  embeddingWeight: 0,  // Disable for basic tests
  embeddingMinSimilarity: 0.65,
  embeddingMinQuality: 0.25,
  crossingMinSimilarity: 0.70,
  crossingMismatchPenalty: 3.0,
  crossingMinQuality: 0.35,
  minConfidenceForTightGate: 5,
  confidentTrackGateFactor: 0.7,
  adaptiveMinQuality: 0.4,
}

function createMockDetection(
  cameraId: string,
  trackId: number,
  worldX: number,
  worldY: number,
  confidence: number = 0.9
): CameraDetection {
  return {
    cameraId,
    trackId,
    worldX,
    worldY,
    confidence,
    timestamp: Date.now(),
  }
}

function createMockTrack(
  globalTrackId: string,
  x: number,
  y: number
): GlobalTrack {
  return {
    globalTrackId,
    cameraAssociations: new Map(),
    currentPosition: { x, y },
    trail: [{ x, y, timestamp: Date.now() }],
    color: '#10b981',
    lastSeen: Date.now(),
    isActive: true,
    isConfirmed: true,
    detectionCount: 5,
    confidence: 0.9,
    pendingDetections: [],
    state: 'confirmed',
    missedFrames: 0,
    consecutiveDetections: 0,
  }
}

describe('Hungarian Assignment', () => {
  describe('Empty Cases', () => {
    it('returns empty results for no detections', () => {
      const tracks = [createMockTrack('track-1', 5, 5)]
      const result = assignDetectionsToTracks([], tracks)

      expect(result.matches).toHaveLength(0)
      expect(result.unmatchedDetections).toHaveLength(0)
      expect(result.unmatchedTracks).toHaveLength(1)
      expect(result.totalCost).toBe(0)
    })

    it('returns all detections as unmatched for no tracks', () => {
      const detections = [createMockDetection('cam1', 1, 5, 5)]
      const result = assignDetectionsToTracks(detections, [])

      expect(result.matches).toHaveLength(0)
      expect(result.unmatchedDetections).toHaveLength(1)
      expect(result.unmatchedTracks).toHaveLength(0)
      expect(result.totalCost).toBe(0)
    })
  })

  describe('Simple Matching', () => {
    it('matches single detection to single track', () => {
      const detections = [createMockDetection('cam1', 1, 5.0, 5.0)]
      const tracks = [createMockTrack('track-1', 5.0, 5.0)]

      const result = assignDetectionsToTracks(detections, tracks)

      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].detection).toBe(detections[0])
      expect(result.matches[0].track).toBe(tracks[0])
      expect(result.matches[0].cost).toBe(0)  // Same position
      expect(result.unmatchedDetections).toHaveLength(0)
      expect(result.unmatchedTracks).toHaveLength(0)
    })

    it('matches detection to nearest track', () => {
      const detections = [createMockDetection('cam1', 1, 5.0, 5.0)]
      const tracks = [
        createMockTrack('track-1', 10.0, 10.0),  // Far
        createMockTrack('track-2', 5.3, 5.0),    // Close (0.3m away, within maxCost)
        createMockTrack('track-3', 20.0, 20.0),  // Very far
      ]

      const result = assignDetectionsToTracks(detections, tracks)

      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].track.globalTrackId).toBe('track-2')
    })
  })

  describe('Multiple Matches', () => {
    it('finds optimal assignment for multiple detections', () => {
      // Detection 1 is closer to track-1, detection 2 is closer to track-2
      const detections = [
        createMockDetection('cam1', 1, 1.0, 1.0),
        createMockDetection('cam1', 2, 10.0, 10.0),
      ]
      const tracks = [
        createMockTrack('track-1', 1.1, 1.0),
        createMockTrack('track-2', 10.1, 10.0),
      ]

      const result = assignDetectionsToTracks(detections, tracks)

      expect(result.matches).toHaveLength(2)
      expect(result.unmatchedDetections).toHaveLength(0)
      expect(result.unmatchedTracks).toHaveLength(0)

      // Verify optimal assignment
      const match1 = result.matches.find(m => m.detection.worldX === 1.0)
      const match2 = result.matches.find(m => m.detection.worldX === 10.0)
      expect(match1?.track.globalTrackId).toBe('track-1')
      expect(match2?.track.globalTrackId).toBe('track-2')
    })

    it('handles more detections than tracks', () => {
      const detections = [
        createMockDetection('cam1', 1, 5.0, 5.0),
        createMockDetection('cam1', 2, 6.0, 5.0),
        createMockDetection('cam1', 3, 20.0, 20.0),  // Far, unmatched
      ]
      const tracks = [
        createMockTrack('track-1', 5.1, 5.0),
        createMockTrack('track-2', 5.9, 5.0),
      ]

      const result = assignDetectionsToTracks(detections, tracks)

      expect(result.matches).toHaveLength(2)
      expect(result.unmatchedDetections).toHaveLength(1)
      expect(result.unmatchedDetections[0].worldX).toBe(20.0)
    })

    it('handles more tracks than detections', () => {
      const detections = [createMockDetection('cam1', 1, 5.0, 5.0)]
      const tracks = [
        createMockTrack('track-1', 5.0, 5.0),
        createMockTrack('track-2', 10.0, 10.0),
        createMockTrack('track-3', 20.0, 20.0),
      ]

      const result = assignDetectionsToTracks(detections, tracks)

      expect(result.matches).toHaveLength(1)
      expect(result.unmatchedTracks).toHaveLength(2)
    })
  })

  describe('Cost Threshold', () => {
    it('rejects matches above max cost', () => {
      const detections = [createMockDetection('cam1', 1, 5.0, 5.0)]
      const tracks = [createMockTrack('track-1', 20.0, 20.0)]  // Very far

      const result = assignDetectionsToTracks(detections, tracks, { maxCost: 2.0 })

      expect(result.matches).toHaveLength(0)
      expect(result.unmatchedDetections).toHaveLength(1)
      expect(result.unmatchedTracks).toHaveLength(1)
    })
  })

  describe('Association Bonus', () => {
    it('applies bonus for existing camera-track association', () => {
      const detection = createMockDetection('cam1', 1, 5.0, 5.0)
      const track = createMockTrack('track-1', 5.1, 5.0)
      // Add existing association
      track.cameraAssociations.set('cam1', {
        cameraId: 'cam1',
        trackIds: [1],  // Same trackId as detection
        lastSeen: Date.now(),
      })

      const { matrix: costMatrixWithBonus } = buildCostMatrix([detection], [track], {
        ...TEST_CONFIG,
        associationBonus: 0.5,
      })

      const { matrix: costMatrixNoBonus } = buildCostMatrix([detection], [track], {
        ...TEST_CONFIG,
        associationBonus: 1.0,  // No bonus (multiply by 1)
      })

      // With 0.5 bonus, cost should be half
      expect(costMatrixWithBonus[0][0]).toBeLessThan(costMatrixNoBonus[0][0])
      expect(costMatrixWithBonus[0][0]).toBeCloseTo(costMatrixNoBonus[0][0] * 0.5, 5)
    })
  })

  describe('Cost Matrix', () => {
    it('builds cost matrix with correct dimensions', () => {
      const detections = [
        createMockDetection('cam1', 1, 1.0, 1.0),
        createMockDetection('cam1', 2, 2.0, 2.0),
      ]
      const tracks = [
        createMockTrack('track-1', 1.0, 1.0),
        createMockTrack('track-2', 2.0, 2.0),
        createMockTrack('track-3', 3.0, 3.0),
      ]

      const { matrix: costMatrix, adaptiveGates } = buildCostMatrix(detections, tracks)

      expect(costMatrix).toHaveLength(2)          // 2 detections
      expect(costMatrix[0]).toHaveLength(3)       // 3 tracks
      expect(costMatrix[1]).toHaveLength(3)
      expect(adaptiveGates).toHaveLength(3)       // adaptive gate per track
    })

    it('calculates Euclidean distance costs', () => {
      const detections = [createMockDetection('cam1', 1, 0.0, 0.0)]
      const tracks = [createMockTrack('track-1', 1.0, 0.0)]  // 1m away

      const { matrix: costMatrix } = buildCostMatrix(detections, tracks, TEST_CONFIG)

      expect(costMatrix[0][0]).toBeCloseTo(1.0, 5)  // 1m distance
    })
  })

  describe('Algorithm Comparison', () => {
    it('Hungarian algorithm finds same or better solution than greedy', () => {
      // Create a scenario where greedy might fail
      const detections = [
        createMockDetection('cam1', 1, 1.0, 1.0),
        createMockDetection('cam1', 2, 2.0, 2.0),
        createMockDetection('cam1', 3, 1.5, 1.5),
      ]
      const tracks = [
        createMockTrack('track-1', 1.1, 1.1),
        createMockTrack('track-2', 1.6, 1.6),
        createMockTrack('track-3', 2.1, 2.1),
      ]

      const result = compareAssignmentMethods(detections, tracks)

      // Hungarian should be at least as good as greedy
      expect(result.hungarian.matches.length).toBeGreaterThanOrEqual(
        result.greedy.matches.length
      )
      expect(result.hungarian.totalCost).toBeLessThanOrEqual(
        result.greedy.totalCost + 0.001  // Small tolerance for floating point
      )
    })
  })
})
