import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET /cameras
router.get('/', async (req, res) => {
  try {
    const { status, zone } = req.query

    const where: any = {}
    if (status) where.status = (status as string).toUpperCase()

    const cameras = await prisma.camera.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    // Transform to match API contract
    const transformedCameras = cameras.map(camera => ({
      id: camera.id,
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      status: camera.status.toLowerCase(),
      capabilities: camera.capabilities ? JSON.parse(camera.capabilities) : null,
      position: camera.position ? JSON.parse(camera.position) : null
    }))

    res.json(transformedCameras)
  } catch (error) {
    console.error('Get cameras error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch cameras',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /cameras/:cameraId
router.get('/:cameraId', async (req, res) => {
  try {
    const { cameraId } = req.params

    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    })

    if (!camera) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${cameraId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      id: camera.id,
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      status: camera.status.toLowerCase(),
      capabilities: camera.capabilities ? JSON.parse(camera.capabilities) : null,
      position: camera.position ? JSON.parse(camera.position) : null
    })
  } catch (error) {
    console.error('Get camera error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch camera',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /cameras/:cameraId/stream
router.post('/:cameraId/stream', async (req, res) => {
  try {
    const { cameraId } = req.params
    const { quality, protocol, analytics } = req.body

    // Verify camera exists
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    })

    if (!camera) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${cameraId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    // Create stream record
    const stream = await prisma.stream.create({
      data: {
        cameraId,
        sessionId: `session-${Date.now()}`,
        url: `${protocol}://localhost:8080/stream/${cameraId}`,
        protocol: protocol.toUpperCase(),
        quality: quality.toUpperCase(),
        analytics: analytics || false
      }
    })

    res.json({
      streamId: stream.id,
      url: stream.url,
      protocol: stream.protocol.toLowerCase(),
      sessionId: stream.sessionId
    })
  } catch (error) {
    console.error('Start stream error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start stream',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /cameras/:cameraId/ptz
router.post('/:cameraId/ptz', async (req, res) => {
  try {
    const { cameraId } = req.params
    const { action, value, speed, preset } = req.body

    // Verify camera exists and has PTZ capability
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    })

    if (!camera) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${cameraId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    const capabilities = camera.capabilities ? JSON.parse(camera.capabilities) : {}
    if (!capabilities?.ptz) {
      return res.status(400).json({
        error: 'PTZ_NOT_SUPPORTED',
        message: `Camera ${cameraId} does not support PTZ`,
        timestamp: new Date().toISOString()
      })
    }

    // Log PTZ command (in real system, would control camera)
    console.log(`📹 PTZ Command for ${cameraId}:`, { action, value, speed, preset })

    res.status(204).send()
  } catch (error) {
    console.error('PTZ control error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'PTZ control failed',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /cameras/:cameraId/snapshot
router.get('/:cameraId/snapshot', async (req, res) => {
  try {
    const { cameraId } = req.params

    // Verify camera exists
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId }
    })

    if (!camera) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${cameraId} not found`,
        timestamp: new Date().toISOString()
      })
    }

    // Return mock image data (1x1 pixel PNG)
    const mockImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCC, 0x84, 0x5D, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])

    res.set('Content-Type', 'image/png')
    res.set('Content-Length', mockImageData.length.toString())
    res.send(mockImageData)
  } catch (error) {
    console.error('Snapshot error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get snapshot',
      timestamp: new Date().toISOString()
    })
  }
})

export default router