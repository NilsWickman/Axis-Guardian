/**
 * Environment Configuration
 */

export interface EnvironmentConfig {
  port: number
  host: string
  cameraEmulatorUrls: string[]
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  // ACAP client configuration
  acapEnabled: boolean
  acapBrokerHost: string
  acapBrokerPort: number
  acapTopicPrefix: string
  acapUsername?: string
  acapPassword?: string
}

export function loadEnvironment(): EnvironmentConfig {
  return {
    port: parseInt(process.env.PORT ?? '3010', 10),
    host: process.env.HOST ?? '0.0.0.0',
    cameraEmulatorUrls: (process.env.CAMERA_EMULATORS ?? 'ws://localhost:9101,ws://localhost:9102')
      .split(',')
      .map(url => url.trim()),
    logLevel: (process.env.LOG_LEVEL ?? 'info') as EnvironmentConfig['logLevel'],
    // ACAP client configuration
    acapEnabled: process.env.ACAP_ENABLED === 'true',
    acapBrokerHost: process.env.ACAP_BROKER_HOST ?? 'localhost',
    acapBrokerPort: parseInt(process.env.ACAP_BROKER_PORT ?? '1883', 10),
    acapTopicPrefix: process.env.ACAP_TOPIC_PREFIX ?? 'analytics_scene/raw',
    acapUsername: process.env.ACAP_USERNAME,
    acapPassword: process.env.ACAP_PASSWORD,
  }
}
