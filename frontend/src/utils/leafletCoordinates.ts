import L from 'leaflet'

/**
 * Coordinate utilities for converting between sitemap meters and Leaflet coordinates.
 *
 * Sitemap coordinate system:
 *   - Origin at top-left
 *   - X increases right (0 to width)
 *   - Y increases downward (0 to height)
 *
 * Leaflet L.CRS.Simple:
 *   - Uses [lat, lng] where lat=Y, lng=X
 *   - lat increases upward by default
 *
 * To make Y increase downward (matching sitemap), we flip: lat = mapHeight - y
 */

/**
 * Convert sitemap meters to Leaflet LatLng
 * @param x - X coordinate in meters (increases right)
 * @param y - Y coordinate in meters (increases down in sitemap)
 * @param mapHeight - Total height of the sitemap in meters
 */
export function metersToLatLng(x: number, y: number, mapHeight: number): L.LatLng {
  // Flip Y so that y=0 appears at top of map
  return L.latLng(mapHeight - y, x)
}

/**
 * Convert Leaflet LatLng to sitemap meters
 * @param latlng - Leaflet LatLng coordinate
 * @param mapHeight - Total height of the sitemap in meters
 */
export function latLngToMeters(
  latlng: L.LatLng,
  mapHeight: number
): { x: number; y: number } {
  return {
    x: latlng.lng,
    y: mapHeight - latlng.lat,
  }
}

/**
 * Create map bounds for the sitemap dimensions
 * @param width - Width in meters
 * @param height - Height in meters
 */
export function createMapBounds(width: number, height: number): L.LatLngBounds {
  // After Y-flip: y=height becomes lat=0 (bottom), y=0 becomes lat=height (top)
  const southWest = L.latLng(0, 0) // bottom-left: y=height, x=0
  const northEast = L.latLng(height, width) // top-right: y=0, x=width
  return L.latLngBounds(southWest, northEast)
}

/**
 * Convert an array of meter points to LatLng array
 */
export function pointsToLatLngs(
  points: Array<{ x: number; y: number }>,
  mapHeight: number
): L.LatLng[] {
  return points.map((p) => metersToLatLng(p.x, p.y, mapHeight))
}

/**
 * Calculate appropriate zoom level for the map to fit bounds
 * This is a helper for initial map setup
 */
export function calculateFitZoom(
  containerWidth: number,
  containerHeight: number,
  boundsWidth: number,
  boundsHeight: number
): number {
  const scaleX = containerWidth / boundsWidth
  const scaleY = containerHeight / boundsHeight
  const scale = Math.min(scaleX, scaleY)
  // Leaflet zoom: each level doubles the scale
  // At zoom 0, 1 unit = 1 pixel in CRS.Simple
  return Math.log2(scale)
}
