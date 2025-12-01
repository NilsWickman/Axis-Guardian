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
    it('confirms track after 3 detections', () => {
      // First detection
      let track = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      expect(track.isConfirmed).toBe(false)

      // Second detection
      mockTime += 100
      track = trackManager.processDetection('camera1', 1, 5.1, 5.1, 0.9)
      expect(track.isConfirmed).toBe(false)

      // Third detection - should confirm
      mockTime += 100
      track = trackManager.processDetection('camera1', 1, 5.2, 5.2, 0.9)
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
    it('rejects detection implying impossible speed', () => {
      trackManager.processDetection('camera1', 1, 0.0, 0.0, 0.9)

      // 1 second later, 100 meters away = 100 m/s (clearly impossible, exceeds maxVelocityMs=50)
      mockTime += 1000
      const track = trackManager.processDetection('camera1', 1, 100.0, 0.0, 0.9)

      // Should create a new track because velocity check failed
      expect(track.globalTrackId).toBe('global-2')
    })

    it('accepts detection at reasonable walking speed', () => {
      const track1 = trackManager.processDetection('camera1', 1, 0.0, 0.0, 0.9)

      // 1 second later, 1.5 meters away = 1.5 m/s (normal walking)
      mockTime += 1000
      const track2 = trackManager.processDetection('camera1', 1, 1.5, 0.0, 0.9)

      expect(track1.globalTrackId).toBe(track2.globalTrackId)
    })
  })

  describe('Track Expiry', () => {
    it('marks track as inactive after expiry time', () => {
      const track = trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      expect(track.isActive).toBe(true)

      // Advance time past expiry (default 5000ms)
      mockTime += 6000
      trackManager.cleanupExpiredTracks()

      const expiredTrack = trackManager.getTrackById('global-1')
      expect(expiredTrack?.isActive).toBe(false)
    })

    it('removes track completely after double expiry time', () => {
      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      // Advance time past double expiry
      mockTime += 11000
      trackManager.cleanupExpiredTracks()

      const track = trackManager.getTrackById('global-1')
      expect(track).toBeUndefined()
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

      // Position should be confidence-weighted average
      // Higher confidence (0.9) should pull toward (5.2, 5.0)
      expect(track.currentPosition.x).toBeGreaterThan(5.0)
      expect(track.currentPosition.x).toBeLessThan(5.2)
    })
  })

  describe('Getters', () => {
    it('returns only confirmed active tracks from getActiveTracks', () => {
      // Create one track, confirm it
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        trackManager.processDetection('camera1', 1, 5.0 + i * 0.1, 5.0, 0.9)
      }

      // Create another track, don't confirm (only 1 detection)
      mockTime += 100
      trackManager.processDetection('camera2', 2, 15.0, 15.0, 0.9)

      const activeTracks = trackManager.getActiveTracks()
      const allActiveTracks = trackManager.getAllActiveTracks()

      expect(activeTracks.length).toBe(1) // Only confirmed
      expect(allActiveTracks.length).toBe(2) // Both active
    })

    it('returns correct counts', () => {
      // Confirmed track
      for (let i = 0; i < 3; i++) {
        mockTime += 100
        trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)
      }

      // Unconfirmed track
      mockTime += 100
      trackManager.processDetection('camera2', 2, 15.0, 15.0, 0.9)

      expect(trackManager.getActiveTrackCount()).toBe(1)
      expect(trackManager.getPendingTrackCount()).toBe(1)
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
      expect(config.correlationDistanceM).toBe(0.5) // Default from DEFAULT_TRACKING_CONFIG
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
      let expiredTrack: string | null = null
      trackManager.onTrackExpired = (track) => {
        expiredTrack = track.globalTrackId
      }

      trackManager.processDetection('camera1', 1, 5.0, 5.0, 0.9)

      mockTime += 6000
      trackManager.cleanupExpiredTracks()

      expect(expiredTrack).toBe('global-1')
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
})
