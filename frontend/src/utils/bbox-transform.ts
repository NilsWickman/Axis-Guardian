/**
 * Bounding Box Coordinate Transformation Utilities
 *
 * Handles conversion between coordinate systems:
 * 1. Pixel coordinates [x, y, w, h] - from camera-emulator detection data
 * 2. Normalized coordinates {left, top, right, bottom} - 0-1 range relative to video
 * 3. Canvas coordinates {x, y, width, height} - for rendering overlays with CSS object-cover
 *
 * The pipeline is:
 *   Pixel bbox → normalizePixelBbox → Normalized bbox
 *   Normalized bbox + ObjectCoverTransform → transformBboxToCanvas → Canvas bbox
 */

/**
 * Bounding box in normalized (0-1) coordinates
 */
export interface NormalizedBbox {
  left: number   // 0-1, left edge
  top: number    // 0-1, top edge
  right: number  // 0-1, right edge
  bottom: number // 0-1, bottom edge
}

/**
 * CSS object-cover transform parameters
 */
export interface ObjectCoverTransform {
  /** Scale factor applied to video to fill container */
  scale: number
  /** Horizontal offset (negative = cropped on sides) */
  offsetX: number
  /** Vertical offset (negative = cropped on top/bottom) */
  offsetY: number
}

/**
 * Bounding box in canvas pixel coordinates
 */
export interface CanvasBbox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Convert pixel bbox [x, y, w, h] to normalized {left, top, right, bottom}
 *
 * @param bbox - Pixel coordinates [x, y, width, height]
 * @param videoWidth - Native video width in pixels
 * @param videoHeight - Native video height in pixels
 * @returns Normalized bounding box with values in 0-1 range
 */
export function normalizePixelBbox(
  bbox: [number, number, number, number],
  videoWidth: number,
  videoHeight: number
): NormalizedBbox {
  const [x, y, w, h] = bbox
  return {
    left: x / videoWidth,
    top: y / videoHeight,
    right: (x + w) / videoWidth,
    bottom: (y + h) / videoHeight,
  }
}

/**
 * Calculate object-cover CSS transform parameters
 *
 * CSS object-cover scales the video to completely fill the container while
 * maintaining aspect ratio, potentially cropping parts of the video.
 *
 * @param videoWidth - Native video width in pixels
 * @param videoHeight - Native video height in pixels
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 * @returns Transform parameters for mapping video coordinates to container
 */
export function calculateObjectCoverTransform(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number
): ObjectCoverTransform {
  // object-cover uses the LARGER scale to fill the container
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight)

  // Calculate scaled dimensions
  const scaledWidth = videoWidth * scale
  const scaledHeight = videoHeight * scale

  // Calculate offset (centering the scaled video in the container)
  // Negative offset means the video extends beyond the container (cropped)
  const offsetX = (containerWidth - scaledWidth) / 2
  const offsetY = (containerHeight - scaledHeight) / 2

  return { scale, offsetX, offsetY }
}

/**
 * Transform normalized bbox to canvas pixel coordinates
 *
 * Applies the object-cover transform to convert normalized video coordinates
 * to canvas coordinates suitable for drawing overlays.
 *
 * @param bbox - Normalized bounding box (0-1 range)
 * @param transform - Object-cover transform parameters
 * @param videoWidth - Native video width in pixels
 * @param videoHeight - Native video height in pixels
 * @returns Canvas bounding box in pixel coordinates
 */
export function transformBboxToCanvas(
  bbox: NormalizedBbox,
  transform: ObjectCoverTransform,
  videoWidth: number,
  videoHeight: number
): CanvasBbox {
  // Convert normalized coords to video pixels, then apply scale and offset
  return {
    x: transform.offsetX + bbox.left * videoWidth * transform.scale,
    y: transform.offsetY + bbox.top * videoHeight * transform.scale,
    width: (bbox.right - bbox.left) * videoWidth * transform.scale,
    height: (bbox.bottom - bbox.top) * videoHeight * transform.scale,
  }
}
