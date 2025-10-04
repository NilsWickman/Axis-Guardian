/**
 * Detection-related types
 *
 * TODO: Generate these from OpenAPI schemas
 */

export interface DetectionEvent {
  detection_id: string;
  device_id: string;
  timestamp: string;
  object: {
    type: 'person' | 'vehicle' | 'animal';
    confidence: number;
    bbox: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
  geo: {
    lat: number;
    lon: number;
    x: number;
    y: number;
  };
  frame_ref?: string;
  sequence_id: number;
  ingest_time: string;
}

export interface NormalizedDetection extends DetectionEvent {
  track_id?: string;
}
