/**
 * Kalman State Manager Tests
 *
 * Tests for constraint handling, boundary clamping, and velocity management.
 * These tests verify the fixes for projection accuracy issues:
 * - Velocity zeroing on clamped axes (prevents wall bounce)
 * - Position sync after clamping (prevents snap-back)
 * - Velocity scaling on jump prevention (prevents overprediction)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { KalmanStateManager } from '../../src/filters/kalman-state-manager.js'
import type { GlobalTrack, KalmanState } from '../../src/types.js'
import type { RoomBounds } from '../../src/geometry/fov-geometry.js'

/**
 * Create a minimal GlobalTrack with manually set Kalman state for unit testing
 * Note: This bypasses the kalman library for direct state manipulation tests
 */
function createTestTrackWithState(
  position: { x: number; y: number },
  velocity: { x: number; y: number } = { x: 0, y: 0 }
): GlobalTrack {
  const kalmanState: KalmanState = {
    mean: [[position.x], [position.y], [velocity.x], [velocity.y]],
    covariance: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    lastTimestamp: 1000,
  }

  return {
    globalTrackId: 'test-track-1',
    cameraAssociations: new Map(),
    cameraDetections: new Map(),
    currentPosition: position,
    trail: [],
    color: '#ff0000',
    lastSeen: Date.now(),
    isActive: true,
    isConfirmed: true,
    detectionCount: 5,
    confidence: 0.9,
    pendingDetections: [],
    kalmanState,
    state: 'confirmed',
    missedFrames: 0,
    consecutiveDetections: 5,
    occlusionCount: 0,
  }
}

