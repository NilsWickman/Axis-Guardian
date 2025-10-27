/**
 * Enhanced Site Map Type Definitions
 * Supports both 2D manual maps and 3D auto-generated maps
 */

export type SiteMapSource = 'manual' | 'generated-sfm' | 'generated-geometric'
export type GenerationMethod = 'sfm' | 'geometric' | 'manual'

/**
 * Camera pose from SfM reconstruction
 */
export interface CameraPose {
  cameraId: string
  position: [number, number, number] // [x, y, z] in meters
  rotation: [number, number, number] // Euler angles [rx, ry, rz]
  confidence: number // 0-1
}

/**
 * 3D Point Cloud metadata
 */
export interface PointCloudData {
  vertices: number
  url: string // Path to .ply file
  format: 'ply' | 'obj'
  boundingBox?: {
    min: [number, number, number]
    max: [number, number, number]
  }
}

/**
 * Multi-level building support
 */
export interface BuildingLevel {
  id: string
  name: string
  elevation: number // meters above ground
  walls: Wall[]
  cameras: string[] // Camera IDs on this level
}

/**
 * 3D reconstruction metadata
 */
export interface ReconstructionMetadata {
  method: GenerationMethod
  timestamp: string

  // SfM-specific
  pointCloud?: PointCloudData
  cameraPoses?: CameraPose[]

  // Multi-level support
  levels?: BuildingLevel[]

  // Quality metrics
  quality?: {
    featureMatches: number
    reconstructionError: number
    coverage: number // 0-1, percentage of area covered
  }
}

/**
 * Confidence/uncertainty visualization
 */
export interface ConfidenceMap {
  lowConfidenceRegions: Array<{
    polygon: Array<{ x: number; y: number }>
    confidence: number
    reason: string
  }>
  wallConfidence: Record<string, number> // wallId -> confidence
}

/**
 * Wall segment
 */
export interface Wall {
  id: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  type: 'external' | 'internal' | 'door' | 'assumed'
  thickness?: number
  confidence?: number
  source?: string // Which camera/method detected it
}

/**
 * Camera placement on site map
 */
export interface CameraPlacement {
  cameraId: string
  x: number
  y: number
  rotation: number // degrees
  angle: number // tilt angle
  height: number // mount height in meters
  fov: number // field of view in degrees
  viewDistance: number // viewing distance in pixels
  autoCalculateDistance: boolean
  color: string
}

/**
 * Fog of war region (unobserved areas)
 */
export interface FogOfWarRegion {
  polygon: Array<{ x: number; y: number }>
  assumed_type: string
  confidence: number
  area_m2: number
}

/**
 * Enhanced Site Map (supports both 2D and 3D)
 */
export interface EnhancedSiteMap {
  id: string
  name: string
  description: string
  source: SiteMapSource

  // 2D representation (always present)
  width: number // pixels
  height: number // pixels
  scale: number // pixels per meter
  origin: {
    x: number
    y: number
  }

  // Map elements
  walls: Wall[]
  cameras: CameraPlacement[]
  fog_of_war_regions?: FogOfWarRegion[]

  // 3D reconstruction (for auto-generated maps)
  reconstruction?: ReconstructionMetadata

  // Confidence/uncertainty (for auto-generated maps)
  confidenceMap?: ConfidenceMap

  // Metadata
  cameras_used?: string[]
  generated_at?: string
  createdAt: string
  updatedAt: string
}

/**
 * SfM Generation Settings
 */
export interface SfMSettings {
  featureType: 'sift' | 'orb' | 'akaze'
  maxFeatures: number
  gridResolution: number // meters (e.g., 0.05 = 5cm)
  wallDetectionThreshold: number // 0-1
  minWallLength: number // meters
  exportFormats: Array<'2d' | '3d' | 'json'>
}

/**
 * Camera snapshot for generation
 */
export interface CameraSnapshot {
  id: string
  imageUrl: string
  imageBlob?: Blob
  height: number // mount height in meters
  metadata?: {
    timestamp: string
    resolution: string
    ipAddress?: string
  }
}

/**
 * SfM Generation Request
 */
export interface SfMGenerationRequest {
  cameras: CameraSnapshot[]
  settings: SfMSettings
}

/**
 * SfM Generation Response
 */
export interface SfMGenerationResponse {
  generation_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  message?: string
  outputs?: {
    siteMap2D?: string // URL to PNG
    siteMap3D?: string // URL to PLY
    siteMapJSON?: string // URL to JSON
  }
  site_map_data?: EnhancedSiteMap
  error?: string
}

/**
 * Generation progress update
 */
export interface GenerationProgress {
  generation_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  current_step: string
  cameras_processed: number
  total_cameras: number
  message: string
  estimated_time_remaining?: number // seconds
}
