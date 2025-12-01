/**
 * Environment Configuration
 */

export interface EnvironmentConfig {
  port: number
  host: string
  cameraEmulatorUrls: string[]
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export function loadEnvironment(): EnvironmentConfig {
  return {
    port: parseInt(process.env.PORT ?? '3010', 10),
    host: process.env.HOST ?? '0.0.0.0',
    cameraEmulatorUrls: (process.env.CAMERA_EMULATORS ?? 'ws://localhost:9101,ws://localhost:9102')
      .split(',')
      .map(url => url.trim()),
    logLevel: (process.env.LOG_LEVEL ?? 'info') as EnvironmentConfig['logLevel'],
  }
}
