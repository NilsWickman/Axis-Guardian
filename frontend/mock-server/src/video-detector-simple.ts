import { createCanvas, loadImage } from 'canvas'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

export interface Detection {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  score: number
}

export interface VideoFrame {
  frame: string // base64 image
  detections: Detection[]
  timestamp: number
}

// Simulated detection patterns for each camera
const DETECTION_PATTERNS = {
  'camera-1': [
    // Front Entrance - typically people and occasional vehicles
    { classes: ['person', 'person', 'car'], basePositions: [[100, 200], [300, 180], [450, 250]] },
  ],
  'camera-2': [
    // Back Yard - animals, people
    { classes: ['person', 'dog', 'bird'], basePositions: [[200, 250], [400, 280], [100, 150]] },
  ],
  'camera-3': [
    // Parking Lot - mostly vehicles and people
    { classes: ['car', 'car', 'person', 'truck'], basePositions: [[80, 180], [320, 200], [500, 220], [150, 300]] },
  ],
}

class VideoStreamProcessor {
  private videoPath: string
  private cameraId: string
  private currentFrame: number = 0
  private frameCache: Map<number, Buffer> = new Map()
  private totalFrames: number = 0
  private fps: number = 30
  private isInitialized: boolean = false

  constructor(cameraId: string, videoPath: string) {
    this.cameraId = cameraId
    this.videoPath = videoPath
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Get video metadata
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.videoPath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video')
        if (videoStream) {
          this.fps = eval(videoStream.r_frame_rate || '30/1') // e.g., "30/1" -> 30
          this.totalFrames = parseInt(videoStream.nb_frames || '300')
          console.log(`📹 Video initialized for ${this.cameraId}: ${this.totalFrames} frames at ${this.fps} fps`)
        }

        this.isInitialized = true
        resolve()
      })
    })
  }

  async getNextFrame(): Promise<Buffer> {
    await this.initialize()

    // Loop video
    if (this.currentFrame >= this.totalFrames || this.currentFrame > 100) {
      this.currentFrame = 0
    }

    const frameTime = this.currentFrame / this.fps
    const frameBuffer = await this.extractFrame(frameTime)

    this.currentFrame++
    return frameBuffer
  }

  private async extractFrame(timeInSeconds: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []

      ffmpeg(this.videoPath)
        .seekInput(timeInSeconds)
        .frames(1)
        .size('640x480')
        .format('image2')
        .outputOptions(['-c:v', 'png'])
        .on('error', (err) => {
          reject(err)
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
    })
  }

  async processFrameWithDetection(): Promise<VideoFrame> {
    const frameBuffer = await this.getNextFrame()

    // Load image
    const img = await loadImage(frameBuffer)

    // Create canvas
    const canvas = createCanvas(640, 480)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, 640, 480)

    // Get detection pattern for this camera
    const pattern = DETECTION_PATTERNS[this.cameraId as keyof typeof DETECTION_PATTERNS]
    const detections: Detection[] = []

    if (pattern && pattern.length > 0) {
      const { classes, basePositions } = pattern[0]

      classes.forEach((className, index) => {
        if (index >= basePositions.length) return

        // Add motion simulation
        const frameOffset = this.currentFrame * 0.1
        const [baseX, baseY] = basePositions[index]
        const offsetX = Math.sin(frameOffset + index) * 20
        const offsetY = Math.cos(frameOffset * 0.8 + index) * 15

        const x = Math.max(0, Math.min(540, baseX + offsetX))
        const y = Math.max(30, Math.min(350, baseY + offsetY))
        const width = 80 + Math.random() * 40
        const height = 100 + Math.random() * 50

        // Randomize confidence
        const confidence = 0.85 + Math.random() * 0.14

        // Draw bounding box
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, width, height)

        // Draw label background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
        const labelText = `${className} ${(confidence * 100).toFixed(1)}%`
        ctx.font = 'bold 14px Arial'
        const textWidth = ctx.measureText(labelText).width
        ctx.fillRect(x, y - 25, textWidth + 10, 25)

        // Draw label text
        ctx.fillStyle = '#000000'
        ctx.fillText(labelText, x + 5, y - 7)

        detections.push({
          bbox: [x, y, width, height],
          class: className,
          score: confidence,
        })
      })
    }

    // Add timestamp overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, 640, 35)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    const timestamp = new Date().toLocaleString()
    ctx.fillText(timestamp, 10, 22)

    // Add camera name
    ctx.fillText(this.cameraId, 450, 22)

    // Add detection count
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 450, 200, 30)
    ctx.fillStyle = '#00ff00'
    ctx.font = '12px monospace'
    ctx.fillText(`Detections: ${detections.length}`, 10, 470)
    ctx.fillText(`Frame: ${this.currentFrame}`, 10, 455)

    return {
      frame: canvas.toDataURL('image/jpeg', 0.85),
      detections,
      timestamp: Date.now(),
    }
  }
}

// Video stream processors for each camera
const processors: Map<string, VideoStreamProcessor> = new Map()

export async function getVideoProcessor(cameraId: string, videoFile: string): Promise<VideoStreamProcessor> {
  if (!processors.has(cameraId)) {
    const videoPath = join(__dirname, '..', 'videos', videoFile)

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`)
    }

    const processor = new VideoStreamProcessor(cameraId, videoPath)
    await processor.initialize()
    processors.set(cameraId, processor)
  }

  return processors.get(cameraId)!
}

export async function processFrame(cameraId: string, videoFile: string): Promise<VideoFrame> {
  const processor = await getVideoProcessor(cameraId, videoFile)
  return await processor.processFrameWithDetection()
}
