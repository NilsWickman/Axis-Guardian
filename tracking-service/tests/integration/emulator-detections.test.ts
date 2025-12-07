/**
 * Camera Emulator Integration Tests
 *
 * Tests the emulator detection endpoint that accepts detections
 * in the left/top/right/bottom bbox format from camera emulators.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackManager, trackToJSON } from '../../src/tracks/track-manager.js'
import { DetectionProcessor } from '../../src/detection/detection-processor.js'
import { CameraRegistry } from '../../src/detection/camera-registry.js'

/**
 * Helper to convert emulator bbox format to standard format
 */
function convertEmulatorBbox(bbox: { left: number; top: number; right: number; bottom: number }) {
  return {
    x: bbox.left,
    y: bbox.top,
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
  }
}

describe('Camera Emulator Detection Format', () => {
  describe('Bbox Format Conversion', () => {
    it('converts left/top/right/bottom to x/y/width/height', () => {
      const emulatorBbox = {
        left: 0.4,
        top: 0.3,
        right: 0.6,
        bottom: 0.7,
      }

      const converted = convertEmulatorBbox(emulatorBbox)

      expect(converted.x).toBe(0.4)
      expect(converted.y).toBe(0.3)
      expect(converted.width).toBeCloseTo(0.2, 5)
      expect(converted.height).toBeCloseTo(0.4, 5)
    })

    it('handles real detection data from preprocessed video', () => {
      // Real detection from view-HC3-preprocessed.detections.json
      const emulatorBbox = {
        left: 0.778125,
        top: 0.5,
        right: 0.859375,
        bottom: 0.8638888888888889,
      }

      const converted = convertEmulatorBbox(emulatorBbox)

      expect(converted.x).toBeCloseTo(0.778125, 5)
      expect(converted.y).toBeCloseTo(0.5, 5)
      expect(converted.width).toBeCloseTo(0.08125, 5)
      expect(converted.height).toBeCloseTo(0.3638888888888889, 5)
    })

    it('handles edge-of-frame detections', () => {
      const edgeBbox = {
        left: 0.0,
        top: 0.1,
        right: 0.15,
        bottom: 0.9,
      }

      const converted = convertEmulatorBbox(edgeBbox)

      expect(converted.x).toBe(0.0)
      expect(converted.y).toBe(0.1)
      expect(converted.width).toBe(0.15)
      expect(converted.height).toBe(0.8)
    })
  })
})

