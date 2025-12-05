/**
 * FFmpeg RTP Streamer
 * Spawns FFmpeg to stream MP4 files via RTP to mediasoup
 */

import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { ffmpegConfig } from '../config.js'

export interface FFmpegStreamerEvents {
  frame: (frameNumber: number) => void
  loop: (loopCount: number) => void
  error: (error: Error) => void
  exit: (code: number | null) => void
}

export class FFmpegStreamer extends EventEmitter {
  private ffmpeg: ChildProcess | null = null
  private frameCount = 0
  private loopCount = 0
  private totalFrames = 0
  private fps = 30

  constructor(
    private videoPath: string,
    private rtpPort: number,
    videoInfo?: { fps?: number; total_frames?: number }
  ) {
    super()
    this.fps = videoInfo?.fps ?? 30
    this.totalFrames = videoInfo?.total_frames ?? 0
  }

  start(): void {
    if (this.ffmpeg) {
      console.warn('FFmpeg already running')
      return
    }

    console.log(`Starting FFmpeg streamer for ${this.videoPath}`)
    console.log(`  RTP target: rtp://127.0.0.1:${this.rtpPort}`)

    // FFmpeg command to stream H.264 via RTP
    // -re: real-time rate
    // -stream_loop -1: loop forever
    // -c:v copy: passthrough (no re-encoding)
    // -bsf:v h264_mp4toannexb: convert from AVCC to Annex B format for RTP
    // -an: no audio
    // -f rtp: RTP output format
    // -ssrc: fixed SSRC to match mediasoup producer
    this.ffmpeg = spawn('ffmpeg', [
      '-re',
      '-stream_loop', '-1',
      '-i', this.videoPath,
      '-an',
      '-c:v', 'copy',
      '-bsf:v', 'h264_mp4toannexb',
      '-f', 'rtp',
      '-payload_type', String(ffmpegConfig.payloadType),
      '-ssrc', '12345678',
      `rtp://127.0.0.1:${this.rtpPort}?pkt_size=1200`,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Parse FFmpeg stderr for frame progress
    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      const line = data.toString()

      // Parse frame number: "frame=  123 fps=..."
      const frameMatch = line.match(/frame=\s*(\d+)/)
      if (frameMatch) {
        const newFrame = parseInt(frameMatch[1], 10)

        // Detect loop (frame number reset or big jump)
        if (this.totalFrames > 0 && newFrame < this.frameCount && this.frameCount > this.totalFrames * 0.9) {
          this.loopCount++
          this.emit('loop', this.loopCount)
          console.log(`FFmpeg loop ${this.loopCount}`)
        }

        this.frameCount = newFrame
        this.emit('frame', this.frameCount)
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

      // Auto-restart on unexpected exit
      if (code !== 0 && code !== null) {
        console.log('Restarting FFmpeg in 1 second...')
        setTimeout(() => this.start(), 1000)
      }
    })

    console.log(`FFmpeg started (pid: ${this.ffmpeg.pid})`)
  }

  stop(): void {
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

  isRunning(): boolean {
    return this.ffmpeg !== null
  }
}
