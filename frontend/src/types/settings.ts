// Settings Types

export type ObjectType = 'person' | 'vehicle' | 'animal'

export interface ObjectTypeConfig {
  type: ObjectType
  enabled: boolean
  label: string
  description: string
}

export interface AlarmLifecycleConfig {
  requireNotesOnAcknowledge: boolean
  requireNotesOnDismiss: boolean
  requireDismissalReason: boolean
  requireClosureNote: boolean
  requireOutcomeCategory: boolean
  enableIncidentCreation: boolean
  autoArchiveAfterDays: number
}

export interface DismissalReason {
  id: string
  label: string
  requiresNote: boolean
}

export interface OutcomeCategory {
  id: string
  label: string
  color: string
}

export interface SystemSettings {
  objectTypes: ObjectTypeConfig[]
  alarmLifecycle: AlarmLifecycleConfig
  dismissalReasons: DismissalReason[]
  outcomeCategories: OutcomeCategory[]
  updatedAt?: string
  updatedBy?: string
}
