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

export default router