import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { z } from 'zod'
import { processFrame } from './video-detector-simple.js'

const t = initTRPC.create()

// Camera configurations with real video files
const CAMERA_CONFIGS = {
  'camera-1': {
    name: 'Front Entrance',
    videoFile: 'entrance.mp4',
    location: 'Building A - Main Door',
  },
  'camera-2': {
    name: 'Back Yard',
    videoFile: 'backyard.mp4',
    location: 'Rear Perimeter',
  },
  'camera-3': {
    name: 'Parking Lot',
    videoFile: 'parking.mp4',
    location: 'North Parking Area',
  },
}

export const appRouter = t.router({
  // Camera stream subscription with REAL object detection
  streamCamera: t.procedure
    .input(
      z.object({
        cameraId: z.string(),
        fps: z.number().min(1).max(30).optional().default(5),
      })
    )
    .subscription(({ input }) => {
      return observable<{
        cameraId: string
        timestamp: string
        frame: string
        metadata: {
          fps: number
          resolution: string
          bitrate: string
          codec: string
          detections: number
        }
        detectedObjects: Array<{
          class: string
          confidence: number
          bbox: [number, number, number, number]
        }>
      }>((emit) => {
        const frameInterval = 1000 / input.fps
        let frameCount = 0

        const config = CAMERA_CONFIGS[input.cameraId as keyof typeof CAMERA_CONFIGS]
        if (!config) {
          emit.error(new Error(`Camera ${input.cameraId} not found`))
          return
        }

        console.log(`📹 Starting REAL detection stream for ${config.name} at ${input.fps} FPS`)

        const timer = setInterval(async () => {
          try {
            frameCount++

            // Process frame with REAL TensorFlow object detection
            const result = await processFrame(input.cameraId, config.videoFile)

            const detectedObjects = result.detections.map((d) => ({
              class: d.class,
              confidence: d.score,
              bbox: d.bbox,
            }))

            emit.next({
              cameraId: input.cameraId,
              timestamp: new Date().toISOString(),
              frame: result.frame,
              metadata: {
                fps: input.fps,
                resolution: '640x480',
                bitrate: '2.5 Mbps',
                codec: 'H.264',
                detections: result.detections.length,
              },
              detectedObjects,
            })
          } catch (error) {
            console.error('Frame processing error:', error)
            emit.error(error as Error)
          }
        }, frameInterval)

        // Cleanup function
        return () => {
          clearInterval(timer)
          console.log(`🛑 Stopped stream for ${config.name} (${frameCount} frames sent)`)
        }
      })
    }),

  // Get available cameras
  getCameras: t.procedure.query(async () => {
    return Object.entries(CAMERA_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
      status: 'online' as const,
      location: config.location,
    }))
  }),
})

export type AppRouter = typeof appRouter
