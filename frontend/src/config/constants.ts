// Application constants
export const APP_NAME = 'AXIS Surveillance System'
export const VERSION = '1.0.0'

export const DETECTION_TYPES = {
  PERSON: 'person',
  VEHICLE: 'vehicle',
  ANIMAL: 'animal',
  UNKNOWN: 'unknown'
} as const

export const ALARM_STATUSES = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved'
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
} as const