describe('Emulator Detection Processing', () => {
  let trackManager: TrackManager
  let detectionProcessor: DetectionProcessor
  let cameraRegistry: CameraRegistry
  let mockTime: number

  beforeEach(() => {
    mockTime = 1000

    // Create camera registry with real camera parameters
    cameraRegistry = new CameraRegistry()
    cameraRegistry.registerCamera('camera1', {
      position: { x: 1.3, y: 10.9, z: 1.5 },
      azimuth: 321,
      elevation: 45,
      fov: 60,
      maxDistance: 100,
    })
    cameraRegistry.registerCamera('camera2', {
      position: { x: 15.75, y: 10.9, z: 1.5 },
      azimuth: 253,
      elevation: 45,
      fov: 60,
      maxDistance: 100,
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

  describe('Single Frame Processing', () => {
    it('processes a single emulator detection', () => {
      const bbox = convertEmulatorBbox({
        left: 0.4,
        top: 0.3,
        right: 0.6,
        bottom: 0.7,
      })

      const track = detectionProcessor.processInjection('camera1', bbox, 0.9, 1)

      expect(track).toBeDefined()
      expect(track!.globalTrackId).toBe('global-1')
      expect(track!.confidence).toBe(0.9)
    })

    it('processes multiple detections in same frame', () => {
      const detections = [
        { left: 0.1, top: 0.3, right: 0.2, bottom: 0.7 },
        { left: 0.4, top: 0.3, right: 0.5, bottom: 0.7 },
        { left: 0.7, top: 0.3, right: 0.8, bottom: 0.7 },
      ]

      const tracks: string[] = []
      for (let i = 0; i < detections.length; i++) {
        const bbox = convertEmulatorBbox(detections[i])
        const track = detectionProcessor.processInjection('camera1', bbox, 0.9, i + 1)
        if (track) {
          tracks.push(track.globalTrackId)
        }
      }

      // Each detection should create a separate track (far apart)
      const uniqueTracks = new Set(tracks)
      expect(uniqueTracks.size).toBe(3)
    })
  })

  describe('Multi-Frame Tracking', () => {
    it('tracks person across multiple frames', () => {
      // Simulate person moving across frames (slight bbox movement)
      const frames = [
        { left: 0.4, top: 0.3, right: 0.5, bottom: 0.7 },
        { left: 0.41, top: 0.31, right: 0.51, bottom: 0.71 },
        { left: 0.42, top: 0.32, right: 0.52, bottom: 0.72 },
      ]

      let lastTrackId: string | undefined

      for (let i = 0; i < frames.length; i++) {
        mockTime += 33 // ~30fps
        const bbox = convertEmulatorBbox(frames[i])
        const track = detectionProcessor.processInjection('camera1', bbox, 0.9, 1)
        if (track) {
          lastTrackId = track.globalTrackId
        }
      }

      // Should be same track across all frames
      expect(lastTrackId).toBe('global-1')

      // Track should be confirmed after 3 detections
      const track = trackManager.getTrackById('global-1')
      expect(track?.isConfirmed).toBe(true)
      expect(track?.detectionCount).toBe(3)
    })

    it('handles track ID from emulator', () => {
      // Emulator provides track_id to help with association
      const detections = [
        { trackId: 5, bbox: { left: 0.4, top: 0.3, right: 0.5, bottom: 0.7 } },
        { trackId: 5, bbox: { left: 0.41, top: 0.31, right: 0.51, bottom: 0.71 } },
        { trackId: 5, bbox: { left: 0.42, top: 0.32, right: 0.52, bottom: 0.72 } },
      ]

      for (const det of detections) {
        mockTime += 33
        const bbox = convertEmulatorBbox(det.bbox)
        detectionProcessor.processInjection('camera1', bbox, 0.9, det.trackId)
      }

      // Should create single track
      const allTracks = trackManager.getAllActiveTracks()
      expect(allTracks.length).toBe(1)
    })
  })

  describe('Real Detection Data Format', () => {
    it('processes real detection from HC3 camera', () => {
      // Actual detection from frame 0 of view-HC3-preprocessed.detections.json
      const realDetection = {
        bbox: {
          left: 0.778125,
          top: 0.5,
          right: 0.859375,
          bottom: 0.8638888888888889,
        },
        confidence: 0.89501953125,
        class_name: 'person',
        track_id: 1,
      }

      const bbox = convertEmulatorBbox(realDetection.bbox)
      const track = detectionProcessor.processInjection(
        'camera1',
        bbox,
        realDetection.confidence,
        realDetection.track_id
      )

      expect(track).toBeDefined()
      expect(track!.confidence).toBeCloseTo(0.895, 2)
    })

    it('processes frame with multiple real detections', () => {
      // Multiple detections from frame 0
      const realDetections = [
        { bbox: { left: 0.778125, top: 0.5, right: 0.859375, bottom: 0.8638888888888889 }, confidence: 0.89501953125, track_id: 1 },
        { bbox: { left: 0.707421875, top: 0.44305555555555554, right: 0.775390625, bottom: 0.75625 }, confidence: 0.87744140625, track_id: 2 },
        { bbox: { left: 0.215625, top: 0.5388888888888889, right: 0.2609375, bottom: 0.7208333333333333 }, confidence: 0.87646484375, track_id: 3 },
      ]

      const trackIds: string[] = []
      for (const det of realDetections) {
        const bbox = convertEmulatorBbox(det.bbox)
        const track = detectionProcessor.processInjection('camera1', bbox, det.confidence, det.track_id)
        if (track) {
          trackIds.push(track.globalTrackId)
        }
      }

      // All detections should create tracks (may or may not be same track depending on projection)
      expect(trackIds.length).toBe(3)
    })
  })

  describe('Camera ID Normalization', () => {
    it('normalizes camera-HC3 to camera1', () => {
      // CameraRegistry should handle camera ID mapping
      const normalizedId = cameraRegistry.normalizeCameraId('camera-HC3')
      expect(normalizedId).toBe('camera1')
    })

    it('normalizes camera-HC4 to camera2', () => {
      const normalizedId = cameraRegistry.normalizeCameraId('camera-HC4')
      expect(normalizedId).toBe('camera2')
    })

    it('passes through camera1 unchanged', () => {
      const normalizedId = cameraRegistry.normalizeCameraId('camera1')
      expect(normalizedId).toBe('camera1')
    })
  })

  describe('Projection from Emulator Detections', () => {
    it('projects detection to world coordinates', () => {
      // Center-ish detection should project to a valid world point
      const bbox = convertEmulatorBbox({
        left: 0.4,
        top: 0.3,
        right: 0.6,
        bottom: 0.7,
      })

      const track = detectionProcessor.processInjection('camera1', bbox, 0.9, 1)

      expect(track).toBeDefined()
      // World coordinates should be reasonable
      expect(track!.currentPosition.x).not.toBeNaN()
      expect(track!.currentPosition.y).not.toBeNaN()
    })

    it('produces different world points for different cameras', () => {
      const bbox = convertEmulatorBbox({
        left: 0.4,
        top: 0.4,
        right: 0.6,
        bottom: 0.8,
      })

      const track1 = detectionProcessor.processInjection('camera1', bbox, 0.9, 1)
      mockTime += 100
      const track2 = detectionProcessor.processInjection('camera2', bbox, 0.9, 1)

      expect(track1).toBeDefined()
      expect(track2).toBeDefined()

      // Same bbox on different cameras should produce different world positions
      // (unless they happen to correlate, which is unlikely with these cameras)
      if (track1!.globalTrackId !== track2!.globalTrackId) {
        const pos1 = track1!.currentPosition
        const pos2 = track2!.currentPosition
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
        expect(distance).toBeGreaterThan(1) // At least 1m apart
      }
    })
  })

  describe('Frame Sequence Simulation', () => {
    it('simulates realistic frame sequence', () => {
      // Simulate 30fps video with person walking
      const fps = 30
      const frameInterval = 1000 / fps

      // Person starts at one position and moves slightly each frame
      let baseLeft = 0.4
      let baseTop = 0.4

      const confirmedTrackIds: string[] = []

      for (let frame = 0; frame < 10; frame++) {
        mockTime += frameInterval

        // Slight movement per frame
        baseLeft += 0.005
        baseTop += 0.002

        const bbox = convertEmulatorBbox({
          left: baseLeft,
          top: baseTop,
          right: baseLeft + 0.1,
          bottom: baseTop + 0.4,
        })

        const track = detectionProcessor.processInjection('camera1', bbox, 0.9, 1)
        if (track && track.isConfirmed) {
          confirmedTrackIds.push(track.globalTrackId)
        }
      }

      // Track should be confirmed after 3 detections
      expect(confirmedTrackIds.length).toBeGreaterThan(0)

      // All confirmed should be same track
      const uniqueConfirmed = new Set(confirmedTrackIds)
      expect(uniqueConfirmed.size).toBe(1)
    })
  })
})

describe('Detection Statistics', () => {
  let trackManager: TrackManager
  let detectionProcessor: DetectionProcessor
  let cameraRegistry: CameraRegistry
  let mockTime: number

  beforeEach(() => {
    mockTime = 1000

    cameraRegistry = new CameraRegistry()
    cameraRegistry.registerCamera('camera1', {
      position: { x: 1.3, y: 10.9, z: 1.5 },
      azimuth: 321,
      elevation: 45,
      fov: 60,
      maxDistance: 100,
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

  it('tracks detection count per track', () => {
    // Process 5 frames
    for (let i = 0; i < 5; i++) {
      mockTime += 33
      const bbox = convertEmulatorBbox({
        left: 0.4 + i * 0.01,
        top: 0.4,
        right: 0.5 + i * 0.01,
        bottom: 0.8,
      })
      detectionProcessor.processInjection('camera1', bbox, 0.9, 1)
    }

    const track = trackManager.getTrackById('global-1')
    expect(track).toBeDefined()
    expect(track!.detectionCount).toBe(5)
  })

  it('calculates track counts correctly', () => {
    // Create 3 tracks with different states
    // Track 1: confirmed (3 detections, >= minDetectionsToConfirm=2)
    for (let i = 0; i < 3; i++) {
      mockTime += 33
      const bbox = convertEmulatorBbox({ left: 0.1, top: 0.4, right: 0.2, bottom: 0.8 })
      detectionProcessor.processInjection('camera1', bbox, 0.9, 1)
    }

    // Track 2: pending (1 detection, < minDetectionsToConfirm=2)
    mockTime += 33
    const bbox2 = convertEmulatorBbox({ left: 0.5, top: 0.4, right: 0.6, bottom: 0.8 })
    detectionProcessor.processInjection('camera1', bbox2, 0.9, 2)

    // Track 3: confirmed (2 detections, >= minDetectionsToConfirm=2)
    for (let i = 0; i < 2; i++) {
      mockTime += 33
      const bbox3 = convertEmulatorBbox({ left: 0.8, top: 0.4, right: 0.9, bottom: 0.8 })
      detectionProcessor.processInjection('camera1', bbox3, 0.9, 3)
    }

    expect(trackManager.getActiveTrackCount()).toBe(2) // Confirmed (tracks with >= 2 detections)
    expect(trackManager.getPendingTrackCount()).toBe(1) // Pending (tracks with < 2 detections)
    expect(trackManager.getAllActiveTracks().length).toBe(3) // All active
  })
})
