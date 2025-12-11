// Environment configuration
const isDev = import.meta.env.DEV

const getRuntimeOrigin = (): string => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

const stripTrailingSlash = (url: string): string => url.endsWith('/') ? url.slice(0, -1) : url

const runtimeOrigin = stripTrailingSlash(getRuntimeOrigin())

const runtimeHttpWithPort = (port: number): string => {
  if (!runtimeOrigin) return ''
  try {
    const url = new URL(runtimeOrigin)
    url.port = String(port)
    return stripTrailingSlash(url.toString())
  } catch {
    return ''
  }
}

const runtimeWsWithPort = (port: number): string => {
  if (!runtimeOrigin) return ''
  try {
    const url = new URL(runtimeOrigin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.port = String(port)
    return stripTrailingSlash(url.toString())
  } catch {
    return ''
  }
}

const runtimeWsOrigin = runtimeOrigin
  ? runtimeOrigin.replace(/^http/, 'ws')
  : ''

export const config = {
  // API endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL
    || (isDev || !runtimeOrigin ? 'http://localhost:8000' : `${runtimeOrigin}/api`),

  // WebRTC ICE servers for NAT traversal (required for mobile/external clients)
  // Can be overridden via VITE_ICE_SERVERS env var as JSON array
  // e.g., VITE_ICE_SERVERS='[{"urls":"stun:stun.example.com:19302"},{"urls":"turn:turn.example.com","username":"user","credential":"pass"}]'
  iceServers: import.meta.env.VITE_ICE_SERVERS
    ? JSON.parse(import.meta.env.VITE_ICE_SERVERS)
    : [{ urls: 'stun:stun.l.google.com:19302' }],

  // Primary WebSocket to API (same host in production)
  wsUrl: import.meta.env.VITE_WS_URL
    || (isDev || !runtimeWsOrigin ? 'ws://localhost:8000/ws' : `${stripTrailingSlash(runtimeWsOrigin)}/ws`),

  // RTSP/WebRTC proxy service base (used for snapshots and WHEP/WHEP-like endpoints)
  rtspProxyUrl: import.meta.env.VITE_RTSP_PROXY_URL
    || (isDev || !runtimeOrigin ? 'http://localhost:8081' : runtimeHttpWithPort(8081)),

  // MediaMTX HLS base URL
  // In production this should point to your public MediaMTX/HLS endpoint.
  hlsBaseUrl: import.meta.env.VITE_HLS_BASE_URL
    || (isDev || !runtimeOrigin ? 'http://localhost:8888' : runtimeHttpWithPort(8888)),

  // WebSocket endpoints (complete URLs - do NOT append paths to these)
  wsAlarmUrl: import.meta.env.VITE_WS_ALARM_URL
    || (isDev || !runtimeOrigin ? 'ws://localhost:3001/ws/alarms' : `${runtimeWsWithPort(3001)}/ws/alarms`),
  wsDetectionUrl: import.meta.env.VITE_WS_DETECTION_URL
    || (isDev || !runtimeOrigin ? 'ws://localhost:3002/ws/detections' : `${runtimeWsWithPort(3002)}/ws/detections`),
  wsCameraStatusUrl: import.meta.env.VITE_WS_CAMERA_URL
    || (isDev || !runtimeOrigin ? 'ws://localhost:3007/ws/camera-status' : `${runtimeWsWithPort(3007)}/ws/camera-status`),

  // WebRTC signaling endpoints for camera emulators
  // In production: wss://domain/cam1 and wss://domain/cam2 (proxied via nginx)
  // In development: ws://localhost:9101 and ws://localhost:9102 (direct)
  camera1WebRTCUrl: import.meta.env.VITE_CAMERA1_WEBRTC_URL
    || (isDev || !runtimeWsOrigin ? 'ws://localhost:9101' : `${stripTrailingSlash(runtimeWsOrigin)}/cam1/`),
  camera2WebRTCUrl: import.meta.env.VITE_CAMERA2_WEBRTC_URL
    || (isDev || !runtimeWsOrigin ? 'ws://localhost:9102' : `${stripTrailingSlash(runtimeWsOrigin)}/cam2/`),

  // MediaMTX WebSocket signaling (if needed for other cameras)
  mediaMTXSignalingUrl: import.meta.env.VITE_WEBRTC_URL
    || (isDev || !runtimeWsOrigin ? 'ws://localhost:8080' : `${stripTrailingSlash(runtimeWsOrigin)}/webrtc/`),

  // Site map generation
  siteMapGenerationUrl: import.meta.env.VITE_SITEMAP_URL
    || (isDev || !runtimeOrigin ? 'http://localhost:8091' : runtimeHttpWithPort(8091)),

  // Tracking service WebSocket
  trackingServiceWsUrl: import.meta.env.VITE_TRACKING_WS_URL
    || (isDev || !runtimeOrigin ? 'ws://localhost:3010/ws' : `${runtimeWsWithPort(3010)}/ws`),

  // Tracking service REST API (for sitemap config)
  trackingServiceApiUrl: import.meta.env.VITE_TRACKING_API_URL
    || (isDev || !runtimeOrigin ? 'http://localhost:3010' : runtimeHttpWithPort(3010)),

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
