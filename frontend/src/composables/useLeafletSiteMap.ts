import { ref, shallowRef, type Ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CameraPlacement, Wall, Obstacle } from '../types/site-map-types'
import type { SiteMap } from './useSiteMapConfig'
import type { ZoneConfig } from '../stores/zones'
import {
  metersToLatLng,
  latLngToMeters,
  createMapBounds,
  pointsToLatLngs,
} from '../utils/leafletCoordinates'
import {
  calculateVisibleFOV,
  arcToLineSegments,
  type Point,
  type LineSegment,
  type CircleObstacle,
  type RectangleObstacle,
  type HeightAwareOptions,
} from './useGeometry'
import { extractValue } from '../utils/siteMapConversion'

// Tailwind color map for Leaflet rendering
const TAILWIND_COLORS: Record<string, string> = {
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'amber-400': '#fbbf24',
  'amber-500': '#f59e0b',
  'yellow-400': '#facc15',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'emerald-400': '#34d399',
  'teal-400': '#2dd4bf',
  'cyan-400': '#22d3ee',
  'cyan-500': '#06b6d4',
  'sky-400': '#38bdf8',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'indigo-400': '#818cf8',
  'indigo-500': '#6366f1',
  'violet-400': '#a78bfa',
  'purple-400': '#c084fc',
  'fuchsia-400': '#e879f9',
  'pink-400': '#f472b6',
  'rose-400': '#fb7185',
}

const tailwindColorToHex = (color: string): string => {
  if (color.startsWith('#')) return color
  const cleanColor = color.replace(/^bg-/, '')
  return TAILWIND_COLORS[cleanColor] || '#6366f1'
}

// Zone type default colors
const ZONE_TYPE_COLORS: Record<string, string> = {
  restricted: '#ef4444',
  entry: '#22c55e',
  exit: '#f97316',
  monitored: '#3b82f6',
}

export interface LeafletSiteMapOptions {
  showGrid?: boolean
  showCameraLabels?: boolean
}

export interface TrackData {
  id: string
  position: { x: number; y: number }
  color: string
  trail?: Array<{ x: number; y: number; timestamp: number }>
  velocity?: { x: number; y: number }
  isGhost?: boolean
}

