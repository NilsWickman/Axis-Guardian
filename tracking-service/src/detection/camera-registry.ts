/**
 * Camera Registry - Manages camera configurations for projection
 */

import type { CameraParams, CameraConfig, SiteMapCameraConfig, CameraCalibration } from '../types.js'
import { siteMapConfigToCamera } from '../projection/ground-plane.js'

/**
 * K/R/T Calibration data from Auditorium dataset (cam_param.mat)
 * These matrices provide accurate pixel-to-world projection
 */
const CAMERA_CALIBRATIONS: Record<string, CameraCalibration> = {
  'camera1': {  // HC3
    K: [
      [1480, 0, 0],
      [0, 1480, 0],
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
  'camera2': {  // HC4
    K: [
      [2350, 0, 0],
      [0, 2350, 0],
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
