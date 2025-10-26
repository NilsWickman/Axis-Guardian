// Environment configuration
export const config = {
  // API endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  rtspProxyUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'http://localhost:8081',

  // WebSocket endpoints
  wsAlarmUrl: import.meta.env.VITE_WS_ALARM_URL || 'ws://localhost:3001',
  wsDetectionUrl: import.meta.env.VITE_WS_DETECTION_URL || 'ws://localhost:3002',
  wsCameraStatusUrl: import.meta.env.VITE_WS_CAMERA_URL || 'ws://localhost:3007',
  webrtcUrl: import.meta.env.VITE_WEBRTC_URL || 'ws://localhost:8080',

  // Site map generation
  siteMapGenerationUrl: import.meta.env.VITE_SITEMAP_URL || 'http://localhost:8091',

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