import express, { Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Create separate router for public endpoints (no auth)
const publicRouter = express.Router()

// Path to video files
const VIDEOS_DIR = path.join(__dirname, '../../videos')

// Dynamically discover available video files
function getAvailableVideos(): Map<string, string> {
  const videoMap = new Map<string, string>()

  try {
    const files = fs.readdirSync(VIDEOS_DIR)
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.webm']

    let cameraIndex = 1
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase()
      if (videoExtensions.includes(ext)) {
        videoMap.set(cameraIndex.toString(), file)
        cameraIndex++
      }
    })
  } catch (error) {
    console.error('Error reading videos directory:', error)
  }

  return videoMap
}

// Get list of cameras based on available videos (PUBLIC - no auth required)
publicRouter.get('/cameras/list', (req: Request, res: Response) => {
  try {
    const videoMap = getAvailableVideos()
    const cameras = []

    for (const [id, filename] of videoMap.entries()) {
      const nameWithoutExt = path.basename(filename, path.extname(filename))
      // Convert filename to friendly name (e.g., "low_old" -> "Low Old")
      const friendlyName = nameWithoutExt
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      cameras.push({
        id: `cam-${id.padStart(2, '0')}`,
        name: friendlyName,
        // For frontend compatibility, rtspUrl points to HTTP stream (not real RTSP)
        rtspUrl: `http://localhost:8000/axis-cgi/media.cgi?camera=${id}`,
        streamUrl: `http://localhost:8000/axis-cgi/media.cgi?camera=${id}`,
        mjpegUrl: `http://localhost:8000/axis-cgi/mjpg/video.cgi?camera=${id}`,
        snapshotUrl: `http://localhost:8000/axis-cgi/jpg/image.cgi?camera=${id}`,
        // Real RTSP will be added later for device-layer simulation
        // rtspUrl: `rtsp://localhost:8554/axis-media/media.amp?camera=${id}`,
        status: 'online',
        capabilities: {
          ptz: false,
          audio: false,
          analytics: true,
          http: true,
          mjpeg: true,
          rtsp: false, // Planned for future
          resolution: '1920x1080',
          fps: 30
        }
      })
    }

    res.json(cameras)
  } catch (error) {
    console.error('Error listing cameras:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to list cameras'
    })
  }
})