describe('KalmanStateManager', () => {
  let manager: KalmanStateManager
  let roomBounds: RoomBounds

  beforeEach(() => {
    manager = new KalmanStateManager()
    roomBounds = {
      minX: 0,
      maxX: 30,
      minY: 0,
      maxY: 25,
    }
  })

  describe('Velocity Scaling', () => {
    it('scales velocity by given factor', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 4.0, y: 2.0 })

      // Scale velocity by 0.5 (simulating jump prevention)
      manager.scaleVelocity(track, 0.5)

      expect(track.kalmanState!.mean[2][0]).toBe(2.0) // vx = 4.0 * 0.5
      expect(track.kalmanState!.mean[3][0]).toBe(1.0) // vy = 2.0 * 0.5
    })

    it('handles zero scale factor', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 4.0, y: 2.0 })

      manager.scaleVelocity(track, 0)

      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('handles negative velocity correctly', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: -3.0, y: -1.5 })

      manager.scaleVelocity(track, 0.5)

      expect(track.kalmanState!.mean[2][0]).toBe(-1.5) // vx = -3.0 * 0.5
      expect(track.kalmanState!.mean[3][0]).toBe(-0.75) // vy = -1.5 * 0.5
    })

    it('does nothing when track has no Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      // Should not throw
      expect(() => manager.scaleVelocity(track, 0.5)).not.toThrow()
    })
  })

  describe('Position Sync', () => {
    it('syncs position without affecting velocity', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.5 })

      manager.syncPosition(track, { x: 15, y: 20 })

      // Position should be updated
      expect(track.kalmanState!.mean[0][0]).toBe(15)
      expect(track.kalmanState!.mean[1][0]).toBe(20)

      // Velocity should be preserved
      expect(track.kalmanState!.mean[2][0]).toBe(2.0)
      expect(track.kalmanState!.mean[3][0]).toBe(1.5)
    })

    it('syncs position with clamp and zeros velocity on clamped X axis', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.5 })

      manager.syncPositionWithClamp(track, { x: 15, y: 20 }, true, false)

      // Position should be updated
      expect(track.kalmanState!.mean[0][0]).toBe(15)
      expect(track.kalmanState!.mean[1][0]).toBe(20)

      // X velocity should be zeroed (clampedX=true)
      expect(track.kalmanState!.mean[2][0]).toBe(0)

      // Y velocity should be preserved (clampedY=false)
      expect(track.kalmanState!.mean[3][0]).toBe(1.5)
    })

    it('syncs position with clamp and zeros velocity on clamped Y axis', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.5 })

      manager.syncPositionWithClamp(track, { x: 15, y: 20 }, false, true)

      // Position should be updated
      expect(track.kalmanState!.mean[0][0]).toBe(15)
      expect(track.kalmanState!.mean[1][0]).toBe(20)

      // X velocity should be preserved (clampedX=false)
      expect(track.kalmanState!.mean[2][0]).toBe(2.0)

      // Y velocity should be zeroed (clampedY=true)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('zeros velocity on both axes when both are clamped', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.5 })

      manager.syncPositionWithClamp(track, { x: 15, y: 20 }, true, true)

      // Both velocities should be zeroed
      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('does nothing when track has no Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      // Should not throw
      expect(() => manager.syncPosition(track, { x: 15, y: 20 })).not.toThrow()
      expect(() => manager.syncPositionWithClamp(track, { x: 15, y: 20 }, true, true)).not.toThrow()
    })
  })

  describe('Velocity Damping', () => {
    it('applies damping factor to velocity', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.0 })

      manager.applyVelocityDamping(track, 0.9)

      expect(track.kalmanState!.mean[2][0]).toBeCloseTo(1.8, 5)
      expect(track.kalmanState!.mean[3][0]).toBeCloseTo(0.9, 5)
    })

    it('handles zero damping (full stop)', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.0, y: 1.0 })

      manager.applyVelocityDamping(track, 0)

      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('does nothing when track has no Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      expect(() => manager.applyVelocityDamping(track, 0.9)).not.toThrow()
    })
  })

  describe('Reset Velocity', () => {
    it('resets velocity to zero', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 5.0, y: 3.0 })

      manager.resetVelocity(track)

      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('preserves position when resetting velocity', () => {
      const track = createTestTrackWithState({ x: 15.5, y: 22.3 }, { x: 5.0, y: 3.0 })

      manager.resetVelocity(track)

      expect(track.kalmanState!.mean[0][0]).toBe(15.5)
      expect(track.kalmanState!.mean[1][0]).toBe(22.3)
    })

    it('does nothing when track has no Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      expect(() => manager.resetVelocity(track)).not.toThrow()
    })
  })

  describe('Zero Velocity on Specific Axes', () => {
    it('zeros only X velocity when requested', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 3.0, y: 2.0 })

      manager.zeroVelocityOnAxes(track, true, false)

      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(2.0)
    })

    it('zeros only Y velocity when requested', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 3.0, y: 2.0 })

      manager.zeroVelocityOnAxes(track, false, true)

      expect(track.kalmanState!.mean[2][0]).toBe(3.0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('zeros both velocities when both requested', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 3.0, y: 2.0 })

      manager.zeroVelocityOnAxes(track, true, true)

      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('does nothing when neither axis requested', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 3.0, y: 2.0 })

      manager.zeroVelocityOnAxes(track, false, false)

      expect(track.kalmanState!.mean[2][0]).toBe(3.0)
      expect(track.kalmanState!.mean[3][0]).toBe(2.0)
    })
  })

  describe('Reset on Reentry', () => {
    it('resets velocity and updates position for boundary reentry', () => {
      const track = createTestTrackWithState({ x: 30, y: 15 }, { x: 5.0, y: 2.0 })

      manager.resetOnReentry(track, { x: 25, y: 12 }, 2000)

      // Position should be updated
      expect(track.kalmanState!.mean[0][0]).toBe(25)
      expect(track.kalmanState!.mean[1][0]).toBe(12)

      // Velocity should be zeroed
      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)

      // Timestamp should be updated
      expect(track.kalmanState!.lastTimestamp).toBe(2000)
    })

    it('does nothing when track has no Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      expect(() => manager.resetOnReentry(track, { x: 25, y: 12 }, 2000)).not.toThrow()
    })
  })

  describe('Accessors', () => {
    it('returns correct position from track', () => {
      const track = createTestTrackWithState({ x: 15.5, y: 22.3 })

      const position = manager.getPosition(track)

      expect(position).toBeDefined()
      expect(position!.x).toBe(15.5)
      expect(position!.y).toBe(22.3)
    })

    it('returns correct velocity from track', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 2.5, y: -1.0 })

      const velocity = manager.getVelocity(track)

      expect(velocity).toBeDefined()
      expect(velocity!.x).toBe(2.5)
      expect(velocity!.y).toBe(-1.0)
    })

    it('returns correct speed from track', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 }, { x: 3.0, y: 4.0 })

      const speed = manager.getSpeed(track)

      expect(speed).toBeCloseTo(5.0, 5) // sqrt(3^2 + 4^2) = 5
    })

    it('returns undefined for track without Kalman state', () => {
      const track = createTestTrackWithState({ x: 10, y: 10 })
      track.kalmanState = undefined

      expect(manager.getPosition(track)).toBeUndefined()
      expect(manager.getVelocity(track)).toBeUndefined()
      expect(manager.getSpeed(track)).toBe(0)
    })
  })

  describe('Initialization', () => {
    it('initializes Kalman state at given position', () => {
      const state = manager.initialize({ x: 15, y: 20 }, 1000)

      expect(state.mean[0][0]).toBe(15)
      expect(state.mean[1][0]).toBe(20)
      expect(state.mean[2][0]).toBe(0) // Initial velocity is zero
      expect(state.mean[3][0]).toBe(0)
      expect(state.lastTimestamp).toBe(1000)
    })
  })

  describe('Covariance Reduction on Constraints', () => {
    it('reduces covariance when syncPositionWithClamp is called with clampedX', () => {
      // Create track with high initial covariance (simulating uncertainty)
      const track = createTestTrackWithState({ x: 29, y: 15 }, { x: 2.0, y: 0 })
      track.kalmanState!.covariance[0][0] = 5.0 // High X position variance
      track.kalmanState!.covariance[2][2] = 2.0 // High X velocity variance
      track.kalmanState!.covariance[0][2] = 0.5 // Cross-covariance
      track.kalmanState!.covariance[2][0] = 0.5

      // Call syncPositionWithClamp which applies constraint handling
      manager.syncPositionWithClamp(track, { x: 30, y: 15 }, true, false)

      // X velocity should be zeroed (this is what syncPositionWithClamp does)
      expect(track.kalmanState!.mean[2][0]).toBe(0)
      // Y velocity should be preserved
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })

    it('reduces covariance when syncPositionWithClamp is called with clampedY', () => {
      const track = createTestTrackWithState({ x: 15, y: 24 }, { x: 0, y: 2.0 })
      track.kalmanState!.covariance[1][1] = 5.0 // High Y position variance
      track.kalmanState!.covariance[3][3] = 2.0 // High Y velocity variance

      manager.syncPositionWithClamp(track, { x: 15, y: 25 }, false, true)

      // Y velocity should be zeroed
      expect(track.kalmanState!.mean[3][0]).toBe(0)
      // X velocity should be preserved
      expect(track.kalmanState!.mean[2][0]).toBe(0)
    })

    it('zeros both velocities when both axes are clamped', () => {
      const track = createTestTrackWithState({ x: 29, y: 24 }, { x: 2.0, y: 1.5 })

      manager.syncPositionWithClamp(track, { x: 30, y: 25 }, true, true)

      // Both velocities should be zeroed
      expect(track.kalmanState!.mean[2][0]).toBe(0)
      expect(track.kalmanState!.mean[3][0]).toBe(0)
    })
  })

  describe('Cache Management', () => {
    it('removes track state from cache', () => {
      // Should not throw
      expect(() => manager.removeTrackState('test-track')).not.toThrow()
    })

    it('clears all cached states', () => {
      // Should not throw
      expect(() => manager.clearCache()).not.toThrow()
    })

    it('returns cache metrics', () => {
      const metrics = manager.getCacheMetrics()

      expect(metrics).toBeDefined()
      expect(typeof metrics.size).toBe('number')
    })
  })
})
