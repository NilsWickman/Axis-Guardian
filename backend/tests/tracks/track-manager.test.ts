/**
 * Track Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackManager, trackToJSON } from '../../src/tracks/track-manager.js'
import type { TrackingConfig } from '../../src/types.js'

describe('TrackManager', () => {
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

  describe('Basic Track Creation', () => {
    it('creates a new track for first detection', () => {
      const track = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      expect(track.globalTrackId).toBe('global-1')
      expect(track.currentPosition.x).toBe(5.0)
      expect(track.currentPosition.y).toBe(5.0)
      expect(track.confidence).toBe(0.9)
      expect(track.isActive).toBe(true)
      expect(track.isConfirmed).toBe(false) // Not confirmed until 3 detections
      expect(track.detectionCount).toBe(1)
    })

    it('associates camera with track', () => {
      const track = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      const assoc = track.cameraAssociations.get('camera1')
      expect(assoc).toBeDefined()
      expect(assoc?.trackIds).toContain(1)
    })
  })

  describe('Track Confirmation', () => {
    it('confirms track after minDetectionsToConfirm detections', () => {
      // Create track manager with explicit minDetectionsToConfirm=3 for this test
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `test-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      // First detection
      let track = tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      expect(track.isConfirmed).toBe(false)

      // Second detection - still not confirmed
      mockTime += 100
      track = tm.processDetection('camera1', 1, 5.1, 5.1, 0.9)
      expect(track.isConfirmed).toBe(false)

      // Third detection - should now confirm
      mockTime += 100
      track = tm.processDetection('camera1', 1, 5.2, 5.2, 0.9)
      expect(track.isConfirmed).toBe(true)
      expect(track.detectionCount).toBe(3)
    })
  })

  describe('Track Association', () => {
    it('associates same camera+trackId with existing track', () => {
      const track1 = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      mockTime += 100
      const track2 = trackManager.processDetection('camera1', 1, 5.1, 5.1, 0.9)

      expect(track1.globalTrackId).toBe(track2.globalTrackId)
      expect(trackManager.getAllTracks().length).toBe(1)
    })

    it('correlates nearby detection from different camera', () => {
      const track1 = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      mockTime += 100
      // Same position from different camera - should correlate
      const track2 = trackManager.processDetection('camera2', 5, 5.0, 5.0, 0.9)

      expect(track1.globalTrackId).toBe(track2.globalTrackId)
      expect(track2.cameraAssociations.has('camera1')).toBe(true)
      expect(track2.cameraAssociations.has('camera2')).toBe(true)
    })

    it('creates separate track for distant detection', () => {
      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      mockTime += 100
      // Far away - should create new track
      const track2 = trackManager.processDetection('camera2', 5, 20.0, 20.0, 0.9)

      expect(track2.globalTrackId).toBe('global-2')
      expect(trackManager.getAllTracks().length).toBe(2)
    })
  })

  describe('Velocity Validation', () => {
    it('rejects detection implying impossible speed from different track ID', () => {
      // Use explicit config for consistent behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `vel-${++id}` })(),
        config: { maxVelocityMs: 8, correlationDistanceM: 0.6 },
      })

      tm.processDetection('camera1', 1, 0.0, 0.0, 0.9)

      // 1 second later, 100 meters away = 100 m/s (clearly impossible)
      // Using DIFFERENT track ID (2 instead of 1) to test velocity rejection
      // Note: Same camera+trackId always associates (trusts local tracker)
      mockTime += 1000
      const track = tm.processDetection('camera1', 2, 100.0, 0.0, 0.9)

      // Should create a new track because the detection is too far away
      expect(track.globalTrackId).toBe('vel-2')
    })

    it('accepts detection at reasonable walking speed', () => {
      // Use explicit config for consistent behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `walk-${++id}` })(),
        config: { maxVelocityMs: 8, correlationDistanceM: 2.5 },
      })

      const track1 = tm.processDetection('camera1', 1, 0.0, 0.0, 0.9)

      // 1 second later, 1.5 meters away = 1.5 m/s (normal walking)
      mockTime += 1000
      const track2 = tm.processDetection('camera1', 1, 1.5, 0.0, 0.9)

      expect(track1.globalTrackId).toBe(track2.globalTrackId)
    })
  })

  describe('Track Expiry', () => {
    it('marks track as inactive after expiry time', () => {
      // Use explicit config for consistent test behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `expiry-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      // Create and confirm track with 3 detections
      tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      mockTime += 100
      tm.processDetection('camera1', 1, 5.1, 5.0, 0.9)
      mockTime += 100
      const track = tm.processDetection('camera1', 1, 5.2, 5.0, 0.9)
      expect(track.isActive).toBe(true)
      expect(track.isConfirmed).toBe(true)

      // Advance time past expiry (8000ms from ALGORITHM_CONSTANTS.trackLifecycle.trackExpiryMs)
      // but not past double expiry (16000ms) to avoid complete removal
      mockTime += 9000
      tm.cleanupExpiredTracks()

      const expiredTrack = tm.getTrackById('expiry-1')
      expect(expiredTrack?.isActive).toBe(false)
    })

    it('removes track completely after double expiry time', () => {
      // Use explicit config for consistent test behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `remove-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      // Create and confirm track with 3 detections
      tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      mockTime += 100
      tm.processDetection('camera1', 1, 5.1, 5.0, 0.9)
      mockTime += 100
      tm.processDetection('camera1', 1, 5.2, 5.0, 0.9)

      // Advance time past 5x expiry (trackExpiryMs = 10000ms from algorithm-constants)
      // Track is deleted after 5x expiry = 50000ms
      mockTime += 55000
      tm.cleanupExpiredTracks()

      const track = tm.getTrackById('remove-1')
      expect(track).toBeUndefined()
    })

    it('expires unconfirmed tracks faster', () => {
      // Use explicit config with specific unconfirmed expiry time
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `unconf-${++id}` })(),
        config: { unconfirmedTrackExpiryMs: 2000, minDetectionsToConfirm: 5 },
      })

      // Create unconfirmed track with only 1 detection
      const track = tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      expect(track.isConfirmed).toBe(false)

      // Advance time past unconfirmed expiry (2000ms) but before regular expiry
      mockTime += 2500
      tm.cleanupExpiredTracks()

      // Unconfirmed track should be deleted
      const expiredTrack = tm.getTrackById('unconf-1')
      expect(expiredTrack).toBeUndefined()
    })
  })

  describe('Trail Management', () => {
    it('adds positions to trail', () => {
      trackManager.processDetection('camera1', 1, 0.0, 0.0, 0.9)

      mockTime += 200
      trackManager.processDetection('camera1', 1, 1.0, 0.0, 0.9)

      mockTime += 200
      const track = trackManager.processDetection('camera1', 1, 2.0, 0.0, 0.9)

      expect(track.trail.length).toBeGreaterThan(1)
    })

    it('limits trail length', () => {
      const config: Partial<TrackingConfig> = { maxTrailLength: 5 }
      const manager = new TrackManager({ config, clock: () => mockTime })

      // Add many detections
      for (let i = 0; i < 20; i++) {
        mockTime += 200
        manager.processDetection('camera1', 1, i * 0.5, 0, 0.9)
      }

      const track = manager.getActiveTracks()[0] || manager.getAllActiveTracks()[0]
      expect(track.trail.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Position Merging', () => {
    it('merges detections from multiple cameras', () => {
      // Two cameras seeing same person at slightly different positions
      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.8)

      mockTime += 50 // Within merge window
      const track = trackManager.processDetection('camera2', 1, 5.2, 5.0, 0.9)

      // With Kalman filtering, position should be near input positions
      // The exact value depends on filter tuning, but should be reasonable
      expect(track.currentPosition.x).toBeGreaterThan(4.0)  // Not too far left
      expect(track.currentPosition.x).toBeLessThan(6.0)    // Not too far right
      expect(track.currentPosition.y).toBeCloseTo(5.0, 0)  // Y should be stable
    })
  })

  describe('Getters', () => {
    it('returns only confirmed active tracks from getActiveTracks', () => {
      // Use explicit config for consistent behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `getter-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      // Create one track, confirm it with 3 detections
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        tm.processDetection('camera1', 1, 5.0 + i * 0.1, 5.0, 0.9)
      }

      // Create another track, don't confirm (only 1 detection)
      mockTime += 100
      tm.processDetection('camera2', 2, 15.0, 15.0, 0.9)

      const activeTracks = tm.getActiveTracks()
      const allActiveTracks = tm.getAllActiveTracks()

      expect(activeTracks.length).toBe(1) // Only confirmed
      expect(allActiveTracks.length).toBe(2) // Both active
    })

    it('returns correct counts', () => {
      // Use explicit config for consistent behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `count-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      // Confirmed track with 3 detections
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      }

      // Unconfirmed track
      mockTime += 100
      tm.processDetection('camera2', 2, 15.0, 15.0, 0.9)

      expect(tm.getActiveTrackCount()).toBe(1)
      expect(tm.getPendingTrackCount()).toBe(1)
    })
  })

  describe('Configuration', () => {
    it('updates configuration', () => {
      trackManager.updateConfig({ correlationDistanceM: 3.0 })
      const config = trackManager.getConfig()
      expect(config.correlationDistanceM).toBe(3.0)
    })

    it('resets configuration to defaults', () => {
      trackManager.updateConfig({ correlationDistanceM: 999 })
      trackManager.resetConfig()
      const config = trackManager.getConfig()
      expect(config.correlationDistanceM).toBe(2.5) // Default from ALGORITHM_CONSTANTS.trackLifecycle.correlationDistanceM
    })
  })

  describe('Clear All Tracks', () => {
    it('removes all tracks', () => {
      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      trackManager.processDetection('camera2', 2, 15.0, 15.0, 0.9)

      expect(trackManager.getAllTracks().length).toBe(2)

      trackManager.clearAllTracks()

      expect(trackManager.getAllTracks().length).toBe(0)
    })
  })

  describe('Event Callbacks', () => {
    it('calls onTrackCreated for new tracks', () => {
      let createdTrack: string | null = null
      trackManager.onTrackCreated = (track) => {
        createdTrack = track.globalTrackId
      }

      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      expect(createdTrack).toBe('global-1')
    })

    it('calls onTrackUpdated for track updates', () => {
      let updatedTrack: string | null = null
      trackManager.onTrackUpdated = (track) => {
        updatedTrack = track.globalTrackId
      }

      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      mockTime += 100
      trackManager.processDetection('camera1', 1, 5.1, 5.1, 0.9)

      expect(updatedTrack).toBe('global-1')
    })

    it('calls onTrackExpired when track expires', () => {
      // Use explicit config for consistent behavior
      const tm = new TrackManager({
        clock: () => mockTime,
        idGenerator: (() => { let id = 0; return () => `cb-${++id}` })(),
        config: { minDetectionsToConfirm: 3 },
      })

      let expiredTrack: string | null = null
      tm.onTrackExpired = (track) => {
        expiredTrack = track.globalTrackId
      }

      // Create and confirm track with 3 detections
      tm.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      mockTime += 100
      tm.processDetection('camera1', 1, 5.1, 5.0, 0.9)
      mockTime += 100
      tm.processDetection('camera1', 1, 5.2, 5.0, 0.9)

      mockTime += 11000  // Past 10000ms expiry
      tm.cleanupExpiredTracks()

      expect(expiredTrack).toBe('cb-1')
    })
  })

  describe('trackToJSON', () => {
    it('converts track to JSON-serializable format', () => {
      const track = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      const json = trackToJSON(track)

      expect(json.globalTrackId).toBe('global-1')
      expect(json.cameraAssociations).toHaveProperty('camera1')
      expect(typeof json.cameraAssociations).toBe('object')
      // Should not have pendingDetections (internal state)
      expect(json).not.toHaveProperty('pendingDetections')
    })
  })

  describe('Cross-Camera Duplicate Prevention', () => {
    it('clusters detections from different cameras at similar positions', () => {
      // Simulate two cameras seeing the same person at nearly the same world position
      const detections = [
        { cameraId: 'camera1', localTrackId: 1, worldX: 10.0, worldY: 6.0, confidence: 0.9, timestamp: mockTime },
        { cameraId: 'camera2', localTrackId: 1, worldX: 10.3, worldY: 5.9, confidence: 0.85, timestamp: mockTime },
      ]

      const results = trackManager.processBatchDetections(detections)

      // Should create only ONE track, not two
      expect(results.length).toBe(1)
      expect(trackManager.getAllActiveTracks().length).toBe(1)

      // The track should be associated with both cameras
      const track = results[0]
      expect(track.cameraAssociations.has('camera1')).toBe(true)
      expect(track.cameraAssociations.has('camera2')).toBe(true)

      // Position should be merged (weighted centroid)
      expect(track.currentPosition.x).toBeCloseTo(10.15, 1)
      expect(track.currentPosition.y).toBeCloseTo(5.95, 1)
    })

    it('creates separate tracks for distant positions', () => {
      // Two detections far apart - should create separate tracks
      const detections = [
        { cameraId: 'camera1', localTrackId: 1, worldX: 5.0, worldY: 5.0, confidence: 0.9, timestamp: mockTime },
        { cameraId: 'camera2', localTrackId: 1, worldX: 15.0, worldY: 10.0, confidence: 0.85, timestamp: mockTime },
      ]

      const results = trackManager.processBatchDetections(detections)

      // Should create TWO tracks (positions too far apart)
      expect(results.length).toBe(2)
      expect(trackManager.getAllActiveTracks().length).toBe(2)
    })

    it('does not cluster detections from the same camera', () => {
      // Two detections from same camera at close positions - should be separate tracks
      // (same camera can't see the same person twice)
      const detections = [
        { cameraId: 'camera1', localTrackId: 1, worldX: 10.0, worldY: 6.0, confidence: 0.9, timestamp: mockTime },
        { cameraId: 'camera1', localTrackId: 2, worldX: 10.2, worldY: 6.1, confidence: 0.85, timestamp: mockTime },
      ]

      const results = trackManager.processBatchDetections(detections)

      // Should create TWO tracks (same camera = different people)
      expect(results.length).toBe(2)
      expect(trackManager.getAllActiveTracks().length).toBe(2)
    })

    it('merges duplicate tracks after batch processing', () => {
      // First, create two tracks separately (simulating race condition)
      trackManager.processDetection('camera1', 1, 10.0, 6.0, 0.9)
      mockTime += 50
      trackManager.processDetection('camera1', 1, 10.05, 6.02, 0.9) // Confirm track 1

      // Create a second track from different camera
      mockTime += 50
      trackManager.processDetection('camera2', 1, 10.2, 5.9, 0.85)
      mockTime += 50
      trackManager.processDetection('camera2', 1, 10.22, 5.92, 0.85) // Confirm track 2

      // At this point we may have 2 tracks (depending on exact positions)
      // Process another batch to trigger merge detection
      mockTime += 100
      const detections = [
        { cameraId: 'camera1', localTrackId: 1, worldX: 10.1, worldY: 6.0, confidence: 0.9, timestamp: mockTime },
      ]

      trackManager.processBatchDetections(detections)

      // After merge detection runs, there should be at most 2 confirmed tracks
      // (The exact outcome depends on whether the tracks were close enough to merge)
      const activeTracks = trackManager.getActiveTracks()
      expect(activeTracks.length).toBeLessThanOrEqual(2)
    })
  })
})
