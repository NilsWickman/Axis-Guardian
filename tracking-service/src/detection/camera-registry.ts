/**
 * Camera Registry - Manages camera configurations for projection
 */

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'

/**
 * Build rotation matrix from azimuth and elevation angles
 * @param azimuthDeg - Azimuth in degrees (0 = North/+Y, 90 = East/+X, clockwise)
 * @param elevationDeg - Elevation in degrees (negative = looking down)
 */
function buildRotationMatrix(azimuthDeg: number, elevationDeg: number): number[][] {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180

  const cosAz = Math.cos(az)
  const sinAz = Math.sin(az)
  const cosEl = Math.cos(el)
  const sinEl = Math.sin(el)

  // Rotation around Z axis (azimuth) then X axis (elevation)
  // Rz * Rx composition
  return [
    [cosAz, -sinAz * cosEl, sinAz * sinEl],
    [sinAz, cosAz * cosEl, -cosAz * sinEl],
    [0, sinEl, cosEl],
  ]
}

/**
 * Estimate intrinsic matrix K from assumed FOV
 * @param fovDeg - Horizontal field of view in degrees
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 */
function estimateIntrinsicMatrix(
  fovDeg: number = 60,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): number[][] {
  const fovRad = (fovDeg * Math.PI) / 180
  const fx = (imageWidth / 2) / Math.tan(fovRad / 2)
  const fy = fx  // Assume square pixels
  const cx = imageWidth / 2
  const cy = imageHeight / 2

  return [
    [fx, 0, cx],
    [0, fy, cy],
    [0, 0, 1],
  ]
}

/**
 * K/R/T Calibration data from Auditorium dataset (cam_param.mat)
 * HC3/HC4: Extracted from MATLAB file
 * IP2/IP5: Estimated from scene_metadata.xml
 */
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  'camera1': {  // HC3 - from cam_param.mat
    K: [
      [1480, 0, 960],
      [0, 1480, 540],
      [0, 0, 1],
    ],
    R: [
      [0.26415998, 0.96365108, -0.0399512],
      [0.01284627, -0.04493433, -0.99890734],
      [-0.96439332, 0.26335812, -0.02424917],
    ],
    T: [8.319724452629636, 13.445955713668864, 1.5930329257377853],
    center: [960, 540],
    scale: 1,
  },
  'camera2': {  // HC4 - from cam_param.mat
    K: [
      [2350, 0, 960],
      [0, 2350, 540],
      [0, 0, 1],
    ],
    R: [
      [1, 0, 0],
      [0, -0.08715574274765801, -0.9961946980917455],
      [0, 0.9961946980917455, -0.08715574274765801],
    ],
    T: [0, 0, 1.5],
    center: [960, 540],
    scale: 1,
  },
  'camera3': {  // IP2 - estimated from scene_metadata.xml
    // Position: (20.60, 28.31, 2.62), Azimuth: 140°, Elevation: -9°
    K: estimateIntrinsicMatrix(60),
    R: buildRotationMatrix(140, -9),
    T: [20.60, 28.31, 2.62],
    center: [960, 540],
    scale: 1,
  },
  'camera4': {  // IP5 - estimated from scene_metadata.xml
    // Position: (10.57, 16.31, 1.84), Azimuth: 339°, Elevation: 0°
    K: estimateIntrinsicMatrix(60),
    R: buildRotationMatrix(339, 0),
    T: [10.57, 16.31, 1.84],
    center: [960, 540],
    scale: 1,
  },
}

/**
 * Legacy camera configs (kept for backward compatibility)
 */
const DEFAULT_CAMERAS: SiteMapCameraConfig[] = [
  {
    id: 'camera1',
    position: { x: 8.32, y: 13.45 },  // From T vector
    rotation: 0,
    elevation: 45,
    height: 1.59,
    fieldOfView: 60,
    viewDistance: 25,
  },
  {
    id: 'camera2',
    position: { x: 0, y: 0 },  // From T vector
    rotation: 0,
    elevation: 85,  // Almost straight down
    height: 1.5,
    fieldOfView: 40,
    viewDistance: 25,
  },
]

/**
 * Map camera emulator IDs to internal camera IDs
 * camera-HC3 -> camera1, camera-HC4 -> camera2, etc.
 */
const CAMERA_ID_MAP: Record<string, string> = {
  'camera-HC3': 'camera1',
  'camera-HC4': 'camera2',
  'camera-IP2': 'camera3',
  'camera-IP5': 'camera4',
  // Direct mappings
  'camera1': 'camera1',
  'camera2': 'camera2',
  'camera3': 'camera3',
  'camera4': 'camera4',
}

export class CameraRegistry {
  private cameras: Map<string, CameraParams> = new Map()

  constructor() {
    this.loadDefaultCameras()
  }

  private loadDefaultCameras(): void {
    for (const config of DEFAULT_CAMERAS) {
      this.cameras.set(config.id, siteMapConfigToCamera(config))
    }
  }

  /**
   * Add or update a camera configuration
   */
  setCamera(cameraId: string, config: CameraConfig): void {
    this.cameras.set(cameraId, {
      position: { x: config.position.x, y: config.position.y, z: config.position.z },
      azimuth: config.azimuth,
      elevation: config.elevation,
      fov: config.fov,
      maxDistance: config.viewDistance,
    })
  }

  /**
   * Register a camera with CameraParams directly
   */
  registerCamera(cameraId: string, params: CameraParams): void {
    this.cameras.set(cameraId, params)
  }

  /**
   * Get camera parameters by ID
   */
  getCamera(cameraId: string): CameraParams | undefined {
    // Try direct lookup first
    let camera = this.cameras.get(cameraId)
    if (camera) return camera

    // Try mapped ID
    const mappedId = CAMERA_ID_MAP[cameraId]
    if (mappedId) {
      camera = this.cameras.get(mappedId)
    }

    return camera
  }

  /**
   * Get K/R/T calibration data for a camera
   */
  getCalibration(cameraId: string): CameraCalibration | undefined {
    const normalizedId = this.normalizeCameraId(cameraId)
    return CAMERA_CALIBRATIONS[normalizedId]
  }

  /**
   * Check if a camera has K/R/T calibration data
   */
  hasCalibration(cameraId: string): boolean {
    const normalizedId = this.normalizeCameraId(cameraId)
    return normalizedId in CAMERA_CALIBRATIONS
  }

  /**
   * Normalize camera ID from emulator format to internal format
   */
  normalizeCameraId(rawId: string): string {
    return CAMERA_ID_MAP[rawId] ?? rawId
  }

  /**
   * Get all camera IDs
   */
  getCameraIds(): string[] {
    return Array.from(this.cameras.keys())
  }

  /**
   * Get all cameras as array
   */
  getAllCameras(): Array<{ cameraId: string; params: CameraParams }> {
    return Array.from(this.cameras.entries()).map(([cameraId, params]) => ({
      cameraId,
      params,
    }))
  }

  /**
   * Load cameras from sitemap config array
   */
  loadFromSiteMapConfig(configs: SiteMapCameraConfig[]): void {
    this.cameras.clear()
    for (const config of configs) {
      this.cameras.set(config.id, siteMapConfigToCamera(config))
    }
  }

  /**
   * Clear all cameras
   */
  clear(): void {
    this.cameras.clear()
  }
}
