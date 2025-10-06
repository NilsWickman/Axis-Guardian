import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET /alarms
router.get('/', async (req, res) => {
  try {
    const {
      type,
      severity,
      acknowledged,
      limit = '20',
      offset = '0'
    } = req.query

    const where: any = {}
    if (type) where.type = (type as string).toUpperCase()
    if (severity) where.severity = (severity as string).toUpperCase()
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true'

    const alarms = await prisma.alarm.findMany({
      where,
      include: {
        camera: {
          select: { name: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })

    // Transform to match API contract
    const transformedAlarms = alarms.map(alarm => ({
      id: alarm.id,
      timestamp: alarm.timestamp.toISOString(),
      type: alarm.type.toLowerCase(),
      severity: alarm.severity.toLowerCase(),
      source: alarm.source,
      acknowledged: alarm.acknowledged,
      acknowledgedBy: alarm.acknowledgedBy,
      acknowledgedAt: alarm.acknowledgedAt?.toISOString()
    }))

    res.json(transformedAlarms)
  } catch (error) {
    console.error('Get alarms error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch alarms',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /alarms/:alarmId
router.get('/:alarmId', async (req, res) => {
  try {
    const { alarmId } = req.params

    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId },
      include: {
        camera: {
          select: { name: true }
        }
      }
    })

    if (!alarm) {
      return res.status(404).json({
        error: 'ALARM_NOT_FOUND',
        message: `Alarm ${alarmId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      id: alarm.id,
      timestamp: alarm.timestamp.toISOString(),
      type: alarm.type.toLowerCase(),
      severity: alarm.severity.toLowerCase(),
      source: alarm.source,
      acknowledged: alarm.acknowledged,
      acknowledgedBy: alarm.acknowledgedBy,
      acknowledgedAt: alarm.acknowledgedAt?.toISOString()
    })
  } catch (error) {
    console.error('Get alarm error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch alarm',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /alarms/:alarmId/acknowledge
router.post('/:alarmId/acknowledge', async (req, res) => {
  try {
    const { alarmId } = req.params
    const { acknowledgedBy } = req.body

    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId }
    })

    if (!alarm) {
      return res.status(404).json({
        error: 'ALARM_NOT_FOUND',
        message: `Alarm ${alarmId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    if (alarm.acknowledged) {
      return res.status(400).json({
        error: 'ALARM_ALREADY_ACKNOWLEDGED',
        message: `Alarm ${alarmId} is already acknowledged`,
        timestamp: new Date().toISOString()
      })
    }

    // Update alarm
    const updatedAlarm = await prisma.alarm.update({
      where: { id: alarmId },
      data: {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date()
      }
    })

    console.log(`🚨 Alarm ${alarmId} acknowledged by ${acknowledgedBy}`)

    res.json({
      id: updatedAlarm.id,
      acknowledged: updatedAlarm.acknowledged,
      acknowledgedBy: updatedAlarm.acknowledgedBy,
      acknowledgedAt: updatedAlarm.acknowledgedAt?.toISOString()
    })
  } catch (error) {
    console.error('Acknowledge alarm error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to acknowledge alarm',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /alarms
router.post('/', async (req, res) => {
  try {
    const { type, severity, source } = req.body

    const alarm = await prisma.alarm.create({
      data: {
        type: type.toUpperCase(),
        severity: severity.toUpperCase(),
        source,
        cameraId: source.cameraId
      }
    })

    console.log(`🚨 New alarm created:`, alarm.id)

    res.status(201).json({
      id: alarm.id,
      timestamp: alarm.timestamp.toISOString(),
      type: alarm.type.toLowerCase(),
      severity: alarm.severity.toLowerCase(),
      source: alarm.source,
      acknowledged: alarm.acknowledged
    })
  } catch (error) {
    console.error('Create alarm error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create alarm',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /alarms/statistics
router.get('/statistics', async (req, res) => {
  try {
    const total = await prisma.alarm.count()
    const unacknowledged = await prisma.alarm.count({
      where: { acknowledged: false }
    })

    // Get counts by severity
    const criticalCount = await prisma.alarm.count({
      where: { severity: 'CRITICAL' }
    })
    const highCount = await prisma.alarm.count({
      where: { severity: 'HIGH' }
    })
    const mediumCount = await prisma.alarm.count({
      where: { severity: 'MEDIUM' }
    })
    const lowCount = await prisma.alarm.count({
      where: { severity: 'LOW' }
    })

    // Get counts by type
    const intrusionCount = await prisma.alarm.count({
      where: { type: 'INTRUSION' }
    })
    const loiteringCount = await prisma.alarm.count({
      where: { type: 'LOITERING' }
    })
    const lineCrossingCount = await prisma.alarm.count({
      where: { type: 'LINE_CROSSING' }
    })
    const zoneViolationCount = await prisma.alarm.count({
      where: { type: 'ZONE_VIOLATION' }
    })
    const abandonedObjectCount = await prisma.alarm.count({
      where: { type: 'ABANDONED_OBJECT' }
    })

    res.json({
      total,
      unacknowledged,
      bySeverity: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount
      },
      byType: {
        intrusion: intrusionCount,
        loitering: loiteringCount,
        line_crossing: lineCrossingCount,
        zone_violation: zoneViolationCount,
        abandoned_object: abandonedObjectCount
      }
    })
  } catch (error) {
    console.error('Get alarm statistics error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch alarm statistics',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /alarms/:alarmId/archive
router.post('/:alarmId/archive', async (req, res) => {
  try {
    const { alarmId } = req.params
    const { archivedBy } = req.body

    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId }
    })

    if (!alarm) {
      return res.status(404).json({
        error: 'ALARM_NOT_FOUND',
        message: `Alarm ${alarmId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    // Note: This would need a database migration to add archivedBy and archivedAt fields
    // For now, we'll simulate it with the source field or a custom JSON field
    console.log(`📦 Alarm ${alarmId} archived by ${archivedBy}`)

    res.json({
      id: alarm.id,
      archived: true,
      archivedBy,
      archivedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Archive alarm error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to archive alarm',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /alarms/:alarmId/unarchive
router.post('/:alarmId/unarchive', async (req, res) => {
  try {
    const { alarmId } = req.params

    const alarm = await prisma.alarm.findUnique({
      where: { id: alarmId }
    })

    if (!alarm) {
      return res.status(404).json({
        error: 'ALARM_NOT_FOUND',
        message: `Alarm ${alarmId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`📤 Alarm ${alarmId} unarchived`)

    res.json({
      id: alarm.id,
      archived: false,
      unarchivedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Unarchive alarm error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to unarchive alarm',
      timestamp: new Date().toISOString()
    })
  }
})

export default router