/**
 * Unit tests for globalTracks store
 *
 * Tests the Pinia store that manages global track state from the tracking service.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGlobalTrackStore, type TrailPosition, type ExitReason, type VideoTimingInfo } from '../globalTracks'

// Server track format (matching what comes from the tracking service)
interface ServerTrack {
  globalTrackId: string
  cameraAssociations: Record<string, {
    cameraId: string
    trackIds: number[]
    lastSeen: number
  }>
  currentPosition: { x: number; y: number }
  trail: TrailPosition[]
  color: string
  lastSeen: number
  isActive: boolean
  isConfirmed: boolean
  detectionCount: number
  confidence: number
  state: 'unconfirmed' | 'confirmed' | 'occluded'
  exitReason?: ExitReason
  predictedPosition?: { x: number; y: number }
  videoTiming?: VideoTimingInfo
  attributes: {
    upper_clothing: {
      dominant_colors: { name: string; score: number }[]
    }
    lower_clothing: {
      dominant_colors: { name: string; score: number }[]
    }
    embedding_quality: number
    sample_count: number
  }
}

// Mock track data matching server format
function createMockServerTrack(id: number, options: Partial<{
  x: number
  y: number
  isConfirmed: boolean
  state: 'unconfirmed' | 'confirmed' | 'occluded'
  detectionCount: number
  trailLength: number
}> = {}): ServerTrack {
  const x = options.x ?? 5.0
  const y = options.y ?? 5.0
  const trail: TrailPosition[] = []
  const trailLength = options.trailLength ?? 3

  for (let i = 0; i < trailLength; i++) {
    trail.push({
      x: x + i * 0.1,
      y: y + i * 0.1,
      timestamp: Date.now() - i * 100,
    })
  }

  return {
    globalTrackId: `global-${id}`,
    cameraAssociations: {
      camera1: {
        cameraId: 'camera1',
        trackIds: [id],
        lastSeen: Date.now(),
      },
    },
    currentPosition: { x, y },
    trail,
    color: '#10b981',
    lastSeen: Date.now(),
    isActive: true,
    isConfirmed: options.isConfirmed ?? true,
    detectionCount: options.detectionCount ?? 5,
    confidence: 0.95,
    state: options.state ?? 'confirmed',
    exitReason: null,
    videoTiming: {
      videoTimeMs: 1000,
      frameNumber: 30,
      cameraId: 'camera1',
    },
    attributes: {
      upper_clothing: {
        dominant_colors: [{ name: 'blue', score: 0.8 }],
      },
      lower_clothing: {
        dominant_colors: [{ name: 'black', score: 0.7 }],
      },
      embedding_quality: 0.8,
      sample_count: 5,
    },
  }
}

describe('globalTracks store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  describe('Server Sync', () => {
    it('setTracksFromServer populates store with server tracks', () => {
      const store = useGlobalTrackStore()

      const serverTracks = [
        createMockServerTrack(1, { x: 5, y: 5 }),
        createMockServerTrack(2, { x: 10, y: 10 }),
        createMockServerTrack(3, { x: 15, y: 5, isConfirmed: false, state: 'unconfirmed' }),
      ]

      store.setTracksFromServer(serverTracks)

      expect(store.tracks.size).toBe(3)
      expect(store.activeTracks.length).toBe(2) // Only confirmed tracks
      expect(store.allActiveTracks.length).toBe(3) // All active including unconfirmed
    })

    it('upsertTrackFromServer updates existing track', () => {
      const store = useGlobalTrackStore()

      // First, add a track
      store.setTracksFromServer([createMockServerTrack(1, { x: 5, y: 5 })])

      // Update the same track with new position
      const updatedTrack = createMockServerTrack(1, { x: 8, y: 8 })
      store.upsertTrackFromServer(updatedTrack)

      expect(store.tracks.size).toBe(1)
      const track = store.tracks.get('global-1')
      expect(track?.currentPosition.x).toBe(8)
      expect(track?.currentPosition.y).toBe(8)
    })

    it('upsertTrackFromServer creates new track if not exists', () => {
      const store = useGlobalTrackStore()

      store.upsertTrackFromServer(createMockServerTrack(1, { x: 5, y: 5 }))

      expect(store.tracks.size).toBe(1)
      expect(store.tracks.has('global-1')).toBe(true)
    })

    it('removeTrack removes track by ID', () => {
      const store = useGlobalTrackStore()

      store.setTracksFromServer([
        createMockServerTrack(1),
        createMockServerTrack(2),
      ])

      expect(store.tracks.size).toBe(2)

      store.removeTrack('global-1')

      expect(store.tracks.size).toBe(1)
      expect(store.tracks.has('global-1')).toBe(false)
      expect(store.tracks.has('global-2')).toBe(true)
    })

    it('converts server cameraAssociations object to Map', () => {
      const store = useGlobalTrackStore()

      const serverTrack = createMockServerTrack(1)
      store.setTracksFromServer([serverTrack])

      const track = store.tracks.get('global-1')
      expect(track?.cameraAssociations).toBeInstanceOf(Map)
      expect(track?.cameraAssociations.has('camera1')).toBe(true)
    })
  })

  describe('Track Attributes', () => {
    it('preserves track attributes from server', () => {
      const store = useGlobalTrackStore()

      const serverTrack = createMockServerTrack(1)
      store.setTracksFromServer([serverTrack])

      const track = store.tracks.get('global-1')
      expect(track?.attributes).toBeDefined()
      expect(track?.attributes?.upper_clothing.dominant_colors[0].name).toBe('blue')
      expect(track?.attributes?.embedding_quality).toBe(0.8)
    })

    it('updates attributes on upsert', () => {
      const store = useGlobalTrackStore()

      store.setTracksFromServer([createMockServerTrack(1)])

      const updatedTrack = createMockServerTrack(1)
      updatedTrack.attributes = {
        upper_clothing: {
          dominant_colors: [{ name: 'red', score: 0.9 }],
        },
        lower_clothing: {
          dominant_colors: [{ name: 'blue', score: 0.8 }],
        },
        embedding_quality: 0.95,
        sample_count: 10,
      }

      store.upsertTrackFromServer(updatedTrack)

      const track = store.tracks.get('global-1')
      expect(track?.attributes?.upper_clothing.dominant_colors[0].name).toBe('red')
      expect(track?.attributes?.sample_count).toBe(10)
    })
  })

  describe('Video Timing', () => {
    it('preserves video timing info from server', () => {
      const store = useGlobalTrackStore()

      const serverTrack = createMockServerTrack(1)
      serverTrack.videoTiming = {
        videoTimeMs: 5000,
        rtpTimestamp: 450000,
        frameNumber: 150,
        cameraId: 'camera1',
      }

      store.setTracksFromServer([serverTrack])

      const track = store.tracks.get('global-1')
      expect(track?.videoTiming?.videoTimeMs).toBe(5000)
      expect(track?.videoTiming?.rtpTimestamp).toBe(450000)
      expect(track?.videoTiming?.frameNumber).toBe(150)
    })
  })

  describe('Frame Info', () => {
    it('updateFrameInfo stores per-camera frame info', () => {
      const store = useGlobalTrackStore()

      store.updateFrameInfo([
        { cameraId: 'camera1', frameNumber: 100, timestamp: Date.now() },
        { cameraId: 'camera2', frameNumber: 95, timestamp: Date.now() },
      ])

      expect(store.getFrameInfoForCamera('camera1')?.frameNumber).toBe(100)
      expect(store.getFrameInfoForCamera('camera2')?.frameNumber).toBe(95)
      expect(store.getAllFrameInfo().length).toBe(2)
    })
  })

  describe('Track State', () => {
    it('activeTracks only includes confirmed active tracks', () => {
      const store = useGlobalTrackStore()

      store.setTracksFromServer([
        createMockServerTrack(1, { isConfirmed: true, state: 'confirmed' }),
        createMockServerTrack(2, { isConfirmed: false, state: 'unconfirmed' }),
        createMockServerTrack(3, { isConfirmed: true, state: 'occluded' }),
      ])

      // Active tracks should include confirmed (1) and occluded (3) but not unconfirmed (2)
      const activeIds = store.activeTracks.map(t => t.globalTrackId)
      expect(activeIds).toContain('global-1')
      expect(activeIds).not.toContain('global-2')
      // Occluded tracks with recent lastSeen should be included
      expect(activeIds).toContain('global-3')
    })

    it('handles occluded tracks with predicted position', () => {
      const store = useGlobalTrackStore()

      const occludedTrack = createMockServerTrack(1, { state: 'occluded' })
      occludedTrack.exitReason = 'pillar_occlusion'
      occludedTrack.predictedPosition = { x: 7, y: 7 }

      store.setTracksFromServer([occludedTrack])

      const track = store.tracks.get('global-1')
      expect(track?.state).toBe('occluded')
      expect(track?.predictedPosition).toEqual({ x: 7, y: 7 })
      expect(track?.exitReason).toBe('pillar_occlusion')
    })
  })

  describe('Configuration', () => {
    it('updateConfig merges config updates', () => {
      const store = useGlobalTrackStore()

      store.updateConfig({ correlationDistanceM: 2.0 })

      expect(store.config.correlationDistanceM).toBe(2.0)
      expect(store.config.mergeWindowMs).toBeDefined() // Other config preserved
    })

    it('resetConfig restores defaults', () => {
      const store = useGlobalTrackStore()

      store.updateConfig({ correlationDistanceM: 999, trackExpiryMs: 999 })
      store.resetConfig()

      expect(store.config.correlationDistanceM).toBe(1.0) // DEFAULT_CORRELATION_DISTANCE_M (synced with backend)
      expect(store.config.trackExpiryMs).toBe(5000) // DEFAULT_TRACK_EXPIRY_MS (synced with backend)
    })
  })

  describe('Trails', () => {
    it('getTrailForTrack returns trail positions', () => {
      const store = useGlobalTrackStore()

      const serverTrack = createMockServerTrack(1, { trailLength: 5 })
      store.setTracksFromServer([serverTrack])

      const trail = store.getTrailForTrack('global-1')
      expect(trail.length).toBe(5)
    })

    it('showTrails toggle works', () => {
      const store = useGlobalTrackStore()

      expect(store.showTrails).toBe(true)

      store.setShowTrails(false)
      expect(store.showTrails).toBe(false)
    })
  })

  describe('Clear All', () => {
    it('clearAllTracks removes all tracks', () => {
      const store = useGlobalTrackStore()

      store.setTracksFromServer([
        createMockServerTrack(1),
        createMockServerTrack(2),
        createMockServerTrack(3),
      ])

      expect(store.tracks.size).toBe(3)

      store.clearAllTracks()

      expect(store.tracks.size).toBe(0)
      expect(store.activeTracks.length).toBe(0)
    })
  })
})