export function useLeafletSiteMap(options: Ref<LeafletSiteMapOptions>) {
  const mapRef = shallowRef<L.Map | null>(null)
  const mapHeight = ref(0)
  const mapWidth = ref(0)
  const mouseCoords = ref<{ x: number; y: number } | null>(null)
  const hoveredCameraId = ref<string | null>(null)
  const selectedCameraId = ref<string | null>(null)

  // Layer groups
  const layers = {
    background: shallowRef<L.LayerGroup | null>(null),
    grid: shallowRef<L.LayerGroup | null>(null),
    walls: shallowRef<L.LayerGroup | null>(null),
    obstacles: shallowRef<L.LayerGroup | null>(null),
    zones: shallowRef<L.LayerGroup | null>(null),
    cameraFov: shallowRef<L.LayerGroup | null>(null),
    cameraIcons: shallowRef<L.LayerGroup | null>(null),
    tracks: shallowRef<L.LayerGroup | null>(null),
  }

  // Track marker references for updates
  const trackMarkers = new Map<string, L.CircleMarker>()
  const trackTrails = new Map<string, L.Polyline>()

  // Camera layer references
  const cameraFovPolygons = new Map<string, L.Polygon>()
  const cameraMarkers = new Map<string, L.Marker>()

  /**
   * Initialize the Leaflet map
   */
  const initMap = (container: HTMLElement, siteMap: SiteMap): L.Map => {
    const width = extractValue(siteMap.width)
    const height = extractValue(siteMap.height)
    mapHeight.value = height
    mapWidth.value = width

    // Create map with Simple CRS (non-geographic)
    const bounds = createMapBounds(width, height)
    const map = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: false,
      zoomControl: true,
    })

    // Fit to bounds
    map.fitBounds(bounds)

    // Initialize layer groups
    layers.background.value = L.layerGroup().addTo(map)
    layers.grid.value = L.layerGroup().addTo(map)
    layers.walls.value = L.layerGroup().addTo(map)
    layers.obstacles.value = L.layerGroup().addTo(map)
    layers.zones.value = L.layerGroup().addTo(map)
    layers.cameraFov.value = L.layerGroup().addTo(map)
    layers.cameraIcons.value = L.layerGroup().addTo(map)
    layers.tracks.value = L.layerGroup().addTo(map)

    // Mouse coordinate tracking
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      mouseCoords.value = latLngToMeters(e.latlng, mapHeight.value)
    })

    map.on('mouseout', () => {
      mouseCoords.value = null
    })

    mapRef.value = map
    return map
  }

  /**
   * Destroy the map
   */
  const destroyMap = () => {
    if (mapRef.value) {
      mapRef.value.remove()
      mapRef.value = null
    }
    trackMarkers.clear()
    trackTrails.clear()
    cameraFovPolygons.clear()
    cameraMarkers.clear()
  }

  /**
   * Draw the background floor plan image
   */
  const drawBackground = (imagePath: string) => {
    if (!layers.background.value || !mapRef.value) return

    layers.background.value.clearLayers()

    const bounds = createMapBounds(mapWidth.value, mapHeight.value)
    const imageOverlay = L.imageOverlay(imagePath, bounds, {
      opacity: 0.7,
    })
    imageOverlay.addTo(layers.background.value)
  }

  /**
   * Draw the grid
   */
  const drawGrid = () => {
    if (!layers.grid.value || !options.value.showGrid) return

    layers.grid.value.clearLayers()

    const width = mapWidth.value
    const height = mapHeight.value

    // Vertical lines (every meter)
    for (let x = 0; x <= width; x++) {
      const isMajor = x % 10 === 0
      const isMinor = x % 5 === 0

      const line = L.polyline(
        [
          metersToLatLng(x, 0, height),
          metersToLatLng(x, height, height),
        ],
        {
          color: isMajor ? '#4a4a5e' : isMinor ? '#3a3a4e' : '#2a2a3e',
          weight: isMajor ? 2 : isMinor ? 1.5 : 1,
          opacity: 0.8,
        }
      )
      line.addTo(layers.grid.value)

      // Labels on major lines
      if (isMajor && x > 0) {
        const label = L.marker(metersToLatLng(x, 0, height), {
          icon: L.divIcon({
            className: 'leaflet-grid-label',
            html: `<span style="color: #9a9aae; font: bold 12px monospace;">${x}m</span>`,
            iconSize: [30, 15],
            iconAnchor: [15, -5],
          }),
          interactive: false,
        })
        label.addTo(layers.grid.value)
      }
    }

    // Horizontal lines (every meter)
    for (let y = 0; y <= height; y++) {
      const isMajor = y % 10 === 0
      const isMinor = y % 5 === 0

      const line = L.polyline(
        [
          metersToLatLng(0, y, height),
          metersToLatLng(width, y, height),
        ],
        {
          color: isMajor ? '#4a4a5e' : isMinor ? '#3a3a4e' : '#2a2a3e',
          weight: isMajor ? 2 : isMinor ? 1.5 : 1,
          opacity: 0.8,
        }
      )
      line.addTo(layers.grid.value)

      // Labels on major lines
      if (isMajor && y > 0) {
        const label = L.marker(metersToLatLng(0, y, height), {
          icon: L.divIcon({
            className: 'leaflet-grid-label',
            html: `<span style="color: #9a9aae; font: bold 12px monospace;">${y}m</span>`,
            iconSize: [30, 15],
            iconAnchor: [35, 7],
          }),
          interactive: false,
        })
        label.addTo(layers.grid.value)
      }
    }
  }

  /**
   * Draw walls
   */
  const drawWalls = (walls: Wall[]) => {
    if (!layers.walls.value) return

    layers.walls.value.clearLayers()

    const wallStyles = {
      external: { color: '#ffffff', weight: 6 },
      internal: { color: '#cccccc', weight: 4 },
      door: { color: '#60a5fa', weight: 3, dashArray: '8, 6' },
    }

    for (const wall of walls) {
      const type = wall.type || 'internal'
      const style = wallStyles[type] || wallStyles.internal
      const geometry = wall.geometry ?? 'line'

      if (geometry === 'arc' && wall.arc) {
        // Generate arc points directly for Leaflet
        // Arc angles are in canvas convention: 0°=right, 90°=down
        const arc = wall.arc
        const cx = extractValue(arc.center.x)
        const cy = extractValue(arc.center.y)
        const radius = extractValue(arc.radius)
        const startAngleDeg = extractValue(arc.startAngle)
        const endAngleDeg = extractValue(arc.endAngle)
        const clockwise = arc.clockwise ?? false

        // Generate points along the arc
        const numSegments = 32
        const startRad = (startAngleDeg * Math.PI) / 180
        const endRad = (endAngleDeg * Math.PI) / 180

        // Calculate angular span
        let angleDiff = endRad - startRad
        if (clockwise) {
          // Clockwise in canvas (Y-down): angle increases
          if (angleDiff < 0) angleDiff += 2 * Math.PI
        } else {
          // Counter-clockwise: angle decreases
          if (angleDiff > 0) angleDiff -= 2 * Math.PI
        }

        const points: Point[] = []
        for (let i = 0; i <= numSegments; i++) {
          const t = i / numSegments
          const angle = startRad + angleDiff * t
          points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
          })
        }

        const latLngs = pointsToLatLngs(points, mapHeight.value)

        const polyline = L.polyline(latLngs, {
          color: style.color,
          weight: style.weight,
          lineCap: 'round',
          dashArray: (style as { dashArray?: string }).dashArray,
        })
        polyline.addTo(layers.walls.value)
      } else {
        // Straight line
        const start = {
          x: extractValue(wall.start.x),
          y: extractValue(wall.start.y),
        }
        const end = {
          x: extractValue(wall.end.x),
          y: extractValue(wall.end.y),
        }

        const polyline = L.polyline(
          [
            metersToLatLng(start.x, start.y, mapHeight.value),
            metersToLatLng(end.x, end.y, mapHeight.value),
          ],
          {
            color: style.color,
            weight: style.weight,
            lineCap: 'round',
            dashArray: (style as { dashArray?: string }).dashArray,
          }
        )
        polyline.addTo(layers.walls.value)
      }
    }
  }

  /**
   * Draw obstacles
   */
  const drawObstacles = (obstacles: Obstacle[]) => {
    if (!layers.obstacles.value) return

    layers.obstacles.value.clearLayers()

    const categoryColors: Record<string, string> = {
      furniture: '#78716c',
      structural: '#64748b',
      equipment: '#1e293b',
      seating: '#fbbf24',
    }

    for (const obstacle of obstacles) {
      const category = obstacle.category || 'furniture'
      const baseColor = obstacle.color || categoryColors[category] || categoryColors.furniture
      const fillColor = baseColor + '60' // 37% opacity

      const centerX = extractValue(obstacle.position.x)
      const centerY = extractValue(obstacle.position.y)

      if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        const width = extractValue(obstacle.dimensions.width)
        const height = extractValue(obstacle.dimensions.height)
        const rotation = obstacle.rotation || 0

        // Calculate corner points (with rotation)
        const corners = [
          { x: -width / 2, y: -height / 2 },
          { x: width / 2, y: -height / 2 },
          { x: width / 2, y: height / 2 },
          { x: -width / 2, y: height / 2 },
        ]

        const rad = (rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        const worldCorners = corners.map((c) => ({
          x: centerX + c.x * cos - c.y * sin,
          y: centerY + c.x * sin + c.y * cos,
        }))

        const latLngs = pointsToLatLngs(worldCorners, mapHeight.value)
        const polygon = L.polygon(latLngs, {
          color: baseColor,
          fillColor: fillColor,
          fillOpacity: 0.6,
          weight: 2,
        })
        polygon.addTo(layers.obstacles.value)
      } else if (obstacle.type === 'circle' && obstacle.radius !== undefined) {
        const radius = extractValue(obstacle.radius)
        const center = metersToLatLng(centerX, centerY, mapHeight.value)

        const circle = L.circle(center, {
          radius: radius,
          color: baseColor,
          fillColor: fillColor,
          fillOpacity: 0.6,
          weight: 2,
        })
        circle.addTo(layers.obstacles.value)
      } else if (obstacle.type === 'polygon' && obstacle.vertices && obstacle.vertices.length >= 3) {
        // Vertices are relative offsets from position
        const worldVertices = obstacle.vertices.map((v) => ({
          x: centerX + extractValue(v.x),
          y: centerY + extractValue(v.y),
        }))
        const latLngs = pointsToLatLngs(worldVertices, mapHeight.value)

        const polygon = L.polygon(latLngs, {
          color: baseColor,
          fillColor: fillColor,
          fillOpacity: 0.6,
          weight: 2,
        })
        polygon.addTo(layers.obstacles.value)
      } else if (obstacle.type === 'arc-segment' && obstacle.arcSegment) {
        // Convert arc-segment to polygon vertices
        // For small arc segments (like seating), always take the SHORT path
        const arc = obstacle.arcSegment
        const cx = extractValue(arc.center.x)
        const cy = extractValue(arc.center.y)
        const innerRadius = extractValue(arc.innerRadius)
        const outerRadius = extractValue(arc.outerRadius)
        const startAngleDeg = extractValue(arc.startAngle)
        const endAngleDeg = extractValue(arc.endAngle)

        const numPoints = 24
        const startRad = (startAngleDeg * Math.PI) / 180
        const endRad = (endAngleDeg * Math.PI) / 180

        // For arc-segments (seating), always take the shorter path
        // This handles the sitemap convention where clockwise=false but we want short arcs
        let angleDiff = endRad - startRad
        // Normalize to [-π, π] range to always get the short way
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

        const outerPoints: Point[] = []
        const innerPoints: Point[] = []

        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints
          const angle = startRad + angleDiff * t
          outerPoints.push({
            x: cx + outerRadius * Math.cos(angle),
            y: cy + outerRadius * Math.sin(angle),
          })
          innerPoints.push({
            x: cx + innerRadius * Math.cos(angle),
            y: cy + innerRadius * Math.sin(angle),
          })
        }

        // Combine to form closed polygon: outer arc -> reversed inner arc
        const allPoints = [...outerPoints, ...innerPoints.reverse()]
        const latLngs = pointsToLatLngs(allPoints, mapHeight.value)

        const polygon = L.polygon(latLngs, {
          color: baseColor,
          fillColor: fillColor,
          fillOpacity: 0.6,
          weight: 2,
        })
        polygon.addTo(layers.obstacles.value)
      }
    }
  }

  /**
   * Draw zones (minimal mode for tracking view)
   */
  const drawZones = (zones: ZoneConfig[], minimal: boolean = true) => {
    if (!layers.zones.value) return

    layers.zones.value.clearLayers()

    for (const zone of zones) {
      if (zone.vertices.length < 3) continue

      const baseColor = zone.color || ZONE_TYPE_COLORS[zone.type] || ZONE_TYPE_COLORS.restricted
      const latLngs = pointsToLatLngs(zone.vertices, mapHeight.value)

      const polygon = L.polygon(latLngs, {
        color: baseColor,
        fillColor: minimal ? 'transparent' : baseColor,
        fillOpacity: minimal ? 0 : 0.2,
        weight: 1.5,
        opacity: 0.5,
        dashArray: '6, 4',
      })
      polygon.addTo(layers.zones.value)
    }
  }

  /**
   * Draw cameras with FOV cones
   */
  const drawCameras = (
    cameras: CameraPlacement[],
    getCameraName: (id: string) => string,
    walls: Wall[],
    obstacles: Obstacle[]
  ) => {
    if (!layers.cameraFov.value || !layers.cameraIcons.value) return

    layers.cameraFov.value.clearLayers()
    layers.cameraIcons.value.clearLayers()
    cameraFovPolygons.clear()
    cameraMarkers.clear()

    // Pre-process walls and obstacles for FOV calculation
    const wallSegments: LineSegment[] = walls.flatMap((wall) => {
      const geometry = wall.geometry ?? 'line'
      if (geometry === 'arc' && wall.arc) {
        const arc = wall.arc
        return arcToLineSegments(
          {
            x: extractValue(arc.center.x),
            y: extractValue(arc.center.y),
          },
          extractValue(arc.radius),
          extractValue(arc.startAngle),
          extractValue(arc.endAngle),
          arc.clockwise ?? false,
          24
        )
      } else {
        return [
          {
            start: {
              x: extractValue(wall.start.x),
              y: extractValue(wall.start.y),
            },
            end: {
              x: extractValue(wall.end.x),
              y: extractValue(wall.end.y),
            },
          },
        ]
      }
    })

    const circleObstacles: CircleObstacle[] = []
    const rectangleObstacles: RectangleObstacle[] = []

    for (const obstacle of obstacles) {
      if (obstacle.blocksView === false) continue

      if (obstacle.type === 'circle' && obstacle.radius !== undefined) {
        circleObstacles.push({
          center: {
            x: extractValue(obstacle.position.x),
            y: extractValue(obstacle.position.y),
          },
          radius: extractValue(obstacle.radius),
          obstacleHeight: obstacle.height,
        })
      } else if (obstacle.type === 'rectangle' && obstacle.dimensions) {
        rectangleObstacles.push({
          center: {
            x: extractValue(obstacle.position.x),
            y: extractValue(obstacle.position.y),
          },
          width: extractValue(obstacle.dimensions.width),
          height: extractValue(obstacle.dimensions.height),
          rotation: obstacle.rotation,
          obstacleHeight: obstacle.height,
        })
      }
    }

    for (const camera of cameras) {
      const x = extractValue(camera.position.x)
      const y = extractValue(camera.position.y)
      const azimuth = extractValue(camera.azimuth)
      const fov = extractValue(camera.fov)
      const cameraHeight = extractValue(camera.height)
      const hexColor = tailwindColorToHex(camera.color)

      // Height-aware FOV calculation
      const heightOptions: HeightAwareOptions = {
        cameraHeight,
        targetHeight: 1.7,
        pixelsPerMeter: 1, // We're working in meters
      }

      // Calculate visible FOV polygon (in meters)
      const FOV_RENDER_DISTANCE_M = 50
      const fovPolygonPoints = calculateVisibleFOV(
        { x, y },
        azimuth,
        fov,
        FOV_RENDER_DISTANCE_M,
        wallSegments,
        circleObstacles,
        rectangleObstacles,
        heightOptions
      )

      // Convert to Leaflet coordinates
      const fovLatLngs = pointsToLatLngs(fovPolygonPoints, mapHeight.value)

      const isSelected = selectedCameraId.value === camera.cameraId
      const isHovered = hoveredCameraId.value === camera.cameraId

      // Draw FOV polygon
      const fovPolygon = L.polygon(fovLatLngs, {
        color: hexColor,
        fillColor: hexColor,
        fillOpacity: isSelected ? 0.4 : isHovered ? 0.3 : 0.2,
        weight: isSelected ? 2 : 1,
        opacity: isSelected ? 0.9 : isHovered ? 0.7 : 0.5,
      })

      fovPolygon.on('mouseover', () => {
        hoveredCameraId.value = camera.cameraId
      })
      fovPolygon.on('mouseout', () => {
        if (hoveredCameraId.value === camera.cameraId) {
          hoveredCameraId.value = null
        }
      })
      fovPolygon.on('click', () => {
        selectedCameraId.value = camera.cameraId
      })

      fovPolygon.addTo(layers.cameraFov.value!)
      cameraFovPolygons.set(camera.cameraId, fovPolygon)

      // Draw camera icon
      const cameraLatLng = metersToLatLng(x, y, mapHeight.value)

      // Convert azimuth to rotation angle for icon
      // Azimuth: 0° = North (+Y down on screen), 90° = East (+X right)
      // For Leaflet with Y-flipped coords, we need to adjust
      const iconRotation = azimuth

      const cameraIcon = L.divIcon({
        className: 'leaflet-camera-icon',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(${iconRotation}deg);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${hexColor}" stroke="white" stroke-width="1.5">
              <path d="M12 2L20 8V16L12 22L4 16V8L12 2Z"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const cameraMarker = L.marker(cameraLatLng, { icon: cameraIcon })

      if (options.value.showCameraLabels) {
        const cameraName = getCameraName(camera.cameraId)
        cameraMarker.bindTooltip(cameraName, {
          permanent: false,
          direction: 'top',
          offset: [0, -12],
        })
      }

      cameraMarker.on('mouseover', () => {
        hoveredCameraId.value = camera.cameraId
      })
      cameraMarker.on('mouseout', () => {
        if (hoveredCameraId.value === camera.cameraId) {
          hoveredCameraId.value = null
        }
      })
      cameraMarker.on('click', () => {
        selectedCameraId.value = camera.cameraId
      })

      cameraMarker.addTo(layers.cameraIcons.value!)
      cameraMarkers.set(camera.cameraId, cameraMarker)
    }
  }

  /**
   * Update camera highlight states
   */
  const highlightCamera = (cameraId: string | null) => {
    hoveredCameraId.value = cameraId
    // Re-style polygons would require redraw - for now just track state
  }

  const setSelectedCamera = (cameraId: string | null) => {
    selectedCameraId.value = cameraId
  }

  /**
   * Update track positions
   */
  const updateTracks = (tracks: TrackData[]) => {
    if (!layers.tracks.value) return

    const currentTrackIds = new Set(tracks.map((t) => t.id))

    // Remove markers for tracks that no longer exist
    for (const [id, marker] of trackMarkers) {
      if (!currentTrackIds.has(id)) {
        marker.remove()
        trackMarkers.delete(id)
      }
    }
    for (const [id, trail] of trackTrails) {
      if (!currentTrackIds.has(id)) {
        trail.remove()
        trackTrails.delete(id)
      }
    }

    // Update or create markers for current tracks
    for (const track of tracks) {
      const latLng = metersToLatLng(track.position.x, track.position.y, mapHeight.value)
      const color = tailwindColorToHex(track.color)

      // Update or create marker
      let marker = trackMarkers.get(track.id)
      if (marker) {
        marker.setLatLng(latLng)
      } else {
        marker = L.circleMarker(latLng, {
          radius: 8,
          color: color,
          fillColor: color,
          fillOpacity: track.isGhost ? 0.4 : 0.8,
          weight: 2,
          opacity: track.isGhost ? 0.5 : 1,
        })
        marker.addTo(layers.tracks.value!)
        trackMarkers.set(track.id, marker)
      }

      // Update style based on ghost state
      marker.setStyle({
        fillOpacity: track.isGhost ? 0.4 : 0.8,
        opacity: track.isGhost ? 0.5 : 1,
      })

      // Update or create trail
      if (track.trail && track.trail.length > 1) {
        const trailLatLngs = track.trail.map((p) =>
          metersToLatLng(p.x, p.y, mapHeight.value)
        )

        let trail = trackTrails.get(track.id)
        if (trail) {
          trail.setLatLngs(trailLatLngs)
        } else {
          trail = L.polyline(trailLatLngs, {
            color: color,
            weight: 3,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round',
          })
          trail.addTo(layers.tracks.value!)
          trackTrails.set(track.id, trail)
        }
      }
    }
  }

  /**
   * Clear all tracks
   */
  const clearTracks = () => {
    for (const marker of trackMarkers.values()) {
      marker.remove()
    }
    for (const trail of trackTrails.values()) {
      trail.remove()
    }
    trackMarkers.clear()
    trackTrails.clear()
  }

  /**
   * Fit map to sitemap bounds
   */
  const fitToBounds = () => {
    if (!mapRef.value) return
    const bounds = createMapBounds(mapWidth.value, mapHeight.value)
    mapRef.value.fitBounds(bounds)
  }

  /**
   * Get mouse coordinates in meters
   */
  const getMouseCoordinates = () => mouseCoords.value

  return {
    mapRef,
    hoveredCameraId,
    selectedCameraId,
    initMap,
    destroyMap,
    drawBackground,
    drawGrid,
    drawWalls,
    drawObstacles,
    drawZones,
    drawCameras,
    highlightCamera,
    setSelectedCamera,
    updateTracks,
    clearTracks,
    fitToBounds,
    getMouseCoordinates,
  }
}
