// Development environment configuration
import { config as appConfig } from '../../src/config/environment'

export const devConfig = {
  ...appConfig,
  // Development-specific overrides
  hotReload: true,
  verbose: true,
}