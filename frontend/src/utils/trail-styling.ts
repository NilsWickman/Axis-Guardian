/**
 * Trail styling utilities for velocity-based rendering
 * Adjusts trail brightness and width based on movement speed
 */

export interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

// Velocity thresholds in m/s
const VELOCITY_SLOW = 0.5    // Below this = slow (dim)
const VELOCITY_FAST = 1.5    // Above this = fast (bright + glow)
const MAX_VELOCITY = 3.0     // Clamp for normalization

// Brightness factors
const BRIGHTNESS_DIM = 0.6
const BRIGHTNESS_NORMAL = 0.8
const BRIGHTNESS_BRIGHT = 1.0

// Line width range
const LINE_WIDTH_MIN = 2
const LINE_WIDTH_MAX = 4

/**
 * Calculate velocity (speed in m/s) between two consecutive trail points
 */
export function getSegmentVelocity(trail: TrailPoint[], index: number): number {
  if (index < 0 || index >= trail.length - 1) return 0

  const current = trail[index]
  const next = trail[index + 1]

  const dx = current.x - next.x
  const dy = current.y - next.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  const timeDiff = (current.timestamp - next.timestamp) / 1000 // ms to seconds
  if (timeDiff <= 0) return 0

  return distance / timeDiff
}

/**
 * Get brightness factor based on velocity
 * Returns value between BRIGHTNESS_DIM and BRIGHTNESS_BRIGHT
 */
export function getVelocityBrightness(velocity: number): number {
  if (velocity < VELOCITY_SLOW) {
    return BRIGHTNESS_DIM
  } else if (velocity > VELOCITY_FAST) {
    return BRIGHTNESS_BRIGHT
  } else {
    // Linear interpolation between slow and fast
    const t = (velocity - VELOCITY_SLOW) / (VELOCITY_FAST - VELOCITY_SLOW)
    return BRIGHTNESS_DIM + t * (BRIGHTNESS_NORMAL - BRIGHTNESS_DIM)
  }
}

/**
 * Get line width based on velocity
 * Returns value between LINE_WIDTH_MIN and LINE_WIDTH_MAX
 */
export function getVelocityLineWidth(velocity: number): number {
  const clampedVelocity = Math.min(velocity, MAX_VELOCITY)
  const t = clampedVelocity / MAX_VELOCITY
  return LINE_WIDTH_MIN + t * (LINE_WIDTH_MAX - LINE_WIDTH_MIN)
}

/**
 * Check if velocity qualifies for glow effect (fast movement)
 */
export function shouldShowGlow(velocity: number): boolean {
  return velocity > VELOCITY_FAST
}

/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)))
    return clamped.toString(16).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Adjust color brightness
 * @param hexColor - Hex color string (e.g., "#ff0000")
 * @param factor - Brightness factor (0.0 = black, 1.0 = original, >1.0 = brighter)
 */
export function adjustColorBrightness(hexColor: string, factor: number): string {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return hexColor

  // For factor > 1, we boost toward white; for factor < 1, we dim toward black
  if (factor >= 1) {
    // Brighten: blend toward white
    const boost = factor - 1
    return rgbToHex(
      rgb.r + (255 - rgb.r) * boost,
      rgb.g + (255 - rgb.g) * boost,
      rgb.b + (255 - rgb.b) * boost
    )
  } else {
    // Dim: multiply by factor
    return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor)
  }
}

/**
 * Get styled color for trail segment based on velocity
 * Keeps track's assigned color but adjusts brightness
 */
export function getVelocityStyledColor(baseColor: string, velocity: number): string {
  const brightness = getVelocityBrightness(velocity)
  return adjustColorBrightness(baseColor, brightness)
}
