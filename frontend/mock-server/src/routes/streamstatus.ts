import express, { Request, Response } from 'express'

const router = express.Router()

// Mock active streams tracking
const activeStreams: Map<string, any> = new Map()

// Helper to generate mock stream data
function generateStreamData(streamId: string, camera: string) {
  const now = Date.now()
  const startTime = now - Math.random() * 3600000 // Random start within last hour

  return {
    streamId,
    camera,
    protocol: Math.random() > 0.5 ? 'http' : 'rtsp',
    format: Math.random() > 0.5 ? 'h264' : 'mjpeg',
    resolution: ['1920x1080', '1280x720', '640x480'][Math.floor(Math.random() * 3)],
    fps: [30, 25, 15][Math.floor(Math.random() * 3)],
    bitrate: Math.floor(2000 + Math.random() * 6000), // 2-8 Mbps
    clients: Math.floor(1 + Math.random() * 5),
    startTime: new Date(startTime).toISOString(),
    duration: Math.floor((now - startTime) / 1000), // seconds
    bytesTransferred: Math.floor(Math.random() * 1000000000), // bytes
    state: 'active'
  }
}

// Initialize some mock streams
activeStreams.set('stream-1', generateStreamData('stream-1', '1'))
activeStreams.set('stream-2', generateStreamData('stream-2', '1'))
activeStreams.set('stream-3', generateStreamData('stream-3', '2'))

// GET /axis-cgi/streamstatus.cgi - Stream Status API
router.get('/streamstatus.cgi', (req: Request, res: Response) => {
  try {
    const { action, camera } = req.query

    switch (action) {
      case 'list': {
        // Filter by camera if specified
        let streams = Array.from(activeStreams.values())

        if (camera) {
          streams = streams.filter(s => s.camera === camera)
        }

        // Format as plain text response (VAPIX style)
        const lines = streams.map(s => {
          return [
            `streamid=${s.streamId}`,
            `camera=${s.camera}`,
            `protocol=${s.protocol}`,
            `format=${s.format}`,
            `resolution=${s.resolution}`,
            `fps=${s.fps}`,
            `bitrate=${s.bitrate}`,
            `clients=${s.clients}`,
            `starttime=${s.startTime}`,
            `duration=${s.duration}`,
            `bytes=${s.bytesTransferred}`,
            `state=${s.state}`
          ].join(' ')
        })

        res.set('Content-Type', 'text/plain')
        res.send(lines.join('\n') + '\n')
        break
      }

      case 'status': {
        const streamId = req.query.streamid as string

        if (!streamId || !activeStreams.has(streamId)) {
          return res.status(404).send('# Error: Stream not found\n')
        }

        const stream = activeStreams.get(streamId)!

        // Update duration and bytes
        const now = Date.now()
        const startTime = new Date(stream.startTime).getTime()
        stream.duration = Math.floor((now - startTime) / 1000)
        stream.bytesTransferred += Math.floor(Math.random() * 1000000)

        const response = [
          `streamid=${stream.streamId}`,
          `camera=${stream.camera}`,
          `protocol=${stream.protocol}`,
          `format=${stream.format}`,
          `resolution=${stream.resolution}`,
          `fps=${stream.fps}`,
          `bitrate=${stream.bitrate}`,
          `clients=${stream.clients}`,
          `starttime=${stream.startTime}`,
          `duration=${stream.duration}`,
          `bytes=${stream.bytesTransferred}`,
          `state=${stream.state}`
        ].join('\n')

        res.set('Content-Type', 'text/plain')
        res.send(response + '\n')
        break
      }

      case 'summary': {
        const totalStreams = activeStreams.size
        const totalClients = Array.from(activeStreams.values()).reduce(
          (sum, s) => sum + s.clients,
          0
        )
        const totalBitrate = Array.from(activeStreams.values()).reduce(
          (sum, s) => sum + s.bitrate,
          0
        )

        const response = [
          `total_streams=${totalStreams}`,
          `total_clients=${totalClients}`,
          `total_bitrate=${totalBitrate}`,
          `server_load=${Math.floor(Math.random() * 60 + 20)}` // 20-80%
        ].join('\n')

        res.set('Content-Type', 'text/plain')
        res.send(response + '\n')
        break
      }

      case 'start': {
        const camera = req.query.camera as string || '1'
        const streamId = `stream-${Date.now()}`

        const newStream = generateStreamData(streamId, camera)
        newStream.startTime = new Date().toISOString()
        newStream.duration = 0
        newStream.bytesTransferred = 0

        activeStreams.set(streamId, newStream)

        res.set('Content-Type', 'text/plain')
        res.send(`streamid=${streamId}\n`)
        break
      }

      case 'stop': {
        const streamId = req.query.streamid as string

        if (!streamId || !activeStreams.has(streamId)) {
          return res.status(404).send('# Error: Stream not found\n')
        }

        activeStreams.delete(streamId)

        res.set('Content-Type', 'text/plain')
        res.send('OK\n')
        break
      }

      default:
        res.status(400).send('# Error: Invalid action. Use: list, status, summary, start, stop\n')
    }
  } catch (error) {
    console.error('Stream status error:', error)
    res.status(500).send('# Error: Internal server error\n')
  }
})

// POST /axis-cgi/streamstatus.cgi - JSON-RPC style API
router.post('/streamstatus.cgi', (req: Request, res: Response) => {
  try {
    const { method, params, context, apiVersion = '1.0' } = req.body

    switch (method) {
      case 'getSupportedVersions': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            apiVersions: ['1.0']
          }
        })
        break
      }

      case 'getActiveStreams': {
        const camera = params?.camera
        let streams = Array.from(activeStreams.values())

        if (camera) {
          streams = streams.filter(s => s.camera === camera)
        }

        res.json({
          apiVersion,
          context: context || '',
          data: {
            streams
          }
        })
        break
      }

      case 'getStreamStatus': {
        const streamId = params?.streamId

        if (!streamId || !activeStreams.has(streamId)) {
          return res.status(400).json({
            apiVersion,
            context: context || '',
            error: {
              code: 1001,
              message: 'Stream not found'
            }
          })
        }

        const stream = activeStreams.get(streamId)!

        // Update duration
        const now = Date.now()
        const startTime = new Date(stream.startTime).getTime()
        stream.duration = Math.floor((now - startTime) / 1000)

        res.json({
          apiVersion,
          context: context || '',
          data: {
            stream
          }
        })
        break
      }

      case 'getSummary': {
        const totalStreams = activeStreams.size
        const totalClients = Array.from(activeStreams.values()).reduce(
          (sum, s) => sum + s.clients,
          0
        )
        const totalBitrate = Array.from(activeStreams.values()).reduce(
          (sum, s) => sum + s.bitrate,
          0
        )

        res.json({
          apiVersion,
          context: context || '',
          data: {
            totalStreams,
            totalClients,
            totalBitrate,
            serverLoad: Math.floor(Math.random() * 60 + 20) // 20-80%
          }
        })
        break
      }

      default:
        res.status(400).json({
          apiVersion,
          context: context || '',
          error: {
            code: 1000,
            message: `Unknown method: ${method}`
          }
        })
    }
  } catch (error) {
    console.error('Stream status API error:', error)
    res.status(500).json({
      apiVersion: '1.0',
      context: '',
      error: {
        code: 2000,
        message: 'Internal server error'
      }
    })
  }
})

export default router
