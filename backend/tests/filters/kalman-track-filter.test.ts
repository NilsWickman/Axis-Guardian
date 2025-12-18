/**
 * Kalman Track Filter Tests
 */

import { describe, it, expect } from 'vitest'
import { KalmanTrackFilter, DEFAULT_KALMAN_CONFIG } from '../../src/filters/kalman-track-filter.js'

describe('KalmanTrackFilter', () => {
  describe('Initialization', () => {
    it('creates filter with default config', () => {
      const filter = new KalmanTrackFilter()
      expect(filter).toBeDefined()
    })

    it('creates filter with custom config', () => {
      const filter = new KalmanTrackFilter({
        processNoise: 1.0,
        measurementNoise: 0.5,
      })
      expect(filter).toBeDefined()
    })

    it('initializes state at given position', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 10.0, y: 20.0 }, 1000)

      expect(state.mean[0][0]).toBe(10.0)  // x position
      expect(state.mean[1][0]).toBe(20.0)  // y position
      expect(state.mean[2][0]).toBe(0)     // x velocity (zero initially)
      expect(state.mean[3][0]).toBe(0)     // y velocity (zero initially)
      expect(state.lastTimestamp).toBe(1000)
    })
  })

  describe('State Update', () => {
    it('updates position based on new observation', () => {
      const filter = new KalmanTrackFilter()
      const initialState = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      // New observation slightly different after 50ms
      const updatedState = filter.update(
        initialState,
        { x: 5.2, y: 5.0 },
        1050,
        'track-1'
      )

      // Position should be between initial and observation
      expect(updatedState.mean[0][0]).toBeGreaterThan(5.0)
      expect(updatedState.mean[0][0]).toBeLessThan(5.2)
      expect(updatedState.lastTimestamp).toBe(1050)
    })

    it('estimates velocity from observations', () => {
      const filter = new KalmanTrackFilter()
      let state = filter.initialize({ x: 0.0, y: 0.0 }, 1000)

      // Simulate moving at ~1m/s in x direction
      for (let i = 1; i <= 10; i++) {
        const timestamp = 1000 + i * 100  // 100ms intervals
        state = filter.update(
          state,
          { x: i * 0.1, y: 0.0 },  // 0.1m per 100ms = 1m/s
          timestamp,
          'track-1'
        )
      }

      // After multiple observations, velocity estimate should be close to 1m/s
      // Note: With higher measurementNoise (1.5), velocity estimate may be dampened
      const velocity = filter.getVelocity(state)
      expect(velocity.x).toBeGreaterThan(0.3)  // Should be positive (allowing for dampening)
      expect(velocity.x).toBeLessThan(2.0)     // Should be reasonable (within 2x of actual)
    })

    it('skips update for very small time delta', () => {
      const filter = new KalmanTrackFilter()
      const initialState = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      // Try to update with only 0.1ms delta
      const result = filter.update(
        initialState,
        { x: 10.0, y: 10.0 },
        1000.0001,  // Practically no time passed
        'track-1'
      )

      // State should remain unchanged
      expect(result.mean[0][0]).toBe(5.0)
      expect(result.mean[1][0]).toBe(5.0)
    })
  })

  describe('Prediction', () => {
    it('predicts forward using velocity', () => {
      const filter = new KalmanTrackFilter()
      // Create state with known velocity
      const state = {
        mean: [[0], [0], [1], [0.5]],  // At origin, moving 1m/s in x, 0.5m/s in y
        covariance: [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ],
        lastTimestamp: 1000,
      }

      // Predict 1 second ahead
      const predicted = filter.predict(state, 1000)

      expect(predicted.x).toBeCloseTo(1.0, 1)   // 1m/s * 1s = 1m
      expect(predicted.y).toBeCloseTo(0.5, 1)   // 0.5m/s * 1s = 0.5m
    })
  })

  describe('Position and Velocity Extraction', () => {
    it('extracts position from state', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 7.5, y: 3.2 }, 1000)

      const position = filter.getPosition(state)

      expect(position.x).toBe(7.5)
      expect(position.y).toBe(3.2)
    })

    it('extracts velocity from state', () => {
      const filter = new KalmanTrackFilter()
      const state = {
        mean: [[0], [0], [2.5], [-1.0]],
        covariance: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
        lastTimestamp: 1000,
      }

      const velocity = filter.getVelocity(state)

      expect(velocity.x).toBe(2.5)
      expect(velocity.y).toBe(-1.0)
    })

    it('calculates speed correctly', () => {
      const filter = new KalmanTrackFilter()
      const state = {
        mean: [[0], [0], [3], [4]],  // 3-4-5 triangle
        covariance: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
        lastTimestamp: 1000,
      }

      const speed = filter.getSpeed(state)

      expect(speed).toBeCloseTo(5.0, 5)  // sqrt(3^2 + 4^2) = 5
    })
  })

  describe('Uncertainty Estimation', () => {
    it('returns position uncertainty', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      const uncertainty = filter.getPositionUncertainty(state)

      // Should be positive and based on initial covariance
      expect(uncertainty).toBeGreaterThan(0)
      expect(uncertainty).toBe(Math.sqrt(DEFAULT_KALMAN_CONFIG.initialPositionUncertainty))
    })

    it('returns adaptive gating distance', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      const gatingDistance = filter.getGatingDistance(state, 1.0)

      // Should be at least the base distance
      expect(gatingDistance).toBeGreaterThanOrEqual(1.0)
    })
  })

  describe('State Cache Management', () => {
    it('removes track state from cache', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      // Update with track ID to populate cache
      filter.update(state, { x: 5.1, y: 5.0 }, 1050, 'track-1')

      // Remove from cache (should not throw)
      filter.removeTrackState('track-1')
    })

    it('clears all cached states', () => {
      const filter = new KalmanTrackFilter()
      const state = filter.initialize({ x: 5.0, y: 5.0 }, 1000)

      // Populate cache with multiple tracks
      filter.update(state, { x: 5.1, y: 5.0 }, 1050, 'track-1')
      filter.update(state, { x: 5.2, y: 5.0 }, 1100, 'track-2')

      // Clear all (should not throw)
      filter.clearCache()
    })
  })
})
