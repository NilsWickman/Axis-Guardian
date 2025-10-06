import express from 'express'

const router = express.Router()

// Mock system settings
let systemSettings = {
  objectTypes: [
    {
      type: 'person',
      enabled: true,
      label: 'Person',
      description: 'Human detection triggers alarms'
    },
    {
      type: 'vehicle',
      enabled: false,
      label: 'Vehicle',
      description: 'Vehicle detection triggers alarms'
    },
    {
      type: 'animal',
      enabled: false,
      label: 'Animal',
      description: 'Animal detection triggers alarms'
    }
  ],
  alarmLifecycle: {
    requireNotesOnAcknowledge: false,
    requireNotesOnDismiss: true,
    requireDismissalReason: true,
    requireClosureNote: false,
    requireOutcomeCategory: false,
    enableIncidentCreation: true,
    autoArchiveAfterDays: 30
  },
  dismissalReasons: [
    { id: 'false_positive', label: 'False Positive', requiresNote: false },
    { id: 'authorized_person', label: 'Authorized Person', requiresNote: true },
    { id: 'animal', label: 'Animal Detected', requiresNote: false },
    { id: 'weather', label: 'Weather Event', requiresNote: false },
    { id: 'technical_issue', label: 'Technical Issue', requiresNote: true },
    { id: 'other', label: 'Other', requiresNote: true }
  ],
  outcomeCategories: [
    { id: 'resolved', label: 'Resolved', color: 'green' },
    { id: 'escalated', label: 'Escalated', color: 'red' },
    { id: 'monitoring', label: 'Monitoring', color: 'yellow' },
    { id: 'no_action', label: 'No Action Required', color: 'gray' }
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin'
}

// GET /settings - Get system settings
router.get('/', (req, res) => {
  try {
    res.json(systemSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch system settings',
      timestamp: new Date().toISOString()
    })
  }
})

// PUT /settings/object-types - Update object types
router.put('/object-types', (req, res) => {
  try {
    const { objectTypes } = req.body

    if (!objectTypes || !Array.isArray(objectTypes)) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'objectTypes must be an array',
        timestamp: new Date().toISOString()
      })
    }

    systemSettings.objectTypes = objectTypes
    systemSettings.updatedAt = new Date().toISOString()

    console.log('📝 Object types updated:', objectTypes.filter(t => t.enabled).map(t => t.type))

    res.json({
      objectTypes: systemSettings.objectTypes,
      updatedAt: systemSettings.updatedAt
    })
  } catch (error) {
    console.error('Update object types error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update object types',
      timestamp: new Date().toISOString()
    })
  }
})

// PUT /settings/alarm-lifecycle - Update alarm lifecycle configuration
router.put('/alarm-lifecycle', (req, res) => {
  try {
    const { alarmLifecycle } = req.body

    if (!alarmLifecycle || typeof alarmLifecycle !== 'object') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'alarmLifecycle must be an object',
        timestamp: new Date().toISOString()
      })
    }

    systemSettings.alarmLifecycle = alarmLifecycle
    systemSettings.updatedAt = new Date().toISOString()

    console.log('📝 Alarm lifecycle updated')

    res.json({
      alarmLifecycle: systemSettings.alarmLifecycle,
      updatedAt: systemSettings.updatedAt
    })
  } catch (error) {
    console.error('Update alarm lifecycle error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update alarm lifecycle',
      timestamp: new Date().toISOString()
    })
  }
})

// PUT /settings - Update all settings
router.put('/', (req, res) => {
  try {
    const { objectTypes, alarmLifecycle, dismissalReasons, outcomeCategories } = req.body

    if (objectTypes) systemSettings.objectTypes = objectTypes
    if (alarmLifecycle) systemSettings.alarmLifecycle = alarmLifecycle
    if (dismissalReasons) systemSettings.dismissalReasons = dismissalReasons
    if (outcomeCategories) systemSettings.outcomeCategories = outcomeCategories

    systemSettings.updatedAt = new Date().toISOString()

    console.log('📝 System settings updated')

    res.json(systemSettings)
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update settings',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
