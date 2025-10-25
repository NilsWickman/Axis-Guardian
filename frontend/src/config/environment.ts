// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  rtspProxyUrl: import.meta.env.VITE_RTSP_PROXY_URL || 'http://localhost:8081',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}