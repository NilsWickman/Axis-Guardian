/**
 * Simulation API Integration Tests
 *
 * Tests the world-position injection endpoint and track lifecycle
 * as used by the simulate-walk CLI tool.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackManager, trackToJSON } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'

describe('Simulation API Flow', () => {
  let trackManager: TrackManager
  let detectionProcessor: DetectionProcessor
  let cameraRegistry: CameraRegistry
  let mockTime: number

  beforeEach(() => {
    mockTime = 1000

    // Create camera registry with a test camera
    cameraRegistry = new CameraRegistry()
    cameraRegistry.registerCamera('camera1', {
      position: { x: 0, y: 0, z: 3 },
      azimuth: 45,
      elevation: 30,
      fov: 60,
      maxDistance: 20,
    })

    // Create track manager with mock clock
    trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => {
        let id = 0
        return () => `global-${++id}`
      })(),
    })

    // Create detection processor
    detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  })

  describe('World Position Injection', () => {
    it('creates a new track from world position', () => {
      const track = detectionProcessor.processWorldPosition(
        'camera1',
        5.0,
        5.0,
        0.9,
        1
      )

      expect(track).toBeDefined()
      expect(track.globalTrackId).toBe('global-1')
      expect(track.currentPosition.x).toBe(5.0)
      expect(track.currentPosition.y).toBe(5.0)
      expect(track.confidence).toBe(0.9)
      expect(track.isActive).toBe(true)
    })

    it('updates existing track with subsequent world positions', () => {
      // First position
      detectionProcessor.processWorldPosition('camera1', 0.0, 0.0, 0.9, 1)

      // Second position
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 0.5, 0.5, 0.9, 1)

      // Third position
      mockTime += 100
      const track = detectionProcessor.processWorldPosition('camera1', 1.0, 1.0, 0.9, 1)

      // Should still be the same track
      expect(track.globalTrackId).toBe('global-1')
      expect(track.detectionCount).toBe(3)
      expect(track.isConfirmed).toBe(true)
    })

    it('applies Kalman filtering to positions', () => {
      // First position at origin
      detectionProcessor.processWorldPosition('camera1', 0.0, 0.0, 0.9, 1)

      // Second position with some movement
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 1.0, 1.0, 0.9, 1)

      // Third position continues movement
      mockTime += 100
      const track = detectionProcessor.processWorldPosition('camera1', 2.0, 2.0, 0.9, 1)

      // Kalman filter smooths positions - it lags behind rapid movements
      // With only 3 updates and 100ms intervals, the filter hasn't fully caught up
      // The position should be somewhere between 0 and 2 due to smoothing
      expect(track.currentPosition.x).toBeGreaterThanOrEqual(0)
      expect(track.currentPosition.x).toBeLessThan(2.5)
      expect(track.currentPosition.y).toBeGreaterThanOrEqual(0)
      expect(track.currentPosition.y).toBeLessThan(2.5)

      // More importantly, position should be smoothed (not exactly at 2.0)
      // The filter introduces lag which prevents instant jumps
      expect(track.currentPosition.x).not.toBeCloseTo(2.0, 1)
    })

    it('builds a trail of positions', () => {
      // Simulate walking
      for (let i = 0; i < 10; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i * 0.5, i * 0.5, 0.9, 1)
      }

      const track = trackManager.getTrackById('global-1')
      expect(track).toBeDefined()
      expect(track!.trail.length).toBeGreaterThan(1)
      expect(track!.trail.length).toBeLessThanOrEqual(20) // Max trail length
    })
  })

  describe('Track Lifecycle', () => {
    it('confirms track after minimum detections', () => {
      // First detection - not confirmed
      let track = detectionProcessor.processWorldPosition('camera1', 0.0, 0.0, 0.9, 1)
      expect(track.isConfirmed).toBe(false)

      // Second detection - now confirmed (minDetectionsToConfirm=2)
      mockTime += 100
      track = detectionProcessor.processWorldPosition('camera1', 0.5, 0.5, 0.9, 1)
      expect(track.isConfirmed).toBe(true)
    })

    it('marks track as inactive after expiry', () => {
      // Create confirmed track with 3 detections
      detectionProcessor.processWorldPosition('camera1', 5.0, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.1, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.2, 5.0, 0.9, 1)

      // Advance time past expiry (default 10000ms)
      mockTime += 11000
      trackManager.cleanupExpiredTracks()

      const track = trackManager.getTrackById('global-1')
      expect(track?.isActive).toBe(false)
    })

    it('removes expired track completely after double expiry', () => {
      // Create confirmed track with 3 detections
      detectionProcessor.processWorldPosition('camera1', 5.0, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.1, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.2, 5.0, 0.9, 1)

      // Advance time past double expiry (10000ms * 2)
      mockTime += 21000
      trackManager.cleanupExpiredTracks()

      const track = trackManager.getTrackById('global-1')
      expect(track).toBeUndefined()
    })
  })

  describe('Simulated Walk Path', () => {
    it('tracks a person walking diagonally', () => {
      const startX = 0
      const startY = 0
      const endX = 10
      const endY = 10
      const steps = 20
      const stepInterval = 100 // ms

      // Simulate walking from start to end
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const x = startX + (endX - startX) * t
        const y = startY + (endY - startY) * t

        mockTime += stepInterval
        detectionProcessor.processWorldPosition('camera1', x, y, 0.9, 1)
      }

      const track = trackManager.getTrackById('global-1')
      expect(track).toBeDefined()
      expect(track!.isConfirmed).toBe(true)
      // Note: Some detections may be deduplicated if movement is below threshold
      expect(track!.detectionCount).toBeGreaterThanOrEqual(steps - 5)

      // Final position should be near the end point
      expect(track!.currentPosition.x).toBeGreaterThan(8.0)
      expect(track!.currentPosition.y).toBeGreaterThan(8.0)
    })

    it('tracks multiple simultaneous walkers', () => {
      // First person walks from (0,0) to (10,10)
      for (let i = 0; i < 5; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i, i, 0.9, 1)
      }

      // Second person starts at (15,15) walking to (5,5)
      for (let i = 0; i < 5; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', 15 - i, 15 - i, 0.9, 2)
      }

      const tracks = trackManager.getAllActiveTracks()
      // With tighter tracking parameters, tracks may fragment
      // We expect at least 2 distinct track paths
      expect(tracks.length).toBeGreaterThanOrEqual(2)

      // All tracks should be different
      const trackIds = new Set(tracks.map(t => t.globalTrackId))
      expect(trackIds.size).toBe(tracks.length)
    })

    it('maintains consistent track ID across walk', () => {
      const trackIds: string[] = []

      // Walk with reasonable speed (1.5 m/s)
      for (let i = 0; i < 10; i++) {
        mockTime += 1000 // 1 second between detections
        const track = detectionProcessor.processWorldPosition(
          'camera1',
          i * 1.5, // 1.5m per second
          0,
          0.9,
          1
        )
        trackIds.push(track.globalTrackId)
      }

      // All detections should be assigned to the same track
      const uniqueIds = new Set(trackIds)
      expect(uniqueIds.size).toBe(1)
    })
  })

  describe('Track JSON Serialization', () => {
    it('serializes track to JSON format', () => {
      // Create and confirm a track
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i, i, 0.9, 1)
      }

      const track = trackManager.getTrackById('global-1')
      expect(track).toBeDefined()

      const json = trackToJSON(track!)

      // Verify JSON structure
      expect(json.globalTrackId).toBe('global-1')
      expect(json.currentPosition).toHaveProperty('x')
      expect(json.currentPosition).toHaveProperty('y')
      expect(json.isActive).toBe(true)
      expect(json.isConfirmed).toBe(true)
      expect(json.detectionCount).toBe(3)
      expect(json.confidence).toBe(0.9)
      expect(Array.isArray(json.trail)).toBe(true)
      expect(json.cameraAssociations).toHaveProperty('camera1')
    })

    it('serializes trail with timestamps', () => {
      for (let i = 0; i < 5; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i, i, 0.9, 1)
      }

      const track = trackManager.getTrackById('global-1')
      const json = trackToJSON(track!)

      expect(json.trail.length).toBeGreaterThan(0)
      expect(json.trail[0]).toHaveProperty('x')
      expect(json.trail[0]).toHaveProperty('y')
      expect(json.trail[0]).toHaveProperty('timestamp')
    })
  })

  describe('Event Callbacks', () => {
    it('fires onTrackCreated for new tracks', () => {
      let createdTrackId: string | null = null
      trackManager.onTrackCreated = (track) => {
        createdTrackId = track.globalTrackId
      }

      detectionProcessor.processWorldPosition('camera1', 5.0, 5.0, 0.9, 1)

      expect(createdTrackId).toBe('global-1')
    })

    it('fires onTrackUpdated for track updates', () => {
      const updatedTrackIds: string[] = []
      trackManager.onTrackUpdated = (track) => {
        updatedTrackIds.push(track.globalTrackId)
      }

      detectionProcessor.processWorldPosition('camera1', 0.0, 0.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 1.0, 1.0, 0.9, 1)

      // First creates, second updates
      expect(updatedTrackIds).toContain('global-1')
    })

    it('fires onTrackExpired when track expires', () => {
      let expiredTrackId: string | null = null
      trackManager.onTrackExpired = (track) => {
        expiredTrackId = track.globalTrackId
      }

      // Create confirmed track with 3 detections
      detectionProcessor.processWorldPosition('camera1', 5.0, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.1, 5.0, 0.9, 1)
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 5.2, 5.0, 0.9, 1)

      mockTime += 11000  // Past 10000ms expiry
      trackManager.cleanupExpiredTracks()

      expect(expiredTrackId).toBe('global-1')
    })
  })

  describe('API Response Format', () => {
    it('produces response compatible with /api/tracks endpoint', () => {
      // Confirm a track
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i, i, 0.9, 1)
      }

      // Get tracks like the API would
      const tracks = trackManager.getActiveTracks()
      const response = {
        count: tracks.length,
        tracks: tracks.map(trackToJSON),
      }

      expect(response.count).toBe(1)
      expect(response.tracks[0].globalTrackId).toBe('global-1')
      expect(response.tracks[0].isConfirmed).toBe(true)
    })

    it('produces response compatible with /api/tracks/all endpoint', () => {
      // Create one confirmed track
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        detectionProcessor.processWorldPosition('camera1', i, i, 0.9, 1)
      }

      // Create one unconfirmed track
      mockTime += 100
      detectionProcessor.processWorldPosition('camera1', 20, 20, 0.9, 2)

      const allTracks = trackManager.getAllActiveTracks()
      const confirmedCount = trackManager.getActiveTrackCount()
      const pendingCount = trackManager.getPendingTrackCount()

      const response = {
        count: allTracks.length,
        confirmedCount,
        pendingCount,
        tracks: allTracks.map(trackToJSON),
      }

      expect(response.count).toBe(2)
      expect(response.confirmedCount).toBe(1)
      expect(response.pendingCount).toBe(1)
    })
  })

  describe('Velocity Constraints', () => {
    it('accepts reasonable walking speeds', () => {
      // First position
      detectionProcessor.processWorldPosition('camera1', 0, 0, 0.9, 1)

      // 1 second later, 1.4m away = 1.4 m/s (normal walking)
      mockTime += 1000
      const track = detectionProcessor.processWorldPosition('camera1', 1.4, 0, 0.9, 1)

      // Should be same track
      expect(track.globalTrackId).toBe('global-1')
      expect(track.detectionCount).toBe(2)
    })

    it('rejects impossible speeds by creating new track', () => {
      // First position
      detectionProcessor.processWorldPosition('camera1', 0, 0, 0.9, 1)

      // 1 second later, 100m away = 100 m/s (impossible)
      mockTime += 1000
      const track = detectionProcessor.processWorldPosition('camera1', 100, 0, 0.9, 1)

      // Should be a new track due to velocity rejection
      expect(track.globalTrackId).toBe('global-2')
    })
  })
})

describe('Multi-Camera Simulation', () => {
  let trackManager: TrackManager
  let detectionProcessor: DetectionProcessor
  let cameraRegistry: CameraRegistry
  let mockTime: number

  beforeEach(() => {
    mockTime = 1000

    cameraRegistry = new CameraRegistry()
    cameraRegistry.registerCamera('camera1', {
      position: { x: 0, y: 10, z: 3 },
      azimuth: 270,
      elevation: 30,
      fov: 60,
      maxDistance: 20,
    })
    cameraRegistry.registerCamera('camera2', {
      position: { x: 20, y: 10, z: 3 },
      azimuth: 90,
      elevation: 30,
      fov: 60,
      maxDistance: 20,
    })

    trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => {
        let id = 0
        return () => `global-${++id}`
      })(),
    })

    detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry)
  })

  it('correlates detections from multiple cameras', () => {
    // Person at (10, 10) seen by camera1
    detectionProcessor.processWorldPosition('camera1', 10, 10, 0.9, 1)

    // Same person seen by camera2 at nearly same position
    mockTime += 50
    const track = detectionProcessor.processWorldPosition('camera2', 10.1, 10.1, 0.9, 5)

    // Should be correlated to same track
    expect(track.globalTrackId).toBe('global-1')
    expect(track.cameraAssociations.has('camera1')).toBe(true)
    expect(track.cameraAssociations.has('camera2')).toBe(true)
  })

  it('creates separate tracks for distant detections', () => {
    // Person at one side of the room
    detectionProcessor.processWorldPosition('camera1', 5, 5, 0.9, 1)

    // Different person at other side
    mockTime += 50
    const track2 = detectionProcessor.processWorldPosition('camera2', 15, 15, 0.9, 2)

    // Should be separate tracks (too far apart to correlate)
    expect(track2.globalTrackId).toBe('global-2')
    expect(trackManager.getAllActiveTracks().length).toBe(2)
  })
})
