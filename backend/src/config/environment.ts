/**
 * Environment Configuration
 */

export interface EnvironmentConfig {
  port: number
  host: string
  cameraEmulatorUrls: string[]
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  wsMaxPayloadBytes: number
  wsMaxConnectionsPerIp: number
  wsAllowedOrigins: string[]
  wsAllowNoOrigin: boolean
  wsPingIntervalMs: number
  // ACAP client configuration
  acapEnabled: boolean
  acapBrokerHost: string
  acapBrokerPort: number
  acapTopicPrefix: string
  acapUsername?: string
  acapPassword?: string
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

export function loadEnvironment(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const isProd = nodeEnv === 'production'

  const defaultAllowedOrigins = [
    'https://pummenc2.win',
    'https://www.pummenc2.win',
    ...(isProd ? [] : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]),
  ]

  const allowedOrigins = parseCsv(process.env.WS_ALLOWED_ORIGINS)
  const wsAllowedOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins

  return {
    port: parseInt(process.env.PORT ?? '3010', 10),
    host: process.env.HOST ?? '0.0.0.0',
    cameraEmulatorUrls: (process.env.CAMERA_EMULATORS ?? 'ws://localhost:9101,ws://localhost:9102')
      .split(',')
      .map(url => url.trim()),
    logLevel: (process.env.LOG_LEVEL ?? 'info') as EnvironmentConfig['logLevel'],
    wsMaxPayloadBytes: parseInt(process.env.WS_MAX_PAYLOAD_BYTES ?? '1048576', 10),
    wsMaxConnectionsPerIp: parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP ?? '20', 10),
    wsAllowedOrigins,
    wsAllowNoOrigin: process.env.WS_ALLOW_NO_ORIGIN === 'true' || !isProd,
    wsPingIntervalMs: parseInt(process.env.WS_PING_INTERVAL_MS ?? '30000', 10),
    // ACAP client configuration
    acapEnabled: process.env.ACAP_ENABLED === 'true',
    acapBrokerHost: process.env.ACAP_BROKER_HOST ?? 'localhost',
    acapBrokerPort: parseInt(process.env.ACAP_BROKER_PORT ?? '1883', 10),
    acapTopicPrefix: process.env.ACAP_TOPIC_PREFIX ?? 'analytics_scene/raw',
    acapUsername: process.env.ACAP_USERNAME,
    acapPassword: process.env.ACAP_PASSWORD,
  }
}
