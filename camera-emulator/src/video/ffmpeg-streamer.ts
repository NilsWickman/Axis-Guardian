/**
 * FFmpeg RTP Streamer
 * Spawns FFmpeg to stream MP4 files via RTP to mediasoup
 */

import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { ffmpegConfig } from '../config.js'

// RTP clock rate for video (H.264 standard)
const RTP_CLOCK_RATE = 90000

export interface FFmpegStreamerEvents {
  frame: (frameNumber: number, videoTimeMs: number, rtpTimestamp: number) => void
  loop: (loopCount: number) => void
  error: (error: Error) => void
  exit: (code: number | null) => void
}

const MAX_RESTART_ATTEMPTS = 3
const BASE_RESTART_DELAY_MS = 1000

export interface FFmpegStreamerOptions {
  fps?: number
  total_frames?: number
  duration?: number
  /** Shared start time across all cameras for synchronization */
  sharedStartTime?: number
  /** Callback when this camera requests a sync reset (e.g., on loop) */
  onSyncReset?: () => void
  /** Unique SSRC for this camera (derived from port to ensure uniqueness) */
  ssrc?: number
}

export class FFmpegStreamer extends EventEmitter {
  private ffmpeg: ChildProcess | null = null
  private frameCount = 0
  private loopCount = 0
  private totalFrames = 0
  private fps = 30
  private streamStartTime = 0  // When streaming started (ms)
  private videoDurationMs = 0  // Total video duration (ms)
  private restartAttempts = 0
  private stopped = false  // Flag to prevent restart after intentional stop
  private sharedStartTime?: number  // Shared start time for multi-camera sync
  private onSyncReset?: () => void  // Callback for coordinated loop reset
  private ssrc: number  // Unique SSRC for RTP stream

  constructor(
    private videoPath: string,
    private rtpPort: number,
    options?: FFmpegStreamerOptions
  ) {
    super()
    this.fps = options?.fps ?? 30
    this.totalFrames = options?.total_frames ?? 0
    this.videoDurationMs = (options?.duration ?? (this.totalFrames / this.fps)) * 1000
    this.sharedStartTime = options?.sharedStartTime
    this.onSyncReset = options?.onSyncReset
    // Use provided SSRC or generate from port (ensures uniqueness across cameras)
    this.ssrc = options?.ssrc ?? (12345678 + rtpPort)
  }

  start(): void {
    if (this.ffmpeg) {
      console.warn('FFmpeg already running')
      return
    }

    this.stopped = false
    console.log(`Starting FFmpeg streamer for ${this.videoPath}`)
    console.log(`  RTP target: rtp://127.0.0.1:${this.rtpPort}`)

    // FFmpeg command to stream H.264 via RTP
    // -re: real-time rate
    // -stream_loop -1: loop forever
    // -c:v libx264: re-encode to ensure frequent keyframes
    // -preset ultrafast: minimize encoding latency
    // -tune zerolatency: optimize for streaming
    // -g 30: keyframe every 30 frames (~1 second) for quick browser decode start
    // -profile:v baseline: widely compatible profile
    // -an: no audio
    // -f rtp: RTP output format
    // -ssrc: fixed SSRC to match mediasoup producer
    this.ffmpeg = spawn('ffmpeg', [
      '-re',
      '-stream_loop', '-1',
      '-i', this.videoPath,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-profile:v', 'baseline',
      '-g', '30',
      '-keyint_min', '30',
      '-sc_threshold', '0',
      '-b:v', '2M',
      '-maxrate', '2M',
      '-bufsize', '1M',
      '-f', 'rtp',
      '-payload_type', String(ffmpegConfig.payloadType),
      '-ssrc', String(this.ssrc),
      `rtp://127.0.0.1:${this.rtpPort}?pkt_size=1200`,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Record stream start time - use shared time if available for multi-camera sync
    this.streamStartTime = this.sharedStartTime ?? Date.now()

    // Parse FFmpeg stderr for frame progress
    // Track the last parsed output time for RTP timestamp calculation
    let lastOutputTimeSeconds = 0

    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      const line = data.toString()

      // Parse output time: "time=00:00:04.10" -> 4.10 seconds
      // This is FFmpeg's actual presentation timestamp which matches browser's currentTime
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.?\d*)/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10)
        const seconds = parseFloat(timeMatch[3])
        lastOutputTimeSeconds = hours * 3600 + minutes * 60 + seconds
      }

