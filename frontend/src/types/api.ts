// API types
export interface User {
  id: string
  username: string
  role: string
}

export interface Camera {
  id: string
  name: string
  url: string
}

export interface Detection {
  id: string
  cameraId: string
  timestamp: string
  type: string
  confidence: number
}

export interface Alarm {
  id: string
  detectionId: string
  status: string
  timestamp: string
}