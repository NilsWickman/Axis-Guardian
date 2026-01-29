/**
 * Tests for bounding box coordinate transformation utilities
 *
 * These functions handle the conversion from pixel coordinates (sent by camera-emulator)
 * to canvas coordinates (for rendering overlays), accounting for CSS object-cover scaling.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePixelBbox,
  calculateObjectCoverTransform,
  transformBboxToCanvas,
  type NormalizedBbox,
  type ObjectCoverTransform,
} from './bbox-transform'

describe('bbox-transform', () => {
  describe('normalizePixelBbox', () => {
    it('converts pixel [x,y,w,h] to normalized {left,top,right,bottom}', () => {
      const pixelBbox: [number, number, number, number] = [100, 200, 50, 80]
      const videoWidth = 1920
      const videoHeight = 1080

      const result = normalizePixelBbox(pixelBbox, videoWidth, videoHeight)

      expect(result.left).toBeCloseTo(100 / 1920)
      expect(result.top).toBeCloseTo(200 / 1080)
      expect(result.right).toBeCloseTo(150 / 1920)
      expect(result.bottom).toBeCloseTo(280 / 1080)
    })

    it('handles bbox at origin (0, 0)', () => {
      const pixelBbox: [number, number, number, number] = [0, 0, 100, 100]
      const result = normalizePixelBbox(pixelBbox, 1920, 1080)

      expect(result.left).toBe(0)
      expect(result.top).toBe(0)
      expect(result.right).toBeCloseTo(100 / 1920)
      expect(result.bottom).toBeCloseTo(100 / 1080)
    })

    it('handles bbox at video boundaries', () => {
      // Bbox at bottom-right corner
      const pixelBbox: [number, number, number, number] = [1820, 980, 100, 100]
      const result = normalizePixelBbox(pixelBbox, 1920, 1080)

      expect(result.left).toBeCloseTo(1820 / 1920)
      expect(result.top).toBeCloseTo(980 / 1080)
      expect(result.right).toBe(1)  // 1920 / 1920 = 1
      expect(result.bottom).toBe(1) // 1080 / 1080 = 1
    })

    it('handles full-frame bbox', () => {
      const pixelBbox: [number, number, number, number] = [0, 0, 1920, 1080]
      const result = normalizePixelBbox(pixelBbox, 1920, 1080)

      expect(result.left).toBe(0)
      expect(result.top).toBe(0)
      expect(result.right).toBe(1)
      expect(result.bottom).toBe(1)
    })

    it('handles different video resolutions', () => {
      // 720p video
      const pixelBbox: [number, number, number, number] = [640, 360, 128, 72]
      const result = normalizePixelBbox(pixelBbox, 1280, 720)

      expect(result.left).toBe(0.5)  // 640 / 1280
      expect(result.top).toBe(0.5)   // 360 / 720
      expect(result.right).toBeCloseTo(0.6)  // 768 / 1280
      expect(result.bottom).toBeCloseTo(0.6) // 432 / 720
    })
  })

  describe('calculateObjectCoverTransform', () => {
    it('calculates correct transform when video is wider than container (horizontal crop)', () => {
      // Video 1920x1080 (16:9), Container 400x300 (4:3)
      // Video aspect is wider, so scale by height, crop horizontally
      const result = calculateObjectCoverTransform(1920, 1080, 400, 300)

      // scale = max(400/1920, 300/1080) = max(0.208, 0.278) = 0.278
      expect(result.scale).toBeCloseTo(300 / 1080)

      // scaledWidth = 1920 * 0.278 = ~533
      // offsetX = (400 - 533) / 2 = -66.67 (negative = cropped)
      expect(result.offsetX).toBeCloseTo((400 - 1920 * (300 / 1080)) / 2)
      expect(result.offsetX).toBeLessThan(0) // Horizontal crop

      // scaledHeight = 1080 * 0.278 = 300 (fits exactly)
      // offsetY = (300 - 300) / 2 = 0
      expect(result.offsetY).toBe(0)
    })

    it('calculates correct transform when video is taller than container (vertical crop)', () => {
      // Video 1080x1920 (9:16 portrait), Container 400x300 (landscape)
      // Container is wider than video, so scale by width, crop vertically
      const result = calculateObjectCoverTransform(1080, 1920, 400, 300)

      // scale = max(400/1080, 300/1920) = max(0.37, 0.156) = 0.37
      expect(result.scale).toBeCloseTo(400 / 1080)

      // offsetX = (400 - 400) / 2 = 0 (fits exactly)
      expect(result.offsetX).toBe(0)

      // scaledHeight = 1920 * 0.37 = ~711
      // offsetY = (300 - 711) / 2 = -205.5 (negative = cropped)
      expect(result.offsetY).toBeCloseTo((300 - 1920 * (400 / 1080)) / 2)
      expect(result.offsetY).toBeLessThan(0) // Vertical crop
    })

    it('handles matching aspect ratios (no crop)', () => {
      // Video and container both 16:9
      const result = calculateObjectCoverTransform(1920, 1080, 960, 540)

      expect(result.scale).toBeCloseTo(0.5) // 960/1920 = 540/1080 = 0.5
      expect(result.offsetX).toBe(0)
      expect(result.offsetY).toBe(0)
    })

    it('handles square container with 16:9 video', () => {
      const result = calculateObjectCoverTransform(1920, 1080, 500, 500)

      // scale = max(500/1920, 500/1080) = max(0.26, 0.463) = 0.463
      expect(result.scale).toBeCloseTo(500 / 1080)

      // Horizontal crop (video is wider)
      expect(result.offsetX).toBeLessThan(0)
      expect(result.offsetY).toBe(0)
    })

    it('handles square video with rectangular container', () => {
      const result = calculateObjectCoverTransform(1000, 1000, 400, 300)

      // scale = max(400/1000, 300/1000) = 0.4
      expect(result.scale).toBeCloseTo(0.4)

      // Vertical crop (container is wider than square)
      expect(result.offsetX).toBe(0)
      expect(result.offsetY).toBeCloseTo((300 - 400) / 2) // -50
    })
  })

  describe('transformBboxToCanvas', () => {
    it('transforms center of video to center of canvas (no crop)', () => {
      const bbox: NormalizedBbox = { left: 0.45, top: 0.45, right: 0.55, bottom: 0.55 }
      const transform: ObjectCoverTransform = { scale: 0.5, offsetX: 0, offsetY: 0 }
      const videoWidth = 1920
      const videoHeight = 1080

      const result = transformBboxToCanvas(bbox, transform, videoWidth, videoHeight)

      // Center bbox at (0.5, 0.5) should map to canvas center
      expect(result.x).toBeCloseTo(0.45 * 1920 * 0.5) // 432
      expect(result.y).toBeCloseTo(0.45 * 1080 * 0.5) // 243
      expect(result.width).toBeCloseTo(0.1 * 1920 * 0.5)  // 96
      expect(result.height).toBeCloseTo(0.1 * 1080 * 0.5) // 54
    })

    it('applies negative offset for cropped video', () => {
      // Simulate horizontal crop (video wider than container)
      const bbox: NormalizedBbox = { left: 0, top: 0, right: 0.1, bottom: 0.1 }
      const transform: ObjectCoverTransform = { scale: 0.278, offsetX: -66.67, offsetY: 0 }
      const videoWidth = 1920
      const videoHeight = 1080

      const result = transformBboxToCanvas(bbox, transform, videoWidth, videoHeight)

      // Top-left bbox should start at negative X (off-screen left due to crop)
      expect(result.x).toBeCloseTo(-66.67)
      expect(result.y).toBe(0)
    })

    it('correctly positions bbox in cropped area', () => {
      // Video center (0.5, 0.5) with horizontal crop should still be visible
      const bbox: NormalizedBbox = { left: 0.4, top: 0.4, right: 0.6, bottom: 0.6 }
      const transform: ObjectCoverTransform = {
        scale: 300 / 1080,  // ~0.278
        offsetX: (400 - 1920 * (300 / 1080)) / 2, // ~-66.67
        offsetY: 0
      }
      const videoWidth = 1920
      const videoHeight = 1080

      const result = transformBboxToCanvas(bbox, transform, videoWidth, videoHeight)

      // Center of 400x300 canvas is (200, 150)
      // Bbox center at (0.5, 0.5) should be near canvas center
      const bboxCenterX = result.x + result.width / 2
      const bboxCenterY = result.y + result.height / 2

      expect(bboxCenterX).toBeCloseTo(200, 0) // Within 1 pixel of center
      expect(bboxCenterY).toBeCloseTo(150, 0)
    })

    it('handles full-frame bbox', () => {
      const bbox: NormalizedBbox = { left: 0, top: 0, right: 1, bottom: 1 }
      const transform: ObjectCoverTransform = { scale: 0.5, offsetX: 0, offsetY: 0 }
      const videoWidth = 1920
      const videoHeight = 1080

      const result = transformBboxToCanvas(bbox, transform, videoWidth, videoHeight)

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
      expect(result.width).toBeCloseTo(960)  // 1920 * 0.5
      expect(result.height).toBeCloseTo(540) // 1080 * 0.5
    })
  })

  describe('end-to-end: pixel bbox to canvas coordinates', () => {
    it('correctly transforms pixel bbox through full pipeline', () => {
      // Simulate real-world scenario:
      // Video: 1920x1080, Container: 400x300
      // Person detected at pixel [500, 400, 100, 200] in video

      const pixelBbox: [number, number, number, number] = [500, 400, 100, 200]
      const videoWidth = 1920
      const videoHeight = 1080
      const containerWidth = 400
      const containerHeight = 300

      // Step 1: Normalize
      const normalized = normalizePixelBbox(pixelBbox, videoWidth, videoHeight)
      expect(normalized.left).toBeCloseTo(500 / 1920)
      expect(normalized.top).toBeCloseTo(400 / 1080)

      // Step 2: Calculate transform
      const transform = calculateObjectCoverTransform(videoWidth, videoHeight, containerWidth, containerHeight)

      // Step 3: Transform to canvas
      const canvas = transformBboxToCanvas(normalized, transform, videoWidth, videoHeight)

      // Verify the bbox is in a reasonable position within or near the canvas
      // With horizontal crop, the person should still be visible if they're near center
      expect(canvas.width).toBeGreaterThan(0)
      expect(canvas.height).toBeGreaterThan(0)
    })
  })
})
