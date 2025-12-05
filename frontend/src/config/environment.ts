// Environment configuration
export const config = {
  // API endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  rtspProxyUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'http://localhost:8081',

  // WebSocket endpoints (complete URLs - do NOT append paths to these)
  wsAlarmUrl: import.meta.env.VITE_WS_ALARM_URL || 'ws://localhost:3001/ws/alarms',
  wsDetectionUrl: import.meta.env.VITE_WS_DETECTION_URL || 'ws://localhost:3002/ws/detections',
  wsCameraStatusUrl: import.meta.env.VITE_WS_CAMERA_URL || 'ws://localhost:3007/ws/camera-status',

  // WebRTC signaling endpoints
  // Camera emulators use HTTP WHEP protocol (not WebSocket)
  camera1WebRTCUrl: import.meta.env.VITE_CAMERA1_WEBRTC_URL || 'http://localhost:9101',
  camera2WebRTCUrl: import.meta.env.VITE_CAMERA2_WEBRTC_URL || 'http://localhost:9102',

  // MediaMTX WebSocket signaling (if needed for other cameras)
  mediaMTXSignalingUrl: import.meta.env.VITE_WEBRTC_URL || 'ws://localhost:8080',

  // Site map generation
  siteMapGenerationUrl: import.meta.env.VITE_SITEMAP_URL || 'http://localhost:8091',

  // Tracking service WebSocket
  trackingServiceWsUrl: import.meta.env.VITE_TRACKING_WS_URL || 'ws://localhost:3010/ws',

  // Environment flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Mock mode - when true, use mock data instead of real API calls
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false', // Default to true in development

  // API timeout
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
}

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const required = ['apiBaseUrl']
  const missing = required.filter(key => !config[key as keyof typeof config])

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing)
  }
}

// Auto-validate in development
if (config.isDevelopment) {
  validateConfig()
}