/**
 * Device-related types
 *
 * TODO: Generate these from OpenAPI schemas
 */

export interface Device {
  device_id: string;
  type: 'camera' | 'speaker';
  model: string;
  ip: string;
  position: {
    x: number;
    y: number;
  };
  heading?: number;
  height?: number;
  capabilities: string[];
  status: 'online' | 'offline' | 'degraded';
  last_seen?: string;
}

export interface CameraDevice extends Device {
  type: 'camera';
  rtsp_url: string;
  calibration?: {
    homography: number[][];
  };
}

export interface SpeakerDevice extends Device {
  type: 'speaker';
  volume: number;
}
