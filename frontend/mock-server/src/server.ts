import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import authRoutes from './routes/auth.js'
import cameraRoutes from './routes/cameras.js'
import detectionRoutes from './routes/detections.js'
import alarmRoutes from './routes/alarms.js'

const app = express()
const port = 8000
const prisma = new PrismaClient()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/cameras', cameraRoutes)
app.use('/detections', detectionRoutes)
app.use('/alarms', alarmRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`🚀 AXIS Mock Server running on http://localhost:${port}`)
})

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  console.log('📡 WebSocket client connected')

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to AXIS Mock Server',
    timestamp: new Date().toISOString()
  }))

  // Handle client messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 Received:', message)

      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        payload: message,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('❌ WebSocket message error:', error)
    }
  })

  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected')
  })
})

// Simulate real-time detection events
setInterval(() => {
  if (wss.clients.size > 0) {
    const mockDetection = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      cameraId: 'camera-' + Math.floor(Math.random() * 3 + 1),
      type: ['person', 'vehicle', 'animal'][Math.floor(Math.random() * 3)],
      confidence: 0.6 + Math.random() * 0.4, // 0.6 to 1.0
      bbox: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: 50 + Math.random() * 200,
        height: 50 + Math.random() * 200
      },
      attributes: {
        color: ['red', 'blue', 'green', 'black', 'white'][Math.floor(Math.random() * 5)],
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
      }
    }

    // Broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'detection',
          payload: mockDetection,
          timestamp: new Date().toISOString()
        }))
      }
    })
  }
}, 5000) // Every 5 seconds

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

export { prisma, wss }