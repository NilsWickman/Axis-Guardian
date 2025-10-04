import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs-node'
import { createCanvas, loadImage, Image } from 'canvas'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

ffmpeg.setFfmpegPath(ffmpegPath)

// Global model instance
let model: cocoSsd.ObjectDetection | null = null

// Load the COCO-SSD model
async function loadModel() {
  if (!model) {
    console.log('🤖 Loading TensorFlow COCO-SSD model...')
    model = await cocoSsd.load()
    console.log('✅ Model loaded successfully')
  }
  return model
}

// Preload model on startup
loadModel()

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

class VideoStreamProcessor {
  private videoPath: string
  private currentFrame: number = 0
  private frameCache: Map<number, Buffer> = new Map()
  private totalFrames: number = 0
  private fps: number = 30
  private isInitialized: boolean = false

  constructor(videoPath: string) {
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
          console.log(`📹 Video initialized: ${this.totalFrames} frames at ${this.fps} fps`)
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
    const detectionModel = await loadModel()

    // Load image for detection
    const img = await loadImage(frameBuffer)

    // Convert to tensor for TensorFlow
    const canvas = createCanvas(640, 480)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, 640, 480)

    // Run object detection
    const tensor = tf.browser.fromPixels(canvas as any)
    const predictions = await detectionModel.detect(tensor as any)
    tensor.dispose()

    // Draw detections on canvas
    const detections: Detection[] = []

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox

      // Draw bounding box
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      // Draw label background
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
      const labelText = `${prediction.class} ${(prediction.score * 100).toFixed(1)}%`
      ctx.font = 'bold 14px Arial'
      const textWidth = ctx.measureText(labelText).width
      ctx.fillRect(x, y - 25, textWidth + 10, 25)

      // Draw label text
      ctx.fillStyle = '#000000'
      ctx.fillText(labelText, x + 5, y - 7)

      detections.push({
        bbox: [x, y, width, height],
        class: prediction.class,
        score: prediction.score,
      })
    })

    // Add timestamp overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, 640, 35)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText(new Date().toLocaleString(), 10, 22)

    // Add detection count
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 450, 200, 30)
    ctx.fillStyle = '#00ff00'
    ctx.font = '12px monospace'
    ctx.fillText(`Detections: ${detections.length}`, 10, 470)

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

    const processor = new VideoStreamProcessor(videoPath)
    await processor.initialize()
    processors.set(cameraId, processor)
  }

  return processors.get(cameraId)!
}

export async function processFrame(cameraId: string, videoFile: string): Promise<VideoFrame> {
  const processor = await getVideoProcessor(cameraId, videoFile)
  return await processor.processFrameWithDetection()
}