// GET /axis-cgi/media.cgi - Stream video in MP4/MKV container (PUBLIC for demo)
publicRouter.get('/media.cgi', (req: Request, res: Response) => {
  try {
    const {
      container = 'mp4',
      videocodec = 'h264',
      camera = '1'
    } = req.query

    // Get dynamic video mapping
    const videoMap = getAvailableVideos()
    const videoFile = videoMap.get(camera as string)

    if (!videoFile) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${camera} not found`
      })
    }

    const videoPath = path.join(VIDEOS_DIR, videoFile)

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        error: 'VIDEO_NOT_FOUND',
        message: `Video file not found for camera ${camera}`
      })
    }

    const stat = fs.statSync(videoPath)
    const fileSize = stat.size
    const range = req.headers.range

    if (range) {
      // Handle range requests for seeking
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const file = fs.createReadStream(videoPath, { start, end })

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': container === 'mp4' ? 'video/mp4' : 'video/x-matroska'
      }

      res.writeHead(206, head)
      file.pipe(res)
    } else {
      // Stream entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': container === 'mp4' ? 'video/mp4' : 'video/x-matroska',
        'Accept-Ranges': 'bytes'
      }

      res.writeHead(200, head)
      fs.createReadStream(videoPath).pipe(res)
    }
  } catch (error) {
    console.error('Media stream error:', error)
    res.status(500).json({
      error: 'STREAM_ERROR',
      message: 'Failed to stream media'
    })
  }
})

// GET /axis-cgi/mjpg/video.cgi - MJPEG stream (PUBLIC for demo)
publicRouter.get('/mjpg/video.cgi', (req: Request, res: Response) => {
  try {
    const { camera = '1', resolution = '640x480', fps = '15' } = req.query

    // Get dynamic video mapping
    const videoMap = getAvailableVideos()
    const videoFile = videoMap.get(camera as string)

    if (!videoFile) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${camera} not found`
      })
    }

    const videoPath = path.join(VIDEOS_DIR, videoFile)

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        error: 'VIDEO_NOT_FOUND',
        message: `Video file not found for camera ${camera}`
      })
    }

    // Set headers for MJPEG stream
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    // Use ffmpeg to extract frames and send as MJPEG
    const command = ffmpeg(videoPath)
      .inputOptions('-re') // Real-time mode
      .inputOptions('-stream_loop -1') // Loop video infinitely
      .size(resolution as string)
      .fps(parseInt(fps as string))
      .format('image2pipe')
      .outputOptions('-vcodec mjpeg')
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        if (!res.headersSent) {
          res.status(500).end()
        }
      })

    const stream = command.pipe()

    let frameBuffer = Buffer.alloc(0)

    stream.on('data', (chunk: Buffer) => {
      frameBuffer = Buffer.concat([frameBuffer, chunk])

      // Look for JPEG end marker (FFD9)
      const endMarkerIndex = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9]))

      if (endMarkerIndex !== -1) {
        // Extract complete JPEG frame
        const frame = frameBuffer.slice(0, endMarkerIndex + 2)
        frameBuffer = frameBuffer.slice(endMarkerIndex + 2)

        // Send frame with boundary
        res.write('--myboundary\r\n')
        res.write('Content-Type: image/jpeg\r\n')
        res.write(`Content-Length: ${frame.length}\r\n\r\n`)
        res.write(frame)
        res.write('\r\n')
      }
    })

    // Handle client disconnect
    req.on('close', () => {
      command.kill('SIGKILL')
      stream.destroy()
    })
  } catch (error) {
    console.error('MJPEG stream error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        error: 'STREAM_ERROR',
        message: 'Failed to stream MJPEG'
      })
    }
  }
})

// GET /axis-cgi/jpg/image.cgi - JPEG snapshot (PUBLIC for demo)
publicRouter.get('/jpg/image.cgi', async (req: Request, res: Response) => {
  try {
    const {
      camera = '1',
      resolution = '1920x1080',
      compression = '50'
    } = req.query

    // Get dynamic video mapping
    const videoMap = getAvailableVideos()
    const videoFile = videoMap.get(camera as string)

    if (!videoFile) {
      return res.status(404).json({
        error: 'CAMERA_NOT_FOUND',
        message: `Camera ${camera} not found`
      })
    }

    const videoPath = path.join(VIDEOS_DIR, videoFile)

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        error: 'VIDEO_NOT_FOUND',
        message: `Video file not found for camera ${camera}`
      })
    }

    // Extract a single frame at random timestamp to simulate live camera
    const randomTime = Math.random() * 10 // Random time within first 10 seconds

    const frames: Buffer[] = []

    ffmpeg(videoPath)
      .seekInput(randomTime)
      .frames(1)
      .size(resolution as string)
      .format('image2pipe')
      .outputOptions('-vcodec mjpeg')
      .outputOptions(`-q:v ${Math.floor((100 - parseInt(compression as string)) / 3)}`) // Convert compression to quality
      .on('error', (err) => {
        console.error('Snapshot error:', err)
        res.status(500).json({
          error: 'SNAPSHOT_ERROR',
          message: 'Failed to capture snapshot'
        })
      })
      .on('end', () => {
        if (frames.length > 0) {
          res.set('Content-Type', 'image/jpeg')
          res.set('Content-Length', frames[0].length.toString())
          res.send(frames[0])
        } else {
          res.status(500).json({
            error: 'SNAPSHOT_ERROR',
            message: 'No frame captured'
          })
        }
      })
      .pipe()
      .on('data', (chunk: Buffer) => {
        frames.push(chunk)
      })
  } catch (error) {
    console.error('Snapshot error:', error)
    res.status(500).json({
      error: 'SNAPSHOT_ERROR',
      message: 'Failed to capture snapshot'
    })
  }
})

// Export both routers
export default router
export { publicRouter }
