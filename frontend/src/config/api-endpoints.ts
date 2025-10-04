// API endpoint definitions
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me'
  },
  CAMERAS: {
    LIST: '/cameras',
    GET: (id: string) => `/cameras/${id}`,
    CONTROL: (id: string) => `/cameras/${id}/control`,
    STREAM: (id: string) => `/cameras/${id}/stream`
  },
  DETECTIONS: {
    LIST: '/detections',
    GET: (id: string) => `/detections/${id}`,
    WEBSOCKET: '/ws/detections'
  },
  ALARMS: {
    LIST: '/alarms',
    GET: (id: string) => `/alarms/${id}`,
    ACKNOWLEDGE: (id: string) => `/alarms/${id}/acknowledge`,
    RESOLVE: (id: string) => `/alarms/${id}/resolve`
  }
} as const