      // Parse frame number: "frame=  123 fps=..."
      const frameMatch = line.match(/frame=\s*(\d+)/)
      if (frameMatch) {
        const newFrame = parseInt(frameMatch[1], 10)

        // Reset restart attempts on successful frame processing
        if (this.restartAttempts > 0) {
          console.log('FFmpeg streaming successfully, resetting restart counter')
          this.restartAttempts = 0
        }

        // Detect loop (frame number reset or big jump)
        if (this.totalFrames > 0 && newFrame < this.frameCount && this.frameCount > this.totalFrames * 0.9) {
          this.loopCount++
          // If we have a sync callback, let the coordinator handle the reset
          // Otherwise reset our own start time
          if (this.onSyncReset) {
            this.onSyncReset()
          } else {
            this.streamStartTime = Date.now()
          }
          this.emit('loop', this.loopCount)
          console.log(`FFmpeg loop ${this.loopCount}`)
        }

        this.frameCount = newFrame

        // Calculate video presentation time (position within current loop)
        // FFmpeg frame counter is cumulative across loops, so we need to wrap it
        const frameInLoop = this.totalFrames > 0
          ? this.frameCount % this.totalFrames
          : this.frameCount
        const videoTimeMs = (frameInLoop / this.fps) * 1000

        // Calculate RTP timestamp from FFmpeg's actual output time
        // This ensures detection timestamps match the video's actual presentation time
        const rtpTimestamp = Math.round(lastOutputTimeSeconds * RTP_CLOCK_RATE)

        this.emit('frame', this.frameCount, videoTimeMs, rtpTimestamp)
      }
    })

    this.ffmpeg.on('error', (error) => {
      console.error('FFmpeg error:', error)
      this.emit('error', error)
    })

    this.ffmpeg.on('exit', (code) => {
      console.log(`FFmpeg exited with code ${code}`)
      this.ffmpeg = null
      this.emit('exit', code)

      // Don't restart if intentionally stopped
      if (this.stopped) {
        return
      }

      // Auto-restart on unexpected exit with limited retries
      if (code !== 0 && code !== null) {
        this.restartAttempts++

        if (this.restartAttempts > MAX_RESTART_ATTEMPTS) {
          console.error(`FFmpeg failed ${MAX_RESTART_ATTEMPTS} times, giving up.`)
          console.error(`  Video file: ${this.videoPath}`)
          console.error('  Check that the video file exists and is readable.')
          this.emit('error', new Error(`FFmpeg failed after ${MAX_RESTART_ATTEMPTS} restart attempts`))
          return
        }

        const delay = BASE_RESTART_DELAY_MS * this.restartAttempts
        console.log(`Restarting FFmpeg in ${delay}ms (attempt ${this.restartAttempts}/${MAX_RESTART_ATTEMPTS})...`)
        setTimeout(() => this.start(), delay)
      }
    })

    console.log(`FFmpeg started (pid: ${this.ffmpeg.pid})`)
  }

  stop(): void {
    this.stopped = true
    if (this.ffmpeg) {
      this.ffmpeg.kill('SIGTERM')
      this.ffmpeg = null
    }
  }

  getCurrentFrame(): number {
    return this.frameCount
  }

  getLoopCount(): number {
    return this.loopCount
  }

  /**
   * Get current video presentation time in milliseconds
   * This is the position within the video (resets on loop)
   */
  getVideoTimeMs(): number {
    return (this.frameCount / this.fps) * 1000
  }

  getFps(): number {
    return this.fps
  }

  isRunning(): boolean {
    return this.ffmpeg !== null
  }

  /**
   * Reset the stream start time (called by sync coordinator on loop)
   */
  resetStartTime(newStartTime: number): void {
    this.streamStartTime = newStartTime
  }

  /**
   * Set the shared start time (for late initialization)
   */
  setSharedStartTime(time: number): void {
    this.sharedStartTime = time
  }
}
