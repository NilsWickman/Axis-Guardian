/**
 * Tests for MultiCameraSyncBuffer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MultiCameraSyncBuffer } from './multi-camera-sync-buffer.js'
import type { DetectionMessage } from '../types.js'

describe('MultiCameraSyncBuffer', () => {
  let syncBuffer: MultiCameraSyncBuffer

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    syncBuffer?.destroy()
    vi.useRealTimers()
  })

  function createMessage(
    cameraId: string,
    frameNumber: number,
    detectionCount: number = 1
  ): DetectionMessage {
    return {
      camera_id: cameraId,
      frame_number: frameNumber,
      timestamp: Date.now() / 1000,
      detection_count: detectionCount,
      video_time_ms: frameNumber * 33, // ~30fps
      detections: Array.from({ length: detectionCount }, (_, i) => ({
        class_name: 'person',
        confidence: 0.9,
        bbox: [0.1, 0.1, 0.2, 0.4] as [number, number, number, number],
        track_id: i,
      })),
    }
  }

  describe('basic buffering', () => {
    it('should buffer messages and flush on timeout', async () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 100,
        minCamerasForSync: 2, // Require 2 cameras to complete
      })

      // Register 2 cameras so buffer waits for both
      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      // Add a message from only one camera
      syncBuffer.addMessage(createMessage('camera1', 1))

      // No immediate flush (waiting for camera2)
      expect(flushed.length).toBe(0)

      // Wait for sync window
      vi.advanceTimersByTime(150)

      // Should have flushed on timeout
      expect(flushed.length).toBe(1)
      expect(flushed[0].length).toBe(1)
      expect(flushed[0][0].camera_id).toBe('camera1')
    })

    it('should flush immediately when all cameras report', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 100,
        minCamerasForSync: 2,
      })

      // Register cameras
      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      // Add messages from both cameras
      syncBuffer.addMessage(createMessage('camera1', 1))
      syncBuffer.addMessage(createMessage('camera2', 1))

      // Should flush immediately (all cameras reported)
      expect(flushed.length).toBe(1)
      expect(flushed[0].length).toBe(2)
    })
  })

  describe('frame correlation', () => {
    it('should group messages by frame number', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 100,
        useFrameNumberCorrelation: true,
      })

      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      // Frame 1 from both cameras
      syncBuffer.addMessage(createMessage('camera1', 1))
      syncBuffer.addMessage(createMessage('camera2', 1))

      // Frame 2 from both cameras
      syncBuffer.addMessage(createMessage('camera1', 2))
      syncBuffer.addMessage(createMessage('camera2', 2))

      // Should have 2 batches (one per frame)
      expect(flushed.length).toBe(2)
      expect(flushed[0].every((m) => m.frame_number === 1)).toBe(true)
      expect(flushed[1].every((m) => m.frame_number === 2)).toBe(true)
    })

    it('should fall back to time-based bucketing when frame numbers are not aligned', () => {
      // Explicitly disable frame-number correlation to test time-based bucketing
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 200,
        useFrameNumberCorrelation: false,
      })

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => flushed.push(messages))

      // Two cameras that report at the same video time but with different frame numbers.
      // This happens when cameras have different internal frame counters or when feeds start at different offsets.
      const msgA = createMessage('cameraA', 100)
      const msgB = createMessage('cameraB', 105)
      msgB.video_time_ms = msgA.video_time_ms // force same time bucket

      syncBuffer.addMessage(msgA)
      syncBuffer.addMessage(msgB)

      // Should flush as a complete 2-camera batch immediately on the second message.
      expect(flushed.length).toBe(1)
      expect(flushed[0].length).toBe(2)
    })

    it('should still form complete batches when registered cameras differ from traffic camera IDs', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 200,
      })

      // Register sitemap cameras that never send data in this test (common in replay/mixed setups)
      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => flushed.push(messages))

      // Actual traffic uses different camera IDs
      const msgA = createMessage('camera-HC3', 1)
      const msgB = createMessage('camera-HC4', 1)

      syncBuffer.addMessage(msgA)
      syncBuffer.addMessage(msgB)

      // Should still flush complete once both *active discovered* cameras report
      expect(flushed.length).toBe(1)
      expect(flushed[0].length).toBe(2)
    })

    it('should align cameras with different video_time_ms start offsets (1-3s skew)', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 200,
      })

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => flushed.push(messages))

      // Camera B has a +2000ms start offset relative to camera A.
      const msgA = createMessage('cameraA', 1)
      const msgB = createMessage('cameraB', 1)
      msgA.video_time_ms = 1000
      msgB.video_time_ms = 3000

      syncBuffer.addMessage(msgA)
      syncBuffer.addMessage(msgB)

      // After normalization, both should land in the same time bucket and flush as a complete batch.
      expect(flushed.length).toBe(1)
      expect(flushed[0].length).toBe(2)
    })
  })

  describe('metrics', () => {
    it('should track batch metrics', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 50,
      })

      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      syncBuffer.onFlush(() => {})

      // Add messages
      syncBuffer.addMessage(createMessage('camera1', 1, 3))
      syncBuffer.addMessage(createMessage('camera2', 1, 2))

      const metrics = syncBuffer.getMetrics()

      expect(metrics.batchesProcessed).toBe(1)
      expect(metrics.completeBatches).toBe(1)
      expect(metrics.avgCamerasPerBatch).toBe(2)
      expect(metrics.avgDetectionsPerBatch).toBe(5)
    })

    it('should track timeout flushes', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 50,
      })

      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      syncBuffer.onFlush(() => {})

      // Only one camera reports
      syncBuffer.addMessage(createMessage('camera1', 1))

      // Wait for timeout
      vi.advanceTimersByTime(100)

      const metrics = syncBuffer.getMetrics()

      expect(metrics.batchesProcessed).toBe(1)
      expect(metrics.timeoutFlushes).toBe(1)
      expect(metrics.completeBatches).toBe(0)
    })
  })

  describe('clock offset', () => {
    it('should record camera clock offsets', () => {
      syncBuffer = new MultiCameraSyncBuffer()

      syncBuffer.recordClockOffset('camera1', 50)
      syncBuffer.recordClockOffset('camera2', -30)

      const metrics = syncBuffer.getMetrics()

      expect(metrics.cameraClockOffsets.get('camera1')).toBe(50)
      expect(metrics.cameraClockOffsets.get('camera2')).toBe(-30)
    })
  })

  describe('buffer overflow', () => {
    it('should flush on buffer overflow', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 10000, // Long timeout
        maxBufferedDetections: 10,
      })

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      // Add many frames to trigger overflow
      for (let i = 0; i < 5; i++) {
        syncBuffer.addMessage(createMessage('camera1', i, 5))
      }

      // Should have flushed some buckets due to overflow
      expect(flushed.length).toBeGreaterThan(0)
    })
  })

  describe('adaptive timeout', () => {
    it('should use shorter timeout for single camera', () => {
      // Use a shorter syncWindowMs so timer fires more frequently
      // Timer interval = syncWindowMs / 4 = 40ms
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 160,
        adaptiveTimeout: true,
        singleCameraTimeoutMs: 50,
        perCameraTimeoutMs: 100,
        maxAdaptiveTimeoutMs: 400,
      })

      // Only one camera registered and active
      syncBuffer.registerCamera('camera1')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      syncBuffer.addMessage(createMessage('camera1', 1))

      // Should not flush immediately
      expect(flushed.length).toBe(0)

      // Wait for timer to fire (interval = 40ms) after adaptive timeout (50ms)
      vi.advanceTimersByTime(80)

      // Should have flushed quickly with adaptive timeout
      expect(flushed.length).toBe(1)
    })

    it('should use longer timeout for multiple cameras', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 160,
        adaptiveTimeout: true,
        singleCameraTimeoutMs: 50,
        perCameraTimeoutMs: 100,
        maxAdaptiveTimeoutMs: 400,
      })

      // Two cameras registered
      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      // Send from BOTH cameras so both are considered "active"
      // This is required because the adaptive timeout is based on active cameras
      syncBuffer.addMessage(createMessage('camera1', 0))  // Frame 0 from camera1
      syncBuffer.addMessage(createMessage('camera2', 0))  // Frame 0 from camera2 (completes batch)

      // First batch should flush immediately since both cameras reported
      expect(flushed.length).toBe(1)

      // Now send a new frame from only camera1
      syncBuffer.addMessage(createMessage('camera1', 1))

      // Wait past single camera timeout but before multi-camera timeout
      vi.advanceTimersByTime(80)

      // Should NOT have flushed yet (multi-camera timeout = 50 + 2*100 = 250ms)
      // because camera2 was recently active
      expect(flushed.length).toBe(1)  // Still just the first batch

      // Wait for multi-camera adaptive timeout
      vi.advanceTimersByTime(200)

      // Should have flushed the second batch now
      expect(flushed.length).toBe(2)
    })

    it('should respect maxAdaptiveTimeoutMs', () => {
      syncBuffer = new MultiCameraSyncBuffer({
        syncWindowMs: 160,
        adaptiveTimeout: true,
        singleCameraTimeoutMs: 50,
        perCameraTimeoutMs: 200,
        maxAdaptiveTimeoutMs: 300,  // Cap at 300ms even with many cameras
      })

      // Four cameras registered (would be 50 + 4*200 = 850ms without cap)
      syncBuffer.registerCamera('camera1')
      syncBuffer.registerCamera('camera2')
      syncBuffer.registerCamera('camera3')
      syncBuffer.registerCamera('camera4')

      const flushed: DetectionMessage[][] = []
      syncBuffer.onFlush((messages) => {
        flushed.push(messages)
      })

      syncBuffer.addMessage(createMessage('camera1', 1))

      // Wait past the capped timeout (300ms + timer interval headroom)
      vi.advanceTimersByTime(350)

      // Should have flushed at capped timeout (300ms)
      expect(flushed.length).toBe(1)
    })
  })
})
