/**
 * Position Continuity Tests
 *
 * Integration tests to verify that the tracking pipeline produces smooth,
 * continuous position updates without sudden jumps or discontinuities.
 *
 * These tests validate the fixes for projection accuracy issues:
 * - Startup stabilization produces smooth transitions
 * - Kalman filter doesn't cause position snapping
 * - Position deltas remain within expected thresholds
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackManager } from '../../src/tracks/track-manager.js'

describe('Position Continuity', () => {
  let trackManager: TrackManager
  let mockTime: number

  beforeEach(() => {
    mockTime = 1000
    trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => {
        let id = 0
        return () => `global-${++id}`
      })(),
    })
  })

  describe('Startup Stabilization', () => {
    it('produces smooth position updates during startup window', () => {
      const MAX_DELTA_M = 0.5 // Maximum allowed position jump in meters
      const positions: { x: number; y: number; timestamp: number }[] = []

      // Simulate a person walking slowly (0.5 m/s)
      // Detection interval: 100ms
      // Expected movement per frame: 0.05m
      let track = trackManager.processDetection('camera1', 1, 10.0, 10.0, 0.9)
      positions.push({ x: track.currentPosition.x, y: track.currentPosition.y, timestamp: mockTime })

      // Feed 20 detections over 2 seconds (covers stabilization window of 1.2s)
      for (let i = 1; i <= 20; i++) {
        mockTime += 100 // 100ms intervals
        const expectedX = 10.0 + i * 0.05 // Moving 0.05m per frame
        const expectedY = 10.0 + i * 0.02 // Slight Y drift

        track = trackManager.processDetection('camera1', 1, expectedX, expectedY, 0.9)
        positions.push({ x: track.currentPosition.x, y: track.currentPosition.y, timestamp: mockTime })
      }

      // Verify no sudden jumps between consecutive positions
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)

        expect(delta).toBeLessThan(MAX_DELTA_M)
      }

      // Max delta should be reasonable
      expect(maxDelta).toBeLessThan(MAX_DELTA_M)
    })

    it('does not cause visible jump when stabilization ends', () => {
      const STABILIZATION_WINDOW_MS = 1200 // From track-manager.ts
      const MAX_DELTA_M = 0.3 // Maximum position jump

      // Create track and feed detections through stabilization
      let track = trackManager.processDetection('camera1', 1, 10.0, 10.0, 0.9)
      let lastPosition = { x: track.currentPosition.x, y: track.currentPosition.y }

      // Feed detections up to just before stabilization ends
      for (let i = 0; i < 11; i++) {
        mockTime += 100
        const x = 10.0 + i * 0.05
        track = trackManager.processDetection('camera1', 1, x, 10.0, 0.9)
        lastPosition = { x: track.currentPosition.x, y: track.currentPosition.y }
      }

      // Now we're around 1.1 seconds - just before stabilization ends at 1.2s
      // Feed one more detection that crosses the stabilization threshold
      mockTime += 150 // Now at 1.25s, past stabilization window

      const x = 10.0 + 11 * 0.05 + 0.075 // Continue movement
      track = trackManager.processDetection('camera1', 1, x, 10.0, 0.9)

      const dx = track.currentPosition.x - lastPosition.x
      const dy = track.currentPosition.y - lastPosition.y
      const delta = Math.sqrt(dx * dx + dy * dy)

      // The transition should be smooth, not a sudden jump
      expect(delta).toBeLessThan(MAX_DELTA_M)
    })
  })

  describe('Continuous Movement', () => {
    it('tracks continuous movement without discontinuities', () => {
      const MAX_DELTA_M = 0.5
      const positions: { x: number; y: number }[] = []

      // Create and confirm track first
      let track = trackManager.processDetection('camera1', 1, 0.0, 0.0, 0.9)
      positions.push({ ...track.currentPosition })

      // Simulate walking in a straight line at 1 m/s for 5 seconds
      // With 50ms detection interval, expect 0.05m movement per frame
      for (let i = 1; i <= 100; i++) {
        mockTime += 50
        const x = i * 0.05 // 1 m/s * 0.05s = 0.05m per frame
        track = trackManager.processDetection('camera1', 1, x, 0.0, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Verify smooth movement
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)
      }

      expect(maxDelta).toBeLessThan(MAX_DELTA_M)
    })

    it('handles diagonal movement smoothly', () => {
      const MAX_DELTA_M = 0.5
      const positions: { x: number; y: number }[] = []

      let track = trackManager.processDetection('camera1', 1, 0.0, 0.0, 0.9)
      positions.push({ ...track.currentPosition })

      // Simulate diagonal walking (1 m/s in both X and Y)
      for (let i = 1; i <= 50; i++) {
        mockTime += 50
        const pos = i * 0.05 // Same speed in both dimensions
        track = trackManager.processDetection('camera1', 1, pos, pos, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Verify smooth movement
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)
      }

      // Diagonal movement has sqrt(2) factor, so slightly higher threshold
      expect(maxDelta).toBeLessThan(MAX_DELTA_M * 1.5)
    })
  })

  describe('Noisy Detections', () => {
    it('smooths out detection noise without causing jumps', () => {
      const MAX_DELTA_M = 0.4
      const NOISE_AMPLITUDE = 0.1 // 10cm noise
      const positions: { x: number; y: number }[] = []

      let track = trackManager.processDetection('camera1', 1, 10.0, 10.0, 0.9)
      positions.push({ ...track.currentPosition })

      // Simulate stationary person with noisy detections
      for (let i = 1; i <= 30; i++) {
        mockTime += 100

        // Add random noise to base position
        const noiseX = (Math.random() - 0.5) * 2 * NOISE_AMPLITUDE
        const noiseY = (Math.random() - 0.5) * 2 * NOISE_AMPLITUDE

        track = trackManager.processDetection('camera1', 1, 10.0 + noiseX, 10.0 + noiseY, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Kalman filter should smooth out the noise
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)
      }

      expect(maxDelta).toBeLessThan(MAX_DELTA_M)

      // Final position should be close to true position (noise smoothed out)
      const lastPos = positions[positions.length - 1]
      const distFromTrue = Math.sqrt(
        Math.pow(lastPos.x - 10.0, 2) + Math.pow(lastPos.y - 10.0, 2)
      )
      expect(distFromTrue).toBeLessThan(0.3) // Should be within 30cm of true position
    })
  })

  describe('Multi-Camera Transition', () => {
    it('maintains continuity when detection switches cameras', () => {
      const MAX_DELTA_M = 0.5
      const positions: { x: number; y: number }[] = []

      // Start with camera1
      let track = trackManager.processDetection('camera1', 1, 10.0, 10.0, 0.9)
      positions.push({ ...track.currentPosition })

      // Continue detections from camera1
      for (let i = 1; i <= 5; i++) {
        mockTime += 100
        track = trackManager.processDetection('camera1', 1, 10.0 + i * 0.1, 10.0, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Switch to camera2 (same area, slight calibration difference)
      // Real cameras may have ~0.3m projection variance between cameras
      for (let i = 6; i <= 10; i++) {
        mockTime += 100
        // Slight offset simulating camera calibration difference
        const x = 10.0 + i * 0.1 + 0.15
        const y = 10.0 + 0.1
        track = trackManager.processDetection('camera2', 2, x, y, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Verify smooth transitions
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)
      }

      expect(maxDelta).toBeLessThan(MAX_DELTA_M)
    })
  })

  describe('Direction Change', () => {
    it('handles direction reversal smoothly', () => {
      const MAX_DELTA_M = 0.5
      const positions: { x: number; y: number }[] = []

      // Start walking right
      let track = trackManager.processDetection('camera1', 1, 10.0, 10.0, 0.9)
      positions.push({ ...track.currentPosition })

      for (let i = 1; i <= 10; i++) {
        mockTime += 100
        track = trackManager.processDetection('camera1', 1, 10.0 + i * 0.1, 10.0, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Now walk back left
      for (let i = 1; i <= 10; i++) {
        mockTime += 100
        track = trackManager.processDetection('camera1', 1, 11.0 - i * 0.1, 10.0, 0.9)
        positions.push({ ...track.currentPosition })
      }

      // Verify smooth movement including direction change
      let maxDelta = 0
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x
        const dy = positions[i].y - positions[i - 1].y
        const delta = Math.sqrt(dx * dx + dy * dy)
        maxDelta = Math.max(maxDelta, delta)
      }

      expect(maxDelta).toBeLessThan(MAX_DELTA_M)
    })
  })
})
