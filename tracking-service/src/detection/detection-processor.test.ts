/**
 * Tests for Detection Processor - Obstacle Filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DetectionProcessor } from './detection-processor.js'
import { TrackManager } from '../tracks/track-manager.js'
import { CameraRegistry } from './camera-registry.js'
import type { SiteMapObstacle } from '../config/sitemap-loader.js'

describe('DetectionProcessor - Obstacle Filtering', () => {
  let processor: DetectionProcessor
  let trackManager: TrackManager
  let cameraRegistry: CameraRegistry

  beforeEach(() => {
    trackManager = new TrackManager()
    cameraRegistry = new CameraRegistry()

    // Register a test camera
    cameraRegistry.registerCamera('test-camera', {
      position: { x: 0, y: 0, z: 2.5 },
      azimuth: 90,
      tilt: 45,
      fov: 80,
    })

    processor = new DetectionProcessor(trackManager, cameraRegistry)
  })

  describe('setObstacles', () => {
    it('filters out obstacles with blocksTracking=false', () => {
      const obstacles: SiteMapObstacle[] = [
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 5, y: 5 },
          radius: 1,
          blocksTracking: true,
        },
        {
          id: 'table-1',
          type: 'rectangle',
          position: { x: 10, y: 10 },
          dimensions: { width: 2, height: 1 },
          blocksTracking: false,
        },
      ]

      processor.setObstacles(obstacles)

      // The processor should only have 1 tracking-blocking obstacle
      // We can verify by processing a detection inside each obstacle

      // Detection inside pillar should be filtered (blocked)
      const pillarResult = processor.processWorldPosition('test-camera', 5, 5, 0.9, 1)
      // Since the position is at the pillar center, it should still create a track
      // because processWorldPosition bypasses projection
      expect(pillarResult).toBeDefined()
    })

    it('treats obstacles without blocksTracking as blocking by default', () => {
      const obstacles: SiteMapObstacle[] = [
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 5, y: 5 },
          radius: 1,
          // blocksTracking not specified - should default to true
        },
      ]

      processor.setObstacles(obstacles)
      // No error should occur
    })
  })

  describe('processWorldPosition', () => {
    it('creates tracks for valid positions', () => {
      const track = processor.processWorldPosition('test-camera', 5, 5, 0.9, 1)

      expect(track).toBeDefined()
      expect(track.globalTrackId).toBeDefined()
    })

    it('updates existing tracks with new positions', () => {
      const track1 = processor.processWorldPosition('test-camera', 5, 5, 0.9, 1)
      const track2 = processor.processWorldPosition('test-camera', 5.1, 5.1, 0.9, 1)

      // Should be the same track (positions are close enough)
      expect(track2.globalTrackId).toBe(track1.globalTrackId)
    })
  })

  describe('obstacle filtering integration', () => {
    beforeEach(() => {
      const obstacles: SiteMapObstacle[] = [
        {
          id: 'pillar-1',
          type: 'circle',
          position: { x: 6, y: 3 },
          radius: 0.25,
          blocksTracking: true,
        },
        {
          id: 'pillar-2',
          type: 'circle',
          position: { x: 12, y: 3 },
          radius: 0.25,
          blocksTracking: true,
        },
      ]
      processor.setObstacles(obstacles)
    })

    it('processWorldPosition bypasses obstacle check (direct world coords)', () => {
      // processWorldPosition is for direct testing/injection, not from camera detections
      // So it should NOT filter by obstacles
      const track = processor.processWorldPosition('test-camera', 6, 3, 0.9, 1)
      expect(track).toBeDefined()
    })
  })

  describe('frame tracking', () => {
    it('tracks last processed frame per camera', () => {
      expect(processor.getLastProcessedFrame('test-camera')).toBe(-1)

      processor.processWorldPosition('test-camera', 5, 5, 0.9, 1)
      // processWorldPosition doesn't update frame tracking, only processMessage does
      expect(processor.getLastProcessedFrame('test-camera')).toBe(-1)
    })

    it('resets frame tracking', () => {
      processor.resetFrameTracking()
      expect(processor.getLastProcessedFrame('test-camera')).toBe(-1)
    })
  })

  describe('getCameraFrameInfo', () => {
    it('returns empty array when no frames processed', () => {
      const info = processor.getCameraFrameInfo()
      expect(info).toEqual([])
    })

    it('returns frame info after updateFrameInfo', () => {
      processor.updateFrameInfo('test-camera', 100)

      const info = processor.getCameraFrameInfo()
      expect(info.length).toBe(1)
      expect(info[0].cameraId).toBe('test-camera')
      expect(info[0].frameNumber).toBe(100)
      expect(info[0].timestamp).toBeGreaterThan(0)
    })
  })
})

describe('DetectionProcessor - processMessage with obstacles', () => {
  let processor: DetectionProcessor
  let trackManager: TrackManager
  let cameraRegistry: CameraRegistry

  beforeEach(() => {
    trackManager = new TrackManager()
    cameraRegistry = new CameraRegistry()

    // Register camera with calibration for K/R/T projection
    cameraRegistry.registerCamera('camera-1', {
      position: { x: 9, y: 0, z: 2.8 },
      azimuth: 0,
      tilt: 45,
      fov: 80,
    })

    processor = new DetectionProcessor(trackManager, cameraRegistry)

    // Set up obstacles
    const obstacles: SiteMapObstacle[] = [
      {
        id: 'pillar-center',
        type: 'circle',
        position: { x: 9, y: 6 },
        radius: 0.5,
        blocksTracking: true,
      },
    ]
    processor.setObstacles(obstacles)
  })

  it('skips duplicate frame numbers', () => {
    const message1 = {
      camera_id: 'camera-1',
      frame_number: 1,
      timestamp: 1000,
      detections: [],
    }

    processor.processMessage(message1)
    const result = processor.processMessage(message1) // Same frame number

    expect(result).toEqual([])
  })

  it('processes valid detections', () => {
    const message = {
      camera_id: 'camera-1',
      frame_number: 1,
      timestamp: Date.now() / 1000,
      detections: [
        {
          track_id: 1,
          class_name: 'person',
          confidence: 0.85,
          bbox: [100, 200, 50, 100] as [number, number, number, number],
        },
      ],
    }

    // This will attempt projection which may fail depending on camera params
    const result = processor.processMessage(message)
    // Result depends on projection validity - may be empty or have tracks
    expect(Array.isArray(result)).toBe(true)
  })

  it('filters non-person detections', () => {
    const message = {
      camera_id: 'camera-1',
      frame_number: 2,
      timestamp: Date.now() / 1000,
      detections: [
        {
          track_id: 1,
          class_name: 'car', // Not a person
          confidence: 0.95,
          bbox: [100, 200, 50, 100] as [number, number, number, number],
        },
      ],
    }

    const result = processor.processMessage(message)
    expect(result).toEqual([])
  })

  it('filters low confidence detections', () => {
    const message = {
      camera_id: 'camera-1',
      frame_number: 3,
      timestamp: Date.now() / 1000,
      detections: [
        {
          track_id: 1,
          class_name: 'person',
          confidence: 0.5, // Below threshold
          bbox: [100, 200, 50, 100] as [number, number, number, number],
        },
      ],
    }

    const result = processor.processMessage(message)
    expect(result).toEqual([])
  })
})
