import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET /detections
router.get('/', async (req, res) => {
  try {
    const {
      cameraId,
      type,
      startTime,
      endTime,
      limit = '20',
      offset = '0'
    } = req.query

    const where: any = {}
    if (cameraId) where.cameraId = cameraId
    if (type) where.type = (type as string).toUpperCase()
    if (startTime || endTime) {
      where.timestamp = {}
      if (startTime) where.timestamp.gte = new Date(startTime as string)
      if (endTime) where.timestamp.lte = new Date(endTime as string)
    }

    const detections = await prisma.detection.findMany({
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
    const transformedDetections = detections.map(detection => ({
      id: detection.id,
      timestamp: detection.timestamp.toISOString(),
      cameraId: detection.cameraId,
      type: detection.type.toLowerCase(),
      confidence: detection.confidence,
      bbox: detection.bbox,
      attributes: detection.attributes
    }))

    res.json(transformedDetections)
  } catch (error) {
    console.error('Get detections error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch detections',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /detections/:detectionId
router.get('/:detectionId', async (req, res) => {
  try {
    const { detectionId } = req.params

    const detection = await prisma.detection.findUnique({
      where: { id: detectionId },
      include: {
        camera: {
          select: { name: true }
        }
      }
    })

    if (!detection) {
      return res.status(404).json({
        error: 'DETECTION_NOT_FOUND',
        message: `Detection ${detectionId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      id: detection.id,
      timestamp: detection.timestamp.toISOString(),
      cameraId: detection.cameraId,
      type: detection.type.toLowerCase(),
      confidence: detection.confidence,
      bbox: detection.bbox,
      attributes: detection.attributes
    })
  } catch (error) {
    console.error('Get detection error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch detection',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /tracks
router.get('/tracks', async (req, res) => {
  try {
    const {
      cameraId,
      startTime,
      endTime,
      active
    } = req.query

    const where: any = {}
    if (active !== undefined) where.active = active === 'true'
    if (startTime || endTime) {
      where.startTime = {}
      if (startTime) where.startTime.gte = new Date(startTime as string)
      if (endTime) where.startTime.lte = new Date(endTime as string)
    }

    let tracks = await prisma.track.findMany({
      where,
      include: {
        detections: {
          where: cameraId ? { cameraId } : undefined,
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    // Filter tracks that have detections from the specified camera
    if (cameraId) {
      tracks = tracks.filter(track => track.detections.length > 0)
    }

    // Transform to match API contract
    const transformedTracks = tracks.map(track => ({
      trackId: track.trackId,
      detections: track.detections.map(d => ({
        id: d.id,
        timestamp: d.timestamp.toISOString(),
        cameraId: d.cameraId,
        type: d.type.toLowerCase(),
        confidence: d.confidence,
        bbox: d.bbox,
        attributes: d.attributes
      })),
      startTime: track.startTime.toISOString(),
      lastUpdate: track.lastUpdate.toISOString(),
      predictedPosition: track.predictedPosition,
      velocity: track.velocity
    }))

    res.json(transformedTracks)
  } catch (error) {
    console.error('Get tracks error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch tracks',
      timestamp: new Date().toISOString()
    })
  }
})

export default router