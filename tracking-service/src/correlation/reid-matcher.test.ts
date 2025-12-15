/**
 * ReIDMatcher tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReIDMatcher, getReIDMatcher } from './reid-matcher'
import type { GlobalTrack, CameraDetection } from '../types'

describe('ReIDMatcher', () => {
  let matcher: ReIDMatcher

  // Helper to create a detection with embedding
  const createDetection = (
    cameraId: string,
    embedding: number[],
    quality = 0.9
  ): CameraDetection => ({
    cameraId,
    trackId: 1,
    worldX: 0,
    worldY: 0,
    confidence: 0.9,
    timestamp: Date.now(),
    frameNumber: 1,
    attributes: {
      embedding,
      embedding_quality: quality,
    },
  })

  // Helper to create a track with embedding
  const createTrack = (
    id: string,
    cameraId: string,
    embedding: number[],
    quality = 0.9,
    lastSeen = Date.now()
  ): GlobalTrack => ({
    globalTrackId: id,
    cameraAssociations: new Map([[cameraId, { cameraId, trackIds: [1], lastSeen }]]),
    currentPosition: { x: 0, y: 0 },
    trail: [],
    color: '#ff0000',
    lastSeen,
    isActive: true,
    isConfirmed: true,
    detectionCount: 5,
    confidence: 0.9,
    pendingDetections: [],
    consecutiveDetections: 0,
    state: 'confirmed',
    missedFrames: 0,
    attributes: {
      embedding,
      embedding_quality: quality,
      sample_count: 5,
      upper_clothing: { dominant_colors: [] },
      lower_clothing: { dominant_colors: [] },
    },
  })

  beforeEach(() => {
    matcher = new ReIDMatcher()
  })

  describe('findBestMatch', () => {
    it('should return null when detection has no embedding', () => {
      const detection: CameraDetection = {
        cameraId: 'camera1',
        trackId: 1,
        worldX: 0,
        worldY: 0,
        confidence: 0.9,
        timestamp: Date.now(),
        frameNumber: 1,
      }
      const track = createTrack('track1', 'camera1', [1, 0, 0])
      const result = matcher.findBestMatch(detection, [track], Date.now())

      expect(result.track).toBeNull()
      expect(result.similarity).toBe(0)
    })

    it('should return null when detection embedding quality is too low', () => {
      const detection = createDetection('camera1', [1, 0, 0], 0.005) // Below threshold (reid.minEmbeddingQuality: 0.01)
      const track = createTrack('track1', 'camera1', [1, 0, 0])
      const result = matcher.findBestMatch(detection, [track], Date.now())

      expect(result.track).toBeNull()
    })

    it('should match identical embeddings', () => {
      const embedding = [1, 0, 0]
      const detection = createDetection('camera1', embedding)
      const track = createTrack('track1', 'camera1', embedding)
      const result = matcher.findBestMatch(detection, [track], Date.now())

      expect(result.track).toBe(track)
      expect(result.similarity).toBeGreaterThan(0.9) // With same-camera bonus
    })

    it('should not match dissimilar embeddings', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const track = createTrack('track1', 'camera1', [-1, 0, 0]) // Opposite
      const result = matcher.findBestMatch(detection, [track], Date.now())

      expect(result.track).toBeNull()
    })

    it('should apply same-camera bonus', () => {
      const embedding = [0.8, 0.6, 0] // cos sim ≈ 0.8 with [1, 0, 0]
      const detection = createDetection('camera1', [1, 0, 0])

      const sameCamera = createTrack('track1', 'camera1', embedding)
      const diffCamera = createTrack('track2', 'camera2', embedding)

      const resultSame = matcher.findBestMatch(detection, [sameCamera], Date.now())
      const resultDiff = matcher.findBestMatch(detection, [diffCamera], Date.now())

      expect(resultSame.sameCameraMatch).toBe(true)
      expect(resultDiff.sameCameraMatch).toBe(false)
      expect(resultSame.similarity).toBeGreaterThan(resultDiff.similarity)
    })

    it('should skip tracks without embeddings', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const trackWithEmb = createTrack('track1', 'camera1', [1, 0, 0])
      const trackWithoutEmb: GlobalTrack = {
        ...trackWithEmb,
        globalTrackId: 'track2',
        attributes: undefined,
      }

      const result = matcher.findBestMatch(detection, [trackWithoutEmb, trackWithEmb], Date.now())

      expect(result.track).toBe(trackWithEmb)
    })

    it('should skip tracks that are too old', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const oldTrack = createTrack('track1', 'camera1', [1, 0, 0], 0.9, Date.now() - 25000) // 25s old (beyond adaptiveMaxReidAgeMs: 20000)
      const newTrack = createTrack('track2', 'camera1', [0.9, 0.1, 0], 0.9, Date.now())

      const result = matcher.findBestMatch(detection, [oldTrack, newTrack], Date.now())

      expect(result.track).toBe(newTrack)
    })

    it('should return best match among multiple candidates', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const poorMatch = createTrack('track1', 'camera1', [0.6, 0.8, 0])
      const goodMatch = createTrack('track2', 'camera1', [0.95, 0.05, 0])

      const result = matcher.findBestMatch(detection, [poorMatch, goodMatch], Date.now())

      expect(result.track).toBe(goodMatch)
    })
  })

  describe('findBestReIDMatch', () => {
    it('should return null when no match found', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const track = createTrack('track1', 'camera1', [-1, 0, 0])

      const result = matcher.findBestReIDMatch(detection, [track], Date.now())

      expect(result).toBeNull()
    })

    it('should return matching track', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const track = createTrack('track1', 'camera1', [1, 0, 0])

      const result = matcher.findBestReIDMatch(detection, [track], Date.now())

      expect(result).toBe(track)
    })
  })

  describe('calculateTrackSimilarity', () => {
    it('should return 0 when track1 has no embedding', () => {
      const track1: GlobalTrack = createTrack('track1', 'camera1', [])
      track1.attributes = undefined
      const track2 = createTrack('track2', 'camera1', [1, 0, 0])

      const similarity = matcher.calculateTrackSimilarity(track1, track2)

      expect(similarity).toBe(0)
    })

    it('should return 0 when track2 has no embedding', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2: GlobalTrack = createTrack('track2', 'camera1', [])
      track2.attributes = undefined

      const similarity = matcher.calculateTrackSimilarity(track1, track2)

      expect(similarity).toBe(0)
    })

    it('should return 1 for identical embeddings', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2 = createTrack('track2', 'camera1', [1, 0, 0])

      const similarity = matcher.calculateTrackSimilarity(track1, track2)

      expect(similarity).toBeCloseTo(1, 5)
    })

    it('should return 0 for orthogonal embeddings', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2 = createTrack('track2', 'camera1', [0, 1, 0])

      const similarity = matcher.calculateTrackSimilarity(track1, track2)

      expect(similarity).toBeCloseTo(0, 5)
    })
  })

  describe('shouldMergeTracks', () => {
    it('should merge tracks with high similarity and close distance', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2 = createTrack('track2', 'camera1', [1, 0, 0])

      const shouldMerge = matcher.shouldMergeTracks(track1, track2, 1.0)

      expect(shouldMerge).toBe(true)
    })

    it('should not merge tracks with high similarity but far distance', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2 = createTrack('track2', 'camera1', [1, 0, 0])

      const shouldMerge = matcher.shouldMergeTracks(track1, track2, 5.0)

      expect(shouldMerge).toBe(false)
    })

    it('should merge high similarity tracks that are close', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      // Embedding with ~0.9 similarity: [0.9, 0.436, 0] normalized
      const track2 = createTrack('track2', 'camera1', [0.9, 0.436, 0]) // sim ≈ 0.9

      const shouldMerge = matcher.shouldMergeTracks(track1, track2, 0.5)

      expect(shouldMerge).toBe(true)
    })

    it('should not merge low similarity tracks even if close', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2 = createTrack('track2', 'camera1', [0, 1, 0]) // orthogonal

      const shouldMerge = matcher.shouldMergeTracks(track1, track2, 0.3)

      expect(shouldMerge).toBe(false)
    })

    it('should not merge when embeddings are missing', () => {
      const track1 = createTrack('track1', 'camera1', [1, 0, 0])
      const track2: GlobalTrack = createTrack('track2', 'camera1', [])
      track2.attributes = undefined

      const shouldMerge = matcher.shouldMergeTracks(track1, track2, 0.3)

      expect(shouldMerge).toBe(false)
    })
  })

  describe('rankByEmbeddingSimilarity', () => {
    it('should return empty array when detection has no embedding', () => {
      const detection: CameraDetection = {
        cameraId: 'camera1',
        trackId: 1,
        worldX: 0,
        worldY: 0,
        confidence: 0.9,
        timestamp: Date.now(),
        frameNumber: 1,
      }
      const track = createTrack('track1', 'camera1', [1, 0, 0])

      const ranked = matcher.rankByEmbeddingSimilarity(detection, [track], Date.now())

      expect(ranked).toHaveLength(0)
    })

    it('should rank tracks by similarity descending', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const lowSim = createTrack('track1', 'camera1', [0.6, 0.8, 0])
      const highSim = createTrack('track2', 'camera1', [0.95, 0.05, 0])
      const medSim = createTrack('track3', 'camera1', [0.8, 0.6, 0])

      const ranked = matcher.rankByEmbeddingSimilarity(
        detection,
        [lowSim, highSim, medSim],
        Date.now()
      )

      expect(ranked).toHaveLength(3)
      expect(ranked[0].track).toBe(highSim)
      expect(ranked[1].track).toBe(medSim)
      expect(ranked[2].track).toBe(lowSim)
    })

    it('should skip old tracks', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const oldTrack = createTrack('track1', 'camera1', [1, 0, 0], 0.9, Date.now() - 25000) // 25s old (beyond adaptiveMaxReidAgeMs: 20000)
      const newTrack = createTrack('track2', 'camera1', [0.9, 0.1, 0])

      const ranked = matcher.rankByEmbeddingSimilarity(detection, [oldTrack, newTrack], Date.now())

      expect(ranked).toHaveLength(1)
      expect(ranked[0].track).toBe(newTrack)
    })

    it('should skip tracks without embeddings', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      const withEmb = createTrack('track1', 'camera1', [1, 0, 0])
      const withoutEmb: GlobalTrack = createTrack('track2', 'camera1', [])
      withoutEmb.attributes = undefined

      const ranked = matcher.rankByEmbeddingSimilarity(
        detection,
        [withoutEmb, withEmb],
        Date.now()
      )

      expect(ranked).toHaveLength(1)
      expect(ranked[0].track).toBe(withEmb)
    })
  })

  describe('configuration', () => {
    it('should use default config', () => {
      const m = new ReIDMatcher()
      // Default minSimilarity is 0.75 (from ALGORITHM_CONSTANTS.reid.minSimilarity)
      const detection = createDetection('camera1', [1, 0, 0])
      const track = createTrack('track2', 'camera2', [0.5, 0.866, 0]) // sim = 0.5 (below 0.75 threshold)

      const result = m.findBestMatch(detection, [track], Date.now())
      expect(result.track).toBeNull() // Below 0.75 threshold
    })

    it('should allow custom minSimilarity', () => {
      const m = new ReIDMatcher({ minSimilarity: 0.4 })
      const detection = createDetection('camera1', [1, 0, 0])
      const track = createTrack('track2', 'camera2', [0.7, 0.7, 0]) // sim ≈ 0.7

      const result = m.findBestMatch(detection, [track], Date.now())
      expect(result.track).toBe(track)
    })

    it('should allow updating config', () => {
      const detection = createDetection('camera1', [1, 0, 0])
      // cosine similarity with [1,0,0] is 0.5 (below default 0.75 threshold)
      const track = createTrack('track2', 'camera2', [0.5, 0.866, 0])

      // Initially won't match with default threshold of 0.75
      let result = matcher.findBestMatch(detection, [track], Date.now())
      expect(result.track).toBeNull()

      // Lower threshold to 0.4
      matcher.updateConfig({ minSimilarity: 0.4 })
      result = matcher.findBestMatch(detection, [track], Date.now())
      expect(result.track).toBe(track)
    })

    it('should respect maxTrackAgeMs', () => {
      const m = new ReIDMatcher({ maxTrackAgeMs: 2000 })
      const detection = createDetection('camera1', [1, 0, 0])
      const oldTrack = createTrack('track1', 'camera1', [1, 0, 0], 0.9, Date.now() - 3000)

      const result = m.findBestMatch(detection, [oldTrack], Date.now())
      expect(result.track).toBeNull()
    })
  })

  describe('getReIDMatcher singleton', () => {
    it('should return singleton instance', () => {
      const m1 = getReIDMatcher()
      const m2 = getReIDMatcher()
      expect(m1).toBe(m2)
    })
  })
})
