// Domain types for surveillance system
export interface Zone {
  id: string
  name: string
  coordinates: number[][]
}

export interface Site {
  id: string
  name: string
  zones: Zone[]
}

export interface PTZCommand {
  action: 'pan' | 'tilt' | 'zoom'
  value: number
  speed?: number
}