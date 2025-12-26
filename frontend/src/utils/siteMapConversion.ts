/**
 * Utility functions for converting between meters and pixels in site maps
 *
 * Site maps store all coordinates and measurements in real-world meters.
 * Canvas rendering uses a fixed scale of 100 pixels per meter for high quality.
 */

export const RENDER_SCALE = 100 // pixels per meter (fixed for high-resolution rendering)

/**
 * Map height in meters - used for Y-axis coordinate transformation.
 * This must be set before rendering to match the sitemap dimensions.
 * @see setMapHeight
 */
let mapHeightMeters = 30 // default, should be set from sitemap dimensions

/**
 * Set the map height for Y-axis transformation.
 * Call this before rendering when sitemap is loaded.
 */
export function setMapHeight(heightMeters: number): void {
  mapHeightMeters = heightMeters
}

/**
 * Get the current map height in meters.
 */
export function getMapHeight(): number {
  return mapHeightMeters
}

/**
 * Unit type for measurements with explicit units
 */
export interface UnitValue {
  value: number
  unit: string
}

/**
 * Create a meter unit object
 */
export function createMeterUnit(value: number): UnitValue {
  return { value, unit: 'm' }
}

/**
 * Create a degree unit object
 */
export function createDegreeUnit(value: number): UnitValue {
  return { value, unit: 'deg' }
}

/**
 * Extract numeric value from unit object
 * Handles both unit objects and plain numbers for flexibility
 */
export function extractValue(valueOrUnit: UnitValue | number): number {
  if (typeof valueOrUnit === 'number') {
    return valueOrUnit
  }
  return valueOrUnit.value
}

/**
 * Convert meters to canvas pixels for rendering.
 * Use this for non-coordinate values like widths, heights, radii.
 */
export function metersToPixels(meters: number): number {
  return meters * RENDER_SCALE
}

/**
 * Convert Y coordinate from sitemap meters to canvas pixels.
 *
 * Sitemap coordinate system:
 *   - Uses mathematical/cartographic convention: Y increases northward (up on map)
 *   - Origin conceptually at "south" end of the map
 *
 * Canvas coordinate system:
 *   - Screen convention: Y increases downward
 *   - Origin at top-left
 *
 * This function flips Y so the sitemap renders correctly on screen:
 *   canvasY = (mapHeight - sitemapY) * scale
 *
 * @param yMeters - Y coordinate in sitemap meters (Y-up convention)
 * @returns Y position in canvas pixels (Y-down convention)
 */
export function metersToCanvasY(yMeters: number): number {
  return (mapHeightMeters - yMeters) * RENDER_SCALE
}

/**
 * Convert canvas Y pixels back to sitemap meters.
 * Inverse of metersToCanvasY.
 */
export function canvasYToMeters(canvasY: number): number {
  return mapHeightMeters - (canvasY / RENDER_SCALE)
}

/**
 * Convert canvas pixels to meters for storage
 */
export function pixelsToMeters(pixels: number): number {
  return pixels / RENDER_SCALE
}

/**
 * Convert a point from meters to pixels
 */
export function pointToPixels(point: { x: UnitValue; y: UnitValue }): { x: number; y: number } {
  return {
    x: metersToPixels(extractValue(point.x)),
    y: metersToPixels(extractValue(point.y))
  }
}

/**
 * Convert a point from pixels to meter unit objects
 */
export function pointToMeters(point: { x: number; y: number }): { x: UnitValue; y: UnitValue } {
  return {
    x: createMeterUnit(pixelsToMeters(point.x)),
    y: createMeterUnit(pixelsToMeters(point.y))
  }
}

/**
 * Snap a meter value to the grid (1 meter grid)
 */
export function snapToGridMeters(meters: number, gridSizeMeters: number = 1): number {
  return Math.round(meters / gridSizeMeters) * gridSizeMeters
}

/**
 * Snap a point in meters to the grid
 */
export function snapPointToGridMeters(
  point: { x: number; y: number },
  gridSizeMeters: number = 1
): { x: number; y: number } {
  return {
    x: snapToGridMeters(point.x, gridSizeMeters),
    y: snapToGridMeters(point.y, gridSizeMeters)
  }
}
