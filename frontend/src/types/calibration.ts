/**
 * Type definitions for camera calibration data
 */

/**
 * Camera calibration from scene_metadata.xml
 */
export interface CameraCalibration {
  cameraId: string          // Frontend camera ID (camera1, camera2)
  viewId: string            // Original XML view ID (view-HC3, view-HC4)
  position: {
    x: number               // X position in meters
    y: number               // Y position in meters
    z: number               // Z position (height) in meters
  }
  azimuth: number           // Horizontal rotation in degrees (0 = North)
  elevation: number         // Vertical tilt in degrees
}

/**
 * Scene metadata from XML
 */
export interface SceneMetadata {
  dataset: string
  scene: string
  cameras: CameraCalibration[]
